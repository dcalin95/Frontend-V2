/**
 * Parsare GET /api/ai-trading/ready — inclusiv 503 not_ready (body JSON cu checks).
 * @param {unknown} data
 * @returns {{ fetchOk: boolean, status: string|null, reason: string|null, openaiKeyConfigured: boolean|null, openaiLlmEnabled: boolean|null, circuitBreaker: string|null }}
 */
export function parseOtaTradingReadyPayload(data) {
  const base = {
    fetchOk: true,
    status: null,
    reason: null,
    openaiKeyConfigured: null,
    openaiLlmEnabled: null,
    circuitBreaker: null,
  };
  if (data == null || typeof data !== 'object') {
    return { ...base };
  }
  const checks = data.checks && typeof data.checks === 'object' ? data.checks : null;
  return {
    fetchOk: true,
    status: typeof data.status === 'string' ? data.status : null,
    reason: typeof data.reason === 'string' ? data.reason : null,
    openaiKeyConfigured: checks && typeof checks.openai === 'boolean' ? checks.openai : null,
    openaiLlmEnabled: checks && typeof checks.openaiLlmEnabled === 'boolean' ? checks.openaiLlmEnabled : null,
    circuitBreaker: checks && checks.circuitBreaker != null ? String(checks.circuitBreaker) : null,
  };
}

/**
 * Parsează checks.openaiLlmEnabled din GET /ai-trading/ready (backend: OTA_OPENAI_LLM_ENABLED).
 * @param {unknown} data - JSON răspuns ready (inclusiv la 503 poate conține checks)
 * @returns {boolean|null} null dacă lipsă sau non-boolean
 */
export function getOpenAiLlmEnabledFromReadyPayload(data) {
  const v = parseOtaTradingReadyPayload(data).openaiLlmEnabled;
  return typeof v === 'boolean' ? v : null;
}
