import React from "react";

const PaymentLoading = ({ isLoading, transactionStep, isProcessingTransaction }) => {
  if (!isLoading && !isProcessingTransaction) return null;

  const getLoadingMessage = () => {
    if (isProcessingTransaction && transactionStep) {
      return transactionStep;
    }
    return "🔄 Loading payment data...";
  };

  return (
    <div className="payment-loading">
      <div className="loading-spinner"></div>
      <div className="loading-text">{getLoadingMessage()}</div>
    </div>
  );
};

export default PaymentLoading; 