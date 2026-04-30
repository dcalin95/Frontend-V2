/**
 * 🤖 AI Trading API Service - Frontend API Client
 *
 * Toate apelurile merg la backend real (getApiBaseUrl()). Fără răspunsuri mock sau prescrise.
 * - analyzeMarket → POST /ai-trading/analyze (backend + OpenAI). La eroare: throw.
 * - getSignals → GET /ai-trading/signals. La eroare: throw.
 * - recordManualOutcome → POST /ai-trading/record-outcome.
 *
 * @module aiTradingApiService
 */

import { API_ENDPOINTS } from '../utils/constants';
import { getApiBaseUrl } from '../../config/apiEndpoints.js';
import { otaApiRequest } from '../utils/otaApiClient';
import { normalizeManualOutcomePair } from '../../sei/utils/normalizeManualOutcomePair';
import { shouldRequestEngineNoOpenAiFromPreference } from '../utils/otaAnalysisModePreference';

const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
const DE_DEBUG = false; // set true to re-enable [DE] console logs

/** Request către OTA/backend: timeout 15s, 1 retry la eroare de rețea, getApiBaseUrl() la fiecare request. */
async function apiRequest(endpoint, options = {}) {
  const isDE = typeof endpoint === 'string' && endpoint.includes('direct-entry');
  try {
    const res = await otaApiRequest(endpoint, options);
    return res;
  } catch (error) {
    const isDirectEntryRevert = endpoint.includes('direct-entry/open') && (error?.code === 'CALL_EXCEPTION' || /transaction failed/i.test(error?.message || ''));
    const isTimeout = /timed out|timeout/i.test(String(error?.message ?? ''));
    if (process.env.NODE_ENV === 'development' && !isDirectEntryRevert && !isTimeout) {
      const debug = {
        endpoint,
        message: error?.message,
        reason: error?.reason,
        code: error?.code,
        hint: error?.hint,
        botAddressUsed: error?.botAddressUsed,
        error: error?.error ? { message: error.error?.message, reason: error.error?.reason } : undefined
      };
      console.warn('[aiTradingApiService] API Error', debug);
    }
    throw error;
  }
}

/**
 * Start AI Trading Bot
 * @param {string} userId - User ID
 * @param {Object} config - Trading configuration
 * @returns {Promise<Object>} Bot instance ID
 */
export async function startAITradingBot(userId, config) {
  if (!userId) {
    throw new Error('User ID is required');
  }
  if (!config || typeof config !== 'object') {
    throw new Error('Config is required and must be an object');
  }

  return apiRequest(API_ENDPOINTS.AI_TRADING_START, {
    method: 'POST',
    body: JSON.stringify({ userId, config })
  });
}

/**
 * Stop AI Trading Bot
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Success response
 */
export async function stopAITradingBot(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  return apiRequest(API_ENDPOINTS.AI_TRADING_STOP, {
    method: 'POST',
    body: JSON.stringify({ userId })
  });
}

/**
 * Get AI Trading Bot Status
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Bot status
 */
export async function getAITradingBotStatus(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  return apiRequest(`${API_ENDPOINTS.AI_TRADING_STATUS}?userId=${encodeURIComponent(userId)}`, {
    method: 'GET'
  });
}

/**
 * Get AI Trading Bot Statistics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Bot statistics
 */
export async function getAITradingBotStats(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  return apiRequest(`${API_ENDPOINTS.AI_TRADING_STATS}?userId=${encodeURIComponent(userId)}`, {
    method: 'GET'
  });
}

/**
 * Analyze Market și generează trading signal (OTA).
 * Pentru LLM care învață: trimite recentOutcomes ca context (backend le poate include în prompt).
 * Folosește buildAnalyzeOptions() din otaOutcomesHelper pentru shape consistent.
 *
 * @param {string} token - Token symbol (BTC, ETH, BNB, etc.)
 * @param {Object} options - Options pentru analyze (SSOT: otaOutcomesHelper.buildAnalyzeOptions)
 * @param {string|null} [options.userId] - User/wallet ID (opțional)
 * @param {string} [options.quoteToken='USDT'] - Quote token
 * @param {Object|null} [options.marketData] - Snapshot piață (preț, volume, change24h)
 * @param {string|number|null} [options.amountIn] - Amount pentru analiză
 * @param {Array<{token: string, side: string, entryPrice: number, exitPrice?: number, pnl?: number, pnlPercent?: number, timestamp: string}>} [options.recentOutcomes] - Ultimele N outcome-uri pentru LLM (max 10)
 * @param {boolean} [options.engineNoOpenAi] - true: cere doar motor OTA (fără apel OpenAI) dacă backend acceptă `engineNoOpenAi`; false forțează flux cu OpenAI; omis: folosește comutatorul din /dex-edu/ota/short-ops (localStorage)
 * @param {string} [options.tradeContext] - opțional; ex. `short_live` — backend poate marca persistența semnalului pentru feed Futures SHORT (dacă suportă câmpul).
 * @param {number} [options.timeoutMs] - opțional; timeout request (implicit 15s în otaApiClient). Analizele pot dura 30–60s.
 * @returns {Promise<Object>} Trading signal (response.signal sau response)
 */
