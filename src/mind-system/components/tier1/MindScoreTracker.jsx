import React from 'react';
import './MindScoreTracker.css';

const MindScoreTracker = ({ score, maxScore }) => {
  const progress = (score / maxScore) * 100;

  return (
    <div className="mind-score">
      <div className="score-text">
        Mind Score: {score}/{maxScore} words
      </div>
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default MindScoreTracker;











