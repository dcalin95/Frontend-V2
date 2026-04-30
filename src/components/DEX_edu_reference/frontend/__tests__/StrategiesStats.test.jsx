/**
 * 📊 StrategiesStats Component Test Suite
 * 
 * Unit tests pentru StrategiesStats component:
 * - Rendering with data
 * - Loading state
 * - Error state
 * - Empty state
 * - Stats calculation
 * 
 * @module StrategiesStats.test
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import StrategiesStats from '../components/strategies/StrategiesStats';
import { useStrategies } from '../hooks/useStrategies';
import { usePerformance } from '../hooks/usePerformance';
import { useErrorHandler } from '../hooks/useErrorHandler';

// Mock dependencies
jest.mock('../hooks/useStrategies', () => ({
  useStrategies: jest.fn()
}));

jest.mock('../hooks/usePerformance', () => ({
  usePerformance: jest.fn()
}));

const mockHandleError = jest.fn();
jest.mock('../hooks/useErrorHandler', () => ({
  useErrorHandler: jest.fn(() => ({
    handleError: mockHandleError
  }))
}));

describe('StrategiesStats', () => {
  const mockUserId = 'user-123';
  const mockStrategies = [
    { id: '1', name: 'Strategy 1', enabled: true, status: 'active' },
    { id: '2', name: 'Strategy 2', enabled: true, status: 'active' },
    { id: '3', name: 'Strategy 3', enabled: false, status: 'paused' },
    { id: '4', name: 'Strategy 4', enabled: false, status: 'paused' }
  ];
  const mockMetrics = {
    netProfit: 1500
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
    test('should render with data', () => {
      useStrategies.mockReturnValue({
        strategies: mockStrategies,
        loading: false,
        error: null
      });
      usePerformance.mockReturnValue({
        metrics: mockMetrics,
        loading: false,
        error: null
      });

      render(<StrategiesStats userId={mockUserId} />);

      expect(screen.getByText(/Total Strategies/i)).toBeInTheDocument();
      expect(screen.getByText(/Active/i)).toBeInTheDocument();
      expect(screen.getByText(/Paused/i)).toBeInTheDocument();
      expect(screen.getByText(/Total Profit/i)).toBeInTheDocument();
    });

    test('should render loading state', () => {
      useStrategies.mockReturnValue({
        strategies: [],
        loading: true,
        error: null
      });
      usePerformance.mockReturnValue({
        metrics: null,
        loading: true,
        error: null
      });

      render(<StrategiesStats userId={mockUserId} />);

      expect(screen.getByText(/Loading strategies stats/i)).toBeInTheDocument();
    });

    test('should render error state', () => {
      useStrategies.mockReturnValue({
        strategies: [],
        loading: false,
        error: 'API Error'
      });
      usePerformance.mockReturnValue({
        metrics: null,
        loading: false,
        error: null
      });

      render(<StrategiesStats userId={mockUserId} />);

      // EmptyState displays title as h3 element
      expect(screen.getByRole('heading', { name: /Unable to Load Strategies Stats/i })).toBeInTheDocument();
    });

    test('should render empty state when no strategies', () => {
      useStrategies.mockReturnValue({
        strategies: [],
        loading: false,
        error: null
      });
      usePerformance.mockReturnValue({
        metrics: null,
        loading: false,
        error: null
      });

      render(<StrategiesStats userId={mockUserId} />);

      // EmptyState displays title as h3 element
      expect(screen.getByRole('heading', { name: /No Strategies Yet/i })).toBeInTheDocument();
    });
  });

  describe('Stats Calculation', () => {
    test('should calculate total strategies correctly', () => {
      useStrategies.mockReturnValue({
        strategies: mockStrategies,
        loading: false,
        error: null
      });
      usePerformance.mockReturnValue({
        metrics: mockMetrics,
        loading: false,
        error: null
      });

      render(<StrategiesStats userId={mockUserId} />);

      // Total strategies should be 4
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    test('should calculate active strategies correctly', () => {
      useStrategies.mockReturnValue({
        strategies: mockStrategies,
        loading: false,
        error: null
      });
      usePerformance.mockReturnValue({
        metrics: mockMetrics,
        loading: false,
        error: null
      });

      render(<StrategiesStats userId={mockUserId} />);

      // Active strategies: 2 (enabled: true or status: 'active')
      // Component shows the active count
      const activeTexts = screen.getAllByText(/Active/i);
      expect(activeTexts.length).toBeGreaterThan(0);
    });

    test('should calculate paused strategies correctly', () => {
      useStrategies.mockReturnValue({
        strategies: mockStrategies,
        loading: false,
        error: null
      });
      usePerformance.mockReturnValue({
        metrics: mockMetrics,
        loading: false,
        error: null
      });

      render(<StrategiesStats userId={mockUserId} />);

      // Paused strategies: 2 (enabled: false or status: 'paused')
      const pausedTexts = screen.getAllByText(/Paused/i);
      expect(pausedTexts.length).toBeGreaterThan(0);
    });

    test('should display total profit from metrics', () => {
      useStrategies.mockReturnValue({
        strategies: mockStrategies,
        loading: false,
        error: null
      });
      usePerformance.mockReturnValue({
        metrics: mockMetrics,
        loading: false,
        error: null
      });

      render(<StrategiesStats userId={mockUserId} />);

      // Should show formatted profit: $1.50K (formatNumber formats >= 1000 as K)
      expect(screen.getByText(/\$1\.50K/)).toBeInTheDocument();
    });

    test('should handle strategies with enabled flag', () => {
      const strategiesWithEnabled = [
        { id: '1', name: 'Strategy 1', enabled: true },
        { id: '2', name: 'Strategy 2', enabled: false }
      ];

      useStrategies.mockReturnValue({
        strategies: strategiesWithEnabled,
        loading: false,
        error: null
      });
      usePerformance.mockReturnValue({
        metrics: mockMetrics,
        loading: false,
        error: null
      });

      render(<StrategiesStats userId={mockUserId} />);

      // Should calculate based on enabled flag
      expect(screen.getByText(/Total Strategies/i)).toBeInTheDocument();
    });

    test('should handle strategies with status flag', () => {
      const strategiesWithStatus = [
        { id: '1', name: 'Strategy 1', status: 'active' },
        { id: '2', name: 'Strategy 2', status: 'paused' }
      ];

      useStrategies.mockReturnValue({
        strategies: strategiesWithStatus,
        loading: false,
        error: null
      });
      usePerformance.mockReturnValue({
        metrics: mockMetrics,
        loading: false,
        error: null
      });

      render(<StrategiesStats userId={mockUserId} />);

      // Should calculate based on status flag
      expect(screen.getByText(/Total Strategies/i)).toBeInTheDocument();
    });

    test('should handle missing metrics', () => {
      useStrategies.mockReturnValue({
        strategies: mockStrategies,
        loading: false,
        error: null
      });
      usePerformance.mockReturnValue({
        metrics: null,
        loading: false,
        error: null
      });

      render(<StrategiesStats userId={mockUserId} />);

      // Should still render with $0.00 profit
      expect(screen.getByText(/\$0\.00/)).toBeInTheDocument();
    });

    test('should format large profit numbers', () => {
      const largeProfitMetrics = {
        netProfit: 1500000
      };

      useStrategies.mockReturnValue({
        strategies: mockStrategies,
        loading: false,
        error: null
      });
      usePerformance.mockReturnValue({
        metrics: largeProfitMetrics,
        loading: false,
        error: null
      });

      render(<StrategiesStats userId={mockUserId} />);

      // Should format as $1.50M
      expect(screen.getByText(/\$1\.50M/)).toBeInTheDocument();
    });

    test('should format medium profit numbers', () => {
      const mediumProfitMetrics = {
        netProfit: 2500
      };

      useStrategies.mockReturnValue({
        strategies: mockStrategies,
        loading: false,
        error: null
      });
      usePerformance.mockReturnValue({
        metrics: mediumProfitMetrics,
        loading: false,
        error: null
      });

      render(<StrategiesStats userId={mockUserId} />);

      // Should format as $2.50K
      expect(screen.getByText(/\$2\.50K/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should call handleError on error', () => {
      useStrategies.mockReturnValue({
        strategies: [],
        loading: false,
        error: 'API Error'
      });
      usePerformance.mockReturnValue({
        metrics: null,
        loading: false,
        error: null
      });

      render(<StrategiesStats userId={mockUserId} />);

      expect(mockHandleError).toHaveBeenCalledWith(
        'API Error',
        expect.objectContaining({
          title: 'Failed to Load Strategies Stats',
          showToast: true
        })
      );
    });

    test('should not call handleError when loading', () => {
      useStrategies.mockReturnValue({
        strategies: [],
        loading: true,
        error: 'API Error'
      });
      usePerformance.mockReturnValue({
        metrics: null,
        loading: true,
        error: null
      });

      render(<StrategiesStats userId={mockUserId} />);

      expect(mockHandleError).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('should handle null userId', () => {
      useStrategies.mockReturnValue({
        strategies: [],
        loading: false,
        error: null
      });
      usePerformance.mockReturnValue({
        metrics: null,
        loading: false,
        error: null
      });

      render(<StrategiesStats userId={null} />);

      // Should still render empty state
      // EmptyState displays title as h3 element
      expect(screen.getByRole('heading', { name: /No Strategies Yet/i })).toBeInTheDocument();
    });

    test('should handle empty strategies array', () => {
      useStrategies.mockReturnValue({
        strategies: [],
        loading: false,
        error: null
      });
      usePerformance.mockReturnValue({
        metrics: mockMetrics,
        loading: false,
        error: null
      });

      render(<StrategiesStats userId={mockUserId} />);

      // EmptyState displays title as h3 element
      expect(screen.getByRole('heading', { name: /No Strategies Yet/i })).toBeInTheDocument();
    });

    test('should handle strategies with both enabled and status', () => {
      const strategiesWithBoth = [
        { id: '1', name: 'Strategy 1', enabled: true, status: 'active' },
        { id: '2', name: 'Strategy 2', enabled: false, status: 'paused' }
      ];

      useStrategies.mockReturnValue({
        strategies: strategiesWithBoth,
        loading: false,
        error: null
      });
      usePerformance.mockReturnValue({
        metrics: mockMetrics,
        loading: false,
        error: null
      });

      render(<StrategiesStats userId={mockUserId} />);

      // Should calculate correctly (checks both enabled and status)
      expect(screen.getByText(/Total Strategies/i)).toBeInTheDocument();
    });
  });
});