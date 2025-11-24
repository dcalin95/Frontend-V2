import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Clock, Activity as ActivityIcon } from 'lucide-react';
import '../styles/NeuralIntelligence.css';

/**
 * Individual Signal Card
 * @param {Object} props
 * @param {Object} props.signal - Signal data
 */
const SignalCard = ({ signal }) => {
  const getActionIcon = (action) => {
    switch (action) {
      case 'Long': return <TrendingUp size={16} style={{ color: '#00FFA3' }} />;
      case 'Short': return <TrendingDown size={16} style={{ color: '#E6444D' }} />;
      case 'Flat': return <Minus size={16} style={{ color: '#8b9bb4' }} />;
      default: return null;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'Long': return '#00FFA3';
      case 'Short': return '#E6444D';
      case 'Flat': return '#8b9bb4';
      default: return '#ffffff';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return '#00FFA3';
    if (confidence >= 60) return '#FFC107';
    return '#E6444D';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60); // minutes

    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="signal-card">
      <div className="signal-header">
        <div className="signal-market">
          <span className="market-icon">📊</span>
          <span className="market-name">{signal.market}</span>
        </div>
        <span className="signal-time">{formatTime(signal.timestamp)}</span>
      </div>

      <div className="signal-body">
        <div className="signal-action">
          <div 
            className="action-badge"
            style={{
              background: `${getActionColor(signal.action)}20`,
              border: `1px solid ${getActionColor(signal.action)}40`
            }}
          >
            {getActionIcon(signal.action)}
            <span style={{ color: getActionColor(signal.action) }}>
              {signal.action}
            </span>
          </div>
        </div>

        <div className="signal-confidence">
          <span className="confidence-label">Confidence</span>
          <div className="confidence-bar-container">
            <div 
              className="confidence-bar"
              style={{
                width: `${signal.confidence}%`,
                background: getConfidenceColor(signal.confidence)
              }}
            ></div>
          </div>
          <span 
            className="confidence-value"
            style={{ color: getConfidenceColor(signal.confidence) }}
          >
            {signal.confidence}%
          </span>
        </div>

        {signal.expectedRange && (
          <div className="signal-ranges">
            <div className="range-item">
              <span className="range-label">Target</span>
              <span className="range-value success">{signal.expectedRange.target}</span>
            </div>
            <div className="range-item">
              <span className="range-label">Stop Loss</span>
              <span className="range-value danger">{signal.expectedRange.stopLoss}</span>
            </div>
          </div>
        )}

        {signal.reasoning && (
          <div className="signal-reasoning">
            <span className="reasoning-icon">💡</span>
            <span className="reasoning-text">{signal.reasoning}</span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Activity Log Entry Component
 * @param {Object} props
 * @param {Object} props.activity - Activity log entry
 */
const ActivityEntry = ({ activity }) => {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'success': return '#00FFA3';
      case 'warning': return '#FFC107';
      case 'error': return '#E6444D';
      case 'info':
      default: return '#4FACFE';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'mode_change': return '⚙️';
      case 'strategy_toggle': return '🎯';
      case 'risk_event': return '⚠️';
      case 'trade_execution': return '💰';
      case 'system': return '🔧';
      default: return '📝';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="activity-entry">
      <div 
        className="activity-indicator"
        style={{ background: getSeverityColor(activity.severity) }}
      ></div>
      <div className="activity-content">
        <div className="activity-header">
          <span className="activity-icon">{getTypeIcon(activity.type)}</span>
          <span className="activity-time">{formatTime(activity.timestamp)}</span>
        </div>
        <p className="activity-message">{activity.message}</p>
      </div>
    </div>
  );
};

/**
 * Signals & Activity Log Component
 * Tabbed view showing AI signals and activity log
 * 
 * @param {Object} props
 * @param {Array} props.signals - Recent AI signals
 * @param {Array} props.activities - Activity log entries
 * @param {boolean} props.loading - Whether data is loading
 */
const SignalsActivityCard = ({ signals, activities, loading }) => {
  const [activeTab, setActiveTab] = useState('signals'); // 'signals' | 'activity'

  return (
    <div className="neural-card signals-activity-card">
      {/* Header with Tabs */}
      <div className="neural-card-header">
        <div className="tab-buttons">
          <button
            className={`tab-btn ${activeTab === 'signals' ? 'active' : ''}`}
            onClick={() => setActiveTab('signals')}
          >
            <TrendingUp size={18} />
            <span>Recent Signals</span>
            <span className="tab-count">{signals?.length || 0}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            <ActivityIcon size={18} />
            <span>Activity Log</span>
            <span className="tab-count">{activities?.length || 0}</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="tab-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <span>Loading data...</span>
          </div>
        ) : (
          <>
            {/* Signals Tab */}
            {activeTab === 'signals' && (
              <div className="signals-list">
                {signals && signals.length > 0 ? (
                  signals.map(signal => (
                    <SignalCard key={signal.id} signal={signal} />
                  ))
                ) : (
                  <div className="empty-state">
                    <span className="empty-icon">📊</span>
                    <p>No signals available yet</p>
                    <span className="empty-hint">Signals will appear as AI analyzes markets</span>
                  </div>
                )}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="activity-list">
                {activities && activities.length > 0 ? (
                  activities.map(activity => (
                    <ActivityEntry key={activity.id} activity={activity} />
                  ))
                ) : (
                  <div className="empty-state">
                    <span className="empty-icon">📋</span>
                    <p>No activity recorded</p>
                    <span className="empty-hint">Activity will be logged as AI operates</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SignalsActivityCard;

