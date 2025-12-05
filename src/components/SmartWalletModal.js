import React, { useState, useEffect } from 'react';
import { detectMobile } from '../utils/walletDetection';
import UnifiedWalletModal from './UnifiedWalletModal';
import MobileWalletModal from './MobileWalletModal';

/**
 * 🎯 Smart Wallet Modal - Auto-switches between Desktop & Mobile versions
 * Renders appropriate modal based on device type
 */
const SmartWalletModal = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(detectMobile());
    
    // Listen for resize to switch between mobile/desktop
    const handleResize = () => {
      setIsMobile(detectMobile());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Render mobile version for mobile devices
  if (isMobile) {
    return <MobileWalletModal />;
  }

  // Render desktop version for desktop
  return <UnifiedWalletModal />;
};

export default SmartWalletModal;

