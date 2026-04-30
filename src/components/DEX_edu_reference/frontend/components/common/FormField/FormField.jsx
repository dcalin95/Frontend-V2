/**
 * 📝 FormField Component - Reusable Form Field
 */

import React from 'react';
import './FormField.css';

const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  min,
  max,
  step,
  options = [],
  className = '',
  disabled = false
}) => {
  const handleChange = (e) => {
    const value = type === 'number' 
      ? (e.target.value === '' ? '' : (type === 'select' ? e.target.value : parseFloat(e.target.value)))
      : (type === 'select' ? e.target.value : e.target.value);
    onChange(name, value);
  };

  return (
    <div className={`form-field ${className} ${error ? 'form-field-error' : ''}`}>
      {label && (
        <label className="form-field-label" htmlFor={name}>
          {label}
          {required && <span className="form-field-required" aria-label="required">*</span>}
        </label>
      )}
      {type === 'select' ? (
        <select
          id={name}
          name={name}
          className="form-field-input form-field-select"
          value={value}
          onChange={handleChange}
          required={required}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${name}-error` : undefined}
          aria-required={required}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          className="form-field-input"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${name}-error` : undefined}
          aria-required={required}
        />
      )}
      {error && (
        <span id={`${name}-error`} className="form-field-error" role="alert" aria-live="polite">
          {error}
        </span>
      )}
    </div>
  );
};

export default FormField;

