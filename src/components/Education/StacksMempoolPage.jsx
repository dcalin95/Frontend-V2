import React from 'react';
import { Link } from 'react-router-dom';
import RecentStacksFeed from '../../Presale/BITSAnalytics/RecentStacksFeed';
import './EducationTools.css';

const StacksMempoolPage = () => {
  return (
    <div className="education-tools-page">
      <div className="education-tools-container">
        <div className="education-tools-header">
          <Link to="/education" className="back-button">
            ← Back to Education
          </Link>
          <h1>🟧 Live Stacks (STX) Mempool</h1>
          <p className="subtitle">Real-time Stacks network transaction monitoring</p>
        </div>

        <div className="education-tools-content">
          <RecentStacksFeed />
        </div>
      </div>
    </div>
  );
};

export default StacksMempoolPage;

