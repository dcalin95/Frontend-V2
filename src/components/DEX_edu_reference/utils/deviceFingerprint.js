// Device Fingerprint Utility - Generates unique device identifier
// Similar to Binance's trusted device system

/* eslint-disable no-restricted-globals */
/**
 * Generates a device fingerprint based on:
 * - User Agent
 * - Screen Resolution
 * - Timezone
 * - Language
 * - Platform
 * - Hardware Concurrency (CPU cores)
 * - Max Touch Points (for mobile)
 */
export function generateDeviceFingerprint() {
  try {
    const components = [];
    
    // User Agent
    if (navigator.userAgent) {
      components.push(navigator.userAgent);
    }
    
    // Screen Resolution
    if (screen.width && screen.height) {
      components.push(`${screen.width}x${screen.height}`);
    }
    
    // Color Depth
    if (screen.colorDepth) {
      components.push(`color:${screen.colorDepth}`);
    }
    
    // Timezone
    try {
      components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch (e) {
      // Fallback
      components.push(new Date().getTimezoneOffset().toString());
    }
    
    // Language
    if (navigator.language) {
      components.push(navigator.language);
    }
    
    // Platform
    if (navigator.platform) {
      components.push(navigator.platform);
    }
    
    // Hardware Concurrency (CPU cores)
    if (navigator.hardwareConcurrency) {
      components.push(`cores:${navigator.hardwareConcurrency}`);
    }
    
    // Max Touch Points (mobile devices)
    if (navigator.maxTouchPoints !== undefined) {
      components.push(`touch:${navigator.maxTouchPoints}`);
    }
    
    // Canvas fingerprint (if available)
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint', 2, 2);
        components.push(canvas.toDataURL().slice(0, 50)); // First 50 chars
      }
    } catch (e) {
      // Canvas not available
    }
    
    // Combine all components and hash
    const fingerprintString = components.join('|');
    
    // Simple hash function (for client-side)
    let hash = 0;
    for (let i = 0; i < fingerprintString.length; i++) {
      const char = fingerprintString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36) + fingerprintString.length.toString(36);
  } catch (error) {
    console.error('[DeviceFingerprint] Error generating fingerprint:', error);
    // Fallback: use a combination of available data
    return `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

/**
 * Gets IP address and location information
 * @returns {Promise<{ip: string, country: string, countryCode: string, city: string}>}
 */
export async function getIPAndLocation() {
  try {
    // Try to get from cache first
    const cachedGeo = sessionStorage.getItem('bits_user_geo');
    if (cachedGeo) {
      try {
        const geo = JSON.parse(cachedGeo);
        if (geo.ip && geo.country) {
          return {
            ip: geo.ip,
            country: geo.country,
            countryCode: geo.countryCode || 'GL',
            city: geo.city || ''
          };
        }
      } catch (e) {
        // Cache invalid, continue to fetch
      }
    }

    // Fetch IP with timeout and retry logic
    let ip = 'Unknown';
    const ipController = new AbortController();
    const ipTimeoutId = setTimeout(() => ipController.abort(), 5000); // 5 second timeout for IP
    
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json', {
        signal: ipController.signal,
        cache: 'no-cache' // Prevent caching
      });
      clearTimeout(ipTimeoutId);
      
      if (ipResponse.ok) {
        const ipData = await ipResponse.json();
        // Validate IP format (basic check)
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        if (ipData.ip && ipRegex.test(ipData.ip)) {
          ip = ipData.ip.trim();
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[DeviceFingerprint] Invalid IP format received:', ipData.ip);
          }
        }
      }
    } catch (ipError) {
      clearTimeout(ipTimeoutId);
      if (ipError.name !== 'AbortError' && process.env.NODE_ENV === 'development') {
        console.warn('[DeviceFingerprint] IP fetch failed:', ipError.message);
      }
      // Continue with 'Unknown' IP
    }

    // Try to get location from IP
    let country = 'Global';
    let countryCode = 'GL';
    let city = '';

    // Only try to get location if we have a valid IP
    if (ip && ip !== 'Unknown') {
      const locController = new AbortController();
      const locTimeoutId = setTimeout(() => locController.abort(), 5000); // 5 second timeout
      
      try {
        const locResponse = await fetch(`https://ipapi.co/${ip}/json/`, {
          signal: locController.signal,
          cache: 'no-cache' // Prevent caching
        });
        clearTimeout(locTimeoutId);
        
        if (locResponse.ok) {
          const locData = await locResponse.json();
          // Sanitize and validate location data
          country = (locData.country_name && typeof locData.country_name === 'string') 
            ? locData.country_name.trim().substring(0, 100) 
            : 'Global';
          countryCode = (locData.country_code && typeof locData.country_code === 'string') 
            ? locData.country_code.trim().substring(0, 10).toUpperCase() 
            : 'GL';
          city = (locData.city && typeof locData.city === 'string') 
            ? locData.city.trim().substring(0, 100) 
            : '';
        }
      } catch (e) {
        clearTimeout(locTimeoutId);
        // Location fetch failed, use defaults
        if (e.name !== 'AbortError' && process.env.NODE_ENV === 'development') {
          console.warn('[DeviceFingerprint] Location fetch failed, using defaults');
        }
      }
    }

    // Cache the result
    const geoInfo = { ip, country, countryCode, city };
    sessionStorage.setItem('bits_user_geo', JSON.stringify(geoInfo));

    return geoInfo;
  } catch (error) {
    console.error('[DeviceFingerprint] Error getting IP and location:', error);
    return {
      ip: 'Unknown',
      country: 'Global',
      countryCode: 'GL',
      city: ''
    };
  }
}

