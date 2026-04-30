/**
 * Teste pentru otaPolicyService (getPolicyFromBackendOnly, USD limits din backend).
 * getPolicyFromBackendOnly: folosit pentru afișarea USD limits în AutoTradePanel fără on-chain.
 */

const mockOtaApiRequest = jest.fn();
jest.mock('../../utils/otaApiClient', () => ({
  otaApiRequest: (...args) => mockOtaApiRequest(...args)
}));

jest.mock('../../../config/apiEndpoints.js', () => ({
  API_ENDPOINTS: { OTA_POLICY_GET: '/ai-trading/policy/get' }
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
