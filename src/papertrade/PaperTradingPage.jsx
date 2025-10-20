import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import STXPaperTrade from './STXPaperTrade';
import TokenPaperTrade from './TokenPaperTrade';
import BITSTradingSimulator from './BITSTradingSimulator';
import './PaperTradingPage.css';

const PaperTradingPage = () => {
  const [activeTab, setActiveTab] = useState('bits-simulator');

  // 🎯 GOOGLE ADS CONVERSION TRACKING - PAPER TRADING PAGE
  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag && !window.paperTradingTracked) {
      window.paperTradingTracked = true;
      window.gtag('event', 'conversion', {
        send_to: 'AW-952552862/jW1FCOKkrgQQnpubxgM',
        value: 1.0,
        currency: 'EUR'
      });
      console.log('🎯 Google Ads conversion tracked - Paper Trading Visit');
    }
  }, []);

  const handleTabChange = (tabName) => {
    console.log('Changing tab to:', tabName);
    setActiveTab(tabName);
  };

  return (
    <div className="paper-trading-container">
      <div className="paper-trading-header">
        <h1>
          <i className="fas fa-rocket"></i>
          $BITS Pre-Exchange Trading Academy
          <span className="beta-badge">PRE-LAUNCH</span>
        </h1>
        <p>Master trading strategies before $BITS hits major exchanges</p>
      </div>

      <div className="trading-tabs">
        <button 
          className={`tab-button ${activeTab === 'bits-simulator' ? 'active' : ''}`}
          onClick={() => handleTabChange('bits-simulator')}
          title="BITS Trading Simulator - Advanced Platform"
        >
          <i className="fas fa-coins"></i>
          BITS Simulator
          {activeTab === 'bits-simulator' && <span className="active-indicator">●</span>}
        </button>
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
          title="Current tab: Overview"
        >
          <i className="fas fa-chart-line"></i>
          Overview
          {activeTab === 'overview' && <span className="active-indicator">●</span>}
        </button>
        <button 
          className={`tab-button ${activeTab === 'stx' ? 'active' : ''}`}
          onClick={() => handleTabChange('stx')}
          title="Current tab: STX Trading"
        >
          <i className="fab fa-bitcoin"></i>
          STX Trading
          {activeTab === 'stx' && <span className="active-indicator">●</span>}
        </button>
        <button 
          className={`tab-button ${activeTab === 'tokens' ? 'active' : ''}`}
          onClick={() => handleTabChange('tokens')}
          title="Current tab: Token Trading"
        >
          <i className="fas fa-gamepad"></i>
          Legacy Trading
          {activeTab === 'tokens' && <span className="active-indicator">●</span>}
        </button>
      </div>

      <div className="trading-content">
        {activeTab === 'bits-simulator' && (
          <div className="bits-simulator-section">
            <BITSTradingSimulator />
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="trading-cards">
              <div className="trading-card featured">
                <div className="card-icon">
                  <i className="fas fa-coins"></i>
                </div>
                <h3>$BITS Pre-Exchange Simulator</h3>
                <p>Professional trading platform preparing you for $BITS exchange listings. Real market data, wallet integration, and advanced features!</p>
                <div className="featured-badge">NEW & FEATURED</div>
                <div className="card-actions">
                  <button 
                    className="btn-primary"
                    onClick={() => handleTabChange('bits-simulator')}
                  >
                    Start BITS Trading
                  </button>
                  <span className="btn-secondary disabled">
                    Real-time Data
                  </span>
                </div>
              </div>

              <div className="trading-card">
                <div className="card-icon">
                  <i className="fab fa-bitcoin"></i>
                </div>
                <h3>STX Paper Trading</h3>
                <p>Practice trading Stacks (STX) with real-time price feeds</p>
                <div className="card-actions">
                  <button 
                    className="btn-primary"
                    onClick={() => handleTabChange('stx')}
                  >
                    Start STX Trading
                  </button>
                  <Link to="/paper-trade/stx" className="btn-secondary">
                    Direct Link
                  </Link>
                </div>
              </div>

              <div className="trading-card">
                <div className="card-icon">
                  <i className="fas fa-gamepad"></i>
                </div>
                <h3>Legacy Trading</h3>
                <p>Simple token trading simulation with basic features</p>
                <div className="card-actions">
                  <button 
                    className="btn-primary"
                    onClick={() => handleTabChange('tokens')}
                  >
                    Start Legacy Trading
                  </button>
                  <Link to="/paper-trade/BITS" className="btn-secondary">
                    Trade BITS
                  </Link>
                </div>
              </div>
            </div>

            <div className="features-section">
              <h3>Paper Trading Features</h3>
              <div className="features-grid">
                <div className="feature-item">
                  <i className="fas fa-chart-area"></i>
                  <h4>Real-time Data</h4>
                  <p>Practice with live market data</p>
                </div>
                <div className="feature-item">
                  <i className="fas fa-wallet"></i>
                  <h4>Virtual Portfolio</h4>
                  <p>$10,000 starting balance</p>
                </div>
                <div className="feature-item">
                  <i className="fas fa-history"></i>
                  <h4>Trade History</h4>
                  <p>Track your performance</p>
                </div>
                <div className="feature-item">
                  <i className="fas fa-trophy"></i>
                  <h4>Risk-Free Learning</h4>
                  <p>Learn without losing money</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stx' && (
          <div className="stx-trading-section">
            <div className="trading-header-controls">
              <button 
                className="back-to-overview-btn"
                onClick={() => handleTabChange('overview')}
              >
                <i className="fas fa-arrow-left"></i>
                Back to Overview
              </button>
            </div>
            <STXPaperTrade />
          </div>
        )}

        {activeTab === 'tokens' && (
          <div className="token-trading-section">
            <div className="trading-header-controls">
              <button 
                className="back-to-overview-btn"
                onClick={() => handleTabChange('overview')}
              >
                <i className="fas fa-arrow-left"></i>
                Back to Overview
              </button>
            </div>
            <TokenPaperTrade />
          </div>
        )}
      </div>
    </div>
  );
};

export default PaperTradingPage;
