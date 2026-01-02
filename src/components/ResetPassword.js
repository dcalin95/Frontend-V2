import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../utils/backend';
import './Login.css';
import './Login.mobile.css'; // 📱 Mobile styles

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const token = searchParams.get('token');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Token is already validated at component level, but double-check
    if (!token || token.trim() === '') {
      setError('No reset token provided. Please use the link from your email.');
      return;
    }

    if (!password || password.trim() === '') {
      setError('Please enter a new password.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsResetting(true);
    try {
      const response = await resetPassword(token.trim(), password);
      if (response.success) {
        setSuccess('Password reset successfully! Redirecting to login...');
        // Clear form
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      let errorMsg = err.message || 'Failed to reset password.';
      
      // Provide more specific error messages
      if (errorMsg.toLowerCase().includes('expired') || errorMsg.toLowerCase().includes('invalid')) {
        errorMsg = 'This password reset link has expired or is invalid. Please request a new one.';
      } else if (errorMsg.toLowerCase().includes('token')) {
        errorMsg = 'Invalid reset token. Please use the link from your email or request a new password reset.';
      }
      
      setError(errorMsg);
    } finally {
      setIsResetting(false);
    }
  };

  if (!token || token.trim() === '') {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1 style={{ color: '#ff5050' }}>Invalid Reset Link</h1>
          <p className="sub">No reset token provided. Please use the link from your email.</p>
          <div style={{ marginTop: '24px' }}>
            <button className="btn primary" onClick={() => navigate('/login')} style={{ width: '100%' }}>
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Reset Your Password</h1>
        <p className="sub">Enter your new password below.</p>
        
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>New Password</span>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Min. 8 characters, 1 uppercase, 1 number" 
              required 
              disabled={isResetting}
            />
          </label>
          
          <label className="field">
            <span>Confirm Password</span>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              placeholder="Re-enter your password" 
              required 
              disabled={isResetting}
            />
          </label>
          
          {error && (
            <div className="error">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}
          
          {success && (
            <div style={{ background: 'rgba(0, 255, 163, 0.1)', border: '1px solid rgba(0, 255, 163, 0.3)', color: '#00FFA3', padding: '12px 16px', borderRadius: '8px', fontSize: '13px' }}>
              <i className="fas fa-check-circle"></i> {success}
            </div>
          )}
          
          <button type="submit" className="btn primary" disabled={isResetting} style={{ width: '100%' }}>
            {isResetting ? (
              <span><i className="fas fa-spinner fa-spin"></i> Resetting...</span>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>
        
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button 
            type="button" 
            onClick={() => navigate('/login')}
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
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

