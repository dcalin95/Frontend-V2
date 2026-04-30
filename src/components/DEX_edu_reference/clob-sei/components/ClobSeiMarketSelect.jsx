/**
 * ClobSeiMarketSelect – Pair selector for CLOB SEI.
 * Same look as Trade/SEI TokenSelectorSei: single-line button, same padding/size/dropdown.
 */
import React, { useState, useRef, useEffect } from 'react';
import TokenLogo from '../../frontend/components/common/TokenLogo';

const LOGO_SIZE_BUTTON = 'md';
const LOGO_SIZE_LIST = 'sm';

export default function ClobSeiMarketSelect({ value, onChange, markets, label = 'Select trading pair' }) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const ref = useRef(null);
  const listRef = useRef(null);

  const list = markets || [];
  const selected = list.find((m) => m.id === value) || list[0];
  const selectedIndex = list.findIndex((m) => m.id === value);
  useEffect(() => {
    if (selectedIndex >= 0) setHighlightedIndex(selectedIndex);
  }, [selectedIndex, value]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (!open) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((i) => (i + 1) % list.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((i) => (i - 1 + list.length) % list.length);
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const m = list[highlightedIndex];
        if (m) {
          onChange?.(m.id);
          setOpen(false);
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, list, highlightedIndex, onChange]);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  useEffect(() => {
    if (open && listRef.current) {
      const el = listRef.current.querySelector(`[data-index="${highlightedIndex}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, highlightedIndex]);

  const pairClass = (inList) => `token-logo-pair token-logo-pair-${inList ? 'sm' : 'md'}`;
  const renderOption = (m, inList = false) => (
    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span className={pairClass(inList)}>
        <TokenLogo symbol={m.base} size={inList ? LOGO_SIZE_LIST : LOGO_SIZE_BUTTON} showBorder />
        <TokenLogo symbol={m.quote} size={inList ? LOGO_SIZE_LIST : LOGO_SIZE_BUTTON} showBorder />
      </span>
      <span>{m.base} / {m.quote}</span>
    </span>
  );

  if (!list.length) return null;

  return (
    <div ref={ref} className="clob-sei-market-select clob-sei-market-select--compact">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="clob-sei-market-select-trigger"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-describedby={open ? 'clob-sei-market-list' : undefined}
      >
        {selected && renderOption(selected, false)}
        <span style={{ opacity: 0.7 }}>▼</span>
      </button>
      {open && (
        <ul
          ref={listRef}
          id="clob-sei-market-list"
          role="listbox"
          aria-label={label}
          className="clob-sei-market-select-list"
        >
          {list.map((m, i) => (
            <li key={m.id} role="option" aria-selected={value === m.id} data-index={i}>
              <button
                type="button"
                className={`clob-sei-market-select-item ${value === m.id ? 'selected' : ''} ${i === highlightedIndex ? 'highlighted' : ''}`}
                onClick={() => {
                  onChange?.(m.id);
                  setOpen(false);
                }}
                onMouseEnter={() => setHighlightedIndex(i)}
              >
                {renderOption(m, true)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
