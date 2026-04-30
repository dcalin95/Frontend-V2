/**
 * OTA Recent Outcomes Helper – pentru LLM care învață (învățare în-context)
 *
 * Colectează ultimele N outcome-uri (token, side, entryPrice, exitPrice?, pnl?, timestamp)
 * din trades API și/sau localStorage și le trimite la POST /api/ai-trading/analyze
 * ca recentOutcomes. Backend le poate include în prompt ca „Recent performance”.
 *
 * @module otaOutcomesHelper
 */

const STORAGE_KEY = 'ota_recent_outcomes';
const MAX_OUTCOMES = 20;
const DEFAULT_LIMIT_FOR_ANALYZE = 10;

/** Quote token folosit la analyze (POST /api/ai-trading/analyze). SSOT pentru LLM OTA AI. */
export const DEFAULT_QUOTE_TOKEN = 'USDT';
/** Numărul maxim de outcome-uri trimise în prompt la analyze. */
export const MAX_RECENT_OUTCOMES_FOR_ANALYZE = DEFAULT_LIMIT_FOR_ANALYZE;

function normalizeOutcomeUserKey(walletAddress) {
  const key = String(walletAddress || '').trim().toLowerCase();
  return key || 'anonymous';
}

function storageKeyForWallet(walletAddress) {
  return `${STORAGE_KEY}:${normalizeOutcomeUserKey(walletAddress)}`;
}

/**
 * Citește outcome-uri din localStorage (ultimele N).
 * @param {number} limit
 * @param {string|null} walletAddress
 * @returns {Array<{token: string, side: string, entryPrice: number, exitPrice?: number, pnl?: number, pnlPercent?: number, timestamp: string}>}
 */
export function getRecentOutcomes(limit = DEFAULT_LIMIT_FOR_ANALYZE, walletAddress = null) {
  try {
    const raw = localStorage.getItem(storageKeyForWallet(walletAddress));
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    return arr.slice(0, limit);
  } catch (_) {
    return [];
  }
}

/**
 * Adaugă un outcome și păstrează doar ultimele MAX_OUTCOMES.
 * @param {{token: string, side: string, entryPrice: number, exitPrice?: number, pnl?: number, pnlPercent?: number, timestamp: string}} outcome
 */
export function addOutcome(outcome) {
  if (!outcome || !outcome.token || !outcome.side || outcome.entryPrice == null) return;
  try {
    const key = storageKeyForWallet(outcome.walletAddress || outcome.userId || null);
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return;
    const next = [
      {
        token: String(outcome.token),
        side: String(outcome.side).toLowerCase(),
        entryPrice: Number(outcome.entryPrice),
        exitPrice: outcome.exitPrice != null ? Number(outcome.exitPrice) : undefined,
        pnl: outcome.pnl != null ? Number(outcome.pnl) : undefined,
        pnlPercent: outcome.pnlPercent != null ? Number(outcome.pnlPercent) : undefined,
        timestamp: outcome.timestamp ? String(outcome.timestamp) : new Date().toISOString()
      },
      ...arr
    ].slice(0, MAX_OUTCOMES);
    localStorage.setItem(key, JSON.stringify(next));
  } catch (_) {}
}

/**
 * Transformă poziții Direct Entry închise (API positions/closed) în format outcome.
 * PnL este net de gas (backend). LLM folosește pentru strategii profit / limitare pierdere.
 * @param {Array<{token: string, pnlUsd?: number|string, closedAt?: string, entry_price_usd?: number|string, entryPrice?: number}>} closedPositions
 * @returns {Array<{token: string, side: string, entryPrice: number, exitPrice?: number, pnl?: number, pnlPercent?: number, timestamp: string}>}
 */
export function buildOutcomesFromClosedPositions(closedPositions) {
  if (!Array.isArray(closedPositions) || closedPositions.length === 0) return [];
  return closedPositions
    .filter((c) => c && c.token)
    .map((c) => {
      const entryPrice = c.entry_price_usd != null ? parseFloat(c.entry_price_usd) : (c.entryPrice != null ? parseFloat(c.entryPrice) : 0);
      const pnl = c.pnlUsd != null ? parseFloat(c.pnlUsd) : undefined;
      const timestamp = c.closedAt || new Date().toISOString();
      return {
        token: String(c.token),
        side: 'sell',
        entryPrice: entryPrice > 0 ? entryPrice : 0,
        exitPrice: undefined,
        pnl,
        pnlPercent: undefined,
        timestamp
      };
    })
    .filter((o) => o.entryPrice > 0 || o.pnl != null);
}

/**
 * Transformă rânduri de trades (API getTrades) în format outcome.
 * @param {Array<{base_token?: string, price?: string|number, amount?: string|number, side?: string, created_at?: string, role?: string}>} trades
 * @returns {Array<{token: string, side: string, entryPrice: number, exitPrice?: number, pnl?: number, timestamp: string}>}
 */
