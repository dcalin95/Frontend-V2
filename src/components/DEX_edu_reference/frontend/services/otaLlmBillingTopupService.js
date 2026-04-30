import { getBackendUrl, API_ENDPOINTS } from '../../config/apiEndpoints.js';

const PURPOSE = 'llm_billing_topup';

function buildReturnUrl(kind) {
  const current = new URL(window.location.href);
  if (kind === 'success') {
    current.searchParams.set('payment', 'stripe-llm-billing-success');
    current.searchParams.set('session_id', '{CHECKOUT_SESSION_ID}');
  } else {
    current.searchParams.set('payment', 'stripe-llm-billing-cancel');
    current.searchParams.delete('session_id');
  }
  return current.toString();
}

export async function createOtaLlmBillingTopupCheckout({ walletAddress, currency, amount }) {
  const normalizedCurrency = String(currency || 'usd').trim().toLowerCase() === 'eur' ? 'eur' : 'usd';
  const body = {
    purpose: PURPOSE,
    currency: normalizedCurrency,
    walletAddress,
    successUrl: buildReturnUrl('success'),
    cancelUrl: buildReturnUrl('cancel'),
    ...(normalizedCurrency === 'eur' ? { amountEUR: amount } : { amountUSD: amount }),
  };

  const res = await fetch(`${getBackendUrl()}${API_ENDPOINTS.OTA_LLM_BILLING_TOPUP_CHECKOUT}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) {
    throw new Error(data.error || 'Failed to create Stripe checkout session');
  }
  return {
    url: data.url,
    sessionId: data.sessionId || null,
    creditAmountUsd: data.creditAmountUsd ?? null,
  };
}

export async function verifyOtaLlmBillingTopupSession(sessionId) {
  const res = await fetch(
    `${getBackendUrl()}${API_ENDPOINTS.OTA_LLM_BILLING_TOPUP_VERIFY}?session_id=${encodeURIComponent(sessionId)}`,
    { credentials: 'include' },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || 'Failed to verify Stripe LLM billing session');
  }
  return data;
}
