import React, { useState, useEffect, useCallback } from 'react';
import './CosmicLoader.css'; // ✅ CSS PC (Izolat)
import './CosmicLoader.mobile.css'; // 📱 CSS MOBILE (Responsive)
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

// Google Gemini SVG Icon - OFFICIAL SHAPE & COLORS
const GeminiIcon = () => (
  <svg viewBox="0 0 24 24" style={{ width: '28px', height: '28px', filter: 'drop-shadow(0 0 10px rgba(66, 133, 244, 0.6))' }}>
    <defs>
      <linearGradient id="gemini-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4285F4" />
        <stop offset="50%" stopColor="#9B72CB" />
        <stop offset="100%" stopColor="#D96570" />
      </linearGradient>
    </defs>
    <path fill="url(#gemini-gradient)" d="M12,0 C12,6.627 17.373,12 24,12 C17.373,12 12,17.373 12,24 C12,17.373 6.627,12 0,12 C6.627,12 12,6.627 12,0 Z" />
  </svg>
);

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
      if (newIndex !== textIndex) setTextIndex(newIndex);
  }, [progress, textIndex]);

  const getGravityStyle = useCallback((index) => {
    const startX = `${(Math.random() - 0.5) * 1000}px`; 
    const startY = `${(Math.random() - 0.5) * 800}px`;
    const startZ = `${(Math.random() * 500)}px`; 
    const startRot = `${(Math.random() - 0.5) * 360}deg`;
    return { '--startX': startX, '--startY': startY, '--startZ': startZ, '--startRot': startRot, animationDelay: `${index * 0.05}s` };
  }, []);

  return (
    <div className="cosmic-loader-overlay">
      
      {/* ✅ AI INITIALIZING SPINNER (TOP) - 3 INELE CA IN ORIGINAL */}
      <div className="ai-init-spinner-container">
        <div className="ai-init-ring-1"></div>
        <div className="ai-init-ring-2"></div>
        <div className="ai-init-ring-3"></div>
        <div className="ai-init-text">AI INITIALIZING</div>
      </div>

      {/* BACKGROUND */}
      <div className="cosmic-deep-space-bg">
         <div className="cosmic-stars"></div>
      </div>
      
      {/* TITLE */}
      <div className="cosmic-title-container">
          {titleText.split('').map((char, i) => (
              <span key={i} className="cosmic-char cosmic-animate" style={getGravityStyle(i)}>
                  {char === ' ' ? '\u00A0' : char}
              </span>
          ))}
      </div>

      {/* REACTOR CORE */}
      <div className="cosmic-reactor-container">
        <div className="cosmic-reactor-ring-outer"></div>
        <div className="cosmic-reactor-ring-secondary"></div> {/* ✅ AL DOILEA CERC ADAUGAT */}
        <div className="cosmic-reactor-ring"></div>
        <img src={bitsLogo} alt="BITS Core" className="cosmic-reactor-core-img" />
        
        <div className="cosmic-satellite-orbit">
            <div className="cosmic-satellite-icon">
                <GeminiIcon />
            </div>
        </div>
      </div>

      {/* STATUS AREA */}
      <div className="cosmic-status-area">
          <span className="cosmic-percentage">{Math.floor(progress)}%</span>
          <div className="cosmic-text">{LOADING_TEXTS[textIndex]}</div>
          
          <div className="cosmic-bar-bg">
              <div className="cosmic-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>

          <div className="cosmic-powered">
             <span>POWERED BY</span>
             <span>GOOGLE GEMINI</span>
          </div>
      </div>
    </div>
  );
};

export default CosmicLoader;
