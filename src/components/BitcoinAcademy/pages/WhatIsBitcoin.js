import React from 'react';
import { motion } from 'framer-motion';
import AIInfographic from '../components/AIInfographic';
import BitcoinChart from '../components/BitcoinChart';
import BitcoinTimeline from '../components/BitcoinTimeline';
import BitcoinCalculator from '../components/BitcoinCalculator';

const WhatIsBitcoin = () => {
  return (
    <motion.div 
      className="educational-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="page-header">
        <motion.h1 
          className="page-title"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <span className="title-icon">₿</span>
          What is Bitcoin?
        </motion.h1>
        <motion.p 
          className="page-subtitle"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          The world's first decentralized digital currency
        </motion.p>
      </div>

      <div className="content-grid">
        <motion.div 
          className="content-section"
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2>Digital Money, Real Value</h2>
          <p>
            Bitcoin is a peer-to-peer electronic cash system that enables direct transactions 
            between parties without requiring a trusted third party. Created in 2009 by the 
            pseudonymous Satoshi Nakamoto, it operates on a decentralized network.
          </p>
          
          <div className="key-features">
            <div className="feature-card">
              <div className="feature-icon">🌐</div>
              <h3>Decentralized</h3>
              <p>No central authority controls Bitcoin</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure</h3>
              <p>Cryptographic security protects your funds</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Digital</h3>
              <p>Exists only in digital form</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Scarce</h3>
              <p>Limited supply of 21 million coins</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="infographic-section"
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <AIInfographic 
            type="blockchain" 
            title="How Bitcoin Works" 
            animated={true}
          />
        </motion.div>
      </div>

      <motion.div 
        className="comparison-section"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <h2>Bitcoin vs Traditional Money</h2>
        <div className="comparison-table">
          <div className="comparison-row header">
            <div className="comparison-item">Feature</div>
            <div className="comparison-item">Traditional Money</div>
            <div className="comparison-item">Bitcoin</div>
          </div>
          <div className="comparison-row">
            <div className="comparison-item">Control</div>
            <div className="comparison-item">Central Banks</div>
            <div className="comparison-item">Decentralized Network</div>
          </div>
          <div className="comparison-row">
            <div className="comparison-item">Supply</div>
            <div className="comparison-item">Unlimited Printing</div>
            <div className="comparison-item">Fixed at 21M</div>
          </div>
          <div className="comparison-row">
            <div className="comparison-item">Transactions</div>
            <div className="comparison-item">Banks Required</div>
            <div className="comparison-item">Peer-to-Peer</div>
          </div>
          <div className="comparison-row">
            <div className="comparison-item">Transparency</div>
            <div className="comparison-item">Private Ledgers</div>
            <div className="comparison-item">Public Blockchain</div>
          </div>
        </div>
      </motion.div>

      <motion.div 
        className="quick-facts"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <h2>Bitcoin Key Stats</h2>
        <div className="facts-grid">
          <div className="fact-item">
            <span className="fact-number">2009</span>
            <span className="fact-label">Year Created</span>
          </div>
          <div className="fact-item">
            <span className="fact-number">21M</span>
            <span className="fact-label">Max Supply</span>
          </div>
          <div className="fact-item">
            <span className="fact-number">10min</span>
            <span className="fact-label">Block Time</span>
          </div>
          <div className="fact-item">
            <span className="fact-number">SHA-256</span>
            <span className="fact-label">Hash Algorithm</span>
          </div>
          <div className="fact-item">
            <span className="fact-number">19.7M</span>
            <span className="fact-label">Circulating Supply</span>
          </div>
          <div className="fact-item">
            <span className="fact-number">900+</span>
            <span className="fact-label">Trillion Market Cap</span>
          </div>
        </div>
      </motion.div>

      {/* Live Bitcoin Chart */}
      <motion.div 
        className="chart-section"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
      >
        <h2>Live Bitcoin Price</h2>
        <BitcoinChart type="area" height={400} />
      </motion.div>

      {/* Interactive Calculator */}
      <motion.div 
        className="calculator-section"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
      >
        <BitcoinCalculator />
      </motion.div>

      {/* Real-world Impact */}
      <motion.div 
        className="impact-section"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.4 }}
      >
        <h2>Bitcoin's Real-World Impact</h2>
        <div className="impact-grid">
          <div className="impact-card">
            <div className="impact-icon">🌍</div>
            <h3>Global Adoption</h3>
            <p>Over 106 million people worldwide own Bitcoin, making it the most widely adopted cryptocurrency.</p>
            <div className="impact-stat">106M+ Users</div>
          </div>
          
          <div className="impact-card">
            <div className="impact-icon">🏛️</div>
            <h3>Institutional Investment</h3>
            <p>Major corporations like Tesla, MicroStrategy, and El Salvador have added Bitcoin to their balance sheets.</p>
            <div className="impact-stat">$100B+ Corporate Holdings</div>
          </div>
          
          <div className="impact-card">
            <div className="impact-icon">💰</div>
            <h3>Store of Value</h3>
            <p>Often called "digital gold," Bitcoin has outperformed most traditional assets over the long term.</p>
            <div className="impact-stat">160% Annual Growth (10yr avg)</div>
          </div>
          
          <div className="impact-card">
            <div className="impact-icon">🔗</div>
            <h3>Financial Innovation</h3>
            <p>Bitcoin spawned an entire ecosystem of cryptocurrencies, DeFi, and blockchain applications.</p>
            <div className="impact-stat">2,000+ Cryptocurrencies</div>
          </div>
        </div>
      </motion.div>

      {/* Bitcoin Timeline */}
      <motion.div 
        className="timeline-section"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.6 }}
      >
        <BitcoinTimeline />
      </motion.div>
    </motion.div>
  );
};

export default WhatIsBitcoin;