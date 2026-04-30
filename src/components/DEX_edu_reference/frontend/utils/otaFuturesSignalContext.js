/**
 * Separare LONG vs SHORT — GET /api/ai-trading/signals (`tradeContext` + semnal).
 *
 * **Partajat (backend):** același endpoint și aceeași sursă DB; fiecare panou cere branch-uri diferite.
 * **SHORT:** `short_live` | `short_focus`. În plus: `long_*` cu semnal de direcție SHORT (ex. `sell` pe lane
 * long în DB — bearish, afișat în panoul SHORT, nu în LONG). `common` / fără TC cu semnal SHORT sau `hold`+hint.
 * **LONG:** `long_spot` | `long_live` | `long_focus`. În plus: `trade_context=common` cu semnal LONG/neutru;
 * și `short_live` / `short_focus` când semnalul e informativ LONG (buy / hold / open_long* / …) — motorul
 * persistă uneori doar pe lane SHORT. Fără asta, analize OTA Motor dispar din panoul LONG. `long_*` rămân
 * excluse din feed SHORT (cu excepțiile deja definite pentru semnale SHORT pe document long).
 */

import { pickAnalysisEventEpochMs } from './otaAnalysisTimestamps';

/**
 * Backend poate persista `tradeContext: common` dar păstrează lane-ul cerut în body la POST /analyze
 * (ex. analyzeRequestTradeContext / metadata). Fără asta, feed SHORT exclude `buy` pe common → listă goală.
 */
function shortTradeContextHintFromRow(sig) {
  if (!sig || typeof sig !== 'object') return '';
  const meta = sig.metadata && typeof sig.metadata === 'object' ? sig.metadata : null;
  const candidates = [
    sig.requestTradeContext,
    sig.request_trade_context,
    sig.analyzeTradeContext,
    sig.analyze_trade_context,
    sig.analyzeRequestTradeContext,
    sig.analyze_request_trade_context,
    sig.persistTradeContext,
    sig.persist_trade_context,
    meta?.requestTradeContext,
    meta?.request_trade_context,
    meta?.analyzeTradeContext,
    meta?.analyze_trade_context,
    meta?.analyzeRequestTradeContext,
    meta?.persistTradeContext,
  ];
  for (const raw of candidates) {
    const v = String(raw ?? '').trim().toLowerCase();
    if (v === 'short_live' || v === 'short_focus') return v;
  }
  return '';
}

/**
 * Backend poate persista `tradeContext: common` cu intent LONG în metadata / câmpuri de request (simetric cu SHORT).
 */
function longTradeContextHintFromRow(sig) {
  if (!sig || typeof sig !== 'object') return '';
  const meta = sig.metadata && typeof sig.metadata === 'object' ? sig.metadata : null;
  const candidates = [
    sig.requestTradeContext,
    sig.request_trade_context,
    sig.analyzeTradeContext,
    sig.analyze_trade_context,
    sig.analyzeRequestTradeContext,
    sig.analyze_request_trade_context,
    sig.persistTradeContext,
    sig.persist_trade_context,
    meta?.requestTradeContext,
    meta?.request_trade_context,
    meta?.analyzeTradeContext,
    meta?.analyze_trade_context,
    meta?.analyzeRequestTradeContext,
    meta?.persistTradeContext,
  ];
  for (const raw of candidates) {
    const v = String(raw ?? '').trim().toLowerCase();
    if (v === 'long_live' || v === 'long_spot' || v === 'long_focus') return v;
  }
  return '';
}

export function normalizedTradeContext(sig) {
  if (!sig || typeof sig !== 'object') return '';
  const primary = String(sig.tradeContext ?? sig.trade_context ?? '').trim().toLowerCase();
  if (primary && primary !== 'common') return primary;
  const hinted = shortTradeContextHintFromRow(sig);
  if (hinted) return hinted;
  return primary;
}

/** Rând strict short_live (exec/mirror explicit SHORT). */
export function signalRowIsShortFuturesAnalysis(sig) {
  return normalizedTradeContext(sig) === 'short_live';
}

