/**
 * 🎯 OTA Trading Modes - Constants and Utilities
 * 
 * Defines the three trading modes for OTA:
 * - MODE_ADVISORY: AI provides recommendations, user executes manually
 * - MODE_ASSISTED: AI prepares trades, user signs each transaction
 * - MODE_AUTO: AI executes trades automatically (requires bot authorization)
 * 
 * @module otaTradingModes
 */

/**
 * Trading mode constants
 */
export const TRADING_MODES = {
  ADVISORY: 'advisory',
  ASSISTED: 'assisted',
  AUTO: 'auto'
};

/**
 * Trading mode display names
 */
export const TRADING_MODE_NAMES = {
  [TRADING_MODES.ADVISORY]: 'Signals only',
  [TRADING_MODES.ASSISTED]: 'Assisted',
  [TRADING_MODES.AUTO]: 'Auto'
};

/**
 * Trading mode descriptions
 */
export const TRADING_MODE_DESCRIPTIONS = {
  [TRADING_MODES.ADVISORY]: 'AI provides recommendations. You execute manually.',
  [TRADING_MODES.ASSISTED]: 'AI prepares trades. You review and sign.',
  [TRADING_MODES.AUTO]: 'AI executes automatically based on your strategies.'
};

/**
 * Trading mode prerequisites by access level
 */
export const TRADING_MODE_REQUIREMENTS = {
  [TRADING_MODES.ADVISORY]: {
    guest: false, // Guest can see advisory preview
    preview: true, // Preview can use advisory with demo
    full: true // Full access can use advisory
  },
  [TRADING_MODES.ASSISTED]: {
    guest: false,
    preview: false, // Requires full access
    full: true
  },
  [TRADING_MODES.AUTO]: {
    guest: false,
    preview: false, // Requires full access
    full: true // Bot authorization is required for enabling execution, not for viewing the mode UI
  }
};

/**
 * Check if a trading mode is available for an access level
 * @param {string} mode - Trading mode (advisory/assisted/auto)
 * @param {string} accessLevel - Access level (guest/preview/full)
 * @param {boolean} botAuthorized - Whether bot is authorized (for auto mode)
 * @returns {boolean}
 */
export function isTradingModeAvailable(mode, accessLevel, botAuthorized = false) {
  if (!TRADING_MODES[mode?.toUpperCase()]) {
    return false;
  }
  
  const requirements = TRADING_MODE_REQUIREMENTS[mode];
  if (!requirements) {
    return false;
  }
  
  // Auto mode UI is available with full access; execution/actions still require bot authorization.
  if (mode === TRADING_MODES.AUTO) {
    return accessLevel === 'full';
  }
  
  return requirements[accessLevel] === true;
}

/**
 * Get default trading mode for an access level
 * @param {string} accessLevel - Access level (guest/preview/full)
 * @returns {string} Default trading mode
 */
export function getDefaultTradingMode(accessLevel) {
  return TRADING_MODES.ADVISORY; // Always default to advisory
}

/**
 * Get available trading modes for an access level
 * @param {string} accessLevel - Access level (guest/preview/full)
 * @param {boolean} botAuthorized - Whether bot is authorized
 * @returns {string[]} Array of available trading modes
 */
export function getAvailableTradingModes(accessLevel, botAuthorized = false) {
  return Object.values(TRADING_MODES).filter(mode => 
    isTradingModeAvailable(mode, accessLevel, botAuthorized)
  );
}

/** Modes shown in OTA UI. Assisted removed — same as Swap (sidebar), no duplicate. */
export const TRADING_MODES_VISIBLE = [TRADING_MODES.ADVISORY, TRADING_MODES.AUTO];

/**
 * Normalizes bot authorization objects coming from backend.
 * Prefers effectiveActive (considers expiresAt and amount) when present; else isActive/active/enabled.
 * @param {any} auth
 * @returns {boolean}
 */
export function isBotAuthorizationActive(auth) {
  if (!auth || typeof auth !== 'object') return false;

  if (typeof auth.effectiveActive === 'boolean') return auth.effectiveActive;
  if (typeof auth.isActive === 'boolean') return auth.isActive;
  if (typeof auth.active === 'boolean') return auth.active;
  if (typeof auth.enabled === 'boolean') return auth.enabled;
  if (typeof auth.is_authorized === 'boolean') return auth.is_authorized;

  if (typeof auth.status === 'string') {
    const s = auth.status.toLowerCase();
    return s === 'active' || s === 'enabled' || s === 'authorized';
  }

  return false;
}

/**
 * Returns true if the executor bot is authorized and effectively active (not expired, amount not exhausted).
 * Uses effectiveActive when present (from getRegistrationStatus), else isBotAuthorizationActive(a).
 * @param {any[]} botAuthorizations
 * @param {string|null|undefined} [expectedBotAddress] - Address from GET /api/ai-trading/bot-address (executor signer)
 * @returns {boolean}
 */
export function isBotAuthorized(botAuthorizations, expectedBotAddress) {
  if (!Array.isArray(botAuthorizations) || botAuthorizations.length === 0) return false;
  const expected = expectedBotAddress ? String(expectedBotAddress).trim().toLowerCase() : null;
  if (!expected) return false;
  return botAuthorizations.some(
    (a) => String(a?.botAddress || '').toLowerCase() === expected && isBotAuthorizationActive(a)
  );
}

/**
 * Get the executor bot auth entry when present (for UI: expiry, reason, renew).
 * @param {any[]} botAuthorizations
 * @param {string|null|undefined} expectedBotAddress
 * @returns {object|null} auth object with effectiveActive, expiresAtRaw, expiresAtIso, reason, etc.
 */
export function getExecutorBotAuth(botAuthorizations, expectedBotAddress) {
  if (!Array.isArray(botAuthorizations) || !expectedBotAddress) return null;
  const expected = String(expectedBotAddress).trim().toLowerCase();
  return botAuthorizations.find((a) => String(a?.botAddress || '').toLowerCase() === expected) || null;
}

/**
 * Extract bot authorizations array from various backend shapes.
 * We support multiple keys because backend versions may differ.
 * @param {any} status
 * @returns {any[]}
 */
export function getBotAuthorizationsFromStatus(status) {
  if (!status || typeof status !== 'object') return [];

  const candidates = [
    status.botAuthorizations,
    status.authorizations,
    status.authorizedBots,
    status.bots,
    status.botAuthorization,
    status.bot,
  ];

  for (const c of candidates) {
    if (Array.isArray(c)) return c;
    if (c && typeof c === 'object') return [c];
  }

  // Sometimes wrapped under `status` key again
  if (status.status && typeof status.status === 'object') {
    return getBotAuthorizationsFromStatus(status.status);
  }

  return [];
}
