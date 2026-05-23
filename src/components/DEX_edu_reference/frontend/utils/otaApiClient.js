/**
 * OTA API Client - request helper cu timeout și retry
 * SSOT pentru apeluri către backend OTA / ai-trading / execution.
 * - getApiBaseUrl() la fiecare request (respectă runtime-config.json)
 * - Timeout 15s (AbortController) – signal nu poate fi suprascris
 * - 1 retry la eroare de rețea (TypeError / Failed to fetch), fără retry la AbortError
 */

import * as apiEndpoints from '../../config/apiEndpoints.js';
import {
  getOtaLongOpsSecret,
  getOtaShortOpsSecret,
  loadRuntimeConfig,
} from '../../config/runtimeConfig.js';
import {
  getOtaWalletAuthToken,
  clearOtaWalletSession,
  waitForOtaWalletSessionRefresh,
  OTA_SESSION_INVALID_EVENT,
} from './otaWalletSession';
import { formatOtaSessionUserMessage } from './otaSessionUserMessage';

const OTA_WALLET_STALE_CODES = new Set([
  'OTA_WALLET_AUTH_REQUIRED',
  'OTA_WALLET_TOKEN_INVALID',
  'OTA_WALLET_IDENTITY_MISMATCH',
]);

const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';

/** Timeout per request (ms). Exportat pentru teste. */
export const REQUEST_TIMEOUT_MS = 15000;
const MAX_RETRIES = 1;
const RATE_LIMIT_RETRY_DELAY_MS = 4000;
const INFLIGHT_GET_DEDUPE_MS = 2500;
const inFlightGetRequests = new Map();
/** Limitează ștergerea sesiunii + evenimentul „invalid” + așteptarea resign — evită sute de prompturi MetaMask la fiecare 401 din poll. */
let lastOtaWalletClearNotifyAt = 0;
const OTA_WALLET_CLEAR_NOTIFY_MIN_MS = 120000;

/** Doar teste — resetează throttle-ul între suite (variabilă de modul). */
export function __resetOtaWalletClearNotifyThrottleForTests() {
  lastOtaWalletClearNotifyAt = 0;
}

function isNetworkError(error) {
  if (!error || typeof error !== 'object') return false;
  if (error.name === 'TypeError' && (error.message === 'Failed to fetch' || error.message?.includes('fetch'))) return true;
  return false;
}

function makeInFlightGetKey(url, defaultOptions) {
  const headers = defaultOptions?.headers || {};
  const auth = headers.Authorization || headers.authorization || '';
  const shortSecret = headers['X-Ota-Short-Ops-Secret'] ? 'short' : '';
  const longSecret = headers['X-Ota-Long-Ops-Secret'] ? 'long' : '';
  return `${url}|auth:${auth}|ops:${shortSecret}:${longSecret}`;
}

function cloneJsonPayload(value) {
  if (value == null || typeof value !== 'object') return value;
  try {
    if (typeof structuredClone === 'function') return structuredClone(value);
  } catch (_) {}
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_) {
    return value;
  }
}

/** Mesaje user-friendly per cod HTTP / tip eroare. La 503 păstrăm mesajul backend. La 500 mesaj care nu sperie userul. */
function getUserFriendlyMessage(status, errorData) {
  const msg = errorData?.message || errorData?.error;
  const code = errorData?.code;
  /** 401/403 OTA wallet: nu „Session expired” generic (confundă login Google cu semnătura wallet). */
  if (status === 401 || (status === 403 && code === 'OTA_WALLET_IDENTITY_MISMATCH')) {
    const otaText = formatOtaSessionUserMessage({
      failedStatus: status,
      code,
      message: typeof msg === 'string' ? msg : String(msg ?? ''),
    });
    if (otaText) return otaText;
  }
  if (status === 401) return 'Session expired. Please reconnect.';
  if (status === 403) return 'You do not have permission for this action.';
  if (status === 404) return (typeof msg === 'string' && msg.trim()) ? msg : 'Resource not found.';
  if (status === 429) return 'Too many requests. Try again in a few seconds.';
  if (status === 503 && msg) return msg;
  if (status >= 500) {
    if (msg && (String(msg).toLowerCase().includes('market') || String(msg).toLowerCase().includes('unavailable') || String(msg).toLowerCase().includes('binance'))) return msg;
    if (msg && String(msg).trim().length > 0) return msg;
    return 'Market data is temporarily unavailable. You can try again in a minute or use Swap to trade manually.';
  }
  if (status === 400 && !msg && errorData?.debug?.originalError) {
    return errorData.debug.originalError;
  }
  return msg || `Error ${status}. Try again.`;
}

