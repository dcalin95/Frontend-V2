import React from "react";
import "../PaymentBox.css";

const STRIPE_PRESETS = [10, 30, 50, 100, 500, 1000];

const formatCurrency = (value, currency, fractionDigits = 2) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);

const StripeAmountSelector = ({
  selectedAmountEUR,
  onSelectAmount,
  eurToUsdRate,
  isRateLoading,
  rateError,
  bitsPriceUSD,
}) => {
  const effectiveBitsPrice =
    bitsPriceUSD && bitsPriceUSD > 0 ? bitsPriceUSD : 0.001;

  const usdValue = selectedAmountEUR
    ? selectedAmountEUR * (eurToUsdRate || 1)
    : 0;

  const estimatedBits =
    usdValue > 0 ? Math.floor(usdValue / effectiveBitsPrice) : 0;

  const renderAmountIcon = (amount) => {
    const gradientId = `stripe-amount-icon-${amount}`;
    const iconMap = {
      10: {
        stops: ["#4ade80", "#22c55e"],
        path: "M24 6 C14 14 12 26 18 34 C20 37 22 39 24 42 C26 39 28 37 30 34 C36 26 34 14 24 6 Z",
      },
      30: {
        stops: ["#2dd4bf", "#14b8a6"],
        path: "M24 6 L36 14 L36 30 L24 38 L12 30 L12 14 Z",
      },
      50: {
        stops: ["#38bdf8", "#0ea5e9"],
        path: "M24 6l6.18 12.52 13.82 2.01-10 9.77 2.36 13.7L24 36.8l-12.36 6.2 2.36-13.7-10-9.77 13.82-2.01z",
      },
      100: {
        stops: ["#818cf8", "#6366f1"],
        path: "M24 6 L42 24 L24 42 L6 24 Z",
      },
      500: {
        stops: ["#f472b6", "#ec4899"],
        path: "M24 6 C16 16 18 24 24 28 C18 30 16 34 18 40 C21 38 23 36 24 34 C25 36 27 38 30 40 C32 34 30 30 26 28 C32 24 34 16 24 6 Z",
      },
      1000: {
        stops: ["#facc15", "#f97316"],
        path: "M10 34 L14 18 L20 28 L24 16 L28 28 L34 18 L38 34 Z",
      },
      default: {
        stops: ["#6366f1", "#0ea5e9"],
        path: "M24 8 A16 16 0 1 1 23.99 8 Z",
      },
    };

    const { stops, path } = iconMap[amount] || iconMap.default;
    const [start, end] = stops;

    return (
      <svg
        className="stripe-card-box__option-icon"
        viewBox="0 0 48 48"
        role="img"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={start} />
            <stop offset="100%" stopColor={end} />
          </linearGradient>
        </defs>
        <path
          d={path}
          fill={`url(#${gradientId})`}
          stroke="rgba(15,23,42,0.45)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <div className="stripe-card-box">
      <div className="stripe-card-box__header">
        <div>
          <h3>Secure Stripe Card Checkout</h3>
          <p>
            Choose a fixed Stripe package in EUR. The checkout processes a secure card payment for access to the{" "}
            <a
              href="https://edu.bits-ai.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="stripe-card-box__link"
            >
              BitSwapDEX AI Education Portal
            </a>
            , and the equivalent $BITS tokens are delivered to your wallet. Those tokens unlock the paid materials today and count toward your allocation when $BITS launches publicly.
          </p>
          <p className="stripe-card-box__disclaimer">
            Holding $BITS also enables advanced trader analytics via{" "}
            <a
              href="http://localhost:3000/mind-mirror"
              target="_blank"
              rel="noopener noreferrer"
              className="stripe-card-box__link"
            >
              Mind Mirror
            </a>
            , an AI utility that delivers psychological pattern recognition, neurometric profiling, trading behaviour analysis, and a personalised emotional baseline to support professional decision-making.
          </p>
          <p className="stripe-card-box__disclaimer">
            By completing this payment you acknowledge that you are acquiring digital access rights through $BITS utility tokens, not purchasing securities or investment contracts. Always verify your wallet address before confirming the payment.
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
            {renderAmountIcon(amount)}
            <span
              className={`stripe-card-box__option-amount stripe-card-box__option-amount--${amount}`}
            >
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
          <span className="stripe-summary__label">You Pay</span>
          <span className="stripe-summary__value">
            {formatCurrency(selectedAmountEUR, "EUR")} •{" "}
            {formatCurrency(usdValue, "USD")}
          </span>
        </div>
        <div className="stripe-card-box__summary-line">
          <span className="stripe-summary__label">Current $BITS price</span>
          <span className="stripe-summary__value stripe-summary__value--price">
            {formatCurrency(bitsPriceUSD, "USD", bitsPriceUSD < 1 ? 4 : 2)}
          </span>
        </div>
        <div className="stripe-card-box__summary-line">
          <span className="stripe-summary__label">You Receive</span>
          <span className="stripe-summary__value stripe-summary__value--bits">
            {estimatedBits.toLocaleString("en-US")} $BITS
          </span>
        </div>
      </div>
    </div>
  );
};

export default StripeAmountSelector;

