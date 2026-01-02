import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../utils/backend';
import { useAuth } from '../context/AuthContext';
import './Login.css';
import './Login.mobile.css'; // 📱 Mobile styles

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginSuccess } = useAuth();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token || token.trim() === '') {
      setStatus('error');
      setMessage('No verification token provided. Please use the link from your email.');
      return;
    }

    const verify = async () => {
      try {
        const response = await verifyEmail(token.trim());
        // Backend returns { success: true, message: '...', user: {...} } or { error: '...' }
        if (response.success && response.user) {
          setStatus('success');
          setMessage(response.message || 'Email verified successfully!');
          setUser(response.user);
          loginSuccess(response.user);
          
          // Redirect to presale after 2 seconds
          setTimeout(() => {
            navigate('/presale');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(response.error || 'Verification failed.');
        }
      } catch (err) {
        setStatus('error');
        const errorMsg = err.message || 'Verification failed. The link may have expired.';
        setMessage(errorMsg);
      }
    };

    verify();
  }, [searchParams, navigate, loginSuccess]);

  return (
    <div className="login-page">
      <div className="login-card">
        {status === 'verifying' && (
          <>
            <h1>Verifying your email...</h1>
            <p className="sub">Please wait while we verify your email address.</p>
            <div className="verify-icon-container" style={{ textAlign: 'center', marginTop: '24px' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '48px', color: '#00FFA3' }}></i>
            </div>
          </>
        )}
        
        {status === 'success' && (
          <>
            <h1 style={{ color: '#00FFA3' }}>Email Verified!</h1>
            <p className="sub">{message}</p>
            {user && (
              <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(0, 255, 163, 0.1)', borderRadius: '8px', border: '1px solid rgba(0, 255, 163, 0.3)' }}>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  <strong>Welcome, {user.username}!</strong>
                </p>
                <p style={{ margin: '8px 0 0', fontSize: '13px', opacity: 0.8 }}>
                  Redirecting to Presale...
                </p>
              </div>
            )}
            <div className="verify-icon-container" style={{ textAlign: 'center', marginTop: '24px' }}>
              <i className="fas fa-check-circle" style={{ fontSize: '64px', color: '#00FFA3' }}></i>
            </div>
          </>
        )}
        
        {status === 'error' && (
          <>
            <h1 style={{ color: '#ff5050' }}>Verification Failed</h1>
            <p className="sub">{message}</p>
            <div className="verify-icon-container" style={{ textAlign: 'center', marginTop: '24px' }}>
              <i className="fas fa-exclamation-circle" style={{ fontSize: '64px', color: '#ff5050' }}></i>
            </div>
            <div className="verify-actions" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                className="btn primary" 
                onClick={() => navigate('/login')}
                style={{ width: '100%' }}
              >
                Go to Login
              </button>
              <button 
                className="btn secondary" 
                onClick={() => navigate('/')}
                style={{ width: '100%' }}
              >
                Go to Home
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

