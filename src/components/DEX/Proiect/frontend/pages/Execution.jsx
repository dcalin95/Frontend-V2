/**
 * ⚡ Execution Page - Trade Execution Page
 * 
 * Trade execution page:
 * - Trade list
 * - Trade execution
 * - Trade details
 * - Execution monitoring
 * 
 * @module Execution
 */

import React from 'react';
import TradeList from '../components/execution/TradeList';
import TradeDetails from '../components/execution/TradeDetails';
import ExecutionMonitor from '../components/execution/ExecutionMonitor';
import '../styles/pages.css';

const Execution = ({ userId }) => {
  const [selectedTrade, setSelectedTrade] = React.useState(null);
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className="execution-page">
      <div className="execution-page-header">
        <h1 className="execution-page-title">Trade Execution</h1>
      </div>

      <div className="execution-page-content">
        {/* Execution Monitor */}
        <section className="execution-page-section">
          <ExecutionMonitor userId={userId} />
        </section>

        {/* Trade List */}
        <section className="execution-page-section">
          <TradeList 
            userId={userId}
            onSelectTrade={(trade) => {
              setSelectedTrade(trade);
              setShowDetails(true);
            }}
          />
        </section>

        {/* Trade Details */}
        {showDetails && selectedTrade && (
          <TradeDetails
            userId={userId}
            tradeId={selectedTrade.id}
            onClose={() => {
              setShowDetails(false);
              setSelectedTrade(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Execution;

