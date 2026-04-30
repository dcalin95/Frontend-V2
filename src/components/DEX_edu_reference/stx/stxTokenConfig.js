/**
 * stxTokenConfig.js – Lista de tokeni și perechi STX (SIP-010). SSOT pentru TokenSelector.stx și Swap/Trade.
 * Aliniat cu stxConfig.js (STX_TOKENS); extins cu perechi și logo-uri (CoinGecko + local ALEX).
 */

import alexTokenLogo from '../../../assets/icons/alex-token.png';

/* CoinGecko: API returnează coin-images; assets poate 404. Folosim URL-uri verificate. */
const CG_IMAGES = 'https://coin-images.coingecko.com/coins/images';
const CG_ASSETS = 'https://assets.coingecko.com/coins/images';

/** URL logo per simbol. ALEX: logo local; restul: CoinGecko. Fallback în UI la inițială dacă eșuează. */
export const STX_TOKEN_ICONS = {
  STX: `${CG_IMAGES}/2069/large/Stacks_Logo_png.png`,
  USDA: `${CG_IMAGES}/6319/large/USDC.png`,
  sBTC: `${CG_IMAGES}/1/large/bitcoin.png`,
  xBTC: `${CG_IMAGES}/1/large/bitcoin.png`,
  ALEX: alexTokenLogo,
};

/** URL-uri alternative (assets) pentru retry la onError. ALEX: tot logo local. */
const STX_TOKEN_ICONS_ALT = {
  STX: `${CG_ASSETS}/2069/large/Stacks_Logo_png.png`,
  USDA: `${CG_ASSETS}/6319/large/USDC.png`,
  sBTC: `${CG_ASSETS}/1/large/bitcoin.png`,
  xBTC: `${CG_ASSETS}/1/large/bitcoin.png`,
  ALEX: alexTokenLogo,
};

/** Tokeni unici pentru selector (swap From/To). */
export const STX_TOKENS = [
  { id: 'STX', symbol: 'STX', name: 'Stacks', decimals: 6, native: true, icon: STX_TOKEN_ICONS.STX },
  { id: 'USDA', symbol: 'USDA', name: 'USDA', decimals: 6, native: false, icon: STX_TOKEN_ICONS.USDA },
  { id: 'sBTC', symbol: 'sBTC', name: 'Synthetic Bitcoin', decimals: 8, native: false, icon: STX_TOKEN_ICONS.sBTC },
  { id: 'xBTC', symbol: 'xBTC', name: 'Wrapped Bitcoin', decimals: 8, native: false, icon: STX_TOKEN_ICONS.xBTC },
  { id: 'ALEX', symbol: 'ALEX', name: 'Alex', decimals: 8, native: false, icon: STX_TOKEN_ICONS.ALEX },
];

/** Perechi pentru Trade/Header (base/quote). */
export const STX_PAIRS = [
  { id: 'STX/USDA', base: 'STX', quote: 'USDA', label: 'STX / USDA' },
  { id: 'STX/sBTC', base: 'STX', quote: 'sBTC', label: 'STX / sBTC' },
  { id: 'STX/xBTC', base: 'STX', quote: 'xBTC', label: 'STX / xBTC' },
  { id: 'STX/ALEX', base: 'STX', quote: 'ALEX', label: 'STX / ALEX' },
  { id: 'sBTC/USDA', base: 'sBTC', quote: 'USDA', label: 'sBTC / USDA' },
  { id: 'sBTC/xBTC', base: 'sBTC', quote: 'xBTC', label: 'sBTC / xBTC' },
  { id: 'sBTC/ALEX', base: 'sBTC', quote: 'ALEX', label: 'sBTC / ALEX' },
  { id: 'USDA/xBTC', base: 'USDA', quote: 'xBTC', label: 'USDA / xBTC' },
  { id: 'USDA/ALEX', base: 'USDA', quote: 'ALEX', label: 'USDA / ALEX' },
  { id: 'xBTC/ALEX', base: 'xBTC', quote: 'ALEX', label: 'xBTC / ALEX' },
];

/** Listă simplă pentru variant='token' (id = symbol). */
export const STX_TOKENS_SINGLE = STX_TOKENS.map((t) => ({
  id: t.id,
  symbol: t.symbol,
  label: t.name ? `${t.symbol} (${t.name})` : t.symbol,
}));

/** Listă perechi cu label pentru variant='pair'. */
export const STX_PAIRS_LIST = STX_PAIRS.map((p) => ({
  id: p.id,
  symbol: p.id,
  label: p.label,
}));

/** Returnează URL logo pentru simbol (ex: 'STX', 'sBTC'). */
export function getTokenIcon(symbol) {
  if (!symbol) return null;
  return STX_TOKEN_ICONS[symbol] ?? null;
}

/** Returnează URL alternativ pentru logo (retry la onError). */
export function getTokenIconAlt(symbol) {
  if (!symbol) return null;
  return STX_TOKEN_ICONS_ALT[symbol] ?? null;
}

/** Returnează [iconBase, iconQuote] pentru pereche (ex: 'STX/USDA'). */
export function getPairIcons(pairId) {
  const pair = STX_PAIRS.find((p) => p.id === pairId);
  if (!pair) return [null, null];
  return [getTokenIcon(pair.base), getTokenIcon(pair.quote)];
}

/** Pereche → symbol TradingView (BINANCE) pentru chart pe /dex-edu/ota/stx. */
export const STX_PAIR_TO_CHART_SYMBOL = {
  'STX/USDA': 'BINANCE:STXUSDT',
  'STX/sBTC': 'BINANCE:STXUSDT',
  'STX/xBTC': 'BINANCE:STXUSDT',
  'STX/ALEX': 'BINANCE:STXUSDT',
  'sBTC/USDA': 'BINANCE:BTCUSDT',
  'sBTC/xBTC': 'BINANCE:BTCUSDT',
  'sBTC/ALEX': 'BINANCE:BTCUSDT',
  'USDA/xBTC': 'BINANCE:BTCUSDT',
  'USDA/ALEX': 'BINANCE:STXUSDT',
  'xBTC/ALEX': 'BINANCE:BTCUSDT',
};

export default { STX_TOKENS, STX_PAIRS, STX_TOKENS_SINGLE, STX_PAIRS_LIST, STX_TOKEN_ICONS, STX_PAIR_TO_CHART_SYMBOL, getTokenIcon, getPairIcons };
