/**
 * SSOT: user-facing English labels for OTA / LLM / providers (no internal jargon in primary strings).
 * Technical raw values stay available via getTechnicalAnalysisSourceRaw() for expandable "Technical details".
 */

export const LABEL_OPENAI = 'OpenAI';
export const LABEL_CLAUDE = 'Claude (Anthropic)';
export const LABEL_OTA_ENGINE = 'OTA Engine';

/** Section / context badges */
export const LABEL_LIVE_ANALYSIS = 'Live Analysis';
export const LABEL_SIGNAL_HISTORY = 'Historical Signal';
export const LABEL_TRACE = 'Trace';
export const LABEL_TECHNICAL_DETAILS = 'Technical details';

/**
 * Primary display label for `analysisSource` from API (signals, analyze payload).
 * @param {unknown} raw
 * @returns {string}
 */
export function mapAnalysisSourceToPrimaryLabel(raw) {
  if (raw == null || String(raw).trim() === '') return '—';
  const s = String(raw).trim();
  const lower = s.toLowerCase();

  if (lower === 'openai_decides' || lower === 'openai_full') return LABEL_OPENAI;
  /** The engine decides the transaction; OpenAI only explains it. Both are active, but this differs from openai_decides. */
  if (lower === 'engine_with_explanation') return `${LABEL_OTA_ENGINE} + ${LABEL_OPENAI}`;
  if (lower === 'engine_no_openai') return LABEL_OTA_ENGINE;
  if (lower === 'motor_ota') return LABEL_OTA_ENGINE;
  if (lower === 'anthropic_claude_sonnet' || lower.startsWith('anthropic_claude')) return LABEL_CLAUDE;

  if (lower.startsWith('openai:')) {
    const rest = s.slice(s.indexOf(':') + 1).trim();
    return rest ? `${LABEL_OPENAI} · ${rest}` : LABEL_OPENAI;
  }

  return s;
}

/**
 * Raw value for technical details expander (verbatim from API).
 * @param {unknown} raw
 * @returns {string}
 */
export function getTechnicalAnalysisSourceRaw(raw) {
  if (raw == null) return '';
  return String(raw).trim();
}

/**
 * One-line product explanation for the current analyze result (not raw enum).
 * @param {unknown} raw
 * @returns {string}
 */
export function describeAnalysisSourceForUser(raw) {
  if (raw == null || String(raw).trim() === '') return 'Source not reported for this response.';
  const s = String(raw).trim().toLowerCase();
  if (s === 'openai_decides') return 'OpenAI produced the signal; execution may still be gated by policy.';
  if (s === 'openai_full') return 'OpenAI full path (minimal candles); not a validated research report.';
  if (s === 'engine_with_explanation') return 'OTA Engine decided the trade; OpenAI provided the explanation.';
  if (s === 'engine_no_openai') return 'OTA Engine only; OpenAI was skipped for this run (thresholds / policy).';
  if (s === 'anthropic_claude_sonnet' || s.startsWith('anthropic_claude'))
    return 'Claude produced or shaped this output (server path).';
  if (s.startsWith('openai:')) return 'OpenAI model call; see Technical details for the exact model id.';
  return 'See Technical details for how this run was produced.';
}

/**
 * Short English explanation for OTA strips / tooltips, with the same semantics as describeAnalysisSourceForUser.
 * @param {unknown} raw
 * @returns {string}
 */
export function describeAnalysisSourceForUserRo(raw) {
  if (raw == null || String(raw).trim() === '') return '';
  const s = String(raw).trim().toLowerCase();
  if (s === 'openai_decides') return 'OpenAI produced the signal; execution may still be blocked by policy/guardrails.';
  if (s === 'openai_full') return 'Full OpenAI flow (minimal data); not a validated research report.';
  if (s === 'engine_with_explanation')
    return 'The OTA Engine makes the trade decision; OpenAI only generates the explanatory text and does not decide instead of the engine.';
  if (s === 'engine_no_openai') return 'OTA Engine only; OpenAI was skipped for this run because of thresholds or policy.';
  if (s === 'anthropic_claude_sonnet' || s.startsWith('anthropic_claude'))
    return 'Claude on the server generated or shaped the result.';
  if (s.startsWith('openai:')) return 'OpenAI call; see technical details for the exact model.';
  return 'See technical details for how this run was produced.';
}

/**
 * Primary English label for LIVE strip data origin (OTA / OpenAI / Anthropic).
 * Does not replace `mapAnalysisSourceToPrimaryLabel` used in other panels.
 * @param {unknown} raw - analysisSource from API
 * @returns {string}
 */
export function mapAnalysisSourceToDataOriginRo(raw) {
  if (raw == null || String(raw).trim() === '') return '—';
  const s = String(raw).trim();
  const lower = s.toLowerCase();

  if (lower === 'anthropic_claude_sonnet' || lower.startsWith('anthropic_claude')) {
    return 'Data from Anthropic';
  }
  if (lower === 'openai_decides' || lower === 'openai_full' || lower.startsWith('openai:')) {
    return 'Data from OpenAI';
  }
  if (lower === 'engine_with_explanation') {
    return 'Data from OTA and OpenAI';
  }
  if (lower === 'engine_no_openai' || lower === 'motor_ota') {
    return 'Data from OTA';
  }

  return s;
}
