import React from 'react';
import { motion } from 'framer-motion';

const BitcoinOrdinals = () => {
  return (
    <motion.div className="educational-page">
      <div className="page-header">
        <h1 className="page-title">
          <span className="title-icon">🎨</span>
          Bitcoin Ordinals
        </h1>
        <p className="page-subtitle">NFTs and digital artifacts on Bitcoin</p>
      </div>
      
      <div className="content-section">
        <h2>Digital Art on Bitcoin</h2>
        <p>Ordinals enable inscribing digital content directly onto individual satoshis, creating NFTs and digital artifacts secured by Bitcoin's immutable blockchain.</p>
        
        <div className="key-features">
          <div className="feature-card">
            <div className="feature-icon">🪙</div>
            <h3>Satoshi Inscription</h3>
            <p>Data inscribed directly onto individual satoshis</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🖼️</div>
            <h3>Native Bitcoin NFTs</h3>
            <p>No bridges or side chains required</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Immutable Storage</h3>
            <p>Content stored forever on Bitcoin blockchain</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BitcoinOrdinals;