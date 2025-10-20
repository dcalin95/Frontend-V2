import React, { useState } from 'react';
import { usePWA } from '../hooks/usePWA';
import './PWAInstallPrompt.css';

const PWAInstallPrompt = () => {
  const { isInstallable, isInstalled, isOnline, installApp } = usePWA();
  const [isVisible, setIsVisible] = useState(true);

  if (!isInstallable || isInstalled || !isVisible) {
    return null;
  }

  return (
    <div className="pwa-install-prompt">
      <div className="pwa-install-content">
        <div className="pwa-install-icon">📱</div>
        <div className="pwa-install-text">
          <h3>Install BitSwapDEX AI</h3>
          <p>Get the full app experience with offline access and notifications</p>
        </div>
        <div className="pwa-install-actions">
          <button 
            className="pwa-install-btn"
            onClick={installApp}
          >
            Install App
          </button>
          <button 
            className="pwa-dismiss-btn"
            onClick={() => setIsVisible(false)}
          >
            Not Now
          </button>
        </div>
      </div>
      
      {!isOnline && (
        <div className="pwa-offline-indicator">
          <span>📡</span> You're offline - some features may be limited
        </div>
      )}
    </div>
  );
};

export default PWAInstallPrompt; 