/**
 * Strip compact: trace din executor OTA (GET /agent/trace/live), fără Run manual.
 * Pe Futures Ops: `futuresLane` = short | long → același poll + **filtru client** (backend GET trace/live nu filtrează după lane).
 *
 * Prag documentat proiect: **AGENTS.md pct. 16** — fără poll pe `…/agent/trace/live` sub 5s; `POLL_MS_*` aici ≥ 8000 ms.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Activity } from 'lucide-react';
import { fetchOtaAgentTraceLive } from '../../services/aiTradingApiService';
import { filterAgentTraceEventsForFuturesLane } from '../../utils/otaAgentTraceLane';
import { isOtaTraceAuthExpectedFailure } from '../../utils/otaTracePollErrors';
import {
  OTA_FUTURES_TRACE_APPEND_EVENT,
  OTA_FUTURES_TRACE_IMMEDIATE_POLL,
} from '../../utils/otaFuturesTraceImmediatePoll';
import OTALogo from './OTALogo';

const MAX_LINES = 48;
/** Cap memorie evenimente brute înainte de filtru lane. */
const MAX_RAW_EVENTS = 280;

/** Când executorul are runAgent activ — aliniat la ~8s ca poll-ul feed analize LONG/SHORT (fără interval sub 5s). */
const POLL_MS_ACTIVE = 8000;
/** Când nu rulează nimic — același cadru ca mai sus, evită ciclu agresiv pe /agent/trace/live. */
const POLL_MS_IDLE = 8000;
/** După eroare de rețea — evită hammering. */
const POLL_MS_ERROR = 8000;

/**
 * Pentru tool-uri finish/hold sau orice JSON din resultPreview: o linie scurtă, lizibilă.
 * Datele rămân din backend; aici doar formatare UI (fără a pretinde „alt răspuns OpenAI”).
 */
function summarizeToolJsonPreview(raw, toolName) {
  const s = String(raw || '').trim();
  if (!s) return null;
  const looksJson = s.startsWith('{') || s.startsWith('[');
  if (!looksJson && toolName !== 'finish' && toolName !== 'hold') return null;
  try {
    const o = JSON.parse(s);
    if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
    const parts = [];
    if (o.decision != null) parts.push(`decision=${o.decision}`);
    if (o.signal != null && String(o.signal) !== String(o.decision)) parts.push(`signal=${o.signal}`);
    if (o.confidence != null && Number.isFinite(Number(o.confidence))) {
      parts.push(`${Math.round(Number(o.confidence) * 100)}%`);
    }
    if (Array.isArray(o.reasonCodes) && o.reasonCodes.length) {
      parts.push(`reasons: ${o.reasonCodes.slice(0, 4).join(', ')}`);
    }
    if (typeof o.summary === 'string' && o.summary.trim()) {
      const sum = o.summary.trim().slice(0, 88);
      parts.push(sum.length < o.summary.trim().length ? `${sum}…` : sum);
    }
    return parts.length ? parts.join(' · ') : null;
  } catch {
    return null;
  }
}

function formatBrowserAnalyzeLine(e, t) {
  const token = e.token ? ` · ${String(e.token).trim().toUpperCase()}` : '';
  const providerRaw = String(e.provider || '').trim().toLowerCase();
  const provider =
    providerRaw === 'anthropic'
      ? 'Claude'
      : providerRaw === 'ota_engine'
        ? 'OTA Engine'
        : providerRaw === 'openai'
          ? 'OpenAI'
          : 'AI';
  const model = e.model ? ` · ${String(e.model).slice(0, 48)}` : '';
  const ctx = e.tradeContext ? ` · ${String(e.tradeContext)}` : '';
  if (e.phase === 'start') {
    return `${t} · Browser analyze start · ${provider}${token}${ctx}`;
  }
  if (e.phase === 'blocked') {
    const reason = e.code || e.message || 'blocked';
    return `${t} · Browser analyze blocked · ${provider}${token} · ${String(reason).slice(0, 90)}`;
  }
  if (e.phase === 'error') {
    const reason = e.code || e.message || 'error';
    return `${t} · Browser analyze error · ${provider}${token} · ${String(reason).slice(0, 90)}`;
  }
  const tok = e.totalTokens != null ? ` · ${e.totalTokens} tok` : '';
  const usd =
    e.usdStatus === 'charged'
      ? e.costUsd != null
        ? ` · $${Number(e.costUsd).toFixed(2)}`
        : ' · USD charged'
      : e.usdStatus === 'pending'
        ? ' · USD pending'
        : '';
  const sig = e.signal ? ` · ${String(e.signal).toUpperCase()}` : '';
  const conf =
    e.confidence != null && Number.isFinite(Number(e.confidence))
      ? ` (${Math.round(Number(e.confidence) * 100)}%)`
      : '';
  return `${t} · Browser analyze done · ${provider}${token}${sig}${conf}${tok}${usd}${ctx}${model}`;
}

