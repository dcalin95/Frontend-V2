import React from 'react';
import { motion } from 'framer-motion';

const AmmExplained = () => {
  return (
    <motion.div className="educational-page">
      <div className="page-header">
        <h1 className="page-title">
          <span className="title-icon">🤖</span>
          Automated Market Makers
        </h1>
        <p className="page-subtitle">How AMMs power decentralized trading</p>
      </div>
      
      <div className="content-section">
        <h2>Liquidity Without Order Books</h2>
        <p>AMMs replace traditional order books with mathematical formulas and liquidity pools, enabling continuous trading and price discovery.</p>
        
        <div className="key-features">
          <div className="feature-card">
            <div className="feature-icon">📐</div>
            <h3>Mathematical Formula</h3>
            <p>Constant product formula (x * y = k) determines prices</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💧</div>
            <h3>Liquidity Pools</h3>
            <p>Users provide paired tokens to enable trading</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Instant Trading</h3>
            <p>No need to wait for matching buyers and sellers</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AmmExplained;