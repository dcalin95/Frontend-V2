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

/** User-facing message when OTA AI analyze could not use OpenAI (circuit breaker or API down). */
export const OTA_OPENAI_UNAVAILABLE_MESSAGE = 'OpenAI service is temporarily unavailable. Analysis was not performed. Please try again in about a minute.';

/**
 * Detect if analyze result indicates OpenAI was unavailable (circuit breaker open or API error).
 * @param {Object} result - Raw response from POST /ai-trading/analyze (may have openAiUnavailable, circuitBreakerState, or reasoning with error text)
 * @returns {boolean}
 */
export function isOpenAiUnavailableResult(result) {
  if (!result || typeof result !== 'object') return false;
  if (result.openAiUnavailable === true || result.circuitBreakerState === 'OPEN') return true;
  const reasoning = result.reasoning ?? result.signal?.reasoning ?? '';
  return typeof reasoning === 'string' && /circuit breaker|OpenAI.*temporarily unavailable/i.test(reasoning);
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
 * Get user-friendly error message (Phase 3: UX Improvements)
 * Maps backend error codes/messages to user-friendly text
 * @param {Error|Object|string} error - Error object
 * @returns {string} User-friendly error message
 */
export function getUserFriendlyError(error) {
  const rawMessage = getErrorMessage(error).toLowerCase();
  
  // Network errors (backend unreachable, timeout, CORS – not necessarily "no internet")
  if (rawMessage.includes('network') || rawMessage.includes('fetch') || rawMessage.includes('failed to fetch')) {
    const isLikelyCrossOrigin = typeof window !== 'undefined' && window.location?.origin && !/localhost|127\.0\.0\.1/i.test(window.location.origin);
    if (isLikelyCrossOrigin) {
      return 'Could not reach the server (often CORS). On Render: Backend → Environment → set CORS_ALLOWED_ORIGINS to your site URL (e.g. https://edu.bits-ai.io) or leave it empty.';
    }
    return 'Could not reach the server. Please try again in a moment.';
  }
  
  // Authentication errors
  if (rawMessage.includes('unauthorized') || rawMessage.includes('401')) {
    return 'Your session has expired. Please log in again.';
  }
  
  if (rawMessage.includes('forbidden') || rawMessage.includes('403')) {
    return 'You don\'t have permission to perform this action.';
  }
  
  // Wallet errors
  if (rawMessage.includes('wallet not found') || rawMessage.includes('no ethereum wallet')) {
    return 'No wallet detected. Please install MetaMask or Trust Wallet.';
  }
  
  if (rawMessage.includes('signature rejected') || rawMessage.includes('user rejected')) {
    return 'Signature request was cancelled. Please try again and approve the signature.';
  }
  
  if (rawMessage.includes('wallet not connected') || rawMessage.includes('not connected')) {
    return 'Wallet is not connected. Please connect your wallet first.';
  }

  // Invalid RPC URL: when it appears on allowlist/quote/swap-tx, BACKEND (Render) uses an invalid BSC_RPC_URL (for example expired TWNodes).
  if (rawMessage.includes('invalid rpc url') || rawMessage.includes('twnodes')) {
    const raw = getErrorMessage(error);
    console.warn('[ALLOWLIST_DEBUG] BSC RPC error detected.', {
      rawMessage: raw,
      source: 'BACKEND (Render) - BSC_RPC_URL in Environment',
      fix: 'Render → Dashboard → Service → Environment → BSC_RPC_URL = https://bsc-dataseed.bnbchain.org',
      hint: 'Not from MetaMask - your backend on Render uses an invalid RPC'
    });
    return 'Backend uses invalid BSC RPC (e.g. TWNodes expired). On Render: Environment → set BSC_RPC_URL = https://bsc-dataseed.bnbchain.org';
  }
  
  // Nonce errors
  if (rawMessage.includes('nonce') && rawMessage.includes('invalid')) {
    return 'Authentication token expired. Please try logging in again.';
  }
  
  if (rawMessage.includes('nonce') && rawMessage.includes('used')) {
    return 'This authentication request has already been used. Please try again.';
  }
  
  // Rate limiting
  if (rawMessage.includes('rate limit') || rawMessage.includes('too many requests')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  
  // Server errors
  if (rawMessage.includes('server error') || rawMessage.includes('500') || rawMessage.includes('502') || rawMessage.includes('503')) {
    return 'Server error. Please try again in a few moments.';
  }
  
  // Not found / Route not found
  if (rawMessage.includes('not found') || rawMessage.includes('404') || rawMessage.includes('route not found')) {
    return 'API route not found. Please check if the backend server is running and the route is configured correctly.';
  }

  // Timeout errors
  if (rawMessage.includes('timeout') || rawMessage.includes('timed out')) {
    return 'Request timed out. Please check your connection and try again.';
  }

  // Insufficient balance
  if (rawMessage.includes('insufficient') || rawMessage.includes('balance') || rawMessage.includes('not enough')) {
    return 'Insufficient balance. Please check your wallet balance.';
  }

  // Slippage errors
  if (rawMessage.includes('slippage') || rawMessage.includes('price impact')) {
    return 'Slippage tolerance exceeded. Try adjusting your slippage settings.';
  }

  // Transaction errors
  if (rawMessage.includes('transaction') && rawMessage.includes('failed')) {
    return 'Transaction failed. Please try again or check the transaction details.';
  }

  if (rawMessage.includes('transaction') && rawMessage.includes('reverted')) {
    return 'Transaction was reverted. Please check the transaction details and try again.';
  }

  // Login/Register errors (păstrăm mesajul backend la 401 login)
  if (rawMessage.includes('invalid email or password') || rawMessage.includes('invalid credentials') || rawMessage.includes('wrong password') || rawMessage.includes('incorrect password')) {
    return 'Invalid email or password. Check the email/password or use "Create account" if you don\'t have an account yet.';
  }
  
  if (rawMessage.includes('user not found') || rawMessage.includes('account not found')) {
    return 'No account found with this email. Please register first.';
  }
  
  if (rawMessage.includes('email already exists') || rawMessage.includes('email already registered')) {
    return 'An account with this email already exists. Please log in instead.';
  }
  
  if (rawMessage.includes('username already exists') || rawMessage.includes('username taken')) {
    return 'This username is already taken. Please choose a different username.';
  }
  
  if (rawMessage.includes('email not verified') || rawMessage.includes('verify your email')) {
    return 'Please verify your email address before logging in. Check your inbox for the verification link.';
  }
  
  if (rawMessage.includes('account locked') || rawMessage.includes('too many attempts')) {
    return 'Account temporarily locked due to too many failed login attempts. Please try again later or reset your password.';
  }

  if (rawMessage.includes('circuit breaker') || (rawMessage.includes('OpenAI') && rawMessage.includes('unavailable'))) {
    return 'OpenAI service is temporarily unavailable. Analysis was not performed. Please try again in about a minute.';
  }
  
  if (rawMessage.includes('password too weak') || rawMessage.includes('weak password')) {
    return 'Password is too weak. Please use a stronger password with at least 8 characters, including uppercase, lowercase, and numbers.';
  }

  // Gas errors
  if (rawMessage.includes('gas') || rawMessage.includes('out of gas')) {
    return 'Gas estimation failed. Please try again or increase gas limit.';
  }

  // Default: return formatted original message
  return formatError(error);
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

