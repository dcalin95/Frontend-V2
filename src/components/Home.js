import React from "react";
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

import "./Home.desktop.css";
import "./Home.mobile.css";
import { motion } from "framer-motion";

const Home = () => {
  const navigate = useNavigate();

  const handleExplorePlatform = () => {
    navigate("/about");
  };

  return (
    <div className="home-container">
      {/* Fundalul este gestionat global în App.js */}
      <section className="home-section" style={{ height: 0, overflow: 'hidden' }}>
      </section>

      {/* Secțiunea Hero */}
      <motion.section
        className="home-section hero"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <div className="welcome-section">
          <SmartTooltip content={`BitSwapDEX AI Core\nThe world's first Decentralized Exchange powered by Neural Networks.\nStatus: Online & Learning.`}>
          <h1 className="laser-sharp home-hero-title">
            Welcome to <BrandLogo size="sm" className="home-brand" />
          </h1>
          </SmartTooltip>
          
          <SmartTooltip content={`Mission Statement\nIntegrating $BITS token utility with AI-driven liquidity management.\nTarget: Zero Slippage & Max APY.`}>
          <p>
            <br />From Bits to Bitcoin – Powering the Future of Decentralized Exchange!<br />
            <br />Revolutionizing DeFi with Bits, Bitcoin, and Beyond.<br />
            <br />BitSwapDEX AI: Where every bit counts in the ecosystem of Bitcoin and beyond!<br />
            <br />Empowering decentralized finance with AI-powered trading, dynamic liquidity,
            and secure transactions!<br />
          </p>
          </SmartTooltip>
        </div>
      </motion.section>

      {/* Bitcoin Live Price Ticker - Cosmic Design */}
      <section className="home-section" style={{ display:'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', padding:'60px 0 40px 0', margin: '0', position: 'relative', zIndex: 15, minHeight: '350px' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 20 }}
        >
          <BitcoinPriceTicker />
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

      {/* Live Bitcoin Market Chart */}
      <motion.section
        className="home-section live-market-section"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3 }}
        viewport={{ once: true }}
        style={{ padding: '3rem 2rem', maxWidth: '1400px', margin: '0 auto' }}
      >
        {/* Header with Logo & Slogan */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <BrandLogo size="md" />
            <SmartTooltip content="Real-time Bitcoin price chart powered by Binance API.\nProfessional candlestick chart with volume bars.\nUse zoom controls (+/-) to resize.\nClick fullscreen for maximum view.">
              <h2 className="section-title" style={{ margin: 0 }}>
                <i className="fas fa-chart-candlestick" style={{ marginRight: '1rem' }}></i>
                Live Bitcoin Market
                <span style={{ 
                  marginLeft: '1rem', 
                  fontSize: '0.8rem', 
                  color: '#26a69a',
                  background: 'rgba(38, 166, 154, 0.1)',
                  padding: '0.3rem 0.8rem',
                  borderRadius: '4px',
                  fontWeight: '700'
                }}>🔴 LIVE</span>
              </h2>
            </SmartTooltip>
          </div>
          
          {/* Professional Slogan */}
          <SmartTooltip content="BitSwapDEX AI Mission\nFrom Bits to Bitcoin - Every transaction powered by Neural Networks.\nReal-time market intelligence at your fingertips.">
            <p style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #00FFA3, #DC1FFF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent',
              letterSpacing: '0.5px',
              margin: 0,
              padding: '0.5rem 1rem',
              maxWidth: '800px'
            }}>
              🚀 From Bits to Bitcoin – Powering the Future of Decentralized Trading 📊
            </p>
          </SmartTooltip>
          
          <p style={{
            fontSize: '0.95rem',
            color: '#848e9c',
            margin: 0,
            fontStyle: 'italic',
            letterSpacing: '0.3px'
          }}>
            "Where AI meets DeFi - Professional trading tools for everyone"
          </p>
        </div>
        
        <CandlestickChart 
          symbol="BTCUSDT"
          defaultTimeframe="1h"
          height={450}
          showFullscreen={true}
          showHeader={true}
          autoUpdate={true}
          updateInterval={30000}
        />
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
    </div>
  );
};

export default Home;

