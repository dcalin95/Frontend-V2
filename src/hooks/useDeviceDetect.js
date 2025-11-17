import { useState, useEffect } from 'react';

/**
 * Hook pentru detectarea dispozitivului mobil
 * Returnează true dacă user-ul este pe mobil (width <= 768px)
 * Se actualizează automat la resize
 */
export const useDeviceDetect = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const mobileBreakpoint = 768;
      const isMobileDevice = window.innerWidth <= mobileBreakpoint;
      setIsMobile(isMobileDevice);
    };

    // Check inițial
    checkDevice();

    // Listen pentru resize
    window.addEventListener('resize', checkDevice);

    // Cleanup
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return isMobile;
};

export default useDeviceDetect;

