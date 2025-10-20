import React, { useState, useEffect } from 'react';
import './MobileUI.css';

const MobileUI = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isLowPower, setIsLowPower] = useState(false);
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const mobile = window.innerWidth <= 768;
      const landscape = window.innerHeight < window.innerWidth && window.innerHeight < 500;
      
      setIsMobile(mobile);
      setIsLandscape(landscape);
    };

    const checkConnection = async () => {
      if ('connection' in navigator) {
        const connection = navigator.connection;
        setIsSlowConnection(connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
      }
    };

    const checkBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await navigator.getBattery();
          setIsLowPower(battery.level < 0.2);
          
          battery.addEventListener('levelchange', () => {
            setIsLowPower(battery.level < 0.2);
          });
        } catch (error) {
          console.log('Battery API not supported');
        }
      }
    };

    checkDevice();
    checkConnection();
    checkBattery();

    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  if (!isMobile) {
    return children;
  }

  return (
    <div className={`mobile-ui ${isLandscape ? 'landscape' : ''} ${isLowPower ? 'low-power' : ''} ${isSlowConnection ? 'slow-connection' : ''}`}>
      {/* Mobile-specific optimizations */}
      {isLowPower && (
        <div className="mobile-warning low-power-warning">
          <span>🔋</span> Low battery mode - animations disabled
        </div>
      )}
      
      {isSlowConnection && (
        <div className="mobile-warning slow-connection-warning">
          <span>📡</span> Slow connection - loading optimized content
        </div>
      )}
      
      {isLandscape && (
        <div className="mobile-warning landscape-warning">
          <span>📱</span> Rotate to portrait for better experience
        </div>
      )}
      
      <div className="mobile-content">
        {children}
      </div>
      
      {/* Mobile-specific touch feedback */}
      <div className="mobile-touch-feedback" />
    </div>
  );
};

export default MobileUI; 