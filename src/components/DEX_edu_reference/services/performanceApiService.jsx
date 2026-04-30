/**
 * 📈 Performance API Service - Frontend API Client
 * 
 * URL din apiEndpoints (runtime-config / env). SSOT: src/config/apiEndpoints.js
 * @module performanceApiService
 */

import { getApiBaseUrl } from '../config/apiEndpoints.js';

/**
 * Generic API request helper
 * @private
 */
async function apiRequest(endpoint, options = {}) {
  try {
    const base = `${getApiBaseUrl()}/ai-trading/performance`;
    const url = `${base}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        // TODO: Add authentication token
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
      console.error(`Performance API Error [${endpoint}]:`, error);
    }
    throw error;
  }
}

/**
 * Get performance metrics pentru un user
 * @param {string} userId - User ID
 * @param {Date} periodStart - Period start date (optional)
 * @param {Date} periodEnd - Period end date (optional)
 * @returns {Promise<Object>} Performance metrics
 */
export async function getPerformanceMetrics(userId, periodStart = null, periodEnd = null) {
  const params = new URLSearchParams({ userId });
  if (periodStart) params.append('periodStart', periodStart.toISOString());
  if (periodEnd) params.append('periodEnd', periodEnd.toISOString());

  return apiRequest(`/metrics?${params.toString()}`, {
    method: 'GET'
  });
}

/**
 * Get risk metrics pentru un user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Risk metrics
 */
export async function getRiskMetrics(userId) {
  return apiRequest(`/risk?userId=${encodeURIComponent(userId)}`, {
    method: 'GET'
  });
}

/**
 * Get trading history pentru un user
 * @param {string} userId - User ID
 * @param {Object} filters - Optional filters { status, tokenIn, tokenOut, limit, offset }
 * @returns {Promise<Object>} Trading history with pagination
 */
export async function getTradingHistory(userId, filters = {}) {
  const { status, tokenIn, tokenOut, limit = 50, offset = 0 } = filters;
  
  const params = new URLSearchParams({ userId });
  if (status) params.append('status', status);
  if (tokenIn) params.append('tokenIn', tokenIn);
  if (tokenOut) params.append('tokenOut', tokenOut);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  return apiRequest(`/history?${params.toString()}`, {
    method: 'GET'
  });
}

/**
 * Get performance charts data
 * @param {string} userId - User ID
 * @param {string} period - Period ('1d', '7d', '30d', '90d', '1y')
 * @returns {Promise<Object>} Charts data
 */
export async function getPerformanceCharts(userId, period = '30d') {
  return apiRequest(`/charts?userId=${encodeURIComponent(userId)}&period=${period}`, {
    method: 'GET'
  });
}

export default {
  getPerformanceMetrics,
  getRiskMetrics,
  getTradingHistory,
  getPerformanceCharts
};

