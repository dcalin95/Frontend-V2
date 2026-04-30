/**
 * UI evidence for "why no position opened" when the signal and confidence pass the live-status threshold.
 * LONG and SHORT use the same logic, with lane-specific API citations.
 */

import { pickAnalysisEventEpochMs, pickAnalysisInstant, fmtOtaAnalysisDateTimeFullEn } from './otaAnalysisTimestamps';

const WINDOW_PRE_MS = 3 * 60 * 1000;
const WINDOW_POST_MS = 72 * 60 * 60 * 1000;

const LANE_COPY = {
  long: {
    positionKind: 'LONG',
    alreadyOpenTitle: 'A LONG position already exists for this symbol',
    alreadyOpenCitation: 'Data from GET open-longs (positions) loaded in the panel',
    blockTitle: 'Active LONG token block / hold',
    blockCitation: 'GET .../long/token-blocks (list loaded when fetching analyses)',
    suspendTitle: 'Simbol pe suspend LLM (lane LONG)',
    suspendBody: 'Analysis for the LONG lane is suspended for this symbol (openai-suspend list loaded with the feed).',
    suspendCitation: 'GET openai-suspend (lane long) - same sample as feed',
    maxPosCitation: 'GET long/live-status (config) + lista Open positions din panou',
    liveGateCitation: 'GET …/long/live-status · gate.safeToExecuteLive / gate.reasonIfBlocked',
    rejectionTitle: 'LONG rejection (recorded by server)',
    rejectionPath: 'GET …/long/rejections',
    execPath: 'GET …/long/executor-decisions',
    bufferFooter: 'Same lists as the "Long rejections" and "Executor final decisions" tables in this panel',
    noRowsPath: 'long/rejections or long/executor-decisions',
    boxLead: 'Reason - no new LONG position (conf. >= threshold) · panel/API data',
  },
  short: {
    positionKind: 'SHORT',
    alreadyOpenTitle: 'A SHORT position already exists for this symbol',
    alreadyOpenCitation: 'Data from open positions loaded in the SHORT panel (same Open positions table)',
    blockTitle: 'Active SHORT token block / hold',
    blockCitation: 'GET .../short/token-blocks (list loaded when fetching analyses)',
    suspendTitle: 'Simbol pe suspend LLM (lane SHORT)',
    suspendBody: 'Analysis for the SHORT lane is suspended for this symbol (openai-suspend list loaded with the feed).',
    suspendCitation: 'GET openai-suspend (lane short) - same sample as feed',
    maxPosCitation: 'GET …/short/live-status (config) + lista Open positions din panou',
    liveGateCitation: 'GET …/short/live-status · gate.safeToExecuteLive / gate.reasonIfBlocked',
    rejectionTitle: 'SHORT rejection (recorded by server)',
    rejectionPath: 'GET …/short/rejections',
    execPath: 'GET …/short/executor-decisions',
    bufferFooter: 'Same lists as the "Short rejections" and "Executor final decisions" tables in this panel',
    noRowsPath: 'short/rejections or short/executor-decisions',
    boxLead: 'Reason - no new SHORT position (conf. >= threshold) · panel/API data',
  },
};

/** @param {string} tokenUpper */
export function otaSymbolKeysForMatch(tokenUpper) {
  const u = String(tokenUpper || '').trim().toUpperCase();
  if (!u) return [];
  const keys = new Set([u]);
  if (u.endsWith('USDT')) keys.add(u.replace(/USDT$/i, ''));
  else keys.add(`${u}USDT`);
  return [...keys];
}

/** Finds the first open position matching the base / USDT pair. */
export function findOpenPositionForSymbolKeys(positions, symKey) {
  const want = new Set(otaSymbolKeysForMatch(symKey));
  for (const p of positions || []) {
    if (!p || String(p.status || 'open').toLowerCase() !== 'open') continue;
    const raw = String(p.symbol || '').trim().toUpperCase();
    if (!raw) continue;
    for (const k of otaSymbolKeysForMatch(raw)) {
      if (want.has(k)) return p;
    }
  }
  return null;
}

