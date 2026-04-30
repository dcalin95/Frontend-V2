/**
 * OTA STX Micro-Profit Service – schelet implementare.
 * Strategie dump & pump pe Stacks: profit mic per round-trip, puțin peste costul de gas.
 * Plan: stx/OTA_STX_MICRO_PROFIT_IMPLEMENTATION_PLAN.md
 * Backend: chain=stx. Contracte: remix/OTA/STACKS.
 */

import { STX_TOKENS } from '../stxTokenConfig';
import { getBackendUrl } from '../../config/apiEndpoints.js';

const STRATEGY_NAME = 'micro-profit-stx';

/** Config strategie (până când backend expune endpoint). */
const DEFAULT_STRATEGY_CONFIG = {
  strategyName: STRATEGY_NAME,
  pair: 'STX/USDA',
  minProfitOverGasUsd: 0.001,
  minProfitOverGasPercent: 100,
  maxSlippageBps: 50,
  enabled: false,
  gasEstimateUsdPerSwap: 0.002,
};

const OTA_API_BASE = getBackendUrl();
const STORAGE_KEY_ENABLED = 'ota-stx-micro-profit-enabled';
const STORAGE_KEY_PERCENT = 'ota-stx-micro-profit-percent';

const CONFIG_CACHE_TTL_MS = 30000;
let configCache = { serverCfg: null, expiresAt: 0 };
let configFetchPromise = null;

export function invalidateStrategyConfigCache() {
  configCache = { serverCfg: null, expiresAt: 0 };
  configFetchPromise = null;
}

export function getLocalEnabled() {
  try {
    const v = localStorage.getItem(STORAGE_KEY_ENABLED);
    if (v === 'true') return true;
    if (v === 'false') return false;
    return null;
  } catch {
    return null;
  }
}

export function setLocalEnabled(value) {
  try {
    localStorage.setItem(STORAGE_KEY_ENABLED, String(!!value));
  } catch {}
}

function getTokenDecimals(symbol) {
  const t = STX_TOKENS.find((x) => x.symbol === symbol);
  return t?.decimals ?? (symbol === 'STX' ? 6 : 6);
}

/**
 * Returnează configurația strategiei micro-profit STX.
 * @returns {Promise<object>}
 */
export async function getStrategyConfig() {
  const now = Date.now();
  const useCache = configCache.serverCfg != null && now < configCache.expiresAt;

  if (OTA_API_BASE && !useCache) {
    if (!configFetchPromise) {
      configFetchPromise = fetch(
        `${OTA_API_BASE}/api/ai-trading/strategies/config?chain=stx&strategy=${STRATEGY_NAME}`
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const serverCfg = data?.config ?? null;
          configCache.serverCfg = serverCfg;
          configCache.expiresAt = Date.now() + CONFIG_CACHE_TTL_MS;
          configFetchPromise = null;
          return serverCfg;
        })
        .catch((e) => {
          console.warn('otaStxMicroProfit: getStrategyConfig fallback', e.message);
          configFetchPromise = null;
          return null;
        });
    }
    const serverCfg = await configFetchPromise;
    const cfg = serverCfg ? { ...DEFAULT_STRATEGY_CONFIG, ...serverCfg } : { ...DEFAULT_STRATEGY_CONFIG };
    const localEnabled = getLocalEnabled();
    if (localEnabled !== null) cfg.enabled = localEnabled;
    try {
      const savedPercent = localStorage.getItem(STORAGE_KEY_PERCENT);
      if (savedPercent != null) {
        const p = parseInt(savedPercent, 10);
        if ([50, 100, 150, 200].includes(p)) cfg.minProfitOverGasPercent = p;
      }
    } catch {}
    return cfg;
  }

  const base = useCache ? { ...DEFAULT_STRATEGY_CONFIG, ...configCache.serverCfg } : { ...DEFAULT_STRATEGY_CONFIG };
  const localEnabled = getLocalEnabled();
  if (localEnabled !== null) base.enabled = localEnabled;
  try {
    const savedPercent = localStorage.getItem(STORAGE_KEY_PERCENT);
    if (savedPercent != null) {
      const p = parseInt(savedPercent, 10);
      if ([50, 100, 150, 200].includes(p)) base.minProfitOverGasPercent = p;
    }
  } catch {}
  return Promise.resolve(base);
}

/**
 * Estimează costul gas pentru un round-trip (1 sell + 1 buy) pe STX.
 * @returns {Promise<number>} Estimare USD per round-trip
 */
