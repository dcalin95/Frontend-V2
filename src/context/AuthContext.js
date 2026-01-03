import React, { createContext, useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { getUserProfile, signOut as apiSignOut, autoLogin } from '../utils/backend';
import { getStoredRefreshToken, generateDeviceFingerprint, getDeviceInfo } from '../utils/deviceFingerprint';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from backend session on mount (prioritize backend over localStorage)
  // Also tries auto-login with trusted device if available
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First, try to get user from backend session (cookies)
        const response = await getUserProfile();
        if (response && response.user) {
          setUser(response.user);
          setIsAuthenticated(true);
          localStorage.setItem('bits_user', JSON.stringify(response.user));
          setLoading(false);
          return;
        }
        
        // If no session, try auto-login with trusted device
        const refreshToken = getStoredRefreshToken();
        if (refreshToken) {
          try {
            // Get device info including IP and location for security verification
            const deviceInfo = await getDeviceInfo();
            const deviceFingerprint = deviceInfo.deviceFingerprint;
            
            const autoLoginResponse = await autoLogin(refreshToken, deviceFingerprint, deviceInfo);
            if (autoLoginResponse && autoLoginResponse.user) {
              setUser(autoLoginResponse.user);
              setIsAuthenticated(true);
              localStorage.setItem('bits_user', JSON.stringify(autoLoginResponse.user));
              
              // Show warning if location changed significantly
              if (autoLoginResponse.locationChanged) {
                // Location changed - show notification (non-blocking)
                console.warn('[AuthContext] Login from new location detected');
                
                // Get location info from device info with safe fallback
                let locationInfo = 'Unknown';
                if (deviceInfo) {
                  const parts = [];
                  if (deviceInfo.city) parts.push(deviceInfo.city);
                  if (deviceInfo.country && deviceInfo.country !== 'Global') {
                    parts.push(deviceInfo.country);
                  }
                  locationInfo = parts.length > 0 ? parts.join(', ') : 'Unknown';
                }
                
                // Show toast notification only if location is valid
                if (locationInfo !== 'Unknown') {
                  toast.warn(
                    `🔒 Login detected from new location (${locationInfo}). If this wasn't you, please change your password.`,
                    {
                      position: 'top-right',
                      autoClose: 8000,
                      hideProgressBar: false,
                      closeOnClick: true,
                      pauseOnHover: true,
                      draggable: true,
                      style: {
                        background: 'rgba(255, 195, 0, 0.15)',
                        border: '1px solid rgba(255, 195, 0, 0.4)',
                        color: '#fff',
                        backdropFilter: 'blur(10px)'
                      }
                    }
                  );
                }
              }
              
              setLoading(false);
              return;
            }
          } catch (autoLoginError) {
            // Auto-login failed (token expired, device changed, or location verification failed)
            // Silently fail - user will need to login manually
            // Only log in development
            if (process.env.NODE_ENV === 'development') {
              console.log('[AuthContext] Auto-login failed:', autoLoginError.message);
            }
            // Continue to check localStorage fallback below
          }
        }
        
        // Fallback: Check localStorage for existing user (if backend check failed)
        const storedUser = localStorage.getItem('bits_user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser && parsedUser.email) {
              // Set user from localStorage as fallback
              setUser(parsedUser);
              setIsAuthenticated(true);
              setLoading(false);
              return;
            }
          } catch (parseError) {
            // Invalid stored user, clear it
            localStorage.removeItem('bits_user');
          }
        }
        
        // No session, no auto-login, and no valid localStorage - clear everything
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('bits_user');
        localStorage.removeItem('bits_refresh_token');
      } catch (e) {
        // Backend error - try localStorage fallback
        const storedUser = localStorage.getItem('bits_user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser && parsedUser.email) {
              setUser(parsedUser);
              setIsAuthenticated(true);
              setLoading(false);
              return;
            }
          } catch (parseError) {
            localStorage.removeItem('bits_user');
          }
        }
        
        // No valid user found anywhere - clear everything
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('bits_user');
        localStorage.removeItem('bits_refresh_token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Manual Login Helper (updates state immediately)
  const loginSuccess = (userData) => {
    if (userData) {
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('bits_user', JSON.stringify(userData));
    }
  };
  
  // Sync isAuthenticated with user state
  useEffect(() => {
    if (user && !isAuthenticated) {
      setIsAuthenticated(true);
    } else if (!user && isAuthenticated) {
      setIsAuthenticated(false);
    }
  }, [user, isAuthenticated]);

  const signOut = async () => {
    try {
      const refreshToken = getStoredRefreshToken();
      await apiSignOut(refreshToken);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('bits_user');
      localStorage.removeItem('bits_refresh_token');
    } catch (error) {
      console.error('Sign out error:', error);
      // Force local cleanup anyway
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('bits_user');
      localStorage.removeItem('bits_refresh_token');
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    signOut,
    setUser,
    setIsAuthenticated,
    loginSuccess // Exported to be called by Login component
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
