/**
 * 🎁 AI REWARDS HUB ENHANCED
 * 
 * Versiune îmbunătățită a componentei AI Rewards Hub cu:
 * - Logică optimizată de date (fără duplicate)
 * - Design modern și responsive
 * - Analytics și grafice interactive
 * - Performance îmbunătățit
 * - Real-time updates
 * - Mobile optimization
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, AreaChart, Area, BarChart, Bar } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import useOptimizedRewardsData from "./hooks/useOptimizedRewardsData";
import FontTest from "./FontTest";
import "./AIRewardsHubEnhanced.css";

// Color palette pentru grafice
const REWARD_COLORS = {
  telegram: "#00D4FF",
  referral: "#7B68EE", 
  node: "#FF6B9D",
  unified: "#FFD700",
  claimed: "#00FF88"
};

// Animations
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.4 }
  },
  hover: { 
    scale: 1.02,
    transition: { duration: 0.2 }
  }
};

export default function AIRewardsHubEnhanced({ walletAddress }) {
  // Optimized rewards data
  const rewardsData = useOptimizedRewardsData(walletAddress);
  
  // UI State
  const [activeTab, setActiveTab] = useState("overview");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [lastTotalUnclaimed, setLastTotalUnclaimed] = useState(0);

  // Real-time notifications
  useEffect(() => {
    if (rewardsData.totalUnclaimed > lastTotalUnclaimed && lastTotalUnclaimed > 0) {
      const newReward = rewardsData.totalUnclaimed - lastTotalUnclaimed;
      addNotification({
        id: Date.now(),
        type: "reward",
        message: `🎉 New reward available: +${newReward.toFixed(2)} BITS!`,
        timestamp: new Date().toISOString()
      });
    }
    setLastTotalUnclaimed(rewardsData.totalUnclaimed);
  }, [rewardsData.totalUnclaimed, lastTotalUnclaimed]);

  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep max 5
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, []);

  // Prepare chart data
  const pieChartData = useMemo(() => {
    if (!rewardsData.totalUnclaimed) return [];
    
    return [
      { name: "Telegram", value: rewardsData.telegram.pending, color: REWARD_COLORS.telegram },
      { name: "Referral", value: rewardsData.referral.pending, color: REWARD_COLORS.referral },
      { name: "Node Rewards", value: rewardsData.nodeRewards.balance, color: REWARD_COLORS.node },
      { name: "Other", value: rewardsData.unified.totalPending, color: REWARD_COLORS.unified }
    ].filter(item => item.value > 0);
  }, [rewardsData]);

  // Activity timeline data (mock for now - can be enhanced with real data)
  const timelineData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        telegram: Math.random() * 50,
        referral: Math.random() * 20,
        node: Math.random() * 30
      };
    });
  }, []);

  // Performance metrics
  const performanceMetrics = useMemo(() => {
    const telegramRate = rewardsData.telegram.timeSpent > 0 ? 
      (rewardsData.telegram.messages / (rewardsData.telegram.timeSpent / 3600)).toFixed(1) : 0;
    
    return {
      efficiency: telegramRate,
      growth: "+12.5%", // Mock data
      streak: "7 days", // Mock data
      rank: "Top 15%" // Mock data
    };
  }, [rewardsData.telegram]);

  if (!walletAddress) {
    return (
      <motion.div 
        className="ai-rewards-hub-enhanced"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="connect-wallet-prompt">
          <div className="connect-icon">🔌</div>
          <h3>Connect Your Wallet</h3>
          <p>Connect your wallet to access your AI Rewards Hub and view your earnings.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="ai-rewards-hub-enhanced"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Font Test Component */}
      <FontTest />
      {/* Floating Notifications */}
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            className="floating-notification"
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ duration: 0.3 }}
          >
            <div className={`notification-content ${notification.type}`}>
              {notification.message}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Header */}
      <motion.div className="rewards-header" variants={cardVariants}>
        <div className="header-content">
          <div className="header-main">
            <h1 className="rewards-title">
              <span className="title-icon">🎁</span>
              Your AI Rewards Hub
            </h1>
            <div className="header-stats">
              <div className="stat-item">
                <span className="stat-label">Last Updated</span>
                <span className="stat-value">
                  {rewardsData.lastUpdated ? 
                    new Date(rewardsData.lastUpdated).toLocaleTimeString() : 
                    "Never"
                  }
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Status</span>
                <span className={`stat-value ${rewardsData.loading ? 'loading' : 'ready'}`}>
                  {rewardsData.loading ? "🔄 Syncing..." : "✅ Ready"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="header-actions">
            <button 
              className="refresh-btn"
              onClick={() => rewardsData.refreshRewards(true)}
              disabled={rewardsData.loading}
            >
              {rewardsData.loading ? "🔄" : "🔄"} Refresh
            </button>
            
            <button 
              className={`analytics-toggle ${showAnalytics ? 'active' : ''}`}
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              📊 Analytics
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div className="tab-navigation" variants={cardVariants}>
        {[
          { id: "overview", label: "Overview", icon: "📊" },
          { id: "telegram", label: "Telegram", icon: "💬" },
          { id: "referral", label: "Referral", icon: "👥" },
          { id: "node", label: "AI Rewards", icon: "🧠" }
        ].map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Main Content */}
      <div className="rewards-content">
        {/* Total Rewards Card */}
        <motion.div 
          className="total-rewards-card"
          variants={cardVariants}
          whileHover="hover"
        >
          <div className="card-header">
            <h2>💰 Total Unclaimed Rewards</h2>
            {rewardsData.refreshing && (
              <div className="loading-indicator">
                <div className="spinner"></div>
              </div>
            )}
          </div>
          
          <div className="total-amount">
            <span className="amount-value">
              {rewardsData.totalUnclaimed.toFixed(2)}
            </span>
            <span className="amount-currency">$BITS</span>
          </div>
          
          <div className="rewards-breakdown">
            <div className="breakdown-item">
              <span className="breakdown-icon">💬</span>
              <span className="breakdown-label">Telegram</span>
              <span className="breakdown-value">{rewardsData.telegram.pending}</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-icon">👥</span>
              <span className="breakdown-label">Referral</span>
              <span className="breakdown-value">{rewardsData.referral.pending}</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-icon">🧠</span>
              <span className="breakdown-label">AI Rewards</span>
              <span className="breakdown-value">{rewardsData.nodeRewards.balance}</span>
            </div>
          </div>

          {rewardsData.totalUnclaimed > 0 && (
            <div className="claim-actions">
              <button className="claim-all-btn">
                🚀 Claim All Rewards
              </button>
              <button className="stake-btn">
                ⚡ Stake Rewards
              </button>
            </div>
          )}
        </motion.div>

        {/* Analytics Panel */}
        <AnimatePresence>
          {showAnalytics && (
            <motion.div 
              className="analytics-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="analytics-grid">
                {/* Pie Chart */}
                <div className="chart-container">
                  <h3>Rewards Distribution</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} BITS`, "Amount"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Activity Timeline */}
                <div className="chart-container">
                  <h3>7-Day Activity</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={timelineData}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="telegram" 
                        stackId="1" 
                        stroke={REWARD_COLORS.telegram} 
                        fill={REWARD_COLORS.telegram}
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="referral" 
                        stackId="1" 
                        stroke={REWARD_COLORS.referral} 
                        fill={REWARD_COLORS.referral}
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="node" 
                        stackId="1" 
                        stroke={REWARD_COLORS.node} 
                        fill={REWARD_COLORS.node}
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Performance Metrics */}
                <div className="metrics-container">
                  <h3>Performance Metrics</h3>
                  <div className="metrics-grid">
                    <div className="metric-item">
                      <div className="metric-icon">⚡</div>
                      <div className="metric-content">
                        <div className="metric-value">{performanceMetrics.efficiency}</div>
                        <div className="metric-label">Msg/Hour</div>
                      </div>
                    </div>
                    <div className="metric-item">
                      <div className="metric-icon">📈</div>
                      <div className="metric-content">
                        <div className="metric-value">{performanceMetrics.growth}</div>
                        <div className="metric-label">Growth</div>
                      </div>
                    </div>
                    <div className="metric-item">
                      <div className="metric-icon">🔥</div>
                      <div className="metric-content">
                        <div className="metric-value">{performanceMetrics.streak}</div>
                        <div className="metric-label">Streak</div>
                      </div>
                    </div>
                    <div className="metric-item">
                      <div className="metric-icon">🏆</div>
                      <div className="metric-content">
                        <div className="metric-value">{performanceMetrics.rank}</div>
                        <div className="metric-label">Rank</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Content */}
        <motion.div className="tab-content" variants={cardVariants}>
          {activeTab === "overview" && (
            <div className="overview-content">
              <div className="overview-grid">
                <div className="overview-card">
                  <h3>💬 Telegram Activity</h3>
                  <div className="activity-stats">
                    <div className="stat">
                      <span className="stat-number">{rewardsData.telegram.timeSpentHours}h</span>
                      <span className="stat-label">Time Spent</span>
                    </div>
                    <div className="stat">
                      <span className="stat-number">{rewardsData.telegram.messages}</span>
                      <span className="stat-label">Messages</span>
                    </div>
                    <div className="stat">
                      <span className="stat-number">{rewardsData.telegram.pending}</span>
                      <span className="stat-label">BITS Earned</span>
                    </div>
                  </div>
                </div>

                <div className="overview-card">
                  <h3>👥 Referral Program</h3>
                  <div className="referral-stats">
                    <div className="stat">
                      <span className="stat-number">{rewardsData.referral.pending}</span>
                      <span className="stat-label">Pending BITS</span>
                    </div>
                    <div className="referral-code">
                      <span className="code-label">Your Code:</span>
                      <span className="code-value">{rewardsData.referral.code || "Generate Code"}</span>
                    </div>
                  </div>
                </div>

                <div className="overview-card">
                  <h3>🧠 AI Neural Rewards</h3>
                  <div className="node-stats">
                    <div className="stat">
                      <span className="stat-number">{rewardsData.nodeRewards.balance}</span>
                      <span className="stat-label">AI Balance</span>
                    </div>
                    <div className="tiers-info">
                      <span className="tiers-label">Active Tiers:</span>
                      <span className="tiers-count">{rewardsData.nodeRewards.tiers.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "telegram" && (
            <div className="telegram-content">
              <div className="telegram-investigation">
                <h3>🔍 Telegram Activity Investigation</h3>
                {rewardsData.telegram.investigationData && (
                  <div className="investigation-details">
                    <div className="investigation-grid">
                      <div className="investigation-item">
                        <span className="item-label">Total Time:</span>
                        <span className="item-value">{rewardsData.telegram.investigationData.totalHours}h</span>
                      </div>
                      <div className="investigation-item">
                        <span className="item-label">Messages:</span>
                        <span className="item-value">{rewardsData.telegram.investigationData.messagesTotal}</span>
                      </div>
                      <div className="investigation-item">
                        <span className="item-label">Activity Rate:</span>
                        <span className="item-value">{rewardsData.telegram.investigationData.activityRate} msg/h</span>
                      </div>
                      <div className="investigation-item">
                        <span className="item-label">Status:</span>
                        <span className="item-value">{rewardsData.telegram.investigationData.systemStatus}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add other tab contents as needed */}
        </motion.div>
      </div>

      {/* Loading Overlay */}
      {rewardsData.loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="neural-loader">
              <div className="neural-node"></div>
              <div className="neural-node"></div>
              <div className="neural-node"></div>
            </div>
            <p>AI Neural Networks analyzing your rewards...</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
