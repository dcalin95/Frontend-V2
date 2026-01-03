import { ethers } from "ethers";
import axios from "axios";
import { getContractInstance } from "../../contract/getContract";
import { CONTRACTS } from "../../contract/contracts";
import ERC20ABI from "../../abi/erc20ABI.js";
import { notifyPresaleBuy } from "../../utils/telegramNotify";

const API_ENDPOINT = (process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com") + "/api/transactions";

const handleGenericPayment = async ({
  amount,
  bitsToReceive,
  walletAddress,
  paymentTokenAddress,
  decimals = 18,
  usdInvested = 0,
  bonusAmount = 0,
  bonusPercentage = 0,
  referralCode = "",
  signer, // 🔐 CRITICAL: Signer from WalletContext
  provider, // 🔐 CRITICAL: Provider from WalletContext
}) => {
  try {
    console.log("🔁 Generic Payment Handler started");

    // 🛑 CRITICAL: Use signer/provider from WalletContext, NOT window.ethereum
    if (!signer || !provider) {
      throw new Error("No wallet signer detected. Please connect your wallet first.");
    }

    const nodeContract = await getContractInstance("NODE");
    // NO MORE: const provider = new ethers.providers.Web3Provider(window.ethereum);
    // NO MORE: const signer = provider.getSigner();
    // ✅ signer and provider are passed from WalletContext

    const amountInWei = ethers.utils.parseUnits(amount.toString(), decimals);
    const bitsInWei = ethers.utils.parseUnits(bitsToReceive.toString(), 18);

    console.log("Token:", paymentTokenAddress);
    console.log("Pay:", amountInWei.toString(), "| Receive:", bitsInWei.toString());

    // Approve ERC20 token dacă nu e token nativ
    if (paymentTokenAddress !== ethers.constants.AddressZero) {
      const tokenContract = new ethers.Contract(paymentTokenAddress, ERC20ABI, signer);
      console.log("Approving ERC20...");
      const approveTx = await tokenContract.approve(nodeContract.address, amountInWei);
      await approveTx.wait();
      console.log("✅ Approved");
    }

    // Executează plata
    const tx = await nodeContract.setCellState(
      walletAddress,
      paymentTokenAddress,
      amountInWei,
      bitsInWei,
      "",
      0,
      0,
      { value: paymentTokenAddress === ethers.constants.AddressZero ? amountInWei : 0 }
    );

    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed:", receipt.transactionHash);

    // 🎁 Bonus: calculează valoare reală USD pe baza contractului CellManager
    try {
      const additionalReward = new ethers.Contract(
        CONTRACTS.ADDITIONAL_REWARD.address,
        CONTRACTS.ADDITIONAL_REWARD.abi,
        signer
      );

      const cellManager = new ethers.Contract(
        CONTRACTS.CELL_MANAGER.address,
        [
          "function getCurrentOpenCellId() view returns (uint256)",
          "function getPriceForAmount(uint256, uint256) view returns (uint256)"
        ],
        signer
      );

      const cellId = await cellManager.getCurrentOpenCellId();
      const usdInWei = await cellManager.getPriceForAmount(cellId, bitsInWei);

      console.log("💵 makeInvestment → USD (wei):", usdInWei.toString());
      const bonusTx = await additionalReward.makeInvestment(usdInWei);
      await bonusTx.wait();
      console.log("🎁 Bonus investment recorded!");
    } catch (bonusErr) {
      console.warn("⚠️ Bonus investment failed:", bonusErr.message);
    }

    // 💾 Backend Integration — save transaction uniformly with BNB flow
    try {
      const transactionData = {
        wallet_address: walletAddress,
        amount: Math.floor(Number(usdInvested) || 0),
        type: "buy_bits",
        status: "confirmed",
        error_message: null,
        network: "EVM",
        bits_received: bitsInWei.toString(),
        bonus_percentage: String(bonusPercentage || 0),
        bonus_bits: String(bonusAmount || 0),
        tx_signature: receipt.transactionHash,
        referral_code: referralCode || null,
        payment_token: paymentTokenAddress
      };

      console.log("💾 [generic] Sending transaction to backend:", transactionData);
      await axios.post(API_ENDPOINT, transactionData);
      
      // 🎯 TikTok CompletePayment event - Generic payment successful (ETH/USDT/USDC/MATIC)
      if (typeof window !== 'undefined' && window.ttq && typeof window.ttq.track === 'function') {
        try {
          const tokenName = paymentTokenAddress === ethers.constants.AddressZero ? 'ETH' : 
                           (paymentTokenAddress.toLowerCase() === CONTRACTS?.USDT?.address?.toLowerCase() ? 'USDT' :
                           (paymentTokenAddress.toLowerCase() === CONTRACTS?.USDC?.address?.toLowerCase() ? 'USDC' :
                           (paymentTokenAddress.toLowerCase() === CONTRACTS?.MATIC?.address?.toLowerCase() ? 'MATIC' : 'CRYPTO')));
          window.ttq.track('CompletePayment', {
            content_type: 'product',
            content_name: 'BITS Token Purchase',
            payment_method: tokenName,
            value: Math.round(Number(usdInvested) || 0),
            currency: 'USD',
          });
        } catch (err) {
          console.warn('[TikTok] CompletePayment tracking error:', err);
        }
      }
      
      // 📢 TELEGRAM NOTIFICATION
      const bitsFormatted = ethers.utils.formatUnits(bitsInWei, 18);
      await notifyPresaleBuy({
        wallet: walletAddress,
        bits: parseFloat(bitsFormatted).toFixed(2),
        usd: Math.round(Number(usdInvested) || 0),
        network: 'BSC',
        txHash: receipt.transactionHash
      });
    } catch (backendErr) {
      console.warn("⚠️ [generic] Error saving transaction in backend:", backendErr.message);
    }

    return receipt.transactionHash;
  } catch (error) {
    console.error("❌ Generic Payment Failed:", error);
    alert(`Generic token payment failed: ${error.message}`);
    throw error;
  }
};

export default handleGenericPayment;
