/**
 * 🔑 OTA Forgot Password Page - Password Recovery
 *
 * Standalone forgot password page pentru OTA:
 * - Email input for password reset
 * - Send reset email
 * - Link către login
 *
 * @module OTAForgotPasswordPage
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { useDexAuth } from '../context/DexAuthContext';
import { getUserFriendlyError } from '../utils/helpers';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../styles/pages.css';
import '../styles/components/ota-forgot-password-page.css';

const OTAForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { forgotPassword, isAuthenticated } = useDexAuth();

  const [email, setEmail] = useState('');
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
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setFormError(null);
  };

  // Validate email
  const validateEmail = () => {
    setFormError(null);

    if (!email) {
      setFormError('Email is required');
      return false;
    }

    const emailTrimmed = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(emailTrimmed)) {
      setFormError('Please enter a valid email address');
      return false;
    }

    if (emailTrimmed.length > 254) {
      setFormError('Email address is too long');
      return false;
    }

    return true;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail()) return;

    try {
      setIsProcessing(true);
      setFormError(null);
      setSuccessMessage(null);

      const emailTrimmed = email.trim().toLowerCase();
      await forgotPassword(emailTrimmed);

      toast.success('Password reset email sent! Please check your email.');
      setSuccessMessage('Password reset email sent! Please check your email for instructions.');

      // Clear email after success
      setTimeout(() => {
        setEmail('');
      }, 2000);
    } catch (err) {
      const errorMessage = getUserFriendlyError(err);
      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="ota-forgot-password-page">
      <div className="ota-forgot-password-container">
        <div className="ota-forgot-password-header">
          <button
            className="ota-forgot-password-back-btn"
            onClick={() => navigate('/dex-edu/ota/login')}
            title="Back to login"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="ota-forgot-password-title">Forgot Password</h1>
          <p className="ota-forgot-password-subtitle">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form className="ota-forgot-password-form" onSubmit={handleSubmit}>
          {formError && (
            <div className="ota-forgot-password-error">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          {successMessage && (
            <div className="ota-forgot-password-success">
              <CheckCircle size={16} />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="ota-forgot-password-form-group">
            <label className="ota-forgot-password-label" htmlFor="email">
              Email Address
            </label>
            <div className="ota-forgot-password-input-wrapper">
              <Mail size={20} className="ota-forgot-password-input-icon" />
              <input
                id="email"
                type="email"
                className="ota-forgot-password-input"
                value={email}
                onChange={handleEmailChange}
                placeholder="Enter your email"
                disabled={isProcessing || !!successMessage}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <button
            type="submit"
            className="ota-forgot-password-submit-btn"
            disabled={isProcessing || !!successMessage}
          >
            {isProcessing ? (
              <>
                <LoadingSpinner size="small" message="" />
                Sending...
              </>
            ) : successMessage ? (
              'Email Sent'
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        <div className="ota-forgot-password-footer">
          <p className="ota-forgot-password-footer-text">
            Remember your password?{' '}
            <Link to="/dex-edu/ota/login" className="ota-forgot-password-login-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTAForgotPasswordPage;
