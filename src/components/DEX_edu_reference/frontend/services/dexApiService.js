/**
 * 🔗 DEX API Service
 * 
 * Frontend API client pentru DEX trading endpoints:
 * - Orders (create, list, cancel)
 * - Trades (list, get by id)
 * - Orderbook (get orderbook)
 * 
 * @module dexApiService
 */

import { BACKEND_URL, API_ENDPOINTS } from '../utils/constants';
import { handleApiError } from '../utils/helpers';
import { logWithPrefix, warnWithPrefix } from '../utils/logger';

/**
 * Generic API request helper for DEX endpoints
 */
async function dexApiRequest(endpoint, options = {}) {
  const requestId = Math.random().toString(36).slice(2, 8);
  const startTs = Date.now();
  try {
    const url = `${BACKEND_URL}${endpoint}`;
    
    const defaultOptions = {
      method: 'GET',
      credentials: 'include', // Include cookies for session-based auth
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    let bodyPreview = null;
    if (defaultOptions.body) {
      if (typeof defaultOptions.body === 'string') {
        try {
          bodyPreview = JSON.parse(defaultOptions.body);
        } catch (_) {
          bodyPreview = defaultOptions.body.slice(0, 500);
        }
      } else {
        bodyPreview = defaultOptions.body;
      }
    }

    logWithPrefix('DEX API', '→', {
      id: requestId,
      endpoint,
      method: defaultOptions.method,
      url,
      credentials: defaultOptions.credentials,
      body: bodyPreview
    });

    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      warnWithPrefix('DEX API', '←', {
        id: requestId,
        endpoint,
        status: response.status,
        durationMs: Date.now() - startTs,
        error: errorData
      });
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    logWithPrefix('DEX API', '←', {
      id: requestId,
      endpoint,
      status: response.status,
      durationMs: Date.now() - startTs,
      data
    });
    return data;
  } catch (error) {
    warnWithPrefix('DEX API', '✖', {
      id: requestId,
      endpoint,
      durationMs: Date.now() - startTs,
      error: error?.message || error
    });
    console.error(`DEX API Error [${endpoint}]:`, error);
    // handleApiError is async; always throw a real Error, not a Promise
    const message = await handleApiError(error);
    throw new Error(message);
  }
}

/**
 * Get orderbook for trading pair
 * @param {string} baseToken - Base token symbol (default: 'BITS')
 * @param {string} quoteToken - Quote token symbol (default: 'USDT')
 * @param {number} depth - Orderbook depth (default: 20)
 * @returns {Promise<{success: boolean, bids: Array, asks: Array, lastPrice: number|null}>}
 */
export const getOrderbook = async (baseToken = 'BITS', quoteToken = 'USDT', depth = 20) => {
  return dexApiRequest(`/api/dex/v1/orderbook?base_token=${baseToken}&quote_token=${quoteToken}&depth=${depth}`);
};

/**
 * Get user orders
 * @param {Object} filters - Filter options (status, base_token, quote_token, limit, offset)
 * @returns {Promise<{success: boolean, orders: Array, count: number}>}
 */
export const getOrders = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.base_token) params.append('base_token', filters.base_token);
  if (filters.quote_token) params.append('quote_token', filters.quote_token);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.offset) params.append('offset', filters.offset);
  
  const queryString = params.toString();
  return dexApiRequest(`/api/dex/v1/orders${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get order by ID
 * @param {number} orderId - Order ID
 * @returns {Promise<{success: boolean, order: Object}>}
 */
export const getOrder = async (orderId) => {
  return dexApiRequest(`/api/dex/v1/orders/${orderId}`);
};

/**
 * Create new order
 * @param {Object} orderData - Order data (order_type, side, base_token, quote_token, amount, price, expires_at)
 * @returns {Promise<{success: boolean, order: Object, message: string}>}
 */
export const createOrder = async (orderData) => {
  return dexApiRequest('/api/dex/v1/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
};

/**
 * Cancel order
 * @param {number} orderId - Order ID
 * @returns {Promise<{success: boolean, order: Object, message: string}>}
 */
export const cancelOrder = async (orderId) => {
  return dexApiRequest(`/api/dex/v1/orders/${orderId}`, {
    method: 'DELETE',
  });
};

/**
 * Get user trades
 * @param {Object} filters - Filter options (base_token, quote_token, limit, offset)
 * @returns {Promise<{success: boolean, trades: Array, count: number}>}
 */
export const getTrades = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.base_token) params.append('base_token', filters.base_token);
  if (filters.quote_token) params.append('quote_token', filters.quote_token);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.offset) params.append('offset', filters.offset);
  
  const queryString = params.toString();
  return dexApiRequest(`/api/dex/v1/trades${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get trade by ID
 * @param {number} tradeId - Trade ID
 * @returns {Promise<{success: boolean, trade: Object}>}
 */
export const getTrade = async (tradeId) => {
  return dexApiRequest(`/api/dex/v1/trades/${tradeId}`);
};

/**
 * Get price for token pair
 * @param {string} base - Base token address (optional)
 * @param {string} quote - Quote token address (optional)
 * @returns {Promise<{success: boolean, price: string, source: string, blockNumber: number}>}
 */
export const getPrice = async (base = null, quote = null) => {
  const params = new URLSearchParams();
  if (base) params.append('base', base);
  if (quote) params.append('quote', quote);
  
  const queryString = params.toString();
  return dexApiRequest(`/api/dex/v1/price${queryString ? `?${queryString}` : ''}`);
};

// Export default object for convenience
const dexApiService = {
  getOrderbook,
  getOrders,
  getOrder,
  createOrder,
  cancelOrder,
  getTrades,
  getTrade,
  getPrice,
};

export default dexApiService;
