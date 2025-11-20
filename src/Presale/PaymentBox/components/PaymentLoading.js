import React, { useState, useEffect } from "react";

const PaymentLoading = ({ isLoading, transactionStep, isProcessingTransaction }) => {
  const [aiMessage, setAiMessage] = useState("AI analyzing blockchain...");

  useEffect(() => {
    if (!isLoading && !isProcessingTransaction) return;

    const messages = [
      "🤖 AI analyzing blockchain...",
      "⚡ Quantum processing...",
      "🌐 Syncing with BitSwapDEX...",
      "💎 Loading neural network...",
      "🔮 Calculating optimal routes...",
      "🚀 Preparing transaction...",
    ];

    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setAiMessage(messages[index]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isLoading, isProcessingTransaction]);

  if (!isLoading && !isProcessingTransaction) return null;

  const getLoadingMessage = () => {
    if (isProcessingTransaction && transactionStep) {
      return transactionStep;
    }
    return aiMessage;
  };

  return (
    <div className="payment-loading">
      <div className="loading-spinner"></div>
      <div className="loading-text">{getLoadingMessage()}</div>
    </div>
  );
};

export default PaymentLoading; 