/**
 * Unified Futures Ops page: SHORT ▼ / LONG ▲ tabs.
 * Accessible from the sidebar at /dex-edu/ota/futures.
 */

import React, { useState } from 'react';
import ShortOpsPanel from '../components/ai-trading/ShortOpsPanel';
import LongOpsPanel from '../components/ai-trading/LongOpsPanel';
import OtaBscAutoStatusBanner from '../components/ai-trading/OtaBscAutoStatusBanner';
import OtaFuturesAgentTraceStrip from '../components/ai-trading/OtaFuturesAgentTraceStrip';
import { useWallet } from '../hooks/useWallet';
import '../styles/components/trade-cost-analytics.css';

const TAB_SHORT = 'short';
const TAB_LONG = 'long';

const TAB_STORAGE_KEY = 'ota_futures_active_tab';

function getInitialTab() {
  try { return localStorage.getItem(TAB_STORAGE_KEY) || TAB_SHORT; } catch { return TAB_SHORT; }
}

export default function FuturesOpsPage() {
  const { walletAddress } = useWallet();
  const [activeTab, setActiveTab] = useState(getInitialTab);
  /** After first tab visit, the panel stays mounted and hidden with CSS; avoids full unmount, state loss, and flash when switching SHORT↔LONG. */
  const [shortEverMounted, setShortEverMounted] = useState(() => getInitialTab() === TAB_SHORT);
  const [longEverMounted, setLongEverMounted] = useState(() => getInitialTab() === TAB_LONG);

  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab === TAB_SHORT) setShortEverMounted(true);
    if (tab === TAB_LONG) setLongEverMounted(true);
    try { localStorage.setItem(TAB_STORAGE_KEY, tab); } catch { /* ignore */ }
  };

  return (
    <div className="ota-short-ops-page" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header tabs */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        borderBottom: '1px solid #1e293b',
        background: '#0a0f1c',
        padding: '0 16px',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        {/* Title */}
        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginRight: 16, padding: '10px 0', textTransform: 'uppercase', letterSpacing: 1 }}>
          ⚡ Futures Ops
        </div>

        {/* Tab SHORT */}
        <button
          onClick={() => switchTab(TAB_SHORT)}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === TAB_SHORT ? '2px solid #f87171' : '2px solid transparent',
            color: activeTab === TAB_SHORT ? '#f87171' : '#64748b',
            cursor: 'pointer',
            fontWeight: activeTab === TAB_SHORT ? 700 : 400,
            fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.15s',
          }}
        >
          📉 SHORT ▼
        </button>

        {/* Tab LONG */}
        <button
          onClick={() => switchTab(TAB_LONG)}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === TAB_LONG ? '2px solid #4ade80' : '2px solid transparent',
            color: activeTab === TAB_LONG ? '#4ade80' : '#64748b',
            cursor: 'pointer',
            fontWeight: activeTab === TAB_LONG ? 700 : 400,
            fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.15s',
          }}
        >
          📈 LONG ▲
          <span style={{ fontSize: 8, background: '#1e3a1e', color: '#4ade80', padding: '1px 4px', borderRadius: 3, fontWeight: 700 }}>
            LIVE
          </span>
        </button>
      </div>

      <div style={{ padding: '8px 16px 0' }}>
        <OtaBscAutoStatusBanner />
      </div>

      <div style={{ padding: '0 16px 12px' }} className="futures-ops-page-trace-wrap">
        <OtaFuturesAgentTraceStrip
          userId={walletAddress}
          futuresLane={activeTab === TAB_LONG ? 'long' : 'short'}
        />
      </div>

      {/* Content: panels stay mounted after first opening (display:none while inactive) so they do not restart on every tab. */}
      <div style={{ padding: '0' }}>
        {shortEverMounted ? (
          <div style={{ display: activeTab === TAB_SHORT ? 'block' : 'none' }} aria-hidden={activeTab !== TAB_SHORT}>
            <ShortOpsPanel />
          </div>
        ) : null}
        {longEverMounted ? (
          <div style={{ display: activeTab === TAB_LONG ? 'block' : 'none' }} aria-hidden={activeTab !== TAB_LONG}>
            <LongOpsPanel />
          </div>
        ) : null}
      </div>
    </div>
  );
}
