/**
 * OTA SEI Micro-Profit Service – schelet implementare.
 * Strategie dump & pump pe SEI: profit mic per round-trip, puțin peste costul de gas.
 * Plan complet: src/components/DEX/sei/OTA_SEI_MICRO_PROFIT_IMPLEMENTATION_PLAN.md
 * Backend: backend-server-repo (Render). Contracte: remix/OTA/SEI.
 *
 * Market signal uses SEI/ATOM Astroport pool vs CEX as AUXILIARY input only — not universal for all UI pairs.
 */

import { SEI_AUTO_DEFAULT_PAIR, SEI_AUTO_PAIR_IDS } from '../seiTokenConfig';
import { SEI_REST_LIST } from '../seiConfig';
import { deriveSeiAutoReadinessFromApiPayload } from '../utils/seiAutoReadiness';
import { SEI_MARKET_DATA_STALE_MS, SEI_MIN_EDGE_NET_BPS } from '../constants/otaSeiPageDefaults';
import { computeEdgeNetBps } from '../utils/seiEdgeNetBps';
import { getBackendUrl } from '../../config/apiEndpoints.js';

const STRATEGY_NAME = 'micro-profit-sei';

// Astroport SEI/ATOM XYK pool (singurul pool verificat funcțional)
const SEI_ATOM_POOL = 'sei14kxy2g2cw37ng0mmyk6u54qq7xxxnksyhwcvsaf57g30q7ym23vqlmjpm0';
const ATOM_IBC = 'ibc/6CDD4663F2F09CD62285E2D45891FC149A3568E316CE3EBBE201A71A78A69388';

/** Config strategie */
const DEFAULT_STRATEGY_CONFIG = {
  strategyName: STRATEGY_NAME,
  pair: 'SEI/ATOM',
  minProfitOverGasUsd: 0.0005,
  minProfitOverGasPercent: 100,
  maxSlippageBps: 100, // 1% slippage
  enabled: false,
  gasEstimateUsdPerSwap: 0.05, // gas real pe SEI mainnet ~$0.05/swap
  minDiscrepancyPct: 2.0, // trigger DOAR dacă Binance vs Pool diferă cu >2%
};

/**
 * Fetch preț SEI și ATOM — CoinGecko primary, Binance fallback.
 * CoinGecko nu are throttle agresiv și nu necesită API key.
 * @returns {Promise<{seiUsd: number, atomUsd: number, source: string}>}
 */
export async function fetchBinancePrices() {
  // 1) Încearcă CoinGecko
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=sei-network,cosmos&vs_currencies=usd',
      { headers: { 'Accept': 'application/json' } }
    );
    if (res.ok) {
      const data = await res.json();
      const seiUsd = parseFloat(data?.['sei-network']?.usd) || 0;
      const atomUsd = parseFloat(data?.['cosmos']?.usd) || 0;
      // Validare: prețuri rezonabile (SEI: $0.01–$5, ATOM: $1–$50)
      if (seiUsd > 0.01 && seiUsd < 5 && atomUsd > 1 && atomUsd < 50) {
        return { seiUsd, atomUsd, source: 'CoinGecko' };
      }
    }
  } catch { /* fallback */ }

  // 2) Fallback: Binance
  try {
    const [seiRes, atomRes] = await Promise.all([
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=SEIUSDT'),
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=ATOMUSDT'),
    ]);
    const [seiData, atomData] = await Promise.all([seiRes.json(), atomRes.json()]);
    const seiUsd = parseFloat(seiData.price) || 0;
    const atomUsd = parseFloat(atomData.price) || 0;
    if (seiUsd > 0.01 && seiUsd < 5 && atomUsd > 1 && atomUsd < 50) {
      return { seiUsd, atomUsd, source: 'Binance' };
    }
  } catch { /* fail */ }

  return { seiUsd: 0, atomUsd: 0, source: 'unavailable' };
}

