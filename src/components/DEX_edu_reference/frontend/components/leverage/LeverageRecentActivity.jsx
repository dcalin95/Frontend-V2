/**
 * Jurnal recent — local sessionStorage + bus; nu este audit global server-side.
 */
import React from 'react';
import { LEVERAGE_ACTIVITY_KIND } from '../../utils/leverageActivityTypes';

const BSC_TX = (hash) => `https://bscscan.com/tx/${hash}`;

function kindLabel(kind) {
  switch (kind) {
    case LEVERAGE_ACTIVITY_KIND.SPOT_OPEN:
      return 'Spot open';
    case LEVERAGE_ACTIVITY_KIND.SPOT_CLOSE:
      return 'Spot close';
    case LEVERAGE_ACTIVITY_KIND.CFD_OPEN:
      return 'CFD open';
    case LEVERAGE_ACTIVITY_KIND.CFD_CLOSE:
      return 'CFD close';
    case LEVERAGE_ACTIVITY_KIND.COLLATERAL_ADD:
      return 'Add collateral';
    case LEVERAGE_ACTIVITY_KIND.COLLATERAL_REMOVE:
      return 'Remove collateral';
    case LEVERAGE_ACTIVITY_KIND.DEMO_SPOT_OPEN:
      return 'Demo spot open';
    case LEVERAGE_ACTIVITY_KIND.DEMO_SPOT_CLOSE:
      return 'Demo spot close';
    case LEVERAGE_ACTIVITY_KIND.DEMO_CFD_OPEN:
      return 'Demo CFD open';
    case LEVERAGE_ACTIVITY_KIND.DEMO_CFD_CLOSE:
      return 'Demo CFD close';
    default:
      return kind || '—';
  }
}

export default function LeverageRecentActivity({ entries = [] }) {
  if (!entries.length) return null;

  return (
    <section className="leverage-activity-section" aria-label="Recent leverage activity">
      <header className="leverage-activity-header">
        <h3 className="leverage-activity-title">Recent activity</h3>
        <span className="leverage-activity-count">{entries.length} events</span>
      </header>

      <details className="leverage-activity-disclaimer">
        <summary className="leverage-activity-disclaimer-summary">Log limits (browser session)</summary>
        <p className="leverage-activity-disclaimer-body">
          Stored only in this browser session, not a global audit log. On-chain confirmations use BscScan links.
          Demo entries are simulated. Collateral add/remove has no dedicated contract event, so it appears after the
          transaction and refresh.
        </p>
      </details>

      <ul className="leverage-activity-list">
        {entries.map((row) => (
          <li key={row.id} className={`leverage-activity-row leverage-activity--${row.scope || 'live'}`}>
            <time className="leverage-activity-time" dateTime={row.at} title={row.at}>
              {row.at ? new Date(row.at).toLocaleString() : '—'}
            </time>
            <div className="leverage-activity-badges" aria-label="Scope and status">
              <span className="leverage-activity-badge">{row.scope === 'demo' ? 'Demo' : 'Live'}</span>
              <span className={`leverage-activity-phase phase-${row.phase}`}>{row.phase}</span>
            </div>
            <div className="leverage-activity-desc">
              <span className="leverage-activity-kind">{kindLabel(row.kind)}</span>
              {row.positionId != null && (
                <span className="leverage-activity-pid" title={String(row.positionId)}>
                  #{String(row.positionId).slice(-8)}
                </span>
              )}
            </div>
            <div className="leverage-activity-extra">
              {row.txHash && (
                <a
                  href={BSC_TX(row.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="leverage-activity-tx"
                >
                  BscScan
                </a>
              )}
              {row.errorSummary && <span className="leverage-activity-err">{row.errorSummary}</span>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
