/**
 * 💀 Skeleton Component - Loading Placeholder
 * 
 * Reusable skeleton loader component:
 * - Multiple variants (text, circle, rectangle)
 * - Customizable width and height
 * - Animated shimmer effect
 * 
 * @module Skeleton
 */

import React, { useMemo } from 'react';
import '../../styles/components/skeleton.css';

const Skeleton = React.memo(({
  variant = 'text',
  width,
  height,
  className = '',
  ...props
}) => {
  const baseClass = 'skeleton';
  const variantClass = `skeleton-${variant}`;
  const classes = [
    baseClass,
    variantClass,
    className
  ].filter(Boolean).join(' ');

  const style = useMemo(() => ({
    width: width || undefined,
    height: height || undefined,
    ...props.style
  }), [width, height, props.style]);

  return (
    <div 
      className={classes} 
      style={style} 
      aria-label="Loading..."
      role="status"
      {...props} 
    />
  );
});

Skeleton.displayName = 'Skeleton';

export default Skeleton;
