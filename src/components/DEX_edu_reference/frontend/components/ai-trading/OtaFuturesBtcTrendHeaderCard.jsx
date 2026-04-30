/**
 * Card header Futures Ops: tendință BTC + context futures Binance (decizie LONG/SHORT).
 * Surse: fapi klines (15m ~4h, 1h ultima oră, 1h×12 ~12h), ticker/24hr, premiumIndex (funding + mark/index), openInterest;
 * spot klines BTCUSDC cross-check.
 * Extrap. ~1h / ~8h: subsol doar logică matematică (R := ~4h%) + pilule SHORT/LONG; tooltip: nu e prognoză.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity } from 'lucide-react';
import {
  fapiGetJsonCached,
  TTL_FAPI_KLINES_MS,
  TTL_FAPI_OPEN_INTEREST_MS,
  TTL_FAPI_TICKER_24H_MS,
} from './otaBinanceFuturesPublicCache';

const FAPI_KLINES = 'https://fapi.binance.com/fapi/v1/klines';
const FAPI_TICKER_24H = 'https://fapi.binance.com/fapi/v1/ticker/24hr';
const FAPI_PREMIUM = 'https://fapi.binance.com/fapi/v1/premiumIndex';
const FAPI_OI = 'https://fapi.binance.com/fapi/v1/openInterest';
const SPOT_KLINES = 'https://api.binance.com/api/v3/klines';

const SYM = 'BTCUSDT';
const KL_INTERVAL = '15m';
const KL_LIMIT = 16;

/** Refresh periodic: fetch rețea la fiecare ciclu (nu reutilizare cache in-memory între tick-uri). */
const FAPI_REFRESH = { bypassCache: true };

/** Interval poll card (ms). */
const POLL_MS = 60_000;

function abortQuietly(controller) {
  try {
    controller?.abort?.('component cleanup');
  } catch (_) {
    // Some browser/dev overlays surface abort reasons synchronously during React cleanup.
  }
}

/**
 * Cât durează tween-ul: mai lung + easing moale = mișcare „domoală”, mai puțină grăbitură vizuală.
 */
function tweenDurationMs(from, target) {
  const MIN_MS = 48_000;
  const MAX_MS = 260_000;
  const delta = Math.abs(from - target);
  if (!(delta > 0) || !Number.isFinite(delta)) return MIN_MS;
  const scale = Math.max(Math.abs(from), Math.abs(target), 1e-12);
  const relative = delta / scale;
  const t = MIN_MS + relative * 420_000;
  return Math.min(MAX_MS, Math.max(MIN_MS, t));
}

/** Ease in-out quad: început și sfârșit lin, fără „snap” liniar pe tot parcursul. */
function easeInOutQuad(x) {
  const t = Math.min(1, Math.max(0, x));
  return t < 0.5 ? 2 * t * t : 1 - (2 - 2 * t) ** 2 / 2;
}

/** Un singur rAF + setState throttled — 11× hook × 60fps re-rendera tot cardul și „tremura” pagina. */
const ANIM_KEYS = [
  'usdm4h',
  'usdm1h',
  'usdm12h',
  'spotUsdc4h',
  'ticker24h',
  'quoteVol24',
  'low24',
  'high24',
  'rangePos',
  'basisBps',
  'openInterest',
  'fundingRateNum',
];

const EMPTY_ANIM_DISPLAY = Object.freeze({
  usdm4h: null,
  usdm1h: null,
  usdm12h: null,
  spotUsdc4h: null,
  ticker24h: null,
  quoteVol24: null,
  low24: null,
  high24: null,
  rangePos: null,
  basisBps: null,
  openInterest: null,
  fundingRateNum: null,
});

function animEpsilon(target) {
  return Math.abs(target) > 1 ? 1e-6 : 1e-9;
}

