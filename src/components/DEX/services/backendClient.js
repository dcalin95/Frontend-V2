/**
 * DEV MODE – Backend API Client
 * ⚠️ TEMPORARY: This client will be used until backend is fully integrated
 * 
 * Purpose: Centralized backend API client with robust error handling
 * All backend API calls should go through this client
 */

import { DEX_BACKEND_BASE_URL, DEX_BACKEND_HEALTH_TIMEOUT } from '../config/dataSource';

/**
 * Fetch JSON from backend API
 * Returns { ok: boolean, data: any, error: string | null }
 * Never throws unhandled errors - always returns a result object
 */
export const fetchJson = async (path, options = {}) => {
  const {
    timeoutMs = 8000,
    credentials = 'include',
    method = 'GET',
    headers = {},
    body = null
  } = options;

  const url = `${DEX_BACKEND_BASE_URL}${path}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const fetchOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      credentials,
      signal: controller.signal
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      if (!response.ok) {
        return { ok: false, data: null, error: `HTTP ${response.status}: ${text}` };
      }
      return { ok: true, data: text, error: null };
    }

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        data: null,
        error: data.message || data.error || `HTTP ${response.status}`
      };
    }

    return { ok: true, data, error: null };
  } catch (error) {
    // Handle network errors, timeouts, CORS, etc.
    if (error.name === 'AbortError') {
      return { ok: false, data: null, error: 'Request timeout' };
    }
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return { ok: false, data: null, error: 'Network error (backend unreachable)' };
    }
    return { ok: false, data: null, error: error.message || 'Unknown error' };
  }
};

/**
 * Check if backend is healthy/available
 * Returns { ok: boolean, error: string | null }
 */
export const checkBackendHealth = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEX_BACKEND_HEALTH_TIMEOUT);

    const response = await fetch(`${DEX_BACKEND_BASE_URL}/health`, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { ok: false, error: `Health check failed: HTTP ${response.status}` };
    }

    return { ok: true, error: null };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { ok: false, error: 'Health check timeout' };
    }
    return { ok: false, error: error.message || 'Backend unreachable' };
  }
};

/**
 * Backend client object
 */
const backendClient = {
  fetchJson,
  checkBackendHealth,
  baseUrl: DEX_BACKEND_BASE_URL
};

export default backendClient;
