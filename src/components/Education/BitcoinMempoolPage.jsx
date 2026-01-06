import React from 'react';
import { Link } from 'react-router-dom';
import RecentBTCFeed from '../../Presale/BITSAnalytics/RecentBTCFeed';
import './EducationTools.css';

const BitcoinMempoolPage = () => {
  return (
    <div className="education-tools-page">
      <div className="education-tools-container">
        <div className="education-tools-header">
          <Link to="/education" className="back-button">
            ← Back to Education
          </Link>
          <h1>₿ Live Bitcoin Mempool</h1>
          <p className="subtitle">Real-time Bitcoin network transaction monitoring</p>
        </div>

        <div className="education-tools-content">
          <RecentBTCFeed />
        </div>
      </div>
    </div>
  );
};

export default BitcoinMempoolPage;

