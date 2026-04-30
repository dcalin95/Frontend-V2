/**
 * 🧪 Auth API Service Test Suite
 * 
 * Tests pentru authApiService:
 * - Wallet-based authentication
 * - Email authentication
 * - Phone authentication
 * - Profile management
 * - OAuth
 * - Token refresh
 * 
 * Run with: npm test -- authApiService.test.js
 */

import {
  getNonce,
  verifySignature,
  getAuthStatus,
  logout,
  registerWithEmail,
  loginWithEmail,
  verifyEmail,
  forgotPassword,
  resetPassword,
  resendVerification,
  getUserWallets,
  sendPhoneVerificationCode,
  verifyPhoneCode,
  updatePhoneNumber,
  updateProfile,
  changePassword,
  loginWithProvider,
  refreshToken
} from '../authApiService';

import { BACKEND_URL, API_ENDPOINTS } from '../../utils/constants';

// Mock API base URL: apiEndpoints uses runtimeConfig, so mock runtimeConfig so getBackendUrl() returns localhost
jest.mock('../../../config/runtimeConfig.js', () => ({
  getBackendUrl: () => 'http://localhost:5000',
  getApiBaseUrl: () => 'http://localhost:5000/api',
}));

// Mock dependencies
jest.mock('../../utils/constants', () => ({
  BACKEND_URL: 'http://localhost:5000',
  API_ENDPOINTS: {
    DEX_AUTH_NONCE: '/api/dex/v1/auth/nonce',
    DEX_AUTH_VERIFY: '/api/dex/v1/auth/verify',
    DEX_AUTH_ME: '/api/dex/v1/auth/me',
    DEX_AUTH_LOGOUT: '/api/dex/v1/auth/logout',
    AUTH_REGISTER: '/api/auth/register',
    AUTH_LOGIN: '/api/auth/login',
    AUTH_REFRESH: '/api/auth/refresh',
    AUTH_VERIFY_EMAIL: '/api/auth/verify-email',
    AUTH_FORGOT_PASSWORD: '/api/auth/forgot-password',
    AUTH_RESET_PASSWORD: '/api/auth/reset-password',
    AUTH_RESEND_VERIFICATION: '/api/auth/resend-verification',
    AUTH_PHONE_SEND_CODE: '/api/auth/phone/send-code',
    AUTH_PHONE_VERIFY: '/api/auth/phone/verify',
    AUTH_PHONE_UPDATE: '/api/auth/phone/update'
  }
}));

jest.mock('../../utils/helpers', () => ({
  handleApiError: jest.fn((error) => {
    // handleApiError is called with an Error object that already has a message
    // We just need to re-throw it as-is
    throw error;
  })
}));

// Mock fetch
global.fetch = jest.fn();

// Mock window.location
delete window.location;
window.location = {
  protocol: 'http:',
  hostname: 'localhost',
  port: '3000',
  origin: 'http://localhost:3000',
  href: 'http://localhost:3000'
};

describe('Auth API Service - Structure Tests', () => {
  test('should export all wallet-based auth functions', () => {
    expect(typeof getNonce).toBe('function');
    expect(typeof verifySignature).toBe('function');
    expect(typeof getAuthStatus).toBe('function');
    expect(typeof logout).toBe('function');
  });

  test('should export all email auth functions', () => {
    expect(typeof registerWithEmail).toBe('function');
    expect(typeof loginWithEmail).toBe('function');
    expect(typeof verifyEmail).toBe('function');
    expect(typeof forgotPassword).toBe('function');
    expect(typeof resetPassword).toBe('function');
    expect(typeof resendVerification).toBe('function');
  });

  test('should export all phone auth functions', () => {
    expect(typeof sendPhoneVerificationCode).toBe('function');
    expect(typeof verifyPhoneCode).toBe('function');
    expect(typeof updatePhoneNumber).toBe('function');
  });

  test('should export all profile functions', () => {
    expect(typeof updateProfile).toBe('function');
    expect(typeof changePassword).toBe('function');
    expect(typeof getUserWallets).toBe('function');
  });

  test('should export OAuth and token functions', () => {
    expect(typeof loginWithProvider).toBe('function');
    expect(typeof refreshToken).toBe('function');
  });
});

