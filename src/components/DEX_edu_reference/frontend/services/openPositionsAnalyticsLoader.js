/**
 * Single orchestrated loader for OTA analytics open positions.
 * Deduplicates in-flight requests per userId so StrictMode / double mount / rapid refetch
 * do not cause duplicate /open-positions and /open-positions-cost-basis calls.
 *
 * SSOT for fetching: direct-entry position + open-positions-cost-basis + open-positions
 * in one bundle. Callers use this instead of calling the three APIs independently.
 */

import { getOpenPositionsCostBasis, getOpenPositionsAnalytics } from './analyticsApiService';
import { getDirectEntryPosition } from './aiTradingApiService';
import { getOpenLongs } from './otaLongOpsService';
import { getOpenShorts } from './otaShortOpsService';

/** In-flight promise per userId. Cleared when the promise settles. */
const inFlightByUserId = new Map();

const emptyCostBasis = { positions: [] };
const emptyAnalytics = { positionExitMode: 'auto', positions: [] };
const emptyLongFutures = { positions: [] };
const emptyShortFutures = { positions: [] };

/**
 * Fetch all data needed for the open-positions analytics section in one go.
 * Deduplication: if a request for the same userId is already in flight, returns that promise.
 *
 * @param {string} userId - wallet address
 * @returns {Promise<[unknown[], { positions: object[] }, { positionExitMode: string, positions: object[], [key: string]: unknown }, { positions: object[] }, { positions: object[] }]>}
 *   [directEntryList, costBasisResult, analyticsResult, longFuturesResult, shortFuturesResult]
 */
export function fetchOpenPositionsAnalyticsBundle(userId) {
  if (!userId) {
    return Promise.resolve([[], emptyCostBasis, emptyAnalytics, emptyLongFutures, emptyShortFutures]);
  }

  const existing = inFlightByUserId.get(userId);
  if (existing) {
    return existing;
  }

  const promise = Promise.all([
    getDirectEntryPosition(userId),
    getOpenPositionsCostBasis(userId).catch(() => emptyCostBasis),
    getOpenPositionsAnalytics(userId).catch(() => emptyAnalytics),
    getOpenLongs(userId).catch(() => emptyLongFutures),
    getOpenShorts(userId).catch(() => emptyShortFutures),
  ]).finally(() => {
    inFlightByUserId.delete(userId);
  });

  inFlightByUserId.set(userId, promise);
  return promise;
}
