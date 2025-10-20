import React from 'react';
import { motion } from 'framer-motion';

const DefiOnBitcoin = () => {
  return (
    <motion.div className="educational-page">
      <div className="page-header">
        <h1 className="page-title">
          <span className="title-icon">🏦</span>
          DeFi on Bitcoin
        </h1>
        <p className="page-subtitle">Decentralized finance powered by Bitcoin security</p>
      </div>
      
      <div className="content-section">
        <h2>Bitcoin-Secured DeFi</h2>
        <p>Through Stacks, Bitcoin holders can access DeFi protocols while benefiting from Bitcoin's unparalleled security and decentralization.</p>
        
        <div className="key-features">
          <div className="feature-card">
            <div className="feature-icon">💧</div>
            <h3>Liquidity Pools</h3>
            <p>Provide liquidity and earn yields with Bitcoin-backed assets</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Lending Protocols</h3>
            <p>Lend and borrow using Bitcoin as collateral</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔄</div>
            <h3>Decentralized Swaps</h3>
            <p>Trade Bitcoin-based assets without intermediaries</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DefiOnBitcoin;