// Backend API helper functions - PRODUCTION READY

import { getBackendUrl } from './getBackendUrl';

const API_URL = getBackendUrl();

// Helper function for API requests with credentials
async function apiRequest(endpoint, method = 'GET', body = null) {
  const url = `${API_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important: include cookies for session management
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  
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
    throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
  }
  
  return data;
}

// POST /api/auth/login - login with email and password
export const signInWithEmail = async (email, password) => {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  
  try {
    const response = await apiRequest('/api/auth/login', 'POST', { email, password });
    
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
    return { user: userSession };
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
export const signOut = async () => {
  try {
    await apiRequest('/api/auth/signout', 'POST');
    localStorage.removeItem('bits_user');
    return { success: true };
  } catch (err) {
    // Clear localStorage even if request fails
    localStorage.removeItem('bits_user');
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
