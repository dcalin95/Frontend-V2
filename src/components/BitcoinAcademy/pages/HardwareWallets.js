import React from 'react';
import { motion } from 'framer-motion';

const HardwareWallets = () => {
  return (
    <motion.div className="educational-page">
      <div className="page-header">
        <h1 className="page-title">
          <span className="title-icon">🔐</span>
          Hardware Wallets
        </h1>
        <p className="page-subtitle">Cold storage security for cryptocurrency protection</p>
      </div>
      
      <div className="content-section">
        <h2>Ultimate Cold Storage Security</h2>
        <p>Hardware wallets provide the highest level of security by keeping private keys offline in specialized devices, protecting against online threats and malware.</p>
        
        <div className="key-features">
          <div className="feature-card">
            <div className="feature-icon">❄️</div>
            <h3>Offline Storage</h3>
            <p>Private keys never connect to the internet</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure Element</h3>
            <p>Military-grade chips protect against physical attacks</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🖊️</div>
            <h3>Transaction Signing</h3>
            <p>Sign transactions securely on the device</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HardwareWallets;