export function buildOutcomesFromTrades(trades) {
  if (!Array.isArray(trades) || trades.length === 0) return [];
  return trades
    .filter((t) => t && (t.base_token || t.token || t.tokenOut) && (t.price != null || t.entry_price != null))
    .map((t) => {
      const token = t.base_token || t.token || t.tokenOut || '';
      const side = (t.side || t.role || 'buy').toString().toLowerCase();
      const entryPrice = parseFloat(t.price ?? t.entry_price ?? 0);
      const exitPrice = t.exit_price != null ? parseFloat(t.exit_price) : entryPrice;
      const pnl = t.pnl != null ? parseFloat(t.pnl) : t.profitUsd != null ? parseFloat(t.profitUsd) : undefined;
      const pnlPercent = t.pnl_percent != null ? parseFloat(t.pnl_percent) : undefined;
      const timestamp = t.created_at || t.createdAt || t.timestamp || new Date().toISOString();
      return { token, side, entryPrice, exitPrice, pnl, pnlPercent, timestamp };
    })
    .filter((o) => o.entryPrice > 0);
}

/**
 * Încarcă outcome-uri pentru trimitere la analyze: din API (getTrades) + localStorage, sortate desc, limitate.
 * Dacă getTrades eșuează (ex: neautentificat), returnează doar din localStorage.
 * @param {string} [walletAddress] - opțional, pentru viitoare filtrare per user
 * @returns {Promise<Array<{token: string, side: string, entryPrice: number, exitPrice?: number, pnl?: number, pnlPercent?: number, timestamp: string}>>}
 */
export async function loadOutcomesForAnalyze(walletAddress = null) {
  const fromStorage = getRecentOutcomes(MAX_OUTCOMES, walletAddress);
  let fromApi = [];

  // 1) Când avem wallet: getTrades + Direct Entry closed (PnL net) ca date sigure pentru LLM (strategii profit / limitare pierdere).
  if (walletAddress) {
    try {
      const [{ getTrades }, { getDirectEntryClosedPositions }] = await Promise.all([
        import('../services/executionApiService'),
        import('../services/aiTradingApiService')
      ]);
      const [tradesRes, closedList] = await Promise.all([
        getTrades(walletAddress, { limit: 30 }).catch(() => ({ trades: [] })),
        getDirectEntryClosedPositions(walletAddress, 15).catch(() => [])
      ]);
      const trades = Array.isArray(tradesRes?.trades) ? tradesRes.trades : [];
      const fromClosed = buildOutcomesFromClosedPositions(closedList);
      fromApi = [...buildOutcomesFromTrades(trades), ...fromClosed];
    } catch (_) {}
  } else {
    // 2) Fără wallet: DEX trades (necesită sesiune DEX)
    try {
      const { getTrades } = await import('../services/dexApiService');
      const res = await getTrades({ limit: 30 });
      const trades = Array.isArray(res?.trades) ? res.trades : [];
      fromApi = buildOutcomesFromTrades(trades);
    } catch (_) {}
  }

  const byTs = (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
  const merged = [...fromApi, ...fromStorage]
    .filter((o, i, arr) => arr.findIndex((x) => x.token === o.token && x.timestamp === o.timestamp) === i)
    .sort(byTs)
    .slice(0, DEFAULT_LIMIT_FOR_ANALYZE);

  return merged;
}

/**
 * Construiește obiectul options pentru analyzeMarket(token, options).
 * SSOT pentru shape-ul options: userId, quoteToken, marketData, amountIn, recentOutcomes.
 * @param {string|null} userId - User/wallet ID (opțional)
 * @param {Object} [opts] - Opțiuni
 * @param {string} [opts.quoteToken] - Quote token (default DEFAULT_QUOTE_TOKEN)
 * @param {Object} [opts.marketData] - Snapshot piață (preț, volume, change24h)
 * @param {string|number} [opts.amountIn] - Amount pentru analiză
 * @param {Array<{token: string, side: string, entryPrice: number, exitPrice?: number, pnl?: number, pnlPercent?: number, timestamp: string}>} [opts.recentOutcomes] - Ultimele N outcome-uri pentru LLM
 * @param {boolean} [opts.engineNoOpenAi] - opțional; vezi analyzeMarket în aiTradingApiService
 * @param {string} [opts.tradeContext] - opțional; ex. short_live pentru panoul Futures SHORT
 * @returns {{ userId: string|null, quoteToken: string, marketData: Object|null, amountIn: string|number|null, recentOutcomes?: Array, engineNoOpenAi?: boolean, tradeContext?: string }}
 */
export function buildAnalyzeOptions(userId, opts = {}) {
  const {
    quoteToken = DEFAULT_QUOTE_TOKEN,
    marketData = null,
    amountIn = null,
    recentOutcomes = null,
    engineNoOpenAi,
    tradeContext,
  } = typeof opts === 'object' && opts !== null ? opts : {};
  const options = {
    userId: userId ?? null,
    quoteToken: quoteToken || DEFAULT_QUOTE_TOKEN,
    marketData: marketData ?? null,
    amountIn: amountIn ?? null
  };
  if (Array.isArray(recentOutcomes) && recentOutcomes.length > 0) {
    options.recentOutcomes = recentOutcomes.slice(0, MAX_RECENT_OUTCOMES_FOR_ANALYZE);
  }
  if (engineNoOpenAi === true || engineNoOpenAi === false) {
    options.engineNoOpenAi = engineNoOpenAi;
  }
  const tc = tradeContext != null ? String(tradeContext).trim() : '';
  if (tc !== '') {
    options.tradeContext = tc;
  }
  return options;
}
