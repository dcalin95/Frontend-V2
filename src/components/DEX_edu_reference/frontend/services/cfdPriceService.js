/**
 * Prețuri live pentru CFD assets și tokeni Spot – fără autentificare.
 * Crypto: Binance public REST API (CORS ok, fără auth, fără key).
 * Gold: CoinGecko public API (PAXG ≈ XAU spot).
 * Oil: cache/fallback (nu există API public gratuit fără auth).
 * Forex majors: Frankfurter (api.frankfurter.dev, fără key).
 * ETF / US equities: Yahoo → Stooq din browser → Stooq via backend (fără CORS) → OTA fallback.
 * URL backend: apel `getBackendUrl()` la fiecare request (nu constantă din `constants.js`), ca după `runtime-config.json` să fie `cachedConfig` — altfel rămâne fallback vechi și proxy-ul lovește host greșit.
 * Stablecoins: 1.0 fix.
 */
import { CFD_ASSETS } from '../constants/leverageConstants';
import { getBackendUrl } from '../../config/apiEndpoints.js';

const BINANCE_TICKER = 'https://api.binance.com/api/v3/ticker/price';
const COINGECKO_PRICE = 'https://api.coingecko.com/api/v3/simple/price';
/** SSOT: frankfurter.app fără redirect valid → 404; .dev este hostul curent al API-ului */
const FRANKFURTER_LATEST = 'https://api.frankfurter.dev/v1/latest';

/** assetId → Binance pair */
const CFD_BINANCE_MAP = {
  0: 'BTCUSDT',
  1: 'ETHUSDT',
  4: 'POLUSDT', // MATIC rebranded → POL (2024)
  5: 'BNBUSDT',
  6: 'LINKUSDT',
  7: 'SOLUSDT',
  8: 'XRPUSDT',
  9: 'DOGEUSDT',
  10: 'ADAUSDT',
  11: 'AVAXUSDT',
};

/** asset.key → Frankfurter from/to (preț = rates[to] când baza e `from`) */
const CFD_FRANKFURTER_BY_KEY = {
  EUR_USD: { from: 'EUR', to: 'USD' },
  GBP_USD: { from: 'GBP', to: 'USD' },
  JPY_USD: { from: 'JPY', to: 'USD' },
  AUD_USD: { from: 'AUD', to: 'USD' },
  CHF_USD: { from: 'CHF', to: 'USD' },
  MXN_USD: { from: 'MXN', to: 'USD' },
};

/** priceToken → Yahoo Finance simbol (chart API) */
const CFD_YAHOO_TICKER = new Set(['SPY', 'QQQ', 'AAPL', 'MSFT', 'NVDA', 'META', 'GOOGL', 'AMZN', 'TSLA']);

/** asset.key → CoinGecko coin id */
const CFD_COINGECKO_MAP = {
  XAU_USD: 'paxos-gold', // PAXG ≈ XAU spot price
};

/** token symbol → Binance pair */
const SPOT_BINANCE_MAP = {
  BNB: 'BNBUSDT',
  WBNB: 'BNBUSDT',
  BTC: 'BTCUSDT',
  ETH: 'ETHUSDT',
  SOL: 'SOLUSDT',
  LINK: 'LINKUSDT',
  POL: 'POLUSDT',
  MATIC: 'POLUSDT',
  XRP: 'XRPUSDT',
  DOGE: 'DOGEUSDT',
  ADA: 'ADAUSDT',
  AVAX: 'AVAXUSDT',
};

const STABLECOINS = new Set(['USDT', 'USDC', 'DAI', 'BUSD', 'EURS', 'EURC']);

/** Ultimele prețuri valide – evită flickering când API e lent */
const priceCache = {};

async function fetchBinancePrice(pair) {
  try {
    const res = await fetch(`${BINANCE_TICKER}?symbol=${pair}`);
    if (!res.ok) return null;
    const data = await res.json();
    const price = Number(data?.price);
    return price > 0 ? price : null;
  } catch {
    return null;
  }
}

async function fetchCoinGeckoPrice(coinId) {
  if (!coinId) return null;
  try {
    const res = await fetch(`${COINGECKO_PRICE}?ids=${coinId}&vs_currencies=usd`);
    if (!res.ok) return null;
    const data = await res.json();
    const price = Number(data?.[coinId]?.usd);
    return price > 0 ? price : null;
  } catch {
    return null;
  }
}

/**
 * Preț spot forex (sursă: Frankfurter, fără API key).
 * @returns {Promise<number|null>}
 */
