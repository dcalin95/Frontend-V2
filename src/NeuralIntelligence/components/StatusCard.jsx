import React from 'react';
import { Activity } from 'lucide-react';
import '../styles/NeuralIntelligence.css';

/**
 * AI Status & Mode Card Component
 * Shows current AI status, mode selector, and quick stats
 * 
 * @param {Object} props
 * @param {Object} props.status - Current AI status
 * @param {string} props.currentMode - Current operating mode
 * @param {Function} props.onModeChange - Callback when mode changes
 * @param {boolean} props.isPaused - Whether AI is paused
 * @param {Function} props.onPauseToggle - Callback for pause/resume
 * @param {boolean} props.walletConnected - Whether wallet is connected
 */
const StatusCard = ({
  status,
  currentMode,
  onModeChange,
  isPaused,
  onPauseToggle,
  walletConnected
}) => {
  const getStatusColor = (statusValue) => {
    switch (statusValue) {
      case 'Online': return '#00FFA3';
      case 'Degraded': return '#FFC107';
      case 'Offline': return '#E6444D';
      default: return '#8b9bb4';
    }
  };

  const getModeWarning = (mode) => {
    if (mode === 'Semi-Automatic') {
      return '⚠️ Semi-Automatic mode will execute trades with your confirmation.';
    }
    if (mode === 'Automated') {
      return '⚠️ CAUTION: Automated mode will execute trades without confirmation. High risk.';
    }
    return null;
  };

  return (
    <div className="neural-card status-card">
      {/* Header */}
      <div className="neural-card-header">
        <div className="header-left">
          <Activity size={20} style={{ color: '#00FFA3' }} />
          <h3>AI Status & Mode</h3>
        </div>
        <div 
          className="status-indicator" 
          style={{ 
            background: `${getStatusColor(status?.status)}15`,
            border: `1px solid ${getStatusColor(status?.status)}40`
          }}
        >
          <span 
            className="status-dot" 
            style={{ background: getStatusColor(status?.status) }}
          ></span>
          <span style={{ color: getStatusColor(status?.status) }}>
            {status?.status || 'Loading...'}
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-item">
          <span className="stat-label">Uptime</span>
          <span className="stat-value">{status?.uptime || '—'}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Signals Processed</span>
          <span className="stat-value">{status?.signalsProcessed?.toLocaleString() || '—'}</span>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="mode-selector-section">
        <label className="section-label">Operating Mode</label>
        <div className="mode-buttons">
          <button
            className={`mode-btn ${currentMode === 'Advisory' ? 'active' : ''}`}
            onClick={() => onModeChange('Advisory')}
            disabled={!walletConnected || isPaused}
          >
            <span className="mode-icon">💡</span>
            <span>Advisory</span>
          </button>
          <button
            className={`mode-btn ${currentMode === 'Semi-Automatic' ? 'active' : ''}`}
            onClick={() => onModeChange('Semi-Automatic')}
            disabled={!walletConnected || isPaused}
          >
            <span className="mode-icon">⚙️</span>
            <span>Semi-Auto</span>
          </button>
          <button
            className={`mode-btn ${currentMode === 'Automated' ? 'active' : ''}`}
            onClick={() => onModeChange('Automated')}
            disabled={!walletConnected || isPaused}
          >
            <span className="mode-icon">🤖</span>
            <span>Automated</span>
          </button>
        </div>
      </div>

      {/* Mode Warning */}
      {getModeWarning(currentMode) && (
        <div className="mode-warning">
          {getModeWarning(currentMode)}
        </div>
      )}

      {/* Pause Button */}
      <button
        className={`pause-btn ${isPaused ? 'paused' : ''}`}
        onClick={onPauseToggle}
        disabled={!walletConnected}
      >
        <span className="pause-icon">{isPaused ? '▶️' : '⏸️'}</span>
        <span>{isPaused ? 'Resume AI' : 'Pause AI'}</span>
      </button>

      {/* Wallet Not Connected Warning */}
      {!walletConnected && (
        <div className="wallet-warning">
          <span className="warning-icon">🔒</span>
          <span>Connect your wallet to enable Neural Intelligence for your account</span>
        </div>
      )}
    </div>
  );
};

export default StatusCard;

