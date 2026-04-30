/**
 * 🔧 Helpers Test Suite
 * 
 * Unit tests pentru helpers.js:
 * - getUserFriendlyError
 * - handleApiError
 * - debounce
 * - throttle
 * - copyToClipboard
 * - sleep
 * 
 * @module helpers.test
 */

import {
  getUserFriendlyError,
  handleApiError,
  debounce,
  throttle,
  copyToClipboard,
  sleep
} from '../utils/helpers';

// Mock console methods
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn()
};

describe('Helpers', () => {
  describe('getUserFriendlyError', () => {
    test('should return user-friendly message for network errors', () => {
      const error = new Error('Network Error');
      const message = getUserFriendlyError(error);
      expect(message).toContain('Could not reach the server');
      expect(typeof message).toBe('string');
    });

    test('should return user-friendly message for timeout errors', () => {
      const error = new Error('timeout');
      const message = getUserFriendlyError(error);
      expect(message).toContain('timed out');
    });

    test('should return user-friendly message for 404 errors', () => {
      const error = new Error('404');
      const message = getUserFriendlyError(error);
      expect(message).toContain('not found');
    });

    test('should return user-friendly message for 500 errors', () => {
      const error = new Error('500');
      const message = getUserFriendlyError(error);
      expect(message).toContain('Server error');
    });

    test('should return generic message for unknown errors', () => {
      const error = new Error('Unknown error');
      const message = getUserFriendlyError(error);
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });

    test('should handle string errors', () => {
      const message = getUserFriendlyError('Simple string error');
      expect(typeof message).toBe('string');
    });

    test('should handle null/undefined errors', () => {
      const message1 = getUserFriendlyError(null);
      const message2 = getUserFriendlyError(undefined);
      expect(typeof message1).toBe('string');
      expect(typeof message2).toBe('string');
    });
  });

  describe('handleApiError', () => {
    test('should handle error with message', async () => {
      const error = new Error('Bad request');
      const message = await handleApiError(error);
      expect(message).toBe('Bad request');
    });

    test('should handle error with message property', async () => {
      const error = {
        message: 'Network Error'
      };
      const message = await handleApiError(error);
      expect(message).toBe('Network Error');
    });

    test('should handle standard Error objects', async () => {
      const error = new Error('Something went wrong');
      const message = await handleApiError(error);
      expect(message).toBe('Something went wrong');
    });

    test('should handle string errors', async () => {
      const message = await handleApiError('String error');
      expect(message).toBe('String error');
    });

    test('should handle null/undefined errors', async () => {
      const message1 = await handleApiError(null);
      const message2 = await handleApiError(undefined);
      expect(typeof message1).toBe('string');
      expect(typeof message2).toBe('string');
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    test('should delay function execution', () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 100);

      debouncedFunc();
      expect(func).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(1);
    });

    test('should cancel previous calls if called again', () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 100);

      debouncedFunc();
      debouncedFunc();
      debouncedFunc();

      jest.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(1);
    });

    test('should pass arguments correctly', () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 100);

      debouncedFunc('arg1', 'arg2');
      jest.advanceTimersByTime(100);

      expect(func).toHaveBeenCalledWith('arg1', 'arg2');
    });

    afterEach(() => {
      jest.clearAllTimers();
    });
  });

  describe('throttle', () => {
    jest.useFakeTimers();

    test('should limit function execution frequency', () => {
      const func = jest.fn();
      const throttledFunc = throttle(func, 100);

      throttledFunc();
      expect(func).toHaveBeenCalledTimes(1);

      throttledFunc();
      expect(func).toHaveBeenCalledTimes(1); // Still 1, throttled

      jest.advanceTimersByTime(100);
      throttledFunc();
      expect(func).toHaveBeenCalledTimes(2);
    });

    afterEach(() => {
      jest.clearAllTimers();
    });
  });

  describe('copyToClipboard', () => {
    // Mock clipboard API
    const mockWriteText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText
      }
    });

    test('should copy text to clipboard using modern API', async () => {
      const result = await copyToClipboard('test text');
      expect(result).toBe(true);
      expect(mockWriteText).toHaveBeenCalledWith('test text');
    });

    test('should return false on error', async () => {
      mockWriteText.mockRejectedValueOnce(new Error('Clipboard error'));
      const result = await copyToClipboard('test text');
      expect(result).toBe(false);
    });
  });

  describe('sleep', () => {
    jest.useFakeTimers();

    test('should wait for specified time', async () => {
      const promise = sleep(100);
      expect(promise).toBeInstanceOf(Promise);

      jest.advanceTimersByTime(100);
      await promise;
      // Promise should resolve
    });

    afterEach(() => {
      jest.clearAllTimers();
    });
  });
});
