/**
 * Separare trace agent OTA pe lane Futures SHORT vs LONG.
 * Folosește câmpuri opționale din evenimente (`tradeContext`, `futuresLane`, `lane`) sau
 * euristica pe `finish.signal` / `finish.decision` când backend nu etichetează explicit.
 *
 * **Regulă importantă:** dacă există mai multe `finish` în același run, **doar ultimul** (cronologic)
 * decide lane-ul — reflectă decizia finală; un `finish` anterior cu semnal direcțional nu „bate” un `hold` final.
 * Rulări fără lane dedus (ex. hold final) sunt incluse în ambele tab-uri — vezi `filterAgentTraceEventsForFuturesLane`.
 */

/** @param {object} e */
function explicitLaneFromEvent(e) {
  if (!e || typeof e !== 'object') return null;
  const raw = String(
    e.tradeContext ?? e.trade_context ?? e.futuresLane ?? e.futures_lane ?? e.lane ?? ''
  )
    .trim()
    .toLowerCase();
  if (!raw) return null;
  if (raw.startsWith('short')) return 'short';
  if (raw.startsWith('long')) return 'long';
  return null;
}

/** @param {object} e */
function laneFromFinishEvent(e) {
  if (!e || e.type !== 'finish') return null;
  const s = String(e.signal ?? '').trim().toLowerCase();
  const d = String(e.decision ?? '').trim().toLowerCase();

  if (
    s.startsWith('close_short')
    || s === 'open_short'
    || s === 'open_sell'
    || s === 'sell'
    || s === 'close_short'
  ) {
    return 'short';
  }
  if (d === 'short' || d.startsWith('open_short') || d.startsWith('open_sell') || d.startsWith('close_short')) {
    return 'short';
  }

  if (
    s.startsWith('close_long')
    || s.startsWith('open_long')
    || s === 'buy'
    || s === 'swap'
    || s === 'open_buy'
  ) {
    return 'long';
  }
  // Executor / agent: open_long_futures, close_long_futures, etc. (signal poate rămâne `hold` din mapare)
  if (d === 'long' || d === 'open_long' || d === 'buy' || d.startsWith('open_long') || d.startsWith('close_long')) {
    return 'long';
  }

  return null;
}

/**
 * Împarte fluxul cronologic în „run”-uri: fiecare `run_started` începe segment nou.
 * @param {Array<object>} events
 * @returns {Array<Array<object>>}
 */
export function segmentAgentTraceEventsIntoRuns(events) {
  const list = Array.isArray(events) ? events : [];
  const runs = [];
  let cur = [];
  for (const e of list) {
    if (e && e.type === 'run_started') {
      if (cur.length) runs.push(cur);
      cur = [e];
    } else {
      cur.push(e);
    }
  }
  if (cur.length) runs.push(cur);
  return runs;
}

/**
 * Deduce lane pentru un singur run (segment de evenimente).
 * Ordine: (1) orice `tradeContext` / `futuresLane` explicit pe orice eveniment din run;
 * (2) altfel **ultimul** eveniment `finish` din run (decizie finală).
 * @param {Array<object>} runEvents
 * @returns {'short' | 'long' | null}
 */
export function inferAgentTraceRunLane(runEvents) {
  const seg = Array.isArray(runEvents) ? runEvents : [];
  for (const e of seg) {
    const ex = explicitLaneFromEvent(e);
    if (ex) return ex;
  }
  let lastFinish = null;
  for (let i = seg.length - 1; i >= 0; i--) {
    if (seg[i] && seg[i].type === 'finish') {
      lastFinish = seg[i];
      break;
    }
  }
  if (lastFinish) {
    return laneFromFinishEvent(lastFinish);
  }
  return null;
}

/**
 * Păstrează evenimentele din run-uri aliniate cu `futuresLane` (`short` | `long`).
 * Run-urile fără lane dedus (ex. `finish` hold fără tradeContext) sunt incluse în **ambele**
 * tab-uri — altfel LONG rămâne gol când motorul/agentul nu emite semnal clar long-only.
 * @param {Array<object>} events
 * @param {'short' | 'long'} futuresLane
 * @returns {Array<object>}
 */
export function filterAgentTraceEventsForFuturesLane(events, futuresLane) {
  const lane = String(futuresLane || '').trim().toLowerCase();
  if (lane !== 'short' && lane !== 'long') {
    return Array.isArray(events) ? [...events] : [];
  }
  const runs = segmentAgentTraceEventsIntoRuns(events);
  const out = [];
  for (const run of runs) {
    const inferred = inferAgentTraceRunLane(run);
    if (inferred === lane || inferred == null) {
      out.push(...run);
    }
  }
  return out;
}
