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
import CandlestickChart from "../papertrade/CandlestickChart"; // Import Professional Chart
import WhaleTransactions from "../papertrade/WhaleTransactions"; // Import Whale Tracker
import GeoNoticeBanner from "./GeoNoticeBanner"; // 🌍 Import Geo-Notice Banner
import PresaleHero from "../Presale/components/PresaleHero"; // Import PresaleHero
import { useHybridPresaleState } from "../Presale/Timer/useHybridPresaleState"; // Import hook for presale state
import useCellManagerData from "../Presale/hooks/useCellManagerData"; // Import hook for cell manager data
import "../Presale/components/PresaleHero.css"; // Import PresaleHero CSS

import "./Home.desktop.css";
import "./Home.mobile.css";
import "./GeoNoticeBanner.css"; // 🌍 Import Geo-Notice Banner CSS
import { motion } from "framer-motion";

const Home = () => {
  const navigate = useNavigate();
  const whaleRef = useRef(null);

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

  const openWhaleTracker = () => {
    if (whaleRef.current) {
      // Scroll to WhaleTransactions
      whaleRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Trigger 3/4 screen mode after scroll
      setTimeout(() => {
        if (whaleRef.current) {
          const expandBtn = whaleRef.current.querySelector('.fullscreen-btn-whale');
          if (expandBtn) {
            expandBtn.click(); // Open in 3/4 mode
          }
        }
      }, 800);
    }
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
        style={{ paddingTop: '1rem', paddingBottom: '1rem' }}
      >
        <div className="welcome-section">
          <SmartTooltip content={`BitSwapDEX AI Core\nThe world's first Decentralized Exchange powered by Neural Networks.\nStatus: Online & Learning.`}>
          <h1 className="laser-sharp home-hero-title" style={{
            fontSize: '2.5rem',
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
          <p style={{fontSize: '1rem', lineHeight: '1.6', maxWidth: '900px', margin: '0 auto'}}>
            From Bits to Bitcoin – Powering the Future of Decentralized Exchange!
            <br />
            Revolutionizing DeFi with Bits, Bitcoin, and Beyond.
          </p>
          </SmartTooltip>
          
          <SmartTooltip content={`AI-Powered Smart Routing\nAutomatic route optimization across 12,405 liquidity pools.\nReal-time slippage prevention & MEV protection.`}>
          <p style={{fontSize: '0.95rem', lineHeight: '1.7', maxWidth: '900px', margin: '1.5rem auto 0', color: 'rgba(255,255,255,0.85)'}}>
            <span style={{
              background: 'linear-gradient(90deg, #9945FF, #14F195)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold'
            }}>⚡ Smart Swap Intelligence:</span> Our AI-powered DEX monitors real-time market conditions across multiple blockchains, 
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
          <BitcoinPriceTicker />
        </motion.div>
      </section>

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
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', marginBottom: '25px', maxWidth: '600px', margin: '0 auto 25px' }}>
                Master DeFi, AI Trading, and Blockchain Development. Join our elite community of learners and get certified.
              </p>
              <a 
                href="https://edu.bits-ai.io/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="explore-button"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  background: 'linear-gradient(90deg, #00FFA3 0%, #DC1FFF 100%)',
                  color: '#000',
                  textDecoration: 'none'
                }}
              >
                <span>Enter Education Portal</span>
                <i className="fas fa-external-link-alt"></i>
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
            <WhaleTransactions minAmount={10000} />
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
        className="fab-whale-tracker" 
        onClick={openWhaleTracker}
        title="🐋 Bitcoin & Crypto Whale Tracker - Real-time large transactions across 7 blockchains"
      >
        <i className="fab fa-bitcoin"></i>
        <span className="fab-label">
          <span className="fab-btc">BTC</span>
          <span className="fab-divider">+</span>
          <span className="fab-crypto">Whales</span>
        </span>
      </button>
    </div>
  );
};

export default Home;

