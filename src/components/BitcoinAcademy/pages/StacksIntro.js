import React from 'react';
import { motion } from 'framer-motion';
import AIInfographic from '../components/AIInfographic';

const StacksIntro = () => {
  return (
    <motion.div className="educational-page">
      <div className="page-header">
        <h1 className="page-title">
          <span className="title-icon">🏗️</span>
          What is Stacks?
        </h1>
        <p className="page-subtitle">Smart contracts for Bitcoin</p>
      </div>

      <div className="content-grid">
        <div className="content-section">
          <h2>Bitcoin-Powered Smart Contracts</h2>
          <p>
            Stacks is a layer-1 blockchain that enables smart contracts and 
            decentralized applications (DApps) for Bitcoin. It uses Bitcoin 
            as its base layer for security and finality.
          </p>
          
          <div className="stacks-features">
            <div className="feature-card">
              <div className="feature-icon">₿</div>
              <h3>Bitcoin Secured</h3>
              <p>Inherits Bitcoin's security</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📜</div>
              <h3>Smart Contracts</h3>
              <p>Clarity programming language</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌐</div>
              <h3>DApps</h3>
              <p>Decentralized applications</p>
            </div>
          </div>
        </div>

        <div className="infographic-section">
          <AIInfographic 
            type="stacks" 
            title="Stacks Architecture" 
            animated={true}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default StacksIntro;