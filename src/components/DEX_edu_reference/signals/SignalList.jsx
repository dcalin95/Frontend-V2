/**
 * 📡 SignalList Component - Signal List Display
 * 
 * Component pentru displaying signal list:
 * - Signal cards
 * - Signal status (valid/invalid)
 * - Signal actions (validate, view details)
 * 
 * @module SignalList
 */

import React, { useState } from 'react';
import { useSignals } from '../hooks/DEX/useSignals';
import SignalCard from './SignalCard';
import LoadingSpinner from '../common/LoadingSpinner';
import '../../../styles/DEX/components/signal-list.css';

const SignalList = ({ userId, onSelectSignal, filters = {} }) => {
  const {
    signals,
    loading,
    error,
    refreshing,
    pagination,
    validateSignal,
    loadNextPage,
    loadPreviousPage,
    refresh
  } = useSignals(userId, { autoRefresh: true, ...filters });

  const [validating, setValidating] = useState({});

  const handleValidate = async (signalId) => {
    try {
      setValidating(prev => ({ ...prev, [signalId]: true }));
      await validateSignal(signalId);
      await refresh();
    } catch (error) {
      console.error('Error validating signal:', error);
    } finally {
      setValidating(prev => ({ ...prev, [signalId]: false }));
    }
  };

  if (loading && !signals) {
    return (
      <div className="signal-list">
        <LoadingSpinner message="Loading signals..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="signal-list-error">
        <p>{error}</p>
        <button onClick={refresh}>Retry</button>
      </div>
    );
  }

  if (!signals || signals.length === 0) {
    return (
      <div className="signal-list-empty">
        <p>No signals found. Generate your first signal!</p>
      </div>
    );
  }

  return (
    <div className="signal-list">
      {refreshing && (
        <div className="signal-list-refreshing">
          <LoadingSpinner size="small" message="Refreshing..." />
        </div>
      )}
      
      <div className="signal-list-grid">
        {signals.map((signal) => (
          <SignalCard
            key={signal.id}
            signal={signal}
            validating={validating[signal.id]}
            onSelect={() => onSelectSignal?.(signal)}
            onValidate={() => handleValidate(signal.id)}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="signal-list-pagination">
          <button
            className="signal-list-pagination-btn"
            onClick={loadPreviousPage}
            disabled={pagination.offset === 0 || loading}
          >
            Previous
          </button>
          <span className="signal-list-pagination-info">
            Showing {pagination.offset + 1} - {pagination.offset + signals.length} of {pagination.total || signals.length}
          </span>
          <button
            className="signal-list-pagination-btn"
            onClick={loadNextPage}
            disabled={!pagination.hasMore || loading}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default SignalList;

