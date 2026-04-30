/**
 * 📚 Educational Tooltip Component
 * 
 * Enhanced tooltip component pentru OTA features cu:
 * - Explicații detaliate "How it works"
 * - Best practices
 * - Link-uri către documentație
 * 
 * @module EducationalTooltip
 */

import React, { useState } from 'react';
import { HelpCircle, BookOpen, ExternalLink, X } from 'lucide-react';
import Tooltip from './Tooltip';
import '../../styles/components/educational-tooltip.css';

const EducationalTooltip = ({
  content,
  title,
  howItWorks,
  bestPractices,
  learnMoreLink,
  children,
  position = 'top',
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const tooltipContent = (
    <div className={`educational-tooltip-content ${className}`}>
      {title && (
        <div className="educational-tooltip-title">
          <BookOpen size={14} />
          <span>{title}</span>
        </div>
      )}
      
      {content && (
        <div className="educational-tooltip-description">
          {content}
        </div>
      )}

      {isExpanded && (
        <div className="educational-tooltip-expanded">
          {howItWorks && (
            <div className="educational-tooltip-section">
              <h4 className="educational-tooltip-section-title">How it works:</h4>
              <p className="educational-tooltip-section-content">{howItWorks}</p>
            </div>
          )}

          {bestPractices && (
            <div className="educational-tooltip-section">
              <h4 className="educational-tooltip-section-title">Best practices:</h4>
              <ul className="educational-tooltip-list">
                {Array.isArray(bestPractices) ? (
                  bestPractices.map((practice, idx) => (
                    <li key={idx}>{practice}</li>
                  ))
                ) : (
                  <li>{bestPractices}</li>
                )}
              </ul>
            </div>
          )}

          {learnMoreLink && (
            <div className="educational-tooltip-link">
              <a 
                href={learnMoreLink} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={12} />
                Learn more
              </a>
            </div>
          )}
        </div>
      )}

      {(howItWorks || bestPractices || learnMoreLink) && (
        <button
          className="educational-tooltip-toggle"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );

  return (
    <Tooltip content={tooltipContent} position={position}>
      {children || (
        <HelpCircle 
          size={16} 
          className="educational-tooltip-icon"
          aria-label="Help"
        />
      )}
    </Tooltip>
  );
};

export default EducationalTooltip;
