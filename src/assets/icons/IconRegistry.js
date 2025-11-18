/**
 * IconRegistry.js
 * 
 * Catalog central pentru toate iconițele SVG Solana AI
 * Fiecare iconiță are gradient verde-violet (#00FFA3 -> #9945FF)
 * și este optimizată pentru rezoluție înaltă (64x64 viewBox)
 */

// ============================================================================
// WALLET & PAYMENT ICONS (10)
// ============================================================================
export { ReactComponent as WalletConnectIcon } from './wallet-connect.svg';
export { ReactComponent as WalletDisconnectIcon } from './wallet-disconnect.svg';
export { ReactComponent as BalanceIcon } from './balance.svg';
export { ReactComponent as SendIcon } from './send.svg';
export { ReactComponent as ReceiveIcon } from './receive.svg';
export { ReactComponent as CreditCardIcon } from './credit-card.svg';
export { ReactComponent as CryptoCoinIcon } from './crypto-coin.svg';
export { ReactComponent as ExchangeIcon } from './exchange.svg';
export { ReactComponent as TransactionIcon } from './transaction.svg';
export { ReactComponent as FeeIcon } from './fee.svg';

// ============================================================================
// CRYPTO TOKENS ICONS (10)
// ============================================================================
export { ReactComponent as BitcoinIcon } from './bitcoin.svg';
export { ReactComponent as EthereumIcon } from './ethereum.svg';
export { ReactComponent as SolanaIcon } from './solana.svg';
export { ReactComponent as USDTIcon } from './usdt.svg';
export { ReactComponent as USDCIcon } from './usdc.svg';
export { ReactComponent as BNBIcon } from './bnb.svg';
export { ReactComponent as CardanoIcon } from './cardano.svg';
export { ReactComponent as PolygonIcon } from './polygon.svg';
export { ReactComponent as StacksIcon } from './stacks.svg';
export { ReactComponent as GenericTokenIcon } from './generic-token.svg';

// ============================================================================
// STAKING & REWARDS ICONS (8)
// ============================================================================
export { ReactComponent as StakeIcon } from './stake.svg';
export { ReactComponent as UnstakeIcon } from './unstake.svg';
export { ReactComponent as ClaimRewardsIcon } from './claim-rewards.svg';
export { ReactComponent as APRIcon } from './apr.svg';
export { ReactComponent as LockIcon } from './lock.svg';
export { ReactComponent as UnlockIcon } from './unlock.svg';
export { ReactComponent as TimerIcon } from './timer.svg';
export { ReactComponent as CalculatorIcon } from './calculator.svg';

// ============================================================================
// NAVIGATION & ACTIONS ICONS (12)
// ============================================================================
export { ReactComponent as HomeIcon } from './home.svg';
export { ReactComponent as MenuIcon } from './menu.svg';
export { ReactComponent as CloseIcon } from './close.svg';
export { ReactComponent as BackIcon } from './back.svg';
export { ReactComponent as ForwardIcon } from './forward.svg';
export { ReactComponent as RefreshIcon } from './refresh.svg';
export { ReactComponent as SettingsIcon } from './settings.svg';
export { ReactComponent as SearchIcon } from './search.svg';
export { ReactComponent as FilterIcon } from './filter.svg';
export { ReactComponent as DownloadIcon } from './download.svg';
export { ReactComponent as UploadIcon } from './upload.svg';
export { ReactComponent as ShareIcon } from './share.svg';

// ============================================================================
// STATUS & NOTIFICATIONS ICONS (8)
// ============================================================================
export { ReactComponent as SuccessIcon } from './success.svg';
export { ReactComponent as ErrorIcon } from './error.svg';
export { ReactComponent as WarningIcon } from './warning.svg';
export { ReactComponent as InfoIcon } from './info.svg';
export { ReactComponent as LoadingIcon } from './loading.svg';
export { ReactComponent as VerifiedIcon } from './verified.svg';
export { ReactComponent as PendingIcon } from './pending.svg';
export { ReactComponent as ExpiredIcon } from './expired.svg';

// ============================================================================
// SOCIAL & COMMUNICATION ICONS (6)
// ============================================================================
export { ReactComponent as TelegramIcon } from './telegram.svg';
export { ReactComponent as TwitterIcon } from './twitter.svg';
export { ReactComponent as DiscordIcon } from './discord.svg';
export { ReactComponent as LinkIcon } from './link.svg';
export { ReactComponent as CopyIcon } from './copy.svg';
export { ReactComponent as QRCodeIcon } from './qr-code.svg';

