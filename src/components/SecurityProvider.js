import React, { createContext, useContext, useEffect, useState } from 'react';
import authService from '../services/authService';
import validationService from '../services/validationService';

// 🔒 Security Context
const SecurityContext = createContext();

// 🔒 Security Provider Component
export const SecurityProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [securityStatus, setSecurityStatus] = useState({
    isAuthenticated: false,
    user: null,
    permissions: [],
    lastActivity: Date.now()
  });

  // 🔒 Initialize Security Services
  useEffect(() => {
    const initializeSecurity = async () => {
      try {
        // Initialize authentication service
        await authService.initialize();
        
        // Set initial security status
        setSecurityStatus({
          isAuthenticated: authService.isUserAuthenticated(),
          user: authService.getCurrentUser(),
          permissions: authService.getUserPermissions(),
          lastActivity: Date.now()
        });

        setIsInitialized(true);
        console.log('✅ Security services initialized');
      } catch (error) {
        console.error('❌ Security initialization error:', error);
        setIsInitialized(true); // Still set to true to not block the app
      }
    };

    initializeSecurity();
  }, []);

  // 🔒 Activity Monitoring
  useEffect(() => {
    const updateActivity = () => {
      setSecurityStatus(prev => ({
        ...prev,
        lastActivity: Date.now()
      }));
    };

    // Monitor user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, []);

  // 🔒 Security Functions
  const login = async (email, password) => {
    try {
      // Input validation
      const emailValidation = validationService.validateEmail(email);
      if (!emailValidation.isValid) {
        return { success: false, error: emailValidation.error };
      }

      const passwordValidation = validationService.validatePassword(password);
      if (!passwordValidation.isValid) {
        return { success: false, error: passwordValidation.error };
      }

      // Attempt login
      const result = await authService.login(emailValidation.sanitized, passwordValidation.sanitized);
      
      if (result.success) {
        setSecurityStatus({
          isAuthenticated: true,
          user: result.user,
          permissions: result.user.permissions,
          lastActivity: Date.now()
        });
      }

      return result;
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setSecurityStatus({
        isAuthenticated: false,
        user: null,
        permissions: [],
        lastActivity: Date.now()
      });
      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error);
      return { success: false, error: 'Logout failed' };
    }
  };

  const hasPermission = (permission) => {
    return securityStatus.permissions.includes(permission);
  };

  const hasRole = (role) => {
    return securityStatus.user?.role === role;
  };

  const validateInput = (input, type = 'text') => {
    return validationService.sanitizeInput(input, type);
  };

  const validateForm = (formData, schema) => {
    return validationService.validateForm(formData, schema);
  };

  // 🔒 Security Context Value
  const securityValue = {
    isInitialized,
    isAuthenticated: securityStatus.isAuthenticated,
    user: securityStatus.user,
    permissions: securityStatus.permissions,
    lastActivity: securityStatus.lastActivity,
    login,
    logout,
    hasPermission,
    hasRole,
    validateInput,
    validateForm
  };

  if (!isInitialized) {
    return (
      <div className="security-loading">
        <div className="loading-spinner"></div>
        <p>Initializing security...</p>
      </div>
    );
  }

  return (
    <SecurityContext.Provider value={securityValue}>
      {children}
    </SecurityContext.Provider>
  );
};

// 🔒 Security Hook
export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

// 🔒 Protected Route Component
export const ProtectedRoute = ({ children, requiredPermission = null, requiredRole = null }) => {
  const { isAuthenticated, hasPermission, hasRole } = useSecurity();

  if (!isAuthenticated) {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>Please log in to access this page.</p>
      </div>
    );
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="access-denied">
        <h2>Insufficient Permissions</h2>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="access-denied">
        <h2>Insufficient Role</h2>
        <p>You don't have the required role to access this page.</p>
      </div>
    );
  }

  return children;
};

export default SecurityProvider; 