import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ProofOfTransfer.css';

const ProofOfTransfer = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [showRewardsFlow, setShowRewardsFlow] = useState(false);
  const [realTimeData, setRealTimeData] = useState({
    stackedSTX: 125847650,
    btcRewards: 4.23,
    stackers: 3247,
    cycleProgress: 73
  });
  const [aiInsights, setAiInsights] = useState([]);
  const intervalRef = useRef(null);

  // Real-time data simulation
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRealTimeData(prev => ({
        stackedSTX: prev.stackedSTX + Math.floor(Math.random() * 1000),
        btcRewards: prev.btcRewards + (Math.random() - 0.5) * 0.01,
        stackers: prev.stackers + Math.floor(Math.random() * 10) - 5,
        cycleProgress: (prev.cycleProgress + 1) % 100
      }));
    }, 3000);

    // Initialize AI insights
    setAiInsights([
      {
        type: 'security',
        message: 'PoX inherits 100% of Bitcoin\'s security without energy waste',
        confidence: 0.95,
        icon: '🛡️'
      },
      {
        type: 'yield',
        message: 'Current stacking yields 4.23% annual BTC rewards',
        confidence: 0.87,
        icon: '💰'
      },
      {
        type: 'network',
        message: 'Network effects growing: 3,247 active stackers',
        confidence: 0.91,
        icon: '🌐'
      }
    ]);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const poxSteps = [
    {
      id: 1,
      title: "Miners Transfer BTC",
      description: "Miners transfer Bitcoin to participate in Stacks mining process",
      icon: "💰",
      color: "#f7931e",
      detail: "Miners commit BTC instead of burning electricity"
    },
    {
      id: 2,
      title: "Highest Transfer Wins",
      description: "The miner with the largest BTC transfer wins the right to mine the Stacks block",
      icon: "🏆",
      color: "#4f81ff",
      detail: "Consensus through capital commitment, not energy consumption"
    },
    {
      id: 3,
      title: "Block with BitSwapDEX Transactions",
      description: "The new block contains all BitSwapDEX transactions and other Stacks operations",
      icon: "🔄",
      color: "#00ffff",
      detail: "Smart contracts and DeFi operations execute on Stacks"
    },
    {
      id: 4,
      title: "Hash Anchored to Bitcoin",
      description: "The Stacks block hash is permanently inscribed on the Bitcoin blockchain",
      icon: "⛓️",
      color: "#4ade80",
      detail: "Immutable finality through Bitcoin's security"
    }
  ];

  const bitswapComponents = [
    {
      component: "Stacks Blockchain",
      role: "Executes smart contracts and BitSwapDEX transactions with PoX security",
      icon: "🏗️",
      metric: "15-20 TPS"
    },
    {
      component: "Bitcoin Blockchain",
      role: "Anchors Stacks block hashes for ultimate security and finality",
      icon: "₿",
      metric: "100% Security"
    },
    {
      component: "PoX Miners",
      role: "Transfer BTC to mine blocks and secure the Stacks network",
      icon: "⛏️",
      metric: "~10 min blocks"
    },
    {
      component: "STX Stackers",
      role: "Lock STX tokens and receive BTC rewards from miners",
      icon: "🔒",
      metric: `${realTimeData.stackers} active`
    },
    {
      component: "BitSwapDEX DAO",
      role: "Governs protocols and incentives for PoX participants",
      icon: "🏛️",
      metric: "Decentralized"
    }
  ];

  const advantages = [
    {
      title: "Bitcoin Security",
      description: "All BitSwapDEX transactions benefit from Bitcoin blockchain security",
      icon: "🛡️",
      gradient: "linear-gradient(135deg, #f7931e 0%, #ff6b35 100%)",
      metric: "100% inherited"
    },
    {
      title: "Energy Efficient",
      description: "PoX doesn't require the massive energy consumption of traditional PoW mining",
      icon: "🌱",
      gradient: "linear-gradient(135deg, #4ade80 0%, #22d3ee 100%)",
      metric: "99.9% less energy"
    },
    {
      title: "BTC Rewards",
      description: "Stackers receive real Bitcoin as rewards for participation",
      icon: "₿",
      gradient: "linear-gradient(135deg, #4f81ff 0%, #7c3aed 100%)",
      metric: `${realTimeData.btcRewards.toFixed(2)}% APY`
    },
    {
      title: "Interoperability",
      description: "Connects Bitcoin ecosystem with DeFi and smart contracts",
      icon: "🌉",
      gradient: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
      metric: "Multi-chain"
    }
  ];

  return (
    <div className="page-wrapper">
      {/* Floating Background Elements */}
      <div className="floating-element"></div>
      <div className="floating-element"></div>
      <div className="floating-element"></div>

      {/* Hero Section */}
      <motion.section 
        className="hero-section"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.h1 
          className="hero-title"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Proof-of-Transfer (PoX)
        </motion.h1>
        
        <motion.p 
          className="hero-subtitle"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          Revolutionizing DeFi with Bitcoin's Security Through Innovative Consensus
        </motion.p>

        {/* AI Icons */}
        <motion.div 
          className="ai-icons"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="ai-icon">
            <i className="fas fa-brain"></i>
          </div>
          <div className="ai-icon">
            <i className="fab fa-bitcoin"></i>
          </div>
          <div className="ai-icon">
            <i className="fas fa-shield-alt"></i>
          </div>
          <div className="ai-icon">
            <i className="fas fa-network-wired"></i>
          </div>
          <div className="ai-icon">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="ai-icon">
            <i className="fas fa-rocket"></i>
          </div>
        </motion.div>
      </motion.section>

        {/* What is PoX? Section */}
        <motion.div 
          className="section-card glow-effect"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <h2 className="section-title">
            <i className="fas fa-question-circle"></i>
            What is Proof-of-Transfer?
          </h2>
          <div className="section-content">
            <p>
              Proof-of-Transfer (PoX) is a revolutionary consensus mechanism that allows BitSwapDEX 
              to inherit Bitcoin's security without requiring energy-intensive mining. Instead of 
              consuming electricity to compete for blocks, miners transfer Bitcoin to participate 
              in the network consensus.
            </p>
          </div>
          
          <div className="feature-grid">
            <div className="feature-item">
              <div className="feature-icon">
                <i className="fab fa-bitcoin"></i>
              </div>
              <h3 className="feature-title">Bitcoin as Foundation</h3>
              <p className="feature-description">
                Uses Bitcoin as the settlement layer for ultimate security and finality
              </p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <i className="fas fa-layer-group"></i>
              </div>
              <h3 className="feature-title">Layer 2 Innovation</h3>
              <p className="feature-description">
                Builds smart contracts and DeFi on Bitcoin without protocol changes
              </p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <i className="fas fa-recycle"></i>
              </div>
              <h3 className="feature-title">Transfer Consensus</h3>
              <p className="feature-description">
                Miners transfer BTC instead of consuming energy for hashes
              </p>
            </div>
          </div>
        </motion.div>

        {/* How PoX Works Section */}
        <motion.div 
          className="section-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
        >
          <h2 className="section-title">
            <i className="fas fa-cogs"></i>
            How PoX Works for BitSwapDEX
          </h2>
          <div className="section-content">
            <p>
              The Proof-of-Transfer mechanism enables BitSwapDEX to process DeFi transactions 
              with the security of Bitcoin through a four-step process:
            </p>
          </div>
          
          <div className="feature-grid">
            {poxSteps.map((step, index) => (
              <motion.div
                key={step.id}
                className="feature-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.2 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
              >
                <div className="feature-icon" style={{ background: step.color }}>
                  {step.icon}
                </div>
                <h3 className="feature-title">{step.title}</h3>
                <p className="feature-description">{step.description}</p>
                <div style={{ color: step.color, fontSize: '0.9rem', marginTop: '10px' }}>
                  {step.detail}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Advantages Section */}
        <motion.div 
          className="section-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
        >
          <h2 className="section-title">
            <i className="fas fa-star"></i>
            Advantages for BitSwapDEX
          </h2>
          <div className="section-content">
            <p>
              Proof-of-Transfer provides BitSwapDEX with unique advantages that traditional 
              blockchain solutions cannot match, combining Bitcoin's security with modern DeFi innovation.
            </p>
          </div>
          
          <div className="feature-grid">
            {advantages.map((advantage, index) => (
              <motion.div
                key={index}
                className="feature-item"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.6 + index * 0.1 }}
                whileHover={{ 
                  scale: 1.05,
                  y: -8
                }}
                style={{ 
                  background: advantage.gradient,
                  border: 'none'
                }}
              >
                <div className="feature-icon" style={{ background: 'rgba(255,255,255,0.2)' }}>
                  {advantage.icon}
                </div>
                <h3 className="feature-title" style={{ color: 'white' }}>{advantage.title}</h3>
                <p className="feature-description" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  {advantage.description}
                </p>
                <div style={{ 
                  color: 'white', 
                  fontWeight: 'bold', 
                  fontSize: '1.1rem', 
                  marginTop: '15px',
                  textAlign: 'center'
                }}>
                  {advantage.metric}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
    </div>
  );
};

export default ProofOfTransfer;