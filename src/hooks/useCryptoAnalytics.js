// 🚀 Crypto Analytics Hook
// Comprehensive analytics integration for crypto investment platform

import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import cryptoAnalyticsService from '../services/cryptoAnalyticsService';
import { useAnalytics } from './useAnalytics';
import { useGoogleAnalytics } from './useGoogleAnalytics';

export const useCryptoAnalytics = () => {
  const location = useLocation();
  const { track: trackGeneral } = useAnalytics();
  const { trackEvent: trackGA } = useGoogleAnalytics();
  const isInitialized = useRef(false);
  const sessionStartTime = useRef(Date.now());

  // Initialize crypto analytics
  useEffect(() => {
    if (!isInitialized.current) {
      cryptoAnalyticsService.init();
      isInitialized.current = true;
      
      // Track session start
      trackSessionStart();
    }
  }, []);

  // Track page views
  useEffect(() => {
    if (isInitialized.current) {
      trackPageView();
    }
  }, [location]);

  // Track session end on unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      trackSessionEnd();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Track session start
  const trackSessionStart = useCallback(() => {
    const sessionData = {
      sessionId: Date.now().toString(),
      startTime: sessionStartTime.current,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      utmParams: getUTMParameters(),
    };

    cryptoAnalyticsService.trackCryptoEvent('session_start', sessionData);
    trackGeneral('session_start', sessionData);
    trackGA('session_start', sessionData);
  }, [trackGeneral, trackGA]);

  // Track session end
  const trackSessionEnd = useCallback(() => {
    const sessionDuration = Date.now() - sessionStartTime.current;
    const sessionData = {
      sessionId: sessionStartTime.current.toString(),
      duration: sessionDuration,
    };

    cryptoAnalyticsService.trackCryptoEvent('session_end', sessionData);
    trackGeneral('session_end', sessionData);
    trackGA('session_end', sessionData);
  }, [trackGeneral, trackGA]);

  // Track page view
  const trackPageView = useCallback(() => {
    const pageData = {
      page: location.pathname,
      title: document.title,
      url: window.location.href,
      referrer: document.referrer,
      utmParams: getUTMParameters(),
    };

    cryptoAnalyticsService.trackCryptoEvent('page_view', pageData);
    trackGeneral('page_view', pageData);
    trackGA('page_view', pageData);
  }, [location, trackGeneral, trackGA]);

  // Track presale events
  const trackPresaleEvent = useCallback((eventName, properties = {}) => {
    const enhancedProperties = {
      ...properties,
      timestamp: Date.now(),
      page: location.pathname,
    };

    cryptoAnalyticsService.trackPresaleEvent(eventName, enhancedProperties);
    trackGeneral(eventName, enhancedProperties);
    trackGA(eventName, enhancedProperties);
  }, [location, trackGeneral, trackGA]);

  // Track staking events
  const trackStakingEvent = useCallback((eventName, properties = {}) => {
    const enhancedProperties = {
      ...properties,
      timestamp: Date.now(),
      page: location.pathname,
    };

    cryptoAnalyticsService.trackStakingEvent(eventName, enhancedProperties);
    trackGeneral(eventName, enhancedProperties);
    trackGA(eventName, enhancedProperties);
  }, [location, trackGeneral, trackGA]);

  // Track trading events
  const trackTradingEvent = useCallback((eventName, properties = {}) => {
    const enhancedProperties = {
      ...properties,
      timestamp: Date.now(),
      page: location.pathname,
    };

    cryptoAnalyticsService.trackTradingEvent(eventName, enhancedProperties);
    trackGeneral(eventName, enhancedProperties);
    trackGA(eventName, enhancedProperties);
  }, [location, trackGeneral, trackGA]);

  // Track wallet events
  const trackWalletEvent = useCallback((eventName, properties = {}) => {
    const enhancedProperties = {
      ...properties,
      timestamp: Date.now(),
      page: location.pathname,
    };

    cryptoAnalyticsService.trackWalletEvent(eventName, enhancedProperties);
    trackGeneral(eventName, enhancedProperties);
    trackGA(eventName, enhancedProperties);
  }, [location, trackGeneral, trackGA]);

  // Track user engagement events
  const trackEngagement = useCallback((eventName, properties = {}) => {
    const enhancedProperties = {
      ...properties,
      timestamp: Date.now(),
      page: location.pathname,
      sessionDuration: Date.now() - sessionStartTime.current,
    };

    cryptoAnalyticsService.trackCryptoEvent(eventName, enhancedProperties);
    trackGeneral(eventName, enhancedProperties);
    trackGA(eventName, enhancedProperties);
  }, [location, trackGeneral, trackGA]);

  // Track conversion events
  const trackConversion = useCallback((eventName, properties = {}) => {
    const enhancedProperties = {
      ...properties,
      timestamp: Date.now(),
      page: location.pathname,
      conversionValue: properties.value || 0,
    };

    cryptoAnalyticsService.trackCryptoEvent(eventName, enhancedProperties);
    trackGeneral(eventName, enhancedProperties);
    trackGA(eventName, enhancedProperties);
  }, [location, trackGeneral, trackGA]);

  // Track error events
  const trackError = useCallback((error, context = {}) => {
    const errorData = {
      errorMessage: error.message,
      errorStack: error.stack,
      errorType: error.name,
      timestamp: Date.now(),
      page: location.pathname,
      userContext: context,
    };

    cryptoAnalyticsService.trackCryptoError(error);
    trackGeneral('error_occurred', errorData);
    trackGA('error_occurred', errorData);
  }, [location, trackGeneral, trackGA]);

  // Track performance metrics
  const trackPerformance = useCallback((metricName, value, properties = {}) => {
    const performanceData = {
      metricName,
      value,
      timestamp: Date.now(),
      page: location.pathname,
      ...properties,
    };

    cryptoAnalyticsService.trackPerformance(metricName, value);
    trackGeneral('performance_metric', performanceData);
    trackGA('performance_metric', performanceData);
  }, [location, trackGeneral, trackGA]);

  // Get UTM parameters
  const getUTMParameters = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      utm_source: urlParams.get('utm_source'),
      utm_medium: urlParams.get('utm_medium'),
      utm_campaign: urlParams.get('utm_campaign'),
      utm_term: urlParams.get('utm_term'),
      utm_content: urlParams.get('utm_content'),
    };
  }, []);

  // Get analytics summary
  const getAnalyticsSummary = useCallback(() => {
    return cryptoAnalyticsService.getCryptoAnalyticsSummary();
  }, []);

  // Get user behavior insights
  const getUserBehaviorInsights = useCallback(() => {
    return cryptoAnalyticsService.getUserBehaviorInsights();
  }, []);

  // Track custom crypto event
  const trackCryptoEvent = useCallback((eventName, properties = {}) => {
    const enhancedProperties = {
      ...properties,
      timestamp: Date.now(),
      page: location.pathname,
    };

    cryptoAnalyticsService.trackCryptoEvent(eventName, enhancedProperties);
    trackGeneral(eventName, enhancedProperties);
    trackGA(eventName, enhancedProperties);
  }, [location, trackGeneral, trackGA]);

  return {
    // Tracking functions
    trackPresaleEvent,
    trackStakingEvent,
    trackTradingEvent,
    trackWalletEvent,
    trackEngagement,
    trackConversion,
    trackError,
    trackPerformance,
    trackCryptoEvent,
    
    // Analytics data
    getAnalyticsSummary,
    getUserBehaviorInsights,
    
    // Utility functions
    getUTMParameters,
    
    // Status
    isInitialized: isInitialized.current,
  };
};

export default useCryptoAnalytics; 