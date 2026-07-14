/**
 * OTA Short ops API client (staging / internal).
 * Endpoint-uri: GET open-shorts, POST manual-close, POST reset-kill.
 * Auth: header X-Ota-Short-Ops-Secret din getOtaShortOpsSecret() (runtime-config.json sau REACT_APP_OTA_SHORT_OPS_SECRET la build).
 * Notă: Secretul expus în browser e aceeași clasă de risc ca orice valoare înglobată în bundle; pentru prod ideal e BFF.
 */

import { getApiBaseUrl, API_ENDPOINTS } from '../../config/apiEndpoints.js';
import { loadRuntimeConfig, getOtaShortOpsSecret } from '../../config/runtimeConfig.js';
import { otaApiRequest } from '../utils/otaApiClient';
import {
  readOtaSignalsListCache,
  writeOtaSignalsListCache,
  recordOtaSignalsListNetworkFetch,
} from '../utils/otaSignalsListClientCache';
import { coerceSignalsArrayFromApiPayload } from '../utils/otaSignalsPayloadCoerce';

const SHORT_OPS_GET_CACHE_MS = 2500;
const shortOpsGetCache = new Map();

/** Normalize backend errors (ex. 503 când lipsește OTA_SHORT_OPS_SECRET pe server). */
function throwShortOpsHttp(res, data) {
  const body = data && typeof data === 'object' ? data : {};
  if (res.status === 503 && body.code === 'SHORT_OPS_SERVER_UNCONFIGURED') {
    throw new Error(body.error || 'Backend: OTA_SHORT_OPS_SECRET not set — short ops disabled');
  }
  const rawMessage = String(body.error || body.message || '').trim();
  if (
    (res.status === 401 || res.status === 403) &&
    /X-Ota-Short-Ops-Secret|Short-Ops-Secret|provide .*secret/i.test(rawMessage)
  ) {
    throw new Error(
      'Short Ops authorization missing: add OTA_SHORT_OPS_SECRET to runtime-config.json/S3 deploy env, or open the panel once with ?secret=...'
    );
  }
  throw new Error(body.error || `HTTP ${res.status}`);
}

function getShortOpsHeaders() {
  const secret = getOtaShortOpsSecret();
  const headers = { 'Content-Type': 'application/json' };
  if (secret) headers['X-Ota-Short-Ops-Secret'] = secret;
  return headers;
}

function withShortOpsSecretQuery(input, secret) {
  const value = String(secret || '').trim();
  if (!value || typeof input !== 'string') return input;
  try {
    const url = new URL(input, typeof window !== 'undefined' ? window.location.origin : undefined);
    if (!url.searchParams.get('secret')) {
      url.searchParams.set('secret', value);
    }
    return url.toString();
  } catch (_) {
    const separator = String(input).includes('?') ? '&' : '?';
    return `${input}${separator}secret=${encodeURIComponent(value)}`;
  }
}

function requireUserId(userId, caller = 'short ops') {
  const uid = String(userId || '').trim();
  if (!uid) throw new Error(`${caller}: userId required`);
  return uid;
}

/** @param {RequestInfo|URL} input @param {RequestInit} [init] */
async function shortOpsFetch(input, init = {}) {
  await loadRuntimeConfig();
  let baseH = getShortOpsHeaders();
  if (!baseH['X-Ota-Short-Ops-Secret']) {
    await loadRuntimeConfig({ force: true });
    baseH = getShortOpsHeaders();
  }
  const method = String(init.method || 'GET').toUpperCase();
  const headers = { ...baseH, ...(init.headers || {}) };
  const secret = headers['X-Ota-Short-Ops-Secret'] || '';
  if (!secret) {
    throw new Error(
      'Short Ops authorization missing: add OTA_SHORT_OPS_SECRET to runtime-config.json/S3 deploy env, or open the panel once with ?secret=...'
    );
  }
  const requestInput = withShortOpsSecretQuery(input, secret);
  const cacheKey = method === 'GET' ? `${String(requestInput)}|secret:${secret ? 'set' : 'none'}` : null;
  const now = Date.now();
  if (cacheKey) {
    const cached = shortOpsGetCache.get(cacheKey);
    if (cached && now - cached.at < SHORT_OPS_GET_CACHE_MS) {
      if (cached.response) return cached.response.clone();
      if (cached.promise) return cached.promise.then((res) => res.clone());
    }
  }
  const promise = fetch(requestInput, {
    ...init,
    credentials: init.credentials ?? 'include',
    headers,
  });
  if (!cacheKey) return promise;
  shortOpsGetCache.set(cacheKey, { at: now, promise });
  promise.then((res) => {
    if (shortOpsGetCache.get(cacheKey)?.promise === promise) {
      shortOpsGetCache.set(cacheKey, { at: Date.now(), response: res.clone() });
      setTimeout(() => {
        if (Date.now() - (shortOpsGetCache.get(cacheKey)?.at || 0) >= SHORT_OPS_GET_CACHE_MS) {
          shortOpsGetCache.delete(cacheKey);
        }
      }, SHORT_OPS_GET_CACHE_MS + 100);
    }
  }, () => {
    if (shortOpsGetCache.get(cacheKey)?.promise === promise) shortOpsGetCache.delete(cacheKey);
  });
  return promise;
}

