/**
 * Values for dual confidence display on OTA cards (Long/Short ops).
 * API source: GET /api/ai-trading/signals - fields `confidence`, `confidenceOtaGrounded`,
 * `llmConfidenceIgnored`, `agentFinishCompleted`, `agentFinalReason`, `analysisSource`.
 */

/**
 * Some API rows send confidence as a 0-1 fraction (0.45), others as a 1-100 percent (45).
 * UI displays with `Math.round(v * 100)`; without normalization, 45 becomes "4500%".
 */
export function normalizeOtaConfidenceToUnit(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return x;
  if (x > 1 && x <= 100) return x / 100;
  return x;
}

/** Analysis without a paid OpenAI call (engine / skip LLM). Do not show the "grounded" label as if it were post-LLM. */
export function isMotorOtaAnalysisSource(sig) {
  const s = String(sig?.analysisSource ?? '').trim().toLowerCase();
  if (s === 'motor_ota' || s === 'engine_no_openai' || s.startsWith('engine_no_openai')) return true;
  if (s.startsWith('openai:')) return false;
  return false;
}

const AGENT_FINAL_REASON_HINT_RO = {
  insufficient_grounded_evidence: 'ungrounded / invalid finish',
  market_data_timeout: 'market data timeout',
  agent_tool_timeout: 'agent tool timeout',
  agent_timeout: 'timeout agent',
  token_analysis_timeout: 'analysis timeout',
  short_token_manual_block: 'manual SHORT block',
  long_token_manual_block: 'manual LONG block',
  both_token_manual_block: 'manual SHORT and LONG block',
};

export function pickGroundedConfidence(sig, derivedConfidence) {
  const g = sig?.confidenceOtaGrounded;
  if (g != null && Number.isFinite(Number(g))) {
    return normalizeOtaConfidenceToUnit(Number(g));
  }
  return normalizeOtaConfidenceToUnit(Number(derivedConfidence));
}

export function pickLlmIgnoredConfidence(sig) {
  const v = sig?.llmConfidenceIgnored;
  if (v != null && Number.isFinite(Number(v))) {
    return normalizeOtaConfidenceToUnit(Number(v));
  }
  return null;
}

/** Text for the "LLM · ignored (finish)" row: API % or explanation from agentFinishCompleted / agentFinalReason. */
export function formatLlmIgnoredRow(sig) {
  const llm = pickLlmIgnoredConfidence(sig);
  if (llm != null) return `${Math.round(llm * 100)}%`;
  const reason = sig?.agentFinalReason != null ? String(sig.agentFinalReason).trim() : '';
  const finished = sig?.agentFinishCompleted;
  if (reason && AGENT_FINAL_REASON_HINT_RO[reason]) {
    return `no % · ${AGENT_FINAL_REASON_HINT_RO[reason]}`;
  }
  if (reason) {
    return `no % · ${reason}`;
  }
  if (finished === false) {
    return 'no % · no anchored finish()';
  }
  if (finished === true) {
    return 'no % · finish without LLM confidence';
  }
  return '— (no API data)';
}