function tokenBlockActiveForFeed(b) {
  if (b == null) return false;
  if (b.permanent === true) return true;
  const until = b.blocked_until ?? b.blockedUntil;
  if (until == null || until === '') return true;
  const t = new Date(until).getTime();
  if (!Number.isFinite(t)) return true;
  return t > Date.now();
}

function symbol_sets_overlap(symKeysSet, rawSym) {
  for (const k of otaSymbolKeysForMatch(rawSym)) {
    if (symKeysSet.has(k)) return true;
  }
  return false;
}

function analysisUserMatchesEv(analysisUserId, evUserId) {
  const a = String(analysisUserId || '').trim().toLowerCase();
  const b = String(evUserId || '').trim().toLowerCase();
  if (!a || !b) return true;
  return a === b;
}

function fmtEvidenceTime(iso) {
  if (iso == null || iso === '') return '—';
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return String(iso);
  return new Date(iso).toISOString().replace('T', ' ').slice(0, 19);
}

function pickLatestByCreatedAt(rows) {
  let best = null;
  let bestT = -Infinity;
  for (const row of rows || []) {
    const te = new Date(row.created_at).getTime();
    if (!Number.isFinite(te)) continue;
    if (te > bestT) {
      bestT = te;
      best = row;
    }
  }
  return best;
}

function analysisMomentLabelForEvidence(sig, tSigMs) {
  const loc = fmtOtaAnalysisDateTimeFullEn(pickAnalysisInstant(sig));
  const utc = fmtEvidenceTime(new Date(tSigMs).toISOString());
  if (loc && loc !== '—' && utc && utc !== '—') {
    return `${loc} (local display) · UTC ${utc}`;
  }
  return utc || loc || '—';
}

/**
 * @typedef {{ id: string, title: string, body: string, citation: string }} OtaNoOpenEvidenceLine
 * @param {'long'|'short'} lane
 */