/**
 * Fetch prețul SEI implicat din pool-ul Astroport SEI/ATOM.
 * Simulează: 1 SEI → X ATOM, calculează USD val ATOM → prețul SEI pe pool.
 * @param {number} atomUsd - prețul ATOM în USD (de pe Binance)
 * @returns {Promise<{poolSeiUsd: number, atomPerSei: number}|null>}
 */
export async function fetchPoolImpliedSeiPrice(atomUsd) {
  try {
    const simMsg = {
      simulation: {
        offer_asset: {
          info: { native_token: { denom: 'usei' } },
          amount: '1000000', // 1 SEI = 1,000,000 usei
        },
      },
    };
    const b64 = btoa(JSON.stringify(simMsg));
    const restList = SEI_REST_LIST?.length ? SEI_REST_LIST : ['https://rest.sei-apis.com', 'https://sei-api.polkachu.com'];
    let data = null;
    for (const restUrl of restList) {
      try {
        const res = await fetch(`${restUrl.replace(/\/$/, '')}/cosmwasm/wasm/v1/contract/${SEI_ATOM_POOL}/smart/${b64}`);
        if (res.ok) { data = await res.json(); break; }
      } catch (_) {}
    }
    if (!data) return null;
    const returnUatom = Number(data?.data?.return_amount || 0);
    if (returnUatom <= 0 || !atomUsd) return null;
    const atomPerSei = returnUatom / 1_000_000; // ATOM per 1 SEI
    const poolSeiUsd = atomPerSei * atomUsd; // USD valoare 1 SEI conform pool
    return { poolSeiUsd, atomPerSei };
  } catch {
    return null;
  }
}

/**
 * Calculează discrepanța % între prețul Binance și prețul pool-ului.
 * discrepancyPct > 0 → pool SEI mai ieftin decât Binance (cumperi SEI pe pool)
 * discrepancyPct < 0 → pool SEI mai scump decât Binance (vinzi SEI pe pool)
 * @returns {Promise<{
 *   binanceSeiUsd: number, atomUsd: number,
 *   poolSeiUsd: number, atomPerSei: number,
 *   discrepancyPct: number, side: 'buy'|'sell'|null,
 *   hasOpportunity: boolean, reason: string
 * }>}
 */
export async function fetchMarketDiscrepancy() {
  const { seiUsd: binanceSeiUsd, atomUsd } = await fetchBinancePrices();
  const fetchedAt = Date.now();
  const basis = { marketSignalBasis: 'auxiliary_sei_atom_pool', fetchedAt };

  if (!binanceSeiUsd || !atomUsd) {
    return {
      binanceSeiUsd: 0, atomUsd: 0, poolSeiUsd: 0, atomPerSei: 0, discrepancyPct: 0, side: null, hasOpportunity: false, reason: 'Cannot fetch Binance prices',
      ...basis,
    };
  }

  const poolData = await fetchPoolImpliedSeiPrice(atomUsd);
  if (!poolData) {
    return {
      binanceSeiUsd, atomUsd, poolSeiUsd: 0, atomPerSei: 0, discrepancyPct: 0, side: null, hasOpportunity: false, reason: 'Cannot fetch pool price (low liquidity?)',
      ...basis,
    };
  }

  const { poolSeiUsd, atomPerSei } = poolData;
  // discrepancy: cât % mai ieftin/scump este SEI pe pool față de Binance
  const discrepancyPct = ((binanceSeiUsd - poolSeiUsd) / binanceSeiUsd) * 100;
  const absDisc = Math.abs(discrepancyPct);
  const minDisc = DEFAULT_STRATEGY_CONFIG.minDiscrepancyPct;

  let side = null;
  let hasOpportunity = false;
  let reason = '';

  // Botul ține SEI. Poate vinde SEI pe pool NUMAI când pool SEI e mai SCUMP decât Binance.
  // discrepancyPct < 0 → pool SEI mai scump → OPORTUNITATE (vinde SEI pe pool, primești mai mult ATOM)
  // discrepancyPct > 0 → pool SEI mai ieftin → NU e oportunitate pentru bot (ar trebui ATOM, nu SEI)
  if (absDisc >= minDisc) {
    if (discrepancyPct < 0) {
      // Pool SEI mai scump → bot vinde SEI pe pool, primeste mai mult ATOM decat piata
      hasOpportunity = true;
      side = 'sell';
      reason = `SEI is ${absDisc.toFixed(2)}% MORE EXPENSIVE on pool → SELL SEI (bot profits)`;
    } else {
      // Pool SEI mai ieftin → ar trebui ATOM pentru a cumpara SEI, bot nu are ATOM
      hasOpportunity = false;
      side = null;
      reason = `Pool SEI is ${absDisc.toFixed(2)}% cheaper (depleted ATOM) — bot needs ATOM to exploit, not SEI`;
    }
  } else {
    reason = `Discrepancy ${absDisc.toFixed(2)}% < ${minDisc}% threshold → no opportunity`;
  }

  return {
    binanceSeiUsd, atomUsd, poolSeiUsd, atomPerSei, discrepancyPct, side, hasOpportunity, reason,
    marketSignalBasis: 'auxiliary_sei_atom_pool',
    fetchedAt,
  };
}

