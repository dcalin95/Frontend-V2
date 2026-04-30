/**
 * Butoane mari SHORT / LONG pe OTAShortOpsPage — stiluri în trade-cost-analytics.css
 */
import React from 'react';
import { FuturesOpsLongTabIcon, FuturesOpsShortTabIcon } from './FuturesOpsModeTabIcons';

export default function FuturesOpsModeSwitcher({ activeTab, onSelect }) {
  const isShort = activeTab === 'short';
  const isLong = activeTab === 'long';

  return (
    <div className="futures-ops-mode-switcher-pair">
      <button
        type="button"
        className={`futures-ops-mode-tab futures-ops-mode-tab--short${isShort ? ' futures-ops-mode-tab--active-short' : ''}`}
        onClick={() => onSelect('short')}
        aria-pressed={isShort}
      >
        <FuturesOpsShortTabIcon active={isShort} size={48} />
        <span className="futures-ops-mode-tab__label">
          SHORT
          <span className={`futures-ops-mode-tab__badge futures-ops-mode-tab__badge--short${isShort ? ' futures-ops-mode-tab__badge--on' : ''}`}>
            LIVE
          </span>
        </span>
        <span className={`futures-ops-mode-tab__sub futures-ops-mode-tab__sub--short${isShort ? ' futures-ops-mode-tab__sub--on-short' : ''}`}>
          Binance Futures
        </span>
      </button>

      <button
        type="button"
        className={`futures-ops-mode-tab futures-ops-mode-tab--long${isLong ? ' futures-ops-mode-tab--active-long' : ''}`}
        onClick={() => onSelect('long')}
        aria-pressed={isLong}
      >
        <FuturesOpsLongTabIcon active={isLong} size={48} />
        <span className="futures-ops-mode-tab__label">
          LONG
          <span className={`futures-ops-mode-tab__badge futures-ops-mode-tab__badge--long${isLong ? ' futures-ops-mode-tab__badge--on-long' : ''}`}>
            LIVE
          </span>
        </span>
        <span className={`futures-ops-mode-tab__sub futures-ops-mode-tab__sub--long${isLong ? ' futures-ops-mode-tab__sub--on-long' : ''}`}>
          Binance Futures v1
        </span>
      </button>
    </div>
  );
}
