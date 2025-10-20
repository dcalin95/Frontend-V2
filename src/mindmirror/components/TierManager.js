import React from 'react';
import { useWalletGate } from '../hooks/useWalletGate';
import VoiceAnalyzer from './tier3/VoiceAnalyzer';
import VideoAnalyzer from './tier3/VideoAnalyzer';
import SmartRingFuture from './tier4/SmartRingFuture';
import './TierManager.css';

const TIER_REQUIREMENTS = {
  TIER2: 1000,
  TIER3: 5000,
  TIER4: 10000
};

const TierManager = ({ tier }) => {
  const { hasAccess, loading } = useWalletGate(TIER_REQUIREMENTS[tier]);

  if (loading) {
    return <div className="tier-loading">Checking access...</div>;
  }

  if (!hasAccess) {
    return (
      <div className="tier-locked">
        <h3>🔒 {tier} Features Locked</h3>
        <p>Hold {TIER_REQUIREMENTS[tier]} BITS tokens to unlock:</p>
        {tier === 'TIER3' && (
          <ul>
            <li>Voice Pattern Analysis</li>
            <li>Facial Expression Recognition</li>
            <li>Real-time Emotion Tracking</li>
          </ul>
        )}
        {tier === 'TIER4' && (
          <ul>
            <li>Smart Ring Integration</li>
            <li>Biometric Data Analysis</li>
            <li>24/7 Mind State Monitoring</li>
          </ul>
        )}
        <button className="unlock-tier-btn">Get BITS Tokens</button>
      </div>
    );
  }

  return (
    <div className="tier-content">
      {tier === 'TIER3' && (
        <>
          <VoiceAnalyzer />
          <VideoAnalyzer />
        </>
      )}
      {tier === 'TIER4' && <SmartRingFuture />}
    </div>
  );
};

export default TierManager;











