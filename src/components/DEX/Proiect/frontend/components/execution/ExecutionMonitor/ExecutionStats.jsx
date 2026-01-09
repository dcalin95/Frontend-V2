/**
 * 📊 ExecutionStats Component - Execution Statistics Display
 */

import React from 'react';
import { Activity, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { formatNumber, formatCurrency } from '../../../utils/formatters';
import { PnLDisplay } from '../../common/PnLDisplay';
import { TRADE_STATUS } from '../../../utils/constants';
import '../../../../styles/components/execution-monitor.css';

const ExecutionStats = ({ trades }) => {
  const stats = {
    total: trades?.length || 0,
    pending: trades?.filter(t => t.status === TRADE_STATUS.PENDING).length || 0,
    executed: trades?.filter(t => t.status === TRADE_STATUS.EXECUTED).length || 0,
    failed: trades?.filter(t => t.status === TRADE_STATUS.FAILED).length || 0,
    closed: trades?.filter(t => t.status === TRADE_STATUS.CLOSED).length || 0,
    totalPnl: trades?.reduce((sum, t) => sum + (t.pnl || 0), 0) || 0,
    winningTrades: trades?.filter(t => (t.pnl || 0) > 0).length || 0,
    losingTrades: trades?.filter(t => (t.pnl || 0) < 0).length || 0
  };

  const winRate = stats.total > 0 ? (stats.winningTrades / stats.total) * 100 : 0;

  const statCards = [
    {
      icon: Activity,
      label: 'Total Trades',
      value: formatNumber(stats.total, 0)
    },
    {
      icon: Clock,
      label: 'Pending',
      value: formatNumber(stats.pending, 0)
    },
    {
      icon: CheckCircle,
      label: 'Executed',
      value: formatNumber(stats.executed, 0)
    },
    {
      icon: XCircle,
      label: 'Failed',
      value: formatNumber(stats.failed, 0)
    },
    {
      icon: TrendingUp,
      label: 'Win Rate',
      value: `${formatNumber(winRate, 1)}%`,
      subtext: `${stats.winningTrades}W / ${stats.losingTrades}L`
    }
  ];

  return (
    <div className="execution-monitor-stats">
      {statCards.map((stat, index) => (
        <div key={index} className="execution-monitor-stat-card">
          <div className="execution-monitor-stat-header">
            <stat.icon size={16} />
            <span className="execution-monitor-stat-label">{stat.label}</span>
          </div>
          <div className="execution-monitor-stat-value">{stat.value}</div>
          {stat.subtext && (
            <div className="execution-monitor-stat-subtext">{stat.subtext}</div>
          )}
        </div>
      ))}
      
      {/* Total P/L */}
      <div className={`execution-monitor-stat-card ${stats.totalPnl >= 0 ? 'profit' : 'loss'}`}>
        <div className="execution-monitor-stat-header">
          <Activity size={16} />
          <span className="execution-monitor-stat-label">Total P/L</span>
        </div>
        <PnLDisplay value={stats.totalPnl} size="lg" />
      </div>
    </div>
  );
};

export default ExecutionStats;

