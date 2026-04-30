/**
 * SEI Token Config – Oxium-style listă tokeni și perechi
 * SSOT pentru TokenSelector.sei, SwapPanel.sei, OtaSeiMicroProfitPanel.
 *
 * Env vars pentru symbolToDenom (mainnet/Atlantic-2):
 * - REACT_APP_SEI_USDC_DENOM (default: uusdc)
 * - REACT_APP_SEI_USDT_DENOM (default: USDC denom sau uusdc)
 * - REACT_APP_SEI_WETH_DENOM (fallback: usei – setează denom real pentru WETH)
 * - REACT_APP_SEI_ATOM_DENOM (fallback: usei – setează denom real pentru ATOM)
 * - REACT_APP_SEI_SOL_DENOM (fallback: usei – setează denom real pentru SOL)
 */

/** Tokeni SEI (Cosmos denom / symbol) – aliniat cu Oxium: SEI, USDC, USDT, WETH, ATOM, SOL */
export const SEI_TOKENS = [
  { symbol: 'SEI', name: 'Sei', denom: 'usei', decimals: 6, displayOrder: 1 },
  { symbol: 'USDC', name: 'USD Coin', denom: null, decimals: 6, displayOrder: 2 }, // env REACT_APP_SEI_USDC_DENOM
  { symbol: 'USDT', name: 'Tether USD', denom: null, decimals: 6, displayOrder: 3 }, // env REACT_APP_SEI_USDT_DENOM
  { symbol: 'WETH', name: 'Wrapped Ether', denom: null, decimals: 18, displayOrder: 4 },
  { symbol: 'ATOM', name: 'ATOM', denom: null, decimals: 6, displayOrder: 5 },
  { symbol: 'SOL', name: 'Solana', denom: null, decimals: 6, displayOrder: 6 },
];

/** Pereche default pentru SEI Auto (base SEI + stablecoin) */
export const SEI_AUTO_DEFAULT_PAIR = 'SEI/ATOM';

/** ID-uri valide pentru SEI Auto */
export const SEI_AUTO_PAIR_IDS = ['SEI/ATOM', 'SEI/USDC', 'SEI/USDT'];

/** Perechi disponibile pentru SEI Auto */
export const SEI_AUTO_PAIRS = [
  { id: 'SEI/ATOM', base: 'SEI', quote: 'ATOM', label: 'SEI / ATOM' },
  { id: 'SEI/USDC', base: 'SEI', quote: 'USDC', label: 'SEI / USDC' },
  { id: 'SEI/USDT', base: 'SEI', quote: 'USDT', label: 'SEI / USDT' },
];

/** Perechi de tranzacționare – Oxium-style (base/quote) */
export const SEI_PAIRS = [
  { id: 'SEI/USDC', base: 'SEI', quote: 'USDC', label: 'SEI / USDC', displayOrder: 1 },
  { id: 'SEI/USDT', base: 'SEI', quote: 'USDT', label: 'SEI / USDT', displayOrder: 2 },
  { id: 'WETH/USDC', base: 'WETH', quote: 'USDC', label: 'WETH / USDC', displayOrder: 3 },
  { id: 'WETH/SEI', base: 'WETH', quote: 'SEI', label: 'WETH / SEI', displayOrder: 4 },
  { id: 'ATOM/SEI', base: 'ATOM', quote: 'SEI', label: 'ATOM / SEI', displayOrder: 5 },
  { id: 'ATOM/USDC', base: 'ATOM', quote: 'USDC', label: 'ATOM / USDC', displayOrder: 6 },
  { id: 'SOL/SEI', base: 'SOL', quote: 'SEI', label: 'SOL / SEI', displayOrder: 7 },
  { id: 'SOL/USDC', base: 'SOL', quote: 'USDC', label: 'SOL / USDC', displayOrder: 8 },
];

/** Decimals per token (pentru toMinimalUnits) */
export function getTokenDecimals(symbol) {
  if (!symbol) return 6;
  const s = String(symbol).toUpperCase();
  if (s === 'WETH') return 18;
  return 6;
}

