/**
 * 🤖 OTA Model Inference API Service - ML Model Inference Endpoints
 * 
 * Frontend service pentru interacțiune cu OTA Model Inference API:
 * - Get model status
 * - Predict regime (bull/bear/sideways)
 * - Predict returns
 * 
 * @module otaModelInferenceService
 */

import { otaApiRequest } from '../utils/otaApiClient';

async function apiRequest(endpoint, options = {}) {
  try {
    return await otaApiRequest(endpoint, options);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[OTA Model Inference API] Error [${endpoint}]:`, error);
    }
    throw error;
  }
}

/**
 * Get model inference status
 * @returns {Promise<Object>} Model status
 */
export async function getModelInferenceStatus() {
  return apiRequest('/ai-trading/model-inference/status', {
    method: 'GET'
  });
}

/**
 * Predict regime (bull/bear/sideways)
 * @param {Object} params - Prediction parameters
 * @param {string} params.token - Token symbol
 * @param {string} params.quoteToken - Quote token (default: 'USDT')
 * @param {string} params.timeframe - Timeframe (default: '5m')
 * @returns {Promise<Object>} Regime prediction
 */
export async function predictRegime(params = {}) {
  const {
    token,
    quoteToken = 'USDT',
    timeframe = '5m'
  } = params;

  if (!token) {
    throw new Error('token is required');
  }

  return apiRequest('/ai-trading/model-inference/predict-regime', {
    method: 'POST',
    body: JSON.stringify({
      token,
      quoteToken,
      timeframe
    })
  });
}

/**
 * Predict future return
 * @param {Object} params - Prediction parameters
 * @param {string} params.token - Token symbol
 * @param {string} params.quoteToken - Quote token (default: 'USDT')
 * @param {string} params.timeframe - Timeframe (default: '5m')
 * @param {string} params.horizon - Prediction horizon (default: '5m')
 * @returns {Promise<Object>} Return prediction
 */
export async function predictReturn(params = {}) {
  const {
    token,
    quoteToken = 'USDT',
    timeframe = '5m',
    horizon = '5m'
  } = params;

  if (!token) {
    throw new Error('token is required');
  }

  return apiRequest('/ai-trading/model-inference/predict-return', {
    method: 'POST',
    body: JSON.stringify({
      token,
      quoteToken,
      timeframe,
      horizon
    })
  });
}

export default {
  getModelInferenceStatus,
  predictRegime,
  predictReturn
};
