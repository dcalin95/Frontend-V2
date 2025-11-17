import React, { useState } from "react";
import { toast } from "react-toastify";
import usePaymentState from "../../Presale/PaymentBox/hooks/usePaymentState";
import useHandleTransaction from "../../Presale/PaymentBox/useHandleTransaction";
import { tokenList } from "../../Presale/TokenHandlers/tokenData";

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
  const [transactionHash, setTransactionHash] = useState(null);
  const [confirmedBits, setConfirmedBits] = useState(null);
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  // 🎯 USE DESKTOP LOGIC - usePaymentState hook
  const paymentState = usePaymentState({
    selectedToken,
    selectedChain,
    amountPay,
    setAmountPay,
    tokenPrices,
    pricesLoading: false,
  });

  // 🚀 USE DESKTOP LOGIC - useHandleTransaction hook
  const { handleBuy } = useHandleTransaction({
    selectedToken,
    selectedChain,
    amountPay: paymentState.safeAmountPay,
    pureBits: paymentState.pureBits,
    usdValue: paymentState.usdValue,
    pricePerBitsUSD: paymentState.pricePerBitsUSD,
    selectedTokenPrice: paymentState.selectedTokenPrice,
    walletAddress: paymentState.walletAddress,
    balances: paymentState.balances,
    availableBits: paymentState.availableBits,
    setTransactionHash,
    setConfirmedBits,
    setPopupVisible,
    setIsConfirmed,
    bonusAmount: paymentState.bonusAmount,
    selectedPaymentMethod: null,
    referralCode: referralCode,
    stripeAmountEUR: undefined,
  });

  const handleBuyClick = async () => {
    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!amountPay || amountPay <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Minimum amount check ($10 USD)
    if (paymentState.usdValue < 10) {
      toast.error("Minimum purchase is $10 USD");
      return;
    }

    if (paymentState.pureBits <= 0) {
      toast.error("Amount too small to receive BITS");
      return;
    }

    // Balance check (unless it's a fiat payment)
    const isFiatToken = ['NOWPAY', 'MOONPAY', 'TRANSAK', 'STRIPE'].includes(selectedToken);
    if (!isFiatToken && paymentState.balances[selectedToken] < amountPay) {
      toast.error(`Insufficient ${selectedToken} balance`);
      return;
    }

    try {
      await handleBuy();
      toast.success(`🎉 Payment successful!`);
      setAmountPay(0);
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(`Payment failed: ${error.message}`);
    }
  };

  const tokenPrice = tokenPrices[selectedToken] || 1;
  const usdValue = paymentState.usdValue || 0;
  const bitsToReceive = paymentState.pureBits || 0;
  const bonusAmount = paymentState.bonusAmount || 0;
  const totalBits = bitsToReceive + bonusAmount;

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
        {paymentState.balances[selectedToken] > 0 && (
          <div className="mobile-balance-info">
            Balance: {paymentState.balances[selectedToken].toFixed(4)} {selectedToken}
          </div>
        )}
      </div>

      {/* Referral Code Input */}
      <div className="mobile-input-section">
        <label className="mobile-input-label">
          🎯 Referral Code (Optional)
        </label>
        <input
          type="text"
          className="mobile-input"
          placeholder="CODE-XXXXX"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
          maxLength={20}
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
              ${paymentState.pricePerBitsUSD < 1 ? paymentState.pricePerBitsUSD.toFixed(4) : paymentState.pricePerBitsUSD.toFixed(2)}
            </span>
          </div>
          <div className="mobile-summary-row">
            <span>Base $BITS:</span>
            <span className="mobile-summary-value">
              {bitsToReceive.toLocaleString()} $BITS
            </span>
          </div>
          {bonusAmount > 0 && (
            <div className="mobile-summary-row mobile-summary-bonus">
              <span>Bonus:</span>
              <span className="mobile-summary-value">
                +{bonusAmount.toLocaleString()} $BITS
              </span>
            </div>
          )}
          <div className="mobile-summary-row mobile-summary-highlight">
            <span>Total Receive:</span>
            <span className="mobile-summary-value">
              {totalBits.toLocaleString()} $BITS
            </span>
          </div>
        </div>
      )}

      {/* Buy Button */}
      <button
        className="mobile-buy-btn"
        onClick={handleBuyClick}
        disabled={!paymentState.canProceed || paymentState.isLoading}
      >
        {paymentState.isLoading ? "Processing..." : `Buy ${totalBits.toLocaleString()} $BITS`}
      </button>

      {/* Error/Warning Messages */}
      {!walletAddress && (
        <div className="mobile-wallet-warning">
          ⚠️ Please connect your wallet to continue
        </div>
      )}
      {usdValue > 0 && usdValue < 10 && (
        <div className="mobile-wallet-warning">
          ⚠️ Minimum purchase is $10 USD
        </div>
      )}
      {paymentState.transactionError && (
        <div className="mobile-wallet-warning">
          ❌ {paymentState.transactionError}
        </div>
      )}
    </div>
  );
};

export default CryptoBoxMobile;
