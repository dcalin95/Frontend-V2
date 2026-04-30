/**
 * 📊 DashboardOTASummary - OTA summary card on Dashboard
 *
 * - Active signals count (today)
 * - Recent analyses (last N signals)
 * - Quick actions: Signals, Trade, OTA
 *
 * @module DashboardOTASummary
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Radio, TrendingUp, TrendingDown, Minus, ArrowRight, Zap } from 'lucide-react';
import { getSignals, getSignalPerformance } from '../../services/signalApiService';
import { getAutoExecutionStatus } from '../../services/aiTradingApiService';
import { useOTAAccess } from '../../hooks/useOTAAccess';
import { formatNumber } from '../../utils/formatters';
import '../../styles/components/dashboard-ota-summary.css';

const RECENT_LIMIT = 5;
const POLL_MS = 60000;

const DashboardOTASummary = React.memo(({ userId }) => {
  const { walletAddress } = useOTAAccess();
  const effectiveId = userId || walletAddress;
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoStatus, setAutoStatus] = useState(null);
  const [signalPerformance, setSignalPerformance] = useState(null);

  useEffect(() => {
    if (!effectiveId) {
      setSignals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    const load = async () => {
      try {
        const res = await getSignals(effectiveId, { limit: 20, offset: 0 });
        if (!cancelled && res?.signals) setSignals(Array.isArray(res.signals) ? res.signals : []);
      } catch (_) {
        if (!cancelled) setSignals([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [effectiveId]);

  useEffect(() => {
    if (!effectiveId) {
      setAutoStatus(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const status = await getAutoExecutionStatus(effectiveId);
        if (!cancelled && status) setAutoStatus(status);
      } catch (_) {
        if (!cancelled) setAutoStatus(null);
      }
    };
    load();
    const t = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [effectiveId]);

  useEffect(() => {
    if (!effectiveId) {
      setSignalPerformance(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const res = await getSignalPerformance(effectiveId, { period: '30d' });
        if (!cancelled && res) setSignalPerformance(res);
      } catch (_) {
        if (!cancelled) setSignalPerformance(null);
      }
    };
    load();
    const t = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [effectiveId]);

  const { signalsToday, recent } = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const today = signals.filter(s => new Date(s.createdAt || s.created_at || 0) >= todayStart);
    return {
      signalsToday: today.length,
      recent: signals.slice(0, RECENT_LIMIT)
    };
  }, [signals]);

  const signalIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (t === 'buy') return <TrendingUp size={14} className="dashboard-ota-summary-icon buy" />;
    if (t === 'sell') return <TrendingDown size={14} className="dashboard-ota-summary-icon sell" />;
    return <Minus size={14} className="dashboard-ota-summary-icon hold" />;
  };

  if (!effectiveId) {
    return (
      <section className="dashboard-ota-summary" aria-label="OTA summary">
        <div className="dashboard-ota-summary-card">
          <h3 className="dashboard-ota-summary-title">
            <Zap size={18} />
            OTA Summary
          </h3>
          <p className="dashboard-ota-summary-empty">Connect wallet to see signals and quick actions.</p>
          <div className="dashboard-ota-summary-actions">
            <Link to="/dex-edu/signals" className="dashboard-ota-summary-link">Signals</Link>
            <Link to="/dex-edu/trade" className="dashboard-ota-summary-link">Trade</Link>
            <Link to="/dex-edu/ota" className="dashboard-ota-summary-link">OTA AI</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-ota-summary" aria-label="OTA summary">
      <div className="dashboard-ota-summary-card">
        <h3 className="dashboard-ota-summary-title">
          <Zap size={18} />
          OTA Summary
        </h3>

        {loading ? (
          <div className="dashboard-ota-summary-skeleton" role="status" aria-live="polite">
            <span className="dashboard-ota-summary-skeleton-label">Loading OTA data</span>
            <div className="dashboard-ota-summary-skeleton-row">
              <span className="dashboard-ota-summary-skeleton-pill" />
              <span className="dashboard-ota-summary-skeleton-pill" />
              <span className="dashboard-ota-summary-skeleton-pill" />
            </div>
            <div className="dashboard-ota-summary-skeleton-list">
              <span className="dashboard-ota-summary-skeleton-line" />
              <span className="dashboard-ota-summary-skeleton-line" />
              <span className="dashboard-ota-summary-skeleton-line short" />
            </div>
          </div>
        ) : (
          <>
            <div className="dashboard-ota-summary-stats" role="group" aria-label="OTA summary stats">
              <div className="dashboard-ota-summary-stat">
                <span className="dashboard-ota-summary-stat-value">{signalsToday}</span>
                <span className="dashboard-ota-summary-stat-label">Signals today</span>
              </div>
              {autoStatus != null && (
                <div className="dashboard-ota-summary-stat">
                  <span className={`dashboard-ota-summary-stat-value ${autoStatus.enabled ? 'active' : ''}`}>
                    {autoStatus.enabled ? 'Active' : 'Paused'}
                  </span>
                  <span className="dashboard-ota-summary-stat-label">Auto mode</span>
                </div>
              )}
              {signalPerformance != null && (signalPerformance.winRate != null || signalPerformance.totalWithOutcome != null) && (
                <div className="dashboard-ota-summary-stat">
                  <span className="dashboard-ota-summary-stat-value">
                    {signalPerformance.winRate != null
                      ? `${formatNumber(signalPerformance.winRate * 100, 1)}%`
                      : '—'}
                  </span>
                  <span className="dashboard-ota-summary-stat-label">
                    Win rate
                    {signalPerformance.wins != null &&
                    signalPerformance.losses != null &&
                    signalPerformance.wins + signalPerformance.losses > 0
                      ? ` (${signalPerformance.wins}/${signalPerformance.wins + signalPerformance.losses})`
                      : ''}
                  </span>
                </div>
              )}
            </div>

            {recent.length > 0 ? (
              <div className="dashboard-ota-summary-recent" role="region" aria-label="Recent signal analyses">
                <span className="dashboard-ota-summary-recent-title">Recent analyses</span>
                <ul className="dashboard-ota-summary-list" role="list">
                  {recent.map((s, i) => (
                    <li key={s.id || s.signalId || i} className="dashboard-ota-summary-item">
                      {signalIcon(s.signal)}
                      <Radio size={12} className="dashboard-ota-summary-token-icon" aria-hidden />
                      <span className="dashboard-ota-summary-item-token">{s.token || '—'}</span>
                      <span className="dashboard-ota-summary-item-signal">{String(s.signal || 'hold').toUpperCase()}</span>
                      {s.entryPrice != null && (
                        <span className="dashboard-ota-summary-item-price">${formatNumber(s.entryPrice, 2)}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : signalsToday === 0 ? (
              <p className="dashboard-ota-summary-empty" style={{ marginTop: 8, fontSize: 12 }}>No signals yet. Go to <Link to="/dex-edu/ota" className="dashboard-ota-summary-link">OTA AI</Link> to start.</p>
            ) : null}

            <div className="dashboard-ota-summary-actions" role="navigation" aria-label="Quick links">
              <Link to="/dex-edu/signals" className="dashboard-ota-summary-link">
                Signals <ArrowRight size={14} />
              </Link>
              <Link to="/dex-edu/trade" className="dashboard-ota-summary-link">
                Trade <ArrowRight size={14} />
              </Link>
              <Link to="/dex-edu/ota" className="dashboard-ota-summary-link">
                OTA AI <ArrowRight size={14} />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
});

DashboardOTASummary.displayName = 'DashboardOTASummary';
export default DashboardOTASummary;
