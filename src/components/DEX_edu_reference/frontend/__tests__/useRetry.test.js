/**
 * 🔄 useRetry Hook Test Suite
 * 
 * Unit tests pentru useRetry hook:
 * - Retry on failure
 * - Success on first attempt
 * - Max retries limit
 * - Error filtering (should not retry)
 * 
 * @module useRetry.test
 */

import { renderHook, act } from '@testing-library/react';
import { useRetry } from '../hooks/useRetry';
import { sleep } from '../utils/helpers';

// Mock sleep: resolve immediately for stable tests
jest.mock('../utils/helpers', () => ({
  sleep: jest.fn(() => Promise.resolve())
}));

describe('useRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    test('should initialize with default state', () => {
      const { result } = renderHook(() => useRetry());

      expect(result.current.isRetrying).toBe(false);
      expect(result.current.retryCount).toBe(0);
    });
  });

  describe('Success Cases', () => {
    test('should succeed on first attempt', async () => {
      const { result } = renderHook(() => useRetry());

      const mockFn = jest.fn().mockResolvedValue('success');

      const value = await result.current.retry(mockFn);
      expect(value).toBe('success');
      expect(result.current.isRetrying).toBe(false);
      expect(result.current.retryCount).toBe(0);
    });

    test('should retry once then succeed (calls sleep)', async () => {
      const { result } = renderHook(() => useRetry({
        maxRetries: 1,
        initialDelay: 50
      }));

      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce('ok');

      const value = await act(async () => {
        return await result.current.retry(mockFn);
      });

      expect(value).toBe('ok');
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(sleep).toHaveBeenCalledTimes(1);
      expect(sleep).toHaveBeenCalledWith(50);
    });
  });

  describe('Retry Logic', () => {
    test('should retry up to maxRetries times', async () => {
      const { result } = renderHook(() => useRetry({
        maxRetries: 3,
        initialDelay: 100
      }));

      const mockFn = jest.fn().mockImplementation(async () => {
        throw new Error('Always fails');
      });

      await expect(result.current.retry(mockFn)).rejects.toThrow('Always fails');

      expect(mockFn).toHaveBeenCalledTimes(4); // initial + 3 retries
    });
  });

  describe('Error Filtering', () => {
    test('should not retry user rejection errors', async () => {
      const { result } = renderHook(() => useRetry({ maxRetries: 3 }));

      const mockFn = jest.fn().mockImplementation(async () => {
        throw new Error('User rejected transaction');
      });

      await expect(result.current.retry(mockFn)).rejects.toThrow('User rejected transaction');
      expect(mockFn).toHaveBeenCalledTimes(1); // Should not retry
    });

    test('should not retry authentication errors', async () => {
      const { result } = renderHook(() => useRetry({ maxRetries: 3 }));

      const mockFn = jest.fn().mockImplementation(async () => {
        throw new Error('Unauthorized access');
      });

      await expect(result.current.retry(mockFn)).rejects.toThrow('Unauthorized access');
      expect(mockFn).toHaveBeenCalledTimes(1); // Should not retry
    });

    test('should not retry validation errors', async () => {
      const { result } = renderHook(() => useRetry({ maxRetries: 3 }));

      const mockFn = jest.fn().mockImplementation(async () => {
        throw new Error('Invalid input validation');
      });

      try {
        await result.current.retry(mockFn);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toBe('Invalid input validation');
      }
      expect(mockFn).toHaveBeenCalledTimes(1); // Should not retry
    });

    test('should retry network errors', async () => {
      const { result } = renderHook(() => useRetry({
        maxRetries: 1,
        initialDelay: 10
      }));

      const mockFn = jest.fn().mockImplementation(async () => {
        throw new Error('Network error');
      });

      await act(async () => {
        await expect(result.current.retry(mockFn)).rejects.toThrow('Network error');
      });
      expect(mockFn).toHaveBeenCalledTimes(2); // initial + 1 retry
      expect(sleep).toHaveBeenCalledTimes(1);
    });
  });

  describe('Callbacks', () => {
    test('should call onRetry callback', async () => {
      const { result } = renderHook(() => useRetry({ maxRetries: 1, initialDelay: 25 }));
      const onRetry = jest.fn();
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Temporary'))
        .mockResolvedValueOnce('ok');

      await result.current.retry(mockFn, { onRetry });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, 1);
      expect(sleep).toHaveBeenCalledWith(25);
    });

    test('should call onSuccess callback', async () => {
      const { result } = renderHook(() => useRetry());

      const onSuccess = jest.fn();
      const mockFn = jest.fn().mockResolvedValue('success');

      await result.current.retry(mockFn, { onSuccess });

      expect(onSuccess).toHaveBeenCalledWith('success', 0);
    });

    test('should call onFailure callback', async () => {
      const { result } = renderHook(() => useRetry({ maxRetries: 0 }));

      const onFailure = jest.fn();
      const error = new Error('Failure');
      const mockFn = jest.fn().mockImplementation(async () => {
        throw error;
      });

      try {
        await result.current.retry(mockFn, { onFailure });
      } catch (e) {
        // Expected to throw
      }

      // onFailure should be called before the error is thrown
      expect(onFailure).toHaveBeenCalledWith(error, 0);
    });
  });

  describe('State Management', () => {
    test('should reset state after success', async () => {
      const { result } = renderHook(() => useRetry({ maxRetries: 1, initialDelay: 10 }));
      const mockFn = jest.fn().mockResolvedValue('ok');

      const value = await result.current.retry(mockFn);
      expect(value).toBe('ok');
      expect(result.current.isRetrying).toBe(false);
      expect(result.current.retryCount).toBe(0);
    });
  });
});