import React from "react";
import useCellManagerData from "../Presale/hooks/useCellManagerData";
import "./HeaderPrice.css";
import "./HeaderPrice.mobile.css";

const HeaderPrice = () => {
  const { currentPrice } = useCellManagerData();

  // Default price fallback if 0 or null
  // Dacă currentPrice este 0, afișăm 0.006 ca fallback vizual (preț start presale)
  const displayPrice = currentPrice > 0 ? currentPrice : 0.006;

  return (
    <div className="header-price-display">
      <span className="price-label">1 BITS = </span>
      <span className="price-value">${displayPrice}</span>
    </div>
  );
};

export default HeaderPrice;

