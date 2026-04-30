/**
 * 📈 usePerformance - Custom Hook pentru Performance
 * 
 * Custom React hook pentru Performance tracking:
 * - Get metrics
 * - Get risk metrics
 * - Get history
 * - Charts data
 * - State management
 * 
 * @module usePerformance
 */

import { useState, useEffect, useCallback } from 'react';
import { performanceApiService } from '../services';
import { handleApiError } from '../utils/helpers';

/**
 * Custom hook pentru Performance
 * @param {string} userId - User ID
 * @param {Object} options - Options { period, autoRefresh, refreshInterval }
 * @returns {Object} Performance state și functions
 */
export function usePerformance(userId, options = {}) {
  const { 
    period = '30d', 
    periodStart = null, 
    periodEnd = null,
    autoRefresh = false, 
    refreshInterval = 60000 
  } = options;
  
  const [metrics, setMetrics] = useState(null);
  const [riskMetrics, setRiskMetrics] = useState(null);
  const [history, setHistory] = useState([]);
  const [chartsData, setChartsData] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Load metrics
   */
  const loadMetrics = useCallback(async (params = {}) => {
    if (!userId) return;

    try {
      setRefreshing(true);
      const queryParams = { 
        period, 
        periodStart, 
        periodEnd,
        ...params 
      };
      const response = await performanceApiService.getMetrics(userId, queryParams);
      setMetrics(response.metrics || response || null);
      setError(null);
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      console.error('Error loading metrics:', err);
    } finally {
      setRefreshing(false);
    }
  }, [userId, period, periodStart, periodEnd]);

  /**
   * Load risk metrics
   */
  const loadRiskMetrics = useCallback(async (params = {}) => {
    if (!userId) return;

    try {
      setRefreshing(true);
      const queryParams = { 
        period, 
        periodStart, 
        periodEnd,
        ...params 
      };
      const response = await performanceApiService.getRiskMetrics(userId, queryParams);
      setRiskMetrics(response.riskMetrics || response || null);
      setError(null);
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      console.error('Error loading risk metrics:', err);
    } finally {
      setRefreshing(false);
    }
  }, [userId, period, periodStart, periodEnd]);

  /**
   * Load history
   */
  const loadHistory = useCallback(async (params = {}) => {
    if (!userId) return;

    try {
      setRefreshing(true);
      const queryParams = { 
        period, 
        periodStart, 
        periodEnd,
        ...params 
      };
      const response = await performanceApiService.getHistory(userId, queryParams);
      setHistory(response.history || response.trades || []);
      setError(null);
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      console.error('Error loading history:', err);
    } finally {
      setRefreshing(false);
    }
  }, [userId, period, periodStart, periodEnd]);

  /**
   * Load charts data
   */
  const loadChartsData = useCallback(async (params = {}) => {
    if (!userId) return;

    try {
      setRefreshing(true);
      const queryParams = { 
        period, 
        periodStart, 
        periodEnd,
        ...params 
      };
      const response = await performanceApiService.getChartsData(userId, queryParams);
      setChartsData(response.charts || response || null);
      setError(null);
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      console.error('Error loading charts data:', err);
    } finally {
      setRefreshing(false);
    }
  }, [userId, period, periodStart, periodEnd]);

  /**
   * Load all performance data
   */
  const loadAll = useCallback(async (params = {}) => {
    await Promise.all([
      loadMetrics(params),
      loadRiskMetrics(params),
      loadHistory(params),
      loadChartsData(params)
    ]);
  }, [loadMetrics, loadRiskMetrics, loadHistory, loadChartsData]);

  /**
   * Refresh all data
   */
  const refresh = useCallback(async () => {
    await loadAll();
  }, [loadAll]);

  // Auto-load data on mount și when userId/period changes
  useEffect(() => {
    if (userId) {
      loadAll();
    }
  }, [userId, period, loadAll]);

  // Auto-refresh interval (dacă e enabled)
  useEffect(() => {
    if (!userId || !autoRefresh) return;

    const interval = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [userId, autoRefresh, refreshInterval, refresh]);

  return {
    metrics,
    riskMetrics,
    history,
    chartsData,
    loading: refreshing,
    error,
    refreshing,
    loadMetrics,
    loadRiskMetrics,
    loadHistory,
    loadChartsData,
    loadAll,
    refresh
  };
}

