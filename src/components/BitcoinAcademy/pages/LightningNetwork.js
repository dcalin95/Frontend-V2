import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LightningNetwork = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [realTimeData, setRealTimeData] = useState({
    nodes: 15847,
    channels: 68234,
    capacity: 4982.5,
    avgChannelSize: 0.073,
    networkGrowth: '+12.3%',
    avgFee: 0.003,
    payments24h: 1247830,
    uptime: 99.97,
    avgHops: 2.3,
    routingSuccess: 97.2
  });
  const [aiPredictions, setAiPredictions] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const [networkActivity, setNetworkActivity] = useState([]);
  const intervalRef = useRef(null);

  // Real-time data simulation
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRealTimeData(prev => ({
        ...prev,
        nodes: prev.nodes + Math.floor(Math.random() * 5),
        channels: prev.channels + Math.floor(Math.random() * 20),
        capacity: prev.capacity + (Math.random() - 0.5) * 10,
        avgFee: Math.max(0.001, prev.avgFee + (Math.random() - 0.5) * 0.001),
        payments24h: prev.payments24h + Math.floor(Math.random() * 100),
        routingSuccess: Math.max(95, Math.min(99.9, prev.routingSuccess + (Math.random() - 0.5) * 0.5))
      }));
    }, 2000);

    // Initialize AI predictions
    setAiPredictions([
      {
        type: 'adoption',
        prediction: 'Lightning adoption expected to grow 300% in next 12 months',
        confidence: 0.89,
        impact: 'high',
        icon: '🚀'
      },
      {
        type: 'capacity',
        prediction: 'Network capacity likely to exceed 10,000 BTC by 2025',
        confidence: 0.76,
        impact: 'high',
        icon: '💰'
      },
      {
        type: 'routing',
        prediction: 'AI-powered routing will improve success rates to 99.5%',
        confidence: 0.82,
        impact: 'medium',
        icon: '🧠'
      },
      {
        type: 'integration',
        prediction: 'Major exchanges will integrate Lightning by Q2 2025',
        confidence: 0.91,
        impact: 'high',
        icon: '🏛️'
      }
    ]);

    // Simulate network activity
    const activityInterval = setInterval(() => {
      setNetworkActivity(prev => {
        const newActivity = {
          id: Date.now(),
          type: Math.random() > 0.7 ? 'channel_open' : 'payment',
          amount: Math.random() * 1000,
          hops: Math.floor(Math.random() * 5) + 1,
          timestamp: Date.now()
        };
        return [newActivity, ...prev.slice(0, 9)]; // Keep last 10 activities
      });
    }, 1500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearInterval(activityInterval);
    };
  }, []);

  // AI Particles Background
  const AIParticles = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-orange-400 rounded-full opacity-40"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: [0.4, 0.8, 0.4]
          }}
          transition={{
            duration: Math.random() * 15 + 10,
            repeat: Infinity,
            delay: Math.random() * 5
          }}
        />
      ))}
    </div>
  );

  // Lightning Network Architecture
  const lightningHistory = [
    {
      date: '2015',
      title: 'Whitepaper Published',
      description: 'Joseph Poon and Thaddeus Dryja publish Lightning Network whitepaper',
      milestone: 'Concept Birth',
      status: 'completed'
    },
    {
      date: '2018',
      title: 'Beta Launch',
      description: 'Lightning Network beta launched on Bitcoin mainnet',
      milestone: 'Beta Release',
      status: 'completed'
    },
    {
      date: '2021',
      title: 'El Salvador Adoption',
      description: 'El Salvador integrates Lightning for national Bitcoin payments',
      milestone: 'National Adoption',
      status: 'completed'
    },
    {
      date: '2024',
      title: 'Enterprise Integration',
      description: 'Major exchanges and payment processors adopt Lightning',
      milestone: 'Mass Adoption',
      status: 'recent'
    },
    {
      date: '2025',
      title: 'AI-Powered Routing',
      description: 'AI algorithms optimize payment routing and liquidity',
      milestone: 'AI Enhancement',
      status: 'upcoming'
    }
  ];

  const technicalSpecs = [
    {
      title: 'Payment Speed',
      current: '~1 second',
      comparison: 'Bitcoin: ~10 minutes',
      description: 'Near-instant settlement through payment channels',
      improvement: '600x faster',
      icon: '⚡'
    },
    {
      title: 'Transaction Fees',
      current: '~1-10 sats',
      comparison: 'Bitcoin: ~10,000+ sats',
      description: 'Micropayments enabled with sub-penny fees',
      improvement: '1000x cheaper',
      icon: '💰'
    },
    {
      title: 'Throughput Capacity',
      current: '1M+ TPS',
      comparison: 'Bitcoin: ~7 TPS',
      description: 'Unlimited off-chain transaction capacity',
      improvement: '100,000x more',
      icon: '📈'
    },
    {
      title: 'Privacy Enhancement',
      current: 'Onion routing',
      comparison: 'Bitcoin: Public ledger',
      description: 'Enhanced privacy through payment routing',
      improvement: 'Private payments',
      icon: '🔒'
    }
  ];

  const useCases = [
    {
      category: 'Micropayments',
      examples: [
        'Streaming sats for content',
        'Pay-per-article journalism',
        'Gaming in-app purchases',
        'API usage metering'
      ],
      icon: '💸',
      adoption: '85%'
    },
    {
      category: 'Remittances',
      examples: [
        'Cross-border transfers',
        'Instant family payments',
        'Business settlements',
        'Emergency funds'
      ],
      icon: '🌍',
      adoption: '67%'
    },
    {
      category: 'Commerce',
      examples: [
        'Point-of-sale payments',
        'E-commerce checkout',
        'Subscription services',
        'Loyalty rewards'
      ],
      icon: '🛒',
      adoption: '43%'
    },
    {
      category: 'DeFi & Apps',
      examples: [
        'Decentralized exchanges',
        'Lending protocols',
        'Social media tipping',
        'IoT machine payments'
      ],
      icon: '🔗',
      adoption: '29%'
    }
  ];

  const aiInsights = [
    {
      title: 'Network Growth Analytics',
      insights: [
        'Node count growing 15% monthly across all regions',
        'Channel capacity increasing faster than node growth',
        'Average channel size trending upward (+23% YoY)',
        'Routing efficiency improving with AI pathfinding'
      ],
      confidence: 0.92,
      icon: '📊'
    },
    {
      title: 'Payment Flow Optimization',
      insights: [
        'AI routing reduces failed payments by 35%',
        'Machine learning predicts optimal channel balancing',
        'Dynamic fee adjustment based on network congestion',
        'Predictive liquidity management for node operators'
      ],
      confidence: 0.87,
      icon: '🧠'
    },
    {
      title: 'Adoption Pattern Recognition',
      insights: [
        'Enterprise adoption accelerating in Q4 2024',
        'Geographic clusters forming around payment hubs',
        'Mobile wallet integration driving user growth',
        'Cross-chain bridges expanding Lightning utility'
      ],
      confidence: 0.84,
      icon: '🚀'
    }
  ];

  const tabVariants = {
    active: { backgroundColor: 'rgba(255, 165, 0, 0.2)', scale: 1.05 },
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
            animate={{ boxShadow: ['0 0 20px rgba(255,165,0,0.3)', '0 0 30px rgba(255,165,0,0.6)', '0 0 20px rgba(255,165,0,0.3)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ⚡ Lightning-Fast
          </motion.span>
          <motion.span 
            className="live-badge"
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            📡 Live Network
          </motion.span>
          <motion.span 
            className="efficiency-badge"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🧠 AI-Powered
          </motion.span>
        </div>

        <motion.h1 
          className="page-title ai-title"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
        >
          <span className="title-icon">⚡</span>
          Lightning Network Revolution
        </motion.h1>

        <motion.p 
          className="page-subtitle ai-subtitle"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          AI-Enhanced Bitcoin Layer 2 Scaling Solution for Instant Global Payments
        </motion.p>

        <motion.p 
          className="page-intro ai-intro"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          Experience the future of Bitcoin payments with Lightning Network's revolutionary off-chain scaling solution. 
          Real-time analytics, AI-powered routing, and instant settlements make micropayments and global commerce possible.
        </motion.p>
      </motion.div>

      {/* Lightning Network Core Analytics */}
      <motion.div 
        className="lightning-core-section"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        {/* Network Status Dashboard */}
        <motion.div 
          className="network-dashboard"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="dashboard-header">
            <div className="header-content">
              <motion.div 
                className="lightning-pulse"
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                ⚡
              </motion.div>
              <div className="header-text">
                <h3>Lightning Network Status</h3>
                <span className="status-live">● Live Network Data</span>
              </div>
            </div>
            <div className="network-health">
              <span className="health-status">Operational</span>
              <span className="health-score">99.8%</span>
            </div>
          </div>
          
          <div className="metrics-row">
            <div className="metric-item">
              <div className="metric-icon">🌐</div>
              <div className="metric-content">
                <span className="metric-value">{realTimeData.nodes.toLocaleString()}</span>
                <span className="metric-label">Active Nodes</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon">🔗</div>
              <div className="metric-content">
                <span className="metric-value">{realTimeData.channels.toLocaleString()}</span>
                <span className="metric-label">Payment Channels</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon">💰</div>
              <div className="metric-content">
                <span className="metric-value">{realTimeData.capacity.toFixed(1)} BTC</span>
                <span className="metric-label">Network Capacity</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon">📈</div>
              <div className="metric-content">
                <span className="metric-value">{realTimeData.routingSuccess.toFixed(1)}%</span>
                <span className="metric-label">Success Rate</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Payment Processing Cards */}
        <div className="processing-cards">
          <motion.div 
            className="process-card instant-payments"
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            whileHover={{ y: -5 }}
          >
            <div className="card-header-clean">
              <div className="card-icon-large">⚡</div>
              <div className="card-title-clean">Instant Payments</div>
            </div>
            <div className="card-content-clean">
              <div className="feature-list">
                <div className="feature-item">
                  <span className="feature-icon">🚀</span>
                  <span className="feature-text">&lt; 1 second settlement</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">💸</span>
                  <span className="feature-text">Micropayments enabled</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🌍</span>
                  <span className="feature-text">24/7 global availability</span>
                </div>
              </div>
              <div className="payment-simulation">
                <motion.div 
                  className="payment-flow"
                  animate={{ x: [0, 200, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  💰
                </motion.div>
                <div className="flow-path"></div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="process-card ai-routing"
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            whileHover={{ y: -5 }}
          >
            <div className="card-header-clean">
              <div className="card-icon-large">🧠</div>
              <div className="card-title-clean">AI Route Optimization</div>
            </div>
            <div className="card-content-clean">
              <div className="routing-metrics">
                <div className="routing-metric">
                  <span className="metric-number">99.2%</span>
                  <span className="metric-desc">Success Rate</span>
                </div>
                <div className="routing-metric">
                  <span className="metric-number">47ms</span>
                  <span className="metric-desc">Avg Latency</span>
                </div>
                <div className="routing-metric">
                  <span className="metric-number">1.8</span>
                  <span className="metric-desc">Avg Hops</span>
                </div>
              </div>
              <div className="efficiency-bar">
                <div className="efficiency-label">Route Efficiency</div>
                <div className="efficiency-track">
                  <motion.div 
                    className="efficiency-progress"
                    initial={{ width: 0 }}
                    animate={{ width: '94.8%' }}
                    transition={{ duration: 2, delay: 1 }}
                  />
                </div>
                <span className="efficiency-percent">94.8%</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Channel Management */}
        <motion.div 
          className="channel-management"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <div className="management-header">
            <div className="header-icon">⚙️</div>
            <h3>Channel Management & Liquidity</h3>
            <div className="auto-badge">AUTO</div>
          </div>
          
          <div className="management-content">
            <div className="liquidity-overview">
              <div className="liquidity-title">Network Liquidity Distribution</div>
              <div className="liquidity-chart">
                {[
                  { label: 'Inbound', value: 45.2, color: '#3b82f6' },
                  { label: 'Outbound', value: 38.7, color: '#10b981' },
                  { label: 'Balanced', value: 16.1, color: '#8b5cf6' }
                ].map((item, index) => (
                  <div key={index} className="liquidity-segment">
                    <div className="segment-bar">
                      <motion.div
                        className="segment-fill"
                        style={{ backgroundColor: item.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        transition={{ duration: 1.5, delay: index * 0.2 }}
                      />
                    </div>
                    <div className="segment-info">
                      <span className="segment-label">{item.label}</span>
                      <span className="segment-value">{item.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="management-stats">
              <div className="stat-card">
                <div className="stat-icon">🔗</div>
                <div className="stat-content">
                  <span className="stat-title">Channel Balance</span>
                  <span className="stat-status optimal">Optimally Distributed</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🔄</div>
                <div className="stat-content">
                  <span className="stat-title">Rebalancing</span>
                  <span className="stat-status auto">AI-Automated</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <span className="stat-title">Fee Optimization</span>
                  <span className="stat-status active">Active</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

    </motion.div>
  );
};

export default LightningNetwork;
