/**
 * 🤖 useAITrading - Custom Hook pentru AI Trading
 * 
 * Custom React hook pentru AI Trading functionality:
 * - Start/Stop bot
 * - Get status și stats
 * - Market analysis
 * - State management
 * 
 * @module useAITrading
 */

import { useState, useEffect, useCallback } from 'react';
import { aiTradingApiService } from '../services';
import { analyzeMarketWithLlmProvider } from '../services/otaAnalyzeFacade';
import { loadOutcomesForAnalyze, buildAnalyzeOptions } from '../utils/otaOutcomesHelper';
import { handleApiError } from '../utils/helpers';
import { errorWithPrefix } from '../utils/logger';

/**
 * Custom hook pentru AI Trading
 * @param {string} userId - User ID
 * @returns {Object} AI Trading state și functions
 */
export function useAITrading(userId) {
  const [status, setStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Load bot status
   */
  const loadStatus = useCallback(async () => {
    if (!userId) return;
    
    try {
      setRefreshing(true);
      const response = await aiTradingApiService.getAITradingBotStatus(userId);
      setStatus(response.status || null);
      setError(null);
    } catch (err) {
      // Real API only - set error state
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      setStatus(null);
      errorWithPrefix('AI Trading', '❌ Error loading bot status:', err);
    } finally {
      setRefreshing(false);
    }
  }, [userId]);

  /**
   * Load bot statistics
   */
  const loadStats = useCallback(async () => {
    if (!userId) return;
    
    try {
      setRefreshing(true);
      const response = await aiTradingApiService.getAITradingBotStats(userId);
      setStats(response.stats || null);
      setError(null);
    } catch (err) {
      // Real API only - set error state
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      setStats(null);
      errorWithPrefix('AI Trading', '❌ Error loading bot stats:', err);
    } finally {
      setRefreshing(false);
    }
  }, [userId]);

  /**
   * Start AI Trading Bot
   */
  const startBot = useCallback(async (config) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      setLoading(true);
      setError(null);
      const response = await aiTradingApiService.startAITradingBot(userId, config);
      await loadStatus(); // Refresh status
      await loadStats(); // Refresh stats
      return response;
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, loadStatus, loadStats]);

  /**
   * Stop AI Trading Bot
   */
  const stopBot = useCallback(async () => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      setLoading(true);
      setError(null);
      const response = await aiTradingApiService.stopAITradingBot(userId);
      await loadStatus(); // Refresh status
      await loadStats(); // Refresh stats
      return response;
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, loadStatus, loadStats]);

  /**
   * Analyze Market
   * ⚡ IMPORTANT: userId is OPTIONAL for price analysis
   * - Without userId: Public price analysis (for AI/system use)
   * - With userId: User-scoped analysis (for personal trading signals)
   */
  const analyzeMarket = useCallback(async (token, marketData = null) => {
    if (!token) {
      throw new Error('Token is required');
    }
    // userId is now optional - allows AI to access prices without authentication
    // If userId is provided, send recentOutcomes for LLM in-context learning
    const recentOutcomes = userId ? await loadOutcomesForAnalyze(userId).catch(() => []) : null;
    const options = buildAnalyzeOptions(userId, { marketData, recentOutcomes });

    try {
      setLoading(true);
      setError(null);
      const response = await analyzeMarketWithLlmProvider(token, options);
      // Backend returns { success: true, signal: {...} }, so extract signal
      return response?.signal || response;
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Refresh data
   */
  const refresh = useCallback(async () => {
    await Promise.all([loadStatus(), loadStats()]);
  }, [loadStatus, loadStats]);

  // Auto-load status și stats on mount și when userId changes
  useEffect(() => {
    if (userId) {
      loadStatus();
      loadStats();
    }
  }, [userId, loadStatus, loadStats]);

  // Auto-refresh interval (every 30 seconds)
  useEffect(() => {
    if (!userId || !status?.running) return;

    const interval = setInterval(() => {
      refresh();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [userId, status?.running, refresh]);

  return {
    status,
    stats,
    loading,
    error,
    refreshing,
    startBot,
    stopBot,
    analyzeMarket,
    refresh,
    loadStatus,
    loadStats
  };
}

