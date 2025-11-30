import React, { createContext, useState, useEffect, useContext } from 'react';
import { getUserProfile, signOut as apiSignOut } from '../utils/backend'; // Updated import

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from local storage on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedUser = localStorage.getItem('bits_user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } else {
          // Optional: Check backend if needed, but for now trust localStorage or failing that
          // we could call getUserProfile() which now mocks checking localStorage too.
          try {
             const response = await getUserProfile();
             if (response && response.user) {
               setUser(response.user);
               setIsAuthenticated(true);
               localStorage.setItem('bits_user', JSON.stringify(response.user));
             }
          } catch (e) {
             // Silent fail
          }
        }
      } catch (error) {
        console.log('Auth init error:', error);
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
