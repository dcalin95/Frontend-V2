/**
 * StxHeader – Header pentru zona STX Trade. Afișează wallet Stacks (Connect / adresă + disconnect).
 * Nu folosește wagmi/ethers.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layers, Wallet, LogOut } from 'lucide-react';
import { useStxWallet } from './context/StxWalletContext';
import { useStxPair } from './context/StxPairContext';
import TokenSelectorStx from './TokenSelector.stx';
import WalletConnectorStx from './WalletConnector.stx';

export default function StxHeader() {
  const { isConnected, shortAddress, disconnect } = useStxWallet();
  const { pair, setPair } = useStxPair();
  const location = useLocation();
  const base = '/dex-edu/stx';
  const isTradePage = location.pathname === `${base}/trade`;

  const walletBlock = (
    <div className={`chain-header-wallet${!isConnected ? ' chain-header-wallet--not-connected' : ''}`} style={{ marginRight: '32px' }} aria-label="STX wallet status">
      {isConnected ? (
        <>
          <Wallet size={14} style={{ color: 'var(--ds-success)', flexShrink: 0 }} aria-hidden />
          <span style={{ fontWeight: 600, fontSize: '12px' }}>STX</span>
          <span style={{ fontSize: '12px', fontFamily: 'ui-monospace, monospace' }} title="Address">{shortAddress}</span>
          <button type="button" onClick={disconnect} style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 6px', border: '1px solid var(--ds-border-color)', borderRadius: '6px', background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: '12px' }} aria-label="Disconnect STX wallet">
            <LogOut size={12} />
          </button>
        </>
      ) : (
        <>
          <span style={{ fontWeight: 600, fontSize: '12px' }}>STX</span>
          <span style={{ fontSize: '11px', color: 'var(--ds-text-secondary)' }}>not connected</span>
          <WalletConnectorStx />
        </>
      )}
    </div>
  );

  return (
    <header className="stx-header" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 20px',
      borderBottom: '1px solid rgba(247, 147, 26, 0.25)',
      background: 'linear-gradient(135deg, rgba(247, 147, 26, 0.08) 0%, rgba(243, 115, 41, 0.06) 100%)',
      color: 'var(--ds-text-primary, #1e293b)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        {walletBlock}
        <Layers size={24} aria-hidden="true" />
        <span style={{ fontWeight: 600 }}>STX Trade</span>
        {isTradePage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} aria-label="Select pair">
            <TokenSelectorStx value={pair} onChange={(v) => setPair(v)} label="Pair" variant="pair" />
          </div>
        )}
        <nav style={{ display: 'flex', gap: '8px', marginLeft: isTradePage ? '8px' : '16px' }}>
          <Link
            to={`${base}/trade`}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              textDecoration: 'none',
              color: location.pathname === `${base}/trade` ? 'var(--ds-accent, #f7931a)' : 'inherit',
              fontWeight: location.pathname === `${base}/trade` ? 600 : 400,
            }}
            aria-current={location.pathname === `${base}/trade` ? 'page' : undefined}
          >
            Trade
          </Link>
          <Link
            to={`${base}/swap`}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              textDecoration: 'none',
              color: location.pathname === `${base}/swap` ? 'var(--ds-accent, #f7931a)' : 'inherit',
              fontWeight: location.pathname === `${base}/swap` ? 600 : 400,
            }}
            aria-current={location.pathname === `${base}/swap` ? 'page' : undefined}
          >
            Swap
          </Link>
        </nav>
      </div>
    </header>
  );
}
