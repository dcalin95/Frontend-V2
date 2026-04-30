import React from 'react';
import UnifiedWalletModal from './UnifiedWalletModal/UnifiedWalletModal';

/**
 * 🎯 Single Wallet Modal
 * We intentionally use ONE UI (UnifiedWalletModal) across desktop + mobile to avoid
 * inconsistent connection flows and overlapping modals (Web3Modal vs custom modals).
 * UnifiedWalletModal already has `body.mode-mobile` + in-app browser CSS.
 */
const SmartWalletModal = () => {
  return <UnifiedWalletModal />;
};

export default SmartWalletModal;

