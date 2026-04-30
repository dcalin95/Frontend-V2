/**
 * Live snapshot for OTA Chat: positions, portfolio, transaction costs, vault, LLM billing, shorts, bot from API (backend/DB).
 * + platformMarket: public BTC snapshot (Binance USD-M) from the same backend as BTC alerts.
 * Refreshed on every message, with a short cache to avoid rate limits.
 */

import { API_ENDPOINTS } from '../../config/apiEndpoints.js';
import { otaApiRequest } from './otaApiClient';
import { fetchBtcMarketAlertSnapshot } from '../services/otaMarketAlertsService';
import {
  getPortfolioSummary,
  getTransactionCostBreakdown,
  getCapitalBridge,
  getInvestedCapital,
  getVaultBalanceComparison,
} from '../services/analyticsApiService';
import {
  getAITradingBotStatus,
  getAutoExecutionStatus,
  getAgentMode,
  getLastSignal,
  getBotAuthStatus,
  getAgentSessions,
} from '../services/aiTradingApiService';
import { fetchOpenPositionsAnalyticsBundle } from '../services/openPositionsAnalyticsLoader';
import { getClosedPositionsProfitUsd } from '../services/closedPositionsProfitService';
import { getRecentLongSignals } from '../services/otaLongOpsService';
import { getRecentLlmSignals } from '../services/otaShortOpsService';

/** Aliniat la DEXApp / analytics: userId = wallet pentru OTA. */
export function resolveOtaChatWalletUserId(user, associatedWalletAddress, connectedWalletAddress) {
  const w =
    user?.walletAddress ||
    associatedWalletAddress ||
    connectedWalletAddress ||
    null;
  if (w && typeof w === 'string' && w.startsWith('0x')) return w;
  return null;
}

/**
 * Wallet for chat snapshot: first DEX profile, otherwise the EVM address from UI (MetaMask etc.).
 * Without fallback, a user with only a connected wallet (no wallet on `user`) did not receive USER LIVE DATA,
 * so the LLM said "I do not have access to the balance".
 */
export function resolveOtaChatLiveUserId(user, associatedWalletAddress, connectedWalletAddress, evmConnectedLower) {
  const fromProfile = resolveOtaChatWalletUserId(user, associatedWalletAddress, connectedWalletAddress);
  if (fromProfile) return fromProfile;
  const evm = evmConnectedLower != null ? String(evmConnectedLower).trim() : '';
  if (evm.startsWith('0x')) return evm.toLowerCase();
  return null;
}

/** Vault history can be slow; for chat, use a smaller timeout than Trade Cost full scan. */
const VAULT_CHAIN_HISTORY_TIMEOUT_MS = 22000;

