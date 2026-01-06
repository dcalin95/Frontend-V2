// 🔒 Admin Security Utilities
// Session management, token encryption, and security checks for AdminPanel

import CryptoJS from 'crypto-js';

// ⚠️ SECURITY: Encryption key (should be in env, but fallback for dev)
// In production, this should be a strong 32+ character key
const ENCRYPTION_KEY = process.env.REACT_APP_ADMIN_ENCRYPTION_KEY || 'dev-key-change-in-production-' + Date.now();

// ⚠️ SECURITY: Session timeout (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// 🔒 Encrypt data for localStorage
export const encryptData = (data) => {
  try {
    return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('[SECURITY] Encryption error:', error);
    return null;
  }
};

// 🔒 Decrypt data from localStorage
export const decryptData = (encryptedData) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('[SECURITY] Decryption error:', error);
    return null;
  }
};

// 🔒 Generate session token
export const generateSessionToken = () => {
  const token = {
    timestamp: Date.now(),
    random: Math.random().toString(36).substring(2, 15),
    sessionId: Date.now().toString(36) + Math.random().toString(36).substring(2, 15)
  };
  return encryptData(token);
};

// 🔒 Verify session token
export const verifySessionToken = (encryptedToken) => {
  if (!encryptedToken) return false;
  
  const token = decryptData(encryptedToken);
  if (!token || !token.timestamp) return false;
  
  // Check if session expired
  const now = Date.now();
  const sessionAge = now - token.timestamp;
  
  if (sessionAge > SESSION_TIMEOUT) {
    console.warn('[SECURITY] Session expired');
    return false;
  }
  
  return true;
};

// 🔒 Store encrypted session
export const storeAdminSession = (password) => {
  try {
    // ⚠️ SECURITY: Never store password in plain text
    // Store only session token with timestamp
    const sessionToken = generateSessionToken();
    localStorage.setItem('admin_session_token', sessionToken);
    localStorage.setItem('admin_session_timestamp', Date.now().toString());
    
    // Store encrypted password hash (not plain password)
    const passwordHash = CryptoJS.SHA256(password).toString();
    const encryptedPassword = encryptData({ hash: passwordHash, timestamp: Date.now() });
    localStorage.setItem('admin_password_hash', encryptedPassword);
    
    return true;
  } catch (error) {
    console.error('[SECURITY] Error storing session:', error);
    return false;
  }
};

// 🔒 Verify admin session
export const verifyAdminSession = (adminPassword) => {
  try {
    // Check session token
    const sessionToken = localStorage.getItem('admin_session_token');
    if (!verifySessionToken(sessionToken)) {
      return false;
    }
    
    // Check password hash
    const encryptedPassword = localStorage.getItem('admin_password_hash');
    if (!encryptedPassword) {
      return false;
    }
    
    const passwordData = decryptData(encryptedPassword);
    if (!passwordData || !passwordData.hash) {
      return false;
    }
    
    // Verify password hash
    const currentPasswordHash = CryptoJS.SHA256(adminPassword).toString();
    return currentPasswordHash === passwordData.hash;
  } catch (error) {
    console.error('[SECURITY] Error verifying session:', error);
    return false;
  }
};

// 🔒 Clear admin session
export const clearAdminSession = () => {
  try {
    localStorage.removeItem('admin_session_token');
    localStorage.removeItem('admin_session_timestamp');
    localStorage.removeItem('admin_password_hash');
    localStorage.removeItem('admin_token'); // Remove old plain text token
    return true;
  } catch (error) {
    console.error('[SECURITY] Error clearing session:', error);
    return false;
  }
};

// 🔒 Check if session is still valid
export const isSessionValid = () => {
  try {
    const sessionToken = localStorage.getItem('admin_session_token');
    if (!sessionToken) return false;
    
    return verifySessionToken(sessionToken);
  } catch (error) {
    console.error('[SECURITY] Error checking session:', error);
    return false;
  }
};

// 🔒 Refresh session (extend timeout)
export const refreshSession = () => {
  try {
    if (!isSessionValid()) {
      return false;
    }
    
    // Update timestamp
    localStorage.setItem('admin_session_timestamp', Date.now().toString());
    
    // Generate new session token
    const newToken = generateSessionToken();
    localStorage.setItem('admin_session_token', newToken);
    
    return true;
  } catch (error) {
    console.error('[SECURITY] Error refreshing session:', error);
    return false;
  }
};

// 🔒 Auto-refresh session on activity
export const setupSessionAutoRefresh = (callback) => {
  // Refresh session every 5 minutes if valid
  const interval = setInterval(() => {
    try {
      if (isSessionValid()) {
        refreshSession();
      } else {
        // Session expired, call callback
        if (callback) {
          callback();
        }
        clearInterval(interval);
      }
    } catch (error) {
      console.error('[SECURITY] Error in session auto-refresh:', error);
      if (callback) {
        callback();
      }
      clearInterval(interval);
    }
  }, 5 * 60 * 1000); // 5 minutes
  
  return interval;
};

