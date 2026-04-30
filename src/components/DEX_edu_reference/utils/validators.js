/**
 * Form validation utilities
 * Reusable validation functions for forms across the application
 */

/**
 * Validates an email address
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

/**
 * Validates a name (minimum length)
 * @param {string} name - Name to validate
 * @param {number} minLength - Minimum length (default: 2)
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidName = (name, minLength = 2) => {
  if (!name || typeof name !== 'string') return false;
  return name.trim().length >= minLength;
};

/**
 * Validates a Telegram/X handle
 * @param {string} handle - Handle to validate
 * @param {boolean} requireAt - Whether handle must start with @ (default: true)
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidTelegramHandle = (handle, requireAt = true) => {
  if (!handle || typeof handle !== 'string') return false;
  const trimmed = handle.trim();
  if (requireAt && !trimmed.startsWith('@')) return false;
  return trimmed.length > (requireAt ? 1 : 0);
};

/**
 * Validates text length
 * @param {string} text - Text to validate
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length (optional)
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidTextLength = (text, minLength, maxLength = null) => {
  if (!text || typeof text !== 'string') return false;
  const length = text.trim().length;
  if (length < minLength) return false;
  if (maxLength !== null && length > maxLength) return false;
  return true;
};

/**
 * Validates a URL
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates a phone number (basic international format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  // Basic validation: allows +, digits, spaces, dashes, parentheses
  return /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/.test(phone.trim());
};

/**
 * Validation error messages
 */
export const VALIDATION_MESSAGES = {
  REQUIRED: (field) => `${field} is required`,
  EMAIL_INVALID: 'Please enter a valid email address',
  NAME_TOO_SHORT: (min) => `Name must be at least ${min} characters`,
  HANDLE_INVALID: 'Handle should start with @',
  TEXT_TOO_SHORT: (min) => `Please provide at least ${min} characters`,
  TEXT_TOO_LONG: (max) => `Please provide no more than ${max} characters`,
  URL_INVALID: 'Please enter a valid URL',
  PHONE_INVALID: 'Please enter a valid phone number',
  TERMS_REQUIRED: 'You must agree to the terms'
};

/**
 * Creates a validation function for a specific field
 * @param {Object} rules - Validation rules
 * @returns {Function} - Validation function that returns error message or null
 */
export const createFieldValidator = (rules) => {
  return (value) => {
    // Required check
    if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return rules.requiredMessage || VALIDATION_MESSAGES.REQUIRED(rules.fieldName || 'This field');
    }

    // Skip other validations if field is empty and not required
    if (!value || (typeof value === 'string' && !value.trim())) {
      return null;
    }

    // Email validation
    if (rules.email && !isValidEmail(value)) {
      return rules.emailMessage || VALIDATION_MESSAGES.EMAIL_INVALID;
    }

    // Name validation
    if (rules.name && !isValidName(value, rules.minLength)) {
      return rules.nameMessage || VALIDATION_MESSAGES.NAME_TOO_SHORT(rules.minLength || 2);
    }

    // Telegram handle validation
    if (rules.telegramHandle && !isValidTelegramHandle(value, rules.requireAt !== false)) {
      return rules.handleMessage || VALIDATION_MESSAGES.HANDLE_INVALID;
    }

    // Text length validation
    if (rules.minLength && !isValidTextLength(value, rules.minLength, rules.maxLength)) {
      if (rules.maxLength && value.trim().length > rules.maxLength) {
        return rules.maxLengthMessage || VALIDATION_MESSAGES.TEXT_TOO_LONG(rules.maxLength);
      }
      return rules.minLengthMessage || VALIDATION_MESSAGES.TEXT_TOO_SHORT(rules.minLength);
    }

    // URL validation
    if (rules.url && !isValidUrl(value)) {
      return rules.urlMessage || VALIDATION_MESSAGES.URL_INVALID;
    }

    // Phone validation
    if (rules.phone && !isValidPhone(value)) {
      return rules.phoneMessage || VALIDATION_MESSAGES.PHONE_INVALID;
    }

    // Custom validation function
    if (rules.custom && typeof rules.custom === 'function') {
      const customResult = rules.custom(value);
      if (customResult !== true) {
        return customResult || rules.customMessage || 'Invalid value';
      }
    }

    return null;
  };
};

