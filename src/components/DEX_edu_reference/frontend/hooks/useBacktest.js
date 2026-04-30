/**
 * 🔬 useBacktest - Custom Hook pentru Backtest Operations
 * 
 * Custom React hook pentru Backtest functionality:
 * - Run backtests
 * - Get backtest metrics
 * - State management
 * 
 * @module useBacktest
 */

import { useState, useCallback } from 'react';
import { otaBacktestService } from '../services';
import { handleApiError } from '../utils/helpers';
import { errorWithPrefix } from '../utils/logger';

/**
 * Custom hook pentru Backtest
 * @returns {Object} Backtest state și functions
 */
export function useBacktest() {
  const [backtestResults, setBacktestResults] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Run backtest
   * @param {Object} params - Backtest parameters
   */
  const runBacktest = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await otaBacktestService.runBacktest(params);
      setBacktestResults(response.results || response);
      return response;
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      errorWithPrefix('useBacktest', 'Error running backtest:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get backtest metrics
   * @param {Object} params - Metrics parameters
   */
  const getMetrics = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await otaBacktestService.getBacktestMetrics(params);
      setMetrics(response);
      return response;
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      errorWithPrefix('useBacktest', 'Error getting metrics:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear results
   */
  const clearResults = useCallback(() => {
    setBacktestResults(null);
    setMetrics(null);
    setError(null);
  }, []);

  return {
    backtestResults,
    metrics,
    loading,
    error,
    runBacktest,
    getMetrics,
    clearResults
  };
}

export default useBacktest;
