import React from "react";

const PriceInfo = ({
  selectedTokenKey,
  selectedTokenLabel,
  selectedTokenIcon,
  bitsPriceUSD,
  selectedTokenPrice,
  bitsLoading,
  priceError,
}) => {
  const isStripe = selectedTokenKey === "STRIPE";

  return (
    <div className="price-info">
      <div className="price-line">
        <img src="/logo.png" alt="$BITS" className="token-title-icon" />
        <span className="bits-token">1 $BITS</span>
        <span className="price-value">
          {bitsLoading
            ? "🔄 Loading..."
            : bitsPriceUSD
            ? `≈ $${bitsPriceUSD.toFixed(3)}`
            : priceError
            ? `⚠️ ${priceError}`
            : "⚠️ Unavailable"}
        </span>
      </div>

      <div className="price-line">
        <img src={selectedTokenIcon} alt={selectedTokenLabel} className="token-title-icon" />
        <span className="selected-token">
          {isStripe ? selectedTokenLabel : `1 ${selectedTokenLabel}`}
        </span>
        <span className="price-value">
          {isStripe
            ? "Preset packages of €10 increments"
            : `≈ $${selectedTokenPrice.toFixed(3)}`}
        </span>
      </div>
    </div>
  );
};

export default PriceInfo; 