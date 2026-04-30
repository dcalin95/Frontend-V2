/**
 * 📜 PerformanceHistory Component - Trading History Display
 * 
 * Refactorized: Using reusable components for better maintainability
 * 
 * @module PerformanceHistory
 */

import React, { useState, useEffect } from 'react';
import { usePerformance } from '../hooks/DEX/usePerformance';
import { HistoryItem, HistoryFilters } from './PerformanceHistory/index';
import LoadingSpinner from '../common/LoadingSpinner';
import '../../../styles/DEX/components/performance-history.css';

const PerformanceHistory = ({ userId }) => {
  const [filters, setFilters] = useState({ period: '30d', status: null });
  const {
    history,
    loading,
    error,
    refreshing,
    loadHistory
  } = usePerformance(userId, { period: filters.period, autoRefresh: false });

  useEffect(() => {
    if (userId) {
      loadHistory({ status: filters.status });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, filters.period, filters.status]);

  if (loading && !history) {
    return (
      <div className="performance-history">
        <LoadingSpinner message="Loading trading history..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="performance-history-error">
        <p>{error}</p>
        <button onClick={() => loadHistory({ status: filters.status })}>Retry</button>
      </div>
    );
  }

  return (
    <div className="performance-history">
      <div className="performance-history-header">
        <h3 className="performance-history-title">Trading History</h3>
        <HistoryFilters filters={filters} onFilterChange={setFilters} />
      </div>

      {refreshing && (
        <div className="performance-history-refreshing">
          <LoadingSpinner size="small" message="" />
          <span>Refreshing...</span>
        </div>
      )}

      {!history || history.length === 0 ? (
        <div className="performance-history-empty">
          <p>No trading history found for the selected period.</p>
        </div>
      ) : (
        <div className="performance-history-list">
          {history.map((trade) => (
            <HistoryItem key={trade.id} trade={trade} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PerformanceHistory;
