import React from "react";

const PaymentTitle = ({ selectedToken, selectedTokenIcon }) => {
  return (
    <h3 className="payment-title">
      <span className="token-flow">
        <img src={selectedTokenIcon} alt={selectedToken} className="token-title-icon" />
        <span className="arrow-text">→</span>
        <img src="/logo.png" alt="$BITS" className="token-title-icon" />
      </span>
      <span className="payment-title-text">
        Buy <strong>$BITS</strong> with <span className="selected-token-title">{selectedToken}</span>
      </span>
    </h3>
  );
};

export default PaymentTitle; 