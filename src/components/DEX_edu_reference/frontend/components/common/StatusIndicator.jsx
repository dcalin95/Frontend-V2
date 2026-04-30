/**
 * 🟢 StatusIndicator Component - Status Indicator
 * 
 * Component reutilizabil pentru afișarea status-ului:
 * - Online/Offline
 * - Active/Inactive
 * - Success/Error/Warning
 * - Customizable colors
 * 
 * @module StatusIndicator
 */

import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock, Circle } from 'lucide-react';
import '../../styles/components/status-indicator.css';

const STATUS_ICONS = {
  online: CheckCircle,
  offline: XCircle,
  active: CheckCircle,
  inactive: Circle,
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  pending: Clock
};

const STATUS_COLORS = {
  online: '#22c55e',
  offline: '#6b7280',
  active: '#22c55e',
  inactive: '#6b7280',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  pending: '#4facfe'
};

const StatusIndicator = ({ 
  status = 'active',
  size = 'medium',
  showLabel = false,
  label,
  pulse = false,
  className = ''
}) => {
  const Icon = STATUS_ICONS[status] || Circle;
  const color = STATUS_COLORS[status] || '#6b7280';
  const displayLabel = label || status;

  const sizeMap = {
    small: 12,
    medium: 16,
    large: 20
  };

  const iconSize = sizeMap[size] || 16;

  return (
    <div className={`status-indicator status-indicator-${size} ${className}`}>
      <div 
        className={`status-indicator-icon ${pulse ? 'status-indicator-pulse' : ''}`}
        style={{ color }}
      >
        <Icon size={iconSize} />
      </div>
      {showLabel && (
        <span className="status-indicator-label">
          {displayLabel}
        </span>
      )}
    </div>
  );
};

export default StatusIndicator;
