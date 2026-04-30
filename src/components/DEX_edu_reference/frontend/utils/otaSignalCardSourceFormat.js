/**
 * Source + cost on GET /ai-trading/signals feed cards (Long/Short ops).
 * Uses analysisSource / reasoning from API and does not infer "free engine"
 * when reasoning shows OpenAI failure text.
 */

import { isMotorOtaAnalysisSource } from './otaSignalDualConfidence';
import { pickAnalysisEventEpochMs } from './otaAnalysisTimestamps';
import {
  OTA_ANALYZE_LLM_WITH_OPENAI,
  OTA_ANALYZE_LLM_OTA_BITS_ONLY,
  OTA_ANALYZE_LLM_ANTHROPIC,
} from './otaAnalysisModePreference';

/**
 * Conservative heuristic for OpenAI 429 / quota / billing text in free-form reasoning.
 * @param {unknown} text
 * @returns {boolean}
 */
export function looksLikeOpenAiApiFailureText(text) {
  if (text == null) return false;
  const t = String(text).toLowerCase();
  const mentionsOpenAi = t.includes('openai');
  const has429 = /\b429\b/.test(t);
  const quota =
    t.includes('quota') ||
    t.includes('billing') ||
    t.includes('insufficient_quota') ||
    t.includes('rate_limit') ||
    t.includes('rate limit');
  if (t.includes('insufficient_quota') || t.includes('rate_limit_exceeded')) return true;
  if (t.includes('https://platform.openai.com')) return true;
  if (has429 && (mentionsOpenAi || quota)) return true;
  if (mentionsOpenAi && quota) return true;
  return false;
}

/**
 * Removes OpenAI failure lines from reasoning when an OTA engine row picked up
 * old 429/billing text from aggregated DB content.
 * @param {unknown} text
 * @returns {string}
 */
export function stripOpenAiFailureSegmentsFromReasoningText(text) {
  if (text == null || typeof text !== 'string') return '';
  const normalized = String(text).replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const kept = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') {
      kept.push('');
      continue;
    }
    if (looksLikeOpenAiApiFailureText(trimmed)) continue;
    kept.push(line);
  }
  const out = kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!out && normalized.trim()) {
    return '(Mesaje cota/429 OpenAI eliminate din afisare - rand clasificat ca motor OTA, fara apel LLM in acest ciclu.)';
  }
  return out;
}

function isOpenAiStyleAnalysisSource(analysisSource) {
  const s = String(analysisSource || '').trim();
  if (!s) return false;
  if (s === 'openai_decides' || s === 'openai_full' || s === 'engine_with_explanation') return true;
  if (s.startsWith('openai:')) return true;
  if (s.startsWith('anthropic:')) return true;
  return false;
}

/**
 * costUsd / costEstimate din API pot veni ca string (inclusiv „0,02”).
 * @param {unknown} raw
 * @returns {number|null}
 */
export function parseUsdNumberLoose(raw) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  const s = String(raw).trim().replace(/\s/g, '').replace(/,/g, '.');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** @param {number} cost */
function formatSignalUsd(cost) {
  if (!Number.isFinite(cost) || cost <= 0) return null;
  // ≥ 1¢: afișare ca în billing (ex. 0.02 USD); sub 1¢: patru zecimale ca să nu rotunjim la 0.00
  if (cost >= 0.01) return `$${cost.toFixed(2)}`;
  return `$${cost.toFixed(4)}`;
}

/**
 * GET /signals trimite uneori doar total numeric; POST /analyze poate trimite obiect { totalTokens }.
 * @param {unknown} tu
 * @returns {number|null}
 */
