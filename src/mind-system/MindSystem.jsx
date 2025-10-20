import React, { useState } from 'react';
import { TIERS } from './config/tiers';
import MindInputCollector from './components/tier1/MindInputCollector';
import MindScoreTracker from './components/tier1/MindScoreTracker';
import NFTViewer from './components/tier1/NFTViewer';
import './MindSystem.css';

const MindSystem = () => {
  const [mindScore, setMindScore] = useState(0);
  const [nftGenerated, setNftGenerated] = useState(false);

  const handleMindInput = (text) => {
    const wordCount = text.trim().split(/\s+/).length;
    setMindScore(wordCount);
    if (wordCount >= TIERS.TIER1.maxWords) {
      setNftGenerated(true);
    }
  };

  return (
    <div className="mind-system">
      <h1>BitSwapDEX Mind System</h1>
      <div className="mind-container">
        <MindScoreTracker score={mindScore} maxScore={TIERS.TIER1.maxWords} />
        <MindInputCollector onInput={handleMindInput} />
        {nftGenerated && <NFTViewer />}
      </div>
    </div>
  );
};

export default MindSystem;












