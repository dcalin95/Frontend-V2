import React from 'react';
import { motion } from 'framer-motion';

const HalvingEffects = () => {
  return (
    <motion.div className="educational-page">
      <div className="page-header">
        <h1 className="page-title">
          <span className="title-icon">📊</span>
          Halving Effects
        </h1>
        <p className="page-subtitle">Economic impact analysis of Bitcoin halvings</p>
      </div>
      
      <div className="content-section">
        <h2>Market Cycle Analysis</h2>
        <p>Bitcoin halvings create supply shocks that historically trigger major bull markets, with each cycle showing similar patterns but varying magnitudes and timelines.</p>
        
        <div className="key-features">
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Historical Patterns</h3>
            <p>Each halving has preceded significant price increases</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⏰</div>
            <h3>Time Delays</h3>
            <p>Price effects typically manifest 6-18 months later</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔢</div>
            <h3>Diminishing Returns</h3>
            <p>Each cycle shows smaller percentage gains</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HalvingEffects;