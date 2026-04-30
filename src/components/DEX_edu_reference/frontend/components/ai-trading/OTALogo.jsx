/**
 * OTALogo – OpenAI Trading Agent (OTA AI) logo.
 * Sizes: xs, sm, md, lg, xl. Options: showBorder, showGlow.
 * animated: when true (OpenAI API connected), SVG runs connected-state animation.
 * @module OTALogo
 */

import React, { useMemo } from 'react';
import '../../styles/components/ota-logo.css';

/**
 * OTA Logo SVG – neural-style design; supports animated state (connected).
 */
const OpenAILogoSVG = React.memo(({ size = 24, className = '', animated = false }) => {
  const gradientId = useMemo(() => `ota-gradient-${size}-${animated ? 'on' : 'off'}`, [size, animated]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`ota-logo-svg ${animated ? 'ota-logo-svg-animated' : ''} ${className}`}
      aria-label="OTA AI – OpenAI Trading Agent Logo"
      role="img"
      shapeRendering="geometricPrecision"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#d1d5db" />
          <stop offset="100%" stopColor="#9ca3af" />
        </linearGradient>
        <filter id="ota-logo-glow">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle
        cx="18"
        cy="18"
        r="4"
        fill="#ff0000"
        className="ota-logo-center"
        style={{
          filter: 'drop-shadow(0 0 6px rgba(255, 0, 0, 0.9))',
          stroke: '#ffffff',
          strokeWidth: '0.5'
        }}
      />

      <g className="ota-logo-neural" stroke={`url(#${gradientId})`} strokeWidth="2" fill="none" strokeLinecap="round">
        <line x1="18" y1="14" x2="18" y2="9" />
        <line x1="18" y1="22" x2="18" y2="27" />
        <line x1="14" y1="18" x2="9" y2="18" />
        <line x1="22" y1="18" x2="27" y2="18" />
      </g>

      <g className="ota-logo-nodes" fill={`url(#${gradientId})`}>
        <circle cx="18" cy="9" r="2.5" />
        <circle cx="18" cy="27" r="2.5" />
        <circle cx="9" cy="18" r="2.5" />
        <circle cx="27" cy="18" r="2.5" />
      </g>
    </svg>
  );
});

OpenAILogoSVG.displayName = 'OpenAILogoSVG';

/**
 * OTALogo – Renders OTA AI logo. animated=true when OpenAI API is connected (logo runs SVG animation).
 */
const OTALogo = React.memo(({
  size = 'md',
  showBorder = false,
  showGlow = false,
  animated = false,
  className = ''
}) => {
  const sizeMap = useMemo(() => ({
    xs: '1.35em',
    sm: '1.5em',
    md: '1.75em',
    lg: '2.1em',
    xl: '2.6em'
  }), []);

  const proportionalSize = useMemo(() => sizeMap[size] || sizeMap.md, [size, sizeMap]);

  const classNames = useMemo(() => {
    const classes = ['ota-logo', `ota-logo-${size}`, className];
    if (showBorder) classes.push('ota-logo-border');
    if (showGlow) classes.push('ota-logo-glow');
    if (animated) classes.push('ota-logo-animated');
    return classes.filter(Boolean).join(' ');
  }, [className, showBorder, showGlow, size, animated]);

  return (
    <div
      className={classNames}
      style={{
        '--ota-logo-size': proportionalSize,
        width: proportionalSize,
        height: proportionalSize
      }}
      aria-label="OTA AI Logo"
      role="img"
    >
      <OpenAILogoSVG size={24} className="ota-logo-svg-proportional" animated={animated} />
    </div>
  );
});

OTALogo.displayName = 'OTALogo';

export default OTALogo;
