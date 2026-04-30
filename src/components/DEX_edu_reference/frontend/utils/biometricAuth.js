/* eslint-disable */
// 🔐 Biometric Authentication Utility for DEX
// WebAuthn API implementation for TouchID/FaceID/Fingerprint authentication
// Similar to Binance's biometric login system

import { API_BASE_URL } from './constants';

const backendUrl = API_BASE_URL;

// Constants
const BACKEND_TIMEOUT = 30000; // 30 seconds
const WEBAUTHN_TIMEOUT = 60000; // 60 seconds

/**
 * Check if biometric authentication is available on the device
 * @returns {Promise<{available: boolean, reason?: string}>}
 */
export async function isBiometricAvailable() {
  try {
    // Check if WebAuthn is supported
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      return { available: false, reason: 'WebAuthn not supported' };
    }

    // Check if platform authenticator (TouchID/FaceID/Fingerprint) is available
    // Add timeout to prevent hanging
    const availabilityCheck = Promise.race([
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Availability check timeout')), 5000)
      )
    ]);
    
    const isAvailable = await availabilityCheck;
    
    if (!isAvailable) {
      return { available: false, reason: 'Biometric authenticator not available' };
    }

    return { available: true };
  } catch (error) {
    // Don't log user cancellation errors
    if (error.name !== 'NotAllowedError' && error.name !== 'AbortError') {
      if (process.env.NODE_ENV === 'development') {
        console.error('[DEX BiometricAuth] Error checking availability:', error);
      }
    }
    return { available: false, reason: error.message || 'Unknown error' };
  }
}

/**
 * Register biometric credential for a user
 * @param {string} userId - User ID
 * @param {string} username - Username/Email
 */
export async function registerBiometric(userId, username) {
  try {
    const availability = await isBiometricAvailable();
    if (!availability.available) {
      throw new Error(availability.reason || 'Biometric authentication not available');
    }

    // Validate inputs
    if (!userId || !username) {
      throw new Error('User ID and username are required');
    }

    // Get challenge from backend with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT);
    
    let challengeBytes, userIdBytes, serverUserId;
    try {
      const challengeResponse = await fetch(`${backendUrl}/api/auth/biometric/register-challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: controller.signal,
        body: JSON.stringify({ userId, username })
      });
      
      clearTimeout(timeoutId);

      if (!challengeResponse.ok) {
        const errorData = await challengeResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to get registration challenge');
      }

      const { challenge, userId: serverUserIdFromResponse } = await challengeResponse.json();
      
      if (!challenge || !serverUserIdFromResponse) {
        throw new Error('Invalid challenge response from server');
      }
      
      serverUserId = serverUserIdFromResponse;
      
      // Decode base64 challenge to Uint8Array
      challengeBytes = Uint8Array.from(atob(challenge), c => c.charCodeAt(0));
      userIdBytes = Uint8Array.from(atob(serverUserId), c => c.charCodeAt(0));
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timeout - please check your connection');
      }
      throw fetchError;
    }

    // Create credential with proper error handling
    let credential;
    try {
      credential = await navigator.credentials.create({
        publicKey: {
          challenge: challengeBytes,
          rp: {
            name: 'BitSwapDEX',
            // RP ID must match the domain or parent domain to prevent phishing
            // Use hostname without port for production, allow localhost for development
            id: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
              ? 'localhost'
              : window.location.hostname.replace(/:\d+$/, '') // Remove port if present
          },
          user: {
            id: userIdBytes,
            name: username,
            displayName: username
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform', // TouchID/FaceID/Fingerprint
            userVerification: 'required', // Enforce biometric verification
            requireResidentKey: false, // Don't require resident key (can use multiple devices)
            residentKey: 'preferred' // Prefer discoverable credentials but allow non-discoverable
          },
          timeout: WEBAUTHN_TIMEOUT,
          attestation: 'direct'
        }
      });
    } catch (createError) {
      if (createError.name === 'NotAllowedError' || createError.name === 'AbortError') {
        throw new Error('Biometric registration cancelled by user');
      }
      throw new Error(`Failed to create credential: ${createError.message}`);
    }
    
    if (!credential) {
      throw new Error('Credential creation returned null');
    }

    // Send credential to backend for registration with timeout
    const registerController = new AbortController();
    const registerTimeoutId = setTimeout(() => registerController.abort(), BACKEND_TIMEOUT);
    
    try {
      const registerResponse = await fetch(`${backendUrl}/api/auth/biometric/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: registerController.signal,
        body: JSON.stringify({
          credential: {
            id: credential.id,
            rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
            response: {
              attestationObject: btoa(String.fromCharCode(...new Uint8Array(credential.response.attestationObject))),
              clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(credential.response.clientDataJSON)))
            },
            type: credential.type
          },
          userId: serverUserId
        })
      });
      
      clearTimeout(registerTimeoutId);

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to register biometric credential');
      }
    } catch (registerError) {
      clearTimeout(registerTimeoutId);
      if (registerError.name === 'AbortError') {
        throw new Error('Registration timeout - please check your connection');
      }
      throw registerError;
    }

    // Save credential ID locally for quick access
    // Use consistent key name across the app
    try {
      localStorage.setItem('dex_biometric_credential_id', credential.id);
      // Also store user ID for better credential management
      localStorage.setItem('dex_biometric_user_id', userId);
    } catch (storageError) {
      // localStorage might be disabled, but registration still succeeded
      if (process.env.NODE_ENV === 'development') {
        console.warn('[DEX BiometricAuth] Failed to save credential ID to localStorage:', storageError);
      }
    }

    return { success: true, credentialId: credential.id };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[DEX BiometricAuth] Registration error:', error);
    }
    throw error;
  }
}

