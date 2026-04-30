/**
 * OtaSeiLiveWindow – OTA AI Live panel: pair price and activity.
 * Price from OtaSeiPairContext (shared with strip + open orders).
 */

import React from 'react';
import { useOtaSeiPairOptional } from './context/OtaSeiPairContext';
import { DEFAULT_OTA_SEI_PAGE_PAIR } from './constants/otaSeiPageDefaults';
import '../frontend/styles/components/ota-sei-live-window.css';

function parsePair(pair) {
  if (!pair || typeof pair !== 'string') return ['SEI', 'USDC'];
  const parts = pair.split('/').map((s) => s.trim());
  return [parts[0] || 'SEI', parts[1] || 'USDC'];
}

export default function OtaSeiLiveWindow({ variant }) {
  const ctx = useOtaSeiPairOptional();
  const pair = ctx?.pair ?? DEFAULT_OTA_SEI_PAGE_PAIR;
  const [base, quote] = parsePair(pair);
  const livePrice = ctx?.livePriceUsd;
  const livePriceError = ctx?.livePriceError;
  const loading = ctx?.livePriceLoading ?? true;
  const hasExecutionQuote = ctx?.livePriceHasExecutionQuote;
  const usedFallbackPrice = ctx?.livePriceUsedFallback;

  const priceLabel = hasExecutionQuote ? 'executionQuote' : usedFallbackPrice ? 'fallback (UI)' : '';

  const isCompact = variant === 'under-chart';
  return (
    <section className={`ota-sei-live-window ${isCompact ? 'ota-sei-live-window--compact' : ''}`} aria-label="Live window">
      <div className="ota-sei-live-window__header">
        <span className="ota-sei-live-window__title">Live · {pair}</span>
        {priceLabel && (
          <span className="ota-sei-live-window__tag" title={priceLabel === 'executionQuote' ? 'Backend quote' : 'Not for execution'}>
            {priceLabel}
          </span>
        )}
      </div>
      <div className="ota-sei-live-window__body">
        {loading && <span className="ota-sei-live-window__muted">Loading…</span>}
        {!loading && livePriceError && <span className="ota-sei-live-window__error">{livePriceError}</span>}
        {!loading && !livePriceError && livePrice != null && (
          <span className="ota-sei-live-window__price">${Number(livePrice).toFixed(6)}</span>
        )}
        {!loading && !livePriceError && livePrice == null && (
          <span className="ota-sei-live-window__muted">{base}/{quote}</span>
        )}
      </div>
    </section>
  );
}
