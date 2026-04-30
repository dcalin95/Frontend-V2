/**
 * 📊 ExecutionStatsCards Component - Execution Statistics Cards
 * 
 * Component pentru afișarea statisticilor de execuție cu date reale:
 * - Total trades (din API)
 * - Success rate (din API)
 * - Average execution time (din API)
 * - Pending trades (din API)
 * 
 * @module ExecutionStatsCards
 */

import React, { useMemo, useCallback, useEffect } from 'react';
import { CheckCircle, Clock, XCircle, Zap } from 'lucide-react';
import { Card, Badge } from '../ui';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { useExecution } from '../../hooks/useExecution';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import '../../styles/components/execution-stats-cards.css';

const ExecutionStatsCards = React.memo(({ userId }) => {
  // Load execution trades
  const { 
    trades, 
    loading, 
    error,
    refreshing 
  } = useExecution(userId || null, { limit: 100, autoRefresh: true, refreshInterval: 30000 });

  const { handleError } = useErrorHandler();

  // Show toast notification pentru erori
  useEffect(() => {
    if (error && !loading) {
      handleError(error, { 
        title: 'Failed to Load Execution Stats',
        showToast: true 
      });
    }
  }, [error, loading, handleError]);

  // Calculate stats from trades
  const stats = useMemo(() => {
    if (!trades || trades.length === 0) return null;

    const totalTrades = trades.length;
    const successfulTrades = trades.filter(t => t.status === 'executed' || t.status === 'completed').length;
    const pendingTrades = trades.filter(t => t.status === 'pending').length;
    const failedTrades = trades.filter(t => t.status === 'failed' || t.status === 'cancelled').length;
    
    // Calculate success rate
    const successRate = totalTrades > 0 ? (successfulTrades / totalTrades) * 100 : 0;

    // Calculate average execution time (if available in trade data)
    const tradesWithExecutionTime = trades.filter(t => t.executionTime !== undefined && t.executionTime !== null);
    const avgExecutionTime = tradesWithExecutionTime.length > 0
      ? tradesWithExecutionTime.reduce((sum, t) => sum + (t.executionTime || 0), 0) / tradesWithExecutionTime.length
      : null;

    // Calculate total volume (sum of all trade amounts)
    const totalVolume = trades.reduce((sum, trade) => {
      const amount = parseFloat(trade.amountIn || trade.amount || 0);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    return {
      totalTrades,
      successRate: successRate.toFixed(1),
      pendingTrades,
      failedTrades,
      avgExecutionTime: avgExecutionTime ? avgExecutionTime.toFixed(2) : null,
      totalVolume
    };
  }, [trades]);

  // ALL HOOKS MUST BE BEFORE EARLY RETURNS
  const getBadgeVariant = useCallback((change) => {
    if (change.startsWith('+')) return 'success';
    if (change.startsWith('-')) return 'error';
    return 'default';
  }, []);

  const formatNumber = useCallback((num) => {
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return num.toString();
  }, []);

  const statCards = useMemo(() => {
    if (!stats) return [];
    
    return [
      {
        id: 'total',
        label: 'Total Trades',
        value: stats.totalTrades || 0,
        icon: Zap,
        color: '#4facfe',
        change: null // From API when available
      },
      {
        id: 'success',
        label: 'Success Rate',
        value: stats.successRate !== undefined ? `${stats.successRate}%` : 'N/A',
        icon: CheckCircle,
        color: '#22c55e',
        change: null // From API when available
      },
      {
        id: 'pending',
        label: 'Pending',
        value: stats.pendingTrades || 0,
        icon: Clock,
        color: '#f59e0b',
        change: null // From API when available
      },
      {
        id: 'failed',
        label: 'Failed',
        value: stats.failedTrades || 0,
        icon: XCircle,
        color: '#ef4444',
        change: null // From API when available
      },
      {
        id: 'avgTime',
        label: 'Avg Execution',
        value: stats.avgExecutionTime !== undefined ? `${stats.avgExecutionTime}s` : 'N/A',
        icon: Zap,
        color: '#9945ff',
        change: null // From API when available
      },
      {
        id: 'volume',
        label: 'Total Volume',
        value: stats.totalVolume !== undefined ? formatNumber(stats.totalVolume) : '$0',
        icon: Zap,
        color: '#00f2fe',
        change: null // From API when available
      }
    ];
  }, [stats, formatNumber]);

  // Early returns AFTER all hooks
  if (loading) {
    return (
      <div className="execution-stats-cards-container">
        <LoadingSpinner message="Loading execution stats" size="medium" />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="execution-stats-cards-container">
        <EmptyState
          icon="alert"
          title="Unable to Load Execution Stats"
          message={error || 'No execution stats available yet.'}
          actionLabel="Retry"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  // If no stats available (no trades), show empty state
  if (!stats) {
    return (
      <div className="execution-stats-cards-container">
        <EmptyState
          icon="inbox"
          title="No Execution Stats Yet"
          message="Stats will appear here after trades are executed."
        />
      </div>
    );
  }

  return (
    <div className="execution-stats-cards-container">
      <div className="execution-stats-cards-grid">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card 
              key={card.id} 
              variant="elevated" 
              padding="md"
              className="execution-stats-card"
            >
              <div className="execution-stats-card-header">
                <div 
                  className="execution-stats-icon-wrapper"
                  style={{ backgroundColor: `${card.color}20`, color: card.color }}
                >
                  <Icon size={18} />
                </div>
                {card.change !== null && card.change !== undefined && (
                  <Badge variant={getBadgeVariant(card.change)} size="sm">
                    {card.change}
                  </Badge>
                )}
              </div>
              <div className="execution-stats-card-content">
                <div className="execution-stats-label">{card.label}</div>
                <div 
                  className="execution-stats-value"
                  style={{ color: card.color }}
                >
                  {card.value}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
});

ExecutionStatsCards.displayName = 'ExecutionStatsCards';

export default ExecutionStatsCards;
