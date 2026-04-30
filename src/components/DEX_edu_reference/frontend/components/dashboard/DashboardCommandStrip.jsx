/**
 * Antet compact — refresh + link-uri; KPI-urile platformă sunt în DashboardPlatformStatusRow.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  RefreshCw,
  Sparkles,
  TrendingUp,
  Radio,
  Wallet,
  BarChart3,
  ArrowLeftRight,
} from 'lucide-react';

/** @param {{ aggregate?: object, onRefresh: () => void, refreshBusy?: boolean, pollRefreshing?: boolean }} props */
export default function DashboardCommandStrip({ aggregate, onRefresh, refreshBusy = false, pollRefreshing = false }) {
  const { loading, isInitialLoading, otaHealth } = aggregate || {};
  const initialLoad = isInitialLoading ?? loading;
  const spinRefreshIcon = Boolean(refreshBusy || pollRefreshing);

  const healthOk =
    otaHealth &&
    (otaHealth.ok === true ||
      otaHealth.status === 'ok' ||
      otaHealth.healthy === true ||
      (typeof otaHealth === 'object' && !otaHealth.error));

  return (
    <section className="dash-command" aria-label="Command">
      <div className="dash-command__header">
        <div className="dash-command__intro">
          <p className="dash-command__eyebrow">BITS hub</p>
          <h1 className="dash-command__title">Dashboard</h1>
        </div>
        <div className="dash-command__toolbar">
          <div className="dash-command__live">
            <span
              className={`dash-command__live-dot ${healthOk ? 'dash-command__live-dot--ok' : ''}`}
              title="OTA health endpoint"
              aria-hidden
            />
            <span>Live snapshot</span>
          </div>
          <button
            type="button"
            className="dash-command__refresh"
            onClick={onRefresh}
            disabled={initialLoad || refreshBusy}
            title="Refresh dashboard data"
          >
            <RefreshCw size={16} className={spinRefreshIcon ? 'dash-command__spin' : ''} aria-hidden />
            Refresh
          </button>
        </div>
      </div>

      <nav className="dash-command__actions dash-command__actions--utility" aria-label="Primary product shortcuts">
        <Link to="/dex-edu/ota">
          <Sparkles className="dash-command__utility-ico" size={15} strokeWidth={2} aria-hidden />
          <span>OTA AI</span>
        </Link>
        <Link to="/dex-edu/trade">
          <TrendingUp className="dash-command__utility-ico" size={15} strokeWidth={2} aria-hidden />
          <span>Trade</span>
        </Link>
        <Link to="/dex-edu/signals">
          <Radio className="dash-command__utility-ico" size={15} strokeWidth={2} aria-hidden />
          <span>Signals</span>
        </Link>
        <Link to="/dex-edu/account">
          <Wallet className="dash-command__utility-ico" size={15} strokeWidth={2} aria-hidden />
          <span>Vault</span>
        </Link>
        <Link to="/dex-edu/leverage">
          <BarChart3 className="dash-command__utility-ico" size={15} strokeWidth={2} aria-hidden />
          <span>Leverage</span>
        </Link>
        <Link to="/dex-edu/swap">
          <ArrowLeftRight className="dash-command__utility-ico" size={15} strokeWidth={2} aria-hidden />
          <span>Swap</span>
        </Link>
      </nav>
    </section>
  );
}
