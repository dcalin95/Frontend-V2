/**
 * 📡 Signal API Service - Frontend API Client
 * 
 * URL din apiEndpoints (runtime-config / env). SSOT: src/config/apiEndpoints.js
 * @module signalApiService
 */

import { getApiBaseUrl } from '../config/apiEndpoints.js';

/**
 * Generic API request helper
 * @private
 */
async function apiRequest(endpoint, options = {}) {
  try {
    const base = `${getApiBaseUrl()}/ai-trading/signals`;
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
      console.error(`Signal API Error [${endpoint}]:`, error);
    }
    throw error;
  }
}

/**
 * Get all signals pentru un user
 * @param {string} userId - User ID
 * @param {Object} filters - Optional filters { token, signal, valid, limit, offset }
 * @returns {Promise<Object>} Signals list with pagination
 */
export async function getSignals(userId, filters = {}) {
  const { token, signal, valid, limit = 50, offset = 0 } = filters;
  
  const params = new URLSearchParams({ userId });
  if (token) params.append('token', token);
  if (signal) params.append('signal', signal);
  if (valid !== undefined) params.append('valid', valid.toString());
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  return apiRequest(`?${params.toString()}`, {
    method: 'GET'
  });
}

/**
 * Get signal details
 * @param {string} signalId - Signal ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Signal details
 */
export async function getSignal(signalId, userId) {
  return apiRequest(`/${signalId}?userId=${encodeURIComponent(userId)}`, {
    method: 'GET'
  });
}

/**
 * Generate new trading signal
 * @param {string} userId - User ID
 * @param {string} token - Token symbol (BTC, ETH, BNB, etc.)
 * @param {Object} marketData - Market data (optional)
 * @returns {Promise<Object>} Generated signal
 */
export async function generateSignal(userId, token, marketData = null) {
  return apiRequest('/generate', {
    method: 'POST',
    body: JSON.stringify({ userId, token, marketData })
  });
}

/**
 * Validate signal
 * @param {string} signalId - Signal ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Validation result
 */
export async function validateSignal(signalId, userId) {
  return apiRequest(`/${signalId}/validate`, {
    method: 'POST',
    body: JSON.stringify({ userId })
  });
}

export default {
  getSignals,
  getSignal,
  generateSignal,
  validateSignal
};

