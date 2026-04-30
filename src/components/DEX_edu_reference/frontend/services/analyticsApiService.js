/**
 * Trade Cost Analytics API – evidență completă costuri, cheltuieli, rezultat OTA.
 * Apelează GET /api/ai-trading/analytics/* cu userId = walletAddress.
 */

import { API_ENDPOINTS } from '../utils/constants';
import { otaApiRequest } from '../utils/otaApiClient';

function buildParams(userId, query = {}) {
  const params = new URLSearchParams();
  params.set('userId', userId);
  Object.keys(query).forEach((k) => {
    if (query[k] != null && query[k] !== '') params.set(k, String(query[k]));
  });
  return params.toString();
}

/**
 * GET /api/ai-trading/analytics/transaction-costs
 * @param {string} userId - wallet address
 * @param {{ limit?: number, offset?: number, status?: string, token?: string, dateFrom?: string, dateTo?: string }} filters
 */
export async function getTransactionCostBreakdown(userId, filters = {}) {
  if (!userId) throw new Error('userId required');
  const qs = buildParams(userId, filters);
  const res = await otaApiRequest(`${API_ENDPOINTS.ANALYTICS_TRANSACTION_COSTS}?${qs}`, { method: 'GET' });
  if (!res.success) throw new Error(res.error || 'Failed to load transaction costs');
  return { transactions: res.transactions || [], pagination: res.pagination || {} };
}

/**
 * GET /api/ai-trading/analytics/portfolio-summary
 */
export async function getPortfolioSummary(userId) {
  if (!userId) throw new Error('userId required');
  const res = await otaApiRequest(`${API_ENDPOINTS.ANALYTICS_PORTFOLIO_SUMMARY}?userId=${encodeURIComponent(userId)}`, { method: 'GET' });
  if (!res.success) throw new Error(res.error || 'Failed to load portfolio summary');
  return res;
}

/**
 * GET /api/ai-trading/analytics/capital-bridge
 * @param {string} userId
 * @param {{ currentVaultValueUsd?: number, totalDepositsUsd?: number, totalWithdrawalsUsd?: number, unrealizedPnlUsd?: number, startingCapitalUsd?: number }} overrides
 */
/**
 * GET /api/ai-trading/analytics/vault-chain-history — istoric depuneri/retrageri UserVault (server BSC RPC).
 * Timeout mare: scanul poate dura zeci de secunde.
 */
export async function getVaultChainHistory(userId) {
  if (!userId) throw new Error('userId required');
  const params = new URLSearchParams({ userId });
  const res = await otaApiRequest(`${API_ENDPOINTS.ANALYTICS_VAULT_CHAIN_HISTORY}?${params.toString()}`, {
    method: 'GET',
    timeoutMs: 120000,
  });
  if (!res.success) throw new Error(res.error || 'Failed to load vault chain history');
  return res;
}

export async function indexManualVaultChainHistory(payload) {
  const res = await otaApiRequest(API_ENDPOINTS.ANALYTICS_VAULT_CHAIN_HISTORY_INDEX_MANUAL, {
    method: 'POST',
    body: payload,
    timeoutMs: 30000,
  });
  if (!res.success) throw new Error(res.error || 'Failed to index manual vault history');
  return res;
}

export async function getCapitalBridge(userId, overrides = {}) {
  if (!userId) throw new Error('userId required');
  const params = new URLSearchParams({ userId });
  Object.entries(overrides).forEach(([k, v]) => {
    if (v != null && Number.isFinite(v)) params.set(k, String(v));
  });
  const res = await otaApiRequest(`${API_ENDPOINTS.ANALYTICS_CAPITAL_BRIDGE}?${params.toString()}`, { method: 'GET' });
  if (!res.success) throw new Error(res.error || 'Failed to load capital bridge');
  return res;
}

/**
 * GET /api/ai-trading/analytics/open-positions-cost-basis
 */
export async function getOpenPositionsCostBasis(userId) {
  if (!userId) throw new Error('userId required');
  const res = await otaApiRequest(`${API_ENDPOINTS.ANALYTICS_OPEN_POSITIONS_COST_BASIS}?userId=${encodeURIComponent(userId)}`, { method: 'GET' });
  if (!res.success) throw new Error(res.error || 'Failed to load open positions cost basis');
  return { positions: res.positions || [] };
}

/**
 * GET /api/ai-trading/analytics/open-positions
 * Tracked open positions with positionExitMode, summary, full per-position fields.
 */
export async function getOpenPositionsAnalytics(userId) {
  if (!userId) throw new Error('userId required');
  const res = await otaApiRequest(`${API_ENDPOINTS.ANALYTICS_OPEN_POSITIONS}?userId=${encodeURIComponent(userId)}`, { method: 'GET' });
  if (!res.success) throw new Error(res.error || 'Failed to load open positions analytics');
  return {
    userId: res.userId,
    positionExitMode: res.positionExitMode || 'auto',
    summary: res.summary || { totalPositions: 0, totalCostBasisUsd: 0 },
    positions: res.positions || [],
    decisionType: res.decisionType ?? 'rule_based',
    predictiveModelUsed: res.predictiveModelUsed ?? false,
    exitOptimizationUsed: res.exitOptimizationUsed ?? false,
    marketDataUsed: res.marketDataUsed ?? false,
    evidenceLevel: res.evidenceLevel ?? 'insufficient',
    userFacingTruthLabel: res.userFacingTruthLabel ?? 'Rule-based. Evidence-only.',
  };
}

/**
 * GET /api/ai-trading/vault/balance-comparison
 * On-chain vs DB-derived balances; provenanceStatus EXACT | INFERRED | UNKNOWN. No fake values.
 */
export async function getVaultBalanceComparison(userId) {
  if (!userId) throw new Error('userId required');
  const res = await otaApiRequest(`/ai-trading/vault/balance-comparison?userId=${encodeURIComponent(userId)}`, { method: 'GET' });
  if (!res.success) throw new Error(res.error || 'Failed to load vault balance comparison');
  return {
    userId: res.userId,
    onChainAvailable: res.onChainAvailable ?? false,
    note: res.note ?? null,
    runId: res.runId ?? null,
    anomalyCount: res.anomalyCount ?? 0,
    tokens: res.tokens ?? [],
  };
}

/**
 * GET /api/ai-trading/analytics/invested-capital
 * Suma reala investita din tranzactiile on-chain directe deposit()/withdraw() catre UserVault.
 */
export async function getInvestedCapital(userId) {
  if (!userId) throw new Error('userId required');
  const res = await otaApiRequest(`/ai-trading/analytics/invested-capital?userId=${encodeURIComponent(userId)}`, { method: 'GET' });
  if (!res.success) throw new Error(res.error || 'Failed to load invested capital');
  return res;
}

export default {
  getTransactionCostBreakdown,
  getPortfolioSummary,
  getVaultChainHistory,
  indexManualVaultChainHistory,
  getCapitalBridge,
  getOpenPositionsCostBasis,
  getOpenPositionsAnalytics,
  getVaultBalanceComparison,
  getInvestedCapital,
};
