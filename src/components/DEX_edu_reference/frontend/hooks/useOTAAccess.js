/**
 * 🔐 useOTAAccess Hook - OTA Access Level Management
 *
 * Preview = authenticated, not registered. Full = authenticated + registered.
 * Single source: OTARegistrationContext via useOTAAccess.
 *
 * @module useOTAAccess
 */

import { useMemo } from 'react';
import { useDexAuth } from '../context/DexAuthContext';
import { useOTARegistrationContext } from '../context/OTARegistrationContext';
import { useWallet as useUnifiedWallet } from '../../context/WalletContext.jsx';

const PERMISSIONS_BASE = {
  canViewOTA: true,
  canViewDashboard: true,
  canViewMarketAnalysis: true,
  canViewCharts: true,
  canViewStatistics: true,
};

const PERMISSIONS_FULL = {
  ...PERMISSIONS_BASE,
  canPersonalize: true,
  canConfigure: true,
  canExecute: true,
  canViewDetails: true,
  canUseBanditSelector: true,
  canUseBacktest: true,
  canUseStrategyExecution: true,
  canUseModelInference: true,
  canUseMetaController: true,
  canUseRiskGating: true,
  canSaveSettings: true,
  canViewFullStatistics: true,
  canViewPersonalData: true,
};

const PERMISSIONS_PREVIEW = {
  ...PERMISSIONS_BASE,
  canPersonalize: false,
  canConfigure: false,
  canExecute: false,
  canViewDetails: false,
  canUseBanditSelector: false,
  canUseBacktest: false,
  canUseStrategyExecution: false,
  canUseModelInference: false,
  canUseMetaController: false,
  canUseRiskGating: false,
  canSaveSettings: false,
  canViewFullStatistics: false,
  canViewPersonalData: false,
  canViewPreview: true,
  canViewDemo: true,
  canViewExamples: true,
};

export const useOTAAccess = () => {
  const { isAuthenticated, walletAddress, associatedWalletAddress } = useDexAuth();
  const registration = useOTARegistrationContext();
  const {
    isRegistered,
    isLoading: otaLoading,
    error: otaError,
    register,
    isRegistering,
    botAuthorizations,
    executorBotAddress,
    checkRegistrationStatus,
    authorizeBot,
    isAuthorizing,
    refresh
  } = registration;
  const unifiedWallet = useUnifiedWallet();

  const effectiveWalletAddress = useMemo(() => {
    if (unifiedWallet?.isConnected && unifiedWallet?.walletType === 'EVM' && unifiedWallet?.walletAddress) {
      return unifiedWallet.walletAddress;
    }
    // DexAuthContext.walletAddress is now "connected wallet only"
    if (walletAddress) return walletAddress;
    return null;
  }, [unifiedWallet?.isConnected, unifiedWallet?.walletType, unifiedWallet?.walletAddress, walletAddress]);

  const accessLevel = useMemo(() => {
    if (!isAuthenticated) return 'guest';
    if (!isRegistered) return 'preview';
    return 'full';
  }, [isAuthenticated, isRegistered]);

  const permissions = useMemo(
    () => (accessLevel === 'full' ? PERMISSIONS_FULL : PERMISSIONS_PREVIEW),
    [accessLevel]
  );

  // Helper: Check if user can perform action
  const can = (action) => {
    return permissions[`can${action.charAt(0).toUpperCase() + action.slice(1)}`] || false;
  };

  // Helper: Check if in preview mode
  const isPreviewMode = accessLevel === 'preview' || accessLevel === 'guest';

  // Helper: Check if has full access
  const hasFullAccess = accessLevel === 'full';

  // Helper: Get registration CTA message
  const getRegistrationCTA = () => {
    if (accessLevel === 'guest') {
      return {
        title: 'Authenticate to Access OTA',
        message: 'Create an account or log in to see OTA features in preview mode',
        action: 'Login / Register',
        link: '/dex-edu/ota/login'
      };
    }
    if (accessLevel === 'preview') {
      // Different messages based on wallet connection
      if (!effectiveWalletAddress) {
        return {
          title: 'Connect Wallet for OTA Registration',
          message: 'To access full OTA features (personalization, configuration, execution), you need to: 1) Connect your wallet, 2) Have sufficient BITS tokens, 3) Register on-chain for OTA',
          action: 'Connect Wallet',
          link: '/dex-edu/ota'
        };
      }
      return {
        title: 'Register for OTA (On-Chain)',
        message: 'You are authenticated and have wallet connected. To access full OTA features (personalization, configuration, execution, detailed statistics), you need to register on-chain. Click the "Register for OTA" button in the OTA Access Control section.',
        action: 'View OTA Access Control',
        link: '/dex-edu/ota'
      };
    }
    return null;
  };
  
  // Helper: Get status explanation
  const getStatusExplanation = () => {
    if (accessLevel === 'guest') {
      return {
        title: 'Status: Not Authenticated',
        steps: [
          '1. Authenticate (Login/Register)',
          '2. Connect your wallet',
          '3. Register on-chain for OTA',
          '4. Access full OTA features'
        ]
      };
    }
    if (accessLevel === 'preview') {
      if (!effectiveWalletAddress) {
        return {
          title: 'Status: Authenticated, but Wallet Not Connected',
          current: '✓ You are authenticated in the platform',
          missing: '✗ Wallet is not connected',
          next: 'Connect your wallet to continue',
          steps: [
            '1. ✓ Authenticated (Login) - COMPLETE',
            '2. ✗ Connect wallet - REQUIRED',
            '3. ✗ Verify BITS tokens - REQUIRED',
            '4. ✗ Register on-chain for OTA - REQUIRED'
          ]
        };
      }
      return {
        title: 'Status: Authenticated with Wallet, but Not Registered for OTA',
        current: '✓ You are authenticated in the platform\n✓ Wallet is connected',
        missing: '✗ You are not registered on-chain for OTA',
        next: 'Click "Register for OTA" button below. MetaMask will open to confirm the on-chain registration transaction.',
        steps: [
          '1. ✓ Authenticated (Login) - COMPLETE',
          '2. ✓ Wallet connected - COMPLETE',
          '3. ? Verify BITS tokens - VERIFY',
          '4. ✗ Register on-chain for OTA - REQUIRED (Click button below)'
        ]
      };
    }
    return {
      title: 'Status: Full OTA Access',
      current: '✓ You are authenticated\n✓ Wallet connected\n✓ Registered on-chain for OTA',
      message: 'You have full access to all OTA features: personalization, configuration, execution, and detailed statistics'
    };
  };

  return {
    accessLevel,
    permissions,
    isPreviewMode,
    hasFullAccess,
    isAuthenticated,
    isRegistered,
    isLoading: otaLoading,
    walletAddress: effectiveWalletAddress,
    can,
    getRegistrationCTA,
    getStatusExplanation,
    checkRegistrationStatus,
    register,
    isRegistering,
    otaError,
    botAuthorizations,
    executorBotAddress,
    authorizeBot,
    isAuthorizing,
    refresh
  };
};

export default useOTAAccess;
