import React from 'react';
import { motion } from 'framer-motion';

const SbtcXbtc = () => {
  return (
    <motion.div className="educational-page">
      <div className="page-header">
        <h1 className="page-title">
          <span className="title-icon">₿</span>
          sBTC & xBTC
        </h1>
        <p className="page-subtitle">Bitcoin on Stacks ecosystem</p>
      </div>
      
      <div className="content-section">
        <h2>Bitcoin-Backed Assets</h2>
        <p>sBTC and xBTC bring Bitcoin functionality to the Stacks ecosystem, enabling Bitcoin holders to participate in DeFi while maintaining Bitcoin backing.</p>
        
        <div className="key-features">
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>1:1 Bitcoin Backing</h3>
            <p>Each token is backed by real Bitcoin in secure custody</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌉</div>
            <h3>Cross-Chain Bridge</h3>
            <p>Seamless movement between Bitcoin and Stacks</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏦</div>
            <h3>DeFi Integration</h3>
            <p>Use Bitcoin in lending, AMMs, and other DeFi protocols</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SbtcXbtc;