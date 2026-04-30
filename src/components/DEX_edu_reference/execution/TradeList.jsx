/**
 * 📋 TradeList Component - Trade List Display
 * 
 * Component pentru displaying trade list:
 * - Trade cards
 * - Trade status (pending, executed, failed, closed)
 * - Trade actions (view details, cancel)
 * - Pagination
 * 
 * @module TradeList
 */

import React, { useState } from 'react';
import { useExecution } from '../hooks/DEX/useExecution';
import TradeCard from './TradeCard';
import LoadingSpinner from '../common/LoadingSpinner';
import '../../../styles/DEX/components/trade-list.css';

const TradeList = ({ userId, onSelectTrade, filters = {} }) => {
  const {
    trades,
    loading,
    error,
    refreshing,
    pagination,
    cancelTrade,
    loadNextPage,
    loadPreviousPage,
    refresh
  } = useExecution(userId, { autoRefresh: true, ...filters });

  const [cancelling, setCancelling] = useState({});

  const handleCancel = async (tradeId) => {
    try {
      setCancelling(prev => ({ ...prev, [tradeId]: true }));
      await cancelTrade(tradeId);
      await refresh();
    } catch (error) {
      console.error('Error cancelling trade:', error);
    } finally {
      setCancelling(prev => ({ ...prev, [tradeId]: false }));
    }
  };

  if (loading && !trades) {
    return (
      <div className="trade-list">
        <LoadingSpinner message="Loading trades..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="trade-list-error">
        <p>{error}</p>
        <button onClick={refresh}>Retry</button>
      </div>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <div className="trade-list-empty">
        <p>No trades found. Execute your first trade!</p>
      </div>
    );
  }

  return (
    <div className="trade-list">
      {refreshing && (
        <div className="trade-list-refreshing">
          <LoadingSpinner size="small" message="Refreshing..." />
        </div>
      )}
      
      <div className="trade-list-grid">
        {trades.map((trade) => (
          <TradeCard
            key={trade.id}
            trade={trade}
            cancelling={cancelling[trade.id]}
            onSelect={() => onSelectTrade?.(trade)}
            onCancel={() => handleCancel(trade.id)}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="trade-list-pagination">
          <button
            className="trade-list-pagination-btn"
            onClick={loadPreviousPage}
            disabled={pagination.offset === 0 || loading}
          >
            Previous
          </button>
          <span className="trade-list-pagination-info">
            Showing {pagination.offset + 1} - {pagination.offset + trades.length} of {pagination.total || trades.length}
          </span>
          <button
            className="trade-list-pagination-btn"
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

export default TradeList;

