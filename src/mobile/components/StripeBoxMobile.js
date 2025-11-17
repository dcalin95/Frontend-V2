import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import useCellManagerData from "../../Presale/hooks/useCellManagerData";
import { useBitsEstimate } from "../../Presale/hooks/useBitsEstimate";

const STRIPE_PRESETS = [
  { 
    amount: 10, 
    name: "Starter",
    gradient: "linear-gradient(135deg, #14f195 0%, #00d4aa 100%)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="url(#grad1)" stroke="currentColor" strokeWidth="1"/>
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14f195"/>
            <stop offset="100%" stopColor="#00d4aa"/>
          </linearGradient>
        </defs>
      </svg>
    )
  },
  { 
    amount: 30, 
    name: "Builder",
    gradient: "linear-gradient(135deg, #9945ff 0%, #7d2ae8 100%)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#grad2)" stroke="currentColor" strokeWidth="1"/>
        <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="url(#grad2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <defs>
          <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9945ff"/>
            <stop offset="100%" stopColor="#7d2ae8"/>
          </linearGradient>
        </defs>
      </svg>
    )
  },
  { 
    amount: 50, 
    name: "Pro",
    gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="url(#grad3)" stroke="currentColor" strokeWidth="1"/>
        <defs>
          <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6"/>
            <stop offset="100%" stopColor="#2563eb"/>
          </linearGradient>
        </defs>
      </svg>
    )
  },
  { 
    amount: 100, 
    name: "Advanced",
    gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C12 2 8 6 8 12C8 15.31 9.79 18.17 12 19.5C14.21 18.17 16 15.31 16 12C16 6 12 2 12 2Z" fill="url(#grad4)" stroke="currentColor" strokeWidth="1"/>
        <path d="M12 19.5C9.79 18.17 8 15.31 8 12H16C16 15.31 14.21 18.17 12 19.5Z" fill="url(#grad4)" opacity="0.5"/>
        <defs>
          <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444"/>
            <stop offset="100%" stopColor="#dc2626"/>
          </linearGradient>
        </defs>
      </svg>
    )
  },
  { 
    amount: 500, 
    name: "Elite",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L4 7V12C4 16.5 7.5 20.7 12 22C16.5 20.7 20 16.5 20 12V7L12 2Z" fill="url(#grad5)" stroke="currentColor" strokeWidth="1"/>
        <path d="M12 8V14M9 11L12 14L15 11" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <defs>
          <linearGradient id="grad5" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b"/>
            <stop offset="100%" stopColor="#d97706"/>
          </linearGradient>
        </defs>
      </svg>
    )
  },
  { 
    amount: 1000, 
    name: "Legend",
    gradient: "linear-gradient(135deg, #facc15 0%, #eab308 100%)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="url(#grad6)" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="12" cy="12" r="3" fill="#000" opacity="0.3"/>
        <defs>
          <linearGradient id="grad6" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#facc15"/>
            <stop offset="100%" stopColor="#eab308"/>
          </linearGradient>
        </defs>
      </svg>
    )
  },
];

