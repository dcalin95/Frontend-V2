/**
 * StxTokenIcon.jsx – Logo token STX cu fallback la inițială când URL lipsește sau eșuează.
 * SSOT: stxTokenConfig.getTokenIcon; folosit în TokenSelector.stx, Header, Swap STX.
 */

import React, { useState } from 'react';
import { getTokenIcon, getTokenIconAlt, STX_PAIRS } from './stxTokenConfig';

const DEFAULT_SIZE = 24;

export default function StxTokenIcon({ symbol, size = DEFAULT_SIZE, style = {} }) {
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

/** Pereche de iconițe base/quote cu fallback; pairId ex: 'STX/USDA'. */
export function StxPairIcons({ pairId, size = DEFAULT_SIZE, style = {} }) {
  const pair = STX_PAIRS.find((p) => p.id === pairId);
  if (!pair) {
    return (
      <span
        style={{
          width: size * 2,
          height: size,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: Math.max(10, size * 0.4),
          color: 'var(--ds-text-secondary, #a1a1aa)',
          ...style,
        }}
      >
        ?
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, ...style }}>
      <StxTokenIcon symbol={pair.base} size={size} />
      <StxTokenIcon symbol={pair.quote} size={size} style={{ marginLeft: -size * 0.3 }} />
    </span>
  );
}
