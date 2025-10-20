import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { ANALYTICS_CONFIG, EVENT_TYPES, USER_PROPERTIES, PERFORMANCE_METRICS } from '../config/analytics';

// Initialize analytics services
let ga4Initialized = false;
let mixpanelInitialized = false;
let sentryInitialized = false;
let hotjarInitialized = false;

// Initialize Google Analytics 4
const initGA4 = () => {
  if (typeof window !== 'undefined' && ANALYTICS_CONFIG.GA4.enabled && !ga4Initialized) {
    try {
      const { default: ReactGA } = require('react-ga4');
      ReactGA.initialize(ANALYTICS_CONFIG.GA4.measurementId);
      ga4Initialized = true;
      console.log('GA4 initialized successfully');
    } catch (error) {
      console.error('Failed to initialize GA4:', error);
    }
  }
};

// Initialize Mixpanel
const initMixpanel = () => {
  if (typeof window !== 'undefined' && ANALYTICS_CONFIG.MIXPANEL.enabled && !mixpanelInitialized) {
    try {
      const mixpanel = require('mixpanel-browser');
      mixpanel.init(ANALYTICS_CONFIG.MIXPANEL.token);
      mixpanelInitialized = true;
      console.log('Mixpanel initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Mixpanel:', error);
    }
  }
};

// Initialize Sentry
const initSentry = () => {
  if (typeof window !== 'undefined' && ANALYTICS_CONFIG.SENTRY.enabled && !sentryInitialized) {
    try {
      const Sentry = require('@sentry/react');
      Sentry.init({
        dsn: ANALYTICS_CONFIG.SENTRY.dsn,
        environment: ANALYTICS_CONFIG.SENTRY.environment,
        tracesSampleRate: ANALYTICS_CONFIG.SENTRY.tracesSampleRate,
        replaysSessionSampleRate: ANALYTICS_CONFIG.SENTRY.replaysSessionSampleRate,
        replaysOnErrorSampleRate: ANALYTICS_CONFIG.SENTRY.replaysOnErrorSampleRate,
      });
      sentryInitialized = true;
      console.log('Sentry initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  }
};

// Initialize Hotjar
const initHotjar = () => {
  if (typeof window !== 'undefined' && ANALYTICS_CONFIG.HOTJAR.enabled && !hotjarInitialized) {
    try {
      const { hjid, hjsv } = ANALYTICS_CONFIG.HOTJAR;
      if (hjid && hjsv) {
        (function(h, o, t, j, a, r) {
          h.hj = h.hj || function() {
            (h.hj.q = h.hj.q || []).push(arguments);
          };
          h._hjSettings = { hjid, hjsv };
          a = o.getElementsByTagName('head')[0];
          r = o.createElement('script');
          r.async = 1;
          r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
          a.appendChild(r);
        })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');
        hotjarInitialized = true;
        console.log('Hotjar initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize Hotjar:', error);
    }
  }
};

// Get user properties
const getUserProperties = () => {
  if (typeof window === 'undefined') return {};

  const userAgent = navigator.userAgent;
  const screen = window.screen;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  return {
    [USER_PROPERTIES.DEVICE_TYPE]: /Mobile|Tablet|iPad|iPhone|Android/.test(userAgent) ? 'mobile' : 'desktop',
    [USER_PROPERTIES.BROWSER]: getBrowserInfo(userAgent),
    [USER_PROPERTIES.OS]: getOSInfo(userAgent),
    [USER_PROPERTIES.SCREEN_RESOLUTION]: `${screen.width}x${screen.height}`,
    [USER_PROPERTIES.CONNECTION_TYPE]: connection ? connection.effectiveType : 'unknown',
    [USER_PROPERTIES.LANGUAGE]: navigator.language,
    [USER_PROPERTIES.TIMEZONE]: Intl.DateTimeFormat().resolvedOptions().timeZone,
    [USER_PROPERTIES.USER_AGENT]: userAgent,
    [USER_PROPERTIES.REFERRER]: document.referrer,
    ...getUTMParameters(),
  };
};

// Get browser information
const getBrowserInfo = (userAgent) => {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Unknown';
};

// Get OS information
const getOSInfo = (userAgent) => {
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Unknown';
};

// Get UTM parameters
const getUTMParameters = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    [USER_PROPERTIES.UTM_SOURCE]: urlParams.get('utm_source') || '',
    [USER_PROPERTIES.UTM_MEDIUM]: urlParams.get('utm_medium') || '',
    [USER_PROPERTIES.UTM_CAMPAIGN]: urlParams.get('utm_campaign') || '',
  };
};

// Send custom analytics
const sendCustomAnalytics = async (eventName, properties = {}) => {
  if (!ANALYTICS_CONFIG.CUSTOM.enabled) return;

  try {
    const response = await fetch(ANALYTICS_CONFIG.CUSTOM.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: eventName,
        properties,
        timestamp: Date.now(),
        userProperties: getUserProperties(),
      }),
    });

    if (!response.ok) {
      console.error('Failed to send custom analytics:', response.status);
    }
  } catch (error) {
    console.error('Error sending custom analytics:', error);
  }
};

