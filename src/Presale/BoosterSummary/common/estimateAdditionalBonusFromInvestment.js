import getCurrentOpenCellPrice from "../common/getCurrentOpenCellPrice";

// Bonus tiers
const getBonusRate = (usd) => {
  if (usd >= 2500) return 15;
  if (usd >= 1000) return 10;
  if (usd >= 500) return 7;
  if (usd >= 250) return 5;
  return 0;
};

/**
 * Estimează bonusul în $BITS (neînregistrat on-chain)
 * 
 * @param {number} usdAmount - suma investită
 * @returns {Promise<{ bonusPercent: number, bonusBits: number }>}
 */
const estimateAdditionalBonusFromInvestment = async (usdAmount) => {
  try {
    const rate = getBonusRate(usdAmount);
    const bonusUsd = (usdAmount * rate) / 100;

    const bitsPrice = await getCurrentOpenCellPrice(); // ex: 1.00
    if (!bitsPrice || bitsPrice <= 0) throw new Error("Invalid BITS price");

    const bonusBits = bonusUsd / bitsPrice;

    return {
      bonusPercent: rate,
      bonusBits: Number(bonusBits.toFixed(4))
    };
  } catch (err) {
    console.error("❌ [BonusEstimate] Failed:", err);
    return { bonusPercent: 0, bonusBits: 0 };
  }
};

export default estimateAdditionalBonusFromInvestment;