function formatExecutorAnalyzeLine(e, t) {
  const token = e.token ? ` · ${String(e.token).trim().toUpperCase()}` : '';
  const ctx = e.tradeContext ? ` · ${String(e.tradeContext)}` : '';
  const sig = e.signal ? ` · ${String(e.signal).toUpperCase()}` : '';
  const conf =
    e.confidence != null && Number.isFinite(Number(e.confidence))
      ? ` (${Math.round(Number(e.confidence) * 100)}%)`
      : '';
  if (e.phase === 'start') {
    return `${t} · OTA Motor analyze start · OTA Engine${token}${ctx}`;
  }
  if (e.phase === 'error') {
    const reason = e.code || e.message || e.reason || 'error';
    return `${t} · OTA Motor analyze error · OTA Engine${token} · ${String(reason).slice(0, 90)}${ctx}`;
  }
  const source = e.skippedOpenAI === true ? ' · no OpenAI' : '';
  const reason = e.reason ? ` · ${String(e.reason).slice(0, 90)}` : '';
  return `${t} · OTA Motor analyze done · OTA Engine${token}${sig}${conf}${source}${ctx}${reason}`;
}

function formatFuturesLaneEvaluationLine(e, t) {
  const lane = String(e.lane || '').trim().toUpperCase() || 'FUTURES';
  const token = e.token ? ` · ${String(e.token).trim().toUpperCase()}` : '';
  const sourceSignal = e.sourceSignal ? ` · source ${String(e.sourceSignal).trim().toUpperCase()}` : '';
  const resultingSignal = e.signal && String(e.signal).toLowerCase() !== String(e.sourceSignal).toLowerCase()
    ? ` → ${String(e.signal).trim().toUpperCase()}`
    : '';
  const conf = e.confidence != null && Number.isFinite(Number(e.confidence))
    ? ` (${Math.round(Number(e.confidence) * 100)}%)`
    : '';
  const reasonLabels = {
    bullish_signal_reserved_for_long: 'bullish signal belongs to LONG',
    bearish_short_conditions_not_met: 'bearish SHORT conditions not met',
    short_engine_disabled: 'SHORT engine disabled',
    short_live_open_path_disabled: 'SHORT live open path unavailable',
    short_action_ready: 'SHORT action eligible',
    signal_not_short_actionable: 'signal is not actionable for SHORT',
  };
  const rawReason = String(e.reason || '').trim();
  const reason = rawReason ? ` · ${reasonLabels[rawReason] || rawReason}` : '';
  const phase = String(e.phase || 'evaluated').trim().toUpperCase();
  return `${t} · ${lane} gate ${phase}${token}${sourceSignal}${resultingSignal}${conf}${reason}`;
}

