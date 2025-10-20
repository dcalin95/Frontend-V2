import { ethers } from "ethers";
import axios from "axios";
import { CONTRACTS } from "../../contract/contracts";

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

    // 🌐 Use stable RPC for read calls, MetaMask for signing
    const readRpcEndpoints = [
      "https://data-seed-prebsc-1-s1.binance.org:8545/",
      "https://data-seed-prebsc-2-s1.binance.org:8545/",
      "https://data-seed-prebsc-1-s2.binance.org:8545/",
      "https://bsc-testnet.publicnode.com",
      "https://bsc-testnet-rpc.publicnode.com"
    ];
    
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
    const cellId = await cellManagerRead.getCurrentOpenCellId();
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

    console.log("🚀 Initiating Transaction...");
    const tx = await nodeContract.buyBitsWithNativeToken(cellId, bitsToReceive, { value: expectedBNB });
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

    throw err;

  } finally {
    console.groupEnd();
  }
};

export default handleBNBPayment;