export function buildFuturesLaneNoOpenEvidence(lane, p) {
  const copy = LANE_COPY[lane];
  if (!copy) return { show: false, lines: [] };

  const {
    sig,
    symKey,
    confidence,
    openMin,
    thresholdApplies,
    openForSym,
    liveStatus,
    positions,
    executorDecisions,
    rejections,
    feedTokenBlocks,
    feedSuspendSymbols,
    rejectionMatchUserId = '',
    executorMatchUserId = '',
  } = p;

  if (!thresholdApplies) return { show: false, lines: [] };
  const om = Number(openMin);
  if (!Number.isFinite(om) || !Number.isFinite(confidence) || confidence < om) {
    return { show: false, lines: [] };
  }

  const symKeys = new Set(otaSymbolKeysForMatch(symKey));
  const tSig = pickAnalysisEventEpochMs(sig);
  if (tSig <= 0) {
    return {
      show: true,
      lines: [
        {
          id: 'no-created-at',
          title: 'Missing generation time in row',
          body: 'created_at / createdAt is missing on this signal, so rejections or executor decisions cannot be correlated by time.',
          citation: 'GET /ai-trading/signals row (time fields)',
        },
      ],
    };
  }

  const lines = [];

  if (openForSym != null) {
    const nUsd = Number(openForSym.notional_usd);
    const lev = Number(openForSym.leverage);
    lines.push({
      id: 'already-open',
      title: copy.alreadyOpenTitle,
      body: `In the Open positions table: notional ~$${Number.isFinite(nUsd) ? nUsd.toFixed(2) : '—'}, lev ${Number.isFinite(lev) && lev >= 1 ? `${Math.round(lev)}×` : '—'}. The executor may reject an additional open depending on policy.`,
      citation: copy.alreadyOpenCitation,
    });
  }

  const blocks = Array.isArray(feedTokenBlocks) ? feedTokenBlocks : [];
  for (const b of blocks) {
    if (!tokenBlockActiveForFeed(b)) continue;
    if (!symbol_sets_overlap(symKeys, b?.symbol ?? b?.token ?? '')) continue;
    const bs = String(b?.symbol ?? b?.token ?? '').trim().toUpperCase();
    const until = b.blocked_until ?? b.blockedUntil;
    const reason = String(b.reason ?? b.reason_detail ?? '').trim() || '—';
    lines.push({
      id: `block-${bs || 'x'}`,
      title: copy.blockTitle,
      body: `Recorded reason: ${reason}. Until: ${fmtEvidenceTime(until)}.`,
      citation: copy.blockCitation,
    });
    break;
  }

  const susp = feedSuspendSymbols instanceof Set
    ? feedSuspendSymbols
    : new Set((feedSuspendSymbols || []).map((s) => String(s).trim().toUpperCase()));
  if (symKeys.size && [...symKeys].some((k) => susp.has(k))) {
    lines.push({
      id: 'llm-suspend',
      title: copy.suspendTitle,
      body: copy.suspendBody,
      citation: copy.suspendCitation,
    });
  }

  const maxOpen = Number(liveStatus?.config?.maxOpenPositions);
  const openCount = (positions || []).filter((row) => String(row?.status || 'open').toLowerCase() === 'open').length;
  if (Number.isFinite(maxOpen) && maxOpen > 0 && openCount >= maxOpen) {
    lines.push({
      id: 'max-pos',
      title: 'Position count limit reached (UI data)',
      body: `Loaded ${openCount} positions with open status; maxOpenPositions from live-status = ${maxOpen}.`,
      citation: copy.maxPosCitation,
    });
  }

  if (liveStatus && liveStatus.gate && liveStatus.gate.safeToExecuteLive === false) {
    const r = liveStatus.gate.reasonIfBlocked;
    const detail = r != null && String(r).trim() !== '' && String(r).toLowerCase() !== 'ok' ? String(r) : '—';
    lines.push({
      id: 'live-gate',
      title: 'Live gate: execution stopped',
      body: `Server reason: ${detail}`,
      citation: copy.liveGateCitation,
    });
  }

  const tMin = tSig - WINDOW_PRE_MS;
  const tMax = tSig + WINDOW_POST_MS;

  const rejCandidates = (rejections || []).filter((r) => {
    if (!analysisUserMatchesEv(rejectionMatchUserId, r.user_id)) return false;
    if (!symbol_sets_overlap(symKeys, r.symbol || '')) return false;
    const te = new Date(r.created_at).getTime();
    return Number.isFinite(te) && te >= tMin && te <= tMax;
  });
  const rejRow = pickLatestByCreatedAt(rejCandidates);
  if (rejRow) {
    const code = String(rejRow.reason_code ?? '—');
    const det = String(rejRow.reason_detail ?? '').trim() || '—';
    lines.push({
      id: 'rejection',
      title: copy.rejectionTitle,
      body: `reason_code: ${code}. Detail: ${det}.`,
      citation: `${copy.rejectionPath} · created_at ${fmtEvidenceTime(rejRow.created_at)} · user_id ${String(rejRow.user_id || '').slice(0, 12)}…`,
    });
  }

  const decCandidates = (executorDecisions || []).filter((d) => {
    if (!analysisUserMatchesEv(executorMatchUserId, d.user_id)) return false;
    if (!symbol_sets_overlap(symKeys, d.token || '')) return false;
    const te = new Date(d.created_at).getTime();
    return Number.isFinite(te) && te >= tMin && te <= tMax;
  });
  const decRow = pickLatestByCreatedAt(decCandidates);
  if (decRow) {
    const path = String(decRow.path || '—');
    const act = String(decRow.final_action || '—');
    const reason = String(decRow.final_reason || '—').trim() || '—';
    const cls = decRow.classification != null && String(decRow.classification).trim() !== '' ? ` · class: ${decRow.classification}` : '';
    lines.push({
      id: 'executor-decision',
      title: 'Executor decision (server log)',
      body: `path: ${path}. final_action: ${act}. final_reason: ${reason}${cls}.`,
      citation: `${copy.execPath} · created_at ${fmtEvidenceTime(decRow.created_at)} · user_id ${String(decRow.user_id || '').slice(0, 12)}…`,
    });
  }

  const hasServerRow = Boolean(rejRow) || Boolean(decRow);

  // Do not list rejections/decisions only because they are in the same GET buffer if they are outside
  // the correlation window for the analysis timestamp. Under "conf. >= threshold", that would look like
  // it explains this generation, which misleads the user because no causal link is shown correctly.

  const linesBeforeUserHints = lines.length;

  if (!hasServerRow) {
    const rejSymOtherUser = pickLatestByCreatedAt(
      (rejections || []).filter(
        (r) => symbol_sets_overlap(symKeys, r.symbol || '') && !analysisUserMatchesEv(rejectionMatchUserId, r.user_id)
      )
    );
    if (rejSymOtherUser) {
      lines.push({
        id: 'rejection-other-user',
        title: 'Rejections exist for this symbol in the buffer, but under another user_id',
        body: `Example: user_id starts with ${String(rejSymOtherUser.user_id || '').slice(0, 12)}..., reason_code ${String(rejSymOtherUser.reason_code ?? '—')}. Align the table User filter with the real analysis user_id.`,
        citation: copy.rejectionPath,
      });
    }
    const decSymOtherUser = pickLatestByCreatedAt(
      (executorDecisions || []).filter(
        (d) => symbol_sets_overlap(symKeys, d.token || '') && !analysisUserMatchesEv(executorMatchUserId, d.user_id)
      )
    );
    if (decSymOtherUser) {
      lines.push({
        id: 'executor-other-user',
        title: 'Executor decisions exist for this symbol in the buffer, but under another user_id',
        body: `Example: user_id starts with ${String(decSymOtherUser.user_id || '').slice(0, 12)}..., final_action ${String(decSymOtherUser.final_action || '—')}. Check the User field in "Executor final decisions".`,
        citation: copy.execPath,
      });
    }
  }

  if (!hasServerRow) {
    if (lines.length === 0) {
      const momentLabel = analysisMomentLabelForEvidence(sig, tSig);
      lines.push({
        id: 'no-rows',
        title: 'No correlated rejections/executor log in the displayed data',
        body:
          `For the analysis at ${momentLabel}, the responses already loaded in the panel (typically limit 50 at ${copy.noRowsPath}) **do not show** a row for the **same user + symbol** inside the time window used for correlation. ` +
          `This **does not mean** "no server reason": it usually means either the **executor cycle has not written** a row after this generation yet, the row is **older/newer** than the window, or the **GET limit** does not include it. ` +
          `The UI does not invent text - press Refresh on the lower tables or check backend/logs. ${copy.bufferFooter}.`,
        citation: copy.bufferFooter,
      });
    } else if (linesBeforeUserHints > 0) {
      lines.push({
        id: 'no-server-row',
        title: 'No new row in rejections / executor decisions (time window)',
        body: `Between ${fmtEvidenceTime(new Date(tMin).toISOString())} and ${fmtEvidenceTime(new Date(tMax).toISOString())} (UTC), there is no rejection/decision for ${symKey} and the filtered user in the buffer. Check the local lines above; if they do not apply, reload the lower tables.`,
        citation: `${copy.rejectionPath} and ${copy.execPath}`,
      });
    }
  }

  return { show: true, lines, boxLead: copy.boxLead };
}

