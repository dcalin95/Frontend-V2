/**
 * Lightweight provider health for SEI OTA page (client-side).
 */

export function createInitialSeiProviderHealth() {
  return {
    quoteSource: null,
    quoteLastSuccessAt: null,
    quoteLastFailureAt: null,
    fallbackUsed: false,
    degraded: false,
    message: null,
  };
}

export function markQuoteSuccess(state, source = 'backend') {
  return {
    ...state,
    quoteSource: source,
    quoteLastSuccessAt: Date.now(),
    fallbackUsed: source === 'fallback',
    degraded: source === 'fallback',
    message: source === 'fallback' ? 'Execution quote unavailable — UI estimate only' : null,
  };
}

export function markQuoteFailure(state) {
  return {
    ...state,
    quoteLastFailureAt: Date.now(),
    degraded: true,
    message: 'Quote provider error',
  };
}
