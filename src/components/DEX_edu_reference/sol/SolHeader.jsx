/**
 * SolHeader - Header for the SOL Trade area. Shows Solana wallet (Connect / address + disconnect).
 * Uses WalletContext (connectWallet('solana'), walletType, walletAddress).
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wallet, LogOut } from 'lucide-react';
import { useWallet } from '../context/WalletContext.jsx';
import { useSolPair } from './context/SolPairContext';
import TokenSelectorSol from './TokenSelector.sol';
import WalletConnectorSol from './WalletConnector.sol';
import SolTokenIcon from './SolTokenIcon';

const SOL_ACCENT = 'rgba(20, 241, 149, 0.9)';
const SOL_LOGO_SIZE = 28;

export default function SolHeader() {
  const { solanaWalletAddress, disconnectSolanaWallet } = useWallet();
  const { pair, setPair } = useSolPair();
  const location = useLocation();
  const base = '/dex-edu/sol';
  const isTradePage = location.pathname === `${base}/trade`;
  const isSolanaConnected = !!solanaWalletAddress;
  const shortAddress = solanaWalletAddress && solanaWalletAddress.length >= 10
    ? `${solanaWalletAddress.slice(0, 4)}...${solanaWalletAddress.slice(-4)}`
    : solanaWalletAddress;

  const walletBlock = (
    <div className={`chain-header-wallet${!isSolanaConnected ? ' chain-header-wallet--not-connected' : ''}`} style={{ marginRight: '32px' }} aria-label="SOL wallet status">
      {isSolanaConnected ? (
        <>
          <Wallet size={14} style={{ color: 'var(--ds-success)', flexShrink: 0 }} aria-hidden />
          <span style={{ fontWeight: 600, fontSize: '12px' }}>SOL</span>
          <span style={{ fontSize: '12px', fontFamily: 'ui-monospace, monospace' }} title="Address">{shortAddress}</span>
          <button type="button" onClick={() => disconnectSolanaWallet?.()} style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 6px', border: '1px solid var(--ds-border-color)', borderRadius: '6px', background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: '12px' }} aria-label="Disconnect SOL wallet">
            <LogOut size={12} />
          </button>
        </>
      ) : (
        <>
          <span style={{ fontWeight: 600, fontSize: '12px' }}>SOL</span>
          <span style={{ fontSize: '11px', color: 'var(--ds-text-secondary)' }}>not connected</span>
          <WalletConnectorSol />
        </>
      )}
    </div>
  );

  return (
    <header
      role="banner"
      className="sol-header"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        borderBottom: `1px solid ${SOL_ACCENT.replace('0.9', '0.25')}`,
        background: 'linear-gradient(135deg, rgba(20, 241, 149, 0.08) 0%, rgba(16, 185, 129, 0.06) 100%)',
        color: 'var(--ds-text-primary, #e2e8f0)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        {walletBlock}
        <SolTokenIcon symbol="SOL" size={SOL_LOGO_SIZE} />
        <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>SOL Trade</span>
        {isTradePage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} aria-label="Select pair">
            <TokenSelectorSol value={pair} onChange={(v) => setPair(v)} label="Pair" variant="pair" />
          </div>
        )}
        <nav style={{ display: 'flex', gap: '8px', marginLeft: isTradePage ? '8px' : '16px' }}>
          <Link
            to={`${base}/trade`}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              textDecoration: 'none',
              color: location.pathname === `${base}/trade` ? 'var(--ds-accent, #14f195)' : 'inherit',
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
              color: location.pathname === `${base}/swap` ? 'var(--ds-accent, #14f195)' : 'inherit',
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
