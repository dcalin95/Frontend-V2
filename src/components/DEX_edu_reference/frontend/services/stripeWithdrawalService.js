/**
 * Stripe withdrawal (payout to bank): balance + request.
 * Backend: GET /api/stripe/balance, POST /api/stripe/withdraw.
 * @see docs/STRIPE_IBAN_WITHDRAWAL_SKELETON.md
 */

import { getBackendUrl } from '../../config/apiEndpoints.js';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Fetch available balance for withdrawal (EUR / USD).
 * @returns {Promise<{ balanceEur?: number, balanceUsd?: number, error?: string }>}
 */
export async function getStripeBalance() {
  const url = `${getBackendUrl()}${API_ENDPOINTS.STRIPE_BALANCE || '/api/stripe/balance'}`;
  const res = await fetch(url, { method: 'GET', credentials: 'include', headers: { Accept: 'application/json' } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return {
    balanceEur: data.balanceEur ?? data.balance_eur ?? 0,
    balanceUsd: data.balanceUsd ?? data.balance_usd ?? 0,
  };
}

/**
 * Fetch vault deposits + withdrawals for profile (alimentări Stripe + retrageri).
 * Stripe Session expune: customer_details.email, metadata.wallet_address.
 * Backend poate returna aceste câmpuri în deposits pentru atribuire transparentă.
 * @returns {Promise<{ deposits: Array<{ id, amount_eur, amount_usd, currency, created_at, wallet_address?, customer_email? }>, withdrawals: Array }>}
 */
export async function getStripeHistory() {
  const url = `${getBackendUrl()}${API_ENDPOINTS.STRIPE_HISTORY || '/api/stripe/history'}`;
  const res = await fetch(url, { method: 'GET', credentials: 'include', headers: { Accept: 'application/json' } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return {
    deposits: data.deposits || [],
    withdrawals: data.withdrawals || [],
  };
}

/** Minimum withdrawal amount (backend may enforce too). */
export const WITHDRAW_MIN_EUR = 10;
export const WITHDRAW_MIN_USD = 10;

/**
 * Request withdrawal to saved IBAN.
 * @param {{ amount: number, currency: 'eur' | 'usd', idempotencyKey?: string }} payload
 * @returns {Promise<{ ok: boolean, payoutId?: string, status?: string, message?: string, idempotentReplay?: boolean, payoutMode?: string }>}
 */
export async function requestWithdraw(payload) {
  const { amount, currency, idempotencyKey } = payload || {};
  const url = `${getBackendUrl()}${API_ENDPOINTS.STRIPE_WITHDRAW || '/api/stripe/withdraw'}`;
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (idempotencyKey) {
    headers['Idempotency-Key'] = String(idempotencyKey);
  }
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify({
      amount: Number(amount),
      currency: (currency === 'usd' ? 'usd' : 'eur'),
      ...(idempotencyKey ? { idempotencyKey: String(idempotencyKey) } : {}),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}
