/**
 * ₿ Bitcoin Tokens - Backend Constants & Helpers
 * 
 * Bitcoin token constants și helper functions pentru backend (Oxium-inspired):
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
const BITCOIN_TOKENS = {
  WBTC: {
    address: '0x1CE0c2827e2eF14D5C4f29a091d735A204794041',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 18,
    coinGeckoId: 'bitcoin', // Same as BTC pentru price
    description: 'Wrapped Bitcoin (WBTC) - 1:1 backed by Bitcoin, custodied by Wrapped BTC DAO'
  },
  BTCB: {
    address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
    symbol: 'BTCB',
    name: 'Binance-Pegged Bitcoin',
    decimals: 18,
    coinGeckoId: 'bitcoin', // Same as BTC pentru price
    description: 'Binance-Pegged Bitcoin (BTCB) - 1:1 backed by Bitcoin, custodied by Binance'
  }
};

/**
 * Bitcoin token addresses array (pentru easy iteration)
 */
const BITCOIN_TOKEN_ADDRESSES = Object.values(BITCOIN_TOKENS).map(token => token.address);

/**
 * Bitcoin token symbols array
 */
const BITCOIN_TOKEN_SYMBOLS = Object.keys(BITCOIN_TOKENS);

// ============ HELPER FUNCTIONS (Oxium-Inspired) ============

/**
 * Verifică dacă un token este un Bitcoin token (WBTC sau BTCB)
 * @param {string} tokenAddress - Token address de verificat
 * @returns {boolean} True dacă token-ul este WBTC sau BTCB
 */
function isBitcoinToken(tokenAddress) {
  if (!tokenAddress) return false;
  
  const normalizedAddress = tokenAddress.toLowerCase();
  return Object.values(BITCOIN_TOKENS).some(
    token => token.address.toLowerCase() === normalizedAddress
  );
}

/**
 * Verifică dacă două tokens sunt Bitcoin equivalents (WBTC ↔ BTCB)
 * @param {string} token1 - First token address
 * @param {string} token2 - Second token address
 * @returns {boolean} True dacă ambele sunt Bitcoin tokens
 */
function areBitcoinEquivalents(token1, token2) {
  return isBitcoinToken(token1) && isBitcoinToken(token2);
}

/**
 * Get Bitcoin token cu cel mai mare liquidity (pentru routing)
 * @returns {Object} Bitcoin token cu cel mai mare liquidity (BTCB pe BSC)
 */
function getMostLiquidBitcoinToken() {
  return BITCOIN_TOKENS.BTCB; // BTCB este cel mai lichid pe BSC
}

/**
 * Check dacă un pair este un Bitcoin arbitrage pair (WBTC/BTCB)
 * @param {string} tokenIn - Input token address
 * @param {string} tokenOut - Output token address
 * @returns {boolean} True dacă este arbitrage pair
 */
function isBitcoinArbitragePair(tokenIn, tokenOut) {
  return areBitcoinEquivalents(tokenIn, tokenOut);
}

/**
 * Get Bitcoin token pentru promise (prefer BTCB pentru liquidity)
 * @param {string} preferredToken - Preferred token address (opțional)
 * @returns {Object} Bitcoin token pentru promise
 */
function getBitcoinTokenForPromise(preferredToken) {
  if (preferredToken && isBitcoinToken(preferredToken)) {
    return Object.values(BITCOIN_TOKENS).find(
      token => token.address.toLowerCase() === preferredToken.toLowerCase()
    );
  }
  return getMostLiquidBitcoinToken(); // Default: BTCB
}

/**
 * Get equivalent Bitcoin token (WBTC ↔ BTCB)
 * @param {string} token - Bitcoin token address
 * @returns {Object|null} Equivalent token (BTCB pentru WBTC, WBTC pentru BTCB)
 */
function getEquivalentBitcoinToken(token) {
  if (!token) return null;
  
  const normalizedToken = token.toLowerCase();
  
  if (normalizedToken === BITCOIN_TOKENS.WBTC.address.toLowerCase()) {
    return BITCOIN_TOKENS.BTCB;
  }
  if (normalizedToken === BITCOIN_TOKENS.BTCB.address.toLowerCase()) {
    return BITCOIN_TOKENS.WBTC;
  }
  
  return null; // Not a Bitcoin token
}

/**
 * Check dacă un token este cel mai lichid Bitcoin token
 * @param {string} token - Token address
 * @returns {boolean} True dacă token-ul este BTCB (cel mai lichid)
 */
function isMostLiquidBitcoinToken(token) {
  if (!token) return false;
  return token.toLowerCase() === BITCOIN_TOKENS.BTCB.address.toLowerCase();
}

/**
 * Get toate Bitcoin tokens
 * @returns {Array} Array cu toate Bitcoin tokens
 */
function getAllBitcoinTokens() {
  return Object.values(BITCOIN_TOKENS);
}

