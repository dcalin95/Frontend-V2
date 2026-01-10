/**
 * ✅ Validators
 * 
 * Utilitare pentru validarea datelor
 * Input validation, data sanitization, etc.
 */

/**
 * Validate wallet address
 * @param {string} address - Wallet address
 * @returns {Object} - { valid: boolean, error?: string }
 */
function validateWalletAddress(address) {
  if (!address || typeof address !== "string") {
    return { valid: false, error: "Address is required and must be a string" };
  }
  
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return { valid: false, error: "Invalid address format" };
  }
  
  return { valid: true };
}

/**
 * Validate token amount
 * @param {string|number} amount - Token amount
 * @param {number} min - Minimum amount (optional)
 * @param {number} max - Maximum amount (optional)
 * @returns {Object} - { valid: boolean, error?: string }
 */
function validateTokenAmount(amount, min = null, max = null) {
  if (amount === null || amount === undefined || amount === "") {
    return { valid: false, error: "Amount is required" };
  }
  
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount)) {
    return { valid: false, error: "Amount must be a valid number" };
  }
  
  if (numAmount <= 0) {
    return { valid: false, error: "Amount must be greater than 0" };
  }
  
  if (min !== null && numAmount < min) {
    return { valid: false, error: `Amount must be at least ${min}` };
  }
  
  if (max !== null && numAmount > max) {
    return { valid: false, error: `Amount must be at most ${max}` };
  }
  
  return { valid: true };
}

/**
 * Validate slippage tolerance
 * @param {number} slippage - Slippage in basis points (e.g., 50 = 0.5%)
 * @returns {Object} - { valid: boolean, error?: string }
 */
function validateSlippage(slippage) {
  if (slippage === null || slippage === undefined) {
    return { valid: false, error: "Slippage is required" };
  }
  
  const numSlippage = parseFloat(slippage);
  
  if (isNaN(numSlippage)) {
    return { valid: false, error: "Slippage must be a valid number" };
  }
  
  if (numSlippage < 0 || numSlippage > 1000) {
    return { valid: false, error: "Slippage must be between 0 and 1000 basis points (0-10%)" };
  }
  
  return { valid: true };
}

/**
 * Validate trading pair
 * @param {string} tokenIn - Input token address
 * @param {string} tokenOut - Output token address
 * @returns {Object} - { valid: boolean, error?: string }
 */
function validateTradingPair(tokenIn, tokenOut) {
  const inValidation = validateWalletAddress(tokenIn);
  if (!inValidation.valid) {
    return { valid: false, error: `Invalid input token: ${inValidation.error}` };
  }
  
  const outValidation = validateWalletAddress(tokenOut);
  if (!outValidation.valid) {
    return { valid: false, error: `Invalid output token: ${outValidation.error}` };
  }
  
  if (tokenIn.toLowerCase() === tokenOut.toLowerCase()) {
    return { valid: false, error: "Input and output tokens cannot be the same" };
  }
  
  return { valid: true };
}

/**
 * Validate pagination parameters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} - { valid: boolean, error?: string, page?: number, limit?: number }
 */
function validatePagination(page, limit) {
  const numPage = parseInt(page) || 1;
  const numLimit = parseInt(limit) || 10;
  
  if (numPage < 1) {
    return { valid: false, error: "Page must be at least 1" };
  }
  
  if (numLimit < 1 || numLimit > 100) {
    return { valid: false, error: "Limit must be between 1 and 100" };
  }
  
  return { valid: true, page: numPage, limit: numLimit };
}

/**
 * Validate timestamp range
 * @param {number} startTime - Start timestamp
 * @param {number} endTime - End timestamp
 * @returns {Object} - { valid: boolean, error?: string }
 */
function validateTimestampRange(startTime, endTime) {
  const start = parseInt(startTime);
  const end = parseInt(endTime);
  
  if (isNaN(start) || isNaN(end)) {
    return { valid: false, error: "Start and end times must be valid timestamps" };
  }
  
  if (start < 0 || end < 0) {
    return { valid: false, error: "Timestamps must be positive" };
  }
  
  if (start >= end) {
    return { valid: false, error: "Start time must be before end time" };
  }
  
  const now = Math.floor(Date.now() / 1000);
  if (end > now) {
    return { valid: false, error: "End time cannot be in the future" };
  }
  
  return { valid: true };
}

/**
 * Sanitize string input
 * @param {string} input - Input string
 * @param {number} maxLength - Maximum length (optional)
 * @returns {string} - Sanitized string
 */
function sanitizeString(input, maxLength = null) {
  if (typeof input !== "string") {
    return "";
  }
  
  // Remove null bytes and trim
  let sanitized = input.replace(/\0/g, "").trim();
  
  // Limit length if specified
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Validate email format (if needed for notifications)
 * @param {string} email - Email address
 * @returns {Object} - { valid: boolean, error?: string }
 */
function validateEmail(email) {
  if (!email || typeof email !== "string") {
    return { valid: false, error: "Email is required" };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Invalid email format" };
  }
  
  return { valid: true };
}

/**
 * Validate API key format (if needed)
 * @param {string} apiKey - API key
 * @returns {Object} - { valid: boolean, error?: string }
 */
function validateApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== "string") {
    return { valid: false, error: "API key is required" };
  }
  
  if (apiKey.length < 16) {
    return { valid: false, error: "API key must be at least 16 characters" };
  }
  
  return { valid: true };
}

module.exports = {
  validateWalletAddress,
  validateTokenAmount,
  validateSlippage,
  validateTradingPair,
  validatePagination,
  validateTimestampRange,
  sanitizeString,
  validateEmail,
  validateApiKey
};

