/**
 * TokenSelector.sei.jsx – Selector token SEI (Oxium-style).
 * Tokeni: SEI, USDC, USDT, WETH, ATOM, SOL cu iconițe.
 * Logo sizes aliniate cu SOL/STX: 24px buton, 20px listă.
 */

import React, { useState, useRef, useEffect } from 'react';
import TokenLogo from '../frontend/components/common/TokenLogo';
import { SEI_PAIRS, SEI_TOKENS } from './seiTokenConfig';

const LOGO_SIZE_BUTTON = 'md';   /* 24px – aliniat cu SOL (22), STX (22) */
const LOGO_SIZE_LIST = 'sm';     /* 20px – aliniat cu SOL/STX listă */

export default function TokenSelectorSei({ value, onChange, label = 'Select pair', variant = 'pair', customList }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const list = customList
    ? customList.map(p => ({ id: p.id, symbol: p.base, label: p.label, base: p.base, quote: p.quote }))
    : variant === 'token'
      ? [...SEI_TOKENS].sort((a, b) => (a.displayOrder ?? 9) - (b.displayOrder ?? 9)).map((t) => ({ id: t.symbol, symbol: t.symbol, label: t.name }))
      : [...SEI_PAIRS].sort((a, b) => (a.displayOrder ?? 9) - (b.displayOrder ?? 9));

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

  const logoSize = (inList) => (inList ? LOGO_SIZE_LIST : LOGO_SIZE_BUTTON);
  const pairClass = (inList) => `token-logo-pair token-logo-pair-${inList ? 'sm' : 'md'}`;

  const renderLabel = (item, inList = false) => {
    const sz = logoSize(inList);
    if (variant === 'token') {
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TokenLogo symbol={item.symbol || item.id} size={sz} showBorder />
          <span>{item.label}</span>
        </span>
      );
    }
    /* Pereche: logouri fără distanță (overlap ca STX) – token-logo-pair */
    const base = item.base || item.id?.split('/')[0];
    const quote = item.quote || item.id?.split('/')[1];
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className={pairClass(inList)}>
          <TokenLogo symbol={base} size={sz} showBorder />
          <TokenLogo symbol={quote} size={sz} showBorder />
        </span>
        <span>{item.label}</span>
      </span>
    );
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '5px 8px',
          borderRadius: '8px',
          border: '1px solid var(--ds-border-color, #27272a)',
          background: 'rgba(255,255,255,0.04)',
          color: 'var(--ds-text-primary, #e2e8f0)',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 600,
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {renderLabel(selected)}
        <span style={{ opacity: 0.7 }}>▼</span>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={label}
          id={`sei-token-list-${variant}`}
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            left: 'auto',
            marginTop: '6px',
            padding: '4px 0',
            minWidth: '160px',
            maxHeight: '260px',
            overflowY: 'auto',
            background: '#0d0d0d',
            border: '1px solid #2a2a2a',
            color: 'var(--ds-text-primary, #e2e8f0)',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
            listStyle: 'none',
            zIndex: 9999,
            whiteSpace: 'nowrap',
          }}
        >
          {list.map((t) => (
            <li key={t.id} role="option" aria-selected={value === t.id || value === t.symbol}>
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
                  background: value === t.id ? 'rgba(124, 58, 237, 0.12)' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: value === t.id ? 'var(--ds-accent)' : 'inherit',
                }}
              >
                {renderLabel(t, true)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
