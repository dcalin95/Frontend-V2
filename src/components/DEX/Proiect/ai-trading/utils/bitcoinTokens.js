/**
 * ₿ Bitcoin Tokens - AI Trading Constants & Helpers
 * 
 * Bitcoin token constants și helper functions pentru AI Trading (Oxium-inspired):
 * - WBTC și BTCB token addresses
 * - Bitcoin equivalence checks
 * - Arbitrage detection
 * - Routing optimization
 * 
 * @module bitcoinTokens
 */

// ============ BITCOIN TOKENS ON BSC ============

/**
 * Bitcoin token addresses și metadata pe BSC
 */
export const BITCOIN_TOKENS = {
  WBTC: {
    address: '0x1CE0c2827e2eF14D5C4f29a091d735A204794041',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 18,
    coinGeckoId: 'bitcoin',
    description: 'Wrapped Bitcoin (WBTC) - 1:1 backed by Bitcoin'
  },
  BTCB: {
    address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
    symbol: 'BTCB',
    name: 'Binance-Pegged Bitcoin',
    decimals: 18,
    coinGeckoId: 'bitcoin',
    description: 'Binance-Pegged Bitcoin (BTCB) - 1:1 backed by Bitcoin'
  }
};

/**
 * Bitcoin token addresses array
 */
export const BITCOIN_TOKEN_ADDRESSES = Object.values(BITCOIN_TOKENS).map(token => token.address);

/**
 * Bitcoin token symbols array
 */
export const BITCOIN_TOKEN_SYMBOLS = Object.keys(BITCOIN_TOKENS);

// ============ HELPER FUNCTIONS (Oxium-Inspired) ============

/**
 * Verifică dacă un token este un Bitcoin token (WBTC sau BTCB)
 * @param {string} tokenAddress - Token address sau symbol
 * @returns {boolean} True dacă token-ul este WBTC sau BTCB
 */
export function isBitcoinToken(tokenAddress) {
  if (!tokenAddress) return false;
  
  const normalized = tokenAddress.toLowerCase();
  
  // Check by address
  if (normalized.startsWith('0x')) {
    return BITCOIN_TOKEN_ADDRESSES.some(
      addr => addr.toLowerCase() === normalized
    );
  }
  
  // Check by symbol
  return BITCOIN_TOKEN_SYMBOLS.includes(normalized.toUpperCase());
}

/**
 * Verifică dacă două tokens sunt Bitcoin equivalents (WBTC ↔ BTCB)
 * @param {string} token1 - First token address sau symbol
 * @param {string} token2 - Second token address sau symbol
 * @returns {boolean} True dacă ambele sunt Bitcoin tokens
 */
export function areBitcoinEquivalents(token1, token2) {
  return isBitcoinToken(token1) && isBitcoinToken(token2);
}

/**
 * Get Bitcoin token cu cel mai mare liquidity (pentru routing)
 * @returns {Object} Bitcoin token cu cel mai mare liquidity (BTCB pe BSC)
 */
export function getMostLiquidBitcoinToken() {
  return BITCOIN_TOKENS.BTCB; // BTCB este cel mai lichid pe BSC
}

/**
 * Check dacă un pair este un Bitcoin arbitrage pair (WBTC/BTCB)
 * @param {string} tokenIn - Input token address sau symbol
 * @param {string} tokenOut - Output token address sau symbol
 * @returns {boolean} True dacă este arbitrage pair
 */
export function isBitcoinArbitragePair(tokenIn, tokenOut) {
  return areBitcoinEquivalents(tokenIn, tokenOut);
}

/**
 * Get best Bitcoin token pentru trade (routing optimization)
 * @param {string} tokenIn - Input token address sau symbol
 * @param {string} tokenOut - Output token address sau symbol
 * @returns {Object|null} Best Bitcoin token pentru routing sau null
 */
export function getBestBitcoinTokenForTrade(tokenIn, tokenOut) {
  // Dacă ambele sunt Bitcoin tokens, folosim cel mai lichid
  if (areBitcoinEquivalents(tokenIn, tokenOut)) {
    return getMostLiquidBitcoinToken(); // BTCB
  }
  
  // Dacă unul e Bitcoin, folosim acela
  if (isBitcoinToken(tokenIn)) {
    return getBitcoinTokenByAddress(tokenIn) || getBitcoinTokenBySymbol(tokenIn);
  }
  if (isBitcoinToken(tokenOut)) {
    return getBitcoinTokenByAddress(tokenOut) || getBitcoinTokenBySymbol(tokenOut);
  }
  
  // Nu e Bitcoin trade
  return null;
}