export async function analyzeMarket(token, options = {}) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token is required and must be a string');
  }

  const {
    userId = null,
    quoteToken = 'USDT',
    marketData = null,
    amountIn = null,
    recentOutcomes = null,
    engineNoOpenAi: engineNoOpenAiOpt,
    tradeContext = null,
    timeoutMs: timeoutMsOpt,
  } = typeof options === 'object' && options !== null ? options : {};

  const body = { token, quoteToken, userId, marketData, amountIn };
  if (Array.isArray(recentOutcomes) && recentOutcomes.length > 0) {
    body.recentOutcomes = recentOutcomes;
  }
  const tc = tradeContext != null ? String(tradeContext).trim() : '';
  if (tc !== '') {
    body.tradeContext = tc;
  }

  let engineNoOpenAi = false;
  if (engineNoOpenAiOpt === true) engineNoOpenAi = true;
  else if (engineNoOpenAiOpt === false) engineNoOpenAi = false;
  else engineNoOpenAi = shouldRequestEngineNoOpenAiFromPreference();
  if (engineNoOpenAi) {
    body.engineNoOpenAi = true;
  }

  const reqOpts = {
    method: 'POST',
    body: JSON.stringify(body),
  };
  if (timeoutMsOpt != null && Number.isFinite(Number(timeoutMsOpt)) && Number(timeoutMsOpt) > 0) {
    reqOpts.timeoutMs = Number(timeoutMsOpt);
  }

  const data = await apiRequest(API_ENDPOINTS.OTA_ANALYZE, reqOpts);
  if (data && data.success === false) {
    const msg =
      (typeof data.error === 'string' && data.error.trim()) ||
      (typeof data.message === 'string' && data.message.trim()) ||
      'OTA analyze a returnat success: false';
    const err = new Error(msg);
    if (data.code != null) err.code = data.code;
    throw err;
  }
  return data;
}

/**
 * Get OTA health status
 * @returns {Promise<Object>} Health status
 */
export async function getOTAHealth() {
  return apiRequest(API_ENDPOINTS.OTA_HEALTH, {
    method: 'GET'
  });
}

/**
 * Get daily analysis quota for user (analyses today, max per day, left).
 * Exempt users (admin/creator) get isExempt: true and high analysesLeft.
 * @param {string} userId - User ID (required)
 * @returns {Promise<{ analysesToday: number, maxAnalysesPerDay: number, analysesLeft: number, isExempt?: boolean }>}
 */
export async function getOTAQuota(userId) {
  if (!userId) {
    return { analysesToday: 0, maxAnalysesPerDay: 0, analysesLeft: 0 };
  }
  const params = new URLSearchParams({ userId });
  const res = await apiRequest(`${API_ENDPOINTS.OTA_QUOTA}?${params}`, { method: 'GET' });
  return {
    analysesToday: res.analysesToday ?? 0,
    maxAnalysesPerDay: res.maxAnalysesPerDay ?? 0,
    analysesLeft: res.analysesLeft ?? 0,
    isExempt: Boolean(res.isExempt)
  };
}

/**
 * Get quote for token swap (OTA)
 * @param {string} tokenIn - Token in
 * @param {string} tokenOut - Token out
 * @param {string} amountIn - Amount in
 * @param {{ chain?: string }} options - Optional; chain e.g. 'sei' for SEI quote
 * @returns {Promise<Object>} Quote (price, amountOut, minOut, ...)
 */
export function unwrapOtaQuotePayload(quoteResponse) {
  return quoteResponse?.quote ?? quoteResponse ?? null;
}

export function readOtaQuoteNumber(quoteResponse) {
  const payload = unwrapOtaQuotePayload(quoteResponse);
  const numericValue = payload?.price != null ? Number(payload.price) : payload?.amountOut != null ? Number(payload.amountOut) : null;
  return Number.isFinite(numericValue) ? numericValue : null;
}

