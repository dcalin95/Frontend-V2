/**
 * 📡 Signals Page - Signals Management Page
 * 
 * Signals management page:
 * - Signal list
 * - Signal generation
 * - Signal validation
 * - Signal history
 * 
 * @module Signals
 */

import React from 'react';
import SignalList from '../components/signals/SignalList';
import SignalDetails from '../components/signals/SignalDetails';
import '../styles/pages.css';

const Signals = ({ userId }) => {
  const [selectedSignal, setSelectedSignal] = React.useState(null);
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className="signals-page">
      <div className="signals-page-header">
        <h1 className="signals-page-title">Trading Signals</h1>
      </div>

      <div className="signals-page-content">
        <SignalList 
          userId={userId}
          onSelectSignal={(signal) => {
            setSelectedSignal(signal);
            setShowDetails(true);
          }}
        />

        {showDetails && selectedSignal && (
          <SignalDetails
            userId={userId}
            signalId={selectedSignal.id}
            onClose={() => {
              setShowDetails(false);
              setSelectedSignal(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Signals;

