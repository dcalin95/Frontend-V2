import React, { useState, useEffect } from 'react';
import './CosmicLoader.css';
import './CosmicLoader.mobile.css';
import bitsLogo from '../../assets/logo.png';

const LOADING_TEXTS = [
    "INITIALIZING NEURAL LINK",
    "ESTABLISHING SECURE UPLINK",
    "HANDSHAKING WITH GEMINI AI",
    "DECRYPTING LIQUIDITY POOLS",
    "OPTIMIZING ROUTE PATHS",
    "SYNCING ORACLE DATA",
    "FINALIZING SYSTEM BOOT"
];

const CosmicLoader = () => {
  const [progress, setProgress] = useState(0);
  const [textIndex, setTextIndex] = useState(0);
  const titleText = "BITSWAPDEX AI";

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
            clearInterval(interval);
            return 100;
        }
        return Math.min(prev + 1.5, 100);
      });
    }, 40);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
      const totalTexts = LOADING_TEXTS.length;
      const step = 100 / totalTexts;
      const newIndex = Math.min(Math.floor(progress / step), totalTexts - 1);
      if (newIndex !== textIndex) setTextIndex(newIndex);
  }, [progress, textIndex]);

  return (
    <div className="dex-cinematic-loader-overlay-v2">
      <div className="dex-deep-space-bg"></div>
      
      {/* 🧠 TOP: AI NEURAL CORE (HIGH PRECISION) */}
      <div className="ai-neural-module">
        <div className="neural-rings">
          <div className="n-ring n-ring-1"></div>
          <div className="n-ring n-ring-2"></div>
          <div className="n-ring n-ring-3"></div>
          <div className="n-core-pulse">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <div className="ai-status-text">INITIALIZING AI PROTOCOL</div>
      </div>

      {/* 🌌 CENTER: GRAVITY TITLE */}
      <div className="dex-loader-title-container">
          {titleText.split('').map((char, i) => (
              <span key={i} className="gravity-char" style={{animationDelay: `${i * 0.05}s`}}>
                  {char === ' ' ? '\u00A0' : char}
              </span>
          ))}
      </div>

      {/* ☢️ MAIN REACTOR (MULTI-RING PRECISION) */}
      <div className="dex-reactor-container">
        {/* Ring 1: Cyan Data Stream */}
        <div className="reactor-ring ring-cyan"></div>
        {/* Ring 2: Magenta Energy */}
        <div className="reactor-ring ring-magenta"></div>
        {/* Ring 3: Gold Power */}
        <div className="reactor-ring ring-gold"></div>
        {/* Ring 4: Plasma Outer */}
        <div className="reactor-ring ring-plasma"></div>

        {/* CORE LOGO */}
        <div className="reactor-core-wrapper">
            <img src={bitsLogo} alt="BITS Core" className="dex-reactor-core-img" />
            <div className="core-shine"></div>
        </div>
        
        {/* SATELLITE: GEMINI AI (Google Colors) */}
        <div className="satellite-orbit">
            <div className="gemini-pod">
                <svg viewBox="0 0 512 512">
                    <path fill="url(#g-grad)" d="M256,0C256,141.38,141.38,256,0,256c141.38,0,256,114.62,256,256c0-141.38,114.62-256,256-256C370.62,256,256,141.38,256,0z"/>
                    <defs>
                        <linearGradient id="g-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#4285F4" />
                            <stop offset="33%" stopColor="#EA4335" />
                            <stop offset="66%" stopColor="#FBBC04" />
                            <stop offset="100%" stopColor="#34A853" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
        </div>
      </div>

      {/* 📊 BOTTOM: DATA HUD */}
      <div className="dex-loader-status-area">
          <div className="hud-row">
            <span className="dex-loader-percentage">{Math.floor(progress)}%</span>
            <span className="dex-loader-text">{LOADING_TEXTS[textIndex]}</span>
          </div>
          
          <div className="dex-loader-bar-bg">
              <div className="dex-loader-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>

          <div className="powered-by-hud">
             <span>SYSTEM POWERED BY</span>
             <span className="google-brand">
                 <span style={{color:'#4285F4'}}>G</span>
                 <span style={{color:'#EA4335'}}>o</span>
                 <span style={{color:'#FBBC04'}}>o</span>
                 <span style={{color:'#4285F4'}}>g</span>
                 <span style={{color:'#34A853'}}>l</span>
                 <span style={{color:'#EA4335'}}>e</span>
                 &nbsp;GEMINI
             </span>
          </div>
      </div>
    </div>
  );
};

export default CosmicLoader;