export async function getOTAQuote(tokenIn, tokenOut, amountIn, options = {}) {
  if (!tokenIn || !tokenOut || !amountIn) {
    throw new Error('tokenIn, tokenOut, and amountIn are required');
  }

  const params = new URLSearchParams({ tokenIn, tokenOut, amountIn });
  if (options.chain) params.append('chain', options.chain);
  return apiRequest(`${API_ENDPOINTS.OTA_QUOTE}?${params}`, {
    method: 'GET'
  });
}

/**
 * Get market data for a token (OTA)
 * @param {string} token - Token symbol
 * @param {string} quoteToken - Quote token (default: USDT)
 * @param {number} [slippagePercent] - Slippage % for quote (e.g. 20 for Direct Entry); optional, backend default 0.5
 * @returns {Promise<Object>} Market data
 */
export async function getOTAMarketData(token, quoteToken = 'USDT', slippagePercent = null) {
  if (!token) {
    throw new Error('Token is required');
  }

  const params = new URLSearchParams({ token, quoteToken });
  if (slippagePercent != null && Number.isFinite(Number(slippagePercent))) {
    params.append('slippage', String(Number(slippagePercent)));
  }
  const ep = `${API_ENDPOINTS.OTA_MARKET}?${params}`;
  try {
    const r = await apiRequest(ep, { method: 'GET' });
    return r;
  } catch (e) {
    if (DE_DEBUG && isDev && !/timed out|timeout/i.test(String(e?.message ?? ''))) {
      console.warn('[DE] getOTAMarketData FAIL', { token, quoteToken, message: e?.message });
    }
    throw e;
  }
}

/**
 * Get analysis history for a user (OTA)
 * @param {string} userId - User identifier (wallet address)
 * @param {Object} options - { limit, token, offset }
 * @returns {Promise<Object>} Analysis history
 */
export async function getOTAHistory(userId, options = {}) {
  if (!userId) {
    throw new Error('userId is required');
  }

  const { limit = 50, token = null, offset = 0 } = options;
  const params = new URLSearchParams({ userId, limit: limit.toString(), offset: offset.toString() });
  if (token) {
    params.append('token', token);
  }

  return apiRequest(`${API_ENDPOINTS.OTA_HISTORY}?${params}`, {
    method: 'GET'
  });
}

/**
 * Get statistics for a user (OTA)
 * @param {string} userId - User identifier (wallet address)
 * @returns {Promise<Object>} Statistics
 */
export async function getOTAStats(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }

  const params = new URLSearchParams({ userId });
  return apiRequest(`${API_ENDPOINTS.OTA_STATS}?${params}`, {
    method: 'GET'
  });
}

/**
 * Get OTA Auto Execution worker status (backend).
 * When userId provided, backend returns useAgentMode (per-user toggle).
 * @param {string} [userId] - Optional wallet address for useAgentMode
 * @returns {Promise<Object>} { enabled, lastRunAt?, executionsCount24h?, useAgentMode?, agent? }
 */
export async function getAutoExecutionStatus(userId) {
  const q = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  /** 25s: endpoint uneori lent (Render / DB); default 15s băga prea des LIVE NO-GO cu timeout în UI. */
  return apiRequest(`${API_ENDPOINTS.OTA_AUTO_EXECUTION_STATUS}${q}`, {
    method: 'GET',
    timeoutMs: 25000,
  });
}

/**
 * Last execution for Activity panel. GET /api/ai-trading/last-signal?userId=0x...
 * @param {string} userId - Wallet address
 * @returns {Promise<{ success: boolean, lastSignal: { token, side, executedAt } | null }>}
 */
export async function getLastSignal(userId) {
  if (!userId) return { success: true, lastSignal: null };
  return apiRequest(`${API_ENDPOINTS.OTA_LAST_SIGNAL || '/ai-trading/last-signal'}?userId=${encodeURIComponent(userId)}`, {
    method: 'GET'
  });
}

/**
 * Get per-user Agent Mode preference. GET /api/ai-trading/policy/agent-mode
 * @param {string} walletAddress - Wallet address
 * @returns {Promise<Object>} { success, useAgentMode: true|false|null }
 */
export async function getAgentMode(walletAddress) {
  if (!walletAddress) return { success: true, useAgentMode: null };
  return apiRequest(`${API_ENDPOINTS.OTA_POLICY_AGENT_MODE || '/ai-trading/policy/agent-mode'}?walletAddress=${encodeURIComponent(walletAddress)}`, {
    method: 'GET'
  });
}

