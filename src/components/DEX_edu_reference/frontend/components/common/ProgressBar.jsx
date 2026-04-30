/**
 * 📊 ProgressBar Component - Progress Bar Display
 * 
 * Component reutilizabil pentru progress bars:
 * - Customizable colors
 * - Variants: default, success, error, warning
 * - Animated
 * - Show percentage
 * 
 * @module ProgressBar
 */

import React from 'react';
import '../../styles/components/progress-bar.css';

const ProgressBar = ({
  value = 0,
  max = 100,
  variant = 'default',
  showLabel = true,
  label,
  size = 'medium',
  animated = true,
  className = ''
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const displayLabel = label || `${Math.round(percentage)}%`;

  return (
    <div className={`progress-bar progress-bar-${size} progress-bar-${variant} ${className}`}>
      {showLabel && (
        <div className="progress-bar-header">
          <span className="progress-bar-label">{displayLabel}</span>
        </div>
      )}
      <div className="progress-bar-track">
        <div 
          className={`progress-bar-fill ${animated ? 'progress-bar-animated' : ''}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label || `Progress: ${percentage}%`}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
