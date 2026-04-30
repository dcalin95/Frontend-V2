/**
 * WalletConnector.sei.jsx – Conectare wallet SEI (Keplr / Compass / Leap).
 * Detectează automat walleturile instalate și le afișează ca butoane separate.
 */

import React from 'react';
import { useSeiWallet } from './context/SeiWalletContext';

export default function WalletConnectorSei() {
  const { connect, isConnecting, error } = useSeiWallet();

  const hasCompass = typeof window !== 'undefined' && !!window.compass;
  const hasKeplr   = typeof window !== 'undefined' && !!window.keplr && !window.keplr._isCompass;
  const hasLeap    = typeof window !== 'undefined' && !!window.leap;
  const hasAny     = hasCompass || hasKeplr || hasLeap;

  const btnStyle = (color) => ({
    padding: '8px 14px',
    borderRadius: '8px',
    border: 'none',
    background: color,
    color: '#fff',
    fontWeight: 500,
    cursor: isConnecting ? 'wait' : 'pointer',
    fontSize: '14px',
    opacity: isConnecting ? 0.7 : 1,
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      {!hasAny && (
        <a
          href="https://compasswallet.io"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '14px', color: 'var(--ds-accent, #6366f1)' }}
        >
          Install Compass Wallet
        </a>
      )}

      {hasCompass && (
        <button type="button" disabled={isConnecting}
          onClick={() => connect('compass')}
          style={btnStyle('#e84142')}
          aria-label="Connect Compass Wallet"
        >
          {isConnecting ? 'Connecting...' : 'Compass'}
        </button>
      )}

      {hasKeplr && (
        <button type="button" disabled={isConnecting}
          onClick={() => connect('keplr')}
          style={btnStyle('var(--ds-accent, #6366f1)')}
          aria-label="Connect Keplr Wallet"
        >
          {isConnecting ? 'Connecting...' : 'Keplr'}
        </button>
      )}

      {hasLeap && (
        <button type="button" disabled={isConnecting}
          onClick={() => connect('leap')}
          style={btnStyle('#16a34a')}
          aria-label="Connect Leap Wallet"
        >
          {isConnecting ? 'Connecting...' : 'Leap'}
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
