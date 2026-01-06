import React, { useState, useEffect } from "react";
import TokenomicsChartModern from "./TokenomicsChartModern";
import TokenomicsChartHexagon from "./TokenomicsChartHexagon";
import AddTokenButton from "./AddTokenButton"; // Import AddTokenButton
import "./TokenomicsPage.desktop.css";
import "./TokenomicsPage.mobile.css";

const TokenomicsPage = ({ 
  defaultView = "ring",  // "ring" or "hexagon"
  showToggle = true      // show/hide toggle button
}) => {
  const [viewMode, setViewMode] = useState(defaultView);
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Detectare scroll pentru a ascunde/afișa butoanele
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Dacă scroll-ul este mai mare de 100px, ascunde butoanele
      if (currentScrollY > 100) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
      
      // Dacă utilizatorul se întoarce sus (scroll în sus), afișează butoanele
      if (currentScrollY < lastScrollY && currentScrollY < 100) {
        setIsScrolled(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  return (
    <div className="tokenomics-page">
      {/* Toggle Button - doar dacă showToggle = true */}
      {showToggle && (
        <div className={`tokenomics-controls ${isScrolled ? 'scrolled-down' : ''}`}>
          <button 
            className="tokenomics-toggle"
            onClick={() => setViewMode(viewMode === "ring" ? "hexagon" : "ring")}
          >
            {viewMode === "ring" ? "Switch to Hexagon View" : "Switch to Ring View"}
          </button>
          <AddTokenButton compact={true} />
        </div>
      )}

      {/* Render based on viewMode */}
      {viewMode === "ring" ? (
        <TokenomicsChartModern />
      ) : (
        <TokenomicsChartHexagon />
      )}
    </div>
  );
};

export default TokenomicsPage;
