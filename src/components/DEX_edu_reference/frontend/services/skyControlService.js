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
  const base = String(getBackendUrl() || '').replace(/\/$/, '');
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
  const base = String(getBackendUrl() || '').replace(/\/$/, '');
  const query = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value != null)), format });
  const response = await fetch(`${base}/api/sky-control/forensics/export?${query.toString()}`, { method: 'GET', credentials: 'include', headers: { Accept: format === 'csv' ? 'text/csv, application/json' : 'application/json' }, signal });
  const blob = await response.blob();
  if (!response.ok) {
    const payload = await blob.text().then((text) => JSON.parse(text)).catch(() => ({}));
    const error = new Error(payload.error || `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  const payload = format === 'json' ? await blob.text().then((text) => JSON.parse(text)).catch(() => null) : null;
  return { blob, contentType: response.headers.get('content-type') || '', payload, integrityHash: payload?.integrity_hash || null };
}