function readIntEnv(name, fallback) {
  try {
    const raw = typeof process !== 'undefined' && process.env ? process.env[name] : undefined;
    const n = parseInt(String(raw ?? '').trim(), 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  } catch {
    return fallback;
  }
}

/** JSON cap injected into the system prompt; lower with REACT_APP_OTA_CHAT_MAX_SNAPSHOT_CHARS (default 72000). */
const MAX_SNAPSHOT_CHARS = readIntEnv('REACT_APP_OTA_CHAT_MAX_SNAPSHOT_CHARS', 72000);
const CACHE_TTL_MS = 25000;
let cache = { userId: null, at: 0, block: '' };

/**
 * Read by the LLM in the same JSON as the data; avoids PnL/gas ↔ token balance confusion in UserVault.
 * @type {Readonly<{ vaultContractBalance: string, doNotConfuseWith: string }>}
 */
const OTA_CHAT_SNAPSHOT_HINTS = Object.freeze({
  openPositionsAndWallet:
    'For questions about open positions, unrealized PnL, trading costs, signals: use openPositions (including positions, analyticsSummary), portfolioSummary, transactionCosts. The wallet address in the snapshot is walletAddress. Do NOT confuse open positions with token balances deposited in the Vault contract (that is only vaultBalanceComparison).',
  vaultContractBalance:
    'For "money/balance/tokens in Vault (UserVault contract / UserVault proxy)": use ONLY the vaultBalanceComparison object (tokens, on-chain vs DB lines). This is the only source in the snapshot for "how much you have in the Vault contract".',
  vaultAmountsAreTokenUnitsNotUsd:
    'IMPORTANT: onChainBalance_human and dbDerivedBalance_human are QUANTITIES in the token unit (for example "0.154" = 0.154 BNB), NOT dollar values. Do NOT write "BNB: 0.154 USD"; that is false. For USDT/USDC/BUSD (stables), the quantity is approx. USD notional and you may say "~ X USD" carefully. For LINK/ETH/BNB/MATIC etc., report as "X [SYMBOL] (on-chain/DB quantity)" without labeling the number as USD. The snapshot does NOT include the "≈ $" / Total USD columns from Personal Account; do not invent a dollar total. If the user mentions $221 from the UI, say this JSON does not include that total and full detail is in Personal Account.',
  doNotConfuseWith:
    'Do NOT use as "Vault balance": total PnL or amounts from portfolioSummary, total gas or lists from transactionCosts, analyticsSummary, or positions from openPositions; those belong to trading/executions/costs, NOT tokens deposited in the Vault contract. If the user asks about Vault and you read these fields, the answer is WRONG.',
  ifVaultBalanceMissing:
    'If vaultBalanceComparison is missing or appears only in errors, clearly say the snapshot does not contain the Vault balance and do NOT substitute other JSON numbers.',
  platformMarketReference:
    'For questions about BTC reference price and recent move (for example 1h/4h): use the **platformMarket** object (BitSwap backend response, same source as "BTC move" alerts, Binance USD-M / klines). If `snapshot` or fields such as markPrice, lastPrice, pct1h, pct4h, at exist, read them; do not say "I do not have access to platform data" when these fields are present. Mention they are indicative (a few seconds delayed versus exchange). Do not confuse with DEX on-chain swap spot price if the user explicitly asks for another venue.',
  realizedVersusUnrealizedPnl:
    '**Unrealized PnL / open positions:** openPositions (positions, analyticsSummary). **Realized PnL / closed positions:** closedPositionsProfit (totalProfitUsd, executionsDetail, directEntryDetail). Do not mix them. "How much did I win/lose in total on closes" -> closedPositionsProfit when present.',
  signalsRecent:
    'recentSignalsLong / recentSignalsShort: sample from OTA signals/analyses (LONG vs SHORT). They do not replace full execution history; for costs and transaction count, see transactionCosts.',
  navigation:
    'Use **chatSnapshotGuide.where** as a quick map to the JSON key that fits the question.',
});


function slimSignalsPayload(res) {
  if (!res || typeof res !== 'object') return res;
  const sig = Array.isArray(res.signals) ? res.signals.slice(0, 12) : [];
  return {
    success: res.success,
    count: res.count ?? sig.length,
    pagination: res.pagination,
    signals: shrinkLargeArrays(sig, 14),
  };
}

function slimClosedPositionsProfit(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  return {
    totalProfitUsd: raw.totalProfitUsd,
    fromExecutions: raw.fromExecutions,
    fromDirectEntry: raw.fromDirectEntry,
    errors: raw.errors,
    executionsDetail: shrinkLargeArrays((raw.executionsDetail || []).slice(0, 32), 18),
    directEntryDetail: shrinkLargeArrays((raw.directEntryDetail || []).slice(0, 32), 18),
  };
}


function truncate(str, max) {
  if (str == null) return '';
  const s = String(str);
  if (s.length <= max) return s;
  return `${s.slice(0, max)}\n… [truncated]\n`;
}

function safeLabel(err) {
  if (err == null) return 'unknown';
  const m = err?.message || err?.error || String(err);
  return truncate(m, 200);
}

/** Recursively limits large arrays in API responses (vault history etc.). */
function shrinkLargeArrays(value, maxItems = 90, depth = 0) {
  if (depth > 8) return value;
  if (Array.isArray(value)) {
    if (value.length > maxItems) {
      return [...value.slice(0, maxItems).map((x) => shrinkLargeArrays(x, maxItems, depth + 1)), { _truncatedAfter: maxItems, _total: value.length }];
    }
    return value.map((x) => shrinkLargeArrays(x, maxItems, depth + 1));
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = shrinkLargeArrays(v, maxItems, depth + 1);
    }
    return out;
  }
  return value;
}

/**
 * @param {string | null | undefined} userId - wallet 0x... or null for market data only (platformMarket).
 * @param {{ skipCache?: boolean }} [opts]
 * @returns {Promise<string>} block to add to the system prompt (or '' if everything fails without fallback)
 */
