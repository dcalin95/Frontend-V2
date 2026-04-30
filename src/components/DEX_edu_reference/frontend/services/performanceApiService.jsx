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

import { API_ENDPOINTS } from '../utils/constants';
import { otaApiRequest } from '../utils/otaApiClient';

async function apiRequest(endpoint, options = {}) {
  try {
    return await otaApiRequest(endpoint, options);
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
 * Contorizare profit: GET /performance/profit – extragere + calcul din tranzacțiile închise (backend).
 * @param {string} walletAddress - Adresa wallet
 * @returns {Promise<{ totalProfitUsd: number, fromExecutions: number, fromDirectEntry: number, errors: string[] }>}
 */
export async function getProfitSummary(walletAddress) {
  if (!walletAddress) {
    return { totalProfitUsd: 0, fromExecutions: 0, fromDirectEntry: 0, errors: [] };
  }
  const params = new URLSearchParams({ userId: walletAddress });
  const res = await apiRequest(`${API_ENDPOINTS.PERFORMANCE_PROFIT}?${params.toString()}`, { method: 'GET' });
  return {
    totalProfitUsd: res?.totalProfitUsd ?? 0,
    fromExecutions: res?.fromExecutions ?? 0,
    fromDirectEntry: res?.fromDirectEntry ?? 0,
    executionsDetail: Array.isArray(res?.executionsDetail) ? res.executionsDetail : [],
    directEntryDetail: Array.isArray(res?.directEntryDetail) ? res.directEntryDetail : [],
    errors: res?.errors ?? []
  };
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
 * Get token-level performance breakdown for a user.
 * @param {string} userId - User ID
 * @param {Object} params - Optional params { period, periodStart, periodEnd, limit }
 * @returns {Promise<Object>} Token breakdown
 */
export async function getTokenBreakdown(userId, params = {}) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const { period, periodStart, periodEnd, limit } = params;
  const queryParams = new URLSearchParams({ userId });
  if (period) queryParams.append('period', period);
  if (periodStart) queryParams.append('periodStart', periodStart instanceof Date ? periodStart.toISOString() : periodStart);
  if (periodEnd) queryParams.append('periodEnd', periodEnd instanceof Date ? periodEnd.toISOString() : periodEnd);
  if (limit != null) queryParams.append('limit', String(limit));

  return apiRequest(`${API_ENDPOINTS.PERFORMANCE_TOKEN_BREAKDOWN}?${queryParams.toString()}`, {
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

/**
 * Save risk limits pentru un user
 * @param {string} userId - User ID
 * @param {Object} riskLimits - Risk limits { maxPercentPerTrade, maxPercentPerDay, dailyLossLimit, maxDrawdown, requireStopLoss, requireTakeProfit }
 * @returns {Promise<Object>} Saved risk limits
 */
export async function saveRiskLimits(userId, riskLimits) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  if (!riskLimits || typeof riskLimits !== 'object') {
    throw new Error('Risk limits are required');
  }

  return apiRequest(API_ENDPOINTS.PERFORMANCE_RISK_LIMITS, {
    method: 'PUT',
    body: JSON.stringify({
      userId,
      ...riskLimits
    })
  });
}

export default {
  getMetrics,
  getRiskMetrics,
  getTokenBreakdown,
  getHistory,
  getChartsData,
  saveRiskLimits
};

