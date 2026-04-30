/**
 * Single polling source for STX OTA page: backend quote (chain=stx).
 * Used by OtaStxPairProvider only — not per-component.
 */

import { useState, useEffect } from 'react';
import { getOTAQuote, readOtaQuoteNumber } from '../../frontend/services/aiTradingApiService';

const DEFAULT_POLL_MS = 15000;

/**
 * @param {string} base
 * @param {string} quote
 * @param {{ intervalMs?: number }} [options]
 */
export function useStxOtaPairPrice(base, quote, options = {}) {
  const { intervalMs = DEFAULT_POLL_MS } = options;
  const [livePriceUsd, setLivePriceUsd] = useState(null);
  const [livePriceError, setLivePriceError] = useState(null);
  const [livePriceLoading, setLivePriceLoading] = useState(true);
  const [livePriceLastAt, setLivePriceLastAt] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const q = await getOTAQuote(base, quote, '1', { chain: 'stx' });
        const p = readOtaQuoteNumber(q);
        if (cancelled) return;
        if (Number.isFinite(p)) {
          setLivePriceUsd(p);
          setLivePriceError(null);
          setLivePriceLastAt(Date.now());
        } else {
          setLivePriceUsd(null);
          setLivePriceError('Price temporarily unavailable');
        }
      } catch (e) {
        if (!cancelled) {
          setLivePriceError(e?.message || 'Price unavailable');
          setLivePriceUsd(null);
        }
      } finally {
        if (!cancelled) setLivePriceLoading(false);
      }
    };
    tick();
    const t = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [base, quote, intervalMs]);

  return {
    livePriceUsd,
    livePriceError,
    livePriceLoading,
    livePriceLastAt,
  };
}
