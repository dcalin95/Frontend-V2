/**
 * OTA Long ops: staging/internal UI for positions, rejections, kill, manual close, live gate, and read-only venue probe.
 * Live on exchange only when backend env + gate allow it (see GET live-status).
 */

import React, { useState, useCallback, useEffect, useRef, useMemo, useReducer, memo } from 'react';
import { RefreshCw, Shield, AlertCircle, TrendingUp, Clock, Activity, ChevronDown } from 'lucide-react';
import FuturesOpsPeerNav from './FuturesOpsPeerNav';
import {
  getOpenLongs,
  getLongRejections as getRejections,
  getLongLiveStatus as getLiveStatus,
  postLongManualClose as postManualClose,
  postLongResetKill as postResetKill,
  postLongActivateKill,
  getLongTokenBlocks,
  postLongTokenBlock,
  postLongTokenBlockClear,
  postLongTokenBlockBulk,
  postLongTokenBlockClearAll,
  getLongActivity,
  getRecentLongSignals as getRecentLlmSignals,
  getWinRateStats,
  getKillStatus,
  getExecutorDecisions,
  getVenueMark,
  getVenueFunding,
  getVenueFundingAcc,
  getVenuePosition,
  getVenueMargin,
  getVenueReconcile,
  getVenueMarginMode,
  subscribeOtaSignalsListStream,
  postLongPositionLossCloseGuard,
  isLongOpsConfigured,
} from '../../services/otaLongOpsService';
import { getOtaPositionOpenAiSuspendList } from '../../services/aiTradingApiService';
import { analyzeMarketWithLlmProvider } from '../../services/otaAnalyzeFacade';
import { loadOutcomesForAnalyze, buildAnalyzeOptions } from '../../utils/otaOutcomesHelper';
import { getTrackedTokensFromBackend } from '../../services/otaPolicyService.jsx';
import OtaLlmSuspendControl from './OtaLlmSuspendControl';
import OtaFuturesFeedGatingDebugCallout from './OtaFuturesFeedGatingDebugCallout';
import OtaFuturesAnalysisServiceRibbon, { OtaFuturesLaneTableBadge } from './OtaFuturesAnalysisServiceRibbon';
import { useWallet } from '../../hooks/useWallet';
import { useOtaFuturesAnalyzeLlmMode } from '../../hooks/useOtaFuturesAnalyzeLlmMode';
import { toast } from 'react-toastify';
import OtaAnalysisTimeBlock, { STALE_FEED_HINT_REASON } from './OtaAnalysisTimeBlock';
import OtaFuturesPositionMiniChart from './OtaFuturesPositionMiniChart';
import OtaFuturesOi24hStrip from './OtaFuturesOi24hStrip';
import FuturesOpsLivePnlCell from './FuturesOpsLivePnlCell';
import LiveGateAllowlistTokens from './LiveGateAllowlistTokens';
import {
  FuturesOpsAllowlistGlyph,
  FuturesOpsHoldAiGlyph,
  FuturesOpsStartAiGlyph,
  FuturesOpsBlockAiGlyph,
} from './FuturesOpsModeTabIcons';
import { pickGroundedConfidence, pickLlmIgnoredConfidence, formatLlmIgnoredRow, isMotorOtaAnalysisSource } from '../../utils/otaSignalDualConfidence';
import { pickAnalysisEventEpochMs } from '../../utils/otaAnalysisTimestamps';
import { normalizeOpsPanelSymbol, fmtSignedPct1, formatSignalCardReasoningText } from '../../utils/otaOpsPanelDisplay';
import {
  filterSignalsForLongFuturesFeed,
  buildFuturesFeedHiddenByGatingDebug,
  signalRowBaseToken,
} from '../../utils/otaFuturesSignalContext';
import {
  formatCostAndSourceForSignalCard,
  getOtaSignalSnapshotFreshnessNoteFromSig,
  parseUsdNumberLoose,
  pickTotalTokensFromUsageValue,
  stripOpenAiFailureSegmentsFromReasoningText,
} from '../../utils/otaSignalCardSourceFormat';
import { otaLeverageBadgeParts } from '../../utils/otaLeverageBadgeDisplay';
import { buildLongHighConfidenceNoOpenEvidence } from '../../utils/otaLongSignalNoOpenEvidence';
import {
  OTA_ANALYZE_LLM_ANTHROPIC,
  OTA_ANALYZE_LLM_OTA_BITS_ONLY,
} from '../../utils/otaAnalysisModePreference';
import { reduceOtaRecentSignalsFeed } from '../../utils/otaRecentSignalsFeedMerge';
import {
  dispatchOtaFuturesTraceAppendEvent,
  dispatchOtaFuturesTraceImmediatePoll,
} from '../../utils/otaFuturesTraceImmediatePoll';
import { normalizeSignalsListBranchPayload } from '../../utils/otaSignalsPayloadCoerce';
import { reduceOtaFuturesLiveStatus } from '../../utils/otaFuturesLiveStatusReduce';
import { stickySignalsPanelDisplay } from '../../utils/otaStickySignalsPanelDisplay';
import { OTA_BINANCE_FUTURES_VENUE } from './otaBinanceFuturesVenueMap';
import {
  mapAnalysisSourceToPrimaryLabel,
  getTechnicalAnalysisSourceRaw,
  LABEL_TECHNICAL_DETAILS,
} from '../../utils/otaLlmDisplayLabels';

/** Neutral backgrounds/text (gray/black), no slate-blue: same family as the site theme. */
const SOP = {
  scrim: 'rgba(0,0,0,0.78)',
  surface: '#1c1c1e',
  surfaceRaised: '#2c2c2e',
  surfaceInput: '#3a3a3c',
  border: '#48484a',
  borderMuted: '#3a3a3c',
  text: '#f5f5f7',
  textSecondary: '#aeaeb2',
  muted: '#8e8e93',
  rowSelected: '#3a3a3c',
  black: '#000000',
};

/** Diagnostics footer tables: default rows before "History"; sort newest-first by `created_at`. */
const OPS_DIAG_PREVIEW_LIMIT = 20;
function sortDiagnosticsByCreatedDesc(items) {
  if (!Array.isArray(items) || items.length === 0) return [];
  return [...items].sort((a, b) => {
    const ta = a?.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b?.created_at ? new Date(b.created_at).getTime() : 0;
    return tb - ta;
  });
}

/* Inline animated spinner CSS. */
const spinnerStyle = `
@keyframes sop-hourglass-spin {
  0%   { transform: rotate(0deg);   opacity: 1; }
  40%  { transform: rotate(160deg); opacity: 0.6; }
  50%  { transform: rotate(180deg); opacity: 1; }
  90%  { transform: rotate(340deg); opacity: 0.6; }
  100% { transform: rotate(360deg); opacity: 1; }
}
@keyframes sop-dot-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.2; }
}
.sop-spinner {
  display: inline-block;
  animation: sop-hourglass-spin 1.6s ease-in-out infinite;
  transform-origin: center;
  will-change: transform;
}
.sop-spinner-dot {
  display: inline-block;
  animation: sop-dot-pulse 1s ease-in-out infinite;
}
`;

function InjectSpinnerCSS() {
  useEffect(() => {
    if (document.getElementById('sop-spinner-css')) return;
    const s = document.createElement('style');
    s.id = 'sop-spinner-css';
    s.textContent = spinnerStyle;
    document.head.appendChild(s);
  }, []);
  return null;
}

/** Animated replacement for the hourglass. */
function Spinner({ label = '', size = 12 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      <span className="sop-spinner" style={{ fontSize: size, lineHeight: 1 }}>⏳</span>
      {label && <span className="sop-spinner-dot" style={{ fontSize: size - 1, color: SOP.muted }}>{label}</span>}
    </span>
  );
}

/**
 * Binance Futures markPrice live price hook: REST polling every 10s.
 * Uses fapi.binance.com REST, accessible from browser without CORS blocking.
 * fstream.binance.com WebSocket is geo-blocked from EU/RO directly in browser.
 * IMPORTANT: 2s with N positions = N*30 req/min -> Binance IP ban. Use 10s.
 */
function useBinanceMarkPrice(symbol) {
  const [price, setPrice] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const intervalRef = useRef(null);
  const activeRef = useRef(true);

  useEffect(() => {
    if (!symbol) return;
    const venueSymbol = OTA_BINANCE_FUTURES_VENUE[symbol.toUpperCase()];
    if (!venueSymbol) return;

    activeRef.current = true;

    const fetchPrice = async () => {
      try {
        const r = await fetch(
          `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${venueSymbol}`,
          { cache: 'no-store' }
        );
        if (!r.ok) return;
        const data = await r.json();
        if (!activeRef.current) return;
        const p = parseFloat(data.markPrice);
        if (Number.isFinite(p) && p > 0) {
          setPrice(p);
          setIsLive(true);
        }
      } catch (_) {
        setIsLive(false);
      }
    };

    fetchPrice();
    intervalRef.current = setInterval(fetchPrice, 10000);

    return () => {
      activeRef.current = false;
      clearInterval(intervalRef.current);
    };
  }, [symbol]);

  return { price, isLive };
}

async function getPublicBinanceFunding(symbol = 'BTC') {
  const venueSymbol = OTA_BINANCE_FUTURES_VENUE[String(symbol || '').toUpperCase()];
  if (!venueSymbol) {
    throw new Error(`Funding unavailable for ${String(symbol || '').toUpperCase() || 'unknown symbol'}`);
  }
  const res = await fetch(
    `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${venueSymbol}`,
    { cache: 'no-store' }
  );
  if (!res.ok) {
    throw new Error(`Binance funding unavailable (${res.status})`);
  }
  const data = await res.json();
  const fundingRate = Number(data?.lastFundingRate);
  return {
    venueSymbol,
    fundingRate: Number.isFinite(fundingRate) ? fundingRate : 0,
  };
}

async function getPublicBinanceMark(symbol = 'BTC') {
  const venueSymbol = OTA_BINANCE_FUTURES_VENUE[String(symbol || '').toUpperCase()];
  if (!venueSymbol) {
    throw new Error(`Mark unavailable for ${String(symbol || '').toUpperCase() || 'unknown symbol'}`);
  }
  const res = await fetch(
    `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${venueSymbol}`,
    { cache: 'no-store' }
  );
  if (!res.ok) {
    throw new Error(`Binance mark unavailable (${res.status})`);
  }
  const data = await res.json();
  const markPrice = Number(data?.markPrice);
  return {
    venueSymbol,
    markPrice: Number.isFinite(markPrice) ? markPrice : null,
  };
}

const CRYPTO_LOGOS = {
  BTC:  'https://coin-images.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH:  'https://coin-images.coingecko.com/coins/images/279/small/ethereum.png',
  BNB:  'https://coin-images.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  XRP:  'https://coin-images.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  ADA:  'https://coin-images.coingecko.com/coins/images/975/small/cardano.png',
  LINK: 'https://coin-images.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  SHIB: 'https://coin-images.coingecko.com/coins/images/11939/small/shiba.png',
  SOL:  'https://coin-images.coingecko.com/coins/images/4128/small/solana.png',
  DOGE: 'https://coin-images.coingecko.com/coins/images/5/small/dogecoin.png',
  DOT:  'https://coin-images.coingecko.com/coins/images/12171/small/polkadot.png',
};

function CryptoLogo({ symbol, size = 18 }) {
  const src = CRYPTO_LOGOS[String(symbol || '').toUpperCase()];
  if (!src) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: size, height: size, borderRadius: '50%',
        background: SOP.surfaceRaised, color: SOP.muted, fontSize: size * 0.45,
        fontWeight: 700, flexShrink: 0,
      }}>{String(symbol || '?')[0]}</span>
    );
  }
  return (
    <img
      src={src}
      alt={symbol}
      width={size}
      height={size}
      style={{ borderRadius: '50%', objectFit: 'contain', background: SOP.black, flexShrink: 0, verticalAlign: 'middle' }}
      onError={(e) => { e.target.style.display = 'none'; }}
    />
  );
}

function tokenBlockSymbol(b) {
  return String(b?.symbol ?? b?.token ?? '').trim().toUpperCase();
}

/** Row symbol from GET /ai-trading/signals: token/symbol/base or derived from pair (for example DOGEUSDT). */
function signalRowToken(sig) {
  return signalRowBaseToken(sig);
}

function normalizedSignalKey(sig) {
  return String(sig?.signal ?? '').trim().toLowerCase();
}

/**
 * Merges two GET /signals lists (tag `_otaSignalsQueryBranch`). For the same `id`, the first occurrence wins.
 * IMPORTANT: for LONG, call order must be `merge(merge(long_spot, long_focus), common)`.
 * Otherwise DB rows with `trade_context=common` can also appear in `long_focus`, while the old
 * `merge(spot, common)` + `focus` kept the **common** copy and discarded the `long_focus` duplicate.
 * `filterSignalsForLongFuturesFeed` now includes `common` for LONG/neutral signals (buy/hold/...); see `otaFuturesSignalContext.js`.
 */
function mergeLongSpotAndFocusSignals(signalsSpot, signalsFocus) {
  const list = [...(signalsSpot || []), ...(signalsFocus || [])];
  const seen = new Set();
  const out = [];
  for (const sig of list) {
    let key;
    if (sig?.id != null && String(sig.id).trim() !== '') {
      key = `id:${String(sig.id)}`;
    } else {
      const aid = sig?.analysisId ?? sig?.analysis_id;
      if (aid != null && String(aid).trim() !== '') {
        key = `aid:${String(aid)}`;
      } else {
        const tok = signalRowToken(sig) || '—';
        const ms = pickAnalysisEventEpochMs(sig);
        const cyc = sig?.cycleId ?? sig?.cycle_id ?? '';
        key = `${tok}|${ms}|${normalizedSignalKey(sig)}|${cyc}`;
      }
    }
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(sig);
  }
  out.sort((a, b) => pickAnalysisEventEpochMs(b) - pickAnalysisEventEpochMs(a));
  return out;
}

/**
 * The same analysis can appear twice in the merge (for example mirrored INSERTs with different ids in the same second).
 * Keep one row per (token, sec, signal, confidence, reasoning prefix).
 */
