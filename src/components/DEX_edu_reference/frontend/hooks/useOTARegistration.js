/**
 * 🔐 useOTARegistration Hook
 * 
 * React hook pentru gestionarea flow-ului complet de înregistrare OTA:
 * - Check BITS balance
 * - Check registration status (on-chain)
 * - Register on-chain (UserVault.register())
 * - Verify registration
 * - Update state
 * 
 * @module useOTARegistration
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDexAuth } from '../context/DexAuthContext';
import { 
  getRegistrationStatus, 
  registerUser,
  authorizeBot
} from '../services/otaContractService';
import { getBotWalletAddress } from '../utils/otaApiClient';
import { useWallet as useUnifiedWallet } from '../../context/WalletContext.jsx';
import { logWithPrefix, errorWithPrefix } from '../utils/logger';
import { getUserFriendlyError } from '../utils/helpers';
import { isContractsNotDeployed, shouldIgnoreContractError, getContractDeploymentMessage } from '../utils/contractDeploymentUtils';
import { getBotAuthorizationsFromStatus } from '../utils/otaTradingModes';

/**
 * useOTARegistration Hook
 * 
 * @returns {object} Registration state and functions
 */
export const useOTARegistration = () => {
  const { isAuthenticated } = useDexAuth();
  const unifiedWallet = useUnifiedWallet();
  const unifiedRef = useRef({
    isConnected: false,
    walletType: null,
    walletAddress: null,
    signer: null
  });

  // —— Wallet (unified modal vs DexAuth) ——
  useEffect(() => {
    unifiedRef.current = {
      isConnected: !!unifiedWallet?.isConnected,
      walletType: unifiedWallet?.walletType || null,
      walletAddress: unifiedWallet?.walletAddress || null,
      signer: unifiedWallet?.signer || null
    };
  }, [unifiedWallet?.isConnected, unifiedWallet?.walletType, unifiedWallet?.walletAddress, unifiedWallet?.signer]);

  // Real wallet only from context. No prescribed wallet.
  // On-chain operations must use ONLY the actually connected EVM wallet from WalletContext.
  const getEffectiveWalletAddress = useCallback(() => {
    const snap = unifiedRef.current;
    if (snap?.isConnected && snap?.walletType === 'EVM' && snap?.walletAddress) return snap.walletAddress;
    return null;
  }, []);
  const [state, setState] = useState({
    // Registration status
    isRegistered: false,
    isLoading: false,
    error: null,
    
    // BITS balance
    bitsBalance: null,
    bitsBalanceLoading: false,
    
    // Registration data
    registrationStatus: null,
    privileges: null,
    botAuthorizations: [],
    
    // Transaction states
    isRegistering: false,
    isAuthorizing: false,
    
    // Last update timestamp
    lastChecked: null,

    // Executor bot address (GET /api/ai-trading/bot-address) – used to check "authorized" for the bot that actually signs
    executorBotAddress: null
  });

  // Fetch executor bot address and refresh when auth/wallet changes.
  // If initial fetch fails, stale null would mark bot as "not authorized" forever.
  useEffect(() => {
    const effectiveWalletAddress = getEffectiveWalletAddress();
    if (!isAuthenticated || !effectiveWalletAddress) {
      setState((prev) => ({ ...prev, executorBotAddress: null }));
      return undefined;
    }
    let cancelled = false;
    getBotWalletAddress()
      .then((addr) => { if (!cancelled) setState((prev) => ({ ...prev, executorBotAddress: addr || null })); })
      .catch(() => { if (!cancelled) setState((prev) => ({ ...prev, executorBotAddress: null })); });
    return () => { cancelled = true; };
  }, [isAuthenticated, unifiedWallet?.walletAddress, getEffectiveWalletAddress]);

  // —— BITS balance ——
  const checkBitsBalance = useCallback(async () => {
    if (!isAuthenticated) {
      setState(prev => ({ ...prev, bitsBalance: null, bitsBalanceLoading: false }));
      return;
    }

    const effectiveWalletAddress = getEffectiveWalletAddress();
    if (!effectiveWalletAddress) {
      setState(prev => ({ ...prev, bitsBalance: null, bitsBalanceLoading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, bitsBalanceLoading: true, error: null }));

      // Read balance via on-chain status (public RPC), avoiding window.ethereum provider chooser popups.
      const status = await getRegistrationStatus(effectiveWalletAddress);
      const balanceNum = Number.parseFloat(String(status?.bitsBalance ?? '0'));
      const safeBalance = Number.isFinite(balanceNum) ? balanceNum : 0;

      setState(prev => ({
        ...prev,
        bitsBalance: safeBalance,
        bitsBalanceLoading: false
      }));

      logWithPrefix('useOTARegistration', `BITS balance checked: ${safeBalance} BITS`);
    } catch (error) {
      errorWithPrefix('useOTARegistration', 'Error checking BITS balance:', error);
      setState(prev => ({ 
        ...prev, 
        bitsBalanceLoading: false, 
        error: error.message || 'Failed to check BITS balance' 
      }));
    }
  }, [getEffectiveWalletAddress, isAuthenticated]);

  // Ref to prevent concurrent registration status checks
  const checkingStatusRef = useRef(false);
  const lastStatusCheckRef = useRef(0);

  /**
   * Check registration status (on-chain) - with debounce and error handling
   */
  const checkRegistrationStatus = useCallback(async (options = {}) => {
    const { force = false, walletAddressOverride = null } = options || {};
    const effectiveAddress = walletAddressOverride || getEffectiveWalletAddress();
    if (!effectiveAddress) {
      setState(prev => ({ 
        ...prev, 
        isRegistered: false,
        registrationStatus: null,
        privileges: null,
        botAuthorizations: []
      }));
      return;
    }

    // Prevent concurrent calls
    if (checkingStatusRef.current) {
      return;
    }

    // Debounce - only check if last check was > 3 seconds ago
    const now = Date.now();
    const timeSinceLastCheck = now - lastStatusCheckRef.current;
    if (!force && timeSinceLastCheck < 3000) {
      return; // Skip if checked recently
    }

    try {
      checkingStatusRef.current = true;
      lastStatusCheckRef.current = now;
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const status = await getRegistrationStatus(effectiveAddress);
      const extractedBotAuths = getBotAuthorizationsFromStatus(status);
      const balanceNum = Number.parseFloat(String(status?.bitsBalance ?? '0'));
      const safeBalance = Number.isFinite(balanceNum) ? balanceNum : null;
      
      setState(prev => ({ 
        ...prev, 
        isRegistered: status.isRegistered || false,
        registrationStatus: status,
        privileges: status.privileges || null,
        botAuthorizations: extractedBotAuths,
        bitsBalance: safeBalance,
        bitsBalanceLoading: false,
        isLoading: false,
        lastChecked: Date.now()
      }));
      
      logWithPrefix('useOTARegistration', 'Registration status checked:', status);
    } catch (error) {
      // Don't spam errors for rate limiting or service unavailable
      const errorMsg = error.message || '';
      if (!errorMsg.includes('429') && !errorMsg.includes('Too many') && !shouldIgnoreContractError(error)) {
        errorWithPrefix('useOTARegistration', 'Error checking registration status:', error);
      }
      // Nu reseta isRegistered la false la eroare – altfel useOTAMode trece în advisory și panoul Auto se închide.
      // Păstrăm valoarea anterioară la erori de rețea/RPC ca utilizatorul să rămână pe Auto.
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMsg.includes('429') ? 'Too many requests. Please wait a moment.' :
               isContractsNotDeployed(errorMsg) ?
               getContractDeploymentMessage('short') :
               (errorMsg || 'Failed to check registration status')
      }));
    } finally {
      checkingStatusRef.current = false;
    }
  }, [getEffectiveWalletAddress]);

  // —— Register on-chain (UserVault.register) ——
  const register = useCallback(async () => {
    if (!isAuthenticated) throw new Error('Not authenticated');

    try {
      setState(prev => ({ ...prev, isRegistering: true, error: null }));

      // Ensure we have an EVM signer from the wallet the user chose (MetaMask via modal).
      // This prevents TrustWallet (default injected provider) from opening automatically.
      let signerOverride = unifiedRef.current.signer;
      const needsConnect =
        !unifiedRef.current.isConnected ||
        unifiedRef.current.walletType !== 'EVM' ||
        !unifiedRef.current.walletAddress ||
        !signerOverride;

      if (needsConnect && unifiedWallet?.connectWallet) {
        await unifiedWallet.connectWallet('evm'); // opens modal

        // Wait until the unified wallet has an EVM signer (user finished selecting MetaMask).
        const start = Date.now();
        const timeoutMs = 60000;
        while (Date.now() - start < timeoutMs) {
          const snap = unifiedRef.current;
          if (snap.isConnected && snap.walletType === 'EVM' && snap.walletAddress && snap.signer) {
            signerOverride = snap.signer;
            break;
          }
          // eslint-disable-next-line no-await-in-loop
          await new Promise(r => setTimeout(r, 250));
        }
      }

      const effectiveWalletAddress = unifiedRef.current.walletAddress;
      if (!effectiveWalletAddress) {
        throw new Error('Wallet not connected');
      }

      // Step 1: Check if already registered (with error handling for contracts not deployed)
      let status;
      try {
        status = await getRegistrationStatus(effectiveWalletAddress);
      } catch (statusError) {
        const errorMsg = statusError.message || '';
        // If contracts are not deployed yet, show clear message
        if (isContractsNotDeployed(errorMsg)) {
          throw new Error(getContractDeploymentMessage('detailed'));
        }
        throw statusError;
      }

      if (status.isRegistered) {
        setState(prev => ({ 
          ...prev, 
          isRegistering: false, 
          isRegistered: true,
          registrationStatus: status,
          privileges: status.privileges
        }));
        logWithPrefix('useOTARegistration', 'User already registered');
        return;
      }

      // Step 2: Register on-chain (prepares transaction and sends it)
      const txReceipt = await registerUser(effectiveWalletAddress, signerOverride);
      
      // Step 4: Verify registration
      await checkRegistrationStatus({ force: true, walletAddressOverride: effectiveWalletAddress });
      
      setState(prev => ({ 
        ...prev, 
        isRegistering: false 
      }));
      
      logWithPrefix('useOTARegistration', 'Registration successful:', txReceipt);
    } catch (error) {
      errorWithPrefix('useOTARegistration', 'Error registering:', error);
      
      // Get user-friendly error message
      const errorMessage = getUserFriendlyError(error);
      
      // Enhance with specific OTA registration context
      let enhancedMessage = errorMessage;
      const errorLower = (error.message || '').toLowerCase();
      
      if (errorLower.includes('insufficient funds') || errorLower.includes('insufficient balance')) {
        enhancedMessage = 'Insufficient BITS balance. You need at least 5,000 BITS to register for OTA.';
      } else if (errorLower.includes('user rejected') || errorLower.includes('action rejected')) {
        enhancedMessage = 'Registration transaction was cancelled. Please try again and approve the transaction in your wallet.';
      } else if (errorLower.includes('already registered') || errorLower.includes('already exists')) {
        enhancedMessage = 'You are already registered for OTA.';
      } else if (errorLower.includes('gas') || errorLower.includes('gas limit')) {
        enhancedMessage = 'Gas estimation failed. Please try again or check your network connection.';
      } else if (errorLower.includes('network') || errorLower.includes('connection')) {
        enhancedMessage = 'Could not reach the server during registration. Please try again in a moment.';
                  } else if (isContractsNotDeployed(errorLower)) {
                    enhancedMessage = getContractDeploymentMessage('detailed');
      } else if (errorLower.includes('429') || errorLower.includes('too many')) {
        enhancedMessage = 'Too many requests. Please wait a moment and try again.';
      }
      
      setState(prev => ({ 
        ...prev, 
        isRegistering: false, 
        error: enhancedMessage
      }));
      throw new Error(enhancedMessage);
    }
  }, [isAuthenticated, checkRegistrationStatus, unifiedWallet?.connectWallet]);

  /**
   * Authorize bot (UserVault.authorizeBot())
   * @param {string} botAddress - Bot address to authorize
   * @param {string|number} maxAmount - Max amount as string (e.g., "100.0") or number (will be converted to string). "0" = unlimited
   */
  const authorizeBotHandler = useCallback(async (botAddress, maxAmount = "0") => {
    if (!isAuthenticated) throw new Error('Not authenticated');

    if (!botAddress) {
      throw new Error('botAddress is required');
    }

    try {
      // Ensure wallet is connected
      let effectiveWalletAddress = getEffectiveWalletAddress();
      if (!effectiveWalletAddress && unifiedWallet?.connectWallet) {
        await unifiedWallet.connectWallet('evm'); // opens modal
        const start = Date.now();
        const timeoutMs = 60000;
        while (Date.now() - start < timeoutMs) {
          const snap = unifiedRef.current;
          if (snap.isConnected && snap.walletType === 'EVM' && snap.walletAddress && snap.signer) {
            effectiveWalletAddress = snap.walletAddress;
            break;
          }
          // eslint-disable-next-line no-await-in-loop
          await new Promise(r => setTimeout(r, 250));
        }
      }
      if (!effectiveWalletAddress) throw new Error('Wallet not connected');

      setState(prev => ({ ...prev, isAuthorizing: true, error: null }));

      // Step 1: Check if registered
      const status = await getRegistrationStatus(effectiveWalletAddress);
      if (!status.isRegistered) {
        throw new Error('User not registered. Please register first.');
      }

      // Step 2: Convert maxAmount to string if number
      const maxAmountStr = typeof maxAmount === 'number' ? maxAmount.toString() : maxAmount;

      // Step 3: Authorize bot on-chain (prepares transaction and sends it)
      // Prefer signer from unified wallet selection (MetaMask), avoid default injected provider.
      const signerOverride = unifiedRef.current.signer || unifiedWallet?.signer || null;
      const txResult = await authorizeBot(effectiveWalletAddress, botAddress, maxAmountStr, signerOverride);
      
      logWithPrefix('useOTARegistration', 'Bot authorization confirmed on blockchain:', txResult);

      setState(prev => ({ ...prev, isAuthorizing: false }));

      // Refresh registration status (best-effort); do not throw so caller always gets hash when tx succeeded
      try {
        logWithPrefix('useOTARegistration', 'Refreshing registration status...');
        await checkRegistrationStatus({ force: true, walletAddressOverride: effectiveWalletAddress });
      } catch (refreshErr) {
        logWithPrefix('useOTARegistration', 'Refresh after authorize failed (tx already confirmed):', refreshErr?.message);
      }
      
      logWithPrefix('useOTARegistration', 'Bot authorization complete!');
      return { hash: txResult?.hash, receipt: txResult?.receipt };
    } catch (error) {
      errorWithPrefix('useOTARegistration', 'Error authorizing bot:', error);
      
      // Get user-friendly error message
      const errorMessage = getUserFriendlyError(error);
      
      // Enhance with specific bot authorization context
      let enhancedMessage = errorMessage;
      const errorLower = (error.message || '').toLowerCase();
      
      if (errorLower.includes('not registered') || errorLower.includes('user not registered')) {
        enhancedMessage = 'You must register for OTA first before authorizing bots. Please register in the OTA Access Control section.';
      } else if (errorLower.includes('user rejected') || errorLower.includes('action rejected')) {
        enhancedMessage = 'Bot authorization transaction was cancelled. Please try again and approve the transaction in your wallet.';
      } else if (errorLower.includes('gas') || errorLower.includes('gas limit')) {
        enhancedMessage = 'Gas estimation failed for bot authorization. Please try again or check your network connection.';
      } else if (errorLower.includes('network') || errorLower.includes('connection')) {
        enhancedMessage = 'Could not reach the server during bot authorization. Please try again in a moment.';
      } else if (errorLower.includes('invalid address') || errorLower.includes('invalid bot')) {
        enhancedMessage = 'Invalid bot address. Please check the bot address and try again.';
      }
      
      setState(prev => ({ 
        ...prev, 
        isAuthorizing: false, 
        error: enhancedMessage
      }));
      throw new Error(enhancedMessage);
    }
  }, [getEffectiveWalletAddress, isAuthenticated, checkRegistrationStatus, unifiedWallet?.signer, unifiedWallet?.connectWallet]);

  /**
   * Refresh all data (BITS balance + registration status)
   */
  const refresh = useCallback(async () => {
    await Promise.all([
      checkBitsBalance(),
      checkRegistrationStatus()
    ]);
  }, [checkBitsBalance, checkRegistrationStatus]);

  // Refs to prevent infinite loops and multiple attempts
  const autoAssociatingRef = useRef(false);
  const lastWalletAttemptedRef = useRef(null);
  const lastRefreshTimeRef = useRef(0);
  const refreshTimeoutRef = useRef(null);
  const failedWalletsRef = useRef(new Set()); // Track wallets that failed association
  const mountedRef = useRef(false);
  const lastWalletAddressRef = useRef(null);

  // —— Auto-check + auto-associate (mount / wallet change) ——
  useEffect(() => {
    // Only run once on mount or when wallet address actually changes
    const normalizedWallet = (getEffectiveWalletAddress() || '').toLowerCase() || null;
    
    if (!normalizedWallet || !isAuthenticated) {
      setState(prev => ({ 
        ...prev, 
        bitsBalance: null, 
        registrationStatus: null,
        privileges: null,
        botAuthorizations: []
      }));
      lastWalletAddressRef.current = null;
      return;
    }

    // Skip if same wallet and already processed
    if (lastWalletAddressRef.current === normalizedWallet && mountedRef.current) {
      return;
    }

    // Mark as mounted and update last wallet
    mountedRef.current = true;
    lastWalletAddressRef.current = normalizedWallet;

    // Prevent multiple simultaneous calls
    if (autoAssociatingRef.current) {
      return;
    }

    // Skip if we already tried this wallet (successfully or failed)
    if (failedWalletsRef.current.has(normalizedWallet)) {
      // Still check status even if association failed
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
      if (timeSinceLastRefresh > 10000) { // 10 seconds for status check
        lastRefreshTimeRef.current = now;
        checkRegistrationStatus().catch(() => {});
      }
      return;
    }

    // Debounce refresh - only refresh if last refresh was > 10 seconds ago
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
    const shouldRefresh = timeSinceLastRefresh > 10000; // 10 seconds debounce

    const autoAssociateWallet = async () => {
      // Prevent concurrent calls
      if (autoAssociatingRef.current) return;
      
      autoAssociatingRef.current = true;

      try {
        const authApiService = await import('../services/authApiService');
        const associatedWallets = await authApiService.default.getUserWallets();
        const isWalletAssociated = associatedWallets?.some(w => {
          const walletAddr = (w.wallet_address || w.address || '').toLowerCase();
          return walletAddr === normalizedWallet;
        });
        
        if (!isWalletAssociated) {
          try {
            await authApiService.default.associateWallet(getEffectiveWalletAddress(), 'evm');
            console.log('[useOTARegistration] Wallet auto-associated successfully');
          } catch (assocError) {
            // If 400 Bad Request, stop trying for this wallet permanently
            const errorMsg = assocError.message || '';
            if (errorMsg.includes('400') || errorMsg.includes('Invalid request') || errorMsg.includes('Bad Request')) {
              console.warn('[useOTARegistration] Backend rejected wallet association (400). Stopping auto-association for this wallet.');
              failedWalletsRef.current.add(normalizedWallet);
              autoAssociatingRef.current = false;
              return; // Don't retry
            }
            // Don't show error if wallet is already associated
            if (process.env.NODE_ENV === 'development' && !errorMsg.includes('already') && !errorMsg.includes('exists')) {
              console.warn('[useOTARegistration] Could not auto-associate wallet:', errorMsg);
            }
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') console.warn('[useOTARegistration] Error checking wallet association:', error);
      } finally {
        autoAssociatingRef.current = false;
      }
    };
    
    // Auto-associate wallet (only once per wallet)
    autoAssociateWallet();

    // Refresh registration status (with debounce) - call functions directly, not refresh()
    if (shouldRefresh) {
      // Clear any pending refresh
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      // Debounce refresh by 3 seconds and call functions directly
      refreshTimeoutRef.current = setTimeout(() => {
        lastRefreshTimeRef.current = Date.now();
        // Call functions directly instead of refresh() to avoid dependency loop
        Promise.all([
          checkBitsBalance().catch(err => {
            const errorMsg = err.message || '';
            if (!errorMsg.includes('429') && !errorMsg.includes('Too many') && 
                !errorMsg.includes('503') && !errorMsg.includes('not configured')) {
              console.warn('[useOTARegistration] Balance check error:', errorMsg);
            }
          }),
          checkRegistrationStatus().catch(err => {
            const errorMsg = err.message || '';
            if (!errorMsg.includes('429') && !errorMsg.includes('Too many') && 
                !errorMsg.includes('503') && !errorMsg.includes('not configured')) {
              console.warn('[useOTARegistration] Status check error:', errorMsg);
            }
          })
        ]).catch(() => {});
      }, 3000);
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [
    getEffectiveWalletAddress,
    isAuthenticated,
    checkBitsBalance,
    checkRegistrationStatus,
    unifiedWallet?.walletAddress
  ]);

  return {
    // State
    ...state,
    
    // Functions
    checkBitsBalance,
    checkRegistrationStatus,
    register,
    authorizeBot: authorizeBotHandler,
    refresh
  };
};

export default useOTARegistration;
