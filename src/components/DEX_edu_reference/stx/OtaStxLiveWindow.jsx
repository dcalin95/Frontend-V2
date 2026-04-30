/**
 * OTA STX Live panel — price from shared OtaStxPairContext (no extra polling).
 */

import React from 'react';
import { useOtaStxPairOptional } from './context/OtaStxPairContext';
import '../frontend/styles/components/ota-sei-live-window.css';

export default function OtaStxLiveWindow({ pair: pairProp, variant }) {
  const ctx = useOtaStxPairOptional();
  const pair = pairProp ?? ctx?.pair ?? 'STX/USDA';
  const price = ctx?.livePriceUsd ?? null;
  const error = ctx?.livePriceError ?? null;
  const loading = ctx?.livePriceLoading ?? true;
  const isCompact = variant === 'under-chart';

  return (
    <section
      className={`ota-sei-live-window ota-stx-live-window ${isCompact ? 'ota-sei-live-window--under-chart' : ''}`}
      aria-label={`STX quote — ${pair}`}
    >
      <div className="ota-sei-live-window__header">
        <span className="ota-sei-live-window__badge">
          <span className="ota-sei-live-window__badge-dot" aria-hidden />
          Shared quote
        </span>
        <h3 className="ota-sei-live-window__title">STX micro-profit (manual)</h3>
      </div>
      <div className="ota-sei-live-window__body">
        <div className="ota-sei-live-window__main-row">
          <div className="ota-sei-live-window__pair-block">
            <span className="ota-sei-live-window__label">{pair}</span>
            {loading && !price ? (
              <span className="ota-sei-live-window__loading">…</span>
            ) : error ? (
              <span className="ota-sei-live-window__error">{error}</span>
            ) : (
              <span className="ota-sei-live-window__price">${Number(price).toFixed(4)}</span>
            )}
          </div>
          <div className="ota-sei-live-window__activity-block">
            <span className="ota-sei-live-window__status">Same quote as top strip (one refresh loop)</span>
            <span className="ota-sei-live-window__meta">Stacks · {pair}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