export async function getOtaChatLiveContextBlock(userId, opts = {}) {
  const uid = userId && String(userId).startsWith('0x') ? userId : null;
  const cacheKey = uid || '__platform__';

  const now = Date.now();
  if (!opts.skipCache && cache.userId === cacheKey && now - cache.at < CACHE_TTL_MS && cache.block) {
    return cache.block;
  }

  const platformTaskFn = async () => {
    const raw = await fetchBtcMarketAlertSnapshot();
    return shrinkLargeArrays(raw, 48);
  };

  /** Builds JSON + cache. */
  const finalize = (snap) => {
    let json = '';
    try {
      const slim = shrinkLargeArrays(snap, 100);
      json = JSON.stringify(slim, null, 0);
    } catch (e) {
      json = JSON.stringify({ error: 'stringify_failed', message: String(e?.message || e) });
    }

    json = truncate(json, MAX_SNAPSHOT_CHARS);

    const block = `\n\n---\nUSER LIVE DATA (read-only JSON). Read _instructionsReadFirst first (include platformMarketReference for BTC reference). Vault token balance = vaultBalanceComparison only (not PnL/gas).\n${json}\n---\n`;

    cache = { userId: cacheKey, at: Date.now(), block };
    return block;
  };

  if (!uid) {
    const settled = await Promise.allSettled([platformTaskFn()]);
    const snap = {
      _instructionsReadFirst: OTA_CHAT_SNAPSHOT_HINTS,
      _dataProvenance:
        'platformMarket only: public read-only snapshot from BitSwap backend (Binance USD-M — same path as BTC move alerts). No wallet-scoped rows when no 0x wallet is resolved for this chat turn.',
      fetchedAtIso: new Date().toISOString(),
      walletAddress: null,
      errors: [],
    };
    if (settled[0].status === 'fulfilled') {
      snap.platformMarket = settled[0].value;
    } else {
      snap.errors.push({ section: 'platformMarket', reason: safeLabel(settled[0].reason) });
    }
    return finalize(snap);
  }

  const qsUser = `userId=${encodeURIComponent(uid)}`;
  const qsWallet = `walletAddress=${encodeURIComponent(uid)}`;

  /** @type {Array<[string, () => Promise<unknown>]>} */
  const tasks = [
    ['platformMarket', platformTaskFn],
    ['openPositionsBundle', () => fetchOpenPositionsAnalyticsBundle(uid)],
    [
      'closedPositionsProfit',
      async () => {
        const raw = await getClosedPositionsProfitUsd(uid, { executionLimit: 40, closedLimit: 40 });
        return slimClosedPositionsProfit(raw);
      },
    ],
    [
      'recentSignalsLong',
      async () => slimSignalsPayload(await getRecentLongSignals(uid, { limit: 8, skipCache: true })),
    ],
    [
      'recentSignalsShort',
      async () => slimSignalsPayload(await getRecentLlmSignals(uid, { limit: 8, skipCache: true })),
    ],
    ['portfolioSummary', () => getPortfolioSummary(uid)],
    [
      'transactionCosts',
      async () => {
        const r = await getTransactionCostBreakdown(uid, { limit: 72, offset: 0 });
        return {
          transactions: Array.isArray(r.transactions) ? r.transactions.slice(0, 72) : [],
          pagination: r.pagination || {},
        };
      },
    ],
    ['capitalBridge', () => getCapitalBridge(uid)],
    ['investedCapital', () => getInvestedCapital(uid)],
    ['vaultBalanceComparison', () => getVaultBalanceComparison(uid)],
    [
      'vaultChainHistory',
      async () => {
        const params = new URLSearchParams({ userId: uid });
        const res = await otaApiRequest(
          `${API_ENDPOINTS.ANALYTICS_VAULT_CHAIN_HISTORY}?${params.toString()}`,
          { method: 'GET', timeoutMs: VAULT_CHAIN_HISTORY_TIMEOUT_MS }
        );
        if (res?.success === false) throw new Error(res.error || 'vault chain history failed');
        return shrinkLargeArrays(res, 90);
      },
    ],
    [
      'llmBilling',
      () =>
        otaApiRequest(`${API_ENDPOINTS.OTA_LLM_BILLING_STATUS}?${qsUser}`, { method: 'GET' }),
    ],
    [
      'llmBillingHistory',
      () =>
        otaApiRequest(
          `${API_ENDPOINTS.OTA_LLM_BILLING_HISTORY}?${qsUser}&limit=15`,
          { method: 'GET' }
        ),
    ],
    ['aiTradingBotStatus', () => getAITradingBotStatus(uid)],
    ['autoExecutionStatus', () => getAutoExecutionStatus(uid)],
    ['agentMode', () => getAgentMode(uid)],
    ['botAuthStatus', () => getBotAuthStatus(uid)],
    ['lastSignal', () => getLastSignal(uid)],
    ['agentSessions', () => getAgentSessions(uid, 6)],
    [
      'otaRegistration',
      () => otaApiRequest(`${API_ENDPOINTS.OTA_REGISTRATION_STATUS}?${qsWallet}`, { method: 'GET' }),
    ],
    [
      'openShorts',
      () => otaApiRequest(`${API_ENDPOINTS.OTA_SHORT_OPEN_SHORTS}?${qsUser}`, { method: 'GET' }),
    ],
    [
      'shortActivity',
      () =>
        otaApiRequest(`${API_ENDPOINTS.OTA_SHORT_ACTIVITY}?${qsUser}&limit=25`, { method: 'GET' }),
    ],
  ];

  const keys = tasks.map(([k]) => k);
  const settled = await Promise.allSettled(tasks.map(([, fn]) => fn()));

  const bundleIdx = keys.indexOf('openPositionsBundle');

  const snap = {
    _instructionsReadFirst: OTA_CHAT_SNAPSHOT_HINTS,
    /** Helps the model: no raw SQL — wallet-scoped API aggregation only. */
    _dataProvenance:
      'Read-only snapshot: platformMarket (public BTC reference from backend) plus authenticated backend APIs for this wallet (not direct database access). Map each user question to the correct key; never substitute unrelated metrics (e.g. trading PnL for Vault token balance).',
    fetchedAtIso: new Date().toISOString(),
    walletAddress: uid,
    errors: [],
    chatSnapshotGuide: {
      walletAddressForThisPrompt: uid,
      where: {
        openUnrealizedPnl: 'openPositions.positions + analyticsSummary',
        closedRealizedPnl: 'closedPositionsProfit (totalProfitUsd, executionsDetail, directEntryDetail)',
        vaultTokenBalances: 'vaultBalanceComparison.tokens',
        swapCostsTxSample: 'transactionCosts.pagination + transactionCosts.transactions',
        capitalFlow: 'capitalBridge, investedCapital',
        shorts: 'openShorts, shortActivity',
        signalsLong: 'recentSignalsLong.signals',
        signalsShort: 'recentSignalsShort.signals',
        llmBilling: 'llmBilling, llmBillingHistory',
        botAuto: 'aiTradingBotStatus, autoExecutionStatus, agentMode, botAuthStatus, lastSignal, agentSessions',
        otaRegistration: 'otaRegistration',
        btcReference: 'platformMarket',
      },
    },
  };

  if (settled[0].status === 'fulfilled') {
    snap.platformMarket = settled[0].value;
  } else {
    snap.errors.push({ section: 'platformMarket', reason: safeLabel(settled[0].reason) });
  }

  const bundle = settled[bundleIdx].status === 'fulfilled' ? settled[bundleIdx].value : null;
  if (bundle) {
    const [directEntry, costBasis, analytics] = bundle;
    snap.openPositions = {
      directEntry: Array.isArray(directEntry) ? directEntry : [],
      costBasisPositionCount: Array.isArray(costBasis?.positions) ? costBasis.positions.length : 0,
      analyticsSummary: analytics?.summary || null,
      analyticsPositionExitMode: analytics?.positionExitMode || null,
      positions: Array.isArray(analytics?.positions) ? analytics.positions.slice(0, 80) : [],
      userFacingTruthLabel: analytics?.userFacingTruthLabel ?? null,
    };
  } else {
    snap.errors.push({ section: 'openPositionsBundle', reason: safeLabel(settled[bundleIdx].reason) });
  }

  for (let i = 0; i < settled.length; i++) {
    if (i === 0 || i === bundleIdx) continue;
    const key = keys[i];
    const r = settled[i];
    if (r.status === 'fulfilled') {
      snap[key] = r.value;
    } else {
      snap.errors.push({ section: key, reason: safeLabel(r.reason) });
    }
  }

  return finalize(snap);
}
