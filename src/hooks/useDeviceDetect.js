import { useState, useLayoutEffect } from 'react';

/**
 * Hook pentru detectarea dispozitivului mobil
 * Folosește matchMedia și useLayoutEffect pentru precizie maximă la refresh (zero flicker)
 */
export const useDeviceDetect = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(max-width: 768px)').matches;
    }
    return false;
  });

  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    
    const handleChange = (e) => {
      setIsMobile(e.matches);
    };

    // Setăm valoarea imediat, sincron, înainte de paint
    setIsMobile(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return isMobile;
};

export default useDeviceDetect;
