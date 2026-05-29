/**
 * Trade Cost Analytics - complete cost, expense, and OTA / auto-trading result tracking.
 * Clear split: gas, slippage, realized PnL, exact vs estimated.
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart2,
  DollarSign,
  Fuel,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  HelpCircle,
  Info,
  Lightbulb,
  Menu,
} from 'lucide-react';
import { ethers } from 'ethers';
import OTALogo from '../components/ai-trading/OTALogo';
import { useVaultDeposit } from '../hooks/useVaultDeposit';
import { useVaultTransactionHistory } from '../hooks/useVaultTransactionHistory';
import tokenPriceService from '../services/tokenPriceService';
import { getInvestedCapital } from '../services/analyticsApiService';
import {
  getTransactionCostBreakdown,
  getPortfolioSummary,
  getCapitalBridge,
  getVaultBalanceComparison,
} from '../services/analyticsApiService';
import { fetchOpenPositionsAnalyticsBundle } from '../services/openPositionsAnalyticsLoader';
import {
  directEntryClose,
  getOTAMarketData,
  postOtaPositionsClose,
  postOtaPositionOpenAiSuspend,
  deleteOtaPositionOpenAiSuspend,
  getManualCloseStatus,
} from '../services/aiTradingApiService';
import { getTrades } from '../services/executionApiService';
import { getApiBaseUrl } from '../../config/apiEndpoints.js';
import { formatNumber, formatAmountHuman, toHumanAmount, formatPriceHuman, formatPnlUsdHuman } from '../utils/formatters';
import { computeExecutionPositionUsd, STABLE_QUOTES } from '../utils/openPositionExecutionUsd';
import LoadingSpinner from '../components/common/LoadingSpinner';
import useWallet from '../hooks/useWallet.jsx';
import { useOtaEvmWalletAuthSync } from '../hooks/useOtaEvmWalletAuthSync';
import { ensureOtaWalletForApiIfNeeded } from '../utils/otaWalletSession';
import { formatOtaSessionUserMessage } from '../utils/otaSessionUserMessage';
import '../styles/components/trade-cost-analytics.css';

/** Warning: the Open Positions list is not the Vault balance; Binance futures perps are included here when the API provides them. */
function OpenPositionsVaultDisclaimer() {
  return (
    <div
      className="trade-cost-analytics-open-positions-banner trade-cost-analytics-open-positions-banner--info"
      role="note"
    >
      <Info size={16} aria-hidden />
      <span>
        <strong>Vault vs this list:</strong> rows reconstruct positions from execution history (BUY/SELL), not the raw Vault balance. You can hold tokens in Vault (for example SHIB) without a row here.
        Binance futures perps, LONG and SHORT, are listed below when the backend provides them and can be fully managed in{' '}
        <Link to="/dex-edu/ota/short-ops">OTA futures ops</Link>. To use tokens without waiting for an OTA sell:{' '}
        <Link to="/dex-edu/swap">Swap</Link> (for example SHIB &rarr; USDT).
      </span>
    </div>
  );
}

const DATA_SOURCE_LABEL = {
  exact: 'Exact',
  estimated: 'Estimated',
  reconstructed: 'Reconstructed',
  futures_venue: 'Venue FUT',
};
const SIDE_LABEL = { OPEN: 'OPEN', BUY: 'BUY', CLOSE: 'CLOSE', SELL: 'SELL', FAILED: 'FAILED', REVERTED: 'REVERTED' };
const BSCSCAN_TX = (hash) => `https://bscscan.com/tx/${hash}`;
/** Slippage bps used only for net PnL estimation; approximate, not from the real execution. Labeled as Estimated in UI. */
const ESTIMATED_SLIPPAGE_BPS_FOR_PNL = 30;

function renderVaultFlowLines(rows = [], resolveSymbol = null, emptyLabel = '—') {
  if (!Array.isArray(rows) || rows.length === 0) {
    return <span className="bridge-value-empty">{emptyLabel}</span>;
  }
  return (
    <span className="bridge-token-lines">
      {rows.map((row) => {
        const symbol = resolveSymbol?.(row) || row?.symbol || 'TOKEN';
        const amount = Number(row?.amountHuman);
        const formatted = Number.isFinite(amount)
          ? amount.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: amount >= 1 ? 6 : 8,
          })
          : '—';
        return (
          <span key={`${row?.type || 'flow'}:${row?.token || symbol}`} title={Number.isFinite(amount) ? `${formatted} ${symbol}` : symbol}>
            {formatted} {symbol}
          </span>
        );
      })}
    </span>
  );
}

function isRealFundingUnavailable(payload) {
  if (!payload || typeof payload !== 'object') return true;
  if (payload.exact === false) return true;
  if (payload.fundingExact === false) return true;
  if (payload.source === 'execution_history_db' || payload.fundingSource === 'execution_history_db') return true;
  return false;
}

/** Price/PnL refresh interval (ms). Minimum 15s; 30s reduces over-fetching. No sub-second polling. */
const OPEN_POSITIONS_REFRESH_MS = 30000;

