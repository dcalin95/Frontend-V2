import React from "react";
import "./HamburgerButton.css";
import "./HamburgerButton.mobile.css";

const HamburgerButton = ({ isMenuOpen, toggleMenu }) => {
  return (
    <button
      className={`sidebar-toggle-button ${isMenuOpen ? "open" : ""}`}
      onClick={toggleMenu}
      aria-label={isMenuOpen ? "Close Menu" : "Open Menu"}
    >
      {/* Grid Icon pentru Sidebar - diferit de hamburger-ul din Header */}
      <div className="sidebar-icon">
        {isMenuOpen ? (
          // X icon când e deschis
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          // Grid/Apps icon când e închis
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="7" height="7" rx="1"></rect>
            <rect x="14" y="3" width="7" height="7" rx="1"></rect>
            <rect x="3" y="14" width="7" height="7" rx="1"></rect>
            <rect x="14" y="14" width="7" height="7" rx="1"></rect>
          </svg>
        )}
      </div>
    </button>
  );
};

export default HamburgerButton;
