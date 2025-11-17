import React from "react";

const PaymentSelectorMobile = ({ onSelectMethod }) => {
  return (
    <div className="mobile-payment-selector">
      <button
        className="mobile-payment-option mobile-payment-card"
        onClick={() => onSelectMethod('stripe')}
      >
        <div className="mobile-payment-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14f195" />
                <stop offset="100%" stopColor="#9945ff" />
              </linearGradient>
            </defs>
            <rect x="2" y="4" width="20" height="16" rx="2" stroke="url(#cardGradient)" strokeWidth="2" fill="none"/>
            <path d="M2 10H22" stroke="url(#cardGradient)" strokeWidth="2"/>
            <rect x="5" y="14" width="6" height="2" rx="1" fill="url(#cardGradient)"/>
            <rect x="13" y="14" width="4" height="2" rx="1" fill="url(#cardGradient)"/>
          </svg>
        </div>
        <div className="mobile-payment-content">
          <h3 className="mobile-payment-title">Pay with Card</h3>
          <p className="mobile-payment-desc">Credit/Debit • Instant</p>
        </div>
        <div className="mobile-payment-arrow">→</div>
      </button>

      <button
        className="mobile-payment-option mobile-payment-crypto"
        onClick={() => onSelectMethod('crypto')}
      >
        <div className="mobile-payment-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="cryptoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14f195" />
                <stop offset="100%" stopColor="#9945ff" />
              </linearGradient>
            </defs>
            <circle cx="12" cy="12" r="9" stroke="url(#cryptoGradient)" strokeWidth="2" fill="none"/>
            <path d="M12 6V18M9 9H13.5C14.328 9 15 9.672 15 10.5C15 11.328 14.328 12 13.5 12H9M9 12H14C14.828 12 15.5 12.672 15.5 13.5C15.5 14.328 14.828 15 14 15H9M9 9V15" stroke="url(#cryptoGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="mobile-payment-content">
          <h3 className="mobile-payment-title">Pay with Crypto</h3>
          <p className="mobile-payment-desc">ETH, BNB, USDT, SOL & more</p>
        </div>
        <div className="mobile-payment-arrow">→</div>
      </button>
    </div>
  );
};

export default PaymentSelectorMobile;
