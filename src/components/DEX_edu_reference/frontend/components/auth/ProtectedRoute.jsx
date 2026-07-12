/**
 * 🔒 Protected Route Component
 * 
 * Route guard component pentru protecția rutei bazată pe autentificare:
 * - Verifică statusul de autentificare
 * - Afișează loading state în timpul verificării
 * - Redirecționează la login dacă nu este autentificat
 * - Render children dacă este autentificat
 * 
 * @module ProtectedRoute
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useDexAuth } from '../../context/DexAuthContext';
import LoginModal from './LoginModal';
import {
  validateAuthEmail,
  validateAuthEmailOrUsername,
  normalizeLoginIdentifier,
  validateAuthPassword,
  validateAuthUsername,
  validateAuthConfirmPassword,
} from '../../utils/validators';
import { getUserFriendlyError } from '../../utils/helpers';
import { toast } from 'react-toastify';
import { getBackendUrl } from '../../../config/apiEndpoints.js';

/**
 * ProtectedRoute Component
 * 
 * @param {object} props
 * @param {React.ReactNode} props.children - Route content to protect
 * @param {boolean} props.requireAuth - Require authentication (default: true)
 * @param {string} props.redirectTo - Redirect path if not authenticated (default: '/')
 * @param {boolean} props.showLoginModal - Show login modal instead of redirect (default: true)
 */
