import React from 'react';
import PositionsTable from './PositionsTable';
import './DEX.css';
import './DashboardOverview.css';

const DashboardOverview = ({ positions = [], balance = 0, onClosePosition }) => {
  return (
    <section className="dashboard-overview">
      <div className="dex-ai-assistant-widget">
          <div className="ai-widget-header">
              <div className="ai-avatar-pulse"></div>
              <span className="ai-widget-title">NEURAL LINK v4.0</span>
          </div>
          <div className="ai-message-bubble">
              <span style={{color:'#fff', fontWeight:'700'}}>Welcome back, Commander.</span><br/>
              Market volatility is <span style={{color:'#E6444D'}}>High (85%)</span>. My algorithms detect a bullish divergence on <span style={{color:'#fff', fontWeight:'600'}}>BTC/USDT</span>. 
              <br/><br/>
              Your portfolio is up <span style={{color:'#30C371'}}>+2.4%</span> today.
              <span className="ai-typing-cursor"></span>
          </div>
          <button className="ai-action-btn">
              <span style={{fontSize:'1rem'}}>✨</span> Ask AI Analysis
          </button>
      </div>

      <div className="dashboard-balance-card">
         <h2 className="section-title">Portfolio</h2>
         <div className="mobile-balance-card">
            <span className="label">Total Balance</span>
            <span className="value">${balance.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
            <span className="pnl-pill">+2.4% (24h)</span>
         </div>
      </div>

      <div className="dashboard-positions">
          <h3 className="dashboard-subtitle">Open Positions</h3>
          <PositionsTable 
              positions={positions} 
              onClosePosition={onClosePosition}
              balance={balance}
          />
      </div>
    </section>
  );
};

export default DashboardOverview;
