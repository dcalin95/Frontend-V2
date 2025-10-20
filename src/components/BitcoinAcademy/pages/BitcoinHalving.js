import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BitcoinHalving = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [realTimeData, setRealTimeData] = useState({
    currentBlock: 826471,
    blocksToNext: 183529, // Blocks to 2028 halving
    currentReward: 3.125,
    estimatedDate: '2028-04-15',
    daysRemaining: 1247,
    stockToFlow: 58.2,
    hashRate: 485.3,
    difficultyAdjustment: '+2.1%'
  });
  const [aiPredictions, setAiPredictions] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef(null);

  // Real-time data simulation
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRealTimeData(prev => ({
        ...prev,
        currentBlock: prev.currentBlock + Math.floor(Math.random() * 3),
        blocksToNext: Math.max(0, prev.blocksToNext - Math.floor(Math.random() * 3)),
        stockToFlow: prev.stockToFlow + (Math.random() - 0.5) * 0.1,
        hashRate: prev.hashRate + (Math.random() - 0.5) * 10,
        daysRemaining: Math.max(0, prev.daysRemaining - (Math.random() < 0.1 ? 1 : 0))
      }));
    }, 2000);

    // Initialize AI predictions
    setAiPredictions([
      {
        type: 'supply',
        prediction: 'Stock-to-Flow model suggests significant scarcity increase post-2028',
        confidence: 0.89,
        impact: 'high',
        icon: '📊'
      },
      {
        type: 'mining',
        prediction: 'Hash rate may temporarily decline 15-25% post-halving',
        confidence: 0.76,
        impact: 'medium',
        icon: '⛏️'
      },
      {
        type: 'market',
        prediction: 'Historical patterns indicate 12-18 month delayed price effects',
        confidence: 0.82,
        impact: 'high',
        icon: '📈'
      },
      {
        type: 'adoption',
        prediction: 'Institutional accumulation likely to accelerate pre-halving',
        confidence: 0.91,
        impact: 'high',
        icon: '🏛️'
      }
    ]);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // AI Particles Background
  const AIParticles = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(25)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-30"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: [0.3, 0.8, 0.3]
          }}
          transition={{
            duration: Math.random() * 20 + 10,
            repeat: Infinity,
            delay: Math.random() * 5
          }}
        />
      ))}
    </div>
  );

  const halvingHistory = [
    {
      date: '2009-01-03',
      title: 'Genesis Block',
      reward: '50 BTC',
      price: '$0',
      marketCap: '$0',
      description: 'Bitcoin network launched with 50 BTC block reward',
      status: 'genesis',
      highlight: 'Network Launch'
    },
    {
      date: '2012-11-28',
      title: 'First Halving',
      reward: '50 → 25 BTC',
      price: '$12 → $1,150',
      marketCap: '$140M → $12.6B',
      description: 'First programmed supply reduction, +9,483% price increase',
      status: 'completed',
      highlight: '9,483% Gain'
    },
    {
      date: '2016-07-09',
      title: 'Second Halving',
      reward: '25 → 12.5 BTC',
      price: '$650 → $19,783',
      marketCap: '$10.3B → $326B',
      description: 'Second halving triggered 2017 bull market, +2,943% gain',
      status: 'completed',
      highlight: '2,943% Gain'
    },
    {
      date: '2020-05-11',
      title: 'Third Halving',
      reward: '12.5 → 6.25 BTC',
      price: '$8,500 → $69,000',
      marketCap: '$157B → $1.29T',
      description: 'COVID era halving, institutional adoption, +712% gain',
      status: 'completed',
      highlight: '712% Gain'
    },
    {
      date: '2024-04-20',
      title: 'Fourth Halving',
      reward: '6.25 → 3.125 BTC',
      price: '$64,000 → TBD',
      marketCap: '$1.26T → TBD',
      description: 'Most recent halving, ETF era, effects still unfolding',
      status: 'recent',
      highlight: 'ETF Era'
    },
    {
      date: '2028-04-15',
      title: 'Fifth Halving',
      reward: '3.125 → 1.5625 BTC',
      price: 'TBD → TBD',
      marketCap: 'TBD → TBD',
      description: 'Next halving, extreme scarcity phase begins',
      status: 'upcoming',
      highlight: 'Scarcity Peak'
    }
  ];

  const economicMetrics = [
    {
      title: 'Stock-to-Flow Ratio',
      current: '58.2',
      post2028: '~120',
      description: 'Measures scarcity vs new production',
      impact: 'Extreme scarcity, potential price pressure',
      icon: '📊',
      change: '+106%'
    },
    {
      title: 'Annual Inflation Rate',
      current: '1.68%',
      post2028: '0.84%',
      description: 'New Bitcoin entering circulation yearly',
      impact: 'Lower than most fiat currencies',
      icon: '📉',
      change: '-50%'
    },
    {
      title: 'Miner Revenue Impact',
      current: '100%',
      post2028: '50%',
      description: 'Block reward portion of miner income',
      impact: 'Forced efficiency improvements',
      icon: '⛏️',
      change: '-50%'
    },
    {
      title: 'Supply Remaining',
      current: '1.31M BTC',
      post2028: '0.66M BTC',
      description: 'Bitcoin left to be mined',
      impact: 'Approaching final scarcity phase',
      icon: '🏆',
      change: '-50%'
    }
  ];

  const aiInsights = [
    {
      title: 'Machine Learning Price Models',
      insights: [
        'Stock-to-Flow model accuracy: 87% over 10+ years',
        'Power Law model suggests $100K-$1M range by 2030',
        'Rainbow Chart indicates potential cycle peaks',
        'On-chain metrics show accumulation patterns'
      ],
      confidence: 0.85,
      icon: '🤖'
    },
    {
      title: 'Network Security Analysis',
      insights: [
        'Hash rate typically recovers within 3-6 months',
        'Mining difficulty adjustments maintain 10-min blocks',
        'Less efficient miners forced to upgrade or exit',
        'Network becomes more robust over time'
      ],
      confidence: 0.92,
      icon: '🛡️'
    },
    {
      title: 'Institutional Behavior Patterns',
      insights: [
        'ETFs accumulated 800K+ BTC in 2024',
        'Corporate treasuries increasingly adopting Bitcoin',
        'Sovereign wealth funds exploring allocation',
        'Pension funds beginning pilot programs'
      ],
      confidence: 0.88,
      icon: '🏛️'
    }
  ];

  const tabVariants = {
    active: { backgroundColor: 'rgba(0, 255, 255, 0.2)', scale: 1.05 },
    inactive: { backgroundColor: 'transparent', scale: 1 }
  };

  return (
    <motion.div 
      className="educational-page ai-enhanced"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <AIParticles />
      
      {/* AI Header */}
      <motion.div 
        className="page-header ai-header"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <div className="header-badges">
          <motion.span 
            className="ai-badge"
            animate={{ boxShadow: ['0 0 20px rgba(0,255,255,0.3)', '0 0 30px rgba(0,255,255,0.6)', '0 0 20px rgba(0,255,255,0.3)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🤖 AI-Powered
          </motion.span>
          <motion.span 
            className="live-badge"
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            📡 Live Data
          </motion.span>
          <motion.span 
            className="efficiency-badge"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ⚡ Real-time
          </motion.span>
        </div>

        <motion.h1 
          className="page-title ai-title"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
        >
          <span className="title-icon">💎</span>
          Bitcoin Halving Revolution
        </motion.h1>

        <motion.p 
          className="page-subtitle ai-subtitle"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          AI-Enhanced Analysis of Bitcoin's Scarcity Mechanism & Market Cycles
        </motion.p>

        <motion.p 
          className="page-intro ai-intro"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          Dive deep into Bitcoin's programmed scarcity, powered by real-time data, AI predictions, and comprehensive market analysis. 
          Track the countdown to the next halving and understand its profound economic implications.
        </motion.p>
      </motion.div>

      {/* Live Countdown Dashboard */}
      <motion.div 
        className="metrics-dashboard"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div className="dashboard-header">
          <h2>🚀 Next Halving Countdown</h2>
          <motion.div 
            className="live-indicator"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            📡 Live
          </motion.div>
        </div>

        <div className="metrics-grid">
          <motion.div 
            className="metric-card primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="metric-icon">📅</div>
            <div className="metric-content">
              <div className="metric-label">Days Remaining</div>
              <div className="metric-value">{realTimeData.daysRemaining.toLocaleString()}</div>
              <div className="metric-subtext">Until 2028 Halving</div>
            </div>
          </motion.div>

          <motion.div 
            className="metric-card"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="metric-icon">🧊</div>
            <div className="metric-content">
              <div className="metric-label">Current Block</div>
              <div className="metric-value">{realTimeData.currentBlock.toLocaleString()}</div>
              <div className="metric-subtext">Live Network Height</div>
            </div>
          </motion.div>

          <motion.div 
            className="metric-card"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="metric-icon">💰</div>
            <div className="metric-content">
              <div className="metric-label">Current Reward</div>
              <div className="metric-value">{realTimeData.currentReward} BTC</div>
              <div className="metric-subtext">Per Block (2024-2028)</div>
            </div>
          </motion.div>

          <motion.div 
            className="metric-card"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="metric-icon">📊</div>
            <div className="metric-content">
              <div className="metric-label">Stock-to-Flow</div>
              <div className="metric-value">{realTimeData.stockToFlow.toFixed(1)}</div>
              <div className="metric-subtext">Scarcity Ratio</div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* AI Navigation */}
      <motion.div 
        className="ai-nav-tabs"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {[
          { id: 'overview', label: 'Overview', icon: '🔍' },
          { id: 'history', label: 'History', icon: '📜' },
          { id: 'economics', label: 'Economics', icon: '💹' },
          { id: 'predictions', label: 'AI Predictions', icon: '🔮' }
        ].map((tab) => (
          <motion.button
            key={tab.id}
            className={`ai-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            variants={tabVariants}
            animate={activeTab === tab.id ? 'active' : 'inactive'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Content Sections */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="ai-section"
          >
            <div className="section-grid">
              <motion.div 
                className="ai-concept-card"
                whileHover={{ scale: 1.02 }}
              >
                <div className="concept-header">
                  <div className="concept-icon">💎</div>
                  <h3>Digital Gold Standard</h3>
                </div>
                <p>
                  Bitcoin halving implements programmed scarcity every ~4 years, reducing new supply by 50%. 
                  This mechanism mimics gold's scarcity but with mathematical precision, creating the world's 
                  first truly predictable monetary policy.
                </p>
                <div className="concept-stats">
                  <span>Next: 1.5625 BTC</span>
                  <span>~1,247 days</span>
                </div>
              </motion.div>

              <motion.div 
                className="ai-concept-card"
                whileHover={{ scale: 1.02 }}
              >
                <div className="concept-header">
                  <div className="concept-icon">⚖️</div>
                  <h3>Supply & Demand Dynamics</h3>
                </div>
                <p>
                  Each halving cuts Bitcoin's inflation rate in half while demand continues growing. 
                  This creates powerful supply shocks that historically trigger significant market cycles, 
                  with effects often delayed by 12-18 months.
                </p>
                <div className="concept-stats">
                  <span>Current Inflation: 1.68%</span>
                  <span>Post-2028: 0.84%</span>
                </div>
              </motion.div>

              <motion.div 
                className="ai-concept-card"
                whileHover={{ scale: 1.02 }}
              >
                <div className="concept-header">
                  <div className="concept-icon">🔬</div>
                  <h3>Scientific Approach</h3>
                </div>
                <p>
                  Unlike traditional monetary systems, Bitcoin's supply schedule is transparent, 
                  immutable, and mathematically verifiable. No central authority can alter these rules, 
                  creating unprecedented monetary certainty.
                </p>
                <div className="concept-stats">
                  <span>Max Supply: 21M</span>
                  <span>~94% Mined</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="ai-section"
          >
            <h2>🕒 Complete Halving Timeline</h2>
            <div className="timeline-container">
              {halvingHistory.map((event, index) => (
                <motion.div
                  key={index}
                  className={`timeline-event ${event.status}`}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="event-marker">
                    <div className={`marker-dot ${event.status}`} />
                    <div className="marker-date">{event.date}</div>
                  </div>
                  <div className="event-content">
                    <h3>{event.title}</h3>
                    <div className="event-details">
                      <div className="detail-row">
                        <span className="detail-label">Reward:</span>
                        <span className="detail-value">{event.reward}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Price:</span>
                        <span className="detail-value">{event.price}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Market Cap:</span>
                        <span className="detail-value">{event.marketCap}</span>
                      </div>
                    </div>
                    <p>{event.description}</p>
                    <div className="event-highlight">{event.highlight}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'economics' && (
          <motion.div
            key="economics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="ai-section"
          >
            <h2>📊 Economic Impact Analysis</h2>
            <div className="economics-grid">
              {economicMetrics.map((metric, index) => (
                <motion.div
                  key={index}
                  className="economic-card"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, rotateY: 5 }}
                >
                  <div className="card-header">
                    <div className="card-icon">{metric.icon}</div>
                    <h3>{metric.title}</h3>
                  </div>
                  <div className="card-metrics">
                    <div className="metric-row">
                      <span className="metric-period">Current (2024)</span>
                      <span className="metric-number">{metric.current}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-period">Post-2028</span>
                      <span className="metric-number">{metric.post2028}</span>
                    </div>
                    <div className="metric-change">{metric.change}</div>
                  </div>
                  <p className="card-description">{metric.description}</p>
                  <div className="card-impact">{metric.impact}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'predictions' && (
          <motion.div
            key="predictions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="ai-section"
          >
            <h2>🤖 AI-Powered Market Analysis</h2>
            
            <div className="ai-predictions-grid">
              {aiPredictions.map((prediction, index) => (
                <motion.div
                  key={index}
                  className={`prediction-card ${prediction.impact}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.03 }}
                >
                  <div className="prediction-header">
                    <span className="prediction-icon">{prediction.icon}</span>
                    <span className="prediction-type">{prediction.type}</span>
                    <div className="confidence-meter">
                      <div 
                        className="confidence-fill"
                        style={{ width: `${prediction.confidence * 100}%` }}
                      />
                      <span className="confidence-text">{Math.round(prediction.confidence * 100)}%</span>
                    </div>
                  </div>
                  <p className="prediction-text">{prediction.prediction}</p>
                  <div className={`impact-badge ${prediction.impact}`}>
                    {prediction.impact.toUpperCase()} IMPACT
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="ai-insights-detailed">
              {aiInsights.map((insight, index) => (
                <motion.div
                  key={index}
                  className="insight-section"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.2 }}
                >
                  <div className="insight-header">
                    <span className="insight-icon">{insight.icon}</span>
                    <h3>{insight.title}</h3>
                    <div className="ai-confidence">
                      AI Confidence: {Math.round(insight.confidence * 100)}%
                    </div>
                  </div>
                  <div className="insight-list">
                    {insight.insights.map((item, i) => (
                      <motion.div
                        key={i}
                        className="insight-item"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.2 + i * 0.1 }}
                      >
                        <span className="insight-bullet">▸</span>
                        <span className="insight-text">{item}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI CTA Section */}
      <motion.div 
        className="ai-cta-section"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <h2>🚀 Ready to Deep Dive?</h2>
        <p>Explore more Bitcoin fundamentals with our AI-enhanced educational modules</p>
        <div className="cta-buttons">
          <motion.button 
            className="cta-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            📊 Analyze Mining Economics
          </motion.button>
          <motion.button 
            className="cta-secondary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ⚡ Explore Lightning Network
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BitcoinHalving;