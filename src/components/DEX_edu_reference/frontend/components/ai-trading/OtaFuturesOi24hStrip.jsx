/**
 * Open interest + ticker 24h Binance USD-M (fapi public) — date LIVE în UI (nu din snapshot DB).
 * Sursă: GET /fapi/v1/openInterest, GET /fapi/v1/ticker/24hr — un batch la mount, AbortController.
 * Include last + 24h H/L din același ticker (înlocuiește vechiul rând din market_snapshot la analiză).
 */

import React, { useEffect, useState } from 'react';
import { toBinanceFuturesVenue } from './otaBinanceFuturesVenueMap';
import {
  fapiGetJsonCached,
  TTL_FAPI_OPEN_INTEREST_MS,
  TTL_FAPI_TICKER_24H_MS,
} from './otaBinanceFuturesPublicCache';

const FAPI_BASE = 'https://fapi.binance.com';

function abortQuietly(controller) {
  try {
    controller?.abort?.('component cleanup');
  } catch (_) {
    // Abort-only cleanup should not reach the React dev overlay.
  }
}

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
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${Math.round(n)}`;
}

function fmtPx(x) {
  if (!Number.isFinite(x)) return '—';
  return x < 10 ? x.toFixed(4) : x.toFixed(2);
}

export default function OtaFuturesOi24hStrip({ baseSymbol, compact = false }) {
  const venue = toBinanceFuturesVenue(baseSymbol);
  const [oi, setOi] = useState(null);
  const [pct, setPct] = useState(null);
  const [qVol, setQVol] = useState(null);
  const [lastPx, setLastPx] = useState(null);
  const [highPx, setHighPx] = useState(null);
  const [lowPx, setLowPx] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | loading | ok | err

  useEffect(() => {
    if (!venue) {
      setOi(null);
      setPct(null);
      setQVol(null);
      setLastPx(null);
      setHighPx(null);
      setLowPx(null);
      setPhase('idle');
      return;
    }
    const ac = new AbortController();
    setPhase('loading');
    setOi(null);
    setPct(null);
    setQVol(null);
    setLastPx(null);
    setHighPx(null);
    setLowPx(null);

    (async () => {
      try {
        const urlOi = `${FAPI_BASE}/fapi/v1/openInterest?symbol=${encodeURIComponent(venue)}`;
        const urlTk = `${FAPI_BASE}/fapi/v1/ticker/24hr?symbol=${encodeURIComponent(venue)}`;
        const [jOi, jTk] = await Promise.all([
          fapiGetJsonCached(urlOi, TTL_FAPI_OPEN_INTEREST_MS, ac.signal),
          fapiGetJsonCached(urlTk, TTL_FAPI_TICKER_24H_MS, ac.signal),
        ]);
        const oiN = parseFloat(jOi?.openInterest);
        const pctN = parseFloat(jTk?.priceChangePercent);
        const qvN = parseFloat(jTk?.quoteVolume);
        const lp = parseFloat(jTk?.lastPrice);
        const hi = parseFloat(jTk?.highPrice);
        const lo = parseFloat(jTk?.lowPrice);
        setOi(Number.isFinite(oiN) ? oiN : null);
        setPct(Number.isFinite(pctN) ? pctN : null);
        setQVol(Number.isFinite(qvN) ? qvN : null);
        setLastPx(Number.isFinite(lp) ? lp : null);
        setHighPx(Number.isFinite(hi) ? hi : null);
        setLowPx(Number.isFinite(lo) ? lo : null);
        setPhase('ok');
      } catch (e) {
        if (ac.signal.aborted || e?.name === 'AbortError') return;
        setPhase('err');
      }
    })();

    return () => abortQuietly(ac);
  }, [venue]);

  const fs = compact ? 8 : 9;
  const lh = compact ? 1.25 : 1.35;

  if (!venue) {
    return (
      <span style={{ fontSize: fs, color: '#475569' }} title="Symbol without USDT-M mapping">
        —
      </span>
    );
  }

  if (phase === 'loading') {
    return (
      <span style={{ fontSize: fs, color: '#475569' }} title="Binance fapi: openInterest + ticker/24hr">
        …
      </span>
    );
  }

  if (phase === 'err' || (oi == null && pct == null && qVol == null && lastPx == null)) {
    return (
      <span style={{ fontSize: fs, color: '#64748b' }} title="OI / 24h unavailable (Binance)">
        —
      </span>
    );
  }

  const pctColor = pct == null ? '#94a3b8' : pct > 0 ? '#4ade80' : pct < 0 ? '#f87171' : '#94a3b8';
  const pctStr = pct != null ? `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%` : '—';
  const tip = [
    'LIVE Binance fapi (browser) - not the snapshot saved with the DB analysis.',
    `USD-M ${venue}: OI, 24h Δ%, quote volume, last, high/low 24h (ticker/24hr).`,
    '"24h ±%" = contract move versus the previous Binance close - NOT your position PnL (that is in the "Unrealized PnL" column).',
    'Analysis text (HOLD/BUY) remains historical at the time OpenAI ran.',
  ].join(' ');

  const hlOk = highPx != null && lowPx != null;

  return (
    <div
      title={tip}
      style={{
        fontSize: fs,
        lineHeight: lh,
        color: '#94a3b8',
        fontWeight: 600,
        textAlign: compact ? 'right' : 'right',
        maxWidth: compact ? 148 : 168,
      }}
    >
      <div style={{ whiteSpace: 'nowrap' }}>
        OI <span style={{ color: '#e2e8f0' }}>{oi != null ? fmtOi(oi) : '—'}</span>
        {' · '}
        <span style={{ color: pctColor }}>24h {pctStr}</span>
      </div>
      <div style={{ whiteSpace: 'nowrap', marginTop: compact ? 1 : 2, fontSize: fs, color: '#64748b' }}>
        Vol {qVol != null ? fmtQuoteVolUsdt(qVol) : '—'} <span style={{ fontWeight: 500 }}>(24h)</span>
      </div>
      <div style={{ whiteSpace: 'nowrap', marginTop: compact ? 1 : 2, fontSize: fs, color: '#64748b', fontWeight: 600 }}>
        <span style={{ color: '#4ade80', fontWeight: 800 }}>LIVE</span>
        {' '}
        <span style={{ color: '#e2e8f0' }}>last {lastPx != null ? fmtPx(lastPx) : '—'}</span>
        {hlOk ? (
          <>
            {' · '}
            <span style={{ color: '#94a3b8' }}>24h H/L {fmtPx(highPx)} / {fmtPx(lowPx)}</span>
          </>
        ) : null}
      </div>
      <div
        style={{
          whiteSpace: 'nowrap',
          marginTop: compact ? 2 : 3,
          fontSize: compact ? 7 : 8,
          color: '#f59e0b',
          fontWeight: 700,
          maxWidth: compact ? 140 : 168,
          marginLeft: 'auto',
          textAlign: 'right',
          lineHeight: 1.25,
        }}
        title="Last and 24h% come from the Binance ticker. USD PnL in the table uses MARK price (the Mark price column), which can be a different number; a large last price does not mean the same USD profit."
      >
        ⚠ last / 24h ≠ mark (PnL)
      </div>
    </div>
  );
}
