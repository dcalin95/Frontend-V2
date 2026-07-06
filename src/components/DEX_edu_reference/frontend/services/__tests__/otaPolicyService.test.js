/**
 * Teste pentru otaPolicyService (getPolicyFromBackendOnly, USD limits din backend).
 * getPolicyFromBackendOnly: folosit pentru afișarea USD limits în AutoTradePanel fără on-chain.
 */

const mockOtaApiRequest = jest.fn();
jest.mock('../../utils/otaApiClient', () => ({
  otaApiRequest: (...args) => mockOtaApiRequest(...args)
}));

jest.mock('../../../config/apiEndpoints.js', () => ({
  API_ENDPOINTS: {
    OTA_POLICY_GET: '/ai-trading/policy/get',
    OTA_TRACKED_TOKENS_GET: '/ai-trading/tracked-tokens'
  }
}));

describe('otaPolicyService - getPolicyFromBackendOnly', () => {
  beforeEach(() => {
    mockOtaApiRequest.mockReset();
  });

  test('returnează null când walletAddress lipsește', async () => {
    const { getPolicyFromBackendOnly } = require('../otaPolicyService');
    expect(await getPolicyFromBackendOnly(null)).toBeNull();
    expect(await getPolicyFromBackendOnly(undefined)).toBeNull();
    expect(await getPolicyFromBackendOnly('')).toBeNull();
    expect(mockOtaApiRequest).not.toHaveBeenCalled();
  });

  test('returnează response.policy la succes', async () => {
    const { getPolicyFromBackendOnly } = require('../otaPolicyService');
    const policy = {
      enabled: true,
      usdMinPerTrade: 10,
      usdMaxPerTrade: 100,
      usdDailyCap: 500,
      maxTradesPer12h: 5
    };
    mockOtaApiRequest.mockResolvedValueOnce({ policy });
    const wallet = '0x1234567890123456789012345678901234567890';
    const result = await getPolicyFromBackendOnly(wallet);
    expect(result).toEqual(policy);
    expect(mockOtaApiRequest).toHaveBeenCalledTimes(1);
    const [endpoint, opts] = mockOtaApiRequest.mock.calls[0];
    expect(endpoint).toContain('/ai-trading/policy/get');
    expect(endpoint).toContain('walletAddress=' + encodeURIComponent(wallet));
    expect(opts?.method).toBe('GET');
  });

  test('returnează null când backend aruncă', async () => {
    const { getPolicyFromBackendOnly } = require('../otaPolicyService');
    mockOtaApiRequest.mockRejectedValueOnce(new Error('Network error'));
    const result = await getPolicyFromBackendOnly('0xabc');
    expect(result).toBeNull();
  });

  test('returnează null când response nu are .policy', async () => {
    const { getPolicyFromBackendOnly } = require('../otaPolicyService');
    mockOtaApiRequest.mockResolvedValueOnce({});
    const result = await getPolicyFromBackendOnly('0xdef');
    expect(result).toBeNull();
  });
});

describe('otaPolicyService - getTrackedTokensFromBackend', () => {
  beforeEach(() => {
    mockOtaApiRequest.mockReset();
  });

  test('returns empty list when backend marks tracked tokens payload unhealthy', async () => {
    const { getTrackedTokensFromBackend } = require('../otaPolicyService');
    mockOtaApiRequest.mockResolvedValueOnce({
      success: false,
      errors: [{ code: 'token_missing_address', symbol: 'SHIB' }],
      tokens: [{ symbol: 'SHIB' }]
    });

    const result = await getTrackedTokensFromBackend();

    expect(result).toEqual([]);
    expect(mockOtaApiRequest).toHaveBeenCalledWith('/ai-trading/tracked-tokens', { method: 'GET', timeoutMs: 10000 });
  });

  test('keeps only tracked tokens that include backend address metadata', async () => {
    const { getTrackedTokensFromBackend } = require('../otaPolicyService');
    mockOtaApiRequest.mockResolvedValueOnce({
      success: true,
      tokens: [
        { symbol: 'BNB', address: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' },
        { symbol: 'SHIB' },
        { symbol: 'LINK', address: '0x1111111111111111111111111111111111111111' }
      ]
    });

    await expect(getTrackedTokensFromBackend()).resolves.toEqual([
      { symbol: 'BNB', address: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' },
      { symbol: 'LINK', address: '0x1111111111111111111111111111111111111111' }
    ]);
  });
});
