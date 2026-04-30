/**
 * Live price for micro-profit panel: executionQuote first, SEI-only CoinGecko fallback for display.
 */

import { useState, useEffect } from 'react';
import { getOTAQuote, readOtaQuoteNumber } from '../../frontend/services/aiTradingApiService';

const COINGECKO_SEI_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=sei-network&vs_currencies=usd';
const QUOTE_CACHE_TTL_MS = 5000;
const quoteCache = new Map();

async function fetchExecutionQuote(base, quote) {
  const key = `${String(base || '').toUpperCase()}/${String(quote || '').toUpperCase()}`;
  const now = Date.now();
  const cached = quoteCache.get(key);
  if (cached && now - cached.fetchedAt < QUOTE_CACHE_TTL_MS) {
    if (cached.promise) return cached.promise;
    return cached.value;
  }
  if (cached?.promise) return cached.promise;

  const promise = getOTAQuote(base, quote, '1', { chain: 'sei' })
    .then((response) => readOtaQuoteNumber(response))
    .catch(() => null)
    .then((value) => {
      quoteCache.set(key, { value, fetchedAt: Date.now(), promise: null });
      return value;
    });

  quoteCache.set(key, { value: cached?.value ?? null, fetchedAt: now, promise });
  return promise;
}

export function useSeiMarketData(base, quote, options = {}) {
  const {
    intervalMs = 30000,
    unavailableMessage = 'Price unavailable',
  } = options;
  const [livePrice, setLivePrice] = useState(null);
  const [livePriceError, setLivePriceError] = useState(null);
  const [hasExecutionQuote, setHasExecutionQuote] = useState(false);
  const [usedFallbackPrice, setUsedFallbackPrice] = useState(false);
  const [lastExecutionQuoteAt, setLastExecutionQuoteAt] = useState(null);
  const [lastPriceAt, setLastPriceAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [priceSource, setPriceSource] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const fetchFromCoinGecko = async () => {
      const res = await fetch(COINGECKO_SEI_URL, { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      const usd = data?.['sei-network']?.usd;
      return typeof usd === 'number' ? usd : null;
    };
    const tick = async () => {
      let p = null;
      let exec = false;
      try {
        const q = await fetchExecutionQuote(base, quote);
        if (cancelled) return;
        p = q;
        if (Number.isFinite(p)) {
          exec = true;
          setHasExecutionQuote(true);
          setUsedFallbackPrice(false);
          setLastExecutionQuoteAt(Date.now());
          setLastPriceAt(Date.now());
          setPriceSource('executionQuote');
        }
      } catch {
        if (cancelled) return;
      }
      if (!exec && base === 'SEI') {
        try {
          p = await fetchFromCoinGecko();
          if (cancelled) return;
          if (Number.isFinite(p)) {
            setHasExecutionQuote(false);
            setUsedFallbackPrice(true);
            setLastPriceAt(Date.now());
            setPriceSource('fallbackPrice');
          }
        } catch {
          /* noop */
        }
      }
      if (cancelled) return;
      if (Number.isFinite(p)) {
        setLivePrice(p);
        setLivePriceError(null);
      } else {
        setLivePrice(null);
        setLivePriceError(unavailableMessage || null);
        setHasExecutionQuote(false);
        setUsedFallbackPrice(false);
        setPriceSource(null);
      }
      setLoading(false);
    };
    tick();
    const t = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [base, quote, intervalMs, unavailableMessage]);

  return {
    livePrice,
    livePriceError,
    hasExecutionQuote,
    usedFallbackPrice,
    lastExecutionQuoteAt,
    lastPriceAt,
    loading,
    priceSource,
  };
}
