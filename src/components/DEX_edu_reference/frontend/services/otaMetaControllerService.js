/**
 * 🎛️ OTA Meta Controller API Service - Meta Controller Endpoints
 * 
 * Frontend service pentru interacțiune cu OTA Meta Controller API:
 * - Get meta controller status
 * - Make ensemble decisions
 * - Record trade outcomes
 * 
 * @module otaMetaControllerService
 */

import { otaApiRequest } from '../utils/otaApiClient';

async function apiRequest(endpoint, options = {}) {
  try {
    return await otaApiRequest(endpoint, options);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[OTA Meta Controller API] Error [${endpoint}]:`, error);
    }
    throw error;
  }
}

/**
 * Get meta controller status
 * @returns {Promise<Object>} Meta controller status
 */
export async function getMetaControllerStatus() {
  return apiRequest('/ai-trading/meta-controller/status', {
    method: 'GET'
  });
}

/**
 * Make an ensemble decision
 * @param {Object} params - Decision parameters
 * @param {Object} params.context - Trading context (currentBar, previousBars, features, regime, token, quoteToken, timeframe)
 * @param {Array} params.strategySignals - Array of strategy signals [{ strategy: 'trend-following', signal: {...} }, ...]
 * @returns {Promise<Object>} Ensemble decision
 */
export async function makeDecision(params = {}) {
  const {
    context,
    strategySignals = []
  } = params;

  if (!context || !context.token) {
    throw new Error('context with token is required');
  }

  // Backend decide endpoint expects token, quoteToken, timeframe, regime at top level
  return apiRequest('/ai-trading/meta-controller/decide', {
    method: 'POST',
    body: JSON.stringify({
      token: context.token,
      quoteToken: context.quoteToken || 'USDT',
      timeframe: context.timeframe || '5m',
      regime: context.regime != null ? context.regime : null,
      strategySignals: Array.isArray(strategySignals) ? strategySignals : []
    })
  });
}

/**
 * Record a trade outcome. Backend may accept optional context (pnl, return, timestamp) to forward to bandit.
 * @param {Object} params - Outcome parameters
 * @param {Object} params.tradeResult - Trade result (pnl, strategy, timestamp, etc.) – required
 * @param {Object} [params.context] - Optional context (pnl, return, timestamp) for bandit learning
 * @returns {Promise<Object>} Success response
 */
export async function recordOutcome(params = {}) {
  const {
    tradeResult,
    context
  } = params;

  if (!tradeResult) {
    throw new Error('tradeResult is required');
  }

  const body = { tradeResult };
  if (context && typeof context === 'object') {
    body.context = context;
  }

  return apiRequest('/ai-trading/meta-controller/record-outcome', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export default {
  getMetaControllerStatus,
  makeDecision,
  recordOutcome
};
