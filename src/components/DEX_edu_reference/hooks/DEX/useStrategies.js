/**
 * 📊 useStrategies - Custom Hook pentru Strategies
 * 
 * Custom React hook pentru Strategy management:
 * - List strategies
 * - Create/Update/Delete strategies
 * - Enable/Disable strategies
 * - State management
 * 
 * @module useStrategies
 */

import { useState, useEffect, useCallback } from 'react';
import strategyApiService from '../../services/DEX/strategyApiService';
import { handleApiError } from '../../utils/DEX/helpers';

/**
 * Custom hook pentru Strategies
 * @param {string} userId - User ID
 * @returns {Object} Strategies state și functions
 */
export function useStrategies(userId) {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Load strategies
   */
  const loadStrategies = useCallback(async () => {
    if (!userId) return;

    try {
      setRefreshing(true);
      const response = await strategyApiService.getStrategies(userId);
      setStrategies(response.strategies || response || []);
      setError(null);
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      console.error('Error loading strategies:', err);
    } finally {
      setRefreshing(false);
    }
  }, [userId]);

  /**
   * Get strategy by ID
   */
  const getStrategy = useCallback(async (strategyId) => {
    if (!userId || !strategyId) {
      throw new Error('User ID and Strategy ID are required');
    }

    try {
      setLoading(true);
      setError(null);
      const response = await strategyApiService.getStrategy(userId, strategyId);
      return response.strategy || response;
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Create strategy
   */
  const createStrategy = useCallback(async (strategyData) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      setLoading(true);
      setError(null);
      const response = await strategyApiService.createStrategy(userId, strategyData);
      await loadStrategies(); // Refresh list
      return response.strategy;
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, loadStrategies]);

  /**
   * Update strategy
   */
  const updateStrategy = useCallback(async (strategyId, strategyData) => {
    if (!userId || !strategyId) {
      throw new Error('User ID and Strategy ID are required');
    }

    try {
      setLoading(true);
      setError(null);
      const response = await strategyApiService.updateStrategy(userId, strategyId, strategyData);
      await loadStrategies(); // Refresh list
      return response.strategy;
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, loadStrategies]);

  /**
   * Delete strategy
   */
  const deleteStrategy = useCallback(async (strategyId) => {
    if (!userId || !strategyId) {
      throw new Error('User ID and Strategy ID are required');
    }

    try {
      setLoading(true);
      setError(null);
      await strategyApiService.deleteStrategy(userId, strategyId);
      await loadStrategies(); // Refresh list
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, loadStrategies]);

  /**
   * Enable strategy
   */
  const enableStrategy = useCallback(async (strategyId) => {
    if (!userId || !strategyId) {
      throw new Error('User ID and Strategy ID are required');
    }

    try {
      setLoading(true);
      setError(null);
      const response = await strategyApiService.enableStrategy(userId, strategyId);
      await loadStrategies(); // Refresh list
      return response.strategy || response;
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, loadStrategies]);

  /**
   * Disable strategy
   */
  const disableStrategy = useCallback(async (strategyId) => {
    if (!userId || !strategyId) {
      throw new Error('User ID and Strategy ID are required');
    }

    try {
      setLoading(true);
      setError(null);
      const response = await strategyApiService.disableStrategy(userId, strategyId);
      await loadStrategies(); // Refresh list
      return response.strategy || response;
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, loadStrategies]);

  /**
   * Refresh strategies
   */
  const refresh = useCallback(async () => {
    await loadStrategies();
  }, [loadStrategies]);

  // Auto-load strategies on mount și when userId changes
  useEffect(() => {
    if (userId) {
      loadStrategies();
    }
  }, [userId, loadStrategies]);

  return {
    strategies,
    loading,
    error,
    refreshing,
    loadStrategies,
    getStrategy,
    createStrategy,
    updateStrategy,
    deleteStrategy,
    enableStrategy,
    disableStrategy,
    refresh
  };
}

