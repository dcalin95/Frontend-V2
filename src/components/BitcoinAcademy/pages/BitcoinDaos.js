import React from 'react';
import { motion } from 'framer-motion';

const BitcoinDaos = () => {
  return (
    <motion.div className="educational-page">
      <div className="page-header">
        <h1 className="page-title">
          <span className="title-icon">🏛️</span>
          Bitcoin DAOs
        </h1>
        <p className="page-subtitle">Decentralized governance powered by Bitcoin</p>
      </div>
      
      <div className="content-section">
        <h2>Decentralized Governance</h2>
        <p>Bitcoin DAOs leverage Stacks smart contracts to enable decentralized governance and decision-making while being secured by Bitcoin's network.</p>
        
        <div className="key-features">
          <div className="feature-card">
            <div className="feature-icon">🗳️</div>
            <h3>Voting Mechanisms</h3>
            <p>Token-weighted and stake-based governance systems</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Treasury Management</h3>
            <p>Decentralized control of community funds</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <h3>Proposal System</h3>
            <p>Community-driven improvement proposals</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BitcoinDaos;