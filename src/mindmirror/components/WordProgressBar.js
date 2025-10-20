import React from 'react';

const WordProgressBar = ({ currentWords, targetWords = 1000 }) => {
  const progress = Math.min((currentWords / targetWords) * 100, 100);
  
  return (
    <div className="progress-container">
      <div className="progress-text">
        <span>Progress: {currentWords}/{targetWords} words</span>
        <span>{progress.toFixed(1)}%</span>
      </div>
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      {currentWords < targetWords && (
        <div className="progress-text">
          <span>{targetWords - currentWords} more words needed for NFT generation</span>
        </div>
      )}
    </div>
  );
};

export default WordProgressBar;