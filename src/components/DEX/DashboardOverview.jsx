import React, { useState, useEffect } from 'react';
import PositionsTable from './PositionsTable';
import backendClient from './services/backendClient';
import devDashboardService from './services/devDashboardService';
import { DEX_DATA_SOURCE } from './config/dataSource';
import './DEX.css';
import './DashboardOverview.css';

const DashboardOverview = ({ positions = [], balance = 0, onClosePosition }) => {
  const [dataSourceLabel, setDataSourceLabel] = useState('DEV');
  const [backendAvailable, setBackendAvailable] = useState(false);
  
  // DEV MODE – Live data from backend
  const [liveData, setLiveData] = useState(null);
  const [liveDataLoading, setLiveDataLoading] = useState(false);
  const [liveDataError, setLiveDataError] = useState(null);

  // DEV MODE – Check backend health and set data source label
  useEffect(() => {
    const checkBackend = async () => {
      if (DEX_DATA_SOURCE === 'AUTO' || DEX_DATA_SOURCE === 'BACKEND') {
        try {
          const healthResult = await backendClient.checkBackendHealth();
          if (healthResult.ok) {
            setBackendAvailable(true);
            setDataSourceLabel(DEX_DATA_SOURCE === 'BACKEND' ? 'BACKEND' : 'BACKEND (fallback available)');
          } else {
            setBackendAvailable(false);
            setDataSourceLabel('DEV FALLBACK (backend offline)');
          }
        } catch (error) {
          setBackendAvailable(false);
          setDataSourceLabel('DEV FALLBACK (backend offline)');
        }
      } else {
        setDataSourceLabel('DEV');
      }
    };

    checkBackend();
    // Re-check every 30 seconds
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  // DEV MODE – Fetch live data from backend
  useEffect(() => {
    const fetchLiveData = async () => {
      if (!backendAvailable) {
        setLiveDataError('Backend unavailable (DEV MODE)');
        return;
      }

      try {
        setLiveDataLoading(true);
        setLiveDataError(null);
        const result = await devDashboardService.fetchLiveData();

        if (result.ok) {
          setLiveData(result.data);
        } else {
          setLiveDataError('Backend unavailable (DEV MODE)');
          setLiveData(null);
        }
      } catch (error) {
        console.error('❌ [DashboardOverview] Live data fetch error:', error);
        setLiveDataError('Backend unavailable (DEV MODE)');
        setLiveData(null);
      } finally {
        setLiveDataLoading(false);
      }
    };

    if (backendAvailable) {
      fetchLiveData();
      // Refresh every 30 seconds
      const interval = setInterval(fetchLiveData, 30000);
      return () => clearInterval(interval);
    }
  }, [backendAvailable]);

  return (
    <section className="dashboard-overview">
      {/* DEV MODE – Data Source Label */}
      <div style={{
        padding: '8px 12px',
        marginBottom: '12px',
        borderRadius: '8px',
        background: backendAvailable 
          ? 'rgba(0, 255, 163, 0.1)' 
          : 'rgba(255, 193, 7, 0.1)',
        border: `1px solid ${backendAvailable ? 'rgba(0, 255, 163, 0.3)' : 'rgba(255, 193, 7, 0.3)'}`,
        fontSize: '0.75rem',
        color: backendAvailable ? '#00FFA3' : '#FFC107',
        textAlign: 'center',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        DATA SOURCE: {dataSourceLabel}
      </div>
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

      {/* DEV MODE – Live Data from Backend */}
      {backendAvailable && (
        <div style={{
          padding: '12px',
          marginBottom: '12px',
          borderRadius: '8px',
          background: 'rgba(139, 155, 180, 0.05)',
          border: '1px solid rgba(139, 155, 180, 0.2)',
          fontSize: '0.85rem'
        }}>
          <h3 style={{ color: '#8b9bb4', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
            DEV MODE – Live Data from Backend
          </h3>
          {liveDataLoading && (
            <div style={{ color: '#8b9bb4' }}>Loading live data...</div>
          )}
          {liveDataError && (
            <div style={{ color: '#FFC107', fontWeight: '600' }}>{liveDataError}</div>
          )}
          {liveData && !liveDataLoading && !liveDataError && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '12px',
              borderRadius: '6px',
              marginTop: '8px',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              color: '#8b9bb4',
              overflow: 'auto',
              maxHeight: '300px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {JSON.stringify(liveData, null, 2)}
            </div>
          )}
        </div>
      )}

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
