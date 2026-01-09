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

import { API_BASE_URL, API_ENDPOINTS } from '../utils/constants';
import { handleApiError } from '../utils/helpers';

/**
 * Generic API request helper
 * @private
 */
async function apiRequest(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        // TODO: Add authentication token
        // 'Authorization': `Bearer ${getAuthToken()}`
      },
      ...options
    };

    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`Execution API Error [${endpoint}]:`, error);
    }
    throw error;
  }
}

/**
 * Execute trade
 * @param {string} userId - User ID
 * @param {Object} tradeData - Trade data { signalId, tokenIn, tokenOut, amountIn, amountOutMin, deadline }
 * @returns {Promise<Object>} Executed trade
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
 * Get all trades pentru un user
 * @param {string} userId - User ID
 * @param {Object} filters - Optional filters { status, tokenIn, tokenOut, limit, offset }
 * @returns {Promise<Object>} Trades list with pagination
 */
export async function getTrades(userId, filters = {}) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const { status, tokenIn, tokenOut, limit = 50, offset = 0 } = filters;
  
  const params = new URLSearchParams({ userId });
  if (status) params.append('status', status);
  if (tokenIn) params.append('tokenIn', tokenIn);
  if (tokenOut) params.append('tokenOut', tokenOut);
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

