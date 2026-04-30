/**
 * SeiLayout – Layout pentru rutele /dex-edu/sei/*. Conținutul SEI (wallet, pair, Trade/Swap) e în Header-ul principal. SeiWalletProvider e în DEXApp.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import '../frontend/styles/components/sei-skeleton.css';

export default function SeiLayout() {
  return (
    <div
      className="sei-layout"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--ds-bg-base, #0f0f12)',
        color: 'var(--ds-text-primary, #e2e8f0)',
      }}
    >
      <main className="sei-main" style={{ flex: 1, padding: '20px' }}>
        <Outlet />
      </main>
    </div>
  );
}
