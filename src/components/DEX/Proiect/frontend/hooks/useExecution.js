/**
 * ⚡ useExecution - Custom Hook pentru Trade Execution
 * 
 * Custom React hook pentru Trade Execution:
 * - Execute trades
 * - List trades
 * - Get trade details
 * - Cancel trades
 * - State management
 * 
 * @module useExecution
 */

import { useState, useEffect, useCallback } from 'react';
import { executionApiService } from '../services';
import { handleApiError } from '../utils/helpers';

/**
 * Custom hook pentru Execution
 * @param {string} userId - User ID
 * @param {Object} options - Options { limit, offset, autoRefresh, refreshInterval }
 * @returns {Object} Execution state și functions
 */
export function useExecution(userId, options = {}) {
  const { 
    limit = 50, 
    offset = 0,
    autoRefresh = false, 
    refreshInterval = 30000 
  } = options;
  
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({ limit, offset, total: 0, hasMore: false });

  /**
   * Load trades
   */
  const loadTrades = useCallback(async (params = {}) => {
    if (!userId) return;

    try {
      setRefreshing(true);
      const queryParams = { ...{ limit, offset }, ...params };
      const response = await executionApiService.getTrades(userId, queryParams);
      setTrades(response.trades || response || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0,
        hasMore: response.hasMore || false,
        limit: queryParams.limit,
        offset: queryParams.offset
      }));
      setError(null);
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      console.error('Error loading trades:', err);
    } finally {
      setRefreshing(false);
    }
  }, [userId, limit, offset]);

  /**
   * Get trade by ID
   */
  const getTrade = useCallback(async (tradeId) => {
    if (!userId || !tradeId) {
      throw new Error('User ID and Trade ID are required');
    }

    try {
      setLoading(true);
      setError(null);
      const response = await executionApiService.getTrade(userId, tradeId);
      return response.trade;
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Execute trade
   */
  const executeTrade = useCallback(async (tradeData) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      setLoading(true);
      setError(null);
      const response = await executionApiService.executeTrade(userId, tradeData);
      await loadTrades(); // Refresh list
      return response.trade;
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, loadTrades]);

  /**
   * Cancel trade
   */
  const cancelTrade = useCallback(async (tradeId) => {
    if (!userId || !tradeId) {
      throw new Error('User ID and Trade ID are required');
    }

    try {
      setLoading(true);
      setError(null);
      const response = await executionApiService.cancelTrade(userId, tradeId);
      await loadTrades(); // Refresh list
      return response.trade;
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, loadTrades]);

  /**
   * Load next page
   */
  const loadNextPage = useCallback(async () => {
    if (!pagination.hasMore || loading) return;
    await loadTrades({ offset: pagination.offset + pagination.limit });
  }, [pagination, loading, loadTrades]);

  /**
   * Load previous page
   */
  const loadPreviousPage = useCallback(async () => {
    if (pagination.offset === 0 || loading) return;
    const newOffset = Math.max(0, pagination.offset - pagination.limit);
    await loadTrades({ offset: newOffset });
  }, [pagination, loading, loadTrades]);

  /**
   * Refresh trades
   */
  const refresh = useCallback(async () => {
    await loadTrades({ offset: 0 }); // Reset to first page
  }, [loadTrades]);

  // Auto-load trades on mount și when userId changes
  useEffect(() => {
    if (userId) {
      loadTrades();
    }
  }, [userId, loadTrades]);

  // Auto-refresh interval (dacă e enabled)
  useEffect(() => {
    if (!userId || !autoRefresh) return;

    const interval = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [userId, autoRefresh, refreshInterval, refresh]);

  return {
    trades,
    loading,
    error,
    refreshing,
    pagination,
    loadTrades,
    getTrade,
    executeTrade,
    cancelTrade,
    loadNextPage,
    loadPreviousPage,
    refresh
  };
}