/**
 * Set per-user Agent Mode. POST /api/ai-trading/policy/agent-mode
 * @param {string} walletAddress - Wallet address
 * @param {boolean|null} useAgentMode - true=Agent, false=standard analyze, null=follow global
 */
export async function setAgentMode(walletAddress, useAgentMode) {
  if (!walletAddress) return;
  await apiRequest(API_ENDPOINTS.OTA_POLICY_AGENT_MODE || '/ai-trading/policy/agent-mode', {
    method: 'POST',
    body: JSON.stringify({ walletAddress, useAgentMode })
  });
}

/**
 * Get per-user bot auth duration preference. GET /api/ai-trading/policy/bot-auth-duration
 * @param {string} walletAddress - Wallet address
 * @returns {Promise<{ success: boolean, botAuthDuration: string|null }>} '1d'|'7d'|'30d'|'unlimited' or null
 */
export async function getBotAuthDuration(walletAddress) {
  if (!walletAddress) return { success: true, botAuthDuration: null };
  return apiRequest(
    `${API_ENDPOINTS.OTA_POLICY_BOT_AUTH_DURATION || '/ai-trading/policy/bot-auth-duration'}?walletAddress=${encodeURIComponent(walletAddress)}`,
    { method: 'GET' }
  );
}

/**
 * Get unified bot auth status (preference + on-chain). GET /api/ai-trading/policy/bot-auth-status
 * @param {string} walletAddress - Wallet address
 * @returns {Promise<{ success: boolean, preferredDuration?: string|null, preferredDurationSource?: string, onChainEffectiveActive?: boolean, reauthorizationRequired?: boolean, mismatchDetected?: boolean, mismatchReason?: string|null, message?: string, ... }>}
 */
export async function getBotAuthStatus(walletAddress) {
  if (!walletAddress) return { success: true, preferredDuration: null, reauthorizationRequired: true };
  return apiRequest(
    `${API_ENDPOINTS.OTA_POLICY_BOT_AUTH_STATUS || '/ai-trading/policy/bot-auth-status'}?walletAddress=${encodeURIComponent(walletAddress)}`,
    { method: 'GET' }
  );
}

/**
 * Set per-user bot auth duration preference. POST /api/ai-trading/policy/bot-auth-duration
 * Saves to DB only; does NOT update on-chain. Response includes reauthorizationRequired and message.
 * @param {string} walletAddress - Wallet address
 * @param {string} botAuthDuration - '1d'|'7d'|'30d'|'unlimited'
 * @returns {Promise<{ success: boolean, preferredDuration?: string, savedTo?: string, onChainAuthorizationUpdated?: boolean, reauthorizationRequired?: boolean, message?: string }>}
 */
export async function setBotAuthDuration(walletAddress, botAuthDuration) {
  if (!walletAddress) return { success: false };
  return apiRequest(API_ENDPOINTS.OTA_POLICY_BOT_AUTH_DURATION || '/ai-trading/policy/bot-auth-duration', {
    method: 'POST',
    body: JSON.stringify({ walletAddress, botAuthDuration })
  });
}

/**
 * Get OTA LLM Agent sessions for user (decisions, turns, tokens).
 * GET /api/ai-trading/agent/sessions?userId=0x...&limit=20
 */
export async function getAgentSessions(userId, limit = 10) {
  if (!userId) return { sessions: [] };
  const endpoint = `${API_ENDPOINTS.OTA_AGENT_SESSIONS || '/ai-trading/agent/sessions'}?userId=${encodeURIComponent(userId)}&limit=${limit}`;
  return apiRequest(endpoint, { method: 'GET' });
}

/**
 * Pornește o rulare agent cu trace live în memorie (backend). Răspuns 202: { success, runId }.
 * Consumă evenimentele cu fetchOtaAgentTraceEvents sau EventSource pe getOtaAgentTraceStreamUrl.
 * @see docs/OTA_LIVE_AGENT_TRACE_PLAN.md
 */
export async function startOtaAgentTrace({ userId, token = 'BNB', riskLevel = 'moderate' }) {
  if (!userId) throw new Error('userId is required');
  const path = API_ENDPOINTS.OTA_AGENT_TRACE_START || '/ai-trading/agent/trace/start';
  return apiRequest(path, {
    method: 'POST',
    body: JSON.stringify({ userId, token, riskLevel }),
  });
}

/**
 * GET polling: evenimente noi după indexul `after` (0 = de la început).
 * @returns {Promise<{ success, events, nextAfter, done, sessionId?, error? }>}
 */
