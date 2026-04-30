/**
 * 📊 QuickStats Component Test Suite
 * 
 * Unit tests pentru QuickStats component:
 * - Rendering with data
 * - Loading state
 * - Error state
 * - Empty state
 * - Stats calculation
 * 
 * @module QuickStats.test
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuickStats from '../components/dashboard/QuickStats';
import { usePerformance } from '../hooks/usePerformance';
import { useExecution } from '../hooks/useExecution';
import { useErrorHandler } from '../hooks/useErrorHandler';

// Mock dependencies
jest.mock('../hooks/usePerformance', () => ({
  usePerformance: jest.fn()
}));

jest.mock('../hooks/useExecution', () => ({
  useExecution: jest.fn()
}));

const mockHandleError = jest.fn();
jest.mock('../hooks/useErrorHandler', () => ({
  useErrorHandler: jest.fn(() => ({
    handleError: mockHandleError
  }))
}));

describe('QuickStats', () => {
  const mockUserId = 'user-123';
  const mockMetrics = {
    netProfit: 1000,
    winRate: 0.65,
    totalTrades: 100
  };
  const mockTrades = [
    { id: '1', status: 'completed', profit: 100 },
    { id: '2', status: 'completed', profit: -50 },
    { id: '3', status: 'pending' }
  ];

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
      usePerformance.mockReturnValue({
        metrics: mockMetrics,
        loading: false,
        error: null
      });
      useExecution.mockReturnValue({
        trades: mockTrades,
        loading: false,
        error: null
      });

      render(<QuickStats userId={mockUserId} />);

      expect(screen.getByText(/Total Profit/i)).toBeInTheDocument();
    });

    test('should render loading state', () => {
      usePerformance.mockReturnValue({
        metrics: null,
        loading: true,
        error: null
      });
      useExecution.mockReturnValue({
        trades: [],
        loading: true,
        error: null
      });

      render(<QuickStats userId={mockUserId} />);

      expect(screen.getByText(/Loading stats/i)).toBeInTheDocument();
    });

    test('should render error state', () => {
      usePerformance.mockReturnValue({
        metrics: null,
        loading: false,
        error: 'API Error'
      });
      useExecution.mockReturnValue({
        trades: [],
        loading: false,
        error: null
      });

      render(<QuickStats userId={mockUserId} />);

      // EmptyState displays title as h3 element
      expect(screen.getByRole('heading', { name: /Unable to Load Stats/i })).toBeInTheDocument();
    });

    test('should render empty state when no data', () => {
      usePerformance.mockReturnValue({
        metrics: null,
        loading: false,
        error: null
      });
      useExecution.mockReturnValue({
        trades: [],
        loading: false,
        error: null
      });

      render(<QuickStats userId={mockUserId} />);

      // EmptyState displays title as h3 element
      expect(screen.getByRole('heading', { name: /No Statistics Yet/i })).toBeInTheDocument();
    });
  });

  describe('Stats Calculation', () => {
    test('should calculate stats from metrics and trades', () => {
      usePerformance.mockReturnValue({
        metrics: mockMetrics,
        loading: false,
        error: null
      });
      useExecution.mockReturnValue({
        trades: mockTrades,
        loading: false,
        error: null
      });

      render(<QuickStats userId={mockUserId} />);

      // Should display calculated stats
      expect(screen.getByText(/Total Profit/i)).toBeInTheDocument();
    });

    test('should handle missing metrics', () => {
      usePerformance.mockReturnValue({
        metrics: null,
        loading: false,
        error: null
      });
      useExecution.mockReturnValue({
        trades: mockTrades,
        loading: false,
        error: null
      });

      render(<QuickStats userId={mockUserId} />);

      // Should still render
      expect(screen.getByText(/Total Profit/i)).toBeInTheDocument();
    });

    test('should handle missing trades', () => {
      usePerformance.mockReturnValue({
        metrics: mockMetrics,
        loading: false,
        error: null
      });
      useExecution.mockReturnValue({
        trades: [],
        loading: false,
        error: null
      });

      render(<QuickStats userId={mockUserId} />);

      // Should still render
      expect(screen.getByText(/Total Profit/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should call handleError on error', () => {
      usePerformance.mockReturnValue({
        metrics: null,
        loading: false,
        error: 'API Error'
      });
      useExecution.mockReturnValue({
        trades: [],
        loading: false,
        error: null
      });

      render(<QuickStats userId={mockUserId} />);

      expect(mockHandleError).toHaveBeenCalled();
    });
  });
});
