/**
 * 🎰 OTA Bandit API Service - Multi-Armed Bandit Endpoints
 * 
 * Frontend service pentru interacțiune cu OTA Bandit Selector API:
 * - Get bandit statistics
 * - Select strategy based on regime
 * - Record rewards
 * 
 * @module otaBanditService
 */

import { otaApiRequest } from '../utils/otaApiClient';

async function apiRequest(endpoint, options = {}) {
  try {
    return await otaApiRequest(endpoint, options);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[OTA Bandit API] Error [${endpoint}]:`, error);
    }
    throw error;
  }
}

/**
 * Get bandit statistics (optionally scoped by user for per-user bandit state).
 * @param {Object} [options] - Optional params
 * @param {string} [options.userId] - User id (e.g. wallet address) for per-user stats when backend supports it
 * @returns {Promise<Object>} Bandit statistics
 */
export async function getBanditStatistics(options = {}) {
  const { userId } = options;
  const url = userId
    ? `/ai-trading/bandit/statistics?userId=${encodeURIComponent(userId)}`
    : '/ai-trading/bandit/statistics';
  return apiRequest(url, {
    method: 'GET'
  });
}

/**
 * Select a strategy using bandit algorithm
 * @param {Object} params - Selection parameters
 * @param {string} params.regime - Market regime ('bull' | 'bear' | 'sideways')
 * @param {string} params.userId - User ID (optional)
 * @returns {Promise<Object>} Selected strategy
 */
export async function selectStrategy(params = {}) {
  const {
    regime = 'bull',
    userId = null
  } = params;

  return apiRequest('/ai-trading/bandit/select', {
    method: 'POST',
    body: JSON.stringify({
      regime,
      userId
    })
  });
}

/**
 * Record a reward for a strategy
 * @param {Object} params - Reward parameters
 * @param {string} params.strategy - Strategy name
 * @param {number} params.reward - Reward value
 * @param {Object} params.context - Context (pnl, timestamp, etc.)
 * @returns {Promise<Object>} Success response
 */
export async function recordReward(params = {}) {
  const {
    strategy,
    reward,
    context = {},
    pnl,
    return: returnPercent,
    timestamp
  } = params;

  if (!strategy || reward === undefined) {
    throw new Error('strategy and reward are required');
  }

  return apiRequest('/ai-trading/bandit/reward', {
    method: 'POST',
    body: JSON.stringify({
      strategy,
      reward,
      pnl: pnl != null ? pnl : context.pnl,
      return: returnPercent != null ? returnPercent : context.return,
      timestamp: timestamp != null ? timestamp : context.timestamp,
      context
    })
  });
}

/**
 * Reset bandit statistics
 * @returns {Promise<Object>} Success response
 */
export async function resetStatistics() {
  return apiRequest('/ai-trading/bandit/reset', {
    method: 'POST'
  });
}

export default {
  getBanditStatistics,
  selectStrategy,
  recordReward,
  resetStatistics
};
