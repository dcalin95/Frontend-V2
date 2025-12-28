import { ethers } from "ethers";
import axios from "axios";
import { CONTRACTS } from "../../contract/contracts";
import { notifyPresaleBuy } from "../../utils/telegramNotify";

const API_ENDPOINT = (process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com") + "/transactions";

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

    // 🌐 MAINNET-only RPCs
    const isMainnet = true;
    const readRpcEndpoints = [
      "https://bsc-dataseed1.binance.org",
      "https://bsc-dataseed.binance.org",
      "https://bsc-dataseed4.binance.org",
      "https://bsc.publicnode.com",
      "https://rpc.ankr.com/bsc"
    ];

    // 🔁 Ensure wallet is on the right chain for signing (BSC Mainnet)
    const desiredChainIdHex = "0x38";
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
    
    // 🛡️ Preflight: verify we are truly on BSC and warn Ledger users to open Ethereum app
    try {
      const providerForChecks = new ethers.providers.Web3Provider(window.ethereum);
      const [codeNode, codeCM] = await Promise.all([
        providerForChecks.getCode(CONTRACTS.NODE.address),
        providerForChecks.getCode(CONTRACTS.CELL_MANAGER.address)
      ]);

      const onWrongChain = !codeNode || codeNode === '0x' || !codeCM || codeCM === '0x';
      if (onWrongChain) {
        const msg = [
          `⚠️ Wrong network selected in wallet.`,
          `\nYou are buying with BNB on BSC Mainnet.`,
          `\nIf you use Ledger, open the "Ethereum" app (BSC uses the Ethereum app), not the "Binance" app.`,
          `\nThen switch your wallet network to BSC Mainnet (chainId 56, 0x38) and try again.`,
        ].join(' ');
        alert(msg);
        throw new Error("Wrong network or Ledger app. Open Ethereum app for BSC and switch to the correct BSC network.");
      }
    } catch (preflightErr) {
      // If preflight itself fails, surface a clear message and stop
      console.warn("⚠️ Preflight network/app check failed:", preflightErr.message);
      throw preflightErr;
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
      throw new Error("CellManager not configured or wrong network. If you use Ledger, open the Ethereum app (for BSC) and switch wallet to BSC, then retry.");
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
    console.log("💰 Expected BNB for amount (in WEI):", expectedBNB.toString());
    console.log("💰 User-entered Amount (in WEI):", amountInWei.toString());

    // 🛡️ Safety margin to avoid edge rejects due to rounding/race
    const toleranceBps = 50; // 0.5%
    const minExtraWei = ethers.utils.parseUnits("0.000001", "ether"); // +0.000001 BNB
    let marginWei = expectedBNB.mul(toleranceBps).div(10000);
    if (marginWei.lt(minExtraWei)) marginWei = minExtraWei;
    const valueToSend = expectedBNB.add(marginWei);
    console.log("💰 Using valueToSend (expected + margin):", valueToSend.toString());

    console.log("📦 Final BITS Price in USD (fallback only):", fallbackBitsPrice);

    // Pre-validate by simulating the buy to catch exact revert reasons
    try {
      await nodeContract.callStatic.buyBitsWithNativeToken(cellId, bitsToReceiveBN, { value: valueToSend });
      console.log("✅ callStatic simulation passed");
    } catch (simErr) {
      const reason = (simErr?.error?.message || simErr?.reason || simErr?.data?.message || simErr?.message || "Unknown simulation error");
      console.error("❌ Simulation failed:", reason);
      const ledgerHint = " If you are using Ledger, open the Ethereum app (BSC uses the Ethereum app) and ensure your wallet is on BSC.";
      throw new Error(`Transaction simulation failed: ${reason}.${ledgerHint}`);
    }

    // Estimate gas with safety margin
    let gasLimitOverride;
    try {
      const estimated = await nodeContract.estimateGas.buyBitsWithNativeToken(cellId, bitsToReceiveBN, { value: valueToSend });
      gasLimitOverride = estimated.mul(120).div(100); // +20% headroom
      console.log("⛽ Estimated gas:", estimated.toString(), "→ using:", gasLimitOverride.toString());
    } catch (estErr) {
      console.warn("⚠️ Gas estimation failed, using fallback:", estErr?.message || estErr);
      gasLimitOverride = ethers.BigNumber.from(400000);
    }

    console.log("🚀 Initiating Transaction...");
    const tx = await nodeContract.buyBitsWithNativeToken(cellId, bitsToReceiveBN, { value: valueToSend, gasLimit: gasLimitOverride });
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

    // 📢 TELEGRAM NOTIFICATION - Universal format
    const bitsFormatted = ethers.utils.formatUnits(bitsToReceiveBN, 18);
    await notifyPresaleBuy({
      wallet: walletAddress,
      bits: parseFloat(bitsFormatted).toFixed(2),
      usd: Math.round(usdInvested),
      network: 'BSC',
      txHash: receipt.transactionHash
    });

    return { txHash: receipt.transactionHash };

  } catch (err) {
    console.error("❌ Error in handleBNBPayment:", err.message);

    // 🧠 Friendly error summaries for users (used in popup + Telegram)
    const summarizeError = (e) => {
      const msg = String(e?.message || e || "").toLowerCase();
      const code = (e?.code || e?.error?.code || "").toString();
      if (code === 'ACTION_REJECTED' || msg.includes('user rejected') || msg.includes('rejected')) {
        return 'Transaction cancelled in wallet. No funds were spent.';
      }
      if (msg.includes('insufficient funds')) {
        return 'Insufficient BNB for amount or gas. Add a small amount of BNB and try again.';
      }
      if (msg.includes('unpredictable_gas_limit') || msg.includes('cannot estimate gas') || msg.includes('execution reverted')) {
        return 'Network could not estimate gas. Please retry in a moment or ensure the amount is valid. Your funds remain safe.';
      }
      if (msg.includes('call_exception')) {
        return 'Transaction rejected by the contract. Check that you are on BSC and Ledger has the Ethereum app open.';
      }
      if (code === 'TRANSACTION_REPLACED') {
        return 'Transaction was replaced in wallet. If you sped it up and it confirmed, you will see the new hash.';
      }
      if (msg.includes('network error')) {
        return 'Network error. Check your internet and wallet network, then try again.';
      }
      return 'Transaction failed. Please try again.';
    };
    const friendlyReason = summarizeError(err);

    // Also adjust message shown upstream
    try { err.message = friendlyReason; } catch (_) {}

    // Make CALL_EXCEPTION errors explicit for Ledger/BSC confusion
    try {
      const msg = String(err?.message || '');
      if (msg.includes('CALL_EXCEPTION') || msg.toLowerCase().includes('execution reverted')) {
        const friendly = [
          'Transaction failed due to a contract/network mismatch.',
          ` Use BSC Mainnet in your wallet.`,
          ' If you use Ledger, open the Ethereum app (BSC uses the Ethereum app), not the Binance app, then retry.'
        ].join('');
        try { err.message = friendly; } catch (_) {}
      }
    } catch (_) {}

    // Special case: MetaMask/ethers replaces the pending tx with a sped-up one
    // Treat as success if the replacement was mined successfully
    try {
      const code = err?.code || err?.error?.code;
      if (code === 'TRANSACTION_REPLACED' || String(err?.message).includes('TRANSACTION_REPLACED')) {
        const rep = err.replacement || {};
        const rec = err.receipt || {};
        const finalHash = rep.hash || rec.transactionHash;
        const ok = rec && (rec.status === 1 || rec.status === '0x1');
        if (ok && finalHash) {
          console.warn('ℹ️ Transaction replaced, but confirmed with new hash:', finalHash);
          return { txHash: finalHash };
        }
      }
    } catch (_) {}

    try {
      const failedTransaction = {
        wallet_address: walletAddress,
        amount: usdInvested,
        type: "buy_bits",
        status: "failed",
        error_message: friendlyReason,
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

    throw err;

  } finally {
    console.groupEnd();
  }
};

export default handleBNBPayment;
