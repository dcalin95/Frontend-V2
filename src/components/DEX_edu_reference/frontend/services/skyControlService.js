import { getBackendUrl } from '../../../../config/apiEndpoints';

export async function requestSkyControl(path, signal) {
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

export const searchSkyControlForensics = (q, options) => fetchSkyControl('/forensics/search', { ...options, params: { ...(options?.params || {}), q } });
export const fetchSkyControlForensicGraph = (params, options) => fetchSkyControl('/forensics/graph', { ...options, params });
export const fetchSkyControlForensicEntity = (type, id, options) => fetchSkyControl(`/forensics/entity/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, options);
export const fetchSkyControlForensicTimeline = (params, options) => fetchSkyControl('/forensics/timeline', { ...options, params });
export const fetchSkyControlForensicAnomalies = (params, options) => fetchSkyControl('/forensics/anomalies', { ...options, params });
export async function fetchSkyControlForensicExport(format, params = {}, { signal } = {}) {
  const base = String(getBackendUrl() || '').replace(/\/$/, '');
  const query = new URLSearchParams({
    ...Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value != null)),
    format,
  });
  const response = await fetch(`${base}/api/sky-control/forensics/export?${query.toString()}`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: format === 'csv' ? 'text/csv, application/json' : 'application/json' },
    signal,
  });
  const contentType = response.headers.get('content-type') || '';
  const blob = await response.blob();
  if (!response.ok) {
    const payload = await blob.text().then((text) => JSON.parse(text)).catch(() => ({}));
    const error = new Error(payload.error || `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  const payload = format === 'json'
    ? await blob.text().then((text) => JSON.parse(text)).catch(() => null)
    : null;
  return { blob, contentType, payload, integrityHash: payload?.integrity_hash || null };
}
