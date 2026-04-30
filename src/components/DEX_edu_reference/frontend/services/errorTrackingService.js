/**
 * Error Tracking Service (optional – requires Sentry DSN in production)
 *
 * Centralized error tracking; no-op when Sentry not initialized.
 *
 * @module errorTrackingService
 */

import { captureException, captureMessage, setUser, clearUser, addBreadcrumb } from '../utils/sentry';

export const errorTrackingService = {
  captureException(error, extra = {}) {
    captureException(error, extra);
  },
  captureMessage(message, level = 'info') {
    captureMessage(message, level);
  },
  setUser(user) {
    sentry.setUser(user);
  },
  clearUser() {
    sentry.clearUser();
  },
  addBreadcrumb(message, category = 'default') {
    sentry.addBreadcrumb(message, category);
  },
};

export default errorTrackingService;
