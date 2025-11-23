import React from 'react';
import './DEX.css';
import bitsLogo from '../../assets/logo.png';

const CosmicLoader = () => {
  return (
    <div className="dex-cinematic-loader-overlay-v2">
      <div className="dex-deep-space-bg">
        <div className="stars-sm"></div>
        <div className="stars-md"></div>
        <div className="nebula-cloud"></div>
      </div>
      
      <div className="dex-cinematic-container">
        {/* PARTNERSHIP LOGOS SEQUENCE (0s - 8s) */}
        <div className="dex-partnership-stage">
            {/* BITS SIDE */}
            <div className="dex-logo-wrapper bits-side">
                <div className="logo-glow-ring"></div>
                <img src={bitsLogo} alt="BITS" className="dex-loader-bits-img" />
                <div className="dex-logo-label">BITS ECOSYSTEM</div>
            </div>

            {/* CONNECTION BEAM */}
            <div className="dex-connection-beam">
                <div className="beam-energy"></div>
                <div className="connection-node"></div>
            </div>

            {/* GEMINI SIDE */}
            <div className="dex-logo-wrapper gemini-side">
                <div className="logo-glow-ring gemini-ring"></div>
                {/* Gemini Star SVG - Simplified for React compatibility */}
                <svg viewBox="0 0 512 512" className="dex-gemini-svg">
                    <path fill="#4facfe" d="M256,0C256,141.38,141.38,256,0,256c141.38,0,256,114.62,256,256c0-141.38,114.62-256,256-256C370.62,256,256,141.38,256,0z"/>
                </svg>
                <div className="dex-logo-label">GOOGLE GEMINI</div>
            </div>
        </div>

        {/* TEXT REVEAL SEQUENCE (8s - 16s) */}
        <div className="dex-text-reveal-stage">
            <h1 className="dex-intro-title">
                <span className="glitch-word" data-text="BitSwapDEX">BitSwapDEX</span>
                <span className="ai-badge">AI</span>
            </h1>
            <div className="dex-intro-subtitle">
                <span className="sub-text">POWERED BY</span>
                <span className="gemini-brand">GEMINI NEURAL ENGINE</span>
            </div>
            
            <div className="dex-system-check">
                <div className="check-row"><span>&gt; ESTABLISHING UPLINK...</span> <span className="status-ok">OK</span></div>
                <div className="check-row delay-1"><span>&gt; SYNCING LIQUIDITY NODES...</span> <span className="status-ok">100%</span></div>
                <div className="check-row delay-2"><span>&gt; OPTIMIZING ROUTE PATHS...</span> <span className="status-ok">DONE</span></div>
                <div className="check-row delay-3"><span>&gt; LAUNCHING INTERFACE...</span></div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CosmicLoader;