/** Cheie după rotunjiri afișate: evită setState la fiecare pas tween → fără tremur layout. */
function btcAnimLayoutKey(a) {
  const p2 = (v) => (v != null && Number.isFinite(v) ? v.toFixed(2) : '');
  const p1 = (v) => (v != null && Number.isFinite(v) ? v.toFixed(1) : '');
  const p0 = (v) => (v != null && Number.isFinite(v) ? String(Math.round(v)) : '');
  let vol = '';
  if (a.quoteVol24 != null && Number.isFinite(a.quoteVol24)) {
    const q = a.quoteVol24;
    if (q >= 1e9) vol = (q / 1e9).toFixed(2);
    else if (q >= 1e6) vol = (q / 1e6).toFixed(2);
    else vol = String(Math.round(q));
  }
  const fund =
    a.fundingRateNum != null && Number.isFinite(a.fundingRateNum)
      ? (a.fundingRateNum * 100).toFixed(4)
      : '';
  return [
    p2(a.usdm4h),
    p2(a.usdm1h),
    p2(a.usdm12h),
    p2(a.spotUsdc4h),
    p2(a.ticker24h),
    vol,
    p1(a.low24),
    p1(a.high24),
    p1(a.rangePos),
    p2(a.basisBps),
    p0(a.openInterest),
    fund,
  ].join('|');
}

function pctFromKlineWindow(raw) {
  if (!Array.isArray(raw) || raw.length < 2) return null;
  const open0 = parseFloat(raw[0][1]);
  const closeL = parseFloat(raw[raw.length - 1][4]);
  if (!Number.isFinite(open0) || !Number.isFinite(closeL) || open0 <= 0) return null;
  return ((closeL - open0) / open0) * 100;
}

/** Ultima oră închisă vs penultima (close → close), interval 1h. */
function pctHourlyCloseToClose(raw) {
  if (!Array.isArray(raw) || raw.length < 2) return null;
  const prevClose = parseFloat(raw[raw.length - 2][4]);
  const lastClose = parseFloat(raw[raw.length - 1][4]);
  if (!Number.isFinite(prevClose) || prevClose <= 0 || !Number.isFinite(lastClose)) return null;
  return ((lastClose - prevClose) / prevClose) * 100;
}

function posIn24hRange(last, high, low) {
  if (![last, high, low].every((x) => Number.isFinite(x)) || high <= low) return null;
  return ((last - low) / (high - low)) * 100;
}

/** Rotunjire agresivă (2 zecimale) ascunde tween-ul lent: folosiți fracții mai mari pentru valori animate. */
function fmtPct(n, fractionDigits = 2) {
  if (n == null || !Number.isFinite(n)) return '—';
  const d = Math.min(8, Math.max(0, Number(fractionDigits) || 2));
  const s = n >= 0 ? '+' : '';
  return `${s}${n.toFixed(d)}%`;
}

function fmtOi(n, fine = false) {
  if (!Number.isFinite(n)) return '—';
  const fd = fine ? 3 : 2;
  if (n >= 1e9) return `${(n / 1e9).toFixed(fd)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(fd)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(fine ? 2 : 1)}K`;
  return n.toFixed(0);
}

