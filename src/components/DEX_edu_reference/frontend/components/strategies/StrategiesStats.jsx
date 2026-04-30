/**
 * 📊 StrategiesStats Component - Strategies Statistics
 * 
 * Component pentru afișarea statisticilor strategiilor cu date reale:
 * - Total strategies (din API)
 * - Active strategies (din API)
 * - Performance overview (din API)
 * 
 * @module StrategiesStats
 */

import React, { useMemo, useCallback, useEffect } from 'react';
import { Target, Play, Pause, TrendingUp } from 'lucide-react';
import { Card } from '../ui';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { useStrategies } from '../../hooks/useStrategies';
import { usePerformance } from '../../hooks/usePerformance';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import '../../styles/components/strategies-stats.css';

const StrategiesStats = React.memo(({ userId }) => {
  // Load strategies
  const { 
    strategies, 
    loading: strategiesLoading, 
    error: strategiesError 
  } = useStrategies(userId || null);

  // Load performance metrics for total profit
  const { 
    metrics, 
    loading: metricsLoading 
  } = usePerformance(userId || null, { period: '30d' });

  const loading = strategiesLoading || metricsLoading;
  const error = strategiesError;
  const { handleError } = useErrorHandler();

  // Show toast notification pentru erori
  useEffect(() => {
    if (error && !loading) {
      handleError(error, { 
        title: 'Failed to Load Strategies Stats',
        showToast: true 
      });
    }
  }, [error, loading, handleError]);

  // Calculate stats from strategies
  const stats = useMemo(() => {
    if (!strategies || strategies.length === 0) return null;

    const total = strategies.length;
    const active = strategies.filter(s => s.enabled === true || s.status === 'active').length;
    const paused = strategies.filter(s => s.enabled === false || s.status === 'paused').length;
    const totalProfit = metrics?.netProfit || 0;

    return {
      total,
      active,
      paused,
      totalProfit
    };
  }, [strategies, metrics]);

  // ALL HOOKS MUST BE BEFORE EARLY RETURNS
  const formatNumber = useCallback((num) => {
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  }, []);

  const statCards = useMemo(() => {
    if (!stats) return [];
    
    return [
      {
        id: 'total',
        label: 'Total Strategies',
        value: stats.total,
        icon: Target,
        color: '#4facfe'
      },
      {
        id: 'active',
        label: 'Active',
        value: stats.active,
        icon: Play,
        color: '#22c55e'
      },
      {
        id: 'paused',
        label: 'Paused',
        value: stats.paused,
        icon: Pause,
        color: '#f59e0b'
      },
      {
        id: 'profit',
        label: 'Total Profit',
        value: formatNumber(stats.totalProfit),
        icon: TrendingUp,
        color: '#9945ff'
      }
    ];
  }, [stats, formatNumber]);

  // Early returns AFTER all hooks
  if (loading) {
    return (
      <div className="strategies-stats-container">
        <LoadingSpinner message="Loading strategies stats" size="medium" />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="strategies-stats-container">
        <EmptyState
          icon="alert"
          title="Unable to Load Strategies Stats"
          message={error || 'No strategies data available yet.'}
        />
      </div>
    );
  }

  // If no stats available (no strategies), show empty state
  if (!stats) {
    return (
      <div className="strategies-stats-container">
        <EmptyState
          icon="inbox"
          title="No Strategies Yet"
          message="Create a strategy to see statistics here."
        />
      </div>
    );
  }

  return (
    <div className="strategies-stats-container">
      <div className="strategies-stats-grid">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card 
              key={card.id} 
              variant="elevated" 
              padding="md"
              className="strategies-stats-card"
            >
              <div 
                className="strategies-stats-icon-wrapper"
                style={{ backgroundColor: `${card.color}20`, color: card.color }}
              >
                <Icon size={20} />
              </div>
              <div className="strategies-stats-content">
                <div className="strategies-stats-label">{card.label}</div>
                <div className="strategies-stats-value">{card.value}</div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
});

StrategiesStats.displayName = 'StrategiesStats';

export default StrategiesStats;
