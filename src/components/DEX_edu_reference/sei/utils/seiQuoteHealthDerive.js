/**
 * Pure derivation for compact quote / execution readiness UI (micro-profit panel).
 * Fallback/reference-only must not imply executionReady.
 */

import { SEI_MARKET_DATA_STALE_MS } from '../constants/otaSeiPageDefaults';

/**
 * @param {object} o
 * @param {boolean} o.hasExecutionQuote - backend getOTAQuote succeeded for panel pair
 * @param {boolean} o.usedFallbackPrice - CoinGecko (or non-exec) used for displayed price
 * @param {number|null} o.lastExecutionQuoteAt - Date.now() when last exec quote OK
 * @param {number} [o.now]
 * @param {number} [o.execQuoteStaleMs] - panel live quote max age before "Exec stale"
 */
export function deriveSeiQuoteHealthState({
  hasExecutionQuote,
  usedFallbackPrice,
  lastExecutionQuoteAt,
  now = Date.now(),
  execQuoteStaleMs = SEI_MARKET_DATA_STALE_MS,
}) {
  if (!hasExecutionQuote) {
    if (usedFallbackPrice) {
      return {
        labels: ['Fallback', 'Degraded'],
        executionReady: false,
        degraded: true,
        title: 'executionQuote missing — UI estimate only; do not treat as fill price',
      };
    }
    return {
      labels: ['Ref only'],
      executionReady: false,
      degraded: true,
      title: 'No execution quote — not ready to size swaps from this price',
    };
  }
  if (usedFallbackPrice) {
    return {
      labels: ['Fallback', 'Degraded'],
      executionReady: false,
      degraded: true,
      title: 'Mixed state: unexpected fallback while exec reported',
    };
  }
  const age = lastExecutionQuoteAt != null ? now - lastExecutionQuoteAt : 0;
  if (age > execQuoteStaleMs) {
    return {
      labels: ['Exec stale'],
      executionReady: false,
      degraded: true,
      quoteAgeMs: age,
      title: `Last execution quote ${Math.round(age / 1000)}s ago — refresh before relying on size`,
    };
  }
  return {
    labels: ['Exec fresh'],
    executionReady: true,
    degraded: false,
    quoteAgeMs: age,
    title: 'Recent backend quote for selected pair — inform sizing only; not guaranteed fill',
  };
}
