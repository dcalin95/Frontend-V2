import React from "react";
import "../PaymentBox.css";

const STRIPE_PRESETS = [10, 20, 30, 50, 100];

const formatCurrency = (value, currency) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const StripeAmountSelector = ({
  selectedAmountEUR,
  onSelectAmount,
  eurToUsdRate,
  isRateLoading,
  rateError,
  pricePerBitsUSD,
}) => {
  const effectiveBitsPrice =
    pricePerBitsUSD && pricePerBitsUSD > 0 ? pricePerBitsUSD : 0.001;

  const usdValue = selectedAmountEUR
    ? selectedAmountEUR * (eurToUsdRate || 1)
    : 0;

  const estimatedBits =
    usdValue > 0 ? Math.floor(usdValue / effectiveBitsPrice) : 0;

  return (
    <div className="stripe-card-box">
      <div className="stripe-card-box__header">
        <div>
          <h3>Secure Stripe Card Checkout</h3>
          <p>
            Pick a fixed EUR package. We calculate the $BITS you receive using
            the live USD price.
          </p>
        </div>
        <div className="stripe-card-box__rate">
          {rateError ? (
            <span className="stripe-card-box__rate-error">
              Failed to fetch EUR→USD rate. Using 1.00 fallback.
            </span>
          ) : (
            <span>
              EUR → USD rate:{" "}
              {isRateLoading
                ? "updating…"
                : eurToUsdRate
                ? eurToUsdRate.toFixed(4)
                : "1.0000"}
            </span>
          )}
        </div>
      </div>

      <div className="stripe-card-box__options">
        {STRIPE_PRESETS.map((amount) => (
          <button
            key={amount}
            type="button"
            className={`stripe-card-box__option ${
              selectedAmountEUR === amount ? "is-active" : ""
            }`}
            onClick={() => onSelectAmount(amount)}
          >
            <span className="stripe-card-box__option-amount">
              {formatCurrency(amount, "EUR")}
            </span>
            <span className="stripe-card-box__option-sub">
              ≈{" "}
              {formatCurrency(amount * (eurToUsdRate || 1), "USD")}
            </span>
          </button>
        ))}
      </div>

      <div className="stripe-card-box__summary">
        <div className="stripe-card-box__summary-line">
          <span>You Pay:</span>
          <span>
            {formatCurrency(selectedAmountEUR, "EUR")} •{" "}
            {formatCurrency(usdValue, "USD")}
          </span>
        </div>
        <div className="stripe-card-box__summary-line">
          <span>Current $BITS price:</span>
          <span>{formatCurrency(effectiveBitsPrice, "USD")}</span>
        </div>
        <div className="stripe-card-box__summary-line">
          <span>You Receive:</span>
          <span>
            {estimatedBits.toLocaleString("en-US")} $BITS
          </span>
        </div>
      </div>
    </div>
  );
};

export default StripeAmountSelector;

