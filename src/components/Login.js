import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import './Login.mobile.css'; // 📱 Separate Mobile System
import { signInWithEmail, signUpWithEmail, signInWithProvider, forgotPassword, resendVerification, getUserWallets } from '../utils/backend';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';

export default function Login() {
  const navigate = useNavigate();
  const { user: existing, loading: authLoading, signOut: contextSignOut, loginSuccess } = useAuth();
  const { setShowWalletModal } = useWallet();
  const [isSignUp, setIsSignUp] = useState(true); // true = Sign Up, false = Sign In
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [userWallets, setUserWallets] = useState([]);
  const [loadingWallets, setLoadingWallets] = useState(false);

  useEffect(() => {
    // If already logged in, redirect to Presale (optional)
    if (existing) {
      // navigate('/presale'); // Optional: Redirect automatically
      // Load user wallets when authenticated
      loadUserWallets();
    } else {
      setUserWallets([]);
    }
  }, [existing, navigate]);

  // Load user wallets
  const loadUserWallets = async () => {
    if (!existing) return;
    
    setLoadingWallets(true);
    try {
      const wallets = await getUserWallets();
      setUserWallets(wallets || []);
    } catch (err) {
      console.error('Error loading user wallets:', err);
      setUserWallets([]);
    } finally {
      setLoadingWallets(false);
    }
  };

  // Password validation
  const validatePassword = (pwd) => {
    if (!pwd || pwd.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (pwd.length > 128) {
      return 'Password must be no more than 128 characters long';
    }
    if (!/(?=.*[a-z])/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*[0-9])/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Field validation
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    
    // Email format validation and normalization
    const emailTrimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setError('Please enter a valid email address.');
      return;
    }
    
    if (isSignUp) {
      // SIGN UP
      if (!username) {
        setError('Please enter a username.');
        return;
      }
      
      // Username validation (3-20 characters, only letters, numbers, underscores, hyphens)
      const usernameTrimmed = username.trim();
      if (usernameTrimmed.length < 3) {
        setError('Username must be at least 3 characters long.');
        return;
      }
      if (usernameTrimmed.length > 20) {
        setError('Username must be no more than 20 characters long.');
        return;
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(usernameTrimmed)) {
        setError('Username can only contain letters, numbers, underscores, and hyphens.');
        return;
      }
      
      if (!password) {
        setError('Please enter a password.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      
      // Password validation
      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }
      
      setIsLoggingIn(true);
      try {
        const response = await signUpWithEmail(emailTrimmed, password, usernameTrimmed);
        if (response && response.user) {
          setSuccess(response.message || 'Account created successfully! Please check your email to verify your account.');
          setEmailVerificationSent(true);
          // Reset form
          setEmail('');
          setUsername('');
          setPassword('');
          setConfirmPassword('');
          // Don't auto-login after signup - wait for email verification
          // loginSuccess(response.user);
          // navigate('/presale');
        }
      } catch (err) {
        // Handle specific backend errors
        const errorMessage = err.message || 'Sign up failed';
        setError(errorMessage);
        
        // If email already exists, suggest sign in
        if (errorMessage.toLowerCase().includes('already exists') || errorMessage.toLowerCase().includes('email')) {
          setError(errorMessage + ' Try signing in instead.');
        }
      } finally {
        setIsLoggingIn(false);
      }
    } else {
      // SIGN IN
      if (!password) {
        setError('Please enter your password.');
        return;
      }
      
      setIsLoggingIn(true);
      try {
        const response = await signInWithEmail(emailTrimmed, password);
        if (response && response.user) {
          loginSuccess(response.user);
          navigate('/presale');
        }
      } catch (err) {
        // Handle specific error messages from backend
        const errorMessage = err.message || 'Login failed. Please check your email and password.';
        
        // If account is locked, show additional info
        if (errorMessage.toLowerCase().includes('locked')) {
          setError(errorMessage + ' Please try again later.');
        } else if (errorMessage.toLowerCase().includes('verify') || errorMessage.toLowerCase().includes('verification')) {
          setError(errorMessage + ' Please check your email for the verification link.');
        } else {
          setError(errorMessage);
        }
      } finally {
        setIsLoggingIn(false);
      }
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
      // OAuth redirect will happen, so this error is expected
      // Only show error if it's not a redirect
      if (!err.message || !err.message.includes('Redirecting')) {
        setError(err.message || `Login with ${provider} failed`);
        setIsLoggingIn(false);
      }
      // If redirecting, don't reset loading state - let redirect happen
    }
  }

  async function handleSignOut() {
    await contextSignOut();
    // window.location.reload(); // No need to reload, context updates
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!forgotPasswordEmail) {
      setError('Please enter your email address.');
      return;
    }
    
    const emailTrimmed = forgotPasswordEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setError('Please enter a valid email address.');
      return;
    }
    
    setIsLoggingIn(true);
    try {
      await forgotPassword(emailTrimmed);
      setForgotPasswordSent(true);
      setSuccess('If an account exists with this email, a password reset link has been sent.');
      setForgotPasswordEmail(''); // Clear email after success
    } catch (err) {
      let errorMsg = err.message || 'Failed to send password reset email.';
      
      // Provide more specific error messages
      if (errorMsg.toLowerCase().includes('network') || errorMsg.toLowerCase().includes('fetch')) {
        errorMsg = 'Network error. Please check your connection and try again.';
      }
      
      setError(errorMsg);
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleResendVerification() {
    setError('');
    setIsLoggingIn(true);
    
    // Need email to resend verification
    if (!email) {
      setError('Please enter your email address first.');
      setIsLoggingIn(false);
      return;
    }
    
    const emailTrimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setError('Please enter a valid email address.');
      setIsLoggingIn(false);
      return;
    }
    
    try {
      await resendVerification(emailTrimmed);
      setSuccess('Verification email sent! Please check your inbox.');
      setEmailVerificationSent(true);
    } catch (err) {
      setError(err.message || 'Failed to resend verification email.');
    } finally {
      setIsLoggingIn(false);
    }
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

  // If already logged in, show options
  if (existing) {
    const memberSince = existing.created_at ? new Date(existing.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'N/A';
    
    return (
      <div className="login-page">
        <div className="login-card profile-card">
          {/* Profile Header with gradient */}
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

          {/* User Wallets Section */}
          {userWallets.length > 0 && (
            <div className="user-wallets-section">
              <h3>
                <i className="fa-solid fa-wallet"></i> Your Wallets
              </h3>
              <div className="wallets-list">
                {userWallets.map((wallet, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setShowWalletModal(true);
                    }}
                    className="wallet-item-btn"
                  >
                    <div>
                      <i className={`fa-solid ${wallet.wallet_type === 'SOLANA' ? 'fa-sun' : 'fa-ethereum'}`} style={{ color: wallet.wallet_type === 'SOLANA' ? '#9945FF' : '#00FFA3' }}></i>
                      <div>
                        <span>{wallet.wallet_address.slice(0, 6)}...{wallet.wallet_address.slice(-4)}</span>
                        <span>{wallet.wallet_type} • {wallet.network || 'Mainnet'}</span>
                      </div>
                    </div>
                    <i className="fa-solid fa-arrow-right"></i>
                  </button>
                ))}
              </div>
              {loadingWallets && (
                <div className="loading-text">
                  <i className="fas fa-spinner fa-spin"></i> Loading wallets...
                </div>
              )}
            </div>
          )}
          
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

  // If NOT logged in, show signup/login form
  return (
    <div className="login-page">
      <div className="login-card">
        {/* Toggle between Sign Up and Sign In */}
        <div className="login-toggle-container" style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setError('');
              setSuccess('');
              setEmailVerificationSent(false);
              setShowForgotPassword(false);
              setForgotPasswordEmail('');
              setForgotPasswordSent(false);
            }}
            style={{
              flex: 1,
              padding: '12px',
              background: isSignUp ? 'rgba(0, 255, 163, 0.2)' : 'transparent',
              border: 'none',
              borderBottom: isSignUp ? '2px solid #00FFA3' : '2px solid transparent',
              color: isSignUp ? '#00FFA3' : 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              fontWeight: isSignUp ? 700 : 400,
              transition: 'all 0.2s ease',
              fontSize: '14px'
            }}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setError('');
              setSuccess('');
              setEmailVerificationSent(false);
              setShowForgotPassword(false);
              setForgotPasswordEmail('');
              setForgotPasswordSent(false);
            }}
            style={{
              flex: 1,
              padding: '12px',
              background: !isSignUp ? 'rgba(0, 255, 163, 0.2)' : 'transparent',
              border: 'none',
              borderBottom: !isSignUp ? '2px solid #00FFA3' : '2px solid transparent',
              color: !isSignUp ? '#00FFA3' : 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              fontWeight: !isSignUp ? 700 : 400,
              transition: 'all 0.2s ease',
              fontSize: '14px'
            }}
          >
            Sign In
          </button>
        </div>

        <h1>{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
        <p className="sub">
          {isSignUp 
            ? 'Register to access BITS AI Presale and exclusive features.' 
            : 'Sign in to access your account and continue your journey.'}
        </p>
        
        {/* Form */}
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
          
          {isSignUp && (
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
          )}
          
          <label className="field">
            <span>Password</span>
            <input 
                type="password" 
                value={password} 
                onChange={(e)=>setPassword(e.target.value)} 
                placeholder={isSignUp ? "Min. 8 characters, 1 uppercase, 1 number" : "Enter your password"} 
                required 
                disabled={isLoggingIn}
            />
          </label>
          
          {isSignUp && (
            <label className="field">
              <span>Confirm Password</span>
              <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e)=>setConfirmPassword(e.target.value)} 
                  placeholder="Re-enter your password" 
                  required 
                  disabled={isLoggingIn}
              />
            </label>
          )}
          
          {error && <div className="error"><i className="fas fa-exclamation-circle"></i> {error}</div>}
          {success && <div style={{ background: 'rgba(0, 255, 163, 0.1)', border: '1px solid rgba(0, 255, 163, 0.3)', color: '#00FFA3', padding: '12px 16px', borderRadius: '8px', fontSize: '13px' }}>
            <i className="fas fa-check-circle"></i> {success}
          </div>}
          
          {emailVerificationSent && (
            <div style={{ background: 'rgba(0, 214, 255, 0.1)', border: '1px solid rgba(0, 214, 255, 0.3)', color: '#00D4FF', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', marginTop: '8px' }}>
              <i className="fas fa-envelope"></i> Verification email sent! Please check your inbox and click the verification link.
              <div style={{ marginTop: '8px' }}>
                <button 
                  type="button" 
                  onClick={handleResendVerification}
                  disabled={isLoggingIn}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#00D4FF',
                    cursor: 'pointer',
                    fontSize: '12px',
                    textDecoration: 'underline',
                    opacity: 0.8
                  }}
                >
                  Resend verification email
                </button>
              </div>
            </div>
          )}
          
          <button type="submit" className="btn primary" disabled={isLoggingIn} style={{ width: '100%' }}>
            {isLoggingIn ? (
              <span><i className="fas fa-spinner fa-spin"></i> Processing...</span>
            ) : (
              isSignUp ? 'Create account' : 'Sign in'
            )}
          </button>
          
          {!isSignUp && !showForgotPassword && (
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button 
                type="button" 
                onClick={() => {
                  setShowForgotPassword(true);
                  setError('');
                  setSuccess('');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#00FFA3',
                  cursor: 'pointer',
                  fontSize: '13px',
                  textDecoration: 'underline',
                  opacity: 0.8
                }}
              >
                Forgot password?
              </button>
            </div>
          )}

          {!isSignUp && showForgotPassword && (
            <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(0, 255, 163, 0.05)', borderRadius: '8px', border: '1px solid rgba(0, 255, 163, 0.2)' }}>
              {!forgotPasswordSent ? (
                <>
                  <p style={{ margin: '0 0 12px', fontSize: '14px', opacity: 0.8 }}>
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                  <p style={{ margin: '0 0 12px', fontSize: '12px', opacity: 0.6 }}>
                    The reset link will expire in 1 hour.
                  </p>
                  <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input 
                      type="email" 
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      disabled={isLoggingIn}
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(0, 255, 163, 0.05)',
                        border: '1px solid rgba(0, 255, 163, 0.2)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '14px'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        type="submit" 
                        className="btn primary" 
                        disabled={isLoggingIn}
                        style={{ flex: 1 }}
                      >
                        {isLoggingIn ? 'Sending...' : 'Send Reset Link'}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          setShowForgotPassword(false);
                          setForgotPasswordEmail('');
                          setForgotPasswordSent(false);
                          setError('');
                          setSuccess('');
                        }}
                        className="btn secondary"
                        disabled={isLoggingIn}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div>
                  <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#00FFA3' }}>
                    <i className="fas fa-check-circle"></i> Password reset email sent!
                  </p>
                  <p style={{ margin: '0 0 12px', fontSize: '12px', opacity: 0.7 }}>
                    Please check your email inbox (and spam folder) for the reset link. The link will expire in 1 hour.
                  </p>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotPasswordEmail('');
                      setForgotPasswordSent(false);
                      setSuccess('');
                    }}
                    className="btn secondary"
                    style={{ width: '100%' }}
                  >
                    Back to Sign In
                  </button>
                </div>
              )}
            </div>
          )}
        </form>

        <div className="or">or</div>

        {/* OAuth Providers */}
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
