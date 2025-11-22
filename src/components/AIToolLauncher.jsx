import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import bitsLogo from '../assets/logo.png';
import BrandLogo from './BrandLogo';
import './AIToolLauncher.css';

const AI_TOOL_ITEMS = [
  {
    id: 'marketing',
    label: 'AI Marketing Suite',
    description: 'Automated campaigns, analytics, and real-time insights.',
    icon: '📈',
    route: '/ai-marketing',
  },
  {
    id: 'crypto',
    label: 'AI Crypto Intelligence',
    description: 'Market predictions and live crypto monitoring.',
    icon: '₿',
    route: '/ai-crypto',
  },
  {
    id: 'portfolio',
    label: 'AI Portfolio Manager',
    description: 'Multi-asset optimization and fast reporting.',
    icon: '🧠',
    route: '/ai-portfolio-standalone',
  },
  {
    id: 'analytics',
    label: 'AI Portfolio Analytics',
    description: 'Advanced neural analytics, simulations, and strategy insights.',
    icon: '📊',
    route: '/ai-portfolio-analytics',
  },
  {
    id: 'accessibility',
    label: 'AI Accessibility Hub',
    description: 'Adaptive settings and personalized recommendations.',
    icon: '♿',
    route: '/accessibility',
  },
];

const AIToolLauncher = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const panelRef = React.useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const togglePanel = () => setIsOpen((prev) => !prev);

  const handleNavigate = (toolRoute) => {
    setIsOpen(false);
    navigate(toolRoute);
  };

  React.useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen || !panelRef.current) return;
    panelRef.current.focus();
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen) {
      setIsOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Hide on DEX demo page
  if (location.pathname === '/dex-demo') {
    return null;
  }

  return (
    <>
      {isOpen && <div className="ai-launcher__backdrop" onClick={() => setIsOpen(false)} />}

      <div className="ai-launcher" data-open={isOpen ? 'true' : 'false'}>
        <button
          type="button"
          className={`ai-launcher__fab ${isOpen ? 'ai-launcher__fab--open' : ''}`}
          onClick={togglePanel}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls="ai-launcher-panel"
        >
          <span className="ai-launcher__icon" aria-hidden="true">
            <img src={bitsLogo} alt="BitsSwapDEX logo" className="ai-launcher__icon-img" />
          </span>
          <span className="ai-launcher__label">
            <span className="ai-launcher__label-main">AI Command</span>
            <span className="ai-launcher__label-sub">Launch Tools</span>
          </span>
        </button>

        <div
          id="ai-launcher-panel"
          className={`ai-launcher__panel ${isOpen ? 'ai-launcher__panel--visible' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-launcher-title"
          ref={panelRef}
          tabIndex={-1}
        >
          <div className="ai-launcher__panel-header">
            <div>
              <BrandLogo
                size="xs"
                className="ai-launcher__brand"
                textClassName="ai-launcher__eyebrow"
              />
              <h3 id="ai-launcher-title">Pick a tool</h3>
            </div>
            <button
              type="button"
              className="ai-launcher__close"
              onClick={() => setIsOpen(false)}
              aria-label="Close AI menu"
            >
              ✕
            </button>
          </div>

          <ul className="ai-launcher__tool-list">
            {AI_TOOL_ITEMS.map((tool) => (
              <li key={tool.id}>
                <button
                  type="button"
                  className="ai-launcher__tool-button"
                  onClick={() => handleNavigate(tool.route)}
                >
                  <span className="ai-launcher__tool-icon" aria-hidden="true">
                    {tool.icon}
                  </span>
                  <span className="ai-launcher__tool-copy">
                    <span className="ai-launcher__tool-name">{tool.label}</span>
                    <span className="ai-launcher__tool-description">{tool.description}</span>
                  </span>
                  <span className="ai-launcher__tool-action" aria-hidden="true">
                    → 
                  </span>
                </button>
              </li>
            ))}
          </ul>

        </div>
      </div>
    </>
  );
};

export default AIToolLauncher;

