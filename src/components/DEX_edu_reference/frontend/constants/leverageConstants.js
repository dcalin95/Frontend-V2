/**
 * Constante pentru Trade with Leverage (Spot + CFD).
 * CFD (LeverageTradingV2): pe lanț `assetId` = bytes32 (`keccak256(utf8(symbol))`); UI folosește index 0..N−1
 * și `CFD_SYMBOLS` — vezi `useLeverageTrading` / `leverageUtils`.
 */
import { CONTRACT_MAP, getActiveNetwork } from '../../../../contract/contractMap';

const _active = typeof getActiveNetwork === 'function' ? getActiveNetwork() : null;
/** Chain ID așteptat pentru tranzacții live (același ca `contractMap` ACTIVE_NETWORK) */
export const EXPECTED_LEVERAGE_CHAIN_ID = _active?.chainId ?? 56;
/** Nume rețea (ex. BSC Mainnet) — afișare UI + mesaje switch network */
export const EXPECTED_LEVERAGE_CHAIN_NAME = _active?.name ?? 'BSC Mainnet';

/**
 * Spot leverage apelează un pool tip Aave (`ILendingPool`: deposit/borrow/repay/withdraw).
 * Venus Comptroller nu expune această interfață — până la un adapter/pool compatibil, UI-ul
 * blochează deschiderea de poziții spot; CFD rămâne activ.
 */
export const SPOT_LEVERAGE_UI_DISABLED = true;

/** Mesaj unic pentru banner + accesibilitate (EN — restul paginii Leverage e EN). */
export const SPOT_LEVERAGE_DISABLED_NOTICE =
  'Spot leverage is temporarily unavailable until a compatible on-chain lending integration (Aave-style ILendingPool or a Venus adapter) is in place. Venus Comptroller cannot be used as lendingPool. CFD trading remains fully available.';

export const LEVERAGE_OPTIONS = [
  { label: '2x', value: 20000 },
  { label: '3x', value: 30000 },
  { label: '5x', value: 50000 },
  { label: '10x', value: 100000 },
];

/** Leverage demo account: 30-day limit per (user, wallet) */
export const DEMO_ACCOUNT_DURATION_DAYS = 30;

/**
 * Solduri implicite cont demo — aliniat la backend `leverageDemoService` (open/reset DB).
 * Folosit ca placeholder UI până la GET account și la reset în LeveragePage.
 */
export const DEMO_DEFAULT_VAULT_BALANCES = Object.freeze({
  USDT: '10000',
  USDC: '0',
  BNB: '0',
  BITS: '0',
  EURS: '0',
  EURC: '0',
});

/**
 * Lista UI instrumente CFD (index = ordinea din `CFD_SYMBOLS` / keccak(symbol)).
 * chartSymbol = TradingView; priceToken = API preț (folosit și pentru logo în selector).
 */
