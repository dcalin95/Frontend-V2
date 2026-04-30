/**
 * 🤖 useModelInference - Custom Hook pentru ML Model Inference
 * 
 * Custom React hook pentru Model Inference functionality:
 * - Get model status
 * - Predict regime
 * - Predict returns
 * - State management
 * 
 * @module useModelInference
 */

import { useState, useEffect, useCallback } from 'react';
import { otaModelInferenceService } from '../services';
import { handleApiError } from '../utils/helpers';
import { errorWithPrefix } from '../utils/logger';

/**
 * Custom hook pentru Model Inference
 * @returns {Object} Model Inference state și functions
 */
export function useModelInference() {
  const [status, setStatus] = useState(null);
  const [regimePrediction, setRegimePrediction] = useState(null);
  const [returnPrediction, setReturnPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Get model inference status
   */
  const getStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await otaModelInferenceService.getModelInferenceStatus();
      setStatus(response.status || response);
      return response;
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      errorWithPrefix('useModelInference', 'Error getting status:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Predict regime
   * @param {Object} params - Prediction parameters
   */
  const predictRegime = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await otaModelInferenceService.predictRegime(params);
      // Backend pune prediction în response.prediction, dar patterns/trend/support/resistance
      // sunt în root-ul răspunsului → le mergem cu prediction
      const pred = response.prediction || response;
      const merged = {
        ...pred,
        patterns: pred.patterns ?? response.patterns ?? [],
        trend: pred.trend ?? response.trend ?? null,
        support: pred.support ?? response.support ?? null,
        resistance: pred.resistance ?? response.resistance ?? null,
        confidence: pred.confidence ?? response.confidence ?? null,
      };
      setRegimePrediction(merged);
      return response;
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      errorWithPrefix('useModelInference', 'Error predicting regime:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Predict return
   * @param {Object} params - Prediction parameters
   */
  const predictReturn = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await otaModelInferenceService.predictReturn(params);
      // Backend returnează predicted_return; frontend citește expectedReturn → mapăm
      const pred = response.prediction || response;
      const mapped = {
        ...pred,
        expectedReturn: pred.expectedReturn ?? pred.predicted_return ?? null,
        confidence: pred.confidence ?? null,
      };
      setReturnPrediction(mapped);
      return response;
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      errorWithPrefix('useModelInference', 'Error predicting return:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear predictions
   */
  const clearPredictions = useCallback(() => {
    setRegimePrediction(null);
    setReturnPrediction(null);
    setError(null);
  }, []);

  // Auto-load status on mount (catch silently — error stored in state)
  useEffect(() => {
    getStatus().catch(() => {});
  }, [getStatus]);

  return {
    status,
    regimePrediction,
    returnPrediction,
    loading,
    error,
    getStatus,
    predictRegime,
    predictReturn,
    clearPredictions
  };
}

export default useModelInference;