function formatAgentTraceLine(e) {
  if (!e || !e.type) return '';
  const t = e.ts ? new Date(e.ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
  const modelHint = e.model ? String(e.model) : '';
  switch (e.type) {
    case 'browser_analyze':
      return formatBrowserAnalyzeLine(e, t);
    case 'executor_analyze':
      return formatExecutorAnalyzeLine(e, t);
    case 'futures_lane_evaluation':
      return formatFuturesLaneEvaluationLine(e, t);
    case 'run_started':
      return `${t} · START ${e.token || '?'}${e.pair ? ` (${e.pair})` : ''}${modelHint ? ` · ${modelHint}` : ''}`;
    case 'step_begin':
      return `${t} · Step ${e.step}/${e.maxSteps}`;
    case 'llm_request':
      return `${t} · LLM request${modelHint ? ` · ${modelHint}` : ''}`;
    case 'llm_end': {
      const ms = e.durationMs != null ? `${e.durationMs}ms` : '';
      const tok = e.totalTokens != null ? ` · ${e.totalTokens} tok` : '';
      const m = e.model != null ? ` · ${e.model}` : '';
      return `${t} · LLM response${m}${ms ? ` ${ms}` : ''}${tok}`;
    }
    case 'assistant_preview':
      return `${t} · „${String(e.text || '').slice(0, 72)}${String(e.text || '').length > 72 ? '…' : ''}”`;
    case 'tool_start': {
      const ap = e.argsPreview ? ` ${String(e.argsPreview).slice(0, 100)}${String(e.argsPreview).length > 100 ? '…' : ''}` : '';
      return `${t} · → ${e.name || 'tool'}${ap}`;
    }
    case 'tool_end': {
      const raw = e.resultPreview ? String(e.resultPreview) : '';
      const friendly = summarizeToolJsonPreview(raw, e.name);
      const rp = friendly
        ? ` · ${friendly}`
        : raw
          ? ` · ${raw.slice(0, 140)}${raw.length > 140 ? '…' : ''}`
          : '';
      return `${t} · ← ${e.name || 'tool'} ${e.ok === false ? 'ERROR' : 'ok'}${rp}`;
    }
    case 'finish':
      return `${t} · ★ ${e.decision} → ${e.signal}${e.confidence != null ? ` (${Math.round(e.confidence * 100)}%)` : ''}`;
    case 'run_done':
      return `${t} · DONE session #${e.sessionId != null ? e.sessionId : '—'}${e.error ? ` · ${e.error}` : ''}`;
    case 'error':
      return `${t} · ⚠ ${e.code || ''} ${e.message || ''}`.trim();
    case 'blocked':
      return `${t} · ⛔ ${e.code || 'blocked'}${e.message ? ` · ${String(e.message).slice(0, 80)}` : ''}`;
    case 'note':
      return `${t} · ℹ ${e.code || 'note'}${e.blockedUntil != null ? ` · until ${e.blockedUntil}` : ''}`;
    default:
      return `${t} · ${e.type}`;
  }
}

/**
 * @param {{ userId: string, futuresLane?: 'short' | 'long' }} props
 */
export default function OtaFuturesAgentTraceStrip({ userId, futuresLane }) {
  const [rawEvents, setRawEvents] = useState([]);
  const [active, setActive] = useState(false);
  const [currentToken, setCurrentToken] = useState(null);
  const [pollErr, setPollErr] = useState(false);
  /** Lipsește sau nu e validă sesiunea OTA wallet (Bearer) pentru acest userId — UI neutru, nu „Eroare poll”. */
  const [traceAuthGap, setTraceAuthGap] = useState(false);
  const afterRef = useRef(0);
  const epochRef = useRef(null);
  const terminalRef = useRef(null);
  /** Un singur GET /trace/live la un moment dat; apeluri suprapuse (poll ~8s + eveniment după refresh feed) → al doilea poll imediat după primul. */
  const tracePollInFlightRef = useRef(false);
  const tracePollRepeatRef = useRef(false);

  const laneNorm = useMemo(() => {
    const s = String(futuresLane || '').trim().toLowerCase();
    return s === 'short' || s === 'long' ? s : null;
  }, [futuresLane]);

  const filteredEvents = useMemo(() => {
    if (!laneNorm) return rawEvents;
    return filterAgentTraceEventsForFuturesLane(rawEvents, laneNorm);
  }, [rawEvents, laneNorm]);

  // A lane-specific panel must never relabel the opposite lane as useful fallback data.
  const displayEvents = useMemo(
    () => (laneNorm ? filteredEvents : rawEvents),
    [laneNorm, rawEvents, filteredEvents]
  );

  const laneFilterDroppedAll =
    Boolean(laneNorm) && rawEvents.length > 0 && filteredEvents.length === 0;

  const lines = useMemo(
    () => displayEvents.map(formatAgentTraceLine).filter(Boolean).slice(-MAX_LINES),
    [displayEvents]
  );

  const uid = (userId || '').trim();
  const laneLabel = laneNorm === 'short' ? 'SHORT' : laneNorm === 'long' ? 'LONG' : null;

  /**
   * Un singur poll HTTP către trace/live (fără reentrancy).
   * @returns {{ agentActive: boolean, requestError: boolean }}
   */
  const executeTracePollOnce = useCallback(async () => {
    const uid = (userId || '').trim();
    if (!uid) return { agentActive: false, requestError: false };
    try {
      const r = await fetchOtaAgentTraceLive(uid, afterRef.current, epochRef.current);
      setPollErr(false);
      setTraceAuthGap(false);
      if (!r?.success) {
        setActive(false);
        return { agentActive: false, requestError: false };
      }
      if (typeof r.bufferEpoch === 'number') {
        epochRef.current = r.bufferEpoch;
      }
      afterRef.current = typeof r.nextAfter === 'number' ? r.nextAfter : afterRef.current;
      const agentActive = !!r.active;
      setActive(agentActive);
      setCurrentToken(r.currentToken || null);
      const batch = Array.isArray(r.events) ? r.events : [];
      /** `resync` (epoch / cursor invalid): înlocuim bufferul local; batch gol = gol intenționat după trunchiere server. */
      if (r.resync) {
        setRawEvents(batch.length ? batch.slice(-MAX_RAW_EVENTS) : []);
      } else if (batch.length) {
        setRawEvents((prev) => [...prev, ...batch].slice(-MAX_RAW_EVENTS));
      }
      return { agentActive, requestError: false };
    } catch (err) {
      if (isOtaTraceAuthExpectedFailure(err)) {
        setPollErr(false);
        setTraceAuthGap(true);
      } else {
        setPollErr(true);
        setTraceAuthGap(false);
      }
      return { agentActive: false, requestError: true };
    }
  }, [userId]);

  /**
   * Coalesce: dacă e deja un poll în zbor, marchează repetare — **nu** paralelizează request-uri.
   * @returns {{ agentActive: boolean, requestError: boolean }}
   */
  const tick = useCallback(async () => {
    if (tracePollInFlightRef.current) {
      tracePollRepeatRef.current = true;
      return { agentActive: false, requestError: false };
    }
    tracePollInFlightRef.current = true;
    let last = { agentActive: false, requestError: false };
    try {
      do {
        tracePollRepeatRef.current = false;
        last = await executeTracePollOnce();
      } while (tracePollRepeatRef.current);
      return last;
    } finally {
      tracePollInFlightRef.current = false;
    }
  }, [executeTracePollOnce]);

  useEffect(() => {
    afterRef.current = 0;
    epochRef.current = null;
    tracePollRepeatRef.current = false;
    setRawEvents([]);
    setActive(false);
    setCurrentToken(null);
    setPollErr(false);
    setTraceAuthGap(false);
  }, [userId]);

  useEffect(() => {
    const uid = (userId || '').trim();
    if (!uid) return undefined;

    let cancelled = false;
    let timeoutId = null;

    const runLoop = async () => {
      if (cancelled) return;
      const { agentActive, requestError } = await tick();
      if (cancelled) return;
      const delay = requestError ? POLL_MS_ERROR : agentActive ? POLL_MS_ACTIVE : POLL_MS_IDLE;
      timeoutId = window.setTimeout(runLoop, delay);
    };

    runLoop();

    return () => {
      cancelled = true;
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, [userId, tick]);

  /** După refresh forțat feed semnale (cache bypass) — poll imediat trace live (Matrix), fără a aștepta ~8s. */
  useEffect(() => {
    const onImmediatePoll = () => {
      void tick();
    };
    if (typeof window === 'undefined') return undefined;
    window.addEventListener(OTA_FUTURES_TRACE_IMMEDIATE_POLL, onImmediatePoll);
    return () => {
      window.removeEventListener(OTA_FUTURES_TRACE_IMMEDIATE_POLL, onImmediatePoll);
    };
  }, [tick]);

  useEffect(() => {
    const uidNorm = String(userId || '').trim().toLowerCase();
    if (!uidNorm || typeof window === 'undefined') return undefined;
    const onAppendTraceEvent = (ev) => {
      const detail = ev?.detail && typeof ev.detail === 'object' ? ev.detail : null;
      const payloadUid = detail?.userId != null ? String(detail.userId).trim().toLowerCase() : '';
      const event = detail?.event && typeof detail.event === 'object' ? detail.event : null;
      if (!payloadUid || payloadUid !== uidNorm || !event) return;
      const eventTs = event.ts != null ? Number(event.ts) : Date.now();
      setTraceAuthGap(false);
      setPollErr(false);
      setRawEvents((prev) => {
        const next = [...prev, { ...event, ts: Number.isFinite(eventTs) ? eventTs : Date.now() }];
        return next.slice(-MAX_RAW_EVENTS);
      });
      if (event?.token) {
        setCurrentToken(String(event.token).trim().toUpperCase());
      }
      if (event?.phase === 'start') {
        setActive(true);
      }
      if (event?.phase === 'done' || event?.phase === 'blocked' || event?.phase === 'error') {
        setActive(false);
      }
    };
    window.addEventListener(OTA_FUTURES_TRACE_APPEND_EVENT, onAppendTraceEvent);
    return () => {
      window.removeEventListener(OTA_FUTURES_TRACE_APPEND_EVENT, onAppendTraceEvent);
    };
  }, [userId]);

  const terminalBody = useMemo(() => {
    const core = lines.length ? lines.join('\n') : '';
    if (!uid) {
      return 'Connect a wallet to load trace events.';
    }
    if (traceAuthGap) {
      if (core) {
        return `⚠ OTA session required for live updates — showing last buffer:\n—\n${core}`;
      }
      return 'Live trace needs a verified OTA session (sign-in flow). Without a session the API returns no events — this is expected, not a network failure.';
    }
    if (!core) {
      if (laneNorm) {
        if (laneFilterDroppedAll) {
          return `No ${laneLabel} cycle is present in the current executor buffer. Opposite-lane runs are hidden; wait for the next ${laneLabel} analysis.`;
        }
        return `No trace events yet for the ${laneLabel} lane. SHORT/LONG-tagged runs are filtered per tab; ambiguous runs (e.g. hold) may appear on both once the executor emits them. Provider/model may not be shown on every line.`;
      }
      return 'OTA executor trace for this account (all runs). Shows LLM requests/responses and tools — not full prompts. Provider is shown when the event includes it.';
    }
    return core;
  }, [uid, traceAuthGap, lines, laneNorm, laneFilterDroppedAll, laneLabel]);

  useEffect(() => {
    const el = terminalRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [terminalBody]);

  const statusLabel = !uid
    ? 'Connect wallet'
    : traceAuthGap
      ? 'Trace: OTA session required'
      : pollErr
        ? 'Trace temporarily unavailable'
        : active
          ? `Running${currentToken ? ` · ${currentToken}` : ''}`
          : 'Waiting for OTA cycle';

  const title = laneNorm
    ? `Trace (Matrix) · ${laneNorm.toUpperCase()}: live executor buffer (GET /agent/trace/live, ~8s poll). Not the OpenAI Usage dashboard.`
    : 'Trace (Matrix): live executor stream (~8s). GET /agent/trace/live — not the OpenAI Usage dashboard.';

  return (
    <div className="short-ops-toolbar-trace-slot futures-ops-header-agent-trace" title={title}>
      <div className="short-ops-toolbar-trace-controls futures-ops-header-agent-trace__bar">
        <div className="futures-ops-header-agent-trace__brand" aria-label="OTA LLM — trace live din executor">
          <OTALogo
            size="xs"
            showBorder
            animated={active && !pollErr && !traceAuthGap}
            className="futures-ops-header-agent-trace__ota-logo"
          />
          <span className="futures-ops-header-agent-trace__title">
            Trace{laneLabel ? ` · ${laneLabel}` : ''}
          </span>
        </div>
        <span className="futures-ops-header-agent-trace__status" aria-live="polite">
          {!active ? (
            <Activity size={11} className="futures-ops-header-agent-trace__idle-icon" aria-hidden />
          ) : null}
          <span className="futures-ops-header-agent-trace__status-text">{statusLabel}</span>
        </span>
      </div>
      {laneFilterDroppedAll && laneLabel ? (
        <div className="futures-ops-header-agent-trace__lane-fallback" role="status">
          No {laneLabel} cycle in the current buffer. Opposite-lane runs are hidden.
        </div>
      ) : null}
      <div
        ref={terminalRef}
        className="short-ops-toolbar-trace-terminal"
        aria-live="polite"
        aria-label={laneFilterDroppedAll && laneLabel ? `No ${laneLabel} executor trace in the current buffer` : 'Executor trace output'}
      >
        {terminalBody}
      </div>
    </div>
  );
}