function normalizedOtaSignalKey(sig) {
  if (!sig || typeof sig !== 'object') return '';
  if (sig.signal != null && String(sig.signal).trim() !== '') return String(sig.signal).trim().toLowerCase();
  const fallbacks = [
    sig.action,
    sig.decision,
    sig.recommendedAction,
    sig.recommended_action,
    sig.signalType,
    sig.signal_type,
  ];
  const meta = sig.metadata && typeof sig.metadata === 'object' ? sig.metadata : null;
  if (meta) {
    fallbacks.push(meta.signal, meta.action, meta.decision);
  }
  for (const f of fallbacks) {
    if (f == null || String(f).trim() === '') continue;
    const v = String(f).trim().toLowerCase();
    if (v) return v;
  }
  return '';
}

/**
 * Hint-uri opționale din API: când `tradeContext` lipsește sau e `common`, executorul poate marca lane-ul.
 */
export function signalRowImpliesShortExecutionLane(sig) {
  if (!sig || typeof sig !== 'object') return false;
  const candidates = [
    sig.futuresLane,
    sig.futures_lane,
    sig.executionLane,
    sig.execution_lane,
    sig.executionContext,
    sig.execution_context,
    sig.lane,
    sig.metadata?.futuresLane,
    sig.metadata?.futures_lane,
    sig.metadata?.lane,
  ];
  for (const raw of candidates) {
    const v = String(raw ?? '').trim().toLowerCase();
    if (v === 'short' || v === 'short_live' || v === 'short_focus') return true;
  }
  return false;
}

/**
 * `hold` sau rând fără semnal clar pe `common` — incluzi în feed LONG dacă metadata spune lane LONG.
 * Simetric cu `signalRowImpliesShortExecutionLane`.
 */
export function signalRowImpliesLongExecutionLane(sig) {
  if (!sig || typeof sig !== 'object') return false;
  const candidates = [
    sig.futuresLane,
    sig.futures_lane,
    sig.executionLane,
    sig.execution_lane,
    sig.executionContext,
    sig.execution_context,
    sig.lane,
    sig.metadata?.futuresLane,
    sig.metadata?.futures_lane,
    sig.metadata?.lane,
  ];
  for (const raw of candidates) {
    const v = String(raw ?? '').trim().toLowerCase();
    if (v === 'long' || v === 'long_live' || v === 'long_spot' || v === 'long_focus') return true;
  }
  return false;
}

/**
 * Eligibil pentru afișare în panoul SHORT: lane explicit SHORT sau `common`/gol cu semnal SHORT / hold+hint.
 */
export function signalRowIsShortPanelFeed(sig) {
  const c = normalizedTradeContext(sig);
  if (c === 'short_live' || c === 'short_focus') return true;
  const sk = normalizedOtaSignalKey(sig);
  if (c === 'common' || c === '') {
    if (otaSignalIsLongManagementOrEntry(sig)) return false;
    if (otaSignalIsShortDirection(sig)) return true;
    if ((sk === 'hold' || sk === '') && signalRowImpliesShortExecutionLane(sig)) return true;
    return false;
  }
  return false;
}

/**
 * Semnale strict LONG (fără `buy`) — ascunse din feed SHORT.
 * `buy` e tratat separat în `filterSignalsForShortFuturesFeed` (tot LONG în semantica LLM spot).
 */
export function otaSignalIsLongDirection(sig) {
  const sk = normalizedOtaSignalKey(sig);
  return sk === 'open_long' || sk === 'swap' || sk === 'open_buy';
}

/** Semnale de direcție SHORT — nu se afișează în feed-ul panoului LONG. */
export function otaSignalIsShortDirection(sig) {
  const sk = normalizedOtaSignalKey(sig);
  if (sk === 'sell' || sk === 'open_short') return true;
  if (sk === 'close_short' || sk.startsWith('close_short')) return true;
  return false;
}

/**
 * Rânduri `long_*` — folosit doar în teste / diagnostice; **nu** mai intră în feed SHORT (vezi `filterSignalsForShortFuturesFeed`).
 */
export function signalRowIsShortRelevantLongContext(sig) {
  const c = normalizedTradeContext(sig);
  return c === 'long_live' || c === 'long_spot' || c === 'long_focus';
}

/**
 * Rând strict LONG (fără common): exec/mirror explicit long_spot sau long_live.
 * `long_focus` nu e în mod normal valoare DB — e doar filtru API (include long_spot + long_live + common).
 */
export function signalRowIsLongFuturesAnalysis(sig) {
  const c = normalizedTradeContext(sig);
  return c === 'long_spot' || c === 'long_live';
}

/**
 * Eligibil pentru afișare în panoul LONG: doar lane explicit LONG (nu `common`).
 */
