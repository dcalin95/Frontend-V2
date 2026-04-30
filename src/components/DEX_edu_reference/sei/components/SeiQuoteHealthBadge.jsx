/**
 * Compact operational status: exec fresh / stale / fallback / degraded.
 */

import React from 'react';
import { deriveSeiQuoteHealthState } from '../utils/seiQuoteHealthDerive';

export default function SeiQuoteHealthBadge({
  hasExecutionQuote,
  usedFallbackPrice,
  lastExecutionQuoteAt,
}) {
  const state = deriveSeiQuoteHealthState({
    hasExecutionQuote,
    usedFallbackPrice,
    lastExecutionQuoteAt,
  });
  return (
    <div
      className="ota-sei-quote-health"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 4,
        fontSize: 11,
      }}
      title={state.title}
    >
      {state.labels.map((label) => (
        <span
          key={label}
          style={{
            padding: '2px 8px',
            borderRadius: 4,
            fontWeight: 600,
            background: state.executionReady ? 'rgba(74,222,128,0.12)' : 'rgba(148,163,184,0.12)',
            color: state.executionReady ? '#86efac' : '#94a3b8',
            border: `1px solid ${state.executionReady ? 'rgba(74,222,128,0.25)' : 'rgba(148,163,184,0.2)'}`,
          }}
        >
          {label}
        </span>
      ))}
      {state.quoteAgeMs != null && state.executionReady && (
        <span style={{ color: '#64748b' }} title="Age of last execution quote">
          {Math.round(state.quoteAgeMs / 1000)}s
        </span>
      )}
    </div>
  );
}
