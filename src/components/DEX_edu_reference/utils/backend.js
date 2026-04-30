/* Resolve backend URL - now uses centralized apiEndpoints */
/* eslint-disable no-undef */
import { getBackendUrl } from '../config/apiEndpoints';
import { storeRefreshToken } from './deviceFingerprint';

// Use centralized endpoint resolver
export const BACKEND_URL = getBackendUrl();

// GET /api/auth/wallets - get user's associated wallets
export const getUserWallets = async () => {
  try {
    const { fetchJson } = await import('./http');
    const response = await fetchJson('/api/auth/wallets', { method: 'GET' });
    return response.wallets || [];
  } catch (err) {
    if (err.message && (err.message.includes('Not authenticated') || err.message.includes('401'))) {
      return [];
    }
    throw err;
  }
};

// POST /api/auth/auto-login - auto-login with refresh token (trusted device)
// Now includes IP and location for security verification
export const autoLogin = async (refreshToken, deviceFingerprint, deviceInfo = null) => {
  if (!refreshToken || !deviceFingerprint) {
    throw new Error('Refresh token and device fingerprint are required');
  }
  
  try {
    // Import here to avoid circular dependency
    const deviceFingerprintModule = await import('./deviceFingerprint');
    const { getIPAndLocation, storeLastLocation, getLastLocation, hasLocationChanged } = deviceFingerprintModule;
    
    // Get current IP and location
    const currentLocation = deviceInfo ? {
      ip: deviceInfo.ip,
      country: deviceInfo.country,
      countryCode: deviceInfo.countryCode,
      city: deviceInfo.city
    } : await getIPAndLocation();
    
    // Get last known location
    const lastLocation = getLastLocation();
    
    // Check if location changed significantly
    const locationChanged = hasLocationChanged(currentLocation, lastLocation);
    
    // Prepare request body with security info
    const requestBody = {
      refreshToken,
      deviceFingerprint,
      ip: currentLocation.ip,
      country: currentLocation.country,
      countryCode: currentLocation.countryCode,
      city: currentLocation.city,
      locationChanged // Flag to indicate if location changed
    };
    
    const { fetchJson } = await import('./http');
    const response = await fetchJson('/api/auth/auto-login', {
      method: 'POST',
      body: requestBody,
      credentials: 'include'
    });
    
    const userSession = {
      id: response.id,
      email: response.email,
      username: response.username,
      provider: 'email',
      isMember: response.isMember || false,
      emailVerified: response.emailVerified || false
    };
    
    localStorage.setItem('bits_user', JSON.stringify(userSession));
    
    // Update last known location
    storeLastLocation(
      currentLocation.ip,
      currentLocation.country,
      currentLocation.countryCode,
      currentLocation.city
    );
    
    return { 
      user: userSession,
      locationChanged: response.locationChanged || locationChanged,
      requiresVerification: response.requiresVerification || false
    };
  } catch (err) {
    // Clear refresh token if auto-login fails (except for network errors)
    if (err.message && !err.message.includes('timeout') && !err.message.includes('connection')) {
      localStorage.removeItem('bits_refresh_token');
    }
    throw err;
  }
};

// GET /api/auth/me - get current user profile
export const getUserProfile = async () => {
  try {
    const { fetchJson } = await import('./http');
    const response = await fetchJson('/api/auth/me', { method: 'GET' });
    // Normalize shape for consumers that expect `{ user }`
    return response ? { user: response } : null;
  } catch (err) {
    if (err.message && (err.message.includes('Not authenticated') || err.message.includes('401'))) {
      return null;
    }
    throw err;
  }
};

// POST /api/auth/signout - sign out current user
export const signOut = async (refreshToken = null) => {
  try {
    const { fetchJson } = await import('./http');
    await fetchJson('/api/auth/signout', {
      method: 'POST',
      body: refreshToken ? { refreshToken } : undefined,
      credentials: 'include',
    });
    // Also clear locally stored refresh token on explicit sign out
    storeRefreshToken(null);
    return true;
  } catch (err) {
    console.warn('[backend] signOut error:', err);
    // Best-effort local cleanup even if backend fails
    storeRefreshToken(null);
    return false;
  }
};

