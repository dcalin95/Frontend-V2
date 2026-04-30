/**
 * Product truth for OTA on Stacks: manual-assisted micro-profit only; no background auto worker.
 */

import React from 'react';
import { Info } from 'lucide-react';

export default function OtaStxManualOnlyBanner() {
  return (
    <div
      className="ota-stx-manual-only-banner"
      role="region"
      aria-label="STX OTA product status"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        gap: '10px 14px',
        margin: '0 0 12px 0',
        padding: '10px 12px',
        borderRadius: 8,
        border: '1px solid rgba(148, 163, 184, 0.35)',
        background: 'rgba(30, 41, 59, 0.45)',
        color: '#e2e8f0',
        fontSize: 12,
        lineHeight: 1.45,
      }}
    >
      <Info size={18} style={{ flexShrink: 0, marginTop: 2, opacity: 0.9 }} aria-hidden />
      <div>
        <strong>Stacks OTA: manual-only (assisted).</strong>{' '}
        There is no deployed STX auto-trading worker on the server. Quotes and round-trips run when you act in the
        browser; nothing runs unattended in the background. Any “auto” preference storage is non-production and does
        not execute trades.
      </div>
    </div>
  );
}
