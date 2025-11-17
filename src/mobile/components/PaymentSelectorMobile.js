import React from "react";

const PaymentSelectorMobile = ({ onSelectMethod }) => {
  return (
    <div className="mobile-payment-selector">
      <button
        className="mobile-payment-option mobile-payment-card"
        onClick={() => onSelectMethod('stripe')}
      >
        <div className="mobile-payment-icon">💳</div>
        <div className="mobile-payment-content">
          <h3>Pay with Card</h3>
          <p>Credit/Debit • Instant</p>
        </div>
      </button>

      <button
        className="mobile-payment-option mobile-payment-crypto"
        onClick={() => onSelectMethod('crypto')}
      >
        <div className="mobile-payment-icon">₿</div>
        <div className="mobile-payment-content">
          <h3>Pay with Crypto</h3>
          <p>ETH, BNB, USDT, SOL & more</p>
        </div>
      </button>
    </div>
  );
};

export default PaymentSelectorMobile;

