/**
 * DEV MODE – Data Source Configuration
 * ⚠️ TEMPORARY: Configuration for DEV MODE backend integration
 * 
 * This config controls whether to use backend API or direct CoinGecko
 * When backend is deployed to Render, update DEX_BACKEND_BASE_URL
 */

// Backend base URL (uses existing REACT_APP_BACKEND_URL + /api, or DEX-specific override, or localhost fallback)
const getBackendBaseUrl = () => {
  if (process.env.REACT_APP_DEX_BACKEND_BASE_URL) {
    return process.env.REACT_APP_DEX_BACKEND_BASE_URL;
  }
  if (process.env.REACT_APP_BACKEND_URL) {
    return `${process.env.REACT_APP_BACKEND_URL}/api`;
  }
  return 'http://localhost:4000/api';
};

export const DEX_BACKEND_BASE_URL = getBackendBaseUrl();

// Data source mode: 'AUTO' (try backend first, fallback to DEV), 'BACKEND' (backend only), 'DEV' (CoinGecko only)
export const DEX_DATA_SOURCE = process.env.REACT_APP_DEX_DATA_SOURCE || 'AUTO';

// Health check timeout (ms)
export const DEX_BACKEND_HEALTH_TIMEOUT = 3000;
