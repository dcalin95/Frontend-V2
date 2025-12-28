import { ethers } from "ethers";
import { getContractInstance } from "../../contract/getContract";
import { CONTRACTS } from "../../contract/contracts";
import { notifyPresaleBuy } from "../../utils/telegramNotify";

const handleUSDTPayment = async ({
  amount,
  bitsToReceive,
  walletAddress,
  signer,
  tokenPrice = 1.0 // USDT = $1 în mod normal
}) => {
  try {
    console.log("💵 USDT Payment started...");

    const usdt = await getContractInstance("USD_RECEIVER");
    const node = await getContractInstance("NODE");

    const decimals = CONTRACTS.USD_RECEIVER.decimals || 6;
    const amountInUnits = ethers.utils.parseUnits(amount.toString(), decimals);
    const bitsInUnits = ethers.utils.parseUnits(bitsToReceive.toString(), 18);

    // ✅ Approve USDT transfer
    const approveTx = await usdt.approve(CONTRACTS.NODE.address, amountInUnits);
    await approveTx.wait();
    console.log("✅ Approved USDT");

    // ✅ Call Node contract
    const tx = await node.buyWithToken(CONTRACTS.USD_RECEIVER.address, amountInUnits, bitsInUnits);
    const receipt = await tx.wait();

    console.log("✅ USDT Payment complete:", receipt.transactionHash);

    // 📢 TELEGRAM NOTIFICATION
    const bitsFormatted = parseFloat(bitsToReceive).toFixed(2);
    const usdInvested = parseFloat(amount);
    await notifyPresaleBuy({
      wallet: walletAddress,
      bits: bitsFormatted,
      usd: Math.round(usdInvested),
      network: 'BSC',
      txHash: receipt.transactionHash
    });

    // 🎁 Bonus logic
    try {
      const reward = new ethers.Contract(
        CONTRACTS.ADDITIONAL_REWARD.address,
        CONTRACTS.ADDITIONAL_REWARD.abi,
        signer
      );

      const bitsFloat = parseFloat(bitsToReceive.toString());
      const usdAmount = bitsFloat * tokenPrice;
      const usdInWei = ethers.utils.parseUnits(usdAmount.toFixed(6), 18);

      console.log("💵 Calling makeInvestment →", usdInWei.toString());
      const bonusTx = await reward.makeInvestment(usdInWei);
      await bonusTx.wait();

      console.log("🎁 Bonus investment recorded.");
    } catch (bonusErr) {
      console.warn("⚠️ Bonus investment failed:", bonusErr.message);
    }

    return receipt.transactionHash;
  } catch (err) {
    console.error("❌ USDT Payment failed:", err);
    alert(`USDT payment failed: ${err.message}`);
    throw err;
  }
};

export default handleUSDTPayment;
