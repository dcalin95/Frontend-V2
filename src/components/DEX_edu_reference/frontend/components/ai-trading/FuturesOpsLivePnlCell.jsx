/**
 * Futures-ops table cell: unrealized PnL in USD (highlighted) + explained percentages.
 * Does not mix Binance 24h movement (OI strip) with position PnL.
 * @module FuturesOpsLivePnlCell
 */

import React from 'react';

/**
 * @param {object} props
 * @param {number|null|undefined} props.pnlUsd — notional x price delta vs entry (USD)
 * @param {number|null|undefined} props.pctVsEntry — price move vs entry x 100
 * @param {number|null|undefined} props.roeOnMarginPct — approx. pctVsEntry x leverage (ROE on margin, notional/leverage)
 * @param {number|null|undefined} [props.markPrice] — Binance mark price used for the same PnL calculation, avoiding confusion with strip "last"
 * @param {boolean} [props.hitTp]
 * @param {boolean} [props.hitSl]
 */
export default function FuturesOpsLivePnlCell({
  pnlUsd,
  pctVsEntry,
  roeOnMarginPct,
  markPrice = null,
  hitTp = false,
  hitSl = false,
}) {
  if (pnlUsd == null || !Number.isFinite(pnlUsd)) {
    return <span style={{ color: '#475569' }}>—</span>;
  }

  const color = pnlUsd > 0 ? '#4ade80' : pnlUsd < 0 ? '#f87171' : '#94a3b8';
  const sign = pnlUsd > 0 ? '+' : '';
  const head =
    pnlUsd > 0 ? 'Estimated profit' : pnlUsd < 0 ? 'Estimated loss' : 'PnL';

  const tip = [
    `${head}: USD amount on position notional (Binance MARK price vs entry). Formula: notional x (mark - entry) / entry for long; inverse for short.`,
    Number.isFinite(markPrice) && markPrice > 0
      ? `Mark used now: ${markPrice}. "Last" or +24h on the right are NOT this mark, so the USD amount differs from what you might expect from last price.`
      : '',
    Number.isFinite(pctVsEntry)
      ? `vs entry: price move versus entry (${pctVsEntry >= 0 ? '+' : ''}${pctVsEntry.toFixed(2)}%).`
      : '',
    Number.isFinite(roeOnMarginPct)
      ? `Margin ROE: approx. (vs entry) x leverage (${roeOnMarginPct >= 0 ? '+' : ''}${roeOnMarginPct.toFixed(2)}%) - based on estimated margin notional/leverage, NOT the "24h" movement from the OI strip.`
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div style={{ textAlign: 'right', lineHeight: 1.38, maxWidth: 200 }} title={tip}>
      <div style={{ color, fontWeight: 800, fontSize: 14 }}>
        <span style={{ display: 'block', fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>
          {head}
        </span>
        <span style={{ fontFamily: 'ui-monospace, monospace' }}>
          {sign}{pnlUsd.toFixed(4)} USD
        </span>
      </div>
      {Number.isFinite(markPrice) && markPrice > 0 && (
        <div style={{ fontSize: 9, color: '#fbbf24', fontWeight: 700, marginTop: 4, maxWidth: 196, marginLeft: 'auto' }}>
          at mark price {markPrice < 10 ? markPrice.toFixed(4) : markPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          <span style={{ color: '#78716c', fontWeight: 600 }}> (same as "Mark price" column)</span>
        </div>
      )}
      {Number.isFinite(pctVsEntry) && (
        <div style={{ fontSize: 10, color: '#cbd5e1', fontWeight: 600, marginTop: 3 }}>
          vs entry{' '}
          <span style={{ color: pctVsEntry >= 0 ? '#86efac' : '#fca5a5' }}>
            {pctVsEntry >= 0 ? '+' : ''}{pctVsEntry.toFixed(2)}%
          </span>
          {Number.isFinite(roeOnMarginPct) && (
            <span style={{ color: '#64748b', marginLeft: 6 }}>
              ROE ≈ {roeOnMarginPct >= 0 ? '+' : ''}{roeOnMarginPct.toFixed(2)}%
            </span>
          )}
        </div>
      )}
      {(hitTp || hitSl) && (
        <div style={{ marginTop: 5 }}>
          {hitTp && (
            <span style={{ fontSize: 9, color: '#4ade80', background: '#14532d', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }} title="Mark price reached TP">
              🎯 TP
            </span>
          )}
          {hitSl && (
            <span style={{ marginLeft: hitTp ? 4 : 0, fontSize: 9, color: '#f87171', background: '#7f1d1d', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }} title="Mark price reached SL">
              🛑 SL
            </span>
          )}
        </div>
      )}
    </div>
  );
}
