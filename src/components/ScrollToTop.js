// ScrollToTop.js - Force scroll to top on route change
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top immediately on route change
    window.scrollTo(0, 0);
    
    // Also scroll any containers with class 'home-container'
    const containers = document.querySelectorAll('.home-container, .app-container, .content-container');
    containers.forEach(container => {
      container.scrollTop = 0;
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;

