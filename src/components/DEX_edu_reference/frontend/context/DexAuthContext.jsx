/**
 * 🔐 DEX Authentication Context
 * 
 * React context pentru DEX wallet-based authentication:
 * - Authentication state management
 * - Login flow (connect wallet → get nonce → sign → verify)
 * - Logout functionality
 * - Auto-check auth status
 * 
 * @module DexAuthContext
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import authApiService from '../services/authApiService';
import useWallet from '../hooks/useWallet';
import { getUserFriendlyError } from '../utils/helpers';
import { 
  isBiometricAvailable, 
  registerBiometric, 
  authenticateBiometric,
  hasBiometricCredential,
  removeBiometricCredential,
  getBiometricErrorMessage
} from '../utils/biometricAuth';
import { logWithPrefix, warnWithPrefix } from '../utils/logger';
import { hasOAuthSuccessMarker } from '../utils/oauthCallbackUrl';
import { 
  getStoredRefreshToken, 
  storeRefreshToken, 
  getDeviceInfo,
  generateDeviceFingerprint
} from '../../utils/deviceFingerprint.js';
import { autoLogin } from '../../utils/backend.js';

// Create context
const DexAuthContext = createContext(null);

// localStorage keys for DEX auth persistence
const DEX_AUTH_STORAGE_KEY = 'dex_auth_state';
const DEX_AUTH_EXPIRY_KEY = 'dex_auth_expires_at';
// Match backend session cookie (7 days) – Binance-style: stay logged in when recognized (same browser/device)
const SESSION_DAYS_DEX = 7;
const SESSION_MS_DEX = SESSION_DAYS_DEX * 24 * 60 * 60 * 1000;

/**
 * Get emailVerified from bits_user in localStorage (main site auth)
 * This is the source of truth for email verification status
 */
