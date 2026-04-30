/**
 * 📊 BotStatus Component - Bot Status Display
 * 
 * Component pentru displaying AI Trading Bot status:
 * - Status indicator (running, stopped, paused, error)
 * - Uptime
 * - Last update
 * - Active strategies count
 * 
 * @module BotStatus
 */

import React from 'react';
import { Activity, Clock, CheckCircle, XCircle, Pause, AlertCircle } from 'lucide-react';
import { formatRelativeTime } from '../utils/DEX/formatters';
import '../../../styles/DEX/components/bot-status.css';

const BotStatus = ({ status, stats, loading = false }) => {
  if (loading && !status) {
    return (
      <div className="bot-status">
        <div className="bot-status-loading">Loading status...</div>
      </div>
    );
  }

  const getStatusConfig = (statusValue) => {
    switch (statusValue) {
      case 'running':
        return {
          icon: <Activity size={20} className="bot-status-icon running" />,
          label: 'Running',
          className: 'running',
          color: '#10b981'
        };
      case 'stopped':
        return {
          icon: <XCircle size={20} className="bot-status-icon stopped" />,
          label: 'Stopped',
          className: 'stopped',
          color: '#6b7280'
        };
      case 'paused':
        return {
          icon: <Pause size={20} className="bot-status-icon paused" />,
          label: 'Paused',
          className: 'paused',
          color: '#f59e0b'
        };
      case 'error':
        return {
          icon: <AlertCircle size={20} className="bot-status-icon error" />,
          label: 'Error',
          className: 'error',
          color: '#ef4444'
        };
      default:
        return {
          icon: <XCircle size={20} className="bot-status-icon stopped" />,
          label: 'Unknown',
          className: 'stopped',
          color: '#6b7280'
        };
    }
  };

  const statusConfig = getStatusConfig(status?.status || 'stopped');

  return (
    <div className={`bot-status bot-status-${statusConfig.className}`}>
      <div className="bot-status-header">
        <div className="bot-status-indicator">
          {statusConfig.icon}
          <span className="bot-status-label">{statusConfig.label}</span>
        </div>
        {status?.uptime && (
          <div className="bot-status-uptime">
            <Clock size={16} />
            <span>Uptime: {status.uptime || 'N/A'}</span>
          </div>
        )}
      </div>

      {status?.lastUpdate && (
        <div className="bot-status-last-update">
          Last update: {formatRelativeTime(status.lastUpdate)}
        </div>
      )}

      {stats && (
        <div className="bot-status-stats">
          <div className="bot-status-stat-item">
            <span className="bot-status-stat-label">Total Trades:</span>
            <span className="bot-status-stat-value">{stats.totalTrades || 0}</span>
          </div>
          <div className="bot-status-stat-item">
            <span className="bot-status-stat-label">Win Rate:</span>
            <span className="bot-status-stat-value">
              {stats.winRate ? `${(stats.winRate * 100).toFixed(2)}%` : '0%'}
            </span>
          </div>
          {stats.activeStrategies !== undefined && (
            <div className="bot-status-stat-item">
              <span className="bot-status-stat-label">Active Strategies:</span>
              <span className="bot-status-stat-value">{stats.activeStrategies || 0}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BotStatus;

