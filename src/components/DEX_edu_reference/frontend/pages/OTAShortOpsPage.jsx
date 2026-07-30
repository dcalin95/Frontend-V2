/**
 * Futures Ops page (Short + Long): unified operator panel.
 * Tab SHORT = ShortOpsPanel (live Binance Futures, gate, probe).
 * Tab LONG  = LongOpsPanel (paper v1).
 * The sidebar button stays "Futures Ops" at /dex-edu/ota/short-ops.
 * URL tab: ?tab=long for LONG; missing or anything else = SHORT (shareable / bookmarkable).
 * Next to switcher: public Binance topLongShortAccountRatio strip (BTC, 1h) for operator context.
 */

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Info, Construction, ChevronDown } from 'lucide-react';
import ShortOpsPanel from '../components/ai-trading/ShortOpsPanel';
import LongOpsPanel from '../components/ai-trading/LongOpsPanel';
import OtaBscAutoStatusBanner from '../components/ai-trading/OtaBscAutoStatusBanner';
import OtaFuturesAgentTraceStrip from '../components/ai-trading/OtaFuturesAgentTraceStrip';
import OtaFuturesBtcTrendHeaderCard from '../components/ai-trading/OtaFuturesBtcTrendHeaderCard';
import OtaBtcMoveAlertSettings from '../components/ai-trading/OtaBtcMoveAlertSettings';
import FuturesOpsModeSwitcher from '../components/ai-trading/FuturesOpsModeSwitcher';
import FuturesOpsBinanceContextStrip from '../components/ai-trading/FuturesOpsBinanceContextStrip';
import FuturesOpsOperatorQuickNav from '../components/ai-trading/FuturesOpsOperatorQuickNav';
import InvestigatorWorkspace from '../components/ai-trading/InvestigatorWorkspace';
import { useWallet } from '../hooks/useWallet';
import '../styles/components/trade-cost-analytics.css';

const INFO_STORAGE_KEY = 'ota_short_ops_info_open';

