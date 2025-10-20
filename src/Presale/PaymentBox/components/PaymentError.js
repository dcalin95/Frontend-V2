import React from "react";

const PaymentError = ({ error, onRetry }) => {
  if (!error) return null;

  return (
    <div className="payment-error">
      <div className="error-icon">⚠️</div>
      <div className="error-content">
        <div className="error-title">Payment Error</div>
        <div className="error-message">{error}</div>
        {onRetry && (
          <button onClick={onRetry} className="error-retry-button">
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default PaymentError; 