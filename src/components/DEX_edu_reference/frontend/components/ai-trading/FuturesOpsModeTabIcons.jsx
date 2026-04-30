/**
 * Iconițe SVG pentru switcher SHORT / LONG pe Futures Ops (animații CSS în trade-cost-analytics.css).
 */
import React, { useId } from 'react';

/** @param {{ active?: boolean; size?: number; className?: string }} props */
export function FuturesOpsShortTabIcon({ active = false, size = 46, className = '' }) {
  const id = useId().replace(/:/g, '');
  const gid = `fo-sh-${id}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`futures-ops-tab-icon futures-ops-tab-icon--short ${active ? 'is-active' : ''} ${className}`.trim()}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${gid}-stroke`} x1="8" y1="12" x2="48" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fca5a5" />
          <stop offset="1" stopColor="#f87171" />
        </linearGradient>
        <linearGradient id={`${gid}-glow`} x1="28" y1="8" x2="28" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f87171" stopOpacity="0.35" />
          <stop offset="1" stopColor="#f87171" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="28" cy="28" r="25" className="futures-ops-tab-icon__glow futures-ops-tab-icon__glow--short" fill={`url(#${gid}-glow)`} />
      <circle cx="28" cy="28" r="22" className="futures-ops-tab-icon__ring futures-ops-tab-icon__ring--short" />
      <g className="futures-ops-tab-icon__motion futures-ops-tab-icon__motion--short">
        <path
          className="futures-ops-tab-icon__path futures-ops-tab-icon__path--short"
          d="M13 16 L22 26 L29 20 L36 30 L43 24"
          stroke={`url(#${gid}-stroke)`}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="futures-ops-tab-icon__arrow futures-ops-tab-icon__arrow--short"
          d="M38 24 L43 29 L48 24"
          stroke={`url(#${gid}-stroke)`}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </svg>
  );
}

/** @param {{ active?: boolean; size?: number; className?: string }} props */
export function FuturesOpsLongTabIcon({ active = false, size = 46, className = '' }) {
  const id = useId().replace(/:/g, '');
  const gid = `fo-lg-${id}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`futures-ops-tab-icon futures-ops-tab-icon--long ${active ? 'is-active' : ''} ${className}`.trim()}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${gid}-stroke`} x1="8" y1="44" x2="48" y2="12" gradientUnits="userSpaceOnUse">
          <stop stopColor="#86efac" />
          <stop offset="1" stopColor="#22c55e" />
        </linearGradient>
        <linearGradient id={`${gid}-glow`} x1="28" y1="48" x2="28" y2="8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4ade80" stopOpacity="0.35" />
          <stop offset="1" stopColor="#22c55e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="28" cy="28" r="25" className="futures-ops-tab-icon__glow futures-ops-tab-icon__glow--long" fill={`url(#${gid}-glow)`} />
      <circle cx="28" cy="28" r="22" className="futures-ops-tab-icon__ring futures-ops-tab-icon__ring--long" />
      <g className="futures-ops-tab-icon__motion futures-ops-tab-icon__motion--long">
        <path
          className="futures-ops-tab-icon__path futures-ops-tab-icon__path--long"
          d="M13 38 L22 28 L29 34 L36 24 L43 30"
          stroke={`url(#${gid}-stroke)`}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="futures-ops-tab-icon__arrow futures-ops-tab-icon__arrow--long"
          d="M38 17 L43 12 L48 17"
          stroke={`url(#${gid}-stroke)`}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </svg>
  );
}

/** Hold — bare „pause” + nod pulsat (stil „AI gate”). currentColor. */
export function FuturesOpsHoldAiGlyph({ size = 14, className = '', style = undefined }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`sop-ai-glyph sop-ai-glyph--hold ${className}`.trim()}
      style={style}
      aria-hidden
    >
      <circle className="sop-ai-glyph__hold-orbit" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 3" opacity="0.35" />
      <rect className="sop-ai-glyph__hold-bar sop-ai-glyph__hold-bar--l" x="6" y="7" width="3.5" height="10" rx="1" fill="currentColor" />
      <rect className="sop-ai-glyph__hold-bar sop-ai-glyph__hold-bar--r" x="14.5" y="7" width="3.5" height="10" rx="1" fill="currentColor" />
      <circle className="sop-ai-glyph__hold-node" cx="12" cy="4.5" r="1.25" fill="currentColor" />
    </svg>
  );
}

/** Start — triunghi play + scântei animate. currentColor. */
export function FuturesOpsStartAiGlyph({ size = 14, className = '', style = undefined }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`sop-ai-glyph sop-ai-glyph--start ${className}`.trim()}
      style={style}
      aria-hidden
    >
      <path
        className="sop-ai-glyph__start-ray sop-ai-glyph__start-ray--a"
        d="M19.5 5.5l0.6 1.8M21.5 8.2l-1.9 0.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        className="sop-ai-glyph__start-ray sop-ai-glyph__start-ray--b"
        d="M4.5 6.5l1.2 1.2M3.5 10l2-0.8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.65"
      />
      <path
        className="sop-ai-glyph__start-play"
        d="M9.5 7.5L16.5 12 9.5 16.5z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.18"
      />
    </svg>
  );
}

/** Token block — scut + contur pulsant. currentColor. */
export function FuturesOpsBlockAiGlyph({ size = 14, className = '', style = undefined }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`sop-ai-glyph sop-ai-glyph--block ${className}`.trim()}
      style={style}
      aria-hidden
    >
      <path
        className="sop-ai-glyph__block-shield"
        d="M12 3.5l7 3.2v6.4c0 4.1-3 7.9-7 8.9-4-1-7-4.8-7-8.9V6.7l7-3.2z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path
        className="sop-ai-glyph__block-scan"
        d="M8 12h8M9.5 15h5"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

/** Glyph listă + bifă pentru allowlist; linii + check animate. currentColor. */
export function FuturesOpsAllowlistGlyph({ size = 14, className = '', style = undefined }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`sop-ai-glyph sop-ai-glyph--allowlist ${className}`.trim()}
      style={style}
      aria-hidden
    >
      <path
        className="sop-ai-glyph__allow-line sop-ai-glyph__allow-line--1"
        d="M4 7.5h10"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        className="sop-ai-glyph__allow-line sop-ai-glyph__allow-line--2"
        d="M4 12h7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        className="sop-ai-glyph__allow-line sop-ai-glyph__allow-line--3"
        d="M4 16.5h9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        className="sop-ai-glyph__allow-check"
        d="M16.5 14.5l2 2L22 11"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
