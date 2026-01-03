// CSS imports - Must be first
import "./PresalePage.desktop.css";
import "./PresalePage.mobile.css";
import "./CrystalClear.css"; // 💎 Crystal clear text everywhere
import "./PaymentBox/PaymentBox.desktop.css";
import "./PaymentBox/PaymentBox.mobile.css";
import "./PaymentBox/InputBox.css";
import "./PaymentBox/PaymentSummary.css";

import React, { useState, useEffect, Suspense, lazy, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useGoogleAnalytics from "../hooks/useGoogleAnalytics";
import { trackTikTokEvent } from "../utils/tiktok";
import SelectPaymentMethod from "./SelectPaymentMethod";
import { useSelectedToken } from "./hooks/useSelectedToken";
import useTokenPrices from "./prices/useTokenPrices";
import { useWallet } from "../context/WalletContext";
import AdjustFontButton from "../components/AdjustFontButton";
import RecentBTCFeed from "./BITSAnalytics/RecentBTCFeed";
import RecentStacksFeed from "./BITSAnalytics/RecentStacksFeed";
import PresaleCopilot from "./components/PresaleCopilot";

// Lazy loaded components for better performance
const PaymentBox = lazy(() => import("./PaymentBox/PaymentBox"));
const PresaleDashboard = lazy(() => import("./Timer/PresaleDashboard"));
const ReferralRewardBox = lazy(() => import("./Rewards/ReferralRewardBox"));
const BITSAnalytics = lazy(() => import("./BITSAnalytics/BITSAnalytics"));

// Loading component for Presale
const PresaleLoading = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    fontSize: '1rem',
    color: '#fff',
    background: 'rgba(0,0,0,0.1)',
    borderRadius: '10px'
  }}>
    Loading component...
  </div>
);

const PresalePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { trackPresaleEvent, trackPageView } = useGoogleAnalytics();
  const { walletAddress } = useWallet();
  const {
    selectedToken,
    selectedChain,
    setSelectedToken,
    setSelectedChain,
  } = useSelectedToken();

  const { prices: tokenPrices } = useTokenPrices();
  const [amountPay, setAmountPay] = useState(0);
  const [showTikTokDebug, setShowTikTokDebug] = useState(false);
  const [stripeFeedback, setStripeFeedback] = useState(null);
  const [particleCount, setParticleCount] = useState(40);
  const [showParticles, setShowParticles] = useState(false); // 🎨 Toggle particles
  const [darkMode, setDarkMode] = useState(true); // 🌑 Dark mode - Apple Super Dark

  useEffect(() => {
    // 🛑 CRITICAL FIX: Removed automatic wallet detection on mount
    // This prevents TrustWallet/MetaMask/Phantom from showing as connected automatically
    // The user must now MANUALLY connect via the UI
    console.log("ℹ️ [PresalePage] Auto-detection disabled. Waiting for manual connection.");
  }, []);

  // 🔎 TikTok ViewContent (non-sensibil): doar semnal că utilizatorul a vizitat Presale
  useEffect(() => {
    try {
      trackTikTokEvent('ViewContent', { content_type: 'presale_page' });
    } catch (_) {}
  }, []);

  // ⏱️ TikTok Time-Based Engagement Tracking - 3 Nivele (45s, 90s, 150s)
  useEffect(() => {
    const startTime = Date.now();
    let tracked45 = false;
    let tracked90 = false;
    let tracked150 = false;

    const timer45 = setTimeout(() => {
      if (!tracked45) {
        try {
          trackTikTokEvent('Quick_Visitor', { 
            page: 'presale',
            time_spent_seconds: 45,
            content_type: 'presale_engagement'
          });
          tracked45 = true;
          console.log('✅ [TikTok] Quick_Visitor (45s) tracked');
        } catch (_) {}
      }
    }, 45000); // 45 secunde

    const timer90 = setTimeout(() => {
      if (!tracked90) {
        try {
          trackTikTokEvent('Engaged_User', { 
            page: 'presale',
            time_spent_seconds: 90,
            content_type: 'presale_engagement',
            value: 1 // Valoare symbolică pentru optimizare CPA
          });
          tracked90 = true;
          console.log('🎯 [TikTok] Engaged_User (90s) tracked - CPA CONVERSION!');
        } catch (_) {}
      }
    }, 90000); // 90 secunde

    const timer150 = setTimeout(() => {
      if (!tracked150) {
        try {
          trackTikTokEvent('Hot_Lead', { 
            page: 'presale',
            time_spent_seconds: 150,
            content_type: 'presale_engagement',
            value: 3 // Valoare mai mare pentru lead-uri hot
          });
          tracked150 = true;
          console.log('💎 [TikTok] Hot_Lead (150s) tracked - HIGH INTENT!');
        } catch (_) {}
      }
    }, 150000); // 150 secunde (2:30)

    // Cleanup: anulează timer-ele dacă utilizatorul părăsește pagina
    return () => {
      clearTimeout(timer45);
      clearTimeout(timer90);
      clearTimeout(timer150);
      
      // Track timpul total petrecut la exit (pentru analytics)
      const totalTime = Math.floor((Date.now() - startTime) / 1000);
      if (totalTime >= 10) {
        try {
          trackTikTokEvent('Page_Exit', {
            page: 'presale',
            total_time_seconds: totalTime
          });
        } catch (_) {}
      }
    };
  }, []);

  // 🧪 Dev-only badge pentru a confirma că pixelul este disponibil
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    try {
      const check = () => {
        if (typeof window !== 'undefined' && window.ttq && typeof window.ttq.track === 'function') {
          setShowTikTokDebug(true);
        }
      };
      check();
      const id = setTimeout(check, 1000);
      return () => clearTimeout(id);
    } catch {}
  }, []);

  // Auto-hide TikTok debug badge după 10s
  useEffect(() => {
    if (!showTikTokDebug) return;
    const hideId = setTimeout(() => setShowTikTokDebug(false), 10000);
    return () => clearTimeout(hideId);
  }, [showTikTokDebug]);

  useEffect(() => {
    const header = document.querySelector(".header");
    const handleScroll = () => {
      if (window.scrollY < 30) {
        header?.classList.add("transparent-header");
      } else {
        header?.classList.remove("transparent-header");
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    try {
      const isMobile = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 600px)').matches;
      setParticleCount(isMobile ? 22 : 40);
    } catch {}
  }, []);

  // 📊 Analytics: page view + presale view
  useEffect(() => {
    try {
      trackPageView('Presale', { section: 'presale' });
      trackPresaleEvent('view', {});
    } catch (_) {}
  }, [trackPageView, trackPresaleEvent]);

  // 🎨 Generate particles (ALWAYS called, React Hooks rule)
  const particlesJSX = useMemo(() => {
    const particles = Array.from({ length: particleCount }).map((_, i) => {
      const genDigits = () => {
        const modes = ['bin', 'dec', 'sym'];
        const mode = modes[Math.floor(Math.random() * modes.length)];
        if (mode === 'bin') {
          const len = 3 + Math.floor(Math.random() * 4); // 3-6 chars
          return Array.from({ length: len }, () => (Math.random() > 0.5 ? '1' : '0')).join('');
        }
        if (mode === 'dec') {
          const len = 2 + Math.floor(Math.random() * 3); // 2-4 digits
          let s = '';
          for (let k = 0; k < len; k++) s += Math.floor(Math.random() * 10).toString();
          return s;
        }
        return Math.random() < 0.6 ? '₿' : (Math.random() < 0.5 ? '101' : '2048');
      };
      const left = `${Math.random() * 100}vw`;
      const top = `${Math.random() * 100}vh`;
      const delay = `${Math.random() * 14}s`;
      const dur = `${16 + Math.random() * 12}s`; // 16–28s, slower
      const dx = `${20 + Math.random() * 50}vw`; // 20–70vw lateral drift
      return { key: i, text: genDigits(), left, top, delay, dur, dx };
    });
    return particles.map(p => (
      <span
        key={p.key}
        className="ai-bit"
        style={{
          left: p.left,
          top: p.top,
          animationDelay: p.delay,
          '--dur': p.dur,
          '--dx': p.dx
        }}
      >
        {p.text}
      </span>
    ));
  }, [particleCount]);

  // 🧾 Handle Stripe redirect feedback
  useEffect(() => {
    const search = new URLSearchParams(location.search);
    const paymentStatus = search.get("payment");
    if (!paymentStatus) return;

    const sessionId = search.get("session_id");
    const shortSession = sessionId ? `${sessionId.slice(0, 8)}…${sessionId.slice(-4)}` : null;

    if (paymentStatus === "stripe-success") {
      setStripeFeedback({
        type: "success",
        title: "Stripe payment confirmed",
        message:
          "Thank you! Your € purchase via Stripe has been confirmed. The BITS distribution will follow shortly and you can track the details in your email receipt.",
        sessionId: shortSession,
      });
      toast.success("✅ Stripe payment confirmed. Check your inbox for the receipt.");
      setSelectedChain("fiat");
      setSelectedToken("STRIPE");
      
      // 🎯 TikTok CompletePayment event - Stripe payment successful
      try {
        trackTikTokEvent('CompletePayment', {
          content_type: 'product',
          content_name: 'BITS Token Purchase',
          payment_method: 'stripe',
          currency: 'EUR',
          // Note: Exact amount not available in URL params, but conversion is tracked
        });
      } catch (_) {}
    } else if (paymentStatus === "stripe-cancel") {
      setStripeFeedback({
        type: "warning",
        title: "Payment cancelled",
        message: "The Stripe checkout was closed before completion. You can restart whenever you're ready.",
      });
      toast.info("ℹ️ Stripe checkout cancelled. No funds were captured.");
    }

    // Clean query params from URL
    navigate({ pathname: location.pathname }, { replace: true });
  }, [location.search, location.pathname, navigate, setSelectedChain, setSelectedToken]);

  // 🎨 Toggle Particles & Dark Mode (3 states cycle)
  const handleToggle = () => {
    if (showParticles && !darkMode) {
      // State 1 → State 2: Hide particles
      setShowParticles(false);
    } else if (!showParticles && !darkMode) {
      // State 2 → State 3: Enable dark mode
      setDarkMode(true);
    } else {
      // State 3 → State 1: Reset to normal
      setShowParticles(true);
      setDarkMode(false);
    }
  };

  return (
    <div className="presale-page">
      <PresaleCopilot selectedToken={selectedToken} selectedChain={selectedChain} />
      {/* 🎨 Switcher (3 poziții) - MOVED BOTTOM LEFT */}
      <div
        onClick={handleToggle}
        style={{
          position: 'fixed',
          bottom: '30px',
          left: '20px',
          zIndex: 9999,
          width: '160px',
          height: '36px',
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(0, 255, 163, 0.3)',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Slider */}
        <div
          style={{
            position: 'absolute',
            left: showParticles && !darkMode ? '4px' : (!showParticles && !darkMode ? 'calc(50% - 14px)' : 'calc(100% - 32px)'),
            width: '28px',
            height: '28px',
            background: 'linear-gradient(135deg, #00FFA3, #DC1FFF)',
            borderRadius: '50%',
            transition: 'left 0.3s ease',
            boxShadow: '0 2px 8px rgba(0, 255, 163, 0.4)',
          }}
        />
        {/* Labels */}
        <span style={{ fontSize: '16px', zIndex: 1, marginLeft: '8px', opacity: showParticles && !darkMode ? 1 : 0.4, transition: 'opacity 0.3s' }}>🌟</span>
        <span style={{ fontSize: '16px', zIndex: 1, opacity: !showParticles && !darkMode ? 1 : 0.4, transition: 'opacity 0.3s' }}>⚫</span>
        <span style={{ fontSize: '16px', zIndex: 1, marginRight: '8px', opacity: darkMode ? 1 : 0.4, transition: 'opacity 0.3s' }}>🌑</span>
      </div>
      {stripeFeedback && (
        <div className={`stripe-feedback stripe-feedback--${stripeFeedback.type}`}>
          <div className="stripe-feedback__icon" aria-hidden>
            {stripeFeedback.type === "success" ? "✅" : "⚠️"}
          </div>
          <div className="stripe-feedback__body">
            <strong>{stripeFeedback.title}</strong>
            <p>{stripeFeedback.message}</p>
            {stripeFeedback.sessionId && (
              <span className="stripe-feedback__meta">
                Session ID: {stripeFeedback.sessionId}
              </span>
            )}
          </div>
        </div>
      )}
      {showTikTokDebug && (
        <div style={{
          position: 'fixed', top: 8, right: 8, zIndex: 99999,
          background: 'rgba(0, 240, 255, 0.12)',
          border: '1px solid rgba(0, 240, 255, 0.45)',
          color: '#00e0ff', padding: '6px 10px', borderRadius: 8,
          fontSize: 12, boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
          backdropFilter: 'blur(4px)'
        }}>
          TikTok Pixel: OK
        </div>
      )}
      {/* AI Text Particle Field */}
      {showParticles && (
        <div className="ai-text-field" aria-hidden>
          {particlesJSX}
        </div>
      )}
      <div className="presale-wrapper">
        <div className="presale-grid">
          {/* Select Token/Chain */}
          <div className="grid-select">
            <SelectPaymentMethod
              selectedToken={selectedToken}
              onSelectToken={setSelectedToken}
              selectedChain={selectedChain}
              onSelectChain={setSelectedChain}
              tokenPrices={tokenPrices} /* 💲 PASS PRICES DOWN */
            />
          </div>

          {/* Payment */}
          <div className="grid-payment card-box">
            <Suspense fallback={<PresaleLoading />}>
              <PaymentBox
                selectedToken={selectedToken}
                selectedChain={selectedChain}
                amountPay={amountPay}
                setAmountPay={setAmountPay}
                tokenPrices={tokenPrices}
                walletAddress={walletAddress}
              />
            </Suspense>
          </div>

          {/* Presale Timer Panel */}
          <div className="grid-panel card-box">
            <div className="sticky-wrapper">
              <Suspense fallback={<PresaleLoading />}>
                <PresaleDashboard />
              </Suspense>
            </div>
          </div>

          {/* Referral */}
          <div className="grid-claim card-box">
            <Suspense fallback={<PresaleLoading />}>
              <ReferralRewardBox walletAddress={walletAddress} />
            </Suspense>
          </div>

          {/* BITS Analytics */}
          <div className="grid-summary card-box">
            <Suspense fallback={<PresaleLoading />}>
              <BITSAnalytics />
            </Suspense>
            {/* Live BTC feed under analytics */}
            <RecentBTCFeed />
            {/* Live STX feed under BTC feed */}
            <RecentStacksFeed />
          </div>

        </div>

        {/* Adjust Font Button */}
        <AdjustFontButton />
      </div>
    </div>
  );
};

export default PresalePage;
