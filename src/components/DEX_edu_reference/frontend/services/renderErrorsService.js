/**
 * Render Errors / Backend logs – fetch persisted errors from backend (Render).
 * Backend must expose GET /api/admin/render-errors (see docs/RENDER_ERRORS_UI_AND_BACKEND_SPEC.md).
 * @module renderErrorsService
 */

import { getApiBaseUrl, API_ENDPOINTS } from '../../config/apiEndpoints.js';

/**
 * @param {string} [apiBase] - API base URL (default: getApiBaseUrl())
 * @param {{ limit?: number, since?: string, level?: string }} [opts]
 * @returns {Promise<{ items: Array<{ id: number|string, created_at: string, level: string, message: string, stack?: string, path?: string, request_id?: string, raw_line?: string }>, total: number, _notConfigured?: boolean }>}
 */
export async function getRenderErrors(apiBase = getApiBaseUrl(), opts = {}) {
  const limit = opts.limit ?? 100;
  const params = new URLSearchParams({ limit: String(limit) });
  if (opts.since) params.set('since', opts.since);
  if (opts.level) params.set('level', opts.level);
  const base = apiBase.replace(/\/$/, '');
  const path = API_ENDPOINTS.RENDER_ERRORS.startsWith('/') ? API_ENDPOINTS.RENDER_ERRORS : `/${API_ENDPOINTS.RENDER_ERRORS}`;
  const url = `${base}${path}?${params.toString()}`;
  const res = await fetch(url, { method: 'GET', credentials: 'include' });
  if (res.status === 404) {
    return { items: [], total: 0, _notConfigured: true };
  }
  if (!res.ok) {
    throw new Error(`Render errors API failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return {
    items: Array.isArray(data.items) ? data.items : [],
    total: typeof data.total === 'number' ? data.total : (data.items?.length ?? 0),
  };
}

/**
 * Ultimele tranzacții OTA Auto reușite (execution_history) – pentru tab „Tranzacții reușite” pe /dex-edu/ota/logs.
 * @param {string} [apiBase]
 * @param {{ limit?: number }} [opts]
 */
export async function getRenderSuccesses(apiBase = getApiBaseUrl(), opts = {}) {
  const limit = opts.limit ?? 100;
  const params = new URLSearchParams({ limit: String(limit) });
  const base = apiBase.replace(/\/$/, '');
  const path = API_ENDPOINTS.RENDER_SUCCESSES.startsWith('/') ? API_ENDPOINTS.RENDER_SUCCESSES : `/${API_ENDPOINTS.RENDER_SUCCESSES}`;
  const url = `${base}${path}?${params.toString()}`;
  const res = await fetch(url, { method: 'GET', credentials: 'include' });
  if (res.status === 404) {
    return { items: [], total: 0, _notConfigured: true };
  }
  if (!res.ok) {
    throw new Error(`Render successes API failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return {
    items: Array.isArray(data.items) ? data.items : [],
    total: typeof data.total === 'number' ? data.total : (data.items?.length ?? 0),
  };
}

/**
 * Export items as plain text (one block per error, as in Render log).
 * @param {Array<{ created_at: string, level: string, message: string, stack?: string, raw_line?: string }>} items
 * @returns {string}
 */
export function exportSuccessesAsText(items) {
  return items
    .map((e) => {
      const line = e.raw_line || `[${e.created_at}] success: ${e.message}`;
      return line;
    })
    .join('\n\n');
}

export function exportErrorsAsText(items) {
  return items
    .map((e) => {
      const line = e.raw_line || `[${e.created_at}] ${e.level}: ${e.message}`;
      const stack = e.stack ? `\n${e.stack}` : '';
      return line + stack;
    })
    .join('\n\n');
}
