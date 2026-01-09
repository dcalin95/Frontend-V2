/**
 * 📈 Performance API Service - Frontend API Client
 * 
 * Frontend service pentru performance tracking:
 * - Get performance metrics
 * - Get risk metrics
 * - Get trading history
 * - Get performance charts data
 * 
 * @module performanceApiService
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
      console.error(`Performance API Error [${endpoint}]:`, error);
    }
    throw error;
  }
}

/**
 * Get performance metrics pentru un user
 * @param {string} userId - User ID
 * @param {Object} params - Optional params { period, periodStart, periodEnd }
 * @returns {Promise<Object>} Performance metrics
 */
export async function getMetrics(userId, params = {}) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const { period, periodStart, periodEnd } = params;
  
  const queryParams = new URLSearchParams({ userId });
  if (period) queryParams.append('period', period);
  if (periodStart) queryParams.append('periodStart', periodStart instanceof Date ? periodStart.toISOString() : periodStart);
  if (periodEnd) queryParams.append('periodEnd', periodEnd instanceof Date ? periodEnd.toISOString() : periodEnd);

  return apiRequest(`${API_ENDPOINTS.PERFORMANCE_METRICS}?${queryParams.toString()}`, {
    method: 'GET'
  });
}

/**
 * Get risk metrics pentru un user
 * @param {string} userId - User ID
 * @param {Object} params - Optional params { period, periodStart, periodEnd }
 * @returns {Promise<Object>} Risk metrics
 */
export async function getRiskMetrics(userId, params = {}) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const { period, periodStart, periodEnd } = params;
  
  const queryParams = new URLSearchParams({ userId });
  if (period) queryParams.append('period', period);
  if (periodStart) queryParams.append('periodStart', periodStart instanceof Date ? periodStart.toISOString() : periodStart);
  if (periodEnd) queryParams.append('periodEnd', periodEnd instanceof Date ? periodEnd.toISOString() : periodEnd);

  return apiRequest(`${API_ENDPOINTS.PERFORMANCE_RISK}?${queryParams.toString()}`, {
    method: 'GET'
  });
}

/**
 * Get trading history pentru un user
 * @param {string} userId - User ID
 * @param {Object} filters - Optional filters { status, tokenIn, tokenOut, period, periodStart, periodEnd, limit, offset }
 * @returns {Promise<Object>} Trading history with pagination
 */
export async function getHistory(userId, filters = {}) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const { status, tokenIn, tokenOut, period, periodStart, periodEnd, limit = 50, offset = 0 } = filters;
  
  const params = new URLSearchParams({ userId });
  if (status) params.append('status', status);
  if (tokenIn) params.append('tokenIn', tokenIn);
  if (tokenOut) params.append('tokenOut', tokenOut);
  if (period) params.append('period', period);
  if (periodStart) params.append('periodStart', periodStart instanceof Date ? periodStart.toISOString() : periodStart);
  if (periodEnd) params.append('periodEnd', periodEnd instanceof Date ? periodEnd.toISOString() : periodEnd);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  return apiRequest(`${API_ENDPOINTS.PERFORMANCE_HISTORY}?${params.toString()}`, {
    method: 'GET'
  });
}

/**
 * Get performance charts data
 * @param {string} userId - User ID
 * @param {string} period - Period ('1d', '7d', '30d', '90d', '1y')
 * @returns {Promise<Object>} Charts data
 */
export async function getChartsData(userId, period = '30d') {
  if (!userId) {
    throw new Error('User ID is required');
  }

  return apiRequest(`${API_ENDPOINTS.PERFORMANCE_CHARTS}?userId=${encodeURIComponent(userId)}&period=${period}`, {
    method: 'GET'
  });
}

export default {
  getMetrics,
  getRiskMetrics,
  getHistory,
  getChartsData
};

