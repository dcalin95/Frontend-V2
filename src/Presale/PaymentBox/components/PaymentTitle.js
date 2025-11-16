import React from "react";

const PaymentTitle = ({ selectedTokenKey, selectedTokenLabel, selectedTokenIcon }) => {
  const isStripe = selectedTokenKey === "STRIPE";

  return (
    <h3 className="payment-title">
      <span className="token-flow">
        <img src={selectedTokenIcon} alt={selectedTokenLabel} className="token-title-icon" />
        <span className="arrow-text">→</span>
        <img src="/logo.png" alt="$BITS" className="token-title-icon" />
      </span>
      <span className="payment-title-text">
        Buy <strong>$BITS</strong>{" "}
        {isStripe ? (
          <span className="selected-token-title">via Stripe Secure Checkout</span>
        ) : (
          <>
            with <span className="selected-token-title">{selectedTokenLabel}</span>
          </>
        )}
      </span>
    </h3>
  );
};

export default PaymentTitle; 