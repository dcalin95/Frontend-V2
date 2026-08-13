import { getBackendUrl } from '../../config/runtimeConfig';

function getSkyControlBaseUrl() {
  return String(getBackendUrl() || '').replace(/\/$/, '');
}

export async function requestSkyControl(path, signal) {
  const base = getSkyControlBaseUrl();
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

export async function controlSkyControlBot(userId, action, { signal } = {}) {
  const safeUserId = encodeURIComponent(String(userId || '').trim());
  const safeAction = encodeURIComponent(String(action || '').trim().toLowerCase());
  const base = getSkyControlBaseUrl();
  const response = await fetch(`${base}/api/sky-control/runtime/bots/${safeUserId}/${safeAction}`, {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: '{}',
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
  return Promise.allSettled([
    requestSkyControl('/health', signal),
    requestSkyControl('/overview', signal),
    requestSkyControl('/schema', signal),
    requestSkyControl('/runtime/health', signal),
  ]).then(([healthResult, overviewResult, schemaResult, runtimeResult]) => {
    const health = healthResult.status === 'fulfilled' ? healthResult.value : null;
    const overview = overviewResult.status === 'fulfilled' ? overviewResult.value : null;
    const schema = schemaResult.status === 'fulfilled' ? schemaResult.value : null;
    const runtime = runtimeResult.status === 'fulfilled' ? runtimeResult.value : null;
    if (health || overview || runtime) return { health, overview, schema, runtime };

    const failures = [healthResult, overviewResult, runtimeResult].filter((result) => result.status === 'rejected');
    const authFailure = failures.find((result) => result.reason?.status === 401 || result.reason?.status === 403);
    if (authFailure) throw authFailure.reason;
    const unavailableFailure = failures.find((result) => result.reason?.status === 503);
    if (unavailableFailure) throw unavailableFailure.reason;
    throw failures[0]?.reason || new Error('sky_control_summary_unavailable');
  });
}

export const searchSkyControlForensics = (q, options) => fetchSkyControl('/forensics/search', { ...options, params: { ...(options?.params || {}), q } });
export const fetchSkyControlForensicGraph = (params, options) => fetchSkyControl('/forensics/graph', { ...options, params });
export const fetchSkyControlForensicEntity = (type, id, options) => fetchSkyControl(`/forensics/entity/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, options);
export const fetchSkyControlForensicTimeline = (params, options) => fetchSkyControl('/forensics/timeline', { ...options, params });
export const fetchSkyControlForensicAnomalies = (params, options) => fetchSkyControl('/forensics/anomalies', { ...options, params });
export const searchSkyControlWallets = (q, options) => fetchSkyControl('/wallets/search', { ...options, params: { ...(options?.params || {}), q } });
export const fetchSkyControlWallet = (chain, address, options) => fetchSkyControl(`/wallets/${encodeURIComponent(chain)}/${encodeURIComponent(address)}`, options);
export const fetchSkyControlTransaction = (chain, txHash, options) => fetchSkyControl(`/transactions/${encodeURIComponent(chain)}/${encodeURIComponent(txHash)}`, options);
export const fetchSkyControlMoneyFlow = (params, options) => fetchSkyControl('/money-flow', { ...options, params });
export const searchSkyControlPaymentCases = (q, options) => fetchSkyControl('/payment-cases/search', { ...options, params: { ...(options?.params || {}), q } });
export const fetchSkyControlPaymentCase = (type, id, options) => fetchSkyControl(`/payment-cases/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, options);
export const fetchSkyControlProviderHealth = (options) => fetchSkyControl('/provider-health', options);
export const fetchSkyControlWalletHistory = (options) => fetchSkyControl('/wallet-history', options);
export const fetchSkyControlWalletAnomalies = (options) => fetchSkyControl('/wallet-anomalies', options);
const walletExportCaseTypes = new Set(['WALLET', 'TRANSACTION', 'PAYMENT_REFERENCE', 'PAYMENT', 'ORDER', 'USER', 'ADMIN']);
const walletExportChainTypes = new Set(['WALLET', 'TRANSACTION']);

export function buildSkyControlWalletExportParams(selectedCase = {}, csvType = '') {
  const case_type = String(selectedCase.entity_type || selectedCase.case_type || '').trim().toUpperCase();
  const case_id = String(selectedCase.entity_id || selectedCase.case_id || '').trim();
  if (!walletExportCaseTypes.has(case_type) || !case_id) {
    const error = new Error('wallet_case_seed_required'); error.code = 'wallet_case_seed_required'; throw error;
  }
  const chain = String(selectedCase.chain || '').trim().toLowerCase();
  if (walletExportChainTypes.has(case_type) && !chain) {
    const error = new Error('wallet_case_chain_required'); error.code = 'wallet_case_chain_required'; throw error;
  }
  return { case_type, case_id, ...(walletExportChainTypes.has(case_type) ? { chain } : {}), ...(csvType ? { type: csvType } : {}) };
}

export async function fetchSkyControlWalletExport(format = 'json', params = {}, { signal } = {}) {
  const base = getSkyControlBaseUrl();
  const query = new URLSearchParams({
    ...Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value != null)),
    format,
  });
  const response = await fetch(`${base}/api/sky-control/wallet-export?${query.toString()}`, {
    method: 'GET', credentials: 'include',
    headers: { Accept: format === 'csv' ? 'text/csv, application/json' : 'application/json' }, signal,
  });
  const contentType = response.headers.get('content-type') || '';
  const blob = await response.blob();
  if (!response.ok) {
    const payload = await blob.text().then((text) => JSON.parse(text)).catch(() => ({}));
    const error = new Error(payload.error || `HTTP ${response.status}`); error.status = response.status; throw error;
  }
  const payload = format === 'json' ? await blob.text().then((text) => JSON.parse(text)).catch(() => null) : null;
  return { blob, contentType, payload, integrityHash: payload?.integrity_hash || null };
}
export async function fetchSkyControlForensicExport(format, params = {}, { signal } = {}) {
  const base = getSkyControlBaseUrl();
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
