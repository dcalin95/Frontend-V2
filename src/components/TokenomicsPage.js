import React, { useState } from "react";
import TokenomicsChartModern from "./TokenomicsChartModern";
import TokenomicsChartHexagon from "./TokenomicsChartHexagon";
import "./TokenomicsPage.css";

const TokenomicsPage = () => {
  const [viewMode, setViewMode] = useState("ring"); // "ring" or "hexagon"

  return (
    <div className="tokenomics-page">
      {/* Toggle Button */}
      <button 
        className="tokenomics-toggle"
        onClick={() => setViewMode(viewMode === "ring" ? "hexagon" : "ring")}
      >
        {viewMode === "ring" ? "Switch to Hexagon View" : "Switch to Ring View"}
      </button>

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
