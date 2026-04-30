/**
 * Etichetă vizibilă: analiza afișată aparține serviciului LONG sau SHORT (Futures Ops).
 * Arată și `tradeContext` din rândul API când există `sig` (dovadă pe card).
 */

import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { normalizedTradeContext } from '../../utils/otaFuturesSignalContext';

/**
 * @param {{
 *   lane: 'long' | 'short',
 *   sig?: object | null,
 *   compact?: boolean,
 *   variant?: 'inline' | 'section',
 * }} props
 */
export default function OtaFuturesAnalysisServiceRibbon({ lane, sig, compact = false, variant = 'inline' }) {
  const isLong = lane === 'long';
  const isSection = variant === 'section';
  const tcRaw = sig ? normalizedTradeContext(sig) : '';
  const tc = tcRaw || '—';
  const accent = isLong ? '#4ade80' : '#f87171';
  const bg = isLong ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.12)';
  const borderTint = isLong ? 'rgba(74, 222, 128, 0.35)' : 'rgba(248, 113, 113, 0.38)';
  const label = isLong ? 'LONG scope' : 'SHORT scope';
  const title = isLong
    ? 'Signal History for LONG futures policies and execution — not the SHORT feed.'
    : 'Signal History for SHORT futures policies and execution — not the LONG feed.';

  const sectionBlurb = isLong
    ? 'Rows in this list belong to the LONG lane (long_spot · long_focus). They are not mixed with SHORT-only history.'
    : 'Rows in this list belong to the SHORT lane (short_live · short_focus). They are not mixed with LONG-only history.';

  const Icon = isLong ? TrendingUp : TrendingDown;
  const iconSize = isSection ? 22 : compact ? 14 : 16;

  if (isSection) {
    return (
      <div
        role="region"
        aria-label={label}
        title={title}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          marginBottom: 12,
          padding: '12px 14px',
          borderRadius: 10,
          border: `1px solid ${borderTint}`,
          borderLeft: `4px solid ${accent}`,
          background: bg,
          boxShadow: isLong ? '0 0 24px rgba(74, 222, 128, 0.06)' : '0 0 24px rgba(248, 113, 113, 0.07)',
        }}
      >
        <div
          style={{
            flexShrink: 0,
            width: 40,
            height: 40,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isLong ? 'rgba(74, 222, 128, 0.18)' : 'rgba(248, 113, 113, 0.2)',
            color: accent,
          }}
          aria-hidden
        >
          <Icon size={iconSize} strokeWidth={2.25} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 0.4,
              color: accent,
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            {label}
          </div>
          <div style={{ fontSize: 12, color: '#d4d4d8', lineHeight: 1.45, fontWeight: 500 }}>
            {sectionBlurb}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      title={title}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: compact ? 6 : 8,
        marginBottom: compact ? 6 : 8,
        padding: compact ? '6px 10px' : '8px 12px',
        borderRadius: 8,
        border: `1px solid ${borderTint}`,
        borderLeft: `3px solid ${accent}`,
        background: bg,
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: compact ? 10 : 11,
          fontWeight: 800,
          letterSpacing: 0.45,
          color: accent,
          textTransform: 'uppercase',
        }}
      >
        <Icon size={iconSize} strokeWidth={2.2} aria-hidden />
        {label}
      </span>
      <span
        style={{
          fontSize: compact ? 9 : 10,
          color: '#a1a1aa',
          fontWeight: 600,
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        tradeContext (technical): <span style={{ color: '#e4e4e7' }}>{tc}</span>
      </span>
    </div>
  );
}

/** Pill pentru tabele (decizii executor): același limbaj vizual ca ribbon-ul de analiză. */
export function OtaFuturesLaneTableBadge({ lane }) {
  const isLong = lane === 'long';
  const accent = isLong ? '#4ade80' : '#f87171';
  const bg = isLong ? 'rgba(74, 222, 128, 0.16)' : 'rgba(248, 113, 113, 0.18)';
  const border = isLong ? 'rgba(74, 222, 128, 0.4)' : 'rgba(248, 113, 113, 0.42)';
  const label = isLong ? 'LONG' : 'SHORT';
  const title = isLong
    ? 'Decision from the LONG executor lane.'
    : 'Decision from the SHORT executor lane.';
  return (
    <span
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 52,
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: 0.5,
        color: accent,
        background: bg,
        border: `1px solid ${border}`,
      }}
    >
      {label}
    </span>
  );
}
