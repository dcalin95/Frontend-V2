/**
 * SolLayout – Layout pentru rutele /dex-edu/sol/*. Conținutul SOL (wallet, pair, Trade/Swap) e în Header-ul principal.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import '../frontend/styles/components/sol-skeleton.css';

function SolLayout() {
  return (
    <div
      className="sol-layout"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--ds-bg-base, #0f0f12)',
        color: 'var(--ds-text-primary, #e2e8f0)',
      }}
    >
      <main className="sol-main" style={{ flex: 1, padding: '20px' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default SolLayout;
