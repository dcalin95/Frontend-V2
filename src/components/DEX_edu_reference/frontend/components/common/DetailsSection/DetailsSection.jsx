/**
 * 📄 DetailsSection Component - Details Section Wrapper
 */

import React from 'react';
import './DetailsSection.css';

const DetailsSection = ({ title, children, className = '' }) => {
  return (
    <div className={`details-section ${className}`}>
      {title && <h3 className="details-section-title">{title}</h3>}
      <div className="details-section-content">{children}</div>
    </div>
  );
};

export default DetailsSection;

