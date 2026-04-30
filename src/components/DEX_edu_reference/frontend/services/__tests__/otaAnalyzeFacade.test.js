/**
 * @jest-environment jsdom
 */

const mockOtaApiRequest = jest.fn();

jest.mock('../../utils/otaApiClient', () => ({
  otaApiRequest: (...args) => mockOtaApiRequest(...args),
}));

jest.mock('../../utils/otaAnalysisModePreference', () => ({
  getOtaFuturesAnalyzeLlmMode: jest.fn(),
  OTA_ANALYZE_LLM_OTA_BITS_ONLY: 'ota_bits_only',
  OTA_ANALYZE_LLM_ANTHROPIC: 'anthropic_claude',
  OTA_ANALYZE_LLM_WITH_OPENAI: 'with_openai',
}));

jest.mock('../aiTradingApiService.jsx', () => ({
  analyzeMarket: jest.fn(() => Promise.resolve({ success: true, signal: { side: 'hold' } })),
}));

jest.mock('../../utils/otaLlmBillingRefresh', () => ({
  dispatchOtaLlmBillingRefresh: jest.fn(),
}));

const { getOtaFuturesAnalyzeLlmMode } = require('../../utils/otaAnalysisModePreference');
const { dispatchOtaLlmBillingRefresh } = require('../../utils/otaLlmBillingRefresh');
const {
  analyzeMarketWithLlmProvider,
  mapClaudeAnalyzeResponseToOtaShape,
  getSeparateBillingErrorDetails,
} = require('../otaAnalyzeFacade.jsx');
const { analyzeMarket } = require('../aiTradingApiService.jsx');

