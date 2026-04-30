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

import React, { useState, useCallback, useMemo } from 'react';
import { useAITrading } from '../../hooks/useAITrading';
import { useOTAAccess } from '../../hooks/useOTAAccess';
import BotStatus from './BotStatus';
import BotControls from './BotControls';
import MarketAnalysis from './MarketAnalysis';
import BotStatistics from './BotStatistics';
import TradingViewChart from '../common/TradingViewChart';
import LoadingSpinner from '../common/LoadingSpinner';
import Skeleton from '../common/Skeleton';
import OTALogo from './OTALogo';
import { AlertCircle } from 'lucide-react';
import { OPENAI_TRADING_AGENT_NAME } from '../../utils/aiTradingConstants';
import { logWithPrefix } from '../../utils/logger';
import '../../styles/components/ai-trading-dashboard.css';

const AITradingDashboard = React.memo(({ userId }) => {
  const { isPreviewMode, hasFullAccess } = useOTAAccess();
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

  const [selectedToken, setSelectedToken] = useState('BNB');

  const handleTokenChange = useCallback((token) => {
    setSelectedToken(token);
  }, []);

  const handleConfigSave = useCallback((config) => {
    logWithPrefix('OTA', 'Bot configuration saved:', config);
  }, []);

  const chartSymbol = useMemo(() => 
    `BINANCE:${selectedToken}USDT`,
    [selectedToken]
  );

  if (!userId) {
    return (
      <div className="ai-trading-dashboard-error" role="alert" aria-live="assertive">
        <AlertCircle size={24} aria-hidden="true" />
        <p>User ID is required</p>
      </div>
    );
  }

  return (
    <div className="ai-trading-dashboard" role="main" aria-label={`${OPENAI_TRADING_AGENT_NAME} Dashboard`}>
      <header className="ai-trading-dashboard-header">
        <div className="ai-trading-dashboard-title-wrapper ota-title-row">
          <OTALogo size="lg" className="ai-trading-dashboard-logo" />
          <h1 className="ai-trading-dashboard-title">{OPENAI_TRADING_AGENT_NAME} Dashboard</h1>
          {isPreviewMode && <span className="ai-trading-dashboard-preview-label">Preview</span>}
        </div>
        {refreshing && (
          <div className="ai-trading-refreshing-indicator" aria-live="polite" aria-label="Refreshing dashboard">
            <LoadingSpinner size="small" message="" />
            <span>Refreshing...</span>
          </div>
        )}
      </header>

      {error && (
        <div className="ai-trading-dashboard-error" role="alert" aria-live="assertive">
          <AlertCircle size={20} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {loading && !status ? (
        <div className="ai-trading-dashboard-content">
          {/* Skeleton loaders for initial load */}
          <section className="ai-trading-dashboard-section">
            <Skeleton variant="card" height="120px" style={{ marginBottom: '16px' }} />
            <Skeleton variant="card" height="80px" />
          </section>
          <section className="ai-trading-dashboard-section">
            <Skeleton variant="card" height="200px" />
          </section>
          <section className="ai-trading-dashboard-section">
            <Skeleton variant="card" height="300px" />
          </section>
          <section className="ai-trading-dashboard-section ai-trading-dashboard-chart-section">
            <Skeleton variant="card" height="600px" />
          </section>
          <section className="ai-trading-dashboard-section">
            <Skeleton variant="card" height="400px" />
          </section>
        </div>
      ) : (
        <div className="ai-trading-dashboard-content">
          {/* Bot Status și Controls */}
          <section className="ai-trading-dashboard-section">
            <BotStatus status={status} stats={stats} loading={loading} />
            <BotControls 
              userId={userId}
              status={status}
              loading={loading}
              onStart={startBot}
              onStop={stopBot}
              onRefresh={refresh}
              onConfigure={handleConfigSave}
            />
          </section>

        {/* TradingView Chart */}
        <section className="ai-trading-dashboard-section ai-trading-dashboard-chart-section chart-wrapper-single-frame" aria-label="Price Chart">
          <div className="ai-trading-dashboard-chart-header">
            <h2 className="ai-trading-dashboard-chart-title">Price Chart</h2>
            <div className="ai-trading-dashboard-chart-token" aria-label={`Trading pair: ${selectedToken}/USDT`}>
              {selectedToken}/USDT
            </div>
          </div>
          <TradingViewChart 
            symbol={chartSymbol}
            interval="D"
            theme="dark"
            height={600}
            autosize={false}
          />
        </section>

        {/* Market Analysis */}
        <section className="ai-trading-dashboard-section" aria-label="Market Analysis">
          <MarketAnalysis
            userId={userId}
            selectedToken={selectedToken}
            onTokenChange={handleTokenChange}
            onAnalyze={analyzeMarket}
            loading={loading}
            onExecuteSwap={(tokenIn, tokenOut, amountIn) => {
              // Navigate to swap panel with query params
              logWithPrefix('OTA', 'Execute swap requested:', { tokenIn, tokenOut, amountIn });
              
              const params = new URLSearchParams({
                from: tokenIn,
                to: tokenOut
              });
              if (amountIn) {
                params.set('amount', amountIn);
              }
              
              // Use window.location for navigation (works without React Router dependency)
              window.location.href = `/dex-edu/swap?${params.toString()}`;
            }}
          />
        </section>

        {/* Statistics - Full access only (preview mode shows message) */}
        {hasFullAccess && stats && (
          <section className="ai-trading-dashboard-section" aria-label="OTA Statistics">
            <BotStatistics stats={stats} />
          </section>
        )}
        
        {isPreviewMode && (
          <section className="ai-trading-dashboard-section" aria-label="OTA Statistics Preview">
            <p className="ai-trading-dashboard-preview-stat-text">Register for OTA to see statistics.</p>
          </section>
        )}
        </div>
      )}
    </div>
  );
});

AITradingDashboard.displayName = 'AITradingDashboard';

export default AITradingDashboard;

