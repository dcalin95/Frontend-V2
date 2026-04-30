/**
 * OTASeiPage – OTA AI on SEI dedicated page.
 * SSOT pair: OtaSeiPairProvider (DEFAULT SEI/USDC).
 * @module OTASeiPage
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowLeft, ArrowRightLeft } from 'lucide-react';
import ErrorBoundary from '../../common/ErrorBoundary';
import OtaSeiLiveStrip from '../../sei/OtaSeiLiveStrip';
import OtaSeiLiveWindow from '../../sei/OtaSeiLiveWindow';
import OtaSeiOpenOrders from '../../sei/OtaSeiOpenOrders';
import OtaSeiMicroProfitPanel from '../../sei/OtaSeiMicroProfitPanel';
import OtaSeiProofBlock from '../../sei/OtaSeiProofBlock';
import OtaSeiLpPanel from '../../sei/OtaSeiLpPanel';
import GridTradingPanel from '../../common/GridTradingPanel';
import TradingViewChart from '../components/common/TradingViewChart';
import OtaBscAutoStatusBanner from '../components/ai-trading/OtaBscAutoStatusBanner';
import { OtaSeiPairProvider, useOtaSeiPair } from '../../sei/context/OtaSeiPairContext';
import { useDexAuth } from '../context/DexAuthContext';
import '../styles/pages.css';
import '../styles/components/ota-page.css';
import '../styles/components/ota-sei-live-strip.css';
import '../styles/components/grid-trading-panel.css';

function OTASeiPageInner() {
  const { pair, setPair, referenceChartSymbol } = useOtaSeiPair();
  const { user } = useDexAuth();
  const userId = user?.id ?? user?.walletAddress ?? null;

  return (
    <div className="dashboard-page ota-page ota-sei-page">
      <main className="ota-page-main" aria-labelledby="ota-sei-title">
        <header className="ota-page-header-block">
          <h2 className="ota-page-title ota-title-row" id="ota-sei-title">
            <Activity size={24} aria-hidden />
            OTA AI on SEI
            <span className="ota-page-badge">Micro-Profit</span>
          </h2>
          <p className="ota-page-desc">
            OTA AI (OpenAI) on SEI: micro-profit strategy — small profits per round-trip, just above gas cost.
            Connect your SEI wallet in the header (Keplr / Compass). <strong>USDC</strong> is the recommended quote for manual execution.
            Manual round-trips use your selected pair; pool-vs-CEX context is <strong>SEI/ATOM auxiliary</strong> (not your pair selector).
            <strong> SEI Auto</strong> depends on server readiness (worker running, bot wallet configured, not manual-only); check the Auto section for status — enabling Auto in the UI does not by itself execute trades.
          </p>
        </header>

        <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto 12px', padding: '0 16px', boxSizing: 'border-box' }}>
          <OtaBscAutoStatusBanner variant="crossChain" />
        </div>

        <OtaSeiLiveStrip />
        <OtaSeiProofBlock />

        <div className="ota-sei-content">
          <div className="ota-sei-three-windows-wrap">
            <div className="ota-sei-three-cards">
              <div className="ota-sei-chart-column">
                <section className="ota-sei-window ota-sei-chart" aria-label="Chart reference (CEX)">
                  <div className="ota-sei-window-body">
                    <ErrorBoundary fallback={<div className="ota-sei-chart-fallback">Chart failed to load.</div>}>
                      <TradingViewChart symbol={referenceChartSymbol} interval="60" theme="dark" height={340} autosize />
                    </ErrorBoundary>
                  </div>
                </section>
                <OtaSeiOpenOrders />
                <OtaSeiLiveWindow />
                <ErrorBoundary fallback={null}>
                  <OtaSeiLpPanel />
                </ErrorBoundary>
              </div>
              <div className="ota-sei-side-grid">
                <OtaSeiMicroProfitPanel splitLayout pair={pair} setPair={setPair} />
                <div className="ota-sei-grid-trading-slot">
                  <ErrorBoundary fallback={null}>
                    <GridTradingPanel chain="sei" userId={userId} syncPagePair={pair} />
                  </ErrorBoundary>
                </div>
              </div>
            </div>
          </div>
        </div>

        <nav className="ota-page-back" aria-label="Back to SEI Trade">
          <Link to="/dex-edu/sei/trade" className="ota-page-help-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '14px' }}>
            <ArrowLeft size={18} />
            <span>Back</span>
          </Link>
        </nav>
        <nav className="ota-page-help" aria-label="Navigate to SEI Trade">
          <Link to="/dex-edu/sei/trade" className="ota-page-help-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
            <ArrowRightLeft size={16} />
            <span>SEI Trade (chart + order book)</span>
          </Link>
        </nav>
      </main>
    </div>
  );
}

export default function OTASeiPage() {
  return (
    <OtaSeiPairProvider>
      <OTASeiPageInner />
    </OtaSeiPairProvider>
  );
}