export async function fetchOtaAgentTraceEvents(runId, userId, after = 0) {
  if (!runId || !userId) throw new Error('runId and userId are required');
  const base = API_ENDPOINTS.OTA_AGENT_TRACE_RUN_BASE || '/ai-trading/agent/trace';
  const endpoint = `${base}/${encodeURIComponent(runId)}/events?userId=${encodeURIComponent(userId)}&after=${encodeURIComponent(String(after))}`;
  return apiRequest(endpoint, { method: 'GET' });
}

/**
 * Trace live din rulările reale ale executorului OTA (aceleași evenimente ca POST /trace/start, dar fără Run manual).
 * @param {object} [opts] — `futuresLane`: `'short'|'long'` trimis ca query `futuresLane` (dacă backend suportă buffer separat).
 * @returns {Promise<{ success, events, nextAfter, active, currentToken?, source?, bufferEpoch?, resync? }>}
 */
export async function fetchOtaAgentTraceLive(userId, after = 0, epoch = null, opts = {}) {
  if (!userId) throw new Error('userId is required');
  const path = API_ENDPOINTS.OTA_AGENT_TRACE_LIVE || '/ai-trading/agent/trace/live';
  const q = new URLSearchParams({
    userId: String(userId),
    after: String(after),
  });
  if (epoch != null && epoch !== '') q.set('epoch', String(epoch));
  const lane = opts.futuresLane != null ? String(opts.futuresLane).trim().toLowerCase() : '';
  if (lane === 'short' || lane === 'long') q.set('futuresLane', lane);
  const endpoint = `${path}?${q.toString()}`;
  return apiRequest(endpoint, { method: 'GET' });
}

/**
 * URL absolut pentru `EventSource` (SSE). Folosește același origin ca getApiBaseUrl().
 * @param {string} runId
 * @param {string} userId
 * @returns {string}
 */
export function getOtaAgentTraceStreamUrl(runId, userId) {
  const apiBase = getApiBaseUrl();
  if (!apiBase || typeof apiBase !== 'string') {
    throw new Error('[getOtaAgentTraceStreamUrl] getApiBaseUrl() empty');
  }
  const base = apiBase.replace(/\/$/, '');
  const pathBase = API_ENDPOINTS.OTA_AGENT_TRACE_RUN_BASE || '/ai-trading/agent/trace';
  return `${base}${pathBase}/${encodeURIComponent(runId)}/stream?userId=${encodeURIComponent(userId)}`;
}

/**
 * Setează sesiunea Auto în backend (persistență) – worker-ul știe cine are Auto ON și poate apela OpenAI.
 * POST /api/ai-trading/auto/session – backend înregistrează/dez înregistrează user în AITradingExecutor.
 * Fire-and-forget: eroare = doar log, nu blochează UI.
 * @param {string} userId - wallet address
 * @param {boolean} enabled - true = Start, false = Stop
 * @param {Object} [options] - opțional: minProfitOverGasPercent (5|50|100|1000), maxLossPercent (0|3|5|10),
 * usdMinPerTrade, usdMaxPerTrade, usdDailyCap, maxTradesPer12h (1–100), forceOpenNow
 * @see docs/OTA_PROFIT_TIER_AND_LOSS_CLOSING_PROPOSAL.md
 */
/**
 * Clear safety stop for BSC so the executor can process this user when Auto is on.
 * POST /api/ai-trading/safety/set with stopAll: false, chains: { bsc: false }.
 * Fire-and-forget (catch and log only).
 */
export async function clearSafetyStopForBsc(walletAddress) {
  if (!walletAddress) return;
  try {
    await apiRequest(API_ENDPOINTS.OTA_SAFETY_SET || '/ai-trading/safety/set', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, stopAll: false, chains: { bsc: false } })
    });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[clearSafetyStopForBsc]', err?.message);
    }
  }
}

