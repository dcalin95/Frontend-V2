import React from 'react';
import { motion } from 'framer-motion';

const Layer2Solutions = () => {
  return (
    <motion.div className="educational-page">
      <div className="page-header">
        <h1 className="page-title">
          <span className="title-icon">🚀</span>
          Layer 2 Solutions
        </h1>
        <p className="page-subtitle">Scaling Bitcoin for mass adoption</p>
      </div>
      
      <div className="content-section">
        <h2>Scaling Bitcoin Infrastructure</h2>
        <p>Layer 2 solutions build on top of Bitcoin to enable faster, cheaper transactions while maintaining the security and decentralization of the base layer.</p>
        
        <div className="key-features">
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Lightning Network</h3>
            <p>Instant Bitcoin payments through payment channels</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏗️</div>
            <h3>Stacks</h3>
            <p>Smart contracts and DeFi on Bitcoin</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔄</div>
            <h3>Sidechains</h3>
            <p>Independent blockchains pegged to Bitcoin</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Layer2Solutions;