const StripeBoxMobile = ({ walletAddress, onBack }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [referralCode, setReferralCode] = useState("");
  const [eurUsdRate, setEurUsdRate] = useState(1);
  const [isRateLoading, setIsRateLoading] = useState(false);
  
  const { liveBitsPrice } = useCellManagerData(walletAddress);
  const bitsPriceUSD = liveBitsPrice && liveBitsPrice > 0 ? liveBitsPrice : 0.001;

  // 🔍 Auto-detect referral code from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromURL = urlParams.get("ref");
    if (codeFromURL) {
      setReferralCode(codeFromURL);
    }
  }, []);

  // 💱 Fetch EUR to USD conversion rate
  useEffect(() => {
    let ignore = false;
    const fetchRate = async () => {
      setIsRateLoading(true);
      try {
        const response = await fetch(
          "https://api.exchangerate.host/latest?base=EUR&symbols=USD"
        );
        if (!response.ok) {
          throw new Error(`Rate fetch failed with ${response.status}`);
        }
        const json = await response.json();
        if (!ignore) {
          const rate = json?.rates?.USD || 1.08;
          setEurUsdRate(rate);
        }
      } catch (err) {
        console.error("⚠️ Failed to fetch EUR→USD rate:", err);
        if (!ignore) {
          setEurUsdRate(1.08); // Fallback rate
        }
      } finally {
        if (!ignore) setIsRateLoading(false);
      }
    };

    fetchRate();
    return () => {
      ignore = true;
    };
  }, []);

  const handleStripeCheckout = async (amountEUR) => {
    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsProcessing(true);
    setSelectedAmount(amountEUR);

    try {
      // 💱 Convert EUR to USD using real exchange rate
      const amountUSD = parseFloat((amountEUR * eurUsdRate).toFixed(2));
      
      // 🧮 Calculate BITS using desktop logic (with bonus)
      const pureBits = Math.floor(amountUSD / bitsPriceUSD);
      
      // 🎁 Calculate bonus (same as desktop)
      const bonusPercentage = amountUSD >= 1000 ? 20 : amountUSD >= 500 ? 15 : amountUSD >= 100 ? 10 : 5;
      const bonusAmount = Math.floor((pureBits * bonusPercentage) / 100);
      const totalBits = pureBits + bonusAmount;

      console.log("💳 [Stripe Mobile] Payment details:", {
        amountEUR,
        amountUSD,
        pureBits,
        bonusPercentage,
        bonusAmount,
        totalBits,
        referralCode,
        bitsPriceUSD
      });

      const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
      const response = await axios.post(`${backendUrl}/api/stripe/create-checkout`, {
        amountEUR,
        amountUSD,
        bitsToReceive: totalBits,
        walletAddress,
        bonusAmount,
        bonusPercentage,
        referralCode: referralCode || "",
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

      <h3 className="mobile-box-title">
        <svg className="mobile-title-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 4H3C2.46957 4 1.96086 4.21071 1.58579 4.58579C1.21071 4.96086 1 5.46957 1 6V18C1 18.5304 1.21071 19.0391 1.58579 19.4142C1.96086 19.7893 2.46957 20 3 20H21C21.5304 20 22.0391 19.7893 22.4142 19.4142C22.7893 19.0391 23 18.5304 23 18V6C23 5.46957 22.7893 4.96086 22.4142 4.58579C22.0391 4.21071 21.5304 4 21 4ZM3 18V6H21V18H3Z" fill="url(#cardGrad)"/>
          <path d="M1 10H23" stroke="url(#cardGrad)" strokeWidth="2"/>
          <defs>
            <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14f195"/>
              <stop offset="100%" stopColor="#9945ff"/>
            </linearGradient>
          </defs>
        </svg>
        Select Package
      </h3>
      <p className="mobile-box-desc">
        Choose your investment • Instant delivery
      </p>

      {/* Referral Code Input */}
      <div className="mobile-input-section mobile-referral-section">
        <label className="mobile-input-label">
          <svg className="mobile-label-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H6C4.93913 15 3.92172 15.4214 3.17157 16.1716C2.42143 16.9217 2 17.9391 2 19V21M22 21V19C21.9993 18.1137 21.7044 17.2528 21.1614 16.5523C20.6184 15.8519 19.8581 15.3516 19 15.13M16 3.13C16.8604 3.3503 17.623 3.8507 18.1676 4.55231C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Referral Code (Optional)
        </label>
        <input
          type="text"
          className="mobile-input"
          placeholder="CODE-XXXXX"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
          maxLength={20}
        />
        {referralCode && (
          <div className="mobile-referral-active">
            ✅ Referral code active: <strong>{referralCode}</strong>
          </div>
        )}
      </div>

      <div className="mobile-stripe-packages">
        {STRIPE_PRESETS.map((preset) => {
          const amountUSD = parseFloat((preset.amount * eurUsdRate).toFixed(2));
          const pureBits = Math.floor(amountUSD / bitsPriceUSD);
          const bonusPercentage = amountUSD >= 1000 ? 20 : amountUSD >= 500 ? 15 : amountUSD >= 100 ? 10 : 5;
          const bonusAmount = Math.floor((pureBits * bonusPercentage) / 100);
          const totalBits = pureBits + bonusAmount;
          const isSelected = selectedAmount === preset.amount;

          return (
            <button
              key={preset.amount}
              className={`mobile-stripe-package ${isSelected ? 'mobile-stripe-selected' : ''}`}
              onClick={() => handleStripeCheckout(preset.amount)}
              disabled={isProcessing}
              style={{
                background: isSelected ? preset.gradient : 'var(--card-bg)',
                borderColor: isSelected ? 'transparent' : 'var(--border-color)',
              }}
            >
              <div className="mobile-package-icon-wrapper" style={{ background: preset.gradient }}>
                {preset.icon}
              </div>
              <div className="mobile-package-content">
                <div className="mobile-package-name">{preset.name}</div>
                <div className="mobile-package-amount">€{preset.amount}</div>
                <div className="mobile-package-bits">
                  {totalBits.toLocaleString()} $BITS
                </div>
                {bonusAmount > 0 && (
                  <div className="mobile-package-bonus">
                    +{bonusPercentage}% Bonus
                  </div>
                )}
              </div>
              {isProcessing && isSelected && (
                <div className="mobile-package-loading">
                  <svg className="mobile-spinner" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="31.415 31.415" />
                  </svg>
                </div>
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
        <div className="mobile-info-row">
          <span>EUR → USD rate:</span>
          <span className="mobile-info-value">
            {isRateLoading ? "Loading..." : `${eurUsdRate.toFixed(4)}`}
          </span>
        </div>
        <div className="mobile-info-disclaimer">
          <p>
            <strong>🎓 Educational Access:</strong> $BITS grants access to{" "}
            <a href="https://edu.bits-ai.io/" target="_blank" rel="noopener noreferrer">
              BitSwapDEX AI Education
            </a>
            {" "}and{" "}
            <a href="/mind-mirror" target="_blank" rel="noopener noreferrer">
              Mind Mirror AI
            </a>
            .
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
