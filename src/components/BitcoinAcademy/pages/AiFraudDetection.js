import React from 'react';
import { motion } from 'framer-motion';

const AiFraudDetection = () => {
  return (
    <motion.div className="educational-page">
      <div className="page-header">
        <h1 className="page-title">
          <span className="title-icon">🛡️</span>
          AI Fraud Detection
        </h1>
        <p className="page-subtitle">AI-powered security systems for crypto protection</p>
      </div>
      
      <div className="content-section">
        <h2>Intelligent Security Monitoring</h2>
        <p>AI fraud detection systems analyze transaction patterns, wallet behaviors, and network anomalies to identify and prevent fraudulent activities in real-time.</p>
        
        <div className="key-features">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Pattern Recognition</h3>
            <p>Identifies suspicious transaction patterns and behaviors</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Real-Time Monitoring</h3>
            <p>Continuous surveillance of blockchain activities</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Risk Scoring</h3>
            <p>Assigns risk levels to addresses and transactions</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AiFraudDetection;