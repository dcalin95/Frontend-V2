/**
 * WalletConnector.sol.jsx - Solana wallet connection (Phantom / Solflare / etc.).
 * Uses WalletContext: connectWallet('solana') opens UnifiedWalletModal on the SOL tab.
 */

import React, { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext.jsx';
import SolTokenIcon from './SolTokenIcon';

const PHANTOM_URL = 'https://phantom.app/';

export default function WalletConnectorSol() {
  const { connectWallet, solanaWalletAddress } = useWallet();
  const [isPhantomAvailable, setIsPhantomAvailable] = useState(false);
  const hasSolanaConnected = !!solanaWalletAddress;

  useEffect(() => {
    const detectPhantom = () => {
      setIsPhantomAvailable(!!(window.solana?.isPhantom || window.phantom?.solana?.isPhantom));
    };
    detectPhantom();
    window.addEventListener('wallet-standard:app-ready', detectPhantom);
    return () => window.removeEventListener('wallet-standard:app-ready', detectPhantom);
  }, []);

  const handleConnect = () => {
    connectWallet('solana');
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      {!hasSolanaConnected && (
        <>
          {!isPhantomAvailable && (
            <a
              href={PHANTOM_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '14px', color: 'var(--ds-accent, #14f195)' }}
            >
              Install Phantom
            </a>
          )}
          <button
            type="button"
            onClick={handleConnect}
            aria-label="Connect SOL wallet"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--ds-accent, #14f195)',
              color: '#000',
              fontWeight: 500,
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            <SolTokenIcon symbol="SOL" size={20} />
            Connect SOL Wallet
          </button>
        </>
      )}
    </div>
  );
}
