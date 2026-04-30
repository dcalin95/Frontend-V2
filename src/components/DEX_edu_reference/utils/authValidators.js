/**
 * Auth validators – un singur loc pentru validare login/register (site + DEX).
 * Folosit de: Login.jsx (site), DEX EmailAuthModal, OTALoginPage, OTARegisterPage.
 */

const AUTH_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const AUTH_EMAIL_MAX_LEN = 254;

export function validateAuthEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: 'Email is required' };
  }
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    return { valid: false, message: 'Email is required' };
  }
  if (trimmed.length > AUTH_EMAIL_MAX_LEN) {
    return { valid: false, message: 'Email address is too long' };
  }
  if (!AUTH_EMAIL_REGEX.test(trimmed)) {
    return { valid: false, message: 'Please enter a valid email address' };
  }
  return { valid: true };
}

/**
 * Login: accept either a valid email or a valid username (same field in UI).
 */
export function validateAuthEmailOrUsername(identifier) {
  if (!identifier || typeof identifier !== 'string') {
    return { valid: false, message: 'Email or username is required' };
  }
  const trimmed = identifier.trim();
  if (!trimmed) {
    return { valid: false, message: 'Email or username is required' };
  }
  if (trimmed.includes('@')) {
    return validateAuthEmail(trimmed);
  }
  return validateAuthUsername(trimmed);
}

/** Trim: email -> lowercase; username -> trim without forcing lowercase because DB matching is case-insensitive. */
export function normalizeLoginIdentifier(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const t = raw.trim();
  if (!t) return '';
  if (t.includes('@')) return t.toLowerCase();
  return t;
}

export function validateAuthPassword(password, options = {}) {
  const { forRegister = false } = options;
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }
  if (!password.length) {
    return { valid: false, message: 'Password is required' };
  }
  if (!forRegister) {
    return { valid: true };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (password.length > 128) {
    return { valid: false, message: 'Password must be no more than 128 characters long' };
  }
  if (!/(?=.*[a-z])/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/(?=.*[0-9])/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true };
}

export function validateAuthUsername(username) {
  if (!username || typeof username !== 'string') {
    return { valid: false, message: 'Username is required' };
  }
  const t = username.trim();
  if (t.length < 3) {
    return { valid: false, message: 'Username must be at least 3 characters long' };
  }
  if (t.length > 20) {
    return { valid: false, message: 'Username must be no more than 20 characters long' };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(t)) {
    return { valid: false, message: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }
  if (/^[_-]|[_-]$/.test(t)) {
    return { valid: false, message: 'Username cannot start or end with underscore or hyphen' };
  }
  if (/^\d+$/.test(t)) {
    return { valid: false, message: 'Username cannot be only numbers' };
  }
  return { valid: true };
}

export function validateAuthConfirmPassword(password, confirmPassword) {
  if (password !== confirmPassword) {
    return { valid: false, message: 'Passwords do not match' };
  }
  return { valid: true };
}
