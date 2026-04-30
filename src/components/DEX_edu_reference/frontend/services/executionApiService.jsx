/**
 * ⚡ Execution API Service - Frontend API Client
 * 
 * Frontend service pentru trade execution:
 * - Execute trades
 * - List trades
 * - Get trade details
 * - Cancel trades
 * 
 * @module executionApiService
 */

import { API_ENDPOINTS } from '../utils/constants';
import { otaApiRequest } from '../utils/otaApiClient';

/** Request către backend: timeout 15s, 1 retry la eroare de rețea, getApiBaseUrl() la fiecare request. */
async function apiRequest(endpoint, options = {}) {
  try {
    return await otaApiRequest(endpoint, options);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`Execution API Error [${endpoint}]:`, error);
    }
    throw error;
  }
}

/**
 * Execute trade (backend may run on-chain via bot; response can include txHash and source: 'ota_auto').
 * @param {string} userId - User ID
 * @param {Object} tradeData - Trade data { signalId, tokenIn, tokenOut, amountIn, amountOutMin, deadline }
 * @returns {Promise<Object>} Executed trade { tradeId?, txHash?, source?: 'ota_auto' }
 */
export async function executeTrade(userId, tradeData) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  return apiRequest(API_ENDPOINTS.EXECUTION_EXECUTE, {
    method: 'POST',
    body: JSON.stringify({ userId, ...tradeData })
  });
}

/**
 * Get all trades pentru un user (backend may include source: 'ota_auto' and txHash for OTA Auto executions).
 * @param {string} userId - User ID
 * @param {Object} filters - Optional filters { status, tokenIn, tokenOut, chain, limit, offset }
 * @returns {Promise<Object>} Trades list with pagination; each trade may have { source: 'ota_auto', txHash }
 */
export async function getTrades(userId, filters = {}) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const { status, tokenIn, tokenOut, chain, pair, limit = 50, offset = 0 } = filters;
  
  const params = new URLSearchParams({ userId });
  if (status) params.append('status', status);
  if (tokenIn) params.append('tokenIn', tokenIn);
  if (tokenOut) params.append('tokenOut', tokenOut);
  if (chain) params.append('chain', chain);
  if (pair) params.append('pair', String(pair));
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  return apiRequest(`${API_ENDPOINTS.EXECUTION_TRADES}?${params.toString()}`, {
    method: 'GET'
  });
}

/**
 * Get trade details
 * @param {string} userId - User ID
 * @param {string} tradeId - Trade ID
 * @returns {Promise<Object>} Trade details
 */
export async function getTrade(userId, tradeId) {
  if (!userId || !tradeId) {
    throw new Error('User ID and Trade ID are required');
  }

  return apiRequest(API_ENDPOINTS.EXECUTION_TRADE(tradeId) + `?userId=${encodeURIComponent(userId)}`, {
    method: 'GET'
  });
}

/**
 * Cancel trade
 * @param {string} userId - User ID
 * @param {string} tradeId - Trade ID
 * @returns {Promise<Object>} Cancelled trade
 */
export async function cancelTrade(userId, tradeId) {
  if (!userId || !tradeId) {
    throw new Error('User ID and Trade ID are required');
  }

  return apiRequest(API_ENDPOINTS.EXECUTION_CANCEL(tradeId), {
    method: 'POST',
    body: JSON.stringify({ userId })
  });
}

export default {
  executeTrade,
  getTrades,
  getTrade,
  cancelTrade
};

