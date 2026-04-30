/**
 * 📋 StrategyList Component - Strategy List Display
 * 
 * Component pentru displaying strategy list:
 * - Strategy cards
 * - Strategy status (enabled/disabled)
 * - Strategy actions (edit, delete, enable/disable)
 * 
 * @module StrategyList
 */

import React, { useCallback, useEffect } from 'react';
import { useStrategies } from '../../hooks/useStrategies';
import StrategyCard from './StrategyCard';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { Card, Button } from '../ui';
import '../../styles/components/strategy-list.css';

const StrategyList = React.memo(({ userId, onSelectStrategy }) => {
  const {
    strategies,
    loading,
    error,
    refreshing,
    deleteStrategy,
    enableStrategy,
    disableStrategy,
    refresh
  } = useStrategies(userId);

  const { handleError, handleSuccess } = useErrorHandler();

  // Show toast notification pentru erori
  useEffect(() => {
    if (error && !loading) {
      handleError(error, { 
        title: 'Failed to Load Strategies',
        showToast: true 
      });
    }
  }, [error, loading, handleError]);

  const handleSelectStrategy = useCallback((strategy) => {
    onSelectStrategy?.(strategy);
  }, [onSelectStrategy]);

  const handleDelete = useCallback(async (strategyId) => {
    try {
      await deleteStrategy(strategyId);
      handleSuccess('Strategy deleted successfully');
    } catch (err) {
      handleError(err, { 
        title: 'Failed to Delete Strategy',
        showToast: true 
      });
    }
  }, [deleteStrategy, handleError, handleSuccess]);

  const handleEnable = useCallback(async (strategyId) => {
    try {
      await enableStrategy(strategyId);
      handleSuccess('Strategy enabled successfully');
    } catch (err) {
      handleError(err, { 
        title: 'Failed to Enable Strategy',
        showToast: true 
      });
    }
  }, [enableStrategy, handleError, handleSuccess]);

  const handleDisable = useCallback(async (strategyId) => {
    try {
      await disableStrategy(strategyId);
      handleSuccess('Strategy disabled successfully');
    } catch (err) {
      handleError(err, { 
        title: 'Failed to Disable Strategy',
        showToast: true 
      });
    }
  }, [disableStrategy, handleError, handleSuccess]);

  if (loading && !strategies) {
    return (
      <div className="strategy-list">
        <LoadingSpinner message="Loading strategies..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card variant="outlined" padding="lg" className="strategy-list-error">
        <p>{error}</p>
        <Button 
          variant="primary" 
          size="md" 
          onClick={refresh}
          disabled={loading}
        >
          Retry
        </Button>
      </Card>
    );
  }

  if (!strategies || strategies.length === 0) {
    return (
      <Card padding="lg" className="strategy-list-empty">
        <EmptyState
          title="No strategies found"
          message="Create your first strategy!"
        />
      </Card>
    );
  }

  return (
    <Card className="strategy-list" padding="md">
      {refreshing && (
        <div className="strategy-list-refreshing">
          <LoadingSpinner size="small" message="Refreshing..." />
        </div>
      )}
      
      <Card.Body>
        <div className="strategy-list-grid">
          {strategies.map((strategy) => (
            <StrategyCard
              key={strategy.id}
              strategy={strategy}
              onSelect={() => handleSelectStrategy(strategy)}
              onDelete={handleDelete}
              onEnable={handleEnable}
              onDisable={handleDisable}
            />
          ))}
        </div>
      </Card.Body>
    </Card>
  );
});

StrategyList.displayName = 'StrategyList';

export default StrategyList;

