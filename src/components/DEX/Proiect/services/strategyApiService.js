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

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/ai-trading/strategies';

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
      console.error(`Strategy API Error [${endpoint}]:`, error);
    }
    throw error;
  }
}

/**
 * Get all strategies pentru un user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Strategies list
 */
export async function getStrategies(userId) {
  return apiRequest(`?userId=${encodeURIComponent(userId)}`, {
    method: 'GET'
  });
}

/**
 * Get strategy details
 * @param {string} strategyId - Strategy ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Strategy details
 */
export async function getStrategy(strategyId, userId) {
  return apiRequest(`/${strategyId}?userId=${encodeURIComponent(userId)}`, {
    method: 'GET'
  });
}

/**
 * Create new strategy
 * @param {Object} strategyData - Strategy data { userId, name, type, config, riskLevel }
 * @returns {Promise<Object>} Created strategy
 */
export async function createStrategy(strategyData) {
  return apiRequest('/', {
    method: 'POST',
    body: JSON.stringify(strategyData)
  });
}

/**
 * Update strategy
 * @param {string} strategyId - Strategy ID
 * @param {Object} updates - Strategy updates { userId, name, type, config, riskLevel, enabled }
 * @returns {Promise<Object>} Updated strategy
 */
export async function updateStrategy(strategyId, updates) {
  return apiRequest(`/${strategyId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

/**
 * Delete strategy
 * @param {string} strategyId - Strategy ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Success response
 */
export async function deleteStrategy(strategyId, userId) {
  return apiRequest(`/${strategyId}?userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE'
  });
}

/**
 * Enable strategy
 * @param {string} strategyId - Strategy ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Success response
 */
export async function enableStrategy(strategyId, userId) {
  return apiRequest(`/${strategyId}/enable`, {
    method: 'POST',
    body: JSON.stringify({ userId })
  });
}

/**
 * Disable strategy
 * @param {string} strategyId - Strategy ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Success response
 */
export async function disableStrategy(strategyId, userId) {
  return apiRequest(`/${strategyId}/disable`, {
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

