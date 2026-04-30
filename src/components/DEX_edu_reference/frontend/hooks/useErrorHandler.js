/**
 * 🔔 useErrorHandler Hook - Consistent Error Handling cu Toast
 * 
 * Hook pentru consistent error handling cu toast notifications:
 * - Toast notifications pentru toate erorile
 * - User-friendly error messages
 * - Retry logic integration
 * 
 * @module useErrorHandler
 */

import { useCallback } from 'react';
import { useToastContext } from '../context/ToastContext';
import { getUserFriendlyError, handleApiError } from '../utils/helpers';

/**
 * Custom hook pentru error handling cu toast
 * @returns {Object} { handleError, handleApiErrorWithToast, handleSuccess }
 */
export function useErrorHandler() {
  const { error: showError, success: showSuccess, warning: showWarning, info: showInfo } = useToastContext();

  /**
   * Handle error cu toast notification
   * @param {Error|Object|string} error - Error object
   * @param {Object} options - Options { title, duration, showToast }
   * @returns {string} User-friendly error message
   */
  const handleError = useCallback(async (error, options = {}) => {
    const { 
      title = 'Error', 
      duration = 6000,
      showToast = true 
    } = options;

    const errorMessage = await handleApiError(error);
    const userFriendlyMessage = getUserFriendlyError(errorMessage);

    if (showToast) {
      showError(userFriendlyMessage, title, duration);
    }

    return userFriendlyMessage;
  }, [showError]);

  /**
   * Handle API error cu toast notification
   * @param {Error|Response} error - API error
   * @param {Object} options - Options { title, duration, showToast }
   * @returns {string} User-friendly error message
   */
  const handleApiErrorWithToast = useCallback(async (error, options = {}) => {
    return handleError(error, { 
      title: options.title || 'API Error',
      ...options 
    });
  }, [handleError]);

  /**
   * Handle success cu toast notification
   * @param {string} message - Success message
   * @param {Object} options - Options { title, duration }
   */
  const handleSuccess = useCallback((message, options = {}) => {
    const { title = 'Success', duration = 4000 } = options;
    showSuccess(message, title, duration);
  }, [showSuccess]);

  /**
   * Handle warning cu toast notification
   * @param {string} message - Warning message
   * @param {Object} options - Options { title, duration }
   */
  const handleWarning = useCallback((message, options = {}) => {
    const { title = 'Warning', duration = 5000 } = options;
    showWarning(message, title, duration);
  }, [showWarning]);

  /**
   * Handle info cu toast notification
   * @param {string} message - Info message
   * @param {Object} options - Options { title, duration }
   */
  const handleInfo = useCallback((message, options = {}) => {
    const { title = 'Info', duration = 4000 } = options;
    showInfo(message, title, duration);
  }, [showInfo]);

  return {
    handleError,
    handleApiErrorWithToast,
    handleSuccess,
    handleWarning,
    handleInfo
  };
}

export default useErrorHandler;
