import React, { useContext, useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Palette } from "lucide-react";
import WalletContext from "../context/WalletContext";
import SmartTooltip from "../Presale/components/SmartTooltip"; // Import SmartTooltip
import { useAuth } from "../context/AuthContext"; // Auth Context
import { useDEXTheme } from "./DEX_edu_reference/frontend/context/DEXThemeContext";

import { usePresaleState } from "../Presale/Timer/usePresaleState";
import PresaleCountdownMini from "../Presale/Timer/PresaleCountdownMini";
import PresaleLabel from "../Presale/Timer/PresaleLabel";
import HeaderPrice from "./HeaderPrice";
import logo from "../assets/logo.png";
import telegramLogo from "../assets/TLogo.png";
import xLogo from "../assets/XLogo.png";
import youtubeLogo from "../assets/YLogo.png";
import { trackStandardEvent } from "../lib/tiktok";
import { getVisitorIdentity, getSessionId } from "../lib/engagement";
import "./Header.desktop.css";
import "./Header.mobile.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

const GLOBAL_THEME_OPTIONS = [
  { value: "sonnet", label: "Sonnet (UI theme)", color: "#3b82f6" },
  { value: "claude", label: "Claude (UI theme)", color: "#f59e0b" },
  { value: "gemini", label: "Gemini", color: "#8b5cf6" },
];

// The investigator is a separate FastAPI service: keep its host configurable
// and never expose provider credentials in this React bundle.
const CRYPTO_INVESTIGATOR_URL =
  process.env.REACT_APP_CRYPTO_INVESTIGATOR_URL || "https://investigator.bits-ai.io";

