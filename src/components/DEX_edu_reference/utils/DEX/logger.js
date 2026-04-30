/**
 * Logger utility pentru DEX
 * 
 * Centralized logging cu suport pentru development și production
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  error: (message, ...args) => {
    if (isDevelopment) {
      console.error(`[DEX Error] ${message}`, ...args);
    }
    // În production, poate fi trimis la error tracking service (Sentry, LogRocket, etc.)
    // if (!isDevelopment && window.errorTracking) {
    //   window.errorTracking.captureException(new Error(message), { extra: args });
    // }
  },
  
  warn: (message, ...args) => {
    if (isDevelopment) {
      console.warn(`[DEX Warning] ${message}`, ...args);
    }
  },
  
  info: (message, ...args) => {
    if (isDevelopment) {
      console.info(`[DEX Info] ${message}`, ...args);
    }
  },
  
  debug: (message, ...args) => {
    if (isDevelopment) {
      console.debug(`[DEX Debug] ${message}`, ...args);
    }
  }
};

export default logger;
