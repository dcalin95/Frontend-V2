/**
 * Iconiță SVG compactă „AI inteligent” (chip + noduri + scântei) — culoare din `currentColor`.
 */
import React from 'react';

export default function FuturesOpsAiIntelGlyph({ size = 15, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="3.5"
        y="7"
        width="13"
        height="10"
        rx="2.2"
        stroke="currentColor"
        strokeWidth="1.35"
      />
      <path
        d="M7 11h6M7 14h4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="16.5" cy="10" r="1.35" fill="currentColor" />
      <circle cx="19.5" cy="14" r="1.1" fill="currentColor" opacity="0.55" />
      <path
        d="M16.5 11.5v3M15 14.5l1.5 1M18 14.5l1.5 1"
        stroke="currentColor"
        strokeWidth="0.95"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M20.2 5.5l.6-1.2M21.8 6.1l-1.2.45"
        stroke="currentColor"
        strokeWidth="0.85"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  );
}
