/**
 * SolSwapPage – Pagină Swap Solana via Jupiter.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import SwapPanelSol from '../../sol/SwapPanel.sol';
import { ArrowLeft, BarChart2 } from 'lucide-react';
import OtaBscAutoStatusBanner from '../components/ai-trading/OtaBscAutoStatusBanner';

export default function SolSwapPage() {
  const { connected } = useWallet();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 32, paddingBottom: 40 }}>
      <div style={{ width: '100%', maxWidth: 440, marginBottom: 12, padding: '0 8px', boxSizing: 'border-box' }}>
        <OtaBscAutoStatusBanner variant="crossChain" />
      </div>

      {/* Header */}
      <div style={{ width: '100%', maxWidth: 440, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>◎</span>
          <span style={{ fontWeight: 700, fontSize: 18 }}>SOL Swap</span>
          <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(20,241,149,0.15)', color: '#14f195', padding: '2px 8px', borderRadius: 10, border: '1px solid rgba(20,241,149,0.3)' }}>Live</span>
        </div>
        <nav style={{ display: 'flex', gap: 8, fontSize: 13 }}>
          <Link to="/dex-edu/sol/trade" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--ds-border-color,#27272a)', color: 'var(--ds-text-secondary)', textDecoration: 'none' }}>
            <BarChart2 size={14} /> Trade
          </Link>
          <Link to="/dex-edu/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--ds-border-color,#27272a)', color: 'var(--ds-text-secondary)', textDecoration: 'none' }}>
            <ArrowLeft size={14} /> Dashboard
          </Link>
        </nav>
      </div>

      {/* Wallet banner */}
      {!connected && (
        <div style={{ width: '100%', maxWidth: 440, marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(20,241,149,0.06)', border: '1px solid rgba(20,241,149,0.2)', fontSize: 13, color: 'var(--ds-text-secondary)', textAlign: 'center' }}>
          Connect Phantom / Backpack wallet to swap
        </div>
      )}

      {/* Card principal */}
      <div style={{ width: '100%', maxWidth: 440, background: 'var(--ds-bg-surface,#18181b)', border: '1px solid var(--ds-border-color,#27272a)', borderRadius: 16, padding: '20px 20px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
        <SwapPanelSol />
      </div>

      {/* Footer */}
      <div style={{ marginTop: 16, fontSize: 11, color: 'var(--ds-text-secondary)', opacity: 0.5, textAlign: 'center' }}>
        Best price routing via Jupiter · Solana mainnet
      </div>
    </div>
  );
}
