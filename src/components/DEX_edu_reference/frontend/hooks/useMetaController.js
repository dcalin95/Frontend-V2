/**
 * 🎛️ useMetaController - Custom Hook pentru Meta Controller
 * 
 * Custom React hook pentru Meta Controller functionality:
 * - Get status
 * - Make ensemble decisions
 * - Record outcomes
 * - State management
 * 
 * @module useMetaController
 */

import { useState, useEffect, useCallback } from 'react';
import { otaMetaControllerService } from '../services';
import { handleApiError } from '../utils/helpers';
import { errorWithPrefix } from '../utils/logger';

/**
 * Custom hook pentru Meta Controller
 * @returns {Object} Meta Controller state și functions
 */
export function useMetaController() {
  const [status, setStatus] = useState(null);
  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Get meta controller status
   */
  const getStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await otaMetaControllerService.getMetaControllerStatus();
      setStatus(response.status || response);
      return response;
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      errorWithPrefix('useMetaController', 'Error getting status:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Make an ensemble decision
   * @param {Object} params - Decision parameters (context, strategySignals)
   */
  const makeDecision = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await otaMetaControllerService.makeDecision(params);
      setDecision(response.decision || response);
      return response;
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      errorWithPrefix('useMetaController', 'Error making decision:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Record a trade outcome
   * @param {Object} params - Outcome parameters (tradeResult)
   */
  const recordOutcome = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await otaMetaControllerService.recordOutcome(params);
      // Optionally refresh status after recording outcome
      // await getStatus();
      return response;
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      errorWithPrefix('useMetaController', 'Error recording outcome:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear decision
   */
  const clearDecision = useCallback(() => {
    setDecision(null);
    setError(null);
  }, []);

  // Auto-load status on mount
  useEffect(() => {
    getStatus();
  }, [getStatus]);

  return {
    status,
    decision,
    loading,
    error,
    getStatus,
    makeDecision,
    recordOutcome,
    clearDecision
  };
}

export default useMetaController;
