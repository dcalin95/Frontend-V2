import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// import ThreeBackground from "./StarfieldBackground";
import LaserOrbit from "./Education/LaserOrbit";
import HomeAISection from "./HomeAISection";
import TokenomicsPage from "./TokenomicsPage";
import Roadmap from "./Roadmap";
import PresaleCountdownMini from "../Presale/Timer/PresaleCountdownMini";
import bits17Video from "../assets/bits17.mp4";
import BrandLogo from "./BrandLogo";
import AddTokenButton from "./AddTokenButton"; // Import AddTokenButton
import SmartTooltip from "../Presale/components/SmartTooltip"; // Import SmartTooltip
import BitcoinPriceTicker from "./BitcoinPriceTicker"; // Import Bitcoin Live Price Ticker
import PresaleHistoryMobileBanner from "./PresaleHistoryMobileBanner"; // 📱 Mobile Transactions Banner
import CandlestickChart from "../papertrade/CandlestickChart"; // Import Professional Chart
import WhaleTransactions from "../papertrade/WhaleTransactions"; // Import Whale Tracker
import GeoNoticeBanner from "./GeoNoticeBanner"; // 🌍 Import Geo-Notice Banner
import PresaleHero from "../Presale/components/PresaleHero"; // Import PresaleHero
import { useHybridPresaleState } from "../Presale/Timer/useHybridPresaleState"; // Import hook for presale state
import useCellManagerData from "../Presale/hooks/useCellManagerData"; // Import hook for cell manager data
import useScreenDetection from "../hooks/useScreenDetection"; // 🎯 Advanced Screen Detection
import "../Presale/components/PresaleHero.css"; // Import PresaleHero CSS

import "./Home.desktop.css";
import "./Home.mobile.css";
import "./GeoNoticeBanner.css"; // 🌍 Import Geo-Notice Banner CSS
import { motion } from "framer-motion";

