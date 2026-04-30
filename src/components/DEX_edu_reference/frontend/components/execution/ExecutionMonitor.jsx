/**
 * ⚡ ExecutionMonitor Component - Trade Execution Monitor
 * 
 * Refactorized: Using reusable components for better maintainability
 * 
 * @module ExecutionMonitor
 */

import React from 'react';
import { useExecution } from '../../hooks/useExecution';
import { Activity } from 'lucide-react';
import { ExecutionStats, RecentTradesList } from './ExecutionMonitor/index';
import LoadingSpinner from '../common/LoadingSpinner';
import '../../styles/components/execution-monitor.css';

const ExecutionMonitor = ({ userId }) => {
  const {
    trades,
    loading,
    error,
    refreshing,
    refresh
  } = useExecution(userId, { autoRefresh: true, limit: 100 });

  if (loading && !trades) {
    return (
      <div className="execution-monitor">
        <LoadingSpinner message="Loading execution data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="execution-monitor-error">
        <p>{error}</p>
        <button onClick={refresh}>Retry</button>
      </div>
    );
  }

  return (
    <div className="execution-monitor">
      <div className="execution-monitor-header">
        <h2 className="execution-monitor-title">
          <Activity size={20} />
          Execution Monitor
        </h2>
        {refreshing && (
          <div className="execution-monitor-refreshing">
            <LoadingSpinner size="small" message="" />
            <span>Refreshing...</span>
          </div>
        )}
      </div>

      {/* Statistics */}
      <ExecutionStats trades={trades} />

      {/* Recent Trades */}
      {trades && trades.length > 0 && (
        <div className="execution-monitor-recent">
          <h3 className="execution-monitor-recent-title">Recent Trades</h3>
          <RecentTradesList trades={trades} limit={5} />
        </div>
      )}
    </div>
  );
};

export default ExecutionMonitor;
