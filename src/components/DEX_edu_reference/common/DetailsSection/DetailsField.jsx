/**
 * 📋 DetailsField Component - Details Field Display
 */

import React from 'react';
import './DetailsSection.css';

const DetailsField = ({ label, value, children, className = '' }) => {
  return (
    <div className={`details-field ${className}`}>
      <span className="details-field-label">{label}:</span>
      <span className="details-field-value">
        {children || value || 'N/A'}
      </span>
    </div>
  );
};

export default DetailsField;

