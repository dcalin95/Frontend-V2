/**
 * 📊 Strategy API Service - Frontend API Client
 * 
 * Frontend service pentru strategy management:
 * - List strategies
 * - Create/Update/Delete strategies
 * - Enable/Disable strategies
 * 
 * @module strategyApiService
 */

import { API_ENDPOINTS } from '../utils/constants';
import { otaApiRequest } from '../utils/otaApiClient';
import { logWithPrefix, errorWithPrefix } from '../utils/logger';

const OTA_EMERGENCY_NEW_TRADES_DISABLED =
  process.env.REACT_APP_OTA_EMERGENCY_NEW_TRADES_DISABLED === 'true';
const OTA_EMERGENCY_MESSAGE =
  'Emergency safety lock is active: enabling or creating active trading strategies is disabled.';

async function apiRequest(endpoint, options = {}) {
  try {
    logWithPrefix('StrategyAPI', 'Request:', { endpoint, method: options.method || 'GET' });
    const data = await otaApiRequest(endpoint, options);
    logWithPrefix('StrategyAPI', 'Response:', { endpoint, success: true });
    return data;
  } catch (error) {
    errorWithPrefix('StrategyAPI', `Error [${endpoint}]:`, error);
    throw error;
  }
}

/**
 * Get all strategies pentru un user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Strategies list
 */
export async function getStrategies(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  return apiRequest(`${API_ENDPOINTS.STRATEGIES_LIST}?userId=${encodeURIComponent(userId)}`, {
    method: 'GET'
  });
}

/**
 * Get strategy details
 * @param {string} userId - User ID
 * @param {string} strategyId - Strategy ID
 * @returns {Promise<Object>} Strategy details
 */
export async function getStrategy(userId, strategyId) {
  if (!userId || !strategyId) {
    throw new Error('User ID and Strategy ID are required');
  }

  return apiRequest(`${API_ENDPOINTS.STRATEGIES_UPDATE(strategyId)}?userId=${encodeURIComponent(userId)}`, {
    method: 'GET'
  });
}

/**
 * Create new strategy
 * @param {string} userId - User ID
 * @param {Object} strategyData - Strategy data { name, type, config, riskLevel }
 * @returns {Promise<Object>} Created strategy
 */
export async function createStrategy(userId, strategyData) {
  if (OTA_EMERGENCY_NEW_TRADES_DISABLED && strategyData?.enabled === true) {
    throw new Error(OTA_EMERGENCY_MESSAGE);
  }
  if (!userId) {
    throw new Error('User ID is required');
  }

  return apiRequest(API_ENDPOINTS.STRATEGIES_CREATE, {
    method: 'POST',
    body: JSON.stringify({ userId, ...strategyData })
  });
}

/**
 * Update strategy
 * @param {string} userId - User ID
 * @param {string} strategyId - Strategy ID
 * @param {Object} updates - Strategy updates { name, type, config, riskLevel, enabled }
 * @returns {Promise<Object>} Updated strategy
 */
export async function updateStrategy(userId, strategyId, updates) {
  if (OTA_EMERGENCY_NEW_TRADES_DISABLED && updates?.enabled === true) {
    throw new Error(OTA_EMERGENCY_MESSAGE);
  }
  if (!userId || !strategyId) {
    throw new Error('User ID and Strategy ID are required');
  }

  return apiRequest(API_ENDPOINTS.STRATEGIES_UPDATE(strategyId), {
    method: 'PUT',
    body: JSON.stringify({ userId, ...updates })
  });
}

/**
 * Delete strategy
 * @param {string} userId - User ID
 * @param {string} strategyId - Strategy ID
 * @returns {Promise<Object>} Success response
 */
export async function deleteStrategy(userId, strategyId) {
  if (!userId || !strategyId) {
    throw new Error('User ID and Strategy ID are required');
  }

  return apiRequest(`${API_ENDPOINTS.STRATEGIES_DELETE(strategyId)}?userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE'
  });
}

/**
 * Enable strategy
 * @param {string} userId - User ID
 * @param {string} strategyId - Strategy ID
 * @returns {Promise<Object>} Success response
 */
export async function enableStrategy(userId, strategyId) {
  if (OTA_EMERGENCY_NEW_TRADES_DISABLED) {
    throw new Error(OTA_EMERGENCY_MESSAGE);
  }
  if (!userId || !strategyId) {
    throw new Error('User ID and Strategy ID are required');
  }

  return apiRequest(API_ENDPOINTS.STRATEGIES_ENABLE(strategyId), {
    method: 'POST',
    body: JSON.stringify({ userId })
  });
}

/**
 * Disable strategy
 * @param {string} userId - User ID
 * @param {string} strategyId - Strategy ID
 * @returns {Promise<Object>} Success response
 */
export async function disableStrategy(userId, strategyId) {
  if (!userId || !strategyId) {
    throw new Error('User ID and Strategy ID are required');
  }

  return apiRequest(API_ENDPOINTS.STRATEGIES_DISABLE(strategyId), {
    method: 'POST',
    body: JSON.stringify({ userId })
  });
}

export default {
  getStrategies,
  getStrategy,
  createStrategy,
  updateStrategy,
  deleteStrategy,
  enableStrategy,
  disableStrategy
};

