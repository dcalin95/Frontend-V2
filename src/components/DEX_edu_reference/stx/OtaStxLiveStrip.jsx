/**
 * LIVE strip: selected pair price from OtaStxPairContext (single poll).
 */

import React from 'react';
import { useOtaStxPairOptional } from './context/OtaStxPairContext';
import '../frontend/styles/components/ota-sei-live-strip.css';

export default function OtaStxLiveStrip({ pair: pairProp }) {
  const ctx = useOtaStxPairOptional();
  const pair = pairProp ?? ctx?.pair ?? 'STX/USDA';
  const price = ctx?.livePriceUsd ?? null;
  const error = ctx?.livePriceError ?? null;
  const lastUpdate = ctx?.livePriceLastAt ?? null;

  const timeAgo = lastUpdate
    ? (() => {
        const s = Math.floor((Date.now() - lastUpdate) / 1000);
        if (s < 60) return `${s}s ago`;
        return `${Math.floor(s / 60)}m ago`;
      })()
    : null;

  return (
    <div className="ota-sei-live-strip ota-stx-live-strip" role="status" aria-live="polite">
      <div className="ota-sei-live-strip__inner">
        <span className="ota-sei-live-strip__badge">
          <span className="ota-sei-live-strip__badge-dot" aria-hidden />
          Quote refresh
        </span>
        <span className="ota-sei-live-strip__pair">{pair}</span>
        {error ? (
          <span className="ota-sei-live-strip__error">{error}</span>
        ) : price != null ? (
          <>
            <span className="ota-sei-live-strip__price">${Number(price).toFixed(4)}</span>
            <span className="ota-sei-live-strip__source" title="Price from backend quote API">
              API
            </span>
          </>
        ) : (
          <span className="ota-sei-live-strip__loading">…</span>
        )}
        {timeAgo && <span className="ota-sei-live-strip__ago">{timeAgo}</span>}
        <span className="ota-sei-live-strip__sep">·</span>
        <span className="ota-sei-live-strip__ota">Manual strategy: Check signal / Run round-trip below</span>
        <span className="ota-sei-live-strip__sep">·</span>
        <span className="ota-sei-live-strip__where">Network: Stacks · Pair: {pair}</span>
      </div>
    </div>
  );
}
