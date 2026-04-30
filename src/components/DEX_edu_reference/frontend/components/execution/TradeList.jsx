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
import { useExecution } from '../../hooks/useExecution';
import TradeCard from './TradeCard';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { Card, Button } from '../ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { errorWithPrefix } from '../../utils/logger';
import '../../styles/components/trade-list.css';

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
      errorWithPrefix('TradeList', 'Error cancelling trade:', error);
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
      <Card variant="outlined" padding="lg" className="trade-list-error">
        <p>{error}</p>
        <Button variant="primary" size="md" onClick={refresh}>
          Retry
        </Button>
      </Card>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <Card padding="lg" className="trade-list-empty">
        <EmptyState
          title="No trades found"
          message="Execute your first trade!"
        />
      </Card>
    );
  }

  return (
    <Card className="trade-list" padding="md">
      {refreshing && (
        <div className="trade-list-refreshing">
          <LoadingSpinner size="small" message="Refreshing..." />
        </div>
      )}
      
      <Card.Body>
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
      </Card.Body>

      {/* Pagination */}
      {pagination && (
        <Card.Footer>
          <div className="trade-list-pagination">
            <Button
              variant="secondary"
              size="sm"
              icon={<ChevronLeft size={16} />}
              onClick={loadPreviousPage}
              disabled={pagination.offset === 0 || loading}
            >
              Previous
            </Button>
            <span className="trade-list-pagination-info">
              Showing {pagination.offset + 1} - {pagination.offset + trades.length} of {pagination.total || trades.length}
            </span>
            <Button
              variant="secondary"
              size="sm"
              icon={<ChevronRight size={16} />}
              iconPosition="right"
              onClick={loadNextPage}
              disabled={!pagination.hasMore || loading}
            >
              Next
            </Button>
          </div>
        </Card.Footer>
      )}
    </Card>
  );
};

export default TradeList;

