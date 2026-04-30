/**
 * Pachete Stripe cu sume fixe – EUR și USD.
 * SSOT: aceste valori sunt sincronizate cu backend (stripeVaultFundService.VAULT_FUND_PRESETS).
 */
export const STRIPE_PRESETS_EUR = [10, 30, 50, 100, 500, 1000];
export const STRIPE_PRESETS_USD = [10, 30, 50, 100, 500, 1000];
export const STRIPE_PRESETS = STRIPE_PRESETS_EUR; // alias pentru compatibilitate

export const STRIPE_MIN_EUR = 10;
export const STRIPE_MIN_USD = 10;

function isValidPreset(amount, min, presets) {
  return Number.isFinite(amount) && amount >= min && presets.includes(Number(amount));
}

/** Verifică dacă suma EUR este un pachet valid */
export function isValidStripeAmountEUR(amount) {
  return isValidPreset(amount, STRIPE_MIN_EUR, STRIPE_PRESETS_EUR);
}

/** Verifică dacă suma USD este un pachet valid */
export function isValidStripeAmountUSD(amount) {
  return isValidPreset(amount, STRIPE_MIN_USD, STRIPE_PRESETS_USD);
}
