/**
 * 🔐 Email Authentication Modal
 * 
 * Modal compact (Sonnet-style) pentru Login/Register:
 * - email/password login
 * - email/username/password register
 * - biometric login (dacă e disponibil și deja înregistrat)
 * 
 * @module EmailAuthModal
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Modal } from '../common/Modal';
import { useDexAuth } from '../../context/DexAuthContext';
import { getUserFriendlyError } from '../../utils/helpers';
import {
  validateAuthEmail,
  validateAuthEmailOrUsername,
  normalizeLoginIdentifier,
  validateAuthPassword,
  validateAuthUsername,
  validateAuthConfirmPassword,
} from '../../utils/validators';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import authApiService from '../../services/authApiService';
import { Mail, Lock, LogIn, AlertCircle, User, UserPlus, Fingerprint, Smartphone, Send } from 'lucide-react';
import bitsLogo from '../../../../../assets/logo.png';
import './EmailAuthModal.css';

// Aligned with OTALoginPage: softer rate limit (Google/Amazon style)
const LOGIN_THROTTLE_MS = 2000;
const MAX_FAILED_ATTEMPTS = 10;
const COOLDOWN_SECONDS = 60;

const EmailAuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    loginWithEmail,
    registerWithEmail,
    loginWithPhone,
    loginBiometric,
    loginWithProvider,
    checkAuthStatus,
    clearAuthError,
    error: authError,
    isBiometricAvailable,
    hasBiometricCredential
  } = useDexAuth();
  
  const [authMethod, setAuthMethod] = useState('email'); // 'email' | 'phone'
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [formData, setFormData] = useState({ email: '', username: '', password: '', confirmPassword: '' });
  const [phoneData, setPhoneData] = useState({ phone: '', code: '' });
  const [phoneStep, setPhoneStep] = useState('send'); // 'send' | 'verify'
  const [phoneSending, setPhoneSending] = useState(false);
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricRegistered, setBiometricRegistered] = useState(false);
  const [loginAttemptCount, setLoginAttemptCount] = useState(0);
  const [lastLoginAttemptTime, setLastLoginAttemptTime] = useState(null);
  const [loginCooldownUntil, setLoginCooldownUntil] = useState(null);
  const [loginCooldownSecondsLeft, setLoginCooldownSecondsLeft] = useState(null);

  // La deschidere: form curat; la închidere: șterge eroarea din context (altfel reapare la următoarea deschidere fără încercare nouă)
  useEffect(() => {
    if (isOpen) {
      clearAuthError();
      setMode(initialMode);
      setFormData({ email: '', username: '', password: '', confirmPassword: '' });
      setFormError(null);
      setSuccess(null);
      setIsProcessing(false);
      setLoginAttemptCount(0);
      setLastLoginAttemptTime(null);
      setLoginCooldownUntil(null);
      setLoginCooldownSecondsLeft(null);
    } else {
      clearAuthError();
      setFormError(null);
      setSuccess(null);
    }
  }, [isOpen, initialMode, clearAuthError]);

  // Login cooldown countdown (same as OTALoginPage)
  useEffect(() => {
    if (loginCooldownUntil == null || !isOpen) {
      if (loginCooldownSecondsLeft != null) setLoginCooldownSecondsLeft(null);
      return;
    }
    const tick = () => {
      const now = Date.now();
      if (now >= loginCooldownUntil) {
        setLoginCooldownUntil(null);
        setLoginCooldownSecondsLeft(null);
        setLoginAttemptCount(0);
        setFormError(null);
        return;
      }
      setLoginCooldownSecondsLeft(Math.ceil((loginCooldownUntil - now) / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [loginCooldownUntil, isOpen]);

  useEffect(() => {
    const checkBio = async () => {
      try {
        if (!isOpen) return;
        if (!isBiometricAvailable) return;
        const availability = await isBiometricAvailable();
        setBiometricAvailable(!!availability?.available);
        setBiometricRegistered(availability?.available ? !!hasBiometricCredential?.() : false);
      } catch {
        setBiometricAvailable(false);
        setBiometricRegistered(false);
      }
    };
    checkBio();
  }, [isOpen, isBiometricAvailable, hasBiometricCredential]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError(null);
    setSuccess(null);
  }, []);

  const validateForm = useCallback(() => {
    setFormError(null);
    setSuccess(null);

    const idResult = mode === 'login' ? validateAuthEmailOrUsername(formData.email) : validateAuthEmail(formData.email);
    if (!idResult.valid) {
      setFormError(idResult.message);
      return false;
    }

    if (mode === 'register') {
      const usernameResult = validateAuthUsername(formData.username);
      if (!usernameResult.valid) {
        setFormError(usernameResult.message);
        return false;
      }
    }

    const passwordResult = validateAuthPassword(formData.password, { forRegister: mode === 'register' });
    if (!passwordResult.valid) {
      setFormError(passwordResult.message);
      return false;
    }

    if (mode === 'register') {
      const confirmResult = validateAuthConfirmPassword(formData.password, formData.confirmPassword);
      if (!confirmResult.valid) {
        setFormError(confirmResult.message);
        return false;
      }
    }
    return true;
  }, [formData, mode]);

  const getDeviceFingerprint = useCallback(async () => {
    try {
      return {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    } catch {
      return null;
    }
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    if (!validateForm() || isProcessing) return;

    const now = Date.now();
    if (mode === 'login') {
      if (loginCooldownUntil != null && now < loginCooldownUntil) {
        setFormError(`Too many failed attempts. You can try again in ${loginCooldownSecondsLeft ?? COOLDOWN_SECONDS} seconds.`);
        return;
      }
      if (lastLoginAttemptTime != null && (now - lastLoginAttemptTime) < LOGIN_THROTTLE_MS) {
        setFormError('Please wait a moment before trying again');
        return;
      }
    }

    try {
      setIsProcessing(true);
      setFormError(null);
      setSuccess(null);
      if (mode === 'login') setLastLoginAttemptTime(now);

      const loginOrEmailNormalized =
        mode === 'login' ? normalizeLoginIdentifier(formData.email) : formData.email.trim().toLowerCase();

      if (mode === 'login') {
        const deviceFingerprint = await getDeviceFingerprint();
        const response = await loginWithEmail(loginOrEmailNormalized, formData.password, deviceFingerprint);
        if (response?.success) {
          toast.success('Login successful!');
          onClose();
          if (!location?.pathname?.startsWith('/dex-edu/profile')) {
            navigate('/dex-edu/profile');
          }
        }
      } else {
        const usernameTrimmed = formData.username.trim();
        const response = await registerWithEmail(loginOrEmailNormalized, usernameTrimmed, formData.password);
        if (response?.success) {
          const msg = response?.message || 'Account created. Please verify your email.';
          setSuccess(msg);
          toast.success(msg);
          setMode('login');
          setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        }
      }
    } catch (err) {
      const errorMessage = getUserFriendlyError(err);
      if (errorMessage && errorMessage !== 'Unknown error' && !errorMessage.includes('Unknown')) {
        setFormError(errorMessage);
        toast.error(errorMessage);
      } else if (err?.message) {
        setFormError(err.message);
        toast.error(err.message);
      }
      if (mode === 'login') {
        const nextCount = loginAttemptCount + 1;
        setLoginAttemptCount(nextCount);
        if (nextCount >= MAX_FAILED_ATTEMPTS) {
          setLoginCooldownUntil(Date.now() + COOLDOWN_SECONDS * 1000);
          setFormError(`Too many failed attempts. You can try again in ${COOLDOWN_SECONDS} seconds.`);
        }
      }
    } finally {
      setIsProcessing(false);
    }
  }, [validateForm, isProcessing, formData, mode, loginWithEmail, registerWithEmail, getDeviceFingerprint, onClose, location?.pathname, navigate, loginCooldownUntil, loginCooldownSecondsLeft, lastLoginAttemptTime, loginAttemptCount]);

  const handleBiometricLogin = useCallback(async () => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      setFormError(null);
      setSuccess(null);
      const result = await loginBiometric();
      if (result?.success) {
        toast.success('Biometric login successful!');
        await checkAuthStatus();
        onClose();
      }
    } catch (err) {
      const msg = getUserFriendlyError(err);
      setFormError(msg);
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, loginBiometric, checkAuthStatus, onClose]);

  const handleForgotPassword = () => {
    onClose();
    navigate('/dex-edu/ota/forgot-password');
  };

  // Handle phone verification - send code
  const handleSendPhoneCode = async () => {
    const phoneNormalized = phoneData.phone.trim().replace(/\s+/g, '');
    
    if (!phoneNormalized) {
      setFormError('Phone number is required');
      return;
    }
    
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNormalized)) {
      setFormError('Invalid phone number format. Please use international format (e.g., +1234567890)');
      return;
    }
    
    try {
      setPhoneSending(true);
      setFormError(null);
      
      const response = await authApiService.sendPhoneVerificationCode(phoneNormalized);
      
      if (response?.success) {
        setPhoneStep('verify');
        setFormError(null);
        if (response?.code) {
          setPhoneData(prev => ({ ...prev, code: response.code }));
          setSuccess(`Code: ${response.code}. SMS not delivered – code is already entered. Press Verify.`);
        } else {
          setSuccess('Verification code sent to your phone');
        }
      } else {
        setFormError(response?.error || 'Failed to send verification code');
      }
    } catch (err) {
      setFormError(err?.message || 'Failed to send verification code');
    } finally {
      setPhoneSending(false);
    }
  };

  // Handle phone verification - verify code and login/register
  const handleVerifyPhoneCode = async () => {
    if (!phoneData.code.trim() || phoneData.code.trim().length !== 6) {
      setFormError('Please enter a valid 6-digit verification code');
      return;
    }
    
    try {
      setIsProcessing(true);
      setFormError(null);
      setSuccess(null);
      
      const phoneNormalized = phoneData.phone.trim().replace(/\s+/g, '');
      const response = await loginWithPhone(phoneNormalized, phoneData.code.trim());
      
      if (response?.success) {
        toast.success(response?.message || 'Login successful!');
        onClose();
        if (!location?.pathname?.startsWith('/dex-edu/profile')) {
          navigate('/dex-edu/profile');
        }
      }
    } catch (err) {
      const errorMessage = getUserFriendlyError(err);
      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Only show meaningful errors; during login cooldown show countdown
  const displayError = (mode === 'login' && loginCooldownSecondsLeft != null)
    ? `Too many failed attempts. You can try again in ${loginCooldownSecondsLeft} seconds.`
    : (formError || (authError && getUserFriendlyError(authError) !== 'Unknown error' ? getUserFriendlyError(authError) : null));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="small"
      showHeader={false}
      className="email-auth-modal-ai-shell"
    >
      <div className="email-auth-modal-sonnet">
        <div className="email-auth-modal-content-sonnet">
          <div className="email-auth-ai-header">
            <div className="email-auth-ai-brand">
              <img className="email-auth-ai-logo" src={bitsLogo} alt="BITS" />
              <div className="email-auth-ai-brand-text">
                <div className="email-auth-ai-brand-title">BITS</div>
                <div className="email-auth-ai-brand-subtitle">Secure access</div>
              </div>
            </div>
            <button
              type="button"
              className="email-auth-ai-close"
              onClick={onClose}
              aria-label="Close"
              disabled={isProcessing}
              title="Close"
            >
              ×
            </button>
          </div>

          <div className="email-auth-modal-narrow-sonnet">
            <div className="email-auth-modal-top-sonnet">
              <div className="email-auth-modal-title-row-sonnet">
                <h2 className="email-auth-modal-title-sonnet">
                  {mode === 'login' ? 'Sign in' : 'Create account'}
                </h2>
                <div className="email-auth-mode-toggle-sonnet" role="tablist" aria-label="Auth mode">
                  <button
                    type="button"
                    className={`email-auth-mode-btn-sonnet ${mode === 'login' ? 'active' : ''}`}
                    onClick={() => setMode('login')}
                    disabled={isProcessing}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    className={`email-auth-mode-btn-sonnet ${mode === 'register' ? 'active' : ''}`}
                    onClick={() => setMode('register')}
                    disabled={isProcessing}
                  >
                    Register
                  </button>
                </div>
              </div>

            {displayError && (
              <div className="email-auth-error-sonnet" role="alert">
                <AlertCircle size={18} />
                <span>{displayError}</span>
              </div>
            )}

            {success && (
              <div className="email-auth-success-sonnet" role="status">
                <span>{success}</span>
              </div>
            )}
            </div>

            {authMethod === 'email' ? (
              <form className="email-auth-form-sonnet" onSubmit={handleSubmit}>
                <div className="email-auth-field-sonnet">
                  <label htmlFor="email-modal-sonnet" className="email-auth-label-sonnet">
                    {mode === 'login' ? 'Email or username' : 'Email'}
                  </label>
                  <div className="email-auth-input-wrap-sonnet">
                    <Mail size={16} className="email-auth-input-icon-sonnet" />
                    <input
                      type={mode === 'login' ? 'text' : 'email'}
                      id="email-modal-sonnet"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder={mode === 'login' ? 'you@example.com or username' : 'you@example.com'}
                      required
                      disabled={isProcessing}
                      autoComplete={mode === 'login' ? 'username' : 'email'}
                      className="email-auth-input-sonnet"
                    />
                  </div>
                </div>

                {mode === 'register' && (
              <div className="email-auth-field-sonnet">
                <label htmlFor="username-modal-sonnet" className="email-auth-label-sonnet">Username</label>
                <div className="email-auth-input-wrap-sonnet">
                  <User size={16} className="email-auth-input-icon-sonnet" />
                  <input
                    type="text"
                    id="username-modal-sonnet"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="your-username"
                    required
                    disabled={isProcessing}
                    autoComplete="username"
                    className="email-auth-input-sonnet"
                  />
                </div>
              </div>
            )}

            <div className="email-auth-field-sonnet">
              <label htmlFor="password-modal-sonnet" className="email-auth-label-sonnet">Password</label>
              <div className="email-auth-input-wrap-sonnet">
                <Lock size={16} className="email-auth-input-icon-sonnet" />
                <input
                  type="password"
                  id="password-modal-sonnet"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={mode === 'register' ? 'Create a password' : 'Enter your password'}
                  required
                  disabled={isProcessing}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  className="email-auth-input-sonnet"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div className="email-auth-field-sonnet">
                <label htmlFor="confirm-password-modal-sonnet" className="email-auth-label-sonnet">Confirm password</label>
                <div className="email-auth-input-wrap-sonnet">
                  <Lock size={16} className="email-auth-input-icon-sonnet" />
                  <input
                    type="password"
                    id="confirm-password-modal-sonnet"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Repeat your password"
                    required
                    disabled={isProcessing}
                    autoComplete="new-password"
                    className="email-auth-input-sonnet"
                  />
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="email-auth-links-sonnet">
              <button
                type="button"
                className="email-auth-link-sonnet"
                onClick={handleForgotPassword}
                disabled={isProcessing}
              >
                Forgot password
              </button>
              </div>
            )}

            <button
              type="submit"
              className="email-auth-submit-btn-sonnet"
              disabled={isProcessing || (mode === 'login' && loginCooldownSecondsLeft != null)}
            >
              {isProcessing ? (
                <>
                  <LoadingSpinner size="small" message="" />
                  <span>{mode === 'login' ? 'Signing in…' : 'Creating…'}</span>
                </>
              ) : mode === 'login' && loginCooldownSecondsLeft != null ? (
                <>
                  <LogIn size={16} />
                  <span>Try again in {loginCooldownSecondsLeft}s</span>
                </>
              ) : (
                <>
                  {mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
                  <span>{mode === 'login' ? 'Sign in' : 'Create account'}</span>
                </>
              )}
            </button>

            <div className="email-auth-oauth-divider">sau</div>
            <button
              type="button"
              className="email-auth-oauth-btn"
              onClick={() => loginWithProvider?.('google')}
              disabled={isProcessing}
            >
              Sign in with Google
            </button>
          </form>
            ) : (
              /* Phone Authentication Form */
              <div className="email-auth-form-sonnet">
                {phoneStep === 'send' ? (
                  <>
                    <div className="email-auth-field-sonnet">
                      <label htmlFor="phone-modal-sonnet" className="email-auth-label-sonnet">Phone Number</label>
                      <div className="email-auth-input-wrap-sonnet">
                        <Smartphone size={16} className="email-auth-input-icon-sonnet" />
                        <input
                          type="tel"
                          id="phone-modal-sonnet"
                          value={phoneData.phone}
                          onChange={(e) => {
                            const value = e.target.value.trim();
                            setPhoneData(prev => ({ ...prev, phone: value }));
                            setFormError(null);
                            setSuccess(null);
                          }}
                          placeholder="+1234567890"
                          disabled={phoneSending || isProcessing}
                          autoComplete="tel"
                          className="email-auth-input-sonnet"
                          style={{ fontFamily: 'inherit' }}
                        />
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                        Use international format (e.g., +1234567890)
                      </div>
                    </div>

                    <button
                      type="button"
                      className="email-auth-submit-btn-sonnet"
                      onClick={handleSendPhoneCode}
                      disabled={phoneSending || isProcessing || !phoneData.phone.trim()}
                    >
                      {phoneSending ? (
                        <>
                          <LoadingSpinner size="small" message="" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          <span>Send Verification Code</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="email-auth-field-sonnet">
                      <label htmlFor="phone-code-modal-sonnet" className="email-auth-label-sonnet">
                        Verification Code
                      </label>
                      <div className="email-auth-input-wrap-sonnet">
                        <Lock size={16} className="email-auth-input-icon-sonnet" />
                        <input
                          type="text"
                          id="phone-code-modal-sonnet"
                          value={phoneData.code}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setPhoneData(prev => ({ ...prev, code: value }));
                            setFormError(null);
                            setSuccess(null);
                          }}
                          placeholder="6-digit code"
                          maxLength={6}
                          disabled={isProcessing}
                          autoComplete="one-time-code"
                          className="email-auth-input-sonnet"
                          style={{ 
                            fontFamily: 'monospace', 
                            letterSpacing: '4px',
                            textAlign: 'center',
                            fontSize: '18px'
                          }}
                        />
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Enter the 6-digit code sent to {phoneData.phone}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setPhoneStep('send');
                            setPhoneData(prev => ({ ...prev, code: '' }));
                            setFormError(null);
                            setSuccess(null);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#14f195',
                            cursor: 'pointer',
                            fontSize: '11px',
                            textDecoration: 'underline',
                            padding: 0
                          }}
                        >
                          Change number
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="email-auth-submit-btn-sonnet"
                      onClick={handleVerifyPhoneCode}
                      disabled={isProcessing || phoneData.code.length !== 6}
                    >
                      {isProcessing ? (
                        <>
                          <LoadingSpinner size="small" message="" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <LogIn size={16} />
                          <span>{mode === 'login' ? 'Sign in' : 'Create account'}</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            )}

          {authMethod === 'email' && mode === 'login' && biometricAvailable && biometricRegistered && (
            <button
              type="button"
              className="email-auth-biometric-btn-sonnet"
              onClick={handleBiometricLogin}
              disabled={isProcessing}
            >
              <Fingerprint size={16} />
              <span>Sign in with biometric</span>
            </button>
          )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EmailAuthModal;
