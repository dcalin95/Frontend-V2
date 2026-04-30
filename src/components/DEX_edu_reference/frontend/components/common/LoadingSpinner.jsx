/**
 * ⏳ LoadingSpinner Component - Loading Indicator
 * 
 * Loading spinner component pentru UI feedback:
 * - Spinner animation (rotating + pulse)
 * - Loading message (optional, with animated dots)
 * - Size variants
 * - Dynamic, visible loading indicator
 * 
 * @module LoadingSpinner
 */

import React, { useState, useEffect } from 'react';
import '../../styles/loading-spinner.css';

const LoadingSpinner = ({ message = 'Loading', size = 'medium' }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const displayMessage = message ? `${message}${dots}` : 'Loading' + dots;

  return (
    <div className={`ai-trading-loading-spinner ai-trading-loading-spinner-${size}`}>
      <div className="ai-trading-spinner">
        <div className="ai-trading-spinner-inner"></div>
      </div>
      {message && <p className="ai-trading-loading-message">{displayMessage}</p>}
    </div>
  );
};

export default LoadingSpinner;

