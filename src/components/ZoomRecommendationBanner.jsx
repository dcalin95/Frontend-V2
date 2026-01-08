import React, { useState, useEffect } from 'react';
import './ZoomRecommendationBanner.css';

/**
 * Funcție robustă pentru detectarea dispozitivelor mobile
 * Verifică multiple condiții pentru a preveni afișarea banner-ului pe mobile
 */
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  
  // 1. Verificare dimensiuni ecran
  const isSmallScreen = window.innerWidth <= 768 || window.screen.width <= 768;
  
  // 2. Verificare clasa body
  const hasMobileClass = document.body.classList.contains('mode-mobile');
  
  // 3. Verificare user agent pentru mobile (inclusiv Chrome mobile)
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const uaLower = userAgent.toLowerCase();
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(uaLower);
  
  // 3b. Verificare specifică pentru Chrome mobile (Chrome pe Android)
  const isChromeMobile = /chrome/i.test(uaLower) && /android/i.test(uaLower) && !/edg/i.test(uaLower);
  
  // 4. Verificare touch support
  const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // 5. Verificare orientare (mobile are de obicei aspect ratio diferit)
  const isMobileAspectRatio = window.innerHeight > window.innerWidth && window.innerWidth < 500;
  
  // 6. Verificare suplimentară: dacă este Chrome mobile, consideră-l mobile indiferent de alte condiții
  if (isChromeMobile) {
    return true;
  }
  
  // Returnează true dacă ORICE condiție indică mobile
  return isSmallScreen || hasMobileClass || (isMobileUA && hasTouchSupport) || isMobileAspectRatio;
};

const ZoomRecommendationBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // 📱 MOBILE: Verificare robustă - NU afișa banner-ul pe mobile
    if (isMobileDevice()) {
      console.log('🚫 [ZoomBanner] Mobile device detected - banner hidden');
      return; // Nu afișa banner-ul pe mobile
    }

    // Verifică dacă banner-ul a fost deja afișat
    const bannerShown = localStorage.getItem('zoom-recommendation-shown');
    if (bannerShown === 'true') {
      return;
    }

    // Detectează zoom-ul browser-ului
    const detectZoom = () => {
      // Metodă 1: Folosind măsurători cu element de referință (cea mai precisă)
      const testElement = document.createElement('div');
      testElement.style.width = '100px';
      testElement.style.position = 'absolute';
      testElement.style.visibility = 'hidden';
      testElement.style.left = '-9999px';
      document.body.appendChild(testElement);
      const actualWidth = testElement.offsetWidth;
      document.body.removeChild(testElement);
      const zoomLevel = Math.round((actualWidth / 100) * 100);

      // Metodă 2: Folosind devicePixelRatio (backup pentru Chrome)
      // În Chrome, devicePixelRatio rămâne 1 la zoom, dar window.devicePixelRatio poate varia
      // Folosim o metodă alternativă bazată pe măsurători
      const zoomLevel2 = Math.round((window.screen.width / window.innerWidth) * 100);

      // Folosim media celor două metode pentru precizie mai bună
      const averageZoom = Math.round((zoomLevel + zoomLevel2) / 2);

      // Afișăm banner-ul dacă zoom-ul nu este între 75% și 95% (pentru a acoperi 80% și 90% în Chrome)
      // Chrome ajustează zoom-ul din 10% în 10%, deci 80% sau 90% sunt acceptabile
      if (averageZoom < 75 || averageZoom > 95) {
        setShowBanner(true);
      }
    };

    // Detectează zoom-ul după ce pagina s-a încărcat
    const timer = setTimeout(detectZoom, 500);
    
    // Detectează zoom-ul și la resize
    window.addEventListener('resize', detectZoom);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', detectZoom);
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowBanner(false);
      localStorage.setItem('zoom-recommendation-shown', 'true');
    }, 300);
  };

  // 📱 MOBILE: Verificare finală înainte de render - dacă este mobile, nu renderiza deloc
  if (isMobileDevice() || !showBanner) {
    return null;
  }

  return (
    <div className={`zoom-recommendation-banner ${isClosing ? 'closing' : ''}`}>
      <div className="zoom-banner-content">
        <div className="zoom-banner-icon">🔍</div>
        <div className="zoom-banner-text">
          <strong>Recommendation:</strong> This site is optimized for <strong>80-90% zoom</strong> in Chrome. 
          For the best experience, adjust your zoom level to 80% or 90%.
        </div>
        <button className="zoom-banner-close" onClick={handleClose} aria-label="Close">
          ✕
        </button>
      </div>
    </div>
  );
};

export default ZoomRecommendationBanner;

