/**
 * 🔐 DEX Authentication API Service
 * 
 * Frontend API client pentru DEX wallet-based authentication:
 * - Nonce generation
 * - Signature verification
 * - Auth status check
 * - Logout
 * 
 * @module authApiService
 */

import { getBackendUrl, getAuthBackendUrl } from '../../config/apiEndpoints.js';
import { API_ENDPOINTS } from '../utils/constants';
import { handleApiError } from '../utils/helpers';
import { logWithPrefix, warnWithPrefix } from '../utils/logger';

const SENSITIVE_KEYS = new Set([
  'signature',
  'password',
  'token',
  'refreshToken',
  'nonce',
  'message'
]);

const sanitizePayload = (payload) => {
  if (payload === null || payload === undefined) return payload;
  if (Array.isArray(payload)) return payload.map(sanitizePayload);
  if (typeof payload !== 'object') return payload;
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [
      key,
      SENSITIVE_KEYS.has(key) ? '[REDACTED]' : sanitizePayload(value)
    ])
  );
};

const getBodyPreview = (body) => {
  if (!body) return null;
  if (typeof body === 'string') {
    try {
      return sanitizePayload(JSON.parse(body));
    } catch (_) {
      return body.slice(0, 500);
    }
  }
  return sanitizePayload(body);
};

/**
 * Generic API request helper for auth endpoints
 */
