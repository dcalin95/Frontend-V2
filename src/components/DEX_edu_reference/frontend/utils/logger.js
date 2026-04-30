/**
 * Logger utility - Development-only console logging
 * 
 * All console.log calls should use this utility to avoid logging in production
 * 
 * @module logger
 */

const isBrowser = typeof window !== 'undefined';

const readDebugFlag = () => {
  if (!isBrowser) return false;
  try {
    const params = new URLSearchParams(window.location.search || '');
    const paramValue = params.get('dex_debug') || params.get('debug');
    if (paramValue === '1' || paramValue === 'true') {
      try { localStorage.setItem('dex_debug', '1'); } catch (_) {}
      return true;
    }
    const stored = localStorage.getItem('dex_debug');
    return stored === '1' || stored === 'true';
  } catch (_) {
    return false;
  }
};

export const isDebugEnabled = () => process.env.NODE_ENV !== 'production' || readDebugFlag();

/**
 * Log info message (only in development)
 */
export const log = (...args) => {
  if (isDebugEnabled()) {
    console.log(...args);
  }
};

/**
 * Log warning message (only in development)
 */
export const warn = (...args) => {
  if (isDebugEnabled()) {
    console.warn(...args);
  }
};

/**
 * Log error message (always logged, even in production)
 */
export const error = (...args) => {
  console.error(...args);
};

/**
 * Log info message with prefix (only in development)
 */
export const logWithPrefix = (prefix, ...args) => {
  if (isDebugEnabled()) {
    console.log(`[${prefix}]`, ...args);
  }
};

/**
 * Log warning message with prefix (only in development)
 */
export const warnWithPrefix = (prefix, ...args) => {
  if (isDebugEnabled()) {
    console.warn(`[${prefix}]`, ...args);
  }
};

/**
 * Log error message with prefix (always logged)
 */
export const errorWithPrefix = (prefix, ...args) => {
  console.error(`[${prefix}]`, ...args);
};
