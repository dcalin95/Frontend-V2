/**
 * 🎯 Button Component - Binance-Inspired Trading UI
 * 
 * Reusable button component with consistent states:
 * - Variants: primary, secondary, ghost, danger
 * - Sizes: sm, md, lg
 * - States: default, hover, active, focus, disabled, loading
 * - Icon support
 * 
 * @module Button
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import '../../styles/components/ui/button.css';

const Button = React.memo(({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  // Extract aria-label from props if provided
  const ariaLabel = props['aria-label'];
  const baseClass = 'ui-button';
  const variantClass = `ui-button-${variant}`;
  const sizeClass = `ui-button-${size}`;
  const classes = [
    baseClass,
    variantClass,
    sizeClass,
    fullWidth && 'ui-button-full',
    disabled && 'ui-button-disabled',
    loading && 'ui-button-loading',
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  const renderIcon = () => {
    if (loading) {
      return <Loader2 className="ui-button-icon ui-button-icon-spin" size={16} />;
    }
    if (icon) {
      return <span className="ui-button-icon">{icon}</span>;
    }
    return null;
  };

  // If button has only icon and no children, add aria-label
  const buttonAriaLabel = ariaLabel || (!children && icon ? 'Button' : undefined);

  // Remove aria-label from props to avoid duplication
  const { 'aria-label': _, ...restProps } = props;

  return (
    <button
      type={type}
      className={classes}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-label={buttonAriaLabel}
      {...restProps}
    >
      {iconPosition === 'left' && renderIcon()}
      {children && <span className="ui-button-text">{children}</span>}
      {iconPosition === 'right' && renderIcon()}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
