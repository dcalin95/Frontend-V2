import React, { useState } from 'react';
import BrandLogo from './BrandLogo';
import './AccessibilityPanel.css';

const FONT_OPTIONS = ['Small', 'Normal', 'Large', 'XL'];
const SPACING_OPTIONS = ['Compact', 'Normal', 'Relaxed'];
const CONTRAST_OPTIONS = ['Default', 'High contrast', 'Night mode'];

const QUICK_ACTIONS = [
  { icon: '🌓', title: 'Dark mode', description: 'Reduce glare for low-light environments.' },
  { icon: '📖', title: 'Reading focus', description: 'Highlight paragraph currently in view.' },
  { icon: '🔁', title: 'Motion reduce', description: 'Limit background animations and parallax.' },
];

const AccessibilityPanel = () => {
  const [selectedFont, setSelectedFont] = useState('Normal');
  const [selectedSpacing, setSelectedSpacing] = useState('Normal');
  const [selectedContrast, setSelectedContrast] = useState('Default');
  const [motionReduced, setMotionReduced] = useState(false);
  const [voiceAssistance, setVoiceAssistance] = useState(false);

  return (
    <div className="accessibility-dashboard-page">
      <header className="accessibility-dashboard-page__header">
        <div>
          <BrandLogo
            size="sm"
            className="accessibility-dashboard-brand"
            textClassName="eyebrow"
          />
          <h1 className="title">AI Accessibility Hub</h1>
          <p className="subtitle">
            Adaptive interface controls, personalized reading modes, and assistive tooling built for the BitSwap
            experience.
          </p>
        </div>
      </header>

      <section className="panel ai-surface">
        <header className="panel__header">
          <h2>Typography</h2>
          <span className="panel__tag">Live preview</span>
        </header>
        <div className="option-grid">
          <div>
            <span className="label">Font size</span>
            <div className="option-group">
              {FONT_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`option-button ${selectedFont === option ? 'is-active' : ''}`}
                  onClick={() => setSelectedFont(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="label">Spacing</span>
            <div className="option-group">
              {SPACING_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`option-button ${selectedSpacing === option ? 'is-active' : ''}`}
                  onClick={() => setSelectedSpacing(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
        <article className="preview-card">
          <h3>Preview</h3>
          <p>
            <BrandLogo size="xs" className="accessibility-inline-brand" /> adapts to your preferences in real time. Use the
            controls above to discover the combination that feels best for you.
          </p>
        </article>
      </section>

      <section className="panel ai-surface">
        <header className="panel__header">
          <h2>Theme & contrast</h2>
        </header>
        <div className="option-group option-group--contrast">
          {CONTRAST_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={`option-button ${selectedContrast === option ? 'is-active' : ''}`}
              onClick={() => setSelectedContrast(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="toggle-group">
          <label className="toggle">
            <input
              type="checkbox"
              checked={motionReduced}
              onChange={(event) => setMotionReduced(event.target.checked)}
            />
            <span className="toggle-label">Reduce motion effects</span>
            <span className="toggle-hint">Disables subtle background animations and transitions.</span>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={voiceAssistance}
              onChange={(event) => setVoiceAssistance(event.target.checked)}
            />
            <span className="toggle-label">Enable voice assistance</span>
            <span className="toggle-hint">Narrate key interface elements when navigating.</span>
          </label>
        </div>
      </section>

      <section className="panel ai-surface quick-actions">
        <header className="panel__header">
          <h2>Quick actions</h2>
          <span className="panel__tag">AI suggestions</span>
        </header>
        <div className="action-grid">
          {QUICK_ACTIONS.map((action) => (
            <article key={action.title} className="action-card">
              <header>
                <span className="action-icon">{action.icon}</span>
                <strong>{action.title}</strong>
              </header>
              <p>{action.description}</p>
              <footer>
                <button type="button" className="ghost-button">
                  Apply
                </button>
              </footer>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AccessibilityPanel;

