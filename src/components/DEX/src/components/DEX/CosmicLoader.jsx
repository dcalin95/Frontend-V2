import React from 'react';
import './DEX.css';

const CosmicLoader = () => {
  return (
    <div className="dex-cosmic-loader-overlay">
      <div className="dex-hyper-space-bg"></div>
      
      <div className="dex-loader-content">
        {/* The Gemini Dual Core */}
        <div className="dex-gemini-core-wrapper">
            <div className="dex-gemini-orbit orbit-1"></div>
            <div className="dex-gemini-orbit orbit-2"></div>
            <div className="dex-gemini-star star-1"></div>
            <div className="dex-gemini-star star-2"></div>
        </div>

        {/* Text Container */}
        <div className="dex-loader-text-group">
            <div className="dex-loader-title">
                <span className="letter">B</span>
                <span className="letter">i</span>
                <span className="letter">t</span>
                <span className="letter">S</span>
                <span className="letter">w</span>
                <span className="letter">a</span>
                <span className="letter">p</span>
                <span className="letter" style={{color: '#00FFA3'}}>D</span>
                <span className="letter" style={{color: '#00FFA3'}}>E</span>
                <span className="letter" style={{color: '#00FFA3'}}>X</span>
                <span className="letter spacer"> </span>
                <span className="letter ai-glow">A</span>
                <span className="letter ai-glow">I</span>
            </div>
            <div className="dex-loader-subtitle">
                POWERED BY <span className="gemini-text">GEMINI</span>
            </div>
            <div className="dex-loading-bar">
                <div className="dex-loading-progress"></div>
            </div>
            <div className="dex-loader-status">INITIALIZING NEURAL UPLINK...</div>
        </div>
      </div>
    </div>
  );
};

export default CosmicLoader;

