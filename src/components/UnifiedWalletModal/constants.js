/**
 * Wallet modal UI strings.
 */

export const MODAL_LABELS = {
  TITLE: 'Connect Wallet',
  SUBTITLE: 'Choose your wallet to connect',
  CLOSE_ARIA: 'Close wallet modal',
  EVM_SECTION_TITLE: 'EVM Networks',
  EVM_SECTION_SUBTITLE: 'BSC recommended for swap (DEX). Other networks: ETH, Polygon, Arbitrum, etc.',
  SOLANA_SECTION_TITLE: 'Solana Network',
  SOLANA_SECTION_SUBTITLE: 'Solana Mainnet',
  SOLANA_SWITCH_HINT: 'Select Solana (SOL) in the header first, then connect Phantom.',
  PHANTOM_LABEL: 'Phantom (Solana)',
  INJECTED_TITLE: 'Injected',
  INJECTED_ANNOTATION: '(browser extension)',
  BITS_INFO: 'Hold BITS tokens for automatic member access',
  ERROR_PREFIX: 'Warning: ',
  SOLANA_ERROR: 'Solana connection failed. Please try again.',
  SOLANA_NOT_SELECTED: 'Wallet not ready yet. Please try again.',
  SOLANA_NOT_INSTALLED: 'Phantom not installed. Install the extension and try again.',
  WALLETCONNECT_NOT_INSTALLED: 'WalletConnect is not installed. Install the WalletConnect app on your device or use another wallet.',
  EVM_ERROR_GENERIC: 'Connection failed. Try again or choose another wallet.',
};

export const STORAGE_KEYS = {
  PREFERRED_CONNECTOR_ID: 'bits_evm_preferred_connector_id',
  PREFERRED_CONNECTOR_NAME: 'bits_evm_preferred_connector_name',
};
