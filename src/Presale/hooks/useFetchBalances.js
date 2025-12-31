import { useEffect, useState, useContext, useRef } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "../../contract/contracts";
import ERC20ABI from "../../abi/erc20ABI.js";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import WalletContext from "../../context/WalletContext";

const useFetchBalances = (walletAddress, selectedToken) => {
  const [balances, setBalances] = useState({});
  const { ethBalance, nativeSymbol, walletType } = useContext(WalletContext);
  const lastEthBalanceRef = useRef(null);

  useEffect(() => {
    // 🟣 Robust Solana Balance Sync: If WalletContext already has the Solana balance, use it immediately
    const isSolana = (walletType === "SOLANA" || walletType === "Solana");
    if (isSolana && selectedToken === "SOL" && ethBalance && nativeSymbol === "SOL") {
      // Only update if ethBalance changed (avoid infinite loop)
      if (lastEthBalanceRef.current === ethBalance) {
        return;
      }
      
      lastEthBalanceRef.current = ethBalance;
      const parsedBalance = parseFloat(ethBalance);
      
      console.log("✅ [useFetchBalances] Syncing SOL balance from WalletContext:");
      console.log("   - Raw ethBalance:", ethBalance, typeof ethBalance);
      console.log("   - Parsed balance:", parsedBalance);
      console.log("   - Will set balances.SOL to:", parsedBalance);
      
      setBalances(prev => ({
        ...prev,
        SOL: parsedBalance
      }));
      return;
    }

    const fetchBalances = async () => {
      if (!walletAddress || !selectedToken) return;

      try {
        // 🌟 SOL Balance - Browser-friendly approach
        if (selectedToken === "SOL") {
          const solAddress = (walletAddress || "").toString().trim();
          if (!solAddress || solAddress.startsWith('0x')) {
            console.log("ℹ️ Skipping SOL balance fetch for non-Solana address");
            return;
          }

          try {
            console.log("👛 Fetching SOL balance for:", solAddress);
            
            // Multiple RPCs for redundancy
            const rpcs = [
              "https://solana-mainnet.rpc.extrnode.com",
              "https://api.mainnet-beta.solana.com",
              "https://rpc.ankr.com/solana"
            ];
            
            let success = false;
            for (const rpc of rpcs) {
              try {
                const response = await window.fetch(rpc, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    jsonrpc: "2.0", id: 1, method: "getBalance", params: [solAddress]
                  })
                });
                const data = await response.json();
                if (data.result && data.result.value !== undefined) {
                  const solBalance = data.result.value / 1e9;
                  console.log(`🟣 [SOL Balance via ${rpc}]:`, solBalance, "SOL");
                  setBalances(prev => ({ ...prev, [selectedToken]: solBalance }));
                  success = true;
                  break;
                }
              } catch (e) {}
            }
            if (!success) throw new Error("All Solana RPCs failed");
          } catch (httpErr) {
            console.warn("⚠️ Solana RPC failed:", httpErr.message);
          }
          return;
        }

        // 🟦 USDC-Solana Balance
        if (selectedToken === "USDC-Solana") {
          const solAddress = (walletAddress || "").toString().trim();
          if (!solAddress || solAddress.startsWith('0x')) return;

          try {
            const publicKey = new PublicKey(solAddress);
            const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
            
            // Get associated token account
            const tokenAccount = await getAssociatedTokenAddress(USDC_MINT, publicKey);
            
            // HTTP RPC call for token balance
            const response = await window.fetch("https://api.mainnet-beta.solana.com", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "getTokenAccountBalance",
                params: [tokenAccount.toBase58()]
              })
            });

            const data = await response.json();
            
            if (data.result && data.result.value) {
              const usdcBalance = parseFloat(data.result.value.uiAmount) || 0;
              console.log("🟦 [USDC-Solana Balance via HTTP RPC]:", usdcBalance, "USDC");
              
              setBalances(prev => ({
                ...prev,
                [selectedToken]: usdcBalance,
              }));
            }
          } catch (usdcErr) {
            console.warn("⚠️ USDC-Solana balance fetch failed:", usdcErr.message);
          }
          return;
        }

        // 🔗 ETH/BSC chains via Public RPC (avoid window.ethereum popup)
        const rpcUrl = "https://bsc-dataseed1.binance.org"; // BSC Mainnet
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

        if (selectedToken === "BNB") {
          // Native BNB balance
          const balance = await provider.getBalance(walletAddress);
          setBalances(prev => ({
            ...prev,
            [selectedToken]: parseFloat(ethers.utils.formatEther(balance)),
          }));
        } else if (selectedToken === "ETH") {
          // ETH on BSC is a wrapped token, not native
          const ETH_BSC_ADDRESS = "0x2170Ed0880ac9A755fd29B2688956BD959F933F8"; // Binance-Peg ETH on BSC Mainnet
          const tokenContract = new ethers.Contract(ETH_BSC_ADDRESS, ERC20ABI, provider);
          const balance = await tokenContract.balanceOf(walletAddress);
          setBalances(prev => ({
            ...prev,
            [selectedToken]: parseFloat(ethers.utils.formatUnits(balance, 18)), // ETH has 18 decimals
          }));
        } else {
          // fallback pe token ERC20 definit în CONTRACTS
          const contractConfig = Object.values(CONTRACTS).find(c => c.name.toUpperCase().includes(selectedToken));
          if (!contractConfig) return;

          const tokenContract = new ethers.Contract(contractConfig.address, ERC20ABI, provider);
          const decimals = contractConfig.decimals || 18;
          const balance = await tokenContract.balanceOf(walletAddress);
          setBalances(prev => ({
            ...prev,
            [selectedToken]: parseFloat(ethers.utils.formatUnits(balance, decimals)),
          }));
        }
      } catch (err) {
        console.error(`❌ Failed to fetch balance for ${selectedToken}:`, err);
      }
    };

    fetchBalances();
  }, [walletAddress, selectedToken, ethBalance, nativeSymbol, walletType]);

  return balances;
};

export default useFetchBalances;


