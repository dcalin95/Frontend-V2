/**
 * 🎯 useOTAStrategies - Custom Hook pentru OTA Strategy Execution
 * 
 * Custom React hook pentru OTA Strategy functionality:
 * - List OTA strategies
 * - Execute strategies
 * - Get strategy status
 * - State management
 * 
 * @module useOTAStrategies
 */

import { useState, useEffect, useCallback } from 'react';
import { otaStrategyService } from '../services';
import { handleApiError } from '../utils/helpers';
import { errorWithPrefix } from '../utils/logger';

/**
 * Custom hook pentru OTA Strategies
 * @returns {Object} OTA Strategies state și functions
 */
export function useOTAStrategies() {
  const [strategies, setStrategies] = useState([]);
  const [executionStatus, setExecutionStatus] = useState(null);
  const [lastDecision, setLastDecision] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load strategies list
   */
  const listStrategies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await otaStrategyService.listStrategies();
      setStrategies(response.strategies || response || []);
      return response;
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      errorWithPrefix('useOTAStrategies', 'Error listing strategies:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Execute a strategy
   * @param {Object} params - Execution parameters
   */
  const executeStrategy = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await otaStrategyService.executeStrategy(params);
      setLastDecision(response.decision || response);
      // Refresh status after execution
      await getStrategyStatus();
      return response;
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      errorWithPrefix('useOTAStrategies', 'Error executing strategy:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get strategy execution status
   */
  const getStrategyStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await otaStrategyService.getStrategyStatus();
      setExecutionStatus(response.state || response);
      return response;
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      errorWithPrefix('useOTAStrategies', 'Error getting strategy status:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load strategies on mount
  useEffect(() => {
    listStrategies();
  }, [listStrategies]);

  return {
    strategies,
    executionStatus,
    lastDecision,
    loading,
    error,
    listStrategies,
    executeStrategy,
    getStrategyStatus
  };
}

export default useOTAStrategies;
