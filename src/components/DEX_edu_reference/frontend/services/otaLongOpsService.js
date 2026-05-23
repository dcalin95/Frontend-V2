/**
 * OTA Long Futures ops API client (staging / internal).
 * Mirror al otaShortOpsService.js, direcție LONG.
 * Auth: header X-Ota-Long-Ops-Secret din getOtaLongOpsSecret() (runtime-config.json sau REACT_APP_OTA_LONG_OPS_SECRET la build).
 */

import { getApiBaseUrl, API_ENDPOINTS } from '../../config/apiEndpoints.js';
import { loadRuntimeConfig, getOtaLongOpsSecret } from '../../config/runtimeConfig.js';
import { otaApiRequest } from '../utils/otaApiClient';
import {
  readOtaSignalsListCache,
  writeOtaSignalsListCache,
  recordOtaSignalsListNetworkFetch,
} from '../utils/otaSignalsListClientCache';
import { coerceSignalsArrayFromApiPayload } from '../utils/otaSignalsPayloadCoerce';

const LONG_OPS_GET_CACHE_MS = 2500;
const longOpsGetCache = new Map();

function throwLongOpsHttp(res, data) {
  const body = data && typeof data === 'object' ? data : {};
  if (res.status === 503 && body.code === 'LONG_OPS_SERVER_UNCONFIGURED') {
    throw new Error(body.error || 'Backend: OTA_LONG_OPS_SECRET not set — long ops disabled');
  }
  throw new Error(body.error || `HTTP ${res.status}`);
}

function getLongOpsHeaders() {
  const secret = getOtaLongOpsSecret();
  const headers = { 'Content-Type': 'application/json' };
  if (secret) headers['X-Ota-Long-Ops-Secret'] = secret;
  return headers;
}

function requireUserId(userId, caller = 'long ops') {
  const uid = String(userId || '').trim();
  if (!uid) throw new Error(`${caller}: userId required`);
  return uid;
}

/** @param {RequestInfo|URL} input @param {RequestInit} [init] */
async function longOpsFetch(input, init = {}) {
  await loadRuntimeConfig();
  const baseH = getLongOpsHeaders();
  const method = String(init.method || 'GET').toUpperCase();
  const headers = { ...baseH, ...(init.headers || {}) };
  const cacheKey = method === 'GET' ? `${String(input)}|secret:${headers['X-Ota-Long-Ops-Secret'] ? 'set' : 'none'}` : null;
  const now = Date.now();
  if (cacheKey) {
    const cached = longOpsGetCache.get(cacheKey);
    if (cached && now - cached.at < LONG_OPS_GET_CACHE_MS) {
      if (cached.response) return cached.response.clone();
      if (cached.promise) return cached.promise.then((res) => res.clone());
    }
  }
  const promise = fetch(input, {
    ...init,
    credentials: init.credentials ?? 'include',
    headers,
  });
  if (!cacheKey) return promise;
  longOpsGetCache.set(cacheKey, { at: now, promise });
  promise.then((res) => {
    if (longOpsGetCache.get(cacheKey)?.promise === promise) {
      longOpsGetCache.set(cacheKey, { at: Date.now(), response: res.clone() });
      setTimeout(() => {
        if (Date.now() - (longOpsGetCache.get(cacheKey)?.at || 0) >= LONG_OPS_GET_CACHE_MS) {
          longOpsGetCache.delete(cacheKey);
        }
      }, LONG_OPS_GET_CACHE_MS + 100);
    }
  }, () => {
    if (longOpsGetCache.get(cacheKey)?.promise === promise) longOpsGetCache.delete(cacheKey);
  });
  return promise;
}

/** True dacă există secret în runtime-config, bundle (REACT_APP_*) sau fallback la secret SHORT. */
export function isLongOpsConfigured() {
  return getOtaLongOpsSecret().length > 0;
}

export async function getOpenLongs(userId) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const uid = requireUserId(userId, 'getOpenLongs');
  const url = `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_LONG_OPEN_LONGS}?userId=${encodeURIComponent(uid)}`;
  const res = await longOpsFetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwLongOpsHttp(res, data);
  return data;
}

export async function getLongActivity(userId, limit = 20) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const uid = requireUserId(userId, 'getLongActivity');
  const params = new URLSearchParams({ limit });
  params.set('userId', uid);
  const url = `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_LONG_ACTIVITY}?${params}`;
  const res = await longOpsFetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwLongOpsHttp(res, data);
  return data;
}

export async function getLongLiveStatus(userId = null) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const url = userId
    ? `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_LONG_LIVE_STATUS}?userId=${encodeURIComponent(userId)}`
    : `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_LONG_LIVE_STATUS}`;
  const res = await longOpsFetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwLongOpsHttp(res, data);
  return data;
}

export async function getLongRejections(userId, limit = 50) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const uid = requireUserId(userId, 'getLongRejections');
  const params = new URLSearchParams({ limit });
  params.set('userId', uid);
  const url = `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_LONG_REJECTIONS}?${params}`;
  const res = await longOpsFetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwLongOpsHttp(res, data);
  return data;
}

