import { getBackendUrl } from '../../../../config/apiEndpoints';

async function requestSkyControl(path, signal) {
  const base = String(getBackendUrl() || '').replace(/\/$/, '');
  const response = await fetch(`${base}/api/sky-control${path}`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
    signal,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

export function fetchSkyControlSummary(signal) {
  return Promise.all([
    requestSkyControl('/health', signal),
    requestSkyControl('/overview', signal),
  ]).then(([health, overview]) => ({ health, overview }));
}
