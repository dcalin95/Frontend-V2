/**
 * API alerte piață BTC (backend: UserBtcMoveAlertService + worker).
 */
import { API_ENDPOINTS } from '../../config/apiEndpoints.js';
import { otaApiRequest } from '../utils/otaApiClient';

export async function fetchBtcMarketAlertSnapshot() {
  return otaApiRequest(API_ENDPOINTS.OTA_MARKET_ALERTS_BTC_SNAPSHOT, { method: 'GET' });
}

export async function fetchBtcMarketAlertPreferences(userId) {
  const uid = String(userId || '').trim();
  if (!uid) throw new Error('userId required');
  const q = new URLSearchParams({ userId: uid });
  return otaApiRequest(`${API_ENDPOINTS.OTA_MARKET_ALERTS_BTC}?${q}`, { method: 'GET' });
}

export async function saveBtcMarketAlertPreferences(body) {
  return otaApiRequest(API_ENDPOINTS.OTA_MARKET_ALERTS_BTC, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}
