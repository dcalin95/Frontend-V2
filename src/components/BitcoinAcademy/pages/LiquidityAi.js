import React from 'react';
import { motion } from 'framer-motion';

const LiquidityAi = () => {
  return (
    <motion.div className="educational-page">
      <div className="page-header">
        <h1 className="page-title">
          <span className="title-icon">💧</span>
          Liquidity Management AI
        </h1>
        <p className="page-subtitle">Automated strategies for optimal capital efficiency</p>
      </div>
      
      <div className="content-section">
        <h2>AI-Driven Capital Efficiency</h2>
        <p>Advanced AI systems manage liquidity positions across multiple protocols, optimizing yields while minimizing risks through intelligent automation.</p>
        
        <div className="key-features">
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Strategy Optimization</h3>
            <p>AI finds the best yield opportunities across protocols</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Auto-Compounding</h3>
            <p>Automatic reinvestment of rewards for maximum growth</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Risk Management</h3>
            <p>Dynamic hedging against market volatility</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LiquidityAi;