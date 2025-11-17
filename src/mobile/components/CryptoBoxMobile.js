import React, { useState } from "react";
import { toast } from "react-toastify";
import useCellManagerData from "../../Presale/hooks/useCellManagerData";
import { handlePayment } from "../../Presale/TokenHandlers/TokenHandlerManager";

const CRYPTO_TOKENS = [
  { key: "ETH", name: "Ethereum", icon: "Ξ", color: "#627eea" },
  { key: "BNB", name: "BNB Smart Chain", icon: "B", color: "#f3ba2f" },
  { key: "USDT", name: "Tether USD", icon: "₮", color: "#26a17b" },
  { key: "USDC", name: "USD Coin", icon: "$", color: "#2775ca" },
  { key: "MATIC", name: "Polygon", icon: "◆", color: "#8247e5" },
  { key: "SOL", name: "Solana", icon: "◎", color: "#14f195" },
  { key: "STX", name: "Stacks (Bitcoin L2)", icon: "₿", color: "#f7931a" },
];

const CryptoBoxMobile = ({
  selectedToken,
  selectedChain,
  setSelectedToken,
  setSelectedChain,
  amountPay,
  setAmountPay,
  tokenPrices,
  walletAddress,
  onBack,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { liveBitsPrice } = useCellManagerData(walletAddress);

  const bitsPriceUSD = liveBitsPrice && liveBitsPrice > 0 ? liveBitsPrice : 0.001;
  const tokenPrice = tokenPrices[selectedToken] || 1;
  const usdValue = amountPay * tokenPrice;
  const bitsToReceive = usdValue > 0 ? Math.floor(usdValue / bitsPriceUSD) : 0;

  const handleBuy = async () => {
    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!amountPay || amountPay <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (bitsToReceive <= 0) {
      toast.error("Amount too small to receive BITS");
      return;
    }

    setIsProcessing(true);

    try {
      const paymentHandler = handlePayment(selectedToken);

      const result = await paymentHandler({
        amount: amountPay,
        bitsToReceive: bitsToReceive,
        walletAddress: walletAddress,
        selectedChain: selectedChain,
        usdInvested: usdValue,
        bonusAmount: 0,
        bonusPercentage: 0,
        fallbackBitsPrice: bitsPriceUSD,
        referralCode: "",
      });

      if (result) {
        toast.success(`🎉 Payment successful! TX: ${result.slice(0, 10)}...`);
        setAmountPay(0);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(`Payment failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mobile-crypto-box">
      <button className="mobile-back-btn" onClick={onBack}>
        ← Back
      </button>

      <h3 className="mobile-box-title">Pay with Crypto</h3>
      <p className="mobile-box-desc">
        Select your preferred cryptocurrency
      </p>

      {/* Token Selector */}
      <div className="mobile-token-selector">
        {CRYPTO_TOKENS.map((token) => {
          const isSelected = selectedToken === token.key;
          const price = tokenPrices[token.key] || 0;

          return (
            <button
              key={token.key}
              className={`mobile-token-option ${isSelected ? 'mobile-token-selected' : ''}`}
              onClick={() => {
                setSelectedToken(token.key);
                // Set correct chain based on token
                if (token.key === "BNB") {
                  setSelectedChain("bsc");
                } else if (token.key === "SOL") {
                  setSelectedChain("solana");
                } else if (token.key === "STX") {
                  setSelectedChain("stacks");
                } else if (token.key === "MATIC") {
                  setSelectedChain("polygon");
                } else {
                  setSelectedChain("eth");
                }
              }}
              style={{ borderColor: isSelected ? token.color : 'transparent' }}
            >
              <div className="mobile-token-icon" style={{ color: token.color }}>
                {token.icon}
              </div>
              <div className="mobile-token-content">
                <div className="mobile-token-name">{token.name}</div>
                <div className="mobile-token-price">
                  ${price > 0 ? price.toFixed(2) : "..."}
                </div>
              </div>
              {isSelected && (
                <div className="mobile-token-check" style={{ backgroundColor: token.color }}>
                  ✓
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Amount Input */}
      <div className="mobile-input-section">
        <label className="mobile-input-label">
          Amount ({selectedToken})
        </label>
        <input
          type="number"
          className="mobile-input"
          placeholder="0.00"
          value={amountPay || ""}
          onChange={(e) => setAmountPay(parseFloat(e.target.value) || 0)}
          min="0"
          step="0.01"
        />
      </div>

      {/* Summary */}
      {amountPay > 0 && (
        <div className="mobile-crypto-summary">
          <div className="mobile-summary-row">
            <span>USD Value:</span>
            <span className="mobile-summary-value">
              ${usdValue.toFixed(2)}
            </span>
          </div>
          <div className="mobile-summary-row">
            <span>$BITS Price:</span>
            <span className="mobile-summary-value">
              ${bitsPriceUSD < 1 ? bitsPriceUSD.toFixed(4) : bitsPriceUSD.toFixed(2)}
            </span>
          </div>
          <div className="mobile-summary-row mobile-summary-highlight">
            <span>You Receive:</span>
            <span className="mobile-summary-value">
              {bitsToReceive.toLocaleString()} $BITS
            </span>
          </div>
        </div>
      )}

      {/* Buy Button */}
      <button
        className="mobile-buy-btn"
        onClick={handleBuy}
        disabled={!walletAddress || !amountPay || isProcessing || bitsToReceive <= 0}
      >
        {isProcessing ? "Processing..." : `Buy ${bitsToReceive.toLocaleString()} $BITS`}
      </button>

      {!walletAddress && (
        <div className="mobile-wallet-warning">
          ⚠️ Please connect your wallet to continue
        </div>
      )}
    </div>
  );
};

export default CryptoBoxMobile;
