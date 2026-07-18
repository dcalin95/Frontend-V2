/**
 * 🪙 Token Registry Service - SINGLE SOURCE OF TRUTH
 * 
 * Centralized token registry for all DEX components:
 * - SwapPanel
 * - LimitOrderPanel
 * - OTA AI
 * - Portfolio
 * - Custom user-added tokens support
 * 
 * @module tokenRegistry
 */

import { getCombinedTokens, getCustomTokens } from '../utils/customTokenManager';

/**
 * Stable folosit ca quote implicit în UI DEX BSC (Limit/Swap): USDC recomandat UE; suprascrie cu REACT_APP_BSC_QUOTE_SYMBOL (ex. USDT legacy).
 */
export const DEFAULT_BSC_QUOTE_SYMBOL = (() => {
  const q = String(process.env.REACT_APP_BSC_QUOTE_SYMBOL || 'USDC').trim().toUpperCase();
  return q || 'USDC';
})();

/**
 * Token definition with all metadata needed across the app
 * @typedef {Object} Token
 * @property {string} symbol - Token symbol (e.g., 'BTC', 'USDT')
 * @property {string} name - Full token name
 * @property {string|null} address - Contract address on BSC (null for native BNB)
 * @property {number} decimals - Token decimals
 * @property {string} logoUrl - URL to token logo (optional)
 * @property {boolean} isNative - Whether this is the native token (BNB)
 * @property {boolean} isStablecoin - Whether this is a stablecoin
 * @property {string} type - Token type: 'native' | 'erc20' | 'stablecoin' | 'custom'
 * @property {number} displayOrder - Order to display in lists (lower = higher priority)
 * @property {boolean} [isCustom] - Whether this is a user-added custom token
 */

/**
 * ADDING TOKENS
 * -------------
 * 1) Built-in (aici în TOKEN_REGISTRY): adaugă un obiect nou cu symbol, name, address (BSC), decimals, displayOrder.
 *    Exemplu: MATIC este deja adăugat. Pentru alt token, găsește adresa pe BscScan și adaugă în TOKEN_REGISTRY.
 * 2) Manual / custom (la runtime): folosește customTokenManager.addCustomToken({ symbol, name, address, decimals }).
 *    Tokenii custom sunt salvați în localStorage și apar în getAllTokens() (deci în toate selectoarele).
 *    UI pentru "Adaugă token" poate apela addCustomToken() după ce userul introduce symbol, name, address.
 */

/**
 * MASTER TOKEN REGISTRY - BSC Mainnet
 * This is the SINGLE SOURCE OF TRUTH for all tokens in the application
 */
