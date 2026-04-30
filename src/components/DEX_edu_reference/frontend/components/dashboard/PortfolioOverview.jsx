/**
 * 💼 PortfolioOverview Component - Portfolio Overview
 * 
 * Component pentru afișarea overview-ului portofoliului cu date reale:
 * - Total portfolio value (din wallet/API)
 * - Holdings breakdown (din wallet/API)
 * - 24h change (din API)
 * 
 * @module PortfolioOverview
 */

import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, Sparkles } from 'lucide-react';
import { Card, Badge } from '../ui';
import ProgressBar from '../common/ProgressBar';
import TokenLogo from '../common/TokenLogo';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { useExecution } from '../../hooks/useExecution';
import { usePerformance } from '../../hooks/usePerformance';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { getOTAStats } from '../../services/aiTradingApiService';
import { formatLargeNumber, formatCurrency } from '../../utils/formatters';
import '../../styles/components/portfolio-overview.css';

const PortfolioOverview = React.memo(({ userId }) => {
  // Load execution trades for portfolio calculation
  const { 
    trades, 
    loading: tradesLoading, 
    error: tradesError 
  } = useExecution(userId || null, { limit: 100, autoRefresh: true, refreshInterval: 30000 });

  // Load performance metrics for portfolio value
  const { 
    metrics, 
    loading: metricsLoading 
  } = usePerformance(userId || null, { period: '30d' });

  const [otaStats, setOtaStats] = useState(null);
  const [otaStatsLoading, setOtaStatsLoading] = useState(false);

  const loading = tradesLoading || metricsLoading || otaStatsLoading;
  const error = tradesError;
  const { handleError } = useErrorHandler();

  // Load OTA Stats
  useEffect(() => {
    const loadOtaStats = async () => {
      if (!userId) {
        setOtaStats(null);
        return;
      }

      try {
        setOtaStatsLoading(true);
        const response = await getOTAStats(userId);
        if (response.success && response.stats) {
          setOtaStats(response.stats);
        } else {
          setOtaStats(null);
        }
      } catch (err) {
        // Silent fail pentru OTA stats - nu sunt critice
        console.warn('Failed to load OTA stats:', err);
        setOtaStats(null);
      } finally {
        setOtaStatsLoading(false);
      }
    };

    loadOtaStats();
  }, [userId]);

  // Show toast notification pentru erori
  useEffect(() => {
    if (error && !loading) {
      handleError(error, { 
        title: 'Failed to Load Portfolio',
        showToast: true 
      });
    }
  }, [error, loading, handleError]);

  // Calculate portfolio from trades and metrics
  const portfolio = useMemo(() => {
    if (!trades || trades.length === 0) return null;

    // Group trades by token to calculate holdings
    const holdingsMap = {};
    let totalValue = 0;

    trades.forEach(trade => {
      const tokenOut = trade.tokenOut || 'USDT';
      const amountOut = parseFloat(trade.amountOut || 0);
      const price = parseFloat(trade.price || 0);
      const value = amountOut * price;

      if (!holdingsMap[tokenOut]) {
        holdingsMap[tokenOut] = {
          symbol: tokenOut,
          amount: 0,
          value: 0,
          change24h: 0 // Not available from API yet
        };
      }

      holdingsMap[tokenOut].amount += amountOut;
      holdingsMap[tokenOut].value += value;
      totalValue += value;
    });

    const holdings = Object.values(holdingsMap).map(holding => ({
      ...holding,
      change24h: 0 // Placeholder - would need price history from API
    }));

    // Calculate 24h change from metrics if available
    const totalValueChange24h = metrics?.netProfitChange24h || 0;
    const totalValueChangePercent24h = totalValue > 0 
      ? (totalValueChange24h / totalValue) * 100 
      : 0;

    return {
      totalValue: totalValue || metrics?.netProfit || 0,
      totalValueChange24h: totalValueChange24h,
      totalValueChangePercent24h: totalValueChangePercent24h,
      holdings: holdings.length > 0 ? holdings : []
    };
  }, [trades, metrics]);

  // 🛑 IMPORTANT: All hooks must be declared before any conditional returns.
  const formatCurrencyValue = useCallback((num, decimals = 2) => {
    return `$${formatLargeNumber(num, decimals)}`;
  }, []);

  if (loading) {
    return (
      <Card className="portfolio-overview-container" padding="lg">
        <Card.Body>
          <LoadingSpinner message="Loading portfolio" size="medium" />
        </Card.Body>
      </Card>
    );
  }

  if (error && !portfolio) {
    return (
      <Card className="portfolio-overview-container" padding="lg">
        <Card.Body>
          <EmptyState
            icon="alert"
            title="Unable to Load Portfolio"
            message={error || 'No portfolio data available yet.'}
          />
        </Card.Body>
      </Card>
    );
  }

  if (!portfolio || !portfolio.holdings || portfolio.holdings.length === 0) {
    return (
      <Card className="portfolio-overview-container" padding="lg">
        <Card.Header>
          <div className="portfolio-overview-title-section">
            <Wallet size={20} />
            <Card.Title>Portfolio Overview</Card.Title>
          </div>
        </Card.Header>
        <Card.Body>
          <EmptyState
            icon="wallet"
            title="No Portfolio Data Yet"
            message="Connect wallet and start trading to see your portfolio here."
          />
        </Card.Body>
      </Card>
    );
  }

  const isPositive = portfolio.totalValueChangePercent24h >= 0;
  const ChangeIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card className="portfolio-overview-container" padding="lg">
      <Card.Header>
        <div className="portfolio-overview-title-section">
          <Wallet size={20} />
          <Card.Title>Portfolio Overview</Card.Title>
        </div>
      </Card.Header>

      <Card.Body>

      {/* Total Value */}
      <div className="portfolio-overview-total">
        <div className="portfolio-overview-total-label">Total Value</div>
        <div className="portfolio-overview-total-value">
          {formatCurrencyValue(portfolio.totalValue, 2)}
        </div>
        <div className="portfolio-overview-change-wrapper">
          <Badge variant={isPositive ? 'success' : 'error'} size="md">
            <ChangeIcon size={12} />
            {isPositive ? '+' : ''}{portfolio.totalValueChangePercent24h.toFixed(2)}% 
            ({formatCurrencyValue(Math.abs(portfolio.totalValueChange24h), 2)})
          </Badge>
        </div>
      </div>

        {/* Holdings List */}
        <div className="portfolio-overview-holdings">
          <div className="portfolio-overview-holdings-header">
            <span>Asset</span>
            <span>Value</span>
            <span>24h</span>
          </div>
          <div className="portfolio-overview-holdings-list">
            {portfolio.holdings.map((holding, index) => {
              const holdingIsPositive = holding.change24h >= 0;
              const holdingPercentage = (holding.value / portfolio.totalValue) * 100;
              return (
                <div key={index} className="portfolio-overview-holding-item">
                  <div className="holding-asset">
                    <div className="holding-symbol-wrapper">
                      <TokenLogo symbol={holding.symbol} size="sm" showBorder />
                      <span className="holding-symbol">{holding.symbol}</span>
                    </div>
                    <span className="holding-amount">{holding.amount.toLocaleString()}</span>
                  </div>
                  <div className="holding-value">
                    {formatCurrencyValue(holding.value, 2)}
                    <ProgressBar 
                      value={holdingPercentage} 
                      max={100} 
                      variant="default" 
                      size="small"
                      showLabel={false}
                      className="holding-progress"
                    />
                  </div>
                  <div className="holding-change-wrapper">
                    <Badge variant={holdingIsPositive ? 'success' : 'error'} size="sm">
                      {holdingIsPositive ? '+' : ''}{holding.change24h}%
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* OTA Stats Section */}
        {otaStats && (
          <div className="portfolio-overview-ota-stats">
            <div className="portfolio-overview-ota-stats-header">
              <Sparkles size={16} />
              <span>OTA Statistics</span>
            </div>
            <div className="portfolio-overview-ota-stats-grid">
              {otaStats.totalTrades !== undefined && (
                <div className="portfolio-overview-ota-stat-item">
                  <span className="ota-stat-label">Trades</span>
                  <span className="ota-stat-value">{otaStats.totalTrades || 0}</span>
                </div>
              )}
              {otaStats.winRate !== undefined && (
                <div className="portfolio-overview-ota-stat-item">
                  <span className="ota-stat-label">Win Rate</span>
                  <span className="ota-stat-value">
                    {typeof otaStats.winRate === 'number' 
                      ? `${(otaStats.winRate * 100).toFixed(1)}%` 
                      : otaStats.winRate || '0%'}
                  </span>
                </div>
              )}
              {otaStats.totalProfit !== undefined && (
                <div className="portfolio-overview-ota-stat-item">
                  <span className="ota-stat-label">Total P/L</span>
                  <span className={`ota-stat-value ${(otaStats.totalProfit || 0) >= 0 ? 'profit' : 'loss'}`}>
                    {formatCurrencyValue(otaStats.totalProfit || 0, 2)}
                  </span>
                </div>
              )}
              {otaStats.signalsGenerated !== undefined && (
                <div className="portfolio-overview-ota-stat-item">
                  <span className="ota-stat-label">Signals</span>
                  <span className="ota-stat-value">{otaStats.signalsGenerated || 0}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
});

PortfolioOverview.displayName = 'PortfolioOverview';

export default PortfolioOverview;