/** True dacă există secret în runtime-config sau în bundle (REACT_APP_*). */
export function isShortOpsClientSecretConfigured() {
  return getOtaShortOpsSecret().length > 0;
}

/**
 * GET open-shorts. Query: userId (optional).
 * @returns {Promise<{ success: boolean, positions: Array, count: number, error?: string }>}
 */
export async function getOpenShorts(userId) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const uid = requireUserId(userId, 'getOpenShorts');
  const url = `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_SHORT_OPEN_SHORTS}?userId=${encodeURIComponent(uid)}`;
  const res = await shortOpsFetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwShortOpsHttp(res, data);
  return data;
}

/**
 * POST manual-close. Body: { userId, symbol, exitMark } — exitMark obligatoriu (număr finit pozitiv).
 * @returns {Promise<{ success: boolean, closed?: boolean, executionId?: number, error?: string }>}
 */
export async function postManualClose({ userId, symbol, exitMark }) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const url = `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_SHORT_MANUAL_CLOSE}`;
  const res = await shortOpsFetch(url, {
    method: 'POST',
    body: JSON.stringify({ userId: String(userId).trim(), symbol: String(symbol).trim(), exitMark: exitMark != null ? Number(exitMark) : undefined }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwShortOpsHttp(res, data);
  return data;
}

/**
 * Per open SHORT: `userBlocksOtaCloseWhileNetLoss` — OTA skips automated closes that would lock in a net loss
 * for **this** position only (manual close from ops still runs). Same metadata key as LONG.
 */
export async function postShortPositionLossCloseGuard({ userId, positionId, userBlocksOtaCloseWhileNetLoss }) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const url = `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_SHORT_POSITION_LOSS_CLOSE_GUARD}`;
  const res = await shortOpsFetch(url, {
    method: 'POST',
    body: JSON.stringify({
      userId: String(userId).trim(),
      positionId: Number(positionId),
      userBlocksOtaCloseWhileNetLoss,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwShortOpsHttp(res, data);
  return data;
}

/**
 * GET rejections. Query: userId (optional), limit (optional).
 * @returns {Promise<{ success: boolean, rejections: Array<{ user_id, symbol, reason_code, reason_detail, created_at }>, count: number }>}
 */
export async function getRejections(userId, limit = 100) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const uid = requireUserId(userId, 'getRejections');
  const params = new URLSearchParams();
  params.set('userId', uid);
  if (limit != null) params.set('limit', String(limit));
  const qs = params.toString();
  const url = `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_SHORT_REJECTIONS}${qs ? `?${qs}` : ''}`;
  const res = await shortOpsFetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwShortOpsHttp(res, data);
  return data;
}

/**
 * GET kill-status. Query: userId (optional) — dacă lipsesc, listă toate; altfel un singur user.
 * @returns {Promise<{ success: boolean, killStatus: Object|Array|null, count: number }>}
 */
export async function getKillStatus(userId) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const uid = requireUserId(userId, 'getKillStatus');
  const url = `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_SHORT_KILL_STATUS}?userId=${encodeURIComponent(uid)}`;
  const res = await shortOpsFetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwShortOpsHttp(res, data);
  return data;
}

/**
 * GET executor-decisions. Query: userId (optional), token (optional), limit (optional).
 * @returns {Promise<{ success: boolean, decisions: Array, count: number }>}
 */
export async function getExecutorDecisions({ userId = null, token = null, limit = 100 } = {}) {
  const uid = requireUserId(userId, 'getExecutorDecisions');
  const url = buildShortOpsUrl(API_ENDPOINTS.OTA_SHORT_EXECUTOR_DECISIONS, {
    userId: uid,
    token: token || undefined,
    limit: limit != null ? String(limit) : undefined,
  });
  const res = await shortOpsFetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwShortOpsHttp(res, data);
  return data;
}

/**
 * GET venue-mark (Phase 3c). Read-only mark price de la venue. Query: symbol (default BTC).
 * @returns {Promise<{ success: boolean, symbol?: string, venueSymbol?: string, markPrice?: number, error?: string }>}
 */
export async function getVenueMark(symbol = 'BTC') {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const url = `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_SHORT_VENUE_MARK}?symbol=${encodeURIComponent(String(symbol))}`;
  const res = await shortOpsFetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwShortOpsHttp(res, data);
  return data;
}

function buildShortOpsUrl(endpointPath, params = {}) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && String(v).trim() !== '') q.set(k, String(v));
  });
  const qs = q.toString();
  return `${base.replace(/\/$/, '')}${endpointPath}${qs ? `?${qs}` : ''}`;
}

