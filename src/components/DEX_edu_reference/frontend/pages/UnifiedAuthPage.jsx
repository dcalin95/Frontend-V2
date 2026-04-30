/**
 * Unified Auth Page – one place for all login/register.
 * Wallet (preferred for trading), Email, Phone, OAuth – recover account if wallet compromised.
 * Use defaultTab="login" | "register" | "wallet" | "phone" to open on a specific tab.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, LogIn, Wallet, AlertCircle, Smartphone } from 'lucide-react';
import OTALogo from '../components/ai-trading/OTALogo';
import OTABrand from '../components/ai-trading/OTABrand';
import { useDexAuth } from '../context/DexAuthContext';
import { getUserFriendlyError } from '../utils/helpers';
import {
  validateAuthEmail,
  validateAuthEmailOrUsername,
  normalizeLoginIdentifier,
  validateAuthPassword,
  validateAuthUsername,
  validateAuthConfirmPassword,
} from '../utils/validators';
import { loginWithProvider } from '../services/authApiService';
import { getBackendUrl } from '../../config/apiEndpoints.js';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../styles/pages.css';
import '../styles/components/ota-login-page.css';
import '../styles/components/ota-register-page.css';

const TABS = { wallet: 'wallet', login: 'login', register: 'register', phone: 'phone' };

export default function UnifiedAuthPage({ defaultTab = 'login' }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || defaultTab;
  const [activeTab, setActiveTab] = useState(() => TABS[initialTab] ? initialTab : defaultTab);
  const rawReturnTo = searchParams.get('returnTo');
  const returnTo = rawReturnTo && rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//') ? rawReturnTo : '/dex-edu/profile';

  const {
    login,
    loginWithEmail,
    registerWithEmail,
    loginWithPhone,
    isAuthenticated,
    loading: authLoading,
    wallet,
  } = useDexAuth();

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ email: '', username: '', password: '', confirmPassword: '' });
  const [quickSignupForm, setQuickSignupForm] = useState({ email: '', username: '' });
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletStep, setWalletStep] = useState('connect');
  const [walletError, setWalletError] = useState(null);
  const [showQuickSignup, setShowQuickSignup] = useState(false);
  const [phoneData, setPhoneData] = useState({ phone: '', code: '' });
  const [phoneStep, setPhoneStep] = useState('send');
  const [phoneSending, setPhoneSending] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(returnTo);
    }
  }, [isAuthenticated, navigate, returnTo]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    const idResult = validateAuthEmailOrUsername(loginForm.email);
    if (!idResult.valid) {
      setFormError(idResult.message);
      return;
    }
    const passwordResult = validateAuthPassword(loginForm.password);
    if (!passwordResult.valid) {
      setFormError(passwordResult.message);
      return;
    }
    try {
      setIsProcessing(true);
      const res = await loginWithEmail(normalizeLoginIdentifier(loginForm.email), loginForm.password, null);
      if (res?.success) {
        toast.success('Signed in.');
        navigate('/dex-edu/profile');
      }
    } catch (err) {
      setFormError(getUserFriendlyError(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    const emailResult = validateAuthEmail(registerForm.email);
    if (!emailResult.valid) {
      setFormError(emailResult.message);
      return;
    }
    const usernameResult = validateAuthUsername(registerForm.username);
    if (!usernameResult.valid) {
      setFormError(usernameResult.message);
      return;
    }
    const passwordResult = validateAuthPassword(registerForm.password, { forRegister: true });
    if (!passwordResult.valid) {
      setFormError(passwordResult.message);
      return;
    }
    const confirmResult = validateAuthConfirmPassword(registerForm.password, registerForm.confirmPassword);
    if (!confirmResult.valid) {
      setFormError(confirmResult.message);
      return;
    }
    try {
      setIsProcessing(true);
      const res = await registerWithEmail(
        registerForm.email.trim().toLowerCase(),
        registerForm.username.trim(),
        registerForm.password,
        '/dex-edu/profile'
      );
      if (res?.success) {
        setSuccessMessage('Check your email to verify your account.');
        toast.success('Account created. Check your email.');
      }
    } catch (err) {
      setFormError(getUserFriendlyError(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWalletLogin = async () => {
    setWalletError(null);
    setWalletStep('signing');
    try {
      await login();
      setWalletStep('success');
      toast.success('Signed in.');
      navigate(returnTo);
    } catch (err) {
      setWalletError(getUserFriendlyError(err));
      setWalletStep('connect');
    }
  };

  const handleQuickSignupSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    const emailResult = validateAuthEmail(quickSignupForm.email);
    if (!emailResult.valid) {
      setFormError(emailResult.message);
      return;
    }
    const usernameResult = validateAuthUsername(quickSignupForm.username);
    if (!usernameResult.valid) {
      setFormError(usernameResult.message);
      return;
    }
    try {
      setIsProcessing(true);
      const url = `${getBackendUrl()}/api/auth/signup`;
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: quickSignupForm.email.trim().toLowerCase(),
          username: quickSignupForm.username.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || data?.error || 'Signup failed');
      }
      setSuccessMessage('Account created. You can sign in with email/password or OAuth.');
      toast.success('Account created.');
    } catch (err) {
      setFormError(err?.message || 'Signup failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOAuth = (provider) => {
    setFormError(null);
    loginWithProvider(provider);
  };

  const handleSendPhoneCode = async () => {
    const phoneNormalized = phoneData.phone.trim().replace(/\s+/g, '');
    if (!phoneNormalized) {
      setFormError('Phone number is required');
      return;
    }
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNormalized)) {
      setFormError('Invalid format. Use international (e.g. +40761133771)');
      return;
    }
    setFormError(null);
    setPhoneSending(true);
    try {
      const authApiService = (await import('../services/authApiService')).default;
      const res = await authApiService.sendPhoneVerificationCode(phoneNormalized);
      if (res?.success) {
        setPhoneStep('verify');
        setSuccessMessage('Code sent. Enter the 6-digit code.');
        if (res?.code) setPhoneData((p) => ({ ...p, code: String(res.code) }));
      } else {
        setFormError(res?.error || 'Failed to send code');
      }
    } catch (err) {
      setFormError(err?.message || 'Failed to send code');
    } finally {
      setPhoneSending(false);
    }
  };

  const handleVerifyPhoneCode = async (e) => {
    e?.preventDefault?.();
    const code = phoneData.code.trim();
    if (!code || code.length !== 6) {
      setFormError('Enter the 6-digit code');
      return;
    }
    setFormError(null);
    setIsProcessing(true);
    try {
      const phoneNormalized = phoneData.phone.trim().replace(/\s+/g, '');
      const res = await loginWithPhone(phoneNormalized, code);
      if (res?.success) {
        toast.success('Signed in.');
        navigate(returnTo);
      }
    } catch (err) {
      setFormError(getUserFriendlyError(err));
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="ota-login-page">
        <div className="ota-login-container">
          <LoadingSpinner message="Loading…" />
        </div>
      </div>
    );
  }

  return (
    <div className="ota-login-page unified-auth-page">
      <div className="ota-login-container unified-auth-container">
        <div className="ota-login-header">
          <h1 className="ota-login-title ota-title-row">
            <OTABrand size="md" text="Sign in / Register" />
          </h1>
          <p className="ota-login-subtitle">
            Wallet preferred for trading. <strong>Recovery:</strong> Email, Phone, or OAuth – if wallet is compromised.
          </p>
        </div>

        <div className="unified-auth-tabs" role="tablist" aria-label="Sign in or register">
          <button
            type="button"
            role="tab"
            id="unified-tab-wallet"
            aria-selected={activeTab === 'wallet'}
            aria-controls="unified-panel-wallet"
            className={`unified-auth-tab ${activeTab === 'wallet' ? 'active' : ''}`}
            onClick={() => { setActiveTab('wallet'); setFormError(null); setWalletError(null); setSuccessMessage(null); setSearchParams((p) => { const n = new URLSearchParams(p); n.set('tab', 'wallet'); return n; }); }}
          >
            <Wallet size={18} /> Wallet
          </button>
          <button
            type="button"
            role="tab"
            id="unified-tab-login"
            aria-selected={activeTab === 'login'}
            aria-controls="unified-panel-login"
            className={`unified-auth-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => { setActiveTab('login'); setFormError(null); setSuccessMessage(null); setSearchParams((prev) => { const n = new URLSearchParams(prev); n.set('tab', 'login'); return n; }); }}
          >
            <LogIn size={18} /> Sign in
          </button>
          <button
            type="button"
            role="tab"
            id="unified-tab-register"
            aria-selected={activeTab === 'register'}
            aria-controls="unified-panel-register"
            className={`unified-auth-tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => { setActiveTab('register'); setFormError(null); setSuccessMessage(null); setSearchParams((prev) => { const n = new URLSearchParams(prev); n.set('tab', 'register'); return n; }); }}
          >
            <UserPlus size={18} /> Register
          </button>
          <button
            type="button"
            role="tab"
            id="unified-tab-phone"
            aria-selected={activeTab === 'phone'}
            aria-controls="unified-panel-phone"
            className={`unified-auth-tab ${activeTab === 'phone' ? 'active' : ''}`}
            onClick={() => { setActiveTab('phone'); setFormError(null); setSuccessMessage(null); setPhoneStep('send'); setSearchParams((prev) => { const n = new URLSearchParams(prev); n.set('tab', 'phone'); return n; }); }}
          >
            <Smartphone size={18} /> Phone
          </button>
        </div>

        {(formError || walletError) && (
          <div className="ota-login-error" role="alert">
            <AlertCircle size={16} />
            <span>{formError || walletError}</span>
          </div>
        )}
        {successMessage && (
          <div className="ota-register-success" style={{ marginBottom: 12 }}>
            <span>{successMessage}</span>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="unified-auth-panel">
            <p className="unified-auth-hint">Connect wallet and sign to sign in. Best for trading. If compromised, use Email, Phone, or OAuth to recover.</p>
            {walletStep === 'signing' && (
              <div className="unified-auth-loading">
                <LoadingSpinner size="small" message="Please sign in your wallet…" />
              </div>
            )}
            <button
              type="button"
              className="ota-login-submit-btn"
              disabled={walletStep === 'signing'}
              onClick={handleWalletLogin}
            >
              <Wallet size={18} />
              {walletStep === 'signing' ? 'Sign in wallet…' : 'Connect wallet & sign in'}
            </button>
          </div>
        )}

        {activeTab === 'login' && (
          <form id="unified-panel-login" className="ota-login-form unified-auth-panel" onSubmit={handleLoginSubmit} role="tabpanel" aria-labelledby="unified-tab-login">
            <div className="ota-login-form-group">
              <label className="ota-login-label" htmlFor="unified-email">Email or username</label>
              <div className="ota-login-input-wrapper">
                <Mail size={20} className="ota-login-input-icon" />
                <input
                  id="unified-email"
                  type="text"
                  className="ota-login-input"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="you@example.com or username"
                  disabled={isProcessing}
                  autoComplete="username"
                />
              </div>
            </div>
            <div className="ota-login-form-group">
              <label className="ota-login-label" htmlFor="unified-password">Password</label>
              <div className="ota-login-input-wrapper">
                <Lock size={20} className="ota-login-input-icon" />
                <input
                  id="unified-password"
                  type="password"
                  className="ota-login-input"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Password"
                  disabled={isProcessing}
                  autoComplete="current-password"
                />
              </div>
            </div>
            <div className="ota-login-form-actions">
              <Link to={`/dex-edu/ota/forgot-password${returnTo !== '/dex-edu/profile' ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`} className="ota-login-forgot-link">Forgot password?</Link>
            </div>
            <button type="submit" className="ota-login-submit-btn" disabled={isProcessing}>
              <LogIn size={18} /> Sign in
            </button>
          </form>
        )}

        {activeTab === 'register' && (
          <form className="ota-register-form unified-auth-panel" onSubmit={handleRegisterSubmit}>
            <div className="ota-register-form-group">
              <label className="ota-register-label" htmlFor="unified-reg-email">Email</label>
              <div className="ota-register-input-wrapper">
                <Mail size={20} className="ota-register-input-icon" />
                <input
                  id="unified-reg-email"
                  type="email"
                  className="ota-register-input"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="you@example.com"
                  disabled={isProcessing}
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="ota-register-form-group">
              <label className="ota-register-label" htmlFor="unified-reg-username">Username</label>
              <div className="ota-register-input-wrapper">
                <User size={20} className="ota-register-input-icon" />
                <input
                  id="unified-reg-username"
                  type="text"
                  className="ota-register-input"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm((p) => ({ ...p, username: e.target.value }))}
                  placeholder="username"
                  disabled={isProcessing}
                  autoComplete="username"
                />
              </div>
            </div>
            <div className="ota-register-form-group">
              <label className="ota-register-label" htmlFor="unified-reg-password">Password</label>
              <div className="ota-register-input-wrapper">
                <Lock size={20} className="ota-register-input-icon" />
                <input
                  id="unified-reg-password"
                  type="password"
                  className="ota-register-input"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Min 8 chars, upper, lower, number"
                  disabled={isProcessing}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div className="ota-register-form-group">
              <label className="ota-register-label" htmlFor="unified-reg-confirm">Confirm password</label>
              <div className="ota-register-input-wrapper">
                <Lock size={20} className="ota-register-input-icon" />
                <input
                  id="unified-reg-confirm"
                  type="password"
                  className="ota-register-input"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Confirm password"
                  disabled={isProcessing}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <button type="submit" className="ota-register-submit-btn" disabled={isProcessing}>
              <UserPlus size={18} /> Create account
            </button>
          </form>
        )}

        <div className="unified-auth-divider">or recover / sign in with</div>
        <div className="unified-auth-oauth">
          <button type="button" className="unified-auth-oauth-btn" onClick={() => handleOAuth('google')}>
            Google
          </button>
          <button type="button" className="unified-auth-oauth-btn" onClick={() => handleOAuth('facebook')}>
            Facebook
          </button>
          <button type="button" className="unified-auth-oauth-btn" onClick={() => handleOAuth('x-twitter')}>
            X
          </button>
          <button type="button" className="unified-auth-oauth-btn" onClick={() => handleOAuth('discord')}>
            Discord
          </button>
        </div>

        <button
          type="button"
          className="unified-auth-quick-toggle"
          onClick={() => setShowQuickSignup(!showQuickSignup)}
        >
          {showQuickSignup ? 'Hide quick signup' : 'Quick signup (email + username only)'}
        </button>
        {showQuickSignup && (
          <form className="unified-auth-quick-form" onSubmit={handleQuickSignupSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={quickSignupForm.email}
              onChange={(e) => setQuickSignupForm((p) => ({ ...p, email: e.target.value }))}
              className="ota-login-input"
            />
            <input
              type="text"
              placeholder="Username"
              value={quickSignupForm.username}
              onChange={(e) => setQuickSignupForm((p) => ({ ...p, username: e.target.value }))}
              className="ota-login-input"
            />
            <button type="submit" className="ota-login-submit-btn" disabled={isProcessing}>
              Create account (no password)
            </button>
          </form>
        )}

        <div className="ota-login-footer">
          <p className="ota-login-footer-text">
            {activeTab === 'login' && (
              <>No account? <button type="button" className="ota-login-register-link" onClick={() => setActiveTab('register')}>Register</button> or <button type="button" className="ota-login-register-link" onClick={() => setActiveTab('phone')}>phone</button></>
            )}
            {activeTab === 'register' && (
              <>Have an account? <button type="button" className="ota-login-register-link" onClick={() => setActiveTab('login')}>Sign in</button> or <button type="button" className="ota-login-register-link" onClick={() => setActiveTab('phone')}>phone</button></>
            )}
            {activeTab === 'wallet' && (
              <>Wallet compromised? <button type="button" className="ota-login-register-link" onClick={() => setActiveTab('login')}>Email</button>, <button type="button" className="ota-login-register-link" onClick={() => setActiveTab('phone')}>Phone</button>, or OAuth below</>
            )}
            {activeTab === 'phone' && (
              <>Or <button type="button" className="ota-login-register-link" onClick={() => setActiveTab('login')}>email</button>, <button type="button" className="ota-login-register-link" onClick={() => setActiveTab('wallet')}>wallet</button></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
