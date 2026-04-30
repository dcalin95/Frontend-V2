/**
 * TokenSelector.stx.jsx – Selector token/perechi Stacks (SIP-010).
 * Folosește stxTokenConfig (STX_PAIRS_LIST, STX_TOKENS_SINGLE).
 */

import React, { useState, useRef, useEffect } from 'react';
import { STX_PAIRS_LIST, STX_TOKENS_SINGLE } from './stxTokenConfig';
import StxTokenIcon, { StxPairIcons } from './StxTokenIcon';

export default function TokenSelectorStx({ value, onChange, label = 'Select', variant = 'pair' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const list = variant === 'token' ? STX_TOKENS_SINGLE : STX_PAIRS_LIST;

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

  const selected = list.find((t) => t.id === value || t.symbol === value) || list[0];

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
          <StxPairIcons pairId={selected.id} size={22} />
        ) : (
          <StxTokenIcon symbol={selected.symbol || selected.id} size={22} />
        )}
        <span style={{ flex: 1, textAlign: 'left' }}>{selected.label}</span>
        <span style={{ opacity: 0.7 }}>▼</span>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={label}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '4px',
            padding: '8px 0',
            minWidth: '200px',
            maxHeight: '320px',
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
            const isSelected = t.id === value || t.symbol === value;
            return (
              <li key={t.id} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange?.(t.id);
                    setOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    textAlign: 'left',
                    border: 'none',
                    background: isSelected ? 'rgba(247, 147, 26, 0.12)' : 'transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: isSelected ? 'var(--ds-accent)' : 'inherit',
                  }}
                >
                  {variant === 'pair' ? (
                    <StxPairIcons pairId={t.id} size={20} />
                  ) : (
                    <StxTokenIcon symbol={t.symbol || t.id} size={20} />
                  )}
                  {t.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