export async function postLongManualClose({ userId, symbol, exitMark }) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const url = `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_LONG_MANUAL_CLOSE}`;
  const res = await longOpsFetch(url, {
    method: 'POST',
    body: JSON.stringify({ userId, symbol, exitMark }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwLongOpsHttp(res, data);
  return data;
}

function buildLongOpsUrl(endpointPath, params = {}) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && String(v).trim() !== '') q.set(k, String(v));
  });
  const qs = q.toString();
  return `${base.replace(/\/$/, '')}${endpointPath}${qs ? `?${qs}` : ''}`;
}

export async function getVenueMark(symbol = 'BTC') {
  const url = buildLongOpsUrl(API_ENDPOINTS.OTA_LONG_VENUE_MARK, { symbol: String(symbol).toUpperCase() });
  const res = await longOpsFetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwLongOpsHttp(res, data);
  return data;
}

export async function getVenueFunding(symbol = 'BTC') {
  const url = buildLongOpsUrl(API_ENDPOINTS.OTA_LONG_VENUE_FUNDING, { symbol: String(symbol).toUpperCase() });
  const res = await longOpsFetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwLongOpsHttp(res, data);
  return data;
}

export async function getVenueFundingAcc(symbol, startTimeMsOrIso, userId) {
  const uid = requireUserId(userId, 'getLongVenueFundingAcc');
  const sym = String(symbol || '').trim().toUpperCase();
  const since =
    typeof startTimeMsOrIso === 'number' && Number.isFinite(startTimeMsOrIso)
      ? String(Math.floor(startTimeMsOrIso))
      : String(startTimeMsOrIso || '').trim();
  if (!sym || !since) throw new Error('getLongVenueFundingAcc: symbol and startTime required');
  const url = buildLongOpsUrl(API_ENDPOINTS.OTA_LONG_VENUE_FUNDING_ACC, { symbol: sym, since, userId: uid });
  const res = await longOpsFetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwLongOpsHttp(res, data);
  return data;
}

export async function getVenuePosition(symbol = 'BTC', userId) {
  const uid = requireUserId(userId, 'getLongVenuePosition');
  const url = buildLongOpsUrl(API_ENDPOINTS.OTA_LONG_VENUE_POSITION, { symbol: String(symbol).toUpperCase(), userId: uid });
  const res = await longOpsFetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwLongOpsHttp(res, data);
  return data;
}

export async function getVenueMargin(userId) {
  const uid = requireUserId(userId, 'getLongVenueMargin');
  const url = buildLongOpsUrl(API_ENDPOINTS.OTA_LONG_VENUE_MARGIN, { userId: uid });
  const res = await longOpsFetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwLongOpsHttp(res, data);
  return data;
}

export async function getVenueReconcile(symbol, expectedSizeUsd = null, userId) {
  const uid = requireUserId(userId, 'getLongVenueReconcile');
  const params = { symbol: String(symbol).toUpperCase(), userId: uid };
  if (expectedSizeUsd != null && Number.isFinite(Number(expectedSizeUsd))) {
    params.expectedSizeUsd = String(expectedSizeUsd);
  }
  const url = buildLongOpsUrl(API_ENDPOINTS.OTA_LONG_VENUE_RECONCILE, params);
  const res = await longOpsFetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwLongOpsHttp(res, data);
  return data;
}

export async function getVenueMarginMode(symbol = 'BTC', userId) {
  const uid = requireUserId(userId, 'getLongVenueMarginMode');
  const url = buildLongOpsUrl(API_ENDPOINTS.OTA_LONG_VENUE_MARGIN_MODE, { symbol: String(symbol).toUpperCase(), userId: uid });
  const res = await longOpsFetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwLongOpsHttp(res, data);
  return data;
}

