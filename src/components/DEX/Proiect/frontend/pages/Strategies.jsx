/**
 * 📊 Strategies Page - Strategies Management Page
 * 
 * Strategies management page:
 * - Strategy list
 * - Strategy creation
 * - Strategy configuration
 * - Strategy management (CRUD)
 * 
 * @module Strategies
 */

import React from 'react';
import StrategyList from '../components/strategies/StrategyList';
import StrategyConfig from '../components/strategies/StrategyConfig';
import '../styles/pages.css';

const Strategies = ({ userId }) => {
  const [selectedStrategy, setSelectedStrategy] = React.useState(null);
  const [showConfig, setShowConfig] = React.useState(false);

  return (
    <div className="strategies-page">
      <div className="strategies-page-header">
        <h1 className="strategies-page-title">Trading Strategies</h1>
        <button 
          className="strategies-page-add-btn"
          onClick={() => {
            setSelectedStrategy(null);
            setShowConfig(true);
          }}
        >
          + Create Strategy
        </button>
      </div>

      <div className="strategies-page-content">
        <StrategyList 
          userId={userId}
          onSelectStrategy={(strategy) => {
            setSelectedStrategy(strategy);
            setShowConfig(true);
          }}
        />

        {showConfig && (
          <StrategyConfig
            userId={userId}
            strategy={selectedStrategy}
            onClose={() => {
              setShowConfig(false);
              setSelectedStrategy(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Strategies;

