/**
 * Tests for getOpenPositionsAnalytics and OTA manual close (AUTO_OPEN / MANUAL_CLOSE).
 * - getOpenPositionsAnalytics returns userId, positionExitMode, summary, positions.
 * - postOtaPositionsClose requires userId and token.
 */

import { getOpenPositionsAnalytics, getOpenPositionsCostBasis } from '../analyticsApiService';
import { postOtaPositionsClose } from '../aiTradingApiService';
import { __resetOtaApiClientCachesForTests } from '../../utils/otaApiClient';

jest.mock('../../../config/runtimeConfig.js', () => ({
  loadRuntimeConfig: () => Promise.resolve({}),
  getBackendUrl: () => 'https://backend-server-eu.onrender.com',
  getAuthBackendUrl: () => 'https://backend-server-eu.onrender.com',
  getApiBaseUrl: () => 'https://backend-server-eu.onrender.com/api',
  getConfigSource: () => 'test',
  initRuntimeConfig: () => {},
}));

const fetchMock = jest.fn();

beforeEach(() => {
  global.fetch = fetchMock;
  fetchMock.mockReset();
  __resetOtaApiClientCachesForTests();
});

describe('getOpenPositionsAnalytics', () => {
  it('throws if userId is missing', async () => {
    await expect(getOpenPositionsAnalytics()).rejects.toThrow('userId required');
    await expect(getOpenPositionsAnalytics('')).rejects.toThrow('userId required');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns userId, positionExitMode, summary, positions on success', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        userId: '0xabc',
        positionExitMode: 'manual',
        summary: { totalPositions: 1, totalCostBasisUsd: 100 },
        positions: [{ token: 'ETH', quoteToken: 'USDT', status: 'open', closeActionMode: 'manual_only' }]
      })
    });
    const result = await getOpenPositionsAnalytics('0xabc');
    expect(result.userId).toBe('0xabc');
    expect(result.positionExitMode).toBe('manual');
    expect(result.summary.totalPositions).toBe(1);
    expect(Array.isArray(result.positions)).toBe(true);
    expect(result.positions[0].token).toBe('ETH');
    expect(result.positions[0].closeActionMode).toBe('manual_only');
  });

  it('requests correct URL: /ai-trading/analytics/open-positions', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, userId: '0x', positionExitMode: 'auto', summary: {}, positions: [] })
    });
    await getOpenPositionsAnalytics('0xwallet');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/ai-trading/analytics/open-positions');
    expect(url).toContain('userId=0xwallet');
  });

  it('passes through gas/fees and PnL fields when present', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        userId: '0xuser',
        positionExitMode: 'auto',
        summary: { totalPositions: 1, totalCostBasisUsd: 50, totalUnrealizedPnlGrossUsd: 5, totalUnrealizedPnlNetUsd: 4.5 },
        positions: [{
          token: 'CAKE',
          quoteToken: 'USDT',
          status: 'open',
          quantityHuman: 100,
          entryPriceUsd: 0.5,
          currentPriceUsd: 0.55,
          entryValueUsd: 50,
          currentValueUsd: 55,
          openGasUsd: 0.02,
          estimatedCloseGasUsd: null,
          estimatedTotalFeesUsd: 0.02,
          unrealizedPnlGrossUsd: 5,
          unrealizedPnlNetUsd: 4.93,
          unrealizedPnlPercent: 9.86
        }]
      })
    });
    const result = await getOpenPositionsAnalytics('0xuser');
    expect(result.positions[0].openGasUsd).toBe(0.02);
    expect(result.positions[0].estimatedCloseGasUsd).toBeNull();
    expect(result.positions[0].unrealizedPnlNetUsd).toBe(4.93);
    expect(result.summary.totalUnrealizedPnlNetUsd).toBe(4.5);
  });
});

describe('getOpenPositionsCostBasis', () => {
  it('requests correct URL: /ai-trading/analytics/open-positions-cost-basis', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, positions: [] })
    });
    await getOpenPositionsCostBasis('0xuser');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/ai-trading/analytics/open-positions-cost-basis');
    expect(url).toContain('userId=0xuser');
  });

  it('passes through closeActionAllowed and entryValueUsd when present', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        positions: [
          { token: 'SOL', quoteToken: 'USDT', amountToken: 0.05, entryPrice: 78, entryValueUsd: 3.9, closeActionAllowed: true }
        ]
      })
    });
    const result = await getOpenPositionsCostBasis('0xwallet');
    expect(result.positions).toHaveLength(1);
    expect(result.positions[0].closeActionAllowed).toBe(true);
    expect(result.positions[0].entryValueUsd).toBe(3.9);
  });

  it('passes through estimatedCloseGasUsd and estimatedCloseGasSource (dynamic, no hardcoded 0.08)', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        positions: [
          { token: 'BTC', quoteToken: 'USDT', amountToken: 0.01, entryValueUsd: 500, estimatedCloseGasUsd: 0.12, estimatedCloseGasSource: 'live' }
        ]
      })
    });
    const result = await getOpenPositionsCostBasis('0xwallet');
    expect(result.positions[0].estimatedCloseGasUsd).toBe(0.12);
    expect(result.positions[0].estimatedCloseGasSource).toBe('live');
  });

  it('passes through gasSource, openGasUsdSource, estimatedCloseGasUsdIsEstimate for truth contract', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        positions: [
          {
            token: 'ETH',
            quoteToken: 'USDT',
            amountToken: 0.1,
            openGasUsd: 0.02,
            openGasUsdSource: 'real',
            estimatedCloseGasUsd: 0.06,
            estimatedCloseGasUsdIsEstimate: true,
            gasSource: 'estimated',
            closeGasUsdAvailable: false
          }
        ]
      })
    });
    const result = await getOpenPositionsCostBasis('0xuser');
    expect(result.positions[0].gasSource).toBe('estimated');
    expect(result.positions[0].openGasUsdSource).toBe('real');
    expect(result.positions[0].estimatedCloseGasUsdIsEstimate).toBe(true);
    expect(result.positions[0].closeGasUsdAvailable).toBe(false);
  });
});

describe('postOtaPositionsClose', () => {
  it('throws if userId or token is missing', async () => {
    await expect(postOtaPositionsClose()).rejects.toThrow('userId and token');
    await expect(postOtaPositionsClose('0xabc')).rejects.toThrow('userId and token');
    await expect(postOtaPositionsClose(null, 'ETH')).rejects.toThrow('userId and token');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('calls POST with userId and token', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, token: 'ETH', closeActionMode: 'manual_only' })
    });
    await postOtaPositionsClose('0xwallet', 'ETH');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body);
    expect(body.userId).toBe('0xwallet');
    expect(body.token).toBe('ETH');
  });
});
