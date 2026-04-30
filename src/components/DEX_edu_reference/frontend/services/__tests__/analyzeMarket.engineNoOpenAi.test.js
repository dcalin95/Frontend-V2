/**
 * Regresie: comutatorul „Cu OpenAI” / „Doar OTA BITS” → body POST /ai-trading/analyze.
 * @jest-environment jsdom
 */

const mockOtaApiRequest = jest.fn();

jest.mock('../../utils/otaApiClient', () => ({
  otaApiRequest: (...args) => mockOtaApiRequest(...args),
}));

jest.mock('../../utils/constants', () => ({
  API_ENDPOINTS: { OTA_ANALYZE: '/ai-trading/analyze' },
}));

const {
  setOtaFuturesAnalyzeLlmMode,
  OTA_ANALYZE_LLM_OTA_BITS_ONLY,
  OTA_ANALYZE_LLM_WITH_OPENAI,
} = require('../../utils/otaAnalysisModePreference');

const { analyzeMarket } = require('../aiTradingApiService.jsx');

function lastRequestBody() {
  const call = mockOtaApiRequest.mock.calls[mockOtaApiRequest.mock.calls.length - 1];
  expect(call).toBeDefined();
  const opts = call[1];
  return JSON.parse(opts.body);
}

describe('analyzeMarket — engineNoOpenAi vs preferință UI', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockOtaApiRequest.mockReset();
    mockOtaApiRequest.mockResolvedValue({ success: true, signal: { side: 'hold' } });
  });

  it('implicit Cu OpenAI: nu trimite engineNoOpenAi în body', async () => {
    await analyzeMarket('BTC', { userId: '0xabc' });
    const body = lastRequestBody();
    expect(body.token).toBe('BTC');
    expect(body).not.toHaveProperty('engineNoOpenAi');
  });

  it('Doar OTA BITS (localStorage): body.engineNoOpenAi === true', async () => {
    setOtaFuturesAnalyzeLlmMode(OTA_ANALYZE_LLM_OTA_BITS_ONLY, { source: 'click' });
    await analyzeMarket('ETH', {});
    const body = lastRequestBody();
    expect(body.engineNoOpenAi).toBe(true);
  });

  it('forțare options.engineNoOpenAi: false ignoră localStorage ota_bits_only', async () => {
    setOtaFuturesAnalyzeLlmMode(OTA_ANALYZE_LLM_OTA_BITS_ONLY);
    await analyzeMarket('BNB', { engineNoOpenAi: false });
    const body = lastRequestBody();
    expect(body).not.toHaveProperty('engineNoOpenAi');
  });

  it('forțare options.engineNoOpenAi: true chiar dacă UI e Cu OpenAI', async () => {
    setOtaFuturesAnalyzeLlmMode(OTA_ANALYZE_LLM_WITH_OPENAI);
    await analyzeMarket('SOL', { engineNoOpenAi: true });
    const body = lastRequestBody();
    expect(body.engineNoOpenAi).toBe(true);
  });
});
