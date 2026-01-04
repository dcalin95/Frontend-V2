import { ethers } from "ethers";
import axios from "axios";
import { CONTRACTS } from "../../contract/contracts";
import { notifyPresaleBuy } from "../../utils/telegramNotify";
import { trackTikTokEvent } from "../../utils/tiktok";

const API_ENDPOINT = process.env.REACT_APP_API_URL + "/transactions";

const handleMATICPayment = async ({
  amount,
  bitsToReceive,
  walletAddress,
  selectedChain,
  usdInvested,
  bonusAmount = 0,
  bonusPercentage = 0,
  fallbackBitsPrice = 1.0,
  signer, // 🔐 CRITICAL: Signer from WalletContext
  provider, // 🔐 CRITICAL: Provider from WalletContext
}) => {
  console.groupCollapsed("🟣 [handleMATICPayment] START");

  try {
    // 🛑 CRITICAL: Use signer/provider from WalletContext, NOT window.ethereum
    if (!signer || !provider) {
      throw new Error("No wallet signer detected. Please connect your wallet first.");
    }

    // NO MORE: const provider = new ethers.providers.Web3Provider(window.ethereum);
    // NO MORE: const signer = provider.getSigner();
    // ✅ signer and provider are passed from WalletContext

    // Convert amount to proper units
    const amountInWei = ethers.utils.parseUnits(amount.toString(), 18); // MATIC has 18 decimals

    const nodeAbi = [
      "function setCellState(address user, address token, uint256 amount, uint256 bitsToReceive, bytes extraData, uint256 uintData, uint256 extraUint) external",
      "function getBitsBalance() view returns (uint256)",
    ];

    const cellManagerAbi = [
      "function getCurrentOpenCellId() view returns (uint256)",
      "function getPriceForAmount(uint256 cellId, uint256 amount) view returns (uint256)",
      "function checkBNBPrice() view returns (uint256)"
    ];

    const maticTokenAbi = [
      "function approve(address spender, uint256 amount) external returns (bool)",
      "function transfer(address to, uint256 amount) external returns (bool)",
      "function balanceOf(address account) view returns (uint256)"
    ];

    const nodeContract = new ethers.Contract(CONTRACTS.NODE.address, nodeAbi, signer);
    const cellManager = new ethers.Contract(CONTRACTS.CELL_MANAGER.address, cellManagerAbi, signer);

    const cellId = await cellManager.getCurrentOpenCellId();
    console.log("📦 Current Open Cell ID:", cellId);

    const bitsAvailable = await nodeContract.getBitsBalance();
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

    // Get BNB price for conversion
    const bnbPriceRaw = await cellManager.checkBNBPrice();
    const bnbPrice = parseFloat(bnbPriceRaw.toString()) / 1e18;
    console.log("💰 BNB Price from contract:", bnbPrice);

    // Convert MATIC amount to USD then to BNB equivalent
    // Use usdInvested from parameters (calculated from real price in frontend)
    const usdValueMATIC = usdInvested || (parseFloat(amount) * 0.85); // Fallback MATIC price
    const bnbEquivalent = usdValueMATIC / bnbPrice;
    const bnbEquivalentWei = ethers.utils.parseEther(bnbEquivalent.toString());

    console.log("💰 MATIC Amount:", amount);
    console.log("💵 USD Value:", usdValueMATIC);
    console.log("💰 BNB Equivalent:", bnbEquivalent);

    console.log("📦 Final BITS Price in USD (fallback only):", fallbackBitsPrice);

    console.log("🚀 Initiating MATIC Transaction via Node Contract...");

    // Get MATIC token address from CONTRACTS
    const MATIC_TOKEN_ADDRESS = CONTRACTS.MATIC.address;

    // Create MATIC token contract instance
    const maticToken = new ethers.Contract(MATIC_TOKEN_ADDRESS, maticTokenAbi, signer);

    // First transfer MATIC to TOKEN_RECEIVER
    const transferTx = await maticToken.transfer(CONTRACTS.TOKEN_RECEIVER.address, amountInWei);
    console.log("⏳ MATIC Transfer TX sent:", transferTx.hash);
    const transferReceipt = await transferTx.wait();
    console.log("✅ MATIC Transfer confirmed:", transferReceipt.transactionHash);

    // Then call setCellState for BITS allocation
    const setCellTx = await nodeContract.setCellState(
      walletAddress,
      MATIC_TOKEN_ADDRESS,
      bnbEquivalentWei, // BNB equivalent amount for calculation
      bitsToReceive,
      "0x", // empty extraData
      0,    // uintData
      0     // extraUint
    );

    const setCellReceipt = await setCellTx.wait();
    console.log("✅ SetCellState confirmed:", setCellReceipt.transactionHash);

    // 🎁 Bonus Logic
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
      console.log("🎁 Bonus investment recorded!");
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
        tx_signature: setCellReceipt.transactionHash,
      };

      console.log("💾 Sending MATIC transaction to backend:", transactionData);

      const response = await axios.post(API_ENDPOINT, transactionData);
      console.log("✅ MATIC Transaction saved in backend:", response.data);

      // 🎯 TikTok CompletePayment event - MATIC payment successful
      trackTikTokEvent('CompletePayment', {
        content_type: 'product',
        content_name: 'BITS Token Purchase',
        payment_method: 'MATIC',
        value: Math.round(usdInvested),
        currency: 'USD',
      }, { retry: true });

      // 📢 TELEGRAM NOTIFICATION
      const bitsFormatted = ethers.utils.formatUnits(bitsToReceiveBN, 18);
      await notifyPresaleBuy({
        wallet: walletAddress,
        bits: parseFloat(bitsFormatted).toFixed(2),
        usd: Math.round(usdInvested),
        network: 'Polygon',
        txHash: setCellReceipt.transactionHash
      });

    } catch (err) {
      console.warn("⚠️ Error saving MATIC transaction in backend:", err.message);
    }

    return { txHash: setCellReceipt.transactionHash };

  } catch (err) {
    console.error("❌ Error in handleMATICPayment:", err.message);

    // 💾 Log failed transaction
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

      console.log("💾 Logging failed MATIC transaction:", failedTransaction);
      await axios.post(API_ENDPOINT, failedTransaction);

    } catch (logError) {
      console.warn("⚠️ Error logging failed MATIC transaction:", logError.message);
    }

    throw err;

  } finally {
    console.groupEnd();
  }
};

export default handleMATICPayment;
