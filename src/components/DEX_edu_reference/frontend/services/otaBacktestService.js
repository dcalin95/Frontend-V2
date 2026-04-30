/**
 * 🔬 OTA Backtest API Service - Backtest Endpoints
 * 
 * Frontend service pentru interacțiune cu OTA Backtest API:
 * - Run backtests
 * - Get backtest metrics
 * - Historical data availability
 * 
 * @module otaBacktestService
 */

import { otaApiRequest } from '../utils/otaApiClient';

async function apiRequest(endpoint, options = {}) {
  try {
    return await otaApiRequest(endpoint, options);
  } catch (error) {
    const isWalkForwardInsufficientData =
      endpoint.includes('walk-forward') &&
      error?.failedStatus === 400 &&
      /not enough historical data/i.test(String(error?.message ?? ''));
    if (process.env.NODE_ENV === 'development' && !isWalkForwardInsufficientData) {
      console.error(`[OTA Backtest API] Error [${endpoint}]:`, error);
    }
    throw error;
  }
}

/**
 * Run a backtest
 * @param {Object} params - Backtest parameters
 * @param {string} params.strategy - Strategy name ('trend-following' | 'mean-reversion' | 'momentum')
 * @param {string} params.token - Token symbol (default: 'BTC')
 * @param {string} params.timeframe - Timeframe (default: '5m')
 * @param {string} params.quoteToken - Quote token (default: 'USDT')
 * @param {string} params.startDate - Start date ISO string
 * @param {string} params.endDate - End date ISO string
 * @param {number} params.initialCapital - Initial capital (default: 10000)
 * @returns {Promise<Object>} Backtest results
 */
export async function runBacktest(params = {}) {
  const {
    strategy,
    token = 'BTC',
    timeframe = '5m',
    quoteToken = 'USDT',
    startDate = null,
    endDate = null,
    initialCapital = 10000
  } = params;

  if (!strategy) {
    throw new Error('strategy is required');
  }

  return apiRequest('/ai-trading/backtest/run', {
    method: 'POST',
    body: JSON.stringify({
      strategy,
      token,
      timeframe,
      quoteToken,
      startDate,
      endDate,
      initialCapital: parseFloat(initialCapital)
    })
  });
}

/**
 * Get backtest metrics for a token/timeframe. If strategy is provided, backend may return lastRun (cached last backtest) with metrics and equityCurve.
 * @param {Object} params - Query parameters
 * @param {string} params.token - Token symbol
 * @param {string} params.timeframe - Timeframe
 * @param {string} params.quoteToken - Quote token (default: 'USDT')
 * @param {string} params.strategy - Strategy (optional); when set, response may include lastRun with cached result
 * @param {string} params.startDate - Start date ISO string (optional)
 * @param {string} params.endDate - End date ISO string (optional)
 * @returns {Promise<Object>} Backtest metrics (+ optional lastRun)
 */
export async function getBacktestMetrics(params = {}) {
  const {
    token,
    timeframe,
    quoteToken = 'USDT',
    strategy = null,
    startDate = null,
    endDate = null
  } = params;

  if (!token || !timeframe) {
    throw new Error('token and timeframe are required');
  }

  const queryParams = new URLSearchParams({
    token,
    timeframe,
    quoteToken
  });

  if (strategy) queryParams.append('strategy', strategy);
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);

  return apiRequest(`/ai-trading/backtest/metrics?${queryParams.toString()}`, {
    method: 'GET'
  });
}

/**
 * Run walk-forward validation.
 * @param {Object} params
 * @returns {Promise<Object>}
 */
export async function runWalkForward(params = {}) {
  const {
    strategy = 'trend-following',
    token = 'BTC',
    timeframe = '5m',
    quoteToken = 'USDT',
    startDate = null,
    endDate = null,
    initialCapital = 10000,
    trainBars = 288,
    testBars = 144,
    stepBars = 144,
    maxFolds = 12
  } = params;

  try {
    return await apiRequest('/ai-trading/backtest/walk-forward', {
      method: 'POST',
      body: JSON.stringify({
        strategy,
        token,
        timeframe,
        quoteToken,
        startDate,
        endDate,
        initialCapital: parseFloat(initialCapital),
        trainBars: parseInt(trainBars, 10),
        testBars: parseInt(testBars, 10),
        stepBars: parseInt(stepBars, 10),
        maxFolds: parseInt(maxFolds, 10),
      })
    });
  } catch (error) {
    const isInsufficientData =
      error?.failedStatus === 400 &&
      /not enough historical data/i.test(String(error?.message ?? ''));
    if (isInsufficientData) {
      return { results: null, insufficientData: true, message: error.message };
    }
    throw error;
  }
}

export default {
  runBacktest,
  getBacktestMetrics,
  runWalkForward
};
