import React, { useState, useEffect } from 'react';
import './DEX.css';
import bitsLogo from '../../assets/logo.png';

const LOADING_TEXTS = [
    "INITIALIZING NEURAL LINK...",
    "ESTABLISHING SECURE UPLINK...",
    "HANDSHAKING WITH GEMINI AI...",
    "DECRYPTING LIQUIDITY POOLS...",
    "OPTIMIZING ROUTE PATHS...",
    "SYNCING ORACLE DATA...",
    "FINALIZING SYSTEM BOOT..."
];

// Google Gemini SVG Icon
const GeminiIcon = () => (
  <svg viewBox="0 0 512 512" className="dex-gemini-logo-svg" style={{
      width: '32px', 
      height: '32px', 
      filter: 'drop-shadow(0 0 15px #4facfe)',
  }}>
    <path fill="url(#gemini-gradient)" d="M256,0C256,141.38,141.38,256,0,256c141.38,0,256,114.62,256,256c0-141.38,114.62-256,256-256C370.62,256,256,141.38,256,0z"/>
    <defs>
      <linearGradient id="gemini-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4facfe" />
        <stop offset="100%" stopColor="#00f2fe" />
      </linearGradient>
    </defs>
  </svg>
);

const CosmicLoader = () => {
  const [progress, setProgress] = useState(0);
  const [textIndex, setTextIndex] = useState(0);
  const titleText = "BITSWAPDEX AI"; // Define titleText here

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
            clearInterval(interval);
            return 100;
        }
        const increment = 1.5; 
        return Math.min(prev + increment, 100);
      });
    }, 40); 

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
      const totalTexts = LOADING_TEXTS.length;
      const step = 100 / totalTexts;
      const newIndex = Math.min(Math.floor(progress / step), totalTexts - 1);
      if (newIndex !== textIndex) {
          setTextIndex(newIndex);
      }
  }, [progress, textIndex]);

  // Define getGravityStyle function inside component scope
  const getGravityStyle = (index) => {
      const startX = `${(Math.random() - 0.5) * 1000}px`; 
      const startY = `${(Math.random() - 0.5) * 800}px`;
      const startZ = `${(Math.random() * 500)}px`; 
      const startRot = `${(Math.random() - 0.5) * 360}deg`;
      
      return {
          '--startX': startX,
          '--startY': startY,
          '--startZ': startZ,
          '--startRot': startRot,
          animationDelay: `${index * 0.05}s` 
      };
  };

  return (
    <div className="dex-cinematic-loader-overlay-v2">
      <div className="dex-deep-space-bg">
         <div className="stars-sm" style={{boxShadow: '10px 10px #FFF, 50px 100px #FFF, 150px 200px #FFF'}}></div>
      </div>
      
      {/* GRAVITY ASSEMBLE TITLE */}
      <div className="dex-loader-title-container">
          {titleText.split('').map((char, i) => (
              <span 
                key={i} 
                className="gravity-char gravity-animate"
                style={getGravityStyle(i)}
              >
                  {char === ' ' ? '\u00A0' : char}
              </span>
          ))}
      </div>

      {/* MAIN REACTOR CONTAINER */}
      <div className="dex-reactor-container">
        
        {/* 1. Outer Decoration Ring */}
        <div className="dex-reactor-ring-outer"></div>

        {/* 2. Gemini Energy Ring (The Spinner) */}
        <div className="dex-reactor-ring-gemini"></div>

        {/* 3. The Core (BITS Logo) */}
        <img src={bitsLogo} alt="BITS Core" className="dex-reactor-core-img" />
        
        {/* 4. The AI Partner (Gemini Icon Orbiting) */}
        <div className="dex-ai-satellite-orbit">
            <div className="dex-ai-satellite-icon">
                <GeminiIcon />
            </div>
        </div>

      </div>

      {/* DATA STREAM AREA */}
      <div className="dex-loader-status-area">
          <span className="dex-loader-percentage">{Math.floor(progress)}%</span>
          <div className="dex-loader-text">
              {LOADING_TEXTS[textIndex]}
          </div>
          
          {/* Progress Bar */}
          <div className="dex-loader-bar-bg">
              <div 
                className="dex-loader-bar-fill" 
                style={{ width: `${progress}%` }}
              ></div>
          </div>

          <div style={{
              marginTop: '20px', fontSize: '0.7rem', color: '#666', letterSpacing: '1px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}>
             <span>POWERED BY</span>
             <span style={{
                 color: '#4facfe', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px',
                 textShadow: '0 0 10px rgba(79, 172, 254, 0.4)'
             }}>
                 GOOGLE GEMINI
             </span>
          </div>
      </div>
    </div>
  );
};

export default CosmicLoader;