export async function estimateGasCostPerRoundTrip() {
  const cfg = await getStrategyConfig();
  const perSwap = cfg.gasEstimateUsdPerSwap ?? DEFAULT_STRATEGY_CONFIG.gasEstimateUsdPerSwap;
  return 2 * perSwap;
}

/**
 * Calculează profitul minim efectiv (USD) pentru un round-trip.
 */
export function getMinProfitUsd(config, gasRoundTripUsd) {
  const cfg = config ?? DEFAULT_STRATEGY_CONFIG;
  if (typeof cfg.minProfitOverGasUsd === 'number' && cfg.minProfitOverGasUsd > 0) {
    return cfg.minProfitOverGasUsd;
  }
  const percent = cfg.minProfitOverGasPercent ?? DEFAULT_STRATEGY_CONFIG.minProfitOverGasPercent;
  const gas = typeof gasRoundTripUsd === 'number' ? gasRoundTripUsd : 2 * (cfg.gasEstimateUsdPerSwap ?? DEFAULT_STRATEGY_CONFIG.gasEstimateUsdPerSwap);
  return gas * (1 + percent / 100);
}

/**
 * Decide dacă ar trebui declanșat un round-trip pe baza datelor de piață.
 * @param {object} marketData - { spreadPct, notionalUsd, side, ... }
 * @returns {Promise<{ trigger: boolean, side: 'buy'|'sell'|null, reason: string, estimatedProfit?: number, minProfit?: number, gasRoundTripUsd?: number, spreadPct?: number, notionalUsd?: number }>}
 */
export async function shouldTriggerRoundTrip(marketData) {
  const config = await getStrategyConfig();
  if (!config.enabled) {
    return { trigger: false, side: null, reason: 'Strategy disabled' };
  }
  const gasRoundTrip = await estimateGasCostPerRoundTrip();
  const minProfit = getMinProfitUsd(config, gasRoundTrip);
  const spreadPct = marketData?.spreadPct ?? 0;
  const notionalUsd = marketData?.notionalUsd ?? 0;
  const estimatedProfit = (spreadPct * notionalUsd) / 100;
  const side = marketData?.side === 'buy' ? 'buy' : marketData?.side === 'sell' ? 'sell' : null;
  const trigger = estimatedProfit > minProfit && !!side;
  const reason = trigger
    ? `Estimated profit $${estimatedProfit.toFixed(6)} > min $${minProfit.toFixed(6)} → trigger`
    : !side
      ? 'No side (buy/sell) provided'
      : `Estimated profit $${estimatedProfit.toFixed(6)} ≤ min $${minProfit.toFixed(6)} → no trigger`;
  return {
    trigger,
    side: trigger ? side : null,
    reason,
    estimatedProfit,
    minProfit,
    gasRoundTripUsd: gasRoundTrip,
    spreadPct,
    notionalUsd,
  };
}

/**
 * Quote pentru swap STX din backend (chain=stx).
 * tokenIn/tokenOut = symbol (STX, USDA).
 * @param {string} tokenIn - Symbol
 * @param {string} tokenOut - Symbol
 * @param {string} amountIn - Amount în minimal units
 * @param {number} [slippageBps] - basis points (50 = 0.5%)
 * @returns {Promise<{ minAmountOut: string }|null>}
 */
export async function fetchStxQuote(tokenIn, tokenOut, amountIn, slippageBps = 50) {
  if (!OTA_API_BASE || !tokenIn || !tokenOut || !amountIn) return null;
  try {
    const decimalsIn = getTokenDecimals(tokenIn);
    const decimalsOut = getTokenDecimals(tokenOut);
    const amountInHuman = parseInt(String(amountIn), 10) / 10 ** decimalsIn;
    if (!Number.isFinite(amountInHuman) || amountInHuman <= 0) return null;
    /** Backend GET /quote validează slippage ca procent (0.1–50), unde 0.5 = jumătate de procent. */
    const slippagePct = (slippageBps || 50) / 100;
    const qs = new URLSearchParams({
      chain: 'stx',
      tokenIn,
      tokenOut,
      amountIn: String(amountInHuman),
      slippage: String(slippagePct),
    });
    const res = await fetch(`${OTA_API_BASE}/api/ai-trading/quote?${qs}`);
    if (!res.ok) return null;
    const data = await res.json().catch(() => ({}));
    if (!data?.success || !data?.quote?.minOut) return null;
    const minOutHuman = parseFloat(String(data.quote.minOut));
    if (!Number.isFinite(minOutHuman) || minOutHuman <= 0) return null;
    const minAmountOut = String(Math.floor(minOutHuman * 10 ** decimalsOut));
    return { minAmountOut };
  } catch {
    return null;
  }
}

