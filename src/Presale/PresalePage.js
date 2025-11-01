// CSS imports - Must be first
import "./PresalePage.css";
import "./PaymentBox/PaymentBox.css";
import "./PaymentBox/InputBox.css";
import "./PaymentBox/PaymentSummary.css";

import React, { useState, useEffect, Suspense, lazy, useMemo } from "react";
import useGoogleAnalytics from "../hooks/useGoogleAnalytics";
import { trackTikTokEvent } from "../utils/tiktok";
import { ethers } from "ethers";
import SelectPaymentMethod from "./SelectPaymentMethod";
import { useSelectedToken } from "./hooks/useSelectedToken";
import useTokenPrices from "./prices/useTokenPrices";
import AdjustFontButton from "../components/AdjustFontButton";
import RecentBTCFeed from "./BITSAnalytics/RecentBTCFeed";
import RecentStacksFeed from "./BITSAnalytics/RecentStacksFeed";

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
  const { trackPresaleEvent, trackPageView } = useGoogleAnalytics();
  const {
    selectedToken,
    selectedChain,
    setSelectedToken,
    setSelectedChain,
  } = useSelectedToken();

  const { prices: tokenPrices } = useTokenPrices();
  const [amountPay, setAmountPay] = useState(0);
  const [walletAddress, setWalletAddress] = useState(null);
  const [showTikTokDebug, setShowTikTokDebug] = useState(false);

  useEffect(() => {
    const detectWallet = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          setWalletAddress(accounts[0]);
        } catch (err) {
          console.warn("🦊 Wallet not connected");
        }
      }
    };

    detectWallet();
  }, []);

  // 🔎 TikTok ViewContent (non-sensibil): doar semnal că utilizatorul a vizitat Presale
  useEffect(() => {
    try {
      trackTikTokEvent('ViewContent', { content_type: 'presale_page' });
    } catch (_) {}
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

  const [particleCount, setParticleCount] = useState(40);
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

  return (
    <div className="presale-page">
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
      <div className="ai-text-field" aria-hidden>
        {useMemo(() => {
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
                ['--dur']: p.dur,
                ['--dx']: p.dx
              }}
            >
              {p.text}
            </span>
          ));
        }, [particleCount])}
      </div>
      <div className="presale-wrapper">
        <div className="presale-grid">
          {/* Select Token/Chain */}
          <div className="grid-select">
            <SelectPaymentMethod
              selectedToken={selectedToken}
              onSelectToken={setSelectedToken}
              selectedChain={selectedChain}
              onSelectChain={setSelectedChain}
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
