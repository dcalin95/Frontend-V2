import React from 'react';
import { motion } from 'framer-motion';

const SentimentAnalysis = () => {
  return (
    <motion.div className="educational-page">
      <div className="page-header">
        <h1 className="page-title">
          <span className="title-icon">🎭</span>
          Sentiment Analysis
        </h1>
        <p className="page-subtitle">AI-driven market sentiment for trading insights</p>
      </div>
      
      <div className="content-section">
        <h2>Reading Market Emotions</h2>
        <p>AI sentiment analysis processes social media, news, and on-chain data to gauge market emotions and predict price movements based on collective sentiment.</p>
        
        <div className="key-features">
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Social Media Analysis</h3>
            <p>Twitter, Reddit, Discord sentiment tracking</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📰</div>
            <h3>News Sentiment</h3>
            <p>Real-time analysis of news and regulatory updates</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">😱</div>
            <h3>Fear & Greed Index</h3>
            <p>Market emotion indicators and crowd psychology</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SentimentAnalysis;