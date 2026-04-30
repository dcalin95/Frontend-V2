/**
 * 🪙 Custom Token Manager - User-Added Tokens
 * 
 * Allows users to add custom tokens to their personal token list
 * Stored in localStorage, separate from main TOKEN_REGISTRY
 * 
 * @module customTokenManager
 */

const CUSTOM_TOKENS_KEY = 'dex_custom_tokens';

/**
 * Get all custom tokens from localStorage
 * @returns {Object} Custom tokens object { symbol: tokenData }
 */
export function getCustomTokens() {
  try {
    const stored = localStorage.getItem(CUSTOM_TOKENS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('[CustomTokenManager] Error loading custom tokens:', error);
    return {};
  }
}

/**
 * Add a custom token
 * @param {Object} tokenData - Token data object
 * @param {string} tokenData.symbol - Token symbol (e.g., 'NEWTOKEN')
 * @param {string} tokenData.name - Full token name
 * @param {string} tokenData.address - Contract address on BSC
 * @param {number} [tokenData.decimals=18] - Token decimals
 * @returns {boolean} Success status
 */
export function addCustomToken(tokenData) {
  try {
    const { symbol, name, address, decimals = 18 } = tokenData;
    
    // Validation
    if (!symbol || !name || !address) {
      throw new Error('Missing required fields: symbol, name, address');
    }
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new Error('Invalid BSC address format');
    }
    
    const customTokens = getCustomTokens();
    const normalizedSymbol = symbol.toUpperCase();
    
    // Add token
    customTokens[normalizedSymbol] = {
      symbol: normalizedSymbol,
      name,
      address,
      decimals,
      logoUrl: null,
      isNative: false,
      isStablecoin: false,
      type: 'custom',
      displayOrder: 1000, // Show at end
      isCustom: true, // Flag for identification
      addedAt: Date.now()
    };
    
    localStorage.setItem(CUSTOM_TOKENS_KEY, JSON.stringify(customTokens));
    return true;
  } catch (error) {
    console.error('[CustomTokenManager] Error adding token:', error);
    return false;
  }
}

/**
 * Remove a custom token
 * @param {string} symbol - Token symbol to remove
 * @returns {boolean} Success status
 */
export function removeCustomToken(symbol) {
  try {
    const customTokens = getCustomTokens();
    const normalizedSymbol = symbol.toUpperCase();
    
    if (!customTokens[normalizedSymbol]) {
      return false;
    }
    
    delete customTokens[normalizedSymbol];
    localStorage.setItem(CUSTOM_TOKENS_KEY, JSON.stringify(customTokens));
    return true;
  } catch (error) {
    console.error('[CustomTokenManager] Error removing token:', error);
    return false;
  }
}

/**
 * Check if token is custom (user-added)
 * @param {string} symbol - Token symbol
 * @returns {boolean} True if custom token
 */
export function isCustomToken(symbol) {
  const customTokens = getCustomTokens();
  return !!customTokens[symbol.toUpperCase()];
}

/**
 * Get combined tokens (registry + custom)
 * @param {Object} tokenRegistry - Main token registry
 * @returns {Array} Combined tokens array
 */
export function getCombinedTokens(tokenRegistry) {
  const customTokens = getCustomTokens();
  const registryTokens = Object.values(tokenRegistry);
  const customTokensArray = Object.values(customTokens);
  
  return [...registryTokens, ...customTokensArray].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );
}

export default {
  getCustomTokens,
  addCustomToken,
  removeCustomToken,
  isCustomToken,
  getCombinedTokens
};
