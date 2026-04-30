/**
 * Strat compact Platform / sistem - KPI-uri globale (OTA, cota, semnale, auto) fara a domina wallet-ul.
 */

import React from 'react';
import { Activity, Radio, Cpu, Gauge, HeartPulse, DollarSign } from 'lucide-react';
import { formatLargeNumber } from '../../utils/formatters';
import { normalizeDashboardQuotaForDisplay } from '../../utils/dashboardKpiNormalize';

function Kpi({ icon: Icon, label, value, hint, variant }) {
  return (
    <li
      className={`dash-kpi dash-kpi--compact dash-kpi--${variant || 'default'}`}
      title={hint || ''}
    >
      {Icon ? <Icon className="dash-kpi__icon" size={16} strokeWidth={1.75} aria-hidden /> : null}
      <div className="dash-kpi__main">
        <span className="dash-kpi__value">{value}</span>
        <span className="dash-kpi__label">{label}</span>
      </div>
    </li>
  );
}

export default function DashboardPlatformStatusRow({ aggregate }) {
  const {
    loading,
    isInitialLoading,
    otaHealth,
    otaQuota,
    signalsToday,
    autoStatus,
    signalPerformance,
    metrics,
    profitSummary,
  } = aggregate || {};

  const initialLoad = isInitialLoading ?? loading;

  const healthOk =
    otaHealth &&
    (otaHealth.ok === true ||
      otaHealth.status === 'ok' ||
      otaHealth.healthy === true ||
      (typeof otaHealth === 'object' && !otaHealth.error));

  const quotaDisplay = normalizeDashboardQuotaForDisplay(otaQuota);

  const winRatePct =
    signalPerformance?.winRate != null
      ? `${formatLargeNumber(Number(signalPerformance.winRate) * 100, 1)}%`
      : '—';

  const netProfit =
    metrics?.netProfit != null
      ? `$${formatLargeNumber(metrics.netProfit, 2)}`
      : profitSummary?.totalProfitUsd != null
        ? `$${formatLargeNumber(profitSummary.totalProfitUsd, 2)}`
        : '—';

  const autoLabel =
    autoStatus?.enabled === true ? 'On' : autoStatus?.enabled === false ? 'Off' : '—';

  return (
    <section
      className={`dash-region dash-region--platform${initialLoad ? '' : aggregate?.isRefreshing ? ' dash-region--platform--refreshing' : ''}`}
      aria-label="Platform status"
    >
      <header className="dash-platform__head">
        <h2 className="dash-platform__title">AI operating state</h2>
        <p className="dash-platform__desc">
          Quota, execution health and signal performance for this account.
        </p>
      </header>
      <ul className="dash-platform__kpis">
        <Kpi
          icon={HeartPulse}
          label="OTA API"
          value={initialLoad ? '…' : healthOk ? 'OK' : otaHealth ? 'Check' : '—'}
          hint="From GET OTA health (backend)"
          variant={healthOk ? 'ok' : 'muted'}
        />
        <Kpi
          icon={Cpu}
          label="Analyses left (today)"
          value={initialLoad ? '…' : quotaDisplay.displayValue}
          hint={
            initialLoad
              ? ''
              : [quotaDisplay.hint, 'GET OTA quota endpoint.'].filter(Boolean).join(' ')
          }
        />
        <Kpi
          icon={Radio}
          label="Signals today"
          value={initialLoad ? '…' : String(signalsToday ?? 0)}
          hint="From signals list (count since local midnight)"
        />
        <Kpi
          icon={Activity}
          label="Auto mode"
          value={initialLoad ? '…' : autoLabel}
          hint="From GET auto execution status"
          variant={autoStatus?.enabled ? 'ok' : 'muted'}
        />
        <Kpi
          icon={Gauge}
          label="Win rate (30d)"
          value={initialLoad ? '…' : winRatePct}
          hint="From signal performance API when available"
        />
        <Kpi
          icon={DollarSign}
          label="Net (30d est.)"
          value={initialLoad ? '…' : netProfit}
          hint="From performance metrics or profit summary API"
        />
      </ul>
    </section>
  );
}