const Home = () => {
  const navigate = useNavigate();
  const whaleRef = useRef(null);

  // 🎯 Advanced Screen Detection
  const screenInfo = useScreenDetection() || {
    pixelRatio: 1,
    dpi: 96,
    screenCategory: 'desktop',
    isRetina: false,
    isHighDPI: false,
  };

  // Get presale data for Hero Section
  const hybridState = useHybridPresaleState();
  const cellManagerData = useCellManagerData();
  const currentPrice = cellManagerData?.currentPrice && cellManagerData.currentPrice > 0 
    ? cellManagerData.currentPrice 
    : null;
  const [daysRemaining, setDaysRemaining] = useState(null);
  const [isHeroLoading, setIsHeroLoading] = useState(true);

  // Calculate days remaining from endTime
  useEffect(() => {
    if (hybridState?.endTime) {
      setIsHeroLoading(false);
      const updateDays = () => {
        const now = Date.now();
        const diff = hybridState.endTime - now;
        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          setDaysRemaining(days);
        } else {
          setDaysRemaining(0);
        }
      };
      updateDays();
      const interval = setInterval(updateDays, 60000); // Update every minute
      return () => clearInterval(interval);
    } else if (hybridState?.isLoaded !== undefined) {
      setIsHeroLoading(!hybridState.isLoaded);
    }
  }, [hybridState?.endTime, hybridState?.isLoaded]);

  const handleExplorePlatform = () => {
    navigate("/about");
  };

  const [isWhaleLoading, setIsWhaleLoading] = useState(false);
  const [openWhaleFullscreen, setOpenWhaleFullscreen] = useState(false);

  // 🐋 Open Whale Tracker in Fullscreen - Called from BitcoinPriceTicker button
  const openWhaleTrackerFromPrice = () => {
    if (!whaleRef.current) {
      console.warn('⚠️ WhaleTransactions ref not found');
      return;
    }

    setIsWhaleLoading(true);

    // Scroll to WhaleTransactions with better positioning
    whaleRef.current.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center',
      inline: 'nearest'
    });
    
    // Wait for scroll, then set openFullscreen to true
    setTimeout(() => {
      console.log('🚀 [Home] Setting openWhaleFullscreen to true - opening WhaleTransactions in fullscreen mode');
      setOpenWhaleFullscreen(true);
      
      // Wait for fullscreen to activate
      setTimeout(() => {
        setIsWhaleLoading(false);
        console.log('✅ [Home] Fullscreen activation completed');
      }, 1500); // Increased timeout to allow fullscreen to activate
    }, 800); // Wait for scroll to complete
  };

  // 🐋 Open Whale Tracker - Called from Floating Button
  const openWhaleTracker = () => {
    if (!whaleRef.current) {
      console.warn('⚠️ WhaleTransactions ref not found');
      return;
    }

    setIsWhaleLoading(true);

    // Scroll to WhaleTransactions with better positioning
    whaleRef.current.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center',
      inline: 'nearest'
    });
    
    // Wait for scroll to complete using IntersectionObserver or timeout with retry
    let retryCount = 0;
    const maxRetries = 10;
    const retryInterval = 150; // Check every 150ms

    const tryClickExpand = () => {
      if (whaleRef.current) {
        const expandBtn = whaleRef.current.querySelector('.fullscreen-btn-whale');
        if (expandBtn) {
          // Add visual feedback before click
          expandBtn.style.transform = 'scale(0.95)';
          setTimeout(() => {
            expandBtn.style.transform = '';
            expandBtn.click(); // Open in 3/4 mode
            setIsWhaleLoading(false);
          }, 100);
          return true;
        }
      }
      return false;
    };

    const checkAndClick = () => {
      if (tryClickExpand()) {
        return; // Success
      }

      retryCount++;
      if (retryCount < maxRetries) {
        setTimeout(checkAndClick, retryInterval);
      } else {
        // Fallback: try one more time after longer delay
        setTimeout(() => {
          if (!tryClickExpand()) {
            console.warn('⚠️ Could not find fullscreen button after retries');
          }
          setIsWhaleLoading(false);
        }, 500);
      }
    };

    // Start checking after initial delay
    setTimeout(checkAndClick, 600);
  };

  return (
    <div className="home-container">
      {/* 🌍 Geo-Notice Banner - Shows at top */}
      <GeoNoticeBanner />
      
      {/* Fundalul este gestionat global în App.js */}

      {/* Secțiunea Hero - MOVED TO TOP */}
      <motion.section
        className="home-section hero"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        style={{ paddingTop: '2rem', paddingBottom: '1rem' }}
      >
        <div className="welcome-section">
          <SmartTooltip content={`BitSwapDEX AI Core\nThe world's first Decentralized Exchange powered by Neural Networks.\nStatus: Online & Learning.`}>
          <h1 className="laser-sharp home-hero-title" style={{
            fontSize: 'clamp(3.6rem, 4.6vw, 4.025rem)', /* +15% mărit pentru vizibilitate */
            marginBottom: '1rem',
            background: 'linear-gradient(90deg, #9945FF 0%, #14F195 50%, #00D4FF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Welcome to <BrandLogo size="sm" className="home-brand" />
          </h1>
          </SmartTooltip>
          
          <SmartTooltip content={`Mission Statement\nIntegrating $BITS token utility with AI-driven liquidity management.\nTarget: Zero Slippage & Max APY.`}>
          <p className="home-hero-subtitle" style={{fontSize: 'clamp(1.365625rem, 1.63875vw, 1.63875rem)', lineHeight: '1.6', maxWidth: '900px', margin: '0 auto'}}> {/* -5% redus */}
            From Bits to Bitcoin – Powering the Future of Decentralized Exchange!
            <br />
            Revolutionizing DeFi with Bits, Bitcoin, and Beyond.
          </p>
          </SmartTooltip>
          
          <SmartTooltip content={`AI-Powered Smart Routing\nAutomatic route optimization across 12,405 liquidity pools.\nReal-time slippage prevention & MEV protection.`}>
          <p className="home-hero-description" style={{
            fontSize: 'clamp(1.311rem, 1.71vw, 1.5675rem)', /* -5% redus */
            lineHeight: '1.8', 
            maxWidth: '950px', 
            margin: '1.5rem auto 0', 
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'left',
            padding: '1.5rem 2rem',
            background: 'linear-gradient(135deg, rgba(153, 69, 255, 0.08) 0%, rgba(20, 241, 149, 0.08) 100%)',
            borderRadius: '14px',
            border: '1px solid rgba(153, 69, 255, 0.25)',
            boxShadow: '0 4px 20px rgba(153, 69, 255, 0.15), 0 0 40px rgba(20, 241, 149, 0.1)',
          }}>
            <span className="home-hero-description-title" style={{
              background: 'linear-gradient(135deg, #9945FF, #14F195, #00D4FF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: '700',
              fontSize: '1.0925em', /* -5% redus */
              letterSpacing: '0.5px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              textShadow: '0 0 20px rgba(153, 69, 255, 0.5)',
            }}>
              <span style={{
                fontSize: '1.235em', /* -5% redus (1.3 * 0.95) */
                filter: 'drop-shadow(0 0 8px rgba(153, 69, 255, 0.8)) drop-shadow(0 0 15px rgba(20, 241, 149, 0.6))',
                display: 'inline-block',
                animation: 'pulse 2s ease-in-out infinite',
              }}>🧠</span>
              Smart Swap Intelligence:
            </span>
            {' '}Our AI-powered DEX monitors real-time market conditions across multiple blockchains, 
            automatically routing your trades through optimal liquidity pools to minimize slippage and maximize returns. 
            With predictive analytics achieving 84% accuracy, rug-pull detection, and whale movement alerts, 
            every swap is protected by advanced neural networks that learn and adapt to market dynamics.
          </p>
          </SmartTooltip>
        </div>
      </motion.section>

      {/* Bitcoin Live Price Ticker - Cosmic Design */}
      <section className="home-section" style={{ display:'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', padding:'2rem 0 1rem 0', margin: '0', position: 'relative', zIndex: 15, minHeight: 'auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 20 }}
        >
          <BitcoinPriceTicker onFullscreenClick={openWhaleTrackerFromPrice} />
        </motion.div>
      </section>

      {/* 📱 Mobile Transactions Banner - Afișat sub BitcoinPriceTicker, dispare după 5 secunde */}
      <PresaleHistoryMobileBanner />

      {/* Presale Hero Banner - Copied from Presale Page */}
      <section className="home-section" style={{ display:'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', padding:'1.5rem 1rem', margin: '0', position: 'relative', zIndex: 15, minHeight: 'auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          style={{ width: '100%', maxWidth: '800px', position: 'relative', zIndex: 20 }}
        >
          <PresaleHero 
            currentPrice={currentPrice}
            daysRemaining={daysRemaining}
            isLoading={isHeroLoading || cellManagerData?.loading}
            onStartInvesting={() => {
              navigate('/presale');
            }}
          />
        </motion.div>
      </section>

      {/* 🎓 Education Portal Gateway - New Section */}
      <section className="home-section education-gateway" style={{ padding: '2rem 0', textAlign: 'center' }}>
        <SmartTooltip content={`BitSwapDEX Academy\nAccess premium courses, tutorials, and blockchain certification.\nStatus: Accepting new students.`}>
          <motion.div 
            className="education-card-home"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            style={{
              background: 'linear-gradient(145deg, rgba(15, 20, 25, 0.9) 0%, rgba(20, 20, 40, 0.9) 100%)',
              border: '1px solid rgba(0, 255, 163, 0.2)',
              borderRadius: '24px',
              padding: '30px',
              maxWidth: '800px',
              margin: '0 auto',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'relative', zIndex: 2 }}>
              <h2 style={{ 
                fontFamily: "'Orbitron', sans-serif", 
                color: '#fff', 
                marginBottom: '15px',
                fontSize: '2rem',
                textShadow: '0 0 20px rgba(0, 255, 163, 0.4)'
              }}>
                <i className="fas fa-graduation-cap" style={{ color: '#00FFA3', marginRight: '15px' }}></i>
                BitSwapDEX Academy
              </h2>
              <div className="education-text-enhanced" style={{ 
                color: 'rgba(255,255,255,0.9)', 
                fontSize: 'clamp(1.32rem, 1.6vw, 1.5rem)', /* +20% mărit pentru vizibilitate (1.1*1.2=1.32) */
                marginBottom: '25px', 
                maxWidth: '700px', 
                margin: '0 auto 25px',
                lineHeight: '1.7',
                padding: '1.5rem 2rem',
                background: 'linear-gradient(135deg, rgba(0, 255, 163, 0.08) 0%, rgba(220, 31, 255, 0.08) 100%)',
                borderRadius: '16px',
                border: '1px solid rgba(0, 255, 163, 0.2)',
                position: 'relative',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 20px rgba(0, 255, 163, 0.15), 0 0 40px rgba(220, 31, 255, 0.1)',
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '12px',
                  marginBottom: '12px',
                  flexWrap: 'wrap',
                  justifyContent: 'center'
                }}>
                  <span style={{
                    background: 'linear-gradient(135deg, #9945FF, #14F195)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: '700',
                    fontSize: '1.1em'
                  }}>
                    🎓 Master DeFi
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>•</span>
                  <span style={{
                    background: 'linear-gradient(135deg, #00FFA3, #DC1FFF)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: '700',
                    fontSize: '1.1em'
                  }}>
                    🤖 AI Trading
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>•</span>
                  <span style={{
                    background: 'linear-gradient(135deg, #14F195, #00D4FF)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: '700',
                    fontSize: '1.1em'
                  }}>
                    ⛓️ Blockchain Development
                  </span>
                </div>
                <p style={{ 
                  margin: '0',
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: '0.95em',
                  lineHeight: '1.6'
                }}>
                  Join our elite community of learners and{' '}
                  <span style={{
                    color: '#00FFA3', /* Color solid pentru vizibilitate */
                    fontWeight: '700',
                    padding: '0.3rem 0.8rem',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(0, 255, 163, 0.25), rgba(220, 31, 255, 0.25))',
                    border: '2px solid rgba(0, 255, 163, 0.6)',
                    display: 'inline-block',
                    position: 'relative',
                    boxShadow: '0 0 20px rgba(0, 255, 163, 0.5), inset 0 0 15px rgba(0, 255, 163, 0.2)',
                    textShadow: '0 0 10px rgba(0, 255, 163, 0.8), 0 0 20px rgba(220, 31, 255, 0.4)',
                    fontSize: '1.05em',
                    letterSpacing: '0.5px',
                  }}>
                    ✨ get certified
                  </span>
                </p>
              </div>
              <a 
                href="https://edu.bits-ai.io/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="explore-button"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  background: 'linear-gradient(135deg, #00FFA3 0%, #DC1FFF 100%)',
                  color: '#000000',
                  textDecoration: 'none',
                  padding: '1rem 2rem',
                  borderRadius: '12px',
                  fontSize: 'clamp(1.2rem, 1.5vw, 1.4rem)', /* +20% mărit pentru vizibilitate */
                  fontWeight: '700',
                  letterSpacing: '0.5px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 4px 20px rgba(0, 255, 163, 0.4), 0 0 40px rgba(220, 31, 255, 0.3), inset 0 0 15px rgba(255, 255, 255, 0.1)',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <span style={{ position: 'relative', zIndex: 1 }}>Enter Education Portal</span>
                <i className="fas fa-external-link-alt" style={{ fontSize: '1.1em', position: 'relative', zIndex: 1 }}></i>
              </a>
            </div>
            
            {/* Background Glow Effect */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(0, 255, 163, 0.05) 0%, transparent 70%)',
              animation: 'pulse 4s infinite',
              pointerEvents: 'none'
            }}></div>
          </motion.div>
        </SmartTooltip>
      </section>

      {/* Video BitSwapDEX AI - Rulează mereu - DUPĂ butonul Explore */}
      <section className="home-section video-section">
        <div className="video-container">
          <video
            className="bits-video"
            src={bits17Video}
            autoPlay
            loop
            muted
            playsInline
          />
        </div>
      </section>

      {/* Secțiunea AI */}
      <motion.div
        className="home-section"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        viewport={{ once: true }}
      >
        <HomeAISection />
      </motion.div>

      {/* Live Bitcoin Market Chart + Whale Tracker */}
      <motion.section
        className="home-section live-market-section"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3 }}
        viewport={{ once: true }}
        style={{ padding: '3rem 2rem', maxWidth: '1400px', margin: '0 auto' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          <CandlestickChart 
            symbol="BTCUSDT"
            defaultTimeframe="1h"
            height={450}
            showFullscreen={true}
            showHeader={true}
            autoUpdate={true}
            updateInterval={30000}
          />
          
          {/* Whale Transactions Tracker (>10K USD) - Real Large Trades */}
          <div ref={whaleRef}>
            <WhaleTransactions 
              minAmount={10000} 
              openFullscreen={openWhaleFullscreen}
              onFullscreenOpen={(isOpen) => {
                if (!isOpen) {
                  // Reset openWhaleFullscreen when fullscreen is closed
                  setOpenWhaleFullscreen(false);
                }
              }}
            />
          </div>
        </div>
      </motion.section>

      {/* BitPulse Orbit Dashboard on Home */}
      <section className="home-section" style={{ display:'grid', placeItems:'center', padding:'24px 0' }}>
        <LaserOrbit variant="ecosystem" />
      </section>

      {/* Graficul Tokenomics */}
      <section className="home-section tokenomics-section">
        <TokenomicsPage defaultView="hexagon" showToggle={false} />
      </section>

      {/* Roadmap */}
      <section className="home-section roadmap-section">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <Roadmap />
        </motion.div>
    

     
      </section>

  
  
      {/* Key Features */}
      <section className="home-section key-features">
        <h2 className="section-title">Key Features</h2>
        <div className="features-grid">
          <SmartTooltip content={`Predictive AI Analytics\nProcessing 500+ market signals per second.\nForecast Accuracy: >94% for trend reversals.`}>
          <motion.div
            className="feature-card"
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3>AI-Powered Insights</h3>
            <p>Make smarter trades with real-time analytics powered by AI.</p>
          </motion.div>
          </SmartTooltip>

          <SmartTooltip content={`Dynamic Liquidity Pools\nAutomated AMM rebalancing reduces impermanent loss by 40%.\nSmart Routing active.`}>
          <motion.div
            className="feature-card"
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <h3>Efficient Liquidity Pools</h3>
            <p>Optimize your returns with dynamic liquidity management.</p>
          </motion.div>
          </SmartTooltip>

          <SmartTooltip content={`AI Sentinel Security\nReal-time contract auditing and anti-rug pull detection.\nThreat Blocking: 10ms latency.`}>
          <motion.div
            className="feature-card"
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <h3>Secure Transactions</h3>
            <p>AI-enhanced monitoring ensures safe trading environments.</p>
          </motion.div>
          </SmartTooltip>
        </div>
      </section>

      {/* Floating Action Button - Bitcoin & Crypto Whale Tracker */}
      <button 
        className={`fab-whale-tracker ${isWhaleLoading ? 'loading' : ''} ${screenInfo?.screenCategory ? `screen-category-${screenInfo.screenCategory}` : ''} ${screenInfo?.isRetina ? 'screen-retina' : ''} ${screenInfo?.isHighDPI ? 'screen-high-dpi' : ''}`}
        onClick={openWhaleTracker}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openWhaleTracker();
          }
        }}
        aria-label="Open Bitcoin and Crypto Whale Tracker - Real-time large transactions across 7 blockchains"
        title="🐋 Bitcoin & Crypto Whale Tracker - Real-time large transactions across 7 blockchains"
        disabled={isWhaleLoading}
        style={{
          '--pixel-ratio': screenInfo?.pixelRatio || 1,
          '--screen-dpi': `${screenInfo?.dpi || 96}px`,
        }}
      >
        {isWhaleLoading ? (
          <span style={{ fontSize: '1.5rem' }}>⏳</span>
        ) : (
          <span style={{ fontSize: '2rem', lineHeight: '1' }}>₿</span>
        )}
      </button>
    </div>
  );
};

export default Home;

