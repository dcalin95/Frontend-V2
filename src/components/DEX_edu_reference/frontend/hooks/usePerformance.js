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
import { getBinanceChartData, SYMBOL_MAP } from '../../utils/DEX/binanceApi';
import { warnWithPrefix, errorWithPrefix } from '../utils/logger';
// Real API data only. No fake or unverified data.

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
  const [loading, setLoading] = useState(false);
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
      setMetrics(response?.metrics ?? response ?? null);
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
      setRiskMetrics(response?.riskMetrics ?? response ?? null);
      setError(null);
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      errorWithPrefix('usePerformance', 'Error loading risk metrics:', err);
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
      errorWithPrefix('usePerformance', 'Error loading history:', err);
    } finally {
      setRefreshing(false);
    }
  }, [userId, period, periodStart, periodEnd]);

  /**
   * Load charts data
   * 
   * DEVELOPMENT MODE: Folosește Binance API public pentru date reale
   * Backend-server is deployed on Render: https://backend-server-eu.onrender.com
   */
  const loadChartsData = useCallback(async (params = {}) => {
    if (!userId) return;

    try {
      setRefreshing(true);
      
      // Try backend API first
      try {
        const response = await performanceApiService.getChartsData(userId, period);
        setChartsData(response?.charts ?? response ?? null);
        setError(null);
        return;
      } catch (backendError) {
        // Backend not available - use Binance API (development mode)
        console.warn('[usePerformance] Backend API not available, using Binance API:', backendError.message);
        
        // Use Binance API for real data (development/testing)
        const symbol = SYMBOL_MAP['BTC'] || 'BTCUSDT'; // Default to BTC
        const binanceData = await getBinanceChartData(symbol, period);
        
        setChartsData({
          data: binanceData,
          history: binanceData,
          period,
          source: 'binance_api', // Mark as Binance API data
          generatedAt: new Date().toISOString()
        });
        setError(null);
        return; // Exit successfully after Binance API
      }
    } catch (err) {
      // Real API only - set error state
      const errorMessage = await handleApiError(err);
      errorWithPrefix('usePerformance', 'All APIs failed:', errorMessage);
      setChartsData(null);
      setError(errorMessage);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, period, periodStart, periodEnd]); // loadAll is stable (useCallback with stable deps)

  // Auto-refresh interval (dacă e enabled)
  useEffect(() => {
    if (!userId || !autoRefresh) return;

    const interval = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, autoRefresh, refreshInterval]); // refresh is stable (useCallback with stable deps)

  return {
    metrics,
    riskMetrics,
    history,
    chartsData,
    loading,
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

