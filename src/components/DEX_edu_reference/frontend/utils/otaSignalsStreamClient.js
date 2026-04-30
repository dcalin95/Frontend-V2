/**
 * Client SSE pentru GET /api/ai-trading/signals/stream.
 * Folosește fetch + ReadableStream (nu EventSource nativ) ca să putem trimite Authorization Bearer (OTA wallet).
 */

import { getApiBaseUrl, API_ENDPOINTS } from '../../config/apiEndpoints.js';
import { getOtaWalletAuthToken } from './otaWalletSession';

/** După închidere normală a body-ului SSE, reconectare (server poate închide periodic). */
const SSE_STREAM_RECONNECT_AFTER_CLOSE_MS = 2000;
/** Backoff pentru 429/5xx/rețea între încercări (plafon). */
const SSE_STREAM_RETRY_MAX_MS = 30_000;

function sseRetryDelayMs(consecutiveFails) {
  return Math.min(SSE_STREAM_RETRY_MAX_MS, 500 * 2 ** Math.min(consecutiveFails, 6));
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * @param {Record<string, string|number|undefined|null>} query — userId, limit, offset, tradeContext, signal
 * @returns {string} URL absolut
 */
export function buildOtaSignalsStreamUrl(query) {
  const base = getApiBaseUrl();
  if (!base || typeof base !== 'string') {
    throw new Error('[otaSignalsStreamClient] getApiBaseUrl() empty');
  }
  const params = new URLSearchParams();
  if (query.userId != null) params.set('userId', String(query.userId).trim());
  if (query.limit != null) params.set('limit', String(query.limit));
  if (query.offset != null) params.set('offset', String(query.offset));
  if (query.tradeContext != null && String(query.tradeContext).trim() !== '') {
    params.set('tradeContext', String(query.tradeContext).trim());
  }
  if (query.signal != null && String(query.signal).trim() !== '') {
    params.set('signal', String(query.signal).trim());
  }
  const q = params.toString();
  const path = `${API_ENDPOINTS.SIGNALS_STREAM}${q ? `?${q}` : ''}`;
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Parsare incrementală SSE (data: …\\n\\n). Exportat pentru teste. */
export function consumeSseTextChunk(buffer, textChunk, onJsonObjects) {
  let buf = buffer + textChunk;
  let out = buf;
  while (true) {
    const sep = out.indexOf('\n\n');
    if (sep < 0) return out;
    const block = out.slice(0, sep);
    out = out.slice(sep + 2);
    const lines = block.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const raw = line.slice(6).trim();
        if (!raw) continue;
        try {
          onJsonObjects(JSON.parse(raw));
        } catch {
          /* ignore bad chunk */
        }
      }
    }
  }
}

/**
 * Subscribe la stream; returnează { close }.
 * @param {object} query
 * @param {{ onEvent?: (obj: object) => void, onError?: (err: Error) => void, signal?: AbortSignal }} handlers
 */
export function subscribeOtaSignalsListStream(query, handlers = {}) {
  const { onEvent, onError, signal: externalSignal } = handlers;
  const controller = new AbortController();

  const abortBoth = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) abortBoth();
    else externalSignal.addEventListener('abort', abortBoth, { once: true });
  }

  let closed = false;
  const handleSseObject = (obj) => {
    if (!closed) onEvent?.(obj);
  };

  const run = async () => {
    let consecutiveFails = 0;
    while (!closed) {
      let buf = '';
      try {
        const url = buildOtaSignalsStreamUrl(query);
        const headers = { Accept: 'text/event-stream' };
        const tok = typeof window !== 'undefined' ? getOtaWalletAuthToken() : null;
        if (tok) headers.Authorization = `Bearer ${tok}`;
        const res = await fetch(url, {
          method: 'GET',
          headers,
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!res.ok) {
          const st = res.status;
          if (st === 401 || st === 403 || st === 404) {
            const err = new Error(`Signals stream HTTP ${st}`);
            err.failedStatus = st;
            if (!closed) onError?.(err);
            return;
          }
          consecutiveFails += 1;
          await sleep(sseRetryDelayMs(consecutiveFails));
          continue;
        }
        const reader = res.body?.getReader?.();
        if (!reader) {
          consecutiveFails += 1;
          await sleep(sseRetryDelayMs(consecutiveFails));
          continue;
        }
        consecutiveFails = 0;
        const dec = new TextDecoder();
        while (!closed) {
          const { done, value } = await reader.read();
          if (done) {
            const tail = dec.decode();
            if (tail) {
              buf = consumeSseTextChunk(buf, tail, handleSseObject);
            }
            break;
          }
          buf = consumeSseTextChunk(buf, dec.decode(value, { stream: true }), handleSseObject);
        }
        if (closed) return;
        await sleep(SSE_STREAM_RECONNECT_AFTER_CLOSE_MS);
      } catch (e) {
        if (closed || e?.name === 'AbortError') return;
        consecutiveFails += 1;
        await sleep(sseRetryDelayMs(consecutiveFails));
      }
    }
  };

  run();

  return {
    close: () => {
      closed = true;
      abortBoth();
    },
  };
}
