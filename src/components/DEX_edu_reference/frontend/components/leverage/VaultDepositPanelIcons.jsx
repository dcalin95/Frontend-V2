/**
 * Fund account (USD / EUR) – iconițe 3D, stil 2026.
 * SVG cu gradient pentru volum și umbră pentru depth.
 */
import React from 'react';

const iconSize = 20;
const tabIconSize = 16;

/** Wallet / vault – icon titlu, 3D */
export function IconWallet3D({ size = iconSize, className = '' }) {
  return (
    <span className={`vault-deposit-panel-icon-3d vault-deposit-panel-icon-title ${className}`} aria-hidden>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="vault-wallet-top" x1="12" y1="2" x2="12" y2="8" gradientUnits="userSpaceOnUse">
            <stop stopColor="currentColor" stopOpacity="1" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="vault-wallet-body" x1="12" y1="8" x2="12" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="currentColor" stopOpacity="0.9" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.4" />
          </linearGradient>
          <filter id="vault-shadow-3d" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodOpacity="0.35" />
            <feDropShadow dx="0" dy="1" stdDeviation="0.5" floodOpacity="0.2" />
          </filter>
        </defs>
        <path
          d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"
          fill="url(#vault-wallet-body)"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#vault-shadow-3d)"
        />
        <path
          d="M17 12h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2"
          fill="url(#vault-wallet-top)"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M3 10h18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
      </svg>
    </span>
  );
}

/** Deposit – săgeată în jos în cerc, 3D */
export function IconDeposit3D({ size = tabIconSize, className = '' }) {
  return (
    <span className={`vault-deposit-panel-icon-3d vault-deposit-panel-icon-tab ${className}`} aria-hidden>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="vault-dep-circle" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="currentColor" stopOpacity="0.95" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.5" />
          </linearGradient>
          <filter id="vault-tab-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodOpacity="0.3" />
          </filter>
        </defs>
        <circle cx="12" cy="12" r="10" fill="url(#vault-dep-circle)" stroke="currentColor" strokeWidth="1.2" filter="url(#vault-tab-shadow)" />
        <path d="M12 8v8m0 0l-4-4m4 4l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
      </svg>
    </span>
  );
}

/** Withdraw – săgeată în sus în cerc, 3D */
export function IconWithdraw3D({ size = tabIconSize, className = '' }) {
  return (
    <span className={`vault-deposit-panel-icon-3d vault-deposit-panel-icon-tab ${className}`} aria-hidden>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="vault-wd-circle" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="currentColor" stopOpacity="0.95" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.5" />
          </linearGradient>
          <filter id="vault-wd-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodOpacity="0.3" />
          </filter>
        </defs>
        <circle cx="12" cy="12" r="10" fill="url(#vault-wd-circle)" stroke="currentColor" strokeWidth="1.2" filter="url(#vault-wd-shadow)" />
        <path d="M12 16V8m0 0l-4 4m4-4l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
      </svg>
    </span>
  );
}

/** Card (Stripe) – card 3D */
export function IconCard3D({ size = tabIconSize, className = '' }) {
  return (
    <span className={`vault-deposit-panel-icon-3d vault-deposit-panel-icon-tab ${className}`} aria-hidden>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="vault-card-face" x1="12" y1="4" x2="12" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="currentColor" stopOpacity="0.9" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.45" />
          </linearGradient>
          <filter id="vault-card-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="1" floodOpacity="0.3" />
          </filter>
        </defs>
        <rect x="2" y="5" width="20" height="14" rx="2.5" fill="url(#vault-card-face)" stroke="currentColor" strokeWidth="1.2" filter="url(#vault-card-shadow)" />
        <path d="M2 10h20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
      </svg>
    </span>
  );
}

/** To bank – clădire 3D */
export function IconBank3D({ size = tabIconSize, className = '' }) {
  return (
    <span className={`vault-deposit-panel-icon-3d vault-deposit-panel-icon-tab ${className}`} aria-hidden>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="vault-bank-roof" x1="12" y1="2" x2="12" y2="10" gradientUnits="userSpaceOnUse">
            <stop stopColor="currentColor" stopOpacity="1" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="vault-bank-body" x1="12" y1="10" x2="12" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="currentColor" stopOpacity="0.85" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.4" />
          </linearGradient>
          <filter id="vault-bank-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="1" floodOpacity="0.3" />
          </filter>
        </defs>
        <path d="M12 2L2 9v13h5v-8h10v8h5V9L12 2z" fill="url(#vault-bank-body)" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" filter="url(#vault-bank-shadow)" />
        <path d="M12 2L2 9h20L12 2z" fill="url(#vault-bank-roof)" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
