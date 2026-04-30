/**
 * handleStripeVaultDeposit - Funds the Leverage/CFD vault through Stripe.
 * Calls backend /api/stripe/create-checkout with purpose=vault_fund.
 */
import {
  isValidStripeAmountEUR,
  STRIPE_PRESETS_EUR,
  isValidStripeAmountUSD,
  STRIPE_PRESETS_USD,
} from '../constants/stripePresets';

const PURPOSE = 'vault_fund';
const BASE_PATH = '/dex/leverage';

export async function handleStripeVaultDeposit({
  amountEUR,
  amountUSD,
  currency = 'eur',
  walletAddress,
}) {
  const isEur = currency === 'eur';
  const amt = isEur ? amountEUR : amountUSD;

  if (!amt || amt < 10) {
    throw new Error(isEur ? 'Minimum €10.' : 'Minimum $10.');
  }
  if (isEur && !isValidStripeAmountEUR(amt)) {
    throw new Error(`Stripe EUR: only €${STRIPE_PRESETS_EUR.join(', €')}.`);
  }
  if (!isEur && !isValidStripeAmountUSD(amt)) {
    throw new Error(`Stripe USD: only $${STRIPE_PRESETS_USD.join(', $')}.`);
  }
  if (!walletAddress) {
    throw new Error('Connect your wallet.');
  }

  const { getBackendUrl } = await import('../../config/apiEndpoints');
  const base = window.location.origin;

  const payload = {
    purpose: PURPOSE,
    currency: isEur ? 'eur' : 'usd',
    amountEUR: isEur ? amt : Math.round(amt / 1.08),
    amountUSD: isEur ? Math.round(amt * 1.08) : amt,
    walletAddress,
    successUrl: `${base}${BASE_PATH}?payment=stripe-vault-success&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${base}${BASE_PATH}?payment=stripe-vault-cancel`,
  };

  const res = await fetch(`${getBackendUrl()}/api/stripe/create-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || !data?.url) {
    throw new Error(data?.error || 'Error opening Stripe.');
  }

  const w = window.open(data.url, '_blank', 'noopener');
  if (!w) window.location.href = data.url;
  return data;
}