// POST /api/auth/wallets - associate wallet with current user
export const associateWallet = async (walletAddress, walletType = 'evm') => {
  try {
    // Skip POST when user has no session – avoids 401 and [HTTP] log
    const meRes = await fetch(`${BACKEND_URL}/api/auth/me`, { method: 'GET', credentials: 'include' });
    if (meRes.status === 401) return { skipped: true, reason: 'not_authenticated' };

    const { fetchJson } = await import('./http');

    // Backend expects wallet_type: 'EVM' | 'SOLANA'
    const normalizedWalletType = (() => {
      const t = String(walletType || '').trim();
      if (!t) return 'EVM';
      const upper = t.toUpperCase();
      if (upper === 'EVM' || upper === 'SOLANA') return upper;
      if (t.toLowerCase() === 'evm') return 'EVM';
      if (t.toLowerCase() === 'solana') return 'SOLANA';
      return upper;
    })();

    const response = await fetchJson('/api/auth/wallets', {
      method: 'POST',
      // IMPORTANT: fetchJson already JSON.stringify(body). Do not stringify here.
      body: {
        wallet_address: walletAddress,
        wallet_type: normalizedWalletType,
      },
    });
    return response;
  } catch (err) {
    // 401 = user not logged in (no session) – expected when wallet connects before email login
    if (err?.status === 401 || (err?.message && /not authenticated|401/i.test(String(err.message)))) {
      return { skipped: true, reason: 'not_authenticated' };
    }
    console.error('[backend] associateWallet error:', err);
    throw err;
  }
};

// POST /api/auth/login - sign in with email and password
export const signInWithEmail = async (email, password, deviceInfo = null) => {
  try {
    const { fetchJson } = await import('./http');
    const body = { email, password };
    
    // Add device fingerprint info if provided
    if (deviceInfo) {
      Object.assign(body, deviceInfo);
    }
    
    const response = await fetchJson('/api/auth/login', {
      method: 'POST',
      body: body,
      credentials: 'include'
    });
    
    // Backend returns { id, email, username, isMember, emailVerified, refreshToken }
    // Convert to { user: {...} } format for consistency
    if (response && response.refreshToken) {
      storeRefreshToken(response.refreshToken);
    }
    return { user: response };
  } catch (err) {
    throw err;
  }
};

// POST /api/auth/register - sign up with email, username, and password
export const signUpWithEmail = async (email, password, username, deviceInfo = null) => {
  try {
    const { fetchJson } = await import('./http');
    const body = { email, password, username };
    
    // Add device fingerprint info if provided
    if (deviceInfo) {
      Object.assign(body, deviceInfo);
    }
    
    const response = await fetchJson('/api/auth/register', {
      method: 'POST',
      body: body,
      credentials: 'include'
    });
    
    // Backend returns { user: {...}, message: '...' }
    return response;
  } catch (err) {
    throw err;
  }
};

// POST /api/auth/forgot-password - request password reset
export const forgotPassword = async (email) => {
  try {
    const { fetchJson } = await import('./http');
    const response = await fetchJson('/api/auth/forgot-password', {
      method: 'POST',
      body: { email },
      credentials: 'include'
    });
    return response;
  } catch (err) {
    throw err;
  }
};

// GET /api/auth/verify-email - verify email with token
export const verifyEmail = async (token) => {
  if (!token || String(token).trim() === '') {
    throw new Error('Verification token is required');
  }
  const { fetchJson } = await import('./http');
  return await fetchJson(`/api/auth/verify-email?token=${encodeURIComponent(String(token).trim())}`, {
    method: 'GET',
    credentials: 'include',
  });
};

// POST /api/auth/reset-password - reset password with token
export const resetPassword = async (token, password) => {
  if (!token || String(token).trim() === '') {
    throw new Error('Reset token is required');
  }
  if (!password || String(password).trim() === '') {
    throw new Error('Password is required');
  }
  const { fetchJson } = await import('./http');
  return await fetchJson('/api/auth/reset-password', {
    method: 'POST',
    body: { token: String(token).trim(), password },
    credentials: 'include',
  });
};

// POST /api/auth/resend-verification - resend email verification
export const resendVerification = async (email) => {
  try {
    const { fetchJson } = await import('./http');
    const response = await fetchJson('/api/auth/resend-verification', {
      method: 'POST',
      body: { email },
      credentials: 'include'
    });
    return response;
  } catch (err) {
    throw err;
  }
};

// OAuth redirect (opens provider OAuth flow) - exported from hooks/useAuth.js but also needed here
export const signInWithProvider = (provider) => {
  // Force localhost in development to prevent redirects to production
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                        (typeof window !== 'undefined' && (
                          window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1'
                        ));
  
  if (typeof window === 'undefined') {
    throw new Error('signInWithProvider must be called in browser environment');
  }
  
  const origin = isDevelopment 
    ? `${window.location.protocol}//${window.location.hostname}:${window.location.port || '3000'}`
    : window.location.origin;
  
  const returnUrl = `${origin}/members?auth=success`;
  const { getBackendUrl } = require('../config/apiEndpoints');
  const backendUrl = getBackendUrl();
  window.location.href = `${backendUrl}/api/auth/${provider}/start?redirect=${encodeURIComponent(returnUrl)}`;
};