/**
 * Execută un request către API-ul backend cu timeout și retry.
 * @param {string} endpoint - calea relativă (ex: /ai-trading/health)
 * @param {RequestInit & { timeoutMs?: number, omitOtaWalletBearer?: boolean, suppressOtaWalletSessionClearOn401?: boolean, allowOtaWalletReauthOnGet401?: boolean }} options - fetch + extensii OTA
 * @param {number} retryCount - număr retry curent (intern)
 * @returns {Promise<Object>} JSON response
 */
export async function otaApiRequest(endpoint, options = {}, retryCount = 0) {
  await loadRuntimeConfig();
  const isDE = endpoint.includes('direct-entry');
  let baseUrl = apiEndpoints.getApiBaseUrl();
  if (!baseUrl || typeof baseUrl !== 'string' || baseUrl.trim() === '') {
    const backend = apiEndpoints.getBackendUrl();
    baseUrl = backend && typeof backend === 'string' ? `${backend.replace(/\/$/, '')}/api` : '';
  }
  if (!baseUrl || baseUrl.trim() === '') {
    if (isDE && isDev) console.error('[DE] otaApiRequest baseUrl EMPTY');
    throw new Error('[otaApiClient] getApiBaseUrl() returned empty; check runtime config and REACT_APP_API_BASE_URL');
  }
  const url = `${baseUrl.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const timeoutMs = options.timeoutMs != null && Number.isFinite(Number(options.timeoutMs)) ? Number(options.timeoutMs) : REQUEST_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const {
    signal: _ignored,
    timeoutMs: _t,
    omitOtaWalletBearer,
    suppressOtaWalletSessionClearOn401,
    allowOtaWalletReauthOnGet401,
    ...restOptions
  } = options;
  const mergedHeaders = { 'Content-Type': 'application/json', ...restOptions.headers };
  const otaTok =
    typeof window !== 'undefined' && !omitOtaWalletBearer ? getOtaWalletAuthToken() : null;
  const epNorm = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (epNorm.includes('/ai-trading/short/') && !mergedHeaders['X-Ota-Short-Ops-Secret']) {
    const shortOpsSecret = getOtaShortOpsSecret();
    if (shortOpsSecret) mergedHeaders['X-Ota-Short-Ops-Secret'] = shortOpsSecret;
  }
  if (epNorm.includes('/ai-trading/long/') && !mergedHeaders['X-Ota-Long-Ops-Secret']) {
    const longOpsSecret = getOtaLongOpsSecret();
    if (longOpsSecret) mergedHeaders['X-Ota-Long-Ops-Secret'] = longOpsSecret;
  }
  if (
    otaTok &&
    epNorm.includes('/ai-trading') &&
    !mergedHeaders.Authorization &&
    !mergedHeaders.authorization
  ) {
    mergedHeaders.Authorization = `Bearer ${otaTok}`;
  }
  const defaultOptions = {
    credentials: 'include',
    cache: 'no-store',
    headers: mergedHeaders,
    ...restOptions,
    signal: controller.signal
  };
  const requestMethod = String(defaultOptions.method || 'GET').toUpperCase();

  const isDirectEntry = endpoint.includes('direct-entry');

  const executeRequest = async () => {
  try {
    const response = await fetch(url, defaultOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errCode = errorData?.code;
      const isOtaAuthPath =
        epNorm.includes('/auth/evm/challenge') ||
        epNorm.includes('/auth/evm/verify') ||
        epNorm.includes('/auth/evm/session');
      const canRetryOtaWallet =
        !suppressOtaWalletSessionClearOn401 &&
        retryCount === 0 &&
        typeof window !== 'undefined' &&
        epNorm.includes('/ai-trading') &&
        !isOtaAuthPath &&
        (requestMethod !== 'GET' || allowOtaWalletReauthOnGet401 === true) &&
        OTA_WALLET_STALE_CODES.has(errCode) &&
        (response.status === 401 || response.status === 403);
      if (canRetryOtaWallet) {
        const now = Date.now();
        const allowClearChain =
          now - lastOtaWalletClearNotifyAt >= OTA_WALLET_CLEAR_NOTIFY_MIN_MS;
        if (allowClearChain) {
          lastOtaWalletClearNotifyAt = now;
          clearOtaWalletSession();
          window.dispatchEvent(new CustomEvent(OTA_SESSION_INVALID_EVENT, { detail: { code: errCode } }));
          if (
            requestMethod === 'GET' &&
            allowOtaWalletReauthOnGet401 === true &&
            errCode === 'OTA_WALLET_IDENTITY_MISMATCH'
          ) {
            return otaApiRequest(
              endpoint,
              { ...options, suppressOtaWalletSessionClearOn401: true },
              retryCount + 1,
            );
          }
          try {
            await waitForOtaWalletSessionRefresh();
            return otaApiRequest(endpoint, options, retryCount + 1);
          } catch {
            /* timeout — continuă cu throw mai jos */
          }
        }
      }
      if (response.status === 429 && retryCount < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RATE_LIMIT_RETRY_DELAY_MS));
        return otaApiRequest(endpoint, options, retryCount + 1);
      }
      const isDirectEntry400 = endpoint.includes('direct-entry/open') && response.status === 400;
      const isDirectEntryReq = endpoint.includes('direct-entry');
      if (isDirectEntry400 && isDev) {
        const dbg = errorData?.debug || {};
        console.warn('[DE] otaApiClient 400 (direct-entry/open):', {
          message: errorData?.message,
          decodedRevertReason: dbg.decodedRevertReason,
          originalError: dbg.originalError,
          vaultBalance: dbg.vaultBalanceUsdt,
          quoteToken: dbg.quoteToken,
          reason: dbg.reason,
          fullDebug: dbg
        });
      }
      if (isDirectEntryReq && response.status !== 200 && isDev) {
        console.warn('[DE] otaApiClient', response.status, endpoint, { url, status: response.status, body: errorData });
      }
      if (!isDirectEntry400 && !isDirectEntryReq && process.env.NODE_ENV === 'development') {
        const isWalkForward400 = endpoint.includes('walk-forward') && response.status === 400;
        if (!isWalkForward400) {
          console.warn('[otaApiClient] API Error', { endpoint, url, status: response.status, body: errorData });
        }
      }
      const err = new Error(getUserFriendlyMessage(response.status, errorData));
      err.failedEndpoint = endpoint;
      err.failedUrl = url;
      err.failedStatus = response.status;
      if (errorData?.hint) err.hint = errorData.hint;
      if (errorData?.botAddressUsed) err.botAddressUsed = errorData.botAddressUsed;
      if (errorData?.debug) err.debug = errorData.debug;
      if (errorData?.code != null) err.code = errorData.code;
      else if (errorData?.debug?.code != null) err.code = errorData.debug.code;
      err.responseBody = errorData;
      if (errorData?.billing != null && typeof errorData.billing === 'object') {
        err.billing = errorData.billing;
      }
      if (response.status === 400) err.is400 = true;
      throw err;
    }

    const json = await response.json().catch((e) => { throw e; });
    return json;
  } catch (error) {
    clearTimeout(timeoutId);
    const isRetryable = isNetworkError(error) && retryCount < MAX_RETRIES;
    if (isRetryable) {
      return otaApiRequest(endpoint, options, retryCount + 1);
    }
    if (error?.name === 'AbortError') {
      throw new Error('Response timed out. Try again.');
    }
    const isDirectEntryRevert = endpoint.includes('direct-entry/open') && (error?.code === 'CALL_EXCEPTION' || /transaction failed/i.test(error?.message || ''));
    if (process.env.NODE_ENV === 'development' && !isDirectEntryRevert && !isDirectEntry) {
      const isWalkForwardInsufficientData =
        endpoint.includes('walk-forward') &&
        error?.failedStatus === 400 &&
        /not enough historical data/i.test(String(error?.message ?? ''));
      if (!isWalkForwardInsufficientData) {
        const debugPayload = {
          endpoint,
          url,
          name: error?.name,
          message: error?.message,
          reason: error?.reason,
          code: error?.code,
          hint: error?.hint,
          error: error?.error ? { message: error.error?.message, reason: error.error?.reason, code: error.error?.code } : undefined
        };
        console.warn('[otaApiClient] Request failed', debugPayload);
      }
    }
    throw error;
  }
  };

  const canDedupeInFlight =
    requestMethod === 'GET' &&
    retryCount === 0 &&
    options.dedupeInFlight !== false;

  if (canDedupeInFlight) {
    const key = makeInFlightGetKey(url, defaultOptions);
    const existing = inFlightGetRequests.get(key);
    const now = Date.now();
    if (existing && now - existing.at < INFLIGHT_GET_DEDUPE_MS) {
      clearTimeout(timeoutId);
      if (existing.value !== undefined) return cloneJsonPayload(existing.value);
      return existing.promise.then(cloneJsonPayload);
    }
    const promise = executeRequest();
    inFlightGetRequests.set(key, { at: now, promise });
    promise.then((value) => {
      if (inFlightGetRequests.get(key)?.promise === promise) {
        inFlightGetRequests.set(key, { at: Date.now(), value });
        setTimeout(() => {
          if (Date.now() - (inFlightGetRequests.get(key)?.at || 0) >= INFLIGHT_GET_DEDUPE_MS) {
            inFlightGetRequests.delete(key);
          }
        }, INFLIGHT_GET_DEDUPE_MS + 100);
      }
    }, () => {
      if (inFlightGetRequests.get(key)?.promise === promise) {
        inFlightGetRequests.delete(key);
      }
    });
    return promise;
  }

  return executeRequest();
}

/** Timeout pentru SSE chat (răspunsuri lungi); separat de REQUEST_TIMEOUT_MS. */
const OTA_CHAT_STREAM_TIMEOUT_MS = 600000;

/**
 * POST /ai-trading/chat cu `stream: true` — răspuns SSE (text/event-stream).
 * @param {string} endpoint - ex. API_ENDPOINTS.OTA_CHAT
 * @param {{
 *   body: Record<string, unknown>,
 *   onDelta?: (chunk: string, full: string) => void,
 *   signal?: AbortSignal,
 *   timeoutMs?: number,
 *   omitOtaWalletBearer?: boolean,
 * }} options
 * @returns {Promise<{ content: string, usage?: object }>}
 */
export async function otaApiChatStream(endpoint, options = {}) {
  const {
    body,
    onDelta,
    signal: outerSignal,
    timeoutMs = OTA_CHAT_STREAM_TIMEOUT_MS,
    omitOtaWalletBearer,
  } = options;

  let baseUrl = apiEndpoints.getApiBaseUrl();
  if (!baseUrl || typeof baseUrl !== 'string' || baseUrl.trim() === '') {
    const backend = apiEndpoints.getBackendUrl();
    baseUrl = backend && typeof backend === 'string' ? `${backend.replace(/\/$/, '')}/api` : '';
  }
  if (!baseUrl || baseUrl.trim() === '') {
    throw new Error('[otaApiClient] getApiBaseUrl() returned empty; check runtime config');
  }
  const url = `${baseUrl.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const epNorm = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  if (outerSignal) {
    if (outerSignal.aborted) controller.abort();
    else outerSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const mergedHeaders = { 'Content-Type': 'application/json', Accept: 'text/event-stream' };
  const otaTok =
    typeof window !== 'undefined' && !omitOtaWalletBearer ? getOtaWalletAuthToken() : null;
  if (
    otaTok &&
    epNorm.includes('/ai-trading') &&
    !mergedHeaders.Authorization &&
    !mergedHeaders.authorization
  ) {
    mergedHeaders.Authorization = `Bearer ${otaTok}`;
  }

  let full = '';
  let usage = null;

  try {
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: mergedHeaders,
      body: JSON.stringify({ ...body, stream: true }),
      signal: controller.signal,
    });

    if (!response.ok) {
      clearTimeout(timeoutId);
      const errorData = await response.json().catch(() => ({}));
      const err = new Error(getUserFriendlyMessage(response.status, errorData));
      err.failedEndpoint = endpoint;
      err.failedUrl = url;
      err.failedStatus = response.status;
      if (errorData?.code != null) err.code = errorData.code;
      err.responseBody = errorData;
      throw err;
    }

    if (!response.body) {
      throw new Error('Streaming response has no body.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const processLine = (line) => {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) return;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === '[DONE]') return;
      let obj;
      try {
        obj = JSON.parse(payload);
      } catch {
        return;
      }
      if (obj.type === 'token' && obj.content) {
        full += obj.content;
        if (typeof onDelta === 'function') onDelta(obj.content, full);
      }
      if (obj.type === 'usage' && obj.usage) {
        usage = obj.usage;
      }
      if (obj.type === 'error') {
        const e = new Error(obj.message || 'Stream error');
        if (obj.status != null) e.failedStatus = obj.status;
        throw e;
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
      let sep;
      while ((sep = buffer.indexOf('\n\n')) >= 0) {
        const block = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        for (const line of block.split(/\r?\n/)) {
          processLine(line);
        }
      }
      if (done) break;
    }
    if (buffer.trim()) {
      for (const line of buffer.split(/\r?\n/)) {
        processLine(line);
      }
    }

    clearTimeout(timeoutId);
    return { content: full, usage: usage || undefined };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error?.name === 'AbortError') {
      throw new Error('Response timed out. Try again.');
    }
    throw error;
  }
}

/**
 * Returns bot wallet address for Authorize Bot (EOA). Backend GET /ai-trading/bot-address.
 * @returns {Promise<string|null>} 0x address or null
 */
export async function getBotWalletAddress() {
  try {
    const path = apiEndpoints.API_ENDPOINTS?.OTA_BOT_ADDRESS || '/ai-trading/bot-address';
    const data = await otaApiRequest(path, { method: 'GET' });
    const addr = data?.botWalletAddress ?? data?.address ?? data?.botAddress;
    return typeof addr === 'string' && addr.trim().startsWith('0x') ? addr.trim() : null;
  } catch {
    return null;
  }
}
