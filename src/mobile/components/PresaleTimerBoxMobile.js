import React from 'react';
import { usePresaleState } from '../../Presale/Timer/usePresaleState';
import SaleCountdown from '../../Presale/Timer/SaleCountdown';
import Icon from '../../assets/icons/Icon';
import '../Mobile.css';

const PresaleTimerBoxMobile = () => {
  const { endTime, serverTimeOffset, isLoaded, progress } = usePresaleState();

  if (!isLoaded || endTime === null) return null;

  return (
    <div className="mobile-presale-timer-box">
      <div className="mobile-timer-header">
        <Icon name="clock" size="medium" animate="pulse" />
        <h3>Presale Ends In</h3>
      </div>
      <div className="mobile-timer-countdown">
        <SaleCountdown 
          endTime={endTime} 
          serverTimeOffset={serverTimeOffset} 
          progress={progress}
        />
      </div>
      <a href="/presale" className="mobile-timer-button">
        <Icon name="rocket" size="small" />
        <span>Go to Presale</span>
      </a>
    </div>
  );
};

export default PresaleTimerBoxMobile;