const OTA_API_BASE = getBackendUrl();
const STORAGE_KEY_ENABLED = 'ota-sei-micro-profit-enabled';
const STORAGE_KEY_PERCENT = 'ota-sei-micro-profit-percent';

const CONFIG_CACHE_TTL_MS = 30000; // 30s
let configCache = { serverCfg: null, expiresAt: 0 };
let configFetchPromise = null;

/** Invalidează cache-ul config (după toggle enabled sau la nevoie). */
export function invalidateStrategyConfigCache() {
  configCache = { serverCfg: null, expiresAt: 0 };
  configFetchPromise = null;
}

/** Returnează enabled din localStorage (null = nu e setat). */
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

/** Setează enabled în localStorage pentru override local. */
export function setLocalEnabled(value) {
  try {
    localStorage.setItem(STORAGE_KEY_ENABLED, String(!!value));
  } catch {}
}

/**
 * Returnează configurația strategiei micro-profit SEI.
 * Cache 30s + dedup în-flight ca să nu se facă 3–4 request-uri la încărcare.
 * @returns {Promise<object>}
 */
export async function getStrategyConfig() {
  const now = Date.now();
  const useCache = configCache.serverCfg != null && now < configCache.expiresAt;

  if (OTA_API_BASE && !useCache) {
    if (!configFetchPromise) {
      configFetchPromise = fetch(
        `${OTA_API_BASE}/api/ai-trading/strategies/config?chain=sei&strategy=${STRATEGY_NAME}`
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const serverCfg = data?.config ?? null;
          configCache = { serverCfg, expiresAt: Date.now() + CONFIG_CACHE_TTL_MS };
          configFetchPromise = null;
          return serverCfg;
        })
        .catch((e) => {
          console.warn('otaSeiMicroProfit: getStrategyConfig fallback to default', e.message);
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
 * Estimează costul gas pentru un round-trip (1 sell + 1 buy) pe SEI.
 * @returns {Promise<number>} Estimare USD per round-trip
 */
export async function estimateGasCostPerRoundTrip() {
  const cfg = await getStrategyConfig();
  const perSwap = cfg.gasEstimateUsdPerSwap ?? DEFAULT_STRATEGY_CONFIG.gasEstimateUsdPerSwap;
  return 2 * perSwap;
}

/**
 * Calculează profitul minim efectiv (USD) pentru un round-trip.
 * Dacă config are minProfitOverGasUsd, îl folosește; altfel: gasRoundTripUsd * (1 + minProfitOverGasPercent/100).
 * @param {object} config - Config strategie (din getStrategyConfig)
 * @param {number} gasRoundTripUsd - Cost gas round-trip (din estimateGasCostPerRoundTrip)
 * @returns {number} Min profit USD
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
 * Pure signal evaluation after fetchMarketDiscrepancy. Stale bundle = hard block (not hidden in bps arithmetic).
 * @param {object} discrepancy - from fetchMarketDiscrepancy()
 * @param {object} config - strategy config (enabled assumed true)
 * @param {number} gasRoundTripUsd
 * @param {number} [nowMs]
 */
export function computeSignalFromMarketDiscrepancy(discrepancy, config, gasRoundTripUsd, nowMs = Date.now()) {
  const signalDataSource = discrepancy.marketSignalBasis || 'auxiliary_sei_atom_pool';
  const binanceSeiUsd = discrepancy.binanceSeiUsd;
  const poolSeiUsd = discrepancy.poolSeiUsd;
  const discrepancyPct = Number(discrepancy.discrepancyPct) || 0;
  const { hasOpportunity, side, reason } = discrepancy;
  const fetchedAt = discrepancy.fetchedAt != null ? discrepancy.fetchedAt : nowMs;
  const marketBundleAgeMs = Math.max(0, nowMs - fetchedAt);
  const isStale = marketBundleAgeMs > SEI_MARKET_DATA_STALE_MS;

  const base = {
    signalDataSource,
    marketBundleAgeMs,
    isStale,
    binanceSeiUsd,
    poolSeiUsd,
    discrepancyPct,
    hasOpportunity,
    gasRoundTripUsd,
    priceError: false,
  };

  if (Math.abs(discrepancyPct) > 40) {
    return {
      ...base,
      trigger: false,
      side: null,
      reason: `⚠️ Discrepancy ${Math.abs(discrepancyPct).toFixed(1)}% too large — likely price feed error, not a real opportunity`,
      isTradable: false,
      blockReason: 'price_feed_error',
      edgeNetBps: null,
      edgeBreakdown: null,
      hasOpportunity: false,
      priceError: true,
    };
  }

  if (!hasOpportunity) {
    return {
      ...base,
      trigger: false,
      side: null,
      reason,
      isTradable: false,
      blockReason: 'no_opportunity',
      edgeNetBps: null,
      edgeBreakdown: null,
    };
  }

  if (isStale) {
    return {
      ...base,
      trigger: false,
      side: null,
      reason: `Stale market bundle (${Math.round(marketBundleAgeMs / 1000)}s) — hard block (max ${SEI_MARKET_DATA_STALE_MS / 1000}s). Refresh data before trusting signal.`,
      isTradable: false,
      blockReason: 'stale_quote',
      edgeNetBps: null,
      edgeBreakdown: null,
      estimatedProfit: null,
      notionalUsd: null,
      spreadPct: Math.abs(discrepancyPct),
    };
  }

  const notionalUsd = Math.max(
    1,
    parseFloat(String(config.maxAmountPerTrade != null ? config.maxAmountPerTrade : '10'), 10) * (Number(binanceSeiUsd) || 0.067)
  );
  const expectedGrossBps = Math.abs(discrepancyPct) * 100;
  const gasCostBps = notionalUsd > 0 ? Math.min(8000, (gasRoundTripUsd / notionalUsd) * 10000) : 8000;
  const { edgeNetBps, breakdown } = computeEdgeNetBps({
    expectedGrossBps,
    dexFeeBps: 30,
    slippageGuardBps: 50,
    gasCostBps,
    staleDataPenaltyBps: 0,
  });
  const meetsNetEdge = edgeNetBps >= SEI_MIN_EDGE_NET_BPS;
  const estimatedProfit = (Math.abs(discrepancyPct) / 100) * notionalUsd - gasRoundTripUsd;
  const trigger = meetsNetEdge && !!side;
  let reasonOut = reason;
  if (!meetsNetEdge) {
    reasonOut = `${reason} | Net edge ${edgeNetBps.toFixed(0)} bps < min ${SEI_MIN_EDGE_NET_BPS} bps (gross ${breakdown.expectedGrossBps.toFixed(0)} − fees/slippage/gas)`;
  } else {
    reasonOut = `${reason} | Net edge ${edgeNetBps.toFixed(0)} bps ≥ ${SEI_MIN_EDGE_NET_BPS} bps; est. $${estimatedProfit.toFixed(4)} after gas`;
  }

  return {
    ...base,
    isStale: false,
    trigger,
    side: trigger ? side : null,
    reason: reasonOut,
    isTradable: trigger,
    blockReason: trigger ? null : 'insufficient_edge',
    estimatedProfit,
    edgeNetBps,
    edgeBreakdown: breakdown,
    notionalUsd,
    spreadPct: Math.abs(discrepancyPct),
  };
}

/**
 * Decide dacă ar trebui declanșat un round-trip pe baza discrepanței Binance vs Pool.
 */
export async function shouldTriggerRoundTrip(_marketDataIgnored) {
  const config = await getStrategyConfig();
  const gasRoundTrip = await estimateGasCostPerRoundTrip();
  const minProfit = getMinProfitUsd(config, gasRoundTrip);

  if (!config.enabled) {
    return {
      trigger: false,
      side: null,
      reason: 'Strategy disabled — toggle ON to activate',
      minProfit,
      gasRoundTripUsd: gasRoundTrip,
      isTradable: false,
      isStale: false,
      blockReason: 'strategy_disabled',
      edgeNetBps: null,
    };
  }

  const discrepancy = await fetchMarketDiscrepancy();
  const computed = computeSignalFromMarketDiscrepancy(discrepancy, config, gasRoundTrip, Date.now());
  return {
    ...computed,
    minProfit,
  };
}

/**
 * Obține quote pentru swap SEI din backend (dacă suportă chain=sei).
 * Fallback: null când backend nu returnează quote SEI.
 * @param {string} tokenIn - Denom (ex: usei)
 * @param {string} tokenOut - Denom (ex: uusdc)
 * @param {string} amountIn - Amount în minimal units
 * @param {number} [slippageBps] - Slippage în basis points (50 = 0.5%)
 * @returns {Promise<{ minAmountOut: string }|null>}
 */
export async function fetchSeiQuote(tokenIn, tokenOut, amountIn, slippageBps = 50) {
  if (!OTA_API_BASE || !tokenIn || !tokenOut || !amountIn) return null;
  try {
    const { denomToSymbol, getTokenDecimals } = await import('../seiTokenConfig');
    const symbolIn = denomToSymbol(tokenIn);
    const symbolOut = denomToSymbol(tokenOut);
    const decimalsIn = getTokenDecimals(symbolIn);
    const decimalsOut = getTokenDecimals(symbolOut);
    const amountInHuman = parseInt(String(amountIn), 10) / 10 ** decimalsIn;
    if (!Number.isFinite(amountInHuman) || amountInHuman <= 0) return null;
    const slippagePct = (slippageBps || 50) / 100;
    const qs = new URLSearchParams({
      chain: 'sei',
      tokenIn: symbolIn,
      tokenOut: symbolOut,
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
 * Execută un round-trip swap pe SEI (stub).
 * În viitor: apelează seiContractService.executeSwap(signer) sau POST backend execute cu chain=sei.
 * @param {object} params - { userAddress, tokenIn, tokenOut, amountIn, signer }
 * @returns {Promise<{ success: boolean, txHash?: string, error?: string }>}
 */
export async function executeRoundTrip(params) {
  const { userAddress, tokenIn, tokenOut, amountIn, signer, userId } = params || {};
  if (!userAddress || !tokenIn || !tokenOut || amountIn == null) {
    return { success: false, error: 'Missing userAddress, tokenIn, tokenOut, or amountIn' };
  }

  // Încearcă backend — dacă pică (rețea sau 501/502), fallback direct pe Astroport Router
  if (OTA_API_BASE) {
    try {
      const body = { chain: 'sei', userAddress, tokenIn, tokenOut, amountIn, strategy: STRATEGY_NAME };
      if (userId != null && userId !== '') body.userId = String(userId);
      const res = await fetch(`${OTA_API_BASE}/api/ai-trading/execution/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.txForSigning) {
        if (!signer) return { success: false, error: 'Signer required. Reconnect SEI wallet.' };
        const { executeSwap } = await import('./seiContractService.js');
        const msg = data.txForSigning.msg?.execute_swap;
        const result = await executeSwap({ senderAddress: userAddress, tokenIn, tokenOut, amountIn, minAmountOut: msg?.min_amount_out ?? '0', signer });
        return { success: true, txHash: result?.txHash };
      }
      if (res.ok && data?.txHash) return { success: true, txHash: data.txHash };
      // 501/502 = SEI not implemented on backend → fallback direct
      if (res.status !== 501 && res.status !== 502) {
        return { success: false, error: data?.error || `Backend error ${res.status}` };
      }
    } catch (_) {
      // Eroare de rețea (fetch failed, timeout) → fallback direct pe Astroport
    }
  }

  // Fallback direct: swap prin Astroport Router (nu necesită SWAP_EXECUTOR contract)
  try {
    if (!signer) return { success: false, error: 'Signer required. Connect SEI wallet (Keplr/Compass).' };
    const config = await getStrategyConfig();
    const slippageBps = config?.maxSlippageBps ?? 50;
    const quote = await fetchSeiQuote(tokenIn, tokenOut, amountIn, slippageBps);
    const minAmountOut = quote?.minAmountOut ?? '0';
    const { executeSwap } = await import('./seiContractService.js');
    const result = await executeSwap({ senderAddress: userAddress, tokenIn, tokenOut, amountIn, minAmountOut, signer });
    return { success: true, txHash: result?.txHash };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Request OTA AI acknowledgment for a SEI round-trip (for UI: show that the bot "knows" about the action).
 * Tries POST /api/ai-trading/sei/round-trip-ack; on 404/501 or error returns a fallback message.
 * @param {{ txHash?: string, amountSei?: string, strategy?: string }} payload
 * @returns {Promise<{ message: string }>}
 */
export async function requestOtaAiSeiRoundTripAck(payload) {
  const { txHash, amountSei, strategy } = payload || {};
  const fallback = 'OTA AI: SEI round-trip recorded. Strategy: micro-profit. Backend can be extended for OpenAI acknowledgment.';
  if (!OTA_API_BASE) {
    return { message: 'OTA AI: Round-trip on SEI recorded. Set REACT_APP_OTA_API_URL for AI reply.' };
  }
  try {
    const res = await fetch(`${OTA_API_BASE}/api/ai-trading/sei/round-trip-ack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        txHash: txHash || null,
        amountSei: amountSei || null,
        strategy: strategy || STRATEGY_NAME,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && (data.message || data.text)) {
      return { message: String(data.message || data.text) };
    }
    if (res.status === 404 || res.status === 501) {
      return { message: fallback };
    }
    return { message: data?.error ? `OTA AI: ${data.error}` : fallback };
  } catch (e) {
    return { message: 'OTA AI: Round-trip on SEI recorded. Backend unavailable for AI reply.' };
  }
}

/**
 * GET /api/ai-trading/sei/bot-address – adresa wallet bot SEI pentru deposit (Auto).
 * @returns {Promise<{ botSeiAddress: string | null }>}
 */
export async function getSeiBotAddress() {
  if (!OTA_API_BASE) return { botSeiAddress: null, botSeiBalance: null };
  try {
    const res = await fetch(`${OTA_API_BASE}/api/ai-trading/sei/bot-address`);
    const data = await res.json().catch(() => ({}));
    return {
      botSeiAddress: data?.botSeiAddress ?? null,
      botSeiBalance: data?.botSeiBalance ?? null,
    };
  } catch {
    return { botSeiAddress: null, botSeiBalance: null };
  }
}

/** Default status când API lipsește sau e invalid */
const SEI_AUTO_DEFAULT = { enabled: false, minProfitOverGasPercent: 100, maxAmountPerTrade: '10', preferredPair: SEI_AUTO_DEFAULT_PAIR, workerActive: false, lastRunAt: null, executions24h: 0 };

function normalizePreferredPair(value) {
  const v = typeof value === 'string' ? value.trim() : '';
  return SEI_AUTO_PAIR_IDS.includes(v) ? v : SEI_AUTO_DEFAULT_PAIR;
}


/**
 * GET /api/ai-trading/sei/auto/status?userId=...
 * @returns {Promise<{ enabled: boolean, minProfitOverGasPercent: number, maxAmountPerTrade: string, preferredPair: string, workerActive: boolean, lastRunAt: string|null, executions24h: number, stopIfCannotEstimate?: boolean, maxRounds?: number|null, roundsDone?: number }>}
 */
export async function getSeiAutoStatus(userId) {
  const attachReadiness = (base, raw = {}) => ({
    ...base,
    readiness: deriveSeiAutoReadinessFromApiPayload(raw, base),
  });
  if (!OTA_API_BASE || !userId) return attachReadiness({ ...SEI_AUTO_DEFAULT });
  try {
    const res = await fetch(`${OTA_API_BASE}/api/ai-trading/sei/auto/status?userId=${encodeURIComponent(userId)}`);
    const data = await res.json().catch(() => ({}));
    if (!data?.success) return attachReadiness({ ...SEI_AUTO_DEFAULT });
    const out = {
      enabled: !!data.enabled,
      mode: typeof data.mode === 'string' ? data.mode : null,
      storedAutoEnabled: data.storedAutoEnabled !== undefined ? !!data.storedAutoEnabled : undefined,
      autoSupported: data.autoSupported !== false,
      minProfitOverGasPercent: data.minProfitOverGasPercent ?? 100,
      maxAmountPerTrade: data.maxAmountPerTrade ?? '10',
      preferredPair: normalizePreferredPair(data.preferredPair),
      workerActive: !!data.workerActive,
      lastRunAt: data.lastRunAt ?? null,
      executions24h: data.executions24h ?? 0,
    };
    if (data.stopIfCannotEstimate !== undefined) out.stopIfCannotEstimate = !!data.stopIfCannotEstimate;
    if (data.maxRounds !== undefined) out.maxRounds = data.maxRounds == null ? null : Number(data.maxRounds);
    if (data.roundsDone !== undefined) out.roundsDone = Number(data.roundsDone) || 0;
    out.readiness = deriveSeiAutoReadinessFromApiPayload(data, out);
    return out;
  } catch {
    return attachReadiness({ ...SEI_AUTO_DEFAULT });
  }
}

/**
 * POST /api/ai-trading/sei/auto/set – salvează setări SEI Auto.
 * @param {string} userId
 * @param {{ enabled?: boolean, minProfitOverGasPercent?: number, maxAmountPerTrade?: string, preferredPair?: string, stopIfCannotEstimate?: boolean, maxRounds?: number|null, resetRounds?: boolean }} params
 */
export async function setSeiAuto(userId, params) {
  if (!OTA_API_BASE || !userId) return { success: false };
  try {
    const body = { userId, ...params };
    if (params.preferredPair != null) body.preferredPair = normalizePreferredPair(params.preferredPair);
    const res = await fetch(`${OTA_API_BASE}/api/ai-trading/sei/auto/set`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return data;
  } catch {
    return { success: false };
  }
}

/**
 * POST /api/ai-trading/sei/position/open – record open position (buy base with quote).
 * Call after successful swap quote→base. Position appears in Open Orders.
 * Payload: userId, base, quote, tokenIn, tokenOut, amountIn, amountOut?, entryPrice?, txHash?
 */
export async function openSeiPosition(payload) {
  if (!OTA_API_BASE) throw new Error('OTA API URL not set');
  const res = await fetch(`${OTA_API_BASE}/api/ai-trading/sei/position/open`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || res.statusText || 'Failed to record position');
  return data;
}

/**
 * POST /api/ai-trading/sei/position/:id/close – close position (after user sold SEI for USDC).
 * Call after successful swap SEI→USDC.
 */
export async function closeSeiPosition(positionId, payload) {
  if (!OTA_API_BASE) throw new Error('OTA API URL not set');
  const res = await fetch(`${OTA_API_BASE}/api/ai-trading/sei/position/${positionId}/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || res.statusText || 'Failed to close position');
  return data;
}

export { STRATEGY_NAME, DEFAULT_STRATEGY_CONFIG };
