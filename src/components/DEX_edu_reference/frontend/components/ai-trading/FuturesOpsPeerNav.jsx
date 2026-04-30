/**
 * Linkuri rapide SHORT ↔ LONG (query ?tab=) în toolbar panel — aceeași rută ca Futures Ops.
 * LLM mode switch: OpenAI | Claude | OTA Engine — see OtaLlmAnalyzeModeControls.
 */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TrendingDown, TrendingUp } from 'lucide-react';
import OtaLlmAnalyzeModeControls from './OtaLlmAnalyzeModeControls';

/**
 * @param {{ active: 'short' | 'long', openLivePositionsCount?: number, walletAddress?: string|null }} props
 */
export default function FuturesOpsPeerNav({ active, openLivePositionsCount = 0, walletAddress = null }) {
  const { pathname } = useLocation();
  const shortTo = { pathname, search: '' };
  const longTo = { pathname, search: '?tab=long' };
  const futuresPanelLabel = active === 'long' ? 'LONG' : 'SHORT';

  return (
    <nav className="futures-ops-peer-nav" aria-label="Futures Ops — rută și mod analiză">
      <div className="futures-ops-peer-nav__row futures-ops-peer-nav__row--routes">
        <Link
          to={shortTo}
          className={`futures-ops-peer-nav__link futures-ops-peer-nav__link--short${active === 'short' ? ' futures-ops-peer-nav__link--current' : ''}`}
          aria-current={active === 'short' ? 'page' : undefined}
        >
          <TrendingDown size={14} strokeWidth={2.4} aria-hidden className="futures-ops-peer-nav__icon" />
          <span>SHORT</span>
          <span className="futures-ops-peer-nav__hint">live</span>
        </Link>
        <Link
          to={longTo}
          className={`futures-ops-peer-nav__link futures-ops-peer-nav__link--long${active === 'long' ? ' futures-ops-peer-nav__link--current' : ''}`}
          aria-current={active === 'long' ? 'page' : undefined}
        >
          <TrendingUp size={14} strokeWidth={2.4} aria-hidden className="futures-ops-peer-nav__icon" />
          <span>LONG</span>
          <span className="futures-ops-peer-nav__hint">live</span>
        </Link>
      </div>

      <OtaLlmAnalyzeModeControls
        walletAddress={walletAddress}
        openLivePositionsCount={openLivePositionsCount}
        futuresPanelLabel={futuresPanelLabel}
      />
    </nav>
  );
}
