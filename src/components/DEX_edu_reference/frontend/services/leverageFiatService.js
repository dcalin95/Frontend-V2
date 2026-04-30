/**
 * leverageFiatService – Stripe checkout pentru Leverage Trading cu Fiat (EUR/USD direct).
 * Flux: user plătește cu cardul → backend creditează ledger FIAT → UI pregătește formularul Leverage.
 *
 * Backend: POST /api/stripe/create-checkout cu purpose='leverage_fiat_open'
 * Verify: GET /api/stripe/verify-session — mapat prin normalizeStripeVerifySession
 */
import { getBackendUrl, API_ENDPOINTS } from '../../config/apiEndpoints.js';
import { normalizeStripeVerifySession } from './stripeVerifySessionContract';

const PURPOSE = 'leverage_fiat_open';

/**
 * Crează o sesiune Stripe Checkout pentru Fiat → Leverage position.
 *
 * @param {object} p
 * @param {number}  p.amount         – suma în EUR sau USD (ex: 50)
 * @param {'eur'|'usd'} p.currency   – moneda
 * @param {string}  p.walletAddress  – adresa wallet BSC
 * @param {object}  p.tradeParams    – { tradeType:'cfd'|'spot', assetId?, leverageBps, isLong?, settlementToken?, collateralToken?, borrowedToken? }
 * @returns {Promise<{ url: string, sessionId: string }>}
 */
export async function createLeverageFiatCheckout({ amount, currency, walletAddress, tradeParams }) {
  const cur = (currency || 'eur').toLowerCase();
  const body = {
    purpose: PURPOSE,
    currency: cur,
    walletAddress,
    tradeParams,
    ...(cur === 'eur' ? { amountEUR: amount } : { amountUSD: amount }),
  };

  const res = await fetch(`${getBackendUrl()}${API_ENDPOINTS.LEVERAGE_FIAT_CHECKOUT}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok || !data.url) {
    throw new Error(data.error || 'Failed to create Stripe checkout session');
  }
  return { url: data.url, sessionId: data.sessionId };
}

/**
 * Verifică sesiunea Stripe; returnează contractul normalizat + câmpuri legacy.
 * @param {string} sessionId
 */
export async function verifyLeverageFiatSession(sessionId) {
  const res = await fetch(
    `${getBackendUrl()}${API_ENDPOINTS.LEVERAGE_FIAT_VERIFY}?session_id=${encodeURIComponent(sessionId)}`,
    { credentials: 'include' }
  );
  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  const v = normalizeStripeVerifySession(data, { httpOk: res.ok, httpStatus: res.status });
  const paid =
    v.ok !== false &&
    v.businessStatus === 'success' &&
    (v.raw?.paid === true || v.paymentStatus === 'paid');
  return {
    httpOk: res.ok,
    normalized: v,
    paid,
    purpose: v.ok !== false ? v.purpose : '',
    tradeParams: v.ok !== false ? v.tradeParams : null,
    amountEur: v.ok !== false && v.amountEur != null ? v.amountEur : 0,
    amountUsd: v.ok !== false && v.amountUsd != null ? v.amountUsd : 0,
    amount: v.ok !== false ? v.amount : null,
    currency: v.ok !== false ? v.currency : 'eur',
    walletAddress: v.ok !== false ? v.walletAddress : '',
    ledgerCredited: v.ok !== false ? v.ledgerCredited : false,
    leverageFollowUpRequired: v.ok !== false ? v.leverageFollowUpRequired : false,
    metadata: v.ok !== false ? v.metadata : null,
    amountMinor: v.ok !== false ? v.amountMinor : null,
    chargeCurrency: v.ok !== false ? v.chargeCurrency : null,
  };
}
