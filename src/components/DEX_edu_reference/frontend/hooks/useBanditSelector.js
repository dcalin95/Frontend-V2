/**
 * 🎰 useBanditSelector - Custom Hook pentru Bandit Strategy Selector
 * 
 * Custom React hook pentru Bandit Selector functionality:
 * - Get statistics
 * - Select strategy
 * - Record rewards
 * - State management
 * 
 * @module useBanditSelector
 */

import { useState, useEffect, useCallback } from 'react';
import { otaBanditService } from '../services';
import { handleApiError } from '../utils/helpers';
import { errorWithPrefix } from '../utils/logger';

/**
 * Custom hook pentru Bandit Selector
 * @param {string|null} userId - optional stable identifier (ex: wallet address) for per-user bandit state
 * @returns {Object} Bandit Selector state și functions
 */
export function useBanditSelector(userId = null) {
  const [statistics, setStatistics] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Get bandit statistics
   */
  const getStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await otaBanditService.getBanditStatistics();
      setStatistics(response.statistics || response);
      return response;
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      errorWithPrefix('useBanditSelector', 'Error getting statistics:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Select a strategy using bandit algorithm
   * @param {Object} params - Selection parameters
   */
  const selectStrategy = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await otaBanditService.selectStrategy({
        ...params,
        userId: params?.userId ?? userId ?? null,
      });
      setSelectedStrategy(response.selectedStrategy || response);
      // Refresh statistics after selection
      await getStatistics();
      return response;
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      errorWithPrefix('useBanditSelector', 'Error selecting strategy:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getStatistics, userId]);

  /**
   * Record a reward for a strategy
   * @param {Object} params - Reward parameters
   */
  const recordReward = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const ctx = { ...(params?.context || {}) };
      if (userId && !ctx.userId) ctx.userId = userId;
      const response = await otaBanditService.recordReward({ ...params, context: ctx });
      // Refresh statistics after recording reward
      await getStatistics();
      return response;
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      errorWithPrefix('useBanditSelector', 'Error recording reward:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getStatistics, userId]);

  /**
   * Reset statistics
   */
  const resetStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await otaBanditService.resetStatistics();
      setStatistics(null);
      setSelectedStrategy(null);
      return response;
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      errorWithPrefix('useBanditSelector', 'Error resetting statistics:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load statistics on mount
  useEffect(() => {
    getStatistics();
  }, [getStatistics]);

  return {
    statistics,
    selectedStrategy,
    loading,
    error,
    getStatistics,
    selectStrategy,
    recordReward,
    resetStatistics
  };
}

export default useBanditSelector;
