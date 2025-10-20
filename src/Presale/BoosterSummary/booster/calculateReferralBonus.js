// src/Presale/BoosterSummary/booster/calculateReferralBonus.js

import { ethers } from "ethers";

/**
 * Calculate the Referral Bonus (from Node contract).
 * 
 * @param {string} walletAddress - The user's wallet address.
 * @param {object} nodeContract - Instance of the Node contract.
 * @returns {Promise<number>} - The referral bonus in $BITS as a float.
 */
const calculateReferralBonus = async (walletAddress, nodeContract) => {
  console.group("🔍 [ReferralBonus] Calculating Referral Bonus");

  try {
    if (!walletAddress) {
      console.warn("⚠️ Wallet address is missing.");
      console.groupEnd();
      return 0;
    }

    if (!nodeContract) {
      console.warn("⚠️ Node contract instance is missing.");
      console.groupEnd();
      return 0;
    }

    console.log("Fetching referral reward for wallet:", walletAddress);

    const rawBonus = await nodeContract.calculateReferralReward(walletAddress);
    console.log("Raw Referral Bonus (wei):", rawBonus.toString());

    const formattedBonus = parseFloat(ethers.utils.formatUnits(rawBonus, 18));
    console.log(`Formatted Referral Bonus: ${formattedBonus} $BITS`);

    console.groupEnd();
    return formattedBonus;

  } catch (error) {
    console.error("❌ Error while fetching Referral Bonus:", error.message);
    console.groupEnd();
    return 0;
  }
};

export default calculateReferralBonus;
