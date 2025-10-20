/**
 * 🎯 BITS UTILITIES - INTEGER ONLY LOGIC
 * 
 * Node.sol procesează doar BITS ÎNTREGI (fără virgulă)
 * Toate calculele trebuie rotunjite la numere întregi
 */

/* global BigInt */

/**
 * Convertește BITS la număr întreg (rotunjit în jos)
 * @param {number|string} bitsAmount - Suma BITS cu zecimale
 * @returns {number} BITS întreg
 */
export const toBitsInteger = (bitsAmount) => {
  if (!bitsAmount || isNaN(bitsAmount)) return 0;
  return Math.floor(Number(bitsAmount));
};

/**
 * Formatează BITS pentru afișare (fără zecimale inutile)
 * @param {number|string} bitsAmount - Suma BITS
 * @param {boolean} showDecimals - Dacă să afișeze zecimale pentru UI
 * @returns {string} BITS formatat
 */
export const formatBITS = (bitsAmount, showDecimals = false) => {
  const integerBits = toBitsInteger(bitsAmount);
  
  if (showDecimals) {
    // Pentru UI - arată că e întreg dar elegant
    return `${integerBits}.00 $BITS`;
  }
  
  // Pentru majoritatea cazurilor - doar numărul întreg
  return `${integerBits} $BITS`;
};

/**
 * Calculează bonus BITS în numere întregi
 * @param {number} usdAmount - Suma în USD
 * @param {number} bitsPrice - Prețul per BITS
 * @param {number} bonusRate - Rata bonus în procente
 * @returns {number} BITS bonus întreg
 */
export const calculateBonusBITSInteger = (usdAmount, bitsPrice, bonusRate) => {
  if (!usdAmount || !bitsPrice || !bonusRate) return 0;
  
  const bonusUSD = (usdAmount * bonusRate) / 100;
  const bonusBITS = bonusUSD / bitsPrice;
  
  // Rotunjește în jos la număr întreg
  return toBitsInteger(bonusBITS);
};

/**
 * Validează că suma BITS este întreagă pentru contracte
 * @param {number|string} bitsAmount - Suma BITS
 * @returns {boolean} True dacă e valida pentru contract
 */
export const validateBITSForContract = (bitsAmount) => {
  const integerBits = toBitsInteger(bitsAmount);
  return integerBits > 0 && Number.isInteger(integerBits);
};

/**
 * Convertește BITS la Wei pentru contracte (18 decimale)
 * @param {number} integerBits - BITS întreg
 * @returns {string} Wei format pentru contract
 */
export const bitsToWei = (integerBits) => {
  const validBits = toBitsInteger(integerBits);
  return (BigInt(validBits) * BigInt(10 ** 18)).toString();
};

/**
 * Convertește Wei la BITS întregi
 * @param {string|BigInt} weiAmount - Suma în Wei
 * @returns {number} BITS întreg
 */
export const weiToBitsInteger = (weiAmount) => {
  try {
    const bigIntWei = typeof weiAmount === 'string' ? BigInt(weiAmount) : weiAmount;
    const bitsFloat = Number(bigIntWei) / (10 ** 18);
    return toBitsInteger(bitsFloat);
  } catch (error) {
    console.error("❌ Error converting Wei to BITS:", error);
    return 0;
  }
};

/**
 * Helper pentru logging - afișează atât zecimale cât și întregi
 * @param {number} originalAmount - Suma originală cu zecimale
 * @param {string} context - Context pentru debugging
 */
export const logBITSConversion = (originalAmount, context = "") => {
  const integerAmount = toBitsInteger(originalAmount);
  console.log(`🎯 [BITS INTEGER] ${context}: ${originalAmount} → ${integerAmount} BITS (for contracts)`);
  return integerAmount;
};

export default {
  toBitsInteger,
  formatBITS,
  calculateBonusBITSInteger,
  validateBITSForContract,
  bitsToWei,
  weiToBitsInteger,
  logBITSConversion
};