// ============================================================================
// UI ELEMENTS ICONS (6)
// ============================================================================
export { ReactComponent as ArrowUpIcon } from './arrow-up.svg';
export { ReactComponent as ArrowDownIcon } from './arrow-down.svg';
export { ReactComponent as ChevronLeftIcon } from './chevron-left.svg';
export { ReactComponent as ChevronRightIcon } from './chevron-right.svg';
export { ReactComponent as PlusIcon } from './plus.svg';
export { ReactComponent as MinusIcon } from './minus.svg';

// ============================================================================
// ICON MAPPING - pentru acces dinamic
// ============================================================================
export const ICON_MAP = {
  // Wallet & Payment
  'wallet-connect': 'WalletConnectIcon',
  'wallet-disconnect': 'WalletDisconnectIcon',
  'balance': 'BalanceIcon',
  'send': 'SendIcon',
  'receive': 'ReceiveIcon',
  'credit-card': 'CreditCardIcon',
  'crypto-coin': 'CryptoCoinIcon',
  'exchange': 'ExchangeIcon',
  'transaction': 'TransactionIcon',
  'fee': 'FeeIcon',
  
  // Crypto Tokens
  'bitcoin': 'BitcoinIcon',
  'ethereum': 'EthereumIcon',
  'solana': 'SolanaIcon',
  'usdt': 'USDTIcon',
  'usdc': 'USDCIcon',
  'bnb': 'BNBIcon',
  'cardano': 'CardanoIcon',
  'polygon': 'PolygonIcon',
  'stacks': 'StacksIcon',
  'generic-token': 'GenericTokenIcon',
  
  // Staking & Rewards
  'stake': 'StakeIcon',
  'unstake': 'UnstakeIcon',
  'claim-rewards': 'ClaimRewardsIcon',
  'apr': 'APRIcon',
  'lock': 'LockIcon',
  'unlock': 'UnlockIcon',
  'timer': 'TimerIcon',
  'calculator': 'CalculatorIcon',
  
  // Navigation & Actions
  'home': 'HomeIcon',
  'menu': 'MenuIcon',
  'close': 'CloseIcon',
  'back': 'BackIcon',
  'forward': 'ForwardIcon',
  'refresh': 'RefreshIcon',
  'settings': 'SettingsIcon',
  'search': 'SearchIcon',
  'filter': 'FilterIcon',
  'download': 'DownloadIcon',
  'upload': 'UploadIcon',
  'share': 'ShareIcon',
  
  // Status & Notifications
  'success': 'SuccessIcon',
  'error': 'ErrorIcon',
  'warning': 'WarningIcon',
  'info': 'InfoIcon',
  'loading': 'LoadingIcon',
  'verified': 'VerifiedIcon',
  'pending': 'PendingIcon',
  'expired': 'ExpiredIcon',
  
  // Social & Communication
  'telegram': 'TelegramIcon',
  'twitter': 'TwitterIcon',
  'discord': 'DiscordIcon',
  'link': 'LinkIcon',
  'copy': 'CopyIcon',
  'qr-code': 'QRCodeIcon',
  
  // UI Elements
  'arrow-up': 'ArrowUpIcon',
  'arrow-down': 'ArrowDownIcon',
  'chevron-left': 'ChevronLeftIcon',
  'chevron-right': 'ChevronRightIcon',
  'plus': 'PlusIcon',
  'minus': 'MinusIcon',
};

// ============================================================================
// ICON CATEGORIES - pentru organizare în UI
// ============================================================================
export const ICON_CATEGORIES = {
  WALLET_PAYMENT: [
    'wallet-connect', 'wallet-disconnect', 'balance', 'send', 'receive',
    'credit-card', 'crypto-coin', 'exchange', 'transaction', 'fee'
  ],
  CRYPTO_TOKENS: [
    'bitcoin', 'ethereum', 'solana', 'usdt', 'usdc',
    'bnb', 'cardano', 'polygon', 'stacks', 'generic-token'
  ],
  STAKING_REWARDS: [
    'stake', 'unstake', 'claim-rewards', 'apr',
    'lock', 'unlock', 'timer', 'calculator'
  ],
  NAVIGATION_ACTIONS: [
    'home', 'menu', 'close', 'back', 'forward', 'refresh',
    'settings', 'search', 'filter', 'download', 'upload', 'share'
  ],
  STATUS_NOTIFICATIONS: [
    'success', 'error', 'warning', 'info',
    'loading', 'verified', 'pending', 'expired'
  ],
  SOCIAL_COMMUNICATION: [
    'telegram', 'twitter', 'discord', 'link', 'copy', 'qr-code'
  ],
  UI_ELEMENTS: [
    'arrow-up', 'arrow-down', 'chevron-left', 'chevron-right', 'plus', 'minus'
  ]
};

