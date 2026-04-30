/**
 * 🔔 useToast Hook Test Suite
 * 
 * Unit tests pentru useToast hook:
 * - Add toast
 * - Remove toast
 * - Toast types (success, error, warning, info)
 * - Clear all toasts
 * 
 * @module useToast.test
 */

import { renderHook, act } from '@testing-library/react';
import useToast from '../hooks/useToast';

describe('useToast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    test('should initialize with empty toasts array', () => {
      const { result } = renderHook(() => useToast());
      
      expect(result.current.toasts).toEqual([]);
      expect(result.current.toasts.length).toBe(0);
    });
  });

  describe('addToast', () => {
    test('should add toast with default properties', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast({ message: 'Test message' });
      });

      expect(result.current.toasts.length).toBe(1);
      expect(result.current.toasts[0]).toMatchObject({
        type: 'info',
        message: 'Test message',
        duration: 5000
      });
      expect(result.current.toasts[0].id).toBeDefined();
    });

    test('should add toast with custom properties', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast({
          type: 'error',
          message: 'Error message',
          title: 'Error Title',
          duration: 3000,
          id: 'custom-id'
        });
      });

      expect(result.current.toasts.length).toBe(1);
      expect(result.current.toasts[0]).toEqual({
        id: 'custom-id',
        type: 'error',
        message: 'Error message',
        title: 'Error Title',
        duration: 3000
      });
    });

    test('should generate unique IDs for toasts', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast({ message: 'Toast 1' });
        result.current.addToast({ message: 'Toast 2' });
      });

      expect(result.current.toasts.length).toBe(2);
      expect(result.current.toasts[0].id).not.toBe(result.current.toasts[1].id);
    });
  });

  describe('removeToast', () => {
    test('should remove toast by ID', () => {
      const { result } = renderHook(() => useToast());

      let toastId;
      act(() => {
        toastId = result.current.addToast({ message: 'Test 1' });
        result.current.addToast({ message: 'Test 2' });
      });

      expect(result.current.toasts.length).toBe(2);

      act(() => {
        result.current.removeToast(toastId);
      });

      expect(result.current.toasts.length).toBe(1);
      expect(result.current.toasts[0].message).toBe('Test 2');
    });

    test('should not remove anything if ID does not exist', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast({ message: 'Test 1' });
      });

      expect(result.current.toasts.length).toBe(1);

      act(() => {
        result.current.removeToast('non-existent-id');
      });

      expect(result.current.toasts.length).toBe(1);
    });
  });

  describe('success', () => {
    test('should add success toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.success('Success message');
      });

      expect(result.current.toasts.length).toBe(1);
      expect(result.current.toasts[0]).toMatchObject({
        type: 'success',
        message: 'Success message'
      });
    });

    test('should add success toast with title and duration', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.success('Success message', 'Success Title', 3000);
      });

      expect(result.current.toasts[0]).toMatchObject({
        type: 'success',
        message: 'Success message',
        title: 'Success Title',
        duration: 3000
      });
    });

    test('should return toast ID', () => {
      const { result } = renderHook(() => useToast());

      let toastId;
      act(() => {
        toastId = result.current.success('Success message');
      });

      expect(toastId).toBeDefined();
      expect(typeof toastId).toBe('string');
    });
  });

  describe('error', () => {
    test('should add error toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.error('Error message');
      });

      expect(result.current.toasts.length).toBe(1);
      expect(result.current.toasts[0]).toMatchObject({
        type: 'error',
        message: 'Error message'
      });
    });

    test('should add error toast with title and duration', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.error('Error message', 'Error Title', 5000);
      });

      expect(result.current.toasts[0]).toMatchObject({
        type: 'error',
        message: 'Error message',
        title: 'Error Title',
        duration: 5000
      });
    });
  });

  describe('warning', () => {
    test('should add warning toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.warning('Warning message');
      });

      expect(result.current.toasts.length).toBe(1);
      expect(result.current.toasts[0]).toMatchObject({
        type: 'warning',
        message: 'Warning message'
      });
    });

    test('should add warning toast with title and duration', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.warning('Warning message', 'Warning Title', 4000);
      });

      expect(result.current.toasts[0]).toMatchObject({
        type: 'warning',
        message: 'Warning message',
        title: 'Warning Title',
        duration: 4000
      });
    });
  });

  describe('info', () => {
    test('should add info toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.info('Info message');
      });

      expect(result.current.toasts.length).toBe(1);
      expect(result.current.toasts[0]).toMatchObject({
        type: 'info',
        message: 'Info message'
      });
    });

    test('should add info toast with title and duration', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.info('Info message', 'Info Title', 6000);
      });

      expect(result.current.toasts[0]).toMatchObject({
        type: 'info',
        message: 'Info message',
        title: 'Info Title',
        duration: 6000
      });
    });
  });

  describe('clearAll', () => {
    test('should clear all toasts', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast({ message: 'Toast 1' });
        result.current.addToast({ message: 'Toast 2' });
        result.current.addToast({ message: 'Toast 3' });
      });

      expect(result.current.toasts.length).toBe(3);

      act(() => {
        result.current.clearAll();
      });

      expect(result.current.toasts.length).toBe(0);
      expect(result.current.toasts).toEqual([]);
    });
  });

  describe('Multiple Operations', () => {
    test('should handle multiple toast operations', () => {
      const { result } = renderHook(() => useToast());

      let toastId1, toastId2;
      act(() => {
        toastId1 = result.current.success('Success 1');
        toastId2 = result.current.error('Error 1');
        result.current.warning('Warning 1');
      });

      expect(result.current.toasts.length).toBe(3);

      act(() => {
        result.current.removeToast(toastId1);
      });

      expect(result.current.toasts.length).toBe(2);

      act(() => {
        result.current.clearAll();
      });

      expect(result.current.toasts.length).toBe(0);
    });
  });
});