/**
 * NetworkStatusBanner: discreet banner for slow network (Binance-inspired).
 * Shows a message and allows dismissal; does not block the UI.
 */

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useNetworkStatus } from '../../context/NetworkStatusContext';
import '../../styles/components/network-status-banner.css';

export default function NetworkStatusBanner() {
  const { showBanner, dismiss } = useNetworkStatus();

  if (!showBanner) return null;

  return (
    <div className="network-status-banner" role="status" aria-live="polite">
      <AlertTriangle size={18} className="network-status-banner-icon" aria-hidden />
      <span className="network-status-banner-text">
        Slow network. Some data may load with a delay. Press <strong>Refresh</strong> on pages where you see a timeout.
      </span>
      <button
        type="button"
        onClick={dismiss}
        className="network-status-banner-dismiss"
        aria-label="Dismiss notification"
      >
        <X size={16} aria-hidden />
      </button>
    </div>
  );
}
