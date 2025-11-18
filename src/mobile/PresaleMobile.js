import React, { useState, useEffect, lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useGoogleAnalytics from "../hooks/useGoogleAnalytics";
import { trackTikTokEvent } from "../utils/tiktok";
import { useSelectedToken } from "../Presale/hooks/useSelectedToken";
import useTokenPrices from "../Presale/prices/useTokenPrices";
import bitsLogo from "../assets/logo.png";
import "./Mobile.css";

// Lazy load mobile components
const PaymentSelectorMobile = lazy(() => import("./components/PaymentSelectorMobile"));
const StripeBoxMobile = lazy(() => import("./components/StripeBoxMobile"));
const CryptoBoxMobile = lazy(() => import("./components/CryptoBoxMobile"));
const StakingMobile = lazy(() => import("./components/StakingMobile"));
const RewardsMobile = lazy(() => import("./components/RewardsMobile"));

const MobileLoading = () => (
  <div className="mobile-loading">
    <div className="loading-spinner"></div>
    <p>Loading...</p>
  </div>
);

const PresaleMobile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { trackPresaleEvent } = useGoogleAnalytics();
  const {
    selectedToken,
    selectedChain,
    setSelectedToken,
    setSelectedChain,
  } = useSelectedToken();

  const { prices: tokenPrices } = useTokenPrices();
  const [amountPay, setAmountPay] = useState(0);
  const [walletAddress, setWalletAddress] = useState(null);
  const [stripeFeedback, setStripeFeedback] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);

  // Detect wallet
  useEffect(() => {
    const detectWallet = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
          }
        } catch (err) {
          console.warn("Wallet not connected");
        }
      }
    };
    detectWallet();
  }, []);

  // Track TikTok event
  useEffect(() => {
    try {
      trackTikTokEvent('ViewContent', { content_type: 'presale_page_mobile' });
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
      {/* Hero Section */}
      <section className="mobile-hero">
        <div className="mobile-hero-content">
          <div className="mobile-logo-container">
            <div className="mobile-logo-glow"></div>
            <img src={bitsLogo} alt="BITS Logo" className="mobile-logo-image" />
          </div>
          <h1 className="mobile-title">AI-Powered Crypto Presale</h1>
          <p className="mobile-subtitle">
            Join the future of decentralized AI trading
          </p>
          <div className="mobile-presale-stats">
            <div className="mobile-stat">
              <span className="mobile-stat-label">Price</span>
              <span className="mobile-stat-value">$0.001</span>
            </div>
            <div className="mobile-stat">
              <span className="mobile-stat-label">Round</span>
              <span className="mobile-stat-value">1</span>
            </div>
          </div>
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

      {/* Payment Section Title */}
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

      {/* Staking Section Title */}
      <div className="mobile-payment-option" style={{borderColor: 'rgba(20, 241, 149, 0.5)', background: 'rgba(20, 241, 149, 0.05)', marginTop: '30px'}}>
        <svg className="mobile-section-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="stakeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14f195" />
              <stop offset="100%" stopColor="#9945ff" />
            </linearGradient>
          </defs>
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="url(#stakeGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h2 className="mobile-payment-title" style={{margin: 0, fontSize: '24px', fontWeight: 'bold', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
          Stake & Earn
        </h2>
      </div>
      <Suspense fallback={<MobileLoading />}>
        <StakingMobile walletAddress={walletAddress} />
      </Suspense>

      {/* Rewards Section Title */}
      <div className="mobile-payment-option" style={{borderColor: 'rgba(249, 115, 22, 0.5)', background: 'rgba(249, 115, 22, 0.05)', marginTop: '30px'}}>
        <svg className="mobile-section-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="rewardsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="url(#rewardsGradient)" stroke="url(#rewardsGradient)" strokeWidth="1"/>
        </svg>
        <h2 className="mobile-payment-title" style={{margin: 0, fontSize: '24px', fontWeight: 'bold', background: 'linear-gradient(135deg, #facc15, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
          Referral Rewards
        </h2>
      </div>
      <Suspense fallback={<MobileLoading />}>
        <RewardsMobile walletAddress={walletAddress} />
      </Suspense>
    </div>
  );
};

export default PresaleMobile;

