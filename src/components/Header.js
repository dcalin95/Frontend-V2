import React, { useContext, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import WalletContext from "../context/WalletContext";

import { usePresaleState } from "../Presale/Timer/usePresaleState";
import PresaleCountdownMini from "../Presale/Timer/PresaleCountdownMini";

import logo from "../assets/logo.png";
import telegramLogo from "../assets/TLogo.png";
import xLogo from "../assets/XLogo.png";
import youtubeLogo from "../assets/YLogo.png";
import "./Header.css";
import "./Header.mobile.css"; // ✅ stiluri speciale pt mobil
import "@fortawesome/fontawesome-free/css/all.min.css";

const Header = ({ isMenuOpen: externalIsMenuOpen, toggleMenu: externalToggleMenu }) => {
  const { walletAddress, disconnectWallet } = useContext(WalletContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [internalIsMenuOpen, setInternalIsMenuOpen] = useState(false);

  // Use external state if provided, otherwise use local state
  const isMenuOpen = externalIsMenuOpen !== undefined ? externalIsMenuOpen : internalIsMenuOpen;
  const toggleMenu = externalToggleMenu || (() => setInternalIsMenuOpen(!internalIsMenuOpen));

  const { endTime, isLoaded } = usePresaleState();

  // Close menu on outside click or escape key + Add body class
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.header') && !event.target.closest('.mobile-nav-menu')) {
        if (externalToggleMenu) {
           // If managed externally and clicking outside header, parent handles it?
           // But parent doesn't know about clicks here. 
           // We should check if we are clicking the hamburger.
        }
        // Simplification: Just close if clicking outside header/menu
        // But we must not close if clicking the hamburger itself (handled by toggle)
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isMenuOpen) {
        // Close menu
        if (externalToggleMenu) externalToggleMenu();
        else setInternalIsMenuOpen(false);
      }
    };

    // Add/remove body class for mobile menu
    if (isMenuOpen) {
      document.body.classList.add('mobile-menu-open');
      document.addEventListener('keydown', handleEscapeKey);
    } else {
      document.body.classList.remove('mobile-menu-open');
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.classList.remove('mobile-menu-open');
    };
  }, [isMenuOpen, externalToggleMenu]);

  const closeMenu = () => {
    if (externalToggleMenu && isMenuOpen) externalToggleMenu();
    else setInternalIsMenuOpen(false);
  };

  return (
    <>
      <header className="header">
        {/* Logo */}
        <div className="logo-container">
          <img src={logo} alt="BIT Logo" className="logo" width={60} height={60} />
        </div>

        {/* ✅ Mobile: Timer + Social compact */}
        <div className="right-section mobile-only" translate="no">
          {isLoaded && (
            <div className="header-mini-timer" translate="no">
              <span className="timer-label" translate="no">$BITS Presale</span>
              <PresaleCountdownMini endTime={endTime} />
            </div>
          )}
          <div className="social">
            <a href="https://t.me/BitSwapDEX_AI/" target="_blank" rel="noopener noreferrer" className="social-link">
              <img src={telegramLogo} alt="Telegram" width={24} height={24} />
            </a>
            <a href="https://x.com/BitSwapDEX_AI" target="_blank" rel="noopener noreferrer" className="social-link">
              <img src={xLogo} alt="X (Twitter)" width={24} height={24} />
            </a>
            <a href="https://youtu.be/gvDHYZfwPTI?si=jvd9IoDfuivU-KBZ" target="_blank" rel="noopener noreferrer" className="social-link">
              <img src={youtubeLogo} alt="YouTube" width={24} height={24} />
            </a>
          </div>
        </div>

        {/* Mobile Hamburger Button - DOAR PE MOBILE - Gemini 3 King Style */}
        <div className="mobile-hamburger-container">
          <button
            className={`mobile-hamburger ${isMenuOpen ? "open" : ""}`}
            onClick={toggleMenu}
            aria-label="Toggle navigation menu"
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(20, 241, 149, 0.3)',
              borderRadius: '12px',
              padding: '5px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              boxShadow: isMenuOpen ? '0 0 15px rgba(20, 241, 149, 0.5)' : 'none',
              transition: 'all 0.3s ease'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="headerHamGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#14f195" />
                  <stop offset="100%" stopColor="#9945ff" />
                </linearGradient>
              </defs>
              {isMenuOpen ? (
                <path d="M18 6L6 18M6 6L18 18" stroke="url(#headerHamGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              ) : (
                <path d="M4 12H20M4 6H20M4 18H20" stroke="url(#headerHamGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              )}
            </svg>
          </button>
        </div>

        {/* ✅ Desktop Navigation - DOAR PE DESKTOP */}
        <nav className="navigation desktop-only">
          <Link to="/orbit" className="btn-home laser-sharp">
            <i className="fas fa-bullseye"></i> Orbit
          </Link>
          <Link to="/home" className="btn-home laser-sharp">
            <i className="fas fa-home"></i> Home
          </Link>
          <Link to="/presale" className="btn-buy laser-sharp">
            <i className="fas fa-dollar-sign"></i> Buy $BITS Presale
          </Link>
          <Link to="/staking" className="btn-tokenomics laser-sharp">
            <i className="fas fa-coins"></i> Staking
          </Link>
          <Link to="/smart-staking" className="btn-smart-staking laser-sharp">
            <i className="fas fa-rocket"></i> Smart Staking
          </Link>
          <Link to="/paper-trading" className="btn-paper-trading laser-sharp">
            <i className="fas fa-gamepad"></i> Paper Trading
          </Link>
          <Link to="/whitepaper" className="btn-audit laser-sharp">
            <i className="fas fa-file-alt"></i> Whitepaper
          </Link>
          {false && (
            <Link to="/reward-dashboard" className="btn-leaderboard laser-sharp">
              <i className="fas fa-chart-line"></i> Rewards Dashboard
            </Link>
          )}
          <Link to="/bits-analytics" className="btn-bits-analytics laser-sharp">
            <i className="fas fa-chart-bar"></i> BITS Analytics
          </Link>
          <Link to="/bitcoin-academy" className="btn-bitcoin-academy laser-sharp">
            <i className="fab fa-bitcoin"></i> Bitcoin Academy
          </Link>
          <Link to="/education" className="btn-education laser-sharp">
            <i className="fas fa-graduation-cap"></i> Education
          </Link>
          <Link to="/contact" className="btn-education laser-sharp">
            <i className="fas fa-envelope"></i> Contact
          </Link>
          <Link to="/proof-of-transfer" className="btn-pox">
            <i className="fas fa-link"></i> PoX & BitSwapDEX
          </Link>
          <Link to="/rewards-hub" className="btn-invite">
            <i className="fas fa-star"></i> Rewards Hub
          </Link>
          <Link to="/ai-portfolio-claude4" className="btn-claude4-ai laser-sharp">
            <i className="fas fa-brain"></i> Neural Investment Optimizer
          </Link>
          <button className="btn-go-main" onClick={() => navigate("/ai-assistant")}>
            <i className="fas fa-robot"></i> AI BitSwapDEX
          </button>
        </nav>

        {/* ✅ Desktop-only: Timer + Social */}
        {!isMenuOpen && (
          <div className="right-section desktop-only" translate="no">
            {isLoaded && (
              <div className="header-mini-timer" translate="no">
                <span className="timer-label" translate="no">$BITS Presale - Before Price Increase</span>
                <PresaleCountdownMini endTime={endTime} />
              </div>
            )}
            <div className="social">
              <a href="https://t.me/BitSwapDEX_AI/" target="_blank" rel="noopener noreferrer" className="social-link">
                <img src={telegramLogo} alt="Telegram" width={24} height={24} />
              </a>
              <a href="https://x.com/BitSwapDEX_AI" target="_blank" rel="noopener noreferrer" className="social-link">
                <img src={xLogo} alt="X (Twitter)" width={24} height={24} />
              </a>
              <a href="https://youtu.be/gvDHYZfwPTI?si=jvd9IoDfuivU-KBZ" target="_blank" rel="noopener noreferrer" className="social-link">
                <img src={youtubeLogo} alt="YouTube" width={24} height={24} />
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div style={{ 
          position: 'fixed',
          top: '70px',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          background: 'rgba(0,0,0,0.95)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingTop: '50px'
        }}>
          <nav className="mobile-nav-menu" style={{ 
             display: 'grid', 
             gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', 
             gap: '10px', 
             background: 'transparent', 
             padding: '10px 15px' 
          }}>
            <Link to="/orbit" className="mobile-btn-orbit laser-sharp" onClick={closeMenu}>
              <i className="fas fa-bullseye"></i> Orbit
            </Link>
            <Link to="/home" className="mobile-btn-home laser-sharp" onClick={closeMenu}>
              <i className="fas fa-home"></i> Home
            </Link>
            <Link to="/presale" className="mobile-btn-presale laser-sharp" onClick={closeMenu}>
              <i className="fas fa-dollar-sign"></i> Buy $BITS Presale
            </Link>
            <Link to="/staking" className="mobile-btn-staking laser-sharp" onClick={closeMenu}>
              <i className="fas fa-coins"></i> Staking
            </Link>
            <Link to="/smart-staking" className="mobile-btn-smart laser-sharp" onClick={closeMenu}>
              <i className="fas fa-rocket"></i> Smart Staking
            </Link>
            <Link to="/paper-trading" className="mobile-btn-paper laser-sharp" onClick={closeMenu}>
              <i className="fas fa-gamepad"></i> Paper Trading
            </Link>
            <Link to="/whitepaper" className="laser-sharp" onClick={closeMenu}>
              <i className="fas fa-file-alt"></i> Whitepaper
            </Link>
            <Link to="/bits-analytics" className="mobile-btn-analytics laser-sharp" onClick={closeMenu}>
              <i className="fas fa-chart-bar"></i> BITS Analytics
            </Link>
            <Link to="/bitcoin-academy" onClick={closeMenu}>
              <i className="fab fa-bitcoin"></i> Bitcoin Academy
            </Link>
            <Link to="/education" onClick={closeMenu}>
              <i className="fas fa-graduation-cap"></i> Education
            </Link>
            <Link to="/contact" className="laser-sharp" onClick={closeMenu}>
              <i className="fas fa-envelope"></i> Contact
            </Link>
            <Link to="/proof-of-transfer" onClick={closeMenu}>
              <i className="fas fa-link"></i> PoX & BitSwapDEX
            </Link>
            <Link to="/rewards-hub" className="mobile-btn-rewards" onClick={closeMenu}>
              <i className="fas fa-star"></i> Rewards Hub
            </Link>
            <Link to="/ai-portfolio-claude4" className="mobile-btn-ai laser-sharp" onClick={closeMenu}>
              <i className="fas fa-brain"></i> Neural Investment Optimizer
            </Link>
            <button className="mobile-btn-ai" onClick={() => { closeMenu(); navigate("/ai-assistant"); }}>
              <i className="fas fa-robot"></i> AI BitSwapDEX
            </button>
          </nav>
        </div>
      )}
    </>
  );
};

export default Header;
