/**
 * Context strip next to SHORT/LONG switcher: public Binance USD-M report
 * GET /futures/data/topLongShortAccountRatio (top traders, account proportions, not volume).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { fapiGetJsonCached, TTL_FAPI_LONG_SHORT_RATIO_MS } from './otaBinanceFuturesPublicCache';

const FAPI_LS = 'https://fapi.binance.com/futures/data/topLongShortAccountRatio';
const SYM = 'BTCUSDT';
const PERIOD = '1h';
const POLL_MS = TTL_FAPI_LONG_SHORT_RATIO_MS;

/** Thresholds only for UI labels, not trading signals. Symbol = BTCUSDT in this strip. */
const INTERP_LONG_SKEW_AT_LEAST_PCT = 58;
const INTERP_SHORT_SKEW_AT_MOST_PCT = 42;

function abortQuietly(controller) {
  try {
    controller?.abort?.('component cleanup');
  } catch (_) {
    // Keep React cleanup from surfacing abort-only errors in the dev overlay.
  }
}

/**
 * @param {number|null} longPct
 * @param {number|null} shortPct
 * @returns {{ text: string, tone: 'long' | 'short' | 'neu', disclaimer: string } | null}
 */
function interpretTopLsAccountRatio(longPct, shortPct) {
  if (longPct == null || shortPct == null) return null;
  const disclaimer =
    'Local heuristic from topLongShortAccountRatio (1h, top accounts, not notional volume). It is not official Binance sentiment and not positioning advice.';
  if (longPct >= INTERP_LONG_SKEW_AT_LEAST_PCT) {
    return { text: 'Top accounts lean long versus short.', tone: 'long', disclaimer };
  }
  if (longPct <= INTERP_SHORT_SKEW_AT_MOST_PCT) {
    return { text: 'Top accounts lean short versus long.', tone: 'short', disclaimer };
  }
  return { text: 'Distribution is close to balanced (long / short).', tone: 'neu', disclaimer };
}

export default function FuturesOpsBinanceContextStrip() {
  const [row, setRow] = useState(null);
  const [err, setErr] = useState(null);
  const abortRef = useRef(null);

  const load = useCallback(async () => {
    abortQuietly(abortRef.current);
    const ac = new AbortController();
    abortRef.current = ac;
    const url = `${FAPI_LS}?symbol=${SYM}&period=${PERIOD}&limit=1`;
    try {
      const arr = await fapiGetJsonCached(url, TTL_FAPI_LONG_SHORT_RATIO_MS, ac.signal);
      const last = Array.isArray(arr) && arr.length ? arr[arr.length - 1] : null;
      if (!last || typeof last !== 'object') {
        setRow(null);
        setErr(null);
        return;
      }
      const longP = parseFloat(last.longAccount);
      const shortP = parseFloat(last.shortAccount);
      const ratio = parseFloat(last.longShortRatio);
      setRow({
        longPct: Number.isFinite(longP) ? longP * 100 : null,
        shortPct: Number.isFinite(shortP) ? shortP * 100 : null,
        ratio: Number.isFinite(ratio) ? ratio : null,
      });
      setErr(null);
    } catch (e) {
      if (ac.signal.aborted || e?.name === 'AbortError') return;
      setErr(e.message || '—');
      setRow(null);
    }
  }, []);

  useEffect(() => {
    load();
    const id = window.setInterval(load, POLL_MS);
    return () => {
      clearInterval(id);
      abortQuietly(abortRef.current);
      abortRef.current = null;
    };
  }, [load]);

  const title =
    'Source: Binance USD-M public · topLongShortAccountRatio(1h): top trader account proportions, not notional volume and not a prediction.';

  const interp =
    row && row.longPct != null && row.shortPct != null
      ? interpretTopLsAccountRatio(row.longPct, row.shortPct)
      : null;

  return (
    <div className="futures-ops-binance-context-strip futures-ops-binance-context-strip--stack">
      <div className="futures-ops-binance-context-strip__main-row" title={title}>
        <span className="futures-ops-binance-context-strip__icon" aria-hidden>
          <BarChart3 size={15} strokeWidth={2.2} />
        </span>
        <span className="futures-ops-binance-context-strip__label">BTC top L/S</span>
        <span className="futures-ops-binance-context-strip__meta">1h</span>
        {row && row.longPct != null && row.shortPct != null ? (
          <span className="futures-ops-binance-context-strip__kv">
            <span className="futures-ops-binance-context-strip__long">{row.longPct.toFixed(1)}% long</span>
            <span className="futures-ops-binance-context-strip__sep">·</span>
            <span className="futures-ops-binance-context-strip__short">{row.shortPct.toFixed(1)}% short</span>
            {row.ratio != null && (
              <>
                <span className="futures-ops-binance-context-strip__sep">·</span>
                <span className="futures-ops-binance-context-strip__ratio" title="longShortRatio (accounts)">
                  L/S {row.ratio.toFixed(2)}
                </span>
              </>
            )}
          </span>
        ) : err ? (
          <span className="futures-ops-binance-context-strip__err" title={err}>
            unavailable
          </span>
        ) : (
          <span className="futures-ops-binance-context-strip__muted">…</span>
        )}
      </div>
      {interp ? (
        <div
          className={`futures-ops-binance-context-strip__interp futures-ops-binance-context-strip__interp--${interp.tone}`}
          title={interp.disclaimer}
        >
          <span className="futures-ops-binance-context-strip__interp-prefix">Interpretation</span>
          <span className="futures-ops-binance-context-strip__interp-text">{interp.text}</span>
        </div>
      ) : null}
    </div>
  );
}
