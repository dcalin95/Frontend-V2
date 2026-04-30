/**
 * 🔒 OTAPreviewGate Component - Preview Mode Wrapper
 * 
 * Component wrapper pentru afișare preview mode:
 * - Afișează conținut demo/preview pentru utilizatori neînregistrați
 * - Afișează CTA pentru înregistrare
 * - Permite acces complet pentru utilizatori înregistrați
 * 
 * @module OTAPreviewGate
 */

import React from 'react';
import { Lock, ArrowRight, Sparkles, CheckCircle } from 'lucide-react';
import { useOTAAccess } from '../../hooks/useOTAAccess';
import { useNavigate } from 'react-router-dom';
import OTALogo from '../ai-trading/OTALogo';
import '../../styles/components/ota-preview-gate.css';

const OTAPreviewGate = ({ 
  children, 
  previewContent, 
  title = 'Access Restricted',
  description,
  showCTA = true,
  className = ''
}) => {
  const { isPreviewMode, hasFullAccess, getRegistrationCTA, accessLevel } = useOTAAccess();
  const navigate = useNavigate();
  const cta = getRegistrationCTA();

  // Full access - render children directly
  if (hasFullAccess) {
    return <>{children}</>;
  }

  // Preview mode - show preview with CTA
  return (
    <div className={`ota-preview-gate ${className}`}>
      {/* Preview Content Overlay */}
      <div className="ota-preview-gate-overlay">
        <div className="ota-preview-gate-content">
          {/* Preview Badge */}
          <div className="ota-preview-gate-badge">
            <Sparkles size={14} />
            <span>Preview Mode</span>
          </div>

          {/* Title */}
          <h3 className="ota-preview-gate-title">
            {title}
          </h3>

          {/* Description */}
          {description && (
            <p className="ota-preview-gate-description">
              {description}
            </p>
          )}

          {/* Preview Content */}
          {previewContent && (
            <div className="ota-preview-gate-preview">
              {previewContent}
            </div>
          )}

          {/* Blurred/Dimmed Actual Content */}
          <div className="ota-preview-gate-blurred">
            {children}
          </div>

          {/* CTA Section */}
          {showCTA && cta && (
            <div className="ota-preview-gate-cta">
              <div className="ota-preview-gate-cta-content">
                <div className="ota-preview-gate-cta-icon">
                  <OTALogo size="md" />
                </div>
                <div className="ota-preview-gate-cta-text">
                  <h4 className="ota-preview-gate-cta-title">{cta.title}</h4>
                  <p className="ota-preview-gate-cta-message">{cta.message}</p>
                </div>
              </div>
              <button
                className="ota-preview-gate-cta-button"
                onClick={() => navigate(cta.link)}
              >
                <Lock size={16} />
                <span>{cta.action}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Benefits List (for preview mode) */}
          {accessLevel === 'preview' && (
            <div className="ota-preview-gate-benefits">
              <h4 className="ota-preview-gate-benefits-title">What you'll get after registration:</h4>
              <ul className="ota-preview-gate-benefits-list">
                <li>
                  <CheckCircle size={16} />
                  <span>Full OTA personalization</span>
                </li>
                <li>
                  <CheckCircle size={16} />
                  <span>Strategy configuration and risk limits</span>
                </li>
                <li>
                  <CheckCircle size={16} />
                  <span>Automatic trade execution</span>
                </li>
                <li>
                  <CheckCircle size={16} />
                  <span>Detailed statistics and performance</span>
                </li>
                <li>
                  <CheckCircle size={16} />
                  <span>Access to all Bandit Selector features</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

OTAPreviewGate.displayName = 'OTAPreviewGate';

export default OTAPreviewGate;
