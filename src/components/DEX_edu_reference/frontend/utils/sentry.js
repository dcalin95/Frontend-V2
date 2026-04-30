/**
 * Sentry Error Tracking Setup (optional – no dependency)
 *
 * No-op implementation so the app builds without @sentry/react.
 * To enable Sentry: npm install @sentry/react, then replace this file
 * with the real implementation (see docs/DEX_MONITORING_PLAN.md).
 *
 * @module sentry
 */

/**
 * Initialize Sentry (no-op without @sentry/react)
 */
export function initSentry() {
  // No-op: install @sentry/react and use real impl to enable
}

/**
 * Capture exception (no-op)
 */
export function captureException(error, context = {}) {
  // no-op
}

/**
 * Capture message (no-op)
 */
export function captureMessage(message, level = 'info') {
  // no-op
}

/**
 * Set user context (no-op)
 */
export function setUser(user) {
  // no-op
}

/**
 * Clear user context (no-op)
 */
export function clearUser() {
  // no-op
}

/**
 * Add breadcrumb (no-op)
 */
export function addBreadcrumb(message, category = 'default') {
  // no-op
}
