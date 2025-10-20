import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const Sip010Tokens = () => {
  const [tokenMetrics, setTokenMetrics] = useState({
    totalTokens: 1247,
    totalSupply: '847.2M',
    activeContracts: 892,
    dailyTransfers: 45672
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTokenMetrics(prev => ({
        totalTokens: prev.totalTokens + Math.floor(Math.random() * 3),
        totalSupply: prev.totalSupply,
        activeContracts: prev.activeContracts + Math.floor(Math.random() * 2),
        dailyTransfers: prev.dailyTransfers + Math.floor(Math.random() * 100)
      }));
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      className="educational-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Header Section */}
      <motion.div 
        className="page-header"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.h1 
          className="page-title ai-title"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
        >
          <span className="title-icon">🪙</span>
          SIP-010 Token Revolution
        </motion.h1>

        <motion.p 
          className="page-subtitle ai-subtitle"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          AI-Enhanced Fungible Token Standard for Bitcoin-Secured DeFi
        </motion.p>

        <motion.p 
          className="page-intro ai-intro"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          Discover the power of SIP-010 tokens on Stacks - the first smart contract platform secured by Bitcoin. 
          Build DeFi applications with Clarity's predictable smart contracts and Bitcoin's unmatched security.
        </motion.p>
      </motion.div>

      {/* SIP-010 Token Analytics Hub */}
      <motion.div 
        className="sip010-analytics-hub"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div className="analytics-header">
          <div className="analytics-title-section">
            <motion.div 
              className="token-visualizer"
              animate={{ 
                rotateY: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="token-icon">🪙</div>
              <div className="token-field">
                <motion.div 
                  className="token-particle"
                  animate={{
                    rotate: [0, 360],
                    scale: [0.8, 1.2, 0.8]
                  }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0 }}
                />
                <motion.div 
                  className="token-particle"
                  animate={{
                    rotate: [360, 0],
                    scale: [1.2, 0.8, 1.2]
                  }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                />
                <motion.div 
                  className="token-particle"
                  animate={{
                    rotate: [180, 540],
                    scale: [1, 0.5, 1]
                  }}
                  transition={{ duration: 3, repeat: Infinity, delay: 2 }}
                />
              </div>
            </motion.div>
            
            <div className="analytics-info">
              <h2>SIP-010 Token Analytics Hub</h2>
              <p>Real-Time Token Economy Intelligence & Smart Contract Analytics</p>
              <div className="analytics-description">
                Advanced monitoring of SIP-010 token ecosystem on Stacks, including contract interactions, 
                token transfers, and DeFi protocol analytics powered by Bitcoin's security.
              </div>
            </div>
          </div>
          
          <div className="clarity-intelligence-panel">
            <div className="intelligence-header">
              <motion.div 
                className="ai-clarity"
                animate={{ 
                  scale: [1, 1.3, 1],
                  filter: ["hue-rotate(0deg)", "hue-rotate(120deg)", "hue-rotate(0deg)"]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                🧠
              </motion.div>
              <div className="panel-title">
                <span className="panel-label">Clarity Intelligence</span>
                <span className="panel-status">Smart Contract Analysis Active</span>
              </div>
            </div>
            
            <div className="intelligence-metrics">
              <div className="intelligence-metric">
                <span className="metric-value">100%</span>
                <span className="metric-label">Contract Safety</span>
                <span className="metric-trend positive">↗ Predictable</span>
              </div>
              <div className="intelligence-metric">
                <span className="metric-value">0</span>
                <span className="metric-label">Vulnerabilities</span>
                <span className="metric-trend positive">↗ Secure</span>
              </div>
              <div className="intelligence-metric">
                <span className="metric-value">₿</span>
                <span className="metric-label">Bitcoin Secured</span>
                <span className="metric-trend positive">↗ Immutable</span>
              </div>
            </div>
          </div>
        </div>

        <div className="token-analysis">
          <div className="analysis-grid">
            <motion.div 
              className="analytics-card primary"
              whileHover={{ scale: 1.02, y: -3 }}
            >
              <div className="card-header">
                <div className="card-icon">📊</div>
                <div className="card-title">Token Ecosystem Overview</div>
                <div className="card-badge live">LIVE</div>
              </div>
              <div className="ecosystem-stats">
                <div className="stat-primary">
                  <span className="stat-value">{tokenMetrics.totalTokens.toLocaleString()}</span>
                  <span className="stat-label">SIP-010 Tokens</span>
                </div>
                <div className="stat-grid">
                  <div className="stat-item">
                    <span className="stat-number">{tokenMetrics.totalSupply}</span>
                    <span className="stat-desc">Total Supply</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{tokenMetrics.activeContracts.toLocaleString()}</span>
                    <span className="stat-desc">Active Contracts</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{tokenMetrics.dailyTransfers.toLocaleString()}</span>
                    <span className="stat-desc">Daily Transfers</span>
                  </div>
                </div>
              </div>
              <div className="ecosystem-visualization">
                <div className="token-flow">
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="flow-token"
                      animate={{
                        y: [0, -15, 0],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        delay: i * 0.3 
                      }}
                      style={{
                        left: `${15 + i * 12}%`,
                        top: `${30 + Math.sin(i) * 20}%`
                      }}
                    >
                      🪙
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="analytics-card"
              whileHover={{ scale: 1.02, y: -3 }}
            >
              <div className="card-header">
                <div className="card-icon">🔧</div>
                <div className="card-title">Clarity Smart Contracts</div>
                <div className="card-badge ai">AI</div>
              </div>
              <div className="clarity-features">
                <div className="feature-showcase">
                  <div className="showcase-item">
                    <span className="showcase-icon">🔒</span>
                    <div className="showcase-content">
                      <span className="showcase-title">Predictable Execution</span>
                      <span className="showcase-desc">No surprises in contract behavior</span>
                    </div>
                  </div>
                  <div className="showcase-item">
                    <span className="showcase-icon">👁️</span>
                    <div className="showcase-content">
                      <span className="showcase-title">Human Readable</span>
                      <span className="showcase-desc">Lisp-based syntax for clarity</span>
                    </div>
                  </div>
                  <div className="showcase-item">
                    <span className="showcase-icon">🛡️</span>
                    <div className="showcase-content">
                      <span className="showcase-title">Decidable</span>
                      <span className="showcase-desc">Analyzable before deployment</span>
                    </div>
                  </div>
                </div>
                <div className="clarity-code-preview">
                  <div className="code-header">
                    <span className="code-title">SIP-010 Standard Functions</span>
                  </div>
                  <div className="code-content">
                    <div className="code-line">
                      <span className="code-function">(transfer</span>
                      <span className="code-param">amount sender recipient memo)</span>
                    </div>
                    <div className="code-line">
                      <span className="code-function">(get-balance</span>
                      <span className="code-param">account)</span>
                    </div>
                    <div className="code-line">
                      <span className="code-function">(get-total-supply)</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="analytics-card"
              whileHover={{ scale: 1.02, y: -3 }}
            >
              <div className="card-header">
                <div className="card-icon">🔄</div>
                <div className="card-title">DeFi Integration</div>
                <div className="card-badge ml">DeFi</div>
              </div>
              <div className="defi-protocols">
                <div className="protocol-list">
                  <div className="protocol-item">
                    <div className="protocol-icon">💱</div>
                    <div className="protocol-info">
                      <span className="protocol-name">DEX Trading</span>
                      <span className="protocol-status active">Active</span>
                    </div>
                    <div className="protocol-volume">$2.4M</div>
                  </div>
                  <div className="protocol-item">
                    <div className="protocol-icon">🏦</div>
                    <div className="protocol-info">
                      <span className="protocol-name">Lending Pools</span>
                      <span className="protocol-status active">Active</span>
                    </div>
                    <div className="protocol-volume">$890K</div>
                  </div>
                  <div className="protocol-item">
                    <div className="protocol-icon">🎯</div>
                    <div className="protocol-info">
                      <span className="protocol-name">Yield Farming</span>
                      <span className="protocol-status active">Active</span>
                    </div>
                    <div className="protocol-volume">$1.2M</div>
                  </div>
                </div>
                <div className="tvl-indicator">
                  <span className="tvl-label">Total Value Locked</span>
                  <span className="tvl-value">$4.49M</span>
                  <span className="tvl-change positive">+12.3%</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="analytics-card"
              whileHover={{ scale: 1.02, y: -3 }}
            >
              <div className="card-header">
                <div className="card-icon">₿</div>
                <div className="card-title">Bitcoin Security</div>
                <div className="card-badge btc">BTC</div>
              </div>
              <div className="security-metrics">
                <div className="security-feature">
                  <div className="feature-visual">
                    <motion.div 
                      className="bitcoin-shield"
                      animate={{ 
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      ₿
                    </motion.div>
                  </div>
                  <div className="feature-details">
                    <span className="feature-title">Proof of Transfer</span>
                    <span className="feature-desc">100% Bitcoin finality</span>
                  </div>
                </div>
                <div className="security-stats">
                  <div className="security-stat">
                    <span className="stat-icon">🔗</span>
                    <div className="stat-info">
                      <span className="stat-name">Block Finality</span>
                      <span className="stat-value">Bitcoin-secured</span>
                    </div>
                  </div>
                  <div className="security-stat">
                    <span className="stat-icon">⚡</span>
                    <div className="stat-info">
                      <span className="stat-name">Settlement Time</span>
                      <span className="stat-value">~10 minutes</span>
                    </div>
                  </div>
                  <div className="security-stat">
                    <span className="stat-icon">🛡️</span>
                    <div className="stat-info">
                      <span className="stat-name">Security Model</span>
                      <span className="stat-value">Bitcoin hashrate</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Sip010Tokens;