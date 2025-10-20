import React from 'react';
import { motion } from 'framer-motion';

const AiPricePrediction = () => {
  return (
    <motion.div className="educational-page">
      <div className="page-header">
        <h1 className="page-title">
          <span className="title-icon">📈</span>
          AI Price Prediction
        </h1>
        <p className="page-subtitle">Machine learning for crypto market analysis</p>
      </div>

      <div className="content-grid">
        <div className="content-section">
          <h2>AI-Powered Market Intelligence</h2>
          <p>
            AI price prediction uses machine learning algorithms to analyze vast amounts 
            of market data, social sentiment, and on-chain metrics to forecast cryptocurrency 
            price movements with increasing accuracy.
          </p>
          
          <div className="key-features">
            <div className="feature-card">
              <div className="feature-icon">🧠</div>
              <h3>Neural Networks</h3>
              <p>Deep learning models identify complex market patterns</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Multi-Factor Analysis</h3>
              <p>Combines technical, fundamental, and sentiment data</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Real-Time Processing</h3>
              <p>Instant analysis of market changes and news events</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Adaptive Learning</h3>
              <p>Models improve accuracy through continuous learning</p>
            </div>
          </div>
        </div>
      </div>

      <div className="ai-models-section">
        <h2>AI Prediction Models</h2>
        <div className="models-grid">
          <div className="model-card">
            <div className="model-icon">🕸️</div>
            <h3>LSTM Networks</h3>
            <p>Long Short-Term Memory networks excel at time series prediction</p>
            <div className="model-accuracy">Accuracy: 65-75%</div>
          </div>
          <div className="model-card">
            <div className="model-icon">🌳</div>
            <h3>Random Forest</h3>
            <p>Ensemble method combining multiple decision trees</p>
            <div className="model-accuracy">Accuracy: 60-70%</div>
          </div>
          <div className="model-card">
            <div className="model-icon">🤖</div>
            <h3>Transformer Models</h3>
            <p>Advanced attention mechanisms for pattern recognition</p>
            <div className="model-accuracy">Accuracy: 70-80%</div>
          </div>
          <div className="model-card">
            <div className="model-icon">🔗</div>
            <h3>Ensemble Methods</h3>
            <p>Combining multiple models for improved predictions</p>
            <div className="model-accuracy">Accuracy: 75-85%</div>
          </div>
        </div>
      </div>

      <div className="data-sources">
        <h2>AI Data Sources</h2>
        <div className="sources-grid">
          <div className="source-category">
            <h3>📊 Market Data</h3>
            <ul>
              <li>Price movements & volume</li>
              <li>Order book depth</li>
              <li>Trading patterns</li>
              <li>Volatility metrics</li>
            </ul>
          </div>
          <div className="source-category">
            <h3>⛓️ On-Chain Data</h3>
            <ul>
              <li>Transaction volumes</li>
              <li>Wallet movements</li>
              <li>Network activity</li>
              <li>Mining metrics</li>
            </ul>
          </div>
          <div className="source-category">
            <h3>🗞️ Sentiment Data</h3>
            <ul>
              <li>Social media mentions</li>
              <li>News sentiment</li>
              <li>Fear & Greed Index</li>
              <li>Search trends</li>
            </ul>
          </div>
          <div className="source-category">
            <h3>🌍 Macro Data</h3>
            <ul>
              <li>Economic indicators</li>
              <li>Regulatory news</li>
              <li>Traditional markets</li>
              <li>Adoption metrics</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AiPricePrediction;