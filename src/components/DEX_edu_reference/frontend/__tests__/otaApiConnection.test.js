/**
 * OTA API Connection - teste pentru conectarea la backend
 * - getOTAHealth, getAutoExecutionStatus
 * - URL construit cu getApiBaseUrl()
 * - Comportament la răspuns OK și la erori
 */

const mockGetBackendUrl = jest.fn(() => 'https://api.test');
const mockGetApiBaseUrl = jest.fn(() => 'https://api.test/api');
jest.mock('../../config/apiEndpoints.js', () => ({
  getBackendUrl: (...args) => mockGetBackendUrl(...args),
  getApiBaseUrl: (...args) => mockGetApiBaseUrl(...args),
  API_ENDPOINTS: {
    OTA_HEALTH: '/ai-trading/health',
    OTA_AUTO_EXECUTION_STATUS: '/ai-trading/auto-execution/status',
    EXECUTION_TRADES: '/ai-trading/execution/trades'
  }
}));

jest.mock('../../config/runtimeConfig.js', () => ({
  loadRuntimeConfig: jest.fn(() => Promise.resolve({
    BACKEND_URL: 'https://api.test',
    API_BASE_URL: 'https://api.test/api',
  })),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('OTA API Connection', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockGetApiBaseUrl.mockReturnValue('https://api.test/api');
    mockGetBackendUrl.mockReturnValue('https://api.test');
    require('../utils/otaApiClient').__resetOtaApiClientCachesForTests();
  });

  describe('getOTAHealth', () => {
    test('apelează endpoint-ul corect și returnează datele de health', async () => {
      const { getOTAHealth } = require('../services/aiTradingApiService');
      const healthData = { status: 'ok', timestamp: '2026-01-31T12:00:00Z' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(healthData)
      });

      const result = await getOTAHealth();

      expect(result).toEqual(healthData);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('https://api.test');
      expect(url).toContain('/ai-trading/health');
    });

    test('aruncă eroare când backend returnează !ok', async () => {
      const { getOTAHealth } = require('../services/aiTradingApiService');
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: () => Promise.resolve({ error: 'Service Unavailable' })
      });

      await expect(getOTAHealth()).rejects.toThrow(/unavailable|503|Service busy|Service Unavailable/i);
    });
  });

  describe('getAutoExecutionStatus', () => {
    test('apelează endpoint-ul corect și returnează status auto-execution', async () => {
      const { getAutoExecutionStatus } = require('../services/aiTradingApiService');
      const statusData = { enabled: true, lastRunAt: '2026-01-31T12:00:00Z', executionsCount24h: 5 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(statusData)
      });

      const result = await getAutoExecutionStatus();

      expect(result).toEqual(statusData);
      expect(result.enabled).toBe(true);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/ai-trading/auto-execution/status');
    });

    test('aruncă eroare când backend returnează 404/501', async () => {
      const { getAutoExecutionStatus } = require('../services/aiTradingApiService');
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 501,
        json: () => Promise.resolve({ error: 'Not Implemented' })
      });

      await expect(getAutoExecutionStatus()).rejects.toThrow();
    });
  });

  describe('otaApiClient', () => {
    test('REQUEST_TIMEOUT_MS este exportat și numeric', () => {
      const { REQUEST_TIMEOUT_MS } = require('../utils/otaApiClient');
      expect(typeof REQUEST_TIMEOUT_MS).toBe('number');
      expect(REQUEST_TIMEOUT_MS).toBeGreaterThan(0);
    });
  });

  describe('Execution API - getTrades', () => {
    test('apelează endpoint-ul corect cu query params', async () => {
      const { getTrades } = require('../services/executionApiService');
      const tradesData = { trades: [], total: 0 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(tradesData)
      });

      const result = await getTrades('user-1', { limit: 10 });

      expect(result).toEqual(tradesData);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toMatch(/\/ai-trading\/execution\/trades\?/);
      expect(url).toContain('userId=user-1');
      expect(url).toContain('limit=10');
    });
  });
});
