import React from "react";

/**
 * Mobile title for the Buy box: YOU PAY (token) → YOU RECEIVE ($BITS)
 * Kept intentionally lightweight (no extra wrappers/capsules).
 */
const PaymentTitleBridgeMobile = ({
  payLabel = "YOU PAY",
  payTokenLabel,
  payTokenIconSrc,
  receiveLabel = "YOU RECEIVE",
  receiveTokenLabel = "$BITS",
  receiveTokenIconSrc = "/logo.png",
}) => {
  return (
    <div className="mobile-buy-title" aria-label="Payment flow">
      <div className="mobile-buy-side">
        <div className="mobile-buy-side-label">{payLabel}</div>
        {payTokenIconSrc ? (
          <img
            className="mobile-buy-token-icon"
            src={payTokenIconSrc}
            alt={payTokenLabel || "Token"}
          />
        ) : (
          <div className="mobile-buy-token-icon mobile-buy-token-icon--fallback" aria-hidden>
            💳
          </div>
        )}
        <div className="mobile-buy-token-text" title={payTokenLabel}>
          {payTokenLabel}
        </div>
      </div>

      <div className="mobile-buy-arrow" aria-hidden="true">→</div>

      <div className="mobile-buy-side">
        <div className="mobile-buy-side-label">{receiveLabel}</div>
        <img
          className="mobile-buy-token-icon"
          src={receiveTokenIconSrc}
          alt={receiveTokenLabel}
        />
        <div className="mobile-buy-token-text" title={receiveTokenLabel}>
          {receiveTokenLabel}
        </div>
      </div>
    </div>
  );
};

export default PaymentTitleBridgeMobile;


