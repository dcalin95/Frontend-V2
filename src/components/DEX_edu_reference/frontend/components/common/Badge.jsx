/**
 * 🏷️ Badge Component - Badge Display
 * 
 * Component reutilizabil pentru badges:
 * - Variants: default, success, error, warning, info
 * - Sizes: small, medium, large
 * - Customizable
 * 
 * @module Badge
 */

import React from 'react';
import '../../styles/components/badge.css';

const Badge = ({ 
  children,
  variant = 'default',
  size = 'medium',
  rounded = false,
  className = ''
}) => {
  return (
    <span 
      className={`badge badge-${variant} badge-${size} ${rounded ? 'badge-rounded' : ''} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
