/**
 * 🤖 AI Trading API Service - Frontend API Client
 * 
 * Frontend service pentru interacțiune cu AI Trading Backend API.
 * URL din apiEndpoints (runtime-config / env). SSOT: src/config/apiEndpoints.js
 * @module aiTradingApiService
 */

import { getApiBaseUrl } from '../config/apiEndpoints.js';

/**
 * Generic API request helper
 * @private
 */
async function apiRequest(endpoint, options = {}) {
  try {
    const base = `${getApiBaseUrl()}/ai-trading`;
    const url = `${base}${endpoint}`;
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
    // Log error for debugging (în development)
    if (process.env.NODE_ENV === 'development') {
      console.error(`API Error [${endpoint}]:`, error);
    }
    throw error;
  }
}

/**
 * Start AI Trading Bot
 * @param {string} userId - User ID
 * @param {Object} config - Trading configuration
 * @returns {Promise<Object>} Bot instance ID
 */
export async function startAITradingBot(userId, config) {
  if (!userId) {
    throw new Error('User ID is required');
  }
  if (!config || typeof config !== 'object') {
    throw new Error('Config is required and must be an object');
  }

  return apiRequest('/start', {
    method: 'POST',
    body: JSON.stringify({ userId, config })
  });
}

/**
 * Stop AI Trading Bot
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Success response
 */
export async function stopAITradingBot(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  return apiRequest('/stop', {
    method: 'POST',
    body: JSON.stringify({ userId })
  });
}

/**
 * Get AI Trading Bot Status
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Bot status
 */
export async function getAITradingBotStatus(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  return apiRequest(`/status?userId=${encodeURIComponent(userId)}`, {
    method: 'GET'
  });
}

/**
 * Get AI Trading Bot Statistics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Bot statistics
 */
export async function getAITradingBotStats(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  return apiRequest(`/stats?userId=${encodeURIComponent(userId)}`, {
    method: 'GET'
  });
}

/**
 * Analyze Market și generează trading signal
 * @param {string} userId - User ID
 * @param {string} token - Token symbol (BTC, ETH, BNB, etc.)
 * @param {Object} marketData - Market data (optional)
 * @returns {Promise<Object>} Trading signal
 */
export async function analyzeMarket(userId, token, marketData = null) {
  if (!userId) {
    throw new Error('User ID is required');
  }
  if (!token || typeof token !== 'string') {
    throw new Error('Token is required and must be a string');
  }

  return apiRequest('/analyze', {
    method: 'POST',
    body: JSON.stringify({ userId, token, marketData })
  });
}

/**
 * Get Contract State (fees, treasury, etc.)
 * @returns {Promise<Object>} Contract state
 */
export async function getContractState() {
  return apiRequest('/contract/state', {
    method: 'GET'
  });
}

export default {
  startAITradingBot,
  stopAITradingBot,
  getAITradingBotStatus,
  getAITradingBotStats,
  analyzeMarket,
  getContractState
};