describe('otaAnalyzeFacade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOtaApiRequest.mockResolvedValue({
      analysis: {
        signal: 'BUY',
        confidence: 70,
        risk: 'MEDIUM',
        reasoning: 'test',
        stopLoss: 1,
        target: 2,
      },
      provider: 'anthropic-claude-sonnet',
    });
  });

  it('maps Claude analysis into OTA signal shape', () => {
    const out = mapClaudeAnalyzeResponseToOtaShape({
      provider: 'anthropic-claude-sonnet',
      analysis: { signal: 'SELL', confidence: 50, reasoning: 'r', stopLoss: 3, target: 4, risk: 'HIGH' },
    });
    expect(out.success).toBe(true);
    expect(out.signal.direction).toBe('SELL');
    expect(out.signal.stopLoss).toBe(3);
    expect(out.signal.takeProfit).toBe(4);
  });

  it('uses Claude route in anthropic mode', async () => {
    getOtaFuturesAnalyzeLlmMode.mockReturnValue('anthropic_claude');
    await analyzeMarketWithLlmProvider('BTC', { quoteToken: 'USDT', userId: '0x1' });
    expect(mockOtaApiRequest).toHaveBeenCalledWith(
      '/claude/analyze',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    const body = JSON.parse(mockOtaApiRequest.mock.calls[0][1].body);
    expect(body.tradeData.token).toBe('BTC');
    expect(analyzeMarket).not.toHaveBeenCalled();
  });

  it('preserves billing and token usage in Claude OTA shape', async () => {
    getOtaFuturesAnalyzeLlmMode.mockReturnValue('anthropic_claude');
    mockOtaApiRequest.mockResolvedValueOnce({
      analysis: {
        signal: 'BUY',
        confidence: 70,
        reasoning: 'test',
      },
      provider: 'anthropic-claude-sonnet',
      tokenUsage: { totalTokens: 321 },
      billing: { availableCreditUsd: 4.2, spentCreditUsd: 0.8, trialCreditUsd: 5 },
    });

    const out = await analyzeMarketWithLlmProvider('BTC', { quoteToken: 'USDT', userId: '0x1' });
    expect(out.billing).toEqual(expect.objectContaining({ availableCreditUsd: 4.2 }));
    expect(out.tokenUsage).toEqual(expect.objectContaining({ totalTokens: 321 }));
    expect(out.signal.billing).toEqual(expect.objectContaining({ trialCreditUsd: 5 }));
    expect(out.signal.tokenUsage).toEqual(expect.objectContaining({ totalTokens: 321 }));
  });

  it('normalizes Claude billing required into a clear message', async () => {
    getOtaFuturesAnalyzeLlmMode.mockReturnValue('anthropic_claude');
    const err = new Error('Separate Claude credit required.');
    err.code = 'OTA_LLM_BILLING_CREDIT_REQUIRED';
    err.billing = { trialCreditUsd: 5, spentCreditUsd: 5, availableCreditUsd: 0 };
    mockOtaApiRequest.mockRejectedValueOnce(err);

    await expect(analyzeMarketWithLlmProvider('BTC', { quoteToken: 'USDT', userId: '0x1' })).rejects.toMatchObject({
      code: 'OTA_LLM_BILLING_CREDIT_REQUIRED',
      billing: expect.objectContaining({ availableCreditUsd: 0 }),
      message: expect.stringContaining('Separate Claude credit required.'),
    });
  });

  it('delegates to OTA engine with engineNoOpenAi in ota_bits_only mode', async () => {
    getOtaFuturesAnalyzeLlmMode.mockReturnValue('ota_bits_only');
    await analyzeMarketWithLlmProvider('ETH', {});
    expect(analyzeMarket).toHaveBeenCalledWith('ETH', expect.objectContaining({ engineNoOpenAi: true }));
    expect(mockOtaApiRequest).not.toHaveBeenCalled();
    expect(dispatchOtaLlmBillingRefresh).not.toHaveBeenCalled();
  });

  it('uses explicit analyzeLlmMode from the caller for the current button click', async () => {
    getOtaFuturesAnalyzeLlmMode.mockReturnValue('with_openai');
    await analyzeMarketWithLlmProvider('STX', { analyzeLlmMode: 'ota_bits_only', tradeContext: 'long_live' });
    expect(analyzeMarket).toHaveBeenCalledWith(
      'STX',
      expect.objectContaining({
        analyzeLlmMode: 'ota_bits_only',
        engineNoOpenAi: true,
        tradeContext: 'long_live',
      }),
    );
    expect(dispatchOtaLlmBillingRefresh).not.toHaveBeenCalled();
  });

  it('normalizes OTA-only analyze response source for UI badges even if backend reports an OpenAI source', async () => {
    getOtaFuturesAnalyzeLlmMode.mockReturnValue('ota_bits_only');
    analyzeMarket.mockResolvedValueOnce({
      success: true,
      analysisSource: 'openai_decides',
      signal: {
        signal: 'sell',
        confidence: 0.6,
        analysisSource: 'openai_decides',
      },
    });

    const out = await analyzeMarketWithLlmProvider('SOL', { tradeContext: 'long_live' });

    expect(out.analysisSource).toBe('engine_no_openai');
    expect(out.originalAnalysisSource).toBe('openai_decides');
    expect(out.signal.analysisSource).toBe('engine_no_openai');
    expect(out.signal.originalAnalysisSource).toBe('openai_decides');
    expect(dispatchOtaLlmBillingRefresh).not.toHaveBeenCalled();
  });

  it('normalizes OpenAI billing required into a clear message', async () => {
    getOtaFuturesAnalyzeLlmMode.mockReturnValue('with_openai');
    const err = new Error('Separate OpenAI credit required.');
    err.code = 'OTA_LLM_BILLING_CREDIT_REQUIRED';
    err.billing = { trialCreditUsd: 5, spentCreditUsd: 5, availableCreditUsd: 0 };
    analyzeMarket.mockRejectedValueOnce(err);

    await expect(analyzeMarketWithLlmProvider('ETH', { userId: '0x1' })).rejects.toMatchObject({
      code: 'OTA_LLM_BILLING_CREDIT_REQUIRED',
      billing: expect.objectContaining({ availableCreditUsd: 0 }),
      message: expect.stringContaining('Separate OpenAI credit required.'),
    });
  });

  it('extracts separate billing details from a normalized provider error', () => {
    const err = new Error('Separate OpenAI credit required.');
    err.code = 'OTA_LLM_BILLING_CREDIT_REQUIRED';
    err.provider = 'OpenAI';
    err.billing = { trialCreditUsd: 5, spentCreditUsd: 5, availableCreditUsd: 0 };

    expect(getSeparateBillingErrorDetails(err)).toEqual(
      expect.objectContaining({
        code: 'OTA_LLM_BILLING_CREDIT_REQUIRED',
        providerLabel: 'OpenAI',
        billing: expect.objectContaining({ availableCreditUsd: 0 }),
        message: expect.stringContaining('Separate OpenAI credit required.'),
      }),
    );
  });

  it('extracts billing details when provider is paused by user', () => {
    const err = new Error('Paused.');
    err.code = 'OTA_LLM_PROVIDER_PAUSED';
    err.provider = 'OpenAI';
    err.billing = { trialCreditUsd: 5, spentCreditUsd: 0, availableCreditUsd: 5 };

    const d = getSeparateBillingErrorDetails(err);
    expect(d?.code).toBe('OTA_LLM_PROVIDER_PAUSED');
    expect(d?.message).toMatch(/paused for this wallet/i);
  });
});
