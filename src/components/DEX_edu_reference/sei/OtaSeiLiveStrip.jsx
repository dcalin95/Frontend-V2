/**
 * OtaSeiLiveStrip – LIVE strip: selected pair price, OTA AI status, network.
 * Price comes from OtaSeiPairContext (shared poll with Live window + Open orders).
 */

import React, { useEffect } from 'react';
import { useOtaSeiPairOptional } from './context/OtaSeiPairContext';
import { DEFAULT_OTA_SEI_PAGE_PAIR } from './constants/otaSeiPageDefaults';
import { markQuoteSuccess, markQuoteFailure } from './utils/seiProviderHealth';

export default function OtaSeiLiveStrip({ pair: pairProp }) {
  const ctx = useOtaSeiPairOptional();
  const pair = ctx?.pair ?? pairProp ?? DEFAULT_OTA_SEI_PAGE_PAIR;
  const setHealth = ctx?.setProviderHealth;
  const livePrice = ctx?.livePriceUsd;
  const livePriceError = ctx?.livePriceError;
  const hasExecutionQuote = ctx?.livePriceHasExecutionQuote;
  const usedFallbackPrice = ctx?.livePriceUsedFallback;
  const lastPriceAt = ctx?.livePriceLastAt;

  useEffect(() => {
    if (!setHealth) return;
    if (hasExecutionQuote) {
      setHealth((h) => markQuoteSuccess(h, 'backend'));
      return;
    }
    if (usedFallbackPrice) {
      setHealth((h) => markQuoteSuccess(h, 'fallback'));
      return;
    }
    if (livePriceError) {
      setHealth((h) => markQuoteFailure(h));
    }
  }, [hasExecutionQuote, usedFallbackPrice, livePriceError, setHealth]);

  const priceKind = hasExecutionQuote ? 'executionQuote' : usedFallbackPrice ? 'fallbackPrice' : null;
  const timeAgo = lastPriceAt
    ? (() => {
        const s = Math.floor((Date.now() - lastPriceAt) / 1000);
        if (s < 60) return `${s}s ago`;
        return `${Math.floor(s / 60)}m ago`;
      })()
    : null;

  return (
    <div className="ota-sei-live-strip" role="status" aria-live="polite">
      <div className="ota-sei-live-strip__inner">
        <span className="ota-sei-live-strip__badge">
          <span className="ota-sei-live-strip__badge-dot" aria-hidden />
          LIVE
        </span>
        <span className="ota-sei-live-strip__pair">{pair}</span>
        {livePriceError ? (
          <span className="ota-sei-live-strip__error">{livePriceError}</span>
        ) : livePrice != null ? (
          <>
            <span
              className="ota-sei-live-strip__price"
              title={priceKind === 'executionQuote' ? 'executionQuote: backend router' : 'fallbackPrice: UI only — not for execution'}
            >
              ${Number(livePrice).toFixed(4)}
            </span>
            {priceKind === 'executionQuote' && (
              <span className="ota-sei-live-strip__source" title="executionQuote">Exec</span>
            )}
            {priceKind === 'fallbackPrice' && (
              <span className="ota-sei-live-strip__source" title="fallbackPrice — do not use for swaps">Est.</span>
            )}
          </>
        ) : (
          <span className="ota-sei-live-strip__loading">…</span>
        )}
        {timeAgo && <span className="ota-sei-live-strip__ago">{timeAgo}</span>}
        <span className="ota-sei-live-strip__sep">·</span>
        <span className="ota-sei-live-strip__ota">OTA AI: {pair}</span>
        <span className="ota-sei-live-strip__sep">·</span>
        <span className="ota-sei-live-strip__where" title="Chart uses CEX reference symbol — not on-chain fill">
          Chart: ref · {pair}
        </span>
      </div>
    </div>
  );
}
