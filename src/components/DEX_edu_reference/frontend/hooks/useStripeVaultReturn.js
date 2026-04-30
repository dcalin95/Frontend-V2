/**
 * Hook pentru returnarea din Stripe (success/cancel) pe LeveragePage.
 * Consumă contractul GET /api/stripe/verify-session (normalizeStripeVerifySession).
 *
 * @param {object} options
 * @param {function} [options.onFiatLeverageSuccess] – callback după plată leverage_fiat_open cu ledger + tradeParams
 */
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getBackendUrl } from '../../config/apiEndpoints.js';
import {
  normalizeStripeVerifySession,
} from '../services/stripeVerifySessionContract';
import {
  planStripeVaultReturnUx,
  planStripeVaultReturnMissingSessionId,
  planStripeVaultReturnNetworkError,
} from '../services/stripeVaultReturnUiPlan';
import { requestFiatBalanceRefresh } from '../utils/fiatBalanceEvents';
import { PURPOSE_LEVERAGE_FIAT_OPEN } from '../constants/stripeVaultReturnPurposes';

const PAYMENT_SUCCESS = 'stripe-vault-success';
const PAYMENT_CANCEL = 'stripe-vault-cancel';

export { PURPOSE_LEVERAGE_FIAT_OPEN, PURPOSE_VAULT_FUND } from '../constants/stripeVaultReturnPurposes';

export function useStripeVaultReturn({ onFiatLeverageSuccess } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  /** Evită dublu-verify la StrictMode sau re-run rapid cu același session_id. */
  const processedSessionIdsRef = useRef(new Set());

  useEffect(() => {
    const payment = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');

    if (payment === PAYMENT_SUCCESS) {
      const verify = async () => {
        if (!sessionId) {
          const p = planStripeVaultReturnMissingSessionId();
          if (p.type === 'info') toast.info(p.message);
          else toast[p.type]?.(p.message);
          if (p.requestRefresh) requestFiatBalanceRefresh();
          setSearchParams({}, { replace: true });
          return;
        }
        if (processedSessionIdsRef.current.has(sessionId)) {
          setSearchParams({}, { replace: true });
          return;
        }
        processedSessionIdsRef.current.add(sessionId);
        try {
          const r = await fetch(
            `${getBackendUrl()}/api/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}`,
            { credentials: 'include' }
          );
          let data = {};
          try {
            data = await r.json();
          } catch {
            data = {};
          }
          const v = normalizeStripeVerifySession(data, { httpOk: r.ok, httpStatus: r.status });

          const legacyPaid = v.raw?.status === 'success' || (v.raw?.ok && v.raw?.paid);
          const paidOk = v.businessStatus === 'success' || legacyPaid;

          const plan = planStripeVaultReturnUx(v, { legacyPaid, paidOk });

          const fireToasts = (toasts) => {
            let needRefresh = false;
            for (const t of toasts) {
              const fn = toast[t.type];
              if (typeof fn === 'function') fn(t.message);
              if (t.requestRefresh) needRefresh = true;
            }
            if (needRefresh) requestFiatBalanceRefresh();
          };

          if (plan.error) {
            fireToasts(plan.toasts);
            setSearchParams({}, { replace: true });
            return;
          }

          fireToasts(plan.toasts);

          if (plan.leverageCallback && v.purpose === PURPOSE_LEVERAGE_FIAT_OPEN && v.leverageFollowUpRequired && v.tradeParams) {
            if (typeof onFiatLeverageSuccess === 'function') {
              try {
                await onFiatLeverageSuccess({
                  tradeParams: v.tradeParams,
                  amountEur: v.amountEur,
                  amountUsd: v.amountUsd,
                  currency: v.currency,
                  amount: v.amount,
                  ledgerCredited: v.ledgerCredited,
                  leverageFollowUpRequired: v.leverageFollowUpRequired,
                  metadata: v.metadata,
                });
              } catch (e) {
                toast.error(`Could not prepare trade form: ${e?.message || 'Unknown error'}`);
              }
            }
          }

          setSearchParams({}, { replace: true });
          return;
        } catch {
          const p = planStripeVaultReturnNetworkError();
          toast[p.type](p.message);
          if (p.requestRefresh) requestFiatBalanceRefresh();
          setSearchParams({}, { replace: true });
          return;
        }
      };
      verify();
    } else if (payment === PAYMENT_CANCEL) {
      toast.info('Payment was cancelled.');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, onFiatLeverageSuccess]);
}
