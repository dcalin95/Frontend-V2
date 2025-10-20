// 🚀 GOOGLE ANALYTICS HELPER HOOK
// Hook helper pentru a accesa Google Analytics din orice componentă

import { useCallback } from 'react';

export const useGoogleAnalyticsHelper = () => {
  // 🎯 Helper functions pentru tracking
  const trackPageView = useCallback((customTitle = null, customParameters = {}) => {
    if (typeof window !== 'undefined' && window.trackGoogleAnalytics) {
      window.trackGoogleAnalytics.trackPageView(customTitle, customParameters);
    }
  }, []);

  const trackCryptoEvent = useCallback((eventName, parameters = {}) => {
    if (typeof window !== 'undefined' && window.trackGoogleAnalytics) {
      window.trackGoogleAnalytics.trackCryptoEvent(eventName, parameters);
    }
  }, []);

  const trackPresaleEvent = useCallback((eventType, parameters = {}) => {
    if (typeof window !== 'undefined' && window.trackGoogleAnalytics) {
      window.trackGoogleAnalytics.trackPresaleEvent(eventType, parameters);
    }
  }, []);

  const trackTradingEvent = useCallback((eventType, parameters = {}) => {
    if (typeof window !== 'undefined' && window.trackGoogleAnalytics) {
      window.trackGoogleAnalytics.trackTradingEvent(eventType, parameters);
    }
  }, []);

  const trackWalletEvent = useCallback((eventType, parameters = {}) => {
    if (typeof window !== 'undefined' && window.trackGoogleAnalytics) {
      window.trackGoogleAnalytics.trackWalletEvent(eventType, parameters);
    }
  }, []);

  const trackAnalyticsEvent = useCallback((eventType, parameters = {}) => {
    if (typeof window !== 'undefined' && window.trackGoogleAnalytics) {
      window.trackGoogleAnalytics.trackAnalyticsEvent(eventType, parameters);
    }
  }, []);

  const trackInvestmentEvent = useCallback((eventType, parameters = {}) => {
    if (typeof window !== 'undefined' && window.trackGoogleAnalytics) {
      window.trackGoogleAnalytics.trackInvestmentEvent(eventType, parameters);
    }
  }, []);

  const trackEducationEvent = useCallback((eventType, parameters = {}) => {
    if (typeof window !== 'undefined' && window.trackGoogleAnalytics) {
      window.trackGoogleAnalytics.trackEducationEvent(eventType, parameters);
    }
  }, []);

  const setUserProperties = useCallback((properties = {}) => {
    if (typeof window !== 'undefined' && window.trackGoogleAnalytics) {
      window.trackGoogleAnalytics.setUserProperties(properties);
    }
  }, []);

  const trackPerformance = useCallback((metric, value, unit = 'ms') => {
    if (typeof window !== 'undefined' && window.trackGoogleAnalytics) {
      window.trackGoogleAnalytics.trackPerformance(metric, value, unit);
    }
  }, []);

  const trackError = useCallback((error, context = {}) => {
    if (typeof window !== 'undefined' && window.trackGoogleAnalytics) {
      window.trackGoogleAnalytics.trackError(error, context);
    }
  }, []);

  const trackEngagement = useCallback((engagementType, parameters = {}) => {
    if (typeof window !== 'undefined' && window.trackGoogleAnalytics) {
      window.trackGoogleAnalytics.trackEngagement(engagementType, parameters);
    }
  }, []);

  const isAvailable = typeof window !== 'undefined' && window.trackGoogleAnalytics;

  return {
    // 🎯 Tracking functions
    trackPageView,
    trackCryptoEvent,
    trackPresaleEvent,
    trackTradingEvent,
    trackWalletEvent,
    trackAnalyticsEvent,
    trackInvestmentEvent,
    trackEducationEvent,
    setUserProperties,
    trackPerformance,
    trackError,
    trackEngagement,
    
    // 🎯 Status
    isAvailable
  };
};

export default useGoogleAnalyticsHelper; 