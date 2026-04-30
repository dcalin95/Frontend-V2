/**
 * ClobSeiOrderBook – Order book vizual pentru CLOB SEI (Mangrove).
 * Layout: asks (sell) sus, spread la mijloc, bids (buy) jos.
 * Asks inversate (best ask cel mai aproape de spread), depth bars.
 * Preț: 1.0001^tick = inbound/outbound.
 */

import React, { useMemo } from 'react';

const ROWS = 10;

function tickToPrice(tick) {
  const t = Number(tick);
  return Number.isNaN(t) ? 0 : Math.pow(1.0001, t);
}

function formatPrice(price) {
  if (!price) return '—';
  if (price >= 100)   return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (price >= 1)     return price.toFixed(4);
  return price.toFixed(6);
}

function formatSize(raw, decimals = 18) {
  if (!raw || raw === '0') return '—';
  const n = Number(raw) / Math.pow(10, decimals);
  if (n === 0) return '—';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
  if (n >= 1)   return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return n.toPrecision(4);
}

function computeMaxSize(rows) {
  let max = 0;
  for (const r of rows) {
    const n = Number(r.gives) || 0;
    if (n > max) max = n;
  }
  return max;
}

export default function ClobSeiOrderBook({
  asks = [],
  bids = [],
  loading,
  error,
  baseSymbol  = 'wSEI',
  quoteSymbol = 'USDC',
  baseDecimals  = 18,
  quoteDecimals = 6,
}) {
  /** Fără rânduri încă (nu folosi !loading aici — altfel `loading && isEmpty` devine mereu fals și nu se vede „Loading…”). */
  const hasNoOrders = asks.length === 0 && bids.length === 0;
  const showLoadingState = Boolean(loading && !error && hasNoOrders);
  const isEmpty = !loading && !error && hasNoOrders;

  // Asks: sort ascending by price (best ask = lowest = closest to spread)
  const displayAsks = useMemo(() => {
    const sorted = [...asks]
      .map((r) => ({ ...r, _price: tickToPrice(r.tick) }))
      .sort((a, b) => a._price - b._price)
      .slice(0, ROWS);
    return sorted;
  }, [asks]);

  // Bids: sort descending by price (best bid = highest = closest to spread)
  const displayBids = useMemo(() => {
    const sorted = [...bids]
      .map((r) => ({ ...r, _price: 1 / (tickToPrice(r.tick) || 1) }))
      .sort((a, b) => b._price - a._price)
      .slice(0, ROWS);
    return sorted;
  }, [bids]);

  const bestAsk = displayAsks[0]?._price ?? null;
  const bestBid = displayBids[0]?._price ?? null;
  const spread  = bestAsk && bestBid ? bestAsk - bestBid : null;
  const spreadPct = spread && bestBid ? ((spread / bestBid) * 100).toFixed(3) : null;

  const maxAskSize = useMemo(() => computeMaxSize(displayAsks), [displayAsks]);
  const maxBidSize = useMemo(() => computeMaxSize(displayBids), [displayBids]);

  if (error) {
    return (
      <div className="clob-sei-orderbook clob-sei-orderbook--error">
        <p role="alert" style={{ marginBottom: 6 }}>{error}</p>
        <p style={{ fontSize: 11, opacity: 0.7 }}>
          Order book read failed (RPC or contract). This is not the same as an empty market — fix connectivity or Mangrove addresses in env.
        </p>
      </div>
    );
  }

  if (showLoadingState) {
    return (
      <div className="clob-sei-orderbook">
        <div className="clob-sei-ob-loading">Loading order book…</div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="clob-sei-orderbook">
        <div className="clob-sei-ob-empty">
          <span>No resting offers</span>
          <span>Mangrove read succeeded — no liquidity on this pair right now.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="clob-sei-orderbook" aria-label={`Order book ${baseSymbol}/${quoteSymbol}`}>

      {/* Column headers */}
      <div className="clob-sei-ob-col-header">
        <span className="clob-sei-ob-col-th">Price ({quoteSymbol})</span>
        <span className="clob-sei-ob-col-th clob-sei-ob-col-th--right">Size ({baseSymbol})</span>
      </div>

      {/* ── Asks (sell orders) – best ask at bottom, near spread ── */}
      <div className="clob-sei-ob-asks">
        {[...displayAsks].reverse().map((row, i) => {
          const pct = maxAskSize ? Math.round((Number(row.gives) / maxAskSize) * 100) : 0;
          return (
            <div
              key={'ask-' + (row.offerId || i)}
              className="clob-sei-ob-row clob-sei-ob-row--ask"
              style={{ '--depth-pct': pct + '%' }}
            >
              <span className="clob-sei-ob-price">{formatPrice(row._price)}</span>
              <span className="clob-sei-ob-size">{formatSize(row.gives, baseDecimals)}</span>
            </div>
          );
        })}
      </div>

      {/* ── Spread ── */}
      <div className="clob-sei-ob-spread">
        <span className="clob-sei-ob-spread__label">Spread</span>
        {spreadPct && (
          <span className="clob-sei-ob-spread__val">{spreadPct}%</span>
        )}
        {spread && (
          <span style={{ fontSize: 10, color: 'var(--c-text-ter, #52525b)' }}>
            {formatPrice(spread)} {quoteSymbol}
          </span>
        )}
      </div>

      {/* ── Bids (buy orders) – best bid at top, near spread ── */}
      <div className="clob-sei-ob-bids">
        {displayBids.map((row, i) => {
          const pct = maxBidSize ? Math.round((Number(row.gives) / maxBidSize) * 100) : 0;
          return (
            <div
              key={'bid-' + (row.offerId || i)}
              className="clob-sei-ob-row clob-sei-ob-row--bid"
              style={{ '--depth-pct': pct + '%' }}
            >
              <span className="clob-sei-ob-price">{formatPrice(row._price)}</span>
              <span className="clob-sei-ob-size">{formatSize(row.gives, quoteDecimals)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