const getEmailVerifiedFromBitsUser = (userId = null) => {
  try {
    const bitsUserRaw = localStorage.getItem('bits_user');
    if (!bitsUserRaw) return undefined;
    const bitsUser = JSON.parse(bitsUserRaw);
    // Only use if user IDs match (if userId provided)
    if (userId && bitsUser.id && String(bitsUser.id) !== String(userId)) {
      return undefined;
    }
    return typeof bitsUser.emailVerified === 'boolean' ? bitsUser.emailVerified : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Load auth state from localStorage
 */
const loadAuthStateFromStorage = () => {
  try {
    const stored = localStorage.getItem(DEX_AUTH_STORAGE_KEY);
    const expiresAt = localStorage.getItem(DEX_AUTH_EXPIRY_KEY);
    
    if (!stored || !expiresAt) return null;
    
    // Check if session expired
    const now = Date.now();
    const expiry = parseInt(expiresAt, 10);
    if (expiry <= now) {
      // Session expired, clear storage
      localStorage.removeItem(DEX_AUTH_STORAGE_KEY);
      localStorage.removeItem(DEX_AUTH_EXPIRY_KEY);
      return null;
    }
    
    const parsed = JSON.parse(stored);
    // Hydrate emailVerified from bits_user if missing or false
    if (parsed?.user?.id) {
      const bitsEmailVerified = getEmailVerifiedFromBitsUser(parsed.user.id);
      if (bitsEmailVerified !== undefined && 
          (parsed.user.emailVerified === undefined || parsed.user.emailVerified === false)) {
        parsed.user.emailVerified = bitsEmailVerified;
      }
    }
    return parsed;
  } catch (error) {
    console.error('Error loading auth state from storage:', error);
    return null;
  }
};

/**
 * Save auth state to localStorage
 */
const saveAuthStateToStorage = (state) => {
  try {
    if (state.isAuthenticated && state.user) {
      localStorage.setItem(DEX_AUTH_STORAGE_KEY, JSON.stringify({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        walletAddress: state.walletAddress,
      }));
      if (state.sessionExpiresAt) {
        localStorage.setItem(DEX_AUTH_EXPIRY_KEY, state.sessionExpiresAt.toString());
      }
    } else {
      // Clear storage if not authenticated
      localStorage.removeItem(DEX_AUTH_STORAGE_KEY);
      localStorage.removeItem(DEX_AUTH_EXPIRY_KEY);
    }
  } catch (error) {
    console.error('Error saving auth state to storage:', error);
  }
};

/**
 * DexAuthProvider Component
 * 
 * Provides authentication state and functions to children
 */
export const DexAuthProvider = ({ children }) => {
  // Initialize state from localStorage if available (for faster initial render)
  const initialStoredState = loadAuthStateFromStorage();
  
  const [authState, setAuthState] = useState({
    isAuthenticated: initialStoredState?.isAuthenticated || false,
    user: initialStoredState?.user || null,
    walletAddress: initialStoredState?.walletAddress || null,
    loading: true,
    error: null,
    sessionExpiresAt: initialStoredState ? parseInt(localStorage.getItem(DEX_AUTH_EXPIRY_KEY) || '0', 10) : null,
  });

  const wallet = useWallet();

  /**
   * Check authentication status from backend
   * First tries DEX-specific endpoint, then falls back to main auth endpoint
   */
  const checkAuthStatus = useCallback(async () => {
    try {
      // Use only localStorage – no GET /api/dex/v1/auth/me here (avoids 401 in console).
      // Session is re-validated on login or when an authenticated action runs.
      const stored = loadAuthStateFromStorage();
      if (!stored) {
        setAuthState(prev => ({ ...prev, loading: false, isAuthenticated: false, user: null, walletAddress: null, error: null, sessionExpiresAt: null }));
        return;
      }
      const expiresAt = parseInt(localStorage.getItem(DEX_AUTH_EXPIRY_KEY) || '0', 10);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        isAuthenticated: !!stored.isAuthenticated,
        user: stored.user || null,
        walletAddress: stored.walletAddress || null,
        error: null,
        sessionExpiresAt: expiresAt || null,
      }));
      return;
    } catch (_) {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  }, []); // stable – no deps needed (only reads localStorage)

  /** Șterge eroarea globală (ex. după login email eșuat) — altfel modalul o reafișează la redeschidere fără acțiune nouă */
  const clearAuthError = useCallback(() => {
    setAuthState(prev => (prev.error ? { ...prev, error: null } : prev));
  }, []);

  /**
   * Login flow: connect wallet → get nonce → sign → verify
   */
  const login = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      logWithPrefix('DexAuth', 'login:start');

      // Step 1: Connect wallet
      const walletAddress = await wallet.connectWallet();
      if (!walletAddress) {
        throw new Error('Failed to connect wallet');
      }

      // Step 2: Get nonce from backend
      const nonceResponse = await authApiService.getNonce(walletAddress);
      // Backend returns message in response, use it directly
      const message = nonceResponse.message || `Sign this message to authenticate with DEX:\nNonce: ${nonceResponse.nonce}\nWallet: ${walletAddress}`;

      // Step 3: Sign message with wallet
      const signature = await wallet.signMessage(message);

      // Step 4: Verify signature with backend
      const verifyResponse = await authApiService.verifySignature(
        walletAddress,
        message,
        signature
      );

      if (verifyResponse.success && verifyResponse.user) {
        logWithPrefix('DexAuth', 'login:verify:ok', {
          userId: verifyResponse.user?.id,
          walletAddress
        });
        // Save refresh token if provided (wallet login might not have refresh token)
        if (verifyResponse.refreshToken) {
          storeRefreshToken(verifyResponse.refreshToken);
        }

        // Session 7 days (match backend cookie) – stay logged in when recognized, Binance-style
        const sessionExpiresAt = Date.now() + SESSION_MS_DEX;
        
        const newState = {
          isAuthenticated: true,
          user: verifyResponse.user,
          walletAddress: walletAddress,
          loading: false,
          error: null,
          sessionExpiresAt,
        };
        
        setAuthState(newState);
        saveAuthStateToStorage(newState);
        
        return { success: true, user: verifyResponse.user };
      } else {
        throw new Error(verifyResponse.message || 'Authentication failed');
      }
    } catch (error) {
      // Use user-friendly error message (Phase 3: UX Improvements)
      const errorMessage = getUserFriendlyError(error);
      warnWithPrefix('DexAuth', 'login:error', {
        message: error?.message || error
      });
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [wallet]);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      await authApiService.logout();

      const newState = {
        isAuthenticated: false,
        user: null,
        walletAddress: null,
        loading: false,
        error: null,
        sessionExpiresAt: null,
      };
      
      setAuthState(newState);
      saveAuthStateToStorage(newState);
      
      // Clear refresh token on logout (untrust device)
      storeRefreshToken(null);

      // Disconnect wallet
      wallet.disconnect();
      
      // Clear biometric credential on logout (optional - user might want to keep it)
      // Uncomment if you want to require re-registration after logout
      // removeBiometricCredential();
    } catch (error) {
      console.error('Error logging out:', error);
      // Clear state even if logout request fails
      const newState = {
        isAuthenticated: false,
        user: null,
        walletAddress: null,
        loading: false,
        error: null,
        sessionExpiresAt: null,
      };
      setAuthState(newState);
      saveAuthStateToStorage(newState);
      
      // Clear refresh token on logout error too
      storeRefreshToken(null);
      
      wallet.disconnect();
      
      // Clear biometric credential on logout error too
      // removeBiometricCredential();
    }
  }, [wallet]);

  /**
   * Auto-login with trusted device (Binance-style)
   * Tries to login automatically using refresh token + device fingerprint
   * IMPORTANT: Does NOT connect wallet - only for email/phone login
   */
  const tryAutoLogin = useCallback(async () => {
    try {
      const refreshToken = getStoredRefreshToken();
      if (!refreshToken) {
        return false; // No refresh token, skip auto-login
      }

      // Guard: avoid switching accounts on refresh.
      // If we already have a DEX auth user in storage, only accept auto-login
      // when it resolves to the same user id.
      const expectedUserId = (() => {
        try {
          const stored = loadAuthStateFromStorage();
          return stored?.user?.id ? String(stored.user.id) : null;
        } catch (_) {
          return null;
        }
      })();

      // Get device fingerprint
      const deviceFingerprint = generateDeviceFingerprint();
      if (!deviceFingerprint) {
        return false; // Cannot generate fingerprint
      }

      // Get device info (IP, location) for security
      const deviceInfo = await getDeviceInfo();

      // Try auto-login (DOES NOT connect wallet - only email/phone sessions)
      const autoLoginResponse = await autoLogin(refreshToken, deviceFingerprint, deviceInfo);
      
      if (autoLoginResponse && autoLoginResponse.user) {
        const resolvedUserId = autoLoginResponse.user?.id ? String(autoLoginResponse.user.id) : null;
        if (expectedUserId && resolvedUserId && expectedUserId !== resolvedUserId) {
          console.warn('[DexAuth] Auto-login ignored due to userId mismatch:', {
            expectedUserId,
            resolvedUserId
          });
          // Don't overwrite DEX state; fall back to checkAuthStatus() path.
          return false;
        }

        // Preserve emailVerified from existing state or bits_user if autoLogin doesn't provide it explicitly
        const prevState = loadAuthStateFromStorage();
        const preservedEmailVerified = (() => {
          // First priority: autoLogin response has explicit boolean
          if (typeof autoLoginResponse.user.emailVerified === 'boolean') {
            return autoLoginResponse.user.emailVerified;
          }
          // Second priority: prevState has it
          if (prevState?.user?.emailVerified !== undefined && typeof prevState.user.emailVerified === 'boolean') {
            return prevState.user.emailVerified;
          }
          // Third priority: bits_user (source of truth)
          const bitsEmailVerified = getEmailVerifiedFromBitsUser(autoLoginResponse.user.id);
          if (bitsEmailVerified !== undefined) {
            return bitsEmailVerified;
          }
          // Fallback: false
          return false;
        })();

        const prevUser =
          prevState?.user && resolvedUserId && String(prevState.user.id) === resolvedUserId
            ? prevState.user
            : null;

        // După auto-login sesiunea cookie e activă — hidrăm profilul complet din GET /api/auth/me
        // (avatar, telefon, IBAN mascat etc.). Înainte: user minimal fără avatar suprascria localStorage
        // la fiecare refresh și poza dispărea după reîncărcare.
        let user;
        try {
          const me = await authApiService.getMainAuthMe();
          if (me?.id && resolvedUserId && String(me.id) === resolvedUserId) {
            user = {
              id: me.id,
              email: me.email,
              username: me.username,
              isMember: me.isMember || false,
              emailVerified:
                typeof me.emailVerified === 'boolean' ? me.emailVerified : preservedEmailVerified,
              avatar: me.avatar ?? null,
              telegram_id: me.telegram_id ?? null,
              telegram_username: me.telegram_username ?? null,
              phone: me.phone ?? null,
              phoneVerified: me.phoneVerified || false,
              iban_masked: me.iban_masked ?? null,
              bic_swift: me.bic_swift ?? null,
              bank_account_holder: me.bank_account_holder ?? null,
              walletAddress: autoLoginResponse.user.walletAddress ?? prevUser?.walletAddress ?? null,
              created_at: autoLoginResponse.user.created_at || prevUser?.created_at || null,
            };
          } else {
            throw new Error('getMainAuthMe user mismatch');
          }
        } catch (_) {
          user = {
            ...(prevUser || {}),
            id: autoLoginResponse.user.id,
            email: autoLoginResponse.user.email,
            username: autoLoginResponse.user.username,
            isMember: autoLoginResponse.user.isMember || false,
            emailVerified: preservedEmailVerified,
            walletAddress: autoLoginResponse.user.walletAddress || prevUser?.walletAddress || null,
            created_at: autoLoginResponse.user.created_at || prevUser?.created_at || null,
          };
        }

        // Trusted device (fingerprint + location): longer session – 7 days (Binance-style)
        const SESSION_DAYS_TRUSTED_DEVICE = 7;
        const sessionExpiresAt = Date.now() + (SESSION_DAYS_TRUSTED_DEVICE * 24 * 60 * 60 * 1000);
        
        const newState = {
          isAuthenticated: true,
          user: user,
          walletAddress: user.walletAddress || null, // From backend, NOT from wallet connection
          loading: false,
          error: null,
          sessionExpiresAt,
        };
        
        setAuthState(newState);
        saveAuthStateToStorage(newState);
        return true;
      }
      
      return false;
    } catch (error) {
      // Auto-login failed (token expired, device not trusted, etc.)
      // This is expected and not an error - user needs to login manually
      if (process.env.NODE_ENV === 'development') {
        console.log('[DexAuth] Auto-login failed (expected):', error.message);
      }
      // Clear invalid refresh token
      storeRefreshToken(null);
      return false;
    }
  }, []);

  // ✅ Auto-check auth status on mount for email/Google sessions
  // După redirect Google: ?auth=success → hidrăm din GET /api/auth/me (sesiune cookie)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // După OAuth (Google): dacă URL are auth=success, sesiunea e în cookie – hidrăm din /api/auth/me
        if (typeof window !== 'undefined' && hasOAuthSuccessMarker(window.location)) {
          try {
            const me = await authApiService.getMainAuthMe();
            if (me && me.id) {
              const sessionExpiresAt = Date.now() + SESSION_MS_DEX;
              const newState = {
                isAuthenticated: true,
                user: {
                  id: me.id,
                  email: me.email,
                  username: me.username,
                  isMember: me.isMember,
                  emailVerified: me.emailVerified,
                  avatar: me.avatar ?? null,
                },
                walletAddress: null,
                loading: false,
                error: null,
                sessionExpiresAt,
              };
              setAuthState(newState);
              saveAuthStateToStorage(newState);
              return;
            }
          } catch (_) {
            // 401 sau eroare – continuăm cu fluxul normal
          }
        }

        // First, try auto-login with trusted device (Binance-style) - NO WALLET CONNECTION
        const autoLoginSuccess = await tryAutoLogin();
        if (autoLoginSuccess) return;

        // Dacă nu avem stare în localStorage, încercăm sesiunea principală (email/Google) din cookie
        const stillHaveStored = loadAuthStateFromStorage();
        if (!stillHaveStored) {
          try {
            const me = await authApiService.getMainAuthMe();
            if (me && me.id) {
              const sessionExpiresAt = Date.now() + SESSION_MS_DEX;
              const newState = {
                isAuthenticated: true,
                user: {
                  id: me.id,
                  email: me.email,
                  username: me.username,
                  isMember: me.isMember,
                  emailVerified: me.emailVerified,
                  avatar: me.avatar ?? null,
                },
                walletAddress: null,
                loading: false,
                error: null,
                sessionExpiresAt,
              };
              setAuthState(newState);
              saveAuthStateToStorage(newState);
              return;
            }
          } catch (_) {
            // 401 – nu e logat cu email/Google, continuăm
          }
          await checkAuthStatus();
        } else {
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      } finally {
        // Garantat: loading devine false ca ProtectedRoute să poată afișa modalul de login
        setAuthState(prev => (prev.loading ? { ...prev, loading: false } : prev));
      }
    };
    initializeAuth();
  }, [tryAutoLogin, checkAuthStatus]);

  // Auto-refresh auth status on window focus (Phase 3: UX Improvements)
  // Skip checkAuthStatus for email-only users: DEX /me returns 401 and would wipe stored session
  useEffect(() => {
    const handleFocus = () => {
      if (authState.loading) return;
      const stored = loadAuthStateFromStorage();
      const expiresAt = stored ? parseInt(localStorage.getItem(DEX_AUTH_EXPIRY_KEY) || '0', 10) : 0;
      if (stored && expiresAt > Date.now()) {
        setAuthState(prev => ({ ...prev, loading: false }));
        return;
      }
      checkAuthStatus();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkAuthStatus, authState.loading]);

  // Periodic auth status check (every 5 minutes) - Phase 3: UX Improvements
  useEffect(() => {
    const interval = setInterval(() => {
      if (!authState.loading && authState.isAuthenticated) {
        checkAuthStatus();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [checkAuthStatus, authState.loading, authState.isAuthenticated]);

  // Check session expiration and refresh if needed
  useEffect(() => {
    if (!authState.isAuthenticated || !authState.sessionExpiresAt) return;

    const checkExpiration = () => {
      const now = Date.now();
      const timeUntilExpiry = authState.sessionExpiresAt - now;
      
      // Refresh session if it expires in less than 5 minutes
      if (timeUntilExpiry > 0 && timeUntilExpiry < 5 * 60 * 1000) {
        checkAuthStatus();
      } else if (timeUntilExpiry <= 0) {
        // Session expired, clear auth state
        const newState = {
          isAuthenticated: false,
          user: null,
          walletAddress: null,
          loading: false,
          error: null,
          sessionExpiresAt: null,
        };
        setAuthState(newState);
        saveAuthStateToStorage(newState);
      }
    };

    // Check immediately
    checkExpiration();
    
    // Check every minute
    const interval = setInterval(checkExpiration, 60 * 1000);
    
    return () => clearInterval(interval);
  }, [authState.isAuthenticated, authState.sessionExpiresAt, checkAuthStatus]);

  // Handle wallet disconnect
  useEffect(() => {
    if (!wallet.isConnected && authState.isAuthenticated) {
      // Wallet disconnected, but session might still be valid (email/Google login)
      // Only clear walletAddress if it was from wallet connection, not from backend
      // If user has walletAddress from backend (OAuth or previous wallet login), keep it
      setAuthState(prev => {
        // Only clear walletAddress if it matches the disconnected wallet
        // Otherwise, keep backend-provided walletAddress
        if (prev.walletAddress && wallet.walletAddress && prev.walletAddress === wallet.walletAddress) {
          return { ...prev, walletAddress: null };
        }
        return prev;
      });
    }
  }, [wallet.isConnected, wallet.walletAddress, authState.isAuthenticated]);

  // Set loading to false after initial mount (allow user to interact with login button)
  useEffect(() => {
    // Set loading to false after a short delay to allow wallet initialization
    const timer = setTimeout(() => {
      setAuthState(prev => {
        // Only set loading to false if it's still true (initial state)
        if (prev.loading && !prev.isAuthenticated && !prev.user) {
          return { ...prev, loading: false };
        }
        return prev;
      });
    }, 100); // Short delay to ensure wallet hook has initialized

    return () => clearTimeout(timer);
  }, []); // Run only once on mount

  /**
   * Register new user with email, username, and password
   * @param {string} email - User email
   * @param {string} username - Username
   * @param {string} password - User password
   * @param {string} redirectTo - Optional redirect path after email verification (e.g., '/dex-edu/profile')
   */
  const registerWithEmail = useCallback(async (email, username, password, redirectTo = null) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const response = await authApiService.registerWithEmail(email, username, password, redirectTo);

      // Backend returns { user: { id, email, username, emailVerified }, message: '...' }
      if (response.user) {
        // Do not auto-login after registration, wait for email verification
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: null,
        }));
        return { success: true, user: response.user, message: response.message };
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = getUserFriendlyError(error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  /**
   * Login with email and password
   */
  const loginWithEmail = useCallback(async (email, password, deviceInfo = null) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const response = await authApiService.loginWithEmail(email, password, deviceInfo);

      // Backend returns { id, email, username, isMember, emailVerified, refreshToken, walletAddress?, created_at? }
      if (response.id) {
        // Save refresh token for trusted device auto-login (Binance-style)
        if (response.refreshToken) {
          storeRefreshToken(response.refreshToken);
        }

        const user = {
          id: response.id,
          email: response.email,
          username: response.username,
          isMember: response.isMember || false,
          emailVerified: response.emailVerified || false,
          walletAddress: response.walletAddress || null,
          created_at: response.created_at || null,
        };

        // Calculate session expiration (default 24h for email login)
        const sessionExpiresAt = Date.now() + SESSION_MS_DEX;
        
        const newState = {
          isAuthenticated: true,
          user: user,
          walletAddress: response.walletAddress || null,
          loading: false,
          error: null,
          sessionExpiresAt,
        };
        
        setAuthState(newState);
        saveAuthStateToStorage(newState);

        return { success: true, user: user };
      } else {
        throw new Error('Login failed: invalid response from server');
      }
    } catch (error) {
      const errorMessage = getUserFriendlyError(error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  /**
   * Login using biometric authentication (TouchID/FaceID/Fingerprint)
   * Can work without userId if credential is stored locally
   */
  const loginBiometric = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      // Try to get userId from stored credential or current auth state
      const storedUserId = typeof window !== 'undefined' 
        ? localStorage.getItem('dex_biometric_user_id') 
        : null;
      const userId = storedUserId || authState.user?.id || null;

      const result = await authenticateBiometric(userId);
      
      if (result.success && result.user) {
        // Update stored user ID if we got it from authentication
        if (result.user.id && typeof window !== 'undefined') {
          try {
            localStorage.setItem('dex_biometric_user_id', result.user.id);
          } catch (e) {
            // localStorage might be disabled
          }
        }

        // Calculate session expiration (default 24h for biometric login)
        const sessionExpiresAt = Date.now() + SESSION_MS_DEX;
        
        const newState = {
          isAuthenticated: true,
          user: result.user,
          walletAddress: result.user.walletAddress || null,
          loading: false,
          error: null,
          sessionExpiresAt,
        };
        
        setAuthState(newState);
        saveAuthStateToStorage(newState);
        return { success: true, user: result.user };
      } else {
        throw new Error('Biometric authentication failed');
      }
    } catch (error) {
      const errorMessage = getBiometricErrorMessage(error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [authState.user?.id]);

  /**
   * Register biometric credential for current user
   */
  const registerBiometricForUser = useCallback(async () => {
    try {
      if (!authState.user?.id || !authState.user?.email) {
        throw new Error('User must be logged in to register biometric');
      }

      const result = await registerBiometric(authState.user.id, authState.user.email);
      return result;
    } catch (error) {
      const errorMessage = getBiometricErrorMessage(error);
      throw new Error(errorMessage);
    }
  }, [authState.user?.id, authState.user?.email]);

  /**
   * Update profile (username, optional phone to save without verification)
   * @param {string} username
   * @param {{ phone?: string }} options - optional phone (saved as unverified)
   */
  const updateProfile = useCallback(async (username, options = {}) => {
    if (!authState.isAuthenticated) {
      throw new Error('Not authenticated');
    }
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const resp = await authApiService.updateProfile(username, options);
      if (!resp?.ok || !resp?.user) {
        throw new Error(resp?.message || 'Failed to update profile');
      }
      const newState = {
        ...authState,
        user: { ...(authState.user || {}), ...resp.user },
        loading: false,
        error: null,
      };
      setAuthState(newState);
      saveAuthStateToStorage(newState);
      return resp.user;
    } catch (err) {
      const msg = getUserFriendlyError(err);
      setAuthState(prev => ({ ...prev, loading: false, error: msg }));
      throw err;
    }
  }, [authState.isAuthenticated]);

  /**
   * Salvează avatar SVG preset (svg-0 … svg-7) — fără upload; valoare `preset:…` din API.
   */
  const saveAvatarPreset = useCallback(async (avatarPreset) => {
    if (!authState.isAuthenticated) throw new Error('Not authenticated');
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const resp = await authApiService.updateProfileAvatarPreset(avatarPreset);
      if (!resp?.ok || !resp?.user) {
        throw new Error(resp?.message || 'Failed to save avatar');
      }
      setAuthState(prev => {
        const newState = {
          ...prev,
          user: { ...(prev.user || {}), ...resp.user },
          loading: false,
          error: null,
        };
        saveAuthStateToStorage(newState);
        return newState;
      });
      return resp.user;
    } catch (err) {
      const msg = getUserFriendlyError(err);
      setAuthState(prev => ({ ...prev, loading: false, error: msg }));
      throw err;
    }
  }, [authState.isAuthenticated]);

  /**
   * Save phone number (unverified). Uses dedicated POST /api/auth/profile/phone to avoid "Route not found" when backend has no PATCH profile with phone.
   * @param {string} phone - E.164 or national format
   * @returns {Promise<object>} Updated user
   */
  const saveProfilePhone = useCallback(async (phone) => {
    if (!authState.isAuthenticated) throw new Error('Not authenticated');
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const resp = await authApiService.saveProfilePhone(phone);
      if (!resp?.ok || !resp?.user) throw new Error(resp?.message || 'Failed to save phone');
      setAuthState(prev => {
        const newState = {
          ...prev,
          user: { ...(prev.user || {}), ...resp.user },
          loading: false,
          error: null,
        };
        saveAuthStateToStorage(newState);
        return newState;
      });
      return resp.user;
    } catch (err) {
      const msg = getUserFriendlyError(err);
      setAuthState(prev => ({ ...prev, loading: false, error: msg }));
      throw err;
    }
  }, [authState.isAuthenticated]);

  /**
   * Save bank account (IBAN) for withdrawals. Backend: POST /api/auth/profile/bank.
   * @param {{ iban: string, bic_swift?: string, bank_account_holder?: string }} payload
   * @returns {Promise<object>} Updated user
   */
  const saveProfileBank = useCallback(async (payload) => {
    if (!authState.isAuthenticated) throw new Error('Not authenticated');
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const resp = await authApiService.saveProfileBank(payload);
      if (!resp?.ok || !resp?.user) throw new Error(resp?.message || 'Failed to save bank account');
      const newState = {
        ...authState,
        user: { ...(authState.user || {}), ...resp.user },
        loading: false,
        error: null,
      };
      setAuthState(newState);
      saveAuthStateToStorage(newState);
      return resp.user;
    } catch (err) {
      const msg = getUserFriendlyError(err);
      setAuthState(prev => ({ ...prev, loading: false, error: msg }));
      throw err;
    }
  }, [authState.isAuthenticated]);

  /**
   * Upload profile photo (avatar)
   * @param {File} file - Image file from input
   * @returns {Promise<{user: object}>}
   */
  const uploadProfilePhoto = useCallback(async (file) => {
    if (!authState.isAuthenticated) throw new Error('Not authenticated');
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const resp = await authApiService.uploadProfilePhoto(file);
      let avatarUrl = resp?.user?.avatar ?? resp?.avatarUrl ?? resp?.user?.avatar_url ?? null;
      try {
        const me = await authApiService.getMainAuthMe();
        if (me?.avatar) avatarUrl = me.avatar;
      } catch (_) {
        /* păstrăm avatar din răspunsul upload */
      }
      setAuthState(prev => {
        const updatedUser = resp?.user ? { ...(prev.user || {}), ...resp.user } : { ...(prev.user || {}), avatar: avatarUrl };
        if (avatarUrl && !updatedUser.avatar) updatedUser.avatar = avatarUrl;
        const newState = { ...prev, user: updatedUser, loading: false, error: null };
        saveAuthStateToStorage(newState);
        return newState;
      });
      return avatarUrl;
    } catch (err) {
      const msg = getUserFriendlyError(err);
      setAuthState(prev => ({ ...prev, loading: false, error: msg }));
      throw err;
    }
  }, [authState.isAuthenticated]);

  /**
   * Change password (requires current password)
   */
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (!authState.isAuthenticated) {
      throw new Error('Not authenticated');
    }
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const resp = await authApiService.changePassword(currentPassword, newPassword);
      setAuthState(prev => ({ ...prev, loading: false, error: null }));
      return resp;
    } catch (err) {
      const msg = getUserFriendlyError(err);
      setAuthState(prev => ({ ...prev, loading: false, error: msg }));
      throw err;
    }
  }, [authState.isAuthenticated]);

  /**
   * Update phone number (verify with OTP code; backend can use Amazon SNS for SMS when implemented).
   */
  const updatePhoneNumber = useCallback(async (phone, code) => {
    if (!authState.isAuthenticated) throw new Error('Not authenticated');
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const resp = await authApiService.updatePhoneNumber(phone, code);
      setAuthState(prev => {
        const updatedUser = resp?.user ? { ...(prev.user || {}), ...resp.user } : { ...(prev.user || {}), phone };
        if (updatedUser && !updatedUser.phoneVerified) updatedUser.phoneVerified = true;
        const newState = { ...prev, user: updatedUser, loading: false, error: null };
        saveAuthStateToStorage(newState);
        return newState;
      });
      return resp;
    } catch (err) {
      const msg = getUserFriendlyError(err);
      setAuthState(prev => ({ ...prev, loading: false, error: msg }));
      throw err;
    }
  }, [authState.isAuthenticated]);

  // 🚀 IMPORTANT: Combine backend authentication with wallet connection
  // - Backend auth (email/Google/wallet signature) sets isAuthenticated = true
  // - Wallet connection provides walletAddress for balance fetching
  // - Both can work independently or together
  // Real wallet only: walletAddress = actually connected wallet (WalletContext)
  // - backend-associated wallet (DB) is exposed separately as `associatedWalletAddress`
  // ✅ FIX: Stabilize walletAddress with useMemo to prevent infinite re-renders
  const connectedWalletAddress = useMemo(() => {
    return wallet?.isConnected ? (wallet.walletAddress || null) : null;
  }, [wallet?.isConnected, wallet?.walletAddress]);
  const associatedWalletAddress = useMemo(() => {
    return authState?.walletAddress || authState?.user?.walletAddress || null;
  }, [authState?.walletAddress, authState?.user?.walletAddress]);
  
  // isAuthenticated should be true if:
  // 1. Backend says user is authenticated (email/Google/wallet signature login), OR
  // 2. Wallet is connected (for balance fetching, but user still needs backend auth for full access)
  // For now, prioritize backend auth state, but allow wallet connection for balance display
  const effectiveIsAuthenticated = authState.isAuthenticated || false;

  /**
   * Login with OAuth provider (Google, Facebook, etc.)
   */
  const loginWithProvider = useCallback((provider) => {
    authApiService.loginWithProvider(provider);
  }, []);

  /**
   * Login/Register with phone number and OTP code
   * @param {string} phone - Phone number
   * @param {string} code - 6-digit OTP code
   */
  const loginWithPhone = useCallback(async (phone, code) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const response = await authApiService.verifyPhoneCode(phone, code);

      // Backend returns { success: true, user: {...}, message: '...' }
      if (response.success && response.user) {
        const user = {
          id: response.user.id,
          email: response.user.email,
          username: response.user.username,
          isMember: response.user.isMember || false,
          emailVerified: response.user.emailVerified !== false, // Phone users are considered verified
          phone: response.user.phone || phone,
          telegram_id: response.user.telegram_id || null,
          walletAddress: response.user.walletAddress || null,
          created_at: response.user.created_at || null,
          wallets: response.user.wallets || []
        };

        // Calculate session expiration (default 24h)
        const sessionExpiresAt = Date.now() + SESSION_MS_DEX;
        
        const newState = {
          isAuthenticated: true,
          user: user,
          walletAddress: response.user.walletAddress || null,
          loading: false,
          error: null,
          sessionExpiresAt,
        };
        
        setAuthState(newState);
        saveAuthStateToStorage(newState);

        return { success: true, user: user, message: response.message };
      } else {
        throw new Error(response.error || 'Phone authentication failed');
      }
    } catch (error) {
      const errorMessage = getUserFriendlyError(error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  const value = {
    ...authState,
    // Wallet addresses
    walletAddress: connectedWalletAddress, // SSOT: real connected wallet only
    connectedWalletAddress,
    associatedWalletAddress,
    // Use backend authentication state (email/Google/wallet signature)
    isAuthenticated: effectiveIsAuthenticated,
    login,
    loginBiometric,
    registerBiometric: registerBiometricForUser,
    logout,
    checkAuthStatus,
    clearAuthError,
    wallet,
    // Email-based auth
    registerWithEmail,
    loginWithEmail,
    // Phone-based auth
    loginWithPhone,
    verifyEmail: authApiService.verifyEmail,
    forgotPassword: authApiService.forgotPassword,
    resetPassword: authApiService.resetPassword,
    resendVerification: authApiService.resendVerification,
    // OAuth providers
    loginWithProvider,
    // Biometric helpers
    isBiometricAvailable,
    hasBiometricCredential,
    removeBiometricCredential,
    // Profile
    updateProfile,
    saveAvatarPreset,
    saveProfilePhone,
    saveProfileBank,
    uploadProfilePhoto,
    changePassword,
    updatePhoneNumber,
  };

  return (
    <DexAuthContext.Provider value={value}>
      {children}
    </DexAuthContext.Provider>
  );
};

/** Stable fallback when useDexAuth is used outside DexAuthProvider (wrong route tree, portal, tests). Avoids crash. */
const DEFAULT_DEX_AUTH_VALUE = {
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  walletAddress: null,
  connectedWalletAddress: null,
  associatedWalletAddress: null,
  wallet: null,
  sessionExpiresAt: null,
  login: async () => {},
  logout: async () => {},
  checkAuthStatus: async () => {},
  clearAuthError: () => {},
  registerWithEmail: async () => {},
  loginWithEmail: async () => {},
  loginWithPhone: async () => {},
  loginWithProvider: () => {},
  loginBiometric: async () => {},
  registerBiometric: async () => {},
  verifyEmail: () => Promise.resolve(),
  forgotPassword: () => Promise.resolve(),
  resetPassword: () => Promise.resolve(),
  resendVerification: () => Promise.resolve(),
  isBiometricAvailable: false,
  hasBiometricCredential: false,
  removeBiometricCredential: async () => {},
  updateProfile: async () => {},
  saveAvatarPreset: async () => {},
  saveProfilePhone: async () => {},
  saveProfileBank: async () => {},
  uploadProfilePhoto: async () => {},
  changePassword: async () => {},
  updatePhoneNumber: async () => {},
};

/**
 * useDexAuth Hook
 *
 * Hook to access DEX authentication context. If used outside DexAuthProvider,
 * returns a safe default (unauthenticated, no-ops) so the app does not crash.
 *
 * @returns {object} Authentication state and functions
 */
export const useDexAuth = () => {
  const context = useContext(DexAuthContext);
  if (context) return context;
  return DEFAULT_DEX_AUTH_VALUE;
};

export default DexAuthContext;
