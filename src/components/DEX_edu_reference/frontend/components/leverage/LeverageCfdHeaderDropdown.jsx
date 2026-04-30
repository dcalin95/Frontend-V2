/**
 * Header: tab CFD cu dropdown — tab-uri pe domeniu (Forex vs Crypto vs Commodities vs S&P·Nasdaq vs Stocks).
 */
import React, { useRef, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { CFD_ASSETS, CFD_NAV_GROUPS, getCfdDomainIdForAssetId } from '../../constants/leverageConstants';
import { CFD_DOMAIN_ICONS } from './cfdDomainTabIcons';
import TokenLogo from '../common/TokenLogo';

export default function LeverageCfdHeaderDropdown({
  isCfdRoute,
  cfdAssetId,
  onSelectInstrument,
}) {
  const [open, setOpen] = React.useState(false);
  const [activeDomain, setActiveDomain] = React.useState(() => getCfdDomainIdForAssetId(cfdAssetId));
  const wrapRef = useRef(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) close();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  useEffect(() => {
    if (open) {
      setActiveDomain(getCfdDomainIdForAssetId(cfdAssetId));
    }
  }, [open, cfdAssetId]);

  const currentAsset = CFD_ASSETS.find((a) => a.id === cfdAssetId);
  const currentLabel = currentAsset?.label ?? 'CFD';
  const currentSymbol = currentAsset?.priceToken ?? 'BTC';

  const activeGroup = CFD_NAV_GROUPS.find((g) => g.id === activeDomain) ?? CFD_NAV_GROUPS[0];

  return (
    <div className="leverage-cfd-nav" ref={wrapRef}>
      <button
        type="button"
        className={`leverage-header-tab leverage-cfd-nav__trigger ${isCfdRoute ? 'is-active' : ''}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="leverage-cfd-nav-menu"
        id="leverage-cfd-nav-trigger"
        title="CFD instruments by domain: Forex, Crypto, Commodities, Indices, US Stocks"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="leverage-cfd-nav__trigger-logo" aria-hidden="true">
          <TokenLogo symbol={currentSymbol} size="sm" />
        </span>
        <span className="leverage-cfd-nav__trigger-text">
          <span className="leverage-cfd-nav__trigger-main">Instruments</span>
          <span className="leverage-cfd-nav__trigger-sub" title={currentLabel}>
            {currentLabel}
          </span>
        </span>
        <ChevronDown
          size={14}
          className={`leverage-cfd-nav__chevron${open ? ' is-open' : ''}`}
          aria-hidden
        />
      </button>
      {open && (
        <div
          className="leverage-cfd-nav__menu"
          id="leverage-cfd-nav-menu"
          role="presentation"
          aria-labelledby="leverage-cfd-nav-trigger"
        >
          <div className="leverage-cfd-nav__current" role="presentation">
            <span className="leverage-cfd-nav__current-logo" aria-hidden="true">
              <TokenLogo symbol={currentSymbol} size="sm" />
            </span>
            <span className="leverage-cfd-nav__current-text">
              Chart & form: <strong>{currentLabel}</strong>
            </span>
          </div>

          <div className="leverage-cfd-nav__domain-toolbar" role="tablist" aria-label="CFD domain">
            {CFD_NAV_GROUPS.map((g) => {
              const Icon = CFD_DOMAIN_ICONS[g.id];
              return (
                <button
                  key={g.id}
                  type="button"
                  role="tab"
                  id={`leverage-cfd-domain-${g.id}`}
                  aria-selected={activeDomain === g.id}
                  aria-controls={`leverage-cfd-panel-${g.id}`}
                  className={`leverage-cfd-nav__domain-tab leverage-cfd-nav__domain-tab--${g.id}${activeDomain === g.id ? ' is-active' : ''}`}
                  onClick={() => setActiveDomain(g.id)}
                >
                  {Icon && (
                    <span className="leverage-cfd-nav__domain-tab-icon" aria-hidden>
                      <Icon size={18} strokeWidth={2} className="leverage-cfd-nav__domain-tab-svg" />
                    </span>
                  )}
                  <span className="leverage-cfd-nav__domain-tab-label">{g.shortTabLabel}</span>
                </button>
              );
            })}
          </div>

          {activeGroup?.tabHint && (
            <p className="leverage-cfd-nav__domain-hint">{activeGroup.tabHint}</p>
          )}

          <div
            className="leverage-cfd-nav__domain-panel"
            role="tabpanel"
            id={`leverage-cfd-panel-${activeGroup.id}`}
            aria-labelledby={`leverage-cfd-domain-${activeGroup.id}`}
          >
            <div className="leverage-cfd-nav__group-label leverage-cfd-nav__group-label--inline">
              {activeGroup.label}
            </div>
            <div className="leverage-cfd-nav__items" role="group" aria-label={activeGroup.label}>
              {(activeGroup.assetIds || []).map((id) => {
                const a = CFD_ASSETS.find((x) => x.id === id);
                if (!a) return null;
                const selected = cfdAssetId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={selected}
                    className={`leverage-cfd-nav__item${selected ? ' is-selected' : ''}`}
                    onClick={() => {
                      onSelectInstrument(id);
                      close();
                    }}
                  >
                    <span className="leverage-cfd-nav__item-main">
                      <span className="leverage-cfd-nav__item-logo" aria-hidden="true">
                        <TokenLogo symbol={a.priceToken} size="sm" />
                      </span>
                      <span className="leverage-cfd-nav__item-label">{a.label}</span>
                    </span>
                    <span className="leverage-cfd-nav__item-sym">{a.priceToken}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
