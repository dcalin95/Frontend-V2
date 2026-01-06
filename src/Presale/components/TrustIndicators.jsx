import React from "react";
import "./TrustIndicators.css";

const TrustIndicators = () => {
  const indicators = [
    { icon: "✅", text: "Smart Contract Audited", tooltip: "Our smart contract has been audited for security" },
    { icon: "🔒", text: "Secure & Transparent", tooltip: "All transactions are transparent and secure on blockchain" },
    { icon: "⛓️", text: "Live on Blockchain", tooltip: "Real-time verification on Binance Smart Chain" },
    { icon: "💬", text: "24/7 Support", tooltip: "Get help anytime through our support channels" },
  ];

  return (
    <div className="trust-indicators">
      {indicators.map((indicator, index) => (
        <div key={index} className="trust-indicator-item" title={indicator.tooltip}>
          <span className="trust-indicator-icon">{indicator.icon}</span>
          <span className="trust-indicator-text">{indicator.text}</span>
        </div>
      ))}
    </div>
  );
};

export default TrustIndicators;

