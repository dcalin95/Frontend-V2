/**
 * 📡 Signal API Service - Frontend API Client
 * 
 * Frontend service pentru signal management:
 * - List signals
 * - Get signal details
 * - Generate signals
 * - Validate signals
 * 
 * @module signalApiService
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
  if (!userId) {
    throw new Error('User ID is required');
  }

  const { token, signal, valid, limit = 50, offset = 0 } = filters;
  
  const params = new URLSearchParams({ userId });
  if (token) params.append('token', token);
  if (signal) params.append('signal', signal);
  if (valid !== undefined) params.append('valid', valid.toString());
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  return apiRequest(`${API_ENDPOINTS.SIGNALS_LIST}?${params.toString()}`, {
    method: 'GET'
  });
}

/**
 * Get signal details
 * @param {string} userId - User ID
 * @param {string} signalId - Signal ID
 * @returns {Promise<Object>} Signal details
 */
export async function getSignal(userId, signalId) {
  if (!userId || !signalId) {
    throw new Error('User ID and Signal ID are required');
  }

  return apiRequest(`${API_ENDPOINTS.SIGNALS_GET(signalId)}?userId=${encodeURIComponent(userId)}`, {
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
  if (!userId) {
    throw new Error('User ID is required');
  }
  if (!token || typeof token !== 'string') {
    throw new Error('Token is required and must be a string');
  }

  return apiRequest(API_ENDPOINTS.SIGNALS_GENERATE, {
    method: 'POST',
    body: JSON.stringify({ userId, token, marketData })
  });
}

/**
 * Validate signal
 * @param {string} userId - User ID
 * @param {string} signalId - Signal ID
 * @returns {Promise<Object>} Validation result
 */
export async function validateSignal(userId, signalId) {
  if (!userId || !signalId) {
    throw new Error('User ID and Signal ID are required');
  }

  return apiRequest(API_ENDPOINTS.SIGNALS_VALIDATE(signalId), {
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