/**
 * Get Bitcoin token by address
 * @param {string} address - Token address
 * @returns {Object|null} Bitcoin token sau null
 */
export function getBitcoinTokenByAddress(address) {
  if (!address) return null;
  
  const normalizedAddress = address.toLowerCase();
  return Object.values(BITCOIN_TOKENS).find(
    token => token.address.toLowerCase() === normalizedAddress
  ) || null;
}

/**
 * Get Bitcoin token by symbol
 * @param {string} symbol - Token symbol (WBTC sau BTCB)
 * @returns {Object|null} Bitcoin token sau null
 */
export function getBitcoinTokenBySymbol(symbol) {
  if (!symbol) return null;
  
  const normalizedSymbol = symbol.toUpperCase();
  return BITCOIN_TOKENS[normalizedSymbol] || null;
}

/**
 * Get equivalent Bitcoin token (WBTC ↔ BTCB)
 * @param {string} token - Bitcoin token address sau symbol
 * @returns {Object|null} Equivalent token
 */
export function getEquivalentBitcoinToken(token) {
  if (!token) return null;
  
  const tokenObj = getBitcoinTokenByAddress(token) || getBitcoinTokenBySymbol(token);
  if (!tokenObj) return null;
  
  if (tokenObj.symbol === 'WBTC') {
    return BITCOIN_TOKENS.BTCB;
  }
  if (tokenObj.symbol === 'BTCB') {
    return BITCOIN_TOKENS.WBTC;
  }
  
  return null;
}

/**
 * Check dacă un pair este un Bitcoin pair (cel puțin un token este Bitcoin)
 * @param {string} tokenIn - Input token address sau symbol
 * @param {string} tokenOut - Output token address sau symbol
 * @returns {boolean} True dacă cel puțin un token este Bitcoin
 */
export function isBitcoinPair(tokenIn, tokenOut) {
  return isBitcoinToken(tokenIn) || isBitcoinToken(tokenOut);
}

/**
 * Normalize Bitcoin token symbol pentru market data
 * @param {string} token - Token symbol sau address
 * @returns {string} Normalized token symbol (BTC pentru CoinGecko)
 */
export function normalizeBitcoinTokenForMarketData(token) {
  if (isBitcoinToken(token)) {
    return 'BTC'; // Toate Bitcoin tokens folosesc BTC price de la CoinGecko
  }
  return token;
}

/**
 * Format Bitcoin token pentru display/logging
 * @param {string} token - Token address sau symbol
 * @returns {Object} Formatted token info
 */
export function formatBitcoinTokenForDisplay(token) {
  const tokenObj = getBitcoinTokenByAddress(token) || getBitcoinTokenBySymbol(token);
  
  if (!tokenObj) {
    return {
      symbol: token,
      name: 'Unknown Token',
      isBitcoin: false
    };
  }
  
  return {
    symbol: tokenObj.symbol,
    name: tokenObj.name,
    address: tokenObj.address,
    description: tokenObj.description,
    isBitcoin: true,
    isMostLiquid: tokenObj.symbol === 'BTCB'
  };
}

/**
 * Get toate Bitcoin tokens
 * @returns {Array} Array cu toate Bitcoin tokens
 */
export function getAllBitcoinTokens() {
  return Object.values(BITCOIN_TOKENS);
}

// ============ EXPORTS ============

export default {
  BITCOIN_TOKENS,
  BITCOIN_TOKEN_ADDRESSES,
  BITCOIN_TOKEN_SYMBOLS,
  isBitcoinToken,
  areBitcoinEquivalents,
  getMostLiquidBitcoinToken,
  isBitcoinArbitragePair,
  getBestBitcoinTokenForTrade,
  getBitcoinTokenByAddress,
  getBitcoinTokenBySymbol,
  getEquivalentBitcoinToken,
  isBitcoinPair,
  normalizeBitcoinTokenForMarketData,
  formatBitcoinTokenForDisplay,
  getAllBitcoinTokens
};

