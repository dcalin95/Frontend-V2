import React from 'react';
import BitcoinAcademyHome from './BitcoinAcademyHome';
// CSS imports moved to BitcoinAcademyHome to avoid chunk loading issues
import useGoogleAnalytics from '../../hooks/useGoogleAnalytics';

const BitcoinAcademy = () => {
  const analytics = useGoogleAnalytics();
  const { trackEducationEvent, trackPageView } = analytics || {};

  React.useEffect(() => {
    try {
      if (trackPageView && typeof trackPageView === 'function') {
        trackPageView('Bitcoin Academy', { section: 'bitcoin_academy' });
      }
      if (trackEducationEvent && typeof trackEducationEvent === 'function') {
        trackEducationEvent('view', { category: 'bitcoin_academy' });
      }
    } catch (error) {
      console.warn('Bitcoin Academy: Analytics tracking error:', error);
    }
  }, [trackPageView, trackEducationEvent]);
  
  return (
    <div className="bitcoin-academy-wrapper">
      <BitcoinAcademyHome />
    </div>
  );
};

export default BitcoinAcademy;