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

const Header = () => {
  const { walletAddress, disconnectWallet } = useContext(WalletContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { endTime, isLoaded } = usePresaleState();

  // Close menu on outside click or escape key + Add body class
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.header')) {
        setIsMenuOpen(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    // Add/remove body class for mobile menu
    if (isMenuOpen) {
      document.body.classList.add('mobile-menu-open');
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    } else {
      document.body.classList.remove('mobile-menu-open');
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.classList.remove('mobile-menu-open');
    };
  }, [isMenuOpen]);

  return (
    <>
      <header className="header">
        {/* Logo */}
        <div className="logo-container">
          <img src={logo} alt="BIT Logo" className="logo" />
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
            <a
              href="https://t.me/BitSwapDEX_AI/"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link"
            >
              <img src={telegramLogo} alt="Telegram" />
            </a>
            <a
              href="https://x.com/BitSwapDEX_AI"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link"
            >
              <img src={xLogo} alt="X (Twitter)" />
            </a>
            <a
              href="https://youtu.be/gvDHYZfwPTI?si=jvd9IoDfuivU-KBZ"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link"
            >
              <img src={youtubeLogo} alt="YouTube" />
            </a>
          </div>
        </div>

        {/* Mobile Hamburger Button - DOAR PE MOBILE */}
        <div className="mobile-hamburger-container">
          <button
            className={`mobile-hamburger ${isMenuOpen ? "open" : ""}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {/* ✅ Desktop Navigation - DOAR PE DESKTOP */}
        <nav className="navigation desktop-only">
        <Link to="/" className="btn-home laser-sharp">
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
            <a
              href="https://t.me/BitSwapDEX_AI/"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link"
            >
              <img src={telegramLogo} alt="Telegram" />
            </a>
            <a
              href="https://x.com/BitSwapDEX_AI"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link"
            >
              <img src={xLogo} alt="X (Twitter)" />
            </a>
            <a
              href="https://youtu.be/gvDHYZfwPTI?si=jvd9IoDfuivU-KBZ"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link"
            >
              <img src={youtubeLogo} alt="YouTube" />
            </a>
          </div>
        </div>
      )}
      </header>

      {/* Mobile Navigation Menu - în fluxul paginii pentru a împinge conținutul */}
      {isMenuOpen && (
        <nav className="mobile-nav-menu">
          <Link to="/" className="laser-sharp" onClick={() => setIsMenuOpen(false)}>
            <i className="fas fa-bullseye"></i> Orbit
          </Link>
          <Link to="/home" className="laser-sharp" onClick={() => setIsMenuOpen(false)}>
            <i className="fas fa-home"></i> Home
          </Link>
          <Link to="/presale" className="laser-sharp" onClick={() => setIsMenuOpen(false)}>
            <i className="fas fa-dollar-sign"></i> Buy $BITS Presale
          </Link>
          <Link to="/staking" className="laser-sharp" onClick={() => setIsMenuOpen(false)}>
            <i className="fas fa-coins"></i> Staking
          </Link>
          <Link to="/smart-staking" className="laser-sharp" onClick={() => setIsMenuOpen(false)}>
            <i className="fas fa-rocket"></i> Smart Staking
          </Link>
          <Link to="/paper-trading" className="laser-sharp" onClick={() => setIsMenuOpen(false)}>
            <i className="fas fa-gamepad"></i> Paper Trading
          </Link>
          <Link to="/whitepaper" className="laser-sharp" onClick={() => setIsMenuOpen(false)}>
            <i className="fas fa-file-alt"></i> Whitepaper
          </Link>
          {false && (
            <Link to="/reward-dashboard" className="laser-sharp" onClick={() => setIsMenuOpen(false)}>
              <i className="fas fa-chart-line"></i> Rewards Dashboard
            </Link>
          )}
          <Link to="/bits-analytics" className="laser-sharp" onClick={() => setIsMenuOpen(false)}>
            <i className="fas fa-chart-bar"></i> BITS Analytics
          </Link>
          <Link to="/bitcoin-academy" onClick={() => setIsMenuOpen(false)}>
            <i className="fab fa-bitcoin"></i> Bitcoin Academy
          </Link>
          <Link to="/education" onClick={() => setIsMenuOpen(false)}>
            <i className="fas fa-graduation-cap"></i> Education
          </Link>
          <Link to="/contact" className="laser-sharp" onClick={() => setIsMenuOpen(false)}>
            <i className="fas fa-envelope"></i> Contact
          </Link>
          <Link to="/proof-of-transfer" onClick={() => setIsMenuOpen(false)}>
            <i className="fas fa-link"></i> PoX & BitSwapDEX
          </Link>
          <Link to="/rewards-hub" onClick={() => setIsMenuOpen(false)}>
            <i className="fas fa-star"></i> Rewards Hub
          </Link>
          <Link to="/ai-portfolio-claude4" className="laser-sharp" onClick={() => setIsMenuOpen(false)}>
            <i className="fas fa-brain"></i> Neural Investment Optimizer
          </Link>
          <button onClick={() => { setIsMenuOpen(false); navigate("/ai-assistant"); }}>
            <i className="fas fa-robot"></i> AI BitSwapDEX
          </button>
        </nav>
      )}
    </>
  );
};

export default Header;
