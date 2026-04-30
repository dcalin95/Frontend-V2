/**
 * Leverage Demo Account API Service
 * Backend: /api/dex/v1/leverage-demo/* (status, open, account GET/PUT)
 * Uses session auth (credentials: 'include').
 */

import { BACKEND_URL } from '../utils/constants';
import { API_ENDPOINTS } from '../../config/apiEndpoints.js';

async function request(endpoint, options = {}) {
  const url = `${BACKEND_URL}${endpoint}`;
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/**
 * GET status for (user + wallet). walletAddress optional if from session.
 */
export async function getDemoStatus(walletAddress = null) {
  const q = walletAddress ? `?walletAddress=${encodeURIComponent(walletAddress)}` : '';
  return request(`${API_ENDPOINTS.LEVERAGE_DEMO_STATUS}${q}`);
}

/**
 * POST open (create or reset) demo account for wallet.
 */
export async function openDemoAccount(walletAddress) {
  return request(API_ENDPOINTS.LEVERAGE_DEMO_OPEN, {
    method: 'POST',
    body: JSON.stringify({ walletAddress }),
  });
}

/**
 * GET full account (vaultBalances, positions). 404 if none, 410 if expired.
 */
export async function getDemoAccount(walletAddress) {
  const q = walletAddress ? `?walletAddress=${encodeURIComponent(walletAddress)}` : '';
  return request(`${API_ENDPOINTS.LEVERAGE_DEMO_ACCOUNT_GET}${q}`);
}

/**
 * PUT update vaultBalances and/or positions (simulated trades).
 */
export async function updateDemoAccount(walletAddress, { vaultBalances, positions }) {
  return request(API_ENDPOINTS.LEVERAGE_DEMO_ACCOUNT_UPDATE, {
    method: 'PUT',
    body: JSON.stringify({ walletAddress, vaultBalances, positions }),
  });
}

export default {
  getDemoStatus,
  openDemoAccount,
  getDemoAccount,
  updateDemoAccount,
};
