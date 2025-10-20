import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LightningNetwork = () => {
  const [realTimeData, setRealTimeData] = useState({
    nodes: 15847,
    channels: 67234,
    capacity: 4127.8,
    routingSuccess: 97.3
  });

  const [activeTab, setActiveTab] = useState('overview');

  // Sample network activity data
  const [networkActivity, setNetworkActivity] = useState([
    {
      id: 1,
      type: 'payment_routed',
      amount: 67890,
      hops: 4,
      timestamp: Date.now() - 1000
    },
    {
      id: 2,
      type: 'channel_open',
      amount: 243000,
      hops: 3,
      timestamp: Date.now() - 3000
    },
    {
      id: 3,
      type: 'payment_routed',
      amount: 1234,
      hops: 5,
      timestamp: Date.now() - 5000
    },
    {
      id: 4,
      type: 'payment_routed',
      amount: 98765,
      hops: 3,
      timestamp: Date.now() - 8000
    },
    {
      id: 5,
      type: 'channel_open',
      amount: 567890,
      hops: 4,
      timestamp: Date.now() - 12000
    }
  ]);

  const technicalSpecs = [
    {
      icon: '⚡',
      title: 'Transaction Speed',
      current: '< 1 second',
      comparison: '10 minutes',
      improvement: '600x faster',
      description: 'Instant settlement through payment channels'
    },
    {
      icon: '💰',
      title: 'Transaction Fees',
      current: '< 0.1¢',
      comparison: '$2.50',
      improvement: '2500x cheaper',
      description: 'Minimal routing fees for micropayments'
    },
    {
      icon: '🔄',
      title: 'Throughput',
      current: '1M+ TPS',
      comparison: '7 TPS',
      improvement: '142,857x more',
      description: 'Unlimited scalability potential'
    },
    {
      icon: '🔐',
      title: 'Privacy',
      current: 'Onion routing',
      comparison: 'Public ledger',
      improvement: 'Enhanced',
      description: 'Multi-hop privacy protection'
    }
  ];

  const useCases = [
    {
      icon: '☕',
      title: 'Micropayments',
      description: 'Perfect for small purchases like coffee, digital content, or pay-per-use services.',
      adoption: '85%',
      growth: '+340%',
      examples: ['Strike App', 'Breez Wallet', 'Phoenix Wallet']
    },
    {
      icon: '🎮',
      title: 'Gaming & Streaming',
      description: 'In-game purchases, streaming tips, and real-time value transfer for digital experiences.',
      adoption: '67%',
      growth: '+280%',
      examples: ['Stakwork', 'Fountain App', 'THNDR Games']
    },
    {
      icon: '🌍',
      title: 'Cross-border Payments',
      description: 'Instant international transfers without traditional banking intermediaries.',
      adoption: '78%',
      growth: '+420%',
      examples: ['Strike', 'Wallet of Satoshi', 'Muun Wallet']
    },
    {
      icon: '🤖',
      title: 'Machine-to-Machine',
      description: 'IoT devices, API payments, and automated microtransactions between systems.',
      adoption: '45%',
      growth: '+890%',
      examples: ['L402 Protocol', 'Lightning Labs', 'Suredbits API']
    }
  ];

  const predictions = [
    {
      year: '2024',
      metric: 'Active Nodes',
      value: '25,000+',
      confidence: '94%'
    },
    {
      year: '2025',
      metric: 'Network Capacity',
      value: '10,000 BTC',
      confidence: '87%'
    },
    {
      year: '2026',
      metric: 'Daily Transactions',
      value: '50M+',
      confidence: '82%'
    },
    {
      year: '2027',
      metric: 'Global Adoption',
      value: '500M Users',
      confidence: '76%'
    }
  ];

  const aiInsights = [
    {
      type: 'Network Growth',
      text: 'Lightning Network shows exponential growth in channel capacity with 340% increase year-over-year.',
      impact: 94
    },
    {
      type: 'Adoption Pattern',
      text: 'Gaming and streaming sectors demonstrate highest Lightning adoption rates at 67% implementation.',
      impact: 87
    },
    {
      type: 'Technical Innovation',
      text: 'Multi-path payments and atomic multi-path routing significantly improve success rates to 97.3%.',
      impact: 91
    },
    {
      type: 'Market Prediction',
      text: 'AI models predict Lightning will process 50M+ daily transactions by 2026 with 82% confidence.',
      impact: 88
    }
  ];

  const tabVariants = {
    active: {
      scale: 1.05,
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: 'rgba(59, 130, 246, 0.5)'
    },
    inactive: {
      scale: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderColor: 'rgba(255, 255, 255, 0.1)'
    }
  };

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        nodes: prev.nodes + Math.floor(Math.random() * 3),
        channels: prev.channels + Math.floor(Math.random() * 5),
        capacity: prev.capacity + (Math.random() * 0.1),
        routingSuccess: 97.3 + (Math.random() * 0.4)
      }));

      // Add new network activity
      setNetworkActivity(prev => [
        {
          id: Date.now(),
          type: Math.random() > 0.5 ? 'payment_routed' : 'channel_open',
          amount: Math.floor(Math.random() * 100000) + 1000,
          hops: Math.floor(Math.random() * 5) + 2,
          timestamp: Date.now()
        },
        ...prev.slice(0, 4)
      ]);
    }, 5000);

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






