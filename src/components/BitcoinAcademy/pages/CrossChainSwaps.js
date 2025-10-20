import React from 'react';
import { motion } from 'framer-motion';

const CrossChainSwaps = () => {
  return (
    <motion.div className="educational-page">
      <div className="page-header">
        <h1 className="page-title">
          <span className="title-icon">🌉</span>
          Cross-Chain Swaps
        </h1>
        <p className="page-subtitle">Trading assets across different blockchains</p>
      </div>
      
      <div className="content-section">
        <h2>Bridging Blockchain Ecosystems</h2>
        <p>Cross-chain swaps enable users to trade tokens between different blockchains without centralized exchanges, unlocking liquidity across ecosystems.</p>
        
        <div className="key-features">
          <div className="feature-card">
            <div className="feature-icon">🔗</div>
            <h3>Blockchain Bridges</h3>
            <p>Secure protocols connecting different networks</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Atomic Swaps</h3>
            <p>Trustless exchanges using smart contracts</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💧</div>
            <h3>Unified Liquidity</h3>
            <p>Access liquidity from multiple blockchains</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CrossChainSwaps;