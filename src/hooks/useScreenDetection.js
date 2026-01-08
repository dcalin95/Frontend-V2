import { useState, useEffect, useLayoutEffect } from 'react';

/**
 * 🎯 ADVANCED SCREEN DETECTION HOOK
 * Detectează caracteristicile avansate ale ecranului pentru CSS personalizat
 * - Pixel Ratio (Retina, High-DPI)
 * - Resolution & DPI
 * - Screen Size & Orientation
 * - Color Gamut (HDR, Wide Color)
 * - Touch Support
 * - Performance Metrics
 */
export const useScreenDetection = () => {
  const [screenInfo, setScreenInfo] = useState(() => {
    if (typeof window === 'undefined') {
      return getDefaultScreenInfo();
    }
    return detectScreenInfo();
  });

  // 🚀 Detectare IMEDIATĂ înainte de paint (zero flicker)
  useLayoutEffect(() => {
    const updateScreenInfo = () => {
      const info = detectScreenInfo();
      setScreenInfo(info);
      applyCustomCSS(info);
    };

    // Detectare imediată
    updateScreenInfo();

    // Listeners pentru schimbări
    const mediaQueries = [
      window.matchMedia('(max-width: 768px)'),
      window.matchMedia('(orientation: landscape)'),
      window.matchMedia('(prefers-color-scheme: dark)'),
      window.matchMedia('(prefers-reduced-motion: reduce)'),
    ];

    const handleChange = () => updateScreenInfo();
    mediaQueries.forEach(mq => {
      if (mq.addEventListener) {
        mq.addEventListener('change', handleChange);
      } else {
        mq.addListener(handleChange);
      }
    });

    // Resize listener
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateScreenInfo, 100);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', updateScreenInfo);

    return () => {
      mediaQueries.forEach(mq => {
        if (mq.removeEventListener) {
          mq.removeEventListener('change', handleChange);
        } else {
          mq.removeListener(handleChange);
        }
      });
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', updateScreenInfo);
    };
  }, []);

  return screenInfo;
};

/**
 * 🔍 Detectează toate caracteristicile ecranului
 */
function detectScreenInfo() {
  if (typeof window === 'undefined') {
    return getDefaultScreenInfo();
  }

  const pixelRatio = window.devicePixelRatio || 1;
  const width = window.screen.width || window.innerWidth;
  const height = window.screen.height || window.innerHeight;
  const availWidth = window.screen.availWidth || width;
  const availHeight = window.screen.availHeight || height;
  const innerWidth = window.innerWidth;
  const innerHeight = window.innerHeight;

  // Detectare DPI aproximativ
  const dpi = pixelRatio * 96; // 96 DPI standard pentru desktop

  // Detectare tip ecran
  const isRetina = pixelRatio >= 2;
  const isHighDPI = pixelRatio >= 1.5;
  const isUltraHD = pixelRatio >= 3;

  // Detectare orientare
  const isLandscape = innerWidth > innerHeight;
  const isPortrait = innerHeight > innerWidth;

  // Detectare mobile
  const isMobile = innerWidth <= 768 || 
                   /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                   ('ontouchstart' in window) ||
                   (navigator.maxTouchPoints > 0);

  // Detectare tablet
  const isTablet = !isMobile && innerWidth <= 1024 && innerWidth > 768;

  // Detectare touch
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Detectare color gamut
  const hasWideColor = window.matchMedia('(color-gamut: p3)').matches;
  const hasHDR = window.matchMedia('(dynamic-range: high)').matches;

  // Detectare performance
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

  // Categorisire ecran
  let screenCategory = 'standard';
  if (isUltraHD) screenCategory = 'ultra-hd';
  else if (isRetina) screenCategory = 'retina';
  else if (isHighDPI) screenCategory = 'high-dpi';
  else if (isMobile) screenCategory = 'mobile';
  else if (isTablet) screenCategory = 'tablet';
  else screenCategory = 'desktop';

  return {
    // Basic Info
    pixelRatio,
    width,
    height,
    availWidth,
    availHeight,
    innerWidth,
    innerHeight,
    dpi,
    
    // Screen Type
    isRetina,
    isHighDPI,
    isUltraHD,
    screenCategory,
    
    // Device Type
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    
    // Orientation
    isLandscape,
    isPortrait,
    
    // Capabilities
    hasTouch,
    hasWideColor,
    hasHDR,
    
    // Preferences
    prefersReducedMotion,
    prefersHighContrast,
    
    // Calculated
    aspectRatio: innerWidth / innerHeight,
    physicalWidth: width * pixelRatio,
    physicalHeight: height * pixelRatio,
  };
}

/**
 * 🎨 Aplică CSS personalizat bazat pe caracteristicile ecranului
 */
function applyCustomCSS(screenInfo) {
  const root = document.documentElement;
  
  // Set CSS Variables pentru screen detection
  root.style.setProperty('--device-pixel-ratio', screenInfo.pixelRatio);
  root.style.setProperty('--screen-dpi', `${screenInfo.dpi}px`);
  root.style.setProperty('--screen-width', `${screenInfo.innerWidth}px`);
  root.style.setProperty('--screen-height', `${screenInfo.innerHeight}px`);
  root.style.setProperty('--screen-aspect-ratio', screenInfo.aspectRatio);
  
  // Set classes pentru CSS targeting
  root.classList.remove(
    'screen-retina', 'screen-high-dpi', 'screen-ultra-hd',
    'screen-mobile', 'screen-tablet', 'screen-desktop',
    'screen-landscape', 'screen-portrait',
    'screen-touch', 'screen-wide-color', 'screen-hdr'
  );
  
  if (screenInfo.isRetina) root.classList.add('screen-retina');
  if (screenInfo.isHighDPI) root.classList.add('screen-high-dpi');
  if (screenInfo.isUltraHD) root.classList.add('screen-ultra-hd');
  if (screenInfo.isMobile) root.classList.add('screen-mobile');
  if (screenInfo.isTablet) root.classList.add('screen-tablet');
  if (screenInfo.isDesktop) root.classList.add('screen-desktop');
  if (screenInfo.isLandscape) root.classList.add('screen-landscape');
  if (screenInfo.isPortrait) root.classList.add('screen-portrait');
  if (screenInfo.hasTouch) root.classList.add('screen-touch');
  if (screenInfo.hasWideColor) root.classList.add('screen-wide-color');
  if (screenInfo.hasHDR) root.classList.add('screen-hdr');
  
  // Set screen category
  root.classList.remove('screen-category-standard', 'screen-category-retina', 'screen-category-ultra-hd', 'screen-category-mobile', 'screen-category-tablet', 'screen-category-desktop');
  root.classList.add(`screen-category-${screenInfo.screenCategory}`);
}

function getDefaultScreenInfo() {
  return {
    pixelRatio: 1,
    width: 1920,
    height: 1080,
    availWidth: 1920,
    availHeight: 1080,
    innerWidth: 1920,
    innerHeight: 1080,
    dpi: 96,
    isRetina: false,
    isHighDPI: false,
    isUltraHD: false,
    screenCategory: 'desktop',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isLandscape: true,
    isPortrait: false,
    hasTouch: false,
    hasWideColor: false,
    hasHDR: false,
    prefersReducedMotion: false,
    prefersHighContrast: false,
    aspectRatio: 16/9,
    physicalWidth: 1920,
    physicalHeight: 1080,
  };
}

export default useScreenDetection;

