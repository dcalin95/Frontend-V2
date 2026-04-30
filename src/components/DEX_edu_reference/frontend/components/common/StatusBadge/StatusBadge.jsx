/**
 * 🏷️ StatusBadge Component - Status Badge Display
 */

import React from 'react';
import './StatusBadge.css';

const StatusBadge = ({ status, config, className = '' }) => {
  if (!config) return null;

  const Icon = config.icon;
  const size = config.iconSize || 16;

  return (
    <div className={`status-badge status-badge-${config.className} ${className}`}>
      {Icon && <Icon size={size} className="status-badge-icon" />}
      <span className="status-badge-label">{config.label}</span>
    </div>
  );
};

export default StatusBadge;

