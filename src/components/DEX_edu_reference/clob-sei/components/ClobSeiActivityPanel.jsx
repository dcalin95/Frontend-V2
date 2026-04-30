/**
 * Activitate recentă: tranzacții înregistrate în sesiune (localStorage), nu indexer on-chain.
 */
import React from 'react';
import { CLOB_SEI_TX_EXPLORER_BASE } from '../config';

export default function ClobSeiActivityPanel({ entries = [], explorerBase = CLOB_SEI_TX_EXPLORER_BASE }) {
  if (!entries.length) {
    return (
      <section className="clob-sei-activity" aria-label="Recent CLOB activity">
        <div className="clob-sei-activity__title">Recent activity</div>
        <p className="clob-sei-activity__empty">
          Confirmed trades from this browser appear here. Open resting orders, partial fills, and cancels require a{' '}
          <strong>block explorer</strong> or <strong>indexer/subgraph</strong> — not stored in this app.
        </p>
      </section>
    );
  }

  return (
    <section className="clob-sei-activity" aria-label="Recent CLOB activity">
      <div className="clob-sei-activity__title">Recent activity (this browser)</div>
      <ul className="clob-sei-activity__list">
        {entries.map((e) => (
          <li key={`${e.txHash}-${e.at}`} className="clob-sei-activity__item">
            <span className="clob-sei-activity__meta">
              {e.orderType} · {e.side} · {e.baseSymbol}/{e.quoteSymbol}
            </span>
            <a
              href={`${explorerBase}/${e.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="clob-sei-activity__link"
            >
              {e.txHash.slice(0, 10)}…{e.txHash.slice(-6)}
            </a>
          </li>
        ))}
      </ul>
      <p className="clob-sei-activity__note">
        Source: local session only. For authoritative on-chain history use the explorer. Cancel / retract resting offers is not implemented in this UI yet.
      </p>
    </section>
  );
}
