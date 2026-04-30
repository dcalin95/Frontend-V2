/**
 * SeiSwapPage – Swap pe SEI: Astroport/Skip (Cosmos) sau Symphony (agregator, mai multă lichiditate).
 * @see docs/SEI_DEX_AND_AGGREGATORS.md
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSeiWallet } from '../../sei/context/SeiWalletContext';
import SwapPanelSei from '../../sei/SwapPanel.sei';
import SymphonySwapPanel from '../../sei/SymphonySwapPanel';
import { ArrowLeft, LayoutDashboard, Zap } from 'lucide-react';
import OtaBscAutoStatusBanner from '../components/ai-trading/OtaBscAutoStatusBanner';

// Symphony embed (SEI official aggregator) – token addresses Sei mainnet
const SYMPHONY_EMBED_BASE = 'https://symph.ag/embed';
const SYMPHONY_TOKEN_WSEI = '0xE30feDd158A2e3b13e9badaeABaFc5516e95e8C7';
const SYMPHONY_TOKEN_USDC = '0xe15fC38F6D8c56aF07bbCBe3BAf5708A2Bf42392';

export default function SeiSwapPage() {
  const { isConnected } = useSeiWallet();
  const [swapSource, setSwapSource] = useState('astroport'); // 'astroport' | 'symphony'

  const symphonyEmbedUrl = `${SYMPHONY_EMBED_BASE}?tokenIn=${SYMPHONY_TOKEN_WSEI}&tokenOut=${SYMPHONY_TOKEN_USDC}&theme=dark&notifications=true`;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 40, paddingBottom: 40 }}>
      <div style={{ width: '100%', maxWidth: 420, marginBottom: 12, padding: '0 8px', boxSizing: 'border-box' }}>
        <OtaBscAutoStatusBanner variant="crossChain" />
      </div>
      {/* Card swap – header + toggle sticky so top stays visible when scrolling */}
      <div style={{
        width: '100%',
        maxWidth: 420,
        maxHeight: '90vh',
        background: 'var(--ds-bg-surface, #18181b)',
        border: '1px solid var(--ds-border-color, #27272a)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header + toggle: un singur bloc sticky ca „partea de sus” să rămână vizibilă la scroll */}
        <div style={{
          flexShrink: 0,
          background: 'var(--ds-bg-surface, #18181b)',
          position: 'sticky',
          top: 0,
          zIndex: 2,
          borderBottom: '1px solid var(--ds-border-color, #27272a)',
        }}>
          <div style={{ padding: '18px 24px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>SEI Swap</span>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)', fontWeight: 600 }}>
                Live ●
              </span>
            </div>
            <nav style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <Link to="/dex-edu/sei/trade" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--ds-border-color,#27272a)', background: 'transparent', color: 'var(--ds-text-secondary)', textDecoration: 'none', fontSize: 12 }}>
                <ArrowLeft size={13} /> Trade
              </Link>
              <Link to="/dex-edu/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--ds-border-color,#27272a)', background: 'transparent', color: 'var(--ds-text-secondary)', textDecoration: 'none', fontSize: 12 }}>
                <LayoutDashboard size={13} /> Dashboard
              </Link>
            </nav>
          </div>
          <div style={{ padding: '0 24px 12px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setSwapSource('astroport')}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: `1px solid ${swapSource === 'astroport' ? 'rgba(34,197,94,0.5)' : 'var(--ds-border-color,#27272a)'}`,
              background: swapSource === 'astroport' ? 'rgba(34,197,94,0.1)' : 'transparent',
              color: swapSource === 'astroport' ? '#22c55e' : 'var(--ds-text-secondary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Astroport / Skip
          </button>
          <button
            type="button"
            onClick={() => setSwapSource('symphony')}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: `1px solid ${swapSource === 'symphony' ? 'rgba(99,102,241,0.5)' : 'var(--ds-border-color,#27272a)'}`,
              background: swapSource === 'symphony' ? 'rgba(99,102,241,0.1)' : 'transparent',
              color: swapSource === 'symphony' ? '#818cf8' : 'var(--ds-text-secondary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Zap size={12} /> Symphony (more liquidity)
          </button>
          </div>
        </div>

        {/* Content area – scrollable so header/toggle stay visible */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {/* Banner: Astroport = Compass/Keplr (header). Symphony = MetaMask/Trust (in panel). */}
        {swapSource === 'astroport' && !isConnected && (
          <div style={{ margin: '16px 24px 0', padding: '10px 14px', borderRadius: 8, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', color: 'var(--ds-text-secondary)', fontSize: 13 }}>
            <strong>Astroport / Skip</strong> use <strong>Compass or Keplr</strong> (SEI Cosmos). Connect in the header above.
          </div>
        )}
        {swapSource === 'symphony' && (
          <div style={{ margin: '16px 24px 0', padding: '10px 14px', borderRadius: 8, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', color: 'var(--ds-text-secondary)', fontSize: 13 }}>
            <strong>Symphony</strong> supports <strong>Keplr on Sei</strong> in the embed below. The form above uses <strong>Sei EVM</strong> (MetaMask/Trust); connect there for the form, or use the embed with Keplr.
          </div>
        )}

        {/* Panou swap: Astroport/Skip sau Symphony (formular + embed) */}
        <div style={{ padding: swapSource === 'symphony' ? '12px 24px 24px' : '20px 24px 24px' }}>
          {swapSource === 'astroport' && <SwapPanelSei />}
          {swapSource === 'symphony' && (
            <>
              <div style={{ marginBottom: 16 }}>
                <SymphonySwapPanel />
              </div>
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--ds-border-color,#27272a)' }}>
                <p style={{ fontSize: 12, color: 'var(--ds-text-tertiary)', marginBottom: 4 }}>Symphony embed: connect <strong>Keplr on Sei</strong> or use an EVM wallet here.</p>
                <p style={{ fontSize: 11, color: 'var(--ds-text-tertiary)', marginBottom: 8 }}>If you see a <strong>0x…</strong> address in the embed, it is either your MetaMask/Trust (EVM) or the same account as Keplr in EVM form on Sei.</p>
                <div style={{ minHeight: 650, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--ds-border-color,#27272a)' }}>
                  <iframe
                    src={symphonyEmbedUrl}
                    title="Symphony Swap (Sei)"
                    style={{ width: '100%', minHeight: 650, border: 'none' }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
        </div>
      </div>

      {/* Info footer */}
      <p style={{ marginTop: 16, fontSize: 12, color: 'var(--ds-text-secondary)', textAlign: 'center', opacity: 0.6 }}>
        {swapSource === 'astroport'
          ? 'Astroport · Skip · SEI (Cosmos, Compass/Keplr)'
          : 'Symphony (symph.ag) · form: Sei EVM · embed: Keplr on Sei supported'}
      </p>
    </div>
  );
}