async function fetchFrankfurterRate(from, to) {
  if (!from || !to) return null;
  try {
    const u = `${FRANKFURTER_LATEST}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    const res = await fetch(u);
    if (!res.ok) return null;
    const data = await res.json();
    const v = data?.rates?.[to];
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

/**
 * Preț ETF / acțiune US (Yahoo chart — poate fi blocat CORS).
 * @returns {Promise<number|null>}
 */
async function fetchYahooRegularPrice(symbol) {
  if (!symbol) return null;
  try {
    const u = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m`;
    const res = await fetch(u);
    if (!res.ok) return null;
    const j = await res.json();
    const meta = j?.chart?.result?.[0]?.meta;
    const p = meta?.regularMarketPrice ?? meta?.previousClose;
    const n = Number(p);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

/**
 * Preț închidere US (Stooq CSV — CORS ok în majoritatea browserelor, fără API key).
 * Simbol Yahoo (ex. MSFT) → `msft.us` pe Stooq.
 * @returns {Promise<number|null>}
 */
function parseStooqCsvClose(text) {
  const lines = String(text || '').trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return null;
  const parts = lines[1].split(',');
  const close = Number(parts[6]);
  return Number.isFinite(close) && close > 0 ? close : null;
}

async function fetchStooqUsClosePrice(yahooTicker) {
  if (!yahooTicker || typeof yahooTicker !== 'string') return null;
  const stooq = `${yahooTicker.trim().toLowerCase()}.us`;
  try {
    const u = `https://stooq.com/q/l/?s=${encodeURIComponent(stooq)}&f=sd2t2ohlcv&h&e=csv`;
    const res = await fetch(u);
    if (!res.ok) return null;
    const text = await res.text();
    return parseStooqCsvClose(text);
  } catch {
    return null;
  }
}

/**
 * Stooq din browser e adesea blocat de CORS — același CSV prin backend Render (același origin policy CORS către API).
 */
async function fetchStooqUsClosePriceViaBackend(yahooTicker) {
  if (!yahooTicker || typeof yahooTicker !== 'string') return null;
  let base = '';
  try {
    base = String(getBackendUrl() || '').trim().replace(/\/$/, '');
  } catch (_) {
    base = '';
  }
  if (!base) return null;
  try {
    const q = new URLSearchParams({ symbol: yahooTicker.trim().toUpperCase() });
    const u = `${base}/api/dex/v1/price/cfd-us-equity?${q}`;
    const res = await fetch(u, { method: 'GET', credentials: 'omit' });
    if (!res.ok) return null;
    const j = await res.json();
    const p = j?.price ?? j?.data?.price;
    const n = Number(p);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

/**
 * Preț live pentru CFD asset (id aliniat la `CFD_ASSETS`).
 * @param {number} assetId
 * @param {Function|null} otaFetcher – ultima soluție, necesită auth
 * @returns {Promise<number|null>}
 */
export async function fetchCFDLivePrice(assetId, otaFetcher = null) {
  const cacheKey = `cfd_${assetId}`;

  // 1. Binance (crypto majors din map)
  const binancePair = CFD_BINANCE_MAP[assetId];
  if (binancePair) {
    const price = await fetchBinancePrice(binancePair);
    if (price != null) {
      priceCache[cacheKey] = price;
      return price;
    }
  }

  // 2. CoinGecko (Gold via PAXG)
  const asset = CFD_ASSETS.find((a) => a.id === assetId);
  const geckoId = asset?.key ? CFD_COINGECKO_MAP[asset.key] : null;
  if (geckoId) {
    const price = await fetchCoinGeckoPrice(geckoId);
    if (price != null) {
      priceCache[cacheKey] = price;
      return price;
    }
  }

  // 3. Frankfurter (forex)
  const ff = asset?.key ? CFD_FRANKFURTER_BY_KEY[asset.key] : null;
  if (ff) {
    const price = await fetchFrankfurterRate(ff.from, ff.to);
    if (price != null) {
      priceCache[cacheKey] = price;
      return price;
    }
  }

  // 4. Yahoo (ETF / US equities)
  if (asset?.priceToken && CFD_YAHOO_TICKER.has(asset.priceToken)) {
    const yahooPrice = await fetchYahooRegularPrice(asset.priceToken);
    if (yahooPrice != null) {
      priceCache[cacheKey] = yahooPrice;
      return yahooPrice;
    }
    const stooqPrice = await fetchStooqUsClosePrice(asset.priceToken);
    if (stooqPrice != null) {
      priceCache[cacheKey] = stooqPrice;
      return stooqPrice;
    }
    const stooqBackend = await fetchStooqUsClosePriceViaBackend(asset.priceToken);
    if (stooqBackend != null) {
      priceCache[cacheKey] = stooqBackend;
      return stooqBackend;
    }
  }

  // 5. OTA backend (necesită login – fallback final)
  if (otaFetcher) {
    try {
      const price = await otaFetcher(assetId);
      if (price != null && price > 0) {
        priceCache[cacheKey] = price;
        return price;
      }
    } catch (_) {}
  }

  // 6. Ultimul preț valid din cache
  return priceCache[cacheKey] ?? null;
}

/**
 * Preț live pentru token Spot (ex: 'BNB', 'USDT').
 * @param {string} symbol
 * @returns {Promise<number|null>}
 */
export async function fetchSpotTokenPrice(symbol) {
  if (!symbol) return null;
  const sym = symbol.toUpperCase();
  if (STABLECOINS.has(sym)) return 1.0;
  const pair = SPOT_BINANCE_MAP[sym];
  if (pair) {
    const price = await fetchBinancePrice(pair);
    if (price != null) {
      priceCache[`spot_${sym}`] = price;
      return price;
    }
  }
  return priceCache[`spot_${sym}`] ?? null;
}
