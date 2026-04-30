/**
 * Mini grafic preț închidere Binance USD-M futures (fapi klines).
 * - Poziții: coloană tabel (implicit).
 * - Analize LLM: `compact` — același feed, dimensiuni mai mici, fără linie entry dacă nu e transmisă.
 * Sursă: GET https://fapi.binance.com/fapi/v1/klines — un fetch la mount per instanță.
 */

import React, { useEffect, useState } from 'react';
import { LineChart, Line, ResponsiveContainer, ReferenceLine, YAxis } from 'recharts';
import { toBinanceFuturesVenue } from './otaBinanceFuturesVenueMap';
import { fapiGetJsonCached, TTL_FAPI_KLINES_MS } from './otaBinanceFuturesPublicCache';

const FAPI_KLINES = 'https://fapi.binance.com/fapi/v1/klines';

function abortQuietly(controller) {
  try {
    controller?.abort?.('component cleanup');
  } catch (_) {
    // Abort-only cleanup should not reach the React dev overlay.
  }
}

export default function OtaFuturesPositionMiniChart({ baseSymbol, entryMarkPrice, compact = false }) {
  const venue = toBinanceFuturesVenue(baseSymbol);
  const [rows, setRows] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!venue) {
      setRows(null);
      setFailed(false);
      return;
    }
    const ac = new AbortController();
    setRows(null);
    setFailed(false);
    (async () => {
      try {
        const url = `${FAPI_KLINES}?symbol=${encodeURIComponent(venue)}&interval=15m&limit=32`;
        const raw = await fapiGetJsonCached(url, TTL_FAPI_KLINES_MS, ac.signal);
        if (!Array.isArray(raw)) {
          setFailed(true);
          return;
        }
        const data = raw
          .map((k, i) => ({ i, c: parseFloat(k[4]) }))
          .filter((d) => Number.isFinite(d.c));
        setRows(data.length >= 2 ? data : null);
        if (data.length < 2) setFailed(true);
      } catch (e) {
        if (ac.signal.aborted || e?.name === 'AbortError') return;
        setRows(null);
        setFailed(true);
      }
    })();
    return () => abortQuietly(ac);
  }, [venue]);

  if (!venue) {
    return (
      <span style={{ fontSize: 10, color: '#475569' }} title="Symbol without USDT-M mapping in UI">
        —
      </span>
    );
  }

  if (!rows || rows.length < 2) {
    return (
      <span
        style={{ fontSize: 10, color: failed ? '#64748b' : '#475569' }}
        title={failed ? 'Futures klines unavailable' : 'Loading...'}
      >
        {failed ? '—' : '…'}
      </span>
    );
  }

  const first = rows[0].c;
  const last = rows[rows.length - 1].c;
  const stroke = last >= first ? '#4ade80' : '#f87171';

  const lows = rows.map((x) => x.c);
  const entry = entryMarkPrice != null && Number.isFinite(Number(entryMarkPrice)) && Number(entryMarkPrice) > 0
    ? Number(entryMarkPrice)
    : null;
  let ymin = Math.min(...lows);
  let ymax = Math.max(...lows);
  if (entry != null) {
    ymin = Math.min(ymin, entry);
    ymax = Math.max(ymax, entry);
  }
  const span = ymax - ymin || Math.abs(ymax) * 0.001 || 1;
  const pad = span * 0.12;

  const showEntry = entry != null && entry >= ymin - pad * 2 && entry <= ymax + pad * 2;

  const w = compact ? 96 : 118;
  const h = compact ? 36 : 44;
  const lineW = compact ? 1.2 : 1.5;
  const tip = compact
    ? 'Binance USD-M · 15m close (~8h)'
    : 'Binance USD-M futures · 15m interval · ~8h close · yellow line = entry (if it is inside the chart range)';

  return (
    <div title={tip} style={{ width: w, height: h, minWidth: w, flexShrink: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 2, right: compact ? 2 : 4, left: 0, bottom: 2 }}>
          <YAxis domain={[ymin - pad, ymax + pad]} hide width={0} />
          {showEntry ? (
            <ReferenceLine
              y={entry}
              stroke="#facc15"
              strokeDasharray="3 3"
              strokeWidth={1}
            />
          ) : null}
          <Line
            type="monotone"
            dataKey="c"
            stroke={stroke}
            strokeWidth={lineW}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
