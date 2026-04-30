/**
 * 🔔 useErrorHandler Hook Test Suite
 * 
 * Unit tests pentru useErrorHandler hook:
 * - handleError
 * - handleApiErrorWithToast
 * - handleSuccess
 * - handleWarning
 * - handleInfo
 * 
 * @module useErrorHandler.test
 */

import { renderHook } from '@testing-library/react';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useToastContext } from '../context/ToastContext';
import { getUserFriendlyError, handleApiError } from '../utils/helpers';

// Mock dependencies
jest.mock('../context/ToastContext', () => ({
  useToastContext: jest.fn()
}));

jest.mock('../utils/helpers', () => ({
  getUserFriendlyError: jest.fn((err) => err?.message || 'Error'),
  handleApiError: jest.fn((err) => Promise.resolve(err?.message || 'Error'))
}));

describe('useErrorHandler', () => {
  const mockShowError = jest.fn();
  const mockShowSuccess = jest.fn();
  const mockShowWarning = jest.fn();
  const mockShowInfo = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useToastContext.mockReturnValue({
      error: mockShowError,
      success: mockShowSuccess,
      warning: mockShowWarning,
      info: mockShowInfo
    });
  });

  describe('handleError', () => {
    test('should show error toast by default', async () => {
      const error = new Error('Test error');
      handleApiError.mockResolvedValue('Test error');
      getUserFriendlyError.mockReturnValue('Test error');

      const { result } = renderHook(() => useErrorHandler());

      const message = await result.current.handleError(error);

      expect(handleApiError).toHaveBeenCalledWith(error);
      expect(getUserFriendlyError).toHaveBeenCalled();
      expect(mockShowError).toHaveBeenCalledWith(
        'Test error',
        'Error',
        6000
      );
      expect(message).toBe('Test error');
    });

    test('should not show toast if showToast is false', async () => {
      const error = new Error('Test error');
      handleApiError.mockResolvedValue('Test error');
      getUserFriendlyError.mockReturnValue('Test error');

      const { result } = renderHook(() => useErrorHandler());

      await result.current.handleError(error, { showToast: false });

      expect(mockShowError).not.toHaveBeenCalled();
    });

    test('should use custom title and duration', async () => {
      const error = new Error('Test error');
      handleApiError.mockResolvedValue('Test error');
      getUserFriendlyError.mockReturnValue('Test error');

      const { result } = renderHook(() => useErrorHandler());

      await result.current.handleError(error, {
        title: 'Custom Title',
        duration: 10000
      });

      expect(mockShowError).toHaveBeenCalledWith(
        'Test error',
        'Custom Title',
        10000
      );
    });
  });

  describe('handleApiErrorWithToast', () => {
    test('should call handleError with API error title', async () => {
      const error = new Error('API Error');
      handleApiError.mockResolvedValue('API Error');
      getUserFriendlyError.mockReturnValue('API Error');

      const { result } = renderHook(() => useErrorHandler());

      await result.current.handleApiErrorWithToast(error);

      expect(mockShowError).toHaveBeenCalledWith(
        'API Error',
        'API Error',
        6000
      );
    });

    test('should use custom title if provided', async () => {
      const error = new Error('API Error');
      handleApiError.mockResolvedValue('API Error');
      getUserFriendlyError.mockReturnValue('API Error');

      const { result } = renderHook(() => useErrorHandler());

      await result.current.handleApiErrorWithToast(error, {
        title: 'Custom API Title'
      });

      expect(mockShowError).toHaveBeenCalledWith(
        'API Error',
        'Custom API Title',
        6000
      );
    });
  });

  describe('handleSuccess', () => {
    test('should show success toast', () => {
      const { result } = renderHook(() => useErrorHandler());

      result.current.handleSuccess('Operation successful');

      expect(mockShowSuccess).toHaveBeenCalledWith(
        'Operation successful',
        'Success',
        4000
      );
    });

    test('should use custom title and duration', () => {
      const { result } = renderHook(() => useErrorHandler());

      result.current.handleSuccess('Operation successful', {
        title: 'Custom Success',
        duration: 5000
      });

      expect(mockShowSuccess).toHaveBeenCalledWith(
        'Operation successful',
        'Custom Success',
        5000
      );
    });
  });

  describe('handleWarning', () => {
    test('should show warning toast', () => {
      const { result } = renderHook(() => useErrorHandler());

      result.current.handleWarning('Warning message');

      expect(mockShowWarning).toHaveBeenCalledWith(
        'Warning message',
        'Warning',
        5000
      );
    });

    test('should use custom title and duration', () => {
      const { result } = renderHook(() => useErrorHandler());

      result.current.handleWarning('Warning message', {
        title: 'Custom Warning',
        duration: 7000
      });

      expect(mockShowWarning).toHaveBeenCalledWith(
        'Warning message',
        'Custom Warning',
        7000
      );
    });
  });

  describe('handleInfo', () => {
    test('should show info toast', () => {
      const { result } = renderHook(() => useErrorHandler());

      result.current.handleInfo('Info message');

      expect(mockShowInfo).toHaveBeenCalledWith(
        'Info message',
        'Info',
        4000
      );
    });

    test('should use custom title and duration', () => {
      const { result } = renderHook(() => useErrorHandler());

      result.current.handleInfo('Info message', {
        title: 'Custom Info',
        duration: 6000
      });

      expect(mockShowInfo).toHaveBeenCalledWith(
        'Info message',
        'Custom Info',
        6000
      );
    });
  });
});
