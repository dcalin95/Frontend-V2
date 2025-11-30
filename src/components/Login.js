import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import './Login.mobile.css'; // 📱 Separate Mobile System
import { signInWithEmail, signInWithProvider } from '../utils/backend';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { user: existing, loading: authLoading, signOut: contextSignOut, loginSuccess } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Dacă e deja logat, redirecționează la Presale
    if (existing) {
      // navigate('/presale'); // Optional: Redirect automatically
    }
  }, [existing, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email || !username) {
      setError('Please enter a valid email and a username.');
      return;
    }
    setIsLoggingIn(true);
    try {
      const response = await signInWithEmail(email, 'dummy-password'); // Mock password
      if (response && response.user) {
        loginSuccess(response.user);
        navigate('/presale');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function onProvider(provider) {
    setError('');
    setIsLoggingIn(true);
    try {
      const response = await signInWithProvider(provider);
      if (response && response.user) {
        loginSuccess(response.user);
        navigate('/ai-hub'); // Redirect to AI Hub on Google Login
      }
    } catch (err) {
      console.error("Provider login error:", err);
      setError(err.message || `Login with ${provider} failed`);
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleSignOut() {
    await contextSignOut();
    // window.location.reload(); // No need to reload, context updates
  }

  if (authLoading) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Loading...</h1>
        </div>
      </div>
    );
  }

  // Dacă e deja logat, arată-i opțiuni
  if (existing) {
    const memberSince = existing.created_at ? new Date(existing.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'N/A';
    
    return (
      <div className="login-page">
        <div className="login-card profile-card">
          {/* Profile Header cu gradient */}
          <div className="profile-header">
            <div className="profile-header-bg"></div>
            <div className="profile-header-content">
              <div className="user-avatar-large">
                {existing.avatar ? (
                    <img src={existing.avatar} alt="Avatar" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} />
                ) : (
                    <span className="user-initial-large">{(existing.username || existing.email || 'U').slice(0,1).toUpperCase()}</span>
                )}
              </div>
              <h1 className="profile-username">{existing.username || existing.email}</h1>
              <p className="profile-email">{existing.email}</p>
              {/* Badge Logged In */}
              <div style={{marginTop: '10px'}}>
                 <span className="badge-live" style={{background: 'rgba(0, 255, 163, 0.2)', color: '#00FFA3', border: '1px solid #00FFA3'}}>
                    <i className="fas fa-check-circle"></i> Authenticated
                 </span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="profile-stats">
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fa-solid fa-calendar"></i>
              </div>
              <div className="stat-content">
                <div className="stat-label">Member Since</div>
                <div className="stat-value">{memberSince}</div>
              </div>
            </div>
             <div className="stat-card">
              <div className="stat-icon">
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <div className="stat-content">
                <div className="stat-label">Account Status</div>
                <div className="stat-value">Verified</div>
              </div>
            </div>
          </div>
          
          <div className="existing-actions">
            <button className="btn primary" onClick={() => navigate('/ai-hub')}>
              <i className="fa-solid fa-brain"></i> Go to AI Hub
            </button>
             <button className="btn primary" onClick={() => navigate('/presale')} style={{background: 'linear-gradient(135deg, #00FFA3 0%, #00D4FF 100%)', color: '#000'}}>
              <i className="fa-solid fa-rocket"></i> Go to Presale
            </button>
            <button className="btn secondary" onClick={handleSignOut}>
              <i className="fa-solid fa-arrow-right-from-bracket"></i> Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dacă NU e logat, arată formularul de signup
  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Create your account</h1>
        <p className="sub">Register to access BITS AI Presale and exclusive features.</p>
        
        {/* FORMULAR */}
        <form className="login-form" onSubmit={onSubmit}>
          <label className="field">
            <span>Email</span>
            <input 
                type="email" 
                value={email} 
                onChange={(e)=>setEmail(e.target.value)} 
                placeholder="you@example.com" 
                required 
                disabled={isLoggingIn}
            />
          </label>
          <label className="field">
            <span>Username</span>
            <input 
                type="text" 
                value={username} 
                onChange={(e)=>setUsername(e.target.value)} 
                placeholder="your-username" 
                required 
                disabled={isLoggingIn}
            />
          </label>
          {error && <div className="error"><i className="fas fa-exclamation-circle"></i> {error}</div>}
          
          <button type="submit" className="btn primary" disabled={isLoggingIn}>
            {isLoggingIn ? <span><i className="fas fa-spinner fa-spin"></i> Processing...</span> : 'Create account'}
          </button>
        </form>

        <div className="or">or</div>

        {/* GOOGLE LOGIN */}
        <div className="providers">
          <div className="provider-highlight">
            <span className="badge-live">Available now</span>
            <span>Instant sign-in with Google is live.</span>
          </div>
          
          <button 
            className="btn provider provider-google" 
            onClick={()=>onProvider('google')}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
                <><i className="fas fa-spinner fa-spin"></i> Connecting...</>
            ) : (
                <><i className="fa-brands fa-google"></i> Continue with Google</>
            )}
          </button>

          <div className="provider-banner">
            <span className="banner-title">More options in development</span>
            <span>Facebook, X (Twitter) and Discord login will be available soon.</span>
          </div>
          <button className="btn provider provider-disabled" type="button" disabled aria-disabled="true">
            <i className="fa-brands fa-facebook"></i> Continue with Facebook (coming soon)
          </button>
          <button className="btn provider provider-disabled" type="button" disabled aria-disabled="true">
            <i className="fa-brands fa-x-twitter"></i> Continue with X (Twitter) (coming soon)
          </button>
          <button className="btn provider provider-disabled" type="button" disabled aria-disabled="true">
            <i className="fa-brands fa-discord"></i> Continue with Discord (coming soon)
          </button>
        </div>
        
        <p className="terms">
          By creating an account, you agree to our terms. You can delete your session anytime.
        </p>
      </div>
    </div>
  );
}
