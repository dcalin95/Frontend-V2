/**
 * 👤 Profile Page - User Profile Page (Binance-style)
 * 
 * User profile page pentru DEX cu trading și wallet Web3:
 * - User information (ID, email, username, emailVerified)
 * - Wallet address și balances (BNB, BTC, USDT, BITS, etc.)
 * - Trading statistics (total profit, win rate, active positions, total trades)
 * - Portfolio overview
 * - Account stats (member since, email verified, etc.)
 * - Security settings (biometric, etc.)
 * 
 * @module Profile
 */

import React, { memo, useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useDexAuth } from '../context/DexAuthContext';
import { User, Mail, CheckCircle, XCircle, Wallet, Calendar, Shield, LogOut, TrendingUp, TrendingDown, BarChart3, Coins, Edit2, Save, X, Lock, Fingerprint, Send, Copy, Check, Smartphone, Plus } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { usePerformance } from '../hooks/usePerformance';
import { useExecution } from '../hooks/useExecution';
import walletBalanceService from '../services/walletBalanceService';
import { formatLargeNumber, formatCurrency } from '../utils/formatters';
import { toast } from 'react-toastify';
import authApiService from '../services/authApiService';
import { useWallet as useUnifiedWallet } from '../../context/WalletContext.jsx';
import '../styles/pages.css';
import '../styles/components/profile-page.css';

