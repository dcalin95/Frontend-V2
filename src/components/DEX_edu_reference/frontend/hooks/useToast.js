/**
 * 🔔 useToast Hook - Toast Notification Management
 * 
 * Hook pentru management-ul toast notifications:
 * - Add toasts
 * - Remove toasts
 * - Auto-cleanup
 * 
 * @module useToast
 */

import { useState, useCallback } from 'react';

let toastIdCounter = 0;

const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = toast.id || `toast-${++toastIdCounter}`;
    const newToast = {
      id,
      type: toast.type || 'info',
      message: toast.message,
      title: toast.title,
      duration: toast.duration !== undefined ? toast.duration : 5000
    };

    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message, title, duration) => {
    return addToast({ type: 'success', message, title, duration });
  }, [addToast]);

  const error = useCallback((message, title, duration) => {
    return addToast({ type: 'error', message, title, duration });
  }, [addToast]);

  const warning = useCallback((message, title, duration) => {
    return addToast({ type: 'warning', message, title, duration });
  }, [addToast]);

  const info = useCallback((message, title, duration) => {
    return addToast({ type: 'info', message, title, duration });
  }, [addToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clearAll
  };
};

export default useToast;
