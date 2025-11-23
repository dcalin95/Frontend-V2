import React from 'react';
import './DEX.css';

const CosmicLoader = () => {
  return (
    <div className="dex-cosmic-loader-overlay">
      <div className="dex-cosmic-loader-container">
        {/* Central Core */}
        <div className="dex-cosmic-core"></div>
        
        {/* Orbital Rings */}
        <div className="dex-cosmic-ring ring-1"></div>
        <div className="dex-cosmic-ring ring-2"></div>
        <div className="dex-cosmic-ring ring-3"></div>
        
        {/* Particles */}
        <div className="dex-cosmic-particle p1"></div>
        <div className="dex-cosmic-particle p2"></div>
        <div className="dex-cosmic-particle p3"></div>
        <div className="dex-cosmic-particle p4"></div>

        {/* Text */}
        <div className="dex-cosmic-text">
            <span className="dex-cosmic-word">AI</span>
            <span className="dex-cosmic-word">GEMINI</span>
            <span className="dex-cosmic-word">INITIALIZING</span>
        </div>
      </div>
    </div>
  );
};

export default CosmicLoader;

