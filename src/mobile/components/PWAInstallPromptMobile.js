import React, { useState } from 'react';
import { usePWA } from '../../hooks/usePWA';
import Icon from '../../assets/icons/Icon';
import '../Mobile.css';

const PWAInstallPromptMobile = () => {
  const { isInstallable, isInstalled, isOnline, installApp } = usePWA();
  const [isVisible, setIsVisible] = useState(true);

  if (!isInstallable || isInstalled || !isVisible) {
    return null;
  }

  return (
    <div className="mobile-pwa-prompt">
      <div className="mobile-pwa-content">
        <div className="mobile-pwa-header">
          <Icon name="download" size="large" animate="float" />
          <h3>Install BitSwapDEX AI</h3>
        </div>
        <p className="mobile-pwa-description">
          Get instant access, offline mode, and notifications
        </p>
        <div className="mobile-pwa-actions">
          <button 
            className="mobile-pwa-install-btn"
            onClick={installApp}
          >
            <Icon name="download" size="small" />
            <span>Install Now</span>
          </button>
          <button 
            className="mobile-pwa-dismiss-btn"
            onClick={() => setIsVisible(false)}
          >
            <Icon name="close" size="small" />
          </button>
        </div>
      </div>
      
      {!isOnline && (
        <div className="mobile-pwa-offline">
          <Icon name="warning" size="small" animate="pulse" />
          <span>Offline Mode</span>
        </div>
      )}
    </div>
  );
};

export default PWAInstallPromptMobile;

