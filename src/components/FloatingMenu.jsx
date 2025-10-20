import React, { useState, useEffect } from 'react';
import MarketingDashboard from './MarketingDashboard';
import CryptoAnalyticsDashboard from './CryptoAnalyticsDashboard';
import './FloatingMenu.css';

const FloatingMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState(null); // 'marketing', 'crypto', 'portfolio', 'accessibility'

  // ESC key pentru închiderea overlay-urilor
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && activeOverlay) {
        setActiveOverlay(null);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [activeOverlay]);

  // Previne scroll-ul pe body când overlay-ul este activ
  useEffect(() => {
    if (activeOverlay) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [activeOverlay]);

  const openOverlay = (overlayType) => {
    setActiveOverlay(overlayType);
    setIsOpen(false); // Închide modal-ul cu butoane
  };

  const closeOverlay = () => {
    setActiveOverlay(null);
  };

  const menuItems = [
    { 
      id: 'marketing', 
      label: 'AI Marketing', 
      icon: '📈', 
      action: () => openOverlay('marketing')
    },
    { 
      id: 'crypto', 
      label: 'AI Crypto', 
      icon: '₿', 
      action: () => openOverlay('crypto')
    },
    { 
      id: 'portfolio', 
      label: 'AI Portfolio', 
      icon: '🧠', 
      action: () => openOverlay('portfolio')
    },
    { 
      id: 'accessibility', 
      label: 'Accessibility', 
      icon: '♿', 
      action: () => openOverlay('accessibility')
    }
  ];

  return (
    <>
      {/* Butonul Hamburger - rămâne în partea de jos-dreapta */}
      <div className="floating-menu">
        <button 
          className={`hamburger-btn ${isOpen ? 'open' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Modal separat - apare peste tot conținutul */}
      {isOpen && (
        <div className="floating-menu-modal">
          {/* Overlay semi-transparent */}
          <div 
            className="modal-overlay" 
            onClick={() => setIsOpen(false)}
          ></div>
          
          {/* Container modal centrat */}
          <div className="modal-container">
            <div className="modal-header">
              <h3>🚀 AI Tools</h3>
              <button 
                className="modal-close"
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-menu-items">
              {menuItems.map((item, index) => (
                <button
                  key={item.id}
                  className="modal-menu-item"
                  onClick={item.action}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <span className="menu-icon">{item.icon}</span>
                  <span className="menu-label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== OVERLAY SYSTEM - COMPLET REFACTORIZAT ===== */}
      {activeOverlay && (
        <div className="floating-overlay-system">
          {/* Backdrop semi-transparent cu Header/Sidebar vizibile pe fundal */}
          <div 
            className="overlay-backdrop" 
            onClick={closeOverlay}
          ></div>
          
          {/* Container overlay full-screen */}
          <div className="overlay-container">
            {/* Header overlay cu titlu și buton închidere */}
            <div className="overlay-header">
              <h2 className="overlay-title">
                {activeOverlay === 'marketing' && '📈 AI Marketing Intelligence'}
                {activeOverlay === 'crypto' && '₿ AI Crypto Analytics'}
                {activeOverlay === 'portfolio' && '🧠 AI Portfolio Manager'}
                {activeOverlay === 'accessibility' && '♿ Accessibility Panel'}
              </h2>
              <button 
                className="overlay-close" 
                onClick={closeOverlay}
                title="Închide (ESC)"
              >
                ✕
              </button>
            </div>
            
            {/* Content overlay */}
            <div className="overlay-content">
              {activeOverlay === 'marketing' && (
                <MarketingDashboard standalone={true} />
              )}
              {activeOverlay === 'crypto' && (
                <CryptoAnalyticsDashboard standalone={true} />
              )}
              {activeOverlay === 'portfolio' && (
                <div className="portfolio-overlay-content">
                  <div className="portfolio-placeholder">
                    <h3>🧠 AI Portfolio Manager</h3>
                    <p>Portfolio management system will be implemented here.</p>
                    <div className="portfolio-features">
                      <div className="feature-card">
                        <h4>📊 Analytics</h4>
                        <p>Real-time portfolio analytics</p>
                      </div>
                      <div className="feature-card">
                        <h4>🤖 AI Insights</h4>
                        <p>AI-powered investment recommendations</p>
                      </div>
                      <div className="feature-card">
                        <h4>📈 Performance</h4>
                        <p>Portfolio performance tracking</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeOverlay === 'accessibility' && (
                <div className="accessibility-overlay-content">
                  <div className="accessibility-placeholder">
                    <h3>♿ Accessibility Panel</h3>
                    <p>Accessibility features and settings will be implemented here.</p>
                    <div className="accessibility-features">
                      <div className="feature-card">
                        <h4>🔍 Visual</h4>
                        <p>Font size, contrast, colors</p>
                      </div>
                      <div className="feature-card">
                        <h4>🔊 Audio</h4>
                        <p>Screen reader, audio cues</p>
                      </div>
                      <div className="feature-card">
                        <h4>⌨️ Navigation</h4>
                        <p>Keyboard navigation, shortcuts</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingMenu;
