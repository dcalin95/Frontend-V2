/**
 * LeverageFiatPanel – Plată Fiat (EUR/USD via Stripe) pentru deschidere poziție Leverage/CFD.
 * Design: XTB-style compact panel cu flag logos, presets și buton clar.
 */
import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { createLeverageFiatCheckout } from '../../services/leverageFiatService';
import TokenLogo from '../common/TokenLogo';

const PRESETS = [10, 30, 50, 100, 200, 500];
const EUR_USD = 1.08;

export default function LeverageFiatPanel({
  tradeParams,
  tradeLabel,
  walletAddress,
  isConnected,
  connectWallet,
}) {
  const [currency, setCurrency] = useState('eur');
  const [selected, setSelected]   = useState(50);
  const [custom, setCustom]       = useState('');
  const [pending, setPending]     = useState(false);
  const [error, setError]         = useState(null);

  const amount = custom ? Number(custom) : selected;
  const fmtAmt = (n) => (currency === 'usd' ? `$${n}` : `€${n}`);
  const usdEq  = currency === 'eur' ? Math.round(amount * EUR_USD) : amount;

  async function handlePay() {
    setError(null);
    if (!isConnected || !walletAddress) { connectWallet?.(); return; }
    if (!amount || amount < 10) {
      setError(`Minimum ${currency === 'usd' ? '$10' : '€10'}.`);
      return;
    }
    setPending(true);
    try {
      const { url } = await createLeverageFiatCheckout({ amount, currency, walletAddress, tradeParams });
      window.location.href = url;
    } catch (e) {
      setError(e?.message || 'Stripe error. Try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="lev-fiat-panel">
      {/* Header */}
      <div className="lev-fiat-panel__header">
        <CreditCard size={14} aria-hidden />
        Pay with card — Stripe
      </div>

      {/* Trade label */}
      {tradeLabel && (
        <div className="lev-fiat-panel__trade-label">{tradeLabel}</div>
      )}

      {/* Currency toggle */}
      <div className="lev-flag-toggle" role="group" aria-label="Currency">
        {[{ id: 'eur', sym: 'EUR', lbl: 'EUR' }, { id: 'usd', sym: 'USD', lbl: 'USD' }].map((c) => (
          <button
            key={c.id}
            type="button"
            className={`lev-flag-btn${currency === c.id ? ' active' : ''}`}
            onClick={() => { setCurrency(c.id); setCustom(''); setSelected(50); setError(null); }}
            aria-pressed={currency === c.id}
          >
            <span className="lev-flag-logo" aria-hidden>
              <TokenLogo symbol={c.sym} size="xs" />
            </span>
            {c.lbl}
          </button>
        ))}
      </div>

      {/* Amount presets */}
      <div className="lev-amount-presets" role="group" aria-label="Amount presets">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            className={`lev-amount-preset${!custom && selected === p ? ' active' : ''}`}
            onClick={() => { setSelected(p); setCustom(''); setError(null); }}
            aria-pressed={!custom && selected === p}
          >
            {fmtAmt(p)}
          </button>
        ))}
      </div>

      {/* Custom amount */}
      <input
        type="number"
        min="10"
        step="1"
        className="leverage-input"
        value={custom}
        onChange={(e) => { setCustom(e.target.value); setError(null); }}
        placeholder={`Custom — min. ${fmtAmt(10)}`}
        aria-label="Custom fiat amount"
      />

      {/* Equivalent */}
      {amount >= 10 && Number.isFinite(amount) && (
        <p className="lev-fiat-panel__usd-eq">
          ≈ {usdEq} USDT will be credited to vault
        </p>
      )}

      {error && <p className="lev-fiat-error" role="alert">{error}</p>}

      {/* Pay button */}
      <button
        type="button"
        className="leverage-btn leverage-btn-full lev-fiat-pay-btn"
        onClick={handlePay}
        disabled={pending || !Number.isFinite(amount) || amount < 10}
        aria-busy={pending}
      >
        <CreditCard size={14} aria-hidden />
        {pending ? 'Opening Stripe…' : isConnected
          ? `Open with Fiat — ${fmtAmt(amount || 0)}`
          : 'Connect wallet first'}
      </button>

      <p className="lev-fiat-panel__note">
        Powered by Stripe · After payment, position form will be pre-filled for confirmation.
      </p>
    </div>
  );
}