/** GET venue-funding — read-only funding rate. */
export async function getVenueFunding(symbol = 'BTC') {
  const url = buildShortOpsUrl(API_ENDPOINTS.OTA_SHORT_VENUE_FUNDING, { symbol: String(symbol).toUpperCase() });
  const res = await shortOpsFetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwShortOpsHttp(res, data);
  return data;
}

/**
 * GET venue-funding-acc — sumă reală FUNDING_FEE din Binance (cont futures OTA), între opened_at și acum.
 * @param {string} symbol ex. AVAX
 * @param {number|string} startTimeMsOrIso unix ms sau ISO
 */
export async function getVenueFundingAcc(symbol, startTimeMsOrIso, userId) {
  const sym = String(symbol || '').trim().toUpperCase();
  const uid = requireUserId(userId, 'getVenueFundingAcc');
  const since =
    typeof startTimeMsOrIso === 'number' && Number.isFinite(startTimeMsOrIso)
      ? String(Math.floor(startTimeMsOrIso))
      : String(startTimeMsOrIso || '').trim();
  if (!sym || !since) throw new Error('getVenueFundingAcc: symbol and startTime required');
  const url = buildShortOpsUrl(API_ENDPOINTS.OTA_SHORT_VENUE_FUNDING_ACC, { symbol: sym, since, userId: uid });
  const res = await shortOpsFetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwShortOpsHttp(res, data);
  return data;
}

/** GET venue-position — necesită API key venue pe backend. */
export async function getVenuePosition(symbol = 'BTC', userId) {
  const uid = requireUserId(userId, 'getVenuePosition');
  const url = buildShortOpsUrl(API_ENDPOINTS.OTA_SHORT_VENUE_POSITION, { symbol: String(symbol).toUpperCase(), userId: uid });
  const res = await shortOpsFetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwShortOpsHttp(res, data);
  return data;
}

/** GET venue-margin — cont futures agregat. */
export async function getVenueMargin(userId) {
  const uid = requireUserId(userId, 'getVenueMargin');
  const url = buildShortOpsUrl(API_ENDPOINTS.OTA_SHORT_VENUE_MARGIN, { userId: uid });
  const res = await shortOpsFetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwShortOpsHttp(res, data);
  return data;
}

/** GET venue-reconcile — symbol obligatoriu; expectedSizeUsd opțional. */
export async function getVenueReconcile(symbol, expectedSizeUsd = null, userId) {
  const uid = requireUserId(userId, 'getVenueReconcile');
  const params = { symbol: String(symbol).toUpperCase(), userId: uid };
  if (expectedSizeUsd != null && Number.isFinite(Number(expectedSizeUsd))) {
    params.expectedSizeUsd = String(expectedSizeUsd);
  }
  const url = buildShortOpsUrl(API_ENDPOINTS.OTA_SHORT_VENUE_RECONCILE, params);
  const res = await shortOpsFetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwShortOpsHttp(res, data);
  return data;
}

