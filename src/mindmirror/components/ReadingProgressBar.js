import React from 'react';
import './ReadingProgressBar.css';

const ReadingProgressBar = ({ progress, readingSections = new Set(), engagementScore }) => {
  return (
    <div className="reading-progress-container">
      {/* Main Progress Bar */}
      <div className="reading-progress-bar">
        <div 
          className="reading-progress-fill"
          style={{ width: `${progress}%` }}
        >
          <div className="progress-shimmer"></div>
        </div>
        <div className="progress-percentage">{Math.round(progress)}%</div>
      </div>

      {/* Stats Mini Cards */}
      <div className="reading-stats">
        <div className="stat-item">
          <span className="stat-icon">📖</span>
          <span className="stat-value">{readingSections.size}</span>
          <span className="stat-label">Sections Read</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🎯</span>
          <span className="stat-value">{engagementScore || 0}</span>
          <span className="stat-label">Engagement</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">⚡</span>
          <span className={`stat-value ${progress > 90 ? 'complete' : ''}`}>
            {progress > 90 ? '✓' : '...'}
          </span>
          <span className="stat-label">
            {progress > 90 ? 'Complete!' : 'Keep Reading'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReadingProgressBar;