export function signalRowIsLongPanelFeed(sig) {
  const c = normalizedTradeContext(sig);
  return c === 'long_spot' || c === 'long_live' || c === 'long_focus';
}

/**
 * Rânduri `short_*` cu semnal LONG/neutru — folosit doar în teste; **nu** mai intră în feed LONG.
 */
export function signalRowIsLongRelevantShortContext(sig) {
  const c = normalizedTradeContext(sig);
  if (c !== 'short_live' && c !== 'short_focus') return false;
  const sk = normalizedOtaSignalKey(sig);
  if (sk === 'buy' || sk === 'open_long' || sk === 'open_long_futures' || sk === 'swap' || sk === 'open_buy') return true;
  if (sk === 'hold' || sk === '') return true;
  return false;
}

/** Semnale care țin de poziția / ciclul LONG — interzise în feed-ul panoului SHORT. */
function otaSignalIsLongManagementOrEntry(sig) {
  const sk = normalizedOtaSignalKey(sig);
  if (otaSignalIsLongDirection(sig)) return true;
  if (sk === 'buy' || sk === 'open_long_futures') return true;
  if (sk.startsWith('close_long')) return true;
  return false;
}

/**
 * Pe lane `short_live` / `short_focus`: motorul unificat poate returna încă `buy` (spot) — îl afișăm ca informativ.
 * Rămân ascunse explicit intrările/managementul LONG (open_long, swap, open_buy, close_long*).
 */
function otaSignalIsLongExclusiveOnShortLane(sig) {
  const sk = normalizedOtaSignalKey(sig);
  if (sk === 'open_long' || sk === 'swap' || sk === 'open_buy') return true;
  if (sk === 'open_long_futures') return true;
  if (sk.startsWith('close_long')) return true;
  return false;
}

/**
 * Lane pentru filtrul feed SHORT: dacă GET a fost `?tradeContext=short_live` dar rândul DB e încă
 * `common` + `buy`, `normalizedTradeContext` rămâne common și îl exclude greșit. Panoul pune
 * `_otaSignalsQueryBranch` pe fiecare rând la merge — aceasta are prioritate față de `common` gol.
 * Rândurile cu `long_*` pe document rămân excluse (nu suprascriem lane-ul LONG).
 */
function tradeContextForShortFeedFilter(sig) {
  const doc = normalizedTradeContext(sig);
  if (doc === 'long_live' || doc === 'long_spot' || doc === 'long_focus') return doc;
  const br = String(sig?._otaSignalsQueryBranch || '').trim().toLowerCase();
  if (br === 'short_live' || br === 'short_focus') return br;
  return doc;
}

/**
 * Lane pentru filtrul feed LONG: GET `?tradeContext=long_spot` / `long_focus` poate returna rânduri cu
 * `tradeContext: common` în DB — `_otaSignalsQueryBranch` + hint-uri din rând promovează lane-ul pentru filtru.
 */
function tradeContextForLongFeedFilter(sig) {
  const doc = normalizedTradeContext(sig);
  if (doc === 'long_live' || doc === 'long_spot' || doc === 'long_focus') return doc;
  const br = String(sig?._otaSignalsQueryBranch || '').trim().toLowerCase();
  if (br === 'long_spot' || br === 'long_live' || br === 'long_focus') return br;
  const longHint = longTradeContextHintFromRow(sig);
  if (longHint) return longHint;
  return doc;
}

export function filterSignalsForShortFuturesFeed(signals) {
  return (signals || []).filter((s) => {
    const docLane = normalizedTradeContext(s);
    if (docLane === 'long_live' || docLane === 'long_spot' || docLane === 'long_focus') {
      if (otaSignalIsShortDirection(s)) return true;
      return false;
    }

    const c = tradeContextForShortFeedFilter(s);
    const sk = normalizedOtaSignalKey(s);

    if (c === 'short_live' || c === 'short_focus') {
      if (otaSignalIsLongExclusiveOnShortLane(s)) return false;
      return true;
    }

    if (c === 'common' || c === '') {
      if (otaSignalIsLongManagementOrEntry(s)) return false;
      if (otaSignalIsShortDirection(s)) return true;
      if ((sk === 'hold' || sk === '') && signalRowImpliesShortExecutionLane(s)) return true;
      return false;
    }

    return false;
  });
}

