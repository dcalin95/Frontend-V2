/**
 * LeverageDropdown – custom dropdown cu TokenLogo per opțiune.
 *
 * Props:
 *   domainTabs  {boolean} — dacă true și `groups` au `domainId`, afișează tab-uri pe domeniu + o listă activă
 */
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import TokenLogo from '../common/TokenLogo';
import { CFD_DOMAIN_ICONS } from './cfdDomainTabIcons';

export default function LeverageDropdown({
  label,
  value,
  onChange,
  options = [],
  groups = null,
  domainTabs = false,
  ariaLabel,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const flatOptions = useMemo(() => {
    if (groups && Array.isArray(groups) && groups.length > 0) {
      return groups.flatMap((g) => g.options || []);
    }
    return options;
  }, [groups, options]);

  const selected = flatOptions.find((o) => String(o.value) === String(value)) || flatOptions[0];
  const useGroups = groups && Array.isArray(groups) && groups.length > 0;
  const useDomainTabs = domainTabs && useGroups && groups[0]?.domainId != null;

  const [activeDomainId, setActiveDomainId] = useState(() => {
    if (!groups?.length) return '';
    const g = groups.find((gr) => (gr.options || []).some((o) => String(o.value) === String(value)));
    return g?.domainId ?? groups[0]?.domainId ?? '';
  });

  const activeDomainGroup = useMemo(() => {
    if (!useDomainTabs || !groups?.length) return null;
    return groups.find((g) => g.domainId === activeDomainId) ?? groups[0];
  }, [useDomainTabs, groups, activeDomainId]);

  useEffect(() => {
    if (!open || !useDomainTabs || !groups?.length) return;
    const g = groups.find((gr) => (gr.options || []).some((o) => String(o.value) === String(value)));
    if (g?.domainId) setActiveDomainId(g.domainId);
  }, [open, value, useDomainTabs, groups]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) close();
    }
    function handleKey(e) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, close]);

  if (!flatOptions.length) return null;

  return (
    <div className={`lev-dd-field leverage-field${disabled ? ' lev-dd-field--disabled' : ''}`} ref={wrapRef}>
      {label && <label className="leverage-label">{label}</label>}
      <div className="lev-dd-wrap">
        <button
          type="button"
          className={`lev-dd-trigger${open ? ' lev-dd-trigger--open' : ''}`}
          onClick={() => !disabled && setOpen((v) => !v)}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={ariaLabel || label}
        >
          {selected?.symbol != null && (
            <span className="lev-dd-trigger__logo">
              <TokenLogo symbol={selected.symbol} size="sm" aria-hidden />
            </span>
          )}
          <span className="lev-dd-trigger__label">{selected?.label || '—'}</span>
          <span className="lev-dd-trigger__chevron" aria-hidden>▾</span>
        </button>

        {open && useDomainTabs && (
          <div className="lev-dd-popover lev-dd-popover--domain">
            <div className="lev-dd-domain-toolbar" role="tablist" aria-label="Instrument domain">
              {groups.map((g) => {
                const Icon = CFD_DOMAIN_ICONS[g.domainId];
                return (
                  <button
                    key={g.domainId}
                    type="button"
                    role="tab"
                    aria-selected={activeDomainId === g.domainId}
                    className={`lev-dd-domain-tab lev-dd-domain-tab--${g.domainId}${activeDomainId === g.domainId ? ' is-active' : ''}`}
                    onClick={() => setActiveDomainId(g.domainId)}
                  >
                    {Icon && (
                      <span className="lev-dd-domain-tab-icon" aria-hidden>
                        <Icon size={18} strokeWidth={2} className="lev-dd-domain-tab-svg" />
                      </span>
                    )}
                    <span className="lev-dd-domain-tab-label">{g.tabLabel || g.groupLabel}</span>
                  </button>
                );
              })}
            </div>
            {activeDomainGroup?.tabHint && (
              <p className="lev-dd-domain-hint">{activeDomainGroup.tabHint}</p>
            )}
            <ul
              className="lev-dd-list lev-dd-list--domain"
              role="listbox"
              aria-label={ariaLabel || label}
            >
              {(activeDomainGroup?.options || []).map((opt) => (
                <li
                  key={String(opt.value)}
                  role="option"
                  aria-selected={String(opt.value) === String(value)}
                  className={`lev-dd-option${String(opt.value) === String(value) ? ' lev-dd-option--active' : ''}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(opt.value);
                    close();
                  }}
                >
                  {opt.symbol != null && (
                    <span className="lev-dd-option__logo">
                      <TokenLogo symbol={opt.symbol} size="sm" aria-hidden />
                    </span>
                  )}
                  <span className="lev-dd-option__label">{opt.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {open && !useDomainTabs && (
          <ul
            className={`lev-dd-list${useGroups ? ' lev-dd-list--grouped' : ''}`}
            role="listbox"
            aria-label={ariaLabel || label}
          >
            {useGroups
              ? groups.flatMap((g) => [
                  <li key={`h-${g.groupLabel}`} className="lev-dd-group-label" role="presentation">
                    {g.groupLabel}
                  </li>,
                  ...(g.options || []).map((opt) => (
                    <li
                      key={String(opt.value)}
                      role="option"
                      aria-selected={String(opt.value) === String(value)}
                      className={`lev-dd-option${String(opt.value) === String(value) ? ' lev-dd-option--active' : ''}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onChange(opt.value);
                        close();
                      }}
                    >
                      {opt.symbol != null && (
                        <span className="lev-dd-option__logo">
                          <TokenLogo symbol={opt.symbol} size="sm" aria-hidden />
                        </span>
                      )}
                      <span className="lev-dd-option__label">{opt.label}</span>
                    </li>
                  )),
                ])
              : options.map((opt) => (
                  <li
                    key={String(opt.value)}
                    role="option"
                    aria-selected={String(opt.value) === String(value)}
                    className={`lev-dd-option${String(opt.value) === String(value) ? ' lev-dd-option--active' : ''}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange(opt.value);
                      close();
                    }}
                  >
                    {opt.symbol != null && (
                      <span className="lev-dd-option__logo">
                        <TokenLogo symbol={opt.symbol} size="sm" aria-hidden />
                      </span>
                    )}
                    <span className="lev-dd-option__label">{opt.label}</span>
                  </li>
                ))}
          </ul>
        )}
      </div>
    </div>
  );
}
