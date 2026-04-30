/**
 * Tests for openPositionsAnalyticsLoader: request deduplication and single data source.
 * - Parallel calls for same userId result in exactly one set of HTTP requests.
 * - Polling interval is enforced by the page (30s); loader only dedupes in-flight.
 */

import { fetchOpenPositionsAnalyticsBundle } from '../openPositionsAnalyticsLoader';

jest.mock('../analyticsApiService', () => ({
  getOpenPositionsCostBasis: jest.fn(),
  getOpenPositionsAnalytics: jest.fn(),
}));
jest.mock('../aiTradingApiService', () => ({
  getDirectEntryPosition: jest.fn(),
}));
jest.mock('../otaLongOpsService', () => ({
  getOpenLongs: jest.fn(),
}));

import { getOpenPositionsCostBasis, getOpenPositionsAnalytics } from '../analyticsApiService';
import { getDirectEntryPosition } from '../aiTradingApiService';
import { getOpenLongs } from '../otaLongOpsService';

const deList = [];
const costRes = { positions: [] };
const analyticsRes = { positionExitMode: 'auto', positions: [], userId: '0xuser' };
const longRes = { positions: [] };

beforeEach(() => {
  jest.clearAllMocks();
  getDirectEntryPosition.mockResolvedValue(deList);
  getOpenPositionsCostBasis.mockResolvedValue(costRes);
  getOpenPositionsAnalytics.mockResolvedValue(analyticsRes);
  getOpenLongs.mockResolvedValue(longRes);
});

describe('fetchOpenPositionsAnalyticsBundle', () => {
  it('returns empty bundle when userId is falsy', async () => {
    const out = await fetchOpenPositionsAnalyticsBundle('');
    expect(out).toEqual([[], { positions: [] }, { positionExitMode: 'auto', positions: [] }, { positions: [] }]);
    expect(getDirectEntryPosition).not.toHaveBeenCalled();
    expect(getOpenPositionsCostBasis).not.toHaveBeenCalled();
    expect(getOpenPositionsAnalytics).not.toHaveBeenCalled();
    expect(getOpenLongs).not.toHaveBeenCalled();
  });

  it('calls all four APIs once for a single invocation', async () => {
    await fetchOpenPositionsAnalyticsBundle('0xuser');
    expect(getDirectEntryPosition).toHaveBeenCalledTimes(1);
    expect(getDirectEntryPosition).toHaveBeenCalledWith('0xuser');
    expect(getOpenPositionsCostBasis).toHaveBeenCalledTimes(1);
    expect(getOpenPositionsCostBasis).toHaveBeenCalledWith('0xuser');
    expect(getOpenPositionsAnalytics).toHaveBeenCalledTimes(1);
    expect(getOpenPositionsAnalytics).toHaveBeenCalledWith('0xuser');
    expect(getOpenLongs).toHaveBeenCalledTimes(1);
    expect(getOpenLongs).toHaveBeenCalledWith('0xuser');
  });

  it('deduplicates: two parallel calls for same userId result in one set of requests', async () => {
    const p1 = fetchOpenPositionsAnalyticsBundle('0xwallet');
    const p2 = fetchOpenPositionsAnalyticsBundle('0xwallet');
    expect(p1).toBe(p2);
    await Promise.all([p1, p2]);

    expect(getDirectEntryPosition).toHaveBeenCalledTimes(1);
    expect(getOpenPositionsCostBasis).toHaveBeenCalledTimes(1);
    expect(getOpenPositionsAnalytics).toHaveBeenCalledTimes(1);
    expect(getOpenLongs).toHaveBeenCalledTimes(1);
  });

  it('different userIds do not deduplicate', async () => {
    await Promise.all([
      fetchOpenPositionsAnalyticsBundle('0xA'),
      fetchOpenPositionsAnalyticsBundle('0xB'),
    ]);
    expect(getDirectEntryPosition).toHaveBeenCalledTimes(2);
    expect(getOpenPositionsCostBasis).toHaveBeenCalledTimes(2);
    expect(getOpenPositionsAnalytics).toHaveBeenCalledTimes(2);
    expect(getOpenLongs).toHaveBeenCalledTimes(2);
  });

  it('after first request settles, a new call for same userId starts a new request', async () => {
    await fetchOpenPositionsAnalyticsBundle('0xuser');
    expect(getOpenPositionsAnalytics).toHaveBeenCalledTimes(1);
    await fetchOpenPositionsAnalyticsBundle('0xuser');
    expect(getOpenPositionsAnalytics).toHaveBeenCalledTimes(2);
    expect(getOpenLongs).toHaveBeenCalledTimes(2);
  });

  it('returns [deList, costRes, analyticsRes, longRes] shape', async () => {
    const [directEntry, costBasis, analytics, longPositions] = await fetchOpenPositionsAnalyticsBundle('0xuser');
    expect(Array.isArray(directEntry)).toBe(true);
    expect(costBasis).toHaveProperty('positions');
    expect(analytics).toHaveProperty('positionExitMode');
    expect(analytics).toHaveProperty('positions');
    expect(longPositions).toHaveProperty('positions');
  });
});
