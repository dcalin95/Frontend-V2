/**
 * System status — carduri executive: headline dominant + max 3 linii secundare.
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, History, Radio, TrendingUp, Wallet, Zap } from 'lucide-react';
import { buildDashboardSystemCards } from '../../utils/buildDashboardSystemCards';

/** Mapare stabilă după `id` din buildDashboardSystemCards — aceleași chei ca în SSOT date. */
const DASH_SYS_CARD_ICONS = {
  /** TrendingUp — lizibil la dimensiuni mici (LineChart poate fi prea fin pe fundal închis). */
  futures: TrendingUp,
  'ota-auto': Zap,
  leverage: BarChart3,
  vault: Wallet,
  trading: History,
  signals: Radio,
};

export default function DashboardSystemStatusGrid({ aggregate }) {
  const cards = useMemo(() => {
    const a = aggregate || {};
    return buildDashboardSystemCards({
      loading: Boolean(a.isInitialLoading ?? a.loading) && a.lastUpdatedAt == null,
      futuresLiveStatus: a.futuresLiveStatus,
      futuresOpenShorts: a.futuresOpenShorts,
      otaTrackedPositions: a.otaTrackedPositions,
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
    <section
      className={`dash-region dash-region--systems${aggregate?.isRefreshing ? ' dash-region--systems--refreshing' : ''}`}
      aria-label="Systems for this account"
    >
      <header className="dash-systems__head">
        <h2 className="dash-systems__title">Systems for this account</h2>
        <p className="dash-systems__desc">
          System health for this account — not a duplicate of the balances above.
        </p>
      </header>
      <div className="dash-systems__grid">
        {cards.map((c) => {
          const SysIcon = DASH_SYS_CARD_ICONS[c.id];
          return (
          <Link key={c.id} to={c.href} className={`dash-sys-card dash-sys-card--${c.level}`}>
            <div className="dash-sys-card__top">
              <div className="dash-sys-card__title-row">
                {SysIcon ? (
                  <span className="dash-sys-card__ico-wrap" aria-hidden>
                    <SysIcon size={14} strokeWidth={1.75} absoluteStrokeWidth />
                  </span>
                ) : null}
                <h3 className="dash-sys-card__title">{c.title}</h3>
              </div>
              <span className="dash-sys-card__badge" aria-hidden>
                {c.badge}
              </span>
            </div>
            <p className="dash-sys-card__headline">{c.headline}</p>
            <ul className="dash-sys-card__secondary">
              {c.secondary.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
            {c.foot ? <p className="dash-sys-card__foot">{c.foot}</p> : null}
          </Link>
          );
        })}
      </div>
    </section>
  );
}
