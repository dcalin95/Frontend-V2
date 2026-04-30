/**
 * 📝 OTA Register Page - Standalone Register Page
 * 
 * Standalone register page pentru OTA:
 * - Email/username/password registration
 * - Email verification notice
 * - Link către login
 * - Redirect după register
 * 
 * @module OTARegisterPage
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, User, Lock, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import OTALogo from '../components/ai-trading/OTALogo';
import OTABrand from '../components/ai-trading/OTABrand';
import { useDexAuth } from '../context/DexAuthContext';
import { getUserFriendlyError } from '../utils/helpers';
import { validateAuthEmail, validateAuthPassword, validateAuthUsername, validateAuthConfirmPassword } from '../utils/validators';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../styles/pages.css';
import '../styles/components/ota-register-page.css';

const OTARegisterPage = () => {
  const navigate = useNavigate();
  const { registerWithEmail, isAuthenticated } = useDexAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dex-edu/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError(null);
  };

  // Validate form (shared DEX auth validation)
  const validateForm = () => {
    setFormError(null);
    const emailResult = validateAuthEmail(formData.email);
    if (!emailResult.valid) {
      setFormError(emailResult.message);
      return false;
    }
    const usernameResult = validateAuthUsername(formData.username);
    if (!usernameResult.valid) {
      setFormError(usernameResult.message);
      return false;
    }
    const passwordResult = validateAuthPassword(formData.password, { forRegister: true });
    if (!passwordResult.valid) {
      setFormError(passwordResult.message);
      return false;
    }
    const confirmResult = validateAuthConfirmPassword(formData.password, formData.confirmPassword);
    if (!confirmResult.valid) {
      setFormError(confirmResult.message);
      return false;
    }
    return true;
  };

  // Handle register
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsProcessing(true);
      setFormError(null);
      setSuccessMessage(null);

      const emailNormalized = formData.email.trim().toLowerCase();
      const usernameTrimmed = formData.username.trim();
      // Pass redirect path for email verification (DEX users should return to DEX)
      const redirectTo = '/dex-edu/profile';

      const response = await registerWithEmail(emailNormalized, usernameTrimmed, formData.password, redirectTo);

      if (response.success) {
        toast.success('Registration successful! Please check your email for verification.');
        setSuccessMessage('Registration successful! Please check your email for verification.');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/dex-edu/ota/login', { state: { email: emailNormalized } });
        }, 3000);
      }
    } catch (err) {
      const errorMessage = getUserFriendlyError(err);
      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="ota-register-page">
      <div className="ota-register-container">
        <div className="ota-register-header">
          <h1 className="ota-register-title ota-title-row">
            <OTABrand size="md" text="OTA Register" />
          </h1>
          <p className="ota-register-subtitle">Create your <OTALogo size="xs" className="ota-register-subtitle-logo" /> OTA Trading account</p>
        </div>

        <form className="ota-register-form" onSubmit={handleRegister} aria-label="Create account form">
          {formError && (
            <div className="ota-register-error" role="alert" aria-live="polite">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          {successMessage && (
            <div className="ota-register-success">
              <CheckCircle size={16} />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="ota-register-form-group">
            <label className="ota-register-label" htmlFor="email">
              Email Address
            </label>
            <div className="ota-register-input-wrapper">
              <Mail size={20} className="ota-register-input-icon" />
              <input
                id="email"
                name="email"
                type="email"
                className="ota-register-input"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                disabled={isProcessing}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="ota-register-form-group">
            <label className="ota-register-label" htmlFor="username">
              Username
            </label>
            <div className="ota-register-input-wrapper">
              <User size={20} className="ota-register-input-icon" />
              <input
                id="username"
                name="username"
                type="text"
                className="ota-register-input"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Choose a username"
                disabled={isProcessing}
                required
                autoComplete="username"
                pattern="[a-zA-Z0-9_-]+"
              />
            </div>
            <p className="ota-register-hint">3-20 characters, letters, numbers, underscores, hyphens</p>
          </div>

          <div className="ota-register-form-group">
            <label className="ota-register-label" htmlFor="password">
              Password
            </label>
            <div className="ota-register-input-wrapper">
              <Lock size={20} className="ota-register-input-icon" />
              <input
                id="password"
                name="password"
                type="password"
                className="ota-register-input"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a password"
                disabled={isProcessing}
                required
                autoComplete="new-password"
              />
            </div>
            <p className="ota-register-hint">Min 8 characters, must include uppercase, lowercase, and number</p>
          </div>

          <div className="ota-register-form-group">
            <label className="ota-register-label" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="ota-register-input-wrapper">
              <Lock size={20} className="ota-register-input-icon" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className="ota-register-input"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                disabled={isProcessing}
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="ota-register-submit-btn"
            disabled={isProcessing}
            aria-busy={isProcessing}
          >
            {isProcessing ? (
              <>
                <LoadingSpinner size="small" message="" />
                Creating account...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="ota-register-footer">
          <p className="ota-register-footer-text">
            Already have an account?{' '}
            <Link to="/dex-edu/ota/login" className="ota-register-login-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTARegisterPage;
