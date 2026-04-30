/**
 * StxLayout – Layout pentru rutele /dex-edu/stx/*. Conținutul STX (wallet, pair, Trade/Swap) e în Header-ul principal. StxWalletProvider e în DEXApp.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import '../frontend/styles/components/stx-skeleton.css';

function StxLayout() {
  return (
    <div
      className="stx-layout"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--ds-bg-base, #0f0f12)',
        color: 'var(--ds-text-primary, #e2e8f0)',
      }}
    >
      <main className="stx-main" style={{ flex: 1, padding: '20px' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default StxLayout;
