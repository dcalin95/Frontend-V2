/**
 * 🔑 OTA Reset Password Page - Reset Password cu Token
 *
 * Standalone reset password page pentru OTA:
 * - Input token din URL
 * - New password + confirm password
 * - Reset password
 * - Redirect după reset
 *
 * @module OTAResetPasswordPage
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { resetPassword as resetPasswordAPI } from '../services/authApiService';
import { getUserFriendlyError } from '../utils/helpers';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../styles/pages.css';
import '../styles/components/ota-reset-password-page.css';

const OTAResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [token, setToken] = useState(null);
  const [tokenValid, setTokenValid] = useState(true);

  // Get token from URL
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (!urlToken || urlToken.trim() === '') {
      setTokenValid(false);
      setFormError('No reset token provided. Please use the link from your email.');
    } else {
      setToken(urlToken.trim());
    }
  }, [searchParams]);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError(null);
  };

  // Validate form
  const validateForm = () => {
    setFormError(null);

    if (!formData.password) {
      setFormError('Password is required');
      return false;
    }
    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters long');
      return false;
    }
    if (formData.password.length > 128) {
      setFormError('Password must be no more than 128 characters long');
      return false;
    }
    if (!/(?=.*[a-z])/.test(formData.password)) {
      setFormError('Password must contain at least one lowercase letter');
      return false;
    }
    if (!/(?=.*[A-Z])/.test(formData.password)) {
      setFormError('Password must contain at least one uppercase letter');
      return false;
    }
    if (!/(?=.*[0-9])/.test(formData.password)) {
      setFormError('Password must contain at least one number');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return false;
    }

    return true;
  };

  // Handle reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!token) {
      setFormError('Reset token is missing');
      return;
    }
    if (!validateForm()) return;

    try {
      setIsProcessing(true);
      setFormError(null);
      setSuccessMessage(null);

      const response = await resetPasswordAPI(token, formData.password);

      if (response.success) {
        toast.success('Password reset successful! Redirecting to login...');
        setSuccessMessage('Password reset successful! Redirecting to login...');

        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/dex-edu/ota/login');
        }, 2000);
      }
    } catch (err) {
      const errorMessage = getUserFriendlyError(err);
      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="ota-reset-password-page">
        <div className="ota-reset-password-container">
          <div className="ota-reset-password-error-state">
            <AlertCircle size={48} className="ota-reset-password-error-icon" />
            <h2 className="ota-reset-password-error-title">Invalid Reset Link</h2>
            <p className="ota-reset-password-error-message">
              {formError || 'The reset link is invalid or has expired. Please request a new password reset.'}
            </p>
            <Link to="/dex-edu/ota/forgot-password" className="ota-reset-password-link-btn">
              Request New Reset Link
            </Link>
            <Link to="/dex-edu/ota/login" className="ota-reset-password-secondary-link">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ota-reset-password-page">
      <div className="ota-reset-password-container">
        <div className="ota-reset-password-header">
          <button
            className="ota-reset-password-back-btn"
            onClick={() => navigate('/dex-edu/ota/login')}
            title="Back to login"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="ota-reset-password-title">Reset Password</h1>
          <p className="ota-reset-password-subtitle">
            Enter your new password below.
          </p>
        </div>

        <form className="ota-reset-password-form" onSubmit={handleResetPassword}>
          {formError && (
            <div className="ota-reset-password-error">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          {successMessage && (
            <div className="ota-reset-password-success">
              <CheckCircle size={16} />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="ota-reset-password-form-group">
            <label className="ota-reset-password-label" htmlFor="password">
              New Password
            </label>
            <div className="ota-reset-password-input-wrapper">
              <Lock size={20} className="ota-reset-password-input-icon" />
              <input
                id="password"
                name="password"
                type="password"
                className="ota-reset-password-input"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter new password"
                disabled={isProcessing || !!successMessage}
                required
                autoComplete="new-password"
              />
            </div>
            <p className="ota-reset-password-hint">Min 8 characters, must include uppercase, lowercase, and number</p>
          </div>

          <div className="ota-reset-password-form-group">
            <label className="ota-reset-password-label" htmlFor="confirmPassword">
              Confirm New Password
            </label>
            <div className="ota-reset-password-input-wrapper">
              <Lock size={20} className="ota-reset-password-input-icon" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className="ota-reset-password-input"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm new password"
                disabled={isProcessing || !!successMessage}
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="ota-reset-password-submit-btn"
            disabled={isProcessing || !!successMessage}
          >
            {isProcessing ? (
              <>
                <LoadingSpinner size="small" message="" />
                Resetting password...
              </>
            ) : successMessage ? (
              'Password Reset'
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        <div className="ota-reset-password-footer">
          <p className="ota-reset-password-footer-text">
            Remember your password?{' '}
            <Link to="/dex-edu/ota/login" className="ota-reset-password-login-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTAResetPasswordPage;