function fmtQuoteVol(n, fine = false) {
  if (!Number.isFinite(n)) return '—';
  const fd = fine ? 3 : 2;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(fd)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(fd)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(fine ? 1 : 0)}K`;
  return `$${fine ? n.toFixed(0) : Math.round(n)}`;
}

/** Min/max 24h: fără Math.round pe tween — altfel mișcarea sub 1 USD nu se vede niciodată. */
function fmtBandPrice(n) {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('ro-RO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function toneForDelta(pct) {
  if (pct == null || !Number.isFinite(pct)) return '#94a3b8';
  if (pct > 0.08) return '#4ade80';
  if (pct < -0.08) return '#f87171';
  return '#cbd5e1';
}

function fmtFunding8h(rateStr) {
  const r = parseFloat(rateStr);
  if (!Number.isFinite(r)) return '—';
  return `${(r * 100).toFixed(4)}%`;
}

function fmtFundingFromFloat(r) {
  if (!Number.isFinite(r)) return '—';
  return `${(r * 100).toFixed(4)}%`;
}

function fmtNextFunding(ms) {
  const t = Number(ms);
  if (!Number.isFinite(t)) return null;
  const diff = t - Date.now();
  if (diff <= 0) return 'imminent';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `in ~${h}h ${m}m`;
  return `in ~${m}m`;
}

export default function OtaFuturesBtcTrendHeaderCard() {
  const { pathname } = useLocation();
  const shortTabTo = useMemo(() => ({ pathname, search: '' }), [pathname]);
  const longTabTo = useMemo(() => ({ pathname, search: '?tab=long' }), [pathname]);

  const [usdm4h, setUsdm4h] = useState(null);
  const [usdm1h, setUsdm1h] = useState(null);
  const [usdm12h, setUsdm12h] = useState(null);
  const [spotUsdc4h, setSpotUsdc4h] = useState(null);
  const [ticker24h, setTicker24h] = useState(null);
  const [lastPriceUsdm, setLastPriceUsdm] = useState(null);
  const [high24, setHigh24] = useState(null);
  const [low24, setLow24] = useState(null);
  const [quoteVol24, setQuoteVol24] = useState(null);
  const [rangePos, setRangePos] = useState(null);
  const [fundingPct, setFundingPct] = useState(null);
  const [fundingRateNum, setFundingRateNum] = useState(null);
  const [nextFundLabel, setNextFundLabel] = useState(null);
  const [basisBps, setBasisBps] = useState(null);
  const [openInterest, setOpenInterest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const abortRef = useRef(null);
  /** Avoid the "Loading..." flash on each poll after the first successful load. */
  const showFullScreenLoadingRef = useRef(true);

  const load = useCallback(async () => {
    abortQuietly(abortRef.current);
    const ac = new AbortController();
    abortRef.current = ac;
    const { signal } = ac;

    setErr(null);
    if (showFullScreenLoadingRef.current) setLoading(true);

    const kUsdm = `${FAPI_KLINES}?symbol=${SYM}&interval=${KL_INTERVAL}&limit=${KL_LIMIT}`;
    const k1h = `${FAPI_KLINES}?symbol=${SYM}&interval=1h&limit=3`;
    const k12h = `${FAPI_KLINES}?symbol=${SYM}&interval=1h&limit=12`;
    const kSpot = `${SPOT_KLINES}?symbol=BTCUSDC&interval=${KL_INTERVAL}&limit=${KL_LIMIT}`;
    const t24 = `${FAPI_TICKER_24H}?symbol=${SYM}`;
    const prem = `${FAPI_PREMIUM}?symbol=${SYM}`;
    const oiUrl = `${FAPI_OI}?symbol=${SYM}`;

    try {
      const [rawUsdm, raw1h, raw12h, rawSpot, t24data, premData, oiData] = await Promise.all([
        fapiGetJsonCached(kUsdm, TTL_FAPI_KLINES_MS, signal, FAPI_REFRESH),
        fapiGetJsonCached(k1h, TTL_FAPI_KLINES_MS, signal, FAPI_REFRESH),
        fapiGetJsonCached(k12h, TTL_FAPI_KLINES_MS, signal, FAPI_REFRESH),
        fetch(kSpot, { signal, cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fapiGetJsonCached(t24, TTL_FAPI_TICKER_24H_MS, signal, FAPI_REFRESH),
        fapiGetJsonCached(prem, TTL_FAPI_TICKER_24H_MS, signal, FAPI_REFRESH),
        fapiGetJsonCached(oiUrl, TTL_FAPI_OPEN_INTEREST_MS, signal, FAPI_REFRESH),
      ]);

      if (signal.aborted) return;

      const pU = pctFromKlineWindow(rawUsdm);
      const p1 = pctHourlyCloseToClose(Array.isArray(raw1h) ? raw1h : null);
      const p12 = pctFromKlineWindow(Array.isArray(raw12h) ? raw12h : null);
      const pS = pctFromKlineWindow(Array.isArray(rawSpot) ? rawSpot : null);
      setUsdm4h(pU);
      setUsdm1h(p1);
      setUsdm12h(p12);
      setSpotUsdc4h(pS);

      if (t24data && typeof t24data === 'object') {
        const ch = parseFloat(t24data.priceChangePercent);
        const lp = parseFloat(t24data.lastPrice);
        const hi = parseFloat(t24data.highPrice);
        const lo = parseFloat(t24data.lowPrice);
        const qv = parseFloat(t24data.quoteVolume);
        setTicker24h(Number.isFinite(ch) ? ch : null);
        setLastPriceUsdm(Number.isFinite(lp) ? lp : null);
        setHigh24(Number.isFinite(hi) ? hi : null);
        setLow24(Number.isFinite(lo) ? lo : null);
        setQuoteVol24(Number.isFinite(qv) ? qv : null);
        if (Number.isFinite(lp) && Number.isFinite(hi) && Number.isFinite(lo)) {
          setRangePos(posIn24hRange(lp, hi, lo));
        } else {
          setRangePos(null);
        }
      } else {
        setTicker24h(null);
        setLastPriceUsdm(null);
        setHigh24(null);
        setLow24(null);
        setQuoteVol24(null);
        setRangePos(null);
      }

      if (premData && typeof premData === 'object') {
        const fraw = parseFloat(premData.lastFundingRate);
        setFundingRateNum(Number.isFinite(fraw) ? fraw : null);
        setFundingPct(fmtFunding8h(premData.lastFundingRate));
        setNextFundLabel(fmtNextFunding(premData.nextFundingTime));
        const mk = parseFloat(premData.markPrice);
        const ix = parseFloat(premData.indexPrice);
        if (Number.isFinite(mk) && Number.isFinite(ix) && ix > 0) {
          setBasisBps(((mk - ix) / ix) * 10000);
        } else {
          setBasisBps(null);
        }
      } else {
        setFundingPct(null);
        setFundingRateNum(null);
        setNextFundLabel(null);
        setBasisBps(null);
      }

      const oiN = oiData != null ? parseFloat(oiData.openInterest) : NaN;
      setOpenInterest(Number.isFinite(oiN) ? oiN : null);

      setLastUpdatedAt(new Date());
      showFullScreenLoadingRef.current = false;
    } catch (e) {
      if (e.name === 'AbortError') return;
      if (!signal.aborted) {
        setErr(e.message || 'Data unavailable');
        setUsdm4h(null);
        setUsdm1h(null);
        setUsdm12h(null);
        setSpotUsdc4h(null);
        setTicker24h(null);
        setLastPriceUsdm(null);
        setHigh24(null);
        setLow24(null);
        setQuoteVol24(null);
        setRangePos(null);
        setFundingPct(null);
        setFundingRateNum(null);
        setNextFundLabel(null);
        setBasisBps(null);
        setOpenInterest(null);
      }
    } finally {
      if (!signal.aborted) setLoading(false);
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

  const [animDisplay, setAnimDisplay] = useState(() => ({ ...EMPTY_ANIM_DISPLAY }));
  const animValuesRef = useRef({ ...EMPTY_ANIM_DISPLAY });
  const segmentsRef = useRef({});
  const lastApiRef = useRef({});
  const rafRef = useRef(null);
  const lastCommitMsRef = useRef(0);
  const lastLayoutKeyRef = useRef('');

  useEffect(() => {
    const UI_COMMIT_MS = 480;
    let anyApiChange = false;

    const reconcile = (key, target) => {
      if (Object.is(lastApiRef.current[key], target)) return;
      lastApiRef.current[key] = target;
      anyApiChange = true;

      if (target == null || !Number.isFinite(target)) {
        segmentsRef.current[key] = null;
        animValuesRef.current[key] = target;
        return;
      }

      const cur = animValuesRef.current[key];
      const from = Number.isFinite(cur) ? cur : target;
      if (Math.abs(from - target) < animEpsilon(target)) {
        segmentsRef.current[key] = null;
        animValuesRef.current[key] = target;
        return;
      }
      if (!Number.isFinite(cur)) {
        segmentsRef.current[key] = null;
        animValuesRef.current[key] = target;
        return;
      }
      segmentsRef.current[key] = {
        from,
        to: target,
        t0: performance.now(),
        dur: tweenDurationMs(from, target),
      };
    };

    const apiTargets = {
      usdm4h,
      usdm1h,
      usdm12h,
      spotUsdc4h,
      ticker24h,
      quoteVol24,
      low24,
      high24,
      rangePos,
      basisBps,
      openInterest,
      fundingRateNum,
    };
    for (const key of ANIM_KEYS) {
      reconcile(key, apiTargets[key]);
    }

    if (anyApiChange) {
      const snap = { ...animValuesRef.current };
      lastLayoutKeyRef.current = btcAnimLayoutKey(snap);
      setAnimDisplay(snap);
    }

    const hasSegment = () => ANIM_KEYS.some((k) => segmentsRef.current[k]);

    const flushFrame = () => {
      rafRef.current = null;
      const now = performance.now();
      const next = { ...animValuesRef.current };

      for (const key of ANIM_KEYS) {
        const seg = segmentsRef.current[key];
        if (!seg) continue;
        const tLin = Math.min(1, (now - seg.t0) / seg.dur);
        const te = easeInOutQuad(tLin);
        const v = seg.from + (seg.to - seg.from) * te;
        next[key] = v;
        if (tLin >= 1) {
          segmentsRef.current[key] = null;
          next[key] = seg.to;
        }
      }

      animValuesRef.current = next;

      const still = ANIM_KEYS.some((k) => segmentsRef.current[k]);
      const mustCommitTime =
        !still || lastCommitMsRef.current === 0 || now - lastCommitMsRef.current >= UI_COMMIT_MS;

      if (!still) {
        lastLayoutKeyRef.current = btcAnimLayoutKey(next);
        lastCommitMsRef.current = 0;
        setAnimDisplay({ ...next });
      } else if (mustCommitTime) {
        lastCommitMsRef.current = now;
        const layoutKey = btcAnimLayoutKey(next);
        if (layoutKey !== lastLayoutKeyRef.current) {
          lastLayoutKeyRef.current = layoutKey;
          setAnimDisplay({ ...next });
        }
      }

      if (still) {
        rafRef.current = requestAnimationFrame(flushFrame);
      }
    };

    if (hasSegment()) {
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(flushFrame);
      }
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [
    usdm4h,
    usdm1h,
    usdm12h,
    spotUsdc4h,
    ticker24h,
    quoteVol24,
    low24,
    high24,
    rangePos,
    basisBps,
    openInterest,
    fundingRateNum,
  ]);

  const {
    usdm4h: usdm4hAnim,
    usdm1h: usdm1hAnim,
    usdm12h: usdm12hAnim,
    spotUsdc4h: spotUsdc4hAnim,
    ticker24h: ticker24hAnim,
    quoteVol24: quoteVol24Anim,
    low24: low24Anim,
    high24: high24Anim,
    rangePos: rangePosAnim,
    basisBps: basisBpsAnim,
    openInterest: openInterestAnim,
    fundingRateNum: fundingRateAnim,
  } = animDisplay;

  const extrap1hAnim =
    usdm4hAnim != null && Number.isFinite(usdm4hAnim) ? usdm4hAnim / 4 : null;
  /** Aceeași rată orară ca „Δ4h÷4”, extinsă la 8h: (Δ4h/4)×8 = Δ4h×2 — nu prognoză. */
  const extrap8hAnim =
    usdm4hAnim != null && Number.isFinite(usdm4hAnim) ? usdm4hAnim * 2 : null;
  const toneAnim = toneForDelta(usdm4hAnim);

  /** Rânduri metrice: o singură linie; lățime card mărită + overflow-x pe viewport mic. */
  const rowStyle = {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 1.2,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums',
  };
  const sepStyle = {
    marginTop: 1,
    paddingTop: 4,
    borderTop: '1px solid rgba(51, 65, 85, 0.45)',
    fontSize: 13,
    color: '#94a3bb',
    lineHeight: 1.2,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums',
  };

  return (
    <div
      className="futures-ops-btc-trend-card"
      style={{
        boxSizing: 'border-box',
        width: '100%',
        minWidth: 0,
        padding: '6px 10px',
        borderRadius: 9,
        border: '1px solid rgba(148, 163, 184, 0.35)',
        background: 'linear-gradient(145deg, #0f172a 0%, #0a0f1a 100%)',
        boxShadow: 'none',
        overflowX: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        justifyContent: 'flex-start',
        fontFamily: '"Segoe UI", ui-sans-serif, system-ui, -apple-system, Roboto, sans-serif',
        textShadow: 'none',
      }}
      title="Source: public Binance - klines, ticker, premiumIndex (funding), openInterest. NOT investment advice."
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 0 }}>
        <Activity size={16} strokeWidth={2.35} style={{ color: '#60a5fa', flexShrink: 0 }} />
        <span style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9', letterSpacing: 0.01 }}>
          BTC · context
        </span>
        {lastUpdatedAt && (
          <span
            style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginLeft: 'auto', whiteSpace: 'nowrap' }}
            title="Time of the last successful load from Binance public APIs (fapi/spot); local browser time."
          >
            Updated{' '}
            {lastUpdatedAt.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
        )}
      </div>

      {loading && !err && <span style={{ fontSize: 12.5, color: '#94a3b8', fontWeight: 700 }}>Loading...</span>}
      {err && <span style={{ fontSize: 12.5, color: '#f87171', fontWeight: 700 }}>{err}</span>}

      {!loading && !err && (
        <>
          <div style={rowStyle}>
            <strong style={{ color: '#cbd5e1' }}>~4h USD‑M</strong> (15m×{KL_LIMIT}){' '}
            <span style={{ color: toneAnim, fontWeight: 800 }}>{fmtPct(usdm4hAnim, 2)}</span>
            {usdm1h != null && (
              <span style={{ color: '#64748b', fontWeight: 600 }}>
                {' · '}1h: <span style={{ color: toneForDelta(usdm1hAnim) }}>{fmtPct(usdm1hAnim, 2)}</span>
              </span>
            )}
            {usdm12h != null && (
              <span
                style={{ color: '#64748b', fontWeight: 600 }}
                title="USD-M BTCUSDT: % change from the first 1h candle open to the last 12x1h candle close (including the current incomplete hour, like Binance klines)."
              >
                {' · '}12h:{' '}
                <span style={{ color: toneForDelta(usdm12hAnim), fontWeight: 800 }}>{fmtPct(usdm12hAnim, 2)}</span>
              </span>
            )}
          </div>

          {spotUsdc4h != null && (
            <div style={rowStyle}>
              <strong style={{ color: '#cbd5e1' }}>Spot BTCUSDC</strong> (same ~4h){' '}
              <span style={{ color: toneForDelta(spotUsdc4hAnim), fontWeight: 700 }}>{fmtPct(spotUsdc4hAnim, 2)}</span>
            </div>
          )}

          {(ticker24h != null || (lastPriceUsdm != null && high24 != null && low24 != null)) && (
            <div
              style={{
                fontSize: 13,
                color: '#64748b',
                lineHeight: 1.15,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {ticker24h != null && (
                <>
                  <strong style={{ color: '#94a3b8', fontWeight: 800 }}>24h</strong> Δ{' '}
                  <span style={{ color: toneForDelta(ticker24hAnim), fontWeight: 800 }}>{fmtPct(ticker24hAnim, 2)}</span>
                  {quoteVol24 != null && (
                    <span title="24h notional volume (USDT)">{' · '}vol {fmtQuoteVol(quoteVol24Anim, false)}</span>
                  )}
                </>
              )}
              {lastPriceUsdm != null && high24 != null && low24 != null && (
                <>
                  {ticker24h != null ? ' · ' : ''}
                  <span style={{ color: '#94a3b8', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {fmtBandPrice(Number.isFinite(low24Anim) ? low24Anim : low24)}–
                    {fmtBandPrice(Number.isFinite(high24Anim) ? high24Anim : high24)}
                  </span>
                  {rangePos != null && (
                    <span title="Where price sits versus 24h min/max (0% = low, 100% = high)">
                      {' · '}
                      band{' '}
                      <strong style={{ color: '#cbd5e1' }}>
                        {(Number.isFinite(rangePosAnim) ? rangePosAnim : rangePos).toFixed(1)}%
                      </strong>
                    </span>
                  )}
                </>
              )}
            </div>
          )}

          <div style={sepStyle}>
            <span style={{ color: '#fbbf24', fontWeight: 800 }}>Perp / funding</span>
            {fundingPct != null && (
              <div style={{ marginTop: 1, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                Funding (8h):{' '}
                <span
                  style={{
                    color:
                      fundingRateAnim != null && fundingRateAnim > 0
                        ? '#f87171'
                        : fundingRateAnim != null && fundingRateAnim < 0
                          ? '#4ade80'
                          : '#94a3b8',
                    fontWeight: 800,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {fundingRateAnim != null && Number.isFinite(fundingRateAnim)
                    ? fmtFundingFromFloat(fundingRateAnim)
                    : fundingPct}
                </span>
                {nextFundLabel && (
                  <span style={{ color: '#64748b', fontWeight: 700 }}>{' · '}next {nextFundLabel}</span>
                )}
                <span
                  style={{
                    display: 'block',
                    fontSize: 12,
                    marginTop: 1,
                    color: 'rgba(148, 163, 184, 0.92)',
                    fontWeight: 600,
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                  }}
                >
                  &gt;0 = longs pay shorts (pressure); not the only signal.
                </span>
              </div>
            )}
            {(basisBps != null && Number.isFinite(basisBps)) || openInterest != null ? (
              <div
                style={{
                  marginTop: 2,
                  display: 'flex',
                  flexWrap: 'nowrap',
                  columnGap: 10,
                  alignItems: 'baseline',
                  lineHeight: 1.15,
                  whiteSpace: 'nowrap',
                }}
              >
                {basisBps != null && Number.isFinite(basisBps) && (
                  <span>
                    Mark−index:{' '}
                    <strong
                      style={{
                        color: Math.abs(basisBpsAnim ?? basisBps) > 5 ? '#fbbf24' : '#94a3b8',
                        fontWeight: 800,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {(basisBpsAnim ?? basisBps) >= 0 ? '+' : ''}
                      {(basisBpsAnim ?? basisBps).toFixed(2)} bps
                    </strong>
                    <span style={{ fontSize: 10, marginLeft: 3, opacity: 0.88, fontWeight: 600 }}>(perp vs spot)</span>
                  </span>
                )}
                {openInterest != null && (
                  <span>
                    OI:{' '}
                    <strong style={{ color: '#a5b4fc', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                      {fmtOi(openInterestAnim ?? openInterest, false)}
                    </strong>
                    <span style={{ fontSize: 12, fontWeight: 600 }}> BTC</span>
                  </span>
                )}
              </div>
            ) : null}
          </div>

          <div style={{ ...sepStyle, marginTop: 1, paddingTop: 4, borderTop: '1px solid rgba(51, 65, 85, 0.35)' }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'baseline',
                columnGap: 8,
                rowGap: 2,
                maxWidth: '100%',
              }}
            >
              <span style={{ whiteSpace: 'nowrap' }}>
                <span style={{ color: '#a78bfa', fontWeight: 800 }}>Extrap. (≈1h):</span>{' '}
                {extrap1hAnim != null && Number.isFinite(extrap1hAnim) ? (
                  <span style={{ color: toneForDelta(extrap1hAnim), fontWeight: 800 }}>{fmtPct(extrap1hAnim, 2)}</span>
                ) : (
                  '—'
                )}
              </span>
              <span style={{ color: '#64748b', fontWeight: 600, userSelect: 'none' }} aria-hidden>
                ·
              </span>
              <span style={{ whiteSpace: 'nowrap' }}>
                <span
                  style={{ color: '#a78bfa', fontWeight: 800 }}
                  title="~4h percent x 2: same linear pace assumed over two ~4h intervals (not a forecast)."
                >
                  Extrap. (≈8h):
                </span>{' '}
                {extrap8hAnim != null && Number.isFinite(extrap8hAnim) ? (
                  <span style={{ color: toneForDelta(extrap8hAnim), fontWeight: 800 }}>{fmtPct(extrap8hAnim, 2)}</span>
                ) : (
                  '—'
                )}
              </span>
            </div>
            <div
              className="futures-ops-btc-math-logic"
              title={'Not a forecast. R = percent from "~4h USD-M"; approx. 1h = R/4; approx. 8h = R x 2 (hypothetical pace).'}
            >
              <span className="futures-ops-btc-math-logic__code">
                <span className="futures-ops-btc-math-logic__r">R := ~4h%</span>
                <span className="futures-ops-btc-math-logic__sep" aria-hidden>
                  ·
                </span>
                <span>
                  ≈1h = <span className="futures-ops-btc-math-logic__op">R/4</span>
                </span>
                <span className="futures-ops-btc-math-logic__sep" aria-hidden>
                  ·
                </span>
                <span>
                  ≈8h = <span className="futures-ops-btc-math-logic__op">R×2</span>
                </span>
              </span>
            </div>
            <div className="futures-ops-btc-footer-pills" aria-label="Tab panou">
              <Link
                to={shortTabTo}
                className="futures-ops-btc-footer-tab-pill futures-ops-btc-footer-tab-pill--short"
              >
                SHORT
              </Link>
              <Link to={longTabTo} className="futures-ops-btc-footer-tab-pill futures-ops-btc-footer-tab-pill--long">
                LONG
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
