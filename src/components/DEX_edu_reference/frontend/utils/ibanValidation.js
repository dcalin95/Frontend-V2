/**
 * IBAN validation for bank account (withdrawals).
 * Format: 2 letters (country) + 2 digits (check) + 11–30 alphanumeric (BBAN). Total 15–34 chars.
 * @see docs/STRIPE_IBAN_WITHDRAWAL_SKELETON.md
 */

const IBAN_REGEX = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/;

/**
 * Normalize IBAN: uppercase, remove spaces and non-alphanumeric.
 * @param {string} value
 * @returns {string}
 */
export function normalizeIban(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/\s/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Validate IBAN format (length 15–34, structure).
 * @param {string} iban - Raw or normalized IBAN
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateIban(iban) {
  const raw = normalizeIban(iban);
  if (!raw) return { valid: false, error: 'IBAN is required' };
  if (raw.length < 15) return { valid: false, error: 'IBAN is too short' };
  if (raw.length > 34) return { valid: false, error: 'IBAN is too long' };
  if (!IBAN_REGEX.test(raw)) return { valid: false, error: 'Invalid IBAN format (e.g. RO49 AAAA 1B31 0075 9384 0000)' };
  return { valid: true };
}

/**
 * Mask IBAN for display: show first 4 and last 4, middle as asterisks.
 * @param {string} iban - Full or already masked IBAN
 * @returns {string}
 */
export function maskIban(iban) {
  const n = normalizeIban(iban);
  if (!n || n.length < 8) return '****';
  return `${n.slice(0, 4)} **** **** **** **** ${n.slice(-4)}`;
}
