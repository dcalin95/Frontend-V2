// 🚀 GOOGLE ANALYTICS 4 & GOOGLE ADS INTEGRATION HOOK
// Optimized for Crypto Investment Platform

import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  GOOGLE_CONFIG, 
  CRYPTO_EVENTS, 
  CRYPTO_PARAMETERS, 
  GA4_HELPERS, 
  ADS_HELPERS,
  calculateConversionValue 
} from '../config/googleAnalytics';

export const useGoogleAnalytics = () => {
  const location = useLocation();
  const isInitialized = useRef(false);
  const sessionStartTime = useRef(Date.now());

  // 🎯 INITIALIZE GOOGLE ANALYTICS
  const initializeGA = useCallback(() => {
    if (typeof window !== 'undefined' && !isInitialized.current && GOOGLE_CONFIG.GA4.enabled) {
      try {
        // Initialize GA4
        window.dataLayer = window.dataLayer || [];
        function gtag() {
          window.dataLayer.push(arguments);
        }
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', GOOGLE_CONFIG.GA4.measurementId, {
          page_title: 'BitSwapDEX AI - Crypto Investment Platform',
          page_location: window.location.href,
          custom_map: GOOGLE_CONFIG.GA4.customDimensions
        });

        // Initialize Google Ads
        if (GOOGLE_CONFIG.ADS.enabled) {
          gtag('config', GOOGLE_CONFIG.ADS.conversionId);
        }

        isInitialized.current = true;
        console.log('✅ Google Analytics & Ads initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Google Analytics:', error);
      }
    }
  }, []);

  // 📊 TRACK PAGE VIEWS
  const trackPageView = useCallback((customTitle = null, customParameters = {}) => {
    if (isInitialized.current) {
      const pageTitle = customTitle || document.title;
      const pageLocation = window.location.href;
      
      GA4_HELPERS.trackPageView(pageTitle, pageLocation, {
        page_path: location.pathname,
        page_search: location.search,
        page_hash: location.hash,
        ...customParameters
      });
    }
  }, [location]);

  // 🎯 TRACK CRYPTO EVENTS
  const trackCryptoEvent = useCallback((eventName, parameters = {}) => {
    if (isInitialized.current) {
      const eventData = {
        event_category: 'Crypto Investment',
        event_label: eventName,
        value: calculateConversionValue(eventName, parameters),
        currency: 'USD',
        timestamp: Date.now(),
        session_id: sessionStartTime.current.toString(),
        ...parameters
      };

      GA4_HELPERS.trackEvent(eventName, eventData);
    }
  }, []);

  // 💰 TRACK CONVERSIONS
  const trackConversion = useCallback((conversionType, parameters = {}) => {
    if (isInitialized.current) {
      // Track in GA4
      trackCryptoEvent(conversionType, parameters);
      
      // Track in Google Ads
      if (GOOGLE_CONFIG.ADS.enabled) {
        ADS_HELPERS.trackDynamicConversion(conversionType, parameters);
      }
    }
  }, [trackCryptoEvent]);

  // 🚀 PRESALE TRACKING
  const trackPresaleEvent = useCallback((eventType, parameters = {}) => {
    const presaleEvents = {
      view: CRYPTO_EVENTS.PRESALE_VIEW,
      register: CRYPTO_EVENTS.PRESALE_REGISTER,
      invest: CRYPTO_EVENTS.PRESALE_INVEST,
      complete: CRYPTO_EVENTS.PRESALE_COMPLETE,
      refund: CRYPTO_EVENTS.PRESALE_REFUND
    };

    const eventName = presaleEvents[eventType];
    if (eventName) {
      trackCryptoEvent(eventName, {
        [CRYPTO_PARAMETERS.INVESTMENT_TYPE]: 'presale',
        ...parameters
      });
    }
  }, [trackCryptoEvent]);

  // 📈 TRADING TRACKING
  const trackTradingEvent = useCallback((eventType, parameters = {}) => {
    const tradingEvents = {
      view: CRYPTO_EVENTS.TRADING_VIEW,
      start: CRYPTO_EVENTS.TRADING_START,
      execute: CRYPTO_EVENTS.TRADE_EXECUTE,
      cancel: CRYPTO_EVENTS.TRADE_CANCEL,
      volume: CRYPTO_EVENTS.TRADING_VOLUME
    };

    const eventName = tradingEvents[eventType];
    if (eventName) {
      trackCryptoEvent(eventName, {
        [CRYPTO_PARAMETERS.INVESTMENT_TYPE]: 'trading',
        ...parameters
      });
    }
  }, [trackCryptoEvent]);

  // 💼 WALLET TRACKING
  const trackWalletEvent = useCallback((eventType, parameters = {}) => {
    const walletEvents = {
      connect: CRYPTO_EVENTS.WALLET_CONNECT,
      disconnect: CRYPTO_EVENTS.WALLET_DISCONNECT,
      fund: CRYPTO_EVENTS.WALLET_FUND,
      withdraw: CRYPTO_EVENTS.WALLET_WITHDRAW,
      balance: CRYPTO_EVENTS.WALLET_BALANCE
    };

    const eventName = walletEvents[eventType];
    if (eventName) {
      trackCryptoEvent(eventName, {
        [CRYPTO_PARAMETERS.INVESTMENT_TYPE]: 'wallet',
        ...parameters
      });
    }
  }, [trackCryptoEvent]);

  // 📊 ANALYTICS TRACKING
  const trackAnalyticsEvent = useCallback((eventType, parameters = {}) => {
    const analyticsEvents = {
      view: CRYPTO_EVENTS.ANALYTICS_VIEW,
      subscribe: CRYPTO_EVENTS.ANALYTICS_SUBSCRIBE,
      export: CRYPTO_EVENTS.ANALYTICS_EXPORT,
      share: CRYPTO_EVENTS.ANALYTICS_SHARE
    };

    const eventName = analyticsEvents[eventType];
    if (eventName) {
      trackCryptoEvent(eventName, {
        [CRYPTO_PARAMETERS.INVESTMENT_TYPE]: 'analytics',
        ...parameters
      });
    }
  }, [trackCryptoEvent]);

  // 🎯 INVESTMENT TRACKING
  const trackInvestmentEvent = useCallback((eventType, parameters = {}) => {
    const investmentEvents = {
      view: CRYPTO_EVENTS.INVESTMENT_VIEW,
      plan: CRYPTO_EVENTS.INVESTMENT_PLAN,
      execute: CRYPTO_EVENTS.INVESTMENT_EXECUTE,
      monitor: CRYPTO_EVENTS.INVESTMENT_MONITOR
    };

    const eventName = investmentEvents[eventType];
    if (eventName) {
      trackCryptoEvent(eventName, {
        [CRYPTO_PARAMETERS.INVESTMENT_TYPE]: 'investment',
        ...parameters
      });
    }
  }, [trackCryptoEvent]);

  // 📚 EDUCATION TRACKING
  const trackEducationEvent = useCallback((eventType, parameters = {}) => {
    const educationEvents = {
      view: CRYPTO_EVENTS.EDUCATION_VIEW,
      complete: CRYPTO_EVENTS.EDUCATION_COMPLETE,
      share: CRYPTO_EVENTS.EDUCATION_SHARE,
      certificate: CRYPTO_EVENTS.EDUCATION_CERTIFICATE
    };

    const eventName = educationEvents[eventType];
    if (eventName) {
      trackCryptoEvent(eventName, {
        [CRYPTO_PARAMETERS.INVESTMENT_TYPE]: 'education',
        ...parameters
      });
    }
  }, [trackCryptoEvent]);

  // 🎯 SET USER PROPERTIES
  const setUserProperties = useCallback((properties = {}) => {
    if (isInitialized.current) {
      GA4_HELPERS.setUserProperties(properties);
    }
  }, []);

  // 📊 TRACK PERFORMANCE METRICS
  const trackPerformance = useCallback((metric, value, unit = 'ms') => {
    if (isInitialized.current) {
      trackCryptoEvent('performance_metric', {
        metric_name: metric,
        metric_value: value,
        metric_unit: unit
      });
    }
  }, [trackCryptoEvent]);

  // 🎯 TRACK ERRORS
  const trackError = useCallback((error, context = {}) => {
    if (isInitialized.current) {
      trackCryptoEvent('error_occurred', {
        error_message: error.message,
        error_stack: error.stack,
        error_context: JSON.stringify(context),
        error_severity: context.severity || 'medium'
      });
    }
  }, [trackCryptoEvent]);

  // 📊 TRACK SESSION EVENTS
  const trackSessionStart = useCallback(() => {
    if (isInitialized.current) {
      trackCryptoEvent('session_start', {
        session_id: sessionStartTime.current.toString(),
        session_start_time: sessionStartTime.current
      });
    }
  }, [trackCryptoEvent]);

  const trackSessionEnd = useCallback(() => {
    if (isInitialized.current) {
      const sessionDuration = Date.now() - sessionStartTime.current;
      trackCryptoEvent('session_end', {
        session_id: sessionStartTime.current.toString(),
        session_duration: sessionDuration,
        session_end_time: Date.now()
      });
    }
  }, [trackCryptoEvent]);

  // 🎯 TRACK USER ENGAGEMENT
  const trackEngagement = useCallback((engagementType, parameters = {}) => {
    if (isInitialized.current) {
      trackCryptoEvent('user_engagement', {
        engagement_type: engagementType,
        engagement_timestamp: Date.now(),
        ...parameters
      });
    }
  }, [trackCryptoEvent]);

  // 📊 TRACK CUSTOM EVENTS
  const trackCustomEvent = useCallback((eventName, parameters = {}) => {
    if (isInitialized.current) {
      trackCryptoEvent(eventName, {
        custom_event: true,
        ...parameters
      });
    }
  }, [trackCryptoEvent]);

  // 🎯 INITIALIZE ON MOUNT
  useEffect(() => {
    initializeGA();
  }, [initializeGA]);

  // 📊 TRACK PAGE VIEWS ON LOCATION CHANGE
  useEffect(() => {
    if (isInitialized.current) {
      trackPageView();
    }
  }, [location, trackPageView]);

  // 📊 TRACK SESSION START/END
  useEffect(() => {
    if (isInitialized.current) {
      trackSessionStart();
    }

    const handleBeforeUnload = () => {
      trackSessionEnd();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      trackSessionEnd();
    };
  }, [trackSessionStart, trackSessionEnd]);

  // 📊 TRACK CORE WEB VITALS
  useEffect(() => {
    if (isInitialized.current && 'PerformanceObserver' in window) {
      // First Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          trackPerformance('first_contentful_paint', entry.startTime);
        });
      }).observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          trackPerformance('largest_contentful_paint', entry.startTime);
        });
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const delay = entry.processingStart - entry.startTime;
          trackPerformance('first_input_delay', delay);
        });
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          trackPerformance('cumulative_layout_shift', entry.value, 'score');
        });
      }).observe({ entryTypes: ['layout-shift'] });
    }
  }, [trackPerformance]);

  return {
    // 🎯 INITIALIZATION
    isInitialized: isInitialized.current,
    
    // 📊 BASIC TRACKING
    trackPageView,
    trackCryptoEvent,
    trackConversion,
    trackCustomEvent,
    
    // 🚀 CRYPTO-SPECIFIC TRACKING
    trackPresaleEvent,
    trackTradingEvent,
    trackWalletEvent,
    trackAnalyticsEvent,
    trackInvestmentEvent,
    trackEducationEvent,
    
    // 📊 USER & SESSION TRACKING
    setUserProperties,
    trackPerformance,
    trackError,
    trackSessionStart,
    trackSessionEnd,
    trackEngagement,
    
    // 🎯 HELPER FUNCTIONS
    GA4_HELPERS,
    ADS_HELPERS,
    CRYPTO_EVENTS,
    CRYPTO_PARAMETERS
  };
};

export default useGoogleAnalytics; 