function dedupeSignalsForFeedDisplay(signals) {
  const seen = new Set();
  const out = [];
  for (const sig of signals || []) {
    const tok = signalRowToken(sig) || '';
    const ms = pickAnalysisEventEpochMs(sig);
    const sec = Number.isFinite(ms) && ms > 0 ? Math.floor(ms / 1000) : 0;
    const sk = normalizedSignalKey(sig);
    const cf = Number(sig?.confidence);
    const cfK = Number.isFinite(cf) ? Math.round(cf * 1000) : -1;
    const reas = String(sig?.reasoning || '').slice(0, 96).replace(/\s+/g, ' ').trim();
    const key = `${tok}|${sec}|${sk}|${cfK}|${reas}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(sig);
  }
  return out;
}

function isTokenBlockActiveForFeed(b) {
  if (b == null) return false;
  if (b.permanent === true) return true;
  const until = b.blocked_until ?? b.blockedUntil;
  if (until == null || until === '') return true;
  const t = new Date(until).getTime();
  if (!Number.isFinite(t)) return true;
  return t > Date.now();
}

/**
 * Signal History: show all LONG-lane rows returned by the API for this user.
 * Live symbol allowlist gates **execution** (badges / executor), not whether a past analysis appears here.
 * (Filtering history by allowlist left many users with an empty list for days while analyses existed in DB.)
 */
function filterSignalsForLongValidatedAllowlist(signals, _liveSymbolAllowlist) {
  return signals || [];
}

/**
 * Feed Signal History: exclude only active token **Hold / block** (manual LONG hold).
 * Do not hide rows only for **LLM suspend** (long lane): that controls new OpenAI calls,
 * not the visibility of GET /signals history. Otherwise symbols with open positions disappear from the list
 * and "Latest" looks falsely stale versus the API.
 */
function filterLongFeedHiddenByUserGating(signals, _llmSuspendedSet, tokenBlocks) {
  const blocked = new Set();
  (tokenBlocks || []).forEach((b) => {
    if (!isTokenBlockActiveForFeed(b)) return;
    const sym = tokenBlockSymbol(b);
    if (sym) blocked.add(sym);
  });
  return (signals || []).filter((sig) => {
    /** Last browser analyze row: always show — same as SHORT (user explicitly ran Analyze). */
    if (sig && sig._clientInjectedFromAnalyze === true) return true;
    const t = signalRowToken(sig);
    if (!t) return false;
    if (blocked.has(t)) return false;
    return true;
  });
}

function formatRoDateTime(iso) {
  if (iso == null || iso === '') return '—';
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '—';
  return new Date(iso).toLocaleString('ro-RO');
}

/** Single compact text pill for list rows (tooltip = full detail). */
function formatRoDateTimeCompact(iso) {
  if (iso == null || iso === '') return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Block interval length (created -> blocked_until). */
function fmtIntervalMs(ms) {
  if (ms == null || !Number.isFinite(ms) || ms <= 0) return '—';
  const h = Math.floor(ms / 3600000);
  const d = Math.floor(h / 24);
  const hr = h % 24;
  const m = Math.floor((ms % 3600000) / 60000);
  if (d >= 1) return `${d} days, ${hr} h`;
  if (h >= 1) return `${h} h, ${m} min`;
  if (m >= 1) return `${m} min`;
  return '< 1 min';
}

/** Time remaining until blocked_until. */
function fmtRemainingUntil(iso) {
  if (iso == null || iso === '') return '—';
  const until = new Date(iso).getTime();
  if (!Number.isFinite(until)) return '—';
  const ms = until - Date.now();
  if (ms <= 0) return 'expired';
  return fmtIntervalMs(ms);
}

function pickKillForWallet(snap, walletId) {
  if (snap == null || walletId == null) return null;
  const w = String(walletId).trim().toLowerCase();
  if (Array.isArray(snap)) {
    return snap.find((k) => String(k.user_id || '').toLowerCase() === w) || null;
  }
  if (typeof snap === 'object' && !Array.isArray(snap)) {
    const id = String(snap.user_id || '').toLowerCase();
    if (id === w) return snap;
    if (!snap.user_id && typeof snap.active === 'boolean') return snap;
  }
  return null;
}

/** Blocări per-token — rânduri compacte (multe intrări vizibile fără scroll exagerat). */
function TokenBlockDetailTable({ blocks, onRemove, clearingSymbol, confirmRemove }) {
  if (!blocks?.length) {
    return (
      <p style={{ margin: '6px 0 0', fontSize: 12, color: SOP.muted, lineHeight: 1.45 }}>
        No time-bound token blocks. <code style={{ fontSize: 11, color: SOP.textSecondary }}>GET …/token-blocks</code>
      </p>
    );
  }
  return (
    <div
      style={{
        marginTop: 2,
        maxHeight: 'min(36vh, 260px)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '0 2px 4px 0',
      }}
    >
      {blocks.map((b) => {
        const sym = tokenBlockSymbol(b);
        const created = b.created_at ?? b.createdAt;
        const until = b.blocked_until ?? b.blockedUntil;
        const reason = String(b.reason ?? b.reason_detail ?? '').trim();
        const cT = created ? new Date(created).getTime() : NaN;
        const uT = until ? new Date(until).getTime() : NaN;
        const windowMs = Number.isFinite(cT) && Number.isFinite(uT) && uT > cT ? uT - cT : null;
        const rowKey = sym || `${created}-${until}`;
        const t0 = formatRoDateTimeCompact(created);
        const t1 = formatRoDateTimeCompact(until);
        const dur = fmtIntervalMs(windowMs);
        const rem = fmtRemainingUntil(until);
        const reasonBit = reason ? ` · ${reason}` : '';
        const oneLine = `${t0} → ${t1} · total ${dur} · left ${rem}${reasonBit}`;
        const titleMulti = [
          `From: ${formatRoDateTime(created)}`,
          `Until: ${formatRoDateTime(until)}`,
          `Duration: ${dur}`,
          `Remaining: ${rem}`,
          reason ? `Reason: ${reason}` : '',
        ].filter(Boolean).join('\n');
        return (
          <div
            key={rowKey}
            style={{
              border: `1px solid ${SOP.borderMuted}`,
              borderRadius: 8,
              padding: '7px 10px',
              background: '#0a0a0a',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <CryptoLogo symbol={sym} size={22} />
              <strong style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, color: SOP.text, flexShrink: 0 }}>{sym || '—'}</strong>
              <span style={{ flex: 1, minWidth: 8 }} />
              {onRemove && sym ? (
                <button
                  type="button"
                  disabled={clearingSymbol === sym}
                  onClick={() => onRemove(sym, { confirm: confirmRemove })}
                  title="Remove block for this symbol"
                  style={{
                    flexShrink: 0,
                    fontSize: 11,
                    padding: '5px 10px',
                    background: clearingSymbol === sym ? SOP.surfaceInput : SOP.surfaceRaised,
                    color: SOP.text,
                    border: `1px solid ${SOP.border}`,
                    borderRadius: 6,
                    cursor: clearingSymbol === sym ? 'wait' : 'pointer',
                    fontWeight: 700,
                  }}
                >
                  {clearingSymbol === sym ? '…' : 'Unblock'}
                </button>
              ) : null}
            </div>
            <div
              title={titleMulti}
              style={{
                marginTop: 5,
                fontSize: 11,
                color: SOP.muted,
                fontFamily: 'ui-monospace, monospace',
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {oneLine}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function fmtDuration(openedAt) {
  if (!openedAt) return '—';
  const ms = Date.now() - new Date(openedAt).getTime();
  if (ms < 0) return '—';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  const s = Math.floor((ms % 60000) / 1000);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function fmtPrice(v, decimals = 4) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(4);
  return n.toPrecision(4);
}

function fmtPct(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return `${Math.round(n * 100)}%`;
}

/** Aliniat cu `computeLinearLeverageFromConfidence` pe backend (curbă liniară). */
function linearLeverageLabelFromPolicy(confidence, policy) {
  const c = Number(confidence);
  const c0 = Number(policy?.linearConfMin);
  const c1 = Number(policy?.linearConfMax);
  let levMin = Math.max(1, Math.floor(Number(policy?.lowConfidenceLeverage) || 1));
  let levMax = Math.max(levMin, Math.floor(Number(policy?.highConfidenceLeverage) || levMin));
  const cap = Number(policy?.maxLeverage);
  if (Number.isFinite(cap) && cap >= 1) {
    levMax = Math.min(levMax, Math.floor(cap));
    if (levMax < levMin) levMax = levMin;
  }
  if (!Number.isFinite(c) || !Number.isFinite(c0) || !Number.isFinite(c1) || c1 <= c0) {
    return `${levMin}x`;
  }
  const t = Math.max(0, Math.min(1, (c - c0) / (c1 - c0)));
  const lev = Math.round(levMin + t * (levMax - levMin));
  const clamped = Math.max(levMin, Math.min(levMax, lev));
  return `${Math.max(1, clamped)}x`;
}

function fmtDateTime(v) {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Panoul LONG: explică de ce semnalul nu deschide LONG — fără a pretinde că „e pentru SHORT” automat.
 * SHORT futures = alt panou + alt lanț în executor.
 */
function longPanelNonLongEntryExplanation(signalKey, signalLabel, tokenUpper) {
  const tok =
    tokenUpper && String(tokenUpper).trim() !== '' && tokenUpper !== '—'
      ? ` [${String(tokenUpper).toUpperCase()}]`
      : '';
  switch (signalKey) {
    case 'sell':
      return (
        `SELL${tok}: no new LONG entry (not a long entry signal: buy / open_long / open_long_futures / open_buy). ` +
        'High confidence does not change that — direction must match. ' +
        'Bearish or management context; does not mean “open SHORT” here. ' +
        'For SHORT futures entry, use the SHORT panel.'
      );
    case 'open_short':
      return (
        `OPEN_SHORT${tok}: SHORT futures executor path — this LONG panel does not open a long from this signal. ` +
        'Check the SHORT panel and open positions there.'
      );
    case 'close':
    case 'close_long':
    case 'close_long_futures':
      return (
        `CLOSE${tok}: close signal — not equivalent to BUY / open_long_futures. ` +
        'Any current LONG position is in Open positions.'
      );
    case 'close_short':
      return (
        `CLOSE_SHORT${tok}: relates to a SHORT position — this LONG panel does not open a new long from this signal. ` +
        'See the SHORT panel.'
      );
    case 'swap':
      return (
        `SWAP${tok}: swap/vault route — not a LONG futures open signal in this panel.`
      );
    case 'open_long':
      return (
        `OPEN_LONG${tok}: if you see this, check UI sync — open_long is treated as eligible entry in this LONG panel. ` +
        'Live execution stays on the backend (promotion to open_long_futures + venue).'
      );
    default:
      return (
        `Signal ${signalLabel}${tok}: not a long entry (buy / open_long / open_long_futures / open_buy) — no new LONG open in this panel. ` +
        'Interpret other signals in the correct executor / panel context.'
      );
  }
}

function deriveRecentSignalState(sig, liveStatus) {
  /** Aligned with `OtaDualConfidenceDisplay`: openMin / leverage use the same % as the primary OTA execution line. */
  const rawConfidence = Number(sig?.confidence);
  const confidence = pickGroundedConfidence(sig, rawConfidence);
  const signalLabel = String(sig?.signal || '—').toUpperCase();
  const signalKey = String(sig?.signal || '').toLowerCase();
  const levPolicy = liveStatus?.longConfidenceLeveragePolicy || null;
  const legacyCfg = liveStatus?.config || {};
  const policy = levPolicy || {};
  const openMin = Number(policy?.openMinConfidence ?? legacyCfg?.longMinConfidence);
  const highMin = Number(policy?.highLeverageMinConfidence ?? 0.75);
  const lowLev = Number(policy?.lowConfidenceLeverage ?? legacyCfg?.defaultLeverage ?? 3);
  const highLev = Number(policy?.highConfidenceLeverage ?? 5);
  const liveList = Array.isArray(policy?.liveSymbolAllowlist) ? policy.liveSymbolAllowlist : [];
  const tokenUpper = signalRowToken(sig);
  /** Aliniat la `otaFuturesSignalContext` (intrare long în DB poate fi `open_long` înainte de promovare la `open_long_futures`). */
  const signalAllowsLong =
    signalKey === 'buy'
    || signalKey === 'open_long_futures'
    || signalKey === 'open_long'
    || signalKey === 'open_buy';
  /** Pragul din env (ex. 65%) și curba de lev se aplică la deschidere doar pentru semnale de intrare LONG — nu pentru SELL/hold informativ etc. */
  const longOpenThresholdApplies = signalAllowsLong;
  const confColor = !longOpenThresholdApplies
    ? '#94a3b8'
    : Number.isFinite(confidence)
      ? (confidence >= 0.5 ? '#4ade80' : confidence >= 0.39 ? '#facc15' : '#f87171')
      : '#94a3b8';
  const tokenAllowed = liveList.length === 0 ? true : liveList.includes(tokenUpper);
  const leverageLabel =
    longOpenThresholdApplies && Number.isFinite(confidence) && Number.isFinite(openMin)
      ? confidence < openMin
        ? 'no open'
        : levPolicy?.curve === 'linear'
          && levPolicy?.linearConfMin != null
          && levPolicy?.linearConfMax != null
          ? linearLeverageLabelFromPolicy(confidence, levPolicy)
          : confidence >= highMin ? `${highLev}x`
            : `${lowLev}x`
      : '—';
  const isHoldInformative = !signalAllowsLong && signalKey === 'hold';
  /** SELL în panoul LONG = context bearish, nu „eroare” — același ton neutru ca HOLD. */
  const isSellInformativeForLong = !signalAllowsLong && signalKey === 'sell';
  const statusTone = !liveStatus?.gate?.safeToExecuteLive ? '#f87171'
    : isHoldInformative || isSellInformativeForLong ? '#94a3b8'
    : !signalAllowsLong ? '#facc15'
    : !tokenAllowed ? '#fb7185'
    : Number.isFinite(confidence) && confidence < openMin ? '#f87171'
    : '#4ade80';
  const holdLongMsg = tokenUpper
    ? `HOLD (${tokenUpper}): no new LONG entry (informative analysis).`
    : 'HOLD: no new LONG entry (informative analysis).';
  /** Pentru UI: HOLD informativ ≠ „fără poziție”; poziția reală e în tabelul Open positions. */
  const statusText = !liveStatus?.gate?.safeToExecuteLive
    ? 'Blocked: live gate OFF'
    : isHoldInformative
      ? holdLongMsg
      : !signalAllowsLong
        ? longPanelNonLongEntryExplanation(signalKey, signalLabel, tokenUpper)
        : !tokenAllowed
          ? `Will not open: ${tokenUpper} is not on the live allowlist`
          : Number.isFinite(confidence) && confidence < openMin
            ? `Will not open: confidence below ${fmtPct(openMin)}`
            : signalKey === 'open_long_futures'
              ? `Eligible LONG (≥ ${fmtPct(openMin)} conf.): see “Confirmed rationale” under the card for live-status, blocks, rejections, and executor log.`
              : signalKey === 'open_long' || signalKey === 'open_buy'
                ? `Eligible LONG (≥ ${fmtPct(openMin)} conf.): same evidence path as open_long_futures — see “Confirmed rationale” under the card.`
                : `Eligible LONG — BUY (≥ ${fmtPct(openMin)} conf.): see “Confirmed rationale” under the card for API text.`;
  return {
    confidence,
    signalLabel,
    confColor,
    tokenUpper,
    tokenAllowed,
    leverageLabel,
    openMinLeverageGate: Number.isFinite(openMin) ? openMin : null,
    statusTone,
    statusText,
    isHoldInformative,
    longOpenThresholdApplies,
  };
}

function displayReasoningText(sig, analyzeLlmMode) {
  const t = signalRowToken(sig);
  let raw = formatSignalCardReasoningText(sig?.reasoning, t && t !== '—' ? t : '');
  if (
    raw &&
    analyzeLlmMode === OTA_ANALYZE_LLM_OTA_BITS_ONLY &&
    isMotorOtaAnalysisSource(sig)
  ) {
    raw = stripOpenAiFailureSegmentsFromReasoningText(raw);
  }
  return raw;
}

/** Confidence: OTA Engine path vs dual OpenAI/LLM secondary line (not used for execution). */
function OtaDualConfidenceDisplay({
  sig,
  confColor,
  confidence,
  longOpenThresholdApplies = true,
  /** `longConfidenceLeveragePolicy.openMinConfidence` din GET long/live-status — nu include pragul stricte Trading policy (DB). */
  serverOpenMinConfidence = null,
}) {
  const motorOnly = isMotorOtaAnalysisSource(sig);
  const grounded = pickGroundedConfidence(sig, confidence);
  const llm = pickLlmIgnoredConfidence(sig);
  const llmRow = formatLlmIgnoredRow(sig);
  const title = motorOnly
    ? 'OTA Engine only for this row — no OpenAI consumer call in this cycle (e.g. engine hold or OTA_SKIP_OPENAI_WHEN_ENGINE_HOLD).'
    : 'Primary % = value used for policy and execution. Secondary line = model output for reference (not used for execution); see Technical details if present.';
  const otaSubLabel = motorOnly ? 'OTA · engine' : 'OTA · execution';
  const minDisp = Number.isFinite(Number(serverOpenMinConfidence))
    ? fmtPct(Number(serverOpenMinConfidence))
    : null;
  return (
    <div
      style={{ textAlign: 'right', minWidth: 108 }}
      title={title}
    >
      <div style={{ color: confColor, fontWeight: 900, fontSize: 15, lineHeight: 1.2 }}>
        {Number.isFinite(grounded) ? `${Math.round(grounded * 100)}%` : '—'}
      </div>
      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, marginTop: 2 }}>{otaSubLabel}</div>
      {!longOpenThresholdApplies ? (
        <div
          style={{
            fontSize: 9,
            color: '#fb923c',
            fontWeight: 800,
            marginTop: 5,
            maxWidth: 168,
            marginLeft: 'auto',
            lineHeight: 1.25,
          }}
          title={
            minDisp != null
              ? `Threshold ${minDisp} = longMinConfidence from GET long/live-status (LONG config, e.g. OTA_LONG_MIN_CONFIDENCE). Live opens may also use minConfidenceToOpen from Trading policy (DB), sometimes stricter — see Long rejections. SELL is not a new long entry.`
              : 'Minimum LONG threshold: see live-status. Executor may also apply Trading policy (DB). SELL does not count as a new long entry.'
          }
        >
          {minDisp != null
            ? `Threshold ${minDisp} (LONG server config) — only with BUY/open_long*; SELL is not a new long. Policy (DB) may be stricter.`
            : 'LONG threshold from server — only with BUY/open_long*; SELL is not a new long.'}
        </div>
      ) : null}
      <div
        style={{
          fontSize: 10,
          color: motorOnly ? '#64748b' : (llm != null ? '#c4b5fd' : '#64748b'),
          fontWeight: 600,
          marginTop: 3,
          maxWidth: 148,
          marginLeft: 'auto',
          lineHeight: 1.25,
        }}
      >
        {motorOnly ? 'LLM · — (no call)' : `LLM · secondary: ${llmRow}`}
      </div>
    </div>
  );
}

function getMetaField(p, ...keys) {
  const meta = p?.metadata || {};
  for (const k of keys) {
    if (meta[k] != null) return meta[k];
  }
  return null;
}

function PositionRow({
  p,
  fundingRate,
  fundingAcc,
  onClose,
  walletAddress,
  openAiSuspended,
  onLlmSuspendChanged,
  onLossGuardChanged,
  policyOpenMinConfidence = null,
}) {
  const posSym = normalizeOpsPanelSymbol(p.symbol) || String(p.symbol || '').trim() || '';
  const openedAt = p.opened_at;
  const [elapsed, setElapsed] = useState(fmtDuration(openedAt));
  const meta = p?.metadata || {};
  const [closing, setClosing] = useState(false);
  const [closeErr, setCloseErr] = useState(null);
  const [lossGuardBusy, setLossGuardBusy] = useState(false);

  const handleInlineClose = async () => {
    const exitMark = livePrice;
    if (!exitMark) { setCloseErr('Unknown price — try again'); return; }
    const symClose = posSym || p.symbol;
    if (!window.confirm(`Manually close LONG ${symClose} at ${exitMark}? This cannot be undone.`)) return;
    setClosing(true); setCloseErr(null);
    try {
      await postManualClose({ userId: walletAddress || p.user_id, symbol: symClose, exitMark });
      toast.success(`LONG ${symClose} closed manually at ${exitMark}`);
      if (onClose) onClose();
    } catch (e) {
      setCloseErr(e.message || 'Close error');
      toast.error(`Close error ${symClose}: ${e.message}`);
    } finally { setClosing(false); }
  };

  // Pret live Binance Futures via polling REST la 2s (simbol normalizat — ETHETH → ETH)
  const { price: wsPrice, isLive: wsIsLive } = useBinanceMarkPrice(posSym);
  // Folosim pretul live daca e disponibil, altfel fallback la p.current_price din API
  const livePrice = wsPrice != null ? wsPrice : (p.current_price != null ? Number(p.current_price) : null);

  useEffect(() => {
    if (!openedAt) return;
    const id = setInterval(() => setElapsed(fmtDuration(openedAt)), 10000);
    return () => clearInterval(id);
  }, [openedAt]);

  const lossGuardOn =
    meta.userBlocksOtaCloseWhileNetLoss === true
    || meta.userBlocksOtaCloseWhileNetLoss === 'true'
    || meta.userBlocksOtaCloseWhileNetLoss === 1;

  const tp = getMetaField(p, 'takeProfit', 'take_profit', 'takeProfitPrice');
  const sl = getMetaField(p, 'stopLoss', 'stop_loss', 'stopLossPrice');
  const confidence = getMetaField(p, 'confidence', 'llmConfidence');
  const btcBias = getMetaField(p, 'btcBias', 'btc_bias');
  const originalSignal = getMetaField(p, 'originalSignal', 'original_signal', 'promotedFromSignal');

  const entry = Number(p.entry_mark_price);
  const liq = Number(p.liquidation_price);
  const distToLiqPct = Number.isFinite(entry) && Number.isFinite(liq) && entry > 0
    ? ((liq - entry) / entry * 100)
    : null;

  const tpFormatted = tp != null ? fmtPrice(tp) : '—';
  const slFormatted = sl != null ? fmtPrice(sl) : '—';

  // Procent TP/SL față de entry (cât trebuie să miște prețul)
  const tpPricePct = (tp != null && Number.isFinite(entry) && entry > 0)
    ? ((Number(tp) - entry) / entry * 100)
    : null; // negativ pentru long TP (ex: -3%)
  const slPricePct = (sl != null && Number.isFinite(entry) && entry > 0)
    ? ((Number(sl) - entry) / entry * 100)
    : null; // pozitiv pentru long SL (ex: +8%)

  // Distanța curentă față de TP (cât mai trebuie să scadă) — folosim pretul live WS
  const currPrice = livePrice;
  const distToTpPct = (currPrice != null && tp != null && Number.isFinite(entry) && entry > 0)
    ? ((Number(tp) - currPrice) / entry * 100)
    : null; // negativ = mai trebuie să scadă, pozitiv = deja atins

  const openMinRow = Number(policyOpenMinConfidence);
  const openMinEff = Number.isFinite(openMinRow) ? openMinRow : 0.65;
  const confColor = confidence != null
    ? (confidence >= openMinEff ? '#4ade80' : confidence >= 0.5 ? '#facc15' : '#f87171')
    : '#94a3b8';

  const biasColor = btcBias === 'bearish' || btcBias === 'bearish_shock'
    ? '#f87171'
    : btcBias === 'mixed' ? '#facc15' : '#94a3b8';

  return (
    <tr style={{ borderBottom: `1px solid ${SOP.borderMuted}` }}>
      <td className="short-ops-td short-ops-td--clip" title={p.user_id}>
        <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{String(p.user_id).slice(0, 10)}…</span>
      </td>
      <td className="short-ops-td">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 700, color: '#f87171', fontSize: 13 }}>
          <CryptoLogo symbol={posSym || p.symbol} size={18} />
          {posSym || p.symbol || '—'}
        </span>
      </td>
      <td className="short-ops-td short-ops-td--right">
        <span style={{ color: '#e2e8f0', fontWeight: 600 }}>${Number(p.notional_usd).toFixed(2)}</span>
      </td>
      <td className="short-ops-td short-ops-td--right">
        <span style={{ color: '#fb923c', fontWeight: 700 }}>{p.leverage != null ? `${Number(p.leverage).toFixed(0)}×` : '—'}</span>
      </td>
      <td className="short-ops-td short-ops-td--right">
        <span style={{ color: '#e2e8f0' }}>{fmtPrice(p.entry_mark_price)}</span>
      </td>
      <td className="short-ops-td short-ops-td--right" style={{ whiteSpace: 'normal', minWidth: 80 }}>
        <div style={{ whiteSpace: 'nowrap' }}>
          <span style={{ color: '#4ade80', fontWeight: 600 }}>{tpFormatted}</span>
          {tpPricePct != null && fmtSignedPct1(tpPricePct) != null && (
            <span style={{ marginLeft: 3, fontSize: 9, color: '#4ade80', opacity: 0.9 }}>({fmtSignedPct1(tpPricePct)})</span>
          )}
          {distToTpPct != null && distToTpPct >= 0 && (
            <span style={{ marginLeft: 3, fontSize: 9, color: '#4ade80', fontWeight: 700 }}>🎯</span>
          )}
        </div>
        {distToTpPct != null && distToTpPct < 0 && (
          <div style={{ fontSize: 10, color: '#facc15', fontWeight: 600, marginTop: 2, whiteSpace: 'nowrap' }}>
            ↓{Math.abs(distToTpPct).toFixed(2)}% left
          </div>
        )}
      </td>
      <td className="short-ops-td short-ops-td--right" style={{ whiteSpace: 'normal', minWidth: 70 }}>
        <div style={{ whiteSpace: 'nowrap' }}>
          <span style={{ color: '#f87171', fontWeight: 600 }}>{slFormatted}</span>
          {slPricePct != null && fmtSignedPct1(slPricePct) != null && (
            <span style={{ marginLeft: 3, fontSize: 9, color: '#f87171', opacity: 0.9 }}>({fmtSignedPct1(slPricePct)})</span>
          )}
        </div>
      </td>
      <td className="short-ops-td short-ops-td--right">
        <span style={{ color: '#f87171', fontSize: 11 }}>{fmtPrice(p.liquidation_price)}</span>
        {distToLiqPct != null && fmtSignedPct1(distToLiqPct) != null && (
          <span style={{ marginLeft: 4, fontSize: 9, color: SOP.textSecondary }}>({fmtSignedPct1(distToLiqPct)})</span>
        )}
      </td>
      <td className="short-ops-td short-ops-td--right">
        {(() => {
          const entry = Number(p.entry_mark_price);
          const curr = livePrice;
          const notional = Number(p.notional_usd);
          const lev = Number(p.leverage) || 1;
          let pnl = null;
          let pctVsEntry = null;
          let roeOnMarginPct = null;
          if (curr != null && Number.isFinite(entry) && entry > 0 && Number.isFinite(curr) && Number.isFinite(notional) && notional > 0) {
            const rawPct = (curr - entry) / entry;
            pnl = Math.round(notional * rawPct * 10000) / 10000;
            pctVsEntry = Math.round(rawPct * 10000) / 100;
            roeOnMarginPct = Math.round(rawPct * lev * 10000) / 100;
          }
          const tp = getMetaField(p, 'takeProfit', 'take_profit');
          const sl = getMetaField(p, 'stopLoss', 'stop_loss');
          const hitTp = curr != null && tp != null && curr >= Number(tp);
          const hitSl = curr != null && sl != null && curr <= Number(sl);
          return (
            <FuturesOpsLivePnlCell
              pnlUsd={pnl}
              pctVsEntry={pctVsEntry}
              roeOnMarginPct={roeOnMarginPct}
              markPrice={curr}
              hitTp={hitTp}
              hitSl={hitSl}
            />
          );
        })()}
      </td>
      <td
        className="short-ops-td short-ops-td--right"
        title="MARK Binance — used for unrealized PnL. “Last” in the Market/OI column is a different feed (ticker) and may differ a lot."
      >
        {livePrice != null
          ? (
            <span style={{ color: '#e2e8f0', fontSize: 11 }}>
              {fmtPrice(livePrice)}
              {wsIsLive && (
                <span title="Binance mark updated ~2s" style={{ marginLeft: 4, fontSize: 8, color: '#4ade80', verticalAlign: 'middle' }}>●</span>
              )}
            </span>
          )
          : <span style={{ color: '#475569' }}>—</span>
        }
      </td>
      <td className="short-ops-td" style={{ padding: '6px 8px', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <OtaFuturesPositionMiniChart baseSymbol={posSym || p.symbol} entryMarkPrice={Number(p.entry_mark_price)} />
          <OtaFuturesOi24hStrip baseSymbol={posSym || p.symbol} />
        </div>
      </td>
      <td className="short-ops-td short-ops-td--right">
        {confidence != null
          ? <span style={{ color: confColor, fontWeight: 600 }}>{Math.round(confidence * 100)}%</span>
          : <span style={{ color: '#475569' }}>—</span>
        }
      </td>
      <td className="short-ops-td">
        {btcBias
          ? <span style={{ color: biasColor, fontSize: 11 }}>{btcBias}</span>
          : <span style={{ color: '#475569' }}>—</span>
        }
      </td>
      <td className="short-ops-td short-ops-td--right" title="Dynamic trailing stop: active after 3% profit. Closes when price rises 1.5% from the low reached. Max TP: 10%.">
        {(() => {
          const trailingActive = meta.trailingActive === true;
          const trailingMin = meta.trailingMin != null ? Number(meta.trailingMin) : null;
          const trailingActivatedAt = meta.trailingActivatedAt;
          const currP = livePrice != null ? Number(livePrice) : (p.current_price != null ? Number(p.current_price) : null);
          const entryP = Number(p.entry_mark_price);
          const profitPct = Number.isFinite(entryP) && entryP > 0 && currP != null ? ((currP - entryP) / entryP * 100) : null;
          const callbackFromMin = trailingActive && trailingMin != null && currP != null && trailingMin > 0
            ? ((currP - trailingMin) / trailingMin * 100) : null;
          if (!trailingActive) {
            return (
              <div style={{ lineHeight: 1.3 }}>
                <div style={{ fontSize: 10, color: '#475569', fontWeight: 500 }}><Spinner label="waiting" size={11} /></div>
                <div style={{ fontSize: 9, color: SOP.borderMuted, marginTop: 1 }}>activates at ≥3%</div>
                {profitPct != null && (
                  <div style={{ fontSize: 9, color: profitPct >= 0 ? '#4ade80' : '#f87171', marginTop: 1 }}>
                    current: {profitPct >= 0 ? '+' : ''}{profitPct.toFixed(2)}%
                  </div>
                )}
              </div>
            );
          }
          return (
            <div style={{ lineHeight: 1.3 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#facc15' }}>🎯 TRAILING ACTIV</div>
              {trailingMin != null && (
                <div style={{ fontSize: 9, color: SOP.textSecondary, marginTop: 1 }}>min: {Number(trailingMin).toFixed(4)}</div>
              )}
              {callbackFromMin != null && (
                <div style={{ fontSize: 9, color: callbackFromMin >= 1 ? '#f87171' : '#64748b', fontWeight: callbackFromMin >= 1 ? 700 : 400, marginTop: 1 }}>
                  ↑{callbackFromMin.toFixed(2)}% vs min{callbackFromMin >= 1 && <span style={{ color: '#f87171' }}> ⚠</span>}
                </div>
              )}
              {trailingActivatedAt && (
                <div style={{ fontSize: 8, color: SOP.borderMuted, marginTop: 1 }}>since {new Date(trailingActivatedAt).toLocaleTimeString()}</div>
              )}
            </div>
          );
        })()}
      </td>
      <td className="short-ops-td short-ops-td--right" title="Binance USDM: fundingRate &gt; 0 → longs pay shorts (USD/day out ≈ notional×rate×3, show red). fundingRate &lt; 0 → longs receive (green). Same sign rule as summary card.">
        {(() => {
          const notional = Number(p.notional_usd);
          if (!Number.isFinite(notional) || notional <= 0 || fundingRate == null) {
            return <span style={{ color: SOP.borderMuted, fontSize: 10 }}>—</span>;
          }
          // 3 × 8h = 24h; notional×rate×3 same sign as rate: positive rate → positive $/day = long pays (red); negative rate → long receives (green)
          const costPerDay = notional * fundingRate * 3;
          const isIncome = costPerDay < 0;
          const isLoss = costPerDay > 0;
          const hoursOpen = openedAt ? Math.max(0, (Date.now() - new Date(openedAt).getTime()) / 3600000) : null;
          const paymentsElapsed = hoursOpen != null ? Math.floor(hoursOpen / 8) : null;
          const accumulatedFundingEst = paymentsElapsed != null ? notional * fundingRate * paymentsElapsed : null;
          const isLiveVenue = meta.live === true;
          const accReal = fundingAcc;
          const accRealOk = accReal?.status === 'ok' && isLiveVenue && Number.isFinite(accReal.totalUsd);
          const accRealUsd = accRealOk ? accReal.totalUsd : null;
          const accRealIncome = accRealUsd != null ? accRealUsd > 0 : isIncome;
          return (
            <div style={{ lineHeight: 1.3 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: isIncome ? '#4ade80' : isLoss ? '#f87171' : '#94a3b8' }}>
                {isIncome ? '+' : ''}{Math.abs(costPerDay).toFixed(4)}$
                <span style={{ fontSize: 9, color: '#64748b', marginLeft: 3 }}>/day (est.)</span>
              </div>
              <div style={{ fontSize: 9, color: '#475569', marginTop: 1 }}>
                rate: {fundingRate >= 0 ? '+' : ''}{(fundingRate * 100).toFixed(4)}%
              </div>
              {isLiveVenue && accReal?.status === 'loading' && (
                <div style={{ fontSize: 9, color: '#64748b', marginTop: 1 }}>
                  acc (Binance): <Spinner label="loading" size={10} />
                </div>
              )}
              {accRealOk && (
                <div
                  style={{ fontSize: 9, color: accRealIncome ? '#4ade80' : '#f87171', fontWeight: 600, marginTop: 1 }}
                  title={
                    'Source: Binance GET /fapi/v1/income (FUNDING_FEE), USDT sum for symbol + opened_at→now interval, ' +
                    'futures account on backend (OTA_SHORT_BINANCE_FUTURES_*). If opened_at does not match venue, the sum may include intervals without a position.'
                  }
                >
                  acc: {accRealUsd >= 0 ? '+' : ''}{accRealUsd.toFixed(4)}$ ({accReal.entryCount} Binance payments)
                </div>
              )}
              {isLiveVenue && accReal?.status === 'error' && accumulatedFundingEst != null && paymentsElapsed > 0 && (
                <div
                  style={{ fontSize: 9, color: isIncome ? '#4ade80' : '#f87171', fontWeight: 500, marginTop: 1 }}
                  title={`acc estimated (income API unavailable: ${accReal.message || '—'})`}
                >
                  acc (est.): {accumulatedFundingEst >= 0 ? '+' : ''}{accumulatedFundingEst.toFixed(4)}$ ({paymentsElapsed}×8h)
                </div>
              )}
              {!isLiveVenue && accumulatedFundingEst != null && paymentsElapsed > 0 && (
                <div style={{ fontSize: 9, color: isIncome ? '#4ade80' : '#f87171', fontWeight: 600, marginTop: 1 }}>
                  acc (est.): {accumulatedFundingEst >= 0 ? '+' : ''}{accumulatedFundingEst.toFixed(4)}$ ({paymentsElapsed}×8h)
                </div>
              )}
            </div>
          );
        })()}
      </td>
      <td className="short-ops-td">
        <span style={{ color: SOP.textSecondary, fontSize: 11 }}>
          <Clock size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />
          {elapsed}
        </span>
      </td>
      <td className="short-ops-td">
        {originalSignal
          ? <span style={{ fontSize: 10, background: SOP.surfaceRaised, color: SOP.textSecondary, padding: '1px 5px', borderRadius: 3 }}>{originalSignal}</span>
          : <span style={{ color: '#475569' }}>—</span>
        }
      </td>
      <td className="short-ops-td">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
          <button
            onClick={handleInlineClose}
            disabled={closing}
            style={{ padding: '3px 10px', background: closing ? '#7f1d1d' : '#dc2626', color: '#fff', border: 'none', borderRadius: 5, cursor: closing ? 'wait' : 'pointer', fontSize: 10, fontWeight: 800, whiteSpace: 'nowrap', transition: 'background 0.2s' }}
            title="Manually close this LONG position now"
          >
            {closing ? '⏳ …' : '✕ Close'}
          </button>
          <OtaLlmSuspendControl
            walletAddress={String(p.user_id || '').trim().toLowerCase()}
            token={p.symbol}
            suspended={openAiSuspended === true}
            onChanged={onLlmSuspendChanged}
            suspendLane="long"
            compact
          />
          {isLongOpsConfigured() && p.id != null && (
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 6,
                fontSize: 9,
                color: '#94a3b8',
                fontWeight: 600,
                lineHeight: 1.35,
                maxWidth: 168,
                cursor: lossGuardBusy ? 'wait' : 'pointer',
              }}
              title={
                'Only this position (DB ID): OTA does not execute automatic closes that would close at a loss ' +
                '(LLM signal, TP/SL monitor). It does not block other symbols or stop feed analyses. ' +
                'The manual "Close" action above remains available.'
              }
            >
              <input
                type="checkbox"
                style={{ marginTop: 2 }}
                checked={lossGuardOn}
                disabled={lossGuardBusy}
                onChange={async (ev) => {
                  const next = ev.target.checked;
                  const uid = (walletAddress || p.user_id || '').toString().trim();
                  if (!uid) {
                    toast.error('Wallet / userId missing');
                    return;
                  }
                  setLossGuardBusy(true);
                  try {
                    await postLongPositionLossCloseGuard({
                      userId: uid,
                      positionId: p.id,
                      userBlocksOtaCloseWhileNetLoss: next,
                    });
                    toast.success(next ? 'OTA: automatic loss closes stopped for this position.' : 'Option disabled for this position.');
                    onLossGuardChanged?.();
                  } catch (err) {
                    toast.error(err?.message || 'Could not save');
                  } finally {
                    setLossGuardBusy(false);
                  }
                }}
              />
              <span>
                OTA: do not auto-close at a loss{' '}
                <span style={{ color: '#64748b', fontWeight: 500 }}>(pos. #{p.id} only)</span>
              </span>
            </label>
          )}
        </div>
        {closeErr && <div style={{ fontSize: 9, color: '#f87171', marginTop: 2 }}>{closeErr}</div>}
      </td>
    </tr>
  );
}

/**
 * Cheie stabilă pentru poll feed: același 0x nu e „alt user” când wagmi alternează
 * EIP-55 vs lowercase → fără reset listă la fiecare câteva secunde.
 */
function normalizeOtaSignalsFeedUserKey(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  if (/^0x[a-fA-F0-9]{40}$/.test(s)) return s.toLowerCase();
  return s;
}

/** Ultimele N analize = primele N după sortare desc. după timestamp API (fără prag „din ultimele X ore”). */
const RECENT_LONG_ANALYSIS_LIMIT = 5;
/** Buffer: încărcăm multe rânduri, merged+dedupe+sort, apoi slice la 5. */
const RECENT_LONG_ANALYSIS_FETCH_LIMIT = 200;
/** Reîncarcă feed GET /signals — fallback când SSE e oprit sau a eșuat. */
const RECENT_OTA_SIGNALS_POLL_MS = 60000;
/** false = fără GET …/signals/stream (doar GET + poll). Setează VITE_OTA_SIGNALS_SSE=false pentru dezactivare. */
const OTA_SIGNALS_USE_SSE =
  typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_OTA_SIGNALS_SSE !== 'false';
const OTA_SIGNALS_SSE_STAGGER_MS = 350;
/** Suspend + token blocks când feed-ul principal vine din SSE. */
const LONG_FEED_AUX_POLL_MS = 90000;
/** După ultimul user valid, ținem cheia feed / afișare ~20s dacă wallet devine gol tranzitoriu (wagmi). */
const OTA_ANALYSIS_IDENTITY_LATCH_MS = 20000;
/** Signal History: `signalsFeedUserKey` fals → niciun GET /signals; distinct de eșantion gol după fetch. */
const SIGNAL_HISTORY_MSG_MISSING_IDENTITY =
  'Connect a wallet or enter a User ID in the User filter field above to load Signal History.';

/** Rând injectat din POST analyze — reîmbinat la fiecare GET signals (oglindă ShortOpsPanel). */
const PENDING_LONG_ANALYZE_FEED_MAX_AGE_MS = 60 * 60 * 1000;

function mergePendingLongAnalyzeRowIntoSlice(mergedDeduped, pendingRef, fetchLimit) {
  const pending = pendingRef?.current;
  if (!pending || pending._clientInjectedFromAnalyze !== true) return mergedDeduped;
  const ts = new Date(pending.created_at || pending.createdAt || 0).getTime();
  const age = Date.now() - ts;
  if (!Number.isFinite(age) || age < 0 || age > PENDING_LONG_ANALYZE_FEED_MAX_AGE_MS) {
    pendingRef.current = null;
    return mergedDeduped;
  }
  return dedupeSignalsForFeedDisplay([pending, ...(mergedDeduped || [])]).slice(0, fetchLimit);
}

const CLIENT_LONG_ANALYZE_ROW_ID_PREFIX = 'client-long-analyze';

/**
 * Rând în forma GET /signals, din răspunsul POST /analyze — feed LONG arată imediat rezultatul.
 */
function buildClientLongAnalyzeRowForFeed(analyzeApiResponse, tokenUpper, tradeContextLane = 'long_live') {
  if (!analyzeApiResponse || typeof analyzeApiResponse !== 'object') return null;
  const t = String(tokenUpper || '').trim().toUpperCase();
  if (!t) return null;
  const p =
    typeof analyzeApiResponse.signal === 'object' && analyzeApiResponse.signal != null
      ? analyzeApiResponse.signal
      : analyzeApiResponse;
  const sigKey = p?.signal != null ? String(p.signal).trim() : '';
  const nowIso = new Date().toISOString();
  const row = {
    id: `${CLIENT_LONG_ANALYZE_ROW_ID_PREFIX}:${t}:${Date.now()}`,
    token: t,
    tradeContext: tradeContextLane,
    analyzeRequestTradeContext: tradeContextLane,
    signal: sigKey || 'hold',
    confidence: Number.isFinite(Number(p?.confidence)) ? Number(p.confidence) : null,
    reasoning: typeof p?.reasoning === 'string' ? p.reasoning : '',
    analysisSource: p?.analysisSource != null ? String(p.analysisSource) : '',
    created_at: nowIso,
    createdAt: nowIso,
    _clientInjectedFromAnalyze: true,
  };
  if (p?.llmConfidenceIgnored != null && Number.isFinite(Number(p.llmConfidenceIgnored))) {
    row.llmConfidenceIgnored = Number(p.llmConfidenceIgnored);
  }
  if (p?.entryPrice != null && Number.isFinite(Number(p.entryPrice))) row.entryPrice = Number(p.entryPrice);
  if (p?.stopLoss != null && Number.isFinite(Number(p.stopLoss))) row.stopLoss = Number(p.stopLoss);
  if (p?.takeProfit != null && Number.isFinite(Number(p.takeProfit))) row.takeProfit = Number(p.takeProfit);
  const tokenTotal = pickTotalTokensFromUsageValue(p?.tokenUsage);
  if (tokenTotal != null) row.tokenUsage = tokenTotal;
  const costEst = parseUsdNumberLoose(p?.costEstimate);
  if (costEst != null && costEst > 0) {
    row.costUsd = costEst;
    row.costSource = 'estimate';
  }
  if (p?.model != null && String(p.model).trim() !== '') row.model = String(p.model).trim();
  if (p?.skipOpenAIReason != null && String(p.skipOpenAIReason).trim() !== '') {
    row.skipOpenAIReason = String(p.skipOpenAIReason).trim();
  }
  return row;
}

/**
 * Ultima oră de refresh poziții + countdown 30s — state local, fără setState la 1s pe tot LongOpsPanel
 * (înainte re-renderiza întregul panou la fiecare secundă).
 */
const LongOpenPositionsRefreshTicker = memo(function LongOpenPositionsRefreshTicker({ resetEpoch }) {
  const [lastRefresh, setLastRefresh] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const prevEpochRef = useRef(resetEpoch);

  useEffect(() => {
    if (resetEpoch !== prevEpochRef.current) {
      prevEpochRef.current = resetEpoch;
      setLastRefresh(new Date());
      setCountdown(30);
    }
  }, [resetEpoch]);

  useEffect(() => {
    const id = window.setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 30)), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!lastRefresh) return null;
  return (
    <span style={{ color: '#475569', fontSize: 11 }}>
      Last updated: {lastRefresh.toLocaleTimeString()} · refresh in{' '}
      <strong style={{ color: countdown <= 5 ? '#f87171' : '#64748b' }}>{countdown}s</strong>
    </span>
  );
});

export default function LongOpsPanel({ onHoldBlockAvailabilityChange } = {}) {
  const { walletAddress } = useWallet();
  const futuresAnalyzeLlmMode = useOtaFuturesAnalyzeLlmMode();
  const [positions, setPositions] = useState([]);
  const [openAiSuspendByUser, setOpenAiSuspendByUser] = useState({});
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [rejections, setRejections] = useState([]);
  const [killStatus, setKillStatus] = useState(null);
  const [executorDecisions, setExecutorDecisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rejectionsLoading, setRejectionsLoading] = useState(false);
  const [killStatusLoading, setKillStatusLoading] = useState(false);
  const [executorDecisionsLoading, setExecutorDecisionsLoading] = useState(false);
  const [executorDiagnosticsExpanded, setExecutorDiagnosticsExpanded] = useState(false);
  const [rejectionsDiagnosticsExpanded, setRejectionsDiagnosticsExpanded] = useState(false);
  /** Evită „flash” gol la poll: nu arătăm spinner pe tot feed-ul dacă există deja rânduri afișate. */
  const executorDecisionsLenRef = useRef(0);
  const rejectionsLenRef = useRef(0);
  const [error, setError] = useState(null);
  const [filterUserId, setFilterUserId] = useState('');
  const analysisIdentityLatchRef = useRef({ display: '', key: '', at: 0 });
  const effectiveAnalysisUserId = (walletAddress || filterUserId || '').trim();
  const latchNowMs = Date.now();
  const normLatchKey = effectiveAnalysisUserId ? normalizeOtaSignalsFeedUserKey(effectiveAnalysisUserId) : '';
  if (effectiveAnalysisUserId && normLatchKey) {
    analysisIdentityLatchRef.current = {
      display: effectiveAnalysisUserId,
      key: normLatchKey,
      at: latchNowMs,
    };
  }
  const latchSnap = analysisIdentityLatchRef.current;
  const latchStillWarm =
    Boolean(latchSnap.key) && latchNowMs - latchSnap.at < OTA_ANALYSIS_IDENTITY_LATCH_MS;
  const signalsFeedUserKey = normLatchKey || (latchStillWarm ? latchSnap.key : '');
  /** Feed analize: nu cade pe „lipsește user” când `walletAddress` / isConnected fluctuează scurt. */
  const analysisFeedUiUserId = effectiveAnalysisUserId || (latchStillWarm ? latchSnap.display : '');
  const [rejectionsUserId, setRejectionsUserId] = useState('');
  const [killStatusUserId, setKillStatusUserId] = useState('');
  const [executorDecisionUserId, setExecutorDecisionUserId] = useState('');
  const effectiveExecutorDecisionUserId = (executorDecisionUserId || walletAddress || '').trim();
  const [manualUserId, setManualUserId] = useState('');
  const [manualSymbol, setManualSymbol] = useState('');
  const [manualExitMark, setManualExitMark] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [resetUserId, setResetUserId] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [activateKillSubmitting, setActivateKillSubmitting] = useState(false);
  const [tokenBlockModalOpen, setTokenBlockModalOpen] = useState(false);
  const [allowlistTokensModalOpen, setAllowlistTokensModalOpen] = useState(false);
  const [blockTokenOptions, setBlockTokenOptions] = useState([]);
  const [blockSelectedSymbol, setBlockSelectedSymbol] = useState('');
  const [blockSymbolPickerOpen, setBlockSymbolPickerOpen] = useState(false);
  const [blockDurationPreset, setBlockDurationPreset] = useState('24h');
  const [tokenBlocks, setTokenBlocks] = useState([]);
  const [tokenBlockSubmitting, setTokenBlockSubmitting] = useState(false);
  const [unblockModalOpen, setUnblockModalOpen] = useState(false);
  const [unblockModalBusy, setUnblockModalBusy] = useState(false);
  const [unblockKillSnapshot, setUnblockKillSnapshot] = useState(null);
  const [clearingBlockSymbol, setClearingBlockSymbol] = useState(null);
  const [showAllActivityDays, setShowAllActivityDays] = useState(false);
  /** '__ALL__' sau cheie zi (ex: 01.04.26) — butoane sus pentru filtrarea tabelului */
  const [activityDayFilter, setActivityDayFilter] = useState(new Date().toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: '2-digit' }));
  const [backfillBusy, setBackfillBusy] = useState(false);
  const [backfillResult, setBackfillResult] = useState(null);
  const [liveStatus, setLiveStatus] = useState(null);
  const [liveStatusLoading, setLiveStatusLoading] = useState(false);
  /** Merge API: `long_spot` + `common` + `long_focus`; filtru = lane LONG + rânduri `common` relevante (buy/hold/…), fără short_* / semnale SHORT. */
  const [recentLlmSignalsMergedFromApi, setRecentLlmSignalsMergedFromApi] = useState([]);
  const [longFeedSuspendSymbols, setLongFeedSuspendSymbols] = useState(() => new Set());
  const [longFeedTokenBlocks, setLongFeedTokenBlocks] = useState([]);

  const recentLlmSignalsLongContextOnly = useMemo(
    () => filterSignalsForLongFuturesFeed(recentLlmSignalsMergedFromApi || []),
    [recentLlmSignalsMergedFromApi]
  );
  const [recentLlmSignalsLoading, setRecentLlmSignalsLoading] = useState(false);
  /** True din start până după commit React al ultimului setState din fetch — lipicios (vezi queueMicrotask în finally). */
  const [feedSignalsPollBusy, setFeedSignalsPollBusy] = useState(false);
  /** Număr de fetch-uri LLM în paralel; busy rămâne true până scade la 0 (evită flash la poll-uri suprapuse). */
  const feedSignalsInflightRef = useRef(0);
  const recentLlmPanelVisibleLenRef = useRef(0);
  /** Urmărește user-ul pentru care e feed-ul; la poll pe același user nu înlocuim cu răspuns gol de la API. */
  const longSignalsFeedUidRef = useRef('');
  /** Payload API ultim per tradeContext — merge la snapshot SSE. */
  const longBranchLastRef = useRef({ long_spot: null, common: null, long_focus: null });
  /** După primul merge din GET /signals — evită race SSE înainte de HTTP (merge gol șterge feed-ul). */
  const longSignalsHttpHydratedRef = useRef(false);
  /** true → renunță la SSE și folosește poll HTTP. */
  const [signalsPreferHttpPoll, setSignalsPreferHttpPoll] = useState(false);
  const [longBrowserAnalyzeBusy, setLongBrowserAnalyzeBusy] = useState(false);
  const [lastLongAnalyzeSummary, setLastLongAnalyzeSummary] = useState(null);
  const pendingLongAnalyzeFeedRowRef = useRef(null);
  const previousAnalyzeModeRef = useRef(futuresAnalyzeLlmMode);
  const [winRateStats, setWinRateStats] = useState(null);
  const [winRateLoading, setWinRateLoading] = useState(false);
  const [winRateDays, setWinRateDays] = useState(1);
  /** Tic pentru „timp scurs de la analiză” — actualizare la câteva secunde fără refresh API. */
  const [analysisClock, setAnalysisClock] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setAnalysisClock(Date.now()), 5000);
    return () => window.clearInterval(id);
  }, []);

  /** Poziții LONG deschise indexate pe simbol (pentru clarificare card analiză vs. tabel). */
  const openLongPositionBySymbol = useMemo(() => {
    const m = new Map();
    for (const p of positions || []) {
      if (!p || String(p.status || 'open').toLowerCase() !== 'open') continue;
      const k = String(p.symbol || '').toUpperCase().trim();
      if (k) m.set(k, p);
    }
    return m;
  }, [positions]);

  const futuresPeerNavOpenPositionCount = useMemo(() => {
    let n = 0;
    for (const p of positions || []) {
      if (!p || String(p.status || 'open').toLowerCase() !== 'open') continue;
      n += 1;
    }
    return n;
  }, [positions]);

  useEffect(() => {
    onHoldBlockAvailabilityChange?.(Boolean(liveStatus));
  }, [liveStatus, onHoldBlockAvailabilityChange]);

  useEffect(() => {
    if (previousAnalyzeModeRef.current === futuresAnalyzeLlmMode) return;
    previousAnalyzeModeRef.current = futuresAnalyzeLlmMode;
    setLastLongAnalyzeSummary(null);
  }, [futuresAnalyzeLlmMode]);

  const activityDayKeys = useMemo(() => {
    const out = [];
    const seen = new Set();
    const today = new Date().toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: '2-digit' });
    out.push(today);
    seen.add(today);
    activity.forEach((a) => {
      if (!a.created_at) return;
      const k = new Date(a.created_at).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: '2-digit' });
      if (!seen.has(k)) {
        seen.add(k);
        out.push(k);
      }
    });
    return out;
  }, [activity]);

  const activityFiltered = useMemo(() => {
    if (activityDayFilter === '__ALL__') return activity;
    return activity.filter((a) => {
      if (!a.created_at) return false;
      const k = new Date(a.created_at).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: '2-digit' });
      return k === activityDayFilter;
    });
  }, [activity, activityDayFilter]);

  useEffect(() => {
    if (activityDayFilter === '__ALL__') return;
    if (activityDayKeys.length && !activityDayKeys.includes(activityDayFilter)) {
      // Do nothing, let it be the selected date even if no activity
    }
  }, [activityDayKeys, activityDayFilter]);

  const [venueMark, setVenueMark] = useState(null);
  const [venueMarkLoading, setVenueMarkLoading] = useState(false);
  /** Venue probe controls (read-only); fără aceste state, UI crashează când adapter.present */
  const [probeSymbol, setProbeSymbol] = useState('');
  // Auto-populează toate câmpurile userId cu walletul conectat la load/schimbare wallet
  useEffect(() => {
    if (!walletAddress) return;
    setFilterUserId(prev => prev || walletAddress);
    setRejectionsUserId(prev => prev || walletAddress);
    setKillStatusUserId(prev => prev || walletAddress);
    setExecutorDecisionUserId(prev => prev || walletAddress);
    setManualUserId(prev => prev || walletAddress);
    setResetUserId(prev => prev || walletAddress);
  }, [walletAddress]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await getTrackedTokensFromBackend();
      if (cancelled) return;
      const syms = (rows || []).map((r) => String(r.symbol || '').trim().toUpperCase()).filter(Boolean);
      setBlockTokenOptions(syms);
    })();
    return () => { cancelled = true; };
  }, []);

  /**
   * Simboluri pentru blocare: tokeni urmăriți (GET tracked-tokens), allowlist/policy din live-status,
   * semnale LLM recente, plus decizii/poziții/activitate/resping — aceeași strategie ca ShortOpsPanel.
   */
  const blockableTokenSymbols = useMemo(() => {
    const seen = new Set();
    const out = [];
    const push = (s) => {
      const u = String(s || '').trim().toUpperCase();
      if (!u || seen.has(u)) return;
      seen.add(u);
      out.push(u);
    };
    blockTokenOptions.forEach(push);
    Object.keys(OTA_BINANCE_FUTURES_VENUE || {}).forEach(push);
    (liveStatus?.liveSymbolAllowlist || []).forEach(push);
    const cfgAllowed = liveStatus?.config?.allowedSymbols;
    if (Array.isArray(cfgAllowed)) cfgAllowed.forEach(push);
    recentLlmSignalsLongContextOnly.forEach((sig) => push(signalRowToken(sig) || sig.token));
    executorDecisions.forEach((d) => push(d.token));
    positions.forEach((p) => push(p.symbol));
    activity.forEach((a) => push(a.token));
    rejections.forEach((r) => push(r.symbol));
    out.sort((a, b) => a.localeCompare(b));
    return out;
  }, [blockTokenOptions, liveStatus, recentLlmSignalsLongContextOnly, executorDecisions, positions, activity, rejections]);

  /** Dropdown Venue probe: allowlist exec + policy allowedSymbols + SSOT Binance USD-M. */
  const venueProbeSymbolList = useMemo(() => {
    const seen = new Set();
    const out = [];
    const push = (s) => {
      const u = String(s || '').trim().toUpperCase();
      if (!u || seen.has(u)) return;
      seen.add(u);
      out.push(u);
    };
    (liveStatus?.liveSymbolAllowlist || []).forEach(push);
    const cfgAllowed = liveStatus?.config?.allowedSymbols;
    if (Array.isArray(cfgAllowed)) cfgAllowed.forEach(push);
    Object.keys(OTA_BINANCE_FUTURES_VENUE || {}).forEach(push);
    out.sort((a, b) => a.localeCompare(b));
    return out;
  }, [liveStatus?.liveSymbolAllowlist, liveStatus?.config?.allowedSymbols]);

  /** Same symbol as Venue probes — Analyze (LONG) uses `probeSymbol`; show mark next to feed controls. */
  const browserAnalyzeProbeSymbol =
    normalizeOpsPanelSymbol(probeSymbol) || String(probeSymbol || '').trim().toUpperCase() || '';
  const { price: browserAnalyzeMarkPrice, isLive: browserAnalyzeMarkLive } = useBinanceMarkPrice(
    browserAnalyzeProbeSymbol || null,
  );

  const recentLlmSignalsAfterAllowlist = useMemo(
    () => {
      const withTok = (recentLlmSignalsLongContextOnly || []).filter((sig) => signalRowToken(sig));
      return filterSignalsForLongValidatedAllowlist(withTok, liveStatus?.liveSymbolAllowlist);
    },
    [recentLlmSignalsLongContextOnly, liveStatus?.liveSymbolAllowlist]
  );

  const recentLlmSignalsAfterUserGating = useMemo(
    () =>
      filterLongFeedHiddenByUserGating(
        recentLlmSignalsAfterAllowlist,
        longFeedSuspendSymbols,
        longFeedTokenBlocks
      ),
    [recentLlmSignalsAfterAllowlist, longFeedSuspendSymbols, longFeedTokenBlocks]
  );

  const recentLlmSignalsForPanel = useMemo(
    () => recentLlmSignalsAfterUserGating.slice(0, RECENT_LONG_ANALYSIS_LIMIT),
    [recentLlmSignalsAfterUserGating]
  );

  const longFeedPanelStickySnapshotRef = useRef({ slice: [], userKey: '' });
  const prevLongFeedKeyForStickyRef = useRef(signalsFeedUserKey);

  useEffect(() => {
    const key = signalsFeedUserKey;
    const prev = prevLongFeedKeyForStickyRef.current;
    if (prev === key) return;
    prevLongFeedKeyForStickyRef.current = key;
    // Cheie goală tranzitorie (wagmi): nu resetăm snapshot — altfel lipiciul pierde lastUserKey și feed-ul pulsează gol.
    if (!key) return;
    const snap = longFeedPanelStickySnapshotRef.current;
    if (!snap.userKey || snap.userKey !== key) {
      longFeedPanelStickySnapshotRef.current = { slice: [], userKey: key };
    }
  }, [signalsFeedUserKey]);

  const recentLlmSignalsForPanelDisplay = useMemo(() => {
    const panel = Array.isArray(recentLlmSignalsForPanel) ? recentLlmSignalsForPanel : [];
    const userKey = signalsFeedUserKey != null ? String(signalsFeedUserKey) : '';
    if (panel.length > 0 && userKey) {
      longFeedPanelStickySnapshotRef.current = { slice: panel, userKey };
    }
    const mergedLen = Array.isArray(recentLlmSignalsMergedFromApi) ? recentLlmSignalsMergedFromApi.length : 0;
    const emptyPipelineFlashGuard = mergedLen > 0 && panel.length === 0 && Boolean(userKey);
    return stickySignalsPanelDisplay(panel, {
      pollBusy: feedSignalsPollBusy,
      layoutHold: recentLlmSignalsLoading,
      emptyPipelineFlashGuard,
      userKey,
      lastSlice: longFeedPanelStickySnapshotRef.current.slice,
      lastUserKey: longFeedPanelStickySnapshotRef.current.userKey,
    });
  }, [
    recentLlmSignalsForPanel,
    signalsFeedUserKey,
    feedSignalsPollBusy,
    recentLlmSignalsLoading,
    recentLlmSignalsMergedFromApi,
  ]);

  /** API newest row vs newest visible — după ce feed-ul nu mai ascunde suspend LLM, rămâne util pentru Hold/block. */
  const longStaleFeedHintReason = useMemo(() => {
    const panel0 = Array.isArray(recentLlmSignalsForPanelDisplay) ? recentLlmSignalsForPanelDisplay[0] : null;
    const api0 = Array.isArray(recentLlmSignalsLongContextOnly) ? recentLlmSignalsLongContextOnly[0] : null;
    if (!panel0 || !api0) return STALE_FEED_HINT_REASON.default;
    const msP = pickAnalysisEventEpochMs(panel0);
    const msA = pickAnalysisEventEpochMs(api0);
    if (msA > msP + 500) return STALE_FEED_HINT_REASON.newerHiddenByFilters;
    return STALE_FEED_HINT_REASON.default;
  }, [recentLlmSignalsForPanelDisplay, recentLlmSignalsLongContextOnly]);

  useEffect(() => {
    executorDecisionsLenRef.current = executorDecisions.length;
  }, [executorDecisions.length]);

  useEffect(() => {
    recentLlmPanelVisibleLenRef.current = recentLlmSignalsForPanel.length;
  }, [recentLlmSignalsForPanel.length]);

  useEffect(() => {
    rejectionsLenRef.current = rejections.length;
  }, [rejections.length]);

  const executorDecisionsSorted = useMemo(
    () => sortDiagnosticsByCreatedDesc(executorDecisions),
    [executorDecisions]
  );
  const rejectionsSorted = useMemo(
    () => sortDiagnosticsByCreatedDesc(rejections),
    [rejections]
  );
  const executorDecisionsDisplayRows = useMemo(() => {
    const s = executorDecisionsSorted;
    if (executorDiagnosticsExpanded || s.length <= OPS_DIAG_PREVIEW_LIMIT) return s;
    return s.slice(0, OPS_DIAG_PREVIEW_LIMIT);
  }, [executorDecisionsSorted, executorDiagnosticsExpanded]);
  const rejectionsDisplayRows = useMemo(() => {
    const s = rejectionsSorted;
    if (rejectionsDiagnosticsExpanded || s.length <= OPS_DIAG_PREVIEW_LIMIT) return s;
    return s.slice(0, OPS_DIAG_PREVIEW_LIMIT);
  }, [rejectionsSorted, rejectionsDiagnosticsExpanded]);

  const longFeedHiddenByGatingDebug = useMemo(
    () =>
      buildFuturesFeedHiddenByGatingDebug({
        signalsAfterAllowlist: recentLlmSignalsAfterAllowlist,
        signalsAfterUserGating: recentLlmSignalsAfterUserGating,
        suspendSymbolSet: longFeedSuspendSymbols,
        tokenBlocks: longFeedTokenBlocks,
        tokenFromSignal: signalRowToken,
        isTokenBlockActive: isTokenBlockActiveForFeed,
        symbolFromBlock: tokenBlockSymbol,
        suspendReasonLabel: 'Suspend LLM (open positions) — entire LONG lane for symbol',
        blockReasonLabel: 'Hold LONG / active token block in UI',
      }),
    [
      recentLlmSignalsAfterAllowlist,
      recentLlmSignalsAfterUserGating,
      longFeedSuspendSymbols,
      longFeedTokenBlocks,
    ]
  );

  /**
   * Simboluri unde analiza poate rula pe LONG — aceeași combinație ca feed-ul:
   * nu pe lista GET openai-suspend (lane long) și fără Hold/blocare token LONG activă.
   */
  const openAiAnalysisAllowedSymbolsLong = useMemo(() => {
    if (!analysisFeedUiUserId?.trim()) return [];
    const susp = longFeedSuspendSymbols;
    const hold = new Set();
    (longFeedTokenBlocks || []).forEach((b) => {
      if (!isTokenBlockActiveForFeed(b)) return;
      const sym = tokenBlockSymbol(b);
      if (sym) hold.add(sym);
    });
    return blockableTokenSymbols.filter((s) => !susp.has(s) && !hold.has(s));
  }, [analysisFeedUiUserId, blockableTokenSymbols, longFeedSuspendSymbols, longFeedTokenBlocks]);

  useEffect(() => {
    if (!tokenBlockModalOpen) setBlockSymbolPickerOpen(false);
  }, [tokenBlockModalOpen]);

  const fetchTokenBlocks = useCallback(async (opts = {}) => {
    const { notifyOnError = false } = opts;
    const uid = (resetUserId || walletAddress || '').trim();
    if (!uid) {
      setTokenBlocks([]);
      return [];
    }
    try {
      const d = await getLongTokenBlocks(uid);
      const raw = d.blocks ?? d.blockList ?? d.entries ?? [];
      const list = Array.isArray(raw) ? raw : [];
      setTokenBlocks(list);
      return list;
    } catch (e) {
      setTokenBlocks([]);
      const msg = e?.message || 'Could not load GET …/long/token-blocks';
      if (notifyOnError) toast.error(msg);
      console.warn('[LongOpsPanel] getLongTokenBlocks:', msg);
      return [];
    }
  }, [resetUserId, walletAddress]);

  useEffect(() => {
    fetchTokenBlocks({ notifyOnError: false });
  }, [fetchTokenBlocks]);

  useEffect(() => {
    if (venueProbeSymbolList.length > 0 && !probeSymbol) setProbeSymbol(venueProbeSymbolList[0]);
  }, [venueProbeSymbolList, probeSymbol]);
  const [probeBusy, setProbeBusy] = useState(false);
  const [probeLast, setProbeLast] = useState(null);
  const [allProbesData, setAllProbesData] = useState(null);
  const [allProbesBusy, setAllProbesBusy] = useState(false);
  const [quickHoldBusy, setQuickHoldBusy] = useState(false);
  const [holdAllTokensBusy, setHoldAllTokensBusy] = useState(false);
  const [clearAllTokenBlocksBusy, setClearAllTokenBlocksBusy] = useState(false);

  // fundingRates: { 'BTC': 0.0001, 'XRP': 0.00015, ... } — funding rate per 8h de la Binance
  const [fundingRates, setFundingRates] = useState({});
  /** Per long_positions.id: { status, totalUsd?, entryCount?, source?, message? } — acc real Binance income (același cont USDM ca SHORT) */
  const [fundingAccByPositionId, setFundingAccByPositionId] = useState({});

  const fetchFundingRates = useCallback(async (syms) => {
    if (!syms || syms.length === 0) return;
    const uniqueSyms = [...new Set(syms)];
    const results = await Promise.allSettled(
      uniqueSyms.map(async (sym) => {
        try {
          const r = await getPublicBinanceFunding(sym);
          return { sym, rate: Number(r?.fundingRate ?? r?.rate ?? 0) };
        } catch (_) {
          return { sym, rate: null };
        }
      })
    );
    const map = {};
    results.forEach((res) => {
      if (res.status === 'fulfilled' && res.value.rate != null) {
        map[res.value.sym] = res.value.rate;
      }
    });
    setFundingRates((prev) => ({ ...prev, ...map }));
  }, []);

  const fetchFundingAccForPositions = useCallback(async (pos) => {
    const list = pos || [];
    const liveRows = list.filter((p) => p?.metadata?.live === true && p.opened_at && p.id != null);
    if (liveRows.length === 0) {
      setFundingAccByPositionId({});
      return;
    }
    const loadingMap = {};
    liveRows.forEach((row) => {
      loadingMap[row.id] = { status: 'loading' };
    });
    setFundingAccByPositionId(loadingMap);
    const settled = await Promise.allSettled(
      liveRows.map(async (p) => {
        const t = new Date(p.opened_at).getTime();
        const data = await getVenueFundingAcc(p.symbol, t, p.user_id || walletAddress || filterUserId);
        return { id: p.id, data };
      })
    );
    const done = {};
    settled.forEach((res, idx) => {
      const row = liveRows[idx];
      if (res.status === 'fulfilled' && res.value.data?.success === true) {
        done[row.id] = {
          status: 'ok',
          totalUsd: Number(res.value.data.totalUsd),
          entryCount: Number(res.value.data.entryCount ?? 0),
          source: res.value.data.source || null,
        };
      } else {
        const msg =
          res.status === 'rejected'
            ? res.reason?.message || 'Network error'
            : res.status === 'fulfilled'
              ? res.value?.data?.error || JSON.stringify(res.value?.data || {})
              : 'Invalid response';
        done[row.id] = { status: 'error', message: String(msg) };
      }
    });
    setFundingAccByPositionId(done);
  }, [walletAddress, filterUserId]);

  const fetchPositions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const uid = (filterUserId || walletAddress || '').trim();
      if (!uid) throw new Error('userId required');
      const data = await getOpenLongs(uid);
      const pos = data.positions || [];
      setPositions(pos);
      // Fetch funding rates pentru simbolurile active
      const syms = [...new Set(pos.map((p) => p.symbol).filter(Boolean))];
      if (syms.length > 0) fetchFundingRates(syms);
      fetchFundingAccForPositions(pos);
      const users = [...new Set(pos.map((p) => String(p.user_id || '').trim().toLowerCase()).filter(Boolean))];
      const suspendMap = {};
      await Promise.all(users.map(async (u) => {
        try {
          const r = await getOtaPositionOpenAiSuspendList(u, { lane: 'long' });
          suspendMap[u] = new Set((r.symbols || []).map((s) => String(s).trim().toUpperCase()));
        } catch {
          suspendMap[u] = new Set();
        }
      }));
      setOpenAiSuspendByUser(suspendMap);
    } catch (e) {
      setError(e.message || 'Failed to load');
      setPositions([]);
      setOpenAiSuspendByUser({});
    } finally {
      setLoading(false);
    }
  }, [filterUserId, walletAddress, fetchFundingRates, fetchFundingAccForPositions]);

  const fetchActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      const data = await getLongActivity(analysisFeedUiUserId || walletAddress || '', 20);
      setActivity(data.activity || []);
    } catch (_) {
      setActivity([]);
    } finally {
      setActivityLoading(false);
    }
  }, [analysisFeedUiUserId, walletAddress]);

  const fetchRejections = useCallback(async () => {
    if (rejectionsLenRef.current === 0) setRejectionsLoading(true);
    try {
      const data = await getRejections((rejectionsUserId || walletAddress || '').trim(), 100);
      setRejections(data.rejections || []);
    } catch (e) {
      toast.error(e.message || 'Failed to load rejections');
    } finally {
      setRejectionsLoading(false);
    }
  }, [rejectionsUserId, walletAddress]);

  const fetchKillStatus = useCallback(async () => {
    setKillStatusLoading(true);
    try {
      const data = await getKillStatus((killStatusUserId || walletAddress || '').trim());
      setKillStatus(data.killStatus);
    } catch (e) {
      setKillStatus(null);
      toast.error(e.message || 'Failed to load kill status');
    } finally {
      setKillStatusLoading(false);
    }
  }, [killStatusUserId, walletAddress]);

  const fetchExecutorDecisionLog = useCallback(async () => {
    if (executorDecisionsLenRef.current === 0) setExecutorDecisionsLoading(true);
    try {
      const data = await getExecutorDecisions({
        userId: effectiveExecutorDecisionUserId || null,
        limit: 50,
      });
      setExecutorDecisions(data.decisions || []);
    } catch (e) {
      toast.error(e.message || 'Failed to load executor decisions');
    } finally {
      setExecutorDecisionsLoading(false);
    }
  }, [effectiveExecutorDecisionUserId]);

  const fetchLiveStatus = useCallback(async () => {
    setLiveStatusLoading(true);
    try {
      const data = await getLiveStatus();
      setLiveStatus((p) => reduceOtaFuturesLiveStatus(p, { ok: true, data }));
    } catch (e) {
      setLiveStatus((p) => reduceOtaFuturesLiveStatus(p, { ok: false }));
      toast.error(e.message || 'Failed to load live status');
    } finally {
      setLiveStatusLoading(false);
    }
  }, []);

  const mergeLongBranchesToState = useCallback((rSpot, rCommon, rFocus, forceReplace) => {
    const signalBranchFailures = [rSpot, rCommon, rFocus].filter((r) => !r.ok);
    const dataSpot = normalizeSignalsListBranchPayload(rSpot.data);
    const dataCommon = normalizeSignalsListBranchPayload(rCommon.data);
    const dataFocus = normalizeSignalsListBranchPayload(rFocus.data);
    const tagSignalsWithQueryBranch = (signals, branch) => {
      if (!Array.isArray(signals)) return [];
      return signals.map((row) =>
        row && typeof row === 'object' ? { ...row, _otaSignalsQueryBranch: branch } : row
      );
    };
    const mergedDeduped = dedupeSignalsForFeedDisplay(
      mergeLongSpotAndFocusSignals(
        mergeLongSpotAndFocusSignals(
          tagSignalsWithQueryBranch(dataSpot?.signals, 'long_spot'),
          tagSignalsWithQueryBranch(dataFocus?.signals, 'long_focus')
        ),
        tagSignalsWithQueryBranch(dataCommon?.signals, 'common')
      )
    );
    const mergedWithPending = mergePendingLongAnalyzeRowIntoSlice(
      mergedDeduped,
      pendingLongAnalyzeFeedRowRef,
      RECENT_LONG_ANALYSIS_FETCH_LIMIT
    );
    setRecentLlmSignalsMergedFromApi((prev) =>
      reduceOtaRecentSignalsFeed(prev, mergedWithPending, {
        forceReplace,
        signalBranchFailures,
      })
    );
    if (mergedDeduped.length === 0 && signalBranchFailures.length > 0) {
      const f = signalBranchFailures[0];
      const is429 = /429|Too Many Requests|rate limit/i.test(String(f.err));
      toast.error(
        is429
          ? 'LONG analyses: signals endpoint returned HTTP 429 (rate limited). Branches are staggered; if this persists, widen the poll interval or raise the server limit.'
          : `LONG analyses: GET /ai-trading/signals (${f.tradeContext}) — ${f.err}. Check session/API and tradeContext on the server.`
      );
    }
  }, []);

  const fetchLongFeedAuxiliary = useCallback(async (uid) => {
    const blocksRes = await getLongTokenBlocks(uid).catch(() => null);
    let suspendRes = { symbols: [] };
    let suspendOk = true;
    try {
      suspendRes = await getOtaPositionOpenAiSuspendList(uid, { lane: 'long' });
    } catch (err) {
      suspendOk = false;
      toast.error(err?.message || 'Could not load OpenAI suspend list (LONG lane).');
    }
    if (suspendOk) {
      const suspended = new Set(
        (suspendRes.symbols || []).map((s) => String(s).trim().toUpperCase()).filter(Boolean)
      );
      setLongFeedSuspendSymbols(suspended);
    }
    if (blocksRes != null && typeof blocksRes === 'object') {
      const rawBlocks = blocksRes.blocks ?? blocksRes.blockList ?? blocksRes.entries ?? [];
      const blockList = Array.isArray(rawBlocks) ? rawBlocks : [];
      setLongFeedTokenBlocks(blockList);
    }
  }, []);

  const fetchRecentLlmSignals = useCallback(async (opts = {}) => {
    const forceReplace = opts.forceReplace === true;
    // Lipsește user tranzitoriu (wagmi) — NU golim feed/ref: evită dispariții la poll.
    if (!signalsFeedUserKey) return;
    const uid = signalsFeedUserKey;
    if (longSignalsFeedUidRef.current !== uid) {
      longSignalsFeedUidRef.current = uid;
      pendingLongAnalyzeFeedRowRef.current = null;
      setRecentLlmSignalsMergedFromApi([]);
      setLongFeedSuspendSymbols(new Set());
      setLongFeedTokenBlocks([]);
      longBranchLastRef.current = { long_spot: null, common: null, long_focus: null };
      longSignalsHttpHydratedRef.current = false;
      setSignalsPreferHttpPoll(false);
    }
    if (recentLlmPanelVisibleLenRef.current === 0) setRecentLlmSignalsLoading(true);
    feedSignalsInflightRef.current += 1;
    setFeedSignalsPollBusy(true);
    try {
      const fetchSignalsBranch = async (tradeContext) => {
        try {
          const data = await getRecentLlmSignals(uid, {
            limit: RECENT_LONG_ANALYSIS_FETCH_LIMIT,
            tradeContext,
            skipCache: forceReplace,
          });
          return { tradeContext, ok: true, data };
        } catch (err) {
          return {
            tradeContext,
            ok: false,
            data: { signals: [] },
            err: err?.message || String(err),
          };
        }
      };
      const rFocus = await fetchSignalsBranch('long_focus');
      const rSpot = { tradeContext: 'long_spot', ok: true, data: { signals: [] } };
      const rCommon = { tradeContext: 'common', ok: true, data: { signals: [] } };
      longBranchLastRef.current = {
        long_spot: rSpot.data,
        common: rCommon.data,
        long_focus: rFocus.data,
      };
      mergeLongBranchesToState(rSpot, rCommon, rFocus, forceReplace);
      longSignalsHttpHydratedRef.current = true;
      await fetchLongFeedAuxiliary(uid);
      if (forceReplace) dispatchOtaFuturesTraceImmediatePoll();
    } catch (e) {
      toast.error(e.message || 'Failed to load recent OTA analyses');
    } finally {
      setRecentLlmSignalsLoading(false);
      feedSignalsInflightRef.current = Math.max(0, feedSignalsInflightRef.current - 1);
      // Fără microtask: setState(merge) și setFeedSignalsPollBusy(false) sunt într-un singur batch →
      // un frame cu forPanel=[] și pollBusy=false → lipiciul nu se aplică (Încercare #2 „tot la fel”).
      queueMicrotask(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (feedSignalsInflightRef.current === 0) setFeedSignalsPollBusy(false);
          });
        });
      });
    }
  }, [signalsFeedUserKey, mergeLongBranchesToState, fetchLongFeedAuxiliary]);

  /** POST /ai-trading/analyze cu tradeContext long_live — același contract ca SHORT: `analyzeMarket` + preferința LLM (localStorage) → body.engineNoOpenAi. */
  const runLongBrowserAnalyze = useCallback(async () => {
    const uid = (analysisFeedUiUserId || '').trim();
    if (!uid) {
      toast.warning('Connect a wallet or set the user id for analysis.');
      return;
    }
    const raw = (probeSymbol || '').trim().toUpperCase();
    const fromList = Array.isArray(liveStatus?.liveSymbolAllowlist) && liveStatus?.liveSymbolAllowlist?.length > 0
      ? String(liveStatus?.liveSymbolAllowlist[0]).trim().toUpperCase()
      : '';
    const token = raw || fromList;
    if (!token) {
      toast.warning('Pick a symbol from the Live gate or wait for the allowlist to load.');
      return;
    }
    const traceProviderFromMode =
      futuresAnalyzeLlmMode === OTA_ANALYZE_LLM_OTA_BITS_ONLY
        ? 'ota_engine'
        : futuresAnalyzeLlmMode === OTA_ANALYZE_LLM_ANTHROPIC
          ? 'anthropic'
          : 'openai';
    setLongBrowserAnalyzeBusy(true);
    try {
      dispatchOtaFuturesTraceAppendEvent({
        userId: uid,
        event: {
          type: 'browser_analyze',
          phase: 'start',
          token,
          quoteToken: 'USDT',
          tradeContext: 'long_live',
          provider: traceProviderFromMode,
          ts: Date.now(),
        },
      });
      const recentOutcomes = await loadOutcomesForAnalyze(uid);
      const options = buildAnalyzeOptions(uid, {
        recentOutcomes,
        tradeContext: 'long_live',
      });
      const res = await analyzeMarketWithLlmProvider(token, {
        ...options,
        analyzeLlmMode: futuresAnalyzeLlmMode,
        timeoutMs: 90000,
      });
      const p = typeof res?.signal === 'object' && res.signal != null ? res.signal : res;
      const sigKey = p?.signal != null ? String(p.signal) : '—';
      const confN = Number(p?.confidence);
      const confStr = Number.isFinite(confN) ? `${Math.round(confN * 100)}%` : '—';
      const rawSrc = p?.analysisSource != null ? String(p.analysisSource) : '';
      const src =
        futuresAnalyzeLlmMode === OTA_ANALYZE_LLM_OTA_BITS_ONLY
          ? 'engine_no_openai'
          : rawSrc;
      if (src === 'engine_no_openai' && p && typeof p === 'object') {
        const skipR = p.skipOpenAIReason != null ? String(p.skipOpenAIReason) : '';
        const reasoningTxt = p.reasoning != null ? String(p.reasoning) : '';
        if (skipR === 'ota_openai_llm_disabled' || /OTA_OPENAI_LLM_ENABLED/i.test(reasoningTxt)) {
          toast.error(
            'OpenAI did not run: enable OTA_OPENAI_LLM_ENABLED and set OPENAI_API_KEY on the server. Response is OTA Engine only.',
            { autoClose: 14000 },
          );
        } else if (skipR === 'engine_no_openai_request') {
          toast.warning(
            'No consumer LLM: engine-only was requested (engineNoOpenAi) — check executor llm_tuning or switch from “OTA Engine only”.',
            { autoClose: 12000 },
          );
        } else if (skipR === 'openai_api_error_engine_fallback' || /circuit/i.test(reasoningTxt)) {
          toast.warning(
            'OpenAI unavailable (error/circuit) — OTA Engine fallback was used.',
            { autoClose: 10000 },
          );
        }
      }
      setLastLongAnalyzeSummary({
        token,
        signal: sigKey,
        conf: confStr,
        analysisSource: src,
        tradeContextSent: 'long_live',
        at: Date.now(),
      });
      const totalTokens = Number(p?.tokenUsage?.totalTokens ?? p?.tokenUsage?.total_tokens ?? 0) || 0;
      const explicitCostUsd = Number(p?.openaiPlatformCostUsd ?? p?.costUsd ?? p?.costEstimate ?? 0) || 0;
      dispatchOtaFuturesTraceAppendEvent({
        userId: uid,
        event: {
          type: 'browser_analyze',
          phase: 'done',
          token,
          quoteToken: 'USDT',
          tradeContext: 'long_live',
          provider:
            src === 'anthropic_claude_sonnet'
              ? 'anthropic'
              : src === 'engine_no_openai'
                ? 'ota_engine'
                : traceProviderFromMode,
          model: p?.model || null,
          signal: p?.signal || null,
          confidence: Number.isFinite(confN) ? confN : null,
          totalTokens: totalTokens > 0 ? totalTokens : null,
          costUsd: explicitCostUsd > 0 ? explicitCostUsd : null,
          usdStatus: explicitCostUsd > 0 ? 'charged' : totalTokens > 0 ? 'pending' : 'none',
          analysisSource: src || null,
          ts: Date.now(),
        },
      });
      toast.success(
        `LONG analyze: ${token} → ${sigKey} (${confStr})${src ? ` · ${mapAnalysisSourceToPrimaryLabel(src)}` : ''}. Refreshing Signal History…`,
        { autoClose: 8000 }
      );
      const clientRow = buildClientLongAnalyzeRowForFeed(res, token, 'long_live');
      if (clientRow) pendingLongAnalyzeFeedRowRef.current = clientRow;
      await new Promise((r) => setTimeout(r, 600));
      await fetchRecentLlmSignals({ forceReplace: true });
    } catch (e) {
      dispatchOtaFuturesTraceAppendEvent({
        userId: uid,
        event: {
          type: 'browser_analyze',
          phase: e?.code === 'OTA_LLM_BILLING_CREDIT_REQUIRED' || e?.code === 'OTA_LLM_PROVIDER_PAUSED' ? 'blocked' : 'error',
          token,
          quoteToken: 'USDT',
          tradeContext: 'long_live',
          provider: traceProviderFromMode,
          code: e?.code || null,
          message: e?.message || 'LONG analyze failed',
          ts: Date.now(),
        },
      });
      pendingLongAnalyzeFeedRowRef.current = null;
      setLastLongAnalyzeSummary(null);
      toast.error(e?.message || 'LONG analyze failed');
    } finally {
      setLongBrowserAnalyzeBusy(false);
    }
  }, [analysisFeedUiUserId, probeSymbol, liveStatus?.liveSymbolAllowlist, fetchRecentLlmSignals]);

  const fetchWinRateStats = useCallback(async () => {
    setWinRateLoading(true);
    try {
      const data = await getWinRateStats(analysisFeedUiUserId || walletAddress || '', { days: winRateDays });
      setWinRateStats(data);
    } catch (e) {
      setWinRateStats(null);
    } finally {
      setWinRateLoading(false);
    }
  }, [analysisFeedUiUserId, walletAddress, winRateDays]);

  const autoRefreshRef = useRef(null);
  const [openPositionsRefreshEpoch, bumpOpenPositionsRefresh] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    fetchPositions();
    fetchActivity();
    bumpOpenPositionsRefresh();
  }, [fetchPositions, fetchActivity]);

  useEffect(() => {
    fetchLiveStatus();
  }, [fetchLiveStatus]);

  useEffect(() => {
    fetchRecentLlmSignals();
  }, [fetchRecentLlmSignals]);

  useEffect(() => {
    fetchRejections();
  }, [fetchRejections]);

  useEffect(() => {
    fetchExecutorDecisionLog();
  }, [fetchExecutorDecisionLog]);

  useEffect(() => {
    fetchWinRateStats();
  }, [fetchWinRateStats]);

  useEffect(() => {
    autoRefreshRef.current = setInterval(() => {
      fetchPositions();
      fetchActivity();
      fetchExecutorDecisionLog();
      bumpOpenPositionsRefresh();
    }, 30000);
    return () => clearInterval(autoRefreshRef.current);
  }, [fetchPositions, fetchActivity, fetchExecutorDecisionLog]);

  const signalsPollRef = useRef(null);
  /** GET /signals/stream focus-only — backend long_focus include long_spot + long_live + common. */
  useEffect(() => {
    if (!OTA_SIGNALS_USE_SSE || !signalsFeedUserKey || signalsPreferHttpPoll) return undefined;
    const uid = signalsFeedUserKey;
    const cleanups = [];
    const branches = ['long_focus'];
    branches.forEach((tc, i) => {
      const tid = window.setTimeout(() => {
        const { close } = subscribeOtaSignalsListStream(
          { userId: uid, limit: RECENT_LONG_ANALYSIS_FETCH_LIMIT, offset: 0, tradeContext: tc },
          {
            onEvent: (msg) => {
              if (msg?.type !== 'signals_snapshot' || !msg.payload) return;
              if (!longSignalsHttpHydratedRef.current) return;
              longBranchLastRef.current[tc] = msg.payload;
              const d = longBranchLastRef.current;
              mergeLongBranchesToState(
                { ok: true, tradeContext: 'long_spot', data: { signals: [] } },
                { ok: true, tradeContext: 'common', data: { signals: [] } },
                { ok: true, tradeContext: 'long_focus', data: d.long_focus || { signals: [] } },
                false
              );
            },
            onError: () => {
              setSignalsPreferHttpPoll(true);
              toast.warning('LONG signals live stream unavailable; using periodic HTTP refresh.', { autoClose: 6000 });
            },
          }
        );
        cleanups.push(close);
      }, i * OTA_SIGNALS_SSE_STAGGER_MS);
      cleanups.push(() => window.clearTimeout(tid));
    });
    return () => {
      cleanups.forEach((fn) => {
        try {
          fn();
        } catch (_) { /* noop */ }
      });
    };
  }, [signalsFeedUserKey, signalsPreferHttpPoll, mergeLongBranchesToState]);

  /** Suspend + token blocks la interval când feed-ul vine din SSE (nu la fiecare snapshot). */
  useEffect(() => {
    if (!signalsFeedUserKey || !OTA_SIGNALS_USE_SSE || signalsPreferHttpPoll) return undefined;
    const id = window.setInterval(() => {
      void fetchLongFeedAuxiliary(signalsFeedUserKey);
    }, LONG_FEED_AUX_POLL_MS);
    return () => window.clearInterval(id);
  }, [signalsFeedUserKey, signalsPreferHttpPoll, fetchLongFeedAuxiliary]);

  useEffect(() => {
    if (!signalsFeedUserKey) return undefined;
    if (OTA_SIGNALS_USE_SSE && !signalsPreferHttpPoll) return undefined;
    signalsPollRef.current = window.setInterval(() => {
      fetchRecentLlmSignals();
    }, RECENT_OTA_SIGNALS_POLL_MS);
    return () => {
      if (signalsPollRef.current != null) window.clearInterval(signalsPollRef.current);
    };
  }, [fetchRecentLlmSignals, signalsFeedUserKey, signalsPreferHttpPoll]);

  useEffect(() => {
    const onVis = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        if (OTA_SIGNALS_USE_SSE && !signalsPreferHttpPoll) return;
        fetchRecentLlmSignals();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [fetchRecentLlmSignals, signalsPreferHttpPoll]);

  const handleManualClose = async (e) => {
    e.preventDefault();
    if (!manualUserId.trim() || !manualSymbol.trim()) {
      toast.warning('userId and symbol required');
      return;
    }
    const exitNum = manualExitMark.trim() ? parseFloat(manualExitMark) : NaN;
    if (!Number.isFinite(exitNum) || exitNum <= 0) {
      toast.warning('exitMark is required (positive number) for correct PnL — same as backend /manual-close');
      return;
    }
    setManualSubmitting(true);
    try {
      await postManualClose({
        userId: manualUserId.trim(),
        symbol: manualSymbol.trim(),
        exitMark: exitNum,
      });
      toast.success('Position closed');
      setManualUserId('');
      setManualSymbol('');
      setManualExitMark('');
      fetchPositions();
    } catch (e) {
      toast.error(e.message || 'Close failed');
    } finally {
      setManualSubmitting(false);
    }
  };

  const openUnblockModal = async () => {
    const uid = (resetUserId || walletAddress || '').trim();
    if (!uid) {
      toast.warning('Enter User ID (wallet)');
      return;
    }
    setUnblockModalOpen(true);
    setUnblockModalBusy(true);
    setUnblockKillSnapshot(null);
    try {
      await fetchTokenBlocks({ notifyOnError: true });
      const killData = await getKillStatus(uid);
      setUnblockKillSnapshot(killData?.killStatus ?? null);
    } catch (e) {
      toast.error(e.message || 'Could not load token blocks / kill status');
      setUnblockKillSnapshot(null);
    } finally {
      setUnblockModalBusy(false);
    }
  };

  const refreshUnblockModalKill = async () => {
    const uid = (resetUserId || walletAddress || '').trim();
    if (!uid) return;
    try {
      const killData = await getKillStatus(uid);
      setUnblockKillSnapshot(killData?.killStatus ?? null);
    } catch (_) {
      setUnblockKillSnapshot(null);
    }
  };

  const refreshUnblockModalData = async () => {
    const uid = (resetUserId || walletAddress || '').trim();
    if (!uid) return;
    setUnblockModalBusy(true);
    try {
      await fetchTokenBlocks({ notifyOnError: true });
      const killData = await getKillStatus(uid);
      setUnblockKillSnapshot(killData?.killStatus ?? null);
    } catch (e) {
      toast.error(e.message || 'Refresh failed');
    } finally {
      setUnblockModalBusy(false);
    }
  };

  const handleGlobalKillResetFromModal = async () => {
    const uid = (resetUserId || walletAddress || '').trim();
    if (!uid) {
      toast.warning('User ID missing');
      return;
    }
    if (!window.confirm('Disable global kill lock for this wallet? Per-token blocks above stay until you clear them manually.')) return;
    setResetSubmitting(true);
    try {
      await postResetKill({ userId: uid });
      toast.success('Global kill lock disabled');
      await refreshUnblockModalKill();
      fetchKillStatus();
      fetchPositions();
    } catch (e) {
      toast.error(e.message || 'Reset failed');
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleActivateKill = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!resetUserId.trim()) {
      toast.warning('userId required');
      return;
    }
    if (!window.confirm('Are you sure? Active kill switch = no new LONG positions for this entire wallet!')) return;
    setActivateKillSubmitting(true);
    try {
      await postLongActivateKill({ userId: resetUserId.trim(), reason: 'manual-block' });
      toast.success('Kill switch ON — LONG blocked (global)');
      fetchPositions();
      fetchKillStatus();
    } catch (e2) {
      toast.error(e2.message || 'Activate failed');
    } finally {
      setActivateKillSubmitting(false);
    }
  };

  const openTokenBlockModal = () => {
    const uid = (resetUserId || walletAddress || '').trim();
    if (!uid) {
      toast.warning('Enter User ID (wallet)');
      return;
    }
    setBlockSelectedSymbol((prev) => {
      if (prev) return prev;
      const probe = (probeSymbol || '').trim().toUpperCase();
      if (probe) return probe;
      if (blockableTokenSymbols[0]) return blockableTokenSymbols[0];
      return '';
    });
    setBlockSymbolPickerOpen(false);
    setTokenBlockModalOpen(true);
    fetchTokenBlocks({ notifyOnError: true });
  };

  const confirmTokenBlock = async () => {
    const uid = (resetUserId || walletAddress || '').trim();
    const sym = (blockSelectedSymbol || '').trim().toUpperCase();
    if (!uid) {
      toast.warning('User ID missing');
      return;
    }
    if (!sym) {
      toast.warning('Pick or type a symbol (e.g. BTC)');
      return;
    }
    setTokenBlockSubmitting(true);
    try {
      if (blockDurationPreset === 'permanent') {
        await postLongTokenBlock({ userId: uid, symbol: sym, permanent: true });
      } else {
        const map = { '1h': 60, '6h': 360, '24h': 1440, '7d': 10080, '30d': 43200 };
        const minutes = map[blockDurationPreset];
        if (!minutes) {
          toast.error('Invalid duration');
          return;
        }
        await postLongTokenBlock({ userId: uid, symbol: sym, durationMinutes: minutes });
      }
      toast.success(`LONG ${sym} blocked for the selected interval`);
      setTokenBlockModalOpen(false);
      await fetchTokenBlocks({ notifyOnError: true });
    } catch (e2) {
      toast.error(e2.message || 'Token block error');
    } finally {
      setTokenBlockSubmitting(false);
    }
  };

  const handleClearTokenBlock = async (symbol, { confirm = true } = {}) => {
    const uid = (resetUserId || walletAddress || '').trim();
    if (!uid) return;
    const sym = String(symbol || '').trim().toUpperCase();
    if (!sym) return;
    if (confirm && !window.confirm(`Unblock LONG for ${sym}?`)) return;
    setClearingBlockSymbol(sym);
    try {
      const data = await postLongTokenBlockClear({ userId: uid, symbol: sym });
      if (data?.immediateAnalysisQueued === true) {
        toast.success(`Block removed for ${sym} — immediate analysis queued once (bypass min interval on next executor cycle).`);
      } else {
        toast.success(`Block removed for ${sym}`);
      }
      await fetchTokenBlocks({ notifyOnError: true });
    } catch (e2) {
      toast.error(e2.message || 'Error');
    } finally {
      setClearingBlockSymbol((s) => (s === sym ? null : s));
    }
  };

  const handleHoldAllTokensLong = async () => {
    const uid = (resetUserId || walletAddress || '').trim();
    if (!uid) {
      toast.warning('Enter User ID (wallet) in the toolbar.');
      return;
    }
    const syms = blockableTokenSymbols;
    if (!syms.length) {
      toast.warning('Symbol list is empty — wait for panel data or use Token block…');
      return;
    }
    const preview = syms.slice(0, 12).join(', ');
    const more = syms.length > 12 ? ` … +${syms.length - 12}` : '';
    if (!window.confirm(`Hold LONG (no new LONG opens) for ALL tokens in the list (${syms.length}): ${preview}${more} ?`)) return;
    setHoldAllTokensBusy(true);
    try {
      const d = await postLongTokenBlockBulk({ userId: uid, symbols: syms, permanent: true });
      const n = d.applied ?? d.symbols?.length ?? 0;
      toast.success(`Blocked ${n} symbol(s) LONG (bulk).`);
      await fetchTokenBlocks({ notifyOnError: true });
    } catch (e) {
      toast.error(e.message || 'Bulk hold error');
    } finally {
      setHoldAllTokensBusy(false);
    }
  };

  const handleClearAllTokenBlocksLong = async () => {
    const uid = (resetUserId || walletAddress || '').trim();
    if (!uid) {
      toast.warning('Enter User ID (wallet) in the toolbar.');
      return;
    }
    if (!window.confirm('Remove ALL per-token LONG blocks for this user?')) return;
    setClearAllTokenBlocksBusy(true);
    try {
      const d = await postLongTokenBlockClearAll({ userId: uid });
      const n = d.removedCount ?? d.removedSymbols?.length ?? 0;
      toast.success(n === 0 ? 'No active LONG blocks.' : `Removed ${n} LONG block(s).`);
      await fetchTokenBlocks({ notifyOnError: true });
    } catch (e) {
      toast.error(e.message || 'Clear all failed');
    } finally {
      setClearAllTokenBlocksBusy(false);
    }
  };

  const handleBackfillMetadata = async () => {
    const msg = 'LONG metadata backfill is not available on the backend yet (not the same endpoint as SHORT).';
    setBackfillResult(`⚠️ ${msg}`);
    toast.warning(msg);
  };

  return (
    <div className="short-ops-panel">
      <InjectSpinnerCSS />
      <div className="short-ops-toolbar">
        <span className="short-ops-toolbar-title">Long operations workspace</span>
        <FuturesOpsPeerNav active="long" openLivePositionsCount={futuresPeerNavOpenPositionCount} walletAddress={walletAddress} />
        <span
          className={`short-ops-pill ${liveStatus?.gate?.safeToExecuteLive ? 'short-ops-pill--success' : 'short-ops-pill--warn'}`}
          title={liveStatus?.gate?.safeToExecuteLive ? 'Backend allows live execution on venue (per gate).' : 'Backend blocks live execution on venue.'}
        >
          {liveStatus?.gate?.safeToExecuteLive ? 'Live gate: ON' : 'Live gate: OFF'}
        </span>
        <button type="button" className="short-ops-toolbar-refresh" onClick={() => { fetchPositions(); fetchActivity(); fetchRecentLlmSignals({ forceReplace: true }); fetchExecutorDecisionLog(); bumpOpenPositionsRefresh(); }} disabled={loading}>
          <RefreshCw size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          {loading ? 'Updating…' : 'Refresh all'}
        </button>
      </div>

      <div className="short-ops-live">
        {!liveStatus && (
          <div
            role="status"
            style={{
              margin: '0 0 12px',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid rgba(245, 158, 11, 0.45)',
              background: 'rgba(113, 63, 18, 0.22)',
              color: '#fde68a',
              fontSize: 12,
              lineHeight: 1.45,
              fontWeight: 600,
            }}
          >
            <strong>Live status</strong> is not loaded yet or the last refresh failed — content below is not fully gated. Press Refresh. Gate / allowlist appear after a successful response.
          </div>
        )}
        <div className="short-ops-live-head">
          <button type="button" className="short-ops-btn-tiny" onClick={fetchLiveStatus} disabled={liveStatusLoading}>Refresh</button>
        </div>
          <div className="short-ops-live-top-grid">
            <div
              className="short-ops-live-window"
              data-ota-signal-feed-key-present={signalsFeedUserKey ? 'true' : 'false'}
              data-ota-signal-history-ux={
                !signalsFeedUserKey
                  ? 'missing_identity'
                  : recentLlmSignalsLoading || feedSignalsPollBusy
                    ? 'loading'
                    : recentLlmSignalsForPanelDisplay.length === 0
                      ? 'empty'
                      : 'ready'
              }
            >
              <OtaFuturesAnalysisServiceRibbon lane="long" variant="section" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#e5e7eb', fontWeight: 800, letterSpacing: 0.2 }}>
                    Signal History — last {RECENT_LONG_ANALYSIS_LIMIT} LONG rows (<code style={{ fontSize: 10 }}>long_spot</code> + <code style={{ fontSize: 10 }}>long_focus</code>) — excludes pure SHORT direction
                  </div>
                  <div style={{ fontSize: 10, color: SOP.textSecondary, fontWeight: 500 }}>
                    Historical signals from the signals feed (LONG-compatible rows). SHORT-oriented rows appear in the SHORT panel. Gating/suspend may hide rows.{' '}
                    {OTA_SIGNALS_USE_SSE && !signalsPreferHttpPoll
                      ? 'Updates via live SSE stream (server snapshots) + periodic suspend/blocks refresh.'
                      : `Poll ~${Math.round(RECENT_OTA_SIGNALS_POLL_MS / 1000)}s when tab visible.`}{' '}
                    User:{' '}
                    <span style={{ color: '#cbd5e1' }}>{analysisFeedUiUserId || '—'}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#fbbf24', fontWeight: 600, marginTop: 2 }}>
                    The card does not confirm execution. Real opens show in `Long activity` or `Open positions`; real rejections in `Long rejections`.
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      marginTop: 6,
                      padding: '8px 10px',
                      borderRadius: 6,
                      border: '1px solid rgba(59, 130, 246, 0.45)',
                      background: 'rgba(30, 58, 138, 0.22)',
                      color: '#bfdbfe',
                      lineHeight: 1.45,
                    }}
                  >
                    <strong style={{ color: '#e0f2fe' }}>Confidence vs opening LONG:</strong>{' '}
                    {(() => {
                      const om = Number(
                        liveStatus?.longConfidenceLeveragePolicy?.openMinConfidence
                        ?? liveStatus?.config?.longMinConfidence,
                      );
                      return Number.isFinite(om) ? (
                        <>
                          <strong>{fmtPct(om)}</strong> = minimum LONG threshold from <strong>server config</strong> (
                          <code style={{ fontSize: 9 }}>OTA_LONG_MIN_CONFIDENCE</code>
                          / live-status) — required for leverage/promotion but <strong>not enough</strong>: you need a signal{' '}
                          <code style={{ fontSize: 9 }}>buy</code>, <code style={{ fontSize: 9 }}>open_long</code>,{' '}
                          <code style={{ fontSize: 9 }}>open_long_futures</code>. On <code style={{ fontSize: 9 }}>sell</code>, high confidence does not open LONG.{' '}
                          <strong>Plus:</strong> the executor may require a higher threshold from <strong>Trading policy</strong> (DB,{' '}
                          <code style={{ fontSize: 9 }}>minConfidenceToOpen</code>
                          ) — sometimes <strong>higher</strong> than {fmtPct(om)}. Skip reasons:{' '}
                          <strong>Executor final decisions</strong> / <strong>Long rejections</strong>.{' '}
                        </>
                      ) : (
                        <>The threshold shown under “Long leverage” comes from live-status; Trading policy (DB) may add another.{' '}</>
                      );
                    })()}
                    Regardless of confidence, without a long-direction signal no new position opens:{' '}
                    <code style={{ fontSize: 9 }}>buy</code>, <code style={{ fontSize: 9 }}>open_long</code>,{' '}
                    <code style={{ fontSize: 9 }}>open_long_futures</code> or <code style={{ fontSize: 9 }}>open_buy</code>.{' '}
                    A <code style={{ fontSize: 9 }}>sell</code> at 70% does not open a new LONG (bearish view). For more long entries, tune engine/LLM on{' '}
                    <strong style={{ color: '#e0f2fe' }}>backend-server</strong> to emit long entry signals, not only high confidence on sell.
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      marginTop: 4,
                      padding: '5px 8px',
                      borderRadius: 6,
                      border: `1px solid ${futuresAnalyzeLlmMode === OTA_ANALYZE_LLM_OTA_BITS_ONLY ? 'rgba(52, 211, 153, 0.35)' : 'rgba(167, 139, 250, 0.35)'}`,
                      background:
                        futuresAnalyzeLlmMode === OTA_ANALYZE_LLM_OTA_BITS_ONLY
                          ? 'rgba(6, 78, 59, 0.2)'
                          : 'rgba(76, 29, 149, 0.2)',
                      color: futuresAnalyzeLlmMode === OTA_ANALYZE_LLM_OTA_BITS_ONLY ? '#a7f3d0' : '#e9d5ff',
                    }}
                  >
                    {futuresAnalyzeLlmMode === OTA_ANALYZE_LLM_OTA_BITS_ONLY
                      ? 'Active: new browser analyzes use OTA Engine only (engineNoOpenAi). Feed mixes history + server — switching mode does not rewrite past rows.'
                      : 'Active: browser analyzes may call OpenAI on the server. Rows without LLM appear when that cycle was engine-only.'}
                  </div>
                  {signalsFeedUserKey && (
                    <OtaFuturesFeedGatingDebugCallout rows={longFeedHiddenByGatingDebug} variant="long" />
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={runLongBrowserAnalyze}
                      disabled={longBrowserAnalyzeBusy || !signalsFeedUserKey}
                      title="Run LONG Live Analysis (server analyze, tradeContext long_live, 90s timeout). Symbol from Live gate or allowlist. Then refresh signal history."
                      style={{
                        fontSize: 11,
                        padding: '4px 10px',
                        background: '#1e3a8a',
                        color: '#bfdbfe',
                        border: '1px solid rgba(96, 165, 250, 0.45)',
                        borderRadius: 5,
                        cursor: signalsFeedUserKey && !longBrowserAnalyzeBusy ? 'pointer' : 'not-allowed',
                        whiteSpace: 'nowrap',
                        fontWeight: 800,
                      }}
                    >
                      {longBrowserAnalyzeBusy ? 'Analyzing…' : 'Analyze (LONG)'}
                    </button>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                        background: SOP.surfaceRaised,
                        border: `1px solid ${SOP.borderMuted}`,
                        borderRadius: 8,
                        padding: '4px 8px',
                      }}
                      title="Same token as Venue probes below. Binance USD-M mark (~10s), same basis as Open positions Mark column."
                    >
                      <label htmlFor="long-ops-analyze-sym-select" style={{ fontSize: 11, color: SOP.textSecondary, fontWeight: 600 }}>
                        Symbol
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CryptoLogo symbol={browserAnalyzeProbeSymbol || probeSymbol} size={18} />
                        {venueProbeSymbolList.length > 0 ? (
                          <select
                            id="long-ops-analyze-sym-select"
                            value={probeSymbol}
                            onChange={(e) => setProbeSymbol(e.target.value)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              outline: 'none',
                              color: '#f1f5f9',
                              fontWeight: 700,
                              fontSize: 12,
                              cursor: 'pointer',
                              maxWidth: 100,
                            }}
                          >
                            {venueProbeSymbolList.map((s) => (
                              <option key={s} value={s} style={{ background: SOP.surfaceRaised, color: '#f1f5f9' }}>
                                {s}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            id="long-ops-analyze-sym-select"
                            value={probeSymbol}
                            onChange={(e) => setProbeSymbol(e.target.value.toUpperCase())}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              outline: 'none',
                              color: '#f1f5f9',
                              fontWeight: 700,
                              fontSize: 12,
                              width: 72,
                            }}
                          />
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: '#e2e8f0', whiteSpace: 'nowrap' }}>
                        {browserAnalyzeMarkPrice != null ? (
                          <>
                            <span style={{ color: SOP.textSecondary, fontWeight: 600 }}>Mark</span>{' '}
                            <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700 }}>{fmtPrice(browserAnalyzeMarkPrice)}</span>
                            {browserAnalyzeMarkLive ? (
                              <span title="Mark updated ~10s" style={{ marginLeft: 4, fontSize: 8, color: '#4ade80', verticalAlign: 'middle' }}>
                                ●
                              </span>
                            ) : null}
                          </>
                        ) : (
                          <span style={{ color: '#475569' }}>Mark —</span>
                        )}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => fetchRecentLlmSignals({ forceReplace: true })}
                      disabled={recentLlmSignalsLoading || !signalsFeedUserKey}
                      style={{ fontSize: 11, padding: '4px 10px', background: SOP.black, color: SOP.text, border: `1px solid ${SOP.borderMuted}`, borderRadius: 5, cursor: signalsFeedUserKey ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', fontWeight: 700 }}
                    >
                      {recentLlmSignalsLoading || feedSignalsPollBusy ? 'Loading…' : 'Refresh analyses'}
                    </button>
                  </div>
                  {lastLongAnalyzeSummary ? (
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: '#93c5fd',
                        maxWidth: 420,
                        textAlign: 'right',
                        lineHeight: 1.35,
                        padding: '4px 8px',
                        borderRadius: 6,
                        background: 'rgba(30, 58, 138, 0.28)',
                        border: '1px solid rgba(96, 165, 250, 0.25)',
                      }}
                    >
                      Last analyze: <strong>{lastLongAnalyzeSummary.token}</strong> → {lastLongAnalyzeSummary.signal} (
                      {lastLongAnalyzeSummary.conf})
                      {lastLongAnalyzeSummary.analysisSource ? (
                        <span
                          title={
                            getTechnicalAnalysisSourceRaw(lastLongAnalyzeSummary.analysisSource)
                              ? `${LABEL_TECHNICAL_DETAILS}: ${getTechnicalAnalysisSourceRaw(lastLongAnalyzeSummary.analysisSource)}`
                              : undefined
                          }
                        >
                          {' '}
                          · {mapAnalysisSourceToPrimaryLabel(lastLongAnalyzeSummary.analysisSource)}
                        </span>
                      ) : null}
                      <span style={{ color: SOP.muted }}> · sent tradeContext={lastLongAnalyzeSummary.tradeContextSent}</span>
                    </div>
                  ) : null}
                </div>
              </div>
              {!signalsFeedUserKey ? (
                <div style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 500 }} role="status">
                  {SIGNAL_HISTORY_MSG_MISSING_IDENTITY}
                </div>
              ) : recentLlmSignalsForPanelDisplay.length === 0 ? (
                <div style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 500 }}>
                  {recentLlmSignalsLoading || feedSignalsPollBusy ? (
                    'Fetching Signal History…'
                  ) : recentLlmSignalsAfterAllowlist.length > 0 && recentLlmSignalsForPanel.length === 0 ? (
                    <>
                      Rows exist in the sample but are <strong>hidden</strong> here by{' '}
                      <strong style={{ color: '#fda4af' }}>Hold LONG</strong> or an active{' '}
                      <strong style={{ color: '#fda4af' }}>LONG token block</strong> on those symbols (LLM suspend does{' '}
                      <em>not</em> remove history from this list). See <strong>Debug feed</strong> above — lift Hold / clear
                      block to show those rows.
                    </>
                  ) : Array.isArray(liveStatus?.liveSymbolAllowlist) && liveStatus?.liveSymbolAllowlist?.length === 0 ? (
                    <>
                      LONG allowlist on the server is empty (
                      <code style={{ fontSize: 10 }}>OTA_LONG_ALLOWED_SYMBOLS</code> /{' '}
                      <code style={{ fontSize: 10 }}>OTA_LONG_LIVE_SYMBOL_ALLOWLIST</code>) — live LONG execution stays blocked until you configure symbols; Signal History still shows DB analyses if any. SHORT:{' '}
                      <code style={{ fontSize: 10 }}>short-ops</code> panel.
                    </>
                  ) : recentLlmSignalsLongContextOnly.length === 0 && recentLlmSignalsMergedFromApi.length > 0 ? (
                    <>
                      The API returned rows, but none pass the LONG feed filter (only <code style={{ fontSize: 10 }}>long_*</code>, not <code style={{ fontSize: 10 }}>short_*</code> / mis-tagged <code style={{ fontSize: 10 }}>common</code>). SHORT analyses live in{' '}
                      <code style={{ fontSize: 10 }}>short-ops</code>.
                    </>
                  ) : recentLlmSignalsLongContextOnly.length > 0 ? (
                    'No recent LONG rows in the sample for LONG allowlist symbols (check executor cycle / DB mirror).'
                  ) : (
                    'No LONG analyses in the feed for this user yet (request completed).'
                  )}
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 6 }}>
                  {(() => {
                    const latest = recentLlmSignalsForPanelDisplay[0];
                    if (!latest) return null;
                    const latestInfo = deriveRecentSignalState(latest, liveStatus);
                    const rowTokLatest = signalRowToken(latest) || latestInfo.tokenUpper || '—';
                    const symKeyLatest = String(rowTokLatest !== '—' ? rowTokLatest : '').toUpperCase().trim();
                    const openLatest = symKeyLatest !== '' && symKeyLatest !== '—' ? openLongPositionBySymbol.get(symKeyLatest) : null;
                    const levPosLatest = openLatest != null ? Number(openLatest.leverage) : null;
                    let statusLatest = latestInfo.statusText;
                    let toneLatest = latestInfo.statusTone;
                    if (openLatest != null) {
                      const nUsd = Number(openLatest.notional_usd);
                      const levStr = Number.isFinite(levPosLatest) && levPosLatest >= 1 ? `${Math.round(levPosLatest)}×` : '—';
                      const pre = `LONG already open (notional ~$${Number.isFinite(nUsd) ? nUsd.toFixed(2) : '—'}, ${levStr}). `;
                      if (latestInfo.isHoldInformative) {
                        statusLatest = `${pre}${latestInfo.statusText}`;
                        toneLatest = '#7dd3fc';
                      } else {
                        statusLatest = `${latestInfo.statusText} · LONG active on ${symKeyLatest}.`;
                      }
                    }
                    return (
                      <div style={{ padding: '7px 9px', background: '#0a0a0a', border: `1px solid ${SOP.borderMuted}`, borderRadius: 7 }}>
                        <OtaFuturesAnalysisServiceRibbon lane="long" sig={latest} compact />
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                          <div style={{ minWidth: 0, flex: '1 1 160px' }}>
                            <div style={{ color: '#f8fafc', fontSize: 11, fontWeight: 800, letterSpacing: 0.2 }}>
                              Latest analysis: {latestInfo.tokenUpper || '—'} · {latestInfo.signalLabel}
                            </div>
                            <div style={{ color: toneLatest, fontSize: 11, fontWeight: 700 }}>{statusLatest}</div>
                          </div>
                          <OtaDualConfidenceDisplay
                            sig={latest}
                            confColor={latestInfo.confColor}
                            confidence={latestInfo.confidence}
                            longOpenThresholdApplies={latestInfo.longOpenThresholdApplies}
                            serverOpenMinConfidence={latestInfo.openMinLeverageGate}
                          />
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexShrink: 0 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                              <OtaFuturesPositionMiniChart baseSymbol={rowTokLatest} compact />
                              <OtaFuturesOi24hStrip baseSymbol={rowTokLatest} compact />
                            </div>
                            {(() => {
                              if (openLatest != null && Number.isFinite(levPosLatest) && levPosLatest >= 1) {
                                return (
                                  <div
                                    style={{ color: '#cbd5e1', fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap', paddingTop: 2 }}
                                    title="Open position leverage — do not confuse with leverage from the current analysis row."
                                  >
                                    Lev open {Math.round(levPosLatest)}×
                                  </div>
                                );
                              }
                              const levUi = otaLeverageBadgeParts(latestInfo.leverageLabel, latestInfo.openMinLeverageGate, fmtPct);
                              return (
                                <div
                                  style={{ color: '#cbd5e1', fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap', paddingTop: 2 }}
                                  title={levUi.title}
                                >
                                  Lev {levUi.line}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                        <OtaAnalysisTimeBlock
                          sig={latest}
                          nowMs={analysisClock}
                          variant="banner"
                          showStaleFeedHint
                          staleFeedHintReason={longStaleFeedHintReason}
                        />
                        {(() => {
                          const evLatest = buildLongHighConfidenceNoOpenEvidence({
                            sig: latest,
                            symKey: symKeyLatest,
                            confidence: latestInfo.confidence,
                            openMin: latestInfo.openMinLeverageGate,
                            longOpenThresholdApplies: latestInfo.longOpenThresholdApplies,
                            openForSym: openLatest,
                            liveStatus,
                            positions,
                            executorDecisions,
                            rejections,
                            longFeedTokenBlocks,
                            longFeedSuspendSymbols,
                            rejectionMatchUserId: rejectionsUserId.trim() || analysisFeedUiUserId,
                            executorMatchUserId: effectiveExecutorDecisionUserId,
                          });
                          if (!evLatest.show) return null;
                          return (
                            <div
                              style={{
                                marginTop: 8,
                                padding: '8px 10px',
                                borderRadius: 8,
                                border: '1px solid rgba(251, 191, 36, 0.45)',
                                background: 'rgba(30, 20, 0, 0.55)',
                              }}
                            >
                              <div style={{ fontSize: 10, fontWeight: 800, color: '#fde68a', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 }}>
                                {evLatest.boxLead}
                              </div>
                              {evLatest.lines.map((ln, ei) => (
                                <div
                                  key={`latest-${ln.id}`}
                                  style={{
                                    marginTop: ei === 0 ? 0 : 8,
                                    paddingBottom: 6,
                                    borderBottom: ei < evLatest.lines.length - 1 ? `1px solid ${SOP.borderMuted}` : 'none',
                                  }}
                                >
                                  <div style={{ fontSize: 11, fontWeight: 800, color: '#fef3c7', lineHeight: 1.35 }}>{ln.title}</div>
                                  <div style={{ fontSize: 11, color: SOP.textSecondary, lineHeight: 1.45, marginTop: 3, fontWeight: 500 }}>{ln.body}</div>
                                  <div style={{ fontSize: 9, color: '#a8a29e', fontFamily: 'ui-monospace, monospace', marginTop: 4, lineHeight: 1.35 }}>{ln.citation}</div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })()}
                  {recentLlmSignalsForPanelDisplay.map((sig) => {
                    const rowTok = signalRowToken(sig) || '—';
                    const symKey = String(rowTok).toUpperCase().trim();
                    const openForSym = symKey !== '—' ? openLongPositionBySymbol.get(symKey) : null;
                    const {
                      confidence,
                      signalLabel,
                      confColor,
                      tokenAllowed,
                      leverageLabel,
                      openMinLeverageGate,
                      statusTone,
                      statusText,
                      isHoldInformative,
                      longOpenThresholdApplies,
                    } = deriveRecentSignalState(sig, liveStatus);
                    const levPos = openForSym != null ? Number(openForSym.leverage) : null;
                    const levChip = (() => {
                      if (openForSym != null && Number.isFinite(levPos) && levPos >= 1) {
                        return {
                          line: `open ${Math.round(levPos)}×`,
                          title:
                            'Leverage of the existing open position. “Below min” on the signal row refers to the current analysis, not to this position.',
                        };
                      }
                      const base = otaLeverageBadgeParts(leverageLabel, openMinLeverageGate, fmtPct);
                      if (!longOpenThresholdApplies && (leverageLabel === '—' || leverageLabel == null || leverageLabel === '')) {
                        return {
                          line: 'n/a',
                          title:
                            'Policy leverage (e.g. 70× at 70%) is hidden: the LONG server config threshold applies only to BUY / open_long — SELL does not open a new LONG.',
                        };
                      }
                      return base;
                    })();
                    let statusTextDisp = statusText;
                    let statusToneDisp = statusTone;
                    if (openForSym != null) {
                      const nUsd = Number(openForSym.notional_usd);
                      const levStr = Number.isFinite(levPos) && levPos >= 1 ? `${Math.round(levPos)}×` : '—';
                      const pre = `LONG already open (notional ~$${Number.isFinite(nUsd) ? nUsd.toFixed(2) : '—'}, ${levStr}). `;
                      if (isHoldInformative) {
                        statusTextDisp = `${pre}${statusText}`;
                        statusToneDisp = '#7dd3fc';
                      } else {
                        statusTextDisp = `${statusText} · LONG active on ${symKey}.`;
                      }
                    }
                    const snapshotFresh = getOtaSignalSnapshotFreshnessNoteFromSig(sig);
                    return (
                      <div
                        key={sig.id != null && String(sig.id) !== '' ? `id:${sig.id}` : `${rowTok}-${pickAnalysisEventEpochMs(sig)}-${normalizedSignalKey(sig)}`}
                        style={{ background: '#000000', border: `1px solid ${SOP.borderMuted}`, borderRadius: 8, padding: '8px 10px' }}
                      >
                        <OtaFuturesAnalysisServiceRibbon lane="long" sig={sig} compact />
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: '1 1 140px' }}>
                            <CryptoLogo symbol={rowTok} size={16} />
                            <span style={{ color: '#f8fafc', fontWeight: 800, letterSpacing: 0.2 }}>{rowTok}</span>
                            <span style={{ fontSize: 10, background: '#111827', color: '#e2e8f0', padding: '2px 6px', borderRadius: 999, fontWeight: 700, letterSpacing: 0.3 }}>{signalLabel}</span>
                            <span
                              style={{ fontSize: 10, background: '#2c2c2e', color: SOP.textSecondary, padding: '2px 6px', borderRadius: 999, fontWeight: 700, border: `1px solid ${SOP.border}` }}
                              title={levChip.title}
                            >
                              Lev {levChip.line}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexShrink: 0 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                              <OtaFuturesPositionMiniChart baseSymbol={rowTok} compact />
                              <OtaFuturesOi24hStrip baseSymbol={rowTok} compact />
                            </div>
                            <OtaDualConfidenceDisplay
                              sig={sig}
                              confColor={confColor}
                              confidence={confidence}
                              longOpenThresholdApplies={longOpenThresholdApplies}
                              serverOpenMinConfidence={openMinLeverageGate}
                            />
                          </div>
                        </div>
                        <OtaAnalysisTimeBlock sig={sig} nowMs={analysisClock} variant="banner" />
                        <div
                          style={{
                            marginTop: 6,
                            padding: '6px 8px',
                            borderRadius: 6,
                            border: `1px solid ${SOP.borderMuted}`,
                            background: 'rgba(15, 23, 42, 0.45)',
                          }}
                        >
                          <div style={{ fontSize: 9, color: '#94a3b8', lineHeight: 1.35, fontWeight: 500 }}>{snapshotFresh.primary}</div>
                          {snapshotFresh.staleSecondary ? (
                            <div style={{ marginTop: 4, fontSize: 9, color: '#fbbf24', lineHeight: 1.35, fontWeight: 600 }}>{snapshotFresh.staleSecondary}</div>
                          ) : null}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 5, flexWrap: 'wrap' }}>
                          <span style={{ color: statusToneDisp, fontSize: 11, fontWeight: 700 }}>{statusTextDisp}</span>
                          <span style={{ color: tokenAllowed ? '#94a3b8' : '#fb7185', fontSize: 10, fontWeight: 600 }}>
                            live symbol: {tokenAllowed ? 'allowed' : 'blocked'}
                          </span>
                        </div>
                        {(() => {
                          if (recentLlmSignalsForPanelDisplay[0] === sig) return null;
                          const evPack = buildLongHighConfidenceNoOpenEvidence({
                            sig,
                            symKey,
                            confidence,
                            openMin: openMinLeverageGate,
                            longOpenThresholdApplies,
                            openForSym,
                            liveStatus,
                            positions,
                            executorDecisions,
                            rejections,
                            longFeedTokenBlocks,
                            longFeedSuspendSymbols,
                            rejectionMatchUserId: rejectionsUserId.trim() || analysisFeedUiUserId,
                            executorMatchUserId: effectiveExecutorDecisionUserId,
                          });
                          if (!evPack.show) return null;
                          return (
                            <div
                              style={{
                                marginTop: 8,
                                padding: '8px 10px',
                                borderRadius: 8,
                                border: '1px solid rgba(251, 191, 36, 0.45)',
                                background: 'rgba(30, 20, 0, 0.55)',
                              }}
                            >
                              <div style={{ fontSize: 10, fontWeight: 800, color: '#fde68a', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 }}>
                                {evPack.boxLead}
                              </div>
                              {evPack.lines.map((ln, ei) => (
                                <div
                                  key={ln.id}
                                  style={{
                                    marginTop: ei === 0 ? 0 : 8,
                                    paddingBottom: 6,
                                    borderBottom: ei < evPack.lines.length - 1 ? `1px solid ${SOP.borderMuted}` : 'none',
                                  }}
                                >
                                  <div style={{ fontSize: 11, fontWeight: 800, color: '#fef3c7', lineHeight: 1.35 }}>{ln.title}</div>
                                  <div style={{ fontSize: 11, color: SOP.textSecondary, lineHeight: 1.45, marginTop: 3, fontWeight: 500 }}>{ln.body}</div>
                                  <div style={{ fontSize: 9, color: '#a8a29e', fontFamily: 'ui-monospace, monospace', marginTop: 4, lineHeight: 1.35 }}>{ln.citation}</div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                        {(() => {
                          const {
                            sourceLabel,
                            sourceColor,
                            costLabel,
                            tokensLabel,
                            isOpenAi,
                            isOpenAiBillingError,
                            uiMismatchNote,
                          } = formatCostAndSourceForSignalCard(sig, { uiPreferredMode: futuresAnalyzeLlmMode });
                          const costColor = isOpenAiBillingError ? '#fb923c' : '#fbbf24';
                          const sourceInline = (
                            <span style={{ whiteSpace: 'nowrap' }}>
                              {' '}
                              <span style={{ color: sourceColor, fontWeight: 700 }}>Sent by: {sourceLabel}</span>
                              <span style={{ color: costColor, fontWeight: 800 }}>{' · '}Cost: {costLabel}</span>
                              {tokensLabel && <span style={{ color: SOP.textSecondary, fontWeight: 600 }}>{' · '}{tokensLabel}</span>}
                            </span>
                          );
                          const costNoteOpenAi = isOpenAi ? (
                            <div
                              style={{ marginTop: 5, fontSize: 9, color: '#64748b', lineHeight: 1.35, fontWeight: 500 }}
                              title="USD estimate from OpenAI usage (prompt×input rate/M + completion×output rate/M, public model rates); excludes other API spend (fine-tuning, other projects on the same key) or VAT. OpenAI invoice = account total, not only this card."
                            >
                              Cost note: reflects OpenAI tokens used by the agent for{' '}
                              <strong style={{ color: '#94a3b8' }}>{signalRowToken(sig) || '—'}</strong>
                              {' '}this cycle — including when there is no anchored completion (e.g. “no anchored decision” message).
                            </div>
                          ) : null;
                          const costNoteBilling = isOpenAiBillingError ? (
                            <div
                              style={{ marginTop: 5, fontSize: 9, color: '#fdba74', lineHeight: 1.35, fontWeight: 600 }}
                              title="Reasoning shows API failure signs (e.g. 429 / quota). This is not “free OTA engine.”"
                            >
                              OpenAI call failed on this row: the message above is from the attempt; cost is not recorded as a successful charge.
                            </div>
                          ) : null;
                          const uiMismatchBlock = uiMismatchNote ? (
                            <div
                              style={{ marginTop: 5, fontSize: 9, color: '#fde68a', lineHeight: 1.35, fontWeight: 600 }}
                            >
                              {uiMismatchNote}
                            </div>
                          ) : null;
                          const reasoningBody = displayReasoningText(sig, futuresAnalyzeLlmMode);
                          return (
                            <React.Fragment key={`reason-${sig.id || rowTok}`}>
                              {reasoningBody ? (
                                <div
                                  style={{
                                    marginTop: 4,
                                    color: SOP.textSecondary,
                                    fontSize: 10,
                                    lineHeight: 1.4,
                                    fontWeight: 500,
                                    whiteSpace: 'normal',
                                    overflowWrap: 'anywhere',
                                    wordBreak: 'break-word',
                                  }}
                                  title={reasoningBody}
                                >
                                  {reasoningBody}
                                </div>
                              ) : null}
                              <div style={{ marginTop: reasoningBody ? 6 : 4, fontSize: 10, lineHeight: 1.4, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                {sourceInline}
                              </div>
                              {costNoteBilling}
                              {costNoteOpenAi}
                              {uiMismatchBlock}
                            </React.Fragment>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="short-ops-live-window">
              <div style={{ fontSize: 12, color: '#e5e7eb', fontWeight: 800, letterSpacing: 0.2, marginBottom: 8 }}>Live gate</div>
              <p className={`short-ops-live-line ${liveStatus?.gate?.safeToExecuteLive ? 'short-ops-live-line--ok' : ''}`}>
                `safeToExecuteLive`: {liveStatus?.gate?.safeToExecuteLive ? 'Yes' : 'No'}
                {liveStatus?.gate?.readOnlyLiveBridge && ' (read-only bridge)'}
              </p>
              {liveStatus?.gate?.reasonIfBlocked && liveStatus?.gate?.reasonIfBlocked !== 'ok' && (
                <p className="short-ops-live-warn">{liveStatus?.gate?.reasonIfBlocked}</p>
              )}
              <p className="short-ops-live-meta">
                Guardrails: {liveStatus?.guardrails?.ok ? 'OK' : 'Blocked'} · Live users: {liveStatus?.liveUserAllowlistCount ?? 0} · Live symbols: {liveStatus?.liveSymbolAllowlistCount ?? 0} · Max positions/user: {liveStatus?.liveMaxPositionsPerUser ?? '—'} · Max $/order: {liveStatus?.liveMaxNotionalPerOrder ?? '—'} · Auto-close: {liveStatus?.liveAutoCloseAllowed ? 'Yes' : 'No'}
              </p>
              <LiveGateAllowlistTokens
                listKind="execution"
                symbols={liveStatus?.liveSymbolAllowlist}
                count={liveStatus?.liveSymbolAllowlistCount ?? liveStatus?.liveSymbolAllowlist?.length ?? 0}
                mutedColor={SOP.muted}
                futuresSideLabel="LONG"
              />
              {(liveStatus?.longConfidenceLeveragePolicy || liveStatus?.config) && (
                <p className="short-ops-live-meta" style={{ color: SOP.textSecondary }}>
                  {liveStatus?.longConfidenceLeveragePolicy?.curve === 'linear' ? (
                    <>
                      Long leverage: <strong>linear</strong> — at confidence {fmtPct(liveStatus?.longConfidenceLeveragePolicy.linearConfMin)} → <strong>{liveStatus?.longConfidenceLeveragePolicy.lowConfidenceLeverage}x</strong>, at {fmtPct(liveStatus?.longConfidenceLeveragePolicy.linearConfMax)} → <strong>{liveStatus?.longConfidenceLeveragePolicy.highConfidenceLeverage}x</strong> (max {liveStatus?.longConfidenceLeveragePolicy.maxLeverage}x); below {fmtPct(liveStatus?.longConfidenceLeveragePolicy.openMinConfidence)} no open · max {liveStatus?.config?.maxOpenPositions ?? '—'} positions
                    </>
                  ) : (
                    <>
                      Long policy: min conf {fmtPct(liveStatus?.config?.longMinConfidence)} =&gt; <strong>{liveStatus?.config?.defaultLeverage}x</strong> · max {liveStatus?.config?.maxOpenPositions} positions
                    </>
                  )}
                </p>
              )}
              <div
                style={{
                  marginTop: 8,
                  marginBottom: 10,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `1px solid ${SOP.borderMuted}`,
                  background: '#0a0a0a',
                }}
              >
                <div style={{ fontSize: 10, color: SOP.textSecondary, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>
                  Realized profit (from activity)
                </div>
                {(() => {
                  const rows = Array.isArray(activity) ? activity : [];
                  const closed = rows.filter((a) => a.action === 'close_long' && a.pnl_usd != null);
                  if (closed.length === 0) {
                    return (
                      <p className="short-ops-live-meta" style={{ margin: 0 }}>
                        No closes with PnL in the current buffer ({rows.length} activity rows). Full detail in “Profit and recent long activity”.
                      </p>
                    );
                  }
                  const total = closed.reduce((sum, a) => sum + Number(a.pnl_usd || 0), 0);
                  const isProfit = total >= 0;
                  return (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 20, fontWeight: 800, color: isProfit ? '#4ade80' : '#f87171', lineHeight: 1 }}>
                        {isProfit ? '+' : ''}{total.toFixed(4)} USD
                      </span>
                      <span className="sop-probe-sub">{closed.length} close_long with PnL</span>
                    </div>
                  );
                })()}
              </div>
              <p className="short-ops-live-meta short-ops-live-meta--fine">
                Manual approval: {liveStatus?.liveRequireManualApproval ? `required ${liveStatus?.liveManualApprovalGranted ? 'and granted' : 'but missing'}` : 'off'} · Kill on venue error: {liveStatus?.liveKillOnVenueError ? 'on' : 'off'} · Kill on reconciliation mismatch: {liveStatus?.liveKillOnReconciliationMismatch ? 'on' : 'off'} · Isolated margin check: {liveStatus?.requireIsolatedMarginOnVenue ? 'on' : 'off'}
              </p>
              {liveStatus?.guardrails?.reasons?.length > 0 && (
                <p className="short-ops-live-warn">{(liveStatus?.guardrails?.reasons || []).join('; ')}</p>
              )}
              {liveStatus?.adapter != null && (
                <p className="short-ops-live-meta short-ops-live-meta--fine">
                  Venue adapter: {liveStatus?.adapter?.present ? (liveStatus?.adapter?.venueId || 'connected') : 'not available'}
                  {liveStatus?.adapter?.hasPrivateCredentials === true && ' · credentials detected'}
                </p>
              )}
              {(() => {
                const venuePriv = liveStatus?.adapter?.present === true;
                return (
                <div className="short-ops-probe">
                  <div className="short-ops-probe-row" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <label htmlFor="long-ops-probe-sym" style={{ fontSize: 12, color: SOP.textSecondary, fontWeight: 600 }}>Symbol</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: SOP.surfaceRaised, border: `1px solid ${SOP.borderMuted}`, borderRadius: 8, padding: '5px 10px', minWidth: 130 }}>
                      <CryptoLogo symbol={probeSymbol} size={20} />
                      {(() => (
                        venueProbeSymbolList.length > 0 ? (
                          <select
                            id="long-ops-probe-sym"
                            value={probeSymbol}
                            onChange={(e) => setProbeSymbol(e.target.value)}
                            style={{
                              background: 'transparent', border: 'none', outline: 'none',
                              color: '#f1f5f9', fontWeight: 700, fontSize: 14,
                              cursor: 'pointer', flex: 1,
                            }}
                          >
                            {venueProbeSymbolList.map((s) => (
                              <option key={s} value={s} style={{ background: SOP.surfaceRaised, color: '#f1f5f9' }}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            id="long-ops-probe-sym"
                            value={probeSymbol}
                            onChange={(e) => setProbeSymbol(e.target.value.toUpperCase())}
                            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#f1f5f9', fontWeight: 700, fontSize: 14, width: 80 }}
                          />
                        )
                      ))()}
                    </div>
                  </div>
                  <p className="short-ops-probe-hint">
                    {venuePriv
                      ? 'Venue probes: read-only (mark, funding, margin, position, reconcile) via the same backend as the SHORT panel.'
                      : 'Mark and funding from Binance public REST. Margin / position / reconcile appear when live-status reports a venue adapter (credentials).'}
                  </p>
                  <p className="short-ops-probe-actions">
                    <button type="button" className="short-ops-btn-tiny" onClick={async () => { const sym = probeSymbol.trim() || 'BTC'; setVenueMarkLoading(true); setVenueMark(null); try { const r = venuePriv ? await getVenueMark(sym) : await getPublicBinanceMark(sym); setVenueMark(r); } catch (e) { setVenueMark({ error: e.message }); } finally { setVenueMarkLoading(false); } }} disabled={venueMarkLoading}>
                      {venueMarkLoading ? '…' : 'Mark'}
                    </button>
                    {venueMark && (
                      venueMark.error
                        ? <span className="short-ops-text-danger">{venueMark.error}</span>
                        : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: SOP.black, border: `1px solid ${SOP.border}`, borderRadius: 8, padding: '5px 12px', marginLeft: 8 }}>
                            <CryptoLogo symbol={probeSymbol} size={18} />
                            <span style={{ fontSize: 11, color: SOP.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Mark</span>
                            <span style={{ fontSize: 17, fontWeight: 800, color: SOP.text, fontFamily: 'monospace', letterSpacing: 0.5 }}>
                              ${Number(venueMark.markPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                            </span>
                            <span style={{ fontSize: 10, color: '#475569', fontWeight: 600 }}>USD</span>
                            {venueMark.venueSymbol && (
                              <span style={{ fontSize: 10, color: SOP.textSecondary, background: SOP.surfaceRaised, border: `1px solid ${SOP.borderMuted}`, padding: '2px 7px', borderRadius: 4, marginLeft: 2, fontFamily: 'monospace', letterSpacing: 0.5 }}>{venueMark.venueSymbol}</span>
                            )}
                          </span>
                        )
                    )}
                  </p>
                  <p className="short-ops-probe-btns">
                    {(
                      (() => {
                        const s = probeSymbol.trim() || 'BTC';
                        const defs = [['Funding', () => (venuePriv ? getVenueFunding(s) : getPublicBinanceFunding(s))]];
                        if (venuePriv) {
                          defs.push(
                            ['Margin mode', () => getVenueMarginMode(s, resetUserId || walletAddress || filterUserId)],
                            ['Position', () => getVenuePosition(s, resetUserId || walletAddress || filterUserId)],
                            ['Margin acct', () => getVenueMargin(resetUserId || walletAddress || filterUserId)],
                            ['Reconcile', () => getVenueReconcile(s, null, resetUserId || walletAddress || filterUserId)],
                          );
                        }
                        return defs;
                      })()
                    ).map(([label, fn]) => (
                      <button
                        key={label}
                        type="button"
                        className="short-ops-btn-tiny"
                        disabled={probeBusy}
                        onClick={async () => {
                          setProbeBusy(true);
                          setProbeLast(null);
                          try {
                            const r = await fn();
                            setProbeLast({ label, ok: true, r });
                          } catch (e) {
                            setProbeLast({ label, ok: false, err: e.message });
                          } finally {
                            setProbeBusy(false);
                          }
                        }}
                      >
                        {probeBusy ? '…' : label}
                      </button>
                    ))}
                  </p>
                  {probeLast && (
                    <div className={`short-ops-probe-result ${probeLast.ok ? 'short-ops-probe-result--ok' : 'short-ops-probe-result--err'}`}>
                      {!probeLast.ok ? (
                        <span className="short-ops-text-danger">❌ {probeLast.label}: {probeLast.err}</span>
                      ) : probeLast.label === 'Mark' ? (
                        <div className="short-ops-probe-card">
                          <span className="sop-probe-label">Mark Price</span>
                          <span className="sop-probe-val sop-probe-val--price">${Number(probeLast.r?.markPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}</span>
                          {probeLast.r?.venueSymbol && <span className="sop-probe-sub">{probeLast.r.venueSymbol}</span>}
                        </div>
                      ) : probeLast.label === 'Funding' ? (
                        <div className="short-ops-probe-card">
                          <span className="sop-probe-label">Funding Rate</span>
                          <span className={`sop-probe-val ${Number(probeLast.r?.fundingRate) >= 0 ? 'sop-probe-val--pos' : 'sop-probe-val--neg'}`}>
                            {Number(probeLast.r?.fundingRate || 0) >= 0 ? '+' : ''}{(Number(probeLast.r?.fundingRate || 0) * 100).toFixed(4)}%
                          </span>
                          {probeLast.r?.venueSymbol && <span className="sop-probe-sub">{probeLast.r.venueSymbol} · paid every 8h</span>}
                        </div>
                      ) : probeLast.label === 'Margin mode' ? (
                        <div className="short-ops-probe-card">
                          <span className="sop-probe-label">Margin Mode</span>
                          <span className={`sop-probe-val ${String(probeLast.r?.marginMode || probeLast.r?.mode || '').toLowerCase() === 'isolated' ? 'sop-probe-val--pos' : 'sop-probe-val--warn'}`}>
                            {String(probeLast.r?.marginMode || probeLast.r?.mode || probeLast.r?.marginType || 'unknown').toUpperCase()}
                          </span>
                          {probeLast.r?.venueSymbol && <span className="sop-probe-sub">{probeLast.r.venueSymbol}</span>}
                        </div>
                      ) : probeLast.label === 'Margin acct' ? (
                        <div className="short-ops-probe-card short-ops-probe-card--wide">
                          <div className="sop-margin-row">
                            <span className="sop-probe-label">Wallet Balance</span>
                            <span className="sop-probe-val sop-probe-val--price">${Number(probeLast.r?.marginStatus?.totalWalletBalance || 0).toFixed(2)} USDC</span>
                          </div>
                          <div className="sop-margin-row">
                            <span className="sop-probe-label">Available</span>
                            <span className="sop-probe-val sop-probe-val--pos">${Number(probeLast.r?.marginStatus?.availableBalance || 0).toFixed(2)} USDC</span>
                          </div>
                          <div className="sop-margin-row">
                            <span
                              className="sop-probe-label"
                              title="Binance USD‑M account API: totalUnrealizedProfit sums all open positions, not only the dropdown symbol."
                            >
                              Unr. PnL (whole account)
                            </span>
                            <span className={`sop-probe-val ${Number(probeLast.r?.marginStatus?.totalUnrealizedProfit || 0) >= 0 ? 'sop-probe-val--pos' : 'sop-probe-val--neg'}`}>
                              ${Number(probeLast.r?.marginStatus?.totalUnrealizedProfit || 0).toFixed(4)}
                            </span>
                          </div>
                          <div className="sop-margin-row">
                            <span className="sop-probe-label">Margin Balance</span>
                            <span className="sop-probe-val">${Number(probeLast.r?.marginStatus?.totalMarginBalance || 0).toFixed(2)} USDC</span>
                          </div>
                        </div>
                      ) : probeLast.label === 'Position' ? (
                        <div className="short-ops-probe-card">
                          {probeLast.r?.position == null ? (
                            <span className="sop-probe-sub">✓ No open position on {probeSymbol}</span>
                          ) : (
                            <>
                              <div className="sop-margin-row"><span className="sop-probe-label">Side</span><span className="sop-probe-val sop-probe-val--neg">{probeLast.r.position.positionSide || probeLast.r.position.side || 'LONG'}</span></div>
                              <div className="sop-margin-row"><span className="sop-probe-label">Size</span><span className="sop-probe-val">{probeLast.r.position.positionAmt || probeLast.r.position.size}</span></div>
                              <div className="sop-margin-row"><span className="sop-probe-label">Entry Price</span><span className="sop-probe-val sop-probe-val--price">${Number(probeLast.r.position.entryPrice || 0).toFixed(4)}</span></div>
                              <div className="sop-margin-row"><span className="sop-probe-label">Unrealized PnL</span><span className={`sop-probe-val ${Number(probeLast.r.position.unrealizedProfit || 0) >= 0 ? 'sop-probe-val--pos' : 'sop-probe-val--neg'}`}>${Number(probeLast.r.position.unrealizedProfit || 0).toFixed(4)}</span></div>
                            </>
                          )}
                        </div>
                      ) : probeLast.label === 'Reconcile' ? (
                        <div className="short-ops-probe-card">
                          <span className="sop-probe-label">In Sync</span>
                          <span className={`sop-probe-val ${probeLast.r?.inSync ? 'sop-probe-val--pos' : 'sop-probe-val--warn'}`}>
                            {probeLast.r?.inSync ? '✓ DB = Binance' : '⚠ DB vs Binance mismatch'}
                          </span>
                        </div>
                      ) : (
                        <pre className="short-ops-probe-pre">{JSON.stringify(probeLast.r, null, 2)}</pre>
                      )}
                    </div>
                  )}

                  <p className="short-ops-probe-btns" style={{ marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      className="short-ops-btn-tiny short-ops-btn-tiny--accent"
                      disabled={allProbesBusy}
                      onClick={async () => {
                        setAllProbesBusy(true);
                        setAllProbesData(null);
                        const sym = probeSymbol.trim() || 'BTC';
                        const results = {};
                        const tasks = venuePriv
                          ? [
                              ['mark', () => getVenueMark(sym)],
                              ['funding', () => getVenueFunding(sym)],
                              ['marginMode', () => getVenueMarginMode(sym, resetUserId || walletAddress || filterUserId)],
                              ['margin', () => getVenueMargin(resetUserId || walletAddress || filterUserId)],
                              ['position', () => getVenuePosition(sym, resetUserId || walletAddress || filterUserId)],
                            ]
                          : [
                              ['mark', () => getPublicBinanceMark(sym)],
                              ['funding', () => getPublicBinanceFunding(sym)],
                            ];
                        await Promise.allSettled(tasks.map(async ([key, fn]) => {
                          try { results[key] = { ok: true, r: await fn() }; }
                          catch (e) { results[key] = { ok: false, err: e.message }; }
                        }));
                        setAllProbesData({
                          sym,
                          results,
                          ts: new Date().toLocaleTimeString(),
                          probeSuite: venuePriv ? 'venue' : 'public',
                        });
                        setAllProbesBusy(false);
                      }}
                    >
                      {allProbesBusy ? <><Spinner size={12} /> Checking…</> : '⚡ All Probes'}
                    </button>
                    <span className="sop-probe-sub" style={{ marginLeft: '0.5rem' }}>runs all checks at once</span>
                  </p>

                  {allProbesData && (
                    <div className="sop-all-probes-dashboard">
                      <div className="sop-all-probes-header">
                        <span>
                          📊 Binance Futures —{' '}
                          {(allProbesData.results.position?.ok && allProbesData.results.position.r?.venueSymbol)
                            || (allProbesData.results.mark?.ok && allProbesData.results.mark.r?.venueSymbol)
                            || `${allProbesData.sym} (USD-M)`}
                          {' · '}
                          <span className="sop-probe-sub" style={{ fontWeight: 700 }}>
                            {allProbesData.probeSuite === 'venue' ? 'venue (backend)' : 'public REST'}
                          </span>
                        </span>
                        <span className="sop-probe-sub">{allProbesData.ts}</span>
                      </div>
                      <div className="sop-all-probes-grid">
                        <div className="sop-probe-tile">
                          <span className="sop-probe-tile-label">Mark Price</span>
                          {allProbesData.results.mark?.ok
                            ? <span className="sop-probe-tile-val sop-probe-val--price">${Number(allProbesData.results.mark.r?.markPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 4 })}</span>
                            : <span className="sop-probe-tile-val sop-probe-val--neg">ERR</span>
                          }
                        </div>
                        <div className="sop-probe-tile">
                          <span className="sop-probe-tile-label">Funding Rate</span>
                          {allProbesData.results.funding?.ok
                            ? <span className={`sop-probe-tile-val ${Number(allProbesData.results.funding.r?.fundingRate) >= 0 ? 'sop-probe-val--pos' : 'sop-probe-val--neg'}`}>
                                {Number(allProbesData.results.funding.r?.fundingRate || 0) >= 0 ? '+' : ''}{(Number(allProbesData.results.funding.r?.fundingRate || 0) * 100).toFixed(4)}%
                              </span>
                            : <span className="sop-probe-tile-val sop-probe-val--neg">ERR</span>
                          }
                        </div>
                        {allProbesData.probeSuite === 'venue' ? (
                          <>
                            <div className="sop-probe-tile">
                              <span className="sop-probe-tile-label">Margin Mode</span>
                              {allProbesData.results.marginMode?.ok
                                ? <span className={`sop-probe-tile-val ${String(allProbesData.results.marginMode.r?.marginMode || allProbesData.results.marginMode.r?.marginType || '').toLowerCase() === 'isolated' ? 'sop-probe-val--pos' : 'sop-probe-val--warn'}`}>
                                    {String(allProbesData.results.marginMode.r?.marginMode || allProbesData.results.marginMode.r?.marginType || 'unknown').toUpperCase()}
                                  </span>
                                : <span className="sop-probe-tile-val sop-probe-val--neg">ERR</span>
                              }
                            </div>
                            <div className="sop-probe-tile">
                              <span className="sop-probe-tile-label">Wallet Balance</span>
                              {allProbesData.results.margin?.ok
                                ? <span className="sop-probe-tile-val sop-probe-val--price">${Number(allProbesData.results.margin.r?.marginStatus?.totalWalletBalance || 0).toFixed(2)}</span>
                                : <span className="sop-probe-tile-val sop-probe-val--neg">ERR</span>
                              }
                            </div>
                            <div className="sop-probe-tile">
                              <span className="sop-probe-tile-label">Available</span>
                              {allProbesData.results.margin?.ok
                                ? <span className="sop-probe-tile-val sop-probe-val--pos">${Number(allProbesData.results.margin.r?.marginStatus?.availableBalance || 0).toFixed(2)}</span>
                                : <span className="sop-probe-tile-val sop-probe-val--neg">ERR</span>
                              }
                            </div>
                            <div className="sop-probe-tile">
                              <span
                                className="sop-probe-tile-label"
                                title="Binance futures account: totalUnrealizedProfit across the whole USD‑M account (all contracts), not only the header symbol."
                              >
                                Unr. PnL (whole account)
                              </span>
                              {allProbesData.results.margin?.ok
                                ? (() => {
                                    const pnl = Number(allProbesData.results.margin.r?.marginStatus?.totalUnrealizedProfit || 0);
                                    return <span className={`sop-probe-tile-val ${pnl >= 0 ? 'sop-probe-val--pos' : 'sop-probe-val--neg'}`}>{pnl >= 0 ? '+' : ''}${pnl.toFixed(4)}</span>;
                                  })()
                                : <span className="sop-probe-tile-val sop-probe-val--neg">ERR</span>
                              }
                            </div>
                            <div className="sop-probe-tile sop-probe-tile--wide">
                              <span className="sop-probe-tile-label">
                                Exchange position (
                                {(allProbesData.results.position?.ok && allProbesData.results.position.r?.venueSymbol)
                                  || (allProbesData.results.mark?.ok && allProbesData.results.mark.r?.venueSymbol)
                                  || allProbesData.sym}
                                )
                              </span>
                              {allProbesData.results.position?.ok
                                ? (allProbesData.results.position.r?.position == null
                                    ? (
                                      <>
                                        <span className="sop-probe-tile-val sop-probe-val--pos">✓ No open position</span>
                                        {allProbesData.results.margin?.ok
                                          && Math.abs(Number(allProbesData.results.margin.r?.marginStatus?.totalUnrealizedProfit || 0)) > 1e-4
                                          ? (
                                            <span
                                              className="sop-probe-sub"
                                              style={{ display: 'block', marginTop: 6, fontSize: 10, lineHeight: 1.35, color: '#94a3b8', fontWeight: 500 }}
                                            >
                                              Account-wide PnL above includes all USD‑M contracts; you may have zero position on the header symbol while PnL comes from other pairs.
                                            </span>
                                            )
                                          : null}
                                      </>
                                      )
                                    : <span className="sop-probe-tile-val sop-probe-val--neg">
                                        {allProbesData.results.position.r.position.positionSide || 'LONG'} · {allProbesData.results.position.r.position.positionAmt} · entry ${Number(allProbesData.results.position.r.position.entryPrice || 0).toFixed(4)}
                                      </span>
                                  )
                                : <span className="sop-probe-tile-val sop-probe-val--neg">ERR: {allProbesData.results.position?.err}</span>
                              }
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
                );
              })()}
              <div
                  id="futures-ops-hold-block"
                  className="sop-hold-openai-card futures-ops-scroll-target"
                  style={{
                    marginTop: 14,
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '2px solid #f59e0b',
                    background: 'linear-gradient(180deg, #1c1917 0%, #1c1c1e 100%)',
                    boxShadow: '0 0 0 1px rgba(245,158,11,0.2)',
                  }}
                >
                  <div
                    style={{
                      marginBottom: 12,
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid rgba(245,158,11,0.45)',
                      background: 'rgba(245,158,11,0.1)',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#fbbf24', marginBottom: 6 }}>
                      ALL tokens from the LONG panel list — {blockableTokenSymbols.length} symbol(s)
                    </div>
                    <p style={{ margin: '0 0 8px', fontSize: 10, color: SOP.textSecondary, lineHeight: 1.45 }}>
                      Bulk block/unblock for the LONG gate (backend bulk). Does not depend on venue adapter. Same list as “Token block…”.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                      <button
                        type="button"
                        className="short-ops-btn-tiny"
                        disabled={holdAllTokensBusy || blockableTokenSymbols.length === 0}
                        style={{ minHeight: 36, padding: '8px 14px', fontWeight: 800, background: '#713f12', borderColor: '#a16207', color: '#fef3c7' }}
                        title="POST …/long/token-block-bulk"
                        onClick={() => handleHoldAllTokensLong()}
                      >
                        {holdAllTokensBusy ? '…' : `Hold ALL LONG (${blockableTokenSymbols.length})`}
                      </button>
                      <button
                        type="button"
                        className="short-ops-btn-tiny"
                        disabled={clearAllTokenBlocksBusy}
                        style={{ minHeight: 36, padding: '8px 14px', fontWeight: 800, background: '#14532d', borderColor: '#166534', color: '#dcfce7' }}
                        title="POST …/long/token-block-clear-all"
                        onClick={() => handleClearAllTokenBlocksLong()}
                      >
                        {clearAllTokenBlocksBusy ? '…' : 'Start ALL LONG (clear all)'}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: SOP.text }}>⏸ Hold / ▶ Start LONG — one symbol</span>
                    <span className="sop-probe-sub" style={{ fontSize: 11 }}>
                      probe symbol: <strong style={{ color: SOP.text }}>{(probeSymbol || '').trim() || '—'}</strong>
                      {liveStatus?.adapter?.present ? '' : ' (set symbol manually if there is no venue dropdown)'}
                    </span>
                  </div>
                  <p style={{ margin: '8px 0 10px', fontSize: 11, color: SOP.textSecondary, lineHeight: 1.45 }}>
                    Hold blocks new <strong style={{ color: SOP.text }}>LONG</strong> opens (LongRiskEngine) and, for the same user+symbol, the backend skips{' '}
                    <strong style={{ color: SOP.text }}>OpenAI analyses</strong> (executor + <code style={{ fontSize: 10, color: SOP.muted }}>analyzeMarket</code> / agent). Market data (without OpenAI) may still be used. Start clears the block.
                  </p>
                  <div className="sop-symbol-actions-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <button
                      type="button"
                      className="short-ops-btn-tiny sop-action-btn sop-action-btn--hold-long"
                      disabled={!(probeSymbol || '').trim() || quickHoldBusy}
                      onClick={async () => {
                        const uid = (resetUserId || walletAddress || '').trim();
                        const sym = (probeSymbol || '').trim().toUpperCase();
                        if (!uid) return;
                        if (!sym) return;
                        setQuickHoldBusy(true);
                        try {
                          await postLongTokenBlock({ userId: uid, symbol: sym, permanent: true });
                          toast.success(`Hold LONG active for ${sym} — no new LONG opens until Start`);
                          await fetchTokenBlocks({ notifyOnError: true });
                          fetchRecentLlmSignals({ forceReplace: true });
                        } catch (err) {
                          toast.error(err.message || 'Hold error');
                        } finally {
                          setQuickHoldBusy(false);
                        }
                      }}
                    >
                      {quickHoldBusy ? '…' : (
                        <>
                          <FuturesOpsHoldAiGlyph size={15} />
                          <span>Hold</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="short-ops-btn-tiny sop-action-btn sop-action-btn--start"
                      disabled={!(probeSymbol || '').trim() || clearingBlockSymbol === (probeSymbol || '').trim().toUpperCase()}
                      onClick={() => handleClearTokenBlock(probeSymbol, { confirm: true })}
                    >
                      {clearingBlockSymbol === (probeSymbol || '').trim().toUpperCase() ? '…' : (
                        <>
                          <FuturesOpsStartAiGlyph size={15} />
                          <span>Start</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="short-ops-btn-tiny sop-action-btn sop-action-btn--block"
                      onClick={() => openTokenBlockModal()}
                      title="Limited duration or full block list"
                    >
                      <FuturesOpsBlockAiGlyph size={15} />
                      <span>Block</span>
                    </button>
                    <button
                      type="button"
                      className="short-ops-btn-tiny sop-action-btn sop-allowlist-open-btn"
                      onClick={() => setAllowlistTokensModalOpen(true)}
                      title="Symbols where OpenAI analysis is enabled for the LONG lane (not on openai-suspend list). Separate from live execution allowlist."
                    >
                      <FuturesOpsAllowlistGlyph size={15} />
                      <span>OpenAI analysis</span>
                    </button>
                  </div>
                  {tokenBlocks?.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <span style={{ fontSize: 10, color: SOP.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>On hold now</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        {Array.from(
                          new Map(
                            (tokenBlocks || [])
                              .map((b) => [tokenBlockSymbol(b), b])
                              .filter(([s]) => !!s)
                          ).values()
                        ).map((b) => {
                          const sym = tokenBlockSymbol(b);
                          return (
                            <span
                              key={sym}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 8px',
                                borderRadius: 999,
                                background: SOP.black,
                                border: `1px solid ${SOP.border}`,
                                fontSize: 11,
                                fontWeight: 700,
                                color: SOP.text,
                              }}
                            >
                              <CryptoLogo symbol={sym} size={18} />
                              {sym}
                              <button
                                type="button"
                                disabled={clearingBlockSymbol === sym}
                                onClick={() => handleClearTokenBlock(sym, { confirm: true })}
                                style={{
                                  fontSize: 10,
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  background: '#14532d',
                                  color: '#bbf7d0',
                                  border: '1px solid #166534',
                                  cursor: clearingBlockSymbol === sym ? 'wait' : 'pointer',
                                  fontWeight: 700,
                                }}
                              >
                                Start
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
            </div>
          </div>
        </div>

      <div id="futures-ops-open-positions" className="short-ops-section futures-ops-scroll-target">
        <div className="short-ops-section-head">
          <div>
            <div className="short-ops-section-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <TrendingUp size={16} style={{ color: '#f87171' }} />
              Open long positions
              {positions.length > 0 && (
                <span style={{ background: '#7f1d1d', color: '#fca5a5', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>
                  {positions.length} active
                </span>
              )}
            </div>
            <div className="short-ops-section-subtitle" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span>Long positions opened by backend. Auto-refresh every 30s.</span>
              <LongOpenPositionsRefreshTicker resetEpoch={openPositionsRefreshEpoch} />
            </div>
          </div>
          <div className="short-ops-filter">
            <label className="short-ops-filter-label" htmlFor="short-ops-filter-user">User filter</label>
            <input
              id="short-ops-filter-user"
              type="text"
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
              placeholder="0x..."
              className="short-ops-filter-input"
            />
          </div>
        </div>

        {error && <p className="short-ops-error">{error}</p>}

        {positions.length > 0 && (
          <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
            <div style={{ background: SOP.surfaceRaised, borderRadius: 8, padding: '8px 16px', borderLeft: '3px solid #f87171' }}>
              <div style={{ fontSize: 10, color: SOP.textSecondary, marginBottom: 2 }}>ACTIVE POSITIONS</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#f87171' }}>{positions.length}</div>
            </div>
            <div style={{ background: SOP.surfaceRaised, borderRadius: 8, padding: '8px 16px', borderLeft: '3px solid #fb923c' }}>
              <div style={{ fontSize: 10, color: SOP.textSecondary, marginBottom: 2 }}>NOTIONAL TOTAL</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fb923c' }}>
                ${positions.reduce((s, p) => s + (Number(p.notional_usd) || 0), 0).toFixed(2)}
              </div>
            </div>
            {(() => {
              // v2: citeste safeToExecuteLive din gate (structura corecta API)
              const isLive = liveStatus?.gate?.safeToExecuteLive === true;
              const borderColor = isLive ? '#4ade80' : '#facc15';
              const textColor = isLive ? '#4ade80' : '#facc15';
              const modeLabel = liveStatus == null
                ? '…'
                : isLive
                  ? '⚡ LIVE BINANCE'
                  : '⚠ LIVE (gate blocked)';
              return (
                <div style={{ background: SOP.surfaceRaised, borderRadius: 8, padding: '8px 16px', borderLeft: `3px solid ${borderColor}` }}>
                  <div style={{ fontSize: 10, color: SOP.textSecondary, marginBottom: 2 }}>EXECUTION MODE</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3, color: textColor }}>
                    {modeLabel}
                  </div>
                </div>
              );
            })()}
            {/* Card funding cost/zi */}
            {(() => {
              const totalFundingPerDay = positions.reduce((sum, p) => {
                const rate = fundingRates[p.symbol];
                if (rate == null) return sum;
                return sum + (Number(p.notional_usd) || 0) * rate * 3;
              }, 0);
              const hasRates = positions.some(p => fundingRates[p.symbol] != null);
              if (!hasRates) return null;
              /** Aliniat cu rândul tabel: sumă notional×rate×3 — pozitiv = long plătește (roșu), negativ = long primește (verde). */
              const isIncome = totalFundingPerDay < 0;
              const isLoss = totalFundingPerDay > 0;
              return (
                <div style={{ background: SOP.surfaceRaised, borderRadius: 8, padding: '8px 16px', borderLeft: `3px solid ${isIncome ? '#4ade80' : isLoss ? '#f87171' : '#94a3b8'}` }}
                  title="Binance USDM: positive funding rate → longs pay (red when $/day &gt; 0); negative rate → longs receive (green). notional × rate × 3 per 24h.">
                  <div style={{ fontSize: 10, color: SOP.textSecondary, marginBottom: 2 }}>FUNDING/DAY 💸</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: isIncome ? '#4ade80' : isLoss ? '#f87171' : '#94a3b8' }}>
                    {isIncome ? '+' : ''}{Math.abs(totalFundingPerDay).toFixed(4)}$
                  </div>
                  <div style={{ fontSize: 9, color: '#475569', marginTop: 2 }}>
                    {isIncome ? 'long receives' : isLoss ? 'long pays' : 'flat'} · 3×8h
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        <div className="short-ops-table-wrap" style={{ overflowX: 'auto' }}>
          <table className="short-ops-table" style={{ minWidth: 900 }}>
            <thead>
              <tr style={{ background: SOP.black }}>
                <th className="short-ops-th short-ops-th--left">User</th>
                <th className="short-ops-th short-ops-th--left">Token</th>
                <th className="short-ops-th short-ops-th--right">Notional $</th>
                <th className="short-ops-th short-ops-th--right">Leverage</th>
                <th className="short-ops-th short-ops-th--right">Entry</th>
                <th className="short-ops-th short-ops-th--right" style={{ color: '#4ade80' }}>TP 🎯</th>
                <th className="short-ops-th short-ops-th--right" style={{ color: '#f87171' }}>SL 🛑</th>
                <th className="short-ops-th short-ops-th--right">Liq. price</th>
                <th
                  className="short-ops-th short-ops-th--right"
                  style={{ color: '#facc15' }}
                  title="Unrealized PnL in USD (in cell): notional × mark price delta vs entry. Below: % vs entry and ROE on margin — not the “24h” move from the OI strip."
                >
                  Unrealized PnL 💰
                </th>
                <th
                  className="short-ops-th short-ops-th--right"
                  title="Binance MARK price (same feed as PnL). Not the ticker “last trade”; may differ from the OI strip on the right."
                >
                  Mark price
                </th>
                <th
                  className="short-ops-th short-ops-th--left"
                  title="Market context: 15m klines, OI, 24h ticker and LAST — does not define row PnL; PnL uses mark (left column). “24h ±%” is 24h contract move, not your PnL vs entry."
                >
                  Market / OI
                </th>
                <th className="short-ops-th short-ops-th--right">Conf.</th>
                <th className="short-ops-th short-ops-th--left">BTC bias</th>
                <th className="short-ops-th short-ops-th--right" style={{ color: '#facc15' }} title="Trailing stop: active after 3% profit. Closes at +1.5% callback. Max 10%.">Trailing 📈</th>
                <th className="short-ops-th short-ops-th--right" style={{ color: '#fb923c' }} title="Funding rate × notional × 3 payments/day (8h interval)">Funding/day 💸</th>
                <th className="short-ops-th short-ops-th--left">Duration</th>
                <th className="short-ops-th short-ops-th--left">LLM signal</th>
                <th className="short-ops-th short-ops-th--left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && positions.length === 0 ? (
                <tr><td colSpan={18} className="short-ops-td short-ops-td--pad">Loading…</td></tr>
              ) : positions.length === 0 ? (
                <tr>
                  <td colSpan={18} className="short-ops-td short-ops-td--pad short-ops-td--muted" style={{ textAlign: 'center', padding: '24px 0' }}>
                    <TrendingUp size={24} style={{ color: SOP.borderMuted, marginBottom: 6, display: 'block', margin: '0 auto 6px' }} />
                    No active long positions right now.
                  </td>
                </tr>
              ) : (
                positions.map((p) => {
                  const uid = String(p.user_id || '').trim().toLowerCase();
                  const sym = String(p.symbol || '').trim().toUpperCase();
                  const suspended = openAiSuspendByUser[uid]?.has(sym) ?? false;
                  return (
                    <PositionRow
                      key={`${p.user_id}-${p.symbol}-${p.id}`}
                      p={p}
                      fundingRate={fundingRates[p.symbol]}
                      fundingAcc={fundingAccByPositionId[p.id]}
                      onClose={fetchPositions}
                      walletAddress={walletAddress}
                      openAiSuspended={suspended}
                      policyOpenMinConfidence={
                        liveStatus?.longConfidenceLeveragePolicy?.openMinConfidence
                        ?? liveStatus?.config?.longMinConfidence
                      }
                      onLlmSuspendChanged={() => {
                        fetchPositions();
                        fetchRecentLlmSignals({ forceReplace: true });
                      }}
                      onLossGuardChanged={fetchPositions}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 10, padding: '8px 12px', background: SOP.black, borderRadius: 6, fontSize: 11, color: SOP.muted }}>
          💡 <strong style={{ color: '#64748b' }}>How it works:</strong> For live LONG, <code style={{ color: '#f87171' }}>buy</code> / <code style={{ color: '#f87171' }}>open_long</code> with confidence ≥ the server LONG threshold can be promoted to <code style={{ color: '#f87171' }}>open_long_futures</code> — there is <strong>no</strong> “bearish trend” requirement on this branch (the old wording was wrong and mixed with SHORT). Promotion from <code style={{ color: '#f87171' }}>hold</code> to opening LONG needs trend/returns and BTC context aligned bullish.
          TP/SL are monitored each cycle — on hit, the position closes automatically. PnL column: estimated profit/loss in USD above; below, % vs entry and ROE on margin. The “24h ±%” strip is Binance market movement, not your position PnL.
        </div>
      </div>

      {/* Recent long activity */}
      <div className="short-ops-section">
        <div className="short-ops-section-head">
          <div style={{ flex: 1 }}>
            <div className="short-ops-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={15} style={{ color: SOP.textSecondary }} />
              Long profit and recent activity
            </div>
            <div className="short-ops-section-subtitle">LONG stats from DB + latest 20 open/close executions. Auto-refresh 30s.</div>
          </div>
        </div>

        <div
          style={{
            background: '#000000',
            color: '#fafafa',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            maxWidth: 960,
            margin: '0 auto 16px',
            padding: 12,
            border: '1px solid #262626',
            borderRadius: 8,
            boxSizing: 'border-box',
          }}
        >
          {/* Profit section above Win Rate for parity with SHORT visibility. */}
          {(() => {
            const closed = activity.filter((a) => a.action === 'close_long' && a.pnl_usd != null);
            const totalPnl = closed.length
              ? closed.reduce((sum, a) => sum + Number(a.pnl_usd || 0), 0)
              : 0;

            const TotalCard = ({ title, subtitle, total, count, accent, textColor, emptyHint }) => {
              const isEmpty = count === 0;
              const isProfit = !isEmpty && total >= 0;
              return (
                <div style={{
                  background: isEmpty ? '#171717' : (isProfit ? '#052e16' : '#450a0a'),
                  border: `2px solid ${isEmpty ? '#404040' : (isProfit ? accent : '#dc2626')}`,
                  borderRadius: 10,
                  padding: '10px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: 170,
                }}>
                  <div style={{ fontSize: 10, color: SOP.textSecondary, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>
                    {title}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: isEmpty ? '#737373' : (isProfit ? textColor : '#f87171'), lineHeight: 1 }}>
                    {isEmpty ? '—' : `${isProfit ? '+' : ''}${total.toFixed(4)}$`}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, textAlign: 'center' }}>
                    {isEmpty ? (emptyHint || subtitle) : subtitle}
                  </div>
                  {!isEmpty && (
                    <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
                      {count} close {count === 1 ? 'row' : 'rows'}
                    </div>
                  )}
                </div>
              );
            };

            return (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  <span style={{ fontSize: 16 }}>💰</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#fde047', letterSpacing: 0.5, textTransform: 'uppercase' }}>Profit</span>
                  <span style={{ fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Realized (long closes)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'stretch', gap: 10, flexWrap: 'wrap', width: '100%' }}>
                  <TotalCard
                    title="Realized profit"
                    subtitle="Long closes (PnL sum from activity)"
                    total={totalPnl}
                    count={closed.length}
                    accent="#16a34a"
                    textColor="#4ade80"
                    emptyHint="No close with PnL in the current activity buffer; check the table and confirm backend maps long-activity (action + pnl_usd)."
                  />
                </div>
              </div>
            );
          })()}

          {/* ═══ WIN RATE REAL (DB) ═══ */}
          {(() => {
            const g = winRateStats?.global;
            const byToken = winRateStats?.byToken || [];
            const byConf = winRateStats?.byConfidence || [];
            const totalClosed = g?.totalClosed || 0;

            return (
              <div style={{ background: '#0a0a0a', border: '1px solid #262626', borderRadius: 8, padding: '12px 14px', marginBottom: 10 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14 }}>🎯</span>
                    <span style={{ fontWeight: 800, fontSize: 13, color: '#e2e8f0' }}>Win Rate Real</span>
                    <span style={{ fontSize: 9, color: '#64748b', background: SOP.surfaceRaised, padding: '2px 7px', borderRadius: 10 }}>from DB</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Selector zile */}
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1, 7, 30].map(d => (
                        <button key={d} onClick={() => setWinRateDays(d)} style={{ padding: '2px 8px', fontSize: 9, fontWeight: winRateDays === d ? 800 : 400, background: winRateDays === d ? SOP.surfaceInput : SOP.surfaceRaised, color: winRateDays === d ? SOP.text : SOP.muted, border: `1px solid ${winRateDays === d ? SOP.border : SOP.borderMuted}`, borderRadius: 5, cursor: 'pointer' }}>
                          {d}z
                        </button>
                      ))}
                    </div>
                    <button onClick={fetchWinRateStats} disabled={winRateLoading} style={{ padding: '2px 8px', fontSize: 9, background: SOP.surfaceRaised, color: SOP.textSecondary, border: 'none', borderRadius: 5, cursor: 'pointer' }}>
                      {winRateLoading ? '…' : '↻'}
                    </button>
                  </div>
                </div>

                {totalClosed === 0 ? (
                  <div style={{ color: '#475569', fontSize: 11, textAlign: 'center', padding: '8px 0' }}>
                    {winRateLoading ? 'Loading…' : `No closed positions in the last ${winRateDays} day(s).`}
                  </div>
                ) : (
                  <>
                    {/* Carduri globale */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
                      {[
                        {
                          label: 'Win Rate',
                          value: g?.winRatePct != null ? `${g.winRatePct}%` : '—',
                          sub: `${g?.totalWins}W / ${g?.totalLosses}L`,
                          color: g?.winRatePct >= 50 ? '#4ade80' : '#f87171',
                          bg: g?.winRatePct >= 50 ? '#052e16' : '#1c0a0a',
                        },
                        {
                          label: 'PnL Total',
                          value: g?.totalPnlUsd != null ? `${g.totalPnlUsd >= 0 ? '+' : ''}${Number(g.totalPnlUsd).toFixed(2)}$` : '—',
                          sub: `${totalClosed} trades`,
                          color: g?.totalPnlUsd >= 0 ? '#4ade80' : '#f87171',
                          bg: g?.totalPnlUsd >= 0 ? '#052e16' : '#1c0a0a',
                        },
                        {
                          label: 'Best Trade',
                          value: g?.bestTradeUsd != null ? `+${Number(g.bestTradeUsd).toFixed(2)}$` : '—',
                          sub: 'max win',
                          color: '#4ade80',
                          bg: '#052e16',
                        },
                        {
                          label: 'Worst Trade',
                          value: g?.worstTradeUsd != null ? `${Number(g.worstTradeUsd).toFixed(2)}$` : '—',
                          sub: 'maxim pierdere',
                          color: '#f87171',
                          bg: '#1c0a0a',
                        },
                      ].map(({ label, value, sub, color, bg }) => (
                        <div key={label} style={{ background: bg, border: `1px solid ${color}33`, borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                          <div style={{ fontSize: 8, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                          <div style={{ fontSize: 8, color: '#475569', marginTop: 3 }}>{sub}</div>
                        </div>
                      ))}
                    </div>

                    {/* Confidence insight */}
                    {(g?.avgConfidenceWins != null || g?.avgConfidenceLosses != null) && (
                      <div style={{ background: '#0d1117', borderRadius: 7, padding: '7px 10px', marginBottom: 10, fontSize: 10, color: SOP.textSecondary, display: 'flex', gap: 16, alignItems: 'center' }}>
                        <span>🧠 Avg conf. (wins): <strong style={{ color: '#4ade80' }}>{g.avgConfidenceWins != null ? `${Math.round(g.avgConfidenceWins * 100)}%` : '—'}</strong></span>
                        <span>Avg conf. (losses): <strong style={{ color: '#f87171' }}>{g.avgConfidenceLosses != null ? `${Math.round(g.avgConfidenceLosses * 100)}%` : '—'}</strong></span>
                        <span style={{ fontSize: 9, color: '#475569' }}>Confidence is not a guaranteed prediction</span>
                      </div>
                    )}

                    {/* Grid: Per token + Per confidence */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {/* Per token */}
                      {byToken.length > 0 && (
                        <div>
                          <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Win Rate per Token</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {byToken.map(t => (
                              <div key={t.symbol} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', borderBottom: `1px solid ${SOP.borderMuted}` }}>
                                <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 11, minWidth: 40 }}>{t.symbol}</span>
                                {/* Bar vizuală */}
                                <div style={{ flex: 1, background: SOP.surfaceRaised, borderRadius: 4, height: 6, overflow: 'hidden' }}>
                                  <div style={{ width: `${t.winRatePct || 0}%`, height: '100%', background: t.winRatePct >= 50 ? '#4ade80' : '#f87171', borderRadius: 4, transition: 'width 0.4s ease' }} />
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 700, color: t.winRatePct >= 50 ? '#4ade80' : '#f87171', minWidth: 34, textAlign: 'right' }}>
                                  {t.winRatePct != null ? `${t.winRatePct}%` : '—'}
                                </span>
                                <span style={{ fontSize: 9, color: '#475569', minWidth: 50, textAlign: 'right' }}>
                                  {t.wins}W/{t.losses}L
                                </span>
                                <span style={{ fontSize: 9, color: t.totalPnlUsd >= 0 ? '#4ade80' : '#f87171', minWidth: 52, textAlign: 'right' }}>
                                  {t.totalPnlUsd != null ? `${t.totalPnlUsd >= 0 ? '+' : ''}${Number(t.totalPnlUsd).toFixed(2)}$` : '—'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Per confidence bucket */}
                      {byConf.length > 0 && (
                        <div>
                          <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Win Rate per Confidence</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {byConf.map(c => (
                              <div key={c.bucket} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', borderBottom: `1px solid ${SOP.borderMuted}` }}>
                                <span style={{ fontSize: 10, color: '#a78bfa', fontWeight: 700, minWidth: 56 }}>{c.bucket}</span>
                                <div style={{ flex: 1, background: SOP.surfaceRaised, borderRadius: 4, height: 6, overflow: 'hidden' }}>
                                  <div style={{ width: `${c.winRatePct || 0}%`, height: '100%', background: c.winRatePct >= 50 ? '#4ade80' : '#f87171', borderRadius: 4, transition: 'width 0.4s ease' }} />
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 700, color: c.winRatePct >= 50 ? '#4ade80' : '#f87171', minWidth: 34, textAlign: 'right' }}>
                                  {c.winRatePct != null ? `${c.winRatePct}%` : '—'}
                                </span>
                                <span style={{ fontSize: 9, color: '#475569', minWidth: 40, textAlign: 'right' }}>
                                  {c.total} trade{c.total !== 1 ? 's' : ''}
                                </span>
                                <span style={{ fontSize: 9, color: c.avgPnlUsd >= 0 ? '#4ade80' : '#f87171', minWidth: 52, textAlign: 'right' }}>
                                  avg {c.avgPnlUsd != null ? `${c.avgPnlUsd >= 0 ? '+' : ''}${Number(c.avgPnlUsd).toFixed(2)}$` : '—'}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div style={{ fontSize: 8, color: SOP.borderMuted, marginTop: 6 }}>
                            * Confidence LLM ≠ win rate garantat. Date reale din DB.
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })()}

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 14, marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#737373', letterSpacing: 0.8, textTransform: 'uppercase' }}>Zi</span>
          <button
            type="button"
            onClick={() => setActivityDayFilter('__ALL__')}
            style={{
              padding: '5px 12px',
              fontSize: 11,
              fontWeight: activityDayFilter === '__ALL__' ? 800 : 500,
              background: activityDayFilter === '__ALL__' ? '#171717' : '#000',
              color: activityDayFilter === '__ALL__' ? '#fff' : '#a3a3a3',
              border: activityDayFilter === '__ALL__' ? '1px solid #a3a3a3' : '1px solid #404040',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Toate
          </button>
          {activityDayKeys.map((dk) => (
            <button
              key={dk}
              type="button"
              onClick={() => setActivityDayFilter(dk)}
              style={{
                padding: '5px 12px',
                fontSize: 11,
                fontWeight: activityDayFilter === dk ? 800 : 500,
                background: activityDayFilter === dk ? '#171717' : '#000',
                color: activityDayFilter === dk ? '#fff' : '#a3a3a3',
                border: activityDayFilter === dk ? '1px solid #a3a3a3' : '1px solid #404040',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              {dk === new Date().toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: '2-digit' }) ? 'Azi (' + dk + ')' : dk}
            </button>
          ))}
          <span style={{ flex: '1 1 12px', minWidth: 0 }} />
          <button
            type="button"
            className="short-ops-btn-tiny"
            onClick={fetchActivity}
            disabled={activityLoading}
            style={{ fontWeight: 700 }}
          >
            {activityLoading ? '…' : 'Refresh activitate'}
          </button>
        </div>

        <div style={{ overflowX: 'auto', border: '1px solid #262626', borderRadius: 6, background: '#000' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 72 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 88 }} />
              <col style={{ width: 86 }} />
              <col style={{ width: 86 }} />
              <col style={{ width: 86 }} />
              <col style={{ width: 96 }} />
              <col style={{ width: 52 }} />
            </colgroup>
            <thead>
              <tr style={{ background: '#0a0a0a', borderBottom: '1px solid #404040' }}>
                {['Token', 'Action', 'Notional $', 'Entry', 'Exit', 'PnL $', 'Reason', activityDayFilter === '__ALL__' ? 'Day · time' : 'Time'].map((h, i) => (
                  <th key={`${h}-${i}`} style={{
                    padding: '6px 8px',
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#a3a3a3',
                    textAlign: i >= 3 && i <= 5 ? 'right' : 'left',
                    letterSpacing: 0.6,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activityLoading && activity.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '16px', color: '#737373', textAlign: 'center', fontSize: 13 }}>Loading…</td></tr>
              ) : activity.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '16px', color: '#737373', textAlign: 'center', fontSize: 13 }}>No activity.</td></tr>
              ) : activityFiltered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '16px', color: '#737373', textAlign: 'center', fontSize: 13 }}>No rows for the selected day.</td></tr>
              ) : (() => {
                const visible = showAllActivityDays ? activityFiltered : activityFiltered.slice(0, 80);
                return visible.map((a) => {
                  const dateObj = a.created_at ? new Date(a.created_at) : null;
                  const isOpen = a.action === 'open_long';
                  const pnl = a.pnl_usd;
                  const pnlColor = pnl == null ? '#737373' : pnl > 0 ? '#4ade80' : '#f87171';
                  const closeReason = a.forced_close_reason || (a.is_liquidation ? 'liq' : null);
                  const reasonLabel = closeReason === 'tp_hit_auto' ? '🎯 TP' : closeReason === 'sl_hit_auto' ? '🛑 SL' : closeReason === 'llm_close_long' ? '🤖 LLM' : closeReason === 'manual_close_ops' ? '✋ Manual' : (closeReason || null);
                  const reasonBg = closeReason?.includes('tp') ? '#14532d' : closeReason?.includes('sl') ? '#7f1d1d' : '#171717';
                  const reasonClr = closeReason?.includes('tp') ? '#4ade80' : closeReason?.includes('sl') ? '#f87171' : '#d4d4d4';
                  const timeCell = dateObj
                    ? (activityDayFilter === '__ALL__'
                      ? `${dateObj.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit' })} ${dateObj.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}`
                      : dateObj.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }))
                    : '—';
                  return (
                    <tr key={a.id} style={{ borderBottom: '1px solid #262626', background: isOpen ? 'rgba(251,146,60,0.06)' : '#000' }}>
                      <td style={{ padding: '5px 8px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#fafafa', fontSize: 12 }}>
                          <CryptoLogo symbol={a.token} size={15} />
                          {a.token}
                        </span>
                      </td>
                      <td style={{ padding: '5px 8px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 11, fontWeight: 800,
                          color: isOpen ? '#fdba74' : '#d1d1d6',
                          background: isOpen ? 'rgba(251,146,60,0.2)' : 'rgba(255,255,255,0.08)',
                          padding: '2px 6px', borderRadius: 5,
                        }}>
                          {isOpen ? '▶ OPEN' : '■ CLOSE'}
                        </span>
                      </td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontSize: 12, fontFamily: 'ui-monospace, monospace', color: '#fef3c7', fontWeight: 700 }} title="Notional USD (API long-activity: amount_in / join long_positions)">
                        {a.notional_usd != null && Number.isFinite(Number(a.notional_usd)) && Number(a.notional_usd) > 0
                          ? `$${Number(a.notional_usd).toFixed(2)}`
                          : <span style={{ color: '#525252' }}>—</span>}
                      </td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontSize: 12, fontFamily: 'ui-monospace, monospace', color: '#e5e5e5', fontWeight: 600 }}>
                        {a.entry_price != null ? fmtPrice(a.entry_price) : <span style={{ color: '#525252' }}>—</span>}
                      </td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontSize: 12, fontFamily: 'ui-monospace, monospace', color: '#e5e5e5', fontWeight: 600 }}>
                        {a.exit_price != null ? fmtPrice(a.exit_price) : <span style={{ color: '#525252' }}>—</span>}
                      </td>
                      <td style={{ padding: '5px 8px', textAlign: 'right' }}>
                        {pnl != null
                          ? <span style={{ fontSize: 12, fontWeight: 800, color: pnlColor }}>{pnl > 0 ? '+' : ''}{pnl.toFixed(3)}$</span>
                          : <span style={{ color: '#525252' }}>—</span>}
                      </td>
                      <td style={{ padding: '5px 8px' }}>
                        {reasonLabel
                          ? <span style={{ fontSize: 10, fontWeight: 700, background: reasonBg, color: reasonClr, padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>{reasonLabel}</span>
                          : <span style={{ color: '#525252' }}>—</span>}
                      </td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontSize: 11, color: '#a3a3a3', fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}>
                        {timeCell}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
        {activityFiltered.length > 80 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
            <button type="button" className="short-ops-btn-tiny" onClick={() => setShowAllActivityDays(v => !v)}>
              {showAllActivityDays ? 'Show first 80' : `Show all (${activityFiltered.length})`}
            </button>
          </div>
        )}
        </div>
      </div>

      <div id="futures-ops-manual-actions" className="short-ops-section futures-ops-scroll-target">
        <div className="short-ops-section-head">
          <div>
            <div className="short-ops-section-title">Manual actions</div>
            <div className="short-ops-section-subtitle">Operator controls for manual close and kill reset.</div>
          </div>
        </div>

        {walletAddress && (
          <div style={{ margin: '0 0 14px', padding: '10px 14px', background: SOP.surface, border: `1px solid ${SOP.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: SOP.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Your User ID</span>
            <code style={{ fontSize: 12, color: SOP.textSecondary, fontFamily: 'monospace', wordBreak: 'break-all', flex: 1 }}>{walletAddress}</code>
            <button
              type="button"
              onClick={() => { setManualUserId(walletAddress); setResetUserId(walletAddress); setRejectionsUserId(walletAddress); setKillStatusUserId(walletAddress); setFilterUserId(walletAddress); toast.info('User ID filled in all fields'); }}
              style={{ fontSize: 11, padding: '4px 10px', background: SOP.surfaceRaised, color: SOP.text, border: `1px solid ${SOP.border}`, borderRadius: 5, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600 }}
            >
              Fill all fields
            </button>
          </div>
        )}

        <div className="short-ops-actions">
          <div className="short-ops-form" style={{ borderLeft: `3px solid ${SOP.border}` }}>
            <div className="short-ops-form-title"><Shield size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Kill switch manual</div>
            <p style={{ fontSize: 11, color: SOP.muted, margin: '4px 0 8px' }}>
              <strong style={{ color: SOP.textSecondary }}>Lock</strong> - block or unblock LONG for your wallet.
            </p>
            <div className="short-ops-form-field">
              <input type="text" value={resetUserId} onChange={(e) => setResetUserId(e.target.value)} placeholder="User ID (wallet)" />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={openUnblockModal}
                disabled={resetSubmitting || unblockModalBusy}
                style={{ flex: 1, background: SOP.black, color: SOP.text, border: `2px solid ${SOP.border}`, borderRadius: 8, padding: '10px 14px', cursor: resetSubmitting || unblockModalBusy ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: 13, letterSpacing: 0.3 }}
              >
                🔓 Unblock LONG
              </button>
              <button
                type="button"
                onClick={openTokenBlockModal}
                disabled={tokenBlockSubmitting}
                style={{ flex: 1, background: SOP.surfaceRaised, color: SOP.text, border: `2px solid ${SOP.border}`, borderRadius: 8, padding: '10px 14px', cursor: tokenBlockSubmitting ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: 13, letterSpacing: 0.3 }}
              >
                🔒 Block LONG (per token)
              </button>
            </div>
            <button
              type="button"
              onClick={handleActivateKill}
              disabled={activateKillSubmitting}
              style={{ marginTop: 8, width: '100%', background: SOP.surfaceInput, color: SOP.textSecondary, border: `1px solid ${SOP.borderMuted}`, borderRadius: 6, padding: '6px 10px', cursor: activateKillSubmitting ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 11 }}
              title="Optional: block ALL new LONGs for this wallet (global kill), not just one token"
            >
              {activateKillSubmitting ? '…' : 'Global lock (whole wallet) — confirm'}
            </button>
          </div>

          <div className="short-ops-form" style={{ borderLeft: `3px solid ${SOP.borderMuted}` }}>
            <div className="short-ops-form-title" style={{ color: SOP.text }}>
              🔧 Backfill metadata for older positions
            </div>
            <p style={{ fontSize: 11, color: SOP.muted, margin: '4px 0 10px' }}>
              Overwrites <strong style={{ color: SOP.textSecondary }}>TP, SL, Conf., BTC bias</strong> for all open positions.
            </p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
              <div style={{ background: SOP.surfaceRaised, border: `1px solid ${SOP.border}`, borderRadius: 6, padding: '5px 12px', fontSize: 13, fontWeight: 700, color: SOP.text, letterSpacing: 1 }}>
                TP = <span style={{ fontSize: 16 }}>−3%</span>
              </div>
              <div style={{ background: SOP.surfaceRaised, border: `1px solid ${SOP.border}`, borderRadius: 6, padding: '5px 12px', fontSize: 13, fontWeight: 700, color: SOP.textSecondary, letterSpacing: 1 }}>
                SL = <span style={{ fontSize: 16 }}>+8%</span>
              </div>
              <div style={{ background: SOP.surfaceRaised, border: `1px solid ${SOP.borderMuted}`, borderRadius: 6, padding: '5px 12px', fontSize: 11, color: SOP.textSecondary }}>
                Conf = 60% · BTC bias = bearish
              </div>
            </div>
            <button
              type="button"
              onClick={handleBackfillMetadata}
              disabled={backfillBusy}
              style={{ background: SOP.surfaceRaised, color: SOP.text, border: `1px solid ${SOP.border}`, borderRadius: 6, padding: '6px 14px', cursor: backfillBusy ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 12 }}
            >
              {backfillBusy ? <><Spinner size={12} /> Updating…</> : '🔧 Apply TP −3% / SL +8% to all positions'}
            </button>
            {backfillResult && (
              <p style={{ marginTop: 8, fontSize: 11, color: backfillResult.startsWith('✅') ? SOP.text : SOP.textSecondary }}>
                {backfillResult}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="short-ops-section short-ops-footer">
        <div className="short-ops-footer-hint">Diagnostics and operator signals from the long-ops backend.</div>
        <div className="short-ops-footer-row">
          <span className="short-ops-footer-title"><Clock size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Executor final decisions</span>
          <input
            type="text"
            value={executorDecisionUserId}
            onChange={(e) => setExecutorDecisionUserId(e.target.value)}
            placeholder="User ID (empty = connected wallet)"
            className="short-ops-footer-input short-ops-footer-input--md"
          />
          <button type="button" onClick={fetchExecutorDecisionLog} disabled={executorDecisionsLoading}>Refresh</button>
        </div>
        <div
          className="short-ops-table-wrap"
          style={
            executorDiagnosticsExpanded && executorDecisionsSorted.length > OPS_DIAG_PREVIEW_LIMIT
              ? { maxHeight: 'min(480px, 70vh)', overflowY: 'auto' }
              : undefined
          }
        >
          <table className="short-ops-table">
            <thead>
              <tr>
                <th className="short-ops-th short-ops-th--left">User</th>
                <th className="short-ops-th short-ops-th--left">Service</th>
                <th className="short-ops-th short-ops-th--left">Token</th>
                <th className="short-ops-th short-ops-th--left">Path</th>
                <th className="short-ops-th short-ops-th--left">Action</th>
                <th className="short-ops-th short-ops-th--left">Reason</th>
                <th className="short-ops-th short-ops-th--left">Created</th>
              </tr>
            </thead>
            <tbody>
              {executorDecisionsLoading && executorDecisions.length === 0 ? (
                <tr><td colSpan={7} className="short-ops-td short-ops-td--pad">Loading…</td></tr>
              ) : executorDecisions.length === 0 ? (
                <tr><td colSpan={7} className="short-ops-td short-ops-td--pad short-ops-td--muted">No executor decisions</td></tr>
              ) : (
                executorDecisionsDisplayRows.map((d) => (
                  <tr key={d.id || d.decision_uuid}>
                    <td className="short-ops-td short-ops-td--clip-sm" title={d.user_id}>{String(d.user_id).slice(0, 8)}…</td>
                    <td className="short-ops-td">
                      <OtaFuturesLaneTableBadge lane="long" />
                    </td>
                    <td className="short-ops-td">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <CryptoLogo symbol={d.token} size={15} />
                        {d.token || '—'}
                      </span>
                    </td>
                    <td className="short-ops-td">{d.path || '—'}</td>
                    <td className="short-ops-td">{d.final_action || '—'}</td>
                    <td className="short-ops-td short-ops-td--clip-lg" title={d.final_reason}>
                      {d.final_reason || '—'}
                      {d.classification ? ` · ${d.classification}` : ''}
                    </td>
                    <td className="short-ops-td short-ops-td--fine">{d.created_at ? new Date(d.created_at).toISOString().replace('T', ' ').slice(0, 19) : '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {executorDecisionsSorted.length > OPS_DIAG_PREVIEW_LIMIT && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              flexWrap: 'wrap',
              marginTop: 8,
              marginBottom: 4,
              fontSize: 11,
              color: SOP.muted,
            }}
          >
            <span>
              {executorDiagnosticsExpanded
                ? `Showing all ${executorDecisionsSorted.length} rows (newest first)`
                : `Showing latest ${OPS_DIAG_PREVIEW_LIMIT} of ${executorDecisionsSorted.length}`}
            </span>
            <button
              type="button"
              onClick={() => setExecutorDiagnosticsExpanded((v) => !v)}
              style={{
                fontSize: 11,
                padding: '5px 12px',
                background: SOP.surfaceRaised,
                color: SOP.text,
                border: `1px solid ${SOP.border}`,
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              {executorDiagnosticsExpanded ? 'Compact view' : 'History'}
            </button>
          </div>
        )}
        <div className="short-ops-footer-row">
          <span className="short-ops-footer-title"><AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Long rejections</span>
          <input type="text" value={rejectionsUserId} onChange={(e) => setRejectionsUserId(e.target.value)} placeholder="User ID (optional)" className="short-ops-footer-input short-ops-footer-input--sm" />
          <button type="button" onClick={fetchRejections} disabled={rejectionsLoading}>Refresh</button>
        </div>
        <div
          className="short-ops-table-wrap"
          style={
            rejectionsDiagnosticsExpanded && rejectionsSorted.length > OPS_DIAG_PREVIEW_LIMIT
              ? { maxHeight: 'min(480px, 70vh)', overflowY: 'auto' }
              : undefined
          }
        >
          <table className="short-ops-table">
            <thead>
              <tr>
                <th className="short-ops-th short-ops-th--left">User</th>
                <th className="short-ops-th short-ops-th--left">Symbol</th>
                <th className="short-ops-th short-ops-th--left">Reason code</th>
                <th className="short-ops-th short-ops-th--left">Reason detail</th>
                <th className="short-ops-th short-ops-th--left">Created</th>
              </tr>
            </thead>
            <tbody>
              {rejectionsLoading && rejections.length === 0 ? (
                <tr><td colSpan={5} className="short-ops-td short-ops-td--pad">Loading…</td></tr>
              ) : rejections.length === 0 ? (
                <tr><td colSpan={5} className="short-ops-td short-ops-td--pad short-ops-td--muted">No rejections</td></tr>
              ) : (
                rejectionsDisplayRows.map((r) => (
                  <tr key={r.id}>
                    <td className="short-ops-td short-ops-td--clip-sm" title={r.user_id}>{String(r.user_id).slice(0, 8)}…</td>
                    <td className="short-ops-td">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <CryptoLogo symbol={r.symbol} size={15} />
                        {r.symbol}
                      </span>
                    </td>
                    <td className="short-ops-td">{r.reason_code}</td>
                    <td className="short-ops-td short-ops-td--clip-lg" title={r.reason_detail}>{r.reason_detail || '—'}</td>
                    <td className="short-ops-td short-ops-td--fine">{r.created_at ? new Date(r.created_at).toISOString().replace('T', ' ').slice(0, 19) : '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {rejectionsSorted.length > OPS_DIAG_PREVIEW_LIMIT && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              flexWrap: 'wrap',
              marginTop: 8,
              marginBottom: 4,
              fontSize: 11,
              color: SOP.muted,
            }}
          >
            <span>
              {rejectionsDiagnosticsExpanded
                ? `Showing all ${rejectionsSorted.length} rows (newest first)`
                : `Showing latest ${OPS_DIAG_PREVIEW_LIMIT} of ${rejectionsSorted.length}`}
            </span>
            <button
              type="button"
              onClick={() => setRejectionsDiagnosticsExpanded((v) => !v)}
              style={{
                fontSize: 11,
                padding: '5px 12px',
                background: SOP.surfaceRaised,
                color: SOP.text,
                border: `1px solid ${SOP.border}`,
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              {rejectionsDiagnosticsExpanded ? 'Compact view' : 'History'}
            </button>
          </div>
        )}

        <div className="short-ops-footer-row">
          <span className="short-ops-footer-title"><Shield size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Kill switch status</span>
          <input type="text" value={killStatusUserId} onChange={(e) => setKillStatusUserId(e.target.value)} placeholder="User ID (optional, empty = all)" className="short-ops-footer-input short-ops-footer-input--md" />
          <button type="button" onClick={fetchKillStatus} disabled={killStatusLoading}>Refresh</button>
        </div>
        <div className="short-ops-table-wrap">
          {killStatusLoading && killStatus == null ? (
            <p className="short-ops-muted-p">Loading…</p>
          ) : killStatus == null ? (
            <p className="short-ops-muted-p">Click Refresh to load kill status</p>
          ) : Array.isArray(killStatus) ? (
            <table className="short-ops-table">
              <thead>
                <tr>
                  <th className="short-ops-th short-ops-th--left">User</th>
                  <th className="short-ops-th short-ops-th--left">Active</th>
                  <th className="short-ops-th short-ops-th--left">Reasons</th>
                  <th className="short-ops-th short-ops-th--left">Updated</th>
                </tr>
              </thead>
              <tbody>
                {killStatus.length === 0 ? (
                  <tr><td colSpan={4} className="short-ops-td short-ops-td--pad short-ops-td--muted">No kill switch entries</td></tr>
                ) : (
                  killStatus.map((k) => (
                    <tr key={k.user_id}>
                      <td className="short-ops-td short-ops-td--clip-sm" title={k.user_id}>{String(k.user_id).slice(0, 8)}…</td>
                      <td className="short-ops-td">{k.active ? 'Yes' : 'No'}</td>
                      <td className="short-ops-td">{Array.isArray(k.reasons_json) ? k.reasons_json.join(', ') : (k.reasons_json && typeof k.reasons_json === 'object' ? JSON.stringify(k.reasons_json) : String(k.reasons_json || ''))}</td>
                      <td className="short-ops-td short-ops-td--fine">{k.updated_at ? new Date(k.updated_at).toISOString().replace('T', ' ').slice(0, 19) : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <div className="short-ops-kill-inline">
              <p><strong>User:</strong> {killStatus.user_id}</p>
              <p><strong>Active:</strong> {killStatus.active ? 'Yes' : 'No'}</p>
              <p><strong>Reasons:</strong> {Array.isArray(killStatus.reasons_json) ? killStatus.reasons_json.join(', ') : String(killStatus.reasons_json || '—')}</p>
              <p className="short-ops-kill-inline-upd">Updated: {killStatus.updated_at ? new Date(killStatus.updated_at).toISOString() : '—'}</p>
            </div>
          )}
        </div>
      </div>

      {tokenBlockModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="token-block-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: SOP.scrim,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={(ev) => { if (ev.target === ev.currentTarget) setTokenBlockModalOpen(false); }}
        >
          <div
            className="token-block-modal-panel"
            style={{
              width: '100%',
              maxWidth: 'min(520px, calc(100vw - 24px))',
              maxHeight: 'min(92vh, 860px)',
              background: SOP.surface,
              border: `1px solid ${SOP.border}`,
              borderRadius: 12,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.65)',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, padding: '18px 22px 12px' }}>
            <h2 id="token-block-modal-title" style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800, color: SOP.text }}>
              Block LONG for a token
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: SOP.textSecondary, lineHeight: 1.5 }}>
              No new LONG on this symbol until expiry. Choose from the list or type manually. API: <code style={{ fontSize: 11, color: SOP.muted }}>POST .../token-block</code>.
            </p>

            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: SOP.text, marginBottom: 6 }}>Symbol</label>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <button
                type="button"
                className="token-block-modal-symbol-picker"
                onClick={() => setBlockSymbolPickerOpen((o) => !o)}
                disabled={tokenBlockSubmitting}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  borderRadius: 8,
                  border: `1px solid ${SOP.border}`,
                  background: SOP.surfaceRaised,
                  color: SOP.text,
                  cursor: tokenBlockSubmitting ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                }}
              >
                <CryptoLogo symbol={blockSelectedSymbol} size={26} />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700, fontFamily: 'ui-monospace, monospace' }}>
                  {blockSelectedSymbol || 'Choose token...'}
                </span>
                <ChevronDown size={20} style={{ color: SOP.muted, flexShrink: 0 }} aria-hidden />
              </button>
              {blockSymbolPickerOpen && (
                <div
                  role="listbox"
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: '100%',
                    marginTop: 4,
                    maxHeight: 240,
                    overflowY: 'auto',
                    background: SOP.black,
                    border: `1px solid ${SOP.border}`,
                    borderRadius: 8,
                    zIndex: 2,
                    boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                  }}
                >
                  {blockableTokenSymbols.length === 0 ? (
                    <div style={{ padding: '12px 14px', fontSize: 11, color: SOP.muted }}>
                      No aggregated symbols yet. Press <strong>Refresh all</strong> on the panel or fill manually below.
                    </div>
                  ) : (
                    blockableTokenSymbols.map((sym) => (
                      <button
                        key={sym}
                        type="button"
                        role="option"
                        aria-selected={sym === blockSelectedSymbol}
                        onClick={() => { setBlockSelectedSymbol(sym); setBlockSymbolPickerOpen(false); }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 14px',
                          border: 'none',
                          borderBottom: `1px solid ${SOP.borderMuted}`,
                          background: sym === blockSelectedSymbol ? SOP.rowSelected : 'transparent',
                          color: SOP.text,
                          cursor: 'pointer',
                          fontSize: 13,
                        }}
                      >
                        <CryptoLogo symbol={sym} size={26} />
                        <span style={{ fontWeight: 800, fontFamily: 'ui-monospace, monospace', letterSpacing: 0.3 }}>{sym}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: SOP.muted, marginBottom: 4 }}>Manual (any symbol)</label>
            <input
              value={blockSelectedSymbol}
              onChange={(e) => setBlockSelectedSymbol(e.target.value.toUpperCase())}
              placeholder="e.g. BTC if not in the list"
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 6, border: `1px solid ${SOP.borderMuted}`, background: SOP.surfaceRaised, color: SOP.text, fontSize: 12, fontFamily: 'ui-monospace, monospace' }}
            />

            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: SOP.text, margin: '14px 0 6px' }}>Duration</label>
            <select
              value={blockDurationPreset}
              onChange={(e) => setBlockDurationPreset(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${SOP.border}`, background: SOP.surfaceRaised, color: SOP.text, fontSize: 13 }}
            >
              <option value="1h">1 hour</option>
              <option value="6h">6 hours</option>
              <option value="24h">24 hours</option>
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
              <option value="permanent">Permanent (long)</option>
            </select>

            <div style={{ marginTop: 18, padding: '10px 10px 10px', borderRadius: 8, background: '#0a0a0a', border: `1px solid ${SOP.borderMuted}` }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: SOP.text, marginBottom: 2 }}>Active blocks now</div>
              <div style={{ fontSize: 11, color: SOP.muted, marginBottom: 6, lineHeight: 1.35 }}>One row = one symbol. Full steps appear on hover over the line under the symbol.</div>
              <TokenBlockDetailTable
                blocks={tokenBlocks}
                onRemove={handleClearTokenBlock}
                clearingSymbol={clearingBlockSymbol}
                confirmRemove={false}
              />
            </div>
            </div>

            <div className="token-block-modal-footer" style={{ flexShrink: 0, display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap', padding: '14px 22px 18px', borderTop: `1px solid ${SOP.borderMuted}`, background: SOP.surface }}>
              <button
                type="button"
                className="token-block-modal-btn-cancel"
                onClick={() => setTokenBlockModalOpen(false)}
                disabled={tokenBlockSubmitting}
                style={{ padding: '10px 16px', borderRadius: 8, cursor: tokenBlockSubmitting ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="token-block-modal-btn-confirm"
                onClick={confirmTokenBlock}
                disabled={tokenBlockSubmitting}
                style={{ padding: '10px 16px', borderRadius: 8, cursor: tokenBlockSubmitting ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: 13 }}
              >
                {tokenBlockSubmitting ? 'Applying…' : 'Confirm block'}
              </button>
            </div>
          </div>
        </div>
      )}

      {allowlistTokensModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="allowlist-tokens-modal-title-long"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: SOP.scrim,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={(ev) => { if (ev.target === ev.currentTarget) setAllowlistTokensModalOpen(false); }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 520,
              maxHeight: '90vh',
              overflow: 'auto',
              background: SOP.surface,
              border: `1px solid ${SOP.border}`,
              borderRadius: 12,
              padding: '18px 20px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.65)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <FuturesOpsAllowlistGlyph size={26} style={{ flexShrink: 0, color: SOP.textSecondary, opacity: 0.95 }} />
                <div style={{ minWidth: 0 }}>
                  <h2 id="allowlist-tokens-modal-title-long" style={{ margin: 0, fontSize: 16, fontWeight: 800, color: SOP.text, letterSpacing: '-0.02em' }}>
                    OpenAI analysis scope
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: 10, fontWeight: 800, color: SOP.muted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                    LONG lane — not suspended
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAllowlistTokensModalOpen(false)}
                style={{ fontSize: 11, padding: '6px 12px', borderRadius: 6, border: `1px solid ${SOP.border}`, background: SOP.surfaceRaised, color: SOP.text, cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}
              >
                Close
              </button>
            </div>
            <p style={{ margin: '0 0 14px', fontSize: 12, color: SOP.textSecondary, lineHeight: 1.5 }}>
              Same rules as the analysis feed: a symbol is listed here only if it is <strong style={{ color: SOP.text }}>not</strong> on OpenAI suspend for <strong style={{ color: SOP.text }}>LONG</strong> <em>and</em> has <strong style={{ color: SOP.text }}>no active LONG token hold/block</strong>. Independent of the live <em>execution</em> allowlist. Use <strong>Suspend / Resume LLM</strong> or lift <strong>Block / Hold</strong> to change this.
            </p>
            {!analysisFeedUiUserId?.trim() ? (
              <p style={{ fontSize: 12, color: SOP.muted }}>Set the analysis user filter (or connect wallet) to load GET openai-suspend for this lane.</p>
            ) : (
              <LiveGateAllowlistTokens
                listKind="openAiAnalysis"
                symbols={openAiAnalysisAllowedSymbolsLong}
                count={openAiAnalysisAllowedSymbolsLong.length}
                mutedColor={SOP.muted}
                futuresSideLabel="LONG"
              />
            )}
          </div>
        </div>
      )}

      {unblockModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="unblock-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10001,
            background: SOP.scrim,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={(ev) => { if (ev.target === ev.currentTarget) setUnblockModalOpen(false); }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 720,
              background: SOP.surface,
              border: `1px solid ${SOP.border}`,
              borderRadius: 12,
              padding: '18px 20px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.65)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
              <h2 id="unblock-modal-title" style={{ margin: 0, fontSize: 16, fontWeight: 800, color: SOP.text }}>
                Unblock LONG — per token and global lock
              </h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={refreshUnblockModalData}
                  disabled={unblockModalBusy}
                  style={{ fontSize: 11, padding: '6px 12px', borderRadius: 6, border: `1px solid ${SOP.border}`, background: SOP.surfaceRaised, color: SOP.textSecondary, cursor: unblockModalBusy ? 'wait' : 'pointer', fontWeight: 600 }}
                >
                  {unblockModalBusy ? '…' : 'Reload'}
                </button>
                <button
                  type="button"
                  onClick={() => setUnblockModalOpen(false)}
                  style={{ fontSize: 11, padding: '6px 12px', borderRadius: 6, border: `1px solid ${SOP.border}`, background: SOP.surfaceRaised, color: SOP.text, cursor: 'pointer', fontWeight: 600 }}
                >
                  Close
                </button>
              </div>
            </div>
            <p style={{ margin: '0 0 12px', fontSize: 11, color: SOP.textSecondary, lineHeight: 1.45 }}>
              Columns <strong>From / Until / Duration / Remaining</strong> use backend fields (<code style={{ fontSize: 10 }}>created_at</code>, <code style={{ fontSize: 10 }}>blocked_until</code>). If missing from the API, “—” is shown.
            </p>

            {unblockModalBusy ? (
              <p style={{ fontSize: 11, color: SOP.muted, margin: '0 0 10px' }}>Updating data…</p>
            ) : null}

            <div style={{ marginBottom: 16, padding: '12px 14px', background: SOP.surfaceRaised, borderRadius: 8, border: `1px solid ${SOP.borderMuted}` }}>
              {(() => {
                const uid = (resetUserId || walletAddress || '').trim();
                const killRow = pickKillForWallet(unblockKillSnapshot, uid);
                const active = !!(killRow && killRow.active);
                return (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 800, color: SOP.text, marginBottom: 8 }}>Global lock (kill switch)</div>
                    {!killRow ? (
                      <p style={{ margin: 0, fontSize: 11, color: SOP.muted }}>
                        No kill row for this user in the current response or data still loading. Press Reload or check User ID.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 12, color: active ? SOP.text : SOP.muted, fontWeight: 800 }}>
                          {active ? 'ON — no new LONGs for whole wallet' : 'Off'}
                        </span>
                        {killRow.updated_at && (
                          <span style={{ fontSize: 10, color: SOP.muted }}>
                            updated: {formatRoDateTime(killRow.updated_at)}
                          </span>
                        )}
                        {active && (
                          <button
                            type="button"
                            onClick={handleGlobalKillResetFromModal}
                            disabled={resetSubmitting}
                            style={{ marginLeft: 'auto', fontSize: 11, padding: '6px 14px', borderRadius: 6, border: `1px solid ${SOP.border}`, background: SOP.black, color: SOP.text, fontWeight: 800, cursor: resetSubmitting ? 'wait' : 'pointer' }}
                          >
                            {resetSubmitting ? '…' : 'Disable global lock'}
                          </button>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div style={{ fontSize: 12, fontWeight: 800, color: SOP.text, marginBottom: 6 }}>Blocks per symbol</div>
            <TokenBlockDetailTable
              blocks={tokenBlocks}
              onRemove={handleClearTokenBlock}
              clearingSymbol={clearingBlockSymbol}
              confirmRemove={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}
