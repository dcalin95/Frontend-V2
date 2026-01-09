/**
 * 📊 Dashboard Page - Main Dashboard Page
 * 
 * Main dashboard page pentru AI Trading:
 * - AI Trading Dashboard component
 * - Overall overview
 * 
 * @module Dashboard
 */

import React from 'react';
import AITradingDashboard from '../components/ai-trading/AITradingDashboard';
import '../styles/pages.css';

const Dashboard = ({ userId }) => {
  return (
    <div className="dashboard-page">
      <AITradingDashboard userId={userId} />
    </div>
  );
};

export default Dashboard;