export const CFD_ASSETS = [
  { id: 0, key: 'BTC_USD', label: 'BTC/USD', chartSymbol: 'BINANCE:BTCUSDT', priceToken: 'BTC' },
  { id: 1, key: 'ETH_USD', label: 'ETH/USD', chartSymbol: 'BINANCE:ETHUSDT', priceToken: 'ETH' },
  { id: 2, key: 'XAU_USD', label: 'Gold (XAU/USD)', chartSymbol: 'OANDA:XAUUSD', priceToken: 'XAU' },
  { id: 3, key: 'OIL_WTI_USD', label: 'Crude Oil (WTI/USD)', chartSymbol: 'TVC:USOIL', priceToken: 'OIL' },
  { id: 4, key: 'MATIC_USD', label: 'MATIC/USD', chartSymbol: 'BINANCE:MATICUSDT', priceToken: 'MATIC' },
  { id: 5, key: 'BNB_USD', label: 'BNB/USD', chartSymbol: 'BINANCE:BNBUSDT', priceToken: 'BNB' },
  { id: 6, key: 'LINK_USD', label: 'LINK/USD', chartSymbol: 'BINANCE:LINKUSDT', priceToken: 'LINK' },
  { id: 7, key: 'SOL_USD', label: 'SOL/USD', chartSymbol: 'BINANCE:SOLUSDT', priceToken: 'SOL' },
  { id: 8, key: 'XRP_USD', label: 'XRP/USD', chartSymbol: 'BINANCE:XRPUSDT', priceToken: 'XRP' },
  { id: 9, key: 'DOGE_USD', label: 'DOGE/USD', chartSymbol: 'BINANCE:DOGEUSDT', priceToken: 'DOGE' },
  { id: 10, key: 'ADA_USD', label: 'ADA/USD', chartSymbol: 'BINANCE:ADAUSDT', priceToken: 'ADA' },
  { id: 11, key: 'AVAX_USD', label: 'AVAX/USD', chartSymbol: 'BINANCE:AVAXUSDT', priceToken: 'AVAX' },
  // Indices & ETFs (Chainlink BSC + Yahoo chart)
  { id: 12, key: 'SPY_USD', label: 'S&P 500 ETF (SPY)', chartSymbol: 'AMEX:SPY', priceToken: 'SPY' },
  { id: 13, key: 'QQQ_USD', label: 'Nasdaq 100 ETF (QQQ)', chartSymbol: 'NASDAQ:QQQ', priceToken: 'QQQ' },
  // Forex majors (Chainlink BSC + Frankfurter public API for UI price)
  { id: 14, key: 'EUR_USD', label: 'EUR/USD', chartSymbol: 'FX_IDC:EURUSD', priceToken: 'EUR' },
  { id: 15, key: 'GBP_USD', label: 'GBP/USD', chartSymbol: 'FX_IDC:GBPUSD', priceToken: 'GBP' },
  { id: 16, key: 'JPY_USD', label: 'JPY/USD', chartSymbol: 'FX_IDC:USDJPY', priceToken: 'JPY' },
  { id: 17, key: 'AUD_USD', label: 'AUD/USD', chartSymbol: 'FX_IDC:AUDUSD', priceToken: 'AUD' },
  { id: 18, key: 'CHF_USD', label: 'CHF/USD', chartSymbol: 'FX_IDC:USDCHF', priceToken: 'CHF' },
  { id: 19, key: 'MXN_USD', label: 'MXN/USD', chartSymbol: 'FX_IDC:USDMXN', priceToken: 'MXN' },
  // US equities (Chainlink BSC equity feeds)
  { id: 20, key: 'AAPL_USD', label: 'Apple (AAPL)', chartSymbol: 'NASDAQ:AAPL', priceToken: 'AAPL' },
  { id: 21, key: 'MSFT_USD', label: 'Microsoft (MSFT)', chartSymbol: 'NASDAQ:MSFT', priceToken: 'MSFT' },
  { id: 22, key: 'NVDA_USD', label: 'NVIDIA (NVDA)', chartSymbol: 'NASDAQ:NVDA', priceToken: 'NVDA' },
  { id: 23, key: 'META_USD', label: 'Meta (META)', chartSymbol: 'NASDAQ:META', priceToken: 'META' },
  { id: 24, key: 'GOOGL_USD', label: 'Alphabet (GOOGL)', chartSymbol: 'NASDAQ:GOOGL', priceToken: 'GOOGL' },
  { id: 25, key: 'AMZN_USD', label: 'Amazon (AMZN)', chartSymbol: 'NASDAQ:AMZN', priceToken: 'AMZN' },
  { id: 26, key: 'TSLA_USD', label: 'Tesla (TSLA)', chartSymbol: 'NASDAQ:TSLA', priceToken: 'TSLA' },
];

/** Simboluri folosite on-chain (keccak utf8); ordinea = CFD_ASSETS id — forex ca pereche compactă (EURUSD) unde e cazul */
export const CFD_SYMBOLS = [
  'BTC', 'ETH', 'XAU', 'OIL', 'MATIC', 'BNB', 'LINK', 'SOL',
  'XRP', 'DOGE', 'ADA', 'AVAX',
  'SPY', 'QQQ',
  'EURUSD', 'GBPUSD', 'JPYUSD', 'AUDUSD', 'CHFUSD', 'MXNUSD',
  'AAPL', 'MSFT', 'NVDA', 'META', 'GOOGL', 'AMZN', 'TSLA',
];

/**
 * Parsează `?cfd=` din URL: index valid sau simbol (ex. BTC, XAU, XRP).
 * @returns {number|null} index valid sau null dacă lipsește / invalid
 */
export function parseCfdAssetQueryParam(raw) {
  if (raw == null || raw === '') return null;
  const t = String(raw).trim();
  if (t === '') return null;
  const maxIdx = CFD_SYMBOLS.length - 1;
  const n = Number(t);
  if (!Number.isNaN(n) && Number.isInteger(n) && n >= 0 && n <= maxIdx) return n;
  const sym = t.toUpperCase();
  let i = CFD_SYMBOLS.indexOf(sym);
  if (i >= 0) return i;
  const compact = sym.replace(/\//g, '').replace(/\s+/g, '');
  if (compact === 'SP500' || compact === 'US500') {
    const j = CFD_SYMBOLS.indexOf('SPY');
    if (j >= 0) return j;
  }
  if (compact === 'US100' || compact === 'NAS100') {
    const j = CFD_SYMBOLS.indexOf('QQQ');
    if (j >= 0) return j;
  }
  i = CFD_SYMBOLS.indexOf(compact);
  return i >= 0 ? i : null;
}

/**
 * Citește instrumentul din query: `cfd` are prioritate; `ctd` = alias pentru typo-uri / linkuri vechi.
 */
export function getRawCfdInstrumentQuery(searchParams) {
  if (!searchParams || typeof searchParams.get !== 'function') return null;
  const cfd = searchParams.get('cfd');
  if (cfd != null && cfd !== '') return cfd;
  const ctd = searchParams.get('ctd');
  return ctd != null && ctd !== '' ? ctd : null;
}

/**
 * Ultimul index CFD valid în UI (aliniat la `CFD_ASSETS` / `CFD_SYMBOLS`).
 * Folosit la navigare și formulare — nu mai folosiți magic number 7 (era limita veche doar crypto).
 */
export const MAX_CFD_ASSET_ID = CFD_ASSETS[CFD_ASSETS.length - 1]?.id ?? 0;

/**
 * Normalizează id-ul selectat în intervalul 0…MAX_CFD_ASSET_ID (rotunjire + clamp).
 */
export function normalizeCfdAssetId(raw) {
  const num = Math.round(Number(raw));
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(MAX_CFD_ASSET_ID, num));
}

