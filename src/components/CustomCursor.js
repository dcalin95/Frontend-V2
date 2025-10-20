import React, { useEffect, useState, useCallback } from 'react';

const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // 🎯 Optimizare performanță cu useCallback
  const updateCursorPosition = useCallback((e) => {
    // 🎯 Folosim requestAnimationFrame pentru performanță optimă
    requestAnimationFrame(() => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    });
  }, []);

  const hideCursor = useCallback(() => {
    setIsVisible(false);
  }, []);

  const showCursor = useCallback(() => {
    setIsVisible(true);
  }, []);

  // 🎯 Detectare hover pentru elemente interactive
  const handleMouseEnter = useCallback((e) => {
    if (e.target.tagName === 'BUTTON' || 
        e.target.tagName === 'A' || 
        e.target.closest('.clickable') ||
        e.target.closest('.buy-button') ||
        e.target.closest('.price-line')) {
      setIsHovering(true);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  useEffect(() => {
    // 🎯 Detectare dispozitive touch
    const checkTouchDevice = () => {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsTouchDevice(isTouch);
      return isTouch;
    };

    const isTouch = checkTouchDevice();

    // 🎯 Nu adăugăm event listeners pe dispozitive touch
    if (isTouch) {
      return;
    }

    // Add event listeners
    document.addEventListener('mousemove', updateCursorPosition, { passive: true });
    document.addEventListener('mouseenter', showCursor);
    document.addEventListener('mouseleave', hideCursor);
    document.addEventListener('mouseover', handleMouseEnter);
    document.addEventListener('mouseout', handleMouseLeave);

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', updateCursorPosition);
      document.removeEventListener('mouseenter', showCursor);
      document.removeEventListener('mouseleave', hideCursor);
      document.removeEventListener('mouseover', handleMouseEnter);
      document.removeEventListener('mouseout', handleMouseLeave);
    };
  }, [updateCursorPosition, showCursor, hideCursor, handleMouseEnter, handleMouseLeave]);

  // 🎯 Nu renderăm cursorul pe dispozitive touch
  if (isTouchDevice) {
    return null;
  }

  return (
    <div 
      className="custom-cursor"
      style={{
        transform: `translate(${position.x - 8}px, ${position.y - 8}px)`,
        opacity: isVisible ? 1 : 0,
      }}
    >
      {/* 🎯 Folosim favicon-ul în loc de logo-ul mare */}
      <img 
        src="/favicon.ico" 
        alt="BITS Cursor" 
        className={`cursor-icon ${isHovering ? 'cursor-hover' : ''}`}
      />
      
      {/* 🎯 Săgeată mică pentru orientare */}
      <div className="cursor-arrow"></div>
      
      {/* 🎯 Glow effect doar când hover */}
      {isHovering && <div className="cursor-glow"></div>}
    </div>
  );
};

export default CustomCursor; 