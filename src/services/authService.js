import jwt from 'jsonwebtoken';
import CryptoJS from 'crypto-js';

// 🔒 Security Configuration
const SECURITY_CONFIG = {
  JWT_SECRET: process.env.REACT_APP_JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  JWT_EXPIRES_IN: '24h',
  PASSWORD_MIN_LENGTH: 8,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  SESSION_TIMEOUT: 30 * 60 * 1000 // 30 minutes
};

// 🔒 User Roles & Permissions
export const USER_ROLES = {
  GUEST: 'guest',
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator'
};

export const PERMISSIONS = {
  READ_PRESALE: 'read:presale',
  WRITE_PRESALE: 'write:presale',
  ADMIN_PANEL: 'admin:panel',
  USER_MANAGEMENT: 'user:management',
  ANALYTICS: 'analytics:view',
  WALLET_CONNECT: 'wallet:connect',
  TRANSACTIONS: 'transactions:view'
};

// 🔒 Role-based Permissions Map
const ROLE_PERMISSIONS = {
  [USER_ROLES.GUEST]: [PERMISSIONS.READ_PRESALE],
  [USER_ROLES.USER]: [
    PERMISSIONS.READ_PRESALE,
    PERMISSIONS.WALLET_CONNECT,
    PERMISSIONS.TRANSACTIONS
  ],
  [USER_ROLES.MODERATOR]: [
    PERMISSIONS.READ_PRESALE,
    PERMISSIONS.WRITE_PRESALE,
    PERMISSIONS.ANALYTICS
  ],
  [USER_ROLES.ADMIN]: Object.values(PERMISSIONS)
};

class AuthService {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.sessionTimer = null;
    this.loginAttempts = new Map();
  }

  // 🔒 Initialize Authentication Service
  async initialize() {
    try {
      const token = this.getStoredToken();
      if (token && this.validateToken(token)) {
        await this.setupSession(token);
      }
      
      this.setupSessionMonitoring();
      console.log('✅ AuthService initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Error initializing AuthService:', error);
      return false;
    }
  }

  // 🔒 User Login with Security
  async login(email, password) {
    try {
      if (this.isAccountLocked(email)) {
        throw new Error('Account temporarily locked. Please try again later.');
      }

      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const user = await this.findUserByEmail(email.toLowerCase());
      if (!user) {
        this.recordLoginAttempt(email);
        throw new Error('Invalid credentials');
      }

      if (!this.verifyPassword(password, user.password)) {
        this.recordLoginAttempt(email);
        throw new Error('Invalid credentials');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      this.clearLoginAttempts(email);
      user.lastLogin = new Date().toISOString();
      this.updateUser(user);

      const tokens = this.generateTokens(user);
      await this.setupSession(tokens.accessToken);
      
      return {
        success: true,
        user: this.sanitizeUser(user),
        tokens
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 🔒 Token Management
  generateTokens(user) {
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      },
      SECURITY_CONFIG.JWT_SECRET,
      { expiresIn: SECURITY_CONFIG.JWT_EXPIRES_IN }
    );

    return { accessToken };
  }

  validateToken(token) {
    try {
      const decoded = jwt.verify(token, SECURITY_CONFIG.JWT_SECRET);
      return decoded;
    } catch (error) {
      return null;
    }
  }

  // 🔒 Permission Checking
  hasPermission(permission) {
    if (!this.currentUser || !this.currentUser.permissions) {
      return false;
    }
    return this.currentUser.permissions.includes(permission);
  }

  hasRole(role) {
    return this.currentUser && this.currentUser.role === role;
  }

  // 🔒 Session Management
  setupSession(token) {
    const decoded = this.validateToken(token);
    if (!decoded) {
      throw new Error('Invalid token');
    }

    this.currentUser = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions
    };
    
    this.isAuthenticated = true;
    this.storeToken(token);
    this.startSessionTimer();
  }

  clearSession() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.stopSessionTimer();
  }

  // 🔒 Session Monitoring
  setupSessionMonitoring() {
    document.addEventListener('mousemove', this.resetSessionTimer.bind(this));
    document.addEventListener('keypress', this.resetSessionTimer.bind(this));
    document.addEventListener('click', this.resetSessionTimer.bind(this));
  }

  startSessionTimer() {
    this.stopSessionTimer();
    this.sessionTimer = setTimeout(() => {
      this.handleSessionTimeout();
    }, SECURITY_CONFIG.SESSION_TIMEOUT);
  }

  stopSessionTimer() {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  resetSessionTimer() {
    if (this.isAuthenticated) {
      this.startSessionTimer();
    }
  }

  handleSessionTimeout() {
    console.log('⚠️ Session timeout - logging out user');
    this.logout();
    window.location.href = '/login?timeout=true';
  }

  // 🔒 Brute Force Protection
  recordLoginAttempt(email) {
    const attempts = this.loginAttempts.get(email) || 0;
    this.loginAttempts.set(email, attempts + 1);
    
    if (attempts + 1 >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
      this.lockAccount(email);
    }
  }

  clearLoginAttempts(email) {
    this.loginAttempts.delete(email);
  }

  isAccountLocked(email) {
    const attempts = this.loginAttempts.get(email) || 0;
    return attempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS;
  }

  lockAccount(email) {
    const lockoutTime = Date.now() + SECURITY_CONFIG.LOCKOUT_DURATION;
    this.loginAttempts.set(email, { locked: true, lockoutTime });
  }

  // 🔒 Password Security
  hashPassword(password) {
    const salt = CryptoJS.lib.WordArray.random(128/8);
    const hash = CryptoJS.PBKDF2(password, salt, { keySize: 256/32 });
    return salt.toString() + hash.toString();
  }

  verifyPassword(password, hashedPassword) {
    const salt = hashedPassword.substr(0, 32);
    const hash = hashedPassword.substr(32);
    const testHash = CryptoJS.PBKDF2(password, CryptoJS.enc.Hex.parse(salt), { keySize: 256/32 });
    return hash === testHash.toString();
  }

  // 🔒 Data Sanitization
  sanitizeUser(user) {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  // 🔒 Storage Management
  storeToken(token) {
    localStorage.setItem('accessToken', token);
  }

  getStoredToken() {
    return localStorage.getItem('accessToken');
  }

  clearStoredData() {
    localStorage.removeItem('accessToken');
    sessionStorage.clear();
  }

  // 🔒 User Management (Mock - replace with actual database calls)
  async findUserByEmail(email) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    return users.find(user => user.email === email);
  }

  storeUser(user) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
  }

  updateUser(updatedUser) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const index = users.findIndex(user => user.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      localStorage.setItem('users', JSON.stringify(users));
    }
  }

  // 🔒 Logout
  async logout() {
    try {
      this.clearSession();
      this.clearStoredData();
      console.log('✅ User logged out successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error);
      return { success: false, error: error.message };
    }
  }

  // 🔒 Public API
  getCurrentUser() {
    return this.currentUser;
  }

  isUserAuthenticated() {
    return this.isAuthenticated;
  }

  getUserRole() {
    return this.currentUser?.role || USER_ROLES.GUEST;
  }

  getUserPermissions() {
    return this.currentUser?.permissions || [];
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService; 