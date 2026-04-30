/**
 * 🎯 Badge Component - Binance-Inspired Trading UI
 * 
 * Badge/Tag component:
 * - Variants: default, success, error, warning, info
 * - Sizes: sm, md
 * 
 * @module Badge
 */

import React from 'react';
import '../../styles/components/ui/badge.css';

const Badge = React.memo(({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseClass = 'ui-badge';
  const variantClass = `ui-badge-${variant}`;
  const sizeClass = `ui-badge-${size}`;
  const classes = [
    baseClass,
    variantClass,
    sizeClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

export default Badge;