export function filterSignalsForLongFuturesFeed(signals) {
  return (signals || []).filter((s) => {
    const docLane = normalizedTradeContext(s);
    const sk = normalizedOtaSignalKey(s);

    if (docLane === 'short_live' || docLane === 'short_focus') {
      if (!signalRowIsLongRelevantShortContext(s)) return false;
      if (sk.startsWith('open_short') || sk.startsWith('close_short')) return false;
      if (otaSignalIsShortDirection(s)) return false;
      return true;
    }

    const c = tradeContextForLongFeedFilter(s);

    if (c === 'long_spot' || c === 'long_live' || c === 'long_focus') {
      if (sk.startsWith('open_short') || sk.startsWith('close_short')) return false;
      if (otaSignalIsShortDirection(s)) return false;
      return true;
    }

    if (c === 'common' || c === '') {
      if (otaSignalIsShortDirection(s)) return false;
      if (sk.startsWith('open_short') || sk.startsWith('close_short')) return false;
      if (otaSignalIsLongManagementOrEntry(s)) return true;
      if (sk === 'buy' || sk === 'hold') return true;
      if (signalRowImpliesLongExecutionLane(s)) return true;
      if (sk === '' && longTradeContextHintFromRow(s)) return true;
      return false;
    }

    return false;
  });
}

const PERP_QUOTE_SUFFIXES = ['USDT', 'USDC', 'BUSD', 'FDUSD', 'TUSD', 'BNB'];

/**
 * Transformă "ETHUSDT" / "ETH-USDT" → "ETH"; lasă "ETH" nemodificat.
 * @param {string} raw
 * @returns {string} Uppercase compact sau ''.
 */
function compactBaseFromPerpLikeSymbol(raw) {
  if (raw == null || String(raw).trim() === '') return '';
  const p = String(raw)
    .trim()
    .toUpperCase()
    .replace(/[-/:]/g, '');
  if (!p) return '';
  for (const q of PERP_QUOTE_SUFFIXES) {
    if (p.endsWith(q) && p.length > q.length) return p.slice(0, -q.length);
  }
  return p;
}

/**
 * Simbol de bază pentru un rând din GET /ai-trading/signals (token / symbol / base / derivat din pair DOGEUSDT).
 * Dacă `symbol` e pereche (ex. ETHUSDT), o reduce la baza din allowlist (ETH) — altfel filtrul pe allowlist poate goli feed-ul.
 * @param {object} sig
 * @returns {string} Uppercase sau ''.
 */
export function signalRowBaseToken(sig) {
  if (!sig || typeof sig !== 'object') return '';
  const raw =
    sig.token ??
    sig.baseSymbol ??
    sig.base_symbol ??
    sig.tokenSymbol ??
    sig.token_symbol ??
    sig.symbol ??
    sig.base ??
    sig.baseAsset ??
    sig.asset ??
    sig.coin;
  if (raw != null && String(raw).trim() !== '') {
    return compactBaseFromPerpLikeSymbol(raw);
  }
  const pair = sig.pair ?? sig.pairSymbol ?? sig.symbolPair;
  if (pair != null && String(pair).trim() !== '') {
    return compactBaseFromPerpLikeSymbol(pair);
  }
  return '';
}

/**
 * Îmbină două liste de rânduri signals (ex. short_live + common), dedupe după id / analysisId / (token+time+semnal).
 */
export function mergeTwoOtaSignalLists(signalsA, signalsB) {
  const list = [...(signalsA || []), ...(signalsB || [])];
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
        const tok = signalRowBaseToken(sig) || '—';
        const ms = pickAnalysisEventEpochMs(sig);
        const cyc = sig?.cycleId ?? sig?.cycle_id ?? '';
        key = `${tok}|${ms}|${normalizedOtaSignalKey(sig)}|${cyc}`;
      }
    }
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(sig);
  }
  out.sort((a, b) => pickAnalysisEventEpochMs(b) - pickAnalysisEventEpochMs(a));
  return out;
}

