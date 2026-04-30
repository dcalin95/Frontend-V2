/**
 * solTokenConfig.js – Lista de perechi și tokeni SOL + logo-uri (SSOT pentru UI SOL).
 * Folosit de TokenSelector.sol, SwapPanel, Header (slot SOL), SolSwapPage.
 */

const CG = 'https://assets.coingecko.com/coins/images';
const CG_ALT = 'https://coin-images.coingecko.com/coins/images';

/** URL logo per simbol (CoinGecko large). IDs verificate din CoinGecko API. */
export const SOL_TOKEN_ICONS = {
  SOL: `${CG}/4128/large/solana.png`,
  USDC: `${CG}/6319/large/usdc.png`,
  USDT: `${CG}/325/large/Tether.png`,
  BONK: `${CG}/28600/large/bonk.jpg`,
  JUP: `${CG}/34188/large/jup.png`,
  RAY: `${CG}/13928/large/PSigc4ie_400x400.jpg`,
  mSOL: `${CG}/17752/large/mSOL.png`,
};

/** URL-uri alternative (coin-images) când assets.coingecko.com eșuează. */
const SOL_TOKEN_ICONS_ALT = {
  SOL: `${CG_ALT}/4128/large/solana.png`,
  USDC: `${CG_ALT}/6319/large/usdc.png`,
  USDT: `${CG_ALT}/325/large/Tether.png`,
  BONK: `${CG_ALT}/28600/large/bonk.jpg`,
  JUP: `${CG_ALT}/34188/large/jup.png`,
  RAY: `${CG_ALT}/13928/large/PSigc4ie_400x400.jpg`,
  mSOL: `${CG_ALT}/17752/large/mSOL.png`,
};

/** Tokeni unici pentru selector (swap From/To). */
export const SOL_TOKENS = [
  { symbol: 'SOL', name: 'Solana', decimals: 9, icon: SOL_TOKEN_ICONS.SOL },
  { symbol: 'USDC', name: 'USD Coin', decimals: 6, icon: SOL_TOKEN_ICONS.USDC },
  { symbol: 'USDT', name: 'Tether', decimals: 6, icon: SOL_TOKEN_ICONS.USDT },
  { symbol: 'BONK', name: 'Bonk', decimals: 5, icon: SOL_TOKEN_ICONS.BONK },
  { symbol: 'JUP', name: 'Jupiter', decimals: 6, icon: SOL_TOKEN_ICONS.JUP },
  { symbol: 'RAY', name: 'Raydium', decimals: 6, icon: SOL_TOKEN_ICONS.RAY },
  { symbol: 'mSOL', name: 'Marinade SOL', decimals: 9, icon: SOL_TOKEN_ICONS.mSOL },
];

/** Perechi pentru Trade/Header (base/quote cu logo-uri). */
export const SOL_PAIRS = [
  { id: 'SOL/USDC', base: 'SOL', quote: 'USDC', label: 'SOL / USDC' },
  { id: 'SOL/USDT', base: 'SOL', quote: 'USDT', label: 'SOL / USDT' },
  { id: 'SOL/BONK', base: 'SOL', quote: 'BONK', label: 'SOL / BONK' },
  { id: 'SOL/JUP', base: 'SOL', quote: 'JUP', label: 'SOL / JUP' },
  { id: 'SOL/RAY', base: 'SOL', quote: 'RAY', label: 'SOL / RAY' },
  { id: 'SOL/mSOL', base: 'SOL', quote: 'mSOL', label: 'SOL / mSOL' },
  { id: 'USDC/USDT', base: 'USDC', quote: 'USDT', label: 'USDC / USDT' },
  { id: 'USDC/BONK', base: 'USDC', quote: 'BONK', label: 'USDC / BONK' },
  { id: 'JUP/USDC', base: 'JUP', quote: 'USDC', label: 'JUP / USDC' },
];

/**
 * Returnează URL-ul logo pentru un simbol.
 * @param {string} symbol - ex: 'SOL', 'USDC'
 * @returns {string|null}
 */
export function getTokenIcon(symbol) {
  if (!symbol) return null;
  return SOL_TOKEN_ICONS[symbol] ?? null;
}

/** Returnează URL alternativ pentru logo (pentru retry la onError). */
export function getTokenIconAlt(symbol) {
  if (!symbol) return null;
  return SOL_TOKEN_ICONS_ALT[symbol] ?? null;
}

/**
 * Returnează [iconBase, iconQuote] pentru o pereche (ex: 'SOL/USDC').
 * @param {string} pairId - ex: 'SOL/USDC'
 * @returns {[string|null, string|null]}
 */
export function getPairIcons(pairId) {
  const pair = SOL_PAIRS.find((p) => p.id === pairId);
  if (!pair) return [null, null];
  return [getTokenIcon(pair.base), getTokenIcon(pair.quote)];
}

export default { SOL_TOKEN_ICONS, SOL_TOKENS, SOL_PAIRS, getTokenIcon, getPairIcons };
