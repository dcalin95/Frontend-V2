/**
 * Cache în memorie pentru răspunsuri JSON publice Binance USD-M (fapi).
 * Scop: micșorarea numărului de request-uri / weight către API (aceeași URL în TTL = un singur fetch).
 * - TTL configurabil per tip de endpoint
 * - Deduplicare: două componente care cer același URL în același timp partajează o singură Promise
 */

/** Klines 15m: date nu trebuie sub-secundă; 60s reduce mult traficul la refresh/re-mount. */
export const TTL_FAPI_KLINES_MS = Number(process.env.VITE_OTA_FAPI_KLINES_TTL_MS) || 60_000;

/** Open interest se schimbă mai lent decât last price. */
export const TTL_FAPI_OPEN_INTEREST_MS = Number(process.env.VITE_OTA_FAPI_OI_TTL_MS) || 90_000;

/** Ticker 24h: suficient la ~60s pentru context UI. */
export const TTL_FAPI_TICKER_24H_MS = Number(process.env.VITE_OTA_FAPI_TICKER24H_TTL_MS) || 60_000;

/** Raport long/short conturi (futures/data/*) — se schimbă lent; 2 min e rezonabil pentru bandă context. */
export const TTL_FAPI_LONG_SHORT_RATIO_MS =
  Number(process.env.VITE_OTA_FAPI_LS_RATIO_TTL_MS) || 120_000;

const store = new Map();
const inflight = new Map();

function forgetInflight(key) {
  inflight.delete(key);
}

function pruneExpired() {
  const now = Date.now();
  for (const [k, v] of store) {
    if (v.exp <= now) store.delete(k);
  }
}

function cloneJson(data) {
  if (data == null) return data;
  try {
    return typeof structuredClone === 'function' ? structuredClone(data) : JSON.parse(JSON.stringify(data));
  } catch {
    return data;
  }
}

/**
 * GET fapi URL cu cache TTL și deduplicare.
 * @param {string} url - URL complet (inclusiv query)
 * @param {number} ttlMs
 * @param {AbortSignal} [signal]
 * @param {{ bypassCache?: boolean }} [options] - bypassCache: fetch rețea la fiecare apel (ex. card BTC refresh periodic)
 * @returns {Promise<any>}
 */
export async function fapiGetJsonCached(url, ttlMs, signal, options = {}) {
  const bypassCache = options && options.bypassCache === true;
  const key = url;
  const now = Date.now();
  pruneExpired();

  if (bypassCache) {
    const r = await fetch(url, { signal, cache: 'no-store' });
    if (!r.ok) {
      const err = new Error(`fapi ${r.status}`);
      err.status = r.status;
      throw err;
    }
    const data = await r.json();
    store.set(key, { exp: Date.now() + ttlMs, data });
    if (store.size > 200) pruneExpired();
    return cloneJson(data);
  }

  const hit = store.get(key);
  if (hit && hit.exp > now) {
    return cloneJson(hit.data);
  }

  let p = inflight.get(key);
  if (!p) {
    p = (async () => {
      const r = await fetch(url, { signal, cache: 'no-store' });
      if (!r.ok) {
        const err = new Error(`fapi ${r.status}`);
        err.status = r.status;
        throw err;
      }
      const data = await r.json();
      store.set(key, { exp: Date.now() + ttlMs, data });
      if (store.size > 200) pruneExpired();
      return data;
    })();
    inflight.set(key, p);
    p.then(
      () => forgetInflight(key),
      () => forgetInflight(key),
    );
  }

  const data = await p;
  return cloneJson(data);
}
