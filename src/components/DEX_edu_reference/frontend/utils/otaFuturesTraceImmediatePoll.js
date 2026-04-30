/**
 * Poll imediat pentru strip-ul Trace (Matrix) pe Futures Ops după refresh forțat al feed-ului de semnale
 * (`fetchRecentLlmSignals({ forceReplace: true })` în LongOpsPanel / ShortOpsPanel).
 *
 * GET /agent/trace/live nu are cache client; intervalul adaptiv din `OtaFuturesAgentTraceStrip` (~8s) altfel
 * întârzie evenimentele noi. **Nu** reduce pragul de poll periodic (vezi AGENTS.md pct. 16).
 *
 * Consumator: `OtaFuturesAgentTraceStrip` — listener `OTA_FUTURES_TRACE_IMMEDIATE_POLL`.
 */
export const OTA_FUTURES_TRACE_IMMEDIATE_POLL = 'ota-futures-trace-immediate-poll';
export const OTA_FUTURES_TRACE_APPEND_EVENT = 'ota-futures-trace-append-event';

/**
 * Emite eveniment global; strip-ul Matrix face un `tick()` (coalesced, fără GET paralele).
 */
export function dispatchOtaFuturesTraceImmediatePoll() {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(OTA_FUTURES_TRACE_IMMEDIATE_POLL));
    }
  } catch (_) {
    /* ignore */
  }
}

/**
 * Împinge în Matrix un eveniment real derivat din răspunsul de analyze local, fără a aștepta poll-ul backend.
 * Consumator: `OtaFuturesAgentTraceStrip`.
 * Payload minim: { userId, event }
 */
export function dispatchOtaFuturesTraceAppendEvent(payload) {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(OTA_FUTURES_TRACE_APPEND_EVENT, { detail: payload || null }));
    }
  } catch (_) {
    /* ignore */
  }
}
