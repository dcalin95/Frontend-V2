/**
 * Ce merita verificat acum - derivat din date reale (nu AI).
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Info } from 'lucide-react';
import { buildDashboardAttentionItems } from '../../utils/buildDashboardAttentionItems';

export default function DashboardAttentionBar({ aggregate }) {
  const items = useMemo(() => buildDashboardAttentionItems(aggregate || {}), [aggregate]);

  if (items.length === 0) return null;

  const single = items.length === 1;

  return (
    <section
      className={`dash-region dash-region--attention${single ? ' dash-region--attention--single' : ''}`}
      aria-label="Items that may need attention"
    >
      <header className="dash-attention__head">
        <h2 className="dash-attention__title">Next best checks</h2>
        {!single ? (
          <p className="dash-attention__desc">
            Derived from this account and live system data - not generic AI tips.
          </p>
        ) : null}
      </header>
      <ul className="dash-attention__list" role="list">
        {items.map((it) => (
          <li key={it.id} className={`dash-attention__item dash-attention__item--${it.severity}`}>
            {it.severity === 'warn' ? (
              <AlertTriangle className="dash-attention__ico" size={16} aria-hidden />
            ) : (
              <Info className="dash-attention__ico" size={16} aria-hidden />
            )}
            {it.href ? (
              <Link to={it.href} className="dash-attention__link">
                {it.text}
              </Link>
            ) : (
              <span className="dash-attention__text">{it.text}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
