/**
 * 🔄 useRetry Hook - Retry Logic pentru API Requests
 * 
 * Hook pentru retry logic cu exponential backoff:
 * - Retry automat pentru request-uri eșuate
 * - Exponential backoff pentru delay
 * - Configurable max retries și delay
 * 
 * @module useRetry
 */

import { useState, useCallback } from 'react';
import { sleep } from '../utils/helpers';

/**
 * Custom hook pentru retry logic
 * @param {Object} options - Options { maxRetries, initialDelay, maxDelay, backoffMultiplier }
 * @returns {Object} { retry, isRetrying, retryCount }
 */
export function useRetry(options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2
  } = options;

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  /**
   * Retry function cu exponential backoff
   * @param {Function} fn - Function to retry
   * @param {Object} retryOptions - Options pentru acest retry { onRetry, onSuccess, onFailure }
   * @returns {Promise} Result of function
   */
  const retry = useCallback(async (fn, retryOptions = {}) => {
    const { onRetry, onSuccess, onFailure } = retryOptions;
    let lastError = null;
    let currentDelay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setIsRetrying(attempt > 0);
        setRetryCount(attempt);

        if (attempt > 0 && onRetry) {
          onRetry(attempt, maxRetries);
        }

        const result = await fn();
        
        // Success
        setIsRetrying(false);
        setRetryCount(0);
        
        if (onSuccess) {
          onSuccess(result, attempt);
        }
        
        return result;
      } catch (error) {
        lastError = error;

        // Don't retry on certain errors (user rejection, auth errors)
        if (shouldNotRetry(error)) {
          setIsRetrying(false);
          setRetryCount(0);
          if (onFailure) {
            onFailure(error, attempt);
          }
          throw error;
        }

        // Last attempt failed
        if (attempt === maxRetries) {
          setIsRetrying(false);
          setRetryCount(0);
          if (onFailure) {
            onFailure(error, attempt);
          }
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await sleep(Math.min(currentDelay, maxDelay));
          currentDelay *= backoffMultiplier;
        }
      }
    }

    setIsRetrying(false);
    setRetryCount(0);
    throw lastError;
  }, [maxRetries, initialDelay, maxDelay, backoffMultiplier]);

  /**
   * Check if error should not be retried
   * @param {Error} error - Error object
   * @returns {boolean} True if should not retry
   */
  const shouldNotRetry = (error) => {
    const errorMessage = error?.message?.toLowerCase() || '';
    
    // User rejection - don't retry
    if (errorMessage.includes('user rejected') || 
        errorMessage.includes('user cancelled') ||
        errorMessage.includes('user denied')) {
      return true;
    }

    // Authentication errors - don't retry
    if (errorMessage.includes('unauthorized') || 
        errorMessage.includes('401') ||
        errorMessage.includes('forbidden') ||
        errorMessage.includes('403')) {
      return true;
    }

    // Validation errors - don't retry
    if (errorMessage.includes('validation') || 
        errorMessage.includes('invalid') ||
        errorMessage.includes('bad request') ||
        errorMessage.includes('400')) {
      return true;
    }

    return false;
  };

  return {
    retry,
    isRetrying,
    retryCount
  };
}

export default useRetry;