const ProtectedRoute = ({ 
  children, 
  requireAuth = true,
  redirectTo = '/',
  showLoginModal = true,
  authVariant = 'wallet' // 'wallet' | 'email'
}) => {
  const { isAuthenticated, loading, checkAuthStatus, loginWithEmail, registerWithEmail } = useDexAuth();
  const [showModal, setShowModal] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [inlineMode, setInlineMode] = useState('login');
  const [inlineData, setInlineData] = useState({ email: '', username: '', password: '', confirmPassword: '' });
  const [inlineError, setInlineError] = useState(null);
  const [inlineProcessing, setInlineProcessing] = useState(false);

  // Check auth status on mount and when auth state changes
  useEffect(() => {
    if (!hasChecked && !loading) {
      checkAuthStatus();
      setHasChecked(true);
    }
  }, [loading, hasChecked, checkAuthStatus]);

  // Nu mai facem logout la 401 din validare: în cross-origin cookie-ul poate să nu fie trimis la /me,
  // și am deconectat utilizatorul imediat după login. Starea se actualizează când backend returnează 401 la un request făcut de user (ex. profil, wallets).

  // Keep modal open state in sync; when not authenticated on protected page, modal should be visible
  useEffect(() => {
    if (isAuthenticated) setShowModal(false);
    else if (!loading && requireAuth && showLoginModal && hasChecked) setShowModal(true);
  }, [loading, isAuthenticated, requireAuth, showLoginModal, hasChecked]);

  const validateInlineForm = useCallback(() => {
    setInlineError(null);
    const idResult =
      inlineMode === 'login'
        ? validateAuthEmailOrUsername(inlineData.email)
        : validateAuthEmail(inlineData.email);
    if (!idResult.valid) {
      setInlineError(idResult.message);
      return false;
    }
    if (inlineMode === 'register') {
      const usernameResult = validateAuthUsername(inlineData.username);
      if (!usernameResult.valid) {
        setInlineError(usernameResult.message);
        return false;
      }
    }
    const passwordResult = validateAuthPassword(inlineData.password, { forRegister: inlineMode === 'register' });
    if (!passwordResult.valid) {
      setInlineError(passwordResult.message);
      return false;
    }
    if (inlineMode === 'register') {
      const confirmResult = validateAuthConfirmPassword(inlineData.password, inlineData.confirmPassword);
      if (!confirmResult.valid) {
        setInlineError(confirmResult.message);
        return false;
      }
    }
    return true;
  }, [inlineData, inlineMode]);

  const handleInlineSubmit = useCallback(async (e) => {
    e?.preventDefault();
    if (!validateInlineForm() || inlineProcessing) return;
    try {
      setInlineProcessing(true);
      setInlineError(null);
      const loginId = normalizeLoginIdentifier(inlineData.email);
      if (inlineMode === 'login') {
        const response = await loginWithEmail(loginId, inlineData.password);
        if (response?.success) {
          toast.success('Login successful!');
          checkAuthStatus();
        }
      } else {
        const emailNorm = normalizeLoginIdentifier(inlineData.email);
        const response = await registerWithEmail(emailNorm, inlineData.username.trim(), inlineData.password);
        if (response?.success) {
          toast.success(response?.message || 'Account created. Please verify your email.');
          setInlineMode('login');
          setInlineData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        }
      }
    } catch (err) {
      const msg = getUserFriendlyError(err);
      setInlineError(msg || err?.message || 'Request failed');
      toast.error(msg || err?.message);
    } finally {
      setInlineProcessing(false);
    }
  }, [inlineData, inlineMode, inlineProcessing, validateInlineForm, loginWithEmail, registerWithEmail, checkAuthStatus]);

  // Show loading state while checking auth
  if (loading || !hasChecked) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div className="loading-spinner" style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(20, 241, 149, 0.2)',
          borderTopColor: '#14f195',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}></div>
        <p style={{ color: '#888', fontSize: '0.875rem' }}>Checking authentication...</p>
      </div>
    );
  }

  // If authentication is not required, render children
  if (!requireAuth) {
    return <>{children}</>;
  }

  // If not authenticated, show login modal or redirect
  if (!isAuthenticated) {
    if (showLoginModal) {
      return (
        <>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '60vh',
            flexDirection: 'column',
            gap: '1rem',
            padding: '2rem',
            background: 'var(--ds-bg-surface, rgba(255,255,255,0.04))',
            borderRadius: '12px',
            margin: '1rem',
            border: '1px solid var(--ds-border-color, rgba(255,255,255,0.1))'
          }}>
            <p style={{ color: 'var(--ds-text-primary, #e2e8f0)', fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
              {authVariant === 'email'
                ? 'Please log in to access this page.'
                : 'Please connect your wallet to access this page.'}
            </p>
            <p style={{ color: 'var(--ds-text-secondary, #94a3b8)', fontSize: '0.875rem', margin: 0 }}>
              {authVariant === 'email'
                ? 'Log in below (sau folosește Login / Register în header pentru Google).'
                : 'Use the login button below or sign in from the sidebar (Profile / OTA).'}
            </p>
            {authVariant === 'email' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const base = getBackendUrl();
                    if (!base) return;
                    const origin = window.location.origin || `${window.location.protocol}//${window.location.hostname}:${window.location.port || '3000'}`;
                    const returnUrl = `${origin}/#/dex-edu/profile?auth=success`;
                    const requestBase = origin === 'https://bits-ai.io' ? origin : base;
                    window.location.href = `${requestBase.replace(/\/$/, '')}/api/auth/google/start?redirect=${encodeURIComponent(returnUrl)}`;
                  }}
                  style={{ width: '100%', maxWidth: '360px', padding: '10px 16px', marginTop: '0.5rem', borderRadius: '8px', border: '1px solid var(--ds-border-color, rgba(255,255,255,0.2))', background: 'var(--ds-bg-input, rgba(0,0,0,0.2))', color: 'var(--ds-text-primary, #e2e8f0)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Log in with Google
                </button>
                <p style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--ds-text-secondary, #94a3b8)' }}>sau cu email/username și parolă:</p>
                <form
                  onSubmit={handleInlineSubmit}
                  style={{ width: '100%', maxWidth: '360px', marginTop: '1rem' }}
                >
                  {inlineMode === 'register' && (
                    <input
                      type="text"
                      placeholder="Username"
                      value={inlineData.username}
                      onChange={(e) => { setInlineData(prev => ({ ...prev, username: e.target.value })); setInlineError(null); }}
                      style={{ width: '100%', padding: '10px 12px', marginBottom: '0.75rem', borderRadius: '8px', border: '1px solid var(--ds-border-color, rgba(255,255,255,0.2))', background: 'var(--ds-bg-input, rgba(0,0,0,0.3))', color: 'var(--ds-text-primary, #e2e8f0)', fontSize: '0.9375rem' }}
                      autoComplete="username"
                      disabled={inlineProcessing}
                    />
                  )}
                  <input
                    type="text"
                    placeholder={inlineMode === 'login' ? 'Email or username' : 'Email'}
                    value={inlineData.email}
                    onChange={(e) => { setInlineData(prev => ({ ...prev, email: e.target.value })); setInlineError(null); }}
                    style={{ width: '100%', padding: '10px 12px', marginBottom: '0.75rem', borderRadius: '8px', border: '1px solid var(--ds-border-color, rgba(255,255,255,0.2))', background: 'var(--ds-bg-input, rgba(0,0,0,0.3))', color: 'var(--ds-text-primary, #e2e8f0)', fontSize: '0.9375rem' }}
                    autoComplete={inlineMode === 'login' ? 'username' : 'email'}
                    disabled={inlineProcessing}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={inlineData.password}
                    onChange={(e) => { setInlineData(prev => ({ ...prev, password: e.target.value })); setInlineError(null); }}
                    style={{ width: '100%', padding: '10px 12px', marginBottom: '0.75rem', borderRadius: '8px', border: '1px solid var(--ds-border-color, rgba(255,255,255,0.2))', background: 'var(--ds-bg-input, rgba(0,0,0,0.3))', color: 'var(--ds-text-primary, #e2e8f0)', fontSize: '0.9375rem' }}
                    autoComplete={inlineMode === 'login' ? 'current-password' : 'new-password'}
                    disabled={inlineProcessing}
                  />
                  {inlineMode === 'register' && (
                    <input
                      type="password"
                      placeholder="Confirm password"
                      value={inlineData.confirmPassword}
                      onChange={(e) => { setInlineData(prev => ({ ...prev, confirmPassword: e.target.value })); setInlineError(null); }}
                      style={{ width: '100%', padding: '10px 12px', marginBottom: '0.75rem', borderRadius: '8px', border: '1px solid var(--ds-border-color, rgba(255,255,255,0.2))', background: 'var(--ds-bg-input, rgba(0,0,0,0.3))', color: 'var(--ds-text-primary, #e2e8f0)', fontSize: '0.9375rem' }}
                      autoComplete="new-password"
                      disabled={inlineProcessing}
                    />
                  )}
                  {inlineMode === 'login' && (
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>
                      <Link to="/dex-edu/ota/forgot-password" style={{ color: 'var(--ds-accent, #14f195)', textDecoration: 'none' }}>
                        Am uitat parola?
                      </Link>
                    </p>
                  )}
                  {inlineError && (
                    <p style={{ color: 'var(--ds-error, #f87171)', fontSize: '0.8125rem', margin: '0 0 0.5rem 0' }}>{inlineError}</p>
                  )}
                  <button
                    type="submit"
                    style={{ width: '100%', padding: '10px 16px', marginTop: '0.5rem', borderRadius: '8px', border: 'none', background: 'var(--ds-accent, #14f195)', color: '#0d0d0d', fontWeight: 600, cursor: inlineProcessing ? 'not-allowed' : 'pointer', opacity: inlineProcessing ? 0.7 : 1 }}
                    disabled={inlineProcessing}
                  >
                    {inlineProcessing ? 'Please wait...' : (inlineMode === 'login' ? 'Log in' : 'Create account')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setInlineMode(m => m === 'login' ? 'register' : 'login'); setInlineError(null); }}
                    style={{ width: '100%', padding: '10px 16px', marginTop: '0.5rem', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--ds-text-secondary, #94a3b8)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {inlineMode === 'login' ? 'Create account' : 'Back to login'}
                  </button>
                </form>
              </>
            )}
          </div>
          {authVariant !== 'email' ? (
            <LoginModal 
              isOpen={showModal} 
              onClose={() => setShowModal(false)}
            />
          ) : null}
        </>
      );
    } else {
      return <Navigate to={redirectTo} replace />;
    }
  }

  // If authenticated, render protected content
  return <>{children}</>;
};

export default ProtectedRoute;