async function authApiRequest(endpoint, options = {}) {
  const requestId = Math.random().toString(36).slice(2, 8);
  const startTs = Date.now();
  try {
    const base = getBackendUrl();
    if (!base || typeof base !== 'string') {
      throw new Error('Backend URL is not configured. Please refresh the page.');
    }
    const url = `${base.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const defaultOptions = {
      method: 'GET',
      credentials: 'include', // Important: Include cookies for session-based auth
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const isAuthMeGet = endpoint.includes('/auth/me') && (options.method === 'GET' || (defaultOptions.method === 'GET'));
    if (!isAuthMeGet) {
      logWithPrefix('DEX AUTH API', '→', {
        id: requestId,
        endpoint,
        method: defaultOptions.method,
        url,
        credentials: defaultOptions.credentials,
        body: getBodyPreview(defaultOptions.body)
      });
    }

    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData.message || errorData.error;
      const is401AuthMe = response.status === 401 && endpoint.includes('auth/me');
      if (!is401AuthMe) {
        warnWithPrefix('DEX AUTH API', '←', {
          id: requestId,
          endpoint,
          status: response.status,
          durationMs: Date.now() - startTs,
          error: errorData
        });
      }
      
      // Enhanced error handling with specific status codes (backend often sends .error, not .message)
      if (response.status === 401) {
        const hint = errorData.hint ? ` ${errorData.hint}` : '';
        throw new Error((msg || 'Not authenticated.') + hint);
      } else if (response.status === 403) {
        const fallback403 = errorData.error || msg || 'Access forbidden. You don\'t have permission.';
        let fullMsg = fallback403;
        if (errorData.lockedUntil && errorData.reason === 'too_many_attempts') {
          const untilTs = Date.parse(String(errorData.lockedUntil));
          const stillLocked = Number.isFinite(untilTs) && untilTs > Date.now();
          if (stillLocked) {
            try {
              const rawMins = Number(errorData.retryAfterMinutes);
              const mins = Number.isFinite(rawMins) && rawMins > 0 ? rawMins : null;
              const retryStr =
                mins != null
                  ? `în ${mins} minute`
                  : `după ${new Date(untilTs).toLocaleString()}`;
              // După reset parolă, backend șterge lockout — vezi resetPasswordWithToken.
              fullMsg = `Cont blocat temporar (prea multe încercări). Poți încerca din nou ${retryStr}. Dacă ai primit link de resetare, deschide-l și setează parola nouă — apoi poți intra. Altfel așteaptă expirarea timpului.`;
            } catch (_) {
              fullMsg = fallback403;
            }
          }
        }
        throw new Error(fullMsg);
      } else if (response.status === 429) {
        throw new Error(msg || 'Too many requests. Please wait a moment and try again.');
      } else if (response.status === 400) {
        throw new Error(msg || 'Invalid request. Please check your input.');
      } else if (response.status >= 500) {
        throw new Error(msg || 'Server error. Please try again later.');
      }
      
      throw new Error(msg || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!isAuthMeGet) {
      logWithPrefix('DEX AUTH API', '←', {
        id: requestId,
        endpoint,
        status: response.status,
        durationMs: Date.now() - startTs,
        data
      });
    }
    return data;
  } catch (error) {
    // Don't log expected errors (401/404 for auth check, user-friendly messages)
    const isExpectedError = 
      error.message?.includes('Authentication failed') ||
      error.message?.includes('Not authenticated') ||
      error.message?.includes('Invalid') ||
      error.message?.includes('required') ||
      (error.message?.includes('HTTP 401') && endpoint.includes('/auth/me')) || // Suppress 401 for auth check
      (error.message?.includes('HTTP 404') && endpoint.includes('/auth/me'));   // Suppress 404 for auth check
    
    if (!isExpectedError) {
      console.error(`Auth API Error [${endpoint}]:`, error);
    }
    // 401 on /auth/me: no log (expected when not logged in to DEX)
    // handleApiError returns a string (error message), but in tests it's mocked to throw
    // For test compatibility, if handleApiError throws, we let it throw
    // Otherwise, we throw the original error to preserve the message
    try {
      const errorMessage = await handleApiError(error);
      // If handleApiError returns a message (production), throw original error to preserve message
      throw error;
    } catch (processedError) {
      // If handleApiError throws (tests), use that error
      throw processedError;
    }
  }
}

/**
 * Request nonce for wallet address
 * @param {string} walletAddress - Ethereum wallet address (0x...)
 * @returns {Promise<{nonce: string, message: string}>}
 */
export const getNonce = async (walletAddress) => {
  return authApiRequest(`${API_ENDPOINTS.DEX_AUTH_NONCE}`, {
    method: 'POST',
    body: JSON.stringify({ walletAddress }),
  });
};

/**
 * Verify signature and authenticate
 * @param {string} walletAddress - Ethereum wallet address
 * @param {string} message - Message that was signed
 * @param {string} signature - Signature from wallet (0x...)
 * @returns {Promise<{success: boolean, user: object, token?: string}>}
 */
export const verifySignature = async (walletAddress, message, signature) => {
  return authApiRequest(`${API_ENDPOINTS.DEX_AUTH_VERIFY}`, {
    method: 'POST',
    body: JSON.stringify({ walletAddress, message, signature }),
  });
};

/**
 * Get current authentication status (DEX wallet session)
 * @returns {Promise<{isAuthenticated: boolean, user: object|null}>}
 */
export const getAuthStatus = async () => {
  return authApiRequest(`${API_ENDPOINTS.DEX_AUTH_ME}`);
};

/**
 * Get main auth user (email/Google session) – pentru hidratare după OAuth redirect
 * @returns {Promise<{id, email, username, isMember, emailVerified, ...}>}
 */
export const getMainAuthMe = async () => {
  return authApiRequest('/api/auth/me', { method: 'GET' });
};

/**
 * Logout current user
 * @returns {Promise<{success: boolean}>}
 */
export const logout = async () => {
  return authApiRequest(`${API_ENDPOINTS.DEX_AUTH_LOGOUT}`, {
    method: 'POST',
  });
};

// ===== Email Authentication Methods =====

/**
 * Register new user with email, username, and password
 * @param {string} email - User email
 * @param {string} username - Username
 * @param {string} password - User password
 * @param {string} redirectTo - Optional redirect path after verification (e.g., '/dex-edu/profile')
 * @returns {Promise<{user: object, message: string}>}
 */
export const registerWithEmail = async (email, username, password, redirectTo = null) => {
  const body = { email, username, password };
  if (redirectTo) {
    body.redirect = redirectTo;
  }
  return authApiRequest(`${API_ENDPOINTS.AUTH_REGISTER}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

/**
 * Login with email or username and password (body field remains `email` for API compat).
 * @param {string} email - User email or username
 * @param {string} password - User password
 * @param {object} deviceInfo - Optional device fingerprint info
 * @returns {Promise<{id: string, email: string, username: string, isMember: boolean, emailVerified: boolean, refreshToken?: string}>}
 */
export const loginWithEmail = async (email, password, deviceInfo = null) => {
  const body = { email, password };
  
  // Add device fingerprint info if provided
  if (deviceInfo) {
    // Some callers historically passed JSON.stringify(fingerprint).
    // Normalize to an object before merging into body.
    let normalized = deviceInfo;
    if (typeof normalized === 'string') {
      try {
        normalized = JSON.parse(normalized);
      } catch (_) {
        normalized = null;
      }
    }
    if (normalized && typeof normalized === 'object') {
      Object.assign(body, normalized);
    }
  }
  
  return authApiRequest(`${API_ENDPOINTS.AUTH_LOGIN}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

/**
 * Verify email with token
 * @param {string} token - Email verification token
 * @returns {Promise<{success: boolean, message: string, user: object}>}
 */
export const verifyEmail = async (token) => {
  return authApiRequest(`${API_ENDPOINTS.AUTH_VERIFY_EMAIL}?token=${encodeURIComponent(token)}`, {
    method: 'GET',
  });
};

/**
 * Request password reset (forgot password)
 * @param {string} email - User email
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const forgotPassword = async (email) => {
  return authApiRequest(`${API_ENDPOINTS.AUTH_FORGOT_PASSWORD}`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

/**
 * Reset password with token
 * @param {string} token - Password reset token
 * @param {string} newPassword - New password
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const resetPassword = async (token, newPassword) => {
  return authApiRequest(`${API_ENDPOINTS.AUTH_RESET_PASSWORD}`, {
    method: 'POST',
    body: JSON.stringify({ token, password: newPassword }),
  });
};

/**
 * Resend email verification
 * @param {string} email - User email
 * @param {string} redirectTo - Optional redirect path after verification (e.g., '/dex-edu/profile')
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const resendVerification = async (email, redirectTo = null) => {
  const body = { email };
  if (redirectTo) {
    body.redirect = redirectTo;
  }
  return authApiRequest(`${API_ENDPOINTS.AUTH_RESEND_VERIFICATION}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

/**
 * Get user's associated wallets
 * Backend should automatically sync Telegram wallet if user has telegram_id
 * @returns {Promise<{wallets: Array}>}
 */
export const getUserWallets = async () => {
  try {
    const response = await authApiRequest('/api/auth/wallets', {
      method: 'GET',
    });
    // Backend should return wallets from:
    // 1. Frontend wallets table (user_wallets or similar)
    // 2. Telegram wallet from telegram_user_activity if user has telegram_id
    // 3. Any other sources (OAuth, etc.)
    return response.wallets || [];
  } catch (error) {
    // Don't throw for 401 (not authenticated)
    if (error.message?.includes('Not authenticated') || error.message?.includes('401')) {
      return [];
    }
    throw error;
  }
};

/**
 * Associate wallet with current user account
 * @param {string} walletAddress - Wallet address to associate
 * @param {string} walletType - Wallet type (default: 'evm')
 * @returns {Promise<{success: boolean, wallet: object, message: string}>}
 */
export const associateWallet = async (walletAddress, walletType = 'evm') => {
  if (!walletAddress || typeof walletAddress !== 'string' || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new Error('Invalid wallet address format');
  }

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
  if (normalizedWalletType !== 'EVM' && normalizedWalletType !== 'SOLANA') {
    throw new Error(`Invalid wallet type: ${walletType}`);
  }

  try {
    const response = await authApiRequest('/api/auth/wallets', {
      method: 'POST',
      body: JSON.stringify({ 
        wallet_address: walletAddress,
        wallet_type: normalizedWalletType,
      }),
    });
    return response;
  } catch (error) {
    // Enhance error message for 400 Bad Request
    if (error.message?.includes('400') || error.message?.includes('Bad Request')) {
      throw new Error(`Invalid request. Please check your input. Backend rejected wallet association for: ${walletAddress.slice(0, 8)}...`);
    }
    throw error;
  }
};

/**
 * Force-sync Telegram wallet into the user's wallets list (backend optional).
 * Backend is expected to:
 * - read users.telegram_id
 * - read telegram_user_activity.wallet_address for that telegram_id
 * - insert into wallets table with source='telegram' (idempotent)
 *
 * If endpoint is missing (404), we treat it as "not supported".
 */
export const syncTelegramWallet = async () => {
  try {
    return await authApiRequest('/api/auth/wallets/sync-telegram', {
      method: 'POST',
    });
  } catch (error) {
    // Not implemented on backend yet
    if (error.message?.includes('404')) return null;
    // Not authenticated
    if (error.message?.includes('Not authenticated') || error.message?.includes('401')) return null;
    throw error;
  }
};

export const getTelegramByWallet = async (walletAddress) => {
  if (!walletAddress || typeof walletAddress !== 'string' || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    return null;
  }
  try {
    return await authApiRequest(`/api/auth/telegram/by-wallet?wallet=${encodeURIComponent(walletAddress)}`, {
      method: 'GET',
    });
  } catch (error) {
    if (error.message?.includes('404')) return null;
    if (error.message?.includes('Not authenticated') || error.message?.includes('401')) {
      // Endpoint doesn't require auth, but keep it safe
      return null;
    }
    throw error;
  }
};

// Start Telegram link flow (returns one-time code)
export const startTelegramLink = async () => {
  return authApiRequest('/api/auth/telegram/link/start', {
    method: 'POST',
  });
};

// Fetch full Telegram bundle for current site user (requires auth + telegram linked)
export const getTelegramProfile = async () => {
  try {
    // Prefer DEX-auth-scoped endpoint (works even if main auth cookies are missing on localhost)
    try {
      return await authApiRequest('/api/dex/v1/auth/telegram/profile', { method: 'GET' });
    } catch (dexErr) {
      // Fall back to main auth endpoint (legacy / session-based)
      const msg = dexErr.message || '';
      if (msg.includes('404') || 
          msg.includes('Not authenticated') || 
          msg.includes('401') || 
          msg.includes('Authentication failed')) {
        // continue to fallback - try main endpoint
      } else {
        // For other errors, rethrow
        throw dexErr;
      }
    }
    return await authApiRequest('/api/auth/telegram/profile', { method: 'GET' });
  } catch (error) {
    const msg = error.message || '';
    if (msg.includes('404') || 
        msg.includes('Not authenticated') || 
        msg.includes('401') || 
        msg.includes('Authentication failed')) {
      return null;
    }
    throw error;
  }
};

/**
 * Send phone verification code
 * @param {string} phone - Phone number
 * @returns {Promise<{success: boolean, message: string, code?: string}>}
 */
export const sendPhoneVerificationCode = async (phone) => {
  return authApiRequest(API_ENDPOINTS.AUTH_PHONE_SEND_CODE, {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
};

/**
 * Verify phone verification code and login/register
 * @param {string} phone - Phone number
 * @param {string} code - 6-digit OTP code
 * @returns {Promise<{success: boolean, user: object, message: string}>}
 */
export const verifyPhoneCode = async (phone, code) => {
  return authApiRequest(API_ENDPOINTS.AUTH_PHONE_VERIFY, {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
};

/**
 * Update phone number for authenticated user
 * @param {string} phone - New phone number
 * @param {string} code - Verification code
 * @returns {Promise<{success: boolean, message: string, user: object}>}
 */
export const updatePhoneNumber = async (phone, code) => {
  return authApiRequest(API_ENDPOINTS.AUTH_PHONE_UPDATE, {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
};

/**
 * Update profile (username only). For phone use saveProfilePhone.
 * @param {string} username
 * @param {{ phone?: string }} options - optional phone (prefer saveProfilePhone to avoid route-not-found if backend has no PATCH profile with phone)
 * @returns {Promise<{ok: boolean, user: object}>}
 */
export const updateProfile = async (username, options = {}) => {
  const body = { username };
  if (options.phone !== undefined) body.phone = options.phone;
  return authApiRequest(`/api/auth/profile`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
};

/**
 * Avatar SVG preset (svg-0 … svg-7) — persistă în DB fără fișier pe disc.
 * @param {string} avatarPreset - ex. 'svg-3'
 */
export const updateProfileAvatarPreset = async (avatarPreset) => {
  return authApiRequest(`/api/auth/profile`, {
    method: 'PATCH',
    body: JSON.stringify({ avatarPreset }),
  });
};

/**
 * Save phone number (unverified). Use this to avoid "Route not found" when backend has no PATCH /api/auth/profile with phone.
 * Backend should implement: POST /api/auth/profile/phone, body { phone }, returns { ok: true, user: { ...user, phone } }.
 * @param {string} phone - E.164 or national format
 * @returns {Promise<{ok: boolean, user: object}>}
 */
export const saveProfilePhone = async (phone) => {
  return authApiRequest(API_ENDPOINTS.AUTH_PROFILE_PHONE || '/api/auth/profile/phone', {
    method: 'POST',
    body: JSON.stringify({ phone: (phone || '').trim().replace(/\s/g, '') }),
  });
};

/**
 * Get Stripe payment history (checkout sessions). Same as Join page – works with email and DEX wallet session.
 * Backend: GET /api/auth/payments/history, returns { ok: true, payments: Array<{ id, amount_total, currency, payment_status, created_at, ... }> }.
 * @returns {Promise<{ ok: boolean, payments: Array }>}
 */
export const getPaymentsHistory = async () => {
  const url = `${getBackendUrl()}${API_ENDPOINTS.AUTH_PAYMENTS_HISTORY || '/api/auth/payments/history'}`;
  const res = await fetch(url, { method: 'GET', credentials: 'include', headers: { Accept: 'application/json' } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return { ok: data.ok !== false, payments: data.payments || [] };
};

/**
 * List user documents (ID, bank statement). Backend: GET /api/auth/profile/documents.
 * @returns {Promise<{documents: Array<{id, document_type, file_name, verification_status, verification_result, created_at}>}>}
 */
export const getDocuments = async () => {
  return authApiRequest(API_ENDPOINTS.AUTH_PROFILE_DOCUMENTS || '/api/auth/profile/documents', { method: 'GET' });
};

/**
 * Upload a document (ID or bank statement). Backend: POST /api/auth/profile/documents/upload.
 * Server may run OpenAI Vision to classify and set verification_status (verified/rejected/pending).
 * @param {File} file - Image or PDF
 * @param {string} documentType - 'id' | 'bank_statement'
 * @returns {Promise<{ok: boolean, document: object, documents: array}>}
 */
const DOCUMENT_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

export const uploadDocument = async (file, documentType = 'id') => {
  if (!file) throw new Error('Select a file to upload.');
  const mime = (file.type || '').toLowerCase();
  if (!DOCUMENT_ALLOWED_TYPES.includes(mime)) {
    throw new Error('File type not allowed. Use image (JPEG, PNG, WebP, GIF) or PDF.');
  }
  const formData = new FormData();
  formData.append('document', file);
  formData.append('documentType', documentType);
  const url = `${getBackendUrl()}${API_ENDPOINTS.AUTH_PROFILE_DOCUMENTS_UPLOAD || '/api/auth/profile/documents/upload'}`;
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || err.message || `Upload failed (${response.status}).`);
  }
  return response.json();
};

/**
 * Save bank account (IBAN) for withdrawals. Backend: POST /api/auth/profile/bank.
 * @param {{ iban: string, bic_swift?: string, bank_account_holder?: string }} payload
 * @returns {Promise<{ok: boolean, user: object}>}
 */
export const saveProfileBank = async (payload) => {
  const { iban, bic_swift, bank_account_holder } = payload || {};
  const body = { iban: (iban || '').trim().replace(/\s/g, '') };
  if (bic_swift != null && String(bic_swift).trim()) body.bic_swift = String(bic_swift).trim();
  if (bank_account_holder != null && String(bank_account_holder).trim()) body.bank_account_holder = String(bank_account_holder).trim();
  return authApiRequest(API_ENDPOINTS.AUTH_PROFILE_BANK || '/api/auth/profile/bank', {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

const BANK_STATEMENT_PARSE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

/**
 * Extrage IBAN / BIC / titular din extras (PDF sau imagine). Nu salvează în profil — doar completează câmpurile în UI după răspuns.
 * Backend: POST multipart `statement`, necesită OPENAI_API_KEY pe server.
 */
export const parseProfileBankStatement = async (file) => {
  if (!file) throw new Error('Selectează un fișier (extras PDF sau poză).');
  const mime = (file.type || '').toLowerCase();
  if (!BANK_STATEMENT_PARSE_TYPES.includes(mime)) {
    throw new Error('Folosește JPEG, PNG, WebP, GIF sau PDF.');
  }
  const formData = new FormData();
  formData.append('statement', file);
  const url = `${getBackendUrl()}${API_ENDPOINTS.AUTH_PROFILE_BANK_PARSE || '/api/auth/profile/bank/parse-statement'}`;
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || err.message || `Extragere eșuată (${response.status}).`);
  }
  return response.json();
};

/**
 * Upload profile photo (avatar)
 * @param {File} file - Image file (e.g. from input type="file")
 * @returns {Promise<{ok: boolean, user: object} | {avatarUrl: string}>}
 */
export const uploadProfilePhoto = async (file) => {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Please select an image file (JPEG, PNG, GIF, WebP).');
  }
  const MAX_SIZE_MB = 5;
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`Image must be under ${MAX_SIZE_MB} MB.`);
  }
  const formData = new FormData();
  formData.append('avatar', file);
  const url = `${getBackendUrl()}${API_ENDPOINTS.AUTH_PROFILE_AVATAR || '/api/auth/profile/avatar'}`;
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      body: formData,
      headers: {},
    });
  } catch (networkErr) {
    throw new Error('Network error. Check connection and CORS/backend availability.');
  }
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err.message || err.error || err.details || err.reason;
    if (response.status === 404) {
      throw new Error('Profile photo upload is not available (endpoint not implemented).');
    }
    if (response.status === 401) {
      throw new Error('Session expired. Please sign in again.');
    }
    if (response.status === 413) {
      throw new Error(`Image too large. Maximum size is ${MAX_SIZE_MB} MB.`);
    }
    throw new Error(msg || `Upload failed (${response.status}).`);
  }
  const data = await response.json().catch(() => ({}));
  return data;
};

/**
 * Change password for authenticated user
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const changePassword = async (currentPassword, newPassword) => {
  return authApiRequest(`/api/auth/change-password`, {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
};

/**
 * Login with OAuth provider (Google, Facebook, etc.)
 * Redirects to backend OAuth flow
 * @param {string} provider - OAuth provider name (e.g., 'google')
 * @returns {void} - Redirects to OAuth flow
 */
export const loginWithProvider = (provider) => {
  const base = getAuthBackendUrl();
  if (!base || typeof base !== 'string') {
    console.error('[Auth] getAuthBackendUrl() missing – cannot start OAuth');
    return;
  }
  const origin = window.location.origin || `${window.location.protocol}//${window.location.hostname}:${window.location.port || '3000'}`;
  const returnUrl = `${origin}/#/dex-edu/profile?auth=success`;
  const authUrl = `${base.replace(/\/$/, '')}/api/auth/${provider}/start?redirect=${encodeURIComponent(returnUrl)}`;
  window.location.href = authUrl;
};

/**
 * Refresh authentication token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<{token: string, refreshToken?: string}>}
 */
export const refreshToken = async (refreshToken) => {
  return authApiRequest(`${API_ENDPOINTS.AUTH_REFRESH || '/api/auth/refresh'}`, {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
};

// Export default object for convenience
const authApiService = {
  // Wallet-based auth
  getNonce,
  verifySignature,
  getAuthStatus,
  getMainAuthMe,
  logout,
  // Email-based auth
  registerWithEmail,
  loginWithEmail,
  verifyEmail,
  forgotPassword,
  resetPassword,
  resendVerification,
  // Profile
  updateProfile,
  updateProfileAvatarPreset,
  saveProfilePhone,
  saveProfileBank,
  parseProfileBankStatement,
  getPaymentsHistory,
  uploadProfilePhoto,
  changePassword,
  getUserWallets,
  associateWallet,
  syncTelegramWallet,
  getTelegramByWallet,
  startTelegramLink,
  getTelegramProfile,
  // Phone authentication
  sendPhoneVerificationCode,
  verifyPhoneCode,
  updatePhoneNumber,
  // OAuth providers
  loginWithProvider,
  // Token refresh
  refreshToken,
};

export default authApiService;
