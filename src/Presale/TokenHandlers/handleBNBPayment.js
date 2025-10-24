import { ethers } from "ethers";
import axios from "axios";
import { CONTRACTS } from "../../contract/contracts";

const API_ENDPOINT = (process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com") + "/transactions";
const TG_WEBHOOK_URL = process.env.REACT_APP_TG_WEBHOOK_URL || ""; // Optional: set in .env
const TG_WEBHOOK_SECRET = process.env.REACT_APP_TG_WEBHOOK_SECRET || ""; // Optional: if webhook enforces secret

async function notifyTelegram(payload) {
  if (!TG_WEBHOOK_URL) return;
  try {
    const headers = TG_WEBHOOK_SECRET ? { 'x-webhook-secret': TG_WEBHOOK_SECRET } : undefined;
    await axios.post(TG_WEBHOOK_URL, payload, { timeout: 8000, headers });
  } catch (_) {
    // Silent fail – never blochează fluxul de plată
  }
}

const handleBNBPayment = async ({
  amount,
  bitsToReceive,
  walletAddress,
  selectedChain,
  usdInvested,
  bonusAmount = 0,
  bonusPercentage = 0,
  fallbackBitsPrice = 1.0,
  referralCode = "", // 🎯 Add referral code parameter
}) => {
  console.groupCollapsed("🚀 [handleBNBPayment] START");
  console.log("🎯 [BNB] Referral Code:", referralCode);

  try {
    if (!window.ethereum) throw new Error("No Web3 wallet detected.");

    // 🌐 Choose RPCs based on active network (default MAINNET)
    const isMainnet = (CONTRACTS?.NODE?.address || "").toLowerCase() === "0xe6536756d73f0771d9a317f49453de96541c352f".toLowerCase();
    const readRpcEndpoints = isMainnet
      ? [
          "https://bsc-dataseed1.binance.org",
          "https://bsc-dataseed.binance.org",
          "https://bsc-dataseed4.binance.org",
          "https://bsc.publicnode.com"
        ]
      : [
          "https://data-seed-prebsc-1-s1.binance.org:8545/",
          "https://data-seed-prebsc-2-s1.binance.org:8545/",
          "https://data-seed-prebsc-1-s2.binance.org:8545/",
          "https://bsc-testnet.publicnode.com",
          "https://bsc-testnet-rpc.publicnode.com"
        ];

    // 🔁 Ensure wallet is on the right chain for signing (56 mainnet / 97 testnet)
    const desiredChainIdHex = isMainnet ? "0x38" : "0x61";
    try {
      const providerForSwitch = new ethers.providers.Web3Provider(window.ethereum);
      const net = await providerForSwitch.getNetwork();
      const currentChainHex = "0x" + net.chainId.toString(16);
      if (currentChainHex.toLowerCase() !== desiredChainIdHex.toLowerCase()) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: desiredChainIdHex }],
        });
      }
    } catch (switchErr) {
      console.warn("⚠️ Network switch failed or not supported:", switchErr.message);
    }
    
    let readProvider = null;
    
    // Try multiple RPC endpoints for read operations
    for (const rpcUrl of readRpcEndpoints) {
      try {
        console.log("🌐 [BNB] Trying RPC endpoint:", rpcUrl);
        readProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
        
        // Test the connection
        await readProvider.getBlockNumber();
        console.log("✅ [BNB] Successfully connected to:", rpcUrl);
        break;
      } catch (rpcErr) {
        console.warn("⚠️ [BNB] Failed endpoint:", rpcUrl, rpcErr.message);
        readProvider = null;
      }
    }
    
    if (!readProvider) {
      console.error("❌ [BNB] All RPC endpoints failed, using MetaMask");
      readProvider = new ethers.providers.Web3Provider(window.ethereum);
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const amountInWei = ethers.utils.parseUnits(amount.toString(), "ether");

    const nodeAbi = [
      "function buyBitsWithNativeToken(uint256 cellId, uint256 amount) payable",
      "function getBitsBalance() view returns (uint256)",
    ];

    const cellManagerAbi = [
      "function getCurrentOpenCellId() view returns (uint256)",
      "function getPriceForAmount(uint256 cellId, uint256 amount) view returns (uint256)"
    ];

    // Use readProvider for read calls, signer for transactions
    const nodeContractRead = new ethers.Contract(CONTRACTS.NODE.address, nodeAbi, readProvider);
    const cellManagerRead = new ethers.Contract(CONTRACTS.CELL_MANAGER.address, cellManagerAbi, readProvider);
    const nodeContract = new ethers.Contract(CONTRACTS.NODE.address, nodeAbi, signer);

    console.log("📞 [BNB] Getting current cell ID from stable RPC...");
    let cellId;
    try {
      cellId = await cellManagerRead.getCurrentOpenCellId();
    } catch (e) {
      console.error("❌ getCurrentOpenCellId failed:", e);
      throw new Error("CellManager not configured or wrong network. Please switch to BSC and retry.");
    }
    console.log("📦 Current Open Cell ID:", cellId);

    console.log("📞 [BNB] Getting BITS balance from stable RPC...");
    const bitsAvailable = await nodeContractRead.getBitsBalance();
    console.log("📦 Available BITS in Node:", bitsAvailable.toString());

    const bitsToReceiveBN = ethers.BigNumber.from(bitsToReceive);
    console.log("🧮 Bits to Receive (Units):", bitsToReceiveBN.toString());
    console.log("💸 Amount in Wei to Send:", amountInWei.toString());

    if (bitsToReceiveBN.isZero() || bitsToReceiveBN.lte(0)) {
      throw new Error("Invalid bitsToReceive value.");
    }

    if (bitsAvailable.lt(bitsToReceiveBN)) {
      throw new Error("Insufficient BITS in Node contract.");
    }

    const expectedBNB = await cellManagerRead.getPriceForAmount(cellId, bitsToReceiveBN);
    console.log("💰 Expected BNB for 59 BITS (in WEI):", expectedBNB.toString());
    console.log("💰 Amount Sent (in WEI):", amountInWei.toString());

    if (amountInWei.lt(expectedBNB)) {
      console.warn(`⚠️ Insufficient BNB sent. Expected: ${expectedBNB.toString()}, Sent: ${amountInWei.toString()}`);
      throw new Error("Insufficient BNB for the specified BITS amount.");
    }

    console.log("📦 Final BITS Price in USD (fallback only):", fallbackBitsPrice);

    // Pre-validate by simulating the buy to catch exact revert reasons
    try {
      await nodeContract.callStatic.buyBitsWithNativeToken(cellId, bitsToReceiveBN, { value: expectedBNB });
      console.log("✅ callStatic simulation passed");
    } catch (simErr) {
      const reason = (simErr?.error?.message || simErr?.reason || simErr?.data?.message || simErr?.message || "Unknown simulation error");
      console.error("❌ Simulation failed:", reason);
      throw new Error(`Transaction simulation failed: ${reason}`);
    }

    // Estimate gas with safety margin
    let gasLimitOverride;
    try {
      const estimated = await nodeContract.estimateGas.buyBitsWithNativeToken(cellId, bitsToReceiveBN, { value: expectedBNB });
      gasLimitOverride = estimated.mul(120).div(100); // +20% headroom
      console.log("⛽ Estimated gas:", estimated.toString(), "→ using:", gasLimitOverride.toString());
    } catch (estErr) {
      console.warn("⚠️ Gas estimation failed, using fallback:", estErr?.message || estErr);
      gasLimitOverride = ethers.BigNumber.from(400000);
    }

    console.log("🚀 Initiating Transaction...");
    const tx = await nodeContract.buyBitsWithNativeToken(cellId, bitsToReceiveBN, { value: expectedBNB, gasLimit: gasLimitOverride });
    const receipt = await tx.wait();
    console.log("✅ Payment confirmed. Transaction hash:", receipt.transactionHash);

    // 🎁 Bonus Logic - Record investment in AdditionalReward.sol (CRITICAL FIX)
    try {
      const additionalReward = new ethers.Contract(
        CONTRACTS.ADDITIONAL_REWARD.address,
        CONTRACTS.ADDITIONAL_REWARD.abi,
        signer
      );

      const usdInWei = ethers.utils.parseUnits(usdInvested.toString(), 18);
      console.log("💵 USD Investment for bonus:", usdInWei.toString());

      const bonusTx = await additionalReward.makeInvestment(usdInWei);
      await bonusTx.wait();
      console.log("🎁 Bonus investment recorded in AdditionalReward.sol!");
    } catch (bonusErr) {
      console.warn("⚠️ Bonus investment failed:", bonusErr.message);
    }

    // 💾 Backend Integration
    try {
      const transactionData = {
        wallet_address: walletAddress,
        amount: usdInvested,
        type: "buy_bits",
        status: "confirmed",
        error_message: null,
        network: "EVM",
        bits_received: bitsToReceiveBN.toString(),
        bonus_percentage: bonusPercentage.toString(),
        bonus_bits: bonusAmount.toString(),
        tx_signature: receipt.transactionHash,
        referral_code: referralCode || null, // 🎯 Add referral code to transaction data
      };

      console.log("💾 Sending transaction to backend:", transactionData);

      const response = await axios.post(API_ENDPOINT, transactionData);
      console.log("✅ Transaction saved in backend:", response.data);

    } catch (err) {
      console.warn("⚠️ Error saving transaction in backend:", err.message);
    }

    // 🔔 Telegram notification (success)
    notifyTelegram({
      event: "bits_purchase",
      status: "success",
      network: isMainnet ? "BSC Mainnet" : "BSC Testnet",
      wallet: walletAddress,
      bits: bitsToReceiveBN.toString(),
      valueWei: expectedBNB.toString(),
      usd: usdInvested,
      txHash: receipt.transactionHash,
      explorer: `https://bscscan.com/tx/${receipt.transactionHash}`,
      ts: Date.now(),
    });

    return { txHash: receipt.transactionHash };

  } catch (err) {
    console.error("❌ Error in handleBNBPayment:", err.message);

    try {
      const failedTransaction = {
        wallet_address: walletAddress,
        amount: usdInvested,
        type: "buy_bits",
        status: "failed",
        error_message: err.message,
        network: "EVM",
        bits_received: "0",
        bonus_percentage: "0",
        bonus_bits: "0",
        tx_signature: null,
      };

      console.log("💾 Logging failed transaction:", failedTransaction);

      await axios.post(API_ENDPOINT, failedTransaction);

    } catch (logError) {
      console.warn("⚠️ Error logging failed transaction:", logError.message);
    }

    // 🔔 Telegram notification (failure)
    notifyTelegram({
      event: "bits_purchase",
      status: "failed",
      network: "EVM",
      wallet: walletAddress,
      reason: err.message,
      usd: usdInvested,
      ts: Date.now(),
    });

    throw err;

  } finally {
    console.groupEnd();
  }
};

export default handleBNBPayment;
