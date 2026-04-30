/**
 * Fiat Convert Service – conversie sold fiat (Stripe) → BNB sau USDT.
 * Backend: GET /api/stripe/convert-quote, POST /api/stripe/convert-to-token, GET /api/stripe/convert-orders.
 */

import { getBackendUrl } from '../../config/apiEndpoints.js';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Mapare unică quote API → UI (aceleași câmpuri ca backend formatFiatQuoteForApi + aliasuri vechi).
 * @param {Record<string, unknown>|null|undefined} raw
 */
export function normalizeConvertQuote(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw;
  const inputCurrency = (r.inputCurrency ?? r.currency ?? 'eur').toString().toLowerCase();
  const target = (r.targetToken ?? r.tokenOut ?? 'bnb').toString().toLowerCase();
  const execDefault = target !== 'usdt';
  const executionAvailable =
    r.executionAvailable != null ? !!r.executionAvailable : execDefault;
  return {
    ok: r.ok !== false,
    inputAmount: r.inputAmount != null ? Number(r.inputAmount) : (r.amountFiat != null ? Number(r.amountFiat) : null),
    inputCurrency: inputCurrency === 'usd' ? 'usd' : 'eur',
    targetToken: target === 'usdt' ? 'usdt' : 'bnb',
    estimatedOutput: r.estimatedOutput != null ? Number(r.estimatedOutput) : (r.amountOut != null ? Number(r.amountOut) : null),
    estimatedOutputFormatted: (r.estimatedOutputFormatted ?? r.amountOutFormatted ?? '0').toString(),
    rateBnbUsd: r.rateBnbUsd != null ? Number(r.rateBnbUsd) : (r.bnbPriceUsd != null ? Number(r.bnbPriceUsd) : null),
    spreadMultiplier: r.spreadMultiplier != null ? Number(r.spreadMultiplier) : null,
    spreadFeeApproxUsd: r.spreadFeeApproxUsd != null ? Number(r.spreadFeeApproxUsd) : (r.spreadFeeApprox != null ? Number(r.spreadFeeApprox) : null),
    amountUsdGross: r.amountUsdGross != null ? Number(r.amountUsdGross) : null,
    amountUsdNet: r.amountUsdNet != null ? Number(r.amountUsdNet) : null,
    executionAvailable,
    executionUnavailableReason: r.executionUnavailableReason != null ? String(r.executionUnavailableReason) : null,
    /** Backend: native BNB din relayer → wallet user (nu UserVault). */
    bnbExecution: r.bnbExecution && typeof r.bnbExecution === 'object' ? r.bnbExecution : null,
    /** Backend: USDT BEP20 din relayer → wallet user (nu UserVault). */
    usdtExecution: r.usdtExecution && typeof r.usdtExecution === 'object' ? r.usdtExecution : null,
  };
}

/**
 * @param {Record<string, unknown>|null|undefined} raw
 */
export function normalizeConvertOrderResponse(raw) {
  if (!raw || typeof raw !== 'object') return { ok: false, idempotentReplay: false };
  const r = raw;
  return {
    ok: r.ok !== false,
    orderId: r.orderId,
    status: r.status != null ? String(r.status) : undefined,
    idempotentReplay: !!r.idempotentReplay,
    message: r.message != null ? String(r.message) : '',
    inputAmount: r.inputAmount != null ? Number(r.inputAmount) : undefined,
    inputCurrency: r.inputCurrency != null ? String(r.inputCurrency) : undefined,
    targetToken: r.targetToken != null ? String(r.targetToken) : undefined,
    amountOut: r.amountOut != null ? Number(r.amountOut) : undefined,
    amountOutFormatted: r.amountOutFormatted != null ? String(r.amountOutFormatted) : undefined,
    spreadMultiplier: r.spreadMultiplier != null ? Number(r.spreadMultiplier) : undefined,
    spreadFeeApproxUsd: r.spreadFeeApproxUsd != null ? Number(r.spreadFeeApproxUsd) : undefined,
    amountUsdNet: r.amountUsdNet != null ? Number(r.amountUsdNet) : undefined,
    rateBnbUsd: r.rateBnbUsd != null ? Number(r.rateBnbUsd) : undefined,
    bnbExecution: r.bnbExecution && typeof r.bnbExecution === 'object' ? r.bnbExecution : null,
    usdtExecution: r.usdtExecution && typeof r.usdtExecution === 'object' ? r.usdtExecution : null,
  };
}

/**
 * Get conversion quote (estimate).
 * @param {{ amountFiat: number, currency: 'eur'|'usd', tokenOut: 'bnb'|'usdt' }}
 * @returns {Promise<{ amountOut, amountOutFormatted, bnbPriceUsd?, tokenOut, amountFiat, currency, amountUsd }>}
 */
export async function getConvertQuote({ amountFiat, currency = 'eur', tokenOut = 'bnb' }) {
  const params = new URLSearchParams({
    amountFiat: String(amountFiat),
    currency: currency === 'usd' ? 'usd' : 'eur',
    tokenOut: tokenOut === 'usdt' ? 'usdt' : 'bnb',
  });
  const url = `${getBackendUrl()}${API_ENDPOINTS.STRIPE_CONVERT_QUOTE || '/api/stripe/convert-quote'}?${params}`;
  const res = await fetch(url, { method: 'GET', credentials: 'include', headers: { Accept: 'application/json' } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  }
  return data;
}

/**
 * Create conversion order (fiat → BNB/USDT).
 * @param {{ amountFiat: number, currency: 'eur'|'usd', tokenOut: 'bnb'|'usdt', walletAddress?: string, idempotencyKey?: string }}
 * @returns {Promise<{ ok, orderId, status, message, idempotentReplay?: boolean }>}
 */
export async function createConvertOrder({ amountFiat, currency = 'eur', tokenOut = 'bnb', walletAddress, idempotencyKey }) {
  const url = `${getBackendUrl()}${API_ENDPOINTS.STRIPE_CONVERT_TO_TOKEN || '/api/stripe/convert-to-token'}`;
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (idempotencyKey) {
    headers['Idempotency-Key'] = String(idempotencyKey);
  }
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify({
      amountFiat: Number(amountFiat),
      currency: currency === 'usd' ? 'usd' : 'eur',
      tokenOut: tokenOut === 'usdt' ? 'usdt' : 'bnb',
      walletAddress: walletAddress || undefined,
      idempotencyKey: idempotencyKey || undefined,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  }
  return data;
}

/**
 * Get conversion orders history.
 * @returns {Promise<{ orders: Array<{ id, amount_fiat, currency, amount_out, token_out, status, created_at, completed_at }> }>}
 */
export async function getConvertOrders() {
  const url = `${getBackendUrl()}${API_ENDPOINTS.STRIPE_CONVERT_ORDERS || '/api/stripe/convert-orders'}`;
  const res = await fetch(url, { method: 'GET', credentials: 'include', headers: { Accept: 'application/json' } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  }
  return { orders: data.orders || [] };
}
