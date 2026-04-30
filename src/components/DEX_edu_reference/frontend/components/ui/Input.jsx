/**
 * 🎯 Input Component - Binance-Inspired Trading UI
 * 
 * Reusable input component:
 * - Types: text, number, password, email
 * - States: default, focus, error, disabled
 * - With label, error message, helper text
 * - Icon support (left/right)
 * 
 * @module Input
 */

import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';
import '../../styles/components/ui/input.css';

const Input = forwardRef(({
  label,
  error,
  helperText,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const baseClass = 'ui-input-wrapper';
  const errorClass = error ? 'ui-input-error' : '';
  const sizeClass = `ui-input-${size}`;
  const fullWidthClass = fullWidth ? 'ui-input-full' : '';
  const classes = [
    baseClass,
    errorClass,
    sizeClass,
    fullWidthClass,
    className
  ].filter(Boolean).join(' ');

  const inputClasses = [
    'ui-input',
    error && 'ui-input-field-error',
    icon && `ui-input-with-icon-${iconPosition}`
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {label && (
        <label className="ui-input-label" htmlFor={props.id}>
          {label}
          {props.required && <span className="ui-input-required">*</span>}
        </label>
      )}
      <div className="ui-input-container">
        {icon && iconPosition === 'left' && (
          <span className="ui-input-icon ui-input-icon-left">{icon}</span>
        )}
        <input
          ref={ref}
          className={inputClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
          {...props}
        />
        {icon && iconPosition === 'right' && (
          <span className="ui-input-icon ui-input-icon-right">{icon}</span>
        )}
        {error && (
          <span className="ui-input-error-icon">
            <AlertCircle size={16} />
          </span>
        )}
      </div>
      {error && (
        <span id={props.id ? `${props.id}-error` : undefined} className="ui-input-error-message">
          {error}
        </span>
      )}
      {helperText && !error && (
        <span id={props.id ? `${props.id}-helper` : undefined} className="ui-input-helper">
          {helperText}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
