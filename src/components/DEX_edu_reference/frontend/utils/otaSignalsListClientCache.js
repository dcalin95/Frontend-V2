/**
 * Cache scurt în memorie pentru GET /ai-trading/signals (apeluri din Long/Short ops services).
 * - Reduce cereri duplicate (remount, Strict Mode, două componente în același tab).
 * - Nu înlocuiește cache-ul server; WebSocket/SSE pentru feed necesită rută nouă pe backend (repo backend-server).
 */

/** TTL aliniat la poll panou (~60s): evită date foarte vechi dacă user lasă tab-ul deschis. */
export const OTA_SIGNALS_LIST_CLIENT_CACHE_TTL_MS = 45_000;

const store = new Map();

/** Timestamps ale request-urilor rețelei (nu hit cache) în ultimul minut — diagnostic în browser. */
const networkFetchTimestamps = [];
let totalNetworkFetches = 0;

function normalizeUserIdForCache(raw) {
  const s = String(raw ?? '').trim();
  if (/^0x[a-fA-F0-9]{40}$/.test(s)) return s.toLowerCase();
  return s;
}

function buildCacheKey(userId, { limit, signal, tradeContext }) {
  const uid = normalizeUserIdForCache(userId);
  const sig = signal != null && String(signal).trim() !== '' ? String(signal).trim() : '';
  const tc = tradeContext != null && String(tradeContext).trim() !== '' ? String(tradeContext).trim() : '';
  return `${uid}|${String(limit)}|${tc}|${sig}`;
}

function cloneSignalsPayload(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  try {
    return JSON.parse(JSON.stringify(payload));
  } catch {
    const signals = Array.isArray(payload.signals) ? [...payload.signals] : [];
    return { ...payload, signals };
  }
}

/**
 * @param {string} userId
 * @param {{ limit?: number, signal?: string|null, tradeContext?: string }} queryOpts
 * @returns {object|null}
 */
export function readOtaSignalsListCache(userId, queryOpts) {
  const key = buildCacheKey(userId, queryOpts);
  const row = store.get(key);
  if (!row) return null;
  if (Date.now() - row.at > OTA_SIGNALS_LIST_CLIENT_CACHE_TTL_MS) {
    store.delete(key);
    return null;
  }
  return cloneSignalsPayload(row.payload);
}

/**
 * @param {string} userId
 * @param {{ limit?: number, signal?: string|null, tradeContext?: string }} queryOpts
 * @param {object} payload răspuns normalizat (ex. `{ ...data, signals }`)
 */
export function writeOtaSignalsListCache(userId, queryOpts, payload) {
  const key = buildCacheKey(userId, queryOpts);
  store.set(key, { at: Date.now(), payload: cloneSignalsPayload(payload) });
}

/** Șterge intrările pentru un user (ex. după logout sau refresh forțat fără skipCache pe toate ramurile). */
export function invalidateOtaSignalsListCacheForUser(userId) {
  const prefix = `${normalizeUserIdForCache(userId)}|`;
  for (const k of [...store.keys()]) {
    if (k.startsWith(prefix)) store.delete(k);
  }
}

export function clearOtaSignalsListCacheForTests() {
  store.clear();
  networkFetchTimestamps.length = 0;
  totalNetworkFetches = 0;
}

/** Apelat doar la cache miss, imediat înainte de `otaApiRequest` către SIGNALS_LIST. */
export function recordOtaSignalsListNetworkFetch() {
  totalNetworkFetches += 1;
  const now = Date.now();
  networkFetchTimestamps.push(now);
  while (networkFetchTimestamps.length && now - networkFetchTimestamps[0] > 60_000) {
    networkFetchTimestamps.shift();
  }
}

/**
 * Metrici client (nu sunt QPS server): număr de GET /signals reale din acest tab, fereastră ~60s.
 * În dev: `window.__OTA_SIGNALS_LIST_CLIENT_METRICS__()`.
 */
export function getOtaSignalsListClientMetrics() {
  const now = Date.now();
  while (networkFetchTimestamps.length && now - networkFetchTimestamps[0] > 60_000) {
    networkFetchTimestamps.shift();
  }
  return {
    totalNetworkFetches,
    last60sNetworkFetches: networkFetchTimestamps.length,
  };
}

/** Vite setează NODE_ENV; fără `import.meta` aici (Jest nu parsează modulul altfel). */
const IS_DEV = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

if (typeof window !== 'undefined' && IS_DEV) {
  window.__OTA_SIGNALS_LIST_CLIENT_METRICS__ = getOtaSignalsListClientMetrics;
  window.__OTA_SIGNALS_LIST_CACHE_INVALIDATE_USER__ = invalidateOtaSignalsListCacheForUser;
}
