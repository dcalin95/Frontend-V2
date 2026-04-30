/**
 * TokenSelector.sol.jsx – Selector token/perechi Solana cu logo-uri.
 * Folosește solTokenConfig (SOL_PAIRS, SOL_TOKENS, getTokenIcon, getPairIcons).
 */

import React, { useState, useRef, useEffect } from 'react';
import { SOL_PAIRS, SOL_TOKENS } from './solTokenConfig';
import SolTokenIcon, { SolPairIcons } from './SolTokenIcon';

const ICON_SIZE = 22;
const ICON_SIZE_LIST = 20;

export default function TokenSelectorSol({ value, onChange, label = 'Select', variant = 'pair' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const list = variant === 'token' ? SOL_TOKENS : SOL_PAIRS;
  const valueKey = variant === 'token' ? 'symbol' : 'id';

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const selected = list.find((t) => t[valueKey] === value || t.symbol === value) || list[0];
  const displayValue = selected[valueKey] ?? selected.symbol ?? value;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid var(--ds-border-color, #27272a)',
          background: 'var(--ds-bg-surface, #18181b)',
          color: 'var(--ds-text-primary, #e2e8f0)',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
        }}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {variant === 'pair' ? (
          <>
            <SolPairIcons pairId={displayValue} size={ICON_SIZE} />
            <span>{selected.label}</span>
          </>
        ) : (
          <>
            <SolTokenIcon symbol={displayValue} size={ICON_SIZE} />
            <span>{selected.symbol}</span>
          </>
        )}
        <span style={{ opacity: 0.7, marginLeft: 4 }}>▼</span>
      </button>
      {open && (
        <ul
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '4px',
            padding: '8px 0',
            minWidth: '180px',
            maxHeight: 320,
            overflowY: 'auto',
            background: 'var(--ds-bg-surface, #18181b)',
            border: '1px solid var(--ds-border-color, #27272a)',
            color: 'var(--ds-text-primary, #e2e8f0)',
            borderRadius: '8px',
            boxShadow: 'var(--ds-shadow-md, 0 4px 12px rgba(0,0,0,0.1))',
            listStyle: 'none',
            zIndex: 100,
          }}
        >
          {list.map((t) => {
            const id = t[valueKey] ?? t.symbol;
            const isSelected = id === value || t.symbol === value;
            return (
              <li key={id} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange?.(id);
                    setOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    textAlign: 'left',
                    border: 'none',
                    background: isSelected ? 'rgba(20, 241, 149, 0.12)' : 'transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: isSelected ? 'var(--ds-accent)' : 'inherit',
                  }}
                >
                  {variant === 'pair' ? (
                    <>
                      <SolPairIcons pairId={t.id} size={ICON_SIZE_LIST} />
                      <span>{t.label}</span>
                    </>
                  ) : (
                    <>
                      <SolTokenIcon symbol={t.symbol} size={ICON_SIZE_LIST} />
                      <span>{t.symbol}</span>
                      {t.name && t.name !== t.symbol && (
                        <span style={{ fontSize: 12, opacity: 0.7 }}>{t.name}</span>
                      )}
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
