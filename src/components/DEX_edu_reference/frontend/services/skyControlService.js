import { getBackendUrl } from '../../../../config/apiEndpoints';

export async function requestSkyControl(path, signal) {
  // The production auth cookie belongs to bits-ai.io. Use its existing API proxy
  // so read-only Sky Control requests carry the same authenticated session.
  const useFirstPartyApi = typeof window !== 'undefined'
    && ['bits-ai.io', 'www.bits-ai.io'].includes(window.location?.hostname);
  const base = String(useFirstPartyApi ? window.location.origin : getBackendUrl() || '').replace(/\/$/, '');
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

export function fetchSkyControl(path, { signal, params } = {}) {
  const query = params ? `?${new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '' && value != null)).toString()}` : '';
  return requestSkyControl(`${path}${query}`, signal);
}

export function fetchSkyControlSummary(signal) {
  return Promise.all([
    requestSkyControl('/health', signal),
    requestSkyControl('/overview', signal),
    requestSkyControl('/schema', signal).catch(() => null),
  ]).then(([health, overview, schema]) => ({ health, overview, schema }));
}
