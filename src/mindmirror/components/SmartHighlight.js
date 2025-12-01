import React, { useState } from 'react';
import './SmartHighlight.css';

/**
 * SmartHighlight - Interactive tooltip for key terms
 * Usage: <SmartHighlight term="Dopamine" definition="Neurotransmitter..." />
 */
const SmartHighlight = ({ term, definition, icon, onHover }) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleMouseEnter = () => {
    setIsVisible(true);
    if (onHover) onHover(term);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <span className="smart-highlight-wrapper">
      <span
        className="smart-highlight-term"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleMouseEnter}
      >
        {term}
      </span>
      {isVisible && (
        <div className="smart-highlight-tooltip">
          {icon && <span className="tooltip-icon">{icon}</span>}
          <div className="tooltip-content">
            <strong className="tooltip-term">{term}</strong>
            <p className="tooltip-definition">{definition}</p>
          </div>
          <div className="tooltip-arrow"></div>
        </div>
      )}
    </span>
  );
};

export default SmartHighlight;

