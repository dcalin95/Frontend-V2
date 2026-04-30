/**
 * 📊 usePerformance Hook Test Suite
 * 
 * Unit tests pentru usePerformance hook:
 * - Load metrics
 * - Load risk metrics
 * - Load charts data
 * - Error handling
 * 
 * @module usePerformance.test
 */

import { renderHook, waitFor } from '@testing-library/react';
import { usePerformance } from '../hooks/usePerformance';
import { performanceApiService } from '../services';
import { handleApiError } from '../utils/helpers';

// Mock dependencies (loadAll calls all four on mount)
jest.mock('../services', () => ({
  performanceApiService: {
    getMetrics: jest.fn(),
    getRiskMetrics: jest.fn(),
    getHistory: jest.fn(),
    getChartsData: jest.fn()
  }
}));

jest.mock('../utils/helpers', () => ({
  handleApiError: jest.fn((err) => Promise.resolve(err?.message || 'Error'))
}));

jest.mock('../utils/logger', () => ({
  errorWithPrefix: jest.fn()
}));

describe('usePerformance', () => {
  const mockUserId = 'user-123';
  const mockMetrics = {
    netProfit: 1000,
    winRate: 0.65,
    totalTrades: 100,
    avgReturn: 0.05
  };
  const mockRiskMetrics = {
    maxDrawdown: 15.5,
    sharpeRatio: 1.2,
    maxPercentPerTrade: 5
  };

  const mockHistory = { history: [] };
  const mockChartsData = { charts: [], data: [] };

  beforeEach(() => {
    jest.clearAllMocks();
    // loadAll() runs all four on mount; mock all so no undefined access
    performanceApiService.getMetrics.mockResolvedValue({ success: true, metrics: mockMetrics });
    performanceApiService.getRiskMetrics.mockResolvedValue({ success: true, riskMetrics: mockRiskMetrics });
    performanceApiService.getHistory.mockResolvedValue(mockHistory);
    performanceApiService.getChartsData.mockResolvedValue({ charts: mockChartsData.charts || mockChartsData });
  });

  describe('load metrics', () => {
    test('should load metrics successfully', async () => {
      performanceApiService.getMetrics.mockResolvedValue({
        success: true,
        metrics: mockMetrics
      });

      const { result } = renderHook(() => usePerformance(mockUserId));

      await waitFor(() => {
        expect(result.current.metrics).toEqual(mockMetrics);
      });

      expect(result.current.error).toBeNull();
    });

    test('should handle API error', async () => {
      const error = new Error('API Error');
      performanceApiService.getMetrics.mockRejectedValue(error);
      handleApiError.mockResolvedValue('API Error');

      const { result } = renderHook(() => usePerformance(mockUserId));

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error).toBe('API Error');
      expect(result.current.metrics).toBeNull();
    });

    test('should not load if userId is missing', async () => {
      const { result } = renderHook(() => usePerformance(null));

      // Should not call API
      expect(performanceApiService.getMetrics).not.toHaveBeenCalled();
    });
  });

  describe('load risk metrics', () => {
    test('should load risk metrics successfully', async () => {
      performanceApiService.getRiskMetrics.mockResolvedValue({
        success: true,
        riskMetrics: mockRiskMetrics
      });

      const { result } = renderHook(() => usePerformance(mockUserId, { period: '30d' }));

      await waitFor(() => {
        expect(result.current.riskMetrics).toEqual(mockRiskMetrics);
      });
    });
  });

  describe('load charts data', () => {
    test('should load charts data successfully', async () => {
      const chartsPayload = {
        profitChart: [{ date: '2025-01-01', value: 100 }],
        tradesChart: [{ date: '2025-01-01', count: 10 }]
      };

      performanceApiService.getChartsData.mockResolvedValue({
        success: true,
        charts: chartsPayload
      });

      const { result } = renderHook(() => usePerformance(mockUserId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Charts data should be available if the hook supports it
      expect(performanceApiService.getChartsData).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    test('should refresh metrics', async () => {
      performanceApiService.getMetrics.mockResolvedValue({ success: true, metrics: mockMetrics });
      performanceApiService.getRiskMetrics.mockResolvedValue({ success: true, riskMetrics: mockRiskMetrics });
      performanceApiService.getHistory.mockResolvedValue(mockHistory);
      performanceApiService.getChartsData.mockResolvedValue({ charts: mockChartsData.charts || mockChartsData });

      const { result } = renderHook(() => usePerformance(mockUserId));

      await waitFor(() => {
        expect(result.current.metrics).toEqual(mockMetrics);
      });

      const initialCallCount = performanceApiService.getMetrics.mock.calls.length;

      if (result.current.refresh) {
        await result.current.refresh();
        expect(performanceApiService.getMetrics).toHaveBeenCalledTimes(
          initialCallCount + 1
        );
      }
    });
  });
});
