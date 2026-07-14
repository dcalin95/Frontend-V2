const mockOtaApiRequest = jest.fn();

jest.mock('../../utils/otaApiClient', () => ({
  otaApiRequest: (...args) => mockOtaApiRequest(...args),
}));

jest.mock('../../../config/apiEndpoints.js', () => {
  const actual = jest.requireActual('../../../config/apiEndpoints.js');
  return {
    ...actual,
    getApiBaseUrl: () => 'https://backend.example',
    getBackendUrl: () => 'https://backend.example',
    API_ENDPOINTS: {
      ...actual.API_ENDPOINTS,
      SIGNALS_LIST: '/ai-trading/signals',
    },
  };
});

describe('otaShortOpsService signal timeout', () => {
  beforeEach(() => {
    jest.resetModules();
    mockOtaApiRequest.mockReset();
  });

  it('passes the branch timeout to otaApiRequest', async () => {
    mockOtaApiRequest.mockResolvedValueOnce({ success: true, signals: [] });
    const { getRecentLlmSignals } = require('../otaShortOpsService');

    await getRecentLlmSignals('0x1234567890123456789012345678901234567890', {
      limit: 80,
      tradeContext: 'short_focus',
      skipCache: true,
      timeoutMs: 30000,
    });

    expect(mockOtaApiRequest).toHaveBeenCalledTimes(1);
    expect(mockOtaApiRequest.mock.calls[0][0]).toContain('tradeContext=short_focus');
    expect(mockOtaApiRequest.mock.calls[0][1]).toEqual({
      method: 'GET',
      timeoutMs: 30000,
    });
  });
});
