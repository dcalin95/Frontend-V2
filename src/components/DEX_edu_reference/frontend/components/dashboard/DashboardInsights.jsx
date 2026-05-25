/**
 * Panou dreapta (split): semnale, ultimul semnal exec, fragmente OTA stats - fara titlu duplicat.
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Radio, History, ArrowRight, Loader2 } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';

const OTA_STAT_LABELS = {
  totalAnalyses: 'Total analyses',
  totalSignals: 'Total signals',
  analysesToday: 'Analyses today',
  openPositions: 'Open positions',
  lastAnalysisAt: 'Last analysis at',
};

function pickOtaStatLines(otaStats) {
  if (!otaStats || typeof otaStats !== 'object') return [];
  const s = otaStats.stats || otaStats.data || otaStats;
  if (!s || typeof s !== 'object') return [];
  const rows = [];
  const keys = ['totalAnalyses', 'totalSignals', 'analysesToday', 'openPositions', 'lastAnalysisAt'];
  for (const k of keys) {
    if (s[k] != null && s[k] !== '') {
      rows.push({
        key: k,
        label: OTA_STAT_LABELS[k] || k.replace(/([A-Z])/g, ' $1').trim(),
        value: String(s[k]),
      });
    }
  }
  return rows.slice(0, 6);
}

export default function DashboardInsights({ aggregate }) {
  const { loading, isInitialLoading, signals, lastSignal, otaStats, lastUpdatedAt } = aggregate || {};
  const showSkeleton = Boolean(isInitialLoading ?? loading) && lastUpdatedAt == null;

  const recent = useMemo(() => (Array.isArray(signals) ? signals.slice(0, 6) : []), [signals]);
  const highlightedSignal = useMemo(() => recent[0] || lastSignal || null, [recent, lastSignal]);
  const statLines = useMemo(() => pickOtaStatLines(otaStats), [otaStats]);

  const lastSignalSideClass = useMemo(() => {
    if (!highlightedSignal) return 'hold';
    const sk = String(highlightedSignal.side || highlightedSignal.signal || 'hold').toLowerCase();
    if (sk === 'buy' || sk === 'open_long') return 'buy';
    if (sk === 'sell' || sk === 'open_short') return 'sell';
    return 'hold';
  }, [highlightedSignal]);

  return (
    <article
      className={`dash-panel dash-panel--insights dash-insights dash-insights--rail${
        aggregate?.isRefreshing ? ' dash-insights--refreshing' : ''
      }`}
      role="region"
      aria-label="OTA insights"
    >
      {!showSkeleton && aggregate?.isRefreshing ? (
        <span className="dash-insights__refresh-pip" aria-label="Updating" title="Updating">
          <Loader2 size={11} className="dash-insights__refresh-pip-icon" aria-hidden />
        </span>
      ) : null}
      {showSkeleton ? (
        <div className="dash-insights__skeleton" aria-busy="true" aria-label="Loading OTA context">
          <div className="dash-insights__skel dash-insights__skel--bar" />
          <div className="dash-insights__skel dash-insights__skel--bar dash-insights__skel--short" />
          <div className="dash-insights__skel-rows">
            {[1, 2, 3].map((k) => (
              <div key={k} className="dash-insights__skel dash-insights__skel--row" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {highlightedSignal && (highlightedSignal.token || highlightedSignal.side || highlightedSignal.signal) ? (
            <section className="dash-insights__hl" aria-label="Last execution signal">
              <span className="dash-insights__hl-label">Latest AI signal</span>
              <span className={`dash-insights__hl-value dash-insights__hl-value--${lastSignalSideClass}`}>
                {highlightedSignal.token || '—'} — {String(highlightedSignal.side || highlightedSignal.signal || '—').toUpperCase()}
              </span>
            </section>
          ) : null}

          {statLines.length > 0 ? (
            <section className="dash-insights__stats" role="list" aria-label="OTA stats">
              {statLines.map((row) => (
                <div key={row.key} className="dash-insights__stat" role="listitem">
                  <span className="dash-insights__stat-label">{row.label}</span>
                  <span className="dash-insights__stat-value">{row.value}</span>
                </div>
              ))}
              <p className="dash-insights__footnote">From API.</p>
            </section>
          ) : null}

          <section className="dash-insights__block" aria-label="Recent signals">
            <h3 className="dash-insights__block-title">
              <Radio size={14} aria-hidden /> Recent AI signals
            </h3>
            {recent.length === 0 ? (
              <p className="dash-insights__muted">No signals in list yet. Open OTA to generate new AI context.</p>
            ) : (
        <ul className="dash-insights__signals">
                {recent.map((s, i) => {
                  const sk = String(s.signal || 'hold').toLowerCase();
                  const skClass = sk === 'buy' ? 'buy' : sk === 'sell' ? 'sell' : 'hold';
                  return (
                    <li key={s.id || s.signalId || i} className="dash-insights__sig">
                      <div className="dash-insights__sig-head">
                        <span className={`dash-insights__sig-line dash-insights__sig-line--${skClass}`}>
                          {s.token || '—'} — {String(s.signal || 'hold').toUpperCase()}
                        </span>
                      </div>
                      {s.entryPrice != null ? (
                        <span
                          className="dash-insights__sig-price dash-insights__sig-price--signal"
                          title="Market / trigger price at signal time - not account balance or trade notional"
                        >
                          signal price ${formatNumber(s.entryPrice, 2)}
                        </span>
                      ) : (
                        <span className="dash-insights__sig-price dash-insights__sig-price--empty">—</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <nav className="dash-insights__actions" aria-label="OTA shortcuts">
            <Link to="/dex-edu/ota" className="dash-insights__link">
              Open AI OTA <ArrowRight size={14} aria-hidden />
            </Link>
            <Link to="/dex-edu/signals" className="dash-insights__link dash-insights__link--ghost">
              <History size={14} aria-hidden /> Signal history
            </Link>
          </nav>
        </>
      )}
    </article>
  );
}