/**
 * Domenii CFD în UI (tab-uri): Forex (FX) separat de indici/ETF; mărfuri separate; crypto separat.
 * `shortTabLabel` = text scurt pe buton; `tabHint` = subtitlu în panoul activ.
 */
export const CFD_NAV_GROUPS = [
  {
    id: 'forex',
    label: 'Forex (FX)',
    shortTabLabel: 'Forex · FX',
    tabHint: 'Major fiat pairs vs USD — not index futures',
    assetIds: [14, 15, 16, 17, 18, 19],
  },
  {
    id: 'crypto',
    label: 'Crypto',
    shortTabLabel: 'Crypto',
    tabHint: 'Crypto vs USD',
    assetIds: [0, 1, 4, 5, 6, 7, 8, 9, 10, 11],
  },
  {
    id: 'commodities',
    label: 'Commodities',
    shortTabLabel: 'Commodities',
    tabHint: 'Gold, crude oil',
    assetIds: [2, 3],
  },
  {
    id: 'indices',
    label: 'Indices & ETFs',
    shortTabLabel: 'S&P · Nasdaq',
    tabHint: 'ETF proxies (e.g. SPY, QQQ)',
    assetIds: [12, 13],
  },
  {
    id: 'equities',
    label: 'US Equities',
    shortTabLabel: 'US Stocks',
    tabHint: 'Single-name US equities',
    assetIds: [20, 21, 22, 23, 24, 25, 26],
  },
];

/** Domeniul (`CFD_NAV_GROUPS[].id`) care conține assetId, sau primul grup. */
export function getCfdDomainIdForAssetId(assetId) {
  const n = Number(assetId);
  if (!Number.isFinite(n)) return CFD_NAV_GROUPS[0]?.id ?? 'forex';
  for (const g of CFD_NAV_GROUPS) {
    if (g.assetIds.includes(n)) return g.id;
  }
  return CFD_NAV_GROUPS[0]?.id ?? 'forex';
}

/**
 * Prețuri CFD de urgență – folosite DOAR dacă OTA Market Data API este down la momentul
 * deschiderii unei poziții demo. În mod normal, useLeveragePage fetches prețuri reale live.
 * Actualizați periodic dacă API-ul rămâne frecvent indisponibil.
 */
export const DEMO_CFD_ENTRY_PRICES = {
  0: 97000, 1: 3500, 2: 2650, 3: 72, 4: 0.5, 5: 605, 6: 14, 7: 230,
  8: 2.2, 9: 0.15, 10: 0.45, 11: 22,
  12: 590, 13: 520,
  14: 1.08, 15: 1.27, 16: 0.0066, 17: 0.65, 18: 1.12, 19: 0.055,
  20: 220, 21: 420, 22: 120, 23: 520, 24: 180, 25: 190, 26: 350,
};

const BNB_NATIVE = '0x0000000000000000000000000000000000000000';

export function getTokenOptions() {
  return [
    { symbol: 'BNB', address: BNB_NATIVE },
    { symbol: 'BITS', address: CONTRACT_MAP?.BITS_TOKEN?.address || CONTRACT_MAP?.BITS?.address || '' },
    { symbol: 'USDT', address: CONTRACT_MAP?.USDT?.address || '' },
    { symbol: 'USDC', address: CONTRACT_MAP?.USDC?.address || '' },
    ...(CONTRACT_MAP?.EURS?.address ? [{ symbol: 'EURS', address: CONTRACT_MAP.EURS.address }] : []),
    ...(CONTRACT_MAP?.EURC?.address ? [{ symbol: 'EURC', address: CONTRACT_MAP.EURC.address }] : []),
  ].filter((t) => t.address);
}

export function getCfdMarginOptions() {
  return getTokenOptions().filter((t) => ['USDT', 'USDC', 'EURS', 'EURC'].includes(t.symbol));
}