/** GET venue-margin-mode — isolated vs cross. */
export async function getVenueMarginMode(symbol = 'BTC', userId) {
  const uid = requireUserId(userId, 'getVenueMarginMode');
  const url = buildShortOpsUrl(API_ENDPOINTS.OTA_SHORT_VENUE_MARGIN_MODE, { symbol: String(symbol).toUpperCase(), userId: uid });
  const res = await shortOpsFetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwShortOpsHttp(res, data);
  return data;
}

/**
 * GET live-status (Phase 3b). Gate + guardrails; fără secrete.
 * @returns {Promise<{ success: boolean, gate?: object, guardrails?: { ok: boolean, reasons: string[] }, adapter?: { present: boolean, venueId?: string, hasPrivateCredentials?: boolean }, liveUserAllowlistCount?: number, liveSymbolAllowlistCount?: number }>}
 */
export async function getLiveStatus() {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const url = `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_SHORT_LIVE_STATUS}`;
  const res = await shortOpsFetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwShortOpsHttp(res, data);
  return data;
}

/**
 * GET short-activity. Ultimele N execuții short (open+close) cu PnL.
 * @returns {Promise<{ success: boolean, activity: Array, count: number }>}
 */
export { subscribeOtaSignalsListStream, buildOtaSignalsStreamUrl } from '../utils/otaSignalsStreamClient';

export async function getShortActivity(userId, limit = 20) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const uid = requireUserId(userId, 'getShortActivity');
  const params = new URLSearchParams();
  params.set('userId', uid);
  if (limit != null) params.set('limit', String(limit));
  const qs = params.toString();
  const url = `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_SHORT_ACTIVITY}${qs ? `?${qs}` : ''}`;
  const res = await shortOpsFetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwShortOpsHttp(res, data);
  return data;
}

/**
 * GET latest OTA LLM analyses from ota.analysis_results.
 * Reuses the existing signals API because it already exposes confidence + createdAt.
 * Optional `signal` narrows the list to a specific signal type (ex. sell).
 * `tradeContext`: short_live | short_focus | common | … | all. Panoul SHORT cere short_live + common + short_focus; feed UI păstrează `short_*` și `common` cu semnal SHORT (vezi `filterSignalsForShortFuturesFeed`).
 * `skipCache`: true la refresh forțat — sare cache-ul client.
 */
export async function getRecentLlmSignals(
  userId,
  { limit = 4, signal = null, tradeContext = 'short_live', skipCache = false, timeoutMs = undefined } = {}
) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  if (!userId || String(userId).trim() === '') {
    return { success: true, signals: [], pagination: { limit: 0, offset: 0, total: 0, hasMore: false } };
  }
  const queryOpts = { limit, signal, tradeContext };
  if (!skipCache) {
    const cached = readOtaSignalsListCache(userId, queryOpts);
    if (cached) return cached;
  }
  const params = new URLSearchParams({
    userId: String(userId).trim(),
    limit: String(limit),
    offset: '0',
  });
  if (signal) params.set('signal', String(signal).trim());
  if (tradeContext && String(tradeContext).trim() !== '' && String(tradeContext).trim() !== 'all') {
    params.set('tradeContext', String(tradeContext).trim());
  }
  const pathWithQuery = `${API_ENDPOINTS.SIGNALS_LIST}?${params.toString()}`;
  /** `otaApiRequest`: Bearer OTA wallet când enforce pe server; fără asta GET /signals cu userId → 401 și feed gol. */
  recordOtaSignalsListNetworkFetch();
  const requestOptions = { method: 'GET' };
  if (timeoutMs != null) requestOptions.timeoutMs = timeoutMs;
  const data = await otaApiRequest(pathWithQuery, requestOptions);
  const signals = coerceSignalsArrayFromApiPayload(data);
  const out = { ...data, signals };
  writeOtaSignalsListCache(userId, queryOpts, out);
  return out;
}

/**
 * POST reset-kill. Body: { userId }.
 * @returns {Promise<{ success: boolean, reset?: boolean, userId?: string, error?: string }>}
 */
