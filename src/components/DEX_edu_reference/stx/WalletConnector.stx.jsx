/**
 * WalletConnector.stx.jsx – Conectare wallet Stacks (Leather / Hiro / Xverse).
 * Folosește doar StxWalletContext; nu wagmi/ethers.
 */

import React from 'react';
import { useStxWallet } from './context/StxWalletContext';

const LEATHER_URL = 'https://leather.io/';

export default function WalletConnectorStx() {
  const { connect, isConnecting, error, getStacksProvider } = useStxWallet();
  const hasWallet = typeof window !== 'undefined' && !!getStacksProvider();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      {!hasWallet && (
        <a
          href={LEATHER_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '14px', color: 'var(--ds-accent, #f7931a)' }}
        >
          Install Leather
        </a>
      )}
      {hasWallet && (
        <button
          type="button"
          onClick={connect}
          disabled={isConnecting}
          aria-label={isConnecting ? 'Connecting STX wallet...' : 'Connect STX wallet'}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            border: 'none',
            background: 'var(--ds-accent, #f7931a)',
            color: '#fff',
            fontWeight: 500,
            cursor: isConnecting ? 'wait' : 'pointer',
            fontSize: '14px',
          }}
        >
          {isConnecting ? 'Connecting...' : 'Connect STX Wallet'}
        </button>
      )}
      {error && (
        <span style={{ fontSize: '12px', color: 'var(--ds-danger, #dc2626)' }} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
