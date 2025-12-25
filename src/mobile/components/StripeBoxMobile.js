import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import handleStripePaymentService from "../../Presale/TokenHandlers/handleStripePayment";
import PaymentTitleBridgeMobile from "./PaymentTitleBridgeMobile";

// ✅ PRESETS EXACT CA PE DESKTOP (10, 30, 50, 100, 500, 1000)
// Acestea sunt valori in EUR conform backend-ului Stripe
const STRIPE_PRESETS = [
  { amount: 10, label: "Entry", icon: "🌱" },
  { amount: 30, label: "Basic", icon: "🌿" },
  { amount: 50, label: "Starter", icon: "🚀" },
  { amount: 100, label: "Trader", icon: "⭐" },
  { amount: 500, label: "Pro", icon: "💎" },
  { amount: 1000, label: "Whale", icon: "🐋" },
];

const StripeBoxMobile = ({ walletAddress, onBack }) => {
  // State-ul principal este in EUR pentru ca asta cere Stripe Backend
  const [amountEUR, setAmountEUR] = useState(50);
  const [referralCode, setReferralCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [eurToUsdRate, setEurToUsdRate] = useState(1.08); // Fallback default rate

  // Încercăm să luăm rata de schimb reală, dar nu blocăm UI-ul dacă eșuează
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const response = await fetch("https://api.exchangerate-api.com/v4/latest/EUR");
        const data = await response.json();
        if (data && data.rates && data.rates.USD) {
          setEurToUsdRate(data.rates.USD);
        }
      } catch (e) {
        console.warn("Failed to fetch EUR rate, using fallback 1.08");
      }
    };
    fetchRate();
  }, []);
  
  const onBuyClick = async () => {
    if (!walletAddress) {
      toast.error("Please connect wallet first");
      return;
    }
    if (amountEUR < 10) {
      toast.error("Minimum is €10");
      return;
    }

    setIsLoading(true);
    try {
      // Calculăm USD real bazat pe rată
      const amountUSD = amountEUR * eurToUsdRate;
      
      // BITS calculation: 1 BITS = $0.001 (approx)
      // Backend-ul va face validarea finală
      const bitsToReceive = Math.floor(amountUSD / 0.001); 

      await handleStripePaymentService({
        amountUSD,
        amountEUR, // Trimitem EUR explicit
        bitsToReceive,
        walletAddress,
        referralCode,
        bonusAmount: 0,
        bonusPercentage: 0
      });
      
    } catch (err) {
      console.error("Stripe payment error:", err);
      toast.error(err.message || "Payment initialization failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Calcule pentru UI
  const amountUSD = amountEUR * eurToUsdRate;
  const estimatedBits = amountUSD / 0.001; 

  return (
    <>
      {/* Header */}
      <div style={{display: 'flex', alignItems: 'center', marginBottom: '20px'}}>
        <button 
          onClick={onBack}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '24px',
            padding: '0 10px 0 0',
            cursor: 'pointer'
          }}
        >
          ←
        </button>
        <h3 style={{
          margin: 0, 
          fontSize: '20px', 
          fontWeight: 'bold', 
          background: 'linear-gradient(135deg, #14f195, #00C2FF)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Pay with Card
        </h3>
      </div>

      {/* Custom Amount Input (EUR) */}
      <div className="mobile-payment-option" style={{
        background: 'linear-gradient(180deg, rgba(20, 241, 149, 0.05) 0%, rgba(20, 241, 149, 0.02) 100%)',
        border: '1px solid rgba(20, 241, 149, 0.3)',
        marginBottom: '20px'
      }}>
        <div className="mobile-payment-content" style={{flex: 1}}>
          <PaymentTitleBridgeMobile
            payTokenLabel="CARD"
            payTokenIconSrc={null}
          />
          <label className="mobile-payment-title" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: '#a5b4fc'}}>
            <span>Amount (EUR)</span>
            <span style={{fontSize: '12px', color: '#14f195'}}>Rate: 1 EUR ≈ ${eurToUsdRate.toFixed(2)}</span>
          </label>
          <div style={{position: 'relative'}}>
            <span style={{position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', fontSize: '20px', color: '#fff'}}>€</span>
            <input
              type="number"
              className="mobile-input"
              value={amountEUR}
              onChange={(e) => setAmountEUR(parseFloat(e.target.value) || 0)}
              style={{
                width: '100%', 
                fontSize: '24px', 
                padding: '15px 15px 15px 35px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(20, 241, 149, 0.2)',
                color: '#fff',
                borderRadius: '12px'
              }}
            />
          </div>
          <div style={{textAlign: 'right', marginTop: '5px', fontSize: '13px', color: '#aaa'}}>
            ≈ ${amountUSD.toFixed(2)} USD
          </div>
        </div>
      </div>

      {/* Packages Grid (EUR Presets) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '25px'
      }}>
        {STRIPE_PRESETS.map((preset) => {
          const isSelected = parseFloat(amountEUR) === preset.amount;
          return (
            <button
              key={preset.amount}
              onClick={() => setAmountEUR(preset.amount)}
              style={{
                background: isSelected ? `rgba(20, 241, 149, 0.1)` : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${isSelected ? '#14f195' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '16px',
                padding: '15px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? `0 0 15px rgba(20, 241, 149, 0.3)` : 'none'
              }}
            >
              <div style={{fontSize: '24px', marginBottom: '5px'}}>{preset.icon}</div>
              <div style={{fontWeight: 'bold', color: '#fff'}}>€{preset.amount}</div>
              <div style={{fontSize: '11px', color: '#14f195', opacity: 0.8}}>{preset.label}</div>
            </button>
          );
        })}
      </div>

      {/* Referral (Optional) */}
      <div style={{marginBottom: '20px'}}>
        <input
          type="text"
          className="mobile-input"
          placeholder="Referral Code (Optional)"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
          style={{
            width: '100%',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: '14px',
            padding: '12px',
            borderRadius: '12px',
            color: '#fff'
          }}
        />
      </div>

      {/* Summary & Action */}
      <div style={{
        padding: '15px',
        background: 'rgba(20, 241, 149, 0.05)',
        border: '1px solid rgba(20, 241, 149, 0.2)',
        borderRadius: '16px',
        textAlign: 'center'
      }}>
        <div style={{fontSize: '14px', color: '#a5b4fc', marginBottom: '5px'}}>You receive approx.</div>
        <div style={{fontSize: '24px', fontWeight: 'bold', color: '#fff', marginBottom: '15px'}}>
          {estimatedBits.toLocaleString(undefined, {maximumFractionDigits: 0})} $BITS
        </div>
        
        <button
          onClick={onBuyClick}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '16px',
            background: 'linear-gradient(90deg, #14f195, #00C2FF)',
            border: 'none',
            borderRadius: '12px',
            color: '#000',
            fontWeight: 'bold',
            fontSize: '18px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
            boxShadow: '0 4px 15px rgba(20, 241, 149, 0.4)'
          }}
        >
          {isLoading ? "Processing..." : `Pay €${amountEUR}`}
        </button>
      </div>

      {!walletAddress && (
        <div style={{marginTop: '15px', textAlign: 'center', color: '#ff9800', fontSize: '13px'}}>
          ⚠️ Connect wallet to receive tokens
        </div>
      )}
    </>
  );
};

export default StripeBoxMobile;
