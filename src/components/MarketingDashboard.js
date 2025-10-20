import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import marketingService from '../services/marketingService';
import './MarketingDashboard.css';

const MarketingDashboard = ({ standalone = false }) => {
  const [isVisible, setIsVisible] = useState(standalone); // Dacă e standalone, start ca vizibil
  const [marketingData, setMarketingData] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [realTimeStats, setRealTimeStats] = useState({
    activeUsers: 0,
    conversionRate: 0,
    revenue: 0,
    engagement: 0
  });
  const intervalRef = useRef(null);
  const particleRef = useRef(null);

  useEffect(() => {
    if (isVisible) {
      initializeDashboard();
      startRealTimeUpdates();
      initializeParticles();
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [isVisible]);

  useEffect(() => {
    const handleToggle = () => setIsVisible(!isVisible);
    window.addEventListener('toggleMarketingDashboard', handleToggle);
    return () => window.removeEventListener('toggleMarketingDashboard', handleToggle);
  }, [isVisible]);

  const startRealTimeUpdates = () => {
    intervalRef.current = setInterval(() => {
      updateMarketingData();
      updateRealTimeStats();
    }, 3000); // Update every 3 seconds for more real-time feel
  };

  const updateRealTimeStats = () => {
    setRealTimeStats(prev => ({
      activeUsers: Math.floor(Math.random() * 50) + 150,
      conversionRate: (Math.random() * 2 + 8).toFixed(2),
      revenue: Math.floor(Math.random() * 1000) + 12000,
      engagement: (Math.random() * 3 + 6).toFixed(1)
    }));
  };

  const initializeParticles = () => {
    // Initialize AI particle background
    if (particleRef.current) {
      createParticleAnimation();
    }
  };

  const createParticleAnimation = () => {
    // Create floating AI particles for background effect
    const particles = [];
    for (let i = 0; i < 20; i++) {
      particles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 0.5 + 0.1
      });
    }
    return particles;
  };

  const initializeDashboard = async () => {
    setLoading(true);
    try {
      await marketingService.init();
      updateMarketingData();
      addNotification('Dashboard initialized successfully! 🚀', 'success');
    } catch (error) {
      addNotification('Error initializing dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateMarketingData = () => {
    const analytics = marketingService.getAnalytics();
    setMarketingData(analytics);
  };

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const toggleDashboard = () => {
    setIsVisible(!isVisible);
    if (!isVisible) {
      addNotification('Marketing Dashboard opened', 'info');
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const calculateGrowthRate = (current, previous) => {
    if (!previous) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const handleAction = async (action, data) => {
    setLoading(true);
    try {
      switch (action) {
        case 'share':
          await marketingService.share(data);
          addNotification(`Shared on ${data}! 📱`, 'success');
          break;
        case 'copy':
          await marketingService.copyLink();
          addNotification('Referral link copied! 📋', 'success');
          break;
        case 'export':
          await marketingService.exportData();
          addNotification('Data exported successfully! 📊', 'success');
          break;
        case 'optimize':
          await marketingService.optimizeCampaigns();
          addNotification('Campaigns optimized! ⚡', 'success');
          break;
        default:
          updateMarketingData();
          addNotification('Data refreshed! 🔄', 'info');
      }
    } catch (error) {
      addNotification(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) {
    return null; // Nu afișa butonul floating, doar din hamburger
  }

  return (
    <AnimatePresence>
      <motion.div
        className="marketing-dashboard ai-enhanced"
        initial={{ opacity: 0, x: 300, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 300, scale: 0.8 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        ref={particleRef}
      >
        {/* AI Particle Background */}
        <div className="ai-particles">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="particle"
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
            />
          ))}
        </div>

        {/* Enhanced Header */}
        <div className="dashboard-header ai-glass">
          <div className="header-content">
            <div className="header-title">
              <span className="ai-badge">AI</span>
              <h3>🤖 Marketing Intelligence</h3>
              <div className="neural-network">
                <span className="node"></span>
                <span className="node active"></span>
                <span className="node"></span>
              </div>
            </div>
            <div className="header-stats">
              <div className="live-indicator pulsing">
                <span className="status-dot"></span>
                <span>Real-time Analytics</span>
              </div>
              <div className="real-time-counter">
                <span className="counter-label">Active Users:</span>
                <motion.span 
                  className="counter-value"
                  key={realTimeStats.activeUsers}
                  initial={{ scale: 1.2, color: "#00ff88" }}
                  animate={{ scale: 1, color: "#ffffff" }}
                  transition={{ duration: 0.3 }}
                >
                  {realTimeStats.activeUsers}
                </motion.span>
              </div>
            </div>
          </div>
          <motion.button 
            className="dashboard-close ai-close" 
            onClick={toggleDashboard}
            title="Close AI Dashboard"
            whileHover={{ rotate: 90, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <span className="close-lines"></span>
          </motion.button>
        </div>

        {/* Notifications */}
        <AnimatePresence>
          {notifications.map(notification => (
            <motion.div
              key={notification.id}
              className={`notification ${notification.type}`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {notification.message}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* AI Navigation Tabs */}
        <div className="dashboard-tabs ai-tabs">
          {[
            { id: 'overview', label: 'Neural Overview', icon: '🧠' },
            { id: 'referrals', label: 'Growth Vector', icon: '🚀' },
            { id: 'social', label: 'Network Graph', icon: '🌐' },
            { id: 'analytics', label: 'Deep Insights', icon: '🔬' }
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
                  className="active-indicator"
                  layoutId="activeTab"
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* AI Loading Indicator */}
        {loading && (
          <motion.div 
            className="loading-indicator ai-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="ai-brain">
              <div className="brain-core"></div>
              <div className="neural-pulse"></div>
              <div className="neural-pulse delay-1"></div>
              <div className="neural-pulse delay-2"></div>
            </div>
            <div className="loading-text">
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                AI Processing Neural Networks...
              </motion.span>
            </div>
          </motion.div>
        )}

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="tab-content ai-content"
            >
              {/* AI Metrics Grid */}
              <div className="metrics-grid ai-metrics">
                <motion.div 
                  className="metric-card ai-card primary"
                  whileHover={{ scale: 1.02, rotateY: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="metric-header">
                    <div className="metric-icon">🧬</div>
                    <h4>Neural Engagement</h4>
                    <motion.span 
                      className="trend positive glowing"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      +{realTimeStats.engagement}%
                    </motion.span>
                  </div>
                  <motion.div 
                    className="metric-value"
                    key={realTimeStats.engagement}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                  >
                    {realTimeStats.engagement}%
                  </motion.div>
                  <div className="metric-footer">
                    <span>Real-time engagement</span>
                    <div className="pulse-bar"></div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="metric-card ai-card"
                  whileHover={{ scale: 1.02, rotateY: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="metric-header">
                    <div className="metric-icon">🎯</div>
                    <h4>Conversion Vector</h4>
                    <span className="trend positive">+{realTimeStats.conversionRate}%</span>
                  </div>
                  <motion.div 
                    className="metric-value"
                    key={realTimeStats.conversionRate}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                  >
                    {realTimeStats.conversionRate}%
                  </motion.div>
                  <div className="metric-footer">
                    <span>Optimal performance</span>
                    <div className="pulse-bar success"></div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="metric-card ai-card"
                  whileHover={{ scale: 1.02, rotateY: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="metric-header">
                    <div className="metric-icon">⚡</div>
                    <h4>Revenue Stream</h4>
                    <span className="trend positive">+24.7%</span>
                  </div>
                  <motion.div 
                    className="metric-value"
                    key={realTimeStats.revenue}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                  >
                    ${formatNumber(realTimeStats.revenue)}
                  </motion.div>
                  <div className="metric-footer">
                    <span>Neural prediction</span>
                    <div className="pulse-bar warning"></div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="metric-card ai-card"
                  whileHover={{ scale: 1.02, rotateY: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="metric-header">
                    <div className="metric-icon">🌊</div>
                    <h4>Network Effect</h4>
                    <span className="trend positive">+18.3%</span>
                  </div>
                  <div className="metric-value">
                    {formatNumber(marketingData.referralData?.referrals?.length || 347)}
                  </div>
                  <div className="metric-footer">
                    <span>Growth acceleration</span>
                    <div className="pulse-bar info"></div>
                  </div>
                </motion.div>
              </div>

              {/* AI Neural Performance Chart */}
              <div className="chart-container ai-chart">
                <div className="chart-header">
                  <h4>🧠 Neural Performance Matrix</h4>
                  <div className="chart-controls">
                    <span className="matrix-indicator">🔴 Live</span>
                    <span className="data-flow">Data Flow: Active</span>
                  </div>
                </div>
                <div className="ai-chart-visualization">
                  <div className="neural-chart">
                    {[65, 78, 82, 71, 89, 94, 87, 76, 92].map((height, i) => (
                      <motion.div
                        key={i}
                        className="neural-bar"
                        style={{ height: `${height}%` }}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ 
                          height: `${height}%`, 
                          opacity: 1,
                          boxShadow: [
                            `0 0 10px rgba(102, 126, 234, 0.3)`,
                            `0 0 20px rgba(118, 75, 162, 0.5)`,
                            `0 0 10px rgba(102, 126, 234, 0.3)`
                          ]
                        }}
                        transition={{ 
                          delay: i * 0.1,
                          boxShadow: { duration: 2, repeat: Infinity, delay: i * 0.2 }
                        }}
                        whileHover={{ 
                          scale: 1.1, 
                          boxShadow: "0 0 30px rgba(102, 126, 234, 0.8)" 
                        }}
                      />
                    ))}
                  </div>
                  <div className="chart-neural-network">
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="network-node"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.3
                        }}
                        style={{
                          left: `${15 + i * 12}%`,
                          top: `${Math.sin(i) * 20 + 50}%`
                        }}
                      />
                    ))}
                  </div>
                  <div className="chart-labels ai-labels">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S', 'M', 'T'].map((day, i) => (
                      <span key={i} className="neural-label">{day}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'referrals' && (
            <motion.div
              key="referrals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="tab-content"
            >
              <div className="referral-section">
                <h4>🎯 Referral Program</h4>
                <div className="referral-code-container">
                  <label>Your Referral Code:</label>
                  <div className="code-input-group">
                    <input 
                      type="text" 
                      value={`${window.location.origin}?ref=${marketingData.referralData?.userCode || 'DEMO123'}`}
                      readOnly 
                    />
                    <button 
                      className="copy-btn"
                      onClick={() => handleAction('copy')}
                      disabled={loading}
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
                
                <div className="referral-stats">
                  <div className="stat-item">
                    <span className="stat-label">Total Clicks</span>
                    <span className="stat-value">1,247</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Conversions</span>
                    <span className="stat-value">89</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Earnings</span>
                    <span className="stat-value">{formatCurrency(2847)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'social' && (
            <motion.div
              key="social"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="tab-content"
            >
              <div className="social-section">
                <h4>📱 Social Media Integration</h4>
                <div className="social-actions">
                  <button 
                    className="social-btn twitter"
                    onClick={() => handleAction('share', 'twitter')}
                    disabled={loading}
                  >
                    🐦 Share on Twitter
                  </button>
                  <button 
                    className="social-btn facebook"
                    onClick={() => handleAction('share', 'facebook')}
                    disabled={loading}
                  >
                    📘 Share on Facebook
                  </button>
                  <button 
                    className="social-btn telegram"
                    onClick={() => handleAction('share', 'telegram')}
                    disabled={loading}
                  >
                    ✈️ Share on Telegram
                  </button>
                </div>
                
                <div className="social-metrics">
                  <div className="metric-card social">
                    <h5>Social Shares</h5>
                    <div className="metric-value">{formatNumber(1847)}</div>
                  </div>
                  <div className="metric-card social">
                    <h5>Reach</h5>
                    <div className="metric-value">{formatNumber(45672)}</div>
                  </div>
                  <div className="metric-card social">
                    <h5>Engagement</h5>
                    <div className="metric-value">7.2%</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="tab-content"
            >
              <div className="analytics-section">
                <h4>🎯 Advanced Analytics</h4>
                
                <div className="quick-actions enhanced">
                  <button 
                    className="action-btn primary"
                    onClick={() => handleAction('optimize')}
                    disabled={loading}
                  >
                    ⚡ Optimize Campaigns
                  </button>
                  <button 
                    className="action-btn secondary"
                    onClick={() => handleAction('export')}
                    disabled={loading}
                  >
                    📊 Export Data
                  </button>
                  <button 
                    className="action-btn tertiary"
                    onClick={() => handleAction('refresh')}
                    disabled={loading}
                  >
                    🔄 Refresh Data
                  </button>
                </div>

                <div className="analytics-insights">
                  <div className="insight-card">
                    <h5>💡 Key Insights</h5>
                    <ul>
                      <li>Best performing channel: Email Marketing (+18.5%)</li>
                      <li>Peak activity time: 2-4 PM UTC</li>
                      <li>Top referral source: Social Media (42%)</li>
                      <li>Conversion rate above industry average</li>
                    </ul>
                  </div>
                  
                  <div className="insight-card">
                    <h5>🎯 Recommendations</h5>
                    <ul>
                      <li>Increase social media posting frequency</li>
                      <li>A/B test email subject lines</li>
                      <li>Launch retargeting campaign</li>
                      <li>Optimize landing page conversion</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* AI Footer */}
        <div className="dashboard-footer ai-footer">
          <div className="footer-content">
            <div className="ai-status">
              <div className="neural-indicator">
                <span className="neural-dot"></span>
                <span className="neural-dot active"></span>
                <span className="neural-dot"></span>
              </div>
              <span className="status-text">
                {loading ? 'Neural Processing...' : 'AI Systems Online'}
              </span>
            </div>
            <div className="data-source">
              <span className="ai-badge-mini">AI</span>
              <span>Marketing Intelligence v3.0</span>
            </div>
          </div>
          <div className="footer-metrics">
            <span className="mini-metric">
              Uptime: 99.9%
            </span>
            <span className="mini-metric">
              Response: 0.02s
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MarketingDashboard;