describe('Auth API Service - Wallet Authentication', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('getNonce should call correct endpoint', async () => {
    const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    const mockResponse = { nonce: '12345', message: 'Sign this message' };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await getNonce(walletAddress);

    expect(fetch).toHaveBeenCalledWith(
      `${BACKEND_URL}${API_ENDPOINTS.DEX_AUTH_NONCE}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ walletAddress }),
        credentials: 'include'
      })
    );
    expect(result).toEqual(mockResponse);
  });

  test('verifySignature should call correct endpoint', async () => {
    const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    const message = 'Sign this message';
    const signature = '0x1234567890abcdef';
    const mockResponse = { success: true, user: { id: '1', email: 'test@example.com' } };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await verifySignature(walletAddress, message, signature);

    expect(fetch).toHaveBeenCalledWith(
      `${BACKEND_URL}${API_ENDPOINTS.DEX_AUTH_VERIFY}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ walletAddress, message, signature }),
        credentials: 'include'
      })
    );
    expect(result).toEqual(mockResponse);
  });

  test('getAuthStatus should call correct endpoint', async () => {
    const mockResponse = { isAuthenticated: true, user: { id: '1' } };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await getAuthStatus();

    expect(fetch).toHaveBeenCalledWith(
      `${BACKEND_URL}${API_ENDPOINTS.DEX_AUTH_ME}`,
      expect.objectContaining({
        method: 'GET',
        credentials: 'include'
      })
    );
    expect(result).toEqual(mockResponse);
  });

  test('logout should call correct endpoint', async () => {
    const mockResponse = { success: true };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await logout();

    expect(fetch).toHaveBeenCalledWith(
      `${BACKEND_URL}${API_ENDPOINTS.DEX_AUTH_LOGOUT}`,
      expect.objectContaining({
        method: 'POST',
        credentials: 'include'
      })
    );
    expect(result).toEqual(mockResponse);
  });
});

describe('Auth API Service - Email Authentication', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('registerWithEmail should call correct endpoint', async () => {
    const email = 'test@example.com';
    const username = 'testuser';
    const password = 'password123';
    const redirectTo = '/dex-edu/profile';
    const mockResponse = { user: { id: '1', email }, message: 'Registration successful' };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await registerWithEmail(email, username, password, redirectTo);

    expect(fetch).toHaveBeenCalledWith(
      `${BACKEND_URL}${API_ENDPOINTS.AUTH_REGISTER}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email, username, password, redirect: redirectTo }),
        credentials: 'include'
      })
    );
    expect(result).toEqual(mockResponse);
  });

  test('loginWithEmail should call correct endpoint', async () => {
    const email = 'test@example.com';
    const password = 'password123';
    const mockResponse = { id: '1', email, username: 'testuser', isMember: true, emailVerified: true };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await loginWithEmail(email, password);

    expect(fetch).toHaveBeenCalledWith(
      `${BACKEND_URL}${API_ENDPOINTS.AUTH_LOGIN}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      })
    );
    expect(result).toEqual(mockResponse);
  });

  test('loginWithEmail should handle deviceInfo object', async () => {
    const email = 'test@example.com';
    const password = 'password123';
    const deviceInfo = { fingerprint: 'abc123', userAgent: 'test' };
    const mockResponse = { id: '1', email };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    await loginWithEmail(email, password, deviceInfo);

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('fingerprint')
      })
    );
  });

  test('loginWithEmail should handle deviceInfo string', async () => {
    const email = 'test@example.com';
    const password = 'password123';
    const deviceInfo = JSON.stringify({ fingerprint: 'abc123' });
    const mockResponse = { id: '1', email };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    await loginWithEmail(email, password, deviceInfo);

    expect(fetch).toHaveBeenCalled();
  });

  test('forgotPassword should call POST /api/auth/forgot-password with email', async () => {
    const email = 'user@example.com';
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Reset email sent' })
    });

    const result = await forgotPassword(email);

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/auth/forgot-password',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email }),
        credentials: 'include',
      })
    );
    expect(result.success).toBe(true);
    expect(result.message).toBe('Reset email sent');
  });

  test('resetPassword should call POST /api/auth/reset-password with token and password', async () => {
    const token = 'reset-token-123';
    const newPassword = 'newSecurePass1';
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Password reset' })
    });

    const result = await resetPassword(token, newPassword);

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/auth/reset-password',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ token, password: newPassword }),
        credentials: 'include',
      })
    );
    expect(result.success).toBe(true);
  });
});