/**
 * Execută un round-trip swap pe STX.
 * Backend chain=stx sau direct stxContractService.executeSwap când signer e disponibil.
 * @param {object} params - { userAddress, tokenIn, tokenOut, amountIn, signer, stacksProvider, userId }
 * @returns {Promise<{ success: boolean, txHash?: string, error?: string }>}
 */
export async function executeRoundTrip(params) {
  const { userAddress, tokenIn, tokenOut, amountIn, signer, stacksProvider, userId } = params || {};
  if (!userAddress || !tokenIn || !tokenOut || amountIn == null) {
    return { success: false, error: 'Missing userAddress, tokenIn, tokenOut, or amountIn' };
  }

  let fallbackToDirect = false;
  if (OTA_API_BASE) {
    try {
      const body = {
        chain: 'stx',
        userAddress,
        tokenIn,
        tokenOut,
        amountIn,
        strategy: STRATEGY_NAME,
      };
      if (userId != null && userId !== '') body.userId = String(userId);
      const res = await fetch(`${OTA_API_BASE}/api/ai-trading/execution/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.txForSigning) {
        const { executeSwap } = await import('./stxContractService.js');
        const msg = data.txForSigning?.msg?.execute_swap ?? data.txForSigning;
        const minAmountOut = msg?.min_amount_out ?? msg?.minAmountOut ?? '0';
        const result = await executeSwap({
          senderAddress: userAddress,
          tokenIn,
          tokenOut,
          amountIn,
          minAmountOut,
          signer,
          stacksProvider,
          backendPayload: data.txForSigning,
        });
        return { success: true, txHash: result?.txHash };
      }
      if (res.ok && data?.txHash) return { success: true, txHash: data.txHash };
      if (res.status === 501 || res.status === 502) fallbackToDirect = true;
      else return { success: false, error: data?.error || res.statusText };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  if (!OTA_API_BASE || fallbackToDirect) {
    try {
      const config = await getStrategyConfig();
      const slippageBps = config?.maxSlippageBps ?? 50;
      const quote = await fetchStxQuote(tokenIn, tokenOut, amountIn, slippageBps);
      const minAmountOut = quote?.minAmountOut ?? '0';
      const { executeSwap } = await import('./stxContractService.js');
      const result = await executeSwap({
        senderAddress: userAddress,
        tokenIn,
        tokenOut,
        amountIn,
        minAmountOut,
        signer,
        stacksProvider,
      });
      return { success: true, txHash: result?.txHash };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  return { success: false, error: 'No execution path available' };
}

/**
 * Request OTA acknowledgment pentru round-trip STX (ack-only — see API persistedToDatabase).
 * @param {{ txHash?: string, amountStx?: string, strategy?: string }} payload
 * @returns {Promise<{ message: string, ackOnly?: boolean, persistedToDatabase?: boolean }>}
 */
export async function requestOtaAiStxRoundTripAck(payload) {
  const { txHash, amountStx, strategy } = payload || {};
  const fallbackMsg = 'Round-trip ack: micro-profit-stx (no DB row from this endpoint).';
  if (!OTA_API_BASE) {
    return {
      message: 'Ack skipped: set REACT_APP_OTA_API_URL / REACT_APP_BACKEND_URL.',
      ackOnly: true,
      persistedToDatabase: false,
    };
  }
  try {
    const res = await fetch(`${OTA_API_BASE}/api/ai-trading/stx/round-trip-ack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        txHash: txHash || null,
        amountStx: amountStx || null,
        strategy: strategy || STRATEGY_NAME,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && (data.message || data.text)) {
      return {
        message: String(data.message || data.text),
        ackOnly: data.ackOnly !== false,
        persistedToDatabase: Boolean(data.persistedToDatabase),
      };
    }
    if (res.status === 404 || res.status === 501) return { message: fallbackMsg, ackOnly: true, persistedToDatabase: false };
    return {
      message: data?.error ? String(data.error) : fallbackMsg,
      ackOnly: true,
      persistedToDatabase: false,
    };
  } catch (e) {
    return { message: 'Ack failed (network). On-chain tx is still authoritative.', ackOnly: true, persistedToDatabase: false };
  }
}

/**
 * GET /api/ai-trading/stx/bot-address – adresa wallet bot STX (Auto).
 * @returns {Promise<{ botStxAddress: string | null }>}
 */
export async function getStxBotAddress() {
  if (!OTA_API_BASE) return { botStxAddress: null };
  try {
    const res = await fetch(`${OTA_API_BASE}/api/ai-trading/stx/bot-address`);
    const data = await res.json().catch(() => ({}));
    const addr = data?.botStxAddress ?? data?.botStx ?? data?.address ?? null;
    return { botStxAddress: addr, address: addr };
  } catch {
    return { botStxAddress: null };
  }
}

/**
 * GET /api/ai-trading/stx/auto/status?userId=...
 * @returns {Promise<{ enabled: boolean, minProfitOverGasPercent: number, maxAmountPerTrade: string, workerActive: boolean, lastRunAt: string|null, executions24h: number }>}
 */
export async function getStxAutoStatus(userId) {
  if (!OTA_API_BASE || !userId) {
    return {
      enabled: false,
      minProfitOverGasPercent: 100,
      maxAmountPerTrade: '10',
      preferredPair: 'STX/USDA',
      workerActive: false,
      workerLastCycleAt: null,
      autoExecutionDeployed: false,
      executionReady: false,
      mode: 'unknown',
      blockReason: null,
      readiness: null,
      latestDecision: null,
      stacksUserPrincipal: null,
      needsStacksPrincipal: false,
      broadcastEnabled: false,
      lastRunAt: null,
      executions24h: 0,
    };
  }
  try {
    const res = await fetch(`${OTA_API_BASE}/api/ai-trading/stx/auto/status?userId=${encodeURIComponent(userId)}`);
    const data = await res.json().catch(() => ({}));
    if (!data?.success) {
      return {
        enabled: false,
        minProfitOverGasPercent: 100,
        maxAmountPerTrade: '10',
        preferredPair: 'STX/USDA',
        workerActive: false,
        workerLastCycleAt: null,
        autoExecutionDeployed: false,
        executionReady: false,
        mode: 'unknown',
        blockReason: null,
        readiness: null,
        latestDecision: null,
        stacksUserPrincipal: null,
        needsStacksPrincipal: false,
        broadcastEnabled: false,
        lastRunAt: null,
        executions24h: 0,
      };
    }
    return {
      enabled: !!data.enabled,
      minProfitOverGasPercent: data.minProfitOverGasPercent ?? 100,
      maxAmountPerTrade: data.maxAmountPerTrade ?? '10',
      preferredPair: data.preferredPair ?? 'STX/USDA',
      workerActive: !!data.workerActive,
      workerLastCycleAt: data.workerLastCycleAt ?? null,
      autoExecutionDeployed: data.autoExecutionDeployed !== undefined ? !!data.autoExecutionDeployed : true,
      executionReady: !!data.executionReady,
      mode: data.mode ?? 'unknown',
      blockReason: data.blockReason ?? null,
      readiness: data.readiness ?? null,
      latestDecision: data.latestDecision ?? null,
      stacksUserPrincipal: data.stacksUserPrincipal ?? null,
      needsStacksPrincipal: !!data.needsStacksPrincipal,
      broadcastEnabled: !!data.broadcastEnabled,
      lastRunAt: data.lastRunAt ?? null,
      executions24h: data.executions24h ?? 0,
    };
  } catch {
    return {
      enabled: false,
      minProfitOverGasPercent: 100,
      maxAmountPerTrade: '10',
      preferredPair: 'STX/USDA',
      workerActive: false,
      workerLastCycleAt: null,
      autoExecutionDeployed: false,
      executionReady: false,
      mode: 'unknown',
      blockReason: null,
      readiness: null,
      latestDecision: null,
      stacksUserPrincipal: null,
      needsStacksPrincipal: false,
      broadcastEnabled: false,
      lastRunAt: null,
      executions24h: 0,
    };
  }
}

/**
 * POST /api/ai-trading/stx/auto/set
 */
export async function setStxAuto(userId, params) {
  if (!OTA_API_BASE || !userId) return { success: false };
  try {
    const res = await fetch(`${OTA_API_BASE}/api/ai-trading/stx/auto/set`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...params }),
    });
    const data = await res.json().catch(() => ({}));
    return data;
  } catch {
    return { success: false };
  }
}

export { STRATEGY_NAME, DEFAULT_STRATEGY_CONFIG };
