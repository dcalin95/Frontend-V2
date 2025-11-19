import React from "react";
import "./HamburgerButton.css";

const HamburgerButton = ({ isMenuOpen, toggleMenu }) => {
  return (
    <button
      className={`ai-animated-hamburger ${isMenuOpen ? "open" : ""}`}
      onClick={toggleMenu}
      aria-label={isMenuOpen ? "Close Menu" : "Open Menu"}
    >
      <div className="hamburger-lines">
        <span className="line line1"></span>
        <span className="line line2"></span>
        <span className="line line3"></span>
      </div>
    </button>
  );
};

export default HamburgerButton;
