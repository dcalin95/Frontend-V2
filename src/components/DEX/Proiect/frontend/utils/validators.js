/**
 * ✅ Validators - Input Validation Utilities
 * 
 * Utility functions pentru input validation:
 * - Email
 * - Address
 * - Numbers
 * - Required fields
 * 
 * @module validators
 */

/**
 * Validate email address
 * @param {string} email - Email address
 * @returns {boolean} True dacă e valid
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate wallet address (Ethereum/BSC format)
 * @param {string} address - Wallet address
 * @returns {boolean} True dacă e valid
 */
export function isValidAddress(address) {
  if (!address || typeof address !== 'string') {
    return false;
  }
  // Ethereum/BSC address format: 0x followed by 40 hex characters
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  return addressRegex.test(address.trim());
}

/**
 * Validate number
 * @param {*} value - Value to validate
 * @param {number} min - Minimum value (optional)
 * @param {number} max - Maximum value (optional)
 * @returns {boolean} True dacă e valid
 */
export function isValidNumber(value, min = null, max = null) {
  if (value === null || value === undefined || value === '') {
    return false;
  }
  
  const num = Number(value);
  if (isNaN(num)) {
    return false;
  }
  
  if (min !== null && num < min) {
    return false;
  }
  
  if (max !== null && num > max) {
    return false;
  }
  
  return true;
}

/**
 * Validate required field
 * @param {*} value - Value to validate
 * @returns {boolean} True dacă e valid (not empty)
 */
export function isRequired(value) {
  if (value === null || value === undefined) {
    return false;
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return false;
  }
  
  if (Array.isArray(value) && value.length === 0) {
    return false;
  }
  
  if (typeof value === 'object' && Object.keys(value).length === 0) {
    return false;
  }
  
  return true;
}

/**
 * Validate percentage (0-100)
 * @param {number} value - Percentage value
 * @returns {boolean} True dacă e valid
 */
export function isValidPercentage(value) {
  return isValidNumber(value, 0, 100);
}

/**
 * Validate percentage decimal (0-1)
 * @param {number} value - Percentage value în decimal format
 * @returns {boolean} True dacă e valid
 */
export function isValidPercentageDecimal(value) {
  return isValidNumber(value, 0, 1);
}

/**
 * Validate positive number
 * @param {number} value - Value to validate
 * @returns {boolean} True dacă e valid și pozitiv
 */
export function isValidPositiveNumber(value) {
  return isValidNumber(value, 0);
}

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} True dacă e valid
 */
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate transaction hash
 * @param {string} txHash - Transaction hash
 * @returns {boolean} True dacă e valid
 */
export function isValidTxHash(txHash) {
  if (!txHash || typeof txHash !== 'string') {
    return false;
  }
  // Transaction hash format: 0x followed by 64 hex characters
  const txHashRegex = /^0x[a-fA-F0-9]{64}$/;
  return txHashRegex.test(txHash.trim());
}

/**
 * Validate strategy config
 * @param {Object} config - Strategy config
 * @returns {Object} Validation result { valid: boolean, errors: Array }
 */
export function validateStrategyConfig(config) {
  const errors = [];
  
  if (!config || typeof config !== 'object') {
    errors.push('Strategy config is required');
    return { valid: false, errors };
  }
  
  if (config.riskLimits) {
    const { maxPercentPerTrade, dailyLossLimit, maxDrawdown } = config.riskLimits;
    
    if (maxPercentPerTrade !== undefined && !isValidPercentage(maxPercentPerTrade)) {
      errors.push('Max percent per trade must be between 0 and 100');
    }
    
    if (dailyLossLimit !== undefined && !isValidPercentage(dailyLossLimit)) {
      errors.push('Daily loss limit must be between 0 and 100');
    }
    
    if (maxDrawdown !== undefined && !isValidPercentage(maxDrawdown)) {
      errors.push('Max drawdown must be between 0 and 100');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate trade execution params
 * @param {Object} params - Trade execution parameters
 * @returns {Object} Validation result { valid: boolean, errors: Array }
 */
export function validateTradeParams(params) {
  const errors = [];
  
  if (!params || typeof params !== 'object') {
    errors.push('Trade parameters are required');
    return { valid: false, errors };
  }
  
  if (!isRequired(params.tokenIn)) {
    errors.push('Token In is required');
  }
  
  if (!isRequired(params.tokenOut)) {
    errors.push('Token Out is required');
  }
  
  if (!isValidPositiveNumber(params.amountIn)) {
    errors.push('Amount In must be a positive number');
  }
  
  if (params.amountOutMin !== undefined && !isValidPositiveNumber(params.amountOutMin)) {
    errors.push('Amount Out Min must be a positive number');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

