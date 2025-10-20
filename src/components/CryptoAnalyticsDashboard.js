import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import cryptoAnalyticsService from '../services/cryptoAnalyticsService';
import './CryptoAnalyticsDashboard.css';

const CryptoAnalyticsDashboard = ({ standalone = false }) => {
  const [isVisible, setIsVisible] = useState(standalone); // Dacă e standalone, start ca vizibil
  const [analyticsData, setAnalyticsData] = useState({});
  const [userInsights, setUserInsights] = useState({});
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [cryptoMetrics, setCryptoMetrics] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [realTimeData, setRealTimeData] = useState({
    btcPrice: 45250.32,
    ethPrice: 3180.45,
    marketCap: 2.1e12,
    volume24h: 125.6e9,
    totalTransactions: 142580,
    activeWallets: 8247,
    networkHashrate: 198.5e18,
    gasPrice: 25.4
  });
  const [aiPredictions, setAiPredictions] = useState([]);
  const [networkStatus, setNetworkStatus] = useState({
    bitcoin: { status: 'online', blockHeight: 756234, tps: 7.2 },
    ethereum: { status: 'online', blockHeight: 18156789, tps: 15.8 },
    polygon: { status: 'online', blockHeight: 47832156, tps: 65.3 }
  });
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);
  const particleRef = useRef(null);

  // Real-time data updates
  useEffect(() => {
    if (isVisible) {
      updateAnalyticsData();
      startRealTimeUpdates();
      initializeAIPredictions();
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [isVisible]);

  const startRealTimeUpdates = () => {
    intervalRef.current = setInterval(() => {
      updateRealTimeData();
      updateNetworkStatus();
    }, 20000); // 🔧 Reduced from 3s to 20s to prevent rate limiting
  };

  const updateRealTimeData = () => {
    setRealTimeData(prev => ({
      btcPrice: prev.btcPrice + (Math.random() - 0.5) * 500,
      ethPrice: prev.ethPrice + (Math.random() - 0.5) * 100,
      marketCap: prev.marketCap + (Math.random() - 0.5) * 1e10,
      volume24h: prev.volume24h + (Math.random() - 0.5) * 1e9,
      totalTransactions: prev.totalTransactions + Math.floor(Math.random() * 10),
      activeWallets: prev.activeWallets + Math.floor(Math.random() * 20) - 10,
      networkHashrate: prev.networkHashrate + (Math.random() - 0.5) * 1e17,
      gasPrice: Math.max(15, prev.gasPrice + (Math.random() - 0.5) * 5)
    }));
  };

  const updateNetworkStatus = () => {
    setNetworkStatus(prev => ({
      bitcoin: {
        ...prev.bitcoin,
        blockHeight: prev.bitcoin.blockHeight + Math.floor(Math.random() * 2),
        tps: Math.max(5, prev.bitcoin.tps + (Math.random() - 0.5) * 2)
      },
      ethereum: {
        ...prev.ethereum,
        blockHeight: prev.ethereum.blockHeight + Math.floor(Math.random() * 3),
        tps: Math.max(10, prev.ethereum.tps + (Math.random() - 0.5) * 5)
      },
      polygon: {
        ...prev.polygon,
        blockHeight: prev.polygon.blockHeight + Math.floor(Math.random() * 10),
        tps: Math.max(50, prev.polygon.tps + (Math.random() - 0.5) * 15)
      }
    }));
  };

  const initializeAIPredictions = () => {
    const predictions = [
      {
        type: 'price',
        asset: 'BTC',
        prediction: 'Bullish momentum detected - potential 8% increase in 24h',
        confidence: 0.87,
        timeframe: '24h',
        icon: '📈'
      },
      {
        type: 'market',
        asset: 'ETH',
        prediction: 'Network congestion expected - gas fees may increase',
        confidence: 0.72,
        timeframe: '4h',
        icon: '⛽'
      },
      {
        type: 'risk',
        asset: 'Overall',
        prediction: 'Market volatility warning - consider position sizing',
        confidence: 0.91,
        timeframe: '12h',
        icon: '⚠️'
      },
      {
        type: 'opportunity',
        asset: 'DeFi',
        prediction: 'Liquidity pool APY optimization detected',
        confidence: 0.65,
        timeframe: '6h',
        icon: '💎'
      }
    ];
    setAiPredictions(predictions);
  };

  const updateAnalyticsData = () => {
    const summary = cryptoAnalyticsService.getCryptoAnalyticsSummary();
    const insights = cryptoAnalyticsService.getUserBehaviorInsights();
    
    setAnalyticsData(summary);
    setUserInsights(insights);
    setPerformanceMetrics(summary.cryptoMetrics || {});
    setCryptoMetrics(summary.sessionData || {});
  };

  const toggleDashboard = () => {
    setIsVisible(!isVisible);
    if (!isVisible) {
      cryptoAnalyticsService.trackCryptoEvent('crypto_analytics_ai_dashboard_open', {
        timestamp: Date.now(),
        version: 'ai_enhanced_v3'
      });
    }
  };

  useEffect(() => {
    const handleToggle = () => toggleDashboard();
    window.addEventListener('toggleCryptoDashboard', handleToggle);
    return () => window.removeEventListener('toggleCryptoDashboard', handleToggle);
  }, []);

  const handleAIAction = (action) => {
    setLoading(true);
    console.log(`🤖 AI Action: ${action}`);
    
    setTimeout(() => {
      switch (action) {
        case 'analyze_portfolio':
          console.log('📊 AI Portfolio Analysis complete');
          break;
        case 'optimize_gas':
          console.log('⛽ Gas optimization recommendations generated');
          break;
        case 'risk_assessment':
          console.log('⚠️ Risk assessment updated');
          break;
        case 'predict_prices':
          console.log('🔮 Price predictions refreshed');
          initializeAIPredictions();
          break;
        default:
          console.log('✅ AI action completed');
      }
      setLoading(false);
    }, 2000);
  };

  const formatCurrency = (value, decimals = 2) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(decimals)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(decimals)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(decimals)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(decimals)}K`;
    return `$${value.toFixed(decimals)}`;
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(Math.floor(num));
  };

  const formatHashrate = (hashrate) => {
    return `${(hashrate / 1e18).toFixed(1)} EH/s`;
  };

  const getRiskToleranceColor = (risk) => {
    switch (risk) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getExperienceLevelColor = (level) => {
    switch (level) {
      case 'experienced': return '#10b981';
      case 'intermediate': return '#f59e0b';
      case 'beginner': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return '#10b981';
    if (confidence >= 0.6) return '#f59e0b';
    return '#ef4444';
  };

  if (!isVisible) {
    return null; // Nu afișa butonul floating, doar din hamburger
  }

  return (
    <AnimatePresence>
      <motion.div 
        className="crypto-analytics-dashboard ai-enhanced"
        initial={{ opacity: 0, scale: 0.8, x: 100 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.8, x: 100 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* AI Particles Background */}
        <div className="ai-particles-crypto">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="crypto-particle"
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 3
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
            />
          ))}
        </div>

        {/* Enhanced Header */}
        <motion.div 
          className="dashboard-header ai-crypto-header"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="header-content">
            <div className="header-title">
              <span className="ai-badge crypto">AI</span>
              <h3>🚀 Crypto Analytics Intelligence</h3>
              <div className="live-indicator">
                <span className="live-dot"></span>
                <span>LIVE</span>
              </div>
            </div>
            <div className="crypto-metrics-mini">
              <span className="mini-metric">
                BTC: {formatCurrency(realTimeData.btcPrice)}
              </span>
              <span className="mini-metric">
                ETH: {formatCurrency(realTimeData.ethPrice)}
              </span>
            </div>
          </div>
          <motion.button 
            className="dashboard-close ai-close"
            onClick={toggleDashboard}
            whileHover={{ rotate: 90, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <span className="close-lines"></span>
          </motion.button>
        </motion.div>

        {/* AI Predictions Banner */}
        <motion.div 
          className="ai-predictions-banner"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h4>🤖 AI Predictions</h4>
          <div className="predictions-scroll">
            {aiPredictions.map((prediction, index) => (
              <motion.div
                key={index}
                className="prediction-card"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <div className="prediction-icon">{prediction.icon}</div>
                <div className="prediction-content">
                  <div className="prediction-text">{prediction.prediction}</div>
                  <div className="prediction-meta">
                    <span className="confidence" style={{ color: getConfidenceColor(prediction.confidence) }}>
                      {(prediction.confidence * 100).toFixed(0)}% confidence
                    </span>
                    <span className="timeframe">{prediction.timeframe}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Enhanced Navigation Tabs */}
        <div className="dashboard-tabs ai-crypto-tabs">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'trading', label: 'Trading AI', icon: '🤖' },
            { id: 'defi', label: 'DeFi Analytics', icon: '🏦' },
            { id: 'portfolio', label: 'Portfolio', icon: '💼' },
            { id: 'network', label: 'Network', icon: '🌐' }
          ].map(tab => (
            <motion.button
              key={tab.id}
              className={`tab ai-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  className="tab-indicator"
                  layoutId="activeCryptoTab"
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Enhanced Content */}
        <div className="dashboard-content ai-crypto-content">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="tab-content"
              >
                {/* Real-time Market Metrics */}
                <div className="crypto-metrics-grid">
                  <motion.div 
                    className="crypto-metric-card major"
                    whileHover={{ scale: 1.02, y: -4 }}
                  >
                    <div className="metric-header">
                      <span className="metric-icon">₿</span>
                      <h4>Bitcoin</h4>
                      <div className="price-trend up">+2.4%</div>
                    </div>
                    <div className="metric-value major">
                      {formatCurrency(realTimeData.btcPrice)}
                    </div>
                    <div className="metric-chart">
                      <svg width="100%" height="40" viewBox="0 0 100 40">
                        <path
                          d="M0,30 Q25,20 50,15 T100,10"
                          stroke="#00ff88"
                          strokeWidth="2"
                          fill="none"
                        />
                      </svg>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="crypto-metric-card major"
                    whileHover={{ scale: 1.02, y: -4 }}
                  >
                    <div className="metric-header">
                      <span className="metric-icon">Ξ</span>
                      <h4>Ethereum</h4>
                      <div className="price-trend up">+1.8%</div>
                    </div>
                    <div className="metric-value major">
                      {formatCurrency(realTimeData.ethPrice)}
                    </div>
                    <div className="metric-chart">
                      <svg width="100%" height="40" viewBox="0 0 100 40">
                        <path
                          d="M0,35 Q25,25 50,20 T100,15"
                          stroke="#667eea"
                          strokeWidth="2"
                          fill="none"
                        />
                      </svg>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="crypto-metric-card"
                    whileHover={{ scale: 1.02, y: -4 }}
                  >
                    <h4>Market Cap</h4>
                    <div className="metric-value">
                      {formatCurrency(realTimeData.marketCap)}
                    </div>
                  </motion.div>

                  <motion.div 
                    className="crypto-metric-card"
                    whileHover={{ scale: 1.02, y: -4 }}
                  >
                    <h4>24h Volume</h4>
                    <div className="metric-value">
                      {formatCurrency(realTimeData.volume24h)}
                    </div>
                  </motion.div>

                  <motion.div 
                    className="crypto-metric-card"
                    whileHover={{ scale: 1.02, y: -4 }}
                  >
                    <h4>Total Transactions</h4>
                    <div className="metric-value">
                      {formatNumber(realTimeData.totalTransactions)}
                    </div>
                  </motion.div>

                  <motion.div 
                    className="crypto-metric-card"
                    whileHover={{ scale: 1.02, y: -4 }}
                  >
                    <h4>Active Wallets</h4>
                    <div className="metric-value">
                      {formatNumber(realTimeData.activeWallets)}
                    </div>
                  </motion.div>
                </div>

                {/* AI Actions */}
                <div className="ai-crypto-actions">
                  <h4>🤖 AI-Powered Actions</h4>
                  <div className="ai-action-grid">
                    <motion.button
                      className="ai-action-btn primary"
                      onClick={() => handleAIAction('analyze_portfolio')}
                      disabled={loading}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="action-icon">📊</span>
                      <span>AI Portfolio Analysis</span>
                      {loading && <div className="loading-spinner"></div>}
                    </motion.button>

                    <motion.button
                      className="ai-action-btn secondary"
                      onClick={() => handleAIAction('optimize_gas')}
                      disabled={loading}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="action-icon">⛽</span>
                      <span>Gas Optimization</span>
                    </motion.button>

                    <motion.button
                      className="ai-action-btn tertiary"
                      onClick={() => handleAIAction('risk_assessment')}
                      disabled={loading}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="action-icon">⚠️</span>
                      <span>Risk Assessment</span>
                    </motion.button>

                    <motion.button
                      className="ai-action-btn quaternary"
                      onClick={() => handleAIAction('predict_prices')}
                      disabled={loading}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="action-icon">🔮</span>
                      <span>Price Predictions</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'trading' && (
              <motion.div
                key="trading"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="tab-content"
              >
                <div className="trading-ai-section">
                  <h4>🤖 AI Trading Intelligence</h4>
                  
                  <div className="trading-signals">
                    <div className="signal-card strong-buy">
                      <div className="signal-header">
                        <span className="signal-icon">📈</span>
                        <span className="signal-type">STRONG BUY</span>
                        <span className="signal-confidence">92%</span>
                      </div>
                      <div className="signal-content">
                        <p>AI detected breakout pattern in BTC/USD</p>
                        <div className="signal-details">
                          <span>Target: $47,500</span>
                          <span>Stop Loss: $44,800</span>
                        </div>
                      </div>
                    </div>

                    <div className="signal-card hold">
                      <div className="signal-header">
                        <span className="signal-icon">⏸️</span>
                        <span className="signal-type">HOLD</span>
                        <span className="signal-confidence">76%</span>
                      </div>
                      <div className="signal-content">
                        <p>ETH consolidating before next move</p>
                        <div className="signal-details">
                          <span>Support: $3,100</span>
                          <span>Resistance: $3,250</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ai-trading-metrics">
                    <div className="trading-metric">
                      <h5>AI Success Rate</h5>
                      <div className="metric-value trading">84.7%</div>
                    </div>
                    <div className="trading-metric">
                      <h5>Total Signals</h5>
                      <div className="metric-value trading">1,247</div>
                    </div>
                    <div className="trading-metric">
                      <h5>Avg Profit</h5>
                      <div className="metric-value trading">+3.2%</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'defi' && (
              <motion.div
                key="defi"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="tab-content"
              >
                <div className="defi-section">
                  <h4>🏦 DeFi Analytics Dashboard</h4>
                  
                  <div className="defi-metrics">
                    <div className="defi-card">
                      <h5>Total Value Locked</h5>
                      <div className="metric-value defi">{formatCurrency(85.4e9)}</div>
                      <div className="change positive">+2.1%</div>
                    </div>
                    
                    <div className="defi-card">
                      <h5>Average APY</h5>
                      <div className="metric-value defi">12.7%</div>
                      <div className="change neutral">±0.0%</div>
                    </div>
                    
                    <div className="defi-card">
                      <h5>Active Protocols</h5>
                      <div className="metric-value defi">247</div>
                      <div className="change positive">+5</div>
                    </div>
                  </div>

                  <div className="defi-opportunities">
                    <h5>🎯 AI-Detected Opportunities</h5>
                    <div className="opportunity-list">
                      <div className="opportunity-item">
                        <span className="opportunity-protocol">Uniswap V3</span>
                        <span className="opportunity-apy">15.4% APY</span>
                        <span className="opportunity-risk low">Low Risk</span>
                      </div>
                      <div className="opportunity-item">
                        <span className="opportunity-protocol">Compound</span>
                        <span className="opportunity-apy">8.9% APY</span>
                        <span className="opportunity-risk medium">Medium Risk</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'portfolio' && (
              <motion.div
                key="portfolio"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="tab-content"
              >
                <div className="portfolio-section">
                  <h4>💼 Portfolio Intelligence</h4>
                  
                  <div className="portfolio-overview">
                    <div className="portfolio-value">
                      <h5>Total Portfolio Value</h5>
                      <div className="metric-value portfolio">{formatCurrency(156780.45)}</div>
                      <div className="change positive">+5.2% (24h)</div>
                    </div>
                  </div>

                  <div className="portfolio-allocation">
                    <h5>Asset Allocation</h5>
                    <div className="allocation-chart">
                      <div className="allocation-item">
                        <span className="asset-name">Bitcoin</span>
                        <div className="allocation-bar">
                          <div className="allocation-fill" style={{ width: '45%' }}></div>
                        </div>
                        <span className="allocation-percent">45%</span>
                      </div>
                      <div className="allocation-item">
                        <span className="asset-name">Ethereum</span>
                        <div className="allocation-bar">
                          <div className="allocation-fill" style={{ width: '30%' }}></div>
                        </div>
                        <span className="allocation-percent">30%</span>
                      </div>
                      <div className="allocation-item">
                        <span className="asset-name">Other</span>
                        <div className="allocation-bar">
                          <div className="allocation-fill" style={{ width: '25%' }}></div>
                        </div>
                        <span className="allocation-percent">25%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'network' && (
              <motion.div
                key="network"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="tab-content"
              >
                <div className="network-section">
                  <h4>🌐 Network Status & Analytics</h4>
                  
                  <div className="network-status-grid">
                    {Object.entries(networkStatus).map(([network, status]) => (
                      <motion.div 
                        key={network}
                        className="network-card"
                        whileHover={{ scale: 1.02, y: -2 }}
                      >
                        <div className="network-header">
                          <h5>{network.charAt(0).toUpperCase() + network.slice(1)}</h5>
                          <div className={`status-indicator ${status.status}`}>
                            <span className="status-dot"></span>
                            {status.status}
                          </div>
                        </div>
                        <div className="network-metrics">
                          <div className="network-metric">
                            <span>Block Height:</span>
                            <span>{formatNumber(status.blockHeight)}</span>
                          </div>
                          <div className="network-metric">
                            <span>TPS:</span>
                            <span>{status.tps.toFixed(1)}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="network-performance">
                    <h5>Network Performance</h5>
                    <div className="performance-metrics">
                      <div className="performance-item">
                        <span>Network Hashrate:</span>
                        <span>{formatHashrate(realTimeData.networkHashrate)}</span>
                      </div>
                      <div className="performance-item">
                        <span>Average Gas Price:</span>
                        <span>{realTimeData.gasPrice.toFixed(1)} gwei</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Enhanced Footer */}
        <motion.div 
          className="dashboard-footer ai-crypto-footer"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="footer-content">
            <div className="ai-status">
              <span className="ai-indicator active"></span>
              <span>AI Engine: Active</span>
            </div>
            <div className="data-freshness">
              <span>Last Update: {new Date().toLocaleTimeString()}</span>
            </div>
            <div className="footer-actions">
              <button onClick={() => updateAnalyticsData()} disabled={loading}>
                🔄 Refresh
              </button>
              <button onClick={() => console.log('📊 Export data')}>
                📊 Export
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CryptoAnalyticsDashboard;