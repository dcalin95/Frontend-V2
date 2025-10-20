import React from "react";
import "./HamburgerButton.css";

const HamburgerButton = ({ isMenuOpen, toggleMenu }) => {
  return (
    <button
      className={`ai-animated-hamburger ${isMenuOpen ? "open" : ""}`}
      onClick={toggleMenu}
      aria-label="Toggle Sidebar"
    >
      <span className="ai-hamburger-icon">
        {isMenuOpen ? "✕" : "≡"}
      </span>
    </button>
  );
};

export default HamburgerButton;
