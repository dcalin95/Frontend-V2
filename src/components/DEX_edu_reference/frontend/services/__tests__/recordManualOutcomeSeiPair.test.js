/**
 * recordManualOutcome SEI branch: normalized pair in POST body.
 */

jest.mock('../../utils/otaApiClient', () => ({
  otaApiRequest: jest.fn(() => Promise.resolve({ ok: true })),
}));

jest.mock('../../utils/constants', () => ({
  API_ENDPOINTS: { OTA_RECORD_OUTCOME: '/ai-trading/record-outcome' },
}));

describe('recordManualOutcome (SEI pair)', () => {
  beforeEach(() => {
    jest.resetModules();
    const { otaApiRequest } = require('../../utils/otaApiClient');
    otaApiRequest.mockResolvedValue({ ok: true });
  });

  it('strips invalid pair when base/quote not in allowlist', async () => {
    const { otaApiRequest } = require('../../utils/otaApiClient');
    const { recordManualOutcome } = require('../aiTradingApiService');
    await recordManualOutcome({
      userId: 'u1',
      chain: 'sei',
      pair: 'INVALID/PAIR',
      token: 'ZZZ',
      tokenIn: 'ZZZ',
      tokenOut: 'QQQ',
      side: 'buy',
    });
    expect(otaApiRequest).toHaveBeenCalled();
    const body = JSON.parse(otaApiRequest.mock.calls[0][1].body);
    expect(body.pair).toBeUndefined();
    expect(body.outcomeBase).toBe('ZZZ');
    expect(body.outcomeQuote).toBe('QQQ');
  });

  it('normalizes sei-usdc pair', async () => {
    const { otaApiRequest } = require('../../utils/otaApiClient');
    const { recordManualOutcome } = require('../aiTradingApiService');
    await recordManualOutcome({
      userId: 'u1',
      chain: 'sei',
      pair: 'sei-usdc',
      token: 'SEI',
      tokenOut: 'USDC',
      side: 'buy',
    });
    const body = JSON.parse(otaApiRequest.mock.calls[0][1].body);
    expect(body.pair).toBe('SEI/USDC');
    expect(body.outcomeBase).toBe('SEI');
    expect(body.outcomeQuote).toBe('USDC');
  });

  it('non-sei payload unchanged pair field if any', async () => {
    const { otaApiRequest } = require('../../utils/otaApiClient');
    const { recordManualOutcome } = require('../aiTradingApiService');
    await recordManualOutcome({
      userId: '0xabc',
      token: 'CAKE',
      side: 'buy',
      pair: 'arbitrary',
    });
    const body = JSON.parse(otaApiRequest.mock.calls[0][1].body);
    expect(body.pair).toBe('arbitrary');
  });
});