/**
 * @param {object} p
 * @param {boolean} p.longOpenThresholdApplies
 * @param {Array} p.longFeedTokenBlocks
 * @param {Set|Array} p.longFeedSuspendSymbols
 */
export function buildLongHighConfidenceNoOpenEvidence(p) {
  const {
    longOpenThresholdApplies,
    longFeedTokenBlocks,
    longFeedSuspendSymbols,
    ...rest
  } = p;
  return buildFuturesLaneNoOpenEvidence('long', {
    ...rest,
    thresholdApplies: longOpenThresholdApplies,
    feedTokenBlocks: longFeedTokenBlocks,
    feedSuspendSymbols: longFeedSuspendSymbols,
  });
}

/**
 * @param {object} p
 * @param {boolean} p.shortOpenThresholdApplies (semnal SELL / open_short / BUY peste prag short)
 * @param {Array} p.shortFeedTokenBlocks
 * @param {Set|Array} p.shortFeedSuspendSymbols
 */
export function buildShortHighConfidenceNoOpenEvidence(p) {
  const {
    shortOpenThresholdApplies,
    shortFeedTokenBlocks,
    shortFeedSuspendSymbols,
    ...rest
  } = p;
  return buildFuturesLaneNoOpenEvidence('short', {
    ...rest,
    thresholdApplies: shortOpenThresholdApplies,
    feedTokenBlocks: shortFeedTokenBlocks,
    feedSuspendSymbols: shortFeedSuspendSymbols,
  });
}
