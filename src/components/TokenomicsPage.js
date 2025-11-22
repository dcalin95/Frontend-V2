import React, { useState } from "react";
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

  return (
    <div className="tokenomics-page">
      {/* Toggle Button - doar dacă showToggle = true */}
      {showToggle && (
        <div className="tokenomics-controls" style={{
          position: 'fixed',
          top: '100px',
          right: '320px',
          zIndex: 990,
          display: 'flex',
          gap: '1rem',
          alignItems: 'center'
        }}>
          <button 
            className="tokenomics-toggle"
            onClick={() => setViewMode(viewMode === "ring" ? "hexagon" : "ring")}
            style={{ position: 'static' }} // Override fixed pos from css
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
