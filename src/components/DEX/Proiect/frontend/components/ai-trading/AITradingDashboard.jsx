/**
 * 🤖 AI Trading Dashboard Component - Main Dashboard
 * 
 * Main dashboard component pentru AI Trading:
 * - Bot status și controls
 * - Market analysis
 * - Real-time statistics
 * - Bot configuration
 * 
 * @module AITradingDashboard
 */

import React, { useState } from 'react';
import { useAITrading } from '../../hooks/useAITrading';
import BotStatus from './BotStatus';
import BotControls from './BotControls';
import MarketAnalysis from './MarketAnalysis';
import BotStatistics from './BotStatistics';
import LoadingSpinner from '../common/LoadingSpinner';
import { AlertCircle } from 'lucide-react';
import '../../styles/components/ai-trading-dashboard.css';

const AITradingDashboard = ({ userId }) => {
  const {
    status,
    stats,
    loading,
    error,
    refreshing,
    startBot,
    stopBot,
    analyzeMarket,
    refresh
  } = useAITrading(userId);

  const [selectedToken, setSelectedToken] = useState('BTC');

  if (!userId) {
    return (
      <div className="ai-trading-dashboard-error">
        <AlertCircle size={24} />
        <p>User ID is required</p>
      </div>
    );
  }

  return (
    <div className="ai-trading-dashboard">
      <div className="ai-trading-dashboard-header">
        <h1 className="ai-trading-dashboard-title">AI Trading Dashboard</h1>
        {refreshing && (
          <div className="ai-trading-refreshing-indicator">
            <LoadingSpinner size="small" message="" />
            <span>Refreshing...</span>
          </div>
        )}
      </div>

      {error && (
        <div className="ai-trading-dashboard-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="ai-trading-dashboard-content">
        {/* Bot Status și Controls */}
        <section className="ai-trading-dashboard-section">
          <BotStatus status={status} stats={stats} loading={loading} />
          <BotControls 
            status={status}
            loading={loading}
            onStart={startBot}
            onStop={stopBot}
            onRefresh={refresh}
          />
        </section>

        {/* Market Analysis */}
        <section className="ai-trading-dashboard-section">
          <MarketAnalysis
            userId={userId}
            selectedToken={selectedToken}
            onTokenChange={setSelectedToken}
            onAnalyze={analyzeMarket}
          />
        </section>

        {/* Statistics */}
        {stats && (
          <section className="ai-trading-dashboard-section">
            <BotStatistics stats={stats} />
          </section>
        )}
      </div>
    </div>
  );
};

export default AITradingDashboard;

