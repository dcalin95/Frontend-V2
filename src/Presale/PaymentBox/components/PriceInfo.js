import React from "react";

const PriceInfo = ({ 
  selectedToken, 
  selectedTokenIcon, 
  pricePerBitsUSD, 
  selectedTokenPrice, 
  bitsLoading, 
  priceError 
}) => {
  return (
    <div className="price-info">
      <div className="price-line">
        <img src="/logo.png" alt="$BITS" className="token-title-icon" />
        <span className="bits-token">1 $BITS</span>
        <span className="price-value">
          {bitsLoading
            ? "🔄 Loading..."
            : pricePerBitsUSD
            ? `≈ $${pricePerBitsUSD.toFixed(3)}`
            : priceError
            ? `⚠️ ${priceError}`
            : "⚠️ Unavailable"}
        </span>
      </div>

      <div className="price-line">
        <img src={selectedTokenIcon} alt={selectedToken} className="token-title-icon" />
        <span className="selected-token">1 {selectedToken}</span>
        <span className="price-value">≈ ${selectedTokenPrice.toFixed(3)}</span>
      </div>
    </div>
  );
};

export default PriceInfo; 