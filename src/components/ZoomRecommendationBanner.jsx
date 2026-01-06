import React, { useState, useEffect } from 'react';
import './ZoomRecommendationBanner.css';

const ZoomRecommendationBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
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

  if (!showBanner) {
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

