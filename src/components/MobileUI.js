import React, { useState, useEffect, useLayoutEffect } from 'react';
import UserDeviceInfo from './UserDeviceInfo';
import { detectInAppBrowser } from '../utils/walletDetection';
import './MobileUI.css';

const MobileUI = ({ children }) => {
  // ✅ FIX: Folosim matchMedia pentru sincronizare perfectă cu CSS-ul
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(max-width: 768px)').matches;
    }
    return false;
  });

  const [isLandscape, setIsLandscape] = useState(() => {
    if (typeof window !== 'undefined') {
      // Landscape ONLY when: width > height AND height is very small (phone in landscape)
      // This prevents false positives on portrait mode or desktop browsers
      const isLandscapeOrientation = window.innerWidth > window.innerHeight;
      const isSmallHeight = window.innerHeight < 450; // Reduced threshold
      const isMobileWidth = window.innerWidth < 900; // Ensure it's actually a mobile device
      return isLandscapeOrientation && isSmallHeight && isMobileWidth;
    }
    return false;
  });

  const [isLowPower, setIsLowPower] = useState(false);
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  // 🚀 Aplicăm clasele IMEDIAT, înainte de paint
  useLayoutEffect(() => {
    const updateClasses = () => {
      const mobile = window.matchMedia('(max-width: 768px)').matches;
      
      console.log('🔍 [MobileUI] Detecting device:', { 
        mobile, 
        width: window.innerWidth, 
        height: window.innerHeight 
      });
      
      if (mobile) {
        document.body.classList.add('mode-mobile');
        document.body.classList.remove('mode-desktop');
        console.log('✅ [MobileUI] Applied mode-mobile class');
      } else {
        document.body.classList.add('mode-desktop');
        document.body.classList.remove('mode-mobile');
        console.log('✅ [MobileUI] Applied mode-desktop class');
      }

      // Landscape ONLY when: width > height AND height is very small AND mobile width
      const isLandscapeOrientation = window.innerWidth > window.innerHeight;
      const isSmallHeight = window.innerHeight < 450;
      const isMobileWidth = window.innerWidth < 900;
      const landscape = isLandscapeOrientation && isSmallHeight && isMobileWidth;
      
      if (landscape) {
        document.body.classList.add('orientation-landscape');
      } else {
        document.body.classList.remove('orientation-landscape');
      }

      // 📱 Detectare In-App Browser (MetaMask, TrustWallet, etc.)
      const { isInApp } = detectInAppBrowser();
      if (isInApp) {
        document.body.classList.add('in-app-browser');
      } else {
        document.body.classList.remove('in-app-browser');
      }
    };

    updateClasses();
  }, []);

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 768px)');

    const handleResize = () => {
      const mobile = mobileQuery.matches;
      // Landscape ONLY when: width > height AND height is very small AND mobile width
      const isLandscapeOrientation = window.innerWidth > window.innerHeight;
      const isSmallHeight = window.innerHeight < 450;
      const isMobileWidth = window.innerWidth < 900;
      const landscape = isLandscapeOrientation && isSmallHeight && isMobileWidth;
      
      console.log('🔍 [MobileUI] Resize detected:', { 
        mobile, 
        landscape,
        width: window.innerWidth, 
        height: window.innerHeight 
      });
      
      setIsMobile(mobile);
      setIsLandscape(landscape);

      if (mobile) {
        document.body.classList.add('mode-mobile');
        document.body.classList.remove('mode-desktop');
        console.log('✅ [MobileUI] Switched to mobile mode');
      } else {
        document.body.classList.add('mode-desktop');
        document.body.classList.remove('mode-mobile');
        console.log('✅ [MobileUI] Switched to desktop mode');
      }

      if (landscape) {
        document.body.classList.add('orientation-landscape');
      } else {
        document.body.classList.remove('orientation-landscape');
      }

      // 📱 Detectare In-App Browser (MetaMask, TrustWallet, etc.)
      const { isInApp } = detectInAppBrowser();
      if (isInApp) {
        document.body.classList.add('in-app-browser');
      } else {
        document.body.classList.remove('in-app-browser');
      }
    };

    // Listeners
    if (mobileQuery.addEventListener) {
        mobileQuery.addEventListener('change', handleResize);
    } else {
        mobileQuery.addListener(handleResize);
    }
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

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

    checkConnection();
    checkBattery();

    return () => {
      if (mobileQuery.removeEventListener) {
        mobileQuery.removeEventListener('change', handleResize);
      } else {
        mobileQuery.removeListener(handleResize);
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Randează mereu structura, dar adaptează conținutul
  // Astfel evităm "re-mount" complet la copii când se schimbă isMobile
  return (
    <div className={isMobile ? `mobile-ui ${isLandscape ? 'landscape' : ''} ${isLowPower ? 'low-power' : ''} ${isSlowConnection ? 'slow-connection' : ''}` : 'desktop-ui'}>
      {/* Mobile-specific optimizations */}
      {isMobile && isLowPower && (
        <div className="mobile-warning low-power-warning">
          <span>🔋</span> Low battery mode - animations disabled
        </div>
      )}
      
      {isMobile && isSlowConnection && (
        <div className="mobile-warning slow-connection-warning">
          <span>📡</span> Slow connection - loading optimized content
        </div>
      )}
      
      {isMobile && isLandscape && (
        <div className="mobile-warning landscape-warning">
          <span>📱</span> Rotate to portrait for better experience
        </div>
      )}
      
      <div className={isMobile ? "mobile-content" : "desktop-content"}>
        {children}
      </div>
      
      {/* Mobile-specific touch feedback & Device Info */}
      {isMobile && <div className="mobile-touch-feedback" />}
      {isMobile && <UserDeviceInfo />}
    </div>
  );
};

export default MobileUI;
