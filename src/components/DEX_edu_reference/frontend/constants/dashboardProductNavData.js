/**
 * Real dashboard routes and copy: no invented data, only navigation and product descriptions.
 * Icons are mapped in DashboardBentoNav by `iconId`.
 */

import {
  Wallet,
  Zap,
  TrendingUp,
  ArrowLeftRight,
  Radio,
  BarChart3,
  Hexagon,
  Sun,
  LayoutGrid,
  Globe2,
  Activity,
} from 'lucide-react';

export const DASHBOARD_ICON_MAP = {
  wallet: Wallet,
  zap: Zap,
  trade: TrendingUp,
  swap: ArrowLeftRight,
  signals: Radio,
  leverage: BarChart3,
  stx: Hexagon,
  sol: Sun,
  grid: LayoutGrid,
  sei: Globe2,
  activity: Activity,
};

/** Main grid: compact tiles; bullets remain in data for tests, hidden in dense CSS. */
export const DASHBOARD_FEATURE_GRID_ITEMS = [
  {
    id: 'account',
    to: '/dex-edu/account',
    label: 'Personal account',
    tag: 'Vault',
    lead: 'Vault, crypto history, Stripe fiat.',
    bullets: ['Deposits / withdrawals', 'History (crypto)'],
    iconId: 'wallet',
  },
  {
    id: 'ota',
    to: '/dex-edu/ota',
    label: 'OTA AI',
    tag: 'Core',
    lead: 'Signals, Auto, policy, bot allowlist.',
    bullets: ['Analysis & signals', 'Auto execution'],
    iconId: 'zap',
  },
  {
    id: 'trade',
    to: '/dex-edu/trade',
    label: 'Trade',
    tag: 'Spot',
    lead: 'Order book, chart, EVM pairs.',
    bullets: ['Limit / market', 'Order book'],
    iconId: 'trade',
  },
  {
    id: 'swap',
    to: '/dex-edu/swap',
    label: 'Swap',
    tag: 'Liquidity',
    lead: 'Quote and route on the current wallet.',
    bullets: ['Slippage & route', 'OTA assisted'],
    iconId: 'swap',
  },
  {
    id: 'signals',
    to: '/dex-edu/signals',
    label: 'Signals',
    tag: 'Feed',
    lead: 'Signal feed, filters, OTA link.',
    bullets: ['History', 'OTA navigation'],
    iconId: 'signals',
  },
  {
    id: 'leverage',
    to: '/dex-edu/leverage',
    label: 'Leverage',
    tag: 'BSC',
    lead: 'CFD / leverage: markets configured on-chain.',
    bullets: ['Positions & collateral', 'Chain gate'],
    iconId: 'leverage',
  },
  {
    id: 'clob-sei',
    to: '/dex-edu/clob-sei',
    label: 'CLOB Sei',
    tag: 'Sei',
    lead: 'Mangrove order book on Sei.',
    bullets: ['Limit orders', 'Lifecycle'],
    iconId: 'grid',
  },
  {
    id: 'sei-trade',
    to: '/dex-edu/sei/trade',
    label: 'Sei trade',
    tag: 'Sei',
    lead: 'Sei trade & swap flow.',
    bullets: ['Pair', 'Wallet Sei'],
    iconId: 'sei',
  },
  {
    id: 'ota-sei',
    to: '/dex-edu/ota/sei',
    label: 'OTA Sei',
    tag: 'OTA',
    lead: 'OTA micro-profit and Sei flow.',
    bullets: ['Symphony', 'Sei context'],
    iconId: 'zap',
  },
  {
    id: 'ota-stx',
    to: '/dex-edu/ota/stx',
    label: 'OTA STX',
    tag: 'OTA',
    lead: 'OTA on Stacks.',
    bullets: ['STX context', 'OTA profile'],
    iconId: 'stx',
  },
  {
    id: 'stx-trade',
    to: '/dex-edu/stx/trade',
    label: 'Stacks trade',
    tag: 'STX',
    lead: 'Trade & swap on Stacks.',
    bullets: ['Pair & exec', 'Wallet STX'],
    iconId: 'stx',
  },
  {
    id: 'sol-trade',
    to: '/dex-edu/sol/trade',
    label: 'Solana trade',
    tag: 'SOL',
    lead: 'Trade & swap on Solana.',
    bullets: ['Pair & exec', 'Wallet Solana'],
    iconId: 'sol',
  },
];

/**
 * Grouped secondary links, without duplicating the main grid where possible.
 */
export const DASHBOARD_SECONDARY_LINK_GROUPS = [
  {
    id: 'trading',
    label: 'Trading & history',
    links: [
      { to: '/dex-edu/open-orders', label: 'Open orders' },
      { to: '/dex-edu/order-history', label: 'Order history' },
      { to: '/dex-edu/account/analytics', label: 'Trade cost analytics' },
      { to: '/dex-edu/sei/trade', label: 'Sei trade' },
    ],
  },
  {
    id: 'ota',
    label: 'OTA & futures',
    links: [
      { to: '/dex-edu/profile', label: 'OTA profile' },
      { to: '/dex-edu/ota/trade', label: 'OTA trade' },
      { to: '/dex-edu/ota/chat', label: 'OTA chat' },
      { to: '/dex-edu/ota/short-ops', label: 'Futures ops (Binance)' },
      { to: '/dex-edu/ota/logs', label: 'OTA logs' },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    links: [{ to: '/dex-edu/site-admin', label: 'Site admin' }],
  },
  {
    id: 'support',
    label: 'Support',
    links: [{ to: '/dex-edu/complaints', label: 'Complaints & feedback' }],
  },
];
