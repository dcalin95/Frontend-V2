import React, { useState, useEffect } from 'react';
import './DynamicNFTCard.css';

const DynamicNFTCard = ({ userProfile }) => {
  // Evolution Logic based on user stats
  const calculateEvolution = () => {
    const { tier, balance, analysisCount } = userProfile;
    
    let evoLevel = 1; // Default: Neophyte
    let nextThreshold = 1000; // BITS needed for next level
    let progress = 0;

    // Tier Logic (Simplified for demo)
    if (tier >= 4 || balance >= 150000) {
      evoLevel = 4; // Grandmaster
      progress = 100;
    } else if (tier >= 3 || balance >= 75000) {
      evoLevel = 3; // Master
      nextThreshold = 150000;
      progress = (balance / 150000) * 100;
    } else if (tier >= 2 || balance >= 15000) {
      evoLevel = 2; // Apprentice
      nextThreshold = 75000;
      progress = (balance / 75000) * 100;
    } else {
      evoLevel = 1; // Neophyte
      nextThreshold = 15000;
      progress = (balance / 15000) * 100;
    }

    return { 
      level: evoLevel, 
      title: getTitle(evoLevel),
      colorClass: `tier-${evoLevel}`,
      progress: Math.min(progress, 100),
      nextGoal: nextThreshold
    };
  };

  const getTitle = (level) => {
    switch(level) {
      case 4: return "VOID GRANDMASTER";
      case 3: return "MIND MASTER";
      case 2: return "NEURAL APPRENTICE";
      default: return "DATA NEOPHYTE";
    }
  };

  const getAvatar = (level) => {
    switch(level) {
      case 4: return "🌌";
      case 3: return "🧠";
      case 2: return "⚡";
      default: return "💾";
    }
  };

  const [evolution, setEvolution] = useState(calculateEvolution());

  useEffect(() => {
    setEvolution(calculateEvolution());
  }, [userProfile]);

  return (
    <div className="soulbound-container">
      <div className={`soulbound-card`}>
        <div className={`card-face ${evolution.colorClass}`}>
          {/* Holographic Effect */}
          <div className="holographic-overlay"></div>

          {/* Header */}
          <div className="card-header">
            <h3 className="card-title">{evolution.title}</h3>
            <div style={{fontSize: '0.7rem', opacity: 0.7, marginTop: '5px', letterSpacing: '1px'}}>SOULBOUND IDENTITY</div>
          </div>

          {/* Central Avatar */}
          <div className="card-avatar-container">
            <div className="card-avatar">
              {getAvatar(evolution.level)}
            </div>
          </div>

          {/* Stats Footer */}
          <div className="card-stats">
            <div className="stat-row">
              <span>Wallet</span>
              <span className="stat-value">{userProfile.wallet ? `${userProfile.wallet.slice(0,6)}...` : 'N/A'}</span>
            </div>
            <div className="stat-row">
              <span>Soul Score</span>
              <span className="stat-value">{Math.floor(userProfile.balance / 100)} XP</span>
            </div>
            <div className="stat-row">
              <span>Generation</span>
              <span className="stat-value">GEN-1</span>
            </div>
          </div>
        </div>
      </div>

      {/* Evolution Progress */}
      <div className="evolution-bar-container">
        <div className="evolution-label">
          Evolution Progress: {evolution.progress.toFixed(1)}% to Next Tier
        </div>
        <div className="evolution-track">
          <div className="evolution-fill" style={{width: `${evolution.progress}%`}}></div>
        </div>
        <div style={{fontSize: '0.8rem', color: '#666', marginTop: '5px'}}>
          Hold {evolution.nextGoal.toLocaleString()} BITS to Evolve
        </div>
      </div>
    </div>
  );
};

export default DynamicNFTCard;

