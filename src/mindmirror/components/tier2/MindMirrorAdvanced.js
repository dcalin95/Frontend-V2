import React from 'react';
import { useWalletGate } from '../../hooks/useWalletGate';
import { useAdvancedAnalysis } from '../../hooks/useAdvancedAnalysis';
import SentimentAnalysis from './SentimentAnalysis';
import './MindMirrorAdvanced.css';

const REQUIRED_BITS = 1000;

const MindMirrorAdvanced = ({ text }) => {
  const { hasAccess, loading } = useWalletGate(REQUIRED_BITS);
  const { analysis, analyzing } = useAdvancedAnalysis();

  if (loading) return <div className="tier-gate-loading">Checking access...</div>;
  
  if (!hasAccess) {
    return (
      <div className="tier-gate">
        <h3>🔒 Tier 2 Features Locked</h3>
        <p>Hold {REQUIRED_BITS} BITS tokens to unlock advanced analysis:</p>
        <ul>
          <li>Detailed sentiment analysis</li>
          <li>Emotion tracking</li>
          <li>Advanced visualizations</li>
          <li>Topic extraction</li>
        </ul>
        <button className="get-bits-btn">Get BITS Tokens</button>
      </div>
    );
  }

  return (
    <div className="mind-mirror-advanced">
      <div className="advanced-header">
        <h3>Tier 2 Analysis</h3>
        <span className="bits-badge">Premium</span>
      </div>
      
      {analyzing ? (
        <div className="analyzing-state">
          Performing advanced analysis...
        </div>
      ) : analysis ? (
        <SentimentAnalysis analysis={analysis} />
      ) : null}
    </div>
  );
};

export default MindMirrorAdvanced;











