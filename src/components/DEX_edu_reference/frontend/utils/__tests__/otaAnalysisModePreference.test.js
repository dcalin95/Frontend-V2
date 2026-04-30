/**
 * @jest-environment jsdom
 */

import {
  getOtaFuturesAnalyzeLlmMode,
  setOtaFuturesAnalyzeLlmMode,
  shouldRequestEngineNoOpenAiFromPreference,
  OTA_ANALYZE_LLM_WITH_OPENAI,
  OTA_ANALYZE_LLM_OTA_BITS_ONLY,
  OTA_ANALYZE_LLM_ANTHROPIC,
} from '../otaAnalysisModePreference';

describe('otaAnalysisModePreference', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('implicit: with_openai', () => {
    expect(getOtaFuturesAnalyzeLlmMode()).toBe(OTA_ANALYZE_LLM_WITH_OPENAI);
    expect(shouldRequestEngineNoOpenAiFromPreference()).toBe(false);
  });

  it('ota_bits_only: engine flag', () => {
    setOtaFuturesAnalyzeLlmMode(OTA_ANALYZE_LLM_OTA_BITS_ONLY);
    expect(getOtaFuturesAnalyzeLlmMode()).toBe(OTA_ANALYZE_LLM_OTA_BITS_ONLY);
    expect(shouldRequestEngineNoOpenAiFromPreference()).toBe(true);
  });

  it('anthropic_claude: nu forțează engineNoOpenAi', () => {
    setOtaFuturesAnalyzeLlmMode(OTA_ANALYZE_LLM_ANTHROPIC);
    expect(getOtaFuturesAnalyzeLlmMode()).toBe(OTA_ANALYZE_LLM_ANTHROPIC);
    expect(shouldRequestEngineNoOpenAiFromPreference()).toBe(false);
  });

  describe('contract POST /ai-trading/policy/llm-tuning (analyzeLlmMode)', () => {
    it('valorile locale = valorile LlmTuningService din backend-server', () => {
      expect(OTA_ANALYZE_LLM_WITH_OPENAI).toBe('with_openai');
      expect(OTA_ANALYZE_LLM_OTA_BITS_ONLY).toBe('ota_bits_only');
      expect(OTA_ANALYZE_LLM_ANTHROPIC).toBe('anthropic_claude');
    });
  });
});