export default function OTAShortOpsPage() {
  const { walletAddress } = useWallet();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isInvestigatorRoute, setIsInvestigatorRoute] = useState(() => window.location.hash === '#/investigator');
  /** Active tab from URL: ?tab=long or default SHORT without param. */
  const activeTab = useMemo(
    () => (searchParams.get('tab') === 'long' ? 'long' : 'short'),
    [searchParams],
  );

  const switchTab = useCallback(
    (tab) => {
      if (tab === 'long') {
        setSearchParams({ tab: 'long' }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    },
    [setSearchParams],
  );

  const [infoOpen, setInfoOpen] = useState(() => {
    try { return localStorage.getItem(INFO_STORAGE_KEY) !== 'false'; } catch { return true; }
  });
  const [holdBlockAvailable, setHoldBlockAvailable] = useState(false);
  const reportHoldAvailability = useCallback((v) => setHoldBlockAvailable(Boolean(v)), []);
  const autoCloseRef = useRef(null);

  const toggleInfo = () => {
    if (infoOpen) {
      clearTimeout(autoCloseRef.current);
      setInfoOpen(false);
      localStorage.setItem(INFO_STORAGE_KEY, 'false');
    } else {
      setInfoOpen(true);
      localStorage.setItem(INFO_STORAGE_KEY, 'true');
      clearTimeout(autoCloseRef.current);
      autoCloseRef.current = setTimeout(() => {
        setInfoOpen(false);
        localStorage.setItem(INFO_STORAGE_KEY, 'false');
      }, 8000);
    }
  };

  useEffect(() => () => clearTimeout(autoCloseRef.current), []);

  useEffect(() => {
    const syncHashRoute = () => setIsInvestigatorRoute(window.location.hash === '#/investigator');
    window.addEventListener('hashchange', syncHashRoute);
    return () => window.removeEventListener('hashchange', syncHashRoute);
  }, []);

  useEffect(() => {
    setHoldBlockAvailable(false);
  }, [activeTab]);

  const leaveInvestigator = useCallback(() => {
    window.history.pushState(null, '', `${window.location.pathname}${window.location.search}`);
    setIsInvestigatorRoute(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  /** Deep link: ?tab=...#anchor after the active panel mounts. */
  useLayoutEffect(() => {
    const raw = window.location.hash?.replace(/^#/, '')?.trim() || '';
    if (!raw) return;
    const el = document.getElementById(raw);
    if (el) {
      el.scrollIntoView({ block: 'start', behavior: 'auto' });
    }
  }, [activeTab]);

  if (isInvestigatorRoute) {
    return <InvestigatorWorkspace mode="standalone" scopeKey={walletAddress || 'anon'} onBack={leaveInvestigator} />;
  }

  return (
    <div className="ota-short-ops-page">

      {/* ── Header ── */}
      <div className="trade-cost-analytics-header">
        <h1>
          <Construction size={24} aria-hidden />
          Futures Ops
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <p className="subtitle" style={{ margin: 0 }}>
            Operator panel - futures positions on <strong>Binance Futures</strong>.
          </p>
          <button
            type="button"
            onClick={toggleInfo}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 12, padding: '3px 10px',
              background: infoOpen ? '#1e293b' : '#0f172a',
              border: '1px solid #334155', borderRadius: 6,
              color: '#60a5fa', cursor: 'pointer', fontWeight: 600,
              transition: 'background 0.2s',
            }}
          >
            <Info size={12} />
            How to use
            <ChevronDown
              size={12}
              style={{ transform: infoOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }}
            />
          </button>
        </div>
        <div className="header-actions">
          <Link to="/dex-edu/ota" className="link-back">OTA AI</Link>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <OtaBscAutoStatusBanner />
      </div>

      {/* ── Info box ── */}
      {infoOpen && (
        <div
          className="ota-short-ops-notice ota-short-ops-notice--combined"
          role="status"
          aria-live="polite"
          style={{ animation: 'fadeInDown 0.2s ease' }}
        >
          <div className="ota-short-ops-notice-row ota-short-ops-notice-row--warn">
            <Construction size={18} aria-hidden />
            <div>
              <strong>Current status</strong>
              <p className="ota-short-ops-notice-p">
                <strong>SHORT</strong> and <strong>LONG</strong> run live on Binance Futures; positions are real.
              </p>
            </div>
          </div>
          <div className="ota-short-ops-notice-split" aria-hidden="true" />
          <div className="ota-short-ops-notice-row ota-short-ops-notice-row--accent">
            <Info size={16} aria-hidden />
            <div>
              <strong>How to use this page</strong>
              <ul className="ota-short-ops-notice-ul">
                <li>Use the <strong>SHORT</strong> / <strong>LONG</strong> tabs to switch between the two position types.</li>
                <li><strong>Live gate</strong> is the first thing to check. If it is OFF, no new position opens.</li>
                <li><strong>Open positions</strong> shows active positions with live PnL, TP/SL, and funding rate.</li>
                <li><strong>Venue probes</strong> tests mark price, margin mode, and reconciliation.</li>
                <li><strong>Manual close / kill reset</strong> are emergency actions.</li>
                <li><strong>Quick jump</strong> (Positions / Hold / Manual) stays sticky on scroll; keys <strong>1</strong> <strong>2</strong> <strong>3</strong> or <strong>g</strong> then <strong>p</strong> / <strong>h</strong> / <strong>m</strong> work outside text fields. Hold activates after <strong>live status</strong>.</li>
              </ul>
              <p style={{ fontSize: 11, color: '#475569', margin: '6px 0 0' }}>
                Closes automatically in 8 seconds.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Forced vertical stack: card row (grid), then full-width SHORT/LONG. */}
      <div className="futures-ops-header-stack">
        {/* Row 1: three equal columns (1fr x 3), same row height, no ResizeObserver. */}
        <div className="futures-ops-header-cards-row">
          <div className="futures-ops-header-card-slot futures-ops-header-card-slot--btc">
            <OtaFuturesBtcTrendHeaderCard />
          </div>
          <div className="futures-ops-header-card-slot futures-ops-header-trace-wrap">
            <OtaFuturesAgentTraceStrip
              userId={walletAddress}
              futuresLane={activeTab === 'long' ? 'long' : 'short'}
            />
          </div>
          <div className="futures-ops-header-card-slot futures-ops-header-card-slot--alerts">
            <OtaBtcMoveAlertSettings compactHeaderRow />
          </div>
        </div>

        {/* Row 2: SHORT LIVE + LONG LIVE as a centered pair, not spread across viewport. */}
        <div className="futures-ops-mode-switcher-row">
          <div className="futures-ops-mode-switcher-cluster">
            <FuturesOpsModeSwitcher activeTab={activeTab} onSelect={switchTab} />
            <FuturesOpsBinanceContextStrip />
            <FuturesOpsOperatorQuickNav activeTab={activeTab} holdBlockAvailable={holdBlockAvailable} />
          </div>
        </div>
      </div>

      {/* Active tab content */}
      {activeTab === 'short' && <ShortOpsPanel onHoldBlockAvailabilityChange={reportHoldAvailability} />}
      {activeTab === 'long' && <LongOpsPanel onHoldBlockAvailabilityChange={reportHoldAvailability} />}

    </div>
  );
}
