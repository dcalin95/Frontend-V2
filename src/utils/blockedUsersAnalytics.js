/**
 * 🚫 US BLOCKED USERS ANALYTICS
 * 
 * Tracks and reports blocked user attempts for compliance and marketing analytics.
 * Integrates with Google Analytics and TikTok Pixel.
 */

/**
 * Track when a user from a blocked country attempts to access the site
 * @param {string} countryCode - ISO country code (e.g., 'US', 'KP')
 * @param {string} country - Full country name (e.g., 'United States')
 * @param {string} ip - User's IP address
 * @param {string} page - Page user attempted to access
 */
export function trackBlockedUserAttempt(countryCode, country, ip, page = '/') {
  try {
    // Google Analytics Event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'blocked_user_attempt', {
        event_category: 'Geo_Blocking',
        event_label: `${country} (${countryCode})`,
        country_code: countryCode,
        country_name: country,
        attempted_page: page,
        ip_address: ip,
        timestamp: new Date().toISOString(),
        value: countryCode === 'US' ? 1 : 0 // Higher value for US blocks
      });

      console.log(`📊 [Analytics] Blocked user from ${country} tracked`);
    }

    // TikTok Pixel Event (for marketing insights)
    if (typeof window !== 'undefined' && window.ttq) {
      window.ttq.track('BlockedAccess', {
        content_type: 'geo_restriction',
        country: country,
        country_code: countryCode,
        page: page
      });
    }

    // Custom event for potential future integrations
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bitsai:blocked_user', {
        detail: {
          countryCode,
          country,
          ip,
          page,
          timestamp: Date.now()
        }
      }));
    }

  } catch (error) {
    console.error('[Analytics] Error tracking blocked user:', error);
  }
}

/**
 * Track when blocked page is viewed
 * @param {string} countryCode - ISO country code
 * @param {string} country - Full country name
 * @param {number} timeSpent - Time spent on blocked page (seconds)
 */
export function trackBlockedPageView(countryCode, country, timeSpent = 0) {
  try {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'blocked_page_view', {
        event_category: 'Geo_Blocking',
        event_label: `${country} (${countryCode})`,
        country_code: countryCode,
        country_name: country,
        time_spent: timeSpent,
        engagement_level: timeSpent > 30 ? 'high' : timeSpent > 10 ? 'medium' : 'low'
      });
    }
  } catch (error) {
    console.error('[Analytics] Error tracking blocked page view:', error);
  }
}

/**
 * Track VPN/Proxy detection (if implemented)
 * @param {string} countryCode - Detected country code
 * @param {boolean} isVPN - Whether VPN was detected
 * @param {string} service - Detection service used
 */
export function trackVPNDetection(countryCode, isVPN, service = 'ipapi') {
  try {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'vpn_detection', {
        event_category: 'Security',
        event_label: isVPN ? 'VPN_Detected' : 'Direct_Connection',
        country_code: countryCode,
        is_vpn: isVPN,
        detection_service: service
      });
    }
  } catch (error) {
    console.error('[Analytics] Error tracking VPN detection:', error);
  }
}

/**
 * Track geo-banner dismissal
 * @param {string} countryCode - User's country code
 * @param {string} country - User's country name
 */
export function trackGeoBannerDismiss(countryCode, country) {
  try {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'geo_banner_dismiss', {
        event_category: 'User_Interaction',
        event_label: `${country} (${countryCode})`,
        country_code: countryCode,
        country_name: country
      });
    }
  } catch (error) {
    console.error('[Analytics] Error tracking banner dismiss:', error);
  }
}

/**
 * Get analytics summary for blocked users (admin use)
 * Retrieves data from localStorage for dashboard display
 */
export function getBlockedUsersAnalytics() {
  try {
    const stored = localStorage.getItem('bits_blocked_analytics');
    if (!stored) return { total: 0, byCountry: {}, lastAttempts: [] };
    
    return JSON.parse(stored);
  } catch (error) {
    console.error('[Analytics] Error retrieving analytics:', error);
    return { total: 0, byCountry: {}, lastAttempts: [] };
  }
}

/**
 * Store blocked user attempt locally (for analytics dashboard)
 * @param {Object} data - Blocked user data
 */
export function storeBlockedAttempt(data) {
  try {
    const analytics = getBlockedUsersAnalytics();
    
    analytics.total = (analytics.total || 0) + 1;
    analytics.byCountry = analytics.byCountry || {};
    analytics.byCountry[data.countryCode] = (analytics.byCountry[data.countryCode] || 0) + 1;
    analytics.lastAttempts = analytics.lastAttempts || [];
    analytics.lastAttempts.unshift({
      ...data,
      timestamp: Date.now()
    });
    
    // Keep only last 100 attempts
    if (analytics.lastAttempts.length > 100) {
      analytics.lastAttempts = analytics.lastAttempts.slice(0, 100);
    }
    
    localStorage.setItem('bits_blocked_analytics', JSON.stringify(analytics));
  } catch (error) {
    console.error('[Analytics] Error storing blocked attempt:', error);
  }
}

export default {
  trackBlockedUserAttempt,
  trackBlockedPageView,
  trackVPNDetection,
  trackGeoBannerDismiss,
  getBlockedUsersAnalytics,
  storeBlockedAttempt
};

