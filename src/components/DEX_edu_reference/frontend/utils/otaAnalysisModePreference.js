/**
 * Preferință UI: OpenAI vs Anthropic Claude vs doar motor OTA (BITS), pentru analiză din browser.
 * Persistă în localStorage. Executorul citește `llm_tuning.analyzeLlmMode` din `ota.auto_risk_preferences`
 * (salvat prin POST /ai-trading/policy/llm-tuning când wallet e conectat din FuturesOpsPeerNav).
 * Modul Claude este doar în browser (POST /api/claude); policy server rămâne with_openai | ota_bits_only.
 */

export const OTA_ANALYZE_LLM_WITH_OPENAI = 'with_openai';
export const OTA_ANALYZE_LLM_OTA_BITS_ONLY = 'ota_bits_only';
/** Analiză prin backend /api/claude (Anthropic), separat de OpenAI. */
export const OTA_ANALYZE_LLM_ANTHROPIC = 'anthropic_claude';

const STORAGE_KEY = 'bits_ota_futures_analyze_llm';
export const OTA_FUTURES_ANALYZE_LLM_CHANGE = 'bits-ota-futures-llm-mode-changed';

/** @returns {typeof OTA_ANALYZE_LLM_WITH_OPENAI | typeof OTA_ANALYZE_LLM_OTA_BITS_ONLY | typeof OTA_ANALYZE_LLM_ANTHROPIC} */
export function getOtaFuturesAnalyzeLlmMode() {
  try {
    const v = String(window.localStorage.getItem(STORAGE_KEY) || '').trim();
    if (v === OTA_ANALYZE_LLM_OTA_BITS_ONLY) return OTA_ANALYZE_LLM_OTA_BITS_ONLY;
    if (v === OTA_ANALYZE_LLM_ANTHROPIC) return OTA_ANALYZE_LLM_ANTHROPIC;
  } catch (_) {}
  return OTA_ANALYZE_LLM_WITH_OPENAI;
}

/**
 * @param {typeof OTA_ANALYZE_LLM_WITH_OPENAI | typeof OTA_ANALYZE_LLM_OTA_BITS_ONLY | typeof OTA_ANALYZE_LLM_ANTHROPIC} mode
 * @param {{ source?: string }} [options] — ex. `{ source: 'click' }` pentru feedback UI
 */
export function setOtaFuturesAnalyzeLlmMode(mode, options = {}) {
  let next = OTA_ANALYZE_LLM_WITH_OPENAI;
  if (mode === OTA_ANALYZE_LLM_OTA_BITS_ONLY) next = OTA_ANALYZE_LLM_OTA_BITS_ONLY;
  else if (mode === OTA_ANALYZE_LLM_ANTHROPIC) next = OTA_ANALYZE_LLM_ANTHROPIC;
  else next = OTA_ANALYZE_LLM_WITH_OPENAI;
  const source = options && typeof options.source === 'string' ? options.source : 'set';
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch (_) {}
  try {
    window.dispatchEvent(new CustomEvent(OTA_FUTURES_ANALYZE_LLM_CHANGE, { detail: { mode: next, source } }));
  } catch (_) {}
  return next;
}

/** Dacă true, analyzeMarket poate trimite body.engineNoOpenAi (dacă backend acceptă). */
export function shouldRequestEngineNoOpenAiFromPreference() {
  return getOtaFuturesAnalyzeLlmMode() === OTA_ANALYZE_LLM_OTA_BITS_ONLY;
}
