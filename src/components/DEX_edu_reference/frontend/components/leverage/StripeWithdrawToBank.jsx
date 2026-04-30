/**
 * Withdraw Stripe balance (EUR/USD) to saved IBAN.
 * Requires user to have bank account set in Profile. Uses GET /api/stripe/balance, POST /api/stripe/withdraw.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Landmark } from 'lucide-react';
import { toast } from 'react-toastify';
import { useDexAuth } from '../../context/DexAuthContext';
import { getStripeBalance, requestWithdraw, WITHDRAW_MIN_EUR, WITHDRAW_MIN_USD } from '../../services/stripeWithdrawalService';
import { BITS_FIAT_BALANCE_REFRESH, requestFiatBalanceRefresh } from '../../utils/fiatBalanceEvents';
import { formatFiatWithdrawalStatusLabel } from '../../utils/fiatWithdrawalStatusUi';
import '../../styles/components/vault-deposit-panel.css';

function newWithdrawIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `wd-${crypto.randomUUID()}`;
  return `wd-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export default function StripeWithdrawToBank({ onSuccess }) {
  const { user } = useDexAuth();
  const hasIban = !!(user?.iban || user?.iban_masked);
  const idempotencyKeyRef = useRef(null);

  const [balanceEur, setBalanceEur] = useState(0);
  const [balanceUsd, setBalanceUsd] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [currency, setCurrency] = useState('eur');
  const [amount, setAmount] = useState('');
  const [withdrawPending, setWithdrawPending] = useState(false);
  const [error, setError] = useState(null);
  const [lastStatus, setLastStatus] = useState(null);

  const loadBalances = useCallback(() => {
    setBalanceLoading(true);
    setError(null);
    return getStripeBalance()
      .then((r) => {
        setBalanceEur(r.balanceEur ?? 0);
        setBalanceUsd(r.balanceUsd ?? 0);
      })
      .catch((e) => {
        setError(e?.message || 'Failed to load balance');
      })
      .finally(() => {
        setBalanceLoading(false);
      });
  }, []);

  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  useEffect(() => {
    window.addEventListener(BITS_FIAT_BALANCE_REFRESH, loadBalances);
    return () => window.removeEventListener(BITS_FIAT_BALANCE_REFRESH, loadBalances);
  }, [loadBalances]);

  const available = currency === 'eur' ? balanceEur : balanceUsd;
  const minAmount = currency === 'eur' ? WITHDRAW_MIN_EUR : WITHDRAW_MIN_USD;
  const amountNum = parseFloat(amount) || 0;
  const canSubmit = hasIban && !withdrawPending && amountNum >= minAmount && amountNum <= available;

  const handleRequestWithdraw = async () => {
    if (!canSubmit) return;
    setError(null);
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = newWithdrawIdempotencyKey();
    }
    setWithdrawPending(true);
    try {
      const data = await requestWithdraw({
        amount: amountNum,
        currency,
        idempotencyKey: idempotencyKeyRef.current,
      });
      setLastStatus(data?.status || null);
      idempotencyKeyRef.current = null;
      const msg = data?.message || 'Request recorded.';
      if (data?.idempotentReplay) {
        toast.info(msg);
      } else {
        toast.success(msg);
      }
      setAmount('');
      requestFiatBalanceRefresh();
      if (typeof onSuccess === 'function') onSuccess();
      getStripeBalance().then((r) => {
        setBalanceEur(r.balanceEur ?? 0);
        setBalanceUsd(r.balanceUsd ?? 0);
      }).catch(() => {});
    } catch (e) {
      idempotencyKeyRef.current = null;
      setError(e?.message || 'Withdrawal request failed');
    } finally {
      setWithdrawPending(false);
    }
  };

  if (!hasIban) {
    return (
      <div className="vault-deposit-panel-connect" style={{ textAlign: 'left' }}>
        <p>
          <Landmark size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} aria-hidden />
          Add a bank account (IBAN) in your Profile to withdraw EUR or USD to your bank.
        </p>
        <Link to="/dex-edu/profile" className="vault-deposit-panel-btn vault-deposit-panel-btn-primary">
          Go to Profile → Bank account
        </Link>
      </div>
    );
  }

  return (
    <div className="vault-deposit-stripe-section">
      <h3 className="vault-deposit-stripe-currency">Withdraw to bank</h3>
      <p className="vault-deposit-stripe-hint">
        Request a withdrawal to your saved IBAN. The amount is reserved on your card balance while the request is open.
        Outbound bank transfers from this app are not automated yet—our team or a future integration processes them; timelines are not guaranteed.
      </p>

      {balanceLoading ? (
        <p className="vault-deposit-panel-desc">Loading balance…</p>
      ) : (
        <>
          <div className="vault-deposit-panel-field">
            <label className="vault-deposit-panel-label">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="vault-deposit-panel-select"
              aria-label="Currency"
            >
              <option value="eur">EUR (€)</option>
              <option value="usd">USD ($)</option>
            </select>
          </div>
          <div className="vault-deposit-panel-field">
            <div className="vault-deposit-panel-amount-row">
              <label className="vault-deposit-panel-label">Amount</label>
              <span className="vault-deposit-panel-balance">
                Available: {currency === 'eur' ? `€${balanceEur.toFixed(2)}` : `$${balanceUsd.toFixed(2)}`}
              </span>
            </div>
            <input
              type="number"
              min={minAmount}
              max={available}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={minAmount.toString()}
              className="vault-deposit-panel-input"
              aria-label="Withdrawal amount"
            />
            <p className="vault-deposit-panel-desc" style={{ marginTop: 4 }}>Min {currency === 'eur' ? `€${minAmount}` : `$${minAmount}`}.</p>
          </div>
          {error && (
            <div className="vault-deposit-panel-error" role="alert">{error}</div>
          )}
          <button
            type="button"
            onClick={handleRequestWithdraw}
            disabled={!canSubmit}
            className="vault-deposit-panel-btn vault-deposit-panel-btn-primary vault-deposit-panel-btn-full"
          >
            {withdrawPending ? 'Requesting…' : 'Request withdrawal'}
          </button>
          {lastStatus && (
            <p className="vault-deposit-panel-desc" style={{ marginTop: 8 }} role="status">
              Last request status: <strong>{formatFiatWithdrawalStatusLabel(lastStatus)}</strong> — check Personal Account or Profile for full history.
            </p>
          )}
          <p className="vault-deposit-panel-desc" style={{ marginTop: 8 }}>
            Status updates appear in your card history; this is not an instant automated bank transfer from Stripe.
          </p>
        </>
      )}
    </div>
  );
}
