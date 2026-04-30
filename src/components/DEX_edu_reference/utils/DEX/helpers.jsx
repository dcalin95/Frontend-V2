/**
 * 🔧 Helpers - General Helper Functions
 * 
 * General utility functions:
 * - Debounce
 * - Throttle
 * - Copy to clipboard
 * - Sleep/delay
 * - Error handling
 * 
 * @module helpers
 */

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time în milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit în milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} True dacă e successful
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback pentru browsers mai vechi
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
}

/**
 * Sleep/delay function
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after delay
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get error message from error object
 * @param {Error|Object|string} error - Error object
 * @returns {string} Error message
 */
export function getErrorMessage(error) {
  if (!error) {
    return 'Unknown error';
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error.message) {
    return error.message;
  }
  
  if (error.error) {
    return typeof error.error === 'string' ? error.error : error.error.message || 'Unknown error';
  }
  
  return 'Unknown error';
}

/**
 * Handle API error
 * @param {Error|Response} error - Error object sau Response
 * @returns {Promise<string>} Error message
 */
export async function handleApiError(error) {
  if (error instanceof Response) {
    try {
      const data = await error.json();
      return data.error || data.message || `HTTP ${error.status}: ${error.statusText}`;
    } catch {
      return `HTTP ${error.status}: ${error.statusText}`;
    }
  }
  
  return getErrorMessage(error);
}

/**
 * Check if value is empty
 * @param {*} value - Value to check
 * @returns {boolean} True dacă e empty
 */
export function isEmpty(value) {
  if (value === null || value === undefined) {
    return true;
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return true;
  }
  
  if (Array.isArray(value) && value.length === 0) {
    return true;
  }
  
  if (typeof value === 'object' && Object.keys(value).length === 0) {
    return true;
  }
  
  return false;
}

/**
 * Deep clone object
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  
  return obj;
}

/**
 * Format error for display
 * @param {Error|Object|string} error - Error object
 * @returns {string} Formatted error message
 */
export function formatError(error) {
  const message = getErrorMessage(error);
  return message.charAt(0).toUpperCase() + message.slice(1);
}

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Class names helper (similar to classNames library)
 * @param {...(string|Object|Array)} args - Class names
 * @returns {string} Combined class names
 */
export function classNames(...args) {
  const classes = [];
  
  for (const arg of args) {
    if (!arg) continue;
    
    if (typeof arg === 'string') {
      classes.push(arg);
    } else if (Array.isArray(arg)) {
      const inner = classNames(...arg);
      if (inner) classes.push(inner);
    } else if (typeof arg === 'object') {
      for (const key in arg) {
        if (arg[key]) {
          classes.push(key);
        }
      }
    }
  }
  
  return classes.join(' ');
}

/**
 * Scroll to element
 * @param {string|HTMLElement} element - Element selector sau HTMLElement
 * @param {Object} options - Scroll options
 */
export function scrollTo(element, options = {}) {
  const defaultOptions = {
    behavior: 'smooth',
    block: 'start',
    inline: 'nearest'
  };
  
  const el = typeof element === 'string' ? document.querySelector(element) : element;
  if (el) {
    el.scrollIntoView({ ...defaultOptions, ...options });
  }
}

/**
 * Get query parameter
 * @param {string} name - Parameter name
 * @param {string} url - URL (optional, defaults to window.location)
 * @returns {string|null} Parameter value
 */
export function getQueryParam(name, url = null) {
  const searchParams = new URLSearchParams(url ? new URL(url).search : window.location.search);
  return searchParams.get(name);
}

/**
 * Set query parameter
 * @param {string} name - Parameter name
 * @param {string} value - Parameter value
 * @param {boolean} pushState - Dacă să folosească pushState (default: true)
 */
export function setQueryParam(name, value, pushState = true) {
  const url = new URL(window.location);
  if (value === null || value === undefined || value === '') {
    url.searchParams.delete(name);
  } else {
    url.searchParams.set(name, value);
  }
  
  if (pushState) {
    window.history.pushState({}, '', url);
  } else {
    window.history.replaceState({}, '', url);
  }
}