export async function postLongResetKill({ userId }) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const url = `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_LONG_RESET_KILL}`;
  const res = await longOpsFetch(url, {
    method: 'POST',
    body: JSON.stringify({ userId: String(userId).trim() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwLongOpsHttp(res, data);
  return data;
}

export async function postLongActivateKill({ userId, reason = 'manual-block' }) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const url = `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_LONG_ACTIVATE_KILL}`;
  const res = await longOpsFetch(url, {
    method: 'POST',
    body: JSON.stringify({ userId: String(userId).trim(), reason: String(reason).trim() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwLongOpsHttp(res, data);
  return data;
}

export async function postLongTokenBlock({ userId, symbol, durationMinutes, permanent = false }) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const url = `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_LONG_TOKEN_BLOCK}`;
  const body = { userId: String(userId).trim(), symbol: String(symbol).trim().toUpperCase() };
  if (permanent) body.permanent = true;
  else if (durationMinutes != null) body.durationMinutes = Number(durationMinutes);
  const res = await longOpsFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwLongOpsHttp(res, data);
  return data;
}

export async function postLongTokenBlockClear({ userId, symbol }) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const url = `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_LONG_TOKEN_BLOCK_CLEAR}`;
  const res = await longOpsFetch(url, {
    method: 'POST',
    body: JSON.stringify({ userId: String(userId).trim(), symbol: String(symbol).trim().toUpperCase() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwLongOpsHttp(res, data);
  return data;
}

export async function getLongTokenBlocks(userId) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const params = new URLSearchParams({ userId: String(userId).trim() });
  const url = `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_LONG_TOKEN_BLOCKS}?${params.toString()}`;
  const res = await longOpsFetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwLongOpsHttp(res, data);
  return data;
}

export async function postLongTokenBlockBulk({ userId, symbols, durationMinutes, permanent = false }) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const url = `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_LONG_TOKEN_BLOCK_BULK}`;
  const body = {
    userId: String(userId).trim(),
    symbols: Array.isArray(symbols) ? symbols.map((s) => String(s).trim().toUpperCase()).filter(Boolean) : [],
  };
  if (permanent) body.permanent = true;
  else if (durationMinutes != null) body.durationMinutes = Number(durationMinutes);
  const res = await longOpsFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwLongOpsHttp(res, data);
  return data;
}

/**
 * Per poziție LONG deschisă: `userBlocksOtaCloseWhileNetLoss` — OTA nu execută închideri automate în pierdere
 * pentru **această** poziție (manual close rămâne). Nu afectează alte simboluri.
 */
export async function postLongPositionLossCloseGuard({ userId, positionId, userBlocksOtaCloseWhileNetLoss }) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const url = `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_LONG_POSITION_LOSS_CLOSE_GUARD}`;
  const res = await longOpsFetch(url, {
    method: 'POST',
    body: JSON.stringify({
      userId: String(userId).trim(),
      positionId: Number(positionId),
      userBlocksOtaCloseWhileNetLoss,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwLongOpsHttp(res, data);
  return data;
}

export async function postLongTokenBlockClearAll({ userId }) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const url = `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_LONG_TOKEN_BLOCK_CLEAR_ALL}`;
  const res = await longOpsFetch(url, {
    method: 'POST',
    body: JSON.stringify({ userId: String(userId).trim() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwLongOpsHttp(res, data);
  return data;
}

/**
 * Ultimele analize din `ota.analysis_results` pentru user (orice semnal), după `created_at` DESC.
 * Folosește GET /ai-trading/signals — NU /long/recent-llm-signals (acela filtrează doar buy/open_long).
 * `tradeContext`: long_spot | long_focus | common | … | all. Panoul LONG apelează `long_spot` + `common` + `long_focus`;
 * `filterSignalsForLongFuturesFeed` păstrează lane long + `common` relevant + `short_*` cu semnal informativ LONG (vezi `otaFuturesSignalContext.js`).
 * `skipCache`: true la refresh forțat — sare cache-ul client (`otaSignalsListClientCache`).
 *
 * Transport: `otaApiRequest` (Bearer sesiune OTA wallet când `OTA_WALLET_AUTH_ENFORCE` pe server).
 * Fără `X-Ota-Long-Ops-Secret` pe această rută — secretul Long rămâne pentru `/long/*` dedicate.
 */
export async function getRecentLongSignals(
  userId,
  { limit = 4, signal = null, tradeContext = 'long_spot', skipCache = false } = {}
) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  if (!userId || String(userId).trim() === '') {
    return { success: true, signals: [], count: 0 };
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
  recordOtaSignalsListNetworkFetch();
  const data = await otaApiRequest(pathWithQuery, { method: 'GET' });
  const signals = coerceSignalsArrayFromApiPayload(data);
  const out = { ...data, signals };
  writeOtaSignalsListCache(userId, queryOpts, out);
  return out;
}

export async function getWinRateStats(userId, { days = 30 } = {}) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  const uid = requireUserId(userId, 'getLongWinRateStats');
  const params = new URLSearchParams({ days: String(days) });
  params.set('userId', uid);
  const url = `${base.replace(/\/$/, '')}${API_ENDPOINTS.OTA_LONG_WIN_RATE_STATS}?${params.toString()}`;
  const res = await longOpsFetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwLongOpsHttp(res, data);
  return data;
}


export async function getKillStatus(userId) {
  const uid = requireUserId(userId, 'getLongKillStatus');
  const url = buildLongOpsUrl(API_ENDPOINTS.OTA_LONG_KILL_STATUS, { userId: uid });
  const res = await longOpsFetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwLongOpsHttp(res, data);
  return data;
}

/** SSE GET /ai-trading/signals/stream (fetch + Bearer; vezi `otaSignalsStreamClient.js`). */
export { subscribeOtaSignalsListStream, buildOtaSignalsStreamUrl } from '../utils/otaSignalsStreamClient';

export async function getExecutorDecisions({ userId = null, token = null, limit = 100 } = {}) {
  const uid = requireUserId(userId, 'getLongExecutorDecisions');
  const url = buildLongOpsUrl(API_ENDPOINTS.OTA_LONG_EXECUTOR_DECISIONS, {
    userId: uid,
    token: token || undefined,
    limit: limit != null ? String(limit) : undefined,
  });
  const res = await longOpsFetch(url, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwLongOpsHttp(res, data);
  return data;
}
