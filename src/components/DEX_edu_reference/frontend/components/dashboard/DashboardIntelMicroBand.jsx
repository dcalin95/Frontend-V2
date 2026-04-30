/**
 * Bandă compactă sub context OTA — aceleași surse ca System status, format scurt.
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { buildDashboardMicroSummary } from '../../utils/buildDashboardSystemCards';

export default function DashboardIntelMicroBand({ aggregate }) {
  const rows = useMemo(() => {
    const a = aggregate || {};
    return buildDashboardMicroSummary({
      loading: Boolean(a.isInitialLoading ?? a.loading) && a.lastUpdatedAt == null,
      futuresLiveStatus: a.futuresLiveStatus,
      futuresOpenShorts: a.futuresOpenShorts,
      vaultBalanceComparison: a.vaultBalanceComparison,
      leverageDemoAccount: a.leverageDemoAccount,
      leverageDemoStatus: a.leverageDemoStatus,
      autoStatus: a.autoStatus,
      signalsToday: a.signalsToday,
      tradesTotal: a.tradesTotal,
      lastSignal: a.lastSignal,
    });
  }, [aggregate]);

  return (
    <div className="dash-intel-micro" role="region" aria-label="Quick system lines">
      {rows.map((r) => (
        <Link key={r.id} to={r.href} className="dash-intel-micro__row">
          <span className="dash-intel-micro__label">{r.label}</span>
          <span className="dash-intel-micro__text">{r.text}</span>
        </Link>
      ))}
    </div>
  );
}
