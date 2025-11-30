// Backend API helper functions
import { get, post } from './http';

export const signInWithEmail = async (email, password) => {
  return post('/api/auth/login', { email, password });
};

export const signUpWithEmail = async (email, password, name) => {
  return post('/api/auth/register', { email, password, name });
};

export const signInWithProvider = async (provider) => {
  // Redirect to OAuth provider
  window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/${provider}`;
};

export const getUserProfile = async () => {
  return get('/api/auth/me');
};

export const signOut = async () => {
  return get('/api/auth/logout');
};

