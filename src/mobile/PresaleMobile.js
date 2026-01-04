import React, { useState, useEffect, lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useWallet } from "../context/WalletContext";
import { trackTikTokEvent } from "../utils/tiktok";
import { useSelectedToken } from "../Presale/hooks/useSelectedToken";
import useTokenPrices from "../Presale/prices/useTokenPrices";
import { useCellManager } from "../context/CellManagerContext"; // ✅ Use Context instead of direct hook
import bitsLogo from "../assets/logo.png";
import StakingSummary from "../Staking/components/StakingSummary"; // ✅ Use Responsive Component
import RewardsHub from "../components/RewardsHub"; // ✅ Use Responsive Component
import PresaleCopilot from "../Presale/components/PresaleCopilot";
import "./Mobile.css";

// Lazy load mobile components
const PaymentSelectorMobile = lazy(() => import("./components/PaymentSelectorMobile"));
const StripeBoxMobile = lazy(() => import("./components/StripeBoxMobile"));
const CryptoBoxMobile = lazy(() => import("./components/CryptoBoxMobile"));

const MobileLoading = () => (
  <div className="mobile-loading">
    <div className="loading-spinner"></div>
    <p>Loading...</p>
  </div>
);

const PresaleMobile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { walletAddress } = useWallet();
  const {
    selectedToken,
    selectedChain,
    setSelectedToken,
    setSelectedChain,
  } = useSelectedToken();

  // ✅ Fetch Real Presale Data from Context (single source)
  const { currentPrice, roundNumber, soldBits, availableBits } = useCellManager();

  const { prices: tokenPrices } = useTokenPrices();
  const [amountPay, setAmountPay] = useState("");
  const [stripeFeedback, setStripeFeedback] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);

  // Calculate progress percentage safely
  const totalRoundSupply = (soldBits || 0) + (availableBits || 0);
  const progressPercent = totalRoundSupply > 0 ? ((soldBits || 0) / totalRoundSupply) * 100 : 0;

  // Detect wallet
  useEffect(() => {
    // 🛑 CRITICAL FIX: Removed automatic wallet detection on mount
    console.log("ℹ️ [PresaleMobile] Auto-detection disabled.");
  }, []);

  // Track TikTok event
  useEffect(() => {
    try {
      trackTikTokEvent('ViewContent', { content_type: 'product', content_name: 'BITS Token Presale' });
    } catch (_) {}
  }, []);

  // Check for Stripe success/cancel
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const paymentStatus = query.get("payment");
    const sessionId = query.get("session_id");

    if (paymentStatus === "stripe-success") {
      toast.success("Payment successful! Your BITS will be credited shortly.");
      setStripeFeedback("success");
      setSelectedChain("fiat");
      setSelectedToken("STRIPE");
    } else if (paymentStatus === "stripe-cancel") {
      toast.error("Payment cancelled. Please try again.");
      setStripeFeedback("cancel");
    }

    if (paymentStatus || sessionId) {
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate, setSelectedChain, setSelectedToken]);

  return (
    <div className="mobile-presale-wrapper">
      <PresaleCopilot selectedToken={selectedToken} selectedChain={selectedChain} />
      {/* Hero Section - REFACTORED GEMINI STYLE */}
      <section className="mobile-hero" style={{minHeight: 'auto', paddingBottom: '40px'}}>
        <div className="mobile-hero-content">
          <div className="mobile-logo-container" style={{marginBottom: '20px'}}>
            <div className="mobile-logo-glow"></div>
            <img src={bitsLogo} alt="BITS Logo" className="mobile-logo-image" />
          </div>
          
          <h1 className="mobile-title" style={{fontSize: '28px', marginBottom: '8px'}}>
            BitSwapDEX <span style={{color: '#14f195'}}>AI</span>
          </h1>
          
          <div style={{
            display: 'inline-block',
            padding: '6px 16px',
            background: 'rgba(20, 241, 149, 0.1)',
            border: '1px solid rgba(20, 241, 149, 0.3)',
            borderRadius: '20px',
            color: '#14f195',
            fontSize: '12px',
            fontWeight: 'bold',
            marginBottom: '30px',
            letterSpacing: '1px',
            boxShadow: '0 0 15px rgba(20, 241, 149, 0.2)'
          }}>
            ✨ NEXT-GEN AI DEX
          </div>

          {/* Dynamic Stats Grid */}
          <div className="mobile-presale-stats" style={{
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '15px',
            width: '100%',
            marginBottom: '25px'
          }}>
            {/* Price Card */}
            <div className="mobile-stat" style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              padding: '15px'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '8px'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14f195" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                  <line x1="7" y1="7" x2="7.01" y2="7"></line>
                </svg>
                <span className="mobile-stat-label" style={{fontSize: '11px', color: '#aaa'}}>CURRENT PRICE</span>
              </div>
              <div className="mobile-stat-value" style={{color: '#fff', fontSize: '22px', textShadow: '0 0 10px rgba(20, 241, 149, 0.5)'}}>
                ${currentPrice ? currentPrice : "0.001"}
              </div>
            </div>

            {/* Round Card */}
            <div className="mobile-stat" style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              padding: '15px'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '8px'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9945ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                </svg>
                <span className="mobile-stat-label" style={{fontSize: '11px', color: '#aaa'}}>STAGE</span>
              </div>
              <div className="mobile-stat-value" style={{color: '#fff', fontSize: '22px', textShadow: '0 0 10px rgba(153, 69, 255, 0.5)'}}>
                Round {roundNumber ? roundNumber : "1"}
              </div>
            </div>
          </div>

          {/* Live Progress Bar */}
          {totalRoundSupply > 0 && (
            <div style={{width: '100%', padding: '0 5px'}}>
               <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px'}}>
                  <span>Sold: {(soldBits/1000000).toFixed(2)}M</span>
                  <span style={{color: '#14f195'}}>Target: {(totalRoundSupply/1000000).toFixed(2)}M</span>
               </div>
               <div style={{
                 height: '6px',
                 width: '100%',
                 background: 'rgba(255,255,255,0.05)',
                 borderRadius: '10px',
                 overflow: 'hidden',
                 border: '1px solid rgba(255,255,255,0.1)'
               }}>
                 <div style={{
                   height: '100%',
                   width: `${progressPercent}%`,
                   background: 'linear-gradient(90deg, #14f195, #9945ff)',
                   borderRadius: '10px',
                   boxShadow: '0 0 10px rgba(20, 241, 149, 0.5)',
                   transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                 }} />
               </div>
            </div>
          )}

        </div>
      </section>

      {/* Stripe Success/Cancel Banner */}
      {stripeFeedback && (
        <div className={`mobile-feedback-banner mobile-feedback-${stripeFeedback}`}>
          {stripeFeedback === "success" ? (
            <>
              <span className="mobile-feedback-icon">✅</span>
              <span>Payment successful! BITS on the way.</span>
            </>
          ) : (
            <>
              <span className="mobile-feedback-icon">ℹ️</span>
              <span>Payment cancelled.</span>
            </>
          )}
        </div>
      )}

      {/* Payment Section Title - Only show if selecting method */}
      {!paymentMethod && (
        <div className="mobile-payment-option" style={{borderColor: 'rgba(20, 241, 149, 0.5)', background: 'rgba(20, 241, 149, 0.05)'}}>
          <svg className="mobile-section-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="buyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14f195" />
                <stop offset="100%" stopColor="#9945ff" />
              </linearGradient>
            </defs>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" fill="url(#buyGradient)"/>
          </svg>
          <h2 className="mobile-payment-title" style={{margin: 0, fontSize: '24px', fontWeight: 'bold', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
            Buy $BITS
          </h2>
        </div>
      )}
        
      <Suspense fallback={<MobileLoading />}>
        {!paymentMethod && (
          <PaymentSelectorMobile 
            onSelectMethod={setPaymentMethod}
          />
        )}

        {paymentMethod === 'stripe' && (
          <StripeBoxMobile 
            walletAddress={walletAddress}
            onBack={() => setPaymentMethod(null)}
          />
        )}

        {paymentMethod === 'crypto' && (
          <CryptoBoxMobile 
            selectedToken={selectedToken}
            selectedChain={selectedChain}
            setSelectedToken={setSelectedToken}
            setSelectedChain={setSelectedChain}
            amountPay={amountPay}
            setAmountPay={setAmountPay}
            tokenPrices={tokenPrices}
            walletAddress={walletAddress}
            onBack={() => setPaymentMethod(null)}
          />
        )}
      </Suspense>

      {/* Staking Section - Simplified Summary */}
      <div style={{marginTop: '30px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', paddingLeft: '10px'}}>
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14f195" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
             <h3 style={{margin: 0, fontSize: '16px', color: '#fff'}}>Staking Overview</h3>
          </div>
          <StakingSummary />
      </div>

      {/* Rewards Section - Responsive Hub */}
      <div style={{marginTop: '30px'}}>
        <h3 style={{color:'#fff', marginBottom:'15px', paddingLeft:'10px'}}>Rewards & Bonuses</h3>
        <RewardsHub />
      </div>
    </div>
  );
};

export default PresaleMobile;