/** Normalize position for display: Direct Entry (id, close) or execution-history (no id, OTA closes at TP/SL). */
function useOpenPositions(walletAddress) {
  const { signer } = useWallet();
  const [directEntry, setDirectEntry] = useState([]);
  const [executionHistory, setExecutionHistory] = useState([]);
  const [longFutures, setLongFutures] = useState([]);
  const [shortFutures, setShortFutures] = useState([]);
  const [positionExitMode, setPositionExitMode] = useState('auto');
  const [honestMode, setHonestMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [justRefreshed, setJustRefreshed] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const nextRefreshTimeoutRef = useRef(null);
  const fetchOpenRef = useRef(null);

  const fetchOpen = useCallback(async (background = false) => {
    if (!walletAddress) {
      setDirectEntry([]);
      setExecutionHistory([]);
      setLongFutures([]);
      setShortFutures([]);
      return;
    }
    if (!background) {
      setLoading(true);
      setError(null);
    }
    try {
      if (signer && walletAddress) {
        try {
          await ensureOtaWalletForApiIfNeeded(signer, walletAddress);
        } catch (_) {
          /* The user may reject the signature; still try loading so 401 can show a clear message. */
        }
      }
      const [deList, costRes, analyticsRes, longRes, shortRes] = await fetchOpenPositionsAnalyticsBundle(walletAddress);
      if (analyticsRes && (analyticsRes.positionExitMode === 'manual' || analyticsRes.positionExitMode === 'auto')) {
        setPositionExitMode(analyticsRes.positionExitMode);
      }
      if (analyticsRes) {
        setHonestMode({
          decisionType: analyticsRes.decisionType ?? 'rule_based',
          predictiveModelUsed: analyticsRes.predictiveModelUsed === true,
          exitOptimizationUsed: analyticsRes.exitOptimizationUsed === true,
          evidenceLevel: analyticsRes.evidenceLevel ?? 'insufficient',
          userFacingTruthLabel: analyticsRes.userFacingTruthLabel ?? 'Rule-based. Evidence-only.',
        });
      } else {
        setHonestMode(null);
      }
      const deOpen = Array.isArray(deList) ? deList.filter((p) => p && p.status === 'open') : [];
      setDirectEntry(deOpen);
      setLongFutures(Array.isArray(longRes?.positions) ? longRes.positions : []);
      setShortFutures(Array.isArray(shortRes?.positions) ? shortRes.positions : []);

      const execPositions = costRes?.positions || [];
      const analyticsPosByToken = new Map();
      for (const ap of analyticsRes?.positions || []) {
        const tk = (ap?.token || '').toString().trim().toUpperCase();
        if (tk) analyticsPosByToken.set(tk, ap);
      }
      let bnbUsd = null;
      let ethUsd = null;
      try {
        const rb = await getOTAMarketData('BNB', 'USDT');
        const mb = rb?.marketData ?? rb;
        const v = mb?.price != null ? parseFloat(mb.price) : (mb?.currentPrice != null ? parseFloat(mb.currentPrice) : NaN);
        if (Number.isFinite(v) && v > 0) bnbUsd = v;
      } catch (_) {}
      try {
        const re = await getOTAMarketData('ETH', 'USDT');
        const me = re?.marketData ?? re;
        const v = me?.price != null ? parseFloat(me.price) : (me?.currentPrice != null ? parseFloat(me.currentPrice) : NaN);
        if (Number.isFinite(v) && v > 0) ethUsd = v;
      } catch (_) {}

      const enriched = await Promise.all(
        execPositions.map(async (p) => {
          const quoteTok = (p.quoteToken || 'USDT').toUpperCase();
          const isStableQuote = STABLE_QUOTES.has(quoteTok);

          let currentPriceStablePerToken = null;
          let tokenUsdPerToken = null;
          try {
            if (isStableQuote) {
              const r = await getOTAMarketData(p.token, p.quoteToken || 'USDT');
              const md = r?.marketData ?? r;
              currentPriceStablePerToken = md?.price != null ? parseFloat(md.price) : (md?.currentPrice != null ? parseFloat(md.currentPrice) : null);
              tokenUsdPerToken = currentPriceStablePerToken;
            } else {
              const rUsd = await getOTAMarketData(p.token, 'USDT');
              const mu = rUsd?.marketData ?? rUsd;
              tokenUsdPerToken = mu?.price != null ? parseFloat(mu.price) : (mu?.currentPrice != null ? parseFloat(mu.currentPrice) : null);
            }
          } catch (_) {}

          const amountRaw = p.amountToken != null ? parseFloat(p.amountToken) : null;
          const amount = toHumanAmount(amountRaw, p.token) ?? amountRaw;
          const costQuoteRaw = p.costBasisQuote != null ? parseFloat(p.costBasisQuote) : null;
          const costQuoteHuman = toHumanAmount(costQuoteRaw, p.quoteToken || 'USDT') ?? costQuoteRaw;
          const amountForEntry = amount ?? amountRaw;
          const entryDerived = Number.isFinite(costQuoteHuman) && costQuoteHuman > 0 && Number.isFinite(amountForEntry) && amountForEntry > 0
            ? costQuoteHuman / amountForEntry
            : null;
          const entryApi = p.entryPrice != null ? parseFloat(p.entryPrice) : null;
          let entryPerTokenQuote = entryDerived;
          if (entryPerTokenQuote == null || !Number.isFinite(entryPerTokenQuote) || entryPerTokenQuote <= 0 || entryPerTokenQuote > 1e9) {
            entryPerTokenQuote = (entryApi != null && Number.isFinite(entryApi) && entryApi > 0 && entryApi < 1e9) ? entryApi : entryDerived;
          }

          let { entryValueUsd, currentValueUsd, pnlUsd } = computeExecutionPositionUsd({
            quoteToken: p.quoteToken,
            amountHuman: amount,
            costQuoteHuman,
            entryPerTokenQuote,
            currentPriceStablePerToken,
            tokenUsdPerToken,
            bnbUsd,
            ethUsd,
          });
          const backendEntryUsd = p.entryValueUsd != null ? parseFloat(p.entryValueUsd) : null;
          const evSrc = p.entryValueUsdSource;
          const entryUsdFromApi = new Set(['quote_bnb_times_spot', 'quote_eth_times_spot', 'quote_stable_usd', 'base_times_entry_stable']);
          if (backendEntryUsd != null && Number.isFinite(backendEntryUsd) && backendEntryUsd >= 0.5 && evSrc && entryUsdFromApi.has(evSrc)) {
            entryValueUsd = backendEntryUsd;
            pnlUsd = currentValueUsd != null && Number.isFinite(currentValueUsd) ? currentValueUsd - backendEntryUsd : pnlUsd;
          }

          const currentPrice = isStableQuote ? currentPriceStablePerToken : tokenUsdPerToken;
          const entry = entryPerTokenQuote;
          const entryValid = entry != null && Number.isFinite(entry) && entry > 0 && entry < 1e9;
          const openGasUsd = p.openGasUsd != null ? parseFloat(p.openGasUsd) : null;
          const estimatedCloseGasUsd = p.estimatedCloseGasUsd != null ? parseFloat(p.estimatedCloseGasUsd) : null;
          const estimatedOtherExitFeesUsd = p.estimatedOtherExitFeesUsd != null ? parseFloat(p.estimatedOtherExitFeesUsd) : null;
          const estimatedSlippageUsd = (currentValueUsd != null && currentValueUsd > 0) ? currentValueUsd * (ESTIMATED_SLIPPAGE_BPS_FOR_PNL / 10000) : 0;
          const totalDeductions = (openGasUsd ?? 0) + (estimatedCloseGasUsd ?? 0) + (estimatedOtherExitFeesUsd ?? 0) + estimatedSlippageUsd;
          const pnlNetUsd = pnlUsd != null ? pnlUsd - totalDeductions : null;
          const gasSource = p.gasSource ?? 'unknown';
          const openGasUsdSource = p.openGasUsdSource ?? (openGasUsd != null ? 'unknown' : null);
          const estimatedCloseGasUsdIsEstimate = p.estimatedCloseGasUsdIsEstimate !== false;
          const closeGasUsdAvailable = p.closeGasUsdAvailable === true;
          const apRow = analyticsPosByToken.get((p.token || '').toString().trim().toUpperCase());
          return {
            ...p,
            entryPrice: entryValid ? entry : null,
            entryPriceInQuote: entryValid ? entry : null,
            quoteTokenForEntry: p.quoteToken || 'USDT',
            currentPrice,
            pnl: pnlUsd,
            pnlNetUsd,
            openGasUsd,
            estimatedCloseGasUsd: estimatedCloseGasUsd ?? null,
            estimatedOtherExitFeesUsd: estimatedOtherExitFeesUsd ?? null,
            estimatedSlippageUsd: estimatedSlippageUsd > 0 ? estimatedSlippageUsd : null,
            entryValueUsd,
            openTxHash: p.openTxHash || null,
            entryValueUsdSource: p.entryValueUsdSource || null,
            currentValueUsd,
            gasSource,
            openGasUsdSource,
            estimatedCloseGasUsdIsEstimate,
            closeGasUsdAvailable,
            source: 'execution',
            openAiAnalysisSuspended: apRow?.openAiAnalysisSuspended === true,
          };
        })
      );
      setExecutionHistory(enriched);
      setLastRefreshedAt(Date.now());
      setRefreshTick((t) => t + 1);
      setJustRefreshed(true);
    } catch (e) {
      setError(formatOtaSessionUserMessage(e) || e?.message || 'Error loading positions');
      setDirectEntry([]);
      setExecutionHistory([]);
      setLongFutures([]);
    } finally {
      setLoading(false);
      if (walletAddress && fetchOpenRef.current) {
        if (nextRefreshTimeoutRef.current) clearTimeout(nextRefreshTimeoutRef.current);
        nextRefreshTimeoutRef.current = setTimeout(() => fetchOpenRef.current?.(true), OPEN_POSITIONS_REFRESH_MS);
      }
    }
  }, [walletAddress, signer]);

  fetchOpenRef.current = fetchOpen;

  useEffect(() => {
    if (!justRefreshed) return;
    const t = setTimeout(() => setJustRefreshed(false), 1800);
    return () => clearTimeout(t);
  }, [justRefreshed]);

  useEffect(() => {
    if (!walletAddress) return;
    fetchOpen();
    return () => {
      if (nextRefreshTimeoutRef.current) {
        clearTimeout(nextRefreshTimeoutRef.current);
        nextRefreshTimeoutRef.current = null;
      }
    };
  }, [walletAddress]); // Intentionally omits fetchOpen: starts once on mount/wallet change; the next refresh is scheduled by fetchOpen.

  const hasAny = directEntry.length > 0 || executionHistory.length > 0 || longFutures.length > 0 || shortFutures.length > 0;
  return { directEntry, executionHistory, longFutures, shortFutures, positionExitMode, honestMode, loading, error, setError, fetchOpen, hasAny, lastRefreshedAt, justRefreshed, refreshTick };
}

/** Open Positions section: Direct Entry + OTA Auto execution history, live PnL, manual close only for Direct Entry. */
const POLL_CLOSE_MS = 25000;
const POLL_CLOSE_MAX_ATTEMPTS = 8; // ~3 min
const QUOTE_TOKENS = ['USDT', 'USDC', 'BUSD', 'DAI', 'BNB', 'ETH'];

/** Finite USD value or null; avoids NaN from parseFloat on empty or invalid strings. */
function parseFiniteUsd(v) {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

function normalizeAnalyticsFuturesPosition(pos, lane) {
  const side = lane === 'short' ? 'SHORT' : 'LONG';
  const token = String(pos?.symbol || pos?.token || '---').toUpperCase();
  const openedAtRaw = pos?.opened_at || pos?.openedAt || pos?.created_at || null;
  return {
    ...pos,
    lane,
    side,
    token,
    rowKey: `${lane}-futures-${pos?.id ?? token}`,
    openedAtLabel: openedAtRaw ? new Date(openedAtRaw).toLocaleString('en-US') : '---',
  };
}

function OpenPositionsSection({ walletAddress, onCloseDone, onUnrealizedPnlComputed }) {
  const { directEntry, executionHistory, longFutures, shortFutures, positionExitMode, honestMode, loading, error, setError, fetchOpen, hasAny, lastRefreshedAt, justRefreshed, refreshTick } = useOpenPositions(walletAddress);
  const [closingId, setClosingId] = useState(null);
  const [requestingOtaToken, setRequestingOtaToken] = useState(null);
  const [llmSuspendToken, setLlmSuspendToken] = useState(null);
  const [otaCloseModal, setOtaCloseModal] = useState(null);
  const [closedPositionPopup, setClosedPositionPopup] = useState(null); // { token, profitUsd, executedAt, txHash }
  /** Manual close trace popup: steps, routes, online responses, up to tx hash. Persists until the user closes it. */
  const [tracePopup, setTracePopup] = useState(null); // { position, steps: [{ id, title, method, route, requestBody?, response?, at, status }], sending: boolean }
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(null);
  const [vaultProvenance, setVaultProvenance] = useState(null);
  const [vaultProvenanceLoading, setVaultProvenanceLoading] = useState(false);
  const [vaultProvenanceError, setVaultProvenanceError] = useState(null);
  const pollCloseRef = useRef(null);
  const tracePollRef = useRef(null);

  const loadVaultProvenance = useCallback(async () => {
    if (!walletAddress) return;
    setVaultProvenanceLoading(true);
    setVaultProvenanceError(null);
    try {
      const data = await getVaultBalanceComparison(walletAddress);
      setVaultProvenance(data);
    } catch (e) {
      setVaultProvenanceError(formatOtaSessionUserMessage(e) || e?.message || 'Error loading vault provenance');
      setVaultProvenance(null);
    } finally {
      setVaultProvenanceLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    console.log('[OTA Close DEBUG] OpenPositionsSection mounted/updated', { hasWallet: !!walletAddress, walletPreview: walletAddress ? walletAddress.slice(0, 10) + '…' : null });
  }, [walletAddress]);

  /** Formats a live value with an animated decimal part. */
  function formatLiveValue(value, formatter, decimals = 2) {
    if (value == null || !Number.isFinite(value)) return null;
    const str = typeof formatter === 'function' ? formatter(value) : String(value);
    const dot = str.indexOf('.');
    if (dot === -1) return { int: str, dec: '' };
    return { int: str.slice(0, dot), dec: str.slice(dot) };
  }

  useEffect(() => {
    if (lastRefreshedAt == null || !walletAddress) {
      setSecondsUntilRefresh(null);
      return;
    }
    const tick = () => {
      const elapsed = Math.floor((Date.now() - lastRefreshedAt) / 1000);
      const left = Math.max(0, OPEN_POSITIONS_REFRESH_MS / 1000 - elapsed);
      setSecondsUntilRefresh(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lastRefreshedAt, walletAddress]);

  const handleClose = useCallback(
    async (positionId, token) => {
      if (!walletAddress || !positionId) return;
      if (!window.confirm(`Close the ${token} position? This will realize the current profit or loss.`)) return;
      setClosingId(positionId);
      setError(null);
      try {
        await directEntryClose(walletAddress, positionId);
        await fetchOpen();
        onCloseDone?.();
      } catch (e) {
        setError(e?.message || 'Error closing position');
      } finally {
        setClosingId(null);
      }
    },
    [walletAddress, fetchOpen, onCloseDone, setError]
  );

  /**
   * OTA manual close: POST /ota/positions/close + status polling.
   * @param {object} pos - table position; `token` must match the backend-tracked symbol and cost basis symbol.
   * @param {{ skipConfirm?: boolean }} [opts]
   */
  const sendTraceRequestAndPoll = useCallback(
    async (pos, opts = {}) => {
      if (!walletAddress || !pos?.token) return;
      const token = String(pos.token).trim();
      const baseUrl = (typeof getApiBaseUrl === 'function' ? getApiBaseUrl() : '') || '';
      const postRoute = `${baseUrl.replace(/\/$/, '')}/ai-trading/ota/positions/close`;
      const body = { userId: walletAddress, walletAddress, token };
      if (!opts.skipConfirm) {
        const ok = window.confirm(
          `Confirm manual close for ${token}?\n\n` +
            'This is not an automatic TP/SL close. The OTA executor sells at your request without LLM analysis, usually in 1-3 minutes or after an immediate cycle if the worker is active.\n\n' +
            'If you previously only opened the first step, the request is now sent automatically after confirmation.'
        );
        if (!ok) return;
      }
      setTracePopup({ position: pos, steps: [], sending: true });
      try {
        const res = await postOtaPositionsClose(walletAddress, token);
        const statusToken =
          res && typeof res.token === 'string' && res.token.trim() ? String(res.token).trim() : token;
        setTracePopup((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            sending: false,
            steps: [
              ...prev.steps,
              {
                id: 'post',
                title: 'Sending request to server',
                method: 'POST',
                route: postRoute,
                requestBody: body,
                response: res,
                at: new Date().toISOString(),
                status: 'done',
              },
            ],
          };
        });
        setError(null);
        await fetchOpen(true);
        onCloseDone?.();
        const statusRoute = `${baseUrl.replace(/\/$/, '')}/ai-trading/ota/manual-close-status?walletAddress=${encodeURIComponent(walletAddress)}&token=${encodeURIComponent(statusToken)}`;
        let pollCount = 0;
        const TRACE_POLL_MS = 8000;
        const TRACE_POLL_MAX = 30;
        const runPoll = async () => {
          pollCount += 1;
          if (pollCount > TRACE_POLL_MAX) {
            if (tracePollRef.current) clearInterval(tracePollRef.current);
            tracePollRef.current = null;
            return;
          }
          try {
            const statusRes = await getManualCloseStatus(walletAddress, statusToken);
            setTracePopup((prev) => {
              if (!prev) return null;
              const step = {
                id: 'get-status',
                title: 'Checking status (online)',
                method: 'GET',
                route: statusRoute,
                response: statusRes,
                at: new Date().toISOString(),
                status: statusRes?.status === 'completed' ? 'done' : statusRes?.status === 'queued' ? 'done' : 'done',
              };
              const rest = prev.steps.filter((s) => s.id !== 'get-status');
              return { ...prev, steps: [...rest, step] };
            });
            if (statusRes?.status === 'completed') {
              if (tracePollRef.current) clearInterval(tracePollRef.current);
              tracePollRef.current = null;
              await fetchOpen(true);
              onCloseDone?.();
            }
          } catch (_) {}
        };
        runPoll();
        if (tracePollRef.current) clearInterval(tracePollRef.current);
        tracePollRef.current = setInterval(runPoll, TRACE_POLL_MS);
      } catch (e) {
        const errMsg = e?.message || 'Error sending request';
        setTracePopup((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            sending: false,
            steps: [
              ...prev.steps,
              {
                id: 'post',
                title: 'Sending request to server',
                method: 'POST',
                route: postRoute,
                requestBody: body,
                response: { error: errMsg, failedStatus: e?.failedStatus, responseBody: e?.responseBody },
                at: new Date().toISOString(),
                status: 'error',
              },
            ],
          };
        });
        setError(errMsg);
      }
    },
    [walletAddress, fetchOpen, onCloseDone, setError]
  );

  const handleRequestOtaClose = useCallback(
    (pos) => {
      void sendTraceRequestAndPoll(pos, { skipConfirm: false });
    },
    [sendTraceRequestAndPoll]
  );

  const handleToggleOtaLlmSuspend = useCallback(
    async (pos) => {
      if (!walletAddress || !pos?.token) return;
      const token = pos.token;
      const currently = pos.openAiAnalysisSuspended === true;
      const msg = currently
        ? `Reactivate OpenAI/LLM analysis for ${token}? Token usage can increase again.`
        : `Suspend OpenAI/LLM analysis for ${token}? The executor will no longer call OpenAI for this tracked position, saving tokens. Manual close and existing requests remain available.`;
      if (!window.confirm(msg)) return;
      setLlmSuspendToken(token);
      setError(null);
      try {
        if (currently) {
          await deleteOtaPositionOpenAiSuspend(walletAddress, token, { lane: 'long' });
        } else {
          await postOtaPositionOpenAiSuspend(walletAddress, token, { lane: 'long' });
        }
        await fetchOpen(true);
        onCloseDone?.();
      } catch (e) {
        setError(e?.message || 'Error suspending/reactivating LLM analysis');
      } finally {
        setLlmSuspendToken(null);
      }
    },
    [walletAddress, fetchOpen, onCloseDone, setError]
  );

  const confirmOtaClose = useCallback(
    async () => {
      console.log('[OTA Close DEBUG] confirmOtaClose called', { hasModal: !!otaCloseModal, token: otaCloseModal?.token, hasWallet: !!walletAddress });
      if (!otaCloseModal || !walletAddress || !otaCloseModal.token) {
        console.warn('[OTA Close DEBUG] confirmOtaClose early return: missing modal/wallet/token');
        return;
      }
      const token = otaCloseModal.token;
      console.log('[OTA Close DEBUG] calling postOtaPositionsClose', { wallet: walletAddress.slice(0, 14) + '…', token });
      setRequestingOtaToken(token);
      setError(null);
      try {
        await postOtaPositionsClose(walletAddress, token);
        console.log('[OTA Close DEBUG] postOtaPositionsClose OK');
        setOtaCloseModal(null);
        await fetchOpen(true);
        onCloseDone?.();

        const requestTime = Date.now();
        let attempts = 0;
        pollCloseRef.current = setInterval(async () => {
          attempts += 1;
          if (attempts > POLL_CLOSE_MAX_ATTEMPTS) {
            if (pollCloseRef.current) clearInterval(pollCloseRef.current);
            pollCloseRef.current = null;
            return;
          }
          try {
            const [, costRes] = await fetchOpenPositionsAnalyticsBundle(walletAddress);
            const positions = costRes?.positions || [];
            const stillOpen = positions.some((p) => (p.token || '').toUpperCase() === token.toUpperCase());
            if (!stillOpen) {
              if (pollCloseRef.current) clearInterval(pollCloseRef.current);
              pollCloseRef.current = null;
              const res = await getTrades(walletAddress, { limit: 25 });
              const trades = res?.trades || [];
              const afterTime = requestTime - 60000;
              const closeTrade = trades.find(
                (t) =>
                  (t.tokenIn || '').toUpperCase() === token.toUpperCase() &&
                  QUOTE_TOKENS.includes((t.tokenOut || '').toUpperCase()) &&
                  new Date(t.executedAt || t.executed_at || 0).getTime() >= afterTime
              );
              const profitUsd = closeTrade?.profitUsd ?? closeTrade?.profit_usd ?? closeTrade?.pnl ?? closeTrade?.pnlUsd ?? null;
              const executedAt = closeTrade?.executedAt ?? closeTrade?.executed_at ?? null;
              const txHash = closeTrade?.txHash ?? closeTrade?.transaction_hash ?? null;
              setClosedPositionPopup({
                token,
                profitUsd: profitUsd != null ? Number(profitUsd) : null,
                executedAt,
                txHash: txHash || null,
              });
              await fetchOpen(true);
              onCloseDone?.();
            }
          } catch (_) {}
        }, POLL_CLOSE_MS);
      } catch (e) {
        console.error('[OTA Close DEBUG] postOtaPositionsClose failed', { message: e?.message, stack: e?.stack, failedStatus: e?.failedStatus, responseBody: e?.responseBody });
        const msg = e?.message || 'Request error';
        const hint = /not found|database|manual_close|relation/i.test(msg)
          ? ' If this persists, check with the administrator that OTA migration 058 (manual_close_requests) was run on the server.'
          : '';
        setError(msg + hint);
      } finally {
        setRequestingOtaToken(null);
      }
    },
    [walletAddress, otaCloseModal, fetchOpen, onCloseDone, setError]
  );

  useEffect(() => {
    return () => {
      if (pollCloseRef.current) {
        clearInterval(pollCloseRef.current);
        pollCloseRef.current = null;
      }
      if (tracePollRef.current) {
        clearInterval(tracePollRef.current);
        tracePollRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!tracePopup) {
      if (tracePollRef.current) {
        clearInterval(tracePollRef.current);
        tracePollRef.current = null;
      }
    }
  }, [tracePopup]);

  const rows = [
    ...directEntry.map((p) => ({ ...p, source: 'direct_entry', rowKey: `de-${p.id}` })),
    ...executionHistory.map((p) => ({ ...p, rowKey: `exec-${p.token}` })),
  ];
  const futuresRows = useMemo(() => [
    ...longFutures.map((p) => normalizeAnalyticsFuturesPosition(p, 'long')),
    ...shortFutures.map((p) => normalizeAnalyticsFuturesPosition(p, 'short')),
  ], [longFutures, shortFutures]);

  useEffect(() => {
    const total = rows.reduce((s, p) => {
      const pnl = p.pnl ?? (p.currentValueUsd != null && p.entryValueUsd != null ? p.currentValueUsd - p.entryValueUsd : null);
      return s + (pnl != null && Number.isFinite(pnl) ? pnl : 0);
    }, 0) + futuresRows.reduce((s, p) => s + (parseFiniteUsd(p?.pnl_estimated_usd) || 0), 0);
    onUnrealizedPnlComputed?.(total);
  }, [directEntry, executionHistory, futuresRows, onUnrealizedPnlComputed]);

  if (loading && !hasAny) {
    return (
      <section className="trade-cost-analytics-open-positions">
        <h2>Open positions (live PnL)</h2>
        <OpenPositionsVaultDisclaimer />
        <LoadingSpinner />
      </section>
    );
  }

  if (!hasAny) {
    return (
      <section className="trade-cost-analytics-open-positions">
        <h2>Open positions (live PnL)</h2>
        <OpenPositionsVaultDisclaimer />
        <p className="trade-cost-analytics-open-positions-empty">No open positions (Direct Entry or OTA Auto).</p>
      </section>
    );
  }

  return (
    <section className="trade-cost-analytics-open-positions">
      <h2>Open positions (live PnL and manual close)</h2>
      <OpenPositionsVaultDisclaimer />
      {positionExitMode === 'manual' && (
        <div className="trade-cost-analytics-open-positions-banner" role="status">
          <Info size={16} aria-hidden />
          OTA does not automatically close these positions. Exit is manual.
        </div>
      )}
      {honestMode && (
        <div className="trade-cost-analytics-honest-mode" role="region" aria-label="OTA truth mode">
          <span className="trade-cost-analytics-honest-label">Decision type:</span> {honestMode.decisionType === 'manual_only' ? 'Manual only' : honestMode.decisionType === 'rule_based' ? 'Rule-based' : honestMode.decisionType}
          {' · '}
          <span className="trade-cost-analytics-honest-label">Exit mode:</span> {positionExitMode === 'manual' ? 'Manual' : 'Auto'}
          {' · '}
          <span className="trade-cost-analytics-honest-label">Predictive model:</span> {honestMode.predictiveModelUsed ? 'Used' : 'Not available'}
          {' · '}
          <span className="trade-cost-analytics-honest-label">Exit optimization:</span> {honestMode.exitOptimizationUsed ? 'Used' : 'Not implemented'}
          {' · '}
          <span className="trade-cost-analytics-honest-label">Evidence level:</span> {honestMode.evidenceLevel.replace(/_/g, ' ')}
        </div>
      )}
      <div className={`trade-cost-analytics-dynamic-bar ${justRefreshed ? 'trade-cost-analytics-bar-just-refreshed' : ''}`} aria-live="polite">
        <span className="trade-cost-analytics-live-badge">
          <span className="trade-cost-analytics-live-dot" aria-hidden />
          Live prices
        </span>
        {secondsUntilRefresh != null && (
          <span className="trade-cost-analytics-chronometer" title="Time until the next automatic refresh (prices from Chain)">
            <span className="trade-cost-analytics-chronometer-label">Refresh in</span>
            <span className="trade-cost-analytics-chronometer-value" aria-label={`${Math.floor(secondsUntilRefresh / 60)} minutes ${secondsUntilRefresh % 60} seconds`}>
              {String(Math.floor(secondsUntilRefresh / 60)).padStart(2, '0')}:{String(secondsUntilRefresh % 60).padStart(2, '0')}
            </span>
            <span className="trade-cost-analytics-chronometer-progress-wrap" role="progressbar" aria-valuenow={secondsUntilRefresh} aria-valuemin={0} aria-valuemax={OPEN_POSITIONS_REFRESH_MS / 1000}>
              <span className="trade-cost-analytics-chronometer-progress" style={{ width: `${(secondsUntilRefresh / (OPEN_POSITIONS_REFRESH_MS / 1000)) * 100}%` }} />
            </span>
          </span>
        )}
        {justRefreshed && (
          <span className="trade-cost-analytics-just-refreshed-badge" role="status">Updated now</span>
        )}
        <button
          type="button"
          className="trade-cost-analytics-btn-refresh-primary"
          onClick={() => fetchOpen()}
          disabled={loading}
          title="Refresh price and PnL now"
          aria-label="Refresh live data"
        >
          <RefreshCw size={18} className={loading ? 'spin' : ''} aria-hidden />
          Refresh
        </button>
      </div>
      {error && (
        <div className="trade-cost-analytics-open-positions-error" role="alert">
          {error}
        </div>
      )}
      {futuresRows.length > 0 && (
        <>
          <div className="trade-cost-analytics-open-positions-banner trade-cost-analytics-open-positions-banner--info" role="status">
            <Info size={16} aria-hidden />
            <span>
              <strong>OTA Binance futures live:</strong> these positions come from <code>/ai-trading/long/open-longs</code> and <code>/ai-trading/short/open-shorts</code> and are no longer hidden from analytics. For full management, go to{' '}
              <Link to="/dex-edu/ota/short-ops">OTA futures ops</Link>.
            </span>
          </div>
          <div className="table-wrapper">
            <table className="trade-cost-analytics-table trade-cost-analytics-open-positions-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Symbol</th>
                  <th>Notional</th>
                  <th>Leverage</th>
                  <th>Entry mark</th>
                  <th>Mark live</th>
                  <th>TP</th>
                  <th>SL</th>
                  <th>PnL est. (USD)</th>
                  <th>Opened</th>
                  <th className="trade-cost-analytics-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {futuresRows.map((pos) => {
                  const token = pos.token;
                  const pnlUsd = parseFiniteUsd(pos?.pnl_estimated_usd);
                  const leverage = Number.isFinite(Number(pos?.leverage)) ? `${Number(pos.leverage)}x` : '—';
                  const notionalUsd = parseFiniteUsd(pos?.notional_usd);
                  const entryMark = parseFiniteUsd(pos?.entry_mark_price);
                  const liveMark = parseFiniteUsd(pos?.current_price);
                  const takeProfit = parseFiniteUsd(pos?.metadata?.takeProfit);
                  const stopLoss = parseFiniteUsd(pos?.metadata?.stopLoss);
                  return (
                    <tr key={pos.rowKey}>
                      <td className="cell-source"><span title={`OTA ${pos.side} futures`} className="cell-source-ota-logo cell-source-ota-logo--large"><OTALogo size="xs" aria-label={`OTA ${pos.side} futures`} /></span></td>
                      <td className="cell-pair">{token} PERP <span className={pos.lane === 'short' ? 'trade-cost-analytics-side-pill trade-cost-analytics-side-pill--short' : 'trade-cost-analytics-side-pill trade-cost-analytics-side-pill--long'}>{pos.side}</span></td>
                      <td className="cell-num">{notionalUsd != null ? formatPnlUsdHuman(notionalUsd) : '—'}</td>
                      <td className="cell-num">{leverage}</td>
                      <td className="cell-num">{entryMark != null ? formatPriceHuman(entryMark) : '—'}</td>
                      <td className="cell-num">{liveMark != null ? formatPriceHuman(liveMark) : '—'}</td>
                      <td className="cell-num">{takeProfit != null ? formatPriceHuman(takeProfit) : '—'}</td>
                      <td className="cell-num">{stopLoss != null ? formatPriceHuman(stopLoss) : '—'}</td>
                      <td className="cell-num">
                        {pnlUsd != null ? (
                          <span className={`trade-cost-analytics-pnl-chip ${pnlUsd >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
                            {formatPnlUsdHuman(pnlUsd)}
                          </span>
                        ) : '—'}
                      </td>
                      <td>{pos.openedAtLabel}</td>
                      <td>
                        <Link className="trade-cost-analytics-btn-close" to={`/dex-edu/ota/short-ops?tab=${pos.lane}`}>
                          View in OTA {pos.side}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      {rows.length === 0 && futuresRows.length > 0 && (
        <p className="trade-cost-analytics-open-positions-empty">
          There are no open Direct Entry / OTA Auto spot positions. Active Binance futures positions are listed above.
        </p>
      )}
      {rows.length > 0 && (
      <div className="table-wrapper">
        <table className="trade-cost-analytics-table trade-cost-analytics-open-positions-table">
          <thead>
            <tr>
              <th>Source</th>
              <th className="th-rationale-icon" title="Why did OTA open this position?"><Lightbulb size={18} aria-hidden /><HelpCircle size={12} className="th-rationale-help" aria-label="Why did OTA open this position?" /></th>
              <th>Pair</th>
              <th>Amount</th>
              <th>Entry price</th>
              <th>Current price</th>
              <th>Entry value</th>
              <th>Current value</th>
              <th>Gas (open)</th>
              <th>PnL gross (USD)</th>
              <th>PnL net (USD)</th>
              <th>PnL %</th>
              <th className="trade-cost-analytics-th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((pos) => {
              const pnlUsd = parseFiniteUsd(pos.pnl);
              const pnlNetUsd = parseFiniteUsd(pos.pnlNetUsd);
              const entry = pos.entryPrice != null ? parseFloat(pos.entryPrice) : null;
              const current = pos.currentPrice != null ? parseFloat(pos.currentPrice) : null;
              const entryValueUsd = parseFiniteUsd(pos.entryValueUsd);
              const currentValueUsd = parseFiniteUsd(pos.currentValueUsd);
              const qRow = (pos.quoteToken || 'USDT').toUpperCase();
              const nonStableExec = pos.source === 'execution' && !STABLE_QUOTES.has(qRow);
              /** Price-based percentage change (entry -> current); can differ from USD PnL when fees/slippage apply, so use only as fallback. */
              const priceChangePct =
                !nonStableExec && entry != null && entry > 0 && current != null && Number.isFinite(current)
                  ? ((current - entry) / entry) * 100
                  : null;
              const entryTooSmall = entryValueUsd == null || entryValueUsd < 0.01;
              const pnlUsdForRoi = pnlNetUsd != null ? pnlNetUsd : pnlUsd;
              const roiPctFromUsd =
                !entryTooSmall && entryValueUsd != null && entryValueUsd >= 0.01 && pnlUsdForRoi != null
                  ? (pnlUsdForRoi / entryValueUsd) * 100
                  : null;
              const pnlPctDisplay = roiPctFromUsd != null ? roiPctFromUsd : priceChangePct;
              const amountDisplay = pos.amountOut ?? pos.amountToken;
              /** Human amount using the same logic as execution enrichment; used for unit price from value/amount when market price is missing or zero. */
              const amtHuman =
                amountDisplay != null && amountDisplay !== ''
                  ? toHumanAmount(amountDisplay, pos.token) ??
                    (Number.isFinite(parseFloat(amountDisplay)) ? parseFloat(amountDisplay) : null)
                  : null;
              /** Prefer market price; if it is zero/null and USD value + amount exist, derive it from the same entry/current value fields. */
              const displayEntryPrice =
                entry != null && Number.isFinite(entry) && entry > 0
                  ? entry
                  : entryValueUsd != null && amtHuman != null && amtHuman > 0
                    ? entryValueUsd / amtHuman
                    : null;
              const displayCurrentPrice =
                current != null && Number.isFinite(current) && current > 0
                  ? current
                  : currentValueUsd != null && amtHuman != null && amtHuman > 0
                    ? currentValueUsd / amtHuman
                    : null;
              const entryPriceIsUsdDerived = !(entry != null && Number.isFinite(entry) && entry > 0) && displayEntryPrice != null;
              const currentPriceIsUsdDerived = !(current != null && Number.isFinite(current) && current > 0) && displayCurrentPrice != null;
              const isClosing = pos.source === 'direct_entry' && closingId === pos.id;
              const canClose = pos.source === 'direct_entry' && pos.id;
              const isOtaAuto = pos.source === 'execution';
              // "Close now" button for all OTA Auto positions; backend accepts the request through POST /ota/positions/close.
              const isOtaClosable = isOtaAuto;
              const isRequestingOta = isOtaAuto && requestingOtaToken === pos.token;
              const isLlmSuspendBusy = isOtaAuto && llmSuspendToken === pos.token;
              const llmSuspended = isOtaAuto && pos.openAiAnalysisSuspended === true;
              return (
                <tr key={pos.rowKey}>
                  <td className="cell-source">
                    {pos.source === 'direct_entry' ? 'Direct Entry' : <span title="OTA Auto" className="cell-source-ota-logo cell-source-ota-logo--large"><OTALogo size="xs" aria-label="OTA Auto" /></span>}
                  </td>
                  <td className="cell-rationale cell-rationale-icon-only" title={pos.source === 'execution' && pos.decisionReasoning ? `Why OTA opened this position: ${pos.decisionReasoning}` : (pos.source === 'execution' ? 'Why OTA opened this position (saved reason missing)' : '')}>
                    {pos.source === 'execution' && pos.decisionReasoning ? (
                      <span className="cell-rationale-bulb" aria-label="Why OTA opened this position" title={pos.decisionReasoning ? `Why OTA opened this position: ${pos.decisionReasoning}` : 'Why OTA opened this position'}>
                        <Lightbulb size={18} />
                        <HelpCircle size={12} className="cell-rationale-help" aria-hidden />
                      </span>
                    ) : '—'}
                  </td>
                  <td className="cell-pair">{pos.quoteToken || 'USDT'} → {pos.token}</td>
                  <td className="cell-amount">
                    {formatAmountHuman(amountDisplay, pos.token, 6) ?? '—'} {pos.token}
                  </td>
                  <td
                    className="cell-num"
                    title={
                      entryPriceIsUsdDerived
                        ? `Derived entry price: Entry value (USD) / amount (${pos.quoteToken || 'USDT'} per 1 ${pos.token}); used when market price is missing or zero.`
                        : pos.quoteTokenForEntry && !STABLE_QUOTES.has((pos.quoteTokenForEntry || '').toUpperCase())
                          ? `Entry price: ${formatPriceHuman(displayEntryPrice ?? entry)} ${pos.quoteTokenForEntry} per 1 ${pos.token} (USD value = cost in ${pos.quoteTokenForEntry} x USD rate)`
                          : undefined
                    }
                  >
                    {displayEntryPrice != null && displayEntryPrice > 0 ? formatPriceHuman(displayEntryPrice) : '—'}
                    {pos.quoteTokenForEntry && !STABLE_QUOTES.has((pos.quoteTokenForEntry || '').toUpperCase()) && displayEntryPrice != null ? (
                      <span className="trade-cost-analytics-entry-quote-suffix" aria-hidden> {pos.quoteTokenForEntry}</span>
                    ) : null}
                  </td>
                  <td
                    className="cell-num trade-cost-analytics-cell-live"
                    title={
                      currentPriceIsUsdDerived
                        ? `Derived current price: Current value (USD) / amount; used when live price is missing or zero.`
                        : displayCurrentPrice == null
                          ? 'Current price unavailable (missing market data and cannot derive from value)'
                          : pos.source === 'execution' && pos.quoteToken && !STABLE_QUOTES.has((pos.quoteToken || '').toUpperCase())
                            ? 'Current USD price per token (for USD PnL)'
                            : 'Live price'
                    }
                  >
                    {displayCurrentPrice != null && displayCurrentPrice > 0 ? (() => {
                      const parts = formatLiveValue(displayCurrentPrice, (v) => formatPriceHuman(v));
                      if (!parts || !parts.dec) return formatPriceHuman(displayCurrentPrice);
                      return <span key={refreshTick} className="trade-cost-analytics-live-num"><span>{parts.int}</span><span className="trade-cost-analytics-live-decimals">{parts.dec}</span></span>;
                    })() : 'Unavailable'}
                  </td>
                  <td className="cell-num">
                    {entryValueUsd != null ? (
                      <span className="trade-cost-analytics-entry-val-wrap">
                        ${formatNumber(entryValueUsd, 2)}
                        {pos.openTxHash && pos.source === 'execution' ? (
                          <a
                            href={`https://bscscan.com/tx/${pos.openTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="trade-cost-analytics-open-tx-link"
                            title="Opening transaction on BscScan. Entry value USD = spent BNB/WBNB x USD rate, aligned with the WBNB line on BscScan; the USD value of the received token can differ slightly because of slippage/oracle."
                            aria-label="View opening tx on BscScan"
                          >
                            <ExternalLink size={14} aria-hidden />
                          </a>
                        ) : null}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="cell-num trade-cost-analytics-cell-live" title={currentValueUsd == null && current == null ? 'Value unavailable (missing current price)' : 'Live current value from Chain'}>
                    {currentValueUsd != null ? (() => {
                      const parts = formatLiveValue(currentValueUsd, (v) => `$${formatNumber(v, 2)}`);
                      if (!parts || !parts.dec) return `$${formatNumber(currentValueUsd, 2)}`;
                      return <span key={refreshTick} className="trade-cost-analytics-live-num"><span>{parts.int}</span><span className="trade-cost-analytics-live-decimals">{parts.dec}</span></span>;
                    })() : 'Unavailable'}
                  </td>
                  <td className="cell-num" title={pos.openGasUsdSource && pos.openGasUsdSource !== 'real' ? 'Open gas: Estimated or Fallback, not from receipt' : (pos.openGasUsd != null ? 'Open gas from execution' : '')}>
                    {pos.openGasUsd != null ? (
                      <>
                        {`$${formatNumber(pos.openGasUsd, 4)}`}
                        {(pos.openGasUsdSource && pos.openGasUsdSource !== 'real') && <span className="trade-cost-analytics-gas-estimate-label" aria-label="Estimated"> (Est.)</span>}
                      </>
                    ) : '—'}
                  </td>
                  <td className="cell-num" title={pos.estimatedCloseGasUsd != null && pos.estimatedCloseGasUsdIsEstimate ? 'Estimated close gas; not a real cost until close' : (pos.estimatedCloseGasUsd != null ? 'Close gas' : '')}>
                    {pos.estimatedCloseGasUsd != null ? (
                      <>
                        {`$${formatNumber(pos.estimatedCloseGasUsd, 4)}`}
                        {pos.estimatedCloseGasUsdIsEstimate && <span className="trade-cost-analytics-gas-estimate-label" aria-label="Estimated"> (Est.)</span>}
                      </>
                    ) : '—'}
                  </td>
                  <td className="cell-num">
                    {pnlUsd != null ? (
                      <span className={`trade-cost-analytics-pnl-chip ${pnlUsd >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
                        {formatPnlUsdHuman(pnlUsd)}
                      </span>
                    ) : 'Unavailable'}
                  </td>
                  <td className="cell-num">
                    {pnlNetUsd != null ? (
                      <span className={`trade-cost-analytics-pnl-chip ${pnlNetUsd >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
                        {formatPnlUsdHuman(pnlNetUsd)}
                      </span>
                    ) : 'Unavailable'}
                  </td>
                  <td
                    className="cell-num"
                    title={
                      roiPctFromUsd != null
                        ? 'ROC vs entry value (USD): from net PnL when available, otherwise from gross PnL, aligned with the net PnL column.'
                        : priceChangePct != null
                          ? 'Estimated percentage change from entry -> current price (fallback; can differ from USD PnL if entry value or PnL is missing).'
                          : undefined
                    }
                  >
                    {(() => {
                      const raw = pnlPctDisplay;
                      if (raw == null || entryValueUsd == null || entryValueUsd < 0.01) return 'Unavailable';
                      const capped = Math.max(-999, Math.min(999, raw));
                      const label = raw > 999 ? '>999%' : raw < -999 ? '<-999%' : `${(capped >= 0 ? '+' : '')}${formatNumber(capped, 2)}%`;
                      return (
                        <span className={`trade-cost-analytics-pnl-chip ${raw >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
                          {label}
                        </span>
                      );
                    })()}
                  </td>
                  <td>
                    {canClose ? (
                      <button
                        type="button"
                        className="trade-cost-analytics-btn-close"
                        onClick={() => handleClose(pos.id, pos.token)}
                        disabled={isClosing}
                        aria-busy={isClosing}
                        title="Close position (realize profit/loss)"
                      >
                        {isClosing ? 'Closing...' : 'Close position'}
                      </button>
                    ) : isOtaClosable ? (
                      <div className="trade-cost-analytics-ota-actions">
                        <button
                          type="button"
                          className="trade-cost-analytics-btn-close trade-cost-analytics-btn-ota-request"
                          onClick={() => {
                            console.log('[OTA Close DEBUG] button "Close now" clicked', { token: pos?.token, rowKey: pos?.rowKey });
                            handleRequestOtaClose(pos);
                          }}
                          disabled={isRequestingOta || isLlmSuspendBusy}
                          aria-busy={isRequestingOta}
                          title="Close now (confirmation)"
                        >
                          {isRequestingOta ? 'Sending...' : 'Close now'}
                        </button>
                        <button
                          type="button"
                          className={`trade-cost-analytics-btn-llm-suspend${llmSuspended ? ' trade-cost-analytics-btn-llm-suspend--active' : ''}`}
                          onClick={() => handleToggleOtaLlmSuspend(pos)}
                          disabled={isRequestingOta || isLlmSuspendBusy}
                          aria-busy={isLlmSuspendBusy}
                          title={
                            llmSuspended
                              ? 'Reactivate OpenAI analysis for this position'
                              : 'Suspend OpenAI analysis for this position to avoid token usage'
                          }
                        >
                          {isLlmSuspendBusy ? '...' : llmSuspended ? 'Resume LLM analysis' : 'Suspend LLM'}
                        </button>
                      </div>
                    ) : (
                      <span className="trade-cost-analytics-open-positions-ota-note" title="Rule-based exit (TP/SL); exit optimization is not implemented.">TP/SL close (OTA)</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
      <div className="trade-cost-analytics-vault-provenance" style={{ marginTop: '1rem' }}>
        <button type="button" className="trade-cost-analytics-btn-refresh-primary" onClick={loadVaultProvenance} disabled={!walletAddress || vaultProvenanceLoading} aria-busy={vaultProvenanceLoading}>
          {vaultProvenanceLoading ? 'Loading...' : 'Vault provenance (on-chain vs DB)'}
        </button>
        {vaultProvenanceError && <p className="trade-cost-analytics-open-positions-error" role="alert">{vaultProvenanceError}</p>}
        {vaultProvenance && !vaultProvenanceError && (
          <div style={{ marginTop: '0.5rem' }}>
            {!vaultProvenance.onChainAvailable && vaultProvenance.note && <p className="trade-cost-analytics-open-positions-error" style={{ fontWeight: 'normal' }}>{vaultProvenance.note}</p>}
            {vaultProvenance.anomalyCount > 0 && (
              <p className="vault-provenance-anomaly-banner" role="alert">
                <strong>Open anomalies: {vaultProvenance.anomalyCount}</strong> - on-chain balance differs from DB or has no provenance. Not OK.
              </p>
            )}
            {vaultProvenance.tokens && vaultProvenance.tokens.some((t) => t.provenanceStatus && t.provenanceStatus !== 'EXACT') && vaultProvenance.anomalyCount === 0 && (
              <p className="vault-provenance-inferred-banner" role="status">
                <strong>Status is not EXACT</strong> for one or more tokens (INFERRED/UNKNOWN). Check delta and provenance.
              </p>
            )}
            <table className="trade-cost-analytics-table trade-cost-analytics-vault-provenance-table" style={{ fontSize: '0.85rem' }}>
              <thead><tr><th>Token</th><th>On-chain</th><th>DB-derived</th><th>Delta</th><th>Status</th></tr></thead>
              <tbody>
                {(vaultProvenance.tokens || []).filter((t) => (t.onChainBalance_human != null && t.onChainBalance_human > 0) || (t.dbDerivedBalance_human != null && t.dbDerivedBalance_human !== 0)).map((t) => {
                  const isUnknown = t.provenanceStatus === 'UNKNOWN';
                  const isNotExact = t.provenanceStatus !== 'EXACT';
                  const dec = t.token_symbol === 'DOGE' ? 8 : 18;
                  const deltaHuman = t.delta_raw != null && t.delta_raw !== '0' ? (Number(t.delta_raw) / Math.pow(10, dec)) : 0;
                  return (
                    <tr key={t.token_symbol} className={isUnknown ? 'vault-provenance-row-unknown' : isNotExact ? 'vault-provenance-row-inferred' : ''}>
                      <td>{t.token_symbol}</td>
                      <td>{t.onChainBalance_human != null ? formatNumber(t.onChainBalance_human, 6) : '—'}</td>
                      <td>{t.dbDerivedBalance_human != null ? formatNumber(t.dbDerivedBalance_human, 6) : '—'}</td>
                      <td>{t.delta_raw != null && t.delta_raw !== '0' ? `${formatNumber(deltaHuman, 6)} (raw: ${t.delta_raw})` : '0'}</td>
                      <td>
                        <span className={t.provenanceStatus === 'EXACT' ? 'pnl-positive' : t.provenanceStatus === 'UNKNOWN' ? 'vault-provenance-status-unknown' : 'vault-provenance-status-inferred'} aria-label={t.provenanceStatus}>
                          {t.provenanceStatus === 'EXACT' ? 'EXACT' : t.provenanceStatus === 'INFERRED' ? 'INFERRED' : 'UNKNOWN'}
                        </span>
                        {t.anomalyCreated && <span title="Anomaly created" className="vault-provenance-anomaly-badge"> ⚠</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {tracePopup && (
        <div className="trade-cost-analytics-modal-overlay trade-cost-analytics-trace-overlay" role="dialog" aria-modal="true" aria-labelledby="trace-popup-title">
          <div className="trade-cost-analytics-modal trade-cost-analytics-trace-popup">
            <h3 id="trace-popup-title">What happens - manual close for {tracePopup.position?.token}</h3>
            <p className="trade-cost-analytics-trace-desc">The close is requested by you; OTA/LLM does not decide anything. The executor only sends the transaction. Routes and server data are shown online up to the signed blockchain transaction. This window stays open until you close it.</p>
            <div className="trade-cost-analytics-trace-steps">
              {tracePopup.steps.map((s) => (
                <div key={s.id} className={`trade-cost-analytics-trace-step ${s.status}`}>
                  <div className="trade-cost-analytics-trace-step-title">
                    <span className="trade-cost-analytics-trace-method">{s.method}</span>
                    {s.title}
                  </div>
                  <div className="trade-cost-analytics-trace-route" title={s.route}>{s.route}</div>
                  {s.requestBody && (
                    <div className="trade-cost-analytics-trace-block">
                      <strong>Request (body):</strong>
                      <pre>{JSON.stringify(s.requestBody, null, 2)}</pre>
                    </div>
                  )}
                  {s.response != null && (
                    <div className="trade-cost-analytics-trace-block">
                      <strong>Response (online):</strong>
                      {s.id === 'get-status' && s.response?.status === 'completed' ? (
                        <>
                          <pre>{JSON.stringify(s.response, null, 2)}</pre>
                          {s.response?.txHash && (
                            <p className="trade-cost-analytics-trace-tx">
                              <a href={BSCSCAN_TX(s.response.txHash)} target="_blank" rel="noopener noreferrer" className="trade-cost-analytics-tx-link">
                                <ExternalLink size={14} /> Transaction: {String(s.response.txHash).slice(0, 10)}...{String(s.response.txHash).slice(-8)} (BSCScan)
                              </a>
                              {s.response.amountIn != null && (
                                <span> · Input: {formatAmountHuman(toHumanAmount(s.response.amountIn, tracePopup.position?.token) ?? s.response.amountIn, tracePopup.position?.token, 6)} {tracePopup.position?.token}</span>
                              )}
                              {s.response.amountOut != null && (
                                <span> · Output: {formatAmountHuman(toHumanAmount(s.response.amountOut, 'USDT') ?? s.response.amountOut, 'USDT', 6)} USDT</span>
                              )}
                              {s.response.executedAt && (
                                <span> · {new Date(s.response.executedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
                              )}
                            </p>
                          )}
                        </>
                      ) : (
                        <pre>{JSON.stringify(s.response, null, 2)}</pre>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {tracePopup.steps.length === 0 && tracePopup.sending && (
              <p className="trade-cost-analytics-trace-hint" role="status">Sending request to server...</p>
            )}
            {tracePopup.steps.length === 0 && !tracePopup.sending && (
              <p className="trade-cost-analytics-trace-hint">The request should have been sent automatically. If you see this message without steps above, use "Retry sending".</p>
            )}
            <div className="trade-cost-analytics-modal-actions trade-cost-analytics-trace-actions">
              {tracePopup.steps.some((s) => s.id === 'post' && s.status === 'error') && tracePopup.position && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => sendTraceRequestAndPoll(tracePopup.position, { skipConfirm: true })}
                  disabled={tracePopup.sending}
                >
                  {tracePopup.sending ? 'Sending...' : 'Retry sending'}
                </button>
              )}
              <button type="button" className="btn-secondary" onClick={() => { setTracePopup(null); fetchOpen(true); onCloseDone?.(); }}>
                Close window
              </button>
            </div>
          </div>
        </div>
      )}
      {closedPositionPopup && (
        <div className="trade-cost-analytics-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="ota-closed-popup-title">
          <div className="trade-cost-analytics-modal trade-cost-analytics-closed-popup">
            <h3 id="ota-closed-popup-title">Position {closedPositionPopup.token} closed</h3>
            <p><strong>Realized PnL (from chain):</strong>{' '}
              {closedPositionPopup.profitUsd != null ? (
                <span className={closedPositionPopup.profitUsd >= 0 ? 'pnl-positive' : 'pnl-negative'}>
                  {closedPositionPopup.profitUsd >= 0 ? '+' : ''}{formatNumber(closedPositionPopup.profitUsd, 4)} USD
                </span>
              ) : '—'}
            </p>
            <p><strong>Close date:</strong>{' '}
              {closedPositionPopup.executedAt
                ? new Date(closedPositionPopup.executedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
                : '—'}
            </p>
            {closedPositionPopup.txHash && (
              <p>
                <a href={BSCSCAN_TX(closedPositionPopup.txHash)} target="_blank" rel="noopener noreferrer" className="trade-cost-analytics-tx-link">
                  <ExternalLink size={14} /> View transaction on BSCScan
                </a>
              </p>
            )}
            <div className="trade-cost-analytics-modal-actions">
              <button type="button" className="btn-primary" onClick={() => { setClosedPositionPopup(null); fetchOpen(true); onCloseDone?.(); }}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function TransactionRow({ tx, explorerTxUrl }) {
  const [expanded, setExpanded] = useState(false);
  const isSuccess = tx.status === 'confirmed' || tx.status === 'completed';
  const isFailed = tx.status === 'failed' || tx.status === 'reverted';
  const dateStr = tx.executedAt ? new Date(tx.executedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '—';

  return (
    <>
      <tr
        className={`trade-cost-analytics-tx-row ${isFailed ? 'row-failed' : ''} ${expanded ? 'row-expanded' : ''}`}
        onClick={() => setExpanded((e) => !e)}
      >
        <td className="cell-expand">{expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</td>
        <td className="cell-date">{dateStr}</td>
        <td className="cell-pair">{tx.tokenIn} → {tx.tokenOut}</td>
        <td className="cell-side">
          <span className="cell-badge-stack cell-badge-stack--side">
            <span className={`badge side-${(tx.side || '').toLowerCase()}`}>{SIDE_LABEL[tx.side] || tx.side}</span>
            {(tx.actionFamily === 'open_short' || tx.actionFamily === 'close_short' || tx.positionSide === 'SHORT') && (
              <span style={{ fontSize: 9, fontWeight: 700, background: '#7f1d1d', color: '#fca5a5', padding: '1px 5px', borderRadius: 3, letterSpacing: 0.5 }}>SHORT</span>
            )}
            {(tx.instrumentKind === 'long_futures_perp' || tx.actionFamily === 'open_long_futures' || tx.actionFamily === 'close_long_futures') && (
              <span style={{ fontSize: 9, fontWeight: 700, background: '#422006', color: '#fcd34d', padding: '1px 5px', borderRadius: 3, letterSpacing: 0.5 }}>LONG FUT</span>
            )}
            {(tx.paperShadow === true || tx.paper === true) && (
              <span style={{ fontSize: 9, fontWeight: 700, background: '#1e3a5f', color: '#93c5fd', padding: '1px 5px', borderRadius: 3, letterSpacing: 0.5 }}>PAPER</span>
            )}
          </span>
        </td>
        <td className="cell-amount">
          {formatAmountHuman(tx.amountInHuman ?? tx.amountInRaw, tx.displayTokenIn || tx.tokenIn, 4) || '—'}
          {(tx.displayTokenIn || tx.tokenIn) ? ` ${tx.displayTokenIn || tx.tokenIn}` : ''}
        </td>
        <td className="cell-amount">
          {tx.displayTokenOut === 'USD' && tx.amountOutHuman != null && Number.isFinite(Number(tx.amountOutHuman))
            ? `${Number(tx.amountOutHuman) >= 0 ? '+' : ''}${formatNumber(Number(tx.amountOutHuman), 4)}`
            : (formatAmountHuman(tx.amountOutHuman ?? tx.amountOutRaw, tx.displayTokenOut || tx.tokenOut, 4) || '—')}
          {(tx.displayTokenOut || tx.tokenOut) ? ` ${tx.displayTokenOut || tx.tokenOut}` : ''}
        </td>
        <td className="cell-num">
          {tx.gasFeeUsd != null ? `$${formatNumber(tx.gasFeeUsd, 4)}` : '—'}
        </td>
        <td className="cell-num">
          {tx.totalFeesUsd != null ? `$${formatNumber(tx.totalFeesUsd, 4)}` : '—'}
        </td>
        <td className="cell-num">
          {(tx.realizedPnlNetUsd != null ? tx.realizedPnlNetUsd : tx.realizedPnlUsd) != null ? (
            <span className={`trade-cost-analytics-pnl-chip ${(tx.realizedPnlNetUsd != null ? tx.realizedPnlNetUsd : tx.realizedPnlUsd) >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
              {(tx.realizedPnlNetUsd != null ? tx.realizedPnlNetUsd : tx.realizedPnlUsd) >= 0 ? '+' : ''}{formatNumber(tx.realizedPnlNetUsd != null ? tx.realizedPnlNetUsd : tx.realizedPnlUsd, 4)} USD
            </span>
          ) : '—'}
        </td>
        <td className="cell-status">
          <span className="cell-badge-stack cell-badge-stack--status">
            <span className={`badge status-${(tx.status || '').toLowerCase()}`}>{tx.status}</span>
            {tx.dataSource && (
              <span className="badge data-source" title="Data source">{DATA_SOURCE_LABEL[tx.dataSource] || tx.dataSource}</span>
            )}
          </span>
        </td>
        <td className="cell-link">
          {tx.txHash ? (
            <a href={explorerTxUrl(tx.txHash)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} title="View on BSCScan">
              <ExternalLink size={12} />
            </a>
          ) : '—'}
        </td>
      </tr>
      {expanded && (
        <tr className="trade-cost-analytics-detail-row">
          <td colSpan={11}>
            <div className="tx-detail-panel">
              <div className="tx-detail-grid">
                <div><strong>Execution price</strong> {tx.executionPrice != null ? formatNumber(tx.executionPrice, 6) : '—'}</div>
                <div><strong>Reference price</strong> {tx.referencePrice != null ? formatNumber(tx.referencePrice, 6) : '—'}</div>
                <div><strong>Deviation from reference</strong> {tx.deviationFromReferencePct != null ? formatNumber(tx.deviationFromReferencePct, 2) + '%' : '—'}</div>
                <div><strong>Slippage (bps)</strong> {tx.slippageBpsUsed != null ? tx.slippageBpsUsed : '—'}</div>
                <div><strong>Gas (native)</strong> {tx.gasUsed && tx.gasPrice ? 'from receipt' : '—'}</div>
                <div><strong>Open gas (USD)</strong> {tx.openGasUsd != null ? `$${formatNumber(tx.openGasUsd, 4)}` : '—'}</div>
                <div><strong>Close gas (USD)</strong> {tx.closeGasUsd != null ? `$${formatNumber(tx.closeGasUsd, 4)}` : '—'}</div>
                <div><strong>Approval gas (USD)</strong> {tx.approvalGasUsd != null ? `$${formatNumber(tx.approvalGasUsd, 4)}` : '— (n/a)'}</div>
                <div><strong>Close reason</strong> {tx.closeReason || tx.blockReason || '—'}</div>
                <div><strong>Cost model</strong> {tx.costModelSource || '—'}</div>
                <div><strong>PnL model</strong> {tx.pnlModelSource || '—'}</div>
                {tx.instrumentKind === 'long_futures_perp' && tx.futuresNotionalUsd != null && (
                  <div><strong>Notional (perp)</strong> {formatNumber(tx.futuresNotionalUsd, 2)} USD - the value in &quot;Amount out&quot; is the estimated exposure size in {tx.tokenOut} (notional / marked entry price), not a wallet token amount.</div>
                )}
                {tx.decisionReasoning != null && tx.decisionReasoning.trim() !== '' && (
                  <div className="tx-detail-decision">
                    <strong>Decision context (why it bought/sold)</strong>
                    <p>{tx.decisionReasoning}</p>
                  </div>
                )}
              </div>
              {tx.costBreakdown && (
                <div className="cost-breakdown">
                  <strong>Cost breakdown:</strong> Gas: {tx.costBreakdown.gasCostUsd != null ? `$${formatNumber(tx.costBreakdown.gasCostUsd, 4)}` : '—'} USD
                  {tx.costBreakdown.slippageExecutionCostUsd != null && ` · Slippage/exec: $${formatNumber(tx.costBreakdown.slippageExecutionCostUsd, 4)}`}
                  {tx.costBreakdown.dexFeeUsd != null && ` · DEX fee: $${formatNumber(tx.costBreakdown.dexFeeUsd, 4)}`}
                </div>
              )}
              {isFailed && (
                <p className="tx-detail-note">
                  <AlertTriangle size={14} /> Funds were not moved; {tx.gasFeeUsd != null && tx.gasFeeUsd > 0 ? 'gas was still consumed.' : 'no on-chain tx.'}
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function TradeCostAnalyticsPage() {
  useOtaEvmWalletAuthSync({ enabled: true });
  const { signer } = useWallet();
  const { walletAddress, loading: walletLoading, isConnected, balances, tokenOptions } = useVaultDeposit();
  const { items: vaultHistoryItems } = useVaultTransactionHistory(walletAddress);
  const loadSeqRef = useRef(0);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ limit: 50, offset: 0, total: 0, hasMore: false });
  const [portfolio, setPortfolio] = useState(null);
  const [capitalBridge, setCapitalBridge] = useState(null);
  const [vaultFlowTotals, setVaultFlowTotals] = useState({ depositsByToken: [], withdrawalsByToken: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterToken, setFilterToken] = useState('');
  const [bridgePanelOpen, setBridgePanelOpen] = useState(false);
  /** Incremented only when load() sets capitalBridge from the API; avoids an infinite loop in the enrichment useEffect. */
  const [bridgeFromApiVersion, setBridgeFromApiVersion] = useState(0);

  const load = useCallback(async () => {
    const loadSeq = ++loadSeqRef.current;
    if (!walletAddress) {
      setTransactions([]);
      setPortfolio(null);
      setCapitalBridge(null);
      setVaultFlowTotals({ depositsByToken: [], withdrawalsByToken: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (signer && walletAddress) {
        try {
          await ensureOtaWalletForApiIfNeeded(signer, walletAddress);
        } catch (_) {
          /* Signature rejected; still try so 401 can display a clear message. */
        }
      }
      const [costRes, summaryRes] = await Promise.all([
        getTransactionCostBreakdown(walletAddress, { limit: 100, offset: 0, status: filterStatus || undefined, token: filterToken || undefined }),
        getPortfolioSummary(walletAddress),
      ]);
      if (loadSeqRef.current !== loadSeq) return;
      setTransactions(costRes.transactions || []);
      setPagination(costRes.pagination || {});
      setPortfolio(summaryRes);
      getCapitalBridge(walletAddress)
        .then((bridgeRes) => {
          if (loadSeqRef.current !== loadSeq) return;
          setCapitalBridge(bridgeRes);
          if (bridgeRes) setBridgeFromApiVersion((v) => v + 1);
        })
        .catch((bridgeErr) => {
          if (loadSeqRef.current !== loadSeq) return;
          setCapitalBridge({
            startingCapitalUsd: null,
            totalDepositsUsd: null,
            totalWithdrawalsUsd: null,
            fundingSource: bridgeErr?.failedEndpoint ? 'request_failed' : 'unavailable',
            fundingExact: false,
            fundingNote: bridgeErr?.message || 'Capital bridge is temporarily unavailable.',
            realizedPnlUsd: summaryRes?.totalRealizedPnlUsd ?? null,
            unrealizedPnlUsd: null,
            totalGasSpentUsd: summaryRes?.totalGasSpentUsd ?? null,
            totalSlippageExecutionCostUsd: null,
            computedEquityUsd: null,
            currentVaultValueUsd: null,
            reconciliationDeltaUsd: null,
            reconciliationNote: null,
            vaultDepositHistoryUnknown: true,
          });
        });
    } catch (e) {
      if (loadSeqRef.current !== loadSeq) return;
      const mapped = formatOtaSessionUserMessage(e);
      const msg = mapped || e?.message || 'Failed to load analytics';
      const status = e?.failedStatus ?? e?.status;
      const is404 = status === 404 || (typeof msg === 'string' && (msg.includes('Resource not found') || msg.toLowerCase().includes('not found')));
      setError(is404
        ? 'Analytics API is unavailable (404). Steps: 1) Redeploy backend-server on Render with /api/ai-trading/analytics/* routes. 2) Migration 054 must already be applied to DB. 3) Refresh the page.'
        : msg);
      setTransactions([]);
      setPortfolio(null);
      setCapitalBridge(null);
      setVaultFlowTotals({ depositsByToken: [], withdrawalsByToken: [] });
    } finally {
      setLoading(false);
    }
  }, [walletAddress, filterStatus, filterToken, signer]);

  const handleUnrealizedPnlComputed = useCallback((totalUnrealizedPnlUsd) => {
    setCapitalBridge((prev) => {
      if (!prev) return null;
      const num = totalUnrealizedPnlUsd != null && Number.isFinite(totalUnrealizedPnlUsd) ? totalUnrealizedPnlUsd : null;
      const prevEq = prev.computedEquityUsd ?? 0;
      const prevUnr = prev.unrealizedPnlUsd ?? 0;
      return {
        ...prev,
        unrealizedPnlUsd: num,
        computedEquityUsd: prevEq - prevUnr + (num ?? 0),
      };
    });
  }, []);

  const resolveVaultFlowSymbol = useCallback((row) => {
    const addr = String(row?.token || '').toLowerCase();
    const fromTokenOptions = (tokenOptions || []).find((t) => String(t?.address || '').toLowerCase() === addr);
    return fromTokenOptions?.symbol || row?.symbol || 'TOKEN';
  }, [tokenOptions]);

  useEffect(() => {
    load();
  }, [load]);

  /** Deposits/Withdrawals: on-chain FundsDeposited/FundsWithdrawn events from UserVault. USD = current spot per token. */
  useEffect(() => {
    if (!walletAddress || bridgeFromApiVersion === 0) return;
    const run = async () => {
      const bridge = capitalBridge;
      if (!bridge) return;
      const symbolsFromVault = (tokenOptions || []).map((t) => t.symbol).filter(Boolean);
      const allSymbols = [...new Set(symbolsFromVault)];
      let prices = {};
      try {
        prices = await tokenPriceService.getAllTokenPrices(allSymbols) || {};
      } catch (_) {}
      const price = (sym) => (prices[sym] != null && Number.isFinite(prices[sym]) ? prices[sym] : 0);

      let depositsByToken = [];
      let withdrawalsByToken = [];
      let depositHistoryUnknown = isRealFundingUnavailable(bridge);
      try {
        const invested = await getInvestedCapital(walletAddress);
        depositsByToken = Array.isArray(invested.fundingDepositsByToken) ? invested.fundingDepositsByToken : (Array.isArray(invested.depositsByToken) ? invested.depositsByToken : []);
        withdrawalsByToken = Array.isArray(invested.fundingWithdrawalsByToken) ? invested.fundingWithdrawalsByToken : (Array.isArray(invested.withdrawalsByToken) ? invested.withdrawalsByToken : []);
        depositHistoryUnknown = isRealFundingUnavailable(invested) || Boolean(invested.truncated);
      } catch (_) {
        depositHistoryUnknown = true;
      }

      setVaultFlowTotals({
        depositsByToken,
        withdrawalsByToken,
      });

      let currentVaultValueUsd = 0;
      let comparableCurrentVaultValueUsd = 0;
      const excludedFromHistoricalUsd = new Set(
        (Array.isArray(bridge?.fundingHistoricalUsdExcludedSymbols) ? bridge.fundingHistoricalUsdExcludedSymbols : [])
          .map((sym) => String(sym || '').trim().toUpperCase())
          .filter(Boolean)
      );
      for (const t of tokenOptions || []) {
        const raw = balances[t.address] || balances[String(t.address || '').toLowerCase()] || (t.symbol === 'BNB' ? balances['BNB'] : null) || '0';
        const bal = ethers.BigNumber.from(raw || '0');
        const human = parseFloat(ethers.utils.formatUnits(bal, t.decimals ?? 18)) || 0;
        const isStable = /USDT|USDC|BUSD|EURS|EURC/i.test(t.symbol || '');
        const symbolUpper = String(t.symbol || '').toUpperCase();
        const p = isStable ? 1 : (price(t.symbol) || 0);
        const valueUsd = human * p;
        currentVaultValueUsd += valueUsd;
        if (excludedFromHistoricalUsd.has(symbolUpper)) continue;
        comparableCurrentVaultValueUsd += valueUsd;
      }
      const excludedCurrentVaultValueUsd = currentVaultValueUsd - comparableCurrentVaultValueUsd;
      const nextPerformanceVsFundingUsd = (
        Number.isFinite(comparableCurrentVaultValueUsd)
        && Number.isFinite(bridge?.netFundingUsd)
      )
        ? comparableCurrentVaultValueUsd - bridge.netFundingUsd
        : null;

      setCapitalBridge((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          totalDepositsUsd: prev.totalDepositsUsd,
          totalWithdrawalsUsd: prev.totalWithdrawalsUsd,
          /** Do not store formula-derived starting capital; it is not an on-chain balance and confuses users. */
          startingCapitalUsd: null,
          currentVaultValueUsd: Number.isFinite(currentVaultValueUsd) ? currentVaultValueUsd : prev.currentVaultValueUsd,
          currentVaultComparableUsd: Number.isFinite(comparableCurrentVaultValueUsd) ? comparableCurrentVaultValueUsd : (prev.currentVaultComparableUsd ?? null),
          currentVaultExcludedUsd: Number.isFinite(excludedCurrentVaultValueUsd) ? excludedCurrentVaultValueUsd : (prev.currentVaultExcludedUsd ?? null),
          computedEquityUsd: Number.isFinite(currentVaultValueUsd) ? currentVaultValueUsd : prev.computedEquityUsd,
          performanceVsFundingUsd: Number.isFinite(nextPerformanceVsFundingUsd) ? nextPerformanceVsFundingUsd : prev.performanceVsFundingUsd,
          vaultDepositHistoryUnknown: depositHistoryUnknown,
        };
      });
    };
    run();
    // Intentionally omit capitalBridge from deps so setCapitalBridge does not retrigger the effect into an infinite loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- bridgeFromApiVersion triggers when the API sets bridge
  }, [bridgeFromApiVersion, walletAddress, vaultHistoryItems, tokenOptions, balances]);

  if (walletLoading || !isConnected) {
    return (
      <div className="trade-cost-analytics-page">
        <div className="trade-cost-analytics-header">
          <h1><BarChart2 size={24} /> Trade Cost Analytics</h1>
          <p className="subtitle">Costs, expenses, and OTA / auto-trading result</p>
        </div>
        <div className="trade-cost-analytics-connect">
          <p>Connect your wallet to view cost tracking.</p>
          <Link to="/dex-edu/account">Personal account</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="trade-cost-analytics-page">
      <div className="trade-cost-analytics-header">
        <h1><BarChart2 size={24} /> Trade Cost Analytics</h1>
        <p className="subtitle">Complete tracking: gas, slippage, realized PnL. Clear exact vs estimated split.</p>
        <div className="header-actions">
          <Link to="/dex-edu/account" className="link-back">← Personal account</Link>
          <button
            type="button"
            className="btn-bridge-menu"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setBridgePanelOpen((o) => !o); }}
            title={bridgePanelOpen ? 'Close Capital bridge' : 'Capital bridge'}
            aria-expanded={bridgePanelOpen}
            aria-label={bridgePanelOpen ? 'Close Capital bridge' : 'Open Capital bridge'}
          >
            <Menu size={20} />
          </button>
          <button type="button" className="btn-refresh" onClick={load} disabled={loading} title="Refresh">
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {bridgePanelOpen && (
        <div className="trade-cost-analytics-bridge-panel" role="region" aria-label="Capital bridge">
          <div className="trade-cost-analytics-bridge-panel-inner">
            <h2 className="bridge-panel-title">Capital bridge</h2>
            {!capitalBridge ? (
              <p className="bridge-note">No Capital bridge data yet. Refresh after you have executions.</p>
            ) : (
              <>
            <p className="bridge-note">
              <Info size={14} className="bridge-note-icon" aria-hidden />
              <span className="bridge-note-body">
                <strong>Current vault total</strong> shows the full vault at current prices. <strong>Comparable current value</strong> and <strong>Net funding</strong> use the same scope, so their difference reflects reality and does not compare unrelated values.
              </span>
            </p>
            {capitalBridge.vaultDepositHistoryUnknown && (
              <p className="bridge-note" style={{ color: 'var(--ds-text-secondary, #aaa)', fontSize: 12 }}>
                Could not exactly confirm on-chain vault events. Funding values stay `—` until RPC / backend can directly read `FundsDeposited` and `FundsWithdrawn`.
              </p>
            )}
            {(() => {
              const hasVal = (v) => v != null && Number.isFinite(v);
              const fmt = (v) => hasVal(v) ? `${formatNumber(v, 2)} USD` : null;
              const excludedSymbols = Array.isArray(capitalBridge.fundingHistoricalUsdExcludedSymbols) ? capitalBridge.fundingHistoricalUsdExcludedSymbols.filter(Boolean) : [];
              const totalCurrentVal = capitalBridge.currentVaultValueUsd ?? capitalBridge.computedEquityUsd;
              const comparableCurrentVal = capitalBridge.currentVaultComparableUsd ?? totalCurrentVal;
              const excludedCurrentVal = capitalBridge.currentVaultExcludedUsd;
              const netFundingVal = fmt(capitalBridge.netFundingUsd);
              const changeVsFundingVal = hasVal(capitalBridge.performanceVsFundingUsd)
                ? `${capitalBridge.performanceVsFundingUsd >= 0 ? '+' : ''}${formatNumber(capitalBridge.performanceVsFundingUsd, 2)} USD`
                : null;
              const changeVsFundingFormula = hasVal(comparableCurrentVal) && hasVal(capitalBridge.netFundingUsd) && hasVal(capitalBridge.performanceVsFundingUsd)
                ? `Comparable current value ${formatNumber(comparableCurrentVal, 2)} - Net funding ${formatNumber(capitalBridge.netFundingUsd, 2)} = ${capitalBridge.performanceVsFundingUsd >= 0 ? '+' : ''}${formatNumber(capitalBridge.performanceVsFundingUsd, 2)} USD`
                : null;
              const gasVal = hasVal(capitalBridge.totalGasSpentUsd) ? `-${formatNumber(capitalBridge.totalGasSpentUsd, 4)} USD` : null;
              const slipVal = hasVal(capitalBridge.totalSlippageExecutionCostUsd) ? `-${formatNumber(capitalBridge.totalSlippageExecutionCostUsd, 4)} USD` : null;
              return (
                <div className="bridge-formula">
                  <div className="bridge-formula-row formula-result"><span className="bridge-formula-label">Current vault total (all current USD)</span><span className="bridge-formula-value" title="Full vault valued at current market prices.">{fmt(totalCurrentVal) ?? <span className="bridge-value-empty">—</span>}</span></div>
                  <div className="bridge-formula-row bridge-formula-sep" aria-hidden><span className="bridge-formula-label" style={{ fontSize: 11, opacity: 0.75 }}>{capitalBridge.vaultDepositHistoryUnknown ? 'On-chain flow (unconfirmed)' : 'On-chain flow (exact)'}</span><span /></div>
                  <div className="bridge-formula-row"><span className="bridge-formula-label">Comparable current value (current USD{excludedSymbols.length ? `, excl. ${excludedSymbols.join(', ')}` : ''})</span><span className="bridge-formula-value" title="Current subtotal directly comparable with historical funding, on the same token set.">{fmt(comparableCurrentVal) ?? <span className="bridge-value-empty">—</span>}</span></div>
                  {excludedSymbols.length > 0 && (
                    <div className="bridge-formula-row"><span className="bridge-formula-label">Excluded from comparison (current USD)</span><span className="bridge-formula-value" title="Current value of tokens shown in the vault but excluded from historical comparison until a real historical USD source exists.">{fmt(excludedCurrentVal) ?? <span className="bridge-value-empty">—</span>}</span></div>
                  )}
                  <div className="bridge-formula-row"><span className="bridge-formula-label">Net funding (historical USD{excludedSymbols.length ? `, excl. ${excludedSymbols.join(', ')}` : ''})</span><span className="bridge-formula-value" title="Net amount valued in USD at the time of each confirmed on-chain deposit and withdrawal.">{netFundingVal ?? <span className="bridge-value-empty">—</span>}</span></div>
                  <div className="bridge-formula-row"><span className="bridge-formula-label">Change vs net funding</span><span className="bridge-formula-value" title="Comparable current value minus net funding.">{changeVsFundingVal ?? <span className="bridge-value-empty">—</span>}</span></div>
                  {changeVsFundingFormula && (
                    <div className="bridge-formula-row">
                      <span className="bridge-formula-label" style={{ fontSize: 11, opacity: 0.75 }}>Formula</span>
                      <span className="bridge-formula-value" title="Comparable current value minus net funding, shown explicitly.">{changeVsFundingFormula}</span>
                    </div>
                  )}
                  <div className="bridge-formula-row"><span className="bridge-formula-label">Total funding deposited</span><span className="bridge-formula-value" title="All confirmed on-chain deposits from wallet into UserVault, grouped by token.">{renderVaultFlowLines(vaultFlowTotals.depositsByToken, resolveVaultFlowSymbol, capitalBridge.fundingExact ? '0' : '—')}</span></div>
                  <div className="bridge-formula-row"><span className="bridge-formula-label">Total funding withdrawn</span><span className="bridge-formula-value" title="All confirmed on-chain withdrawals from UserVault to wallet, grouped by token.">{renderVaultFlowLines(vaultFlowTotals.withdrawalsByToken, resolveVaultFlowSymbol, capitalBridge.fundingExact ? '0' : '—')}</span></div>
                  <div className="bridge-formula-row bridge-formula-sep" aria-hidden><span className="bridge-formula-label" style={{ fontSize: 11, opacity: 0.75 }}>Executions (backend)</span><span /></div>
                  <div className="bridge-formula-row"><span className="bridge-formula-label">Realized PnL</span><span className="bridge-formula-value">{fmt(capitalBridge.realizedPnlUsd) ?? <span className="bridge-value-empty">—</span>}</span></div>
                  <div className="bridge-formula-row"><span className="bridge-formula-label">Unrealized PnL</span><span className="bridge-formula-value">{fmt(capitalBridge.unrealizedPnlUsd) ?? <span className="bridge-value-empty">—</span>}</span></div>
                  <div className="bridge-formula-row"><span className="bridge-formula-label">Gas (execution estimates)</span><span className="bridge-formula-value" title={!gasVal ? 'Not recorded' : ''}>{gasVal ?? <span className="bridge-value-empty">—</span>}</span></div>
                  <div className="bridge-formula-row"><span className="bridge-formula-label">Slippage / execution cost</span><span className="bridge-formula-value" title={!slipVal ? 'Not recorded' : ''}>{slipVal ?? <span className="bridge-value-empty">—</span>}</span></div>
                </div>
              );
            })()}
            {(Array.isArray(capitalBridge.fundingHistoricalUsdExcludedSymbols) && capitalBridge.fundingHistoricalUsdExcludedSymbols.length > 0) && (
              <div className="reconciliation-delta">
                <strong>Historical USD excludes:</strong> {capitalBridge.fundingHistoricalUsdExcludedSymbols.join(', ')}
                <p className="delta-note">Excluded tokens remain in `Current vault total`, but do not enter historical comparison until a real historical USD source exists for their valuation. `BITS` remains visual only: it is in presale and its current price comes separately from `CellManager`, not from a listed market.</p>
              </div>
            )}
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="trade-cost-analytics-error">
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {walletAddress && !error && (
        <>
          {/* Portfolio summary cards */}
          {portfolio && (
            <section className="trade-cost-analytics-cards">
              <h2>Portfolio summary (from executions)</h2>
              <div className="cards-grid">
                <div className="card">
                  <DollarSign size={20} />
                  <span className="card-label">Net realized PnL (total)</span>
                  <span className={`card-value ${(portfolio.totalRealizedPnlNetUsd != null ? portfolio.totalRealizedPnlNetUsd : portfolio.totalRealizedPnlUsd || 0) >= 0 ? 'positive' : 'negative'}`}>
                    {(portfolio.totalRealizedPnlNetUsd != null ? portfolio.totalRealizedPnlNetUsd : portfolio.totalRealizedPnlUsd || 0) >= 0 ? '+' : ''}{formatNumber(portfolio.totalRealizedPnlNetUsd != null ? portfolio.totalRealizedPnlNetUsd : portfolio.totalRealizedPnlUsd || 0, 2)} USD
                  </span>
                </div>
                <div className="card">
                  <Fuel size={20} />
                  <span className="card-label">Total gas paid</span>
                  <span className="card-value">-{formatNumber(portfolio.totalGasSpentUsd || 0, 4)} USD</span>
                </div>
                {(portfolio.totalFeesUsedUsd != null && Number(portfolio.totalFeesUsedUsd) > 0) && (
                  <div className="card">
                    <TrendingUp size={20} />
                    <span className="card-label">Total fees (gas + other)</span>
                    <span className="card-value">-{formatNumber(portfolio.totalFeesUsedUsd, 4)} USD</span>
                  </div>
                )}
                <div className="card">
                  <BarChart2 size={20} />
                  <span className="card-label">Transactions (success / failed / reverted)</span>
                  <span className="card-value">{portfolio.successCount ?? 0} / {portfolio.failedCount ?? 0} / {portfolio.revertedCount ?? 0}</span>
                </div>
                {(portfolio.totalSlippageBpsSum != null && portfolio.totalSlippageBpsSum > 0) || (portfolio.avgSlippageBps != null) || (portfolio.totalFeesUsd != null && portfolio.totalFeesUsd > 0) ? (
                  <div className="card card-collateral">
                    <TrendingUp size={20} />
                    <span className="card-label">Collateral expense stats</span>
                    <div className="card-value collateral-stats">
                      {portfolio.totalSlippageBpsSum != null && portfolio.totalSlippageBpsSum > 0 && (
                        <span>Slippage total (bps): {formatNumber(portfolio.totalSlippageBpsSum, 0)}</span>
                      )}
                      {portfolio.avgSlippageBps != null && <span>Average slippage (bps): {formatNumber(portfolio.avgSlippageBps, 0)}</span>}
                      {portfolio.totalFeesUsd != null && Number(portfolio.totalFeesUsd) > 0 && (
                        <span>Taxes / fees (total): {formatNumber(portfolio.totalFeesUsd, 4)} USD</span>
                      )}
                    </div>
                  </div>
                ) : null}
                {portfolio.totalFailedOrRevertedGasUsd > 0 && (
                  <div className="card card-warn">
                    <AlertTriangle size={20} />
                    <span className="card-label">Gas on failed/reverted tx</span>
                    <span className="card-value">-{formatNumber(portfolio.totalFailedOrRevertedGasUsd, 4)} USD</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Open positions: live PnL + manual close */}
          <OpenPositionsSection
            walletAddress={walletAddress}
            onCloseDone={load}
            onUnrealizedPnlComputed={handleUnrealizedPnlComputed}
          />

          {/* Filters */}
          <section className="trade-cost-analytics-table-section">
            <h2>Transactions (cost per execution)</h2>
            <div className="table-filters">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="reverted">Reverted</option>
              </select>
              <input
                type="text"
                placeholder="Token filter"
                value={filterToken}
                onChange={(e) => setFilterToken(e.target.value)}
                className="filter-token"
              />
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : (
              <div className="table-wrapper">
                <table className="trade-cost-analytics-table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Date / time</th>
                      <th>Pair</th>
                      <th>Side</th>
                      <th>Amount In</th>
                      <th>Amount Out</th>
                      <th>Gas (USD)</th>
                      <th>Total fees</th>
                      <th>PnL net</th>
                      <th>Status</th>
                      <th>Tx</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr><td colSpan={11} className="cell-empty">No transactions found.</td></tr>
                    ) : (
                      transactions.map((tx) => (
                        <TransactionRow key={tx.id} tx={tx} explorerTxUrl={BSCSCAN_TX} />
                      ))
                    )}
                  </tbody>
                </table>
                {pagination.hasMore && (
                  <p className="pagination-note">Showing {transactions.length} of {pagination.total}. Use filters to narrow results.</p>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
