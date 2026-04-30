/**
 * 📊 BotStatus Component - OpenAI Trading Agent (OTA) Status Display
 * 
 * Component pentru displaying OpenAI Trading Agent (OTA) status:
 * - Status indicator (running, stopped, paused, error)
 * - Uptime
 * - Last update
 * - Active strategies count
 * 
 * @module BotStatus
 */

import React, { useMemo } from 'react';
import { Activity, Clock, CheckCircle, XCircle, Pause, AlertCircle } from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatters';
import { AGENT_UI_LABELS } from '../../utils/aiTradingConstants';
import OTALogo from './OTALogo';
import '../../styles/components/bot-status.css';

const BotStatus = React.memo(({ status, stats, loading = false }) => {
  // All hooks must be called before any early returns
  const statusConfig = useMemo(() => {
    const statusValue = status?.status || 'stopped';
    switch (statusValue) {
      case 'running':
        return {
          icon: <Activity size={20} className="bot-status-icon running" aria-hidden="true" />,
          label: 'Running',
          className: 'running',
          color: '#10b981'
        };
      case 'stopped':
        return {
          icon: <XCircle size={20} className="bot-status-icon stopped" aria-hidden="true" />,
          label: 'Stopped',
          className: 'stopped',
          color: '#6b7280'
        };
      case 'paused':
        return {
          icon: <Pause size={20} className="bot-status-icon paused" aria-hidden="true" />,
          label: 'Paused',
          className: 'paused',
          color: '#f59e0b'
        };
      case 'error':
        return {
          icon: <AlertCircle size={20} className="bot-status-icon error" aria-hidden="true" />,
          label: 'Error',
          className: 'error',
          color: '#ef4444'
        };
      default:
        return {
          icon: <XCircle size={20} className="bot-status-icon stopped" aria-hidden="true" />,
          label: 'Unknown',
          className: 'stopped',
          color: '#6b7280'
        };
    }
  }, [status?.status]);

  const containerClassName = useMemo(() => 
    `bot-status ota-status bot-status-${statusConfig.className} ota-status-${statusConfig.className}`,
    [statusConfig.className]
  );

  const winRateDisplay = useMemo(() => 
    stats?.winRate ? `${(stats.winRate * 100).toFixed(2)}%` : '0%',
    [stats?.winRate]
  );

  // Early return after all hooks
  if (loading && !status) {
    return (
      <div className="bot-status ota-status">
        <div className="bot-status-loading ota-status-loading">Loading {AGENT_UI_LABELS.status}...</div>
      </div>
    );
  }

  return (
    <div 
      className={containerClassName}
      role="status"
      aria-live="polite"
      aria-label={`OTA Status: ${statusConfig.label}`}
    >
      <div className="bot-status-header ota-status-header">
        <div className="bot-status-indicator ota-status-indicator ota-title-row">
          <OTALogo 
            size="sm" 
            showGlow={statusConfig.className === 'running'} 
            className="ota-status-logo" 
          />
          {statusConfig.icon}
          <span className="bot-status-label ota-status-label">{statusConfig.label}</span>
        </div>
        {status?.uptime && (
          <div className="bot-status-uptime" aria-label={`Uptime: ${status.uptime}`}>
            <Clock size={16} aria-hidden="true" />
            <span>Uptime: {status.uptime || 'N/A'}</span>
          </div>
        )}
      </div>

      {status?.lastUpdate && (
        <div className="bot-status-last-update" aria-label={`Last update: ${formatRelativeTime(status.lastUpdate)}`}>
          Last update: {formatRelativeTime(status.lastUpdate)}
        </div>
      )}

      {stats && (
        <div className="bot-status-stats" role="group" aria-label="OTA Statistics">
          <div className="bot-status-stat-item">
            <span className="bot-status-stat-label">Total Trades:</span>
            <span className="bot-status-stat-value" aria-label={`Total trades: ${stats.totalTrades || 0}`}>
              {stats.totalTrades || 0}
            </span>
          </div>
          <div className="bot-status-stat-item">
            <span className="bot-status-stat-label">Win Rate:</span>
            <span className="bot-status-stat-value" aria-label={`Win rate: ${winRateDisplay}`}>
              {winRateDisplay}
            </span>
          </div>
          {stats.activeStrategies !== undefined && (
            <div className="bot-status-stat-item">
              <span className="bot-status-stat-label">Active Strategies:</span>
              <span className="bot-status-stat-value" aria-label={`Active strategies: ${stats.activeStrategies || 0}`}>
                {stats.activeStrategies || 0}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

BotStatus.displayName = 'BotStatus';

export default BotStatus;

