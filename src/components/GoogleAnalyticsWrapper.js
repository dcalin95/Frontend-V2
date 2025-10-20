// 🚀 GOOGLE ANALYTICS WRAPPER COMPONENT
// Wrapper pentru Google Analytics în contextul Router

import React from 'react';
import useGoogleAnalytics from '../hooks/useGoogleAnalytics';

const GoogleAnalyticsWrapper = ({ children }) => {
  // 🚀 Google Analytics Integration - în contextul Router
  const {
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
    trackEngagement
  } = useGoogleAnalytics();

  // 🎯 Expose tracking functions globally pentru a fi folosite în alte componente
  if (typeof window !== 'undefined') {
    window.trackGoogleAnalytics = {
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
      trackEngagement
    };
  }

  return <>{children}</>;
};

export default GoogleAnalyticsWrapper; 