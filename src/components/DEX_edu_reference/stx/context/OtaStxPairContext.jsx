/**
 * Single source of truth for /dex-edu/ota/stx pair + shared live price (one poll).
 */

import React, { createContext, useContext, useMemo, useState } from 'react';
import { STX_PAIR_TO_CHART_SYMBOL } from '../stxTokenConfig';
import { useStxOtaPairPrice } from '../hooks/useStxOtaPairPrice';

export const DEFAULT_OTA_STX_PAGE_PAIR = 'STX/USDA';

const LIVE_PRICE_POLL_MS = 15000;

const OtaStxPairContext = createContext(null);

function parsePairId(pair) {
  const parts = String(pair || DEFAULT_OTA_STX_PAGE_PAIR).split('/').map((s) => s.trim());
  return { base: parts[0] || 'STX', quote: parts[1] || 'USDA' };
}

export function OtaStxPairProvider({ children }) {
  const [pair, setPair] = useState(DEFAULT_OTA_STX_PAGE_PAIR);
  const { base, quote } = useMemo(() => parsePairId(pair), [pair]);

  const { livePriceUsd, livePriceError, livePriceLoading, livePriceLastAt } = useStxOtaPairPrice(base, quote, {
    intervalMs: LIVE_PRICE_POLL_MS,
  });

  const referenceChartSymbol = STX_PAIR_TO_CHART_SYMBOL[pair] || 'BINANCE:STXUSDT';

  const value = useMemo(
    () => ({
      pair,
      setPair,
      base,
      quote,
      referenceChartSymbol,
      livePriceUsd,
      livePriceError,
      livePriceLoading,
      livePriceLastAt,
      livePricePollMs: LIVE_PRICE_POLL_MS,
    }),
    [pair, base, quote, referenceChartSymbol, livePriceUsd, livePriceError, livePriceLoading, livePriceLastAt]
  );

  return <OtaStxPairContext.Provider value={value}>{children}</OtaStxPairContext.Provider>;
}

export function useOtaStxPair() {
  const ctx = useContext(OtaStxPairContext);
  if (!ctx) {
    throw new Error('useOtaStxPair must be used within OtaStxPairProvider');
  }
  return ctx;
}

export function useOtaStxPairOptional() {
  return useContext(OtaStxPairContext);
}
