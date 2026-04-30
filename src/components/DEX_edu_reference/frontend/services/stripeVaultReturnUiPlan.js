/**
 * Plan UX pentru return Stripe pe LeveragePage (fără side effects) — testabil.
 * Consumă output-ul din normalizeStripeVerifySession + răspuns HTTP.
 */

import {
  PURPOSE_LEVERAGE_FIAT_OPEN,
  PURPOSE_VAULT_FUND,
} from '../constants/stripeVaultReturnPurposes';
import { formatVerifySessionAmountLabel } from './stripeVerifySessionContract';

/** @typedef {{ type: 'success'|'info'|'warning'|'error', message: string, requestRefresh: boolean, clearParams: boolean, leverageCallback?: boolean }} StripeVaultToastPlan */

/**
 * @param {Record<string, unknown> & { ok?: boolean, businessStatus?: string, purpose?: string }} v — output normalizeStripeVerifySession
 * @param {{ legacyPaid?: boolean, paidOk?: boolean }} ctx
 * @returns {{ toasts: StripeVaultToastPlan[], leverageCallback: boolean, error?: boolean }}
 */
export function planStripeVaultReturnUx(v, ctx = {}) {
  const { legacyPaid = false, paidOk = false } = ctx;
  const clearParams = true;

  if (!v || v.ok === false) {
    if (v?.businessStatus === 'not_found') {
      return {
        error: true,
        leverageCallback: false,
        toasts: [{
          type: 'warning',
          message:
            'We could not find this checkout session. If you completed a payment, wait a moment and check your card balance on Personal Account, or use the link in your Stripe email receipt.',
          requestRefresh: true,
          clearParams,
        }],
      };
    }
    if (v?.businessStatus === 'invalid_request') {
      return {
        error: true,
        leverageCallback: false,
        toasts: [{
          type: 'error',
          message: v.errorMessage || 'Invalid session.',
          requestRefresh: false,
          clearParams,
        }],
      };
    }
    if (v?.businessStatus === 'configuration_error') {
      return {
        error: true,
        leverageCallback: false,
        toasts: [{
          type: 'error',
          message: 'Card payments are not available (server configuration).',
          requestRefresh: false,
          clearParams,
        }],
      };
    }
    return {
      error: true,
      leverageCallback: false,
      toasts: [{
        type: 'error',
        message: v?.errorMessage || 'Could not verify payment.',
        requestRefresh: false,
        clearParams,
      }],
    };
  }

  const paidOkFinal = v.businessStatus === 'success' || legacyPaid || paidOk;

  if (v.businessStatus === 'failed') {
    const expired =
      String(v.checkoutStatus || v.raw?.checkout_status || '').toLowerCase() === 'expired';
    return {
      error: false,
      leverageCallback: false,
      toasts: [{
        type: 'info',
        message: expired
          ? 'This checkout session expired before payment completed.'
          : 'This checkout was not completed (unpaid or cancelled).',
        requestRefresh: false,
        clearParams,
      }],
    };
  }

  if (v.businessStatus === 'pending' || !paidOkFinal) {
    return {
      error: false,
      leverageCallback: false,
      toasts: [{
        type: 'info',
        message:
          'Payment is still processing or not confirmed yet. Wait a moment, then check your card balance on Personal Account.',
        requestRefresh: true,
        clearParams,
      }],
    };
  }

  const amountLabel = formatVerifySessionAmountLabel(v);

  if (v.purpose === PURPOSE_LEVERAGE_FIAT_OPEN) {
    if (!v.ledgerCredited) {
      return {
        error: false,
        leverageCallback: false,
        toasts: [{
          type: 'warning',
          message: amountLabel
            ? `Payment received (${amountLabel}). Your fiat balance may still be updating — open Personal Account in a moment to confirm.`
            : 'Payment received. Your fiat balance may still be updating — open Personal Account in a moment to confirm.',
          requestRefresh: true,
          clearParams,
        }],
      };
    }
    if (v.leverageFollowUpRequired && v.tradeParams) {
      return {
        error: false,
        leverageCallback: true,
        toasts: [{
          type: 'success',
          message: amountLabel
            ? `Card payment confirmed (${amountLabel}). Fiat balance updated — open your trade from the form when ready (no automatic on-chain open).`
            : 'Card payment confirmed. Fiat balance updated — open your trade from the form when ready (no automatic on-chain open).',
          requestRefresh: true,
          clearParams,
        }],
      };
    }
    return {
      error: false,
      leverageCallback: false,
      toasts: [{
        type: 'success',
        message: amountLabel
          ? `Payment confirmed (${amountLabel}). Your fiat balance was updated — use Trade with Leverage when ready (no automatic position open).`
          : 'Payment confirmed. Your fiat balance was updated — use Trade with Leverage when ready (no automatic position open).',
        requestRefresh: true,
        clearParams,
      }],
    };
  }

  if (v.purpose === PURPOSE_VAULT_FUND) {
    return {
      error: false,
      leverageCallback: false,
      toasts: [{
        type: 'success',
        message: amountLabel
          ? `Payment confirmed (${amountLabel}). Your card balance was updated.`
          : 'Payment confirmed. Your card balance was updated.',
        requestRefresh: true,
        clearParams,
      }],
    };
  }

  return {
    error: false,
    leverageCallback: false,
    toasts: [{
      type: 'success',
      message: amountLabel ? `Stripe payment successful (${amountLabel}).` : 'Stripe payment successful.',
      requestRefresh: true,
      clearParams,
    }],
  };
}

/**
 * Fără session_id în URL după Stripe: nu putem verifica — mesaj pending, refresh.
 */
export function planStripeVaultReturnMissingSessionId() {
  return {
    type: 'info',
    message:
      'Payment return received. If the amount does not appear on Personal Account within a few minutes, check your email or try again.',
    requestRefresh: true,
    clearParams: true,
  };
}

/**
 * Eroare rețea / JSON la verify-session.
 */
export function planStripeVaultReturnNetworkError() {
  return {
    type: 'warning',
    message:
      'Could not confirm payment status. Check your card balance on Personal Account or open your Stripe confirmation email.',
    requestRefresh: true,
    clearParams: true,
  };
}
