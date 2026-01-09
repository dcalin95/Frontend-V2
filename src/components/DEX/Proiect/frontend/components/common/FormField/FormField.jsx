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
          {required && <span className="form-field-required">*</span>}
          {error && <span className="form-field-error-text">{error}</span>}
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
        />
      )}
    </div>
  );
};

export default FormField;