/** Denom -> symbol pentru API quote (backend folosește symbol) */
export function denomToSymbol(denom) {
  if (!denom) return 'SEI';
  const d = String(denom).toLowerCase();
  if (d === 'usei') return 'SEI';
  if (d === 'uusdc' || d.includes('usdc')) return 'USDC';
  if (d.includes('usdt')) return 'USDT';
  if (d.includes('weth')) return 'WETH';
  if (d.includes('atom')) return 'ATOM';
  if (d.includes('sol')) return 'SOL';
  return 'SEI';
}

/**
 * Symbol -> denom pentru contract CosmWasm.
 * WETH/ATOM/SOL: setează REACT_APP_SEI_WETH_DENOM etc. pe mainnet; fallback usei pe testnet.
 * @param {string} symbol - SEI, USDC, USDT, WETH, ATOM, SOL
 * @returns {string} denom (ex: usei, uusdc)
 */
export function symbolToDenom(symbol) {
  if (!symbol) return 'usei';
  const s = String(symbol).toUpperCase();
  if (s === 'SEI') return 'usei';
  if (s === 'USDC') return process.env.REACT_APP_SEI_USDC_DENOM || 'uusdc';
  if (s === 'USDT') return process.env.REACT_APP_SEI_USDT_DENOM || process.env.REACT_APP_SEI_USDC_DENOM || 'uusdc';
  if (s === 'WETH') return process.env.REACT_APP_SEI_WETH_DENOM || 'usei';
  if (s === 'ATOM') return process.env.REACT_APP_SEI_ATOM_DENOM || 'ibc/6CDD4663F2F09CD62285E2D45891FC149A3568E316CE3EBBE201A71A78A69388';
  if (s === 'SOL') return process.env.REACT_APP_SEI_SOL_DENOM || 'usei';
  return 'usei';
}

/**
 * Astroport pool addresses pe SEI pacific-1 mainnet.
 * Verificate on-chain via factory query.
 */
export const ASTROPORT_POOLS = {
  SEI_ATOM_XYK: {
    pairAddress: 'sei14kxy2g2cw37ng0mmyk6u54qq7xxxnksyhwcvsaf57g30q7ym23vqlmjpm0',
    lpTokenAddress: 'sei1heaumavd6zxggcyzvqgy4htw4je3pl59gv9s4s3grujmtyw6kraqrxnskl',
    baseDenom: 'usei',
    quoteDenom: 'ibc/6CDD4663F2F09CD62285E2D45891FC149A3568E316CE3EBBE201A71A78A69388',
    baseSymbol: 'SEI',
    quoteSymbol: 'ATOM',
    baseDecimals: 6,
    quoteDecimals: 6,
    feePercent: 0.3,
    label: 'SEI / ATOM',
    pairType: 'xyk',
  },
  SEI_USDC_CL: {
    pairAddress: 'sei1ltr0r989uds8y0gahfl6uqec5rqulks06fyugpre0syml8ul0jtsjgv69c',
    lpTokenAddress: null, // CL pools use NFT positions, not LP tokens
    baseDenom: 'usei',
    quoteDenom: 'ibc/CA6FBFAF399474A06263E10D0CE5AEBBE15189D6D4B2DD9ADE61007E68EB9DB0',
    baseSymbol: 'SEI',
    quoteSymbol: 'USDC',
    baseDecimals: 6,
    quoteDecimals: 6,
    feePercent: 0.05,
    label: 'SEI / USDC',
    pairType: 'concentrated',
  },
};

/** Pereche TradingView (BINANCE) pentru chart */
export const SEI_PAIR_TO_CHART_SYMBOL = {
  'SEI/USDC': 'BINANCE:SEIUSDT',
  'SEI/USDT': 'BINANCE:SEIUSDT',
  'WETH/USDC': 'BINANCE:ETHUSDT',
  'WETH/SEI': 'BINANCE:ETHUSDT',
  'ATOM/SEI': 'BINANCE:ATOMUSDT',
  'ATOM/USDC': 'BINANCE:ATOMUSDT',
  'SOL/SEI': 'BINANCE:SOLUSDT',
  'SOL/USDC': 'BINANCE:SOLUSDT',
};