// Track performance metrics
const trackPerformanceMetrics = () => {
  if (typeof window === 'undefined') return;

  // Track Core Web Vitals
  if ('PerformanceObserver' in window) {
    // First Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        trackEvent(EVENT_TYPES.PERFORMANCE_METRIC, {
          metric: PERFORMANCE_METRICS.FIRST_CONTENTFUL_PAINT,
          value: entry.startTime,
          unit: 'ms',
        });
      });
    }).observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        trackEvent(EVENT_TYPES.PERFORMANCE_METRIC, {
          metric: PERFORMANCE_METRICS.LARGEST_CONTENTFUL_PAINT,
          value: entry.startTime,
          unit: 'ms',
        });
      });
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        trackEvent(EVENT_TYPES.PERFORMANCE_METRIC, {
          metric: PERFORMANCE_METRICS.FIRST_INPUT_DELAY,
          value: entry.processingStart - entry.startTime,
          unit: 'ms',
        });
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        trackEvent(EVENT_TYPES.PERFORMANCE_METRIC, {
          metric: PERFORMANCE_METRICS.CUMULATIVE_LAYOUT_SHIFT,
          value: entry.value,
          unit: 'score',
        });
      });
    }).observe({ entryTypes: ['layout-shift'] });
  }

  // Track page load time
  window.addEventListener('load', () => {
    const loadTime = performance.now();
    trackEvent(EVENT_TYPES.PERFORMANCE_METRIC, {
      metric: PERFORMANCE_METRICS.WINDOW_LOAD,
      value: loadTime,
      unit: 'ms',
    });
  });
};

// Track event across all analytics services
const trackEvent = (eventName, properties = {}) => {
  const userProps = getUserProperties();
  const eventData = { ...userProps, ...properties };

  // Google Analytics 4
  if (ga4Initialized) {
    try {
      const { default: ReactGA } = require('react-ga4');
      ReactGA.event({
        category: 'User Action',
        action: eventName,
        label: properties.label || '',
        value: properties.value || 1,
        custom_parameters: eventData,
      });
    } catch (error) {
      console.error('Failed to track GA4 event:', error);
    }
  }

  // Mixpanel
  if (mixpanelInitialized) {
    try {
      const mixpanel = require('mixpanel-browser');
      mixpanel.track(eventName, eventData);
    } catch (error) {
      console.error('Failed to track Mixpanel event:', error);
    }
  }

  // Custom Analytics
  sendCustomAnalytics(eventName, eventData);
};

// Main analytics hook
export const useAnalytics = () => {
  const location = useLocation();
  const sessionStartTime = useRef(Date.now());
  const isInitialized = useRef(false);

  // Initialize analytics on mount
  useEffect(() => {
    if (!isInitialized.current) {
      initGA4();
      initMixpanel();
      initSentry();
      initHotjar();
      trackPerformanceMetrics();
      isInitialized.current = true;

      // Track session start
      trackEvent(EVENT_TYPES.SESSION_START, {
        sessionId: Date.now().toString(),
        timestamp: sessionStartTime.current,
      });
    }
  }, []);

  // Track page views
  useEffect(() => {
    if (isInitialized.current) {
      trackEvent(EVENT_TYPES.PAGE_VIEW, {
        page: location.pathname,
        title: document.title,
        url: window.location.href,
      });
    }
  }, [location]);

  // Track session end on unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      const sessionDuration = Date.now() - sessionStartTime.current;
      trackEvent(EVENT_TYPES.SESSION_END, {
        sessionId: sessionStartTime.current.toString(),
        duration: sessionDuration,
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Track idle timeout
  useEffect(() => {
    let idleTimer;
    const idleTimeout = 30 * 60 * 1000; // 30 minutes

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        trackEvent(EVENT_TYPES.IDLE_TIMEOUT, {
          sessionId: sessionStartTime.current.toString(),
          idleDuration: idleTimeout,
        });
      }, idleTimeout);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer, true);
    });

    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer, true);
      });
    };
  }, []);

  // Return tracking functions
  const track = useCallback((eventName, properties = {}) => {
    trackEvent(eventName, properties);
  }, []);

  const trackError = useCallback((error, context = {}) => {
    trackEvent(EVENT_TYPES.ERROR_OCCURRED, {
      error: error.message,
      stack: error.stack,
      context,
      severity: context.severity || 'medium',
    });
  }, []);

  const trackPerformance = useCallback((metric, value, unit = 'ms') => {
    trackEvent(EVENT_TYPES.PERFORMANCE_METRIC, {
      metric,
      value,
      unit,
    });
  }, []);

  return {
    track,
    trackError,
    trackPerformance,
    getUserProperties,
  };
}; 