export async function setAutoSession(userId, enabled, options = {}) {
  if (!userId) return undefined;
  try {
    const body = { userId, enabled };
    if (options.minProfitOverGasPercent != null) body.minProfitOverGasPercent = options.minProfitOverGasPercent;
    if (options.maxLossPercent != null) body.maxLossPercent = options.maxLossPercent;
    if (options.usdMinPerTrade != null) body.usdMinPerTrade = options.usdMinPerTrade;
    if (options.usdMaxPerTrade != null) body.usdMaxPerTrade = options.usdMaxPerTrade;
    if (options.usdDailyCap != null) body.usdDailyCap = options.usdDailyCap;
    if (options.maxTradesPer12h != null) body.maxTradesPer12h = options.maxTradesPer12h;
    if (options.forceOpenNow === true) body.forceOpenNow = true;
    const res = await apiRequest(API_ENDPOINTS.OTA_AUTO_SESSION || '/ai-trading/auto/session', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    return res;
  } catch (err) {
    if (options.throwOnError === true) {
      throw err;
    }
    if (process.env.NODE_ENV === 'development') {
      console.warn('[setAutoSession] Backend session sync failed:', err?.message);
    }
  }
}

/**
 * Record manual trade outcome for LLM context (backend inserts into ota.trade_outcomes, source='manual').
 * Backend must implement POST /api/ai-trading/record-outcome. Safe to call; 404/501 = no-op for UI.
 * @param {Object} payload - { userId?, token, side, entryPrice?, exitPrice?, pnl?, source: 'manual', simulated?: boolean, txHash?: string }
 * @returns {Promise<Object>} Backend response or throws
 */
export async function recordManualOutcome(payload) {
  const body = { ...payload, source: payload.source || 'manual' };
  if (body.chain === 'sei' && (body.pair || body.outcomeBase || body.token)) {
    const n = normalizeManualOutcomePair({
      pair: body.pair,
      base: body.outcomeBase || body.token || body.tokenIn,
      quote: body.outcomeQuote || body.tokenOut,
    });
    if (n.valid && n.pair) {
      body.pair = n.pair;
      body.outcomeBase = n.outcomeBase;
      body.outcomeQuote = n.outcomeQuote;
    } else {
      delete body.pair;
      if (n.outcomeBase && n.outcomeQuote) {
        body.outcomeBase = n.outcomeBase;
        body.outcomeQuote = n.outcomeQuote;
      }
    }
  }
  return apiRequest(API_ENDPOINTS.OTA_RECORD_OUTCOME || '/ai-trading/record-outcome', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

/**
 * Direct Entry – Open position (user-initiated, token from Header).
 * POST /api/ai-trading/direct-entry/open – body: { walletAddress, token, amountUsd, quoteToken }
 * Backend: amountUsd is ALWAYS "amount in quote token" (e.g. 0.012 + quoteToken BNB = 0.012 BNB, NOT 0.012 USD).
 * @param {string} walletAddress - User wallet
 * @param {string} token - Token symbol (from Header selector, e.g. CAKE)
 * @param {number} amountUsd - Amount in quote token (when quoteToken is BNB, this is BNB amount; when USDT, USDT amount)
 * @param {string} [quoteToken='USDT'] - Quote token: 'USDT' | 'USDC' | 'BNB' | 'ETH'
 * @param {number} [maxSlippageBps] - Max slippage in basis points (e.g. 2000 = 20%). Backend uses this for amountOutMin buffer.
 * @param {number} [maxLossPct] - Optional per-position stop-loss % (0, 3, 5, 10). If set, OTA closes at this % loss; else uses Policy Loss limit.
 */
/**
 * @param {string} [path] - Optional 2-hop path [quoteTokenAddress, tokenAddress]. When provided, backend uses it (avoids 3-hop when executor allows only 2-hop).
 */
export async function directEntryOpen(walletAddress, token, amountUsd = 10, quoteToken = 'USDT', maxSlippageBps = undefined, maxLossPct = undefined, path = undefined) {
  if (!walletAddress || !token) {
    throw new Error('walletAddress and token are required');
  }
  const qt = (quoteToken || 'USDT').toString().trim().toUpperCase();
  if (qt !== 'USDT' && qt !== 'USDC' && qt !== 'BNB' && qt !== 'ETH') {
    throw new Error('quoteToken must be USDT, USDC, BNB, or ETH');
  }
  const body = { walletAddress, token, amountUsd: Number(amountUsd), quoteToken: qt };
  if (maxSlippageBps != null && Number.isFinite(maxSlippageBps)) body.maxSlippageBps = Math.max(1, Math.min(3000, Math.round(maxSlippageBps)));
  if (maxLossPct != null && [0, 3, 5, 10].includes(Number(maxLossPct))) body.maxLossPct = Number(maxLossPct);
  if (Array.isArray(path) && path.length === 2 && path.every((a) => typeof a === 'string' && /^0x[a-fA-F0-9]{40}$/.test(a))) body.path = path;
  try {
    const res = await apiRequest(API_ENDPOINTS.OTA_DIRECT_ENTRY_OPEN || '/ai-trading/direct-entry/open', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    return res;
  } catch (e) {
    throw e;
  }
}

/**
 * Direct Entry – Close position (manual).
 * POST /api/ai-trading/direct-entry/close – body: { walletAddress, positionId }
 */
export async function directEntryClose(walletAddress, positionId) {
  if (!walletAddress || !positionId) throw new Error('walletAddress and positionId are required');
  return apiRequest(API_ENDPOINTS.OTA_DIRECT_ENTRY_CLOSE || '/ai-trading/direct-entry/close', {
    method: 'POST',
    body: JSON.stringify({ walletAddress, positionId })
  });
}

/**
 * OTA Auto – Solicitare închidere manuală. Executorul închide poziția la următorul ciclu (1–3 min).
 * POST /api/ai-trading/ota/request-close – body: { walletAddress, token }
 */
export async function requestOtaClose(walletAddress, token) {
  if (!walletAddress || !token) throw new Error('walletAddress and token are required');
  return apiRequest(API_ENDPOINTS.OTA_REQUEST_CLOSE || '/ai-trading/ota/request-close', {
    method: 'POST',
    body: JSON.stringify({ walletAddress, token })
  });
}

/**
 * OTA – Manual close: validate tracked position, queue close (executor closes at next cycle).
 * POST /api/ai-trading/ota/positions/close – body: { userId or walletAddress, token }
 */
export async function postOtaPositionsClose(userId, token) {
  if (!userId || !token) throw new Error('userId and token are required');
  const url = API_ENDPOINTS.OTA_POSITIONS_CLOSE || '/ai-trading/ota/positions/close';
  const body = { userId, walletAddress: userId, token };
  console.log('[OTA Close DEBUG] postOtaPositionsClose request', { url, token, walletLen: String(userId).length });
  try {
    const res = await apiRequest(url, { method: 'POST', body: JSON.stringify(body) });
    console.log('[OTA Close DEBUG] postOtaPositionsClose response', res);
    return res;
  } catch (err) {
    console.error('[OTA Close DEBUG] postOtaPositionsClose API error', { message: err?.message, status: err?.failedStatus, body: err?.responseBody });
    throw err;
  }
}

/**
 * Suspendă analiza OpenAI/LLM pe lane-ul SHORT sau LONG (separate în backend).
 * @param {'short'|'long'} [opts.lane] — obligatoriu pentru separare; lipsă = ambele lane-uri (legacy).
 */
export async function postOtaPositionOpenAiSuspend(userId, token, opts = {}) {
  if (!userId || !token) throw new Error('userId and token are required');
  const lane = opts.lane != null ? String(opts.lane).trim().toLowerCase() : '';
  const url = API_ENDPOINTS.OTA_POSITION_OPENAI_SUSPEND || '/ai-trading/ota/positions/openai-suspend';
  const body = { userId, walletAddress: userId, token };
  if (lane === 'short' || lane === 'long') body.lane = lane;
  return apiRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Reactivează analiza LLM pentru token pe lane-ul dat.
 * @param {'short'|'long'} [opts.lane] — fără lane: elimină ambele (legacy).
 */
export async function deleteOtaPositionOpenAiSuspend(walletAddress, token, opts = {}) {
  if (!walletAddress || !token) throw new Error('walletAddress and token are required');
  const lane = opts.lane != null ? String(opts.lane).trim().toLowerCase() : '';
  const base = API_ENDPOINTS.OTA_POSITION_OPENAI_SUSPEND || '/ai-trading/ota/positions/openai-suspend';
  const params = new URLSearchParams({ walletAddress, userId: walletAddress, token });
  if (lane === 'short' || lane === 'long') params.set('lane', lane);
  return apiRequest(`${base}?${params.toString()}`, { method: 'DELETE' });
}

/**
 * Lista simbolurilor cu LLM suspendat; opțional filtrat pe lane.
 * @param {'short'|'long'} [opts.lane]
 */
export async function getOtaPositionOpenAiSuspendList(walletAddress, opts = {}) {
  if (!walletAddress) throw new Error('walletAddress is required');
  const lane = opts.lane != null ? String(opts.lane).trim().toLowerCase() : '';
  const root = API_ENDPOINTS.OTA_POSITION_OPENAI_SUSPEND || '/ai-trading/ota/positions/openai-suspend';
  const params = new URLSearchParams({ walletAddress, userId: walletAddress });
  if (lane === 'short' || lane === 'long') params.set('lane', lane);
  return apiRequest(`${root}?${params.toString()}`, { method: 'GET' });
}

/**
 * OTA – Status închidere manuală (pentru popup trace). GET ?walletAddress=&token=
 * Returns: { status: 'queued'|'completed'|'unknown', requestSource?, txHash?, amountIn?, amountOut?, executedAt?, message? }
 */
export async function getManualCloseStatus(walletAddress, token) {
  if (!walletAddress || !token) throw new Error('walletAddress and token are required');
  const base = API_ENDPOINTS.OTA_MANUAL_CLOSE_STATUS || '/ai-trading/ota/manual-close-status';
  const params = new URLSearchParams({ walletAddress, token });
  return apiRequest(`${base}?${params.toString()}`, { method: 'GET' });
}

/**
 * Direct Entry – Get open positions (max 3 per wallet).
 * GET /api/ai-trading/direct-entry/position?walletAddress=0x...
 * Returns array of positions (empty array if none).
 */
export async function getDirectEntryPosition(walletAddress) {
  if (!walletAddress) {
    return [];
  }
  try {
    const pos = await apiRequest(`${API_ENDPOINTS.OTA_DIRECT_ENTRY_POSITION || '/ai-trading/direct-entry/position'}?walletAddress=${encodeURIComponent(walletAddress)}`, { method: 'GET' });
    const list = Array.isArray(pos) ? pos : (pos != null ? [pos] : []);
    return list;
  } catch (e) {
    return [];
  }
}

/**
 * Direct Entry – Get recently closed positions (so user can see when OTA closed and PnL).
 * GET /api/ai-trading/direct-entry/positions/closed?walletAddress=0x&limit=10
 */
export async function getDirectEntryClosedPositions(walletAddress, limit = 10) {
  if (!walletAddress) return [];
  try {
    const path = (API_ENDPOINTS.OTA_DIRECT_ENTRY_CLOSED_POSITIONS || '/ai-trading/direct-entry/positions/closed') + `?walletAddress=${encodeURIComponent(walletAddress)}&limit=${Math.max(1, Math.min(50, limit))}`;
    const raw = await apiRequest(path, { method: 'GET' });
    return Array.isArray(raw) ? raw : (raw?.closed ?? raw?.positions ?? []);
  } catch (e) {
    return [];
  }
}

/**
 * Direct Entry – Set LLM may close for an open position.
 * PATCH /api/ai-trading/direct-entry/position/llm-may-close
 */
export async function setDirectEntryLlmMayClose(walletAddress, positionId, llmMayClose) {
  if (!walletAddress || !positionId) throw new Error('walletAddress and positionId required');
  return apiRequest(API_ENDPOINTS.OTA_DIRECT_ENTRY_LLM_MAY_CLOSE || '/ai-trading/direct-entry/position/llm-may-close', {
    method: 'PATCH',
    body: JSON.stringify({ walletAddress, positionId, llmMayClose })
  });
}

/**
 * Direct Entry – Get LLM advice for open position.
 * GET /api/ai-trading/direct-entry/advice?walletAddress=0x...
 */
export async function getDirectEntryAdvice(walletAddress) {
  if (!walletAddress) return { hasPosition: false, advice: null };
  try {
    return await apiRequest(
      `${API_ENDPOINTS.OTA_DIRECT_ENTRY_ADVICE || '/ai-trading/direct-entry/advice'}?walletAddress=${encodeURIComponent(walletAddress)}`,
      { method: 'GET' }
    );
  } catch {
    return { hasPosition: false, advice: null };
  }
}

export default {
  startAITradingBot,
  stopAITradingBot,
  getAITradingBotStatus,
  getAITradingBotStats,
  analyzeMarket,
  // OTA endpoints
  getOTAHealth,
  getOTAQuote,
  getOTAMarketData,
  getOTAHistory,
  getOTAStats,
  getAutoExecutionStatus,
  setAutoSession,
  clearSafetyStopForBsc,
  recordManualOutcome,
  directEntryOpen,
  directEntryClose,
  requestOtaClose,
  postOtaPositionsClose,
  postOtaPositionOpenAiSuspend,
  deleteOtaPositionOpenAiSuspend,
  getOtaPositionOpenAiSuspendList,
  getManualCloseStatus,
  getDirectEntryPosition,
  getDirectEntryClosedPositions,
  setDirectEntryLlmMayClose,
  getDirectEntryAdvice,
  getAgentSessions,
  startOtaAgentTrace,
  fetchOtaAgentTraceEvents,
  getOtaAgentTraceStreamUrl,
  getAgentMode,
  setAgentMode
};

