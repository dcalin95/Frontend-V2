import React from 'react';
import BitcoinAcademyHome from './BitcoinAcademyHome';
import './BitcoinAcademy.css';
import './BitcoinAcademy.mobile.css';
import useGoogleAnalytics from '../../hooks/useGoogleAnalytics';

const BitcoinAcademy = () => {
  const { trackEducationEvent, trackPageView } = useGoogleAnalytics();

  React.useEffect(() => {
    try {
      trackPageView('Bitcoin Academy', { section: 'bitcoin_academy' });
      trackEducationEvent('view', { category: 'bitcoin_academy' });
    } catch (_) {}
  }, [trackPageView, trackEducationEvent]);
  return (
    <div className="bitcoin-academy-wrapper">
      <BitcoinAcademyHome />
    </div>
  );
};

export default BitcoinAcademy;