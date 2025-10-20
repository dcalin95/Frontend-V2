import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProofOfWorkCard from './ProofOfWorkCard';

const BitcoinMining = () => {
  const [realTimeData, setRealTimeData] = useState({
    hashRate: 485.3,
    difficulty: 73.2,
    blockHeight: 820154,
    mempool: 12847,
    miners: 2150000,
    revenue: 15.2,
    energyConsumption: 150.8,
    networkNodes: 15624
  });

  const [activeHardware, setActiveHardware] = useState(2);
  const [miningAnimation, setMiningAnimation] = useState(false);
  const [showMetrics, setShowMetrics] = useState(true);
  const particlesRef = useRef(null);

  // Real-time data simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        ...prev,
        hashRate: prev.hashRate + (Math.random() - 0.5) * 10,
        mempool: Math.max(1000, prev.mempool + Math.floor((Math.random() - 0.5) * 500)),
        miners: prev.miners + Math.floor((Math.random() - 0.5) * 1000),
        revenue: prev.revenue + (Math.random() - 0.5) * 2
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // AI Particles Background
  const AIParticles = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-cyan-400 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: 0
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: Math.random() * 10 + 5,
            repeat: Infinity,
            delay: Math.random() * 5
          }}
        />
      ))}
    </div>
  );

  const miningSteps = [
    {
      id: 1,
      title: 'Transaction Collection',
      desc: 'AI algorithms select optimal transactions from mempool',
      icon: '📊',
      detail: 'Smart contract prioritization using ML models',
      time: '~30 seconds',
      efficiency: '99.2%'
    },
    {
      id: 2,
      title: 'Block Construction',
      desc: 'Neural networks optimize block structure',
      icon: '🧠',
      detail: 'Merkle tree optimization with quantum-resistant algorithms',
      time: '~10 seconds',
      efficiency: '97.8%'
    },
    {
      id: 3,
      title: 'Proof of Work',
      desc: 'ASIC miners execute SHA-256 computations',
      icon: '⚡',
      detail: 'Parallel processing across thousands of cores',
      time: '~10 minutes',
      efficiency: '95.5%'
    },
    {
      id: 4,
      title: 'Block Validation',
      desc: 'AI-powered consensus verification',
      icon: '✅',
      detail: 'Multi-layer validation with fraud detection',
      time: '~5 seconds',
      efficiency: '99.9%'
    },
    {
      id: 5,
      title: 'Network Propagation',
      desc: 'Intelligent routing across global nodes',
      icon: '🌐',
      detail: 'Optimized peer-to-peer broadcast protocols',
      time: '~30 seconds',
      efficiency: '98.1%'
    },
    {
      id: 6,
      title: 'Chain Extension',
      desc: 'Consensus achieved, blockchain extended',
      icon: '🔗',
      detail: 'Immutable addition to the longest chain',
      time: 'Instant',
      efficiency: '100%'
    }
  ];

  const hardwareEvolution = [
    {
      era: 'CPU Era',
      period: '2009-2010',
      icon: '💻',
      device: 'Intel Core i7',
      hashRate: '1-4 MH/s',
      power: '95W',
      efficiency: '0.04 MH/J',
      description: 'Satoshi and early adopters mined with regular computers',
      color: 'from-gray-600 to-gray-800',
      details: {
        adoption: '~1,000 miners',
        profitability: 'Highly profitable',
        barrier: 'Low entry barrier',
        innovation: 'Bitcoin software optimization'
      }
    },
    {
      era: 'GPU Era',
      period: '2010-2013',
      icon: '🎮',
      device: 'AMD Radeon HD 5970',
      hashRate: '600-800 MH/s',
      power: '300W',
      efficiency: '2.7 MH/J',
      description: 'Graphics cards revolutionized mining with parallel processing',
      color: 'from-green-600 to-emerald-800',
      details: {
        adoption: '~50,000 miners',
        profitability: 'Very profitable',
        barrier: 'Medium entry barrier',
        innovation: 'OpenCL mining software'
      }
    },
    {
      era: 'ASIC Era',
      period: '2013-Present',
      icon: '🏭',
      device: 'Antminer S19 Pro+',
      hashRate: '140 TH/s',
      power: '3010W',
      efficiency: '46.5 TH/J',
      description: 'Application-specific integrated circuits dominate modern mining',
      color: 'from-blue-600 to-cyan-800',
      details: {
        adoption: '~2,150,000 miners',
        profitability: 'Variable by location',
        barrier: 'High entry barrier',
        innovation: 'AI-optimized cooling & efficiency'
      }
    }
  ];

  const aiMetrics = [
    {
      label: 'AI Hash Optimization',
      value: '127.3%',
      trend: '+5.2%',
      icon: '🤖',
      description: 'Machine learning efficiency boost'
    },
    {
      label: 'Predictive Difficulty',
      value: '94.7%',
      trend: '+1.8%',
      icon: '🔮',
      description: 'AI-powered difficulty forecasting'
    },
    {
      label: 'Energy Efficiency',
      value: '89.4%',
      trend: '+12.3%',
      icon: '⚡',
      description: 'Smart power management systems'
    },
    {
      label: 'Network Intelligence',
      value: '156.8%',
      trend: '+8.9%',
      icon: '🧠',
      description: 'Autonomous network optimization'
    }
  ];

  return (
    <motion.div 
      className="educational-page ai-enhanced"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <AIParticles />
      
      {/* AI Hero Card */}
      <motion.div 
        className="mining-hero-card"
        initial={{ y: 30, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.1 }}
      >
        <div className="hero-background">
          <div className="neural-grid" />
          <div className="floating-particles" />
        </div>
        
        <div className="hero-content">
          <div className="hero-badges">
            <span className="ai-badge">🤖 AI-Neural</span>
            <span className="live-badge">🟢 Real-Time</span>
            <span className="efficiency-badge">⚡ 127% Efficiency</span>
          </div>

          <div className="hero-layout">
            <div className="hero-left">
              <div className="hero-icon-section">
                <motion.div 
                  className="hero-icon"
                  animate={{ 
                    rotateY: [0, 360],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  ⛏️
                </motion.div>
                <div className="icon-pulse" />
              </div>
              
              <div className="hero-title-section">
                <h1 className="hero-title">
                  <span className="title-main">Bitcoin Mining</span>
                  <span className="title-sub">Revolution</span>
                </h1>
                <p className="hero-subtitle">
                  AI-Enhanced Network Security & Digital Asset Creation
                </p>
              </div>
            </div>

            <div className="hero-right">
              <div className="stats-grid">
                <motion.div 
                  className="stat-card primary"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="stat-icon">⚡</div>
                  <div className="stat-content">
                    <span className="stat-number">{realTimeData.hashRate.toFixed(1)}</span>
                    <span className="stat-unit">EH/s</span>
                    <span className="stat-label">Global Hash Rate</span>
                    <div className="stat-trend positive">↗ +5.2%</div>
                  </div>
                </motion.div>

                <motion.div 
                  className="stat-card"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="stat-icon">🎯</div>
                  <div className="stat-content">
                    <span className="stat-number">{realTimeData.difficulty.toFixed(1)}</span>
                    <span className="stat-unit">T</span>
                    <span className="stat-label">Network Difficulty</span>
                    <div className="stat-trend neutral">→ +0.8%</div>
                  </div>
                </motion.div>

                <motion.div 
                  className="stat-card"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <span className="stat-number">{realTimeData.miners.toLocaleString()}</span>
                    <span className="stat-unit"></span>
                    <span className="stat-label">Active Miners</span>
                    <div className="stat-trend positive">↗ +2.1%</div>
                  </div>
                </motion.div>

                <motion.div 
                  className="stat-card"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="stat-icon">💰</div>
                  <div className="stat-content">
                    <span className="stat-number">{realTimeData.revenue.toFixed(1)}</span>
                    <span className="stat-unit">BTC</span>
                    <span className="stat-label">Block Reward</span>
                    <div className="stat-trend positive">↗ +1.3%</div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          <motion.div 
            className="hero-description"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Experience the future of Bitcoin mining with AI-optimized processes, 
            real-time analytics, and quantum-resistant security protocols.
          </motion.div>
        </div>
      </motion.div>

      {/* AI Mining Intelligence Dashboard */}
      <motion.div 
        className="ai-intelligence-dashboard"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div className="intelligence-header">
          <div className="header-left">
            <div className="ai-pulse-icon">🤖</div>
            <div className="header-text">
              <h2>AI Mining Intelligence</h2>
              <p>Real-time neural network optimization & predictive analytics</p>
            </div>
          </div>
          <motion.div
            className="intelligence-status"
            animate={{ 
              boxShadow: [
                '0 0 20px rgba(79, 129, 255, 0.5)',
                '0 0 30px rgba(79, 129, 255, 0.8)',
                '0 0 20px rgba(79, 129, 255, 0.5)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="status-indicator active"></span>
            <span className="status-text">Neural Network Active</span>
          </motion.div>
        </div>

        <div className="intelligence-grid">
          <motion.div className="intel-card primary">
            <div className="intel-header">
              <div className="intel-icon">⚡</div>
              <div className="intel-badge">Primary</div>
            </div>
            <div className="intel-data">
              <span className="intel-value">{realTimeData.hashRate.toFixed(1)}</span>
              <span className="intel-unit">EH/s</span>
              <span className="intel-label">Global Hash Rate</span>
              <div className="intel-analysis">
                <span className="analysis-label">AI Prediction:</span>
                <span className="analysis-value positive">↗ +5.2% (24h)</span>
              </div>
            </div>
            <div className="intel-neural-viz">
              <div className="neural-nodes"></div>
            </div>
          </motion.div>

          <motion.div className="intel-card">
            <div className="intel-header">
              <div className="intel-icon">🎯</div>
              <div className="intel-badge">Adaptive</div>
            </div>
            <div className="intel-data">
              <span className="intel-value">{realTimeData.difficulty.toFixed(1)}</span>
              <span className="intel-unit">T</span>
              <span className="intel-label">Network Difficulty</span>
              <div className="intel-analysis">
                <span className="analysis-label">ML Forecast:</span>
                <span className="analysis-value neutral">→ +0.8% (14d)</span>
              </div>
            </div>
            <div className="difficulty-chart">
              <div className="chart-bars">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="chart-bar" style={{height: `${30 + Math.random() * 40}%`}} />
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div className="intel-card">
            <div className="intel-header">
              <div className="intel-icon">🧠</div>
              <div className="intel-badge">Smart</div>
            </div>
            <div className="intel-data">
              <span className="intel-value">127.3</span>
              <span className="intel-unit">%</span>
              <span className="intel-label">AI Efficiency Boost</span>
              <div className="intel-analysis">
                <span className="analysis-label">Neural Gain:</span>
                <span className="analysis-value positive">↗ +27.3% vs Standard</span>
              </div>
            </div>
            <div className="efficiency-rings">
              <div className="ring ring-1"></div>
              <div className="ring ring-2"></div>
              <div className="ring ring-3"></div>
            </div>
          </motion.div>

          <motion.div className="intel-card">
            <div className="intel-header">
              <div className="intel-icon">⚙️</div>
              <div className="intel-badge">Auto</div>
            </div>
            <div className="intel-data">
              <span className="intel-value">{(realTimeData.miners / 1000000).toFixed(2)}</span>
              <span className="intel-unit">M</span>
              <span className="intel-label">Optimized Miners</span>
              <div className="intel-analysis">
                <span className="analysis-label">AI Control:</span>
                <span className="analysis-value positive">↗ +2.1% (30d)</span>
              </div>
            </div>
            <div className="auto-optimizer">
              <div className="optimizer-pulse"></div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Simple Mining Process */}
      <motion.div 
        className="simple-mining-process"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <div className="section-header">
          <h2>⚡ Mining Process Steps</h2>
          <p>Step-by-step Bitcoin mining process explained</p>
        </div>

        <div className="simple-steps-grid">
          {miningSteps.map((step, index) => (
            <motion.div
              key={step.id}
              className="simple-step-card"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="step-header">
                <span className="step-number">{step.id}</span>
                <span className="step-icon">{step.icon}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
              <div className="step-stats">
                <span>⏱️ {step.time}</span>
                <span>✅ {step.efficiency}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ProofOfWorkCard Integration */}
      <motion.div 
        className="pow-integration"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.7 }}
      >
        <ProofOfWorkCard />
      </motion.div>

      {/* Evolution Observatory */}
      <motion.div 
        className="evolution-observatory"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.9 }}
      >
        <div className="observatory-header">
          <div className="evolution-title-section">
            <motion.div 
              className="evolution-icon-container"
              animate={{ 
                rotateY: [0, 180, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="evolution-icon">🏭</div>
              <div className="evolution-particles">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="particle"
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0.3, 1, 0.3],
                      scale: [0.8, 1.2, 0.8]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3
                    }}
                  />
                ))}
              </div>
            </motion.div>
            <div className="title-info">
              <h2>Mining Hardware Evolution</h2>
              <p>From CPUs to AI-optimized ASICs: The technological revolution</p>
              <div className="evolution-stats">
                <div className="stat-badge">
                  <span className="stat-value">4</span>
                  <span className="stat-label">Generations</span>
                </div>
                <div className="stat-badge">
                  <span className="stat-value">100M×</span>
                  <span className="stat-label">Performance Leap</span>
                </div>
                <div className="stat-badge">
                  <span className="stat-value">15</span>
                  <span className="stat-label">Years Evolution</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hardware-timeline">
          {hardwareEvolution.map((era, index) => (
            <motion.div
              key={index}
              className={`era-card ${activeHardware === index ? 'active' : ''} era-${index}`}
              onClick={() => setActiveHardware(index)}
              whileHover={{ 
                scale: 1.02,
                y: -5
              }}
              whileTap={{ scale: 0.98 }}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.15 * index, duration: 0.6 }}
            >
              <div className="era-timeline-connector">
                <div className="timeline-dot"></div>
                {index < hardwareEvolution.length - 1 && <div className="timeline-line"></div>}
              </div>

              <div className="era-content">
                <div className="era-header-new">
                  <div className="era-icon-wrapper">
                    <motion.div 
                      className="era-icon-large"
                      animate={activeHardware === index ? {
                        rotateY: [0, 360],
                        scale: [1, 1.2, 1]
                      } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {era.icon}
                    </motion.div>
                    <div className="era-generation">Gen {index + 1}</div>
                  </div>
                  
                  <div className="era-meta">
                    <h3 className="era-title">{era.era}</h3>
                    <span className="era-timespan">{era.period}</span>
                    <div className="era-progress">
                      <div className="progress-bar">
                        <motion.div 
                          className="progress-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${((index + 1) / hardwareEvolution.length) * 100}%` }}
                          transition={{ delay: 0.5 + index * 0.2, duration: 1 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="era-metrics">
                  <div className="metric-row">
                    <div className="metric-item">
                      <span className="metric-icon">⚡</span>
                      <div className="metric-data">
                        <span className="metric-value">{era.hashRate}</span>
                        <span className="metric-label">Hash Rate</span>
                      </div>
                    </div>
                    <div className="metric-item">
                      <span className="metric-icon">🔋</span>
                      <div className="metric-data">
                        <span className="metric-value">{era.power}</span>
                        <span className="metric-label">Power</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="metric-row">
                    <div className="metric-item">
                      <span className="metric-icon">🖥️</span>
                      <div className="metric-data">
                        <span className="metric-value">{era.device}</span>
                        <span className="metric-label">Device</span>
                      </div>
                    </div>
                    <div className="metric-item">
                      <span className="metric-icon">📈</span>
                      <div className="metric-data">
                        <span className="metric-value">{era.efficiency}</span>
                        <span className="metric-label">Efficiency</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="era-description-new">{era.description}</p>

                <AnimatePresence>
                  {activeHardware === index && (
                    <motion.div
                      className="era-deep-dive"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="deep-dive-grid">
                        {Object.entries(era.details).map(([key, value]) => (
                          <motion.div 
                            key={key} 
                            className="detail-chip"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                          >
                            <span className="chip-label">{key}:</span>
                            <span className="chip-value">{value}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.div 
                className="era-glow-effect"
                animate={activeHardware === index ? {
                  boxShadow: [
                    '0 0 20px rgba(79, 129, 255, 0.3)',
                    '0 0 40px rgba(79, 129, 255, 0.6)',
                    '0 0 20px rgba(79, 129, 255, 0.3)'
                  ]
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Bitcoin Halving Revolution */}
      <motion.div 
        className="halving-revolution-ai"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.0 }}
      >
        <div className="revolution-header">
          <div className="revolution-title-section">
            <motion.div 
              className="scarcity-visualizer"
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
              <div className="scarcity-icon">⚡</div>
              <div className="scarcity-field">
                <motion.div 
                  className="field-particle"
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                />
                <motion.div 
                  className="field-particle"
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                />
                <motion.div 
                  className="field-particle"
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                />
              </div>
            </motion.div>
            
            <div className="revolution-info">
              <h2>Bitcoin Halving Revolution</h2>
              <p>AI-Enhanced Analysis of Bitcoin's Scarcity Mechanism & Market Cycles</p>
              <div className="revolution-description">
                Dive deep into Bitcoin's programmed scarcity, powered by real-time data, AI predictions, and comprehensive market analysis. Track the countdown to the next halving and understand its profound economic implications.
              </div>
            </div>
          </div>
          
          <div className="ai-prediction-panel">
            <div className="prediction-header">
              <motion.div 
                className="ai-brain"
                animate={{ 
                  rotateY: [0, 180, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                🧠
              </motion.div>
              <div className="panel-title">
                <span className="panel-label">AI Prediction Engine</span>
                <span className="panel-status">Neural Networks Active</span>
              </div>
            </div>
            
            <div className="prediction-metrics">
              <div className="prediction-metric">
                <span className="metric-value">99.7%</span>
                <span className="metric-label">Model Accuracy</span>
                <span className="metric-trend positive">↗ High Confidence</span>
              </div>
              <div className="prediction-metric">
                <span className="metric-value">1,432</span>
                <span className="metric-label">Days to Next</span>
                <span className="metric-trend neutral">→ Block 1,050,000</span>
              </div>
              <div className="prediction-metric">
                <span className="metric-value">+287%</span>
                <span className="metric-label">AI Forecast</span>
                <span className="metric-trend positive">↗ Post-Halving</span>
              </div>
            </div>
          </div>
        </div>

        <div className="scarcity-analysis">
          <div className="analysis-grid">
            <motion.div 
              className="analysis-card primary"
              whileHover={{ scale: 1.02, y: -3 }}
            >
              <div className="card-header">
                <div className="card-icon">📊</div>
                <div className="card-title">Real-Time Scarcity Index</div>
                <div className="card-badge live">LIVE</div>
              </div>
              <div className="scarcity-meter">
                <div className="meter-background">
                  <motion.div 
                    className="meter-fill"
                    initial={{ width: 0 }}
                    animate={{ width: '84.7%' }}
                    transition={{ duration: 2, delay: 0.5 }}
                  />
                </div>
                <div className="meter-value">84.7% Scarce</div>
              </div>
              <div className="scarcity-details">
                <div className="detail-item">
                  <span className="detail-label">Total Supply:</span>
                  <span className="detail-value">19.8M / 21M BTC</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Inflation Rate:</span>
                  <span className="detail-value">1.68% (decreasing)</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Stock-to-Flow:</span>
                  <span className="detail-value">58.4 (Gold: 62)</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="analysis-card"
              whileHover={{ scale: 1.02, y: -3 }}
            >
              <div className="card-header">
                <div className="card-icon">🎯</div>
                <div className="card-title">Halving Impact Predictor</div>
                <div className="card-badge ai">AI</div>
              </div>
              <div className="impact-visualization">
                <div className="impact-chart">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="chart-bar"
                      initial={{ height: 0 }}
                      animate={{ height: `${20 + Math.sin(i * 0.8) * 30 + i * 3}px` }}
                      transition={{ delay: i * 0.1, duration: 0.6 }}
                    />
                  ))}
                </div>
                <div className="impact-stats">
                  <div className="impact-stat">
                    <span className="stat-number">+312%</span>
                    <span className="stat-label">Avg Price Impact</span>
                  </div>
                  <div className="impact-stat">
                    <span className="stat-number">18 months</span>
                    <span className="stat-label">Peak Delay</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="analysis-card"
              whileHover={{ scale: 1.02, y: -3 }}
            >
              <div className="card-header">
                <div className="card-icon">🔄</div>
                <div className="card-title">Market Cycle Analysis</div>
                <div className="card-badge ml">ML</div>
              </div>
              <div className="cycle-phases">
                <div className="phase-tracker">
                  <div className="phase accumulation">
                    <div className="phase-dot"></div>
                    <span className="phase-label">Accumulation</span>
                  </div>
                  <div className="phase markup active">
                    <div className="phase-dot"></div>
                    <span className="phase-label">Markup</span>
                  </div>
                  <div className="phase distribution">
                    <div className="phase-dot"></div>
                    <span className="phase-label">Distribution</span>
                  </div>
                  <div className="phase markdown">
                    <div className="phase-dot"></div>
                    <span className="phase-label">Markdown</span>
                  </div>
                </div>
                <div className="cycle-prediction">
                  <span className="prediction-text">Current Phase: Markup</span>
                  <span className="prediction-confidence">Confidence: 92.4%</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="analysis-card"
              whileHover={{ scale: 1.02, y: -3 }}
            >
              <div className="card-header">
                <div className="card-icon">⚙️</div>
                <div className="card-title">Mining Economics</div>
                <div className="card-badge auto">AUTO</div>
              </div>
              <div className="economics-data">
                <div className="economic-metric">
                  <span className="metric-icon">💰</span>
                  <div className="metric-info">
                    <span className="metric-name">Revenue Impact</span>
                    <span className="metric-prediction">-50% immediate, +400% long-term</span>
                  </div>
                </div>
                <div className="economic-metric">
                  <span className="metric-icon">⚡</span>
                  <div className="metric-info">
                    <span className="metric-name">Hash Rate Effect</span>
                    <span className="metric-prediction">-15% to -30% post-halving</span>
                  </div>
                </div>
                <div className="economic-metric">
                  <span className="metric-icon">🏭</span>
                  <div className="metric-info">
                    <span className="metric-name">Miner Capitulation</span>
                    <span className="metric-prediction">3-6 months adjustment period</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="halving-timeline">
          {[
            {
              year: '2012',
              block: '210,000',
              reward: '50 → 25',
              impact: '+8,000%',
              era: 'Genesis Era',
              icon: '🌱',
              description: 'First halving event, establishing the deflationary mechanism',
              market: 'Price surge from $12 to $1,100',
              miners: 'Early adopters and hobbyists',
              color: 'from-green-500 to-emerald-400'
            },
            {
              year: '2016',
              block: '420,000',
              reward: '25 → 12.5',
              impact: '+300%',
              era: 'Growth Era',
              icon: '📈',
              description: 'Mining industrialization begins with professional operations',
              market: 'Price growth from $650 to $20,000',
              miners: 'Professional mining farms emerge',
              color: 'from-blue-500 to-cyan-400'
            },
            {
              year: '2020',
              block: '630,000',
              reward: '12.5 → 6.25',
              impact: '+400%',
              era: 'Institutional Era',
              icon: '🏛️',
              description: 'Institutional adoption and corporate treasury allocation',
              market: 'Price explosion from $8,500 to $69,000',
              miners: 'Corporate mining and renewable energy focus',
              color: 'from-purple-500 to-violet-400'
            },
            {
              year: '2024',
              block: '840,000',
              reward: '6.25 → 3.125',
              impact: 'TBD',
              era: 'Maturity Era',
              icon: '💎',
              description: 'Bitcoin approaches digital gold status with increased scarcity',
              market: 'Current cycle in progress',
              miners: 'AI-optimized operations and sustainability focus',
              color: 'from-amber-500 to-orange-400'
            }
          ].map((halving, index) => (
            <motion.div
              key={index}
              className="halving-era"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 * index, duration: 0.8 }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <div className="era-timeline-marker">
                <div className="marker-dot">
                  <span className="era-icon">{halving.icon}</span>
                </div>
                {index < 3 && <div className="marker-line"></div>}
              </div>

              <div className="era-content-card">
                <div className="era-header">
                  <div className="era-year-block">
                    <h3 className="era-year">{halving.year}</h3>
                    <span className="era-block">Block {halving.block}</span>
                  </div>
                  <div className="era-badge">
                    <span className="badge-text">{halving.era}</span>
                  </div>
                </div>

                <div className="reward-change">
                  <div className="reward-visual">
                    <span className="reward-before">{halving.reward.split(' → ')[0]} BTC</span>
                    <motion.div 
                      className="reward-arrow"
                      animate={{ x: [0, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      →
                    </motion.div>
                    <span className="reward-after">{halving.reward.split(' → ')[1]} BTC</span>
                  </div>
                  <div className="impact-badge">
                    <span className="impact-text">Impact: {halving.impact}</span>
                  </div>
                </div>

                <p className="era-description">{halving.description}</p>

                <div className="era-details">
                  <div className="detail-row">
                    <div className="detail-item">
                      <span className="detail-icon">📊</span>
                      <div className="detail-content">
                        <span className="detail-label">Market</span>
                        <span className="detail-value">{halving.market}</span>
                      </div>
                    </div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-item">
                      <span className="detail-icon">⚙️</span>
                      <div className="detail-content">
                        <span className="detail-label">Mining</span>
                        <span className="detail-value">{halving.miners}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`era-glow bg-gradient-to-r ${halving.color}`}></div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="halving-insights">
          <motion.div 
            className="insight-card scarcity"
            whileHover={{ scale: 1.03 }}
          >
            <div className="insight-icon">💎</div>
            <h4>Digital Scarcity</h4>
            <p>Each halving reduces new Bitcoin supply by 50%, creating programmatic scarcity unprecedented in monetary history.</p>
            <div className="scarcity-meter">
              <div className="meter-fill" style={{width: '87.5%'}}></div>
              <span className="meter-label">87.5% of total supply mined</span>
            </div>
          </motion.div>

          <motion.div 
            className="insight-card economics"
            whileHover={{ scale: 1.03 }}
          >
            <div className="insight-icon">📈</div>
            <h4>Mining Economics</h4>
            <p>Halvings force mining efficiency improvements and drive adoption of renewable energy sources for sustainable operations.</p>
            <div className="efficiency-chart">
              <div className="chart-bar" style={{height: '60%'}}></div>
              <div className="chart-bar" style={{height: '75%'}}></div>
              <div className="chart-bar" style={{height: '85%'}}></div>
              <div className="chart-bar" style={{height: '95%'}}></div>
            </div>
          </motion.div>

          <motion.div 
            className="insight-card cycles"
            whileHover={{ scale: 1.03 }}
          >
            <div className="insight-icon">🔄</div>
            <h4>Market Cycles</h4>
            <p>Historical data shows consistent bull market patterns following each halving, driven by supply shock and increased adoption.</p>
            <div className="cycle-waves">
              <div className="wave wave-1"></div>
              <div className="wave wave-2"></div>
              <div className="wave wave-3"></div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Advanced AI Analytics Hub */}
      <motion.div 
        className="ai-analytics-hub"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.1 }}
      >
        <div className="analytics-header">
          <div className="analytics-title-section">
            <motion.div 
              className="ml-brain-icon"
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 8,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              🧠
            </motion.div>
            <div className="title-content">
              <h2>AI Mining Intelligence</h2>
              <p>Machine learning optimization and predictive analytics</p>
              <div className="ml-status">
                <span className="ml-indicator">
                  <span className="indicator-dot active"></span>
                  <span className="indicator-text">ML Models Active</span>
                </span>
                <span className="training-status">
                  <span className="training-dot"></span>
                  <span className="training-text">Continuous Learning</span>
                </span>
              </div>
            </div>
          </div>
          
          <div className="analytics-performance">
            <div className="performance-metric">
              <span className="performance-value">99.7%</span>
              <span className="performance-label">Model Accuracy</span>
            </div>
            <div className="performance-metric">
              <span className="performance-value">127.3%</span>
              <span className="performance-label">Efficiency Gain</span>
            </div>
          </div>
        </div>

        <div className="ml-insights-grid">
          <motion.div 
            className="insight-card primary"
            whileHover={{ 
              scale: 1.02,
              boxShadow: '0 15px 35px rgba(79, 129, 255, 0.25)'
            }}
          >
            <div className="insight-header">
              <div className="insight-icon-container">
                <div className="insight-icon">🤖</div>
                <div className="insight-pulse"></div>
              </div>
              <div className="insight-category">Neural Optimization</div>
            </div>
            <div className="insight-data">
              <h3>Hash Rate Prediction</h3>
              <div className="insight-value">
                <span className="value-number">127.3</span>
                <span className="value-unit">%</span>
                <span className="value-label">efficiency boost</span>
              </div>
              <div className="insight-prediction">
                <span className="prediction-label">Next 24h forecast:</span>
                <span className="prediction-value positive">↗ +5.2% growth</span>
              </div>
            </div>
            <div className="neural-network-viz">
              <div className="network-node node-1"></div>
              <div className="network-node node-2"></div>
              <div className="network-node node-3"></div>
              <div className="network-connection con-1"></div>
              <div className="network-connection con-2"></div>
            </div>
          </motion.div>

          <motion.div 
            className="insight-card"
            whileHover={{ 
              scale: 1.02,
              boxShadow: '0 15px 35px rgba(16, 185, 129, 0.25)'
            }}
          >
            <div className="insight-header">
              <div className="insight-icon-container">
                <div className="insight-icon">📊</div>
                <div className="insight-pulse green"></div>
              </div>
              <div className="insight-category">Predictive Analytics</div>
            </div>
            <div className="insight-data">
              <h3>Difficulty Adjustment</h3>
              <div className="insight-value">
                <span className="value-number">94.7</span>
                <span className="value-unit">%</span>
                <span className="value-label">accuracy</span>
              </div>
              <div className="insight-prediction">
                <span className="prediction-label">14-day projection:</span>
                <span className="prediction-value neutral">→ +0.8% adjustment</span>
              </div>
            </div>
            <div className="prediction-chart">
              <div className="chart-line">
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className="chart-point" 
                    style={{
                      left: `${(i / 11) * 100}%`,
                      bottom: `${20 + Math.sin(i * 0.5) * 15 + Math.random() * 10}%`
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="insight-card"
            whileHover={{ 
              scale: 1.02,
              boxShadow: '0 15px 35px rgba(168, 85, 247, 0.25)'
            }}
          >
            <div className="insight-header">
              <div className="insight-icon-container">
                <div className="insight-icon">⚙️</div>
                <div className="insight-pulse purple"></div>
              </div>
              <div className="insight-category">Auto-Optimization</div>
            </div>
            <div className="insight-data">
              <h3>Energy Efficiency</h3>
              <div className="insight-value">
                <span className="value-number">+8.9</span>
                <span className="value-unit">%</span>
                <span className="value-label">optimization</span>
              </div>
              <div className="insight-prediction">
                <span className="prediction-label">Smart contracts:</span>
                <span className="prediction-value positive">↗ Auto-adjusting</span>
              </div>
            </div>
            <div className="efficiency-visualization">
              <div className="efficiency-bar">
                <div className="efficiency-progress" style={{width: '87%'}}></div>
              </div>
              <div className="efficiency-nodes">
                <div className="efficiency-node active"></div>
                <div className="efficiency-node active"></div>
                <div className="efficiency-node active"></div>
                <div className="efficiency-node"></div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="insight-card"
            whileHover={{ 
              scale: 1.02,
              boxShadow: '0 15px 35px rgba(245, 158, 11, 0.25)'
            }}
          >
            <div className="insight-header">
              <div className="insight-icon-container">
                <div className="insight-icon">💡</div>
                <div className="insight-pulse amber"></div>
              </div>
              <div className="insight-category">Market Intelligence</div>
            </div>
            <div className="insight-data">
              <h3>Revenue Optimization</h3>
              <div className="insight-value">
                <span className="value-number">+12.4</span>
                <span className="value-unit">%</span>
                <span className="value-label">profit increase</span>
              </div>
              <div className="insight-prediction">
                <span className="prediction-label">AI trading bots:</span>
                <span className="prediction-value positive">↗ Active optimization</span>
              </div>
            </div>
            <div className="market-signals">
              <div className="signal bullish">
                <span className="signal-dot"></span>
                <span className="signal-text">Bullish</span>
              </div>
              <div className="signal trend-up">
                <span className="signal-dot"></span>
                <span className="signal-text">Trending Up</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Future Mining Nexus */}
      <motion.div 
        className="future-mining-nexus"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.3 }}
      >
        <div className="nexus-header">
          <div className="rocket-animation">
            <motion.div 
              className="rocket-icon"
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              🚀
            </motion.div>
            <div className="rocket-trail"></div>
          </div>
          <div className="nexus-title-section">
            <h2>Future of Bitcoin Mining</h2>
            <p>Next-generation technologies revolutionizing digital asset creation</p>
            <div className="timeline-indicator">
              <span className="timeline-label">Innovation Timeline:</span>
              <span className="timeline-range">2025 - 2050</span>
            </div>
          </div>
        </div>

        <div className="future-technologies">
          <motion.div 
            className="tech-card quantum-tech"
            whileHover={{ 
              scale: 1.02,
              boxShadow: '0 20px 40px rgba(147, 51, 234, 0.3)'
            }}
            initial={{ rotateY: -15 }}
            whileInView={{ rotateY: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="tech-header">
              <div className="tech-icon quantum">🔬</div>
              <div className="tech-status">
                <span className="status-dot research"></span>
                <span className="status-text">Research Phase</span>
              </div>
            </div>
            <div className="tech-content">
              <h3>Quantum-Resistant Mining</h3>
              <p>Post-quantum cryptography algorithms protecting against quantum computer attacks on mining infrastructure.</p>
              <div className="tech-features">
                <span className="feature">Quantum-proof algorithms</span>
                <span className="feature">Enhanced security</span>
                <span className="feature">Future-ready protocols</span>
              </div>
            </div>
            <div className="tech-timeline">
              <div className="timeline-bar">
                <div className="timeline-progress" style={{width: '25%'}}></div>
              </div>
              <span className="timeline-eta">ETA: 2030-2035</span>
            </div>
          </motion.div>

          <motion.div 
            className="tech-card green-tech"
            whileHover={{ 
              scale: 1.02,
              boxShadow: '0 20px 40px rgba(34, 197, 94, 0.3)'
            }}
            initial={{ rotateY: 15 }}
            whileInView={{ rotateY: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="tech-header">
              <div className="tech-icon green">🌱</div>
              <div className="tech-status">
                <span className="status-dot active"></span>
                <span className="status-text">Active Development</span>
              </div>
            </div>
            <div className="tech-content">
              <h3>Carbon-Neutral Mining</h3>
              <p>100% renewable energy sources with AI-optimized power distribution and carbon capture technology.</p>
              <div className="tech-features">
                <span className="feature">Solar + Wind farms</span>
                <span className="feature">Carbon negative</span>
                <span className="feature">Grid optimization</span>
              </div>
            </div>
            <div className="tech-timeline">
              <div className="timeline-bar">
                <div className="timeline-progress" style={{width: '75%'}}></div>
              </div>
              <span className="timeline-eta">ETA: 2025-2027</span>
            </div>
          </motion.div>

          <motion.div 
            className="tech-card space-tech"
            whileHover={{ 
              scale: 1.02,
              boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)'
            }}
            initial={{ rotateY: -15 }}
            whileInView={{ rotateY: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="tech-header">
              <div className="tech-icon space">🛰️</div>
              <div className="tech-status">
                <span className="status-dot concept"></span>
                <span className="status-text">Concept Phase</span>
              </div>
            </div>
            <div className="tech-content">
              <h3>Orbital Mining Networks</h3>
              <p>Satellite-based mining operations with zero gravity cooling and unlimited solar energy collection.</p>
              <div className="tech-features">
                <span className="feature">Zero-G cooling</span>
                <span className="feature">24/7 solar power</span>
                <span className="feature">Lunar facilities</span>
              </div>
            </div>
            <div className="tech-timeline">
              <div className="timeline-bar">
                <div className="timeline-progress" style={{width: '10%'}}></div>
              </div>
              <span className="timeline-eta">ETA: 2040-2050</span>
            </div>
          </motion.div>

          <motion.div 
            className="tech-card agi-tech"
            whileHover={{ 
              scale: 1.02,
              boxShadow: '0 20px 40px rgba(168, 85, 247, 0.3)'
            }}
            initial={{ rotateY: 15 }}
            whileInView={{ rotateY: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="tech-header">
              <div className="tech-icon agi">🧠</div>
              <div className="tech-status">
                <span className="status-dot development"></span>
                <span className="status-text">Early Development</span>
              </div>
            </div>
            <div className="tech-content">
              <h3>AGI Mining Superintelligence</h3>
              <p>Artificial General Intelligence autonomously managing global mining networks with perfect efficiency.</p>
              <div className="tech-features">
                <span className="feature">Autonomous operation</span>
                <span className="feature">Perfect optimization</span>
                <span className="feature">Self-evolving algorithms</span>
              </div>
            </div>
            <div className="tech-timeline">
              <div className="timeline-bar">
                <div className="timeline-progress" style={{width: '40%'}}></div>
              </div>
              <span className="timeline-eta">ETA: 2028-2032</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BitcoinMining;