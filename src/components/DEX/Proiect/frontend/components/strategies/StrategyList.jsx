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

import React from 'react';
import { useStrategies } from '../../hooks/useStrategies';
import StrategyCard from './StrategyCard';
import LoadingSpinner from '../common/LoadingSpinner';
import '../../styles/components/strategy-list.css';

const StrategyList = ({ userId, onSelectStrategy }) => {
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

  if (loading && !strategies) {
    return (
      <div className="strategy-list">
        <LoadingSpinner message="Loading strategies..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="strategy-list-error">
        <p>{error}</p>
        <button onClick={refresh}>Retry</button>
      </div>
    );
  }

  if (!strategies || strategies.length === 0) {
    return (
      <div className="strategy-list-empty">
        <p>No strategies found. Create your first strategy!</p>
      </div>
    );
  }

  return (
    <div className="strategy-list">
      {refreshing && (
        <div className="strategy-list-refreshing">
          <LoadingSpinner size="small" message="Refreshing..." />
        </div>
      )}
      
      <div className="strategy-list-grid">
        {strategies.map((strategy) => (
          <StrategyCard
            key={strategy.id}
            strategy={strategy}
            onSelect={() => onSelectStrategy?.(strategy)}
            onDelete={deleteStrategy}
            onEnable={enableStrategy}
            onDisable={disableStrategy}
          />
        ))}
      </div>
    </div>
  );
};

export default StrategyList;

