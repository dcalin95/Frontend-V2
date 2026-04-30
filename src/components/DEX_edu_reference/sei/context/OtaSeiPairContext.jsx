/**
 * Single source of truth for SEI OTA page market context.
 * Drives chart symbol, live strip, grid sync, micro-profit panel pair.
 * Shared live price (executionQuote + fallback) — one poll for Live window + Open orders.
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { SEI_PAIR_TO_CHART_SYMBOL } from '../seiTokenConfig';
import {
  DEFAULT_OTA_SEI_PAGE_PAIR,
  SEI_CANONICAL_STABLE_SYMBOL,
} from '../constants/otaSeiPageDefaults';
import { createInitialSeiProviderHealth } from '../utils/seiProviderHealth';
import { useSeiMarketData } from '../hooks/useSeiMarketData';

const LIVE_PRICE_POLL_MS = 15000;

const OtaSeiPairContext = createContext(null);

function parsePairId(pair) {
  const parts = String(pair || DEFAULT_OTA_SEI_PAGE_PAIR).split('/').map((s) => s.trim());
  return { base: parts[0] || 'SEI', quote: parts[1] || 'USDC' };
}

export function OtaSeiPairProvider({ children }) {
  const [pair, setPair] = useState(DEFAULT_OTA_SEI_PAGE_PAIR);
  const [providerHealth, setProviderHealth] = useState(createInitialSeiProviderHealth);

  const { base, quote } = useMemo(() => parsePairId(pair), [pair]);

  const {
    livePrice: livePriceUsd,
    livePriceError,
    loading: livePriceLoading,
    hasExecutionQuote,
    usedFallbackPrice,
    priceSource,
    lastPriceAt,
    lastExecutionQuoteAt,
  } = useSeiMarketData(base, quote, {
    intervalMs: LIVE_PRICE_POLL_MS,
    unavailableMessage: 'Price temporarily unavailable',
  });

  /** TradingView / CEX reference — NOT fill truth for on-chain execution. */
  const referenceChartSymbol = SEI_PAIR_TO_CHART_SYMBOL[pair] || 'BINANCE:SEIUSDT';

  const setProviderHealthSafe = useCallback((updater) => {
    setProviderHealth(typeof updater === 'function' ? updater : () => updater);
  }, []);

  const value = useMemo(
    () => ({
      pair,
      setPair,
      base,
      quote,
      referenceChartSymbol,
      canonicalStable: SEI_CANONICAL_STABLE_SYMBOL,
      /** Same as pair for execution path — user-selected; USDC recommended in copy. */
      executionPairId: pair,
      providerHealth,
      setProviderHealth: setProviderHealthSafe,
      /** Shared SEI pair USD price (backend quote path + optional CoinGecko fallback for SEI). */
      livePriceUsd,
      livePriceError,
      livePriceLoading,
      livePriceHasExecutionQuote: hasExecutionQuote,
      livePriceUsedFallback: usedFallbackPrice,
      livePriceSource: priceSource,
      /** Last successful price tick (exec or fallback) — display / “last update”. */
      livePriceLastAt: lastPriceAt,
      /** Last executionQuote success — use for SeiQuoteHealthBadge age when exec path. */
      livePriceLastExecutionAt: lastExecutionQuoteAt,
    }),
    [
      pair,
      base,
      quote,
      referenceChartSymbol,
      providerHealth,
      setProviderHealthSafe,
      livePriceUsd,
      livePriceError,
      livePriceLoading,
      hasExecutionQuote,
      usedFallbackPrice,
      priceSource,
      lastPriceAt,
      lastExecutionQuoteAt,
    ]
  );

  return <OtaSeiPairContext.Provider value={value}>{children}</OtaSeiPairContext.Provider>;
}

export function useOtaSeiPair() {
  const ctx = useContext(OtaSeiPairContext);
  if (!ctx) {
    throw new Error('useOtaSeiPair must be used within OtaSeiPairProvider');
  }
  return ctx;
}

/** Optional: sub-trees outside provider (tests). */
export function useOtaSeiPairOptional() {
  return useContext(OtaSeiPairContext);
}
