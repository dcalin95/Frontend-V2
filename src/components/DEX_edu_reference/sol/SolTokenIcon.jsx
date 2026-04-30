/**
 * SolTokenIcon.jsx – Logo token SOL cu fallback la inițială când URL lipsește sau eșuează.
 * SSOT: solTokenConfig.getTokenIcon; folosit în TokenSelector, Header, SolSwapPage, WalletConnector.
 */

import React, { useState } from 'react';
import { getTokenIcon, getTokenIconAlt, SOL_PAIRS } from './solTokenConfig';

const DEFAULT_SIZE = 24;

export default function SolTokenIcon({ symbol, size = DEFAULT_SIZE, style = {} }) {
  const primarySrc = getTokenIcon(symbol);
  const altSrc = getTokenIconAlt(symbol);
  const [triedAlt, setTriedAlt] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const src = !triedAlt ? (primarySrc || altSrc) : (altSrc || primarySrc);
  const showImg = src && !loadFailed;
  const letter = symbol && symbol.length ? symbol[0].toUpperCase() : '?';

  const handleError = () => {
    if (primarySrc && altSrc && !triedAlt) setTriedAlt(true);
    else setLoadFailed(true);
  };

  if (showImg) {
    return (
      <img
        key={triedAlt ? 'alt' : 'primary'}
        src={src}
        alt=""
        width={size}
        height={size}
        style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0, ...style }}
        loading="lazy"
        onError={handleError}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={symbol ? `Token ${symbol}` : 'Token'}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: '50%',
        background: 'var(--ds-bg-subtle, #27272a)',
        color: 'var(--ds-text-secondary, #a1a1aa)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.max(10, size * 0.5),
        fontWeight: 600,
        flexShrink: 0,
        ...style,
      }}
    >
      {letter}
    </span>
  );
}

/** Pereche de iconițe base/quote cu fallback; pairId ex: 'SOL/USDC'. */
export function SolPairIcons({ pairId, size = DEFAULT_SIZE, style = {} }) {
  const pair = SOL_PAIRS.find((p) => p.id === pairId);
  if (!pair) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, ...style }}>
        <SolTokenIcon symbol="?" size={size} />
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, ...style }}>
      <SolTokenIcon symbol={pair.base} size={size} />
      <SolTokenIcon symbol={pair.quote} size={size} style={{ marginLeft: -4 }} />
    </span>
  );
}
