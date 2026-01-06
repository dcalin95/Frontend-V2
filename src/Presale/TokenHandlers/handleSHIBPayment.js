import { ethers } from "ethers";
import { getContractInstance } from "../../contract/getContract";
import { CONTRACTS } from "../../contract/contracts";
import { notifyPresaleBuy } from "../../utils/telegramNotify";
import { trackTikTokEvent } from "../../utils/tiktok";

const handleSHIBPayment = async ({
  amount,
  bitsToReceive,
  walletAddress,
  signer,
  tokenPrice // prețul SHIB în USD
}) => {
  try {
    console.log("🐶 SHIB Payment started...");

    const shib = await getContractInstance("TOKEN_RECEIVER"); // SHIB token
    const node = await getContractInstance("NODE");

    const decimals = CONTRACTS.TOKEN_RECEIVER.decimals || 18;
    const amountInUnits = ethers.utils.parseUnits(amount.toString(), decimals);
    const bitsInUnits = ethers.utils.parseUnits(bitsToReceive.toString(), 18);

    const approveTx = await shib.approve(CONTRACTS.NODE.address, amountInUnits);
    await approveTx.wait();
    console.log("✅ Approved SHIB");

    const tx = await node.buyWithToken(
      CONTRACTS.TOKEN_RECEIVER.address,
      amountInUnits,
      bitsInUnits
    );
    const receipt = await tx.wait();

    console.log("✅ SHIB Payment complete:", receipt.transactionHash);

    // 🎯 TikTok CompletePayment event - SHIB payment successful
    const usdInvested = parseFloat(bitsToReceive) * tokenPrice; // SHIB to USD
    trackTikTokEvent('CompletePayment', {
      content_type: 'product',
      content_name: 'BITS Token Purchase',
      payment_method: 'SHIB',
      value: Math.round(usdInvested),
      currency: 'USD',
    }, { retry: true, walletAddress: walletAddress });

    // 📢 TELEGRAM NOTIFICATION
    const bitsFormatted = parseFloat(bitsToReceive).toFixed(2);
    await notifyPresaleBuy({
      wallet: walletAddress,
      bits: bitsFormatted,
      usd: Math.round(usdInvested),
      network: 'BSC',
      txHash: receipt.transactionHash
    });

    // 🎁 Bonus logic – USD calc + makeInvestment
    try {
      const additionalReward = new ethers.Contract(
        CONTRACTS.ADDITIONAL_REWARD.address,
        CONTRACTS.ADDITIONAL_REWARD.abi,
        signer
      );

      const bitsFloat = parseFloat(bitsToReceive.toString());
      const usdAmount = bitsFloat * tokenPrice;

      const usdInWei = ethers.utils.parseUnits(usdAmount.toFixed(6), 18);
      console.log("💵 makeInvestment → USD (wei):", usdInWei.toString());

      const bonusTx = await additionalReward.makeInvestment(usdInWei);
      await bonusTx.wait();
      console.log("🎁 Bonus investment recorded!");
    } catch (bonusErr) {
      console.warn("⚠️ Bonus investment failed:", bonusErr.message);
    }

    return receipt.transactionHash;
  } catch (err) {
    console.error("❌ SHIB Payment failed:", err);
    alert(`SHIB payment failed: ${err.message}`);
    throw err;
  }
};

export default handleSHIBPayment;
