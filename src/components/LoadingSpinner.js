import React from 'react';
import './LoadingSpinner.css';
import './LoadingSpinner.mobile.css';

const LoadingSpinner = () => {
  return (
    <div className="ai-loading-wrapper">
      {/* AI Neural Core Animation */}
      <div className="ai-neural-core">
        {/* Outer Rings */}
        <div className="ai-ring ring-1"></div>
        <div className="ai-ring ring-2"></div>
        <div className="ai-ring ring-3"></div>
        
        {/* Central Core */}
        <div className="ai-core-pulse">
          <svg viewBox="0 0 24 24" fill="none" className="ai-core-icon">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        {/* Data Stream Particles */}
        <div className="ai-particles">
          <span></span><span></span><span></span><span></span>
        </div>
      </div>

      {/* Text Status */}
      <div className="ai-loading-text">
        <span className="text-glitch" data-text="INITIALIZING AI...">INITIALIZING AI...</span>
        <div className="loading-bar">
          <div className="loading-progress"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
