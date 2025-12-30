import React, { useState, useEffect } from 'react';
import { useGeoLocation } from '../context/GeoLocationContext';
import { trackGeoBannerDismiss } from '../utils/blockedUsersAnalytics';
import './GeoNoticeBanner.css';

/**
 * 🌍 GEO-NOTICE BANNER - AI Futuristic Footer Box
 * 
 * Displays a notice about geographic availability and SEC compliance.
 * - Small box in footer (left side)
 * - AI futuristic design with neon effects
 * - Stays visible until user dismisses
 */
const GeoNoticeBanner = () => {
  const { country, countryCode, isLoading } = useGeoLocation();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if banner was previously dismissed (session storage)
    const dismissed = sessionStorage.getItem('bits_geo_banner_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('bits_geo_banner_dismissed', 'true');
    
    // Track dismissal in analytics
    if (countryCode && country) {
      trackGeoBannerDismiss(countryCode, country);
    }
  };

  // Don't show if loading, dismissed, or user is from a blocked country
  if (isLoading || isDismissed || countryCode === 'US') {
    return null;
  }

  return (
    <div className="geo-notice-banner">
      <div className="geo-notice-content">
        <div className="geo-notice-icon">🌐</div>
        <div className="geo-notice-text">
          <strong>150+ Countries</strong>
          {country && <span className="geo-notice-location">📍 {country}</span>}
          <span className="geo-notice-compliance">(US excluded - SEC)</span>
        </div>
        <button 
          className="geo-notice-dismiss" 
          onClick={handleDismiss}
          aria-label="Dismiss notification"
          title="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default GeoNoticeBanner;

