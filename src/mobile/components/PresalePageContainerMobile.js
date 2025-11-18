import React from "react";
import PresalePage from "../../Presale/PresalePage";
import "./PresalePageContainerMobile.css";

/**
 * MOBILE WRAPPER pentru PresalePage
 * - Folosește ACEEAȘI LOGICĂ ca desktop (PresalePage)
 * - CSS dedicat pentru afișare mobilă (fără containere nested)
 * - Layout simplificat, vertical, full-width
 */
const PresalePageContainerMobile = () => {
  return (
    <div className="presale-mobile-container">
      <PresalePage />
    </div>
  );
};

export default PresalePageContainerMobile;

