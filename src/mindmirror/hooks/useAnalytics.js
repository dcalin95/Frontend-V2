import { useEffect, useCallback } from 'react';

const ANALYTICS_EVENTS = {
  MIND_ANALYSIS: 'mind_analysis',
  VOICE_ANALYSIS: 'voice_analysis',
  VIDEO_ANALYSIS: 'video_analysis',
  NFT_MINT: 'nft_mint',
  TIER_UNLOCK: 'tier_unlock',
  ACHIEVEMENT: 'achievement_unlock'
};

export const useAnalytics = () => {
  const trackEvent = useCallback((eventName, data = {}) => {
    // Simulare tracking
    console.log('Analytics Event:', eventName, data);
    
    // În producție, aici s-ar trimite către backend
    const analyticsData = {
      event: eventName,
      timestamp: new Date().toISOString(),
      data: data,
      sessionId: localStorage.getItem('mind_session_id')
    };

    // Emit pentru debugging și integrare viitoare
    window.dispatchEvent(new CustomEvent('mind_analytics', {
      detail: analyticsData
    }));
  }, []);

  useEffect(() => {
    // Generate session ID dacă nu există
    if (!localStorage.getItem('mind_session_id')) {
      localStorage.setItem('mind_session_id', `mind_${Date.now()}`);
    }

    // Track page view
    trackEvent('page_view', {
      page: 'mind_mirror'
    });
  }, [trackEvent]);

  return {
    trackEvent,
    ANALYTICS_EVENTS
  };
};

// Hook pentru tracking automat de metrici
export const useAutoTrack = (metrics = {}) => {
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    const interval = setInterval(() => {
      trackEvent('auto_metrics', {
        ...metrics,
        timestamp: Date.now()
      });
    }, 60000); // Track la fiecare minut

    return () => clearInterval(interval);
  }, [trackEvent, metrics]);
};










