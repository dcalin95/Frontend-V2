/**
 * Eveniment global pentru reîncărcarea soldului FIAT (GET /api/stripe/balance) după verify-session / conversii.
 * Aliniat cu pattern-ul bits-vault-balances-refetch (crypto).
 */
export const BITS_FIAT_BALANCE_REFRESH = 'bits-fiat-balance-refresh';

export function requestFiatBalanceRefresh() {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(BITS_FIAT_BALANCE_REFRESH));
    }
  } catch (_) {
    /* ignore */
  }
}
