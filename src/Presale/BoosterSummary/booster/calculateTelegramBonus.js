import { ethers } from "ethers";

const calculateTelegramBonus = async (walletAddress, telegramRewardContract) => {
  try {
    if (!walletAddress || !telegramRewardContract) return 0;

    let rawBonus;

    if (typeof telegramRewardContract.getTelegramReward === "function") {
      console.log("📡 [TelegramBonus] Using: getTelegramReward()");
      rawBonus = await telegramRewardContract.getTelegramReward(walletAddress);
    } else if (typeof telegramRewardContract.claimableBonus === "function") {
      console.log("📡 [TelegramBonus] Fallback to: claimableBonus()");
      rawBonus = await telegramRewardContract.claimableBonus(walletAddress);
    } else {
      console.warn("⚠️ [TelegramBonus] No compatible method found in contract");
      return 0;
    }

    const formatted = parseFloat(ethers.utils.formatUnits(rawBonus, 18));
    console.log(`✅ [TelegramBonus] ${walletAddress} → ${formatted} $BITS`);
    return formatted;
  } catch (error) {
    console.error("❌ [TelegramBonus] Error:", error);
    return 0;
  }
};

export default calculateTelegramBonus;