describe('Auth API Service - Error Handling', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('should handle 401 errors', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Authentication failed' })
    });

    await expect(getAuthStatus()).rejects.toThrow('Authentication failed');
  });

  test('should handle 403 errors', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: async () => ({ message: 'Access forbidden' })
    });

    await expect(getAuthStatus()).rejects.toThrow('Access forbidden');
  });

  test('403 lockout: mesaj RO doar dacă lockedUntil e în viitor', async () => {
    const past = new Date(Date.now() - 120000).toISOString();
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: async () => ({
        error: 'Still forbidden',
        lockedUntil: past,
        reason: 'too_many_attempts',
        retryAfterMinutes: 0
      })
    });

    await expect(getAuthStatus()).rejects.toThrow('Still forbidden');
  });

  test('should handle 429 errors', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      json: async () => ({ message: 'Too many requests' })
    });

    await expect(getAuthStatus()).rejects.toThrow('Too many requests');
  });

  test('should handle 500 errors', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ message: 'Server error' })
    });

    await expect(getAuthStatus()).rejects.toThrow('Server error');
  });

  test('getUserWallets should return empty array on 401', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Not authenticated' })
    });

    // Mock handleApiError to return error with proper message structure
    const { handleApiError } = require('../../utils/helpers');
    handleApiError.mockImplementationOnce((error) => {
      // Return error that has message property
      const err = error instanceof Error ? error : new Error(error?.message || 'Not authenticated');
      throw err;
    });

    const result = await getUserWallets();
    expect(result).toEqual([]);
  });
});

describe('Auth API Service - Phone Authentication', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('sendPhoneVerificationCode should call correct endpoint', async () => {
    const phone = '+1234567890';
    const mockResponse = { success: true, message: 'Code sent' };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await sendPhoneVerificationCode(phone);

    expect(fetch).toHaveBeenCalledWith(
      `${BACKEND_URL}${API_ENDPOINTS.AUTH_PHONE_SEND_CODE}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ phone }),
        credentials: 'include'
      })
    );
    expect(result).toEqual(mockResponse);
  });

  test('verifyPhoneCode should call correct endpoint', async () => {
    const phone = '+1234567890';
    const code = '123456';
    const mockResponse = { success: true, user: { id: '1' }, message: 'Verified' };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await verifyPhoneCode(phone, code);

    expect(fetch).toHaveBeenCalledWith(
      `${BACKEND_URL}/api/auth/phone/verify`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ phone, code }),
        credentials: 'include'
      })
    );
    expect(result).toEqual(mockResponse);
  });

  test('updatePhoneNumber should call correct endpoint', async () => {
    const phone = '+1234567890';
    const code = '123456';
    const mockResponse = { success: true, message: 'Phone updated', user: { id: '1' } };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await updatePhoneNumber(phone, code);

    expect(fetch).toHaveBeenCalledWith(
      `${BACKEND_URL}${API_ENDPOINTS.AUTH_PHONE_UPDATE}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ phone, code }),
        credentials: 'include'
      })
    );
    expect(result).toEqual(mockResponse);
  });
});

describe('Auth API Service - Profile Management', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('updateProfile should call correct endpoint', async () => {
    const username = 'newusername';
    const mockResponse = { ok: true, user: { id: '1', username } };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await updateProfile(username);

    expect(fetch).toHaveBeenCalledWith(
      `${BACKEND_URL}/api/auth/profile`,
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ username }),
        credentials: 'include'
      })
    );
    expect(result).toEqual(mockResponse);
  });

  test('changePassword should call correct endpoint', async () => {
    const currentPassword = 'oldpass';
    const newPassword = 'newpass';
    const mockResponse = { success: true, message: 'Password changed' };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await changePassword(currentPassword, newPassword);

    expect(fetch).toHaveBeenCalledWith(
      `${BACKEND_URL}/api/auth/change-password`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: 'include'
      })
    );
    expect(result).toEqual(mockResponse);
  });
});

describe('Auth API Service - OAuth', () => {
  beforeEach(() => {
    window.location.href = 'http://localhost:3000';
    fetch.mockClear();
  });

  test('loginWithProvider should redirect to OAuth flow', () => {
    const provider = 'google';
    loginWithProvider(provider);

    expect(window.location.href).toContain('/api/auth/google/start');
    expect(window.location.href).toContain('redirect=');
  });
});

describe('Auth API Service - Token Refresh', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('refreshToken should call correct endpoint', async () => {
    const refreshTokenValue = 'refresh_token_123';
    const mockResponse = { token: 'new_access_token', refreshToken: 'new_refresh_token' };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await refreshToken(refreshTokenValue);

    expect(fetch).toHaveBeenCalledWith(
      `${BACKEND_URL}${API_ENDPOINTS.AUTH_REFRESH}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
        credentials: 'include'
      })
    );
    expect(result).toEqual(mockResponse);
  });
});
