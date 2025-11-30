// Backend API helper functions - MOCKED FOR FRONTEND ONLY
import { get, post } from './http';

// Mock delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const signInWithEmail = async (email, password) => {
  // return post('/api/auth/login', { email, password });
  await delay(1000);
  if (email && password) {
    const mockUser = {
      id: 'email-' + Date.now(),
      email: email,
      username: email.split('@')[0],
      provider: 'email',
      created_at: new Date().toISOString(),
      avatar: null
    };
    // Save to local storage to simulate session
    localStorage.setItem('bits_user', JSON.stringify(mockUser));
    return { user: mockUser };
  }
  throw new Error('Invalid credentials');
};

export const signUpWithEmail = async (email, password, name) => {
  // return post('/api/auth/register', { email, password, name });
  await delay(1000);
  const mockUser = {
    id: 'email-' + Date.now(),
    email: email,
    username: name || email.split('@')[0],
    provider: 'email',
    created_at: new Date().toISOString(),
    avatar: null
  };
  localStorage.setItem('bits_user', JSON.stringify(mockUser));
  return { user: mockUser };
};

export const signInWithProvider = async (provider) => {
  // Redirect to OAuth provider - DISABLED FOR DEMO
  // window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/${provider}`;
  
  console.log(`Simulating login with ${provider}...`);
  await delay(1500);
  
  if (provider === 'google') {
    const mockUser = {
      id: 'google-' + Date.now(),
      email: 'demo.user@gmail.com',
      username: 'GoogleUser',
      provider: 'google',
      avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c', // Generic Google avatar
      created_at: new Date().toISOString()
    };
    localStorage.setItem('bits_user', JSON.stringify(mockUser));
    return { user: mockUser };
  }
  
  throw new Error(`Provider ${provider} not supported in demo mode`);
};

export const getUserProfile = async () => {
  // return get('/api/auth/me');
  await delay(500);
  const saved = localStorage.getItem('bits_user');
  if (saved) {
    return { user: JSON.parse(saved) };
  }
  throw new Error('Not authenticated');
};

export const signOut = async () => {
  // return get('/api/auth/logout');
  await delay(500);
  localStorage.removeItem('bits_user');
  return { success: true };
};
