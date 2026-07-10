/**
 * 🎯 OTA Strategy API Service - Strategy Execution Endpoints
 * Folosește otaApiClient (timeout 15s, 1 retry la eroare de rețea).
 */

import { otaApiRequest } from '../utils/otaApiClient';

const OTA_EMERGENCY_NEW_TRADES_DISABLED =
  process.env.REACT_APP_OTA_EMERGENCY_NEW_TRADES_DISABLED === 'true';
const OTA_EMERGENCY_MESSAGE =
  'Emergency safety lock is active: strategy execution is disabled.';

async function apiRequest(endpoint, options = {}) {
  try {
    return await otaApiRequest(endpoint, options);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[OTA Strategy API] Error [${endpoint}]:`, error);
    }
    throw error;
  }
}

/**
 * List available OTA strategies
 * @returns {Promise<Object>} List of strategies
 */
export async function listStrategies() {
  return apiRequest('/ai-trading/strategies/list', {
    method: 'GET'
  });
}

/**
 * Execute a strategy
 * @param {Object} params - Execution parameters
 * @param {string} params.strategyName - Strategy name ('trend-following' | 'mean-reversion')
 * @param {string} params.token - Token symbol (default: 'BTC')
 * @param {string} params.quoteToken - Quote token (default: 'USDT')
 * @param {string} params.timeframe - Timeframe (default: '5m')
 * @returns {Promise<Object>} Execution results
 */
export async function executeStrategy(params = {}) {
  if (OTA_EMERGENCY_NEW_TRADES_DISABLED) {
    throw new Error(OTA_EMERGENCY_MESSAGE);
  }
  const {
    strategyName,
    token,
    quoteToken = 'USDT',
    timeframe = '5m'
  } = params;

  // Validate required parameters (token should be explicitly provided, not use default)
  if (!strategyName || !token) {
    throw new Error('strategyName and token are required');
  }

  return apiRequest('/ai-trading/strategies/execute', {
    method: 'POST',
    body: JSON.stringify({
      strategyName,
      token,
      quoteToken,
      timeframe
    })
  });
}

/**
 * Get strategy execution status
 * @returns {Promise<Object>} Strategy runner status
 */
export async function getStrategyStatus() {
  return apiRequest('/ai-trading/strategies/status', {
    method: 'GET'
  });
}

export default {
  listStrategies,
  executeStrategy,
  getStrategyStatus
};
