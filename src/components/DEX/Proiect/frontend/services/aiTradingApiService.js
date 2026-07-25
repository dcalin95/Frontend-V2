/**
 * 🤖 AI Trading API Service - Frontend API Client
 * 
 * Frontend service pentru interacțiune cu AI Trading Backend API:
 * - Start/Stop AI Trading Bot
 * - Get Status & Statistics
 * - Market Analysis
 * - Error handling
 * 
 * @module aiTradingApiService
 */

import { API_BASE_URL, API_ENDPOINTS } from '../utils/constants';
import { handleApiError } from '../utils/helpers';

/**
 * Generic API request helper
 * @private
 */
async function apiRequest(endpoint, options = {}) {
  try {
    // ✅ FIX: Ensure API_BASE_URL is valid
    const baseUrl = API_BASE_URL || 'https://backend-server-eu.onrender.com/api';
    if (!baseUrl || baseUrl.startsWith(':')) {
      console.error('❌ [aiTradingApiService] Invalid API_BASE_URL:', baseUrl);
      throw new Error('API_BASE_URL is not configured correctly');
    }
    const url = `${baseUrl}${endpoint}`;
    console.log(`🔌 [aiTradingApiService] Request URL: ${url}`);
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

  return apiRequest(API_ENDPOINTS.AI_TRADING_START, {
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

  return apiRequest(API_ENDPOINTS.AI_TRADING_STOP, {
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

  return apiRequest(`${API_ENDPOINTS.AI_TRADING_STATUS}?userId=${encodeURIComponent(userId)}`, {
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

  return apiRequest(`${API_ENDPOINTS.AI_TRADING_STATS}?userId=${encodeURIComponent(userId)}`, {
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

  return apiRequest(API_ENDPOINTS.AI_TRADING_ANALYZE, {
    method: 'POST',
    body: JSON.stringify({ userId, token, marketData })
  });
}

export default {
  startAITradingBot,
  stopAITradingBot,
  getAITradingBotStatus,
  getAITradingBotStats,
  analyzeMarket
};

