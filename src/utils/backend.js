// Backend API helper functions - PRODUCTION READY

import { getBackendUrl } from './getBackendUrl';

const API_URL = getBackendUrl();

// Helper function for API requests with credentials
// Includes timeout, retry logic, and better error handling
async function apiRequest(endpoint, method = 'GET', body = null, retries = 1) {
  const url = `${API_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important: include cookies for session management
    signal: controller.signal
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  let lastError;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      clearTimeout(timeoutId);
      
      // Handle non-JSON responses gracefully
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (e) {
          throw new Error(`Failed to parse response: ${e.message}`);
        }
      } else {
        // If not JSON, try to get text
        const text = await response.text();
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }
      
      if (!response.ok) {
        // Don't retry on client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
        }
        // Retry on server errors (5xx) or network errors
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
          continue;
        }
        throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
      
      // Don't retry on abort (timeout) or client errors
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection and try again.');
      }
      
      if (error.message && error.message.includes('HTTP error! status: 4')) {
        throw error; // Don't retry client errors
      }
      
      // Retry on network errors or server errors
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
        continue;
      }
    }
  }
  
  throw lastError || new Error('Request failed after retries');
}

// POST /api/auth/auto-login - auto-login with refresh token (trusted device)
// Now includes IP and location for security verification
export const autoLogin = async (refreshToken, deviceFingerprint, deviceInfo = null) => {
  if (!refreshToken || !deviceFingerprint) {
    throw new Error('Refresh token and device fingerprint are required');
  }
  
  try {
    // Import here to avoid circular dependency - use dynamic import for better error handling
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
    
    const response = await apiRequest('/api/auth/auto-login', 'POST', requestBody);
    
    // If location changed, backend should return requiresVerification flag
    if (response.requiresVerification && locationChanged) {
      // Location changed significantly - require additional verification
      // Backend should handle this, but we can also show a warning
      console.warn('[AutoLogin] Location changed - additional verification may be required');
    }
    
    // Save user data to localStorage for quick access (session is managed by cookies)
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
    
    // Provide user-friendly error messages
    if (err.message.includes('Invalid or expired')) {
      throw new Error('Session expired. Please log in again.');
    }
    if (err.message.includes('timeout')) {
      throw new Error('Connection timeout. Please check your internet connection.');
    }
    
    throw err;
  }
};

// POST /api/auth/login - login with email and password
export const signInWithEmail = async (email, password, deviceInfo = null) => {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  
  try {
    const requestBody = { email, password };
    
    // Add device info if provided (for trusted device)
    if (deviceInfo) {
      // Validate and sanitize device info
      requestBody.deviceFingerprint = deviceInfo.deviceFingerprint || null;
      requestBody.screenResolution = deviceInfo.screenResolution || null;
      requestBody.timezone = deviceInfo.timezone || null;
      requestBody.language = deviceInfo.language || null;
      // Add IP and location for security tracking (sanitize)
      requestBody.ip = (deviceInfo.ip && deviceInfo.ip !== 'Unknown') ? deviceInfo.ip.trim() : null;
      requestBody.country = (deviceInfo.country && deviceInfo.country !== 'Global') ? deviceInfo.country.trim().substring(0, 100) : null;
      requestBody.countryCode = (deviceInfo.countryCode && deviceInfo.countryCode !== 'GL') ? deviceInfo.countryCode.trim().substring(0, 10) : null;
      requestBody.city = deviceInfo.city ? deviceInfo.city.trim().substring(0, 100) : null;
    }
    
    const response = await apiRequest('/api/auth/login', 'POST', requestBody);
    
    // Save user data to localStorage for quick access (session is managed by cookies)
    const userSession = {
      id: response.id,
      email: response.email,
      username: response.username,
      provider: 'email',
      isMember: response.isMember || false,
      emailVerified: response.emailVerified || false
    };
    
    localStorage.setItem('bits_user', JSON.stringify(userSession));
    
    // Save refresh token if provided (for auto-login)
    if (response.refreshToken) {
      localStorage.setItem('bits_refresh_token', response.refreshToken);
    }
    
    // Store current location for future comparison
    if (deviceInfo && deviceInfo.ip) {
      const { storeLastLocation } = await import('./deviceFingerprint');
      storeLastLocation(
        deviceInfo.ip,
        deviceInfo.country || 'Global',
        deviceInfo.countryCode || 'GL',
        deviceInfo.city || ''
      );
    }
    
    return { user: userSession, refreshToken: response.refreshToken };
  } catch (err) {
    // Re-throw with user-friendly message
    throw err;
  }
};

// POST /api/auth/register - register with email, username, password
export const signUpWithEmail = async (email, password, name) => {
  if (!email || !password || !name) {
    throw new Error('Email, password, and username are required');
  }
  
  try {
    const response = await apiRequest('/api/auth/register', 'POST', { 
      email, 
      password, 
      username: name 
    });
    
    // Don't save to localStorage yet - wait for email verification
    // The backend will send a verification email
    
    return {
      user: response.user,
      message: response.message || 'Account created successfully. Please check your email to verify your account.'
    };
  } catch (err) {
    throw err;
  }
};

export const signInWithProvider = async (provider) => {
  // Redirect to OAuth provider
  const frontendUrl = window.location.origin + window.location.pathname;
  const redirectUrl = encodeURIComponent(`${frontendUrl}#/login?provider=${provider}`);
  window.location.href = `${API_URL}/api/auth/${provider}/start?redirect=${redirectUrl}`;
  
  // This will redirect, so we won't reach here
  return Promise.reject(new Error('Redirecting to OAuth provider...'));
};

