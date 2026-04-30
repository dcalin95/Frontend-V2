/**
 * 🔔 ToastContext - Toast Notification Context
 * 
 * Context pentru management-ul toast notifications global:
 * - Provides toast functions to all components
 * - Manages toast state
 * 
 * @module ToastContext
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import ToastContainer from '../components/common/ToastContainer';
import { playDexToastSound } from '../utils/dexSound';

const ToastContext = createContext(null);

let toastIdCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = toast.id || `toast-${++toastIdCounter}`;
    const newToast = {
      id,
      type: toast.type || 'info',
      message: toast.message,
      title: toast.title,
      duration: toast.duration !== undefined ? toast.duration : 0
    };

    setToasts((prev) => [...prev, newToast]);
    playDexToastSound(newToast);
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

  const value = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clearAll
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider');
  }
  return context;
};

export default ToastContext;