/** Dedupe afișare feed — același ciclu mirror poate produce două id-uri. */
export function dedupeOtaSignalsForFeed(signals) {
  const seen = new Set();
  const out = [];
  for (const sig of signals || []) {
    const tok = signalRowBaseToken(sig) || '';
    const ms = pickAnalysisEventEpochMs(sig);
    const sec = Number.isFinite(ms) && ms > 0 ? Math.floor(ms / 1000) : 0;
    const sk = normalizedOtaSignalKey(sig);
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

/**
 * Timp sortare „ultimul rând” pentru debug (simbol ascuns).
 * @param {object} sig
 * @returns {number}
 */
function pickMaxSignalTimeMs(sig) {
  const raw = sig?.createdAt ?? sig?.created_at ?? null;
  if (raw != null && raw !== '') {
    const t = new Date(raw).getTime();
    if (Number.isFinite(t)) return t;
  }
  const id = sig?.id;
  if (id != null && Number.isFinite(Number(id))) return Number(id);
  return 0;
}

/**
 * Lista simbolurilor care au rânduri după allowlist, dar sunt scoase din feed de suspend LLM sau blocare token.
 * Fiecare intrare: token, motive lizibile, opțional deadline blocare.
 *
 * @param {object} p
 * @param {Array<object>} p.signalsAfterAllowlist
 * @param {Set<string>|Iterable<string>} p.suspendSymbolSet
 * @param {Array<object>} [p.tokenBlocks]
 * @param {(sig: object) => string|null|undefined} p.tokenFromSignal
 * @param {(b: object) => boolean} p.isTokenBlockActive
 * @param {(b: object) => string|null|undefined} p.symbolFromBlock
 * @param {string} p.suspendReasonLabel
 * @param {string} p.blockReasonLabel
 * @param {Array<object>} [p.signalsAfterUserGating] — output după suspend/block; dacă e array, „ascuns” = token din allowlist care nu apare aici.
 * @returns {Array<{ token: string, reasons: Array<{ code: string, text: string, blockedUntil?: string|null }>, latestSignalSampleMs: number }>}
 */
export function buildFuturesFeedHiddenByGatingDebug({
  signalsAfterAllowlist,
  signalsAfterUserGating,
  suspendSymbolSet,
  tokenBlocks,
  tokenFromSignal,
  isTokenBlockActive,
  symbolFromBlock,
  suspendReasonLabel,
  blockReasonLabel,
}) {
  const susp =
    suspendSymbolSet instanceof Set
      ? suspendSymbolSet
      : new Set(suspendSymbolSet ? [...suspendSymbolSet] : []);
  const byToken = new Map();
  for (const sig of signalsAfterAllowlist || []) {
    const t = String(tokenFromSignal(sig) || '')
      .trim()
      .toUpperCase();
    if (!t) continue;
    const ms = pickMaxSignalTimeMs(sig);
    const cur = byToken.get(t);
    if (!cur || ms >= cur.latestSignalSampleMs) {
      byToken.set(t, { latestSignalSampleMs: Math.max(cur?.latestSignalSampleMs ?? 0, ms) });
    }
  }
  const useVisibleDiff = Array.isArray(signalsAfterUserGating);
  const tokensShown = new Set();
  if (useVisibleDiff) {
    for (const sig of signalsAfterUserGating) {
      const t = String(tokenFromSignal(sig) || '')
        .trim()
        .toUpperCase();
      if (t) tokensShown.add(t);
    }
  }
  const rows = [];
  for (const [token, meta] of byToken) {
    const reasons = [];
    if (susp.has(token)) {
      reasons.push({ code: 'suspend_openai', text: suspendReasonLabel });
    }
    const activeBlock = (tokenBlocks || []).find(
      (b) => isTokenBlockActive(b) && String(symbolFromBlock(b) || '').trim().toUpperCase() === token
    );
    if (activeBlock) {
      reasons.push({
        code: 'token_block',
        text: blockReasonLabel,
        blockedUntil: activeBlock.blocked_until ?? activeBlock.blockedUntil ?? null,
      });
    }
    const hiddenByDiff = useVisibleDiff && !tokensShown.has(token);
    if (useVisibleDiff) {
      if (!hiddenByDiff) continue;
      if (reasons.length === 0) {
        reasons.push({
          code: 'unknown_or_stale_gating',
          text:
            'Rows hidden from feed: the snapshot does not show LLM suspend or a block for this symbol. Press "Refresh analyses"; verify User filter = the wallet where you lifted suspend.',
        });
      }
    } else if (reasons.length === 0) {
      continue;
    }
    rows.push({ token, reasons, latestSignalSampleMs: meta.latestSignalSampleMs });
  }
  rows.sort((a, b) => {
    const ms = (b.latestSignalSampleMs || 0) - (a.latestSignalSampleMs || 0);
    if (ms !== 0) return ms;
    return a.token.localeCompare(b.token);
  });
  return rows;
}
