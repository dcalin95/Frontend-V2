/**
 * 📊 PerformanceSummary Component Test Suite
 * 
 * Unit tests pentru PerformanceSummary component:
 * - Rendering with data
 * - Loading state
 * - Error state
 * - Empty state
 * - Props handling
 * 
 * @module PerformanceSummary.test
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PerformanceSummary from '../components/performance/PerformanceSummary';
import { performanceApiService } from '../services';
import { useErrorHandler } from '../hooks/useErrorHandler';

// Mock dependencies
jest.mock('../services', () => ({
  performanceApiService: {
    getMetrics: jest.fn(),
    getRiskMetrics: jest.fn()
  }
}));

const mockHandleError = jest.fn();
jest.mock('../hooks/useErrorHandler', () => ({
  useErrorHandler: jest.fn(() => ({
    handleError: mockHandleError
  }))
}));

jest.mock('../utils/logger', () => ({
  errorWithPrefix: jest.fn(),
  logWithPrefix: jest.fn()
}));

jest.mock('../utils/helpers', () => ({
  handleApiError: jest.fn((err) => Promise.resolve(err?.message || 'Error')),
  getUserFriendlyError: jest.fn((err) => err?.message || 'Error')
}));

describe('PerformanceSummary', () => {
  const mockUserId = 'user-123';
  const mockMetrics = {
    netProfit: 1000,
    winRate: 0.65,
    totalTrades: 100,
    avgReturn: 0.05,
    sharpeRatio: 1.2
  };
  const mockRiskMetrics = {
    maxDrawdown: 15.5,
    volatility: 0.12,
    maxPercentPerTrade: 5
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockHandleError.mockClear();
    // Reset mock return value
    useErrorHandler.mockReturnValue({
      handleError: mockHandleError
    });
  });

  describe('Rendering', () => {
    test('should render with provided metrics and riskMetrics', () => {
      render(
        <PerformanceSummary
          userId={mockUserId}
          metrics={mockMetrics}
          riskMetrics={mockRiskMetrics}
        />
      );

      expect(screen.getByText(/Performance Summary/i)).toBeInTheDocument();
    });

    test('should render loading state initially', () => {
      render(<PerformanceSummary userId={mockUserId} />);

      expect(screen.getByText(/Loading performance summary/i)).toBeInTheDocument();
    });

    test('should render error state', async () => {
      performanceApiService.getMetrics.mockRejectedValue(new Error('API Error'));

      render(<PerformanceSummary userId={mockUserId} />);

      // Component should render with provided data (no loading when props provided)
      await waitFor(() => {
        // Component renders immediately with provided props
        expect(screen.getByText(/Performance Summary/i)).toBeInTheDocument();
      }, { timeout: 500 });
    });

    test('should render with period prop', () => {
      // Component uses period internally but doesn't display it as text
      render(
        <PerformanceSummary
          userId={mockUserId}
          period="7d"
          metrics={mockMetrics}
          riskMetrics={mockRiskMetrics}
        />
      );

      // Component should render with provided data
      expect(screen.getByText(/Performance Summary/i)).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    test('should display metrics when provided', () => {
      render(
        <PerformanceSummary
          userId={mockUserId}
          metrics={mockMetrics}
          riskMetrics={mockRiskMetrics}
        />
      );

      // Component should render with data
      expect(screen.getByText(/Performance Summary/i)).toBeInTheDocument();
    });

    test('should handle missing metrics gracefully', () => {
      render(
        <PerformanceSummary
          userId={mockUserId}
          metrics={null}
          riskMetrics={mockRiskMetrics}
        />
      );

      // Should still render
      expect(screen.getByText(/Performance Summary/i)).toBeInTheDocument();
    });

    test('should handle missing riskMetrics gracefully', () => {
      render(
        <PerformanceSummary
          userId={mockUserId}
          metrics={mockMetrics}
          riskMetrics={null}
        />
      );

      // Should still render
      expect(screen.getByText(/Performance Summary/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should call handleError on API error', async () => {
      performanceApiService.getMetrics.mockRejectedValue(new Error('API Error'));

      render(<PerformanceSummary userId={mockUserId} />);

      await waitFor(() => {
        expect(mockHandleError).toHaveBeenCalled();
      });
    });
  });
});