export function pickTotalTokensFromUsageValue(tu) {
  if (tu != null && typeof tu === 'object' && !Array.isArray(tu)) {
    const n = Number(tu.totalTokens ?? tu.total_tokens ?? 0);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
  }
  const n = Number(tu);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

/**
 * @param {object} sig - row from signals API
 * @param {{ uiPreferredMode?: string }} [opts] - mode from FuturesOpsPeerNav toggle
 * @returns {{
 *   sourceLabel: string,
 *   sourceColor: string,
 *   costLabel: string,
 *   tokensLabel: string|null,
 *   isOpenAi: boolean,
 *   isOpenAiBillingError: boolean,
 *   uiMismatchNote: string|null,
 * }}
 */
export function formatCostAndSourceForSignalCard(sig, opts = {}) {
  const uiPreferredMode = opts.uiPreferredMode;
  const cost = parseUsdNumberLoose(sig?.costUsd);
  const tokens = pickTotalTokensFromUsageValue(sig?.tokenUsage);
  const reasoning = sig?.reasoning != null ? String(sig.reasoning) : '';
  const analysisSource = sig?.analysisSource != null ? String(sig.analysisSource).trim() : '';
  const skipReason = sig?.skipOpenAIReason != null ? String(sig.skipOpenAIReason).trim() : '';
  const paidOpenAi =
    (Number.isFinite(cost) && cost > 0) ||
    (tokens != null && tokens > 0) ||
    sig?.costSource === 'openai_platform_pending';

  let sourceLabel;
  let sourceColor;
  let costLabel;
  let tokensLabelOut = tokens != null ? `${tokens} tok` : null;
  let isOpenAi = false;
  let isOpenAiBillingError = false;

  if (paidOpenAi) {
    isOpenAi = true;
    const srcLower = analysisSource.toLowerCase();
    const isAnthropic =
      srcLower.startsWith('anthropic:') || /claude/i.test(String(sig?.model || ''));
    sourceLabel = isAnthropic
      ? sig?.model && sig.model !== 'agent' && sig.model !== 'standard'
        ? `Claude · ${sig.model}`
        : 'Claude · agent'
      : sig?.model && sig.model !== 'agent' && sig.model !== 'standard'
        ? `OpenAI · ${sig.model}`
        : 'OpenAI · agent';
    sourceColor = isAnthropic ? '#c4b5fd' : '#fbbf24';
    if (sig?.costSource === 'openai_platform_pending') {
      costLabel = 'platform pending';
    } else if (sig?.costSource === 'openai_platform' && Number.isFinite(cost) && cost > 0) {
      costLabel = `${formatSignalUsd(cost)} (platform)`;
    } else if (sig?.costSource === 'estimate' && Number.isFinite(cost) && cost > 0) {
      costLabel = `~${formatSignalUsd(cost)} (estimate)`;
    } else if (sig?.costSource === 'llm_ledger' && Number.isFinite(cost) && cost > 0) {
      costLabel = `${formatSignalUsd(cost)} (ledger)`;
    } else {
      const hasTokensWithoutUsd = tokens != null && tokens > 0 && !(Number.isFinite(cost) && cost > 0);
      costLabel = Number.isFinite(cost) && cost > 0
        ? formatSignalUsd(cost)
        : hasTokensWithoutUsd
          ? 'USD pending'
          : 'unavailable';
    }
  } else if (
    skipReason === 'engine_no_openai_request' ||
    isMotorOtaAnalysisSource(sig)
  ) {
    sourceLabel = 'Motor OTA (fara apel LLM platit)';
    sourceColor = '#34d399';
    costLabel = 'free';
    tokensLabelOut = null;
  } else if (looksLikeOpenAiApiFailureText(reasoning)) {
    isOpenAiBillingError = true;
    sourceLabel = 'OpenAI · eroare cota / billing (fara consum inregistrat)';
    sourceColor = '#fb923c';
    costLabel = 'not billed';
    tokensLabelOut = null;
  } else if (isOpenAiStyleAnalysisSource(analysisSource) && !paidOpenAi) {
    sourceLabel = analysisSource.startsWith('openai:')
      ? `OpenAI · ${analysisSource.replace(/^openai:/, '') || 'LLM'}`
      : `OpenAI · ${analysisSource}`;
    sourceColor = '#eab308';
    costLabel = 'unavailable (no usage in DB)';
    tokensLabelOut = null;
  } else if (analysisSource) {
    sourceLabel = `API source: ${analysisSource}`;
    sourceColor = '#94a3b8';
    costLabel = 'unavailable';
  } else {
    sourceLabel = 'Source unavailable in card (see reasoning / network)';
    sourceColor = '#94a3b8';
    costLabel = 'unavailable';
  }

  let uiMismatchNote = null;
  if (uiPreferredMode === OTA_ANALYZE_LLM_OTA_BITS_ONLY) {
    const cardLooksOpenAiTrack =
      paidOpenAi ||
      isOpenAiBillingError ||
      isOpenAiStyleAnalysisSource(analysisSource);
    if (cardLooksOpenAiTrack) {
      uiMismatchNote =
        'Comutator: "Doar OTA BITS" - analizele noi din acest browser trimit fara OpenAI. Acest card poate fi din istoric sau cicluri server (OpenAI posibil).';
    }
  } else if (uiPreferredMode === OTA_ANALYZE_LLM_WITH_OPENAI) {
    if (isMotorOtaAnalysisSource(sig) || skipReason === 'engine_no_openai_request') {
      uiMismatchNote =
        'Comutator: "Cu OpenAI" - acest rand e salvat ca rulare fara LLM (engine-only) in acel ciclu.';
    }
  } else if (uiPreferredMode === OTA_ANALYZE_LLM_ANTHROPIC) {
    if (isMotorOtaAnalysisSource(sig) || skipReason === 'engine_no_openai_request') {
      uiMismatchNote =
        'Comutator: "Claude" - acest card din feed poate fi din ciclu engine-only sau istoric; analiza noua din browser foloseste /api/claude.';
    }
  }

  return {
    sourceLabel,
    sourceColor,
    costLabel,
    tokensLabel: tokensLabelOut,
    isOpenAi,
    isOpenAiBillingError,
    uiMismatchNote,
  };
}

const DEFAULT_OTA_SIGNAL_STALE_AFTER_MS = 10 * 60 * 1000;

/**
 * Short notes that separate stored card content from current market status.
 * @param {unknown} createdAtRaw - e.g. `sig.createdAt` from API
 * @param {{ staleAfterMs?: number }} [opts]
 * @returns {{ primary: string, staleSecondary: string|null }}
 */
export function getOtaSignalSnapshotFreshnessNote(createdAtRaw, opts = {}) {
  const staleAfterMs = opts.staleAfterMs ?? DEFAULT_OTA_SIGNAL_STALE_AFTER_MS;
  const t = createdAtRaw != null ? new Date(createdAtRaw).getTime() : NaN;
  if (!Number.isFinite(t)) {
    return {
      primary:
        'Rand din istoric: rubrica, reasoning, cost si citarile reflecta ce s-a salvat in DB - nu "piata acum". Liniile "live symbol" / gate folosesc regulile curente.',
      staleSecondary: null,
    };
  }
  const abs = new Date(t).toLocaleString('ro-RO', { dateStyle: 'short', timeStyle: 'medium' });
  const ageMs = Date.now() - t;
  const staleMinutes = Math.max(1, Math.round(staleAfterMs / 60000));
  const primary = `Analiza si cost pe card = snapshot la ${abs}; nu inseamna pret sau decizie din acest minut. "live symbol" = allowlist curenta.`;
  if (ageMs <= staleAfterMs) {
    return { primary, staleSecondary: null };
  }
  return {
    primary,
    staleSecondary: `Vechime >${staleMinutes} min: pretul si contextul pietei s-au putut schimba - verifica grafice / feed live pentru acum.`,
  };
}

/**
 * Acelasi timp de generare ca sortarea feed-ului / OtaAnalysisTimeBlock (`created_at` sau `createdAt`).
 * Evita mesajul „fara timestamp” cand API trimite doar snake_case.
 * @param {Record<string, unknown>|null|undefined} sig
 * @param {{ staleAfterMs?: number }} [opts]
 */
export function getOtaSignalSnapshotFreshnessNoteFromSig(sig, opts = {}) {
  const ms = pickAnalysisEventEpochMs(sig);
  const raw = ms > 0 ? new Date(ms).toISOString() : null;
  return getOtaSignalSnapshotFreshnessNote(raw, opts);
}
