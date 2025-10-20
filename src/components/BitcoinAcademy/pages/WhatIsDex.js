import React from 'react';
import { motion } from 'framer-motion';

const WhatIsDex = () => {
  return (
    <motion.div className="educational-page">
      <div className="page-header">
        <h1 className="page-title">
          <span className="title-icon">🔄</span>
          What is a DEX?
        </h1>
        <p className="page-subtitle">Decentralized exchanges revolutionizing trading</p>
      </div>

      <div className="content-grid">
        <div className="content-section">
          <h2>Trading Without Intermediaries</h2>
          <p>
            A DEX (Decentralized Exchange) allows users to trade cryptocurrencies directly 
            with each other without requiring a central authority or intermediary. Smart contracts 
            handle the trading logic, ensuring trustless and permissionless transactions.
          </p>
          
          <div className="key-features">
            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <h3>Self-Custody</h3>
              <p>You control your private keys and funds at all times</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌐</div>
              <h3>Permissionless</h3>
              <p>Anyone can trade without KYC or geographical restrictions</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>Smart Contract Powered</h3>
              <p>Automated execution with transparent, immutable code</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💧</div>
              <h3>Liquidity Pools</h3>
              <p>Community-provided liquidity enables trading</p>
            </div>
          </div>
        </div>
      </div>

      <div className="comparison-section">
        <h2>CEX vs DEX Comparison</h2>
        <div className="comparison-table">
          <div className="comparison-row header">
            <div className="comparison-item">Feature</div>
            <div className="comparison-item">Centralized Exchange (CEX)</div>
            <div className="comparison-item">Decentralized Exchange (DEX)</div>
          </div>
          <div className="comparison-row">
            <div className="comparison-item">Custody</div>
            <div className="comparison-item">Exchange holds funds</div>
            <div className="comparison-item">User controls funds</div>
          </div>
          <div className="comparison-row">
            <div className="comparison-item">KYC Required</div>
            <div className="comparison-item">Yes</div>
            <div className="comparison-item">No</div>
          </div>
          <div className="comparison-row">
            <div className="comparison-item">Trading Speed</div>
            <div className="comparison-item">Instant</div>
            <div className="comparison-item">Blockchain dependent</div>
          </div>
          <div className="comparison-row">
            <div className="comparison-item">Fees</div>
            <div className="comparison-item">Trading fees</div>
            <div className="comparison-item">Gas + swap fees</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WhatIsDex;