const Profile = memo(() => {
  const location = useLocation();
  const {
    user,
    walletAddress,
    associatedWalletAddress,
    isAuthenticated,
    loading,
    logout,
    updateProfile,
    changePassword,
    registerBiometric,
    isBiometricAvailable,
    hasBiometricCredential,
    removeBiometricCredential,
    resendVerification,
    checkAuthStatus,
  } = useDexAuth();
  const unifiedWallet = useUnifiedWallet();
  const hasResendVerification = typeof resendVerification === 'function';

  // SSOT for connected wallet address (used for actions/OTA/performance).
  const effectiveWalletAddress = useMemo(() => {
    if (unifiedWallet?.isConnected && unifiedWallet?.walletType === 'EVM' && unifiedWallet?.walletAddress) {
      return unifiedWallet.walletAddress;
    }
    // DexAuthContext.walletAddress is now connected-only; NEVER fallback to DB wallet here.
    return walletAddress || null;
  }, [unifiedWallet?.isConnected, unifiedWallet?.walletType, unifiedWallet?.walletAddress, walletAddress]);

  // Telegram identity derived from wallet (backend: /api/auth/telegram/by-wallet)
  const [telegramFromWallet, setTelegramFromWallet] = useState(null);
  const [telegramLink, setTelegramLink] = useState(null); // { code, expiresAt }
  const [telegramLinkBusy, setTelegramLinkBusy] = useState(false);
  const [telegramProfile, setTelegramProfile] = useState(null);
  const [telegramProfileLoading, setTelegramProfileLoading] = useState(false);
  const shouldFetchTelegramProfile = useMemo(() => {
    if (!isAuthenticated || !user?.id) return false;
    // After /link confirm, the backend updates DB, but the UI may lag until /api/auth/me refreshes.
    // Fetch bundle proactively if we either have telegram_id OR we have a link in progress.
    return !!(user?.telegram_id || telegramFromWallet?.telegram_id || telegramLink?.code);
  }, [isAuthenticated, user?.id, user?.telegram_id, telegramFromWallet?.telegram_id, telegramLink?.code]);
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (user?.telegram_id) return; // already linked in account
      if (!effectiveWalletAddress) return;
      try {
        const tg = await authApiService.getTelegramByWallet?.(effectiveWalletAddress);
        if (!cancelled) setTelegramFromWallet(tg || null);
      } catch (e) {
        // ignore
      }
    };
    run();
    return () => { cancelled = true; };
  }, [user?.telegram_id, effectiveWalletAddress]);

  // OAuth (Google etc.): backend poate redirecționa aici cu ?auth=error&error=google
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('auth') !== 'error') return;
    const provider = params.get('error') || 'oauth';
    const msg =
      provider === 'google_oauth_not_configured'
        ? 'Google sign-in is unavailable: OAuth is not configured on the server (missing GOOGLE_CLIENT_ID/SECRET).'
        : provider === 'google'
        ? 'Google sign-in failed. Try again or use email/wallet.'
        : 'Sign-in failed. Please try again.';
    toast.error(msg);
    params.delete('auth');
    params.delete('error');
    const qs = params.toString();
    window.history.replaceState({}, '', `${location.pathname}${qs ? `?${qs}` : ''}`);
  }, [location.search, location.pathname]);

  // Load full Telegram data bundle for Profile
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!shouldFetchTelegramProfile) {
        // Don't clear telegramProfile if it already exists - prevents flashing
        return;
      }
      setTelegramProfileLoading(true);
      try {
        const res = await authApiService.getTelegramProfile?.();
        if (!cancelled) setTelegramProfile(res || null);
      } catch {
        // Don't clear on error if data already exists
        if (!cancelled && !telegramProfile) {
          setTelegramProfile(null);
        }
      } finally {
        if (!cancelled) setTelegramProfileLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [shouldFetchTelegramProfile]);

  // After user generates a link code, poll briefly for confirmation:
  // - refresh auth state (so user.telegram_id arrives)
  // - fetch telegram bundle once linked
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    if (!telegramLink?.code) return;
    if (user?.telegram_id || telegramProfile?.ok) return; // Stop if already confirmed

    let cancelled = false;
    const startedAt = Date.now();
    const maxMs = 60_000; // 60s
    const tickMs = 2_000; // 2s (faster polling)

    const tick = async () => {
      if (cancelled) return;
      if (Date.now() - startedAt > maxMs) {
        console.log('[Profile] Polling timeout reached (60s)');
        return;
      }
      
      // First try to fetch Telegram profile (faster than checkAuthStatus)
      try {
        const res = await authApiService.getTelegramProfile?.();
        if (!cancelled && res?.ok) {
          console.log('[Profile] Telegram profile loaded successfully, stopping polling');
          setTelegramProfile(res);
          cancelled = true; // FORCE STOP polling
          return; // Success, stop polling
        }
      } catch (err) {
        console.log('[Profile] Telegram profile not ready yet:', err?.message);
        // ignore, continue polling
      }
      
      // Check again if we should stop - but ONLY schedule next tick if not cancelled
      if (!cancelled) {
        setTimeout(tick, tickMs);
      }
    };

    setTimeout(tick, 500); // Start faster (500ms after link generation)
    return () => { cancelled = true; };
    // Intentionally NOT depending on telegramProfile to avoid tight loops; polling is time-bound.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id, telegramLink?.code, user?.telegram_id, checkAuthStatus]);

  const handleStartTelegramLink = async () => {
    try {
      setTelegramLinkBusy(true);
      const res = await authApiService.startTelegramLink?.();
      if (res?.code) {
        setTelegramLink({ code: res.code, expiresAt: res.expiresAt || null });
        toast.info('Code generated. Send it to the Telegram bot.');
      } else {
        toast.error('Could not generate Telegram linking code.');
      }
    } catch (e) {
      toast.error(e?.message || 'Could not generate Telegram linking code.');
    } finally {
      setTelegramLinkBusy(false);
    }
  };
  
  // Load trading statistics - DISABLED autoRefresh to prevent excessive requests
  const { 
    metrics, 
    loading: metricsLoading,
    error: metricsError
  } = usePerformance(effectiveWalletAddress, { period: '30d', autoRefresh: false });
  
  // Load execution trades for active positions - DISABLED autoRefresh to prevent excessive requests
  const { 
    trades, 
    loading: tradesLoading,
    error: tradesError
  } = useExecution(effectiveWalletAddress, { limit: 100, autoRefresh: false });
  
  // Log errors if any
  useEffect(() => {
    if (metricsError) {
      console.error('Error loading performance metrics:', metricsError);
    }
    if (tradesError) {
      console.error('Error loading execution trades:', tradesError);
    }
  }, [metricsError, tradesError]);
  
  // Wallet balances state
  const [walletBalances, setWalletBalances] = useState(null);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [balancesError, setBalancesError] = useState(null);
  
  // Associated wallets state
  const [associatedWallets, setAssociatedWallets] = useState([]);
  const [walletsLoading, setWalletsLoading] = useState(false);
  const [walletsError, setWalletsError] = useState(null);
  const [copiedWallet, setCopiedWallet] = useState(null);

  // Profile edit state
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  // Biometric state
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricRegistered, setBiometricRegistered] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);

  // Email verification state
  const [resendingVerification, setResendingVerification] = useState(false);
  
  // Phone verification state
  const [phoneVerificationMode, setPhoneVerificationMode] = useState(null); // 'send' | 'verify' | null
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneVerifying, setPhoneVerifying] = useState(false);

  // Handle phone verification - send code
  const handleSendPhoneCode = async () => {
    const phoneNormalized = phoneInput.trim().replace(/\s+/g, '');
    
    if (!phoneNormalized) {
      toast.error('Phone number is required');
      return;
    }
    
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNormalized)) {
      toast.error('Invalid phone number format. Please use international format (e.g., +1234567890)');
      return;
    }
    
    try {
      setPhoneSending(true);
      
      const response = await authApiService.sendPhoneVerificationCode(phoneNormalized);
      
      if (response?.success) {
        setPhoneVerificationMode('verify');
        // Show code in development for testing
        if (process.env.NODE_ENV !== 'production' && response.code) {
          toast.success(`Development: Your code is ${response.code}`);
        } else {
          toast.success('Verification code sent to your phone');
        }
      } else {
        toast.error(response?.error || 'Failed to send verification code');
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to send verification code');
    } finally {
      setPhoneSending(false);
    }
  };

  // Handle phone verification - verify code
  const handleVerifyPhoneCode = async () => {
    if (!phoneCode.trim() || phoneCode.trim().length !== 6) {
      toast.error('Please enter a valid 6-digit verification code');
      return;
    }
    
    try {
      setPhoneVerifying(true);
      
      const phoneNormalized = phoneInput.trim().replace(/\s+/g, '');
      const response = await authApiService.verifyPhoneCode(phoneNormalized, phoneCode.trim());
      
      if (response?.success) {
        toast.success('Phone number verified successfully!');
        setPhoneVerificationMode(null);
        setPhoneInput('');
        setPhoneCode('');
        // Refresh auth status to get updated phone info
        if (checkAuthStatus) {
          await checkAuthStatus();
        }
      } else {
        toast.error(response?.error || 'Invalid verification code');
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to verify phone number');
    } finally {
      setPhoneVerifying(false);
    }
  };

  useEffect(() => {
    // Keep draft username in sync with user
    if (user?.username) setUsernameDraft(user.username);
  }, [user?.username]);

  useEffect(() => {
    const checkBio = async () => {
      try {
        if (!isBiometricAvailable) return;
        const availability = await isBiometricAvailable();
        const ok = !!availability?.available;
        setBiometricAvailable(ok);
        setBiometricRegistered(ok ? !!hasBiometricCredential?.() : false);
      } catch {
        setBiometricAvailable(false);
        setBiometricRegistered(false);
      }
    };
    checkBio();
  }, [isBiometricAvailable, hasBiometricCredential]);
  
  // Use refs to prevent infinite loops - DO NOT put in dependencies!
  const associatingWalletRef = useRef(false);
  const lastAssociatedWalletRef = useRef(null);
  const walletsLoadedRef = useRef(false);
  const telegramSyncAttemptedRef = useRef(false);

  // Load associated wallets from backend and check if connected wallet is associated
  // Use refs to prevent infinite loops
  const walletsLoadTimeoutRef = useRef(null);
  const lastWalletsLoadRef = useRef(0);
  
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      console.log('[Profile] Skipping wallet load - not authenticated or no user ID');
      setAssociatedWallets([]);
      return;
    }
    
    // Debounce wallet loading - only load if last load was > 5 seconds ago
    const now = Date.now();
    const timeSinceLastLoad = now - lastWalletsLoadRef.current;
    if (timeSinceLastLoad < 5000) {
      return; // Skip if loaded recently
    }
    
    // Clear any pending timeout
    if (walletsLoadTimeoutRef.current) {
      clearTimeout(walletsLoadTimeoutRef.current);
    }
    
    // Debounce by 2 seconds
    walletsLoadTimeoutRef.current = setTimeout(async () => {
      lastWalletsLoadRef.current = Date.now();
      
      console.log('[Profile] Loading associated wallets for user:', user.id);
      setWalletsLoading(true);
      setWalletsError(null);
      
      try {
        const wallets = await authApiService.getUserWallets();
        console.log('[Profile] Loaded wallets:', wallets);
        setAssociatedWallets(wallets || []);

        // If user has Telegram ID but no wallets came back, try a one-time backend sync.
        if (user?.telegram_id && (!wallets || wallets.length === 0) && !telegramSyncAttemptedRef.current) {
          telegramSyncAttemptedRef.current = true;
          try {
            const syncRes = await authApiService.syncTelegramWallet?.();
            if (syncRes) {
              const updatedWallets = await authApiService.getUserWallets();
              setAssociatedWallets(updatedWallets || []);
              toast.info('Telegram wallet synced');
            }
          } catch (e) {
            // Endpoint may not exist yet; ignore quietly.
          }
        }
        
        // Check if connected wallet is in the associated wallets list
        if (effectiveWalletAddress) {
          const normalizedConnectedWallet = effectiveWalletAddress.toLowerCase();
          const isWalletAssociated = wallets?.some(w => {
            const walletAddr = (w.wallet_address || w.address || '').toLowerCase();
            return walletAddr === normalizedConnectedWallet;
          });
          
          // Also check user.walletAddress from backend
          const userWalletFromBackend = user?.walletAddress?.toLowerCase();
          const isUserWalletInList = userWalletFromBackend && wallets?.some(w => {
            const walletAddr = (w.wallet_address || w.address || '').toLowerCase();
            return walletAddr === userWalletFromBackend;
          });
          
          console.log('[Profile] Wallet association check:', {
            connectedWallet: walletAddress,
            isConnectedWalletAssociated: isWalletAssociated,
            userWalletFromBackend: user?.walletAddress,
            isUserWalletInList: isUserWalletInList,
            telegramId: user?.telegram_id,
            associatedWalletsCount: wallets?.length || 0,
            associatedWallets: wallets?.map(w => ({
              address: (w.wallet_address || w.address || '').toLowerCase(),
              source: w.source || 'unknown',
              type: w.wallet_type || 'evm'
            }))
          });
          
          // Auto-associate connected wallet if not already associated (ONLY ONCE)
          // Skip if we already tried to associate this wallet
          if (!isWalletAssociated && !associatingWalletRef.current && lastAssociatedWalletRef.current !== normalizedConnectedWallet) {
            associatingWalletRef.current = true;
            lastAssociatedWalletRef.current = normalizedConnectedWallet;
            
            try {
              await authApiService.associateWallet(effectiveWalletAddress, 'EVM');
              // Reload wallets after association (only once)
              const updatedWallets = await authApiService.getUserWallets();
              setAssociatedWallets(updatedWallets || []);
              toast.success('Wallet associated with your account');
            } catch (assocError) {
              // Don't show error if wallet is already associated
              if (!assocError.message?.includes('already') && !assocError.message?.includes('exists')) {
                console.warn('[Profile] Could not auto-associate wallet:', assocError.message);
              }
            } finally {
              associatingWalletRef.current = false;
            }
          }
        }
      } catch (error) {
        console.error('[Profile] Error loading associated wallets:', error);
        setWalletsError(error.message || 'Failed to load wallets');
        setAssociatedWallets([]);
      } finally {
        setWalletsLoading(false);
      }
    }, 2000);
    
    return () => {
      if (walletsLoadTimeoutRef.current) {
        clearTimeout(walletsLoadTimeoutRef.current);
      }
    };
    // CRITICAL: Removed associatingWallet from dependencies to prevent infinite loop!
  }, [isAuthenticated, user?.id, user?.telegram_id, effectiveWalletAddress]);
  
  // Load wallet balances if wallet is connected - with error handling and debouncing
  const balancesLoadTimeoutRef = useRef(null);
  const balancesIntervalRef = useRef(null);
  const lastBalancesLoadRef = useRef(0);
  
  useEffect(() => {
    // Only try to load balances if wallet is connected and service is available
    if (!walletAddress) {
      setWalletBalances(null);
      // Clear any pending intervals
      if (balancesIntervalRef.current) {
        clearInterval(balancesIntervalRef.current);
        balancesIntervalRef.current = null;
      }
      return;
    }
    
    // Check if walletBalanceService is available
    if (!walletBalanceService || typeof walletBalanceService.getAllTokenBalances !== 'function') {
      console.warn('walletBalanceService is not available');
      setBalancesError('Wallet balance service is not available');
      return;
    }
    
    // Debounce initial load - only load if last load was > 5 seconds ago
    const now = Date.now();
    const timeSinceLastLoad = now - lastBalancesLoadRef.current;
    
    const loadBalances = async () => {
      setBalancesLoading(true);
      setBalancesError(null);
      
      try {
        const balances = await walletBalanceService.getAllTokenBalances(
          walletAddress,
          ['BNB', 'BTC', 'USDT', 'BITS', 'ETH', 'BUSD']
        );
        setWalletBalances(balances);
        lastBalancesLoadRef.current = Date.now();
      } catch (error) {
        console.error('Error loading wallet balances:', error);
        setBalancesError(error.message || 'Failed to load wallet balances');
        setWalletBalances(null);
      } finally {
        setBalancesLoading(false);
      }
    };
    
    // Clear any pending timeout
    if (balancesLoadTimeoutRef.current) {
      clearTimeout(balancesLoadTimeoutRef.current);
    }
    
    // Debounce initial load by 2 seconds
    if (timeSinceLastLoad > 5000) {
      balancesLoadTimeoutRef.current = setTimeout(() => {
        loadBalances();
      }, 2000);
    } else {
      // Load immediately if enough time has passed
      loadBalances();
    }
    
    // Clear any existing interval
    if (balancesIntervalRef.current) {
      clearInterval(balancesIntervalRef.current);
    }
    
    // Refresh balances every 30 seconds (only if wallet is connected)
    balancesIntervalRef.current = setInterval(() => {
      loadBalances();
    }, 30000);
    
    return () => {
      if (balancesLoadTimeoutRef.current) {
        clearTimeout(balancesLoadTimeoutRef.current);
      }
      if (balancesIntervalRef.current) {
        clearInterval(balancesIntervalRef.current);
      }
    };
  }, [walletAddress]);
  
  // Calculate trading statistics
  const tradingStats = useMemo(() => {
    // Only show stats if we have metrics or trades
    if (!metrics && (!trades || (Array.isArray(trades) && trades.length === 0))) {
      return null;
    }
    
    const activePositions = Array.isArray(trades) 
      ? trades.filter(trade => 
          trade && (trade.status === 'pending' || trade.status === 'executed')
        ).length 
      : 0;
    
    const totalProfit = metrics?.netProfit ?? 0;
    const totalTrades = metrics?.totalTrades ?? (Array.isArray(trades) ? trades.length : 0);
    const winRate = (metrics?.winRate !== null && metrics?.winRate !== undefined) ? metrics.winRate : null;
    const profitChange24h = metrics?.netProfitChange24h ?? 0;
    
    // Only return stats if we have meaningful data
    if (totalTrades === 0 && totalProfit === 0 && activePositions === 0) {
      return null;
    }
    
    return {
      totalProfit,
      totalTrades,
      winRate,
      activePositions,
      profitChange24h,
    };
  }, [metrics, trades]);
  
  // Calculate total wallet value
  const totalWalletValue = useMemo(() => {
    if (!walletBalances) return null;
    
    // This is a simplified calculation - in production, you'd fetch current prices
    // For now, we'll just show the balances
    return walletBalances;
  }, [walletBalances]);

  const isLoading = loading || metricsLoading || tradesLoading || balancesLoading;
  
  // Early returns must be after all hooks
  if (isLoading && !user) {
    return (
      <div className="profile-page">
        <div className="profile-page-shell">
          <LoadingSpinner message="Loading profile..." size="medium" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="profile-page">
        <div className="profile-page-shell">
          <div className="profile-page-error">
            <Shield size={48} />
            <h2>Authentication Required</h2>
            <p>Please log in to view your profile.</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Validate user object
  if (typeof user !== 'object' || user === null) {
    console.error('Invalid user object:', user);
    return (
      <div className="profile-page">
        <div className="profile-page-shell">
          <div className="profile-page-error">
            <Shield size={48} />
            <h2>Error Loading Profile</h2>
            <p>Invalid user data. Please try logging in again.</p>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced date formatting with error handling
  const memberSince = (() => {
    if (!user.created_at) return 'N/A';
    try {
      const date = new Date(user.created_at);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'N/A';
    }
  })();

  // Safe user initial extraction
  const userInitial = (() => {
    try {
      if (user?.username && typeof user.username === 'string' && user.username.length > 0) {
        return user.username.charAt(0).toUpperCase();
      }
      if (user?.email && typeof user.email === 'string' && user.email.length > 0) {
        return user.email.charAt(0).toUpperCase();
      }
      return 'U';
    } catch (error) {
      console.error('Error extracting user initial:', error);
      return 'U';
    }
  })();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const handleSaveUsername = async () => {
    if (!usernameDraft || !usernameDraft.trim()) return;
    try {
      setProfileSaving(true);
      await updateProfile(usernameDraft.trim());
      setIsEditingUsername(false);
    } catch (err) {
      // Error is handled by context; keep UI minimal here
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    if (!currentPassword || !newPassword) {
      setPasswordError('Enter current password and a new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    try {
      setPasswordSaving(true);
      await changePassword(currentPassword, newPassword);
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError(null);
    } catch (err) {
      setPasswordError(err?.message || 'Failed to change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleEnableBiometric = async () => {
    try {
      setBiometricBusy(true);
      await registerBiometric();
      setBiometricRegistered(true);
    } catch (err) {
      // Context already normalizes error messages; keep minimal here
    } finally {
      setBiometricBusy(false);
    }
  };

  const handleDisableBiometric = () => {
    try {
      removeBiometricCredential?.();
    } finally {
      setBiometricRegistered(false);
    }
  };

  const handleResendVerification = async () => {
    if (!hasResendVerification) {
      toast.error('Authentication service not available');
      return;
    }
    if (!user?.email) {
      toast.error('Email address not found');
      return;
    }
    try {
      setResendingVerification(true);
      // Pass current path for redirect after verification (for DEX users)
      const redirectTo = location.pathname || '/dex-edu/profile';
      const response = await resendVerification(user.email, redirectTo);
      // For authenticated users, backend returns clear error if email doesn't exist
      if (response?.success && response?.message?.includes('Verification email sent')) {
        toast.success('Verification email sent! Please check your inbox (including spam/junk folder).');
      } else if (response?.success && response?.message?.includes('If an account exists')) {
        // This should not happen for authenticated users, but handle it just in case
        toast.warning('Please check your email address.');
      } else {
        toast.error(response?.error || 'Failed to send verification email');
      }
    } catch (err) {
      // Check error type
      const errorMsg = err?.message || err?.error || 'Failed to send verification email';
      if (errorMsg.includes('already verified')) {
        toast.info('Your email is already verified.');
      } else if (errorMsg.includes('not found') || errorMsg.includes('Email address not found')) {
        toast.error('Email address not found. Please register first.');
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setResendingVerification(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-page-shell">
        {/* Header */}
        <div className="profile-page-header">
          <h1 className="profile-page-title">Profile</h1>
          <p className="profile-page-subtitle">Manage your account information and settings</p>
        </div>

        {/* Profile Card */}
        <div className="profile-card">
          {/* Avatar & Basic Info */}
          <div className="profile-card-header">
            <div className="profile-avatar">
              <span className="profile-avatar-initial">{userInitial}</span>
            </div>
            <div className="profile-card-header-info">
              <h2 className="profile-username">{user.username || user.email}</h2>
              {user.email && user.email !== user.username && (
                <p className="profile-email">{user.email}</p>
              )}
              <div className="profile-badges">
                {user.emailVerified ? (
                  <span className="profile-badge verified">
                    <CheckCircle size={14} />
                    Email Verified
                  </span>
                ) : (
                  <>
                    <span className="profile-badge unverified">
                      <XCircle size={14} />
                      Email Not Verified
                    </span>
                    <button
                      onClick={handleResendVerification}
                      disabled={resendingVerification}
                      className="profile-resend-btn"
                      title="Resend verification email"
                      style={{
                        marginLeft: '8px',
                        padding: '4px 12px',
                        fontSize: '12px',
                        background: 'rgba(0, 255, 163, 0.1)',
                        border: '1px solid rgba(0, 255, 163, 0.3)',
                        color: '#00FFA3',
                        borderRadius: '4px',
                        cursor: resendingVerification ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        opacity: resendingVerification ? 0.6 : 1
                      }}
                    >
                      <Send size={12} />
                      {resendingVerification ? 'Sending...' : 'Resend Email'}
                    </button>
                  </>
                )}
                {user.isMember && (
                  <span className="profile-badge member">
                    <Shield size={14} />
                    Member
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="profile-card-body">
            <div className="profile-section">
              <h3 className="profile-section-title">Account Information</h3>
              
              <div className="profile-info-grid">
                {/* User ID */}
                <div className="profile-info-item">
                  <div className="profile-info-label">
                    <User size={16} />
                    <span>User ID</span>
                  </div>
                  <div className="profile-info-value">
                    {user.id || 'N/A'}
                  </div>
                </div>

                {/* Email */}
                {user.email && (
                  <div className="profile-info-item">
                    <div className="profile-info-label">
                      <Mail size={16} />
                      <span>Email</span>
                    </div>
                    <div className="profile-info-value">
                      {user.email}
                    </div>
                  </div>
                )}

                {/* Username */}
                {user.username && (
                  <div className="profile-info-item">
                    <div className="profile-info-label">
                      <User size={16} />
                      <span>Username</span>
                    </div>
                    <div className="profile-info-value">
                      {isEditingUsername ? (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <input
                            type="text"
                            value={usernameDraft}
                            onChange={(e) => setUsernameDraft(e.target.value)}
                            disabled={profileSaving}
                            style={{
                              height: 34,
                              padding: '0 10px',
                              borderRadius: 8,
                              border: '1px solid rgba(255,255,255,0.15)',
                              background: 'rgba(255,255,255,0.04)',
                              color: '#fff',
                              minWidth: 180
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleSaveUsername}
                            disabled={profileSaving}
                            className="profile-action-btn"
                            style={{ padding: '8px 10px' }}
                            title="Save"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingUsername(false);
                              setUsernameDraft(user.username || '');
                            }}
                            disabled={profileSaving}
                            className="profile-action-btn"
                            style={{ padding: '8px 10px' }}
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <span>{user.username}</span>
                          <button
                            type="button"
                            onClick={() => setIsEditingUsername(true)}
                            className="profile-action-btn"
                            style={{ padding: '8px 10px' }}
                            title="Edit username"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Telegram ID */}
                <div className="profile-info-item">
                  <div className="profile-info-label">
                    <Smartphone size={16} />
                    <span>Telegram ID</span>
                  </div>
                  <div className="profile-info-value">
                    {user.telegram_id ? (
                      user.telegram_id
                    ) : telegramFromWallet?.telegram_id ? (
                      <span title={telegramFromWallet?.username ? `@${telegramFromWallet.username}` : undefined}>
                        {telegramFromWallet.telegram_id}
                      </span>
                    ) : telegramProfile?.telegram_id ? (
                      <span title={telegramProfile?.telegram_username ? `@${telegramProfile.telegram_username}` : undefined}>
                        {telegramProfile.telegram_id}
                      </span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>Not connected</span>
                        <button
                          type="button"
                          onClick={handleStartTelegramLink}
                          disabled={telegramLinkBusy}
                          className="profile-action-btn"
                          style={{ padding: '8px 10px', width: 'fit-content' }}
                          title="Generate a code to link Telegram"
                        >
                          {telegramLinkBusy ? 'Generating…' : 'Connect Telegram'}
                        </button>
                        {telegramLink?.code && (
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.35 }}>
                            Send to the Telegram bot: <span style={{ fontFamily: 'monospace', color: '#00FFA3' }}>/link {telegramLink.code}</span>
                            {telegramLink.expiresAt ? (
                              <div style={{ marginTop: 4, opacity: 0.8 }}>Expires: {new Date(telegramLink.expiresAt).toLocaleString()}</div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Telegram Data (full bundle) */}
                {(user.telegram_id || telegramProfile?.ok) && (
                  <div className="profile-info-item" style={{ gridColumn: '1 / -1' }}>
                    <div className="profile-info-label">
                      <Smartphone size={16} />
                      <span>Telegram Data (all)</span>
                    </div>
                    <div className="profile-info-value" style={{ width: '100%' }}>
                      {telegramProfileLoading ? (
                        <div style={{ padding: '10px 0' }}>
                          <LoadingSpinner size="small" message="Loading Telegram data..." />
                        </div>
                      ) : telegramProfile?.ok ? (
                        <div style={{ display: 'grid', gap: 10 }}>
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13 }}>
                            <span><strong>Username:</strong> {telegramProfile.telegram_username || telegramProfile.activity?.username || 'n/a'}</span>
                            <span><strong>Wallet:</strong> {telegramProfile.activity?.wallet_address || 'n/a'}</span>
                            <span><strong>Seconds spent:</strong> {telegramProfile.activity?.seconds_spent ?? 0}</span>
                            <span><strong>Messages:</strong> {telegramProfile.activity?.messages_total ?? 0}</span>
                            <span><strong>Streak:</strong> {telegramProfile.activity?.streak_days ?? 0}</span>
                            <span><strong>Rewards pending:</strong> {telegramProfile.rewards?.summary?.pending ?? 0}</span>
                            <span><strong>Rewards claimed:</strong> {telegramProfile.rewards?.summary?.claimed ?? 0}</span>
                            <span><strong>Words:</strong> {telegramProfile.words?.total ?? 0}</span>
                          </div>

                          <details style={{ width: '100%' }}>
                            <summary style={{ cursor: 'pointer', opacity: 0.9 }}>Raw Telegram DB (all fields)</summary>
                            <pre style={{
                              marginTop: 10,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              fontSize: 12,
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.10)',
                              borderRadius: 10,
                              padding: 12,
                              maxHeight: 380,
                              overflow: 'auto'
                            }}>
                              {JSON.stringify(telegramProfile, null, 2)}
                            </pre>
                          </details>
                        </div>
                      ) : (
                        <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>
                          Telegram data not available yet.
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Phone Number */}
                <div className="profile-info-item">
                  <div className="profile-info-label">
                    <Smartphone size={16} />
                    <span>Phone Number</span>
                  </div>
                  <div className="profile-info-value">
                    {phoneVerificationMode === 'send' ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                          type="tel"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          placeholder="+1234567890"
                          disabled={phoneSending}
                          style={{
                            height: 34,
                            padding: '0 10px',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.15)',
                            background: 'rgba(255,255,255,0.04)',
                            color: '#fff',
                            minWidth: 180,
                            fontSize: '13px'
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleSendPhoneCode}
                          disabled={phoneSending || !phoneInput.trim()}
                          className="profile-action-btn"
                          style={{ padding: '8px 10px' }}
                          title="Send verification code"
                        >
                          {phoneSending ? <LoadingSpinner size="small" message="" /> : <Send size={16} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPhoneVerificationMode(null);
                            setPhoneInput('');
                          }}
                          disabled={phoneSending}
                          className="profile-action-btn"
                          style={{ padding: '8px 10px' }}
                          title="Cancel"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : phoneVerificationMode === 'verify' ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          value={phoneCode}
                          onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="6-digit code"
                          maxLength={6}
                          disabled={phoneVerifying}
                          style={{
                            height: 34,
                            padding: '0 10px',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.15)',
                            background: 'rgba(255,255,255,0.04)',
                            color: '#fff',
                            minWidth: 120,
                            fontSize: '13px',
                            fontFamily: 'monospace',
                            letterSpacing: '2px'
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyPhoneCode}
                          disabled={phoneVerifying || phoneCode.length !== 6}
                          className="profile-action-btn"
                          style={{ padding: '8px 10px' }}
                          title="Verify code"
                        >
                          {phoneVerifying ? <LoadingSpinner size="small" message="" /> : <Check size={16} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPhoneVerificationMode(null);
                            setPhoneCode('');
                            setPhoneInput('');
                          }}
                          disabled={phoneVerifying}
                          className="profile-action-btn"
                          style={{ padding: '8px 10px' }}
                          title="Cancel"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : user.phone ? (
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span>{user.phone}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setPhoneVerificationMode('send');
                            setPhoneInput(user.phone || '');
                          }}
                          className="profile-action-btn"
                          style={{ padding: '8px 10px' }}
                          title="Update phone number"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>Not set</span>
                        <button
                          type="button"
                          onClick={() => setPhoneVerificationMode('send')}
                          className="profile-action-btn"
                          style={{ padding: '8px 10px' }}
                          title="Add phone number"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Connected Wallet (from context) */}
                {walletAddress && typeof walletAddress === 'string' && walletAddress.length > 0 && (
                  <div className="profile-info-item">
                    <div className="profile-info-label">
                      <Wallet size={16} />
                      <span>Connected Wallet</span>
                    </div>
                    <div className="profile-info-value profile-info-wallet">
                      {walletAddress.length >= 10 
                        ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                        : walletAddress}
                      <span className="profile-info-wallet-full" title={walletAddress}>
                        {walletAddress}
                      </span>
                    </div>
                  </div>
                )}

                {/* Member Since */}
                {user.created_at && (
                  <div className="profile-info-item">
                    <div className="profile-info-label">
                      <Calendar size={16} />
                      <span>Member Since</span>
                    </div>
                    <div className="profile-info-value">
                      {memberSince}
                    </div>
                  </div>
                )}

                {/* Email Verified */}
                <div className="profile-info-item">
                  <div className="profile-info-label">
                    <CheckCircle size={16} />
                    <span>Email Verified</span>
                  </div>
                  <div className="profile-info-value">
                    {user.emailVerified ? (
                      <span className="profile-status verified">Yes</span>
                    ) : (
                      <span className="profile-status unverified">No</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Associated Wallets Section - Always show if authenticated */}
            {isAuthenticated && (
              <div className="profile-section" style={{ marginTop: '24px' }}>
                <h3 className="profile-section-title">
                  <Wallet size={18} style={{ display: 'inline-block', marginRight: '8px' }} />
                  Associated Wallets
                </h3>
                
                {walletsLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <LoadingSpinner size="small" message="Loading wallets..." />
                  </div>
                ) : associatedWallets.length > 0 ? (
                  <div className="profile-wallets-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {associatedWallets.map((wallet, index) => {
                      const address = wallet.wallet_address || wallet.address || '';
                      const type = wallet.wallet_type || wallet.type || 'EVM';
                      const network = wallet.network || '';
                      const isCopied = copiedWallet === address;
                      
                      return (
                        <div 
                          key={index} 
                          className="profile-wallet-item"
                          style={{
                            padding: '10px 14px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            display: 'inline-flex',
                            width: 'fit-content',
                            maxWidth: '100%',
                            alignItems: 'center',
                            gap: '10px'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <Wallet size={14} />
                              <span style={{ fontSize: '13px', fontWeight: 500 }}>
                                {type} {network ? `(${network})` : ''}
                              </span>
                            </div>
                            <div 
                              style={{ 
                                fontSize: '12px', 
                                color: 'rgba(255, 255, 255, 0.7)',
                                fontFamily: 'monospace',
                                wordBreak: 'break-all'
                              }}
                              title={address}
                            >
                              {address.length >= 10 
                                ? `${address.slice(0, 8)}...${address.slice(-6)}`
                                : address}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              if (navigator.clipboard) {
                                navigator.clipboard.writeText(address);
                                setCopiedWallet(address);
                                setTimeout(() => setCopiedWallet(null), 2000);
                                toast.success('Wallet address copied!');
                              }
                            }}
                            style={{
                              padding: '6px 10px',
                              background: 'rgba(0, 255, 163, 0.1)',
                              border: '1px solid rgba(0, 255, 163, 0.3)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: '#00FFA3',
                              fontSize: '12px'
                            }}
                            title="Copy address"
                          >
                            {isCopied ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : walletsError ? (
                  <div style={{ padding: '12px', background: 'rgba(255, 77, 77, 0.1)', borderRadius: '8px', color: '#ff4d4d' }}>
                    {walletsError}
                  </div>
                ) : (
                  <div style={{ padding: '12px', color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>
                    {walletAddress ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <strong>Wallet connected:</strong> <span style={{ fontFamily: 'monospace', color: '#00FFA3' }}>{walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</span>
                        </div>
                        {associatingWalletRef.current ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00FFA3' }}>
                            <LoadingSpinner size="small" message="" />
                            <span>Associating wallet with your account...</span>
                          </div>
                        ) : (
                          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>
                            This wallet will be automatically associated with your account.
                            {user?.telegram_id && (
                              <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(20, 241, 149, 0.1)', borderRadius: '6px', fontSize: '11px' }}>
                                ℹ️ If you have a wallet linked in Telegram, it will also appear here automatically.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : user?.telegram_id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>No wallets associated yet.</div>
                        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>
                          {user.telegram_id && (
                            <div style={{ marginTop: '4px', padding: '8px', background: 'rgba(20, 241, 149, 0.1)', borderRadius: '6px' }}>
                              ℹ️ You have Telegram ID: {user.telegram_id}. If you linked a wallet in Telegram, it should appear here automatically.
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', marginTop: '4px' }}>
                          Connect a wallet in the header to associate it with your account.
                        </div>
                      </div>
                    ) : (
                      'No wallets associated yet. Connect a wallet to associate it with your account.'
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Trading Statistics Section - Only for users with trading activity */}
            {tradingStats && (
              <div className="profile-section">
                <h3 className="profile-section-title">
                  <BarChart3 size={18} style={{ display: 'inline-block', marginRight: '8px' }} />
                  Trading Statistics
                </h3>
                
                <div className="profile-trading-stats-grid">
                  <div className="profile-stat-card">
                    <div className="profile-stat-label">Total Profit</div>
                    <div className={`profile-stat-value ${tradingStats.totalProfit >= 0 ? 'positive' : 'negative'}`}>
                      {formatCurrency(tradingStats.totalProfit, '$', 2)}
                    </div>
                    {tradingStats.profitChange24h !== 0 && (
                      <div className={`profile-stat-change ${tradingStats.profitChange24h >= 0 ? 'positive' : 'negative'}`}>
                        {tradingStats.profitChange24h >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {tradingStats.profitChange24h >= 0 ? '+' : ''}{formatCurrency(Math.abs(tradingStats.profitChange24h), '$', 2)} (24h)
                      </div>
                    )}
                  </div>
                  
                  <div className="profile-stat-card">
                    <div className="profile-stat-label">Total Trades</div>
                    <div className="profile-stat-value">
                      {tradingStats.totalTrades}
                    </div>
                  </div>
                  
                  {tradingStats.winRate !== null && tradingStats.winRate !== undefined && (
                    <div className="profile-stat-card">
                      <div className="profile-stat-label">Win Rate</div>
                      <div className="profile-stat-value">
                        {typeof tradingStats.winRate === 'number' ? tradingStats.winRate.toFixed(2) : '0.00'}%
                      </div>
                    </div>
                  )}
                  
                  <div className="profile-stat-card">
                    <div className="profile-stat-label">Active Positions</div>
                    <div className="profile-stat-value">
                      {tradingStats.activePositions}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Wallet Balances Section - Only for users with connected wallet */}
            {walletAddress && (
              <div className="profile-section">
                <h3 className="profile-section-title">
                  <Coins size={18} style={{ display: 'inline-block', marginRight: '8px' }} />
                  Wallet Balances
                </h3>
                
                {balancesLoading ? (
                  <div className="profile-loading-balances">
                    <LoadingSpinner message="Loading balances..." size="small" />
                  </div>
                ) : balancesError ? (
                  <div className="profile-balances-error">
                    <p>Unable to load wallet balances: {balancesError}</p>
                    <p className="profile-balances-error-hint">Make sure your wallet is connected and on BSC network.</p>
                  </div>
                ) : walletBalances ? (
                  <div className="profile-wallet-balances-grid">
                    {Object.entries(walletBalances)
                      .filter(([symbol, balance]) => {
                        const balanceNum = parseFloat(balance);
                        return !isNaN(balanceNum) && balanceNum > 0;
                      })
                      .map(([symbol, balance]) => {
                        const balanceNum = parseFloat(balance);
                        return (
                          <div key={symbol} className="profile-balance-item">
                            <div className="profile-balance-symbol">{symbol}</div>
                            <div className="profile-balance-amount">
                              {formatLargeNumber(balanceNum, symbol === 'BNB' ? 4 : 2)}
                            </div>
                          </div>
                        );
                      })}
                    {Object.values(walletBalances).every(b => parseFloat(b) === 0) && (
                      <div className="profile-balances-empty">
                        <Wallet size={24} />
                        <p>No balances found</p>
                        <p className="profile-balances-empty-hint">Your wallet appears to be empty.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="profile-balances-empty">
                    <Wallet size={24} />
                    <p>Wallet not connected</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Account Actions */}
            <div className="profile-section">
              <h3 className="profile-section-title">Account Actions</h3>
              
              <div className="profile-actions">
                {/* Security quick actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Lock size={16} />
                      <span style={{ opacity: 0.9 }}>Password</span>
                    </div>
                    <button
                      type="button"
                      className="profile-action-btn"
                      onClick={() => {
                        setShowPasswordForm(v => !v);
                        setPasswordError(null);
                      }}
                    >
                      {showPasswordForm ? 'Close' : 'Change'}
                    </button>
                  </div>

                  {showPasswordForm && (
                    <div style={{ display: 'grid', gap: 10 }}>
                      {passwordError && (
                        <div style={{ color: '#fff', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', padding: '10px 12px', borderRadius: 10 }}>
                          {passwordError}
                        </div>
                      )}
                      <input
                        type="password"
                        placeholder="Current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={passwordSaving}
                        style={{ height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#fff', padding: '0 12px' }}
                      />
                      <input
                        type="password"
                        placeholder="New password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={passwordSaving}
                        style={{ height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#fff', padding: '0 12px' }}
                      />
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={passwordSaving}
                        style={{ height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#fff', padding: '0 12px' }}
                      />
                      <button
                        type="button"
                        className="profile-action-btn"
                        onClick={handleChangePassword}
                        disabled={passwordSaving}
                      >
                        {passwordSaving ? 'Saving…' : 'Save password'}
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Fingerprint size={16} />
                      <span style={{ opacity: 0.9 }}>
                        Biometric {biometricAvailable ? (biometricRegistered ? 'enabled' : 'available') : 'unavailable'}
                      </span>
                    </div>
                    {biometricAvailable && !biometricRegistered && (
                      <button
                        type="button"
                        className="profile-action-btn"
                        onClick={handleEnableBiometric}
                        disabled={biometricBusy}
                        title="Register biometric login on this device"
                      >
                        {biometricBusy ? 'Enabling…' : 'Enable'}
                      </button>
                    )}
                    {biometricAvailable && biometricRegistered && (
                      <button
                        type="button"
                        className="profile-action-btn"
                        onClick={handleDisableBiometric}
                        disabled={biometricBusy}
                        title="Disable biometric login on this device"
                      >
                        Disable
                      </button>
                    )}
                  </div>
                </div>

                <button
                  className="profile-action-btn profile-action-btn-logout"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

Profile.displayName = 'Profile';

export default Profile;
