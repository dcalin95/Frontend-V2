import React from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import './AIStandaloneLayout.css';

const AIStandaloneLayout = ({
  title,
  description,
  eyebrow = 'BitSwapDEX AI',
  children,
  actions,
}) => {
  const navigate = useNavigate();

  const handleBackHome = () => navigate('/');
  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="ai-standalone">
      <div className="ai-standalone__nav">
        <button
          type="button"
          className="ai-standalone__control ai-standalone__control--primary"
          onClick={handleBackHome}
        >
          ← Back to Home
        </button>
        <div className="ai-standalone__nav-actions">
          <button
            type="button"
            className="ai-standalone__control ai-standalone__control--neutral"
            onClick={() => window.location.reload()}
            title="Refresh view"
          >
            🔄 Refresh
          </button>
          <button
            type="button"
            className="ai-standalone__control ai-standalone__control--danger"
            onClick={handleClose}
          >
            ✕ Close
          </button>
        </div>
      </div>

      <main className="ai-standalone__body">
        <header className="ai-standalone__header">
          {eyebrow && (
            <BrandLogo
              size="sm"
              text={eyebrow}
              className="ai-standalone__brand"
              textClassName="ai-standalone__eyebrow"
            />
          )}
          <h1 className="ai-standalone__title">{title}</h1>
          {description && (
            <p className="ai-standalone__description">{description}</p>
          )}
          {actions && (
            <div className="ai-standalone__actions">{actions}</div>
          )}
        </header>

        <section className="ai-standalone__content">
          {children}
        </section>
      </main>
    </div>
  );
};

export default AIStandaloneLayout;

