/**
 * 🔐 OTA Login Page - Standalone Login Page
 * 
 * Standalone login page pentru OTA:
 * - Email/password login
 * - Link către register
 * - Link către forgot password
 * - Redirect după login
 * 
 * @module OTALoginPage
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import OTALogo from '../components/ai-trading/OTALogo';
import OTABrand from '../components/ai-trading/OTABrand';
import { useDexAuth } from '../context/DexAuthContext';
import { getUserFriendlyError } from '../utils/helpers';
import { validateAuthEmailOrUsername, normalizeLoginIdentifier, validateAuthPassword } from '../utils/validators';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../styles/pages.css';
import '../styles/components/ota-login-page.css';

// Softer rate limit: more attempts allowed, short cooldown (Google/Amazon style)
const LOGIN_THROTTLE_MS = 2000;       // min 2s between submit clicks
const MAX_FAILED_ATTEMPTS = 10;       // before cooldown
const COOLDOWN_SECONDS = 60;          // 1 min cooldown, then can try again

const OTALoginPage = () => {
  const navigate = useNavigate();
  const { loginWithEmail, isAuthenticated, checkAuthStatus } = useDexAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [formError, setFormError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState(null);
  const [cooldownUntil, setCooldownUntil] = useState(null); // timestamp; when past, reset and allow
  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState(null); // for UI countdown

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dex-edu/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Cooldown countdown: when cooldown expires, reset attempts and clear cooldown
  useEffect(() => {
    if (cooldownUntil == null) {
      setCooldownSecondsLeft(null);
      return;
    }
    const tick = () => {
      const now = Date.now();
      if (now >= cooldownUntil) {
        setCooldownUntil(null);
        setCooldownSecondsLeft(null);
        setAttemptCount(0);
        setFormError(null);
        return;
      }
      setCooldownSecondsLeft(Math.ceil((cooldownUntil - now) / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError(null);
  };

  // Validate form (shared DEX auth validation)
  const validateForm = () => {
    setFormError(null);
    const idResult = validateAuthEmailOrUsername(formData.email);
    if (!idResult.valid) {
      setFormError(idResult.message);
      return false;
    }
    const passwordResult = validateAuthPassword(formData.password);
    if (!passwordResult.valid) {
      setFormError(passwordResult.message);
      return false;
    }
    return true;
  };

  // Get device fingerprint
  const getDeviceFingerprint = async () => {
    try {
      const fingerprint = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      return fingerprint;
    } catch (err) {
      return null;
    }
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const now = Date.now();

    // Cooldown active: show countdown, block submit
    if (cooldownUntil != null && now < cooldownUntil) {
      const sec = Math.ceil((cooldownUntil - now) / 1000);
      setFormError(`Too many failed attempts. You can try again in ${sec} seconds.`);
      return;
    }

    // Throttle: avoid double-submit and rapid retries
    if (lastAttemptTime && (now - lastAttemptTime) < LOGIN_THROTTLE_MS) {
      setFormError('Please wait a moment before trying again');
      return;
    }

    try {
      setIsProcessing(true);
      setFormError(null);
      setLastAttemptTime(now);

      const loginId = normalizeLoginIdentifier(formData.email);
      const password = formData.password;

      if (!password || password.length === 0) {
        setFormError('Password is required');
        setIsProcessing(false);
        return;
      }

      const deviceFingerprint = await getDeviceFingerprint();
      const response = await loginWithEmail(loginId, password, deviceFingerprint);

      if (response.success) {
        toast.success('Login successful!');
        navigate('/dex-edu/dashboard');
      }
    } catch (err) {
      const errorMessage = getUserFriendlyError(err);
      setFormError(errorMessage);
      toast.error(errorMessage);
      const nextCount = attemptCount + 1;
      setAttemptCount(nextCount);
      if (nextCount >= MAX_FAILED_ATTEMPTS) {
        setCooldownUntil(Date.now() + COOLDOWN_SECONDS * 1000);
        setFormError(`Too many failed attempts. You can try again in ${COOLDOWN_SECONDS} seconds.`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="ota-login-page">
      <div className="ota-login-container">
        <div className="ota-login-header">
          <h1 className="ota-login-title ota-title-row">
            <OTABrand size="md" text="OTA Login" />
          </h1>
          <p className="ota-login-subtitle">Sign in to access <OTALogo size="xs" className="ota-login-subtitle-logo" /> OTA Trading features</p>
        </div>

        <form className="ota-login-form" onSubmit={handleLogin} aria-label="Sign in form">
          {(cooldownSecondsLeft != null
            ? (
              <div className="ota-login-error ota-login-cooldown" role="alert" aria-live="polite">
                <div className="ota-login-error-row">
                  <AlertCircle size={16} />
                  <span>Too many failed attempts. You can try again in {cooldownSecondsLeft} seconds.</span>
                </div>
              </div>
            )
            : formError && (
              <div className="ota-login-error" role="alert" aria-live="polite">
                <div className="ota-login-error-row">
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
                {formError.toLowerCase().includes('locked') && (
                  <div className="ota-login-error-forgot">
                    <Link to="/dex-edu/ota/forgot-password">Forgot password? Reset to unlock sooner.</Link>
                  </div>
                )}
              </div>
            )
          )}

          <div className="ota-login-form-group">
            <label className="ota-login-label" htmlFor="email">
              Email or username
            </label>
            <div className="ota-login-input-wrapper">
              <Mail size={20} className="ota-login-input-icon" />
              <input
                id="email"
                name="email"
                type="text"
                className="ota-login-input"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email or username"
                disabled={isProcessing}
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="ota-login-form-group">
            <label className="ota-login-label" htmlFor="password">
              Password
            </label>
            <div className="ota-login-input-wrapper">
              <Lock size={20} className="ota-login-input-icon" />
              <input
                id="password"
                name="password"
                type="password"
                className="ota-login-input"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                disabled={isProcessing}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <div className="ota-login-form-actions">
            <Link to="/dex-edu/ota/forgot-password" className="ota-login-forgot-link">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="ota-login-submit-btn"
            disabled={isProcessing || cooldownSecondsLeft != null}
            aria-busy={isProcessing}
          >
            {isProcessing ? (
              <>
                <LoadingSpinner size="small" message="" />
                Signing in...
              </>
            ) : cooldownSecondsLeft != null ? (
              <>
                <LogIn size={18} />
                Try again in {cooldownSecondsLeft}s
              </>
            ) : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="ota-login-footer">
          <p className="ota-login-footer-text">
            Don't have an account?{' '}
            <Link to="/dex-edu/ota/register" className="ota-login-register-link">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTALoginPage;
