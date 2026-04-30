/**
 * 📊 PerformanceSummary Component - Performance Summary Cards
 * 
 * Component pentru afișarea summary-ului de performance cu date reale:
 * - Key metrics cards (din API)
 * - Quick overview (din API)
 * - Period comparison (din API)
 * 
 * @module PerformanceSummary
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react';
import { Card, Badge } from '../ui';
import LoadingSpinner from '../common/LoadingSpinner';
import { performanceApiService } from '../../services';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { errorWithPrefix, logWithPrefix } from '../../utils/logger';
import { handleApiError } from '../../utils/helpers';
import '../../styles/components/performance-summary.css';

// Extract individual functions from service
const { getMetrics, getRiskMetrics } = performanceApiService;

const PerformanceSummary = React.memo(({ userId, period = '30d', metrics: metricsProp, riskMetrics: riskMetricsProp }) => {
  const [metrics, setMetrics] = useState(metricsProp || null);
  const [riskMetrics, setRiskMetrics] = useState(riskMetricsProp || null);
  const [loading, setLoading] = useState(!metricsProp && !riskMetricsProp);
  const [error, setError] = useState(null);
  const { handleError } = useErrorHandler();

  // 🛑 IMPORTANT: Hooks must be declared before any conditional returns.
  const formatNumber = useCallback((num) => {
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  }, []);

  // Build summary cards - only show cards for available metrics (memoized)
  const summaryCards = useMemo(() => {
    const cards = [];

    if (metrics) {
      if (metrics.netProfit !== undefined && metrics.netProfit !== null) {
        cards.push({
          id: 'netProfit',
          label: 'Net Profit',
          value: formatNumber(metrics.netProfit || 0),
          change: metrics.netProfitChange ? `${metrics.netProfitChange >= 0 ? '+' : ''}${metrics.netProfitChange.toFixed(2)}%` : null,
          isPositive: (metrics.netProfit || 0) >= 0,
          icon: TrendingUp,
          color: (metrics.netProfit || 0) >= 0 ? '#22c55e' : '#ef4444'
        });
      }

      if (metrics.winRate !== undefined && metrics.winRate !== null) {
        cards.push({
          id: 'winRate',
          label: 'Win Rate',
          value: `${metrics.winRate}%`,
          change: metrics.winRateChange ? `${metrics.winRateChange >= 0 ? '+' : ''}${metrics.winRateChange.toFixed(2)}%` : null,
          isPositive: true,
          icon: Target,
          color: '#4facfe'
        });
      }

      if (metrics.profitFactor !== undefined && metrics.profitFactor !== null) {
        cards.push({
          id: 'profitFactor',
          label: 'Profit Factor',
          value: metrics.profitFactor.toFixed(2),
          change: metrics.profitFactorChange ? `${metrics.profitFactorChange >= 0 ? '+' : ''}${metrics.profitFactorChange.toFixed(2)}` : null,
          isPositive: metrics.profitFactor >= 1,
          icon: TrendingUp,
          color: metrics.profitFactor >= 1 ? '#22c55e' : '#ef4444'
        });
      }

      if (metrics.totalTrades !== undefined && metrics.totalTrades !== null) {
        cards.push({
          id: 'totalTrades',
          label: 'Total Trades',
          value: metrics.totalTrades,
          change: metrics.totalTradesChange ? `${metrics.totalTradesChange >= 0 ? '+' : ''}${metrics.totalTradesChange}` : null,
          isPositive: true,
          icon: Target,
          color: '#9945ff'
        });
      }
    }

    if (riskMetrics) {
      if (riskMetrics.maxDrawdown !== undefined && riskMetrics.maxDrawdown !== null) {
        cards.push({
          id: 'maxDrawdown',
          label: 'Max Drawdown',
          value: `${Math.abs(riskMetrics.maxDrawdown)}%`,
          change: riskMetrics.maxDrawdownChange ? `${riskMetrics.maxDrawdownChange >= 0 ? '+' : ''}${riskMetrics.maxDrawdownChange.toFixed(2)}%` : null,
          isPositive: false,
          icon: AlertTriangle,
          color: '#f59e0b'
        });
      }

      if (riskMetrics.sharpeRatio !== undefined && riskMetrics.sharpeRatio !== null) {
        cards.push({
          id: 'sharpeRatio',
          label: 'Sharpe Ratio',
          value: riskMetrics.sharpeRatio.toFixed(2),
          change: riskMetrics.sharpeRatioChange ? `${riskMetrics.sharpeRatioChange >= 0 ? '+' : ''}${riskMetrics.sharpeRatioChange.toFixed(2)}` : null,
          isPositive: riskMetrics.sharpeRatio >= 1,
          icon: TrendingUp,
          color: riskMetrics.sharpeRatio >= 1 ? '#22c55e' : '#ef4444'
        });
      }
    }

    return cards;
  }, [metrics, riskMetrics, formatNumber]);

  useEffect(() => {
    // If metrics and riskMetrics are provided as props, use them
    if (metricsProp !== undefined) {
      setMetrics(metricsProp);
    }
    if (riskMetricsProp !== undefined) {
      setRiskMetrics(riskMetricsProp);
    }
  }, [metricsProp, riskMetricsProp]);

  useEffect(() => {
    const loadData = async () => {
      // If no userId or data already provided, skip
      if (!userId || (metricsProp !== undefined && riskMetricsProp !== undefined)) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch metrics and risk metrics from API
        const [metricsResponse, riskMetricsResponse] = await Promise.all([
          getMetrics(userId, { period }).catch(err => {
            logWithPrefix('PerformanceSummary', 'Metrics API error:', err?.message || err);
            return { success: false, metrics: null };
          }),
          getRiskMetrics(userId, { period }).catch(err => {
            logWithPrefix('PerformanceSummary', 'Risk metrics API error:', err?.message || err);
            return { success: false, riskMetrics: null };
          })
        ]);

        // Set metrics from API response
        const apiMetrics = metricsResponse?.metrics || metricsResponse || null;
        const apiRiskMetrics = riskMetricsResponse?.riskMetrics || riskMetricsResponse || null;

        setMetrics(apiMetrics);
        setRiskMetrics(apiRiskMetrics);

        // If both are null, show a message but don't treat as error
        if (!apiMetrics && !apiRiskMetrics) {
          setError('No performance data available yet');
        } else {
          setError(null);
        }
      } catch (err) {
        errorWithPrefix('PerformanceSummary', '❌ ERROR:', err);
        const errorMessage = await handleApiError(err);
        setMetrics(null);
        setRiskMetrics(null);
        setError(errorMessage || 'Failed to load performance data');
        
        // Show toast notification
        handleError(err, { 
          title: 'Failed to Load Performance Data',
          showToast: true 
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [userId, period, metricsProp, riskMetricsProp, handleError]);

  // Show loading state
  if (loading) {
    return (
      <Card className="performance-summary-container" padding="lg">
        <Card.Header>
          <Card.Title>Performance Summary</Card.Title>
          <Badge variant="default" size="sm">Period: {period}</Badge>
        </Card.Header>
        <Card.Body>
          <LoadingSpinner message="Loading performance summary" size="medium" />
        </Card.Body>
      </Card>
    );
  }

  // Show error or no data message (only if no metrics and no riskMetrics)
  if (error || (!metrics && !riskMetrics)) {
    return (
      <Card className="performance-summary-container" padding="lg">
        <Card.Header>
          <Card.Title>Performance Summary</Card.Title>
          <Badge variant="default" size="sm">Period: {period}</Badge>
        </Card.Header>
        <Card.Body>
          <div className="performance-summary-empty-state" style={{ 
            textAlign: 'center', 
            padding: '3rem 2rem',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
              No Performance Data Yet
            </h3>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto' }}>
              {error ? (
                <>
                  <span style={{ color: '#ef4444' }}>⚠️ {error}</span>
                  <br />
                  <span style={{ marginTop: '0.5rem', display: 'block' }}>
                    Start trading to see your performance metrics and insights.
                  </span>
                </>
              ) : (
                'Start trading to see your performance metrics, risk analysis, and detailed insights here.'
              )}
            </p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="performance-summary-container" padding="lg">
      <Card.Header>
        <Card.Title>Performance Summary</Card.Title>
        <Badge variant="default" size="sm">Period: {period}</Badge>
      </Card.Header>

      <Card.Body>
        {summaryCards.length > 0 ? (
          <div className="performance-summary-grid">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card 
                  key={card.id} 
                  variant="elevated" 
                  padding="md"
                  className="performance-summary-card"
                >
                  <div className="performance-summary-card-header">
                    <div 
                      className="performance-summary-icon-wrapper"
                      style={{ backgroundColor: `${card.color}20`, color: card.color }}
                    >
                      <Icon size={18} />
                    </div>
                    {card.change && (
                      <Badge variant={card.isPositive ? 'success' : 'error'} size="sm">
                        {card.change}
                      </Badge>
                    )}
                  </div>
                  <div className="performance-summary-card-content">
                    <div className="performance-summary-label">{card.label}</div>
                    <div 
                      className="performance-summary-value"
                      style={{ color: card.color }}
                    >
                      {card.value}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="performance-summary-empty-state" style={{ 
            textAlign: 'center', 
            padding: '2rem 1rem',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📈</div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
              No Metrics Available
            </h4>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
              Start trading to see your performance summary with detailed metrics.
            </p>
          </div>
        )}
      </Card.Body>

      <Card.Footer>
        {error ? (
          <span style={{ color: '#ef4444' }}>❌ Error loading performance data: {error}</span>
        ) : loading ? (
          <LoadingSpinner message="Loading" size="small" />
        ) : (
          <span style={{ color: '#10b981' }}>✓ Performance metrics</span>
        )}
      </Card.Footer>
    </Card>
  );
});

PerformanceSummary.displayName = 'PerformanceSummary';

export default PerformanceSummary;