export const TOKEN_REGISTRY = {
  // Native token
  BNB: {
    symbol: 'BNB',
    name: 'Binance Coin',
    address: null, // Native token (no contract address)
    decimals: 18,
    logoUrl: null,
    isNative: true,
    isStablecoin: false,
    type: 'native',
    displayOrder: 1
  },

  // Wrapped Bitcoin
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin (Binance-Peg)',
    address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
    decimals: 18,
    logoUrl: null,
    isNative: false,
    isStablecoin: false,
    type: 'erc20',
    displayOrder: 2
  },

  // Stablecoins (USDC listat primul pentru piețe UE; USDT rămâne în registry pentru compatibilitate)
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin (Binance-Peg BSC)',
    address: process.env.REACT_APP_BSC_USDC_ADDRESS || '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    decimals: 18,
    logoUrl: null,
    isNative: false,
    isStablecoin: true,
    type: 'stablecoin',
    displayOrder: 3
  },

  USDT: {
    symbol: 'USDT',
    name: 'Tether USD (Binance-Peg)',
    address: process.env.REACT_APP_BSC_USDT_ADDRESS || '0x55d398326f99059fF775485246999027B3197955',
    decimals: 18,
    logoUrl: null,
    isNative: false,
    isStablecoin: true,
    type: 'stablecoin',
    displayOrder: 4
  },

  BUSD: {
    symbol: 'BUSD',
    name: 'Binance USD',
    address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    decimals: 18,
    logoUrl: null,
    isNative: false,
    isStablecoin: true,
    type: 'stablecoin',
    displayOrder: 7
  },

  // BITS Token
  BITS: {
    symbol: 'BITS',
    name: 'BITS Token',
    address: '0xCE056ee6ED7Ae0944f10BAfc5E7f5d160c8641fe',
    decimals: 18,
    logoUrl: null,
    isNative: false,
    isStablecoin: false,
    type: 'erc20',
    displayOrder: 5
  },

  // Wrapped Ethereum
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum (Binance-Peg)',
    address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    decimals: 18,
    logoUrl: null,
    isNative: false,
    isStablecoin: false,
    type: 'erc20',
    displayOrder: 6
  },

  // Solana
  SOL: {
    symbol: 'SOL',
    name: 'Solana (BSC-Bridge)',
    address: '0x570a5d26f7765ecb712c0924e4de545b89fd43df', // Verified on BscScan
    decimals: 18,
    logoUrl: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
    isNative: false,
    isStablecoin: false,
    type: 'erc20',
    displayOrder: 8
  },

  // Polygon (Wrapped MATIC on BSC)
  MATIC: {
    symbol: 'MATIC',
    name: 'Polygon (Binance-Peg)',
    address: '0xcc42724c6683b7e57334c4e856f4c9965ed682bd',
    decimals: 18,
    logoUrl: null,
    isNative: false,
    isStablecoin: false,
    type: 'erc20',
    displayOrder: 9
  },

  // PancakeSwap (BSC) – mai mult spațiu de speculație vs BNB
  CAKE: {
    symbol: 'CAKE',
    name: 'PancakeSwap',
    address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
    decimals: 18,
    logoUrl: null,
    isNative: false,
    isStablecoin: false,
    type: 'erc20',
    displayOrder: 10
  },

  // High risk / volatility
  DOGE: {
    symbol: 'DOGE',
    name: 'Dogecoin (Binance-Peg)',
    address: '0xba2ae424d960c26247dd6c32edc70b295c744c43',
    decimals: 8, // Binance-Peg DOGE pe BSC are 8 decimals, nu 18
    logoUrl: null,
    isNative: false,
    isStablecoin: false,
    type: 'erc20',
    displayOrder: 20
  },
  SHIB: {
    symbol: 'SHIB',
    name: 'Shiba Inu (Binance-Peg)',
    address: '0x2859e4544c4bb03966803b044a93563bd2d0dd4d',
    decimals: 18,
    logoUrl: null,
    isNative: false,
    isStablecoin: false,
    type: 'erc20',
    displayOrder: 21
  },

  // OTA candidați (Binance-Peg pe BSC)
  XRP: {
    symbol: 'XRP',
    name: 'XRP (Binance-Peg)',
    address: '0x1d2f0da169ceb9fc7b3144628db156f3f6c60dbe',
    decimals: 18,
    logoUrl: null,
    isNative: false,
    isStablecoin: false,
    type: 'erc20',
    displayOrder: 22
  },
  ADA: {
    symbol: 'ADA',
    name: 'Cardano (Binance-Peg)',
    address: '0x3ee2200efb3400fabb9aacf31297cbdd1d435d47',
    decimals: 18,
    logoUrl: null,
    isNative: false,
    isStablecoin: false,
    type: 'erc20',
    displayOrder: 23
  },
  LINK: {
    symbol: 'LINK',
    name: 'Chainlink (Binance-Peg)',
    address: '0xf8a0bf9cf54bb92f17374d9e9a321e6a111a51bd',
    decimals: 18,
    logoUrl: null,
    isNative: false,
    isStablecoin: false,
    type: 'erc20',
    displayOrder: 24
  },
  AVAX: {
    symbol: 'AVAX',
    name: 'Avalanche (Binance-Peg)',
    address: '0x1CE0c2827e2eF14D5C4f29a091d735A204794041',
    decimals: 18,
    logoUrl: null,
    isNative: false,
    isStablecoin: false,
    type: 'erc20',
    displayOrder: 25
  },
  STX: {
    symbol: 'STX',
    name: 'Stacks (Binance-Peg)',
    address: '0x0104f019c8889BdabC62aE6C7b84F6f2ed351133',
    decimals: 18,
    logoUrl: null,
    isNative: false,
    isStablecoin: false,
    type: 'erc20',
    displayOrder: 26
  }
};

