/**
 * Iconițe SVG pentru acțiunile Auto Trade / LLM — animate ușor (CSS în auto-trade-panel.css).
 * Respectă prefers-reduced-motion.
 */
import React from 'react';

export function AutotradeIconStop({ size = 22 }) {
  return (
    <svg
      className="atp-action-ico atp-action-ico--stop"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
    >
      <rect
        className="atp-action-ico__stop-ring"
        x="2.5"
        y="2.5"
        width="19"
        height="19"
        rx="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.65"
      />
      <rect className="atp-action-ico__stop-core" x="8" y="8" width="8" height="8" rx="2" fill="currentColor" />
    </svg>
  );
}

export function AutotradeIconStart({ size = 22 }) {
  return (
    <svg className="atp-action-ico atp-action-ico--start" width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle
        className="atp-action-ico__start-halo"
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        opacity="0.4"
      />
      <path className="atp-action-ico__start-play" d="M10.25 8.25 L16.75 12 L10.25 15.75 Z" fill="currentColor" />
    </svg>
  );
}

/**
 * @param {'openai' | 'anthropic'} accent
 */
export function AutotradeIconLlmPause({ accent = 'openai', size = 20 }) {
  return (
    <svg
      className={`atp-action-ico atp-action-ico--llm-pause atp-action-ico--accent-${accent}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
    >
      <rect className="atp-action-ico__pause-bar atp-action-ico__pause-bar--l" x="7" y="6" width="3.5" height="12" rx="1" fill="currentColor" />
      <rect className="atp-action-ico__pause-bar atp-action-ico__pause-bar--r" x="13.5" y="6" width="3.5" height="12" rx="1" fill="currentColor" />
    </svg>
  );
}

/**
 * @param {'openai' | 'anthropic'} accent
 */
export function AutotradeIconLlmResume({ accent = 'openai', size = 20 }) {
  return (
    <svg
      className={`atp-action-ico atp-action-ico--llm-resume atp-action-ico--accent-${accent}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        className="atp-action-ico__resume-ring"
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.35"
      />
      <path className="atp-action-ico__resume-play" d="M10 7.75 L10 16.25 L17 12 Z" fill="currentColor" />
    </svg>
  );
}
