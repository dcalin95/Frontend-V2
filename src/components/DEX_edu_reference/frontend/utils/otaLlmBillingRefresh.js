/**
 * După analize reușite (OpenAI / Claude), UI-ul de billing se poate reîmprospăta fără a aștepta poll-ul ~60s.
 * Consumator: `OtaLlmAnalyzeModeControls` — listener `OTA_LLM_BILLING_REFRESH`.
 */
export const OTA_LLM_BILLING_REFRESH = 'ota-llm-billing-refresh';

export function dispatchOtaLlmBillingRefresh() {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(OTA_LLM_BILLING_REFRESH));
    }
  } catch (_) {
    /* ignore */
  }
}
