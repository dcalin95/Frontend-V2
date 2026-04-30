/**
 * OTAStxPage – OTA on Stacks (manual-assisted micro-profit).
 * Shared price context: OtaStxPairProvider. No BSC policy banner.
 * @module OTAStxPage
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowLeft, ArrowRightLeft } from 'lucide-react';
import ErrorBoundary from '../../common/ErrorBoundary';
import OtaStxLiveStrip from '../../stx/OtaStxLiveStrip';
import OtaStxLiveWindow from '../../stx/OtaStxLiveWindow';
import OtaStxRecentExecutions from '../../stx/OtaStxRecentExecutions';
import OtaStxMicroProfitPanel from '../../stx/OtaStxMicroProfitPanel';
import OtaStxProofBlock from '../../stx/OtaStxProofBlock';
import OtaStxManualOnlyBanner from '../../stx/components/OtaStxManualOnlyBanner';
import TradingViewChart from '../components/common/TradingViewChart';
import { OtaStxPairProvider, useOtaStxPair } from '../../stx/context/OtaStxPairContext';
import '../styles/pages.css';
import '../styles/components/ota-page.css';
import '../styles/components/ota-sei-live-strip.css';

function OTAStxPageInner() {
  const { pair, setPair, referenceChartSymbol } = useOtaStxPair();

  return (
    <div className="dashboard-page ota-page ota-stx-page">
      <main className="ota-page-main" aria-labelledby="ota-stx-title">
        <header className="ota-page-header-block">
          <h2 className="ota-page-title ota-title-row" id="ota-stx-title">
            <Activity size={24} aria-hidden />
            OTA on Stacks
            <span className="ota-page-badge">Micro-Profit (manual)</span>
          </h2>
          <p className="ota-page-desc">
            Assisted micro-profit on Stacks: quotes from the API, round-trips when you sign. There is no background
            auto-trading worker for STX — use Run round-trip manually.
          </p>
        </header>

        <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto 12px', padding: '0 16px', boxSizing: 'border-box' }}>
          <OtaStxManualOnlyBanner />
        </div>

        <OtaStxLiveStrip pair={pair} />
        <OtaStxProofBlock />
        <div className="ota-sei-content">
          <div className="ota-sei-three-windows-wrap">
            <div className="ota-sei-three-cards">
              <div className="ota-sei-chart-column">
                <section className="ota-sei-window ota-sei-chart" aria-label="Chart">
                  <div className="ota-sei-window-body">
                    <ErrorBoundary fallback={<div className="ota-sei-chart-fallback">Chart failed to load.</div>}>
                      <TradingViewChart symbol={referenceChartSymbol} interval="60" theme="dark" height={340} autosize />
                    </ErrorBoundary>
                  </div>
                </section>
                <OtaStxRecentExecutions />
                <OtaStxLiveWindow pair={pair} variant="under-chart" />
              </div>
              <OtaStxMicroProfitPanel splitLayout pair={pair} setPair={setPair} />
            </div>
          </div>
        </div>
        <nav className="ota-page-back" aria-label="Back to STX Trade">
          <Link to="/dex-edu/stx/trade" className="ota-page-help-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '14px' }}>
            <ArrowLeft size={18} />
            <span>Back</span>
          </Link>
        </nav>
        <nav className="ota-page-help" aria-label="Navigate to STX Trade">
          <Link to="/dex-edu/stx/trade" className="ota-page-help-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
            <ArrowRightLeft size={16} />
            <span>STX Trade (chart + order book)</span>
          </Link>
        </nav>
      </main>
    </div>
  );
}

export default function OTAStxPage() {
  return (
    <OtaStxPairProvider>
      <OTAStxPageInner />
    </OtaStxPairProvider>
  );
}
