/**
 * 📭 EmptyState Component - Empty State Display
 * 
 * Component reutilizabil pentru empty states:
 * - Customizable icon
 * - Title and message
 * - Optional action button
 * 
 * @module EmptyState
 */

import React from 'react';
import { Inbox, Search, FileX, AlertCircle, Wallet } from 'lucide-react';
import '../../styles/components/empty-state.css';

const ICON_MAP = {
  inbox: Inbox,
  search: Search,
  file: FileX,
  alert: AlertCircle,
  wallet: Wallet
};

const EmptyState = ({ 
  icon = 'inbox',
  title = 'No data available',
  message = 'There is no data to display at this time.',
  actionLabel,
  onAction,
  className = ''
}) => {
  const Icon = ICON_MAP[icon] || Inbox;

  return (
    <div className={`empty-state ${className}`}>
      <div className="empty-state-icon-wrapper">
        <Icon size={48} className="empty-state-icon" />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-message">{message}</p>
      {actionLabel && onAction && (
        <button 
          className="empty-state-action"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
