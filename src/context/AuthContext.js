import React, { createContext, useState, useEffect, useContext } from 'react';
import { getUserProfile, signOut as apiSignOut } from '../utils/backend'; // Updated import

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from backend session on mount (prioritize backend over localStorage)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First, try to get user from backend session (cookies)
        const response = await getUserProfile();
        if (response && response.user) {
          setUser(response.user);
          setIsAuthenticated(true);
          localStorage.setItem('bits_user', JSON.stringify(response.user));
        } else {
          // Backend says no session, clear localStorage
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem('bits_user');
        }
      } catch (e) {
        // Backend session not found or error - clear everything
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('bits_user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Manual Login Helper (updates state immediately)
  const loginSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('bits_user', JSON.stringify(userData));
  };

  const signOut = async () => {
    try {
      await apiSignOut();
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('bits_user');
    } catch (error) {
      console.error('Sign out error:', error);
      // Force local cleanup anyway
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('bits_user');
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
