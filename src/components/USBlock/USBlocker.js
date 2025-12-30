import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGeoLocation } from '../../context/GeoLocationContext';
import { trackBlockedUserAttempt, storeBlockedAttempt } from '../../utils/blockedUsersAnalytics';

/**
 * 🚫 US GEO-BLOCKING COMPONENT
 * 
 * Detects US users and redirects them automatically to the blocked page.
 * Uses GeoLocationContext to get the user's country code.
 * Tracks blocked attempts for analytics.
 * 
 * IMPORTANT: This component must be placed in App.js or any
 * parent component that needs to block US access.
 */
const USBlocker = ({ children }) => {
  const navigate = useNavigate();
  const { countryCode, country, ip, isLoading } = useGeoLocation();

  useEffect(() => {
    // Wait for geolocation to load completely
    if (isLoading) return;

    // Check if user is from USA (US country code)
    if (countryCode === 'US') {
      console.warn('🚫 [USBlocker] US user detected! Redirecting to blocked page...');
      
      // Track analytics
      trackBlockedUserAttempt(countryCode, country, ip, window.location.pathname);
      storeBlockedAttempt({
        countryCode,
        country,
        ip,
        page: window.location.pathname
      });
      
      // Save to sessionStorage to prevent repeated access
      sessionStorage.setItem('bits_us_blocked', 'true');
      
      // Redirect to blocked page
      navigate('/us-blocked', { replace: true });
    }
  }, [countryCode, country, ip, isLoading, navigate]);

  // Dacă se încarcă geolocația, arătăm un loader minimal
  if (isLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '1.2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        zIndex: 9999
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <div>Verifying your location...</div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Dacă userul NU e din SUA, afișăm conținutul normal
  return children;
};

export default USBlocker;

