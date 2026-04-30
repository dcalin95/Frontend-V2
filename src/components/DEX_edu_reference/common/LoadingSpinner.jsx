/**
 * ⏳ LoadingSpinner Component - Loading Indicator
 * 
 * Loading spinner component pentru UI feedback:
 * - Spinner animation
 * - Loading message (optional)
 * - Size variants
 * 
 * @module LoadingSpinner
 */

import React from 'react';
import '../../../styles/DEX/loading-spinner.css';

const LoadingSpinner = ({ message = 'Loading...', size = 'medium' }) => {
  return (
    <div className={`ai-trading-loading-spinner ai-trading-loading-spinner-${size}`}>
      <div className="ai-trading-spinner"></div>
      {message && <p className="ai-trading-loading-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;