/**
 * Gets device information for sending to backend
 * Now includes IP and location for security checks
 */
export async function getDeviceInfo() {
  try {
    // Get IP and location
    const geoInfo = await getIPAndLocation();

    return {
      deviceFingerprint: generateDeviceFingerprint(),
      screenResolution: screen.width && screen.height ? `${screen.width}x${screen.height}` : null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
      language: navigator.language || null,
      userAgent: navigator.userAgent || null,
      // Security: IP and location for trusted device verification
      ip: geoInfo.ip,
      country: geoInfo.country,
      countryCode: geoInfo.countryCode,
      city: geoInfo.city
    };
  } catch (error) {
    console.error('[DeviceFingerprint] Error getting device info:', error);
    return {
      deviceFingerprint: generateDeviceFingerprint(),
      screenResolution: null,
      timezone: null,
      language: null,
      userAgent: null,
      ip: 'Unknown',
      country: 'Global',
      countryCode: 'GL',
      city: ''
    };
  }
}

/**
 * Parses userAgent to get OS and browser for display (Binance-style device info)
 * @param {string} [userAgent] - navigator.userAgent if not provided
 * @returns {{ os: string, browser: string }}
 */
export function parseDeviceDisplayInfo(userAgent) {
  const ua = userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '';
  if (!ua) return { os: 'Unknown', browser: 'Unknown' };
  let os = 'Unknown';
  if (ua.includes('Windows NT 10') || ua.includes('Windows NT 11')) os = 'Windows 10/11';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X') || ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux') && !ua.includes('Android')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone')) os = 'iOS (iPhone)';
  else if (ua.includes('iPad')) os = 'iOS (iPad)';

  let browser = 'Unknown';
  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera';
  else if (ua.includes('Chrome/') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';

  return { os, browser };
}

/**
 * Gets device information synchronously (without IP/location)
 * Use this when you don't need IP/location or when async is not possible
 */
export function getDeviceInfoSync() {
  try {
    return {
      deviceFingerprint: generateDeviceFingerprint(),
      screenResolution: screen.width && screen.height ? `${screen.width}x${screen.height}` : null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
      language: navigator.language || null,
      userAgent: navigator.userAgent || null
    };
  } catch (error) {
    console.error('[DeviceFingerprint] Error getting device info:', error);
    return {
      deviceFingerprint: generateDeviceFingerprint(),
      screenResolution: null,
      timezone: null,
      language: null,
      userAgent: null
    };
  }
}
/* eslint-enable no-restricted-globals */

/**
 * Gets stored refresh token from localStorage
 */
export function getStoredRefreshToken() {
  try {
    return localStorage.getItem('bits_refresh_token');
  } catch (error) {
    console.error('[DeviceFingerprint] Error getting refresh token:', error);
    return null;
  }
}

/**
 * Stores refresh token in localStorage
 */
export function storeRefreshToken(token) {
  try {
    if (token) {
      localStorage.setItem('bits_refresh_token', token);
    } else {
      localStorage.removeItem('bits_refresh_token');
    }
  } catch (error) {
    console.error('[DeviceFingerprint] Error storing refresh token:', error);
  }
}

/**
 * Stores last known IP and location for comparison
 * @param {string} ip - IP address
 * @param {string} country - Country name
 * @param {string} countryCode - Country code
 * @param {string} city - City name
 */
export function storeLastLocation(ip, country, countryCode, city) {
  try {
    // Validate inputs
    if (!ip || ip === 'Unknown') {
      console.warn('[DeviceFingerprint] Attempted to store invalid IP');
      return;
    }
    
    const locationData = {
      ip: ip.trim(),
      country: (country || 'Global').trim(),
      countryCode: (countryCode || 'GL').trim(),
      city: (city || '').trim(),
      timestamp: Date.now()
    };
    
    localStorage.setItem('bits_last_location', JSON.stringify(locationData));
  } catch (error) {
    // Handle quota exceeded or other storage errors gracefully
    if (error.name === 'QuotaExceededError') {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[DeviceFingerprint] Storage quota exceeded, clearing old location data');
      }
      try {
        localStorage.removeItem('bits_last_location');
        // Retry once
        localStorage.setItem('bits_last_location', JSON.stringify({
          ip: ip?.trim() || 'Unknown',
          country: (country || 'Global').trim(),
          countryCode: (countryCode || 'GL').trim(),
          city: (city || '').trim(),
          timestamp: Date.now()
        }));
      } catch (retryError) {
        console.error('[DeviceFingerprint] Failed to store location after retry:', retryError);
      }
    } else {
      console.error('[DeviceFingerprint] Error storing last location:', error);
    }
  }
}

/**
 * Gets last known IP and location
 */
export function getLastLocation() {
  try {
    const stored = localStorage.getItem('bits_last_location');
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  } catch (error) {
    console.error('[DeviceFingerprint] Error getting last location:', error);
    return null;
  }
}

/**
 * Compares current location with last known location
 * Returns true if location changed significantly (different country or major IP change)
 */
export function hasLocationChanged(currentLocation, lastLocation) {
  if (!lastLocation) {
    return false; // No previous location to compare
  }

  // Check if country changed
  if (currentLocation.countryCode !== lastLocation.countryCode) {
    return true;
  }

  // Check if IP changed (but allow for minor changes like dynamic IP)
  if (currentLocation.ip !== lastLocation.ip) {
    // IP changed - this is significant
    return true;
  }

  return false;
}
