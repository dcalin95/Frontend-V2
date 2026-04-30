/**
 * Floating Support — opens OTA Assistant chat (common UX pattern: bottom-right FAB).
 */
import React from 'react';
import { Link } from 'react-router-dom';
import OTALogo from '../frontend/components/ai-trading/OTALogo';
import '../../../styles/DEX/dex-support-fab.css';

export default function DexSupportFab() {
  return (
    <Link
      to="/dex-edu/ota/chat"
      className="dex-support-fab"
      title="OTA Assistant — product help and chat"
      aria-label="Support — open OTA Assistant chat"
    >
      <span className="dex-support-fab__mark" aria-hidden>
        <OTALogo size="xl" animated className="dex-support-fab__ota-logo" />
      </span>
      <span className="dex-support-fab__text">Support</span>
    </Link>
  );
}