export async function postResetKill({ userId }) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const url = `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_SHORT_RESET_KILL}`;
  const res = await shortOpsFetch(url, {
    method: 'POST',
    body: JSON.stringify({ userId: String(userId).trim() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwShortOpsHttp(res, data);
  return data;
}

/**
 * POST activate-kill. Body: { userId, reason? }.
 * @returns {Promise<{ success: boolean, activated?: boolean, userId?: string, reason?: string, error?: string }>}
 */
/**
 * POST token-block — blochează SHORT doar pentru un token, până la expirare.
 * @param {{ userId: string, symbol: string, durationMinutes?: number, permanent?: boolean }}
 */
export async function postTokenBlock({ userId, symbol, durationMinutes, permanent = false }) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const url = `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_SHORT_TOKEN_BLOCK}`;
  const body = { userId: String(userId).trim(), symbol: String(symbol).trim().toUpperCase() };
  if (permanent) body.permanent = true;
  else if (durationMinutes != null) body.durationMinutes = Number(durationMinutes);
  const res = await shortOpsFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwShortOpsHttp(res, data);
  return data;
}

export async function postTokenBlockClear({ userId, symbol }) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const url = `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_SHORT_TOKEN_BLOCK_CLEAR}`;
  const res = await shortOpsFetch(url, {
    method: 'POST',
    body: JSON.stringify({ userId: String(userId).trim(), symbol: String(symbol).trim().toUpperCase() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwShortOpsHttp(res, data);
  return data;
}

export async function getTokenBlocks(userId) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const params = new URLSearchParams({ userId: String(userId).trim() });
  const url = `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_SHORT_TOKEN_BLOCKS}?${params.toString()}`;
  const res = await shortOpsFetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwShortOpsHttp(res, data);
  return data;
}

/**
 * Blochează SHORT pentru toate simbolurile din listă (backend dedupe / limită).
 * @param {{ userId: string, symbols: string[], durationMinutes?: number, permanent?: boolean }}
 */
export async function postTokenBlockBulk({ userId, symbols, durationMinutes, permanent = false }) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const url = `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_SHORT_TOKEN_BLOCK_BULK}`;
  const body = {
    userId: String(userId).trim(),
    symbols: Array.isArray(symbols) ? symbols.map((s) => String(s).trim().toUpperCase()).filter(Boolean) : [],
  };
  if (permanent) body.permanent = true;
  else if (durationMinutes != null) body.durationMinutes = Number(durationMinutes);
  const res = await shortOpsFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwShortOpsHttp(res, data);
  return data;
}

/** @param {{ userId: string }} */
export async function postTokenBlockClearAll({ userId }) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const url = `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_SHORT_TOKEN_BLOCK_CLEAR_ALL}`;
  const res = await shortOpsFetch(url, {
    method: 'POST',
    body: JSON.stringify({ userId: String(userId).trim() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwShortOpsHttp(res, data);
  return data;
}

export async function postActivateKill({ userId, reason = 'manual-block' }) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const url = `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_SHORT_ACTIVATE_KILL}`;
  const res = await shortOpsFetch(url, {
    method: 'POST',
    body: JSON.stringify({ userId: String(userId).trim(), reason: String(reason).trim() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwShortOpsHttp(res, data);
  return data;
}

/**
 * GET win-rate-stats. Query: userId (optional), days (optional, default 30).
 * @returns {Promise<{ success, days, global: { totalClosed, winRatePct, ... }, byToken: [], byConfidence: [] }>}
 */
export async function getWinRateStats(userId, { days = 30 } = {}) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const uid = requireUserId(userId, 'getWinRateStats');
  const params = new URLSearchParams({ days: String(days) });
  params.set('userId', uid);
  const url = `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_SHORT_WIN_RATE_STATS}?${params.toString()}`;
  const res = await shortOpsFetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwShortOpsHttp(res, data);
  return data;
}

export async function postBackfillMetadata({ userId, confidence = 0.6, btcBias = 'bearish', originalSignal = 'sell', tpPct = 0.05, slPct = 0.08, forceOverwriteTpSl = false } = {}) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const uid = requireUserId(userId, 'postBackfillMetadata');
  const url = `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_SHORT_BACKFILL_METADATA}`;
  const res = await shortOpsFetch(url, {
    method: 'POST',
    body: JSON.stringify({ userId: uid, confidence, btcBias, originalSignal, tpPct, slPct, forceOverwriteTpSl }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwShortOpsHttp(res, data);
  return data;
}