/**
 * Get Bitcoin token by address
 * @param {string} address - Token address
 * @returns {Object|null} Bitcoin token sau null
 */
function getBitcoinTokenByAddress(address) {
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
function getBitcoinTokenBySymbol(symbol) {
  if (!symbol) return null;
  
  const normalizedSymbol = symbol.toUpperCase();
  return BITCOIN_TOKENS[normalizedSymbol] || null;
}

/**
 * Get Bitcoin token name
 * @param {string} tokenAddress - Token address
 * @returns {string} Token name (WBTC sau BTCB) sau 'UNKNOWN'
 */
function getBitcoinTokenName(tokenAddress) {
  const token = getBitcoinTokenByAddress(tokenAddress);
  return token ? token.name : 'UNKNOWN';
}

/**
 * Get Bitcoin token symbol
 * @param {string} tokenAddress - Token address
 * @returns {string} Token symbol (WBTC sau BTCB) sau 'UNKNOWN'
 */
function getBitcoinTokenSymbol(tokenAddress) {
  const token = getBitcoinTokenByAddress(tokenAddress);
  return token ? token.symbol : 'UNKNOWN';
}

/**
 * Check dacă un pair este un Bitcoin pair (cel puțin un token este Bitcoin)
 * @param {string} tokenIn - Input token address
 * @param {string} tokenOut - Output token address
 * @returns {boolean} True dacă cel puțin un token este Bitcoin
 */
function isBitcoinPair(tokenIn, tokenOut) {
  return isBitcoinToken(tokenIn) || isBitcoinToken(tokenOut);
}

/**
 * Get best Bitcoin token pentru trade (routing optimization)
 * @param {string} tokenIn - Input token address
 * @param {string} tokenOut - Output token address
 * @returns {Object|null} Best Bitcoin token pentru routing sau null
 */
function getBestBitcoinTokenForTrade(tokenIn, tokenOut) {
  // Dacă ambele sunt Bitcoin tokens, folosim cel mai lichid
  if (areBitcoinEquivalents(tokenIn, tokenOut)) {
    return getMostLiquidBitcoinToken(); // BTCB
  }
  
  // Dacă unul e Bitcoin, folosim acela
  if (isBitcoinToken(tokenIn)) {
    return getBitcoinTokenByAddress(tokenIn);
  }
  if (isBitcoinToken(tokenOut)) {
    return getBitcoinTokenByAddress(tokenOut);
  }
  
  // Nu e Bitcoin trade
  return null;
}

/**
 * Resolve Bitcoin token symbol to address
 * @param {string} symbol - Token symbol (WBTC, BTCB, BTC)
 * @returns {string|null} Token address sau null
 */
function resolveBitcoinTokenAddress(symbol) {
  if (!symbol) return null;
  
  const normalizedSymbol = symbol.toUpperCase();
  
  // Support pentru BTC, WBTC, BTCB
  if (normalizedSymbol === 'BTC' || normalizedSymbol === 'WBTC') {
    return BITCOIN_TOKENS.WBTC.address;
  }
  if (normalizedSymbol === 'BTCB') {
    return BITCOIN_TOKENS.BTCB.address;
  }
  
  // Check dacă e deja un address
  if (symbol.startsWith('0x') && symbol.length === 42) {
    if (isBitcoinToken(symbol)) {
      return symbol.toLowerCase();
    }
  }
  
  return null;
}

/**
 * Format Bitcoin token pentru display/logging
 * @param {string} tokenAddress - Token address
 * @returns {Object} Formatted token info
 */
function formatBitcoinTokenForDisplay(tokenAddress) {
  const token = getBitcoinTokenByAddress(tokenAddress);
  
  if (!token) {
    return {
      symbol: 'UNKNOWN',
      name: 'Unknown Token',
      address: tokenAddress,
      isBitcoin: false
    };
  }
  
  return {
    symbol: token.symbol,
    name: token.name,
    address: token.address,
    description: token.description,
    isBitcoin: true,
    isMostLiquid: isMostLiquidBitcoinToken(token.address),
    coinGeckoId: token.coinGeckoId
  };
}

// ============ EXPORTS ============

module.exports = {
  BITCOIN_TOKENS,
  BITCOIN_TOKEN_ADDRESSES,
  BITCOIN_TOKEN_SYMBOLS,
  isBitcoinToken,
  areBitcoinEquivalents,
  getMostLiquidBitcoinToken,
  isBitcoinArbitragePair,
  getBitcoinTokenForPromise,
  getEquivalentBitcoinToken,
  isMostLiquidBitcoinToken,
  getAllBitcoinTokens,
  getBitcoinTokenByAddress,
  getBitcoinTokenBySymbol,
  getBitcoinTokenName,
  getBitcoinTokenSymbol,
  isBitcoinPair,
  getBestBitcoinTokenForTrade,
  resolveBitcoinTokenAddress,
  formatBitcoinTokenForDisplay
};

