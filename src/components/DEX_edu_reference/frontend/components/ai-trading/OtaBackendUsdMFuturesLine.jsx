/**
 * Afișează subsetul Binance USD-M (OI + ticker 24h) din snapshot-ul backend folosit la promptul OpenAI
 * pentru aceeași analiză (extras din market_snapshot / signal.binanceUsdMFutures).
 * Nu înlocuiește OtaFuturesOi24hStrip (acela e fetch live din browser la fapi).
 */

import React from 'react';

function fmtOi(n) {
  if (!Number.isFinite(n)) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n < 10 ? n.toFixed(4) : n.toFixed(2);
}

function fmtQuoteVolUsdt(n) {
  if (!Number.isFinite(n)) return '—';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${Math.round(n)}`;
}

/**
 * @param {{ usdm: { venueSymbol?: string|null, openInterest?: number|null, priceChangePercent24h?: number|null, quoteVolume24hUsdt?: number|null, lastPrice?: number|null, highPrice24h?: number|null, lowPrice24h?: number|null, asOf?: string|null, source?: string|null }|null|undefined }} props
 */
export default function OtaBackendUsdMFuturesLine({ usdm, compact = false }) {
  if (!usdm || typeof usdm !== 'object') return null;
  const sym = usdm.venueSymbol || '—';
  const parts = [];
  if (usdm.openInterest != null && Number.isFinite(Number(usdm.openInterest))) {
    parts.push(`OI ${fmtOi(Number(usdm.openInterest))}`);
  }
  if (usdm.priceChangePercent24h != null && Number.isFinite(Number(usdm.priceChangePercent24h))) {
    const p = Number(usdm.priceChangePercent24h);
    parts.push(`perp 24h ${p >= 0 ? '+' : ''}${p.toFixed(2)}%`);
  }
  if (usdm.quoteVolume24hUsdt != null && Number.isFinite(Number(usdm.quoteVolume24hUsdt))) {
    parts.push(`vol ${fmtQuoteVolUsdt(Number(usdm.quoteVolume24hUsdt))}`);
  }
  if (usdm.lastPrice != null && Number.isFinite(Number(usdm.lastPrice))) {
    const lp = Number(usdm.lastPrice);
    parts.push(`last ${lp < 10 ? lp.toFixed(4) : lp.toFixed(2)}`);
  }
  if (
    usdm.highPrice24h != null && Number.isFinite(Number(usdm.highPrice24h)) &&
    usdm.lowPrice24h != null && Number.isFinite(Number(usdm.lowPrice24h))
  ) {
    const h = Number(usdm.highPrice24h);
    const l = Number(usdm.lowPrice24h);
    const fmtPx = (x) => (x < 10 ? x.toFixed(4) : x.toFixed(2));
    parts.push(`24h H/L ${fmtPx(h)} / ${fmtPx(l)}`);
  }
  if (parts.length === 0 && sym && sym !== '—') {
    parts.push('no OI/vol/perp in snapshot (listed symbol)');
  }
  if (parts.length === 0) return null;

  const fs = compact ? 9 : 10;
  const title = [
    'Binance USD-M data from the backend snapshot used for OTA analysis (same object as in the OpenAI prompt, when available).',
    `Venue symbol: ${sym}`,
    usdm.source ? `Source: ${usdm.source}` : null,
    usdm.asOf ? `As-of: ${usdm.asOf}` : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      style={{
        fontSize: fs,
        color: '#94a3b8',
        lineHeight: 1.35,
        marginTop: compact ? 2 : 4,
        fontWeight: 600,
        maxWidth: '100%',
        overflowWrap: 'anywhere',
      }}
      title={title}
    >
      <span style={{ color: '#64748b', fontWeight: 800 }}>LLM · Binance USD-M</span>
      {' '}
      <span style={{ color: '#cbd5e1' }}>({sym})</span>
      {' · '}
      {parts.join(' · ')}
    </div>
  );
}
