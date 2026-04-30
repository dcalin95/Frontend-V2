/**
 * 📡 useSignals - Custom Hook pentru Signals
 * 
 * Custom React hook pentru Signal management:
 * - List signals
 * - Generate signals
 * - Validate signals
 * - State management
 * 
 * @module useSignals
 */

import { useState, useEffect, useCallback } from 'react';
import { signalApiService } from '../services';
import { handleApiError } from '../utils/helpers';
import { errorWithPrefix } from '../utils/logger';

/**
 * Elimină rânduri duplicate pentru același rezultat vizual (ex. același token/signal/prețuri/reasoning).
 * Backend poate insera de mai multe ori în `ota.analysis_results` (retry, re-run ciclu).
 * Păstrează prima apariție (de obicei cea mai nouă vine primul din ORDER BY created_at DESC).
 * @param {Array} rows
 * @returns {Array}
 */
export function dedupeSignalsForDisplay(rows) {
  if (!Array.isArray(rows) || rows.length < 2) return Array.isArray(rows) ? rows : [];
  const seen = new Set();
  const out = [];
  for (const s of rows) {
    const reasoning = String(s.reasoning || '').trim().slice(0, 240);
    const k = [
      String(s.token || '').toUpperCase(),
      String(s.signal || '').toLowerCase(),
      s.entryPrice ?? '',
      s.stopLoss ?? '',
      s.takeProfit ?? '',
      s.confidence ?? '',
      reasoning,
    ].join('\u0001');
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
}

/**
 * Custom hook pentru Signals
 * @param {string} userId - User ID
 * @returns {Object} Signals state și functions
 */
export function useSignals(userId, options = {}) {
  const { limit = 50, offset = 0, autoRefresh = false, refreshInterval = 60000 } = options;
  
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({ limit, offset, total: 0, hasMore: false });

  /**
   * Load signals
   */
  const loadSignals = useCallback(async (params = {}) => {
    if (!userId) return;

    try {
      setRefreshing(true);
      const queryParams = { ...{ limit, offset }, ...params };
      const response = await signalApiService.getSignals(userId, queryParams);
      const raw = response.signals || response || [];
      const list = Array.isArray(raw) ? dedupeSignalsForDisplay(raw) : [];
      setSignals(list);
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
      errorWithPrefix('useSignals', 'Error loading signals:', err);
    } finally {
      setRefreshing(false);
    }
  }, [userId, limit, offset]);

  /**
   * Get signal by ID
   */
  const getSignal = useCallback(async (signalId) => {
    if (!userId || !signalId) {
      throw new Error('User ID and Signal ID are required');
    }

    try {
      setLoading(true);
      setError(null);
      const response = await signalApiService.getSignal(userId, signalId);
      return response.signal;
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Generate signal
   */
  const generateSignal = useCallback(async (token, marketData = null) => {
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!token) {
      throw new Error('Token is required');
    }

    try {
      setLoading(true);
      setError(null);
      const response = await signalApiService.generateSignal(userId, token, marketData);
      await loadSignals(); // Refresh list
      return response.signal;
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, loadSignals]);

  /**
   * Validate signal
   */
  const validateSignal = useCallback(async (signalId) => {
    if (!userId || !signalId) {
      throw new Error('User ID and Signal ID are required');
    }

    try {
      setLoading(true);
      setError(null);
      const response = await signalApiService.validateSignal(userId, signalId);
      await loadSignals(); // Refresh list
      return response.signal;
    } catch (err) {
      const errorMessage = await handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, loadSignals]);

  /**
   * Load next page
   */
  const loadNextPage = useCallback(async () => {
    if (!pagination.hasMore || loading) return;
    await loadSignals({ offset: pagination.offset + pagination.limit });
  }, [pagination, loading, loadSignals]);

  /**
   * Load previous page
   */
  const loadPreviousPage = useCallback(async () => {
    if (pagination.offset === 0 || loading) return;
    const newOffset = Math.max(0, pagination.offset - pagination.limit);
    await loadSignals({ offset: newOffset });
  }, [pagination, loading, loadSignals]);

  /**
   * Refresh signals
   */
  const refresh = useCallback(async () => {
    await loadSignals({ offset: 0 }); // Reset to first page
  }, [loadSignals]);

  // Auto-load signals on mount și when userId changes
  useEffect(() => {
    if (userId) {
      loadSignals();
    }
  }, [userId, loadSignals]);

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
    signals,
    loading,
    error,
    refreshing,
    pagination,
    loadSignals,
    getSignal,
    generateSignal,
    validateSignal,
    loadNextPage,
    loadPreviousPage,
    refresh
  };
}

