import React from "react";

const DashboardHeader = ({ pulseEffect, isVisible }) => {
  return (
    <div className="portfolio-dashboard-header">
      {/* Background Pattern */}
      <div className="portfolio-header-background"></div>

      {/* Portfolio Icon - use BITS favicon for clarity */}
      <div className={`portfolio-header-icon ${pulseEffect ? 'pulse-active' : ''}`}>
        <img src="/favicon.ico" alt="BITS" className="portfolio-header-icon-img" />
      </div>
      
      {/* Main Title */}
     <h1 className="portfolio-header-title">
  BITS Analytics Dashboard
</h1>

      
      {/* Subtitle */}
      <p className="portfolio-header-subtitle">
        Real-Time BITS Holdings & Performance Analytics
      </p>
      
      {/* Status Indicator */}
      <div className="portfolio-header-status">
        <div className={`portfolio-status-dot ${pulseEffect ? 'connected' : 'default'}`}></div>
        <span className="portfolio-status-text">
          Blockchain Connection: Active
        </span>
        <div className={`portfolio-status-indicator ${pulseEffect ? 'active' : ''}`}></div>
        <span>Live Data</span>
      </div>
    </div>
  );
};

export default DashboardHeader;