/**
 * Authenticate using biometric (TouchID/FaceID/Fingerprint)
 * @param {string} userId - User ID (optional, can be retrieved from stored credential)
 */
export async function authenticateBiometric(userId = null) {
  try {
    const availability = await isBiometricAvailable();
    if (!availability.available) {
      throw new Error(availability.reason || 'Biometric authentication not available');
    }

    // Get stored credential ID or use provided userId
    const storedCredentialId = localStorage.getItem('dex_biometric_credential_id');
    
    if (!storedCredentialId && !userId) {
      throw new Error('No biometric credential registered');
    }

    // Get challenge from backend with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT);
    
    let challengeBytes, decodedAllowCredentials;
    try {
      const challengeResponse = await fetch(`${backendUrl}/api/auth/biometric/auth-challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: controller.signal,
        body: JSON.stringify({ 
          credentialId: storedCredentialId,
          userId 
        })
      });
      
      clearTimeout(timeoutId);

      if (!challengeResponse.ok) {
        const errorData = await challengeResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to get authentication challenge');
      }

      const responseData = await challengeResponse.json();
      const challenge = responseData.challenge;
      const allowCredentials = responseData.allowCredentials;
      
      if (!challenge) {
        throw new Error('Invalid challenge response from server');
      }
      
      // Decode base64 challenge to Uint8Array
      challengeBytes = Uint8Array.from(atob(challenge), c => c.charCodeAt(0));
      decodedAllowCredentials = allowCredentials ? allowCredentials.map(cred => ({
        id: Uint8Array.from(atob(cred.id), c => c.charCodeAt(0)),
        type: 'public-key',
        transports: cred.transports
      })) : undefined;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timeout - please check your connection');
      }
      throw fetchError;
    }

    // Authenticate with biometric
    let assertion;
    try {
      assertion = await navigator.credentials.get({
        publicKey: {
          challenge: challengeBytes,
          allowCredentials: decodedAllowCredentials,
          timeout: WEBAUTHN_TIMEOUT,
          userVerification: 'required'
        }
      });
    } catch (getError) {
      if (getError.name === 'NotAllowedError' || getError.name === 'AbortError') {
        throw new Error('Biometric authentication cancelled');
      }
      throw new Error(`Authentication failed: ${getError.message}`);
    }
    
    if (!assertion) {
      throw new Error('Authentication returned null');
    }

    // Send assertion to backend for verification with timeout
    const verifyController = new AbortController();
    const verifyTimeoutId = setTimeout(() => verifyController.abort(), BACKEND_TIMEOUT);
    
    let result;
    try {
      const verifyResponse = await fetch(`${backendUrl}/api/auth/biometric/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: verifyController.signal,
        body: JSON.stringify({
          credentialId: assertion.id,
          response: {
            authenticatorData: btoa(String.fromCharCode(...new Uint8Array(assertion.response.authenticatorData))),
            clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(assertion.response.clientDataJSON))),
            signature: btoa(String.fromCharCode(...new Uint8Array(assertion.response.signature))),
            userHandle: assertion.response.userHandle ? btoa(String.fromCharCode(...new Uint8Array(assertion.response.userHandle))) : null
          }
        })
      });
      
      clearTimeout(verifyTimeoutId);

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Biometric verification failed');
      }

      result = await verifyResponse.json();
    } catch (verifyError) {
      clearTimeout(verifyTimeoutId);
      if (verifyError.name === 'AbortError') {
        throw new Error('Verification timeout - please check your connection');
      }
      throw verifyError;
    }

    return { success: true, user: result.user, refreshToken: result.refreshToken };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[DEX BiometricAuth] Authentication error:', error);
    }
    
    // Handle user cancellation gracefully
    if (error.name === 'NotAllowedError' || error.name === 'AbortError') {
      throw new Error('Biometric authentication cancelled');
    }
    
    throw error;
  }
}

/**
 * Check if user has registered biometric credential
 */
export function hasBiometricCredential() {
  return !!localStorage.getItem('dex_biometric_credential_id');
}

/**
 * Remove biometric credential (logout or unregister)
 */
export function removeBiometricCredential() {
  try {
    localStorage.removeItem('dex_biometric_credential_id');
    localStorage.removeItem('dex_biometric_user_id');
  } catch (error) {
    // localStorage might be disabled
    if (process.env.NODE_ENV === 'development') {
      console.warn('[DEX BiometricAuth] Failed to remove credential from localStorage:', error);
    }
  }
}

/**
 * Get user-friendly error message for biometric errors
 */
export function getBiometricErrorMessage(error) {
  if (error.message.includes('not available')) {
    return 'Biometric authentication is not available on this device';
  }
  if (error.message.includes('cancelled')) {
    return 'Biometric authentication was cancelled';
  }
  if (error.message.includes('not registered')) {
    return 'Biometric authentication is not set up. Please register first.';
  }
  if (error.message.includes('verification failed')) {
    return 'Biometric verification failed. Please try again.';
  }
  return 'Biometric authentication failed. Please use password instead.';
}