const Header = ({ isMenuOpen: externalIsMenuOpen, toggleMenu: externalToggleMenu }) => {
  const { user, isAuthenticated, signOut: contextSignOut } = useAuth(); // Auth state
  const navigate = useNavigate();
  const { theme, setTheme } = useDEXTheme();
  const [themePopoverOpen, setThemePopoverOpen] = useState(false);
  const themePopoverRef = useRef(null);
  
  // Enhanced sign out function with reload
  const handleSignOut = async () => {
    await contextSignOut();
    navigate('/');
    window.location.reload(); // Reload to ensure all state is cleared
  };
  const [internalIsMenuOpen, setInternalIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const activeThemeLabel = GLOBAL_THEME_OPTIONS.find((item) => item.value === theme)?.label || "Sonnet (UI theme)";

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Logică background
      if (currentScrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Use external state if provided, otherwise use local state
  const isMenuOpen = externalIsMenuOpen !== undefined ? externalIsMenuOpen : internalIsMenuOpen;
  const toggleMenu = externalToggleMenu || (() => setInternalIsMenuOpen(!internalIsMenuOpen));

  // Calculam inaltimea header-ului dinamic pentru meniul mobil
  const [headerHeight, setHeaderHeight] = useState('12vh');
  
  useEffect(() => {
     if (isScrolled) setHeaderHeight('100px');
     else setHeaderHeight('140px');
  }, [isScrolled]);

  useEffect(() => {
    if (!themePopoverOpen) return undefined;
    const close = (event) => {
      if (themePopoverRef.current && !themePopoverRef.current.contains(event.target)) {
        setThemePopoverOpen(false);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [themePopoverOpen]);

  const { endTime, isLoaded } = usePresaleState();

  // Close menu on escape key + Add body class
  useEffect(() => {
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
    setThemePopoverOpen(false);
    if (externalToggleMenu && isMenuOpen) externalToggleMenu();
    else setInternalIsMenuOpen(false);
  };

  const themeSwitcher = (
    <div className="ai-trading-theme-switcher global-site-theme-switcher" ref={themePopoverRef}>
      <button
        type="button"
        className="ai-trading-theme-trigger"
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.stopPropagation();
          setThemePopoverOpen((open) => !open);
        }}
        aria-label="Choose display theme"
        aria-expanded={themePopoverOpen}
        aria-haspopup="listbox"
        title="UI color themes (Sonnet, Claude, Gemini)"
      >
        <Palette size={16} aria-hidden="true" />
        <span className="ai-trading-theme-trigger-label">{activeThemeLabel}</span>
      </button>
      {themePopoverOpen && (
        <div className="ai-trading-theme-popover" role="listbox" aria-label="Available themes">
          {GLOBAL_THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={theme === option.value}
              className={`ai-trading-theme-option ${theme === option.value ? "selected" : ""}`}
              onClick={(event) => {
                event.stopPropagation();
                setTheme(option.value);
                setThemePopoverOpen(false);
              }}
            >
              <span className="ai-trading-theme-swatch" style={{ backgroundColor: option.color }} aria-hidden="true" />
              <span className="ai-trading-theme-option-label">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
        {/* Logo */}
        <div className="logo-container">
          <img src={logo} alt="BIT Logo" className="logo" width={60} height={60} />
        </div>

        {/* ✅ Mobile: Timer + Slogan + Social compact */}
        <div className="right-section mobile-only" translate="no">
          {isLoaded && (
            <div className="header-mini-timer" translate="no">
              <PresaleLabel compact={true} />
              <PresaleCountdownMini endTime={endTime} />
              {/* Slogan DIRECT sub timer */}
              <PresaleLabel sloganOnly={true} />
            </div>
          )}
          <div className="social">
            <a 
              href="https://t.me/BitSwapDEX_AI" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="social-link"
              onClick={() => {
                const identity = getVisitorIdentity();
                const sessionId = getSessionId();
              trackStandardEvent('Subscribe', {
                description: 'telegram_click',
                page_path: window.location.pathname || window.location.hash?.replace('#', '') || '/',
                method: 'header_mobile',
                session_id: sessionId,
                is_returning: identity.is_returning,
                distinct_day_count: identity.distinct_day_count,
                days_since_first_seen: identity.days_since_first_seen,
                visit_count: identity.visit_count,
                });
              }}
            >
              <img src={telegramLogo} alt="Telegram" width={24} height={24} />
            </a>
            <a href="https://x.com/BitSwapDEX_AI" target="_blank" rel="noopener noreferrer" className="social-link">
              <img src={xLogo} alt="X (Twitter)" width={24} height={24} />
            </a>
            <a href="https://youtu.be/gvDHYZfwPTI?si=jvd9IoDfuivU-KBZ" target="_blank" rel="noopener noreferrer" className="social-link">
              <img src={youtubeLogo} alt="YouTube" width={24} height={24} />
            </a>
          </div>
          <HeaderPrice />
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
          {themeSwitcher}

          <SmartTooltip content={`Project Orbit\nVisual representation of the BitSwapDEX ecosystem.`}>
            <Link to="/orbit" className="btn-orbit laser-sharp">
              <i className="fas fa-bullseye"></i> Orbit
            </Link>
          </SmartTooltip>
          
          <SmartTooltip content={`Home Dashboard\nYour central command center for all BitSwapDEX features.`}>
            <Link to="/home" className="btn-home laser-sharp">
              <i className="fas fa-home"></i> Home
            </Link>
          </SmartTooltip>
          
          <SmartTooltip content={`Buy $BITS Presale\nJoin the exclusive presale rounds before public listing.\nSecure early entry pricing.`}>
            <Link to="/presale" className="btn-buy laser-sharp">
              <i className="fas fa-dollar-sign"></i> Buy $BITS Presale
            </Link>
          </SmartTooltip>
          
          <SmartTooltip content={`Staking Hub\nEarn passive income by locking your BITS tokens.\nVariable APY based on pool participation.`}>
            <Link to="/staking" className="btn-tokenomics laser-sharp">
              <i className="fas fa-coins"></i> Staking
            </Link>
          </SmartTooltip>
          
          <SmartTooltip content={`Smart Staking\nAI-optimized staking strategies for maximum yield.`}>
            <Link to="/smart-staking" className="btn-smart-staking laser-sharp">
              <i className="fas fa-rocket"></i> Smart Staking
            </Link>
          </SmartTooltip>
          
          <SmartTooltip content={`Paper Trading\nPractice trading strategies without risking real funds.`}>
            <Link to="/paper-trading" className="btn-paper-trading laser-sharp">
              <i className="fas fa-gamepad"></i> Paper Trading
            </Link>
          </SmartTooltip>
          
          <SmartTooltip content={`Whitepaper\nIn-depth technical documentation of the BitSwapDEX protocol.`}>
            <Link to="/whitepaper" className="btn-audit laser-sharp">
              <i className="fas fa-file-alt"></i> Whitepaper
            </Link>
          </SmartTooltip>
          
          {false && (
            <Link to="/reward-dashboard" className="btn-leaderboard laser-sharp">
              <i className="fas fa-chart-line"></i> Rewards Dashboard
            </Link>
          )}
          
          <SmartTooltip content={`BITS Analytics\nReal-time market data, charts, and portfolio analysis.`}>
            <Link to="/bits-analytics" className="btn-bits-analytics laser-sharp">
              <i className="fas fa-chart-bar"></i> BITS Analytics
            </Link>
          </SmartTooltip>
          
          <SmartTooltip content={`Bitcoin Academy\nLearn about Bitcoin and blockchain technology from experts.`}>
            <Link to="/bitcoin-academy" className="btn-bitcoin-academy laser-sharp">
              <i className="fab fa-bitcoin"></i> Bitcoin Academy
            </Link>
          </SmartTooltip>
          
          <SmartTooltip content={`Education Center\nComprehensive guides and tutorials for crypto investing.`}>
            <Link to="/education" className="btn-education laser-sharp">
              <i className="fas fa-graduation-cap"></i> Education
            </Link>
          </SmartTooltip>
          
          <SmartTooltip content={`Contact Support\nGet in touch with our team for assistance or inquiries.`}>
            <Link to="/contact" className="btn-education laser-sharp">
              <i className="fas fa-envelope"></i> Contact
            </Link>
          </SmartTooltip>
          
          <SmartTooltip content={`Proof of Transfer (PoX)\nExplore the unique consensus mechanism powering BitSwapDEX.`}>
            <Link to="/proof-of-transfer" className="btn-pox">
              <i className="fas fa-link"></i> PoX & BitSwapDEX
            </Link>
          </SmartTooltip>
          
          <SmartTooltip content={`Rewards Hub\nClaim your earned bonuses, referral rewards, and airdrops.`}>
            <Link to="/rewards-hub" className="btn-invite">
              <i className="fas fa-star"></i> Rewards Hub
            </Link>
          </SmartTooltip>
          
          <SmartTooltip content={`Neural Investment Optimizer\nClaude 4 AI-powered portfolio management system.`}>
            <Link to="/ai-portfolio-claude4" className="btn-claude4-ai laser-sharp">
              <i className="fas fa-brain"></i> Neural Investment Optimizer
            </Link>
          </SmartTooltip>
          
          <SmartTooltip content={`BITS DEX\nMain BitSwapDEX command app: swap, OTA, account, analytics, and Binance futures tools.`}>
            <Link to="/dex-edu" className="btn-go-main bits-dex-main-cta">
              <i className="fas fa-exchange-alt"></i>
              <span className="bits-dex-main-label">BITS DEX</span>
              <span className="bits-dex-main-badge">MAIN</span>
            </Link>
          </SmartTooltip>
          
          <SmartTooltip content={`AI Utility Hub\nAccess AI-powered tools: Market Oracle, Stress Test, Lie Detector & more.`}>
            <Link to="/ai-hub" className="btn-ai-hub laser-sharp" style={{background: 'linear-gradient(135deg, #00FFA3 0%, #DC1FFF 100%)', color: '#000'}}>
              <i className="fas fa-brain"></i> AI Hub
            </Link>
          </SmartTooltip>

          <SmartTooltip content={`Crypto Investigator\nAnalyse EVM addresses and download a preliminary risk report.`}>
            <a
              href={CRYPTO_INVESTIGATOR_URL}
              className="btn-investigator laser-sharp"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fas fa-magnifying-glass-chart"></i> Investigator
            </a>
          </SmartTooltip>
          
          {isAuthenticated ? (
            <SmartTooltip content={`Sign Out\nLogged in as ${user?.email || 'User'}`}>
              <button className="btn-logout" onClick={handleSignOut}>
                <i className="fas fa-sign-out-alt"></i> Logout
              </button>
            </SmartTooltip>
          ) : (
            <SmartTooltip content={`Login/Register\nAccess exclusive features and AI tools.`}>
              <Link to="/login" className="btn-login laser-sharp">
                <i className="fas fa-user"></i> Login
              </Link>
            </SmartTooltip>
          )}
        </nav>

        {/* ✅ Desktop-only: Timer + Slogan + Social */}
        {!isMenuOpen && (
          <div className="right-section desktop-only" translate="no">
            {isLoaded && (
              <div className="header-mini-timer" translate="no">
                <PresaleLabel compact={true} />
                <PresaleCountdownMini endTime={endTime} />
                {/* Slogan DIRECT sub timer pe desktop */}
                <PresaleLabel sloganOnly={true} />
              </div>
            )}
            <HeaderPrice />
            <div className="social">
              <a 
                href="https://t.me/BitSwapDEX_AI" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-link"
                onClick={() => {
                  const identity = getVisitorIdentity();
                  const sessionId = getSessionId();
                trackStandardEvent('Subscribe', {
                  description: 'telegram_click',
                  page_path: window.location.pathname || window.location.hash?.replace('#', '') || '/',
                  method: 'header',
                  session_id: sessionId,
                  is_returning: identity.is_returning,
                  distinct_day_count: identity.distinct_day_count,
                  days_since_first_seen: identity.days_since_first_seen,
                  visit_count: identity.visit_count,
                  });
                }}
              >
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
          top: headerHeight,
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
              <i className="fas fa-bullseye"></i> <span className="mobile-text">Orbit</span>
            </Link>
            <Link to="/home" className="mobile-btn-home laser-sharp" onClick={closeMenu}>
              <i className="fas fa-home"></i> <span className="mobile-text">Home</span>
            </Link>
            <Link to="/presale" className="mobile-btn-presale laser-sharp" onClick={closeMenu}>
              <i className="fas fa-dollar-sign"></i> <span className="mobile-text">Buy $BITS Presale</span>
            </Link>
            <Link to="/staking" className="mobile-btn-staking laser-sharp" onClick={closeMenu}>
              <i className="fas fa-coins"></i> <span className="mobile-text">Staking</span>
            </Link>
            <Link to="/smart-staking" className="mobile-btn-smart laser-sharp" onClick={closeMenu}>
              <i className="fas fa-rocket"></i> <span className="mobile-text">Smart Staking</span>
            </Link>
            <Link to="/paper-trading" className="mobile-btn-paper laser-sharp" onClick={closeMenu}>
              <i className="fas fa-gamepad"></i> <span className="mobile-text">Paper Trading</span>
            </Link>
            <Link to="/whitepaper" className="mobile-btn-whitepaper laser-sharp" onClick={closeMenu}>
              <i className="fas fa-file-alt"></i> <span className="mobile-text">Whitepaper</span>
            </Link>
            <Link to="/bits-analytics" className="mobile-btn-analytics laser-sharp" onClick={closeMenu}>
              <i className="fas fa-chart-bar"></i> <span className="mobile-text">BITS Analytics</span>
            </Link>
            <Link to="/bitcoin-academy" className="mobile-btn-bitcoin laser-sharp" onClick={closeMenu}>
              <i className="fab fa-bitcoin"></i> <span className="mobile-text">Bitcoin Academy</span>
            </Link>
            <Link to="/education" className="mobile-btn-education laser-sharp" onClick={closeMenu}>
              <i className="fas fa-graduation-cap"></i> <span className="mobile-text">Education</span>
            </Link>
            <Link to="/contact" className="mobile-btn-contact laser-sharp" onClick={closeMenu}>
              <i className="fas fa-envelope"></i> <span className="mobile-text">Contact</span>
            </Link>
            <Link to="/proof-of-transfer" className="mobile-btn-pox" onClick={closeMenu}>
              <i className="fas fa-link"></i> <span className="mobile-text">PoX & BitSwapDEX</span>
            </Link>
            <Link to="/rewards-hub" className="mobile-btn-rewards" onClick={closeMenu}>
              <i className="fas fa-star"></i> <span className="mobile-text">Rewards Hub</span>
            </Link>
            <Link to="/ai-portfolio-claude4" className="mobile-btn-ai laser-sharp" onClick={closeMenu}>
              <i className="fas fa-brain"></i> <span className="mobile-text">Neural Investment Optimizer</span>
            </Link>
            <button className="mobile-btn-ai mobile-btn-bits-dex" onClick={() => { closeMenu(); navigate("/dex-edu"); }}>
              <i className="fas fa-exchange-alt"></i> <span className="mobile-text">BITS DEX</span>
            </button>
            <Link to="/ai-hub" className="mobile-btn-ai-hub laser-sharp" onClick={closeMenu} style={{background: 'linear-gradient(135deg, #00FFA3 0%, #DC1FFF 100%)', color: '#000'}}>
              <i className="fas fa-brain"></i> <span className="mobile-text">AI Hub</span>
            </Link>
            <a
              href={CRYPTO_INVESTIGATOR_URL}
              className="mobile-btn-investigator laser-sharp"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
            >
              <i className="fas fa-magnifying-glass-chart"></i> <span className="mobile-text">Investigator</span>
            </a>
            {isAuthenticated ? (
              <button className="mobile-btn-logout" onClick={() => { closeMenu(); handleSignOut(); }} style={{background: 'rgba(255, 50, 50, 0.2)', border: '1px solid rgba(255, 50, 50, 0.5)'}}>
                <i className="fas fa-sign-out-alt"></i> <span className="mobile-text">Logout</span>
              </button>
            ) : (
              <Link to="/login" className="mobile-btn-login laser-sharp" onClick={closeMenu} style={{background: 'rgba(0, 255, 163, 0.2)', border: '1px solid rgba(0, 255, 163, 0.5)'}}>
                <i className="fas fa-user"></i> <span className="mobile-text">Login</span>
              </Link>
            )}
          </nav>
        </div>
      )}
    </>
  );
};

export default Header;
