import React, { useState } from "react";
import TokenomicsChartModern from "./TokenomicsChartModern";
import TokenomicsChartHexagon from "./TokenomicsChartHexagon";
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
        <button 
          className="tokenomics-toggle"
          onClick={() => setViewMode(viewMode === "ring" ? "hexagon" : "ring")}
        >
          {viewMode === "ring" ? "Switch to Hexagon View" : "Switch to Ring View"}
        </button>
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
