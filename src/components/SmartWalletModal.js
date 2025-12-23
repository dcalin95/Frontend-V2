import React, { useState, useEffect } from 'react';
import UnifiedWalletModal from './UnifiedWalletModal';
import MobileWalletModal from './MobileWalletModal';

/**
 * 🎯 Smart Wallet Modal - Auto-switches between Desktop & Mobile versions
 * Uses body.mode-mobile class (set by MobileUI) for consistent detection
 */
const SmartWalletModal = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    // Check if body has mode-mobile class (set by MobileUI)
    const hasMobileClass = document.body.classList.contains('mode-mobile');
    const isSmallWidth = window.innerWidth <= 768;
    console.log(`🔍 [SmartWalletModal] Initial check - hasMobileClass: ${hasMobileClass}, isSmallWidth: ${isSmallWidth}`);
    return hasMobileClass || isSmallWidth;
  });

  useEffect(() => {
    // Use matchMedia for better performance and consistency
    const mobileQuery = window.matchMedia('(max-width: 768px)');
    
    const checkMobile = () => {
      // Check both body class (from MobileUI) and width
      const hasMobileClass = document.body.classList.contains('mode-mobile');
      const isSmallWidth = window.innerWidth <= 768;
      const shouldBeMobile = hasMobileClass || isSmallWidth;
      
      console.log(`🔍 [SmartWalletModal] checkMobile - hasMobileClass: ${hasMobileClass}, isSmallWidth: ${isSmallWidth}, shouldBeMobile: ${shouldBeMobile}`);
      
      setIsMobile(shouldBeMobile);
    };

    // Initial check
    checkMobile();

    // Listen for resize and class changes
    const handleResize = () => {
      checkMobile();
    };

    // Listen to media query changes
    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener('change', handleResize);
    } else {
      mobileQuery.addListener(handleResize);
    }

    window.addEventListener('resize', handleResize);
    
    // Also listen for class changes on body (from MobileUI)
    const observer = new MutationObserver(() => {
      checkMobile();
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mobileQuery.removeEventListener) {
        mobileQuery.removeEventListener('change', handleResize);
      } else {
        mobileQuery.removeListener(handleResize);
      }
      observer.disconnect();
    };
  }, []);

  console.log(`🔍 [SmartWalletModal] Rendering ${isMobile ? 'MOBILE' : 'DESKTOP'} version`);

  // Render mobile version for mobile devices
  if (isMobile) {
    return <MobileWalletModal />;
  }

  // Render desktop version for desktop
  return <UnifiedWalletModal />;
};

export default SmartWalletModal;

