import { getApiBaseUrl, API_ENDPOINTS } from '../../config/apiEndpoints.js';
import { loadRuntimeConfig } from '../../config/runtimeConfig.js';
import { getOtaWalletAuthToken } from '../utils/otaWalletSession';

function getUrl(path) {
  const base = getApiBaseUrl();
  if (!base) throw new Error('API base URL not configured');
  return `${base.replace(/\/$/, '')}${path}`;
}

async function request(path, init = {}) {
  await loadRuntimeConfig();
  const token = getOtaWalletAuthToken();
  const headers = { 'Content-Type': 'application/json', ...(init.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(getUrl(path), { ...init, credentials: 'include', headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
  return body;
}

export function getBinanceFuturesCredentialStatus() {
  return request(API_ENDPOINTS.OTA_BINANCE_FUTURES_CREDENTIALS_STATUS, { method: 'GET' });
}

export function saveBinanceFuturesCredentials({ apiKey, apiSecret }) {
  return request(API_ENDPOINTS.OTA_BINANCE_FUTURES_CREDENTIALS, {
    method: 'POST',
    body: JSON.stringify({ apiKey: String(apiKey || '').trim(), apiSecret: String(apiSecret || '').trim() }),
  });
}

export function deleteBinanceFuturesCredentials() {
  return request(API_ENDPOINTS.OTA_BINANCE_FUTURES_CREDENTIALS, { method: 'DELETE' });
}
