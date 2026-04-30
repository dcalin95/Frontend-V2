/**
 * 📊 QuickStats Component - Quick Statistics Cards
 * 
 * Component pentru afișarea statisticilor rapide în Dashboard cu date reale:
 * - Total Profit (din API)
 * - Total Trades (din API)
 * - Win Rate (din API)
 * - Active Positions (din API)
 * 
 * @module QuickStats
 */

import React, { useMemo, useCallback, useEffect } from 'react';
import { TrendingUp, Target, Award, Activity } from 'lucide-react';
import { Card, Badge } from '../ui';
import LoadingSpinner from '../common/LoadingSpinner';
import StatusIndicator from '../common/StatusIndicator';
import { usePerformance } from '../../hooks/usePerformance';
import { useExecution } from '../../hooks/useExecution';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import EmptyState from '../common/EmptyState';
import { formatLargeNumber } from '../../utils/formatters';
import '../../styles/components/quick-stats.css';

const QuickStats = React.memo(({ userId }) => {
  // Load performance metrics
  const { 
    metrics, 
    loading: metricsLoading, 
    error: metricsError
  } = usePerformance(userId || null, { period: '30d', autoRefresh: true, refreshInterval: 30000 });

  // Load execution trades for active positions
  const { 
    trades, 
    loading: tradesLoading, 
    error: tradesError 
  } = useExecution(userId || null, { limit: 100, autoRefresh: true, refreshInterval: 30000 });

  const loading = metricsLoading || tradesLoading;
  const error = metricsError || tradesError;
  const { handleError } = useErrorHandler();

  // Show toast notification pentru erori
  useEffect(() => {
    if (error && !loading) {
      handleError(error, { 
        title: 'Failed to Load Stats',
        showToast: true 
      });
    }
  }, [error, loading, handleError]);

  // Calculate stats from API data
  const stats = useMemo(() => {
    // Return null if no metrics and no trades (or empty trades array)
    if (!metrics && (!trades || (Array.isArray(trades) && trades.length === 0))) return null;

    // Calculate active positions (trades with status 'pending' or 'executed')
    const activePositions = trades?.filter(trade => 
      trade.status === 'pending' || trade.status === 'executed'
    ).length || 0;

    return {
      totalProfit: metrics?.netProfit || 0,
      totalTrades: metrics?.totalTrades || trades?.length || 0,
      winRate: metrics?.winRate || null,
      activePositions: activePositions,
      // Previous period data (if available from API)
      previousProfit: metrics?.previousPeriodProfit,
      previousTrades: metrics?.previousPeriodTrades,
      previousWinRate: metrics?.previousPeriodWinRate,
      previousPositions: null // Not available from API yet
    };
  }, [metrics, trades]);

  // ALL HOOKS MUST BE BEFORE EARLY RETURNS
  const formatCurrency = useCallback((num) => {
    return `$${formatLargeNumber(num, 2)}`;
  }, []);

  // Change from API only (previous period from metrics). No prescribed values.
  const calculateChange = useCallback((current, previous) => {
    if (!previous || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  }, []);

  const statCards = useMemo(() => [
    {
      id: 'profit',
      label: 'Total Profit',
      value: formatCurrency(stats?.totalProfit || 0),
      icon: TrendingUp,
      color: '#22c55e',
      change: stats?.previousProfit !== undefined && stats?.totalProfit !== undefined ? calculateChange(stats.totalProfit, stats.previousProfit) : null
    },
    {
      id: 'trades',
      label: 'Total Trades',
      value: stats?.totalTrades || 0,
      icon: Target,
      color: '#4facfe',
      change: stats?.previousTrades !== undefined && stats?.totalTrades !== undefined ? (stats.totalTrades - stats.previousTrades > 0 ? `+${stats.totalTrades - stats.previousTrades}` : `${stats.totalTrades - stats.previousTrades}`) : null
    },
    {
      id: 'winrate',
      label: 'Win Rate',
      value: stats?.winRate !== undefined ? `${stats.winRate}%` : 'N/A',
      icon: Award,
      color: '#9945ff',
      change: stats?.previousWinRate !== undefined && stats?.winRate !== undefined ? calculateChange(stats.winRate, stats.previousWinRate) : null
    },
    {
      id: 'positions',
      label: 'Pending / Executed',
      value: stats?.activePositions || 0,
      icon: Activity,
      color: '#f59e0b',
      change: stats?.previousPositions !== undefined && stats?.activePositions !== undefined ? (stats.activePositions - stats.previousPositions > 0 ? `+${stats.activePositions - stats.previousPositions}` : `${stats.activePositions - stats.previousPositions}`) : null
    }
  ], [stats, formatCurrency, calculateChange]);

  // Early returns AFTER all hooks
  if (loading) {
    return (
      <div className="quick-stats-container">
        <LoadingSpinner message="Loading stats" size="medium" />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="quick-stats-container">
        <EmptyState
          icon="alert"
          title="Unable to Load Stats"
          message={error || 'No data available yet. Start trading to see your statistics here.'}
          actionLabel="Retry"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  // If no stats available (null from API), show empty state
  if (!stats) {
    return (
      <div className="quick-stats-container">
        <EmptyState
          icon="inbox"
          title="No Statistics Yet"
          message="Start trading to see your performance statistics here."
        />
      </div>
    );
  }

  return (
    <div className="quick-stats-container">
      <div className="quick-stats-grid">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card 
              key={card.id} 
              variant="elevated" 
              padding="lg"
              className="quick-stats-card"
            >
              <div className="quick-stats-card-header">
                <div 
                  className="quick-stats-icon-wrapper"
                  style={{ backgroundColor: `${card.color}20`, color: card.color }}
                >
                  <Icon size={20} />
                </div>
                <div className="quick-stats-header-right">
                  {card.change && (
                    <Badge variant={card.change.startsWith('+') ? 'success' : 'error'} size="sm">
                      {card.change}
                    </Badge>
                  )}
                  {card.id === 'positions' && (
                    <StatusIndicator status="active" size="small" pulse />
                  )}
                </div>
              </div>
              <div className="quick-stats-card-content">
                <div className="quick-stats-label">{card.label}</div>
                <div className="quick-stats-value">{card.value}</div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
});

QuickStats.displayName = 'QuickStats';

export default QuickStats;
