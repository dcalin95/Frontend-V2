import React, { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import useCellManagerData from "../../Presale/hooks/useCellManagerData";

const STRIPE_PRESETS = [
  { amount: 10, icon: "💎", color: "#14f195", name: "Starter" },
  { amount: 30, icon: "🚀", color: "#9945ff", name: "Builder" },
  { amount: 50, icon: "⚡", color: "#3b82f6", name: "Pro" },
  { amount: 100, icon: "🔥", color: "#ef4444", name: "Advanced" },
  { amount: 500, icon: "👑", color: "#f59e0b", name: "Elite" },
  { amount: 1000, icon: "🏆", color: "#facc15", name: "Legend" },
];

const StripeBoxMobile = ({ walletAddress, onBack }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const { liveBitsPrice } = useCellManagerData(walletAddress);

  const bitsPriceUSD = liveBitsPrice && liveBitsPrice > 0 ? liveBitsPrice : 0.001;

  const handleStripeCheckout = async (amountEUR) => {
    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsProcessing(true);
    setSelectedAmount(amountEUR);

    try {
      const amountUSD = amountEUR; // Simplified conversion
      const bitsToReceive = Math.floor(amountUSD / bitsPriceUSD);

      const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
      const response = await axios.post(`${backendUrl}/api/stripe/create-checkout`, {
        amountEUR,
        amountUSD,
        bitsToReceive,
        walletAddress,
        bonusAmount: 0,
        bonusPercentage: 0,
        referralCode: "",
        successUrl: `${window.location.origin}/presale?payment=stripe-success&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/presale?payment=stripe-cancel`,
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Stripe checkout error:", error);
      toast.error(`Payment failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setSelectedAmount(null);
    }
  };

  return (
    <div className="mobile-stripe-box">
      <button className="mobile-back-btn" onClick={onBack}>
        ← Back
      </button>

      <h3 className="mobile-box-title">Select Package</h3>
      <p className="mobile-box-desc">
        Choose your investment amount
      </p>

      <div className="mobile-stripe-packages">
        {STRIPE_PRESETS.map((preset) => {
          const bitsReceived = Math.floor(preset.amount / bitsPriceUSD);
          const isSelected = selectedAmount === preset.amount;

          return (
            <button
              key={preset.amount}
              className={`mobile-stripe-package ${isSelected ? 'mobile-stripe-selected' : ''}`}
              onClick={() => handleStripeCheckout(preset.amount)}
              disabled={isProcessing}
              style={{
                borderColor: isSelected ? preset.color : 'transparent',
              }}
            >
              <div className="mobile-package-icon" style={{ color: preset.color }}>
                {preset.icon}
              </div>
              <div className="mobile-package-content">
                <div className="mobile-package-name">{preset.name}</div>
                <div className="mobile-package-amount">€{preset.amount}</div>
                <div className="mobile-package-bits">
                  {bitsReceived.toLocaleString()} $BITS
                </div>
              </div>
              {isProcessing && isSelected && (
                <div className="mobile-package-loading">⏳</div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mobile-stripe-info">
        <div className="mobile-info-row">
          <span>Current $BITS price:</span>
          <span className="mobile-info-value">
            ${bitsPriceUSD < 1 ? bitsPriceUSD.toFixed(4) : bitsPriceUSD.toFixed(2)}
          </span>
        </div>
        <div className="mobile-info-disclaimer">
          <p>
            <strong>Educational Portal Access:</strong> $BITS tokens grant you access to the{" "}
            <a href="https://edu.bits-ai.io/" target="_blank" rel="noopener noreferrer">
              BitSwapDEX AI Education Portal
            </a>
            {" "}and the{" "}
            <a href="/mind-mirror" target="_blank" rel="noopener noreferrer">
              Mind Mirror AI Utility
            </a>
            , an advanced psychological profiling tool for traders.
          </p>
        </div>
      </div>

      {!walletAddress && (
        <div className="mobile-wallet-warning">
          ⚠️ Please connect your wallet to continue
        </div>
      )}
    </div>
  );
};

export default StripeBoxMobile;

