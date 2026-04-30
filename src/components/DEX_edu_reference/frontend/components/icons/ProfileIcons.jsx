/**
 * AI-style Profile Icons — modern, clean SVG icons
 * Unified stroke, rounded caps, minimalist aesthetic
 */

import React from 'react';

const iconProps = (size = 20) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
});

export const IconMail = ({ size = 20, className = '' }) => (
  <svg {...iconProps(size)} className={className}>
    <rect x="2" y="4" width="20" height="16" rx="2.5" />
    <path d="M22 6l-10 7L2 6" />
  </svg>
);

export const IconUser = ({ size = 20, className = '' }) => (
  <svg {...iconProps(size)} className={className}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c0-3.5 3.5-5 7-5s7 1.5 7 5" />
  </svg>
);

export const IconPhone = ({ size = 20, className = '' }) => (
  <svg {...iconProps(size)} className={className}>
    <path d="M20 16.5v3a2 2 0 01-2.2 2 16 16 0 01-7.1-2.5 16 16 0 01-5.7-5.7 16 16 0 01-2.5-7.1A2 2 0 014.5 4h3a2 2 0 012 1.7c.1.8.3 1.6.6 2.3" />
    <path d="M14.5 4.5a2 2 0 012 2v3" />
    <path d="M18.5 2.5a2 2 0 012 2" />
  </svg>
);

export const IconTelegram = ({ size = 20, className = '' }) => (
  <svg {...iconProps(size)} className={className}>
    <path d="M22 2L11 13" />
    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

export const IconCamera = ({ size = 20, className = '' }) => (
  <svg {...iconProps(size)} className={className}>
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <circle cx="12" cy="13" r="4" />
    <circle cx="12" cy="13" r="2" strokeWidth="1.2" />
  </svg>
);

export const IconEdit = ({ size = 20, className = '' }) => (
  <svg {...iconProps(size)} className={className}>
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.1 2.1 0 012.9 2.9L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export const IconCreditCard = ({ size = 20, className = '' }) => (
  <svg {...iconProps(size)} className={className}>
    <rect x="1" y="4" width="22" height="16" rx="2.5" />
    <path d="M1 10h22" strokeWidth="1.2" />
    <path d="M6 16h4" strokeWidth="1.2" />
  </svg>
);

export const IconLock = ({ size = 20, className = '' }) => (
  <svg {...iconProps(size)} className={className}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
    <circle cx="12" cy="16" r="1.5" strokeWidth="1.2" />
  </svg>
);

export const IconWallet = ({ size = 20, className = '' }) => (
  <svg {...iconProps(size)} className={className}>
    <path d="M21 12V7H5a2 2 0 010-4h14v4" />
    <path d="M3 5v14a2 2 0 002 2h16v-5" />
    <path d="M18 12a2 2 0 110 4 2 2 0 010-4z" />
  </svg>
);

export const IconCopy = ({ size = 20, className = '' }) => (
  <svg {...iconProps(size)} className={className}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);

export const IconCheckCircle = ({ size = 20, className = '' }) => (
  <svg {...iconProps(size)} className={className}>
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <path d="M22 4L12 14.01l-3-3" strokeWidth="1.8" />
  </svg>
);

export const IconXCircle = ({ size = 20, className = '' }) => (
  <svg {...iconProps(size)} className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M15 9l-6 6M9 9l6 6" strokeWidth="1.8" />
  </svg>
);

export const IconStar = ({ size = 20, className = '' }) => (
  <svg {...iconProps(size)} className={className}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export const IconTrash = ({ size = 20, className = '' }) => (
  <svg {...iconProps(size)} className={className}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" strokeWidth="1.2" />
    <line x1="14" y1="11" x2="14" y2="17" strokeWidth="1.2" />
  </svg>
);

export const IconFileCheck = ({ size = 20, className = '' }) => (
  <svg {...iconProps(size)} className={className}>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M9 15l2 2 4-4" strokeWidth="1.5" />
  </svg>
);

export const IconSettings = ({ size = 20, className = '' }) => (
  <svg {...iconProps(size)} className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);
