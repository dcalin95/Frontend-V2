/**
 * StripeVaultDeposit – Alimentare vault prin plată card (EUR/USD).
 * Pachete fixe din stripePresets. Backend: purpose=vault_fund.
 */
import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { STRIPE_PRESETS_EUR, STRIPE_PRESETS_USD } from '../../../../../Presale/constants/stripePresets';
import { handleStripeVaultDeposit } from '../../../../../Presale/TokenHandlers/handleStripeVaultDeposit';
import '../../styles/components/vault-deposit-panel.css';

const formatCurrency = (n, currency) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n);

function CurrencyBlock({ currency, presets, selected, onSelect, onPay, pending }) {
  const isEur = currency === 'eur';
  const symbol = isEur ? '€' : '$';
  return (
    <div className={`vault-deposit-stripe-section ${!isEur ? 'vault-deposit-stripe-usd' : ''}`}>
      <h3 className="vault-deposit-stripe-currency">
        <CreditCard size={18} /> {currency.toUpperCase()} (Stripe)
      </h3>
      <p className="vault-deposit-stripe-hint">Pachete fixe – Stripe configurat {currency.toUpperCase()}.</p>
      <div className="vault-deposit-stripe-presets">
        {presets.map((amt) => (
          <button
            key={`${currency}-${amt}`}
            type="button"
            className={`vault-deposit-panel-btn vault-deposit-stripe-preset ${selected === amt ? 'active' : ''}`}
            onClick={() => onSelect(amt)}
          >
            {formatCurrency(amt, currency === 'eur' ? 'EUR' : 'USD')}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onPay(currency)}
        disabled={pending}
        className="vault-deposit-panel-btn vault-deposit-panel-btn-primary vault-deposit-panel-btn-full"
      >
        {pending ? 'Opening Stripe…' : `Pay with card ${symbol}${selected}`}
      </button>
    </div>
  );
}

export default function StripeVaultDeposit({ walletAddress, connectWallet, isConnected, onSuccess }) {
  const [selectedEUR, setSelectedEUR] = useState(10);
  const [selectedUSD, setSelectedUSD] = useState(10);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const handlePay = async (currency) => {
    setError(null);
    if (!isConnected || !walletAddress) {
      connectWallet?.();
      return;
    }
    setPending(true);
    try {
      if (currency === 'eur') {
        await handleStripeVaultDeposit({ amountEUR: selectedEUR, walletAddress, currency: 'eur' });
      } else {
        await handleStripeVaultDeposit({ amountUSD: selectedUSD, walletAddress, currency: 'usd' });
      }
      onSuccess?.();
    } catch (e) {
      setError(e?.message || 'Payment failed');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="vault-deposit-stripe">
      <p className="vault-deposit-panel-desc">
        <strong>Stablecoins</strong>: EURS, EURC (Euro) and USDT, USDC (USD) – on-chain deposit. <strong>Fiat</strong>: card payment EUR or USD via Stripe.
      </p>
      {!isConnected ? (
        <div className="vault-deposit-panel-connect">
          <p>Connect your wallet to pay with card.</p>
          <button type="button" onClick={connectWallet} className="vault-deposit-panel-btn vault-deposit-panel-btn-primary">
            Connect
          </button>
        </div>
      ) : (
        <>
          <CurrencyBlock
            currency="eur"
            presets={STRIPE_PRESETS_EUR}
            selected={selectedEUR}
            onSelect={setSelectedEUR}
            onPay={handlePay}
            pending={pending}
          />
          <CurrencyBlock
            currency="usd"
            presets={STRIPE_PRESETS_USD}
            selected={selectedUSD}
            onSelect={setSelectedUSD}
            onPay={handlePay}
            pending={pending}
          />
          {error && (
            <div className="vault-deposit-panel-error" role="alert">{error}</div>
          )}
        </>
      )}
    </div>
  );
}