// GET /api/auth/me - get current user from session
export const getUserProfile = async () => {
  try {
    const response = await apiRequest('/api/auth/me', 'GET');
    
    // Save to localStorage for quick access
    const userSession = {
      id: response.id,
      email: response.email,
      username: response.username,
      provider: 'email',
      isMember: response.isMember || false
    };
    
    localStorage.setItem('bits_user', JSON.stringify(userSession));
    return { user: userSession };
  } catch (err) {
    // Clear localStorage if not authenticated
    localStorage.removeItem('bits_user');
    throw err;
  }
};

// POST /api/auth/signout - sign out and destroy session
export const signOut = async (refreshToken = null) => {
  try {
    const requestBody = refreshToken ? { refreshToken } : {};
    await apiRequest('/api/auth/signout', 'POST', requestBody);
    localStorage.removeItem('bits_user');
    localStorage.removeItem('bits_refresh_token');
    return { success: true };
  } catch (err) {
    // Clear localStorage even if request fails
    localStorage.removeItem('bits_user');
    localStorage.removeItem('bits_refresh_token');
    throw err;
  }
};

// GET /api/auth/verify-email - verify email with token
export const verifyEmail = async (token) => {
  if (!token) {
    throw new Error('Verification token is required');
  }
  
  try {
    const response = await apiRequest(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, 'GET');
    
    // Backend returns { success: true, message: '...', user: {...} }
    // Save user data after verification
    if (response.user) {
      localStorage.setItem('bits_user', JSON.stringify({
        id: response.user.id,
        email: response.user.email,
        username: response.user.username,
        provider: 'email',
        emailVerified: true
      }));
    }
    
    // Normalize response format for frontend (backend uses 'success', not 'ok')
    return {
      success: response.success || response.ok,
      ok: response.success || response.ok,
      message: response.message,
      user: response.user,
      error: response.error
    };
  } catch (err) {
    throw err;
  }
};

// POST /api/auth/resend-verification - resend verification email
export const resendVerification = async (email) => {
  if (!email) {
    throw new Error('Email is required');
  }
  
  try {
    const response = await apiRequest('/api/auth/resend-verification', 'POST', { email });
    return response;
  } catch (err) {
    throw err;
  }
};

// POST /api/auth/forgot-password - send password reset email
export const forgotPassword = async (email) => {
  if (!email) {
    throw new Error('Email is required');
  }
  
  try {
    const response = await apiRequest('/api/auth/forgot-password', 'POST', { email });
    return response;
  } catch (err) {
    throw err;
  }
};

// POST /api/auth/reset-password - reset password with token
export const resetPassword = async (token, password) => {
  if (!token || !password) {
    throw new Error('Token and password are required');
  }
  
  try {
    const response = await apiRequest('/api/auth/reset-password', 'POST', { token, password });
    return response;
  } catch (err) {
    throw err;
  }
};

// GET /api/auth/wallets - get user's associated wallets
export const getUserWallets = async () => {
  try {
    const response = await apiRequest('/api/auth/wallets', 'GET');
    return response.wallets || [];
  } catch (err) {
    // If not authenticated, return empty array
    if (err.message.includes('Not authenticated') || err.message.includes('401')) {
      return [];
    }
    throw err;
  }
};