/**
 * Get all tokens as an array, sorted by displayOrder
 * INCLUDES custom user-added tokens
 * @returns {Token[]} Array of all tokens (registry + custom)
 */
export function getAllTokens() {
  return getCombinedTokens(TOKEN_REGISTRY);
}

/**
 * Get token by symbol (checks both registry and custom tokens)
 * @param {string} symbol - Token symbol (case-insensitive)
 * @returns {Token|null} Token object or null if not found
 */
export function getToken(symbol) {
  if (!symbol) return null;
  const normalized = symbol.toUpperCase();
  
  // Check registry first
  if (TOKEN_REGISTRY[normalized]) {
    return TOKEN_REGISTRY[normalized];
  }
  
  // Check custom tokens
  const customTokens = getCustomTokens();
  return customTokens[normalized] || null;
}

/**
 * Get token address by symbol
 * @param {string} symbol - Token symbol (case-insensitive)
 * @returns {string|null} Token address or null if not found or native
 */
export function getTokenAddress(symbol) {
  const token = getToken(symbol);
  return token?.address || null;
}

/**
 * Get all token symbols
 * @returns {string[]} Array of token symbols
 */
export function getAllTokenSymbols() {
  return getAllTokens().map(token => token.symbol);
}

/**
 * Get all ERC20 tokens (excludes native BNB)
 * @returns {Token[]} Array of ERC20 tokens
 */
export function getERC20Tokens() {
  return getAllTokens().filter(token => !token.isNative);
}

/**
 * Get all stablecoins
 * @returns {Token[]} Array of stablecoin tokens
 */
export function getStablecoins() {
  return getAllTokens().filter(token => token.isStablecoin);
}

/**
 * Check if a token exists in the registry
 * @param {string} symbol - Token symbol (case-insensitive)
 * @returns {boolean} True if token exists
 */
export function hasToken(symbol) {
  return getToken(symbol) !== null;
}

/**
 * Get token decimals
 * @param {string} symbol - Token symbol (case-insensitive)
 * @returns {number} Token decimals (defaults to 18 if not found)
 */
export function getTokenDecimals(symbol) {
  const token = getToken(symbol);
  return token?.decimals || 18;
}

/**
 * Check if token is native BNB
 * @param {string} symbol - Token symbol (case-insensitive)
 * @returns {boolean} True if native token
 */
export function isNativeToken(symbol) {
  const token = getToken(symbol);
  return token?.isNative || false;
}

/**
 * Check if token is a stablecoin
 * @param {string} symbol - Token symbol (case-insensitive)
 * @returns {boolean} True if stablecoin
 */
export function isStablecoin(symbol) {
  const token = getToken(symbol);
  return token?.isStablecoin || false;
}

/**
 * Legacy compatibility: TOKEN_ADDRESSES object for backward compatibility
 * @deprecated Use getTokenAddress() instead
 */
export const TOKEN_ADDRESSES = Object.fromEntries(
  Object.entries(TOKEN_REGISTRY).map(([symbol, token]) => [symbol, token.address])
);

// Default export for convenient imports
export default {
  TOKEN_REGISTRY,
  TOKEN_ADDRESSES,
  DEFAULT_BSC_QUOTE_SYMBOL,
  getAllTokens,
  getToken,
  getTokenAddress,
  getAllTokenSymbols,
  getERC20Tokens,
  getStablecoins,
  hasToken,
  getTokenDecimals,
  isNativeToken,
  isStablecoin
};
