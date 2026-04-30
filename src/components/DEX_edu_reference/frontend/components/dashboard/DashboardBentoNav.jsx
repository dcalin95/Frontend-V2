/**
 * Product launcher secundar pentru dashboard.
 * Quick access ramane colapsat implicit, pentru a nu concura cu briefing-ul principal.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import {
  DASHBOARD_FEATURE_GRID_ITEMS,
  DASHBOARD_SECONDARY_LINK_GROUPS,
  DASHBOARD_ICON_MAP,
} from '../../constants/dashboardProductNavData';

export default function DashboardBentoNav() {
  return (
    <>
      <section
        className="dash-region dash-region--product dash-product--secondary dash-product--tertiary"
        aria-label="Product map"
      >
        <header className="dash-product__head">
          <h2 className="dash-product__title">Explore products</h2>
          <p className="dash-product__desc">
            Secondary navigation when you want to leave the dashboard briefing.
          </p>
        </header>
        <div className="dash-product__grid">
          {DASHBOARD_FEATURE_GRID_ITEMS.map((item) => {
            const Icon = DASHBOARD_ICON_MAP[item.iconId];
            return (
              <Link
                key={item.id}
                to={item.to}
                className="dash-tile"
                aria-label={`${item.label}: ${item.lead}`}
              >
                {item.tag ? (
                  <span className="dash-tile__tag" aria-hidden>
                    {item.tag}
                  </span>
                ) : null}
                <span className="dash-tile__icon" aria-hidden>
                  {Icon ? <Icon size={16} strokeWidth={1.75} /> : null}
                </span>
                <h3 className="dash-tile__label">{item.label}</h3>
                <p className="dash-tile__lead">{item.lead}</p>
                {Array.isArray(item.bullets) && item.bullets.length > 0 ? (
                  <ul className="dash-tile__bullets">
                    {item.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                ) : null}
                <span className="dash-tile__cta">
                  Open <ChevronRight size={12} aria-hidden />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <details className="dash-region dash-region--ops dash-ops--collapsible">
        <summary className="dash-ops__summary">More links</summary>
        <div className="dash-ops__inner">
          <div className="dash-ops__cols">
            {DASHBOARD_SECONDARY_LINK_GROUPS.map((group) => (
              <div key={group.id} className="dash-ops__col">
                <h3>{group.label}</h3>
                <ul className="dash-ops__list">
                  {group.links.map(({ to, label }) => (
                    <li key={to}>
                      <Link to={to}>{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </details>
    </>
  );
}
