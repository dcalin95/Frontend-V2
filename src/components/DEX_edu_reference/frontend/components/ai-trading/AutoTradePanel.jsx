/**
 * ⚡ AutoTradePanel Component - Auto Trading Mode (Mode 3)
 *
 * RULE: Everything displayed here comes only from API / OTA AI OpenAI. No prescribed, mock, or unverified data.
 * - Signals Today / Total Signals / Last Signal = GET /ai-trading/signals (backend). On error: do not update; remain 0/null.
 * - Activity Feed = initial status message + POST /ai-trading/analyze results (OpenAI). No fake copy.
 * - Token analyzed on scan: default BNB (BNB/USDT pair). Analysis is real (OpenAI); pair is set in code until selector exists.
 *
 * @module AutoTradePanel
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Zap, Sparkles, Settings, Shield, AlertCircle, CheckCircle, Clock, DollarSign, List, Lock, Rocket, Activity, TrendingUp, Eye, ArrowRight, BookOpen, BarChart2, ChevronDown, ChevronUp, ExternalLink, Bot, Play, Square, ArrowRightLeft, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useOTAAccess } from '../../hooks/useOTAAccess';
import { useOTAMode } from '../../hooks/useOTAMode';
import { useContractDeploymentStatus } from '../../hooks/useContractDeploymentStatus';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmationModal from '../common/ConfirmationModal';
import Modal from '../common/Modal/Modal';
import TokenLogo from '../common/TokenLogo';
import { formatNumber, formatPercentage } from '../../utils/formatters';
import { getApiBaseUrl } from '../../../config/apiEndpoints.js';
import { setPolicy as setPolicyOnChain, getPolicy, getPolicyFromBackendOnly, setTokenLimits as setTokenLimitsOnChain, getTokenLimits as getTokenLimitsOnChain, setTokenAllowed, setPairAllowed, ensurePolicyConfigured, isTokenAllowedOnChain, isPairAllowedOnChain, getOTAPolicyManagerAddress } from '../../services/otaPolicyService';
import { getAutoExecutionStatus, setAutoSession, clearSafetyStopForBsc, getAgentSessions, setAgentMode, directEntryOpen, directEntryClose, getDirectEntryPosition, getDirectEntryClosedPositions, getOTAMarketData, OTA_EMERGENCY_NEW_TRADES_DISABLED } from '../../services/aiTradingApiService';
import { analyzeMarketWithLlmProvider } from '../../services/otaAnalyzeFacade';
import { getMetrics, getRiskMetrics } from '../../services/performanceApiService';
import { getModelInferenceStatus } from '../../services/otaModelInferenceService';
import { loadOutcomesForAnalyze, buildAnalyzeOptions } from '../../utils/otaOutcomesHelper';
import { isOpenAiUnavailableResult, OTA_OPENAI_UNAVAILABLE_MESSAGE, getUserFriendlyError } from '../../utils/helpers';
import { getSignals } from '../../services/signalApiService';
import { getTrades } from '../../services/executionApiService';
import { ethers } from 'ethers';
import { TOKEN_REGISTRY, getTokenAddress } from '../../services/tokenRegistry';
import { isBotAuthorized as isBotAuthorizedUtil, getExecutorBotAuth } from '../../utils/otaTradingModes';
import { logWithPrefix } from '../../utils/logger';
import { fireAndForgetMetaRecordOutcomeFromDirectEntryClose } from '../../utils/otaMetaLearning';
import {
  mapAnalysisSourceToDataOriginRo,
  getTechnicalAnalysisSourceRaw,
  describeAnalysisSourceForUserRo,
} from '../../utils/otaLlmDisplayLabels';
import { useHeaderToken } from '../../context/HeaderTokenContext';
import { useOtaAutoDashboard } from '../../context/OtaAutoDashboardContext.jsx';
import tokenPriceService from '../../services/tokenPriceService';
import { useVaultDeposit } from '../../hooks/useVaultDeposit';
import { useClosedPositionsProfitUsd } from '../../hooks/useClosedPositionsProfitUsd';
import { getDirectEntryExecutionWiringStatus, setPancakeRouterOnVault, reauthorizeBotOnVault, registerBotInAccessControl } from '../../services/otaContractService';
import { CONTRACT_MAP } from '../../../../../contract/contractMap';
import AutoTradeAllowlistTab, { normalizeAllowlistAddress, ALLOWLIST_TOKEN_ADDRESSES } from './AutoTradeAllowlistTab';
import AutoTradeLimitsTab from './AutoTradeLimitsTab';
import AutoTradePolicyTab from './AutoTradePolicyTab';
import AutoTradeStartStop from './AutoTradeStartStop';
import AutoTradeDirectEntry from './AutoTradeDirectEntry';
import OtaAutotradeLlmPauseCard from './OtaAutotradeLlmPauseCard';
import OtaFuturesAgentTraceStrip from './OtaFuturesAgentTraceStrip';
import { deriveAutoTradeRuntimeSummary, formatAdaptiveGuard } from './autoTradeRuntimeSummary';
import RpcRepairModal from '../trade/RpcRepairModal';
import GridTradingPanel from '../../../common/GridTradingPanel';
import '../../styles/components/auto-trade-panel.css';
import '../../styles/components/grid-trading-panel.css';

const ADDRESS_ZERO_STATIC = '0x0000000000000000000000000000000000000000';
// Executor reads getTokenLimits(user, WBNB) for BNB, so use the same address for fetch and save (Limits tab).
const WBNB_BSC = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
const DE_DEBUG = false; // set true to re-enable [DE] console logs
// Tokens for Limits: quote tokens plus the production OTA tracked-token baseline.
// Include USDT + BNB (WBNB) + ETH: executor _getBestQuoteToken reads getTokenLimits on these addresses; without ETH in the list, ETH quote always stays maxPerTrade=0.
const OTA_LIMITS_TOKENS = [
  { symbol: 'BTC', address: TOKEN_REGISTRY.BTC?.address },
  { symbol: 'ETH', address: TOKEN_REGISTRY.ETH?.address },
  { symbol: 'BNB', address: WBNB_BSC },
  { symbol: 'LINK', address: TOKEN_REGISTRY.LINK?.address },
  { symbol: 'XRP', address: TOKEN_REGISTRY.XRP?.address },
  { symbol: 'ADA', address: TOKEN_REGISTRY.ADA?.address },
  { symbol: 'AVAX', address: TOKEN_REGISTRY.AVAX?.address },
  { symbol: 'SOL', address: TOKEN_REGISTRY.SOL?.address },
  { symbol: 'DOGE', address: TOKEN_REGISTRY.DOGE?.address },
  { symbol: 'USDT', address: TOKEN_REGISTRY.USDT?.address }
].filter((p) => p.address);

const ALLOWLIST_TOKEN_OPTIONS = [
  { symbol: 'BNB', address: ADDRESS_ZERO_STATIC },
  { symbol: 'USDT', address: TOKEN_REGISTRY.USDT?.address },
  { symbol: 'BUSD', address: TOKEN_REGISTRY.BUSD?.address }
].filter(p => p.address);

function addressToSymbol(addr) {
  if (!addr) return null;
  const a = String(addr).toLowerCase();
  if (a === ADDRESS_ZERO_STATIC.toLowerCase() || a === WBNB_BSC.toLowerCase()) return 'BNB';
  const found = ALLOWLIST_TOKEN_OPTIONS.find(p => p.address?.toLowerCase() === a);
  return found?.symbol || null;
}

function toInt(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

const OTA_AUTO_DEFAULT_MAX_SLIPPAGE_BPS = 300; // 3% default for spot/direct AutoTrade.
const OTA_AUTO_FORCE_MAX_SLIPPAGE_BPS = 500; // Force-open should not silently allow 10% slippage.
const OTA_AUTO_DEFAULT_PROFIT_TIER = 100;
const OTA_AUTO_DEFAULT_LOSS_LIMIT = 0; // 0 = no percent-loss auto-close by default.
const OTA_AUTO_DEFAULT_MAX_TRADES_PER_12H = '6';
const OTA_AUTO_MIN_REQUIRED_DAILY_CAP_USD = 1;

function clampAutoSlippageBps(value, fallback = OTA_AUTO_DEFAULT_MAX_SLIPPAGE_BPS) {
  return Math.max(1, Math.min(3000, toInt(value, fallback)));
}

function parsePositiveNumber(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function getRequiredUsdRiskLimits(usdTradeLimits) {
  const maxUsd = parsePositiveNumber(usdTradeLimits?.maxUsd);
  const dailyCapUsd = parsePositiveNumber(usdTradeLimits?.dailyCapUsd);
  const maxTradesPer12h = parseInt(String(usdTradeLimits?.maxTradesPer12h || OTA_AUTO_DEFAULT_MAX_TRADES_PER_12H), 10);
  const errors = [];
  if (maxUsd == null) errors.push('Set Max Trade USD above 0. Empty or 0 means no per-trade cap.');
  if (dailyCapUsd == null || dailyCapUsd < OTA_AUTO_MIN_REQUIRED_DAILY_CAP_USD) {
    errors.push('Set Daily USD Cap above 0. Empty or 0 means no daily cap.');
  }
  if (maxUsd != null && dailyCapUsd != null && maxUsd > dailyCapUsd) {
    errors.push('Max Trade USD cannot be greater than Daily USD Cap.');
  }
  if (!Number.isInteger(maxTradesPer12h) || maxTradesPer12h < 1 || maxTradesPer12h > 12) {
    errors.push('Max trades per 12h must be between 1 and 12 for Auto safety.');
  }
  return { ok: errors.length === 0, errors, maxUsd, dailyCapUsd, maxTradesPer12h };
}

function quoteAmountToUsd(amount, quoteToken, prices = {}) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return null;
  const quote = String(quoteToken || '').toUpperCase();
  if (quote === 'USDT' || quote === 'USDC') return n;
  if (quote === 'BNB') return prices?.bnb ? n * Number(prices.bnb) : null;
  if (quote === 'ETH') return prices?.eth ? n * Number(prices.eth) : null;
  return null;
}

function usdToQuoteAmount(usdAmount, quoteToken, prices = {}) {
  const usd = Number(usdAmount);
  if (!Number.isFinite(usd) || usd <= 0) return null;
  const quote = String(quoteToken || '').toUpperCase();
  if (quote === 'USDT' || quote === 'USDC') return usd;
  if (quote === 'BNB') return prices?.bnb ? usd / Number(prices.bnb) : null;
  if (quote === 'ETH') return prices?.eth ? usd / Number(prices.eth) : null;
  return null;
}

function normalizeAutoLossLimit(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : OTA_AUTO_DEFAULT_LOSS_LIMIT;
}

function normalizePolicyFromChainForUi(policyData) {
  const enabled = Boolean(policyData?.enabled);
  const expiresAt = toInt(policyData?.expiresAt, 0);
  const maxSlippageRaw = toInt(policyData?.maxSlippageBps, 0);
  const minDelayRaw = toInt(policyData?.minDelaySeconds, 0);
  const enforceTokenAllowlist = Boolean(policyData?.enforceTokenAllowlist);
  const enforcePairAllowlist = Boolean(policyData?.enforcePairAllowlist);

  // Chain default struct (all zeros/false) should be shown as UX defaults, not "0".
  const looksUninitialized =
    !enabled &&
    !enforceTokenAllowlist &&
    !enforcePairAllowlist &&
    expiresAt === 0 &&
    maxSlippageRaw === 0 &&
    minDelayRaw === 0;

  return {
    enabled,
    expiresAt: expiresAt > 0 ? new Date(expiresAt * 1000) : null,
    maxSlippageBps: looksUninitialized ? OTA_AUTO_DEFAULT_MAX_SLIPPAGE_BPS : clampAutoSlippageBps(maxSlippageRaw),
    minDelaySeconds: looksUninitialized ? 60 : Math.max(0, Math.min(300, minDelayRaw)),
    enforceTokenAllowlist,
    enforcePairAllowlist
  };
}

function buildPolicyPayloadForChain(policyState) {
  return {
    enabled: Boolean(policyState?.enabled),
    expiresAt: policyState?.expiresAt ? Math.floor(new Date(policyState.expiresAt).getTime() / 1000) : 0,
    maxSlippageBps: clampAutoSlippageBps(policyState?.maxSlippageBps),
    minDelaySeconds: Math.max(0, Math.min(300, toInt(policyState?.minDelaySeconds, 60))),
    enforceTokenAllowlist: Boolean(policyState?.enforceTokenAllowlist),
    enforcePairAllowlist: Boolean(policyState?.enforcePairAllowlist)
  };
}

function buildPolicyPayloadFromChain(policyData) {
  return {
    enabled: Boolean(policyData?.enabled),
    expiresAt: toInt(policyData?.expiresAt, 0),
    maxSlippageBps: clampAutoSlippageBps(policyData?.maxSlippageBps),
    minDelaySeconds: Math.max(0, Math.min(300, toInt(policyData?.minDelaySeconds, 60))),
    enforceTokenAllowlist: Boolean(policyData?.enforceTokenAllowlist),
    enforcePairAllowlist: Boolean(policyData?.enforcePairAllowlist)
  };
}

function arePoliciesEqual(a, b) {
  if (!a || !b) return false;
  return (
    Boolean(a.enabled) === Boolean(b.enabled) &&
    toInt(a.expiresAt, 0) === toInt(b.expiresAt, 0) &&
    toInt(a.maxSlippageBps, 0) === toInt(b.maxSlippageBps, 0) &&
    toInt(a.minDelaySeconds, 0) === toInt(b.minDelaySeconds, 0) &&
    Boolean(a.enforceTokenAllowlist) === Boolean(b.enforceTokenAllowlist) &&
    Boolean(a.enforcePairAllowlist) === Boolean(b.enforcePairAllowlist)
  );
}

function buildSummaryFromPayload(payload, txHash = null) {
  if (!payload) return null;
  const bps = clampAutoSlippageBps(payload.maxSlippageBps);
  const exp = toInt(payload.expiresAt, 0);
  return {
    txHash: txHash || null,
    enabled: Boolean(payload.enabled),
    expiresAt: exp ? new Date(exp * 1000).toLocaleDateString() : 'Never',
    maxSlippageBps: bps,
    slippagePercent: (bps / 100).toFixed(1),
    minDelaySeconds: toInt(payload.minDelaySeconds, 60),
    savedAt: new Date().toLocaleTimeString()
  };
}

const AutoTradePanel = React.memo(() => {
  // SSOT for connected wallet: useOTAAccess uses WalletContext (real connected wallet),
  // DexAuth.walletAddress can be only "associated" and can be null/stale.
  const { walletAddress, isAuthenticated, isRegistered, botAuthorizations, executorBotAddress, hasFullAccess } = useOTAAccess();
  const { currentMode } = useOTAMode();
  /** Same criterion as `OtaAutoDashboardProvider` in OTAPage: poll only in Auto mode with full access. */
  const autoDashboardShouldPoll = Boolean(hasFullAccess && currentMode === 'auto');
  const { isNotDeployed, detailedMessage, missingKeys } = useContractDeploymentStatus({ scope: 'auto' });
  const navigate = useNavigate();
  const [advisoryToken] = useHeaderToken();
  const { balances: vaultBalances, refetch: refetchVault } = useVaultDeposit();
  const { totalProfitUsd: closedPositionsProfitUsd, fromExecutions: closedFromExecutions, fromDirectEntry: closedFromDirectEntry, executionsDetail, directEntryDetail } = useClosedPositionsProfitUsd(walletAddress);

  // Storage key for enabled: persistence across remount/refresh.
  const otaAutoEnabledKey = useMemo(() => (walletAddress ? `ota_auto_enabled_${walletAddress.toLowerCase()}` : null), [walletAddress]);

  // Policy state – loaded from contract; Start/Stop only when YOU click
  const [policyLoading, setPolicyLoading] = useState(true);
  const [policy, setPolicy] = useState({
    enabled: false,
    expiresAt: null, // 0 = never expires
    maxSlippageBps: OTA_AUTO_DEFAULT_MAX_SLIPPAGE_BPS, // 3% default (300 basis points)
    minDelaySeconds: 60, // 1 minute default
    enforceTokenAllowlist: false,
    enforcePairAllowlist: false,
    riskLevel: 'moderate', // conservative | moderate | aggressive | high: OpenAI and executor use the confidence threshold.
    profitTier: OTA_AUTO_DEFAULT_PROFIT_TIER, // minProfitOverGasPercent: 5 | 50 | 100 | 1000: when it executes (profit > threshold).
    lossLimit: OTA_AUTO_DEFAULT_LOSS_LIMIT // maxLossPercent: 0 | 3 | 5 | 10: 0 disables percent-loss auto-close.
  });
  
  // Token limits state
  const [tokenLimits, setTokenLimits] = useState({
    token: '',
    maxPerTrade: '',
    dailyMax: ''
  });
  const [usdTradeLimits, setUsdTradeLimits] = useState({
    minUsd: '',
    maxUsd: '',
    dailyCapUsd: '',
    maxTradesPer12h: OTA_AUTO_DEFAULT_MAX_TRADES_PER_12H
  });
  const [forceOpenMaxLossPct, setForceOpenMaxLossPct] = useState(''); // '' = use Policy Loss limit; 3|5|10 = per-position %
  const [forceOpenOnNextRun, setForceOpenOnNextRun] = useState(false); // On Start Auto: force 1 BUY on the next analysis, one-time test.
  const forceOpenOnNextRunRef = useRef(false); // Read on click so it does not depend on async state.
  useEffect(() => { forceOpenOnNextRunRef.current = forceOpenOnNextRun; }, [forceOpenOnNextRun]);
  
  // Allowlist state
  const [tokenAllowlist, setTokenAllowlist] = useState([]);
  const [pairAllowlist, setPairAllowlist] = useState([]);
  const persistAllowlistRef = useRef(null);
  const [allowlistTokenInput, setAllowlistTokenInput] = useState('');
  const [allowlistPairIn, setAllowlistPairIn] = useState('');
  const [allowlistPairOut, setAllowlistPairOut] = useState('');
  const [allowlistStatusMessage, setAllowlistStatusMessage] = useState(null); // Visible message when the pair/token already exists in the list or on-chain.
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingTokenLimits, setSavingTokenLimits] = useState(false);
  const [activeTab, setActiveTab] = useState('policy'); // policy, limits, allowlist
  const [policyOnChainSnapshot, setPolicyOnChainSnapshot] = useState(null);
  const [policyLastCheckedAt, setPolicyLastCheckedAt] = useState(null);
  const [verifyingPolicy, setVerifyingPolicy] = useState(false);
  const [policyVerificationMessage, setPolicyVerificationMessage] = useState(null);
  const [savedPolicySummary, setSavedPolicySummary] = useState(null);
  const [learnSectionOpen, setLearnSectionOpen] = useState(false); // collapsed by default for simpler flow
  const [profitDetailsExpanded, setProfitDetailsExpanded] = useState(false);
  const [aiModelStatus, setAiModelStatus] = useState(null);
  // Limits registered in backend, displayed as confirmation in the Limits tab.
  const [savedTokenLimitsFromBackend, setSavedTokenLimitsFromBackend] = useState([]);
  const [savedUsdLimitsFromBackend, setSavedUsdLimitsFromBackend] = useState(null);
  const [limitsFromBackendLoading, setLimitsFromBackendLoading] = useState(false);
  /** Token list for Limits: only from backend (getTrackedTokensFromBackend). No hardcoding. */
  const [tokenLimitPresetsFromBackend, setTokenLimitPresetsFromBackend] = useState([]);

  // Fetch AI model status once on mount (non-blocking – endpoint may not be deployed yet)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getModelInferenceStatus();
        if (!cancelled && data?.status) {
          const s = data.status;
          const isFT = !!s.openAIModel && s.openAIModel.startsWith('ft:');
          setAiModelStatus({
            model: s.openAIModel || 'gpt-4o-mini',
            isFineTuned: isFT,
            regimeSource: s.models?.regimeClassifier?.source || 'heuristic',
            outcomesCount: s.outcomesCount || 0,
          });
        }
      } catch (_) { /* non-blocking – endpoint may not be deployed */ }
    })();
    return () => { cancelled = true; };
  }, []);

  // Activity feed state
  const [nextScanCountdown, setNextScanCountdown] = useState(30); // fallback 30s; real value from autoExecutionStatus.monitoringIntervalMs
  // Activity feed: only initial status line + entries from analyzeMarket(API). No fake data.
  const [activityFeed, setActivityFeed] = useState([
    { id: 1, type: 'info', message: 'Auto Mode ready - activate to start', timestamp: new Date() }
  ]);

  // Sync the initial message with policy.enabled: when Auto is active, show "active", not "ready - activate".
  useEffect(() => {
    setActivityFeed(prev => {
      const rest = prev.filter(a => a.id !== 1);
      const msg = policy.enabled ? 'Auto Mode active - monitoring market' : 'Auto Mode ready - activate to start';
      return [{ id: 1, type: 'info', message: msg, timestamp: new Date() }, ...rest];
    });
  }, [policy.enabled]);
  // Stats: only from getSignals(API). Never prescribed; stay 0/null until API returns.
  const [stats, setStats] = useState({
    signalsToday: 0,
    lastSignal: null,
    totalSignals: 0
  });
  const [autoExecutionStatus, setAutoExecutionStatus] = useState(null); // { enabled, lastRunAt?, executionsCount24h?, lastAnalysisSource? } or null if endpoint unavailable
  const otaDashboard = useOtaAutoDashboard();
  const autoRuntimeSummary = useMemo(
    () => deriveAutoTradeRuntimeSummary({
      autoExecutionStatus,
      autoStatusError: otaDashboard?.autoStatusError,
      policyEnabled: policy.enabled,
      walletAddress,
    }),
    [autoExecutionStatus, otaDashboard?.autoStatusError, policy.enabled, walletAddress],
  );
  const [lastSignalSource, setLastSignalSource] = useState(null); // analysisSource from API (openai_decides | engine_with_explanation), displayed in the Running strip.
  const [lastAnalysisPayload, setLastAnalysisPayload] = useState(null); // Latest signal response from /analyze, used for BTC Context, etc.
  const [loadingSignalSource, setLoadingSignalSource] = useState(false);
  const [liveGuardStatus, setLiveGuardStatus] = useState({
    loading: false,
    level66: null,
    level73: null,
    level74: null,
    level69: null,
    lastCheckedAt: null
  });
  const [governanceRunLoading, setGovernanceRunLoading] = useState(false);
  const [governanceRunResult, setGovernanceRunResult] = useState(null);
  const [governanceRunError, setGovernanceRunError] = useState(null);
  // P1.5 PnL observability: backend metrics (getMetrics/getRiskMetrics). null = not loaded, 'unavailable' = endpoint missing/error, object = data.
  const [pnlMetrics, setPnlMetrics] = useState(null);
  // OTA Executions: what OTA AI actually did – from GET /ai-trading/execution/trades (source: ota_auto)
  const [otaExecutions, setOtaExecutions] = useState([]);
  const [loadingOtaExecutions, setLoadingOtaExecutions] = useState(false);
  const [otaExecutionsError, setOtaExecutionsError] = useState(null);
  const [retryOtaExecutions, setRetryOtaExecutions] = useState(0);
  /** PnL sum from closed Direct Entry positions (GET direct-entry/positions/closed), used for OTA AI Profit when metrics/executions have no PnL. */
  const [closedPositionsPnlTotal, setClosedPositionsPnlTotal] = useState(0);
  const [newExecIds, setNewExecIds] = useState(new Set()); // track newly appeared executions for flash animation
  const prevExecIdsRef = React.useRef(new Set());
  /** Persistent popup: when OTA Auto executes an OPEN (buy), show all LIVE details here. Stays open until user closes it. */
  const [otaOpenDetailModal, setOtaOpenDetailModal] = useState(null);
  /** Current price for the token in the OPEN popup, used for estimated LIVE PnL. */
  const [otaOpenDetailLivePrice, setOtaOpenDetailLivePrice] = useState(null);
  const [agentSessions, setAgentSessions] = useState([]);
  const [agentSessionsOpen, setAgentSessionsOpen] = useState(false);
  const [agentHowToOpen, setAgentHowToOpen] = useState(false);
  const [expandedSessionId, setExpandedSessionId] = useState(null); // 7.2: which session shows thought→action→result
  const [directEntryLoading, setDirectEntryLoading] = useState(false);
  const [showRpcRepairModal, setShowRpcRepairModal] = useState(false);
  const [hasOpenPosition, setHasOpenPosition] = useState(false);
  const [openPositionData, setOpenPositionData] = useState(null); // full position object { id/positionId, status, ... }
  const prevOpenPositionIdsRef = useRef(new Set()); // Detect new position opened by OTA LLM and show popup.
  const hasPositionPolledOnceRef = useRef(false); // Do not show popup on first load when user already has positions.
  const [otaNewPositionPopup, setOtaNewPositionPopup] = useState(null); // Persistent popup with newly opened position details, not a toast.
  const [closePositionLoading, setClosePositionLoading] = useState(false);
  const [directEntryConfirmOpen, setDirectEntryConfirmOpen] = useState(false);
  const [directEntryQuoteToken, setDirectEntryQuoteToken] = useState('USDT'); // BNB | USDT | ETH: payment token; cannot be the same as the header token.
  const [directEntryQuoteOpen, setDirectEntryQuoteOpen] = useState(false);
  const [directEntryPriceState, setDirectEntryPriceState] = useState({ price: null, quote: null, loading: false });
  const usdLimitsStorageKey = useMemo(
    () => (walletAddress ? `ota_usd_limits_${walletAddress.toLowerCase()}` : null),
    [walletAddress]
  );
  const directEntryTokenPrice = directEntryPriceState.quote === directEntryQuoteToken ? directEntryPriceState.price : null;
  const directEntryPriceLoading = directEntryPriceState.quote === directEntryQuoteToken && directEntryPriceState.loading;
  /** Show loader when a price is needed but no real one exists yet (loading or null from API). No hardcoding. */
  const directEntryPricePending = (advisoryToken || 'BNB') !== directEntryQuoteToken &&
    directEntryPriceState.quote === directEntryQuoteToken &&
    (directEntryPriceState.loading || directEntryTokenPrice == null || !Number.isFinite(directEntryTokenPrice));
  const directEntryQuoteRef = useRef(null);
  /** Latest LIVE prices per token (OTA), used for persistent toast until the next analysis. */
  const lastLivePricesByTokenRef = useRef({});
  const [directEntryAmount, setDirectEntryAmount] = useState('');
  const [directEntrySlippagePercent, setDirectEntrySlippagePercent] = useState(3);
  /** Direct Entry error modal: consistent popup instead of only toast. */
  const [directEntryErrorModal, setDirectEntryErrorModal] = useState(null); // { title, message, openAllowlist: boolean }
  /** Unified popup for OTA access / position-open requirements. */
  const [accessRequirementsModal, setAccessRequirementsModal] = useState(null); // { title, checks, hint, ctaLabel, ctaAction }
  const notifyInline = useCallback((type, message, options = null) => {
    const text = typeof message === 'string' ? message : String(message || '');
    const opts = {};
    const autoCloseMs = Number(options?.autoClose ?? options?.duration ?? 0);
    if (Number.isFinite(autoCloseMs) && autoCloseMs > 0) opts.autoClose = autoCloseMs;
    if (type === 'success') toast.success(text, opts);
    else if (type === 'error') toast.error(text, opts);
    else if (type === 'warning') toast.warning(text, opts);
    else toast.info(text, opts);
  }, []);

  /** Quote options: exclude token being bought (BNB/BNB = swap BNB for BNB = invalid) */
  const directEntryQuoteOptions = useMemo(() => {
    const base = advisoryToken || 'BNB';
    const opts = ['BNB', 'USDT', 'ETH'].filter((q) => q !== base);
    if (DE_DEBUG && isDev) console.log('[DE] directEntryQuoteOptions', { base, opts });
    return opts;
  }, [advisoryToken]);

  /** Auto-switch quote when it equals base (invalid pair) */
  useEffect(() => {
    const base = advisoryToken || 'BNB';
    if (directEntryQuoteToken === base && directEntryQuoteOptions.length > 0) {
      if (DE_DEBUG && isDev) console.log('[DE] quote sync: base===quote, switching to', directEntryQuoteOptions[0]);
      setDirectEntryQuoteToken(directEntryQuoteOptions[0]);
    }
  }, [advisoryToken, directEntryQuoteToken, directEntryQuoteOptions]);

  // Refresh interval for Direct Entry price (backend /market ~60/min; 10s = 6/min to avoid CoinGecko 429)
  const DIRECT_ENTRY_PRICE_REFRESH_MS = 10000;

  // Token price for Direct Entry: only from API, no hardcoding. On missing data: loader.
  useEffect(() => {
    const token = advisoryToken || 'BNB';
    const quote = directEntryQuoteToken || 'USDT';
    if (DE_DEBUG && isDev) console.log('[DE] price useEffect RUN', { token, quote });
    if (token === quote) { if (DE_DEBUG && isDev) console.log('[DE] price useEffect SKIP: token===quote'); return; }
    if (token === 'USDT') { if (DE_DEBUG && isDev) console.log('[DE] price useEffect SKIP: token is USDT'); return; }
    setDirectEntryPriceState((prev) => (prev.quote !== quote ? { price: null, quote, loading: true } : prev));
    if (!token) {
      setDirectEntryPriceState({ price: null, quote, loading: false });
      return;
    }
    let cancelled = false;
    const fetchPrice = () => {
      if (cancelled) return;
      setDirectEntryPriceState((prev) => {
        if (prev.quote !== quote) return prev;
        return prev.price == null ? { ...prev, loading: true } : prev;
      });
      getOTAMarketData(token, quote, directEntrySlippagePercent)
        .then((res) => {
          if (cancelled) return;
          const raw = res?.marketData?.price ?? res?.price ?? null;
          const price = raw != null && Number.isFinite(Number(raw)) ? Number(raw) : null;
          if (DE_DEBUG && isDev) console.log('[DE] price fetch OK', { token, quote, price });
          setDirectEntryPriceState((prev) => (prev.quote === quote ? { price, quote, loading: false } : prev));
        })
        .catch((e) => {
          if (isDev && !/timed out|timeout/i.test(String(e?.message ?? ''))) {
            if (DE_DEBUG) console.log('[DE] price fetch FAIL', { token, quote, message: e?.message });
          }
          if (!cancelled) setDirectEntryPriceState((prev) => (prev.quote === quote ? { price: null, quote, loading: false } : prev));
        });
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, DIRECT_ENTRY_PRICE_REFRESH_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [advisoryToken, directEntryQuoteToken, directEntrySlippagePercent]);

  // Check if executor bot (GET /bot-address) is authorized – avoids "Bot not authorized" when user authorized a different bot
  const botAuthorized = useMemo(() => {
    const ok = isBotAuthorizedUtil(botAuthorizations, executorBotAddress);
    if (DE_DEBUG && isDev) console.log('[DE] botAuthorized', { ok, executorBotAddress: executorBotAddress?.slice(0, 12), botAuthCount: botAuthorizations?.length });
    return ok;
  }, [botAuthorizations, executorBotAddress]);

  const policyPayloadForSave = useMemo(() => buildPolicyPayloadForChain(policy), [policy]);
  const policyAcceptedOnChain = useMemo(
    () => arePoliciesEqual(policyPayloadForSave, policyOnChainSnapshot),
    [policyPayloadForSave, policyOnChainSnapshot]
  );

  const level66Blocked = liveGuardStatus.level66?.decision?.allowAutoStart === false;
  const level73Blocked = liveGuardStatus.level73?.decision?.allowAutoStart === false;
  const level74Blocked = liveGuardStatus.level74?.decision?.allowAutoStart === false;
  /**
   * SSOT with the lower "Worker" row: GET /auto-execution/status can set `executorFunctional: true` without strict boolean `enabled`;
   * previously only `enabled && isRunning` marked LIVE, which put NO-GO with "server worker paused" even when `executorFunctional` was true.
   */
  const workerActive = useMemo(() => {
    const s = autoExecutionStatus;
    if (s == null) return false;
    if (s.isRunning === false) return false;
    if (s.enabled === true) return true;
    if (s.executorFunctional === true) return true;
    return false;
  }, [autoExecutionStatus]);
  /** Distinct messages: null status = loading or API miss, not necessarily "paused" on Render. */
  const workerBackendBlockReason = useMemo(() => {
    if (workerActive) return null;
    if (autoExecutionStatus == null) {
      if (!otaDashboard?.lastFetchAt) {
        if (!autoDashboardShouldPoll) {
          return 'worker status: not polled (open OTA with full access and Auto mode)';
        }
        return 'worker status: loading…';
      }
      if (otaDashboard?.fetchError) return 'worker status: fetch error';
      const ase = otaDashboard?.autoStatusError;
      if (ase && typeof ase === 'object') {
        const st = ase.status;
        const code = ase.code;
        if (st === 401 || st === 403 || code === 'OTA_WALLET_AUTH_REQUIRED' || code === 'OTA_WALLET_TOKEN_INVALID') {
          return 'worker status: OTA wallet session required (sign OTA in DEX to see worker state)';
        }
        const m = typeof ase.message === 'string' && ase.message.length > 0 && ase.message.length < 130 ? ase.message : null;
        if (m) return `worker status: ${m}`;
      }
      return 'worker status: unavailable (API)';
    }
    if (autoExecutionStatus.enabled === true && autoExecutionStatus.isRunning === false) {
      return 'monitoring loop not running';
    }
    if (autoExecutionStatus.enabled === false && autoExecutionStatus.executorFunctional !== true) {
      return 'backend worker disabled (check OTA_POLICY_MANAGER_ADDRESS / OTA_AUTO_EXECUTOR_ADDRESS & boot)';
    }
    if (autoExecutionStatus.executorFunctional === false) {
      return 'backend executor not functional (see executorReason in API)';
    }
    return 'server worker paused';
  }, [workerActive, autoExecutionStatus, otaDashboard?.lastFetchAt, otaDashboard?.fetchError, otaDashboard?.autoStatusError, autoDashboardShouldPoll]);
  const liveGo = Boolean(isRegistered && botAuthorized && policy.enabled && workerActive && !level66Blocked && !level73Blocked && !level74Blocked);
  const liveNoGoReasons = [
    !isRegistered ? 'registration' : null,
    !botAuthorized ? 'bot authorization' : null,
    !policy.enabled ? 'policy disabled' : null,
    workerBackendBlockReason,
    level66Blocked ? 'Level66 guard active' : null,
    level73Blocked ? 'Level73 execution quality guard active' : null,
    level74Blocked ? 'Level74 guard active' : null,
  ].filter(Boolean);

  const openAccessRequirementsModal = useCallback(({ title, checks, hint = null, ctaLabel = null, ctaAction = null }) => {
    setAccessRequirementsModal({
      title: title || 'Requirements not met',
      checks: Array.isArray(checks) ? checks : [],
      hint,
      ctaLabel,
      ctaAction
    });
  }, []);

  const handleAccessRequirementsCta = useCallback(() => {
    const action = accessRequirementsModal?.ctaAction;
    if (!action) return;
    if (action === 'open-authorize-bot') {
      document.getElementById('ota-authorize-bot')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (action === 'open-policy-tab') {
      setActiveTab('policy');
      requestAnimationFrame(() => {
        setTimeout(() => {
          document.getElementById('ota-auto-trade-panel-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      });
    }
    setAccessRequirementsModal(null);
  }, [accessRequirementsModal]);

  /** Authorization for the executor bot (the one running Direct Entry), not the first active one. */
  const executorAuth = useMemo(() => {
    if (!Array.isArray(botAuthorizations) || !executorBotAddress) return null;
    const expected = String(executorBotAddress).toLowerCase();
    return botAuthorizations.find(
      (a) => String(a?.botAddress || '').toLowerCase() === expected
    ) || null;
  }, [botAuthorizations, executorBotAddress]);

  const executorBotAuthForUi = useMemo(() => getExecutorBotAuth(botAuthorizations, executorBotAddress), [botAuthorizations, executorBotAddress]);

  // Authorized max amount for display: from executorAuth (BNB string or 'unlimited').
  const authorizedMaxDisplay = useMemo(() => {
    if (!executorAuth?.maxAmount || executorAuth.maxAmount === '0') return 'unlimited';
    try {
      const bnb = ethers.utils.formatEther(executorAuth.maxAmount);
      return parseFloat(bnb).toFixed(6).replace(/\.?0+$/, '') + ' BNB';
    } catch {
      return 'unlimited';
    }
  }, [executorAuth]);

  // Prices for authorization conversion in the selected Direct Entry currency.
  const [authDisplayPrices, setAuthDisplayPrices] = useState({ bnb: null, eth: null });
  useEffect(() => {
    let cancelled = false;
    tokenPriceService.getAllTokenPrices(['BNB', 'ETH']).then((prices) => {
      if (!cancelled) {
        const bnb = prices?.BNB ?? prices?.bnb ?? 0;
        const eth = prices?.ETH ?? prices?.eth ?? 0;
        setAuthDisplayPrices({ bnb: bnb > 0 ? bnb : null, eth: eth > 0 ? eth : null });
      }
    }).catch(() => { if (!cancelled) setAuthDisplayPrices({ bnb: null, eth: null }); });
    return () => { cancelled = true; };
  }, []);

  /** Authorized amount in the selected quote currency (USDT/BNB/ETH) for Direct Entry. Uses executorAuth. */
  const getAuthorizedForQuote = useMemo(() => {
    if (!executorAuth?.maxAmount || executorAuth.maxAmount === '0') return () => 'unlimited';
    const auth = executorAuth;
    try {
      const bnbNum = parseFloat(ethers.utils.formatEther(auth.maxAmount));
      if (!Number.isFinite(bnbNum) || bnbNum <= 0) return () => 'unlimited';
      const bnbStr = parseFloat(bnbNum.toFixed(6)).toString().replace(/\.?0+$/, '') || String(bnbNum);
      return (quoteToken) => {
        if (quoteToken === 'USDT') {
          const usd = authDisplayPrices.bnb ? bnbNum * authDisplayPrices.bnb : null;
          return usd != null ? `≈ ${formatNumber(usd, usd >= 1 ? 2 : 4)} USDT` : `${bnbStr} BNB`;
        }
        if (quoteToken === 'BNB') return `${bnbStr} BNB`;
        if (quoteToken === 'ETH') {
          const { eth, bnb } = authDisplayPrices;
          if (eth && bnb && eth > 0 && bnb > 0) {
            const ethNum = (bnbNum * bnb) / eth;
            return `≈ ${formatNumber(ethNum, ethNum >= 1 ? 4 : 6)} ETH`;
          }
          return `${bnbStr} BNB`;
        }
        return `${bnbStr} BNB`;
      };
    } catch {
      return () => 'unlimited';
    }
  }, [executorAuth, authDisplayPrices]);

  /** Vault balance (UserVault) for selected quote – BNB, USDT; ETH not in vault on BSC. */
  const getRawVaultBalance = useCallback((addr) => {
    if (!addr || !vaultBalances) return '0';
    return vaultBalances[addr] || vaultBalances[String(addr).toLowerCase()] || '0';
  }, [vaultBalances]);

  const getBnbVaultBalanceRaw = useCallback(() => {
    let nativeRaw = getRawVaultBalance(ethers.constants.AddressZero);
    if (!nativeRaw || nativeRaw === '0') nativeRaw = vaultBalances?.BNB || '0';
    const wbnbRaw = getRawVaultBalance(WBNB_BSC);
    return ethers.BigNumber.from(nativeRaw || '0')
      .add(ethers.BigNumber.from(wbnbRaw || '0'));
  }, [getRawVaultBalance, vaultBalances]);

  const getVaultBalanceForQuote = useCallback((quoteToken) => {
    if (!quoteToken || !vaultBalances) return null;
    let addr;
    let decimals = 18;
    let raw;
    if (quoteToken === 'BNB') {
      raw = getBnbVaultBalanceRaw().toString();
    } else if (quoteToken === 'USDT') {
      addr = CONTRACT_MAP?.USDT?.address;
      decimals = CONTRACT_MAP?.USDT?.decimals ?? 18;
    } else if (quoteToken === 'ETH') {
      addr = TOKEN_REGISTRY?.ETH?.address || CONTRACT_MAP?.ETH?.address;
      if (!addr) return null;
      decimals = TOKEN_REGISTRY?.ETH?.decimals ?? CONTRACT_MAP?.ETH?.decimals ?? 18;
    } else {
      return null;
    }
    raw = raw ?? getRawVaultBalance(addr);
    const num = parseFloat(ethers.utils.formatUnits(raw, decimals));
    if (!Number.isFinite(num) || num < 0) return null;
    const formatted = num >= 0.000001 ? (num < 0.01 ? '<0.01' : formatNumber(num, num >= 1 ? 4 : 6)) : '0';
    return `${formatted} ${quoteToken}`;
  }, [getBnbVaultBalanceRaw, getRawVaultBalance, vaultBalances]);

  /** Raw vault balance number for percentage buttons. */
  const getVaultBalanceNumber = useCallback((quoteToken) => {
    if (!quoteToken || !vaultBalances) return 0;
    let addr;
    let decimals = 18;
    let raw;
    if (quoteToken === 'BNB') {
      raw = getBnbVaultBalanceRaw().toString();
    } else if (quoteToken === 'USDT') {
      addr = CONTRACT_MAP?.USDT?.address;
      decimals = CONTRACT_MAP?.USDT?.decimals ?? 18;
    } else if (quoteToken === 'ETH') {
      addr = TOKEN_REGISTRY?.ETH?.address || CONTRACT_MAP?.ETH?.address;
      if (!addr) return 0;
      decimals = TOKEN_REGISTRY?.ETH?.decimals ?? CONTRACT_MAP?.ETH?.decimals ?? 18;
    } else return 0;
    raw = raw ?? getRawVaultBalance(addr);
    const num = parseFloat(ethers.utils.formatUnits(raw, decimals));
    return Number.isFinite(num) && num >= 0 ? num : 0;
  }, [getBnbVaultBalanceRaw, getRawVaultBalance, vaultBalances]);

  const setDirectEntryAmountPercent = useCallback((pct) => {
    const balance = getVaultBalanceNumber(directEntryQuoteToken);
    if (DE_DEBUG && isDev) console.log('[DE] setDirectEntryAmountPercent', { pct, balance, quote: directEntryQuoteToken });
    if (balance <= 0) { if (DE_DEBUG && isDev) console.log('[DE] setDirectEntryAmountPercent: balance<=0, skip'); return; }
    const amount = pct === 1 ? balance : balance * (pct / 100);
    const formatted = amount >= 0.000001
      ? (amount >= 1 ? amount.toFixed(4).replace(/\.?0+$/, '') : amount.toFixed(6).replace(/\.?0+$/, '') || amount.toFixed(6))
      : amount.toFixed(6);
    setDirectEntryAmount(formatted);
  }, [directEntryQuoteToken, getVaultBalanceNumber]);

  // DEBUG: log API URL when wallet present (for Direct Entry troubleshooting)
  useEffect(() => {
    if (walletAddress) {
      try {
        const apiBase = getApiBaseUrl();
        if (DE_DEBUG && isDev) console.log('[DE] API_BASE_URL', { apiBase: apiBase?.slice(0, 60), full: apiBase });
      } catch (e) {
        if (DE_DEBUG && isDev) console.warn('[DE] getApiBaseUrl failed', e?.message);
      }
    }
  }, [walletAddress]);

  // Poll Direct Entry position – disable Direct Entry button when position open
  useEffect(() => {
    if (!walletAddress) {
      if (DE_DEBUG && isDev) console.log('[DE] position poll: no wallet, setHasOpenPosition(false)');
      setHasOpenPosition(false);
      return;
    }
    let cancelled = false;
    const check = async () => {
      try {
        const pos = await getDirectEntryPosition(walletAddress);
        if (!cancelled) {
          const list = Array.isArray(pos) ? pos.filter(p => p && p.status === 'open') : [];
          const open = list.length > 0;
          if (DE_DEBUG && isDev) console.log('[DE] position poll result', { count: list.length, hasOpen: open });
          const currentIds = new Set(list.map(p => String(p.id ?? p.positionId ?? '')).filter(Boolean));
          const prevIds = prevOpenPositionIdsRef.current;
          if (hasPositionPolledOnceRef.current && currentIds.size > prevIds.size) {
            const newPosition = list.find(p => {
              const id = String(p.id ?? p.positionId ?? '');
              return id && !prevIds.has(id);
            });
            if (newPosition) setOtaNewPositionPopup(newPosition);
          }
          hasPositionPolledOnceRef.current = true;
          prevOpenPositionIdsRef.current = currentIds;
          setHasOpenPosition(open);
          setOpenPositionData(open ? list : null);
        }
      } catch (e) {
        if (!cancelled) {
          if (DE_DEBUG && isDev) console.log('[DE] position poll FAIL', { message: e?.message });
          setHasOpenPosition(false);
          setOpenPositionData(null);
        }
      }
    };
    if (DE_DEBUG && isDev) console.log('[DE] position poll START', { wallet: walletAddress?.slice(0, 12) });
    check();
    const interval = setInterval(check, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [walletAddress]);

  // Close Direct Entry quote dropdown on click outside
  useEffect(() => {
    if (!directEntryQuoteOpen) return;
    const close = (e) => {
      if (!directEntryQuoteRef.current?.contains(e.target)) setDirectEntryQuoteOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [directEntryQuoteOpen]);

  const handleDirectEntryOpen = useCallback(async () => {
    const token = advisoryToken || 'BNB';
    if (DE_DEBUG && isDev) console.log('[DE] handleDirectEntryOpen START', { token, wallet: walletAddress?.slice(0, 12), isRegistered, botAuthorized, hasOpenPosition });
    if (!walletAddress) {
      if (DE_DEBUG && isDev) console.log('[DE] handleDirectEntryOpen BLOCKED: no wallet');
      openAccessRequirementsModal({
        title: 'Cannot open position (Direct Entry)',
        checks: [
          { ok: false, label: 'Wallet connected', fix: 'Connect your wallet (MetaMask) from the top-right corner.' },
          { ok: !!isRegistered, label: 'OTA registration', fix: 'In OTA Access Control, click Register.' },
          { ok: !!botAuthorized, label: 'Bot authorization', fix: 'In Step 2, click Authorize Bot.' }
        ],
        hint: 'Without a connected wallet, no on-chain action can be signed.'
      });
      return;
    }
    if (!isRegistered || !botAuthorized) {
      if (DE_DEBUG && isDev) console.log('[DE] handleDirectEntryOpen BLOCKED: not registered or bot not authorized');
      openAccessRequirementsModal({
        title: 'Missing requirements for Direct Entry',
        checks: [
          { ok: true, label: 'Wallet connected' },
          { ok: !!isRegistered, label: 'OTA registration', fix: 'In OTA Access Control, click Register (Step 1).' },
          { ok: !!botAuthorized, label: 'Bot authorization', fix: 'Click Authorize Bot (Step 2) for the current executor.' }
        ],
        ctaLabel: !botAuthorized ? 'Open Step 2 - Authorize Bot' : null,
        ctaAction: !botAuthorized ? 'open-authorize-bot' : null
      });
      return;
    }
    if (openPositionData && openPositionData.length >= 3) {
      if (DE_DEBUG && isDev) console.log('[DE] handleDirectEntryOpen BLOCKED: max 3 positions', { count: openPositionData.length });
      openAccessRequirementsModal({
        title: 'Maximum 3 open positions',
        checks: [
          { ok: true, label: 'Wallet connected' },
          { ok: true, label: 'OTA registration' },
          { ok: true, label: 'Bot authorization' },
          { ok: false, label: 'Open positions (3 max)', fix: 'Close one position in Open Orders, then try again.' }
        ]
      });
      return;
    }
    if (DE_DEBUG && isDev) console.log('[DE] handleDirectEntryOpen OK: opening confirm modal');
    setDirectEntryConfirmOpen(true);
  }, [walletAddress, advisoryToken, isRegistered, botAuthorized, hasOpenPosition, openPositionData, openAccessRequirementsModal]);

  const handleDirectEntryConfirm = useCallback(async () => {
    const token = advisoryToken || 'BNB';
    const quote = directEntryQuoteToken || 'USDT';
    const amountNum = parseFloat(String(directEntryAmount || '').trim());
    const minAmount = quote === 'BNB' ? 0.01 : 0.001;
    if (DE_DEBUG && isDev) console.log('[DE] handleDirectEntryConfirm START', { token, quote, amountNum, minAmount, slippage: directEntrySlippagePercent });
    if (!Number.isFinite(amountNum) || amountNum < minAmount || amountNum > 10000) {
      if (DE_DEBUG && isDev) console.log('[DE] handleDirectEntryConfirm VALIDATION FAIL: amount out of range', { amountNum, minAmount });
      setDirectEntryConfirmOpen(false);
      toast.error(quote === 'BNB'
        ? 'Enter amount between 0.01 and 10000 BNB (router minimum)'
        : `Enter amount between 0.001 and 10000 (in ${quote})`);
      return;
    }
    const riskLimits = getRequiredUsdRiskLimits(usdTradeLimits);
    const amountUsd = quoteAmountToUsd(amountNum, quote, authDisplayPrices);
    if (!riskLimits.ok) {
      setDirectEntryConfirmOpen(false);
      openAccessRequirementsModal({
        title: 'Direct Entry blocked by safety limits',
        checks: [
          { ok: true, label: 'Wallet connected' },
          { ok: false, label: 'USD risk limits required', fix: riskLimits.errors.join(' ') }
        ],
        hint: 'Open the Limits tab, set Max Trade USD and Daily USD Cap, then save them before opening a real position.'
      });
      return;
    }
    if (amountUsd == null) {
      setDirectEntryConfirmOpen(false);
      openAccessRequirementsModal({
        title: 'Direct Entry blocked',
        checks: [
          { ok: false, label: `${quote} USD price unavailable`, fix: `Wait for the ${quote} price to load, or use USDT as quote.` }
        ]
      });
      return;
    }
    if (amountUsd > riskLimits.maxUsd) {
      setDirectEntryConfirmOpen(false);
      openAccessRequirementsModal({
        title: 'Direct Entry above Max Trade USD',
        checks: [
          { ok: false, label: `Trade value ~$${amountUsd.toFixed(2)}`, fix: `Reduce amount to $${riskLimits.maxUsd.toFixed(2)} or less, or intentionally raise Max Trade USD in Limits.` }
        ]
      });
      return;
    }
    if (DE_DEBUG && isDev) console.log('[DE] handleDirectEntryConfirm: setting loading');
    setDirectEntryLoading(true);
    const slippageBps = Math.round((directEntrySlippagePercent || 3) * 100);
    const ADDRESS_ZERO = ethers.constants?.AddressZero || '0x0000000000000000000000000000000000000000';
    const USDT_ADDR = TOKEN_REGISTRY.USDT?.address;
    /** Save allowlist directly to localStorage – independent of persistAllowlistRef which may lag */
    const saveAllowlistDirect = (tokens, pairs) => {
      if (!allowlistStorageKey) return;
      try {
        localStorage.setItem(allowlistStorageKey, JSON.stringify({ tokens, pairs }));
      } catch (_) {}
    };

    try {
      // Use LOCAL copies so each step sees the updated allowlist from the previous step.
      // React state (tokenAllowlist/pairAllowlist) is captured in closure and won't update
      // mid-function – without local copies, step 2 would re-sign even if step 1 just added it.
      let localTokens = [...tokenAllowlist];
      let localPairs = [...pairAllowlist];

      if (quote === 'BNB') {
        if (DE_DEBUG && isDev) console.log('[DE] handleDirectEntryConfirm: BNB quote – checking allowlist', { tokens: localTokens.length, pairs: localPairs.length });
        const hasNative = localTokens.some(t => String(t).toLowerCase() === ADDRESS_ZERO.toLowerCase());
        if (!hasNative) {
          toast.info('Step 1/3: Authorizing BNB in OTA policy – sign in MetaMask…', { autoClose: 10000 });
          if (DE_DEBUG && isDev) console.log('[DE] handleDirectEntryConfirm: adding BNB (0x0) to allowlist');
          await setTokenAllowed(walletAddress, ADDRESS_ZERO, true);
          localTokens = [...localTokens, ADDRESS_ZERO];
          setTokenAllowlist(localTokens);
          saveAllowlistDirect(localTokens, localPairs);
          toast.dismiss();
        }
        const baseTokenAddress = getTokenAddress(token);
        const hasBaseToken = baseTokenAddress && localTokens.some(t => String(t).toLowerCase() === baseTokenAddress.toLowerCase());
        const hasPairBnb = baseTokenAddress && localPairs.some(p => String(p.tokenIn).toLowerCase() === ADDRESS_ZERO.toLowerCase() && String(p.tokenOut).toLowerCase() === baseTokenAddress.toLowerCase());
        if (baseTokenAddress && !hasBaseToken) {
          toast.info(`Step 2/3: Authorizing ${token} in OTA policy – sign in MetaMask…`, { autoClose: 10000 });
          if (DE_DEBUG && isDev) console.log('[DE] handleDirectEntryConfirm: adding base token', token, baseTokenAddress);
          await setTokenAllowed(walletAddress, baseTokenAddress, true);
          localTokens = [...localTokens, baseTokenAddress];
          setTokenAllowlist(localTokens);
          saveAllowlistDirect(localTokens, localPairs);
          toast.dismiss();
        }
        if (baseTokenAddress && !hasPairBnb) {
          toast.info(`Step 3/3: Authorizing BNB→${token} pair – sign in MetaMask…`, { autoClose: 10000 });
          if (DE_DEBUG && isDev) console.log('[DE] handleDirectEntryConfirm: adding pair BNB->base');
          await setPairAllowed(walletAddress, ADDRESS_ZERO, baseTokenAddress, true);
          localPairs = [...localPairs, { tokenIn: ADDRESS_ZERO, tokenOut: baseTokenAddress }];
          setPairAllowlist(localPairs);
          saveAllowlistDirect(localTokens, localPairs);
          toast.dismiss();
        }
      } else if ((quote === 'USDT' || quote === 'ETH') && token === 'BNB') {
        // Buy BNB with USDT/ETH: allowlist needs quote token + BNB (0x0) + pair quote→BNB
        const quoteAddr = quote === 'USDT' ? USDT_ADDR : getTokenAddress('ETH');
        if (quoteAddr) {
          const hasQuote = localTokens.some(t => String(t).toLowerCase() === quoteAddr.toLowerCase());
          const hasNative = localTokens.some(t => String(t).toLowerCase() === ADDRESS_ZERO.toLowerCase());
          const hasPair = localPairs.some(p => String(p.tokenIn).toLowerCase() === quoteAddr.toLowerCase() && String(p.tokenOut).toLowerCase() === ADDRESS_ZERO.toLowerCase());
          if (!hasQuote) {
            toast.info(`Step 1/3: Authorizing ${quote} in OTA policy – sign in MetaMask…`, { autoClose: 10000 });
            await setTokenAllowed(walletAddress, quoteAddr, true);
            localTokens = [...localTokens, quoteAddr];
            setTokenAllowlist(localTokens);
            saveAllowlistDirect(localTokens, localPairs);
            toast.dismiss();
          }
          if (!hasNative) {
            toast.info('Step 2/3: Authorizing BNB in OTA policy – sign in MetaMask…', { autoClose: 10000 });
            await setTokenAllowed(walletAddress, ADDRESS_ZERO, true);
            localTokens = [...localTokens, ADDRESS_ZERO];
            setTokenAllowlist(localTokens);
            saveAllowlistDirect(localTokens, localPairs);
            toast.dismiss();
          }
          if (!hasPair) {
            toast.info(`Step 3/3: Authorizing ${quote}→BNB pair – sign in MetaMask…`, { autoClose: 10000 });
            await setPairAllowed(walletAddress, quoteAddr, ADDRESS_ZERO, true);
            localPairs = [...localPairs, { tokenIn: quoteAddr, tokenOut: ADDRESS_ZERO }];
            setPairAllowlist(localPairs);
            saveAllowlistDirect(localTokens, localPairs);
            toast.dismiss();
          }
        }
      }
      toast.info('Allowlist ready – sending to OTA server to open position…', { autoClose: 6000 });
      // Precheck on-chain wiring before backend executeTrade call to avoid opaque revert(0x):
      // - UserVault.dexWrapper must be configured
      // - executor bot must be authorized in UserVault.authorizedExecutors
      const wiring = await getDirectEntryExecutionWiringStatus(executorBotAddress, walletAddress).catch(() => null);
      if (wiring) {
        if (!wiring.hasPancakeRouter) {
          const routerAddr = CONTRACT_MAP?.PANCAKE_ROUTER?.address;
          if (!routerAddr) throw new Error('PancakeRouter address not configured in CONTRACT_MAP.');
          toast.dismiss();
          toast.info('Setting PancakeSwap Router on UserVault – sign in wallet…', { autoClose: 20000 });
          await setPancakeRouterOnVault(routerAddr);
          toast.dismiss();
          toast.success('PancakeSwap Router configured on-chain.', { autoClose: 4000 });
        }
        const missingWrapper = !wiring.hasDexWrapper;
        const executorKnownButNotAuthorized = !!wiring.executorAddress && wiring.executorAuthorized === false;
        if (missingWrapper || executorKnownButNotAuthorized) {
          const reason = [
            missingWrapper ? 'UserVault.dexWrapper is not configured.' : null,
            executorKnownButNotAuthorized ? `Executor ${wiring.executorAddress} is not authorized in UserVault.authorizedExecutors.` : null
          ].filter(Boolean).join(' ');
          const e = new Error(
            `${reason} Please open OTA Access Control and re-authorize bot, then retry Direct Entry.`
          );
          e.code = 'OTA_EXECUTION_WIRING';
          throw e;
        }
      }
      const quoteAddr = quote === 'BNB' ? WBNB_BSC : (TOKEN_REGISTRY[quote]?.address ?? null);
      const tokenAddr = OTA_LIMITS_TOKENS.find((t) => t.symbol === token)?.address ?? TOKEN_REGISTRY[token]?.address ?? null;
      const path2Hop = quoteAddr && tokenAddr ? [quoteAddr, tokenAddr] : null;
      if (DE_DEBUG && isDev) console.log('[DE] handleDirectEntryConfirm: calling directEntryOpen', { wallet: walletAddress?.slice(0, 12), token, amountNum, quote, slippageBps, path: path2Hop ? '2-hop' : null });
      const deRes = await directEntryOpen(walletAddress, token, amountNum, quote, slippageBps, undefined, path2Hop);
      if (DE_DEBUG && isDev) console.log('[DE] handleDirectEntryConfirm SUCCESS', { positionId: deRes?.positionId, txHash: deRes?.txHash });
      setHasOpenPosition(true);
      // Store full position data immediately so OpenOrdersPanel and Close button work without
      // waiting 15s for the next poll cycle. Normalize id field from backend (id/positionId/_id).
      if (deRes) {
        const normalizedPos = {
          ...deRes,
          id: deRes.id || deRes.positionId || deRes._id,
          status: deRes.status || 'open',
          token: deRes.token || token,
        };
        setOpenPositionData(normalizedPos);
      }
      setDirectEntryConfirmOpen(false);
      setDirectEntryAmount('');
      refetchVault?.();
      toast.success(`Direct Entry opened: ${token} (${amountNum} ${quote})`);
      try {
        window.dispatchEvent(new CustomEvent('ota-direct-entry-opened', { detail: { walletAddress } }));
      } catch (_) {}
    } catch (err) {
      if (DE_DEBUG && isDev) console.warn('[DE] handleDirectEntryConfirm CATCH', {
        message: err?.message,
        code: err?.code,
        is400: err?.is400,
        failedStatus: err?.failedStatus,
        failedEndpoint: err?.failedEndpoint,
        failedUrl: err?.failedUrl,
        debug: !!err?.debug
      });
      const raw = err?.message || 'Failed to open position';
      const isKnownRevert = err?.code === 'CALL_EXCEPTION' && err?.debug;
      const d = err?.debug || err?.responseBody?.debug;
      if (d && (d.decodedRevertReason || d.originalError || d.vaultBalanceUsdt != null || d.revertSelector)) {
        console.warn('[Direct Entry] Backend (from server):', {
          decodedRevertReason: d.decodedRevertReason,
          originalError: d.originalError,
          vaultBalance: d.vaultBalanceUsdt,
          quoteToken: d.quoteToken,
          revertSelector: d.revertSelector
        });
      }
      if (!isKnownRevert) logWithPrefix('AutoTradePanel', 'Direct Entry error:', raw);
      if (err?.hint) logWithPrefix('AutoTradePanel', 'Direct Entry hint (server config):', err.hint);
      if (raw.toLowerCase().includes('position') && raw.toLowerCase().includes('open')) setHasOpenPosition(true);
      const decodedReason = (d?.decodedRevertReason && String(d.decodedRevertReason).trim()) || null;
      const backendReason = (d?.originalError && String(d.originalError).trim()) || (d?.reason && String(d.reason).trim()) || null;
      const hintFromBackend = (d?.noRevertMessageHint && String(d.noRevertMessageHint).trim()) || null;
      const diag = d?.diagWrapperSwap;
      const wiringPrecheck = d?.directEntryDiag?.userVaultPrecheck;
      const liveParts = [];
      if (wiringPrecheck && wiringPrecheck.executorAuthorized === false) {
        liveParts.push(`Executor not authorized in UserVault.authorizedExecutors: ${wiringPrecheck.autoExecutorAddress || 'unknown executor'}`);
      }
      if (wiringPrecheck && (!wiringPrecheck.dexWrapperAddress || String(wiringPrecheck.dexWrapperAddress).toLowerCase() === '0x0000000000000000000000000000000000000000')) {
        liveParts.push('UserVault.dexWrapper is not configured on-chain');
      }
      if (wiringPrecheck && wiringPrecheck.pancakeRouterSet === false) {
        liveParts.push('UserVault.pancakeRouter is not configured on-chain');
      }
      if (hintFromBackend) liveParts.push(hintFromBackend);
      if (decodedReason) liveParts.push(decodedReason);
      if (backendReason) liveParts.push(backendReason);
      if (raw) liveParts.push(raw);
      if (err?.hint) liveParts.push(`Hint: ${err.hint}`);
      if (d?.vaultBalanceUsdt != null && !String(d.vaultBalanceUsdt).startsWith('N/A')) {
        liveParts.push(`Vault: ${d.vaultBalanceUsdt} ${d.quoteToken || quote || 'BNB'}`);
      }
      if (err?.failedStatus === 404 && (err?.failedUrl || err?.failedEndpoint)) {
        if (err?.failedUrl) liveParts.push(`URL: ${err.failedUrl}`);
        if (err?.failedEndpoint) liveParts.push(`Endpoint: ${err.failedEndpoint}`);
      }
      if (diag) liveParts.push(`Diag: ${diag}`);
      const isRevertNoReason = (isKnownRevert || err?.code === 'CALL_EXCEPTION') && !decodedReason && !hintFromBackend;
      if (isRevertNoReason) {
        liveParts.push('Tip: Try higher slippage (e.g. 30%) or inspect the transaction on BSCScan.');
      }
      let fullMessage = liveParts.length > 0 ? liveParts.join(' | ') : (raw || 'Direct Entry failed');
      // Keep wording consistent in English when backend sends mixed hints.
      fullMessage = fullMessage
        .replace(/Add native BNB\s*\(0x0+\)\s*to Policy\s*→\s*Token allowlist[^.|]*/gi, 'Add BNB to allowlist (tab Allowlist → add BNB and pair BNB→token).')
        .replace(/native BNB\s*\(0x0+\)/gi, 'BNB')
        .replace(/BNB = your BNB[\s\S]*?Direct Entry\./gi, '');
      const knownStructuredError = [
        'OTA_PANCAKE_ROUTER_NOT_SET',
        'OTA_DEX_WRAPPER_NOT_SET',
        'OTA_EXECUTOR_NOT_AUTHORIZED',
        'OTA_USERVAULT_PRECHECK_FAILED',
      ].includes(String(err?.code || ''));
      const genericNoReasonText = /revert on-chain with no message|execution reverted:\s*0x|transaction reverted \(no revert data from rpc\)|revert.*no revert data/i.test(fullMessage || '');
      if (genericNoReasonText && !knownStructuredError) {
        fullMessage = [
          'Execution reverted with no reason (0x).',
          'The backend transaction is failing before swap completion.',
          'Most common causes: UserVault swap config missing (PancakeRouter/dex-eduWrapper), executor authorization mismatch, or policy constraints.',
          'Open BSCScan and backend logs for the exact on-chain reason.'
        ].join(' ');
      }
      const likelyAllowlist = err?.code === 'OTA_TOKEN_NOT_ALLOWED' || err?.code === 'OTA_PAIR_NOT_ALLOWED'
        || (decodedReason && /TokenNotAllowed|PairNotAllowed/i.test(decodedReason))
        || (backendReason && /TokenNotAllowed|PairNotAllowed/i.test(backendReason));
      const isAllowlistRevert = likelyAllowlist
        || /TokenNotAllowed|PairNotAllowed|token.*not allowed|pair.*not allowed/i.test(fullMessage || '')
        || /native BNB|add.*BNB.*allowlist|0x0+.*allowlist/i.test(fullMessage || '');
      setDirectEntryConfirmOpen(false);
      const isRpcError = /invalid rpc url|twnodes/i.test(raw);
      const isPendingTx = /already pending/i.test(raw) || /PUBLIC_signTransaction.*pending/i.test(raw);
      const isWiringError = err?.code === 'OTA_EXECUTION_WIRING'
        || err?.code === 'OTA_PANCAKE_ROUTER_NOT_SET'
        || err?.code === 'OTA_DEX_WRAPPER_NOT_SET'
        || err?.code === 'OTA_EXECUTOR_NOT_AUTHORIZED'
        || err?.code === 'OTA_USERVAULT_PRECHECK_FAILED'
        || (wiringPrecheck && (
          wiringPrecheck.executorAuthorized === false
          || !wiringPrecheck.dexWrapperAddress
          || String(wiringPrecheck.dexWrapperAddress).toLowerCase() === '0x0000000000000000000000000000000000000000'
          || wiringPrecheck.pancakeRouterSet === false
        ));
      const messageToShow = isRpcError
        ? 'Invalid BSC RPC URL in your wallet. Click "Fix RPC" to repair the network automatically.'
        : isPendingTx
        ? 'Wallet signing conflict detected (Trust Wallet and MetaMask both installed). Fix: 1) Open MetaMask extension → click the orange badge (if any) → Reject the pending request. 2) Hard-refresh (Ctrl+Shift+R) and try Direct Entry again. 3) If still failing: disconnect Trust Wallet from this site first, then retry with MetaMask only.'
        : isWiringError
        ? `${raw} If needed, verify on BSCScan: UserVault.dexWrapper and UserVault.authorizedExecutors(executor bot).`
        : fullMessage;
      const bscScanUrl = (d?.bscScanUrl && String(d.bscScanUrl).startsWith('http')) ? d.bscScanUrl : (d?.failedTxHash && /^0x[a-fA-F0-9]{64}$/.test(String(d.failedTxHash).trim())) ? `https://bscscan.com/tx/${String(d.failedTxHash).trim()}` : null;
      setDirectEntryErrorModal({
        title: isRpcError ? 'BSC RPC Error – Fix required' : isPendingTx ? 'Wallet: pending transaction' : isWiringError ? 'Direct Entry blocked: execution wiring' : 'Direct Entry failed',
        message: messageToShow,
        openAllowlist: isAllowlistRevert && !isRpcError && !isPendingTx && !isWiringError,
        openRpcRepair: isRpcError,
        bscScanUrl,
        failedTxHash: d?.failedTxHash || null
      });
      toast.error(isPendingTx ? 'Wallet stuck – hard-refresh page (Ctrl+Shift+R) then retry.' : 'Direct Entry failed. See the error details in the popup.');
    } finally {
      if (DE_DEBUG && isDev) console.log('[DE] handleDirectEntryConfirm FINALLY: setDirectEntryLoading(false)');
      setDirectEntryLoading(false);
    }
  }, [walletAddress, advisoryToken, directEntryAmount, directEntryQuoteToken, directEntrySlippagePercent, refetchVault, tokenAllowlist, pairAllowlist, usdTradeLimits, authDisplayPrices, openAccessRequirementsModal]);

  const handleDirectEntryClose = useCallback(async () => {
    if (!walletAddress) return;
    const first = Array.isArray(openPositionData) ? openPositionData[0] : openPositionData;
    const positionId = first?.id || first?.positionId || first?._id;
    if (!positionId) {
      toast.error('Position ID not found – try refreshing the page.');
      return;
    }
    setClosePositionLoading(true);
    if (DE_DEBUG && isDev) console.log('[DE] handleDirectEntryClose START', { wallet: walletAddress?.slice(0, 12), positionId });
    try {
      const closeRes = await directEntryClose(walletAddress, positionId);
      const isReconciled = closeRes?.reconciled === true || closeRes?.reason === 'zero_vault_balance_reconciled';
      if (DE_DEBUG && isDev) console.log('[DE] handleDirectEntryClose SUCCESS');
      // Meta Controller + Bandit: automatic reward recording, without duplicating bot execution polling where backend may already record.
      fireAndForgetMetaRecordOutcomeFromDirectEntryClose(closeRes);
      if (isReconciled) {
        toast.info('Position reconciled (no new swap). Token balance was already 0 in vault.');
      } else {
        toast.success('Position closed successfully.');
      }
      setHasOpenPosition(false);
      setOpenPositionData(null);
    } catch (e) {
      if (DE_DEBUG && isDev) console.error('[DE] handleDirectEntryClose FAIL', { message: e?.message });
      toast.error(`Failed to close position: ${e?.message || 'Unknown error'}`);
    } finally {
      setClosePositionLoading(false);
    }
  }, [walletAddress, openPositionData]);

  // Poll stats every 30 seconds when enabled (to show signals generated from other sources)
  useEffect(() => {
    if (!policy.enabled || !walletAddress) return;
    
    const updateStats = async () => {
      try {
        const signalsData = await getSignals(walletAddress, { limit: 100 });
        const list = Array.isArray(signalsData?.signals) ? signalsData.signals : [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const signalsToday = list.filter(s => new Date(s.createdAt || s.created_at || 0) >= today).length;
        const lastSig = list[0];
        setStats({
          signalsToday,
          totalSignals: list.length,
          lastSignal: lastSig ? `${String(lastSig.signal || 'hold').toUpperCase()} ${lastSig.token || ''}` : null
        });
      } catch (err) {
        logWithPrefix('AutoTradePanel', 'Error polling stats:', err);
      }
    };
    
    // Update immediately
    updateStats();
    
    // Poll every 30 seconds
    const interval = setInterval(updateStats, 30000);
    return () => clearInterval(interval);
  }, [policy.enabled, walletAddress]);

  // Consolidated dashboard (OTAPage provider): auto status + Level5 guards — no duplicate 30s polls here.
  useEffect(() => {
    if (!policy.enabled) {
      setAutoExecutionStatus(null);
      return;
    }
    if (!otaDashboard?.lastFetchAt) return;
    setAutoExecutionStatus(otaDashboard.autoStatus ?? null);
  }, [policy.enabled, otaDashboard]);

  useEffect(() => {
    if (!walletAddress || !policy.enabled) {
      setLiveGuardStatus((prev) => ({ ...prev, level66: null, level73: null, level74: null, level69: null, lastCheckedAt: null, loading: false }));
      return;
    }
    if (!otaDashboard?.lastFetchAt) {
      setLiveGuardStatus((prev) => ({ ...prev, loading: true }));
      return;
    }
    const g = otaDashboard.guards || {};
    setLiveGuardStatus({
      loading: false,
      level66: g.level66,
      level73: g.level73,
      level74: g.level74,
      level69: g.level69,
      lastCheckedAt: otaDashboard.lastFetchAt,
    });
  }, [walletAddress, policy.enabled, otaDashboard]);

  const runGovernanceCycleNow = useCallback(async () => {
    if (governanceRunLoading) return;
    setGovernanceRunLoading(true);
    setGovernanceRunError(null);
    try {
      const apiBase = getApiBaseUrl();
      // Recommended order for Level69 degraded: 65 → 64 → 69 (doc OTA_LLM_AUTONOMY_LEVEL64_LEVEL69_REFERENCE)
      await fetch(`${apiBase}/ai-trading/level5/level65/run`, { method: 'POST' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      await fetch(`${apiBase}/ai-trading/level5/level64/run`, { method: 'POST' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      await fetch(`${apiBase}/ai-trading/level5/level69/run`, { method: 'POST' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      const [l67Run, l68Run] = await Promise.all([
        fetch(`${apiBase}/ai-trading/level5/level67/run`, { method: 'POST' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch(`${apiBase}/ai-trading/level5/level68/run`, { method: 'POST' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      const [level66, level73, level74, level69] = await Promise.all([
        fetch(`${apiBase}/ai-trading/level5/level66/status`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch(`${apiBase}/ai-trading/level5/level73/status`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch(`${apiBase}/ai-trading/level5/level74/status`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch(`${apiBase}/ai-trading/level5/level69/status`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      setLiveGuardStatus({
        loading: false,
        level66,
        level73,
        level74,
        level69,
        lastCheckedAt: new Date().toISOString(),
      });
      const autoStatus = walletAddress ? await getAutoExecutionStatus(walletAddress).catch(() => null) : null;
      if (autoStatus) setAutoExecutionStatus(autoStatus);
      setGovernanceRunResult({
        checkedAt: new Date().toISOString(),
        level67Code: l67Run?.code || 'n/a',
        level68Code: l68Run?.code || 'n/a',
      });
    } catch (e) {
      setGovernanceRunError(e?.message || 'governance cycle failed');
    } finally {
      setGovernanceRunLoading(false);
    }
  }, [governanceRunLoading, walletAddress]);

  // Verify signal source live from API: calls /analyze and displays analysisSource + btcLeading in the strip.
  const refreshSignalSource = useCallback(async () => {
    const token = advisoryToken || 'BNB';
    if (!walletAddress?.trim()) {
      toast.warning('Connect the EVM wallet to verify the signal source and BTC reference data.');
      return;
    }
    if (loadingSignalSource) {
      toast.info('Verification in progress...');
      return;
    }
    setLoadingSignalSource(true);
    setLastSignalSource(null);
    try {
      const recentOutcomes = await loadOutcomesForAnalyze(walletAddress);
      const options = buildAnalyzeOptions(walletAddress, { recentOutcomes });
      const response = await analyzeMarketWithLlmProvider(token, options);
      const p = typeof response?.signal === 'object' && response.signal !== null ? response.signal : response;
      const source = p?.analysisSource != null ? String(p.analysisSource) : null;
      setLastSignalSource(source || null);
      const normalized = p
        ? { ...p, btcLeading: p.btcLeading ?? p.btc_leading, btcContext: p.btcContext ?? p.btc_context }
        : null;
      setLastAnalysisPayload(normalized);
      const livePrice = p?.currentPrice ?? response?.currentPrice;
      const md = p?.marketData ?? response?.marketData;
      if (livePrice != null && Number(livePrice) > 0) {
        const r = lastLivePricesByTokenRef.current;
        r[token] = {
          price: Number(livePrice),
          high24h: md?.high24h,
          low24h: md?.low24h,
          change24h: md?.change24h ?? md?.changePercent24h,
          timeLabel: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        const tokenKeys = Object.keys(r).sort();
        const parts = tokenKeys.map((t) => {
          const x = r[t];
          let s = `${t} $${x.price.toFixed(4)} @ ${x.timeLabel}`;
          const hasRealRange = x.high24h != null && x.low24h != null && Number(x.high24h) > 0 && Number(x.low24h) > 0 && Number(x.high24h) !== Number(x.low24h);
          if (hasRealRange) s += ` (24h: $${Number(x.low24h).toFixed(2)}–$${Number(x.high24h).toFixed(2)})`;
          else if (x.change24h != null && Number.isFinite(Number(x.change24h))) s += ` (24h: ${Number(x.change24h) >= 0 ? '+' : ''}${Number(x.change24h).toFixed(2)}%)`;
          return s;
        });
        if (parts.length > 0) toast.info(`OTA LIVE (no cache): ${parts.join(' · ')}`, { toastId: 'ota-live-prices', autoClose: 10 * 60 * 1000 });
      }
      if (source) {
        const bl = normalized?.btcLeading;
        const hasBtc = bl && (bl.price != null || bl.return6h != null || bl.bias);
        const sourceFriendly = mapAnalysisSourceToDataOriginRo(source);
        toast.success(
          hasBtc
            ? `Data origin: ${sourceFriendly} · BTC ref.: ${bl.bias || '—'}${bl.return6h != null ? ` · 6h ${bl.return6h >= 0 ? '+' : ''}${Number(bl.return6h).toFixed(2)}%` : ''}`
            : `Data origin: ${sourceFriendly} (no btcLeading in response; BTC reference may be missing on this endpoint)`,
          { autoClose: 5000 }
        );
      } else {
        toast.info('API response does not contain analysisSource.');
      }
    } catch (e) {
      logWithPrefix('AutoTradePanel', 'refreshSignalSource error:', e);
      toast.error('Could not get the signal source.');
    } finally {
      setLoadingSignalSource(false);
    }
  }, [advisoryToken, walletAddress, loadingSignalSource]);

  // P1.5 PnL & risk observability: fetch metrics when Auto is active; backend may expose PERFORMANCE_METRICS / PERFORMANCE_RISK.
  useEffect(() => {
    if (!policy.enabled || !walletAddress) {
      setPnlMetrics(null);
      return;
    }
    let cancelled = false;
    const fetchPnLMetrics = async () => {
      try {
        const [metricsRes, riskRes] = await Promise.all([
          getMetrics(walletAddress, { period: '24h' }).catch(() => null),
          getRiskMetrics(walletAddress, { period: '24h' }).catch(() => null)
        ]);
        if (cancelled) return;
        const m = metricsRes || {};
        const r = riskRes || {};
        const netPnl = m.netPnl ?? m.net_pnl ?? m.totalPnl ?? m.total_pnl ?? m.pnl ?? r.netPnl ?? r.net_pnl ?? r.pnl ?? null;
        const winRate = m.winRate ?? m.win_rate ?? r.winRate ?? null;
        const tradesCount = m.tradesCount ?? m.trades_count ?? m.tradesPerDay ?? r.tradesCount24h ?? null;
        const maxDrawdown = r.maxDrawdown ?? r.max_drawdown ?? m.maxDrawdown ?? null;
        if (netPnl != null || winRate != null || tradesCount != null || maxDrawdown != null) {
          setPnlMetrics({ netPnl, winRate, tradesCount, maxDrawdown });
        } else {
          setPnlMetrics('unavailable');
        }
      } catch (_) {
        if (!cancelled) setPnlMetrics('unavailable');
      }
    };
    fetchPnLMetrics();
    const interval = setInterval(fetchPnLMetrics, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [policy.enabled, walletAddress]);

  // Fetch OTA executions (what OTA AI actually did) – GET /ai-trading/execution/trades
  // When Auto is ON: poll more frequently so profit increases/decreases are visible in real time.
  useEffect(() => {
    if (!walletAddress) {
      setOtaExecutions([]);
      return;
    }
    let cancelled = false;
    const fetchExecutions = async () => {
      setLoadingOtaExecutions(true);
      setOtaExecutionsError(null);
      try {
        const res = await getTrades(walletAddress, { limit: 50 });
        if (cancelled) return;
        const raw = Array.isArray(res?.trades) ? res.trades : [];
        const otaOnly = raw.filter(
          t => (t.source === 'ota_auto' || t.execution_mode === 'ota_auto' || t.execution_mode === 'auto')
        );
        const seenTx = new Set();
        const deduped = otaOnly.filter(t => {
          const tx = t.txHash || t.transaction_hash;
          if (tx && seenTx.has(tx)) return false;
          if (tx) seenTx.add(tx);
          return true;
        });

        // Detect new executions vs previous fetch → show toast + flash animation
        const currentIds = new Set(deduped.map(t => t.id || t._id || t.txHash).filter(Boolean));
        const appeared = [...currentIds].filter(id => !prevExecIdsRef.current.has(id));
        if (appeared.length > 0 && prevExecIdsRef.current.size > 0) {
          const newest = deduped.find(t => appeared.includes(t.id || t._id || t.txHash));
          const pair = newest ? [newest.tokenIn, newest.tokenOut].filter(Boolean).join('→') : 'Trade';
          const pnl = newest?.pnl ?? newest?.pnlUsd ?? null;
          const pnlStr = pnl != null ? ` | PnL: ${Number(pnl) >= 0 ? '+' : ''}${Number(pnl).toFixed(2)} USD` : '';
          toast.success(`🤖 Bot executed: ${pair}${pnlStr}`, { duration: 8000, position: 'top-right' });
          setNewExecIds(new Set(appeared));
          setTimeout(() => setNewExecIds(new Set()), 2000);
          const quoteSymbolsForSide = ['USDT', 'BNB', 'ETH', 'WBNB', 'WETH'];
          const isBuy = newest && newest.side !== 'sell' && !(newest.tokenOut && quoteSymbolsForSide.includes(String(newest.tokenOut).toUpperCase()));
          if (isBuy) setOtaOpenDetailModal(newest);
        }
        prevExecIdsRef.current = currentIds;

        setOtaExecutions(deduped);
      } catch (err) {
        if (!cancelled) {
          logWithPrefix('AutoTradePanel', 'Error fetching OTA executions:', err);
          setOtaExecutionsError(err?.message || String(err) || 'Failed to load');
          setOtaExecutions([]);
        }
      } finally {
        if (!cancelled) setLoadingOtaExecutions(false);
      }
    };
    fetchExecutions();
    const pollInterval = policy.enabled ? 20000 : 30000; // 20s when Auto ON, 30s otherwise: reduces 429 on /trades.
    const interval = setInterval(fetchExecutions, pollInterval);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [walletAddress, policy.enabled, retryOtaExecutions]);

  // LIVE update for OPEN popup: when the executions list refreshes, update the object displayed in the modal.
  useEffect(() => {
    if (!otaOpenDetailModal || !otaExecutions.length) return;
    const id = otaOpenDetailModal.id ?? otaOpenDetailModal._id ?? otaOpenDetailModal.txHash;
    const fresh = otaExecutions.find(t => (t.id ?? t._id ?? t.txHash) === id);
    if (fresh) setOtaOpenDetailModal(fresh);
  }, [otaExecutions, otaOpenDetailModal]);

  // Current price for OPEN popup: estimated LIVE PnL, bought token = tokenOut.
  useEffect(() => {
    if (!otaOpenDetailModal) {
      setOtaOpenDetailLivePrice(null);
      return;
    }
    const baseSymbol = (otaOpenDetailModal.tokenOut ?? otaOpenDetailModal.token_out ?? '').toString().trim().toUpperCase();
    if (!baseSymbol) {
      setOtaOpenDetailLivePrice(null);
      return;
    }
    let cancelled = false;
    tokenPriceService.getAllTokenPrices([baseSymbol]).then(prices => {
      if (!cancelled && prices && typeof prices[baseSymbol] === 'number') setOtaOpenDetailLivePrice(prices[baseSymbol]);
    }).catch(() => { if (!cancelled) setOtaOpenDetailLivePrice(null); });
    return () => { cancelled = true; };
  }, [otaOpenDetailModal]);

  // Closed Direct Entry positions: PnL sum for OTA AI Profit display when metrics/executions have no PnL.
  useEffect(() => {
    if (!walletAddress) {
      setClosedPositionsPnlTotal(0);
      return;
    }
    let cancelled = false;
    const fetchClosedPnl = async () => {
      try {
        const list = await getDirectEntryClosedPositions(walletAddress, 50);
        if (cancelled) return;
        const arr = Array.isArray(list) ? list : (list?.closed ?? list?.positions ?? []);
        const total = arr.reduce((sum, c) => {
          const p = c.pnlUsd != null ? parseFloat(c.pnlUsd) : (c.pnl_usd != null ? parseFloat(c.pnl_usd) : (c.pnl != null ? parseFloat(c.pnl) : null));
          return sum + (Number.isFinite(p) ? p : 0);
        }, 0);
        setClosedPositionsPnlTotal(total);
      } catch (_) {
        if (!cancelled) setClosedPositionsPnlTotal(0);
      }
    };
    fetchClosedPnl();
    const interval = setInterval(fetchClosedPnl, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [walletAddress]);

  // Fetch Agent sessions when Agent Mode active (transparency)
  useEffect(() => {
    if (!policy.enabled || !autoExecutionStatus?.agentMode || !walletAddress) {
      setAgentSessions([]);
      return;
    }
    let cancelled = false;
    const fetchAgentSessions = async () => {
      try {
        const res = await getAgentSessions(walletAddress, 10);
        if (!cancelled && res?.sessions) setAgentSessions(res.sessions);
      } catch (_) {
        if (!cancelled) setAgentSessions([]);
      }
    };
    fetchAgentSessions();
    const interval = setInterval(fetchAgentSessions, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [policy.enabled, autoExecutionStatus?.agentMode, walletAddress]);
  
  // REAL API call to generate signals
  const generateSignalReal = useCallback(async (token = 'BNB') => {
    try {
      logWithPrefix('AutoTradePanel', 'Starting REAL market analysis:', { token, walletAddress });
      
      setActivityFeed(prev => [{
        id: Date.now(),
        type: 'scanning',
        message: `AI analyzing ${token}/USDT market...`,
        timestamp: new Date()
      }, ...prev.slice(0, 9)]);
      
      toast.info('AI Market Scan Started', {
        description: `Analyzing ${token} market with OpenAI`,
        duration: 3000
      });
      
      // LLM learns: send recentOutcomes as context; backend can include them in prompt.
      const recentOutcomes = await loadOutcomesForAnalyze(walletAddress);
      const options = buildAnalyzeOptions(walletAddress, { recentOutcomes });
      const response = await analyzeMarketWithLlmProvider(token, options);
      
      logWithPrefix('AutoTradePanel', 'REAL signal generated:', response);

      if (isOpenAiUnavailableResult(response)) {
        setActivityFeed(prev => [{
          id: Date.now(),
          type: 'warning',
          message: `OpenAI temporarily unavailable. Analysis skipped. Try again in ~1 min.`,
          timestamp: new Date()
        }, ...prev.slice(0, 9)]);
        toast.warning('OpenAI temporarily unavailable', {
          description: OTA_OPENAI_UNAVAILABLE_MESSAGE,
          duration: 5000
        });
        return;
      }
      
      // Normalize: API returns { success, signal: payload }; payload has signal, confidence, reasoning, entryPrice, tokenUsage, analysisSource
      const p = typeof response.signal === 'object' && response.signal !== null ? response.signal : response;
      const rawSignal = p.signal ?? response.signal;
      const signalType = rawSignal != null ? String(rawSignal).toLowerCase() : 'hold';
      const confidence = typeof p.confidence === 'number' ? p.confidence : (typeof response.confidence === 'number' ? response.confidence : 0);
      const reasoningSrc = p.reasoning ?? response.reasoning;
      const reasoning = reasoningSrc != null ? String(reasoningSrc).substring(0, 60) : 'No reasoning provided';
      const tokens = p.tokenUsage?.totalTokens ?? response.tokenUsage?.totalTokens ?? 0;
      const llmProof = tokens > 0 ? ' · OpenAI analyzed' : '';
      if (p?.analysisSource != null) setLastSignalSource(String(p.analysisSource));
      setLastAnalysisPayload(p ? { ...p, btcLeading: p.btcLeading ?? p.btc_leading, btcContext: p.btcContext ?? p.btc_context } : null);
      
      // Update activity feed with REAL result
      setActivityFeed(prev => [{
        id: Date.now(),
        type: signalType === 'buy' ? 'success' : signalType === 'sell' ? 'warning' : 'info',
        message: `${signalType.toUpperCase()} ${token} | Decision score: ${Math.round(confidence * 100)}% (heuristic) | ${reasoning}...${llmProof}`,
        timestamp: new Date()
      }, ...prev.slice(0, 9)]);
      
      // Toast with signal details (include LLM proof when tokens used)
      const entryPrice = p.entryPrice ?? response.entryPrice;
      const entryDesc = entryPrice != null && Number(entryPrice) !== 0
        ? `Decision score: ${Math.round(confidence * 100)}% (heuristic) | Entry: $${entryPrice}`
        : `Decision score: ${Math.round(confidence * 100)}% (heuristic) | Entry: —`;
      toast.success(`Signal Generated: ${signalType.toUpperCase()} ${token}`, {
        description: tokens > 0 ? `${entryDesc} | ${tokens} tokens (OpenAI)` : entryDesc,
        duration: 5000
      });

      // OTA LIVE prices toast: prices used by OTA LLM, always LIVE and without cache.
      // Persists until other prices are obtained: the same fixed toastId updates on every analysis for any token.
      const livePrice = p.currentPrice ?? response.currentPrice;
      const md = p.marketData ?? response.marketData;
      const high24h = md?.high24h;
      const low24h = md?.low24h;
      const change24h = md?.change24h ?? md?.changePercent24h;
      const timeLabel = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      if (livePrice != null && Number(livePrice) > 0) {
        const r = lastLivePricesByTokenRef.current;
        r[token] = { price: Number(livePrice), high24h, low24h, change24h, timeLabel };
        const tokenKeys = Object.keys(r).sort();
        const parts = tokenKeys.map((t) => {
          const x = r[t];
          let s = `${t} $${x.price.toFixed(4)} @ ${x.timeLabel}`;
          const hasRealRange = x.high24h != null && x.low24h != null && Number(x.high24h) > 0 && Number(x.low24h) > 0 && Number(x.high24h) !== Number(x.low24h);
          if (hasRealRange) {
            s += ` (24h: $${Number(x.low24h).toFixed(2)}–$${Number(x.high24h).toFixed(2)})`;
          } else if (x.change24h != null && Number.isFinite(Number(x.change24h))) {
            const ch = Number(x.change24h);
            s += ` (24h: ${ch >= 0 ? '+' : ''}${ch.toFixed(2)}%)`;
          }
          return s;
        });
        const liveMsg = parts.length > 0 ? `OTA LIVE (no cache): ${parts.join(' · ')}` : '';
        if (liveMsg) {
          toast.info(liveMsg, {
            toastId: 'ota-live-prices',
            autoClose: 10 * 60 * 1000
          });
        }
      }
      
      // Update stats REAL from DB
      try {
        const signalsData = await getSignals(walletAddress, { limit: 100 });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const signalsToday = signalsData.signals.filter(s => new Date(s.createdAt) >= today).length;
        
        const first = signalsData.signals[0];
        const lastSigStr = first ? `${(typeof first.signal === 'object' ? first.signal?.signal : first.signal) ?? 'hold'}`.toUpperCase() + ` ${first.token ?? ''}` : null;
        setStats({
          signalsToday,
          totalSignals: signalsData.signals.length,
          lastSignal: lastSigStr
        });
      } catch (err) {
        logWithPrefix('AutoTradePanel', 'Error updating stats:', err);
      }
    } catch (error) {
      logWithPrefix('AutoTradePanel', 'Error generating signal:', error);

      // Detect Render cold start (timeout / network error on first request).
      const isNetworkError = !error?.message || error.message === 'Failed to fetch' || error.name === 'TypeError';
      const msg = isNetworkError
        ? 'Backend starting up (Render cold start) – retry in ~30s'
        : `Analysis failed: ${error.message || 'Unknown error'}`;

      setActivityFeed(prev => [{
        id: Date.now(),
        type: isNetworkError ? 'warning' : 'error',
        message: msg,
        timestamp: new Date()
      }, ...prev.slice(0, 9)]);

      if (isNetworkError) {
        toast.warning('Backend waking up…', {
          description: 'Render cold start – analysis will retry automatically in 30s',
          autoClose: 6000
        });
      } else {
        toast.error('Signal Generation Failed', {
          description: error.message || 'Please try again',
          autoClose: 4000
        });
      }
    }
  }, [walletAddress]);
  
  // Countdown timer for next scan – uses interval from server (autoExecutionStatus.monitoringIntervalMs) when available
  useEffect(() => {
    if (!policy.enabled || !walletAddress) {
      setNextScanCountdown(30);
      return;
    }
    const intervalMs = autoExecutionStatus?.monitoringIntervalMs;
    const scanSeconds = intervalMs != null ? Math.min(300, Math.max(15, Math.round(intervalMs / 1000))) : 30;
    const interval = setInterval(() => {
      setNextScanCountdown(prev => (prev <= 1 ? scanSeconds : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [policy.enabled, walletAddress, autoExecutionStatus?.monitoringIntervalMs]);

  // When we first get status with monitoringIntervalMs, sync countdown to that value
  useEffect(() => {
    if (policy.enabled && autoExecutionStatus?.monitoringIntervalMs != null) {
      const sec = Math.min(300, Math.max(15, Math.round(autoExecutionStatus.monitoringIntervalMs / 1000)));
      setNextScanCountdown(sec);
    }
  }, [policy.enabled, autoExecutionStatus?.monitoringIntervalMs]);
  
  // Load policy from contract; enabled prefers localStorage for session persistence.
  const loadPolicyFromContract = useCallback(async () => {
    if (!walletAddress || !otaAutoEnabledKey) return;
    try {
      const policyData = await getPolicy(walletAddress);
      if (policyData) {
        const normalizedUiPolicy = normalizePolicyFromChainForUi(policyData);
        const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(otaAutoEnabledKey) : null;
        const enabledFromStorage = stored === 'true';
        const fetchedEnabled = Boolean(normalizedUiPolicy.enabled);
        const effectiveEnabled = enabledFromStorage ? true : fetchedEnabled;
        const validRisk = ['conservative', 'moderate', 'aggressive', 'high'];
        const riskLevel = policyData.riskLevel && validRisk.includes(policyData.riskLevel) ? policyData.riskLevel : 'moderate';
        const payloadFromChain = buildPolicyPayloadFromChain(policyData);
        setPolicyOnChainSnapshot(payloadFromChain);
        setPolicyLastCheckedAt(new Date().toISOString());
        if (payloadFromChain.enabled) {
          setSavedPolicySummary(buildSummaryFromPayload(payloadFromChain));
        }
        setPolicy(prev => ({
          ...prev,
          enabled: effectiveEnabled,
          expiresAt: normalizedUiPolicy.expiresAt,
          maxSlippageBps: normalizedUiPolicy.maxSlippageBps,
          minDelaySeconds: normalizedUiPolicy.minDelaySeconds,
          enforceTokenAllowlist: normalizedUiPolicy.enforceTokenAllowlist,
          enforcePairAllowlist: normalizedUiPolicy.enforcePairAllowlist,
          riskLevel
        }));
        if (policyData.usdMinPerTrade != null || policyData.usdMaxPerTrade != null || policyData.usdDailyCap != null || policyData.maxTradesPer12h != null) {
          setUsdTradeLimits(prev => ({
            ...prev,
            ...(policyData.usdMinPerTrade != null && { minUsd: String(policyData.usdMinPerTrade) }),
            ...(policyData.usdMaxPerTrade != null && { maxUsd: String(policyData.usdMaxPerTrade) }),
            ...(policyData.usdDailyCap != null && { dailyCapUsd: String(policyData.usdDailyCap) }),
            maxTradesPer12h: policyData.maxTradesPer12h != null ? String(policyData.maxTradesPer12h) : OTA_AUTO_DEFAULT_MAX_TRADES_PER_12H
          }));
        }
      }
    } catch (error) {
      logWithPrefix('AutoTradePanel', 'Failed to load policy:', error);
    }
  }, [walletAddress, otaAutoEnabledKey]);

  useEffect(() => {
    if (!walletAddress || !isAuthenticated || isNotDeployed) {
      setPolicyLoading(false);
      return;
    }
    const key = `ota_auto_enabled_${walletAddress.toLowerCase()}`;
    setPolicyLoading(true);
    const loadPolicy = async () => {
      setLoading(true);
      try {
        const policyData = await getPolicy(walletAddress);
        const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
        const enabledFromStorage = stored === 'true';
        const fetchedEnabled = policyData ? Boolean(policyData.enabled) : false;
        const effectiveEnabled = enabledFromStorage ? true : fetchedEnabled;
        const validRisk = ['conservative', 'moderate', 'aggressive', 'high'];
        const riskLevel = policyData?.riskLevel && validRisk.includes(policyData.riskLevel) ? policyData.riskLevel : 'moderate';
        if (policyData) {
          const normalizedUiPolicy = normalizePolicyFromChainForUi(policyData);
          const payloadFromChain = buildPolicyPayloadFromChain(policyData);
          setPolicyOnChainSnapshot(payloadFromChain);
          setPolicyLastCheckedAt(new Date().toISOString());
          if (payloadFromChain.enabled) {
            setSavedPolicySummary(buildSummaryFromPayload(payloadFromChain));
          }
          setPolicy(prev => ({
            ...prev,
            enabled: effectiveEnabled,
            expiresAt: normalizedUiPolicy.expiresAt,
            maxSlippageBps: normalizedUiPolicy.maxSlippageBps,
            minDelaySeconds: normalizedUiPolicy.minDelaySeconds,
            enforceTokenAllowlist: normalizedUiPolicy.enforceTokenAllowlist,
            enforcePairAllowlist: normalizedUiPolicy.enforcePairAllowlist,
            riskLevel
          }));
          if (policyData.usdMinPerTrade != null || policyData.usdMaxPerTrade != null || policyData.usdDailyCap != null || policyData.maxTradesPer12h != null) {
            setUsdTradeLimits(prev => ({
              ...prev,
              ...(policyData.usdMinPerTrade != null && { minUsd: String(policyData.usdMinPerTrade) }),
              ...(policyData.usdMaxPerTrade != null && { maxUsd: String(policyData.usdMaxPerTrade) }),
              ...(policyData.usdDailyCap != null && { dailyCapUsd: String(policyData.usdDailyCap) }),
              maxTradesPer12h: policyData.maxTradesPer12h != null ? String(policyData.maxTradesPer12h) : OTA_AUTO_DEFAULT_MAX_TRADES_PER_12H
            }));
          }
        }
      } catch (error) {
        console.error('Failed to load policy:', error);
        const isTimeout = /timeout|timed out/i.test(error?.message || '');
        toast.error(isTimeout ? 'Policy load timed out. Will retry on focus or in a moment.' : 'Policy load failed. Check connection and retry.');
      } finally {
        setLoading(false);
        setPolicyLoading(false);
      }
    };
    loadPolicy();
  }, [walletAddress, isAuthenticated, isNotDeployed]);

  // Re-fetch policy periodically and on window focus: avoid immediate duplicate if dashboard just fetched (<8s).
  useEffect(() => {
    if (!walletAddress || !isAuthenticated || isNotDeployed) return;
    const onFocus = () => {
      const last = otaDashboard?.lastFetchAt ? new Date(otaDashboard.lastFetchAt).getTime() : 0;
      if (last && Date.now() - last < 8000) return;
      loadPolicyFromContract();
    };
    window.addEventListener('focus', onFocus);
    const interval = setInterval(loadPolicyFromContract, 55000);
    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [walletAddress, isAuthenticated, isNotDeployed, loadPolicyFromContract, otaDashboard?.lastFetchAt]);
  
  // Start OTA AI Auto – enable policy and save
  const handleStartBot = useCallback(async () => {
    if (!walletAddress || !isAuthenticated) {
      openAccessRequirementsModal({
        title: 'Cannot start Auto Mode',
        checks: [
          { ok: false, label: 'Wallet connected', fix: 'Connect the correct wallet (MetaMask) and try again.' },
          { ok: !!isRegistered, label: 'OTA registration', fix: 'Complete Register in OTA Access Control.' },
          { ok: !!botAuthorized, label: 'Bot authorization', fix: 'Approve the executor in Step 2 - Authorize Bot.' }
        ]
      });
      return;
    }
    if (!isRegistered) {
      openAccessRequirementsModal({
        title: 'Cannot start Auto Mode',
        checks: [
          { ok: true, label: 'Wallet connected' },
          { ok: false, label: 'OTA registration', fix: 'In OTA Access Control, click Register (Step 1).' },
          { ok: !!botAuthorized, label: 'Bot authorization', fix: 'After registration, run Authorize Bot (Step 2).' }
        ]
      });
      return;
    }
    if (!botAuthorized) {
      openAccessRequirementsModal({
        title: 'Cannot start Auto Mode',
        checks: [
          { ok: true, label: 'Wallet connected' },
          { ok: true, label: 'OTA registration' },
          { ok: false, label: 'Bot authorization', fix: 'Click Authorize Bot (Step 2) so the bot can operate from Personal Account.' }
        ],
        ctaLabel: 'Open Step 2 - Authorize Bot',
        ctaAction: 'open-authorize-bot'
      });
      return;
    }
    const riskLimits = getRequiredUsdRiskLimits(usdTradeLimits);
    if (!riskLimits.ok) {
      openAccessRequirementsModal({
        title: 'Auto Mode blocked by safety limits',
        checks: [
          { ok: true, label: 'Wallet connected' },
          { ok: true, label: 'OTA registration' },
          { ok: true, label: 'Bot authorization' },
          { ok: false, label: 'USD risk limits', fix: riskLimits.errors.join(' ') }
        ],
        hint: 'Go to Limits, set Max Trade USD and Daily USD Cap, save them, then start Auto. This prevents Auto from running without a hard money cap.'
      });
      return;
    }
    setSaving(true);
    try {
      const nextPolicy = { ...policy, enabled: true };
      await setPolicyOnChain(walletAddress, {
        ...nextPolicy,
        enabled: true,
      });
      try { localStorage.setItem(`ota_auto_enabled_${walletAddress.toLowerCase()}`, 'true'); } catch (_) {}
      setPolicy(nextPolicy);
      const forceNow = forceOpenOnNextRunRef.current === true;
      await clearSafetyStopForBsc(walletAddress).catch(() => {}); // Reset safety before session so backend does not return 423.
      await setAutoSession(walletAddress, true, {
        minProfitOverGasPercent: policy.profitTier ?? OTA_AUTO_DEFAULT_PROFIT_TIER,
        maxLossPercent: normalizeAutoLossLimit(policy.lossLimit),
        usdMinPerTrade: usdTradeLimits.minUsd ? Number(usdTradeLimits.minUsd) : null,
        usdMaxPerTrade: riskLimits.maxUsd,
        usdDailyCap: riskLimits.dailyCapUsd,
        maxTradesPer12h: riskLimits.maxTradesPer12h,
        forceOpenNow: forceNow
      }).catch((e) => { throw e; }); // Persist session; if it fails (for example 423), propagate for toast.
      if (forceOpenOnNextRun || forceNow) setForceOpenOnNextRun(false);
      toast.success(forceNow ? 'OTA AI Auto started. Bot will open ONE position on next analysis (test), then close at TP/SL or SELL.' : 'OTA AI Auto started. Bot will execute trades when AI signals appear.');
    } catch (err) {
      toast.error(err?.message || 'Failed to start Auto');
    } finally {
      setSaving(false);
    }
  }, [walletAddress, isAuthenticated, isRegistered, botAuthorized, policy, usdTradeLimits, forceOpenOnNextRun, openAccessRequirementsModal]);

  // Stop OTA AI Auto – disable policy and save
  const handleStopBot = useCallback(async () => {
    if (!walletAddress || !isAuthenticated) {
      toast.error('Connect your wallet first');
      return;
    }
    setSaving(true);
    try {
      const nextPolicy = { ...policy, enabled: false };
      await setPolicyOnChain(walletAddress, {
        ...nextPolicy,
        enabled: false,
      });
      try { localStorage.setItem(`ota_auto_enabled_${walletAddress.toLowerCase()}`, 'false'); } catch (_) {}
      setPolicy(nextPolicy);
      setAutoSession(walletAddress, false).catch(() => {}); // Close session in backend.
      toast.success('OTA AI Auto stopped. Bot will not execute new trades.');
    } catch (err) {
      toast.error(err?.message || 'Failed to stop Auto');
    } finally {
      setSaving(false);
    }
  }, [walletAddress, isAuthenticated, policy]);

  // Save policy to contract
  const handleSavePolicy = useCallback(async () => {
    if (!walletAddress || !isAuthenticated) {
      openAccessRequirementsModal({
        title: 'Cannot save policy',
        checks: [
          { ok: false, label: 'Wallet connected', fix: 'Connect the correct wallet and confirm on BSC Mainnet.' },
          { ok: !!botAuthorized, label: 'Bot authorization', fix: 'Authorize Bot is required for auto execution.' }
        ],
        hint: 'Save Policy is an on-chain action: without a connected wallet, the transaction cannot be signed.'
      });
      return;
    }
    
    try {
      setVerifyingPolicy(true);
      const chainBefore = await getPolicy(walletAddress).catch(() => null);
      if (chainBefore) {
        const beforePayload = buildPolicyPayloadFromChain(chainBefore);
        setPolicyOnChainSnapshot(beforePayload);
        setPolicyLastCheckedAt(new Date().toISOString());
        if (arePoliciesEqual(beforePayload, policyPayloadForSave)) {
          setSavedPolicySummary(buildSummaryFromPayload(beforePayload));
          toast.success('Min decision score set to 0.40. Press Save policy to save.');
          return;
        }
      }
    } finally {
      setVerifyingPolicy(false);
    }

    setSaving(true);
    try {
      const result = await setPolicyOnChain(walletAddress, policyPayloadForSave);
      const txHash = result?.hash || result?.receipt?.transactionHash;
      if (!txHash) {
        throw new Error('Policy save did not return a transaction hash');
      }

      // Receipt exists => tx confirmed on-chain. Read-back for UI refresh only (no throw).
      try {
        const confirmedPolicy = await getPolicy(walletAddress);
        const confirmedPayload = confirmedPolicy ? buildPolicyPayloadFromChain(confirmedPolicy) : null;
        if (confirmedPayload) {
          setPolicyOnChainSnapshot(confirmedPayload);
        } else {
          setPolicyOnChainSnapshot(policyPayloadForSave);
        }
      } catch (_readBackErr) {
        setPolicyOnChainSnapshot(policyPayloadForSave);
      }
      setPolicyLastCheckedAt(new Date().toISOString());

      setSavedPolicySummary(buildSummaryFromPayload(policyPayloadForSave, txHash));

      toast.success(`Policy saved on-chain (tx: ${txHash.slice(0, 10)}…)`, {
        onClick: () => window.open(`https://bscscan.com/tx/${txHash}`, '_blank')
      });
    } catch (error) {
      console.error('Failed to save policy:', error);
      const msg = String(error?.message || '').toLowerCase();
      const isWalletFlowIssue =
        msg.includes('wallet') ||
        msg.includes('sign') ||
        msg.includes('transaction hash') ||
        msg.includes('did not return') ||
        msg.includes('user rejected') ||
        msg.includes('cancelled') ||
        msg.includes('unknown account') ||
        msg.includes('unsupported_operation');

      if (isWalletFlowIssue) {
        const wrongWallet = msg.includes('wrong wallet signing');
        openAccessRequirementsModal({
          title: 'Policy was not saved on-chain',
          checks: [
            { ok: !!walletAddress, label: 'Wallet connected in UI', fix: 'Connect your wallet from the header before Save Policy.' },
            {
              ok: false,
              label: 'Wallet transaction signature',
              fix: wrongWallet
                ? 'The signing wallet is different from the OTA header wallet. Reconnect the correct wallet (MetaMask, same header account) and retry.'
                : 'The transaction was not confirmed in wallet. Open MetaMask and approve the Save Policy transaction.'
            },
            {
              ok: !!botAuthorized,
              label: 'Bot authorization',
              fix: botAuthorized
                ? 'Bot is already authorized for this connected wallet.'
                : 'Optional for Save Policy, required before Start Auto.'
            }
          ],
          hint: error?.message || 'Without wallet signature, policy remains unchanged on-chain.',
          ctaLabel: !botAuthorized ? 'Open Step 2 - Authorize Bot' : null,
          ctaAction: !botAuthorized ? 'open-authorize-bot' : null
        });
      } else {
        openAccessRequirementsModal({
          title: 'Policy was not saved on-chain',
          checks: [
            { ok: !!walletAddress, label: 'Wallet connected in UI', fix: 'Connect your wallet from the header before Save Policy.' },
            { ok: false, label: 'On-chain transaction confirmation', fix: 'Retry Save Policy and confirm transaction in wallet.' },
            {
              ok: !!botAuthorized,
              label: 'Bot authorization',
              fix: botAuthorized
                ? 'Bot is already authorized for this connected wallet.'
                : 'Optional for Save Policy, required before Start Auto.'
            }
          ],
          hint: error?.message || 'Policy save failed.',
          ctaLabel: !botAuthorized ? 'Open Step 2 - Authorize Bot' : null,
          ctaAction: !botAuthorized ? 'open-authorize-bot' : null
        });
      }
    } finally {
      setSaving(false);
    }
  }, [walletAddress, isAuthenticated, policyPayloadForSave, openAccessRequirementsModal, botAuthorized]);

  const handleVerifyPolicyOnChain = useCallback(async () => {
    if (!walletAddress || !isAuthenticated) {
      setPolicyVerificationMessage({
        type: 'error',
        text: 'Connect wallet first.'
      });
      return;
    }
    setVerifyingPolicy(true);
    setPolicyVerificationMessage(null);
    try {
      const chainPolicy = await getPolicy(walletAddress);
      if (!chainPolicy) throw new Error('No policy data from contract');
      const normalized = normalizePolicyFromChainForUi(chainPolicy);
      const payload = buildPolicyPayloadFromChain(chainPolicy);
      setPolicyOnChainSnapshot(payload);
      setPolicyLastCheckedAt(new Date().toISOString());
      if (payload.enabled) setSavedPolicySummary(buildSummaryFromPayload(payload));
      setPolicy(prev => ({
        ...prev,
        enabled: normalized.enabled,
        expiresAt: normalized.expiresAt,
        maxSlippageBps: normalized.maxSlippageBps,
        minDelaySeconds: normalized.minDelaySeconds,
        enforceTokenAllowlist: normalized.enforceTokenAllowlist,
        enforcePairAllowlist: normalized.enforcePairAllowlist
      }));
      if (arePoliciesEqual(payload, policyPayloadForSave)) {
        setPolicyVerificationMessage({
          type: 'success',
          text: 'Policy verified on-chain. Form updated from contract.'
        });
      } else {
        setPolicyVerificationMessage({
          type: 'warning',
          text: 'Form updated from contract. Click Save policy to apply changes on-chain.'
        });
      }
    } catch (error) {
      setPolicyVerificationMessage({
        type: 'error',
        text: error?.message || 'Failed to verify policy on-chain.'
      });
    } finally {
      setVerifyingPolicy(false);
    }
  }, [walletAddress, isAuthenticated, policyPayloadForSave]);

  const loadLimitsFromBackendRef = useRef(null);
  // Token limits: only from contract (getTokenLimits). Address list = OTA_LIMITS_TOKENS (TOKEN_REGISTRY). No backend.
  const loadLimitsFromBackend = useCallback(async () => {
    if (!walletAddress) {
      setSavedTokenLimitsFromBackend([]);
      setSavedUsdLimitsFromBackend(null);
      setTokenLimitPresetsFromBackend([]);
      return;
    }
    setLimitsFromBackendLoading(true);
    try {
      const presets = OTA_LIMITS_TOKENS.map((p) => ({ symbol: p.symbol, address: p.address, label: p.symbol }));
      setTokenLimitPresetsFromBackend(presets);

      const tokenResults = [];
      for (const t of presets) {
        const addr = t.address;
        if (!addr) continue;
        try {
          const lim = await getTokenLimitsOnChain(walletAddress, addr);
          const maxPt = lim?.maxPerTrade ?? lim?.maxPerTradeWei;
          const daily = lim?.dailyMax ?? lim?.dailyMaxWei;
          const formatVal = (v) => {
            if (v == null || v === '' || v === undefined) return null;
            const s = String(v).trim();
            if (s === '0' || s === '0.0') return '0';
            const looksLikeWei = /^\d+$/.test(s) && (s.length > 10 || (s.length >= 1 && parseFloat(s) >= 1e9));
            if (looksLikeWei) return parseFloat(ethers.utils.formatEther(s)).toFixed(4);
            return s;
          };
          tokenResults.push({
            symbol: t.symbol,
            maxPerTrade: formatVal(maxPt),
            dailyMax: formatVal(daily),
            configured: lim != null && (maxPt != null || daily != null)
          });
        } catch {
          tokenResults.push({ symbol: t.symbol, maxPerTrade: null, dailyMax: null, configured: false });
        }
      }
      setSavedTokenLimitsFromBackend(tokenResults);
      // USD limits are only in backend; getPolicy() returns on-chain data and does not include USD. Call backend policy/get directly.
      const policyData = await getPolicyFromBackendOnly(walletAddress).catch(() => null);
      const hasUsd = policyData && (
        (policyData.usdMinPerTrade !== undefined && policyData.usdMinPerTrade !== null) ||
        (policyData.usdMaxPerTrade !== undefined && policyData.usdMaxPerTrade !== null) ||
        (policyData.usdDailyCap !== undefined && policyData.usdDailyCap !== null) ||
        (policyData.maxTradesPer12h !== undefined && policyData.maxTradesPer12h !== null)
      );
      setSavedUsdLimitsFromBackend(hasUsd ? {
        minUsd: policyData.usdMinPerTrade !== undefined && policyData.usdMinPerTrade !== null ? String(policyData.usdMinPerTrade) : null,
        maxUsd: policyData.usdMaxPerTrade !== undefined && policyData.usdMaxPerTrade !== null ? String(policyData.usdMaxPerTrade) : null,
        dailyCapUsd: policyData.usdDailyCap !== undefined && policyData.usdDailyCap !== null ? String(policyData.usdDailyCap) : null,
        maxTradesPer12h: policyData.maxTradesPer12h !== undefined && policyData.maxTradesPer12h !== null ? String(policyData.maxTradesPer12h) : OTA_AUTO_DEFAULT_MAX_TRADES_PER_12H
      } : null);
    } catch (_) {
      setSavedTokenLimitsFromBackend([]);
      setSavedUsdLimitsFromBackend(null);
    } finally {
      setLimitsFromBackendLoading(false);
    }
  }, [walletAddress]);
  loadLimitsFromBackendRef.current = loadLimitsFromBackend;

  const handleRefreshLimitsFromBackend = useCallback(() => {
    loadLimitsFromBackendRef.current?.();
  }, []);

  useEffect(() => {
    if (activeTab === 'limits' && walletAddress && loadLimitsFromBackendRef.current) loadLimitsFromBackendRef.current();
  }, [activeTab, walletAddress]);

  // Save token limits
  const handleSaveTokenLimits = useCallback(async () => {
    if (!walletAddress) {
      toast.error('Please connect your wallet');
      return;
    }
    
    if (!tokenLimits.token) {
      toast.error('Please enter a token address');
      return;
    }
    
    setSavingTokenLimits(true);
    try {
      // Parse only numeric value: "0", "", "0 = unlimited" -> 0; "0.001" -> wei. Avoids parseEther throwing on placeholder text.
      const parseTokenLimit = (v) => {
        if (v == null || v === '') return '0';
        const s = String(v).trim().replace(/,/g, '');
        const num = s.replace(/^([\d.]+).*$/, '$1').trim();
        if (!num || num === '0') return '0';
        try {
          return ethers.utils.parseEther(num).toString();
        } catch (_) {
          return '0';
        }
      };
      const maxPerTrade = parseTokenLimit(tokenLimits.maxPerTrade);
      const dailyMax = parseTokenLimit(tokenLimits.dailyMax);

      toast.info('A popup should open (MetaMask or your wallet). Approve there to save limits on BSC.', { autoClose: 8000 });
      const result = await setTokenLimitsOnChain(walletAddress, tokenLimits.token, maxPerTrade, dailyMax);
      
      toast.success('Token limits saved on BSC. Reload to verify.', {
        onClick: () => window.open(`https://bscscan.com/tx/${result.hash}`, '_blank')
      });
      setTokenLimits({ token: '', maxPerTrade: '', dailyMax: '' });
      if (loadLimitsFromBackendRef.current) await loadLimitsFromBackendRef.current();
    } catch (error) {
      console.error('Failed to save token limits:', error);
      const msg = error?.message || '';
      let hint = '';
      if (msg.includes('account mismatch') || msg.includes('Wallet mismatch')) {
        hint = ' Disconnect in header, click Connect, choose MetaMask, then Save Limits again.';
      } else if (msg.includes('Wallet not connected') || msg.includes('not connected') || msg.includes('not available')) {
        hint = ' Connect wallet in header (Connect → MetaMask), then try again.';
      } else if (msg.includes('rejected') || msg.includes('denied')) {
        hint = ' You rejected the request. Click Save Limits again and approve in the popup.';
      }
      toast.error((msg || 'Failed to save token limits') + hint);
    } finally {
      setSavingTokenLimits(false);
    }
  }, [walletAddress, tokenLimits]);

  const handleSaveUsdTradeLimits = useCallback(async () => {
    const minUsd = usdTradeLimits.minUsd ? Number(usdTradeLimits.minUsd) : null;
    const maxUsd = usdTradeLimits.maxUsd ? Number(usdTradeLimits.maxUsd) : null;
    const dailyCapUsd = usdTradeLimits.dailyCapUsd ? Number(usdTradeLimits.dailyCapUsd) : null;

    if (minUsd != null && (!Number.isFinite(minUsd) || minUsd < 0)) {
      toast.error('Min Trade USD must be a non-negative number');
      return;
    }
    if (maxUsd != null && (!Number.isFinite(maxUsd) || maxUsd < 0)) {
      toast.error('Max Trade USD must be a positive number. 0 or empty disables the cap and is blocked for safety.');
      return;
    }
    if (dailyCapUsd != null && (!Number.isFinite(dailyCapUsd) || dailyCapUsd < 0)) {
      toast.error('Daily USD Cap must be a positive number. 0 or empty disables the cap and is blocked for safety.');
      return;
    }
    if (minUsd != null && maxUsd != null && minUsd > 0 && maxUsd > 0 && minUsd > maxUsd) {
      toast.error('Min Trade USD cannot be greater than Max Trade USD');
      return;
    }

    const maxTradesPer12hVal = usdTradeLimits.maxTradesPer12h ? (parseInt(usdTradeLimits.maxTradesPer12h, 10) || null) : null;
    if (maxTradesPer12hVal != null && (maxTradesPer12hVal < 1 || maxTradesPer12hVal > 12)) {
      toast.error('Max trades per 12h must be between 1 and 12');
      return;
    }

    const riskLimits = getRequiredUsdRiskLimits(usdTradeLimits);
    if (!riskLimits.ok) {
      toast.error(riskLimits.errors.join(' '));
      return;
    }

    const cacheUsdLimits = () => {
      try {
        if (usdLimitsStorageKey) {
          localStorage.setItem(
            usdLimitsStorageKey,
            JSON.stringify({
              minUsd: minUsd != null ? String(minUsd) : '',
              maxUsd: maxUsd != null ? String(maxUsd) : '',
              dailyCapUsd: dailyCapUsd != null ? String(dailyCapUsd) : '',
              maxTradesPer12h: maxTradesPer12hVal != null ? String(maxTradesPer12hVal) : ''
            })
          );
        }
      } catch (_) { /* non-blocking */ }
    };

    if (walletAddress && isAuthenticated) {
      setSaving(true);
      try {
        const sessionRes = await setAutoSession(walletAddress, !!policy.enabled, {
          minProfitOverGasPercent: policy.profitTier ?? OTA_AUTO_DEFAULT_PROFIT_TIER,
          maxLossPercent: normalizeAutoLossLimit(policy.lossLimit),
          usdMinPerTrade: minUsd,
          usdMaxPerTrade: riskLimits.maxUsd,
          usdDailyCap: riskLimits.dailyCapUsd,
          maxTradesPer12h: riskLimits.maxTradesPer12h
        });
        cacheUsdLimits();
        toast.success('USD limits au fost trimise la backend (Render).', { autoClose: 4000 });
        const fromSession = sessionRes && (sessionRes.usdMinPerTrade != null || sessionRes.usdMaxPerTrade != null || sessionRes.usdDailyCap != null || sessionRes.maxTradesPer12h != null);
        const limitsPersisted = sessionRes?.limitsPersisted === true;
        if (limitsPersisted || fromSession) {
          const confirmed = await getPolicyFromBackendOnly(walletAddress).catch(() => null);
          if (loadLimitsFromBackendRef.current) await loadLimitsFromBackendRef.current();
          const min = confirmed?.usdMinPerTrade != null ? String(confirmed.usdMinPerTrade) : '—';
          const max = confirmed?.usdMaxPerTrade != null ? String(confirmed.usdMaxPerTrade) : '—';
          const daily = confirmed?.usdDailyCap != null ? String(confirmed.usdDailyCap) : '—';
          const per12h = confirmed?.maxTradesPer12h != null ? String(confirmed.maxTradesPer12h) : '—';
          toast.success(`Backend-server a confirmat salvarea: Min ${min}, Max ${max}, Daily cap ${daily}, Max/12h ${per12h}.`, { autoClose: 6000 });
        } else if (sessionRes?.limitsPersisted === false && sessionRes?.limitsError) {
          toast.warn(`USD limits sent but server could not save: ${sessionRes.limitsError}`);
        } else {
          const fromPolicy = await getPolicyFromBackendOnly(walletAddress).catch(() => null);
          const hasOnServer = fromPolicy && (
            (fromPolicy.usdMinPerTrade !== undefined && fromPolicy.usdMinPerTrade !== null) ||
            (fromPolicy.usdMaxPerTrade !== undefined && fromPolicy.usdMaxPerTrade !== null) ||
            (fromPolicy.usdDailyCap !== undefined && fromPolicy.usdDailyCap !== null) ||
            (fromPolicy.maxTradesPer12h !== undefined && fromPolicy.maxTradesPer12h !== null)
          );
          if (hasOnServer) {
            if (loadLimitsFromBackendRef.current) await loadLimitsFromBackendRef.current();
            const min = fromPolicy?.usdMinPerTrade != null ? String(fromPolicy.usdMinPerTrade) : '—';
            const max = fromPolicy?.usdMaxPerTrade != null ? String(fromPolicy.usdMaxPerTrade) : '—';
            const daily = fromPolicy?.usdDailyCap != null ? String(fromPolicy.usdDailyCap) : '—';
            const per12h = fromPolicy?.maxTradesPer12h != null ? String(fromPolicy.maxTradesPer12h) : '—';
            toast.success(`Backend-server a confirmat salvarea: Min ${min}, Max ${max}, Daily cap ${daily}, Max/12h ${per12h}.`, { autoClose: 6000 });
          } else {
            toast.warn(
              'USD limits sent but server did not confirm. Redeploy backend-server on Render, then run migrations 044 & 046 on Render PostgreSQL (see backend-server/docs/RENDER_RUN_MIGRATIONS_044_045_046.sql).',
              { autoClose: 8000 }
            );
          }
        }
      } catch (_) {
        toast.error('Save failed – request did not reach server. Check connection and backend URL.');
      } finally {
        setSaving(false);
      }
      return;
    }

    cacheUsdLimits();
    toast.success('USD limits saved. Connect wallet and save again to sync to backend.');
  }, [usdTradeLimits, usdLimitsStorageKey, policy, walletAddress, isAuthenticated]);

  const handleForceOpenNow = useCallback(async () => {
    if (!walletAddress || !isAuthenticated) {
      openAccessRequirementsModal({
        title: 'Cannot use Force Open',
        checks: [
          { ok: false, label: 'Wallet connected', fix: 'Connect the active OTA wallet.' }
        ]
      });
      return;
    }
    const openCount = Array.isArray(openPositionData) ? openPositionData.length : (openPositionData ? 1 : 0);
    const maxPositions = 3;
    if (openCount >= maxPositions) {
      openAccessRequirementsModal({
        title: 'Force Open blocked',
        checks: [
          { ok: true, label: 'Wallet connected' },
          { ok: false, label: `Open positions (${maxPositions} max)`, fix: `Close one position in Open Orders, then try again. You have ${openCount}/${maxPositions}.` }
        ]
      });
      return;
    }

    const token = advisoryToken || 'BNB';
    const quote = directEntryQuoteToken || 'USDT';
    const vaultBal = getVaultBalanceNumber(quote);

    const riskLimits = getRequiredUsdRiskLimits(usdTradeLimits);
    if (!riskLimits.ok) {
      openAccessRequirementsModal({
        title: 'Force Open blocked by safety limits',
        checks: [
          { ok: true, label: 'Wallet connected' },
          { ok: false, label: 'USD risk limits required', fix: riskLimits.errors.join(' ') }
        ],
        hint: 'Force Open is a real position. Set and save Max Trade USD + Daily USD Cap before using it.'
      });
      return;
    }

    const minUsd = parsePositiveNumber(usdTradeLimits.minUsd);
    const targetUsd = Math.min(minUsd || riskLimits.maxUsd, riskLimits.maxUsd);
    let amount = usdToQuoteAmount(targetUsd, quote, authDisplayPrices);
    if (amount == null) {
      openAccessRequirementsModal({
        title: 'Force Open blocked',
        checks: [
          { ok: false, label: `${quote} USD price unavailable`, fix: `Wait for the ${quote} price to load, or switch quote to USDT.` }
        ]
      });
      return;
    }
    amount = parseFloat(amount.toFixed(amount >= 1 ? 4 : 6));
    if (vaultBal <= 0 || amount > vaultBal) {
      openAccessRequirementsModal({
        title: 'Force Open blocked',
        checks: [
          { ok: true, label: 'Wallet connected' },
          { ok: false, label: `Vault balance (${quote})`, fix: `Need about ${amount} ${quote} for the $${targetUsd.toFixed(2)} capped test trade. Deposit ${quote} or lower Max Trade USD.` }
        ]
      });
      return;
    }

    const slippageBps = Math.max(100, Math.min(OTA_AUTO_FORCE_MAX_SLIPPAGE_BPS, clampAutoSlippageBps(policy.maxSlippageBps)));
    const ADDRESS_ZERO = ethers.constants?.AddressZero || '0x0000000000000000000000000000000000000000';
    const USDT_ADDR = TOKEN_REGISTRY.USDT?.address;

    const alKey = walletAddress ? `ota_allowlist_${walletAddress.toLowerCase()}` : null;
    const saveAllowlistDirect = (tokens, pairs) => {
      if (!alKey) return;
      try { localStorage.setItem(alKey, JSON.stringify({ tokens, pairs })); } catch (_) {}
    };

    setSaving(true);
    try {
      console.log('[ForceOpen] START', { token, quote, amount, slippageBps, wallet: walletAddress?.slice(0, 12) });

      let localTokens = [...tokenAllowlist];
      let localPairs = [...pairAllowlist];

      if (quote === 'BNB') {
        const hasNative = localTokens.some(t => String(t).toLowerCase() === ADDRESS_ZERO.toLowerCase());
        if (!hasNative) {
          if (!(await isTokenAllowedOnChain(walletAddress, ADDRESS_ZERO))) {
            toast.info('Allowlist: authorizing BNB – sign in wallet…', { autoClose: 12000 });
            await setTokenAllowed(walletAddress, ADDRESS_ZERO, true);
            toast.dismiss();
          }
          localTokens = [...localTokens, ADDRESS_ZERO];
          setTokenAllowlist(localTokens);
          saveAllowlistDirect(localTokens, localPairs);
        }
        const baseAddr = getTokenAddress(token);
        if (baseAddr && !localTokens.some(t => String(t).toLowerCase() === baseAddr.toLowerCase())) {
          if (!(await isTokenAllowedOnChain(walletAddress, baseAddr))) {
            toast.info(`Allowlist: authorizing ${token} – sign in wallet…`, { autoClose: 12000 });
            await setTokenAllowed(walletAddress, baseAddr, true);
            toast.dismiss();
          }
          localTokens = [...localTokens, baseAddr];
          setTokenAllowlist(localTokens);
          saveAllowlistDirect(localTokens, localPairs);
        }
        if (baseAddr && !localPairs.some(p => String(p.tokenIn).toLowerCase() === ADDRESS_ZERO.toLowerCase() && String(p.tokenOut).toLowerCase() === baseAddr.toLowerCase())) {
          if (!(await isPairAllowedOnChain(walletAddress, ADDRESS_ZERO, baseAddr))) {
            toast.info(`Allowlist: authorizing BNB→${token} pair – sign in wallet…`, { autoClose: 12000 });
            await setPairAllowed(walletAddress, ADDRESS_ZERO, baseAddr, true);
            toast.dismiss();
          }
          localPairs = [...localPairs, { tokenIn: ADDRESS_ZERO, tokenOut: baseAddr }];
          setPairAllowlist(localPairs);
          saveAllowlistDirect(localTokens, localPairs);
        }
      } else if ((quote === 'USDT' || quote === 'ETH') && token === 'BNB') {
        const quoteAddr = quote === 'USDT' ? USDT_ADDR : getTokenAddress('ETH');
        if (quoteAddr) {
          if (!localTokens.some(t => String(t).toLowerCase() === quoteAddr.toLowerCase())) {
            if (!(await isTokenAllowedOnChain(walletAddress, quoteAddr))) {
              toast.info(`Allowlist: authorizing ${quote} – sign in wallet…`, { autoClose: 12000 });
              await setTokenAllowed(walletAddress, quoteAddr, true);
              toast.dismiss();
            }
            localTokens = [...localTokens, quoteAddr];
            setTokenAllowlist(localTokens);
            saveAllowlistDirect(localTokens, localPairs);
          }
          if (!localTokens.some(t => String(t).toLowerCase() === ADDRESS_ZERO.toLowerCase())) {
            if (!(await isTokenAllowedOnChain(walletAddress, ADDRESS_ZERO))) {
              toast.info('Allowlist: authorizing BNB – sign in wallet…', { autoClose: 12000 });
              await setTokenAllowed(walletAddress, ADDRESS_ZERO, true);
              toast.dismiss();
            }
            localTokens = [...localTokens, ADDRESS_ZERO];
            setTokenAllowlist(localTokens);
            saveAllowlistDirect(localTokens, localPairs);
          }
          if (!localPairs.some(p => String(p.tokenIn).toLowerCase() === quoteAddr.toLowerCase() && String(p.tokenOut).toLowerCase() === ADDRESS_ZERO.toLowerCase())) {
            if (!(await isPairAllowedOnChain(walletAddress, quoteAddr, ADDRESS_ZERO))) {
              toast.info(`Allowlist: authorizing ${quote}→BNB pair – sign in wallet…`, { autoClose: 12000 });
              await setPairAllowed(walletAddress, quoteAddr, ADDRESS_ZERO, true);
              toast.dismiss();
            }
            localPairs = [...localPairs, { tokenIn: quoteAddr, tokenOut: ADDRESS_ZERO }];
            setPairAllowlist(localPairs);
            saveAllowlistDirect(localTokens, localPairs);
          }
        }
      } else {
        const quoteAddr = quote === 'USDT' ? USDT_ADDR : getTokenAddress(quote);
        const baseAddr = getTokenAddress(token);
        if (quoteAddr && !localTokens.some(t => String(t).toLowerCase() === quoteAddr.toLowerCase())) {
          const onChainOk = await isTokenAllowedOnChain(walletAddress, quoteAddr);
          if (!onChainOk) {
            toast.info(`Allowlist: authorizing ${quote} – sign in wallet…`, { autoClose: 12000 });
            await setTokenAllowed(walletAddress, quoteAddr, true);
            toast.dismiss();
          }
          localTokens = [...localTokens, quoteAddr];
          setTokenAllowlist(localTokens);
          saveAllowlistDirect(localTokens, localPairs);
        }
        if (baseAddr && !localTokens.some(t => String(t).toLowerCase() === baseAddr.toLowerCase())) {
          const onChainOk = await isTokenAllowedOnChain(walletAddress, baseAddr);
          if (!onChainOk) {
            toast.info(`Allowlist: authorizing ${token} – sign in wallet…`, { autoClose: 12000 });
            await setTokenAllowed(walletAddress, baseAddr, true);
            toast.dismiss();
          }
          localTokens = [...localTokens, baseAddr];
          setTokenAllowlist(localTokens);
          saveAllowlistDirect(localTokens, localPairs);
        }
        if (quoteAddr && baseAddr && !localPairs.some(p => String(p.tokenIn).toLowerCase() === quoteAddr.toLowerCase() && String(p.tokenOut).toLowerCase() === baseAddr.toLowerCase())) {
          const onChainOk = await isPairAllowedOnChain(walletAddress, quoteAddr, baseAddr);
          if (!onChainOk) {
            toast.info(`Allowlist: authorizing ${quote}→${token} pair – sign in wallet…`, { autoClose: 12000 });
            await setPairAllowed(walletAddress, quoteAddr, baseAddr, true);
            toast.dismiss();
          }
          localPairs = [...localPairs, { tokenIn: quoteAddr, tokenOut: baseAddr }];
          setPairAllowlist(localPairs);
          saveAllowlistDirect(localTokens, localPairs);
        }
      }

      console.log('[ForceOpen] Checking policy configuration...');
      toast.info(`Checking policy configuration…`, { autoClose: 15000 });
      const polFix = await ensurePolicyConfigured(walletAddress);
      if (polFix?.fixed) {
        toast.dismiss();
        toast.success('Policy auto-corrected on-chain (slippage + trade size).', { autoClose: 5000 });
        console.log('[ForceOpen] Policy auto-corrected OK');
      } else {
        console.log('[ForceOpen] Policy already OK, no fix needed');
        toast.dismiss();
      }

      toast.info(`Opening ${token} position (${amount} ${quote})…`, { autoClose: 20000 });

      const wiring = await getDirectEntryExecutionWiringStatus(executorBotAddress, walletAddress).catch(() => null);
      if (wiring) {
        if (!wiring.hasPancakeRouter) {
          const routerAddr = CONTRACT_MAP?.PANCAKE_ROUTER?.address;
          if (!routerAddr) throw new Error('PancakeRouter address not configured in CONTRACT_MAP.');
          toast.dismiss();
          toast.info('Setting PancakeSwap Router on UserVault – sign in wallet…', { autoClose: 20000 });
          await setPancakeRouterOnVault(routerAddr);
          toast.dismiss();
          toast.success('PancakeSwap Router configured on-chain.', { autoClose: 4000 });
        }
        const problems = [];
        if (!wiring.hasDexWrapper) problems.push('UserVault.dexWrapper is not configured.');
        if (wiring.executorAddress && wiring.executorAuthorized === false) problems.push(`Executor ${wiring.executorAddress} not authorized in UserVault.`);
        if (problems.length > 0) {
          throw new Error(`${problems.join(' ')} Re-authorize bot in OTA Access Control, then retry.`);
        }

        const autoExecAddr = CONTRACT_MAP?.OTA_AUTO_EXECUTOR?.address;
        if (autoExecAddr) {
          if (wiring.execRegisteredInAC === false) {
            toast.dismiss();
            toast.info(`Registering OTAAutoExecutor in AccessControl – sign in wallet (1/2)…`, { autoClose: 20000 });
            console.log('[ForceOpen] Step 1: Register OTAAutoExecutor in AccessControl:', autoExecAddr);
            await registerBotInAccessControl(autoExecAddr);
            toast.dismiss();
            toast.success('OTAAutoExecutor registered in AccessControl.', { autoClose: 4000 });
          }

          const exAuth = wiring.executorBotAuth;
          const execNeedsBotAuth = !exAuth || !exAuth.isActive
            || (exAuth.maxAmount === '0' && exAuth.usedAmount === '0');
          const execMaxBN = exAuth?.maxAmount ? ethers.BigNumber.from(exAuth.maxAmount) : ethers.BigNumber.from(0);
          const execUsedBN = exAuth?.usedAmount ? ethers.BigNumber.from(exAuth.usedAmount) : ethers.BigNumber.from(0);
          const execRemainingBN = execMaxBN.gt(execUsedBN) ? execMaxBN.sub(execUsedBN) : ethers.BigNumber.from(0);
          const tradeAmtBN = ethers.utils.parseUnits(String(amount), 18);

          if (execNeedsBotAuth || tradeAmtBN.gt(execRemainingBN)) {
            const neededAmt = Math.max(Number(amount) * 2, 100);
            toast.dismiss();
            toast.info(`Authorizing OTAAutoExecutor as bot on UserVault – sign in wallet…`, { autoClose: 20000 });
            console.log('[ForceOpen] Step 2: Authorize OTAAutoExecutor as bot on UserVault:', autoExecAddr, neededAmt);
            await reauthorizeBotOnVault(autoExecAddr, String(neededAmt));
            toast.dismiss();
            toast.success('OTAAutoExecutor authorized as bot on UserVault.', { autoClose: 4000 });
          }
        }

        const callerAuth = wiring.callerBotAuth;
        const callerNeedsAuth = !callerAuth || !callerAuth.isActive
          || (callerAuth.maxAmount === '0' && callerAuth.usedAmount === '0');

        if (executorBotAddress) {
          const callerMaxBN = callerAuth?.maxAmount ? ethers.BigNumber.from(callerAuth.maxAmount) : ethers.BigNumber.from(0);
          const callerUsedBN = callerAuth?.usedAmount ? ethers.BigNumber.from(callerAuth.usedAmount) : ethers.BigNumber.from(0);
          const callerRem = callerMaxBN.gt(callerUsedBN) ? callerMaxBN.sub(callerUsedBN) : ethers.BigNumber.from(0);
          const tradeAmtBN2 = ethers.utils.parseUnits(String(amount), 18);

          if (callerNeedsAuth || tradeAmtBN2.gt(callerRem)) {
            const neededAmt = Math.max(Number(amount) * 2, 100);
            toast.dismiss();
            toast.info(`Authorizing backend bot on UserVault – sign in wallet…`, { autoClose: 20000 });
            console.log('[ForceOpen] Step 3: Authorize caller BOT on UserVault:', executorBotAddress, neededAmt);
            await reauthorizeBotOnVault(executorBotAddress, String(neededAmt));
            toast.dismiss();
            toast.success('Backend bot authorized on UserVault.', { autoClose: 4000 });
          }
        }
      }

      toast.info(`Opening ${token} position (${amount} ${quote})…`, { autoClose: 20000 });
      const maxLossPct = forceOpenMaxLossPct === '' || forceOpenMaxLossPct == null ? undefined : Number(forceOpenMaxLossPct);
      const quoteAddr = quote === 'BNB' ? WBNB_BSC : (TOKEN_REGISTRY[quote]?.address ?? null);
      const tokenAddr = OTA_LIMITS_TOKENS.find((t) => t.symbol === token)?.address ?? TOKEN_REGISTRY[token]?.address ?? null;
      const path2Hop = quoteAddr && tokenAddr ? [quoteAddr, tokenAddr] : null;
      const result = await directEntryOpen(walletAddress, token, amount, quote, slippageBps, maxLossPct, path2Hop);
      console.log('[ForceOpen] SUCCESS', { positionId: result?.positionId, txHash: result?.txHash });

      setHasOpenPosition(true);
      if (result) {
        setOpenPositionData({
          ...result,
          id: result.id || result.positionId || result._id,
          status: result.status || 'open',
          token: result.token || token,
        });
      }
      refetchVault?.();
      toast.dismiss();
      toast.success(`Position opened: ${token} (${amount} ${quote})`, {
        onClick: result?.txHash ? () => window.open(`https://bscscan.com/tx/${result.txHash}`, '_blank') : undefined
      });
      try {
        window.dispatchEvent(new CustomEvent('ota-direct-entry-opened', { detail: { walletAddress } }));
      } catch (_) {}
    } catch (err) {
      console.error('[ForceOpen] ERROR', err?.message, err?.debug, err?.code);
      toast.dismiss();

      const dbg = err?.debug || err?.responseBody?.debug || {};
      const realReason = dbg.originalError || dbg.decodedRevertReason || null;
      const backendCode = err?.code || dbg.code || null;
      const vaultInfo = dbg.vaultBalanceUsdt != null ? `Vault: ${dbg.vaultBalanceUsdt} ${dbg.quoteToken || ''}`.trim() : null;
      const hint = err?.hint || dbg.noRevertMessageHint || null;
      const msg = (realReason || err?.message || '').toLowerCase();
      const isInsufficientGas = backendCode === 'INSUFFICIENT_FUNDS' ||
        (msg.includes('insufficient funds') &&
          (msg.includes('intrinsic') || msg.includes('transaction cost') || msg.includes('gas')));

      const gasFix = isInsufficientGas
        ? 'Gas is paid by the server bot wallet that executes the trade. Your wallet has BNB; if you still see this, the server executor wallet on Render is out of BNB – fund the bot wallet (BOT_WALLET / BSC) with ~0.01–0.05 BNB. Or try again later.'
        : (realReason ? `${realReason}${backendCode ? ` (${backendCode})` : ''}` : (err?.message || 'Retry or check backend logs.'));

      const checks = [
        { ok: true, label: 'Wallet connected' },
        { ok: !isInsufficientGas, label: isInsufficientGas ? 'Executor bot wallet has BNB for gas' : (realReason || err?.message || 'Trade execution failed'),
          fix: gasFix },
      ];
      if (vaultInfo) {
        checks.push({ ok: true, label: vaultInfo });
      }
      if (dbg.botAuthorized != null) {
        checks.push({ ok: dbg.botAuthorized, label: 'Bot authorized', fix: dbg.botAuthorized ? undefined : 'Authorize bot first.' });
      }

      const title = backendCode === 'OTA_GUARD_MAX_EXECUTIONS_24H'
        ? 'Daily execution limit reached'
        : 'Force Open failed';

      openAccessRequirementsModal({
        title,
        checks,
        hint: [realReason, hint, backendCode ? `Code: ${backendCode}` : null].filter(Boolean).join(' | ') || err?.message
      });
    } finally {
      setSaving(false);
    }
  }, [walletAddress, isAuthenticated, openPositionData, advisoryToken, directEntryQuoteToken, forceOpenMaxLossPct,
      usdTradeLimits, getVaultBalanceNumber, policy, refetchVault, openAccessRequirementsModal, authDisplayPrices,
      tokenAllowlist, pairAllowlist, executorBotAddress, executorAuth]);

  useEffect(() => {
    if (!usdLimitsStorageKey) return;
    try {
      const raw = localStorage.getItem(usdLimitsStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const cachedMaxUsd = parsed?.maxUsd === '0.5' ? '' : (parsed?.maxUsd ?? '');
      setUsdTradeLimits({
        minUsd: parsed?.minUsd ?? '',
        maxUsd: cachedMaxUsd,
        dailyCapUsd: parsed?.dailyCapUsd ?? '',
        maxTradesPer12h: parsed?.maxTradesPer12h ?? ''
      });
    } catch (_) { /* ignore invalid cache */ }
  }, [usdLimitsStorageKey]);
  
  // Allowlist localStorage key
  const allowlistStorageKey = useMemo(() => walletAddress ? `ota_allowlist_${walletAddress.toLowerCase()}` : null, [walletAddress]);
  
  // Normalize & dedupe: 0x0 → full form, remove duplicate pairs/tokens. Supports tokenIn/tokenOut, token_in/token_out, [in,out].
  const normalizeAndDedupeAllowlist = useCallback((tokens, pairs) => {
    const norm = (a) => {
      const v = a?.address ?? a;
      return normalizeAllowlistAddress(v) || null;
    };
    const tNorm = Array.isArray(tokens)
      ? [...new Set(tokens.map(t => norm(t)).filter(Boolean))]
      : [];
    const seen = new Set();
    const getPairAddrs = (p) => {
      if (Array.isArray(p)) return [norm(p[0]), norm(p[1])];
      const ti = norm(p?.tokenIn ?? p?.token_in);
      const to = norm(p?.tokenOut ?? p?.token_out);
      return [ti, to];
    };
    const pNorm = Array.isArray(pairs)
      ? pairs
          .map(p => {
            const [ti, to] = getPairAddrs(p);
            if (!ti || !to) return null;
            const key = `${ti.toLowerCase()}|${to.toLowerCase()}`;
            if (seen.has(key)) return null;
            seen.add(key);
            return { tokenIn: ti, tokenOut: to };
          })
          .filter(Boolean)
      : [];
    return { tokens: tNorm, pairs: pNorm };
  }, []);

  // Load allowlist on mount/wallet change:
  // 1) Immediately from localStorage (fast, synchronous)
  // 2) Then fetch from backend (getPolicy) and merge – catches the case where
  //    localStorage is empty (new device/cleared cache) but allowlist was already
  //    configured on-chain in a previous session. Without this, the user would be
  //    asked to sign 3 MetaMask transactions every new session even though they
  //    already set up the allowlist before.
  useEffect(() => {
    if (!allowlistStorageKey || !walletAddress) return;
    // Step 1: fast local load
    try {
      const raw = localStorage.getItem(allowlistStorageKey);
      if (raw) {
        const data = JSON.parse(raw);
        const { tokens, pairs } = normalizeAndDedupeAllowlist(data.tokens, data.pairs);
        setTokenAllowlist(tokens);
        setPairAllowlist(pairs);
        localStorage.setItem(allowlistStorageKey, JSON.stringify({ tokens, pairs }));
      }
    } catch (_) { /* ignore */ }
    // Step 2: fetch from backend and merge (async, non-blocking)
    let cancelled = false;
    getPolicy(walletAddress).then((policyData) => {
      if (cancelled || !policyData) return;
      const tokensFromPolicy = policyData?.tokenAllowlist ?? policyData?.tokens;
      const pairsFromPolicy = policyData?.pairAllowlist ?? policyData?.pairs;
      if (!Array.isArray(tokensFromPolicy) && !Array.isArray(pairsFromPolicy)) return;
      try {
        const raw = localStorage.getItem(allowlistStorageKey);
        let stored = { tokens: [], pairs: [] };
        if (raw) try { stored = JSON.parse(raw); } catch (_) {}
        const mergedTokens = [...(stored.tokens ?? []), ...(Array.isArray(tokensFromPolicy) ? tokensFromPolicy : [])];
        const mergedPairs = [...(stored.pairs ?? []), ...(Array.isArray(pairsFromPolicy) ? pairsFromPolicy : [])];
        const { tokens, pairs } = normalizeAndDedupeAllowlist(mergedTokens, mergedPairs);
        setTokenAllowlist(tokens);
        setPairAllowlist(pairs);
        localStorage.setItem(allowlistStorageKey, JSON.stringify({ tokens, pairs }));
        if (DE_DEBUG && isDev) console.log('[DE] allowlist loaded from backend', { tokens: tokens.length, pairs: pairs.length });
      } catch (_) { /* ignore */ }
    }).catch(() => { /* backend optional – fallback already done via localStorage */ });
    return () => { cancelled = true; };
  }, [allowlistStorageKey, walletAddress, normalizeAndDedupeAllowlist]);

  // Reload allowlist from localStorage when user opens Allowlist tab (avoids stale state after add)
  const loadAllowlistFromStorage = useCallback(() => {
    if (!allowlistStorageKey) return;
    try {
      const raw = localStorage.getItem(allowlistStorageKey);
      if (raw) {
        const data = JSON.parse(raw);
        const { tokens, pairs } = normalizeAndDedupeAllowlist(data.tokens, data.pairs);
        setTokenAllowlist(tokens);
        setPairAllowlist(pairs);
        localStorage.setItem(allowlistStorageKey, JSON.stringify({ tokens, pairs }));
      }
    } catch (_) { /* ignore */ }
  }, [allowlistStorageKey, normalizeAndDedupeAllowlist]);

  // Verify approvals: read approved items from blockchain and set the list to exact on-chain approvals.
  const [verifyingAllowlist, setVerifyingAllowlist] = useState(false);
  const allowlistFetchedFromContractRef = useRef(false);
  useEffect(() => {
    allowlistFetchedFromContractRef.current = false;
  }, [walletAddress]);

  const syncAllowlistFromContract = useCallback(async (silent = false) => {
    if (!walletAddress || !allowlistStorageKey) return;
    if (!silent) setVerifyingAllowlist(true);
    try {
      const recommendedTokens = Array.isArray(ALLOWLIST_TOKEN_ADDRESSES) && ALLOWLIST_TOKEN_ADDRESSES.length > 0
        ? [...ALLOWLIST_TOKEN_ADDRESSES]
        : [(ethers.constants?.AddressZero || '0x0000000000000000000000000000000000000000'), TOKEN_REGISTRY?.USDT?.address, '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', TOKEN_REGISTRY?.SOL?.address].filter(Boolean);
      const { tokens: tokensToCheck } = normalizeAndDedupeAllowlist([...recommendedTokens, ...tokenAllowlist], []);
      const addrs = Array.isArray(ALLOWLIST_TOKEN_ADDRESSES) && ALLOWLIST_TOKEN_ADDRESSES.length > 0
        ? ALLOWLIST_TOKEN_ADDRESSES
        : recommendedTokens;
      const allPairCandidates = [];
      for (let i = 0; i < addrs.length; i++) {
        for (let j = 0; j < addrs.length; j++) {
          if (i !== j) {
            const ti = addrs[i];
            const to = addrs[j];
            if (normalizeAllowlistAddress(ti) !== normalizeAllowlistAddress(to)) {
              allPairCandidates.push({ tokenIn: ti, tokenOut: to });
            }
          }
        }
      }
      const { pairs: pairsToCheck } = normalizeAndDedupeAllowlist([], allPairCandidates);
      const allowedTokens = [];
      for (const addr of tokensToCheck) {
        if (await isTokenAllowedOnChain(walletAddress, addr)) allowedTokens.push(addr);
      }
      const allowedPairs = [];
      for (const p of pairsToCheck) {
        if (await isPairAllowedOnChain(walletAddress, p.tokenIn, p.tokenOut)) allowedPairs.push(p);
      }
      setTokenAllowlist(allowedTokens);
      setPairAllowlist(allowedPairs);
      persistAllowlistRef.current?.(allowedTokens, allowedPairs);
      try {
        localStorage.setItem(allowlistStorageKey, JSON.stringify({ tokens: allowedTokens, pairs: allowedPairs }));
      } catch (_) { /* ignore */ }
      if (!silent) toast.success(`On-chain approvals loaded: ${allowedTokens.length} token(s), ${allowedPairs.length} pairs.`);
    } catch (err) {
      console.error('[Allowlist] Verify on-chain failed:', err);
      if (!silent) toast.error(getUserFriendlyError(err) || 'Could not read approvals from blockchain.');
    } finally {
      if (!silent) setVerifyingAllowlist(false);
    }
  }, [walletAddress, allowlistStorageKey, tokenAllowlist, normalizeAndDedupeAllowlist]);

  const handleVerifyApprovals = useCallback(() => syncAllowlistFromContract(false), [syncAllowlistFromContract]);

  useEffect(() => {
    if (activeTab !== 'allowlist' || !walletAddress || !allowlistStorageKey || allowlistFetchedFromContractRef.current) return;
    allowlistFetchedFromContractRef.current = true;
    syncAllowlistFromContract(true);
  }, [activeTab, walletAddress, allowlistStorageKey, syncAllowlistFromContract]);

  const handleCleanAllowlistDuplicates = useCallback(() => {
    const { tokens, pairs } = normalizeAndDedupeAllowlist(tokenAllowlist, pairAllowlist);
    const prevPairs = pairAllowlist.length;
    const prevTokens = tokenAllowlist.length;
    setTokenAllowlist(tokens);
    setPairAllowlist(pairs);
    persistAllowlistRef.current?.(tokens, pairs);
    const removed = prevPairs - pairs.length + prevTokens - tokens.length;
    if (removed > 0) toast.success(`Cleaned ${removed} duplicate(s). Display fixed.`);
  }, [tokenAllowlist, pairAllowlist, normalizeAndDedupeAllowlist]);
  
  const persistAllowlist = useCallback((tokens, pairs) => {
    if (!allowlistStorageKey) return;
    try {
      let stored = null;
      try {
        const raw = localStorage.getItem(allowlistStorageKey);
        if (raw) stored = JSON.parse(raw);
      } catch (_) { /* ignore */ }
      const tokensRaw = tokens ?? stored?.tokens ?? tokenAllowlist;
      const pairsRaw = pairs ?? stored?.pairs ?? pairAllowlist;
      const { tokens: tokensNorm, pairs: pairsNorm } = normalizeAndDedupeAllowlist(tokensRaw, pairsRaw);
      localStorage.setItem(allowlistStorageKey, JSON.stringify({ tokens: tokensNorm, pairs: pairsNorm }));
    } catch (_) { /* ignore */ }
  }, [allowlistStorageKey, tokenAllowlist, pairAllowlist, normalizeAndDedupeAllowlist]);
  persistAllowlistRef.current = persistAllowlist;
  
  const ADDRESS_ZERO = ethers.constants?.AddressZero || '0x0000000000000000000000000000000000000000';

  const QUOTE_TOKENS = useMemo(() => [ADDRESS_ZERO], []);

  // Add token to allowlist + required pairs (BNB→token) so the user does not need to add them manually.
  const handleAddTokenToAllowlist = useCallback(async (tokenAddress) => {
    if (!walletAddress || !isAuthenticated || !tokenAddress) {
      toast.error('Please connect your wallet and enter a token address');
      return;
    }
    const addr = tokenAddress.trim();
    if (!ethers.utils.isAddress(addr)) {
      toast.error('Invalid token address');
      return;
    }
    if (tokenAllowlist.some(t => t.toLowerCase() === addr.toLowerCase())) {
      toast.info('Token already in allowlist');
      return;
    }
    try {
      if (await isTokenAllowedOnChain(walletAddress, addr)) {
        setTokenAllowlist(prev => {
          if (prev.some(t => t.toLowerCase() === addr.toLowerCase())) return prev;
          const next = [...prev, addr];
          persistAllowlistRef.current?.(next, null);
          return next;
        });
        toast.info('Token already approved on-chain. Added to list.');
        return;
      }
    } catch (_) { /* Continue with approval if verification fails. */ }
    setSaving(true);
    try {
      const result = await setTokenAllowed(walletAddress, addr, true);
      const added = [addr];
      setTokenAllowlist(prev => {
        const next = [...prev, ...added];
        persistAllowlist(next, null);
        return next;
      });
      const isQuoteToken = String(addr).toLowerCase() === ADDRESS_ZERO.toLowerCase();
      if (!isQuoteToken) {
        const pairsToAdd = QUOTE_TOKENS.filter(q => q.toLowerCase() !== addr.toLowerCase()).map(tokenIn => ({ tokenIn, tokenOut: addr }));
        let pairs = [...pairAllowlist];
        let pairCount = 0;
        let pairError = null;
        for (const { tokenIn, tokenOut } of pairsToAdd) {
          const exists = pairs.some(p => String(p.tokenIn).toLowerCase() === tokenIn.toLowerCase() && String(p.tokenOut).toLowerCase() === tokenOut.toLowerCase());
          if (!exists) {
            try {
              const alreadyApproved = await isPairAllowedOnChain(walletAddress, tokenIn, tokenOut);
              if (alreadyApproved) {
                pairs = [...pairs, { tokenIn, tokenOut }];
                setPairAllowlist(pairs);
                persistAllowlist(null, pairs);
                pairCount += 1;
                continue;
              }
            } catch (_) { /* ignore */ }
            try {
              toast.info(`Adding pair… Sign in MetaMask (${pairCount + 1}/${pairsToAdd.length})`, { autoClose: 4000 });
              await setPairAllowed(walletAddress, tokenIn, tokenOut, true);
              pairs = [...pairs, { tokenIn, tokenOut }];
              setPairAllowlist(pairs);
              persistAllowlist(null, pairs);
              pairCount += 1;
            } catch (err) {
              pairError = err;
              break;
            }
          }
        }
        if (pairError) {
          toast.warning('Token added. Some pairs failed – use "Add all pairs for tokens" to retry.', { autoClose: 6000 });
        } else if (pairCount > 0) {
          toast.success(`Token + ${pairCount} pair(s) added. Direct Entry ready.`, {
            onClick: () => window.open(`https://bscscan.com/tx/${result.hash}`, '_blank')
          });
        } else {
          toast.success('Token added to allowlist', {
            onClick: () => window.open(`https://bscscan.com/tx/${result.hash}`, '_blank')
          });
        }
      } else {
        toast.success('Token added to allowlist', {
          onClick: () => window.open(`https://bscscan.com/tx/${result.hash}`, '_blank')
        });
      }
    } catch (error) {
      console.error('[ALLOWLIST_DEBUG] Failed to add token:', {
        error: error?.message,
        failedEndpoint: error?.failedEndpoint,
        failedUrl: error?.failedUrl,
        failedStatus: error?.failedStatus,
        full: error
      });
      if (error?.showRpcRepairModal) {
        setShowRpcRepairModal(true);
        toast.error('Fix BSC RPC in your wallet – see the modal for instructions', { autoClose: 8000 });
      } else {
        toast.error(getUserFriendlyError(error) || 'Failed to add token');
      }
    } finally {
      setSaving(false);
    }
  }, [walletAddress, isAuthenticated, tokenAllowlist, pairAllowlist, persistAllowlist, QUOTE_TOKENS]);
  
  // Remove token from allowlist
  const handleRemoveTokenFromAllowlist = useCallback(async (tokenAddress) => {
    if (!walletAddress || !isAuthenticated) return;
    setSaving(true);
    try {
      await setTokenAllowed(walletAddress, tokenAddress, false);
      setTokenAllowlist(prev => {
        const next = prev.filter(a => a.toLowerCase() !== tokenAddress.toLowerCase());
        persistAllowlist(next, null);
        return next;
      });
      toast.success('Token removed from allowlist');
    } catch (error) {
      console.error('Failed to remove token:', error);
      if (error?.showRpcRepairModal) {
        setShowRpcRepairModal(true);
        toast.error('Fix BSC RPC in your wallet – see the modal for instructions', { autoClose: 8000 });
      } else {
        toast.error(getUserFriendlyError(error) || 'Failed to remove token');
      }
    } finally {
      setSaving(false);
    }
  }, [walletAddress, isAuthenticated, persistAllowlist]);
  
  // Add pair to allowlist
  const handleAddPairToAllowlist = useCallback(async (tokenIn, tokenOut) => {
    if (!walletAddress || !isAuthenticated || !tokenIn || !tokenOut) {
      toast.error('Please connect your wallet and select both tokens');
      return;
    }
    const ti = tokenIn.trim();
    const to = tokenOut.trim();
    if (ti.toLowerCase() === to.toLowerCase()) {
      toast.error('Token In and Token Out must be different');
      return;
    }
    const key = [ti, to].sort().join('|');
    if (pairAllowlist.some(p => [p.tokenIn, p.tokenOut].sort().join('|') === key)) {
      setAllowlistStatusMessage('Pair already exists in the list.');
      toast.info('Pair already exists in the list.');
      return;
    }
    setAllowlistStatusMessage(null);
    try {
      if (await isPairAllowedOnChain(walletAddress, ti, to)) {
        setPairAllowlist(prev => {
          const exists = prev.some(p =>
            (p.tokenIn.toLowerCase() === ti && p.tokenOut.toLowerCase() === to) ||
            (p.tokenIn.toLowerCase() === to && p.tokenOut.toLowerCase() === ti)
          );
          if (exists) return prev;
          const next = [...prev, { tokenIn: ti, tokenOut: to }];
          persistAllowlistRef.current?.(null, next);
          return next;
        });
        setAllowlistStatusMessage('Pair already exists and is approved on-chain. No action needed.');
        toast.info('Pair already exists and is approved on-chain. No action needed.');
        return;
      }
    } catch (_) { /* Continue with approval if verification fails. */ }
    setAllowlistStatusMessage(null);
    setSaving(true);
    try {
      const result = await setPairAllowed(walletAddress, ti, to, true);
      const pairs = [...pairAllowlist, { tokenIn: ti, tokenOut: to }];
      setPairAllowlist(pairs);
      persistAllowlist(null, pairs);
      toast.success('Pair added to allowlist', {
        onClick: () => window.open(`https://bscscan.com/tx/${result.hash}`, '_blank')
      });
    } catch (error) {
      console.error('[ALLOWLIST_DEBUG] Failed to add pair:', {
        error: error?.message,
        failedEndpoint: error?.failedEndpoint,
        failedUrl: error?.failedUrl,
        failedStatus: error?.failedStatus
      });
      if (error?.showRpcRepairModal) {
        setShowRpcRepairModal(true);
        toast.error('Fix BSC RPC in your wallet – see the modal for instructions', { autoClose: 8000 });
      } else {
        toast.error(getUserFriendlyError(error) || 'Failed to add pair');
      }
    } finally {
      setSaving(false);
    }
  }, [walletAddress, isAuthenticated, pairAllowlist, persistAllowlist]);

  const handleLoadTokensFromChain = useCallback((tokens) => {
    if (!Array.isArray(tokens)) return;
    const { tokens: norm } = normalizeAndDedupeAllowlist(tokens, []);
    setTokenAllowlist(norm);
    persistAllowlistRef.current?.(norm, null);
    try {
      if (allowlistStorageKey) localStorage.setItem(allowlistStorageKey, JSON.stringify({ tokens: norm, pairs: pairAllowlist }));
    } catch (_) { /* ignore */ }
    toast.success(`List filled with ${norm.length} token(s) from contract.`);
  }, [allowlistStorageKey, pairAllowlist, normalizeAndDedupeAllowlist]);

  const handleLoadPairsFromChain = useCallback((pairs) => {
    if (!Array.isArray(pairs)) return;
    const { pairs: norm } = normalizeAndDedupeAllowlist([], pairs);
    setPairAllowlist(norm);
    persistAllowlistRef.current?.(null, norm);
    try {
      if (allowlistStorageKey) localStorage.setItem(allowlistStorageKey, JSON.stringify({ tokens: tokenAllowlist, pairs: norm }));
    } catch (_) { /* ignore */ }
    toast.success(`List filled with ${norm.length} pairs from contract.`);
  }, [allowlistStorageKey, tokenAllowlist, normalizeAndDedupeAllowlist]);

  useEffect(() => {
    if (allowlistPairIn || allowlistPairOut) setAllowlistStatusMessage(null);
  }, [allowlistPairIn, allowlistPairOut]);
  
  // Remove pair from allowlist
  const handleRemovePairFromAllowlist = useCallback(async (tokenIn, tokenOut) => {
    if (!walletAddress || !isAuthenticated) return;
    setSaving(true);
    try {
      await setPairAllowed(walletAddress, tokenIn, tokenOut, false);
      setPairAllowlist(prev => {
        const next = prev.filter(p => !(p.tokenIn.toLowerCase() === tokenIn.toLowerCase() && p.tokenOut.toLowerCase() === tokenOut.toLowerCase()));
        persistAllowlist(null, next);
        return next;
      });
      toast.success('Pair removed from allowlist');
    } catch (error) {
      console.error('Failed to remove pair:', error);
      if (error?.showRpcRepairModal) {
        setShowRpcRepairModal(true);
        toast.error('Fix BSC RPC in your wallet – see the modal for instructions', { autoClose: 8000 });
      } else {
        toast.error(getUserFriendlyError(error) || 'Failed to remove pair');
      }
    } finally {
      setSaving(false);
    }
  }, [walletAddress, isAuthenticated, persistAllowlist]);

  // Recommended allowlist: quote tokens + current production OTA baseline.
  const RECOMMENDED_TOKENS = useMemo(() => [
    ADDRESS_ZERO,
    TOKEN_REGISTRY.USDT?.address,
    TOKEN_REGISTRY.BTC?.address,
    TOKEN_REGISTRY.ETH?.address,
    TOKEN_REGISTRY.LINK?.address,
    TOKEN_REGISTRY.XRP?.address,
    TOKEN_REGISTRY.ADA?.address,
    TOKEN_REGISTRY.AVAX?.address,
    TOKEN_REGISTRY.SOL?.address,
    TOKEN_REGISTRY.DOGE?.address
  ].filter(Boolean), []);
  const RECOMMENDED_PAIRS = useMemo(() => [
    { tokenIn: ADDRESS_ZERO, tokenOut: TOKEN_REGISTRY.USDT?.address },
    { tokenIn: TOKEN_REGISTRY.USDT?.address, tokenOut: ADDRESS_ZERO },
    { tokenIn: TOKEN_REGISTRY.USDT?.address, tokenOut: TOKEN_REGISTRY.BTC?.address },
    { tokenIn: TOKEN_REGISTRY.USDT?.address, tokenOut: TOKEN_REGISTRY.ETH?.address },
    { tokenIn: TOKEN_REGISTRY.USDT?.address, tokenOut: TOKEN_REGISTRY.LINK?.address },
    { tokenIn: TOKEN_REGISTRY.USDT?.address, tokenOut: TOKEN_REGISTRY.XRP?.address },
    { tokenIn: TOKEN_REGISTRY.USDT?.address, tokenOut: TOKEN_REGISTRY.ADA?.address },
    { tokenIn: TOKEN_REGISTRY.USDT?.address, tokenOut: TOKEN_REGISTRY.AVAX?.address },
    { tokenIn: TOKEN_REGISTRY.USDT?.address, tokenOut: TOKEN_REGISTRY.SOL?.address },
    { tokenIn: TOKEN_REGISTRY.USDT?.address, tokenOut: TOKEN_REGISTRY.DOGE?.address }
  ].filter(p => p.tokenIn && p.tokenOut), []);

  const handleAddAllRecommendedAllowlist = useCallback(async () => {
    if (!walletAddress || !isAuthenticated) {
      toast.error('Connect your wallet first');
      return;
    }
    const tokensToAdd = RECOMMENDED_TOKENS.filter(addr => !tokenAllowlist.some(t => String(t).toLowerCase() === String(addr).toLowerCase()));
    const pairsToAdd = RECOMMENDED_PAIRS.filter(
      p => !pairAllowlist.some(ex => String(ex.tokenIn).toLowerCase() === String(p.tokenIn).toLowerCase() && String(ex.tokenOut).toLowerCase() === String(p.tokenOut).toLowerCase())
    );
    const total = tokensToAdd.length + pairsToAdd.length;
    if (total === 0) {
      toast.info('Recommended allowlist already set');
      return;
    }
    setSaving(true);
    let tokens = [...tokenAllowlist];
    let pairs = [...pairAllowlist];
    let done = 0;
    try {
      for (const addr of tokensToAdd) {
        toast.info(`Adding token ${done + 1}/${total}… Sign in MetaMask`, { autoClose: 4000 });
        await setTokenAllowed(walletAddress, addr, true);
        if (!tokens.some(t => String(t).toLowerCase() === String(addr).toLowerCase())) tokens = [...tokens, addr];
        setTokenAllowlist(tokens);
        persistAllowlist(tokens, null);
        done += 1;
      }
      for (const p of pairsToAdd) {
        toast.info(`Adding pair ${done + 1}/${total}… Sign in MetaMask`, { autoClose: 4000 });
        await setPairAllowed(walletAddress, p.tokenIn, p.tokenOut, true);
        const exists = pairs.some(ex => String(ex.tokenIn).toLowerCase() === String(p.tokenIn).toLowerCase() && String(ex.tokenOut).toLowerCase() === String(p.tokenOut).toLowerCase());
        if (!exists) pairs = [...pairs, { tokenIn: p.tokenIn, tokenOut: p.tokenOut }];
        setPairAllowlist(pairs);
        persistAllowlist(null, pairs);
        done += 1;
      }
      toast.success(`Recommended allowlist set (${tokensToAdd.length} tokens, ${pairsToAdd.length} pairs). Production baseline: BTC/ETH/BNB/LINK/XRP/ADA/AVAX/SOL/DOGE.`);
    } catch (error) {
      console.error('Recommended allowlist error:', error);
      if (error?.showRpcRepairModal) {
        setShowRpcRepairModal(true);
        toast.error('Fix BSC RPC in your wallet – see the modal for instructions', { autoClose: 8000 });
      } else {
        toast.error(getUserFriendlyError(error) || 'Failed to add recommended allowlist');
      }
    } finally {
      setSaving(false);
    }
  }, [walletAddress, isAuthenticated, tokenAllowlist, pairAllowlist, RECOMMENDED_TOKENS, RECOMMENDED_PAIRS, persistAllowlist]);

  // For each token in the list that is not a quote token, add BNB (0x0)→token pairs if missing.
  const handleAddAllPairsForTokens = useCallback(async () => {
    if (!walletAddress || !isAuthenticated) {
      toast.error('Connect your wallet first');
      return;
    }
    const quoteSet = new Set(QUOTE_TOKENS.map(q => q.toLowerCase()));
    const baseTokens = tokenAllowlist.filter(t => t && !quoteSet.has(String(t).toLowerCase()));
    if (baseTokens.length === 0) {
      toast.info('Add at least one baseline token (for example LINK or SOL) plus a quote token, then use this button to add all pairs.');
      return;
    }
    const pairsToAdd = [];
    for (const tokenOut of baseTokens) {
      for (const tokenIn of QUOTE_TOKENS) {
        if (String(tokenIn).toLowerCase() === String(tokenOut).toLowerCase()) continue;
        const exists = pairAllowlist.some(p => String(p.tokenIn).toLowerCase() === String(tokenIn).toLowerCase() && String(p.tokenOut).toLowerCase() === String(tokenOut).toLowerCase());
        if (!exists) pairsToAdd.push({ tokenIn, tokenOut });
      }
    }
    if (pairsToAdd.length === 0) {
      toast.info('All pairs for your tokens are already in allowlist');
      return;
    }
    setSaving(true);
    let pairs = [...pairAllowlist];
    try {
      let done = 0;
      for (const { tokenIn, tokenOut } of pairsToAdd) {
        toast.info(`Adding pair ${done + 1}/${pairsToAdd.length}… Sign in MetaMask`, { autoClose: 4000 });
        await setPairAllowed(walletAddress, tokenIn, tokenOut, true);
        pairs = [...pairs, { tokenIn, tokenOut }];
        setPairAllowlist(pairs);
        persistAllowlist(null, pairs);
        done += 1;
      }
      toast.success(`${pairsToAdd.length} pair(s) added. All tokens in list are now allowed for Direct Entry.`);
    } catch (error) {
      console.error('Add all pairs error:', error);
      if (error?.showRpcRepairModal) {
        setShowRpcRepairModal(true);
        toast.error('Fix BSC RPC in your wallet – see the modal for instructions', { autoClose: 8000 });
      } else {
        toast.error(getUserFriendlyError(error) || 'Failed to add pairs');
      }
    } finally {
      setSaving(false);
    }
  }, [walletAddress, isAuthenticated, tokenAllowlist, pairAllowlist, persistAllowlist, QUOTE_TOKENS]);

  const CAKE_BSC = '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82';
  const handleAddCakeForDirectEntry = useCallback(async () => {
    if (!walletAddress || !isAuthenticated) {
      toast.error('Connect your wallet first');
      return;
    }
    const needToken = !tokenAllowlist.some(t => String(t).toLowerCase() === CAKE_BSC.toLowerCase());
    const needPairBnb = !pairAllowlist.some(p => String(p.tokenIn).toLowerCase() === ADDRESS_ZERO.toLowerCase() && String(p.tokenOut).toLowerCase() === CAKE_BSC.toLowerCase());
    const total = (needToken ? 1 : 0) + (needPairBnb ? 1 : 0);
    if (total === 0) {
      toast.info('CAKE and BNB→CAKE already in allowlist');
      return;
    }
    setSaving(true);
    let tokens = [...tokenAllowlist];
    let pairs = [...pairAllowlist];
    try {
      if (needToken) {
        toast.info('Adding CAKE… Sign in MetaMask', { autoClose: 4000 });
        await setTokenAllowed(walletAddress, CAKE_BSC, true);
        if (!tokens.some(t => String(t).toLowerCase() === CAKE_BSC.toLowerCase())) tokens = [...tokens, CAKE_BSC];
        setTokenAllowlist(tokens);
        persistAllowlist(tokens, null);
      }
      if (needPairBnb) {
        toast.info('Adding pair BNB→CAKE… Sign in MetaMask', { autoClose: 4000 });
        await setPairAllowed(walletAddress, ADDRESS_ZERO, CAKE_BSC, true);
        if (!pairs.some(p => String(p.tokenIn).toLowerCase() === ADDRESS_ZERO.toLowerCase() && String(p.tokenOut).toLowerCase() === CAKE_BSC.toLowerCase())) pairs = [...pairs, { tokenIn: ADDRESS_ZERO, tokenOut: CAKE_BSC }];
        setPairAllowlist(pairs);
        persistAllowlist(null, pairs);
      }
      toast.success('CAKE and BNB→CAKE pairs added. You can use Direct Entry CAKE/BNB.');
    } catch (error) {
      console.error('Add CAKE allowlist error:', error);
      if (error?.showRpcRepairModal) {
        setShowRpcRepairModal(true);
        toast.error('Fix BSC RPC in your wallet – see the modal for instructions', { autoClose: 8000 });
      } else {
        toast.error(getUserFriendlyError(error) || 'Failed to add CAKE');
      }
    } finally {
      setSaving(false);
    }
  }, [walletAddress, isAuthenticated, tokenAllowlist, pairAllowlist, persistAllowlist]);

  const USDT_BSC = TOKEN_REGISTRY.USDT?.address;
  const handleAddUsdtForDirectEntry = useCallback(async () => {
    if (!walletAddress || !isAuthenticated) {
      toast.error('Connect your wallet first');
      return;
    }
    if (!USDT_BSC) {
      toast.error('USDT address not configured');
      return;
    }
    const needToken = !tokenAllowlist.some(t => String(t).toLowerCase() === USDT_BSC.toLowerCase());
    const needBnbUsdt = !pairAllowlist.some(p => String(p.tokenIn).toLowerCase() === ADDRESS_ZERO.toLowerCase() && String(p.tokenOut).toLowerCase() === USDT_BSC.toLowerCase());
    const needUsdtBnb = !pairAllowlist.some(p => String(p.tokenIn).toLowerCase() === USDT_BSC.toLowerCase() && String(p.tokenOut).toLowerCase() === ADDRESS_ZERO.toLowerCase());
    const total = (needToken ? 1 : 0) + (needBnbUsdt ? 1 : 0) + (needUsdtBnb ? 1 : 0);
    if (total === 0) {
      toast.info('USDT and BNB↔USDT already in allowlist');
      return;
    }
    setSaving(true);
    let tokens = [...tokenAllowlist];
    let pairs = [...pairAllowlist];
    try {
      if (needToken) {
        toast.info('Adding USDT… Sign in MetaMask', { autoClose: 4000 });
        await setTokenAllowed(walletAddress, USDT_BSC, true);
        if (!tokens.some(t => String(t).toLowerCase() === USDT_BSC.toLowerCase())) tokens = [...tokens, USDT_BSC];
        setTokenAllowlist(tokens);
        persistAllowlist(tokens, null);
      }
      if (needBnbUsdt) {
        toast.info('Adding pair BNB→USDT… Sign in MetaMask', { autoClose: 4000 });
        await setPairAllowed(walletAddress, ADDRESS_ZERO, USDT_BSC, true);
        if (!pairs.some(p => String(p.tokenIn).toLowerCase() === ADDRESS_ZERO.toLowerCase() && String(p.tokenOut).toLowerCase() === USDT_BSC.toLowerCase())) pairs = [...pairs, { tokenIn: ADDRESS_ZERO, tokenOut: USDT_BSC }];
        setPairAllowlist(pairs);
        persistAllowlist(null, pairs);
      }
      if (needUsdtBnb) {
        toast.info('Adding pair USDT→BNB… Sign in MetaMask', { autoClose: 4000 });
        await setPairAllowed(walletAddress, USDT_BSC, ADDRESS_ZERO, true);
        if (!pairs.some(p => String(p.tokenIn).toLowerCase() === USDT_BSC.toLowerCase() && String(p.tokenOut).toLowerCase() === ADDRESS_ZERO.toLowerCase())) pairs = [...pairs, { tokenIn: USDT_BSC, tokenOut: ADDRESS_ZERO }];
        setPairAllowlist(pairs);
        persistAllowlist(null, pairs);
      }
      toast.success('USDT and BNB↔USDT pairs added. You can use Direct Entry BNB/USDT.');
    } catch (error) {
      console.error('Add USDT allowlist error:', error);
      if (error?.showRpcRepairModal) {
        setShowRpcRepairModal(true);
        toast.error('Fix BSC RPC in your wallet – see the modal for instructions', { autoClose: 8000 });
      } else {
        toast.error(getUserFriendlyError(error) || 'Failed to add USDT');
      }
    } finally {
      setSaving(false);
    }
  }, [walletAddress, isAuthenticated, tokenAllowlist, pairAllowlist, persistAllowlist, USDT_BSC]);

  const SOL_BSC = TOKEN_REGISTRY.SOL?.address;
  const handleAddSolForDirectEntry = useCallback(async () => {
    if (!walletAddress || !isAuthenticated) {
      toast.error('Connect your wallet first');
      return;
    }
    if (!SOL_BSC || !USDT_BSC) {
      toast.error('SOL or USDT address not configured');
      return;
    }
    const needToken = !tokenAllowlist.some(t => String(t).toLowerCase() === SOL_BSC.toLowerCase());
    const needPairUsdtSol = !pairAllowlist.some(p => String(p.tokenIn).toLowerCase() === USDT_BSC.toLowerCase() && String(p.tokenOut).toLowerCase() === SOL_BSC.toLowerCase());
    const total = (needToken ? 1 : 0) + (needPairUsdtSol ? 1 : 0);
    if (total === 0) {
      toast.info('SOL and USDT→SOL are already in allowlist');
      return;
    }
    setSaving(true);
    let tokens = [...tokenAllowlist];
    let pairs = [...pairAllowlist];
    try {
      if (needToken) {
        toast.info('Adding SOL… Sign in MetaMask', { autoClose: 4000 });
        await setTokenAllowed(walletAddress, SOL_BSC, true);
        if (!tokens.some(t => String(t).toLowerCase() === SOL_BSC.toLowerCase())) tokens = [...tokens, SOL_BSC];
        setTokenAllowlist(tokens);
        persistAllowlist(tokens, null);
      }
      if (needPairUsdtSol) {
        toast.info('Adding pair USDT→SOL… Sign in MetaMask', { autoClose: 4000 });
        await setPairAllowed(walletAddress, USDT_BSC, SOL_BSC, true);
        if (!pairs.some(p => String(p.tokenIn).toLowerCase() === USDT_BSC.toLowerCase() && String(p.tokenOut).toLowerCase() === SOL_BSC.toLowerCase())) pairs = [...pairs, { tokenIn: USDT_BSC, tokenOut: SOL_BSC }];
        setPairAllowlist(pairs);
        persistAllowlist(null, pairs);
      }
      toast.success('SOL and USDT→SOL added. OTA will analyze SOL when enforce allowlist is active.');
    } catch (error) {
      console.error('Add SOL allowlist error:', error);
      if (error?.showRpcRepairModal) {
        setShowRpcRepairModal(true);
        toast.error('Fix BSC RPC in your wallet – see the modal for instructions', { autoClose: 8000 });
      } else {
        toast.error(getUserFriendlyError(error) || 'Failed to add SOL');
      }
    } finally {
      setSaving(false);
    }
  }, [walletAddress, isAuthenticated, tokenAllowlist, pairAllowlist, persistAllowlist, SOL_BSC, USDT_BSC]);

  // For Direct Entry with BNB: user must have set allowlist first (token + pair). Used to show "Set allowlist first" hint.
  const allowlistReadyForDirectEntry = useMemo(() => {
    if (directEntryQuoteToken !== 'BNB') { if (DE_DEBUG && isDev) console.log('[DE] allowlistReady: quote!==BNB → true'); return true; }
    const base = advisoryToken || 'BNB';
    const baseAddr = getTokenAddress(base);
    if (!baseAddr) { if (DE_DEBUG && isDev) console.log('[DE] allowlistReady: no baseAddr → true'); return true; }
    const hasNative = tokenAllowlist.some(t => String(t).toLowerCase() === ADDRESS_ZERO.toLowerCase());
    const hasPair = pairAllowlist.some(p =>
      String(p.tokenIn).toLowerCase() === ADDRESS_ZERO.toLowerCase() &&
      String(p.tokenOut).toLowerCase() === baseAddr.toLowerCase()
    );
    const ready = hasNative && hasPair;
    if (DE_DEBUG && isDev) console.log('[DE] allowlistReady BNB', { base, baseAddr: baseAddr?.slice(0, 10), hasNative, hasPair, ready });
    return ready;
  }, [directEntryQuoteToken, advisoryToken, tokenAllowlist, pairAllowlist]);
  
  // Production gating (no dev bypass): auto mode requires contracts deployed.
  // Bot authorization is checked but doesn't block UI - only informs user and blocks policy save.
  const showContractsNotDeployedBanner = isNotDeployed;

  // Hard-stop UI when prerequisites are missing (prevents "dev-only" behavior in production).
  if (!isAuthenticated || !walletAddress) {
    return (
      <div className="auto-trade-panel">
        <div className="auto-trade-panel-error" role="alert">
          <AlertCircle size={16} />
          <span>Connect your wallet and log in to configure Auto Mode.</span>
        </div>
      </div>
    );
  }

  if (showContractsNotDeployedBanner) {
    return (
      <div className="auto-trade-panel">
        <div className="auto-trade-panel-unavailable" role="alert">
          <Rocket size={20} className="auto-trade-panel-unavailable-icon" aria-hidden />
          <div className="auto-trade-panel-unavailable-content">
            <p className="auto-trade-panel-unavailable-title">Auto Mode unavailable</p>
            <p className="auto-trade-panel-unavailable-desc">
              {detailedMessage || 'OTA Policy Manager and OTAAutoExecutor contracts are not deployed/configured yet.'}
            </p>
            {Array.isArray(missingKeys) && missingKeys.length > 0 && (
              <p className="auto-trade-panel-unavailable-missing">
                Missing: {missingKeys.join(', ')}.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  const showAuthExpiredAlert = Boolean(
    walletAddress && isRegistered && (!botAuthorized || (executorBotAuthForUi && !executorBotAuthForUi.effectiveActive))
  );
  const authExpiredReason = executorBotAuthForUi && !executorBotAuthForUi.effectiveActive
    ? (executorBotAuthForUi.reason === 'AMOUNT_EXHAUSTED' ? 'Authorized amount is exhausted.' : 'Bot authorization expired or is inactive.')
    : 'Bot authorization is missing.';

  /** Latest source displayed in the strip: Verify (fresh) or server status. */
  const runningStripAnalysisRaw = lastSignalSource ?? autoExecutionStatus?.lastAnalysisSource ?? null;
  const runningStripSignalTooltip = runningStripAnalysisRaw
    ? `${describeAnalysisSourceForUserRo(runningStripAnalysisRaw)} API value: ${getTechnicalAnalysisSourceRaw(runningStripAnalysisRaw)}.`
    : 'Source is not loaded yet. Press Verify (POST /analyze) or wait for the next cycle; backend sends analysisSource.';
  const runningStripExplainRo = runningStripAnalysisRaw ? describeAnalysisSourceForUserRo(runningStripAnalysisRaw) : '';

  return (
    <div className="auto-trade-panel">
      {OTA_EMERGENCY_NEW_TRADES_DISABLED && (
        <div className="auto-trade-panel-banner auto-trade-panel-banner--warning" role="alert">
          <AlertCircle size={18} className="auto-trade-panel-banner-icon--warning" aria-hidden />
          <p><strong>Emergency safety lock active:</strong> new real trades are disabled from this site. Closing existing positions remains available.</p>
        </div>
      )}
      {/* Clear alert: expired/missing authorization; user must know automatic execution is stopped. */}
      {showAuthExpiredAlert && (
        <div className="auto-trade-panel-auth-expired-alert" role="alert" aria-live="polite">
          <AlertCircle size={22} className="auto-trade-panel-auth-expired-alert-icon" aria-hidden />
          <div className="auto-trade-panel-auth-expired-alert-body">
            <p className="auto-trade-panel-auth-expired-alert-title">
              Attention: {authExpiredReason}
            </p>
            <p className="auto-trade-panel-auth-expired-alert-desc">
              Automatic execution is stopped until you renew authorization. Go to <strong>Step 2 - Authorize Bot</strong> (right panel), enter the amount, press <strong>Authorize</strong>, and sign in your wallet.
            </p>
            <button
              type="button"
              className="auto-trade-panel-auth-expired-alert-cta"
              onClick={() => document.getElementById('ota-authorize-bot')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Go to Authorize Bot
            </button>
          </div>
        </div>
      )}
      {/* Strip: OTA AI Auto running status, signal source live from API, and Stop. */}
      {isRegistered && botAuthorized && policy.enabled && (
        <>
          <div className="auto-trade-panel-open-strip" role="status" aria-live="polite" title="Running on server. Only stops when you click Stop.">
            <span className="auto-trade-panel-open-strip-dot" aria-hidden />
            <span className="auto-trade-panel-open-strip-text">LIVE</span>

            {/* Data origin: OTA / OpenAI / Anthropic; API value is shown in tooltip. */}
            <span className="atp-strip-chip atp-strip-chip--signal" title={runningStripSignalTooltip}>
              <span className="atp-strip-chip-label">origin</span>
              <strong className="atp-strip-chip-val">{mapAnalysisSourceToDataOriginRo(runningStripAnalysisRaw)}</strong>
              <span className="atp-strip-chip-info" aria-hidden>
                <Info size={12} strokeWidth={2.5} />
              </span>
            </span>

            {/* Verify */}
            <button
              type="button"
              className="auto-trade-panel-open-strip-verify-source"
              onClick={refreshSignalSource}
              disabled={loadingSignalSource || !walletAddress}
              title={!walletAddress ? 'Connect the EVM wallet; otherwise Verify cannot call /analyze with userId.' : 'POST /ai-trading/analyze - signal source + BTC leading if backend sends it'}
              aria-label="Verify signal source"
            >
              {loadingSignalSource ? '⟳' : 'Verify'}
            </button>

            {/* BTC pills appear after Verify. */}
            {lastAnalysisPayload?.btcLeading?.price != null && Number(lastAnalysisPayload.btcLeading.price) > 0 && (
              <span className="atp-strip-chip" title="Live BTC price">
                <span className="atp-strip-chip-label">BTC</span>
                <strong className="atp-strip-chip-val">${Number(lastAnalysisPayload.btcLeading.price).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong>
              </span>
            )}
            {lastAnalysisPayload?.btcLeading?.return6h != null && (
              <span className={`atp-strip-chip atp-strip-chip--num ${lastAnalysisPayload.btcLeading.return6h >= 0 ? 'atp-strip-chip--pos' : 'atp-strip-chip--neg'}`} title="BTC 6h return">
                <span className="atp-strip-chip-label">6h</span>
                <strong className="atp-strip-chip-val">
                  {lastAnalysisPayload.btcLeading.return6h >= 0 ? '+' : ''}{Number(lastAnalysisPayload.btcLeading.return6h).toFixed(2)}%
                </strong>
              </span>
            )}
            {lastAnalysisPayload?.btcLeading?.bias && (
              <span className="atp-strip-chip atp-strip-chip--bias" title="BTC bias">
                {lastAnalysisPayload.btcLeading.bias}
              </span>
            )}

            {/* Stop */}
            <button
              type="button"
              className="auto-trade-panel-open-strip-stop"
              onClick={handleStopBot}
              disabled={saving || policyLoading}
              aria-label="Stop OTA AI Auto Trading"
            >
              <Square size={13} aria-hidden />
              Stop
            </button>
          </div>
          {runningStripExplainRo ? (
            <p className="auto-trade-panel-strip-signal-explain" role="note">
              {runningStripExplainRo}
            </p>
          ) : null}
          <div className="auto-trade-panel-open-strip-spacer" aria-hidden />
        </>
      )}
      <div className="auto-trade-panel-header">
        <div className="auto-trade-panel-header-content">
          <div className="auto-trade-panel-icon-wrap">
            <Sparkles size={22} className="auto-trade-panel-icon auto-trade-panel-icon-ai" aria-hidden />
            <Zap size={22} className="auto-trade-panel-icon" aria-hidden />
          </div>
          <div>
            <h3 className="auto-trade-panel-title">
              Auto Trading Configuration
            </h3>
            <p className="auto-trade-panel-subtitle">
              Configure policies and limits for automatic trade execution
            </p>
          </div>
        </div>
        <div className="auto-trade-panel-status">
          <div className={`auto-trade-panel-status-badge ${policy.enabled ? 'active' : 'inactive'}`}>
            {policy.enabled ? (
              <>
                <CheckCircle size={16} />
                <span>Auto Mode Active (policy on)</span>
              </>
            ) : (
              <>
                <AlertCircle size={16} />
                <span>Auto Mode Inactive (policy off)</span>
              </>
            )}
          </div>
          <div
            className={`auto-trade-panel-status-badge ${liveGo ? 'active' : 'inactive'}`}
            style={{ marginTop: 8, display: 'inline-flex', cursor: 'pointer' }}
            title={liveGo
              ? 'All runtime checks are green for live execution. Click to open Governance.'
              : `Blocked by: ${liveNoGoReasons.join(', ') || 'runtime checks'}. Click to open Governance.`}
            onClick={() => navigate('/dex-edu/ota?mode=auto&brainTab=governance')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/dex-edu/ota?mode=auto&brainTab=governance');
              }
            }}
          >
            {liveGo ? (
              <>
                <CheckCircle size={16} />
                <span>LIVE GO</span>
              </>
            ) : (
              <>
                <AlertCircle size={16} />
                <span>LIVE NO-GO</span>
              </>
            )}
          </div>
          {autoExecutionStatus && (
            <div className="auto-trade-panel-status-meta" style={{ marginTop: 6, fontSize: '0.78rem', color: 'var(--ds-text-secondary)' }}>
              Server worker: <strong>
                {workerActive
                  ? 'Active'
                  : autoExecutionStatus.isRunning === false
                    ? 'Loop not running'
                    : 'Paused / unavailable'}
              </strong>
              {autoExecutionStatus.enabled && autoExecutionStatus.isRunning === false && (
                <span title="Backend: monitoring loop not started – check Render logs"> ⚠</span>
              )}
              {autoExecutionStatus.agentMode ? ' | Agent mode available' : ''}
            </div>
          )}
          {!liveGo && liveNoGoReasons.length > 0 && (
            <div className="auto-trade-panel-status-meta" style={{ marginTop: 4, fontSize: '0.78rem', color: 'var(--ds-text-secondary)' }}>
              Blocked by: {liveNoGoReasons.join(', ')}
            </div>
          )}
          {liveGuardStatus.lastCheckedAt && (
            <div className="auto-trade-panel-status-meta" style={{ marginTop: 4, fontSize: '0.72rem', color: 'var(--ds-text-secondary)' }}>
              Guard checks: {new Date(liveGuardStatus.lastCheckedAt).toLocaleTimeString()}
              {liveGuardStatus.loading ? ' (refreshing...)' : ''}
            </div>
          )}
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="auto-trade-panel-btn-view-signals"
              onClick={runGovernanceCycleNow}
              disabled={governanceRunLoading}
              title="Run Level67 + Level68 cycle now"
            >
              {governanceRunLoading ? (
                <>
                  <Square size={14} /> Running governance...
                </>
              ) : (
                <>
                  <Play size={14} /> Run Governance Cycle now
                </>
              )}
            </button>
            {governanceRunResult && (
              <span className="auto-trade-panel-status-meta" style={{ fontSize: '0.72rem' }}>
                L67: {governanceRunResult.level67Code} | L68: {governanceRunResult.level68Code}
              </span>
            )}
            {governanceRunError && (
              <span className="auto-trade-panel-status-meta" style={{ fontSize: '0.72rem', color: '#ef4444' }}>
                {governanceRunError}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Total obtained profit (PnL from closed transactions) + paid network fees below, from transaction data. */}
      {walletAddress && isRegistered && botAuthorized && (() => {
        const profitTotal = (closedFromExecutions ?? 0) + (closedFromDirectEntry ?? 0);
        const totalPaidGas = (otaExecutions || []).reduce((s, t) => s + (Number(t.fees) || 0), 0);
        const hasData = otaExecutions.length > 0 || profitTotal !== 0 || totalPaidGas > 0;
        const isPositive = profitTotal >= 0;
        const QUOTE_SYMBOLS = ['USDT', 'USDC', 'BUSD', 'DAI'];
        const openExecutionCount = Math.max(0, (executionsDetail?.filter((r) => r.profitUsd == null && QUOTE_SYMBOLS.includes(String(r?.tokenIn ?? '').toUpperCase())) ?? []).length);
        return (
          <div className={`auto-trade-panel-profit-hero ${hasData ? (isPositive ? 'positive' : 'negative') : 'neutral'}`} role="status" aria-live="polite">
            <div className="auto-trade-panel-profit-hero-inner">
              {policy.enabled && (
                <span className="auto-trade-panel-profit-live" aria-hidden>
                  <span className="auto-trade-panel-profit-live-dot" />
                  Live
                </span>
              )}
              <div className="auto-trade-panel-profit-hero-value-wrap">
                <TrendingUp size={28} className="auto-trade-panel-profit-hero-icon" aria-hidden />
                <div>
                  <span className="auto-trade-panel-profit-hero-label" title="Total obtained profit from closed OTA transactions (saved PnL).">Total profit obtained</span>
                  <span
                    key={`profit-${profitTotal}`}
                    className={`auto-trade-panel-profit-hero-value ${hasData ? (profitTotal >= 0 ? 'positive' : 'negative') : 'neutral'}`}
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {profitTotal >= 0 && hasData ? '+' : ''}{formatNumber(profitTotal, 2)} USD
                  </span>
                  {totalPaidGas > 0 && (
                    <span style={{ display: 'block', marginTop: 2, fontSize: '0.7rem', opacity: 0.9 }}>
                      Net after fees: {profitTotal - totalPaidGas >= 0 ? '+' : ''}{formatNumber(profitTotal - totalPaidGas, 2)} USD
                    </span>
                  )}
                </div>
                <p className="auto-trade-panel-profit-hero-source" style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: 4 }}>
                  From Auto executions: {formatNumber(closedFromExecutions, 2)} USD · From Direct Entry: {formatNumber(closedFromDirectEntry, 2)} USD
                  {totalPaidGas > 0 ? (
                    <span style={{ display: 'block', marginTop: 6, fontSize: '0.75rem' }}>Network fees (gas) paid in these transactions: <strong>-{formatNumber(totalPaidGas, 2)} USD</strong></span>
                  ) : (
                    <span style={{ display: 'block', marginTop: 4, fontSize: '0.65rem', opacity: 0.8 }}>Network fees: shown when backend reports gas per transaction (~0.30-0.40 USD/tx on BSC).</span>
                  )}
                  <span style={{ display: 'block', marginTop: 2, fontSize: '0.65rem', opacity: 0.8 }}>
                    {profitTotal === 0 && openExecutionCount > 0 ? 'PnL appears after positions close (TP/SL or SELL).' : 'Profit = cumulative PnL sum from all closed transactions; each close changes the total.'}
                  </span>
                  {closedFromExecutions === 0 && openExecutionCount > 0 && (
                    <span style={{ display: 'block', marginTop: 6, fontSize: '0.7rem', opacity: 0.85 }}>
                      Open positions without PnL yet: {openExecutionCount}.
                    </span>
                  )}
                </p>
                {(executionsDetail?.length > 0 || directEntryDetail?.length > 0) && (
                  <div className="auto-trade-panel-profit-details-wrap" style={{ marginTop: 8 }}>
                    <button
                      type="button"
                      className="auto-trade-panel-inline-link"
                      onClick={() => setProfitDetailsExpanded((v) => !v)}
                      aria-expanded={profitDetailsExpanded}
                    >
                      {profitDetailsExpanded ? <ChevronUp size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> : <ChevronDown size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />}
                      Profit details (recorded PnL only)
                    </button>
                    {profitDetailsExpanded && (
                      <div className="auto-trade-panel-profit-details-tables" style={{ marginTop: 8, fontSize: '0.7rem', overflow: 'auto', maxHeight: 280 }}>
                        {executionsDetail?.length > 0 && (
                          <div style={{ marginBottom: 12 }}>
                            <strong>Auto executions</strong>
                            <p style={{ margin: '2px 0 4px', opacity: 0.9, fontSize: '0.65rem' }}>Total = row sum (Auto: {formatNumber(closedFromExecutions, 2)} USD + Direct: {formatNumber(closedFromDirectEntry, 2)} USD). — = PnL not saved yet.</p>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 4 }}>
                              <thead>
                                <tr>
                                  <th style={{ textAlign: 'left', padding: '4px 6px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>Token in → out</th>
                                  <th style={{ textAlign: 'right', padding: '4px 6px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>Date</th>
                                  <th style={{ textAlign: 'right', padding: '4px 6px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>Profit USD</th>
                                </tr>
                              </thead>
                              <tbody>
                                {executionsDetail.map((r, i) => (
                                  <tr key={`exec-${r.id ?? i}`}>
                                    <td style={{ padding: '4px 6px' }}>{[r.tokenIn, r.tokenOut].filter(Boolean).join(' → ') || '—'}</td>
                                    <td style={{ padding: '4px 6px', textAlign: 'right' }}>{r.executedAt ? new Date(r.executedAt).toLocaleString() : '—'}</td>
                                    <td style={{ padding: '4px 6px', textAlign: 'right' }}>{r.profitUsd != null ? formatNumber(r.profitUsd, 2) : '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {directEntryDetail?.length > 0 && (
                          <div>
                            <strong>Closed Direct positions</strong>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 4 }}>
                              <thead>
                                <tr>
                                  <th style={{ textAlign: 'left', padding: '4px 6px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>Token</th>
                                  <th style={{ textAlign: 'right', padding: '4px 6px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>Closed at</th>
                                  <th style={{ textAlign: 'right', padding: '4px 6px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>Profit USD</th>
                                </tr>
                              </thead>
                              <tbody>
                                {directEntryDetail.map((r, i) => (
                                  <tr key={`de-${r.id ?? i}`}>
                                    <td style={{ padding: '4px 6px' }}>{r.token || '—'}</td>
                                    <td style={{ padding: '4px 6px', textAlign: 'right' }}>{r.closedAt ? new Date(r.closedAt).toLocaleString() : '—'}</td>
                                    <td style={{ padding: '4px 6px', textAlign: 'right' }}>{r.profitUsd != null ? formatNumber(r.profitUsd, 2) : '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="auto-trade-panel-profit-hero-hint">
                Profits stay in your Personal Account. <button type="button" className="auto-trade-panel-inline-link" onClick={() => navigate('/dex-edu/leverage?tab=withdraw')}>Withdraw</button> to wallet.
              </p>
            </div>
          </div>
        );
      })()}

      {/* Quick setup: steps for Auto trading (any amount in USDT or BNB) */}
      <div className="auto-trade-panel-quick-flow">
        <p className="auto-trade-panel-quick-flow-title">Auto trading – what to do:</p>
        <ol className="auto-trade-panel-quick-flow-steps">
          <li>
            <span className={`auto-trade-panel-step-num ${isRegistered ? 'done' : ''}`}>
              {isRegistered ? <CheckCircle size={14} /> : '1'}
            </span>
            {isRegistered ? 'OTA registration' : (
              <>OTA registration – right panel, <strong>Register</strong> button</>
            )}
          </li>
          <li>
            <span className={`auto-trade-panel-step-num ${botAuthorized ? 'done' : ''}`}>
              {botAuthorized ? <CheckCircle size={14} /> : '2'}
            </span>
            {botAuthorized ? 'Authorize Bot' : (
              <>
                Authorize Bot – right panel:{' '}
                <button
                  type="button"
                  className="auto-trade-panel-quick-flow-cta"
                  onClick={() => document.getElementById('ota-authorize-bot')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  → Go to Authorize Bot
                </button>{' '}
                Enter any amount in <strong>USD</strong> or <strong>BNB</strong> (10 recommended for start), click <strong>Authorize</strong> and sign in your wallet.
              </>
            )}
          </li>
          <li>
            <span className={`auto-trade-panel-step-num ${policy.enabled ? 'done' : ''}`}>
              {policy.enabled ? <CheckCircle size={14} /> : '3'}
            </span>
            {policy.enabled ? 'Policy enabled' : (
              <>Policy – <strong>Policy</strong> tab below: check &quot;Enable automatic execution&quot; and click <strong>Save policy</strong></>
            )}
          </li>
          <li>
            <span className="auto-trade-panel-step-num">
              {isRegistered && botAuthorized && policy.enabled ? <CheckCircle size={14} /> : '4'}
            </span>
            {isRegistered && botAuthorized && policy.enabled
              ? 'Done – OTA executes automatically when AI signals appear.'
              : 'After steps 1–3: OTA starts automatically and executes trades within your authorized amount (USDT or BNB).'}
          </li>
        </ol>
      </div>

      {/* Visual checklist: verify settings before Start. */}
      {walletAddress && isAuthenticated && (
        <div className="auto-trade-panel-checklist" role="status" aria-label="Setup checklist">
          <div className="auto-trade-panel-checklist-row">
            <span className={`auto-trade-panel-checklist-item ${isRegistered ? 'done' : ''}`}>
              {isRegistered ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              {isRegistered ? 'Registration' : 'Registration required'}
            </span>
            <span className={`auto-trade-panel-checklist-item ${botAuthorized ? 'done' : (executorBotAuthForUi && !executorBotAuthForUi.effectiveActive ? 'expired' : '')}`}>
              {botAuthorized ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              {botAuthorized
                ? 'Bot authorized (amount-based)'
                : (executorBotAuthForUi && !executorBotAuthForUi.effectiveActive)
                  ? 'Bot inactive/exhausted - renew in Step 2'
                  : 'Bot authorization required'}
            </span>
            <span className={`auto-trade-panel-checklist-item ${policy.enabled ? 'done' : ''}`}>
              {policy.enabled ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              {policy.enabled ? 'Auto enabled' : 'Auto off'}
            </span>
          </div>
        </div>
      )}

      {/* Banner: bot runs on server; Stop only when user clicks. */}
      {isRegistered && botAuthorized && (
        <div className="auto-trade-panel-server-banner" role="status">
          <Bot size={16} aria-hidden />
          <span>OTA AI Trading runs on the server. Only stops when <strong>you</strong> click Stop. Page refresh does not stop it.</span>
        </div>
      )}

      {/* Visible bar when Auto is ON: what the bot does + large timer; it does not stop itself. */}
      {isRegistered && botAuthorized && policy.enabled && (
        <div className="auto-trade-panel-bot-active-bar" role="status" aria-live="polite">
          <div className="auto-trade-panel-bot-active-bar-inner">
            <span className="auto-trade-panel-bot-active-bar-dot" aria-hidden />
            <span className="auto-trade-panel-bot-active-bar-label">Bot is monitoring the market</span>
            <span className="auto-trade-panel-bot-active-bar-countdown" aria-live="polite">
              Next scan in <strong>{Math.floor(nextScanCountdown / 60)}:{String(nextScanCountdown % 60).padStart(2, '0')}</strong>
            </span>
            {autoExecutionStatus != null && (
              <span className="auto-trade-panel-bot-active-bar-worker">
                Server: {!autoExecutionStatus.enabled ? 'Paused' : autoExecutionStatus.isRunning === false ? 'Loop not running' : 'Active'}
                {autoExecutionStatus.agentMode && (
                  <span className="auto-trade-panel-agent-badge" title="LLM Agent (ReAct + tool calling) mode"> | Agent</span>
                )}
              </span>
            )}
          </div>
          <p className="auto-trade-panel-bot-active-bar-desc">
            {autoExecutionStatus?.monitoringIntervalMs != null
              ? `Backend checks AI signals every ${Math.round(autoExecutionStatus.monitoringIntervalMs / 1000)}s and executes when profit > gas. This bar stays visible while Auto is on.`
              : 'Backend checks AI signals every 30s–5 min (set on server) and executes when profit > gas. This bar stays visible while Auto is on.'}
          </p>
        </div>
      )}

      {/* Start / Stop Bot: large visible buttons; real state comes from contract. */}
      {isRegistered && botAuthorized && policyLoading && (
        <div className="auto-trade-panel-start-stop auto-trade-panel-start-stop--loading" role="status">
          <LoadingSpinner size={20} />
          <span>Loading policy status…</span>
        </div>
      )}
      {isRegistered && botAuthorized && !policyLoading && (
        <>
          {!policy.enabled && (
            <label className="auto-trade-panel-force-open-next" style={{ display: 'block', marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={forceOpenOnNextRun}
                onChange={(e) => setForceOpenOnNextRun(e.target.checked)}
                aria-describedby="force-open-next-hint"
              />
              <span id="force-open-next-hint">Force 1 BUY on the next analysis (one-time test: the position opens, then closes at TP/SL or on SELL signal)</span>
            </label>
          )}
        <AutoTradeStartStop
          policy={policy}
          policyLoading={policyLoading}
          saving={saving}
          handleStopBot={handleStopBot}
          handleStartBot={handleStartBot}
          newTradesDisabled={OTA_EMERGENCY_NEW_TRADES_DISABLED}
          llmPauseSlot={
            walletAddress && isAuthenticated ? (
              <OtaAutotradeLlmPauseCard variant="inline" walletAddress={walletAddress} />
            ) : null
          }
        >
          <AutoTradeDirectEntry
            advisoryToken={advisoryToken}
            directEntryAmount={directEntryAmount}
            setDirectEntryAmount={setDirectEntryAmount}
            directEntryQuoteToken={directEntryQuoteToken}
            setDirectEntryQuoteToken={setDirectEntryQuoteToken}
            directEntryQuoteOptions={directEntryQuoteOptions}
            directEntryQuoteOpen={directEntryQuoteOpen}
            setDirectEntryQuoteOpen={setDirectEntryQuoteOpen}
            directEntryQuoteRef={directEntryQuoteRef}
            getVaultBalanceNumber={getVaultBalanceNumber}
            getAuthorizedForQuote={getAuthorizedForQuote}
            getVaultBalanceForQuote={getVaultBalanceForQuote}
            directEntryLoading={directEntryLoading}
            hasOpenPosition={hasOpenPosition}
            openPositionData={openPositionData}
            closePositionLoading={closePositionLoading}
            handleDirectEntryClose={handleDirectEntryClose}
            policyLoading={policyLoading}
            directEntryTokenPrice={directEntryTokenPrice}
            directEntryPricePending={directEntryPricePending}
            handleDirectEntryOpen={handleDirectEntryOpen}
            handleDirectEntryConfirm={handleDirectEntryConfirm}
            directEntryConfirmOpen={directEntryConfirmOpen}
            setDirectEntryConfirmOpen={setDirectEntryConfirmOpen}
            setDirectEntryAmountPercent={setDirectEntryAmountPercent}
            directEntrySlippagePercent={directEntrySlippagePercent}
            setDirectEntrySlippagePercent={setDirectEntrySlippagePercent}
            allowlistReadyForDirectEntry={allowlistReadyForDirectEntry}
            onGoToAllowlist={() => {
              setActiveTab('allowlist');
              setTimeout(() => {
                document.getElementById('ota-auto-trade-panel-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 50);
            }}
            bnbPriceUsd={authDisplayPrices?.bnb ?? null}
            walletAddress={walletAddress}
            newTradesDisabled={OTA_EMERGENCY_NEW_TRADES_DISABLED}
          />
          {advisoryToken && advisoryToken !== 'BTC' && (
            <p className="auto-trade-panel-direct-entry-btc-context" title="LIVE BTC price is used by OTA during analysis as a leading indicator. Other tokens follow BTC movement.">
              <strong>Context BTC:</strong> {lastAnalysisPayload?.btcContext?.status === 'unavailable' || (!lastAnalysisPayload?.btcLeading && lastAnalysisPayload?.btcContext?.status !== 'available' && lastAnalysisPayload?.btcContext?.status !== 'partial')
                ? `missing (${lastAnalysisPayload?.btcContext?.missingReason || '—'})`
                : lastAnalysisPayload?.btcLeading && (lastAnalysisPayload.btcLeading.summary || lastAnalysisPayload.btcLeading.return1h != null)
                  ? (typeof lastAnalysisPayload.btcLeading.summary === 'string' ? lastAnalysisPayload.btcLeading.summary : `1h: ${Number(lastAnalysisPayload.btcLeading.return1h).toFixed(2)}%`)
                  : 'LIVE price at analysis'}
              {lastAnalysisPayload?.btcLeading?.return6h != null && ` · 6h: ${(lastAnalysisPayload.btcLeading.return6h >= 0 ? '+' : '') + Number(lastAnalysisPayload.btcLeading.return6h).toFixed(2)}%`}
              {lastAnalysisPayload?.btcLeading?.bias && ` · bias: ${lastAnalysisPayload.btcLeading.bias}`}
            </p>
          )}
          {(authorizedMaxDisplay || typeof autoExecutionStatus?.executionsCount24h === 'number') && (
            <div className="auto-trade-panel-start-stop-status" role="status">
              {authorizedMaxDisplay && (
                <p className="auto-trade-panel-authorized-limit">Authorized limit: <strong>{authorizedMaxDisplay}</strong></p>
              )}
              {typeof autoExecutionStatus?.executionsCount24h === 'number' && (
                <p className="auto-trade-panel-executions-24h" aria-live="polite">Executions (24h): <strong>{autoExecutionStatus.executionsCount24h}</strong></p>
              )}
            </div>
          )}
        </AutoTradeStartStop>
        </>
      )}

      {/* Grid Trading: section visible immediately, no scroll. */}
      {walletAddress && (
        <GridTradingPanel chain="evm" pair="BNB/USDT" userId={walletAddress} />
      )}

      {/* Badge: total obtained profit, same as hero. */}
      {isRegistered && botAuthorized && !policy.enabled && walletAddress && (() => {
        const profitTotal = (closedFromExecutions ?? 0) + (closedFromDirectEntry ?? 0);
        const hasExecutions = otaExecutions.length > 0 || profitTotal !== 0;
        return (
          <div className={`auto-trade-panel-profit-badge ${hasExecutions ? (profitTotal >= 0 ? 'positive' : 'negative') : 'neutral'}`} role="status" aria-live="polite">
            <TrendingUp size={24} aria-hidden />
            <div>
              <span className="auto-trade-panel-profit-label">Total profit obtained</span>
              <span className={`auto-trade-panel-profit-value ${hasExecutions ? (profitTotal >= 0 ? 'positive' : 'negative') : 'neutral'}`}>
                {profitTotal >= 0 && hasExecutions ? '+' : ''}{formatNumber(profitTotal, 2)} USD
              </span>
            </div>
            <p className="auto-trade-panel-profit-recovery-hint">
              Profits stay in your Personal Account. Go to <button type="button" className="auto-trade-panel-inline-link" onClick={() => navigate('/dex-edu/leverage?tab=withdraw')}>Personal Account → Withdraw</button> to move tokens to your wallet.
            </p>
          </div>
        );
      })()}

      {/* How OTA AI Trading works: OpenAI logic, micro-profit, gas. */}
      <section className="auto-trade-panel-how-it-works" aria-labelledby="ota-how-it-works-title">
        <h4 id="ota-how-it-works-title" className="auto-trade-panel-how-it-works-title">
          <Sparkles size={18} aria-hidden />
          How OTA AI Trading works (OpenAI)
          {aiModelStatus && (
            <span style={{
              marginLeft: 8, fontSize: '0.7em', padding: '2px 8px', borderRadius: 6,
              background: aiModelStatus.isFineTuned
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'rgba(99,102,241,0.25)',
              color: aiModelStatus.isFineTuned ? '#fff' : '#818cf8',
              fontWeight: 600, letterSpacing: '0.02em',
            }}>
              {aiModelStatus.isFineTuned ? '🎯 Fine-Tuned AI' : 'Base AI'}
            </span>
          )}
        </h4>
        <div className="auto-trade-panel-how-it-works-content">
          <ol className="auto-trade-panel-how-it-works-steps">
            <li><strong>Monitor:</strong> Backend sends market data (price, volume, trends, patterns) to AI.</li>
            <li><strong>Analyze:</strong>{' '}
              {aiModelStatus?.isFineTuned
                ? <><strong style={{ color: '#10b981' }}>Fine-Tuned OTA AI</strong> (trained on {aiModelStatus.outcomesCount || '1000+'} real outcomes)</>
                : 'OpenAI'
              }{' '}returns BUY, SELL, or HOLD based on market conditions.
            </li>
            <li><strong>Execute:</strong> Bot executes only when signal is BUY or SELL <em>and</em> expected profit &gt; gas cost <em>and</em> within your limits.</li>
            <li><strong>Learn:</strong> AI records every trade outcome → feeds back into next analysis → model re-trains automatically.</li>
          </ol>
          {aiModelStatus && (
            <p className="auto-trade-panel-how-it-works-note" style={{ fontSize: '0.8em', opacity: 0.8, marginTop: 6 }}>
              Model: <strong>{aiModelStatus.model}</strong>
              {' | '}Regime source: <strong>{aiModelStatus.regimeSource}</strong>
              {aiModelStatus.outcomesCount > 0 && <>{' | '}Outcomes recorded: <strong>{aiModelStatus.outcomesCount}</strong></>}
            </p>
          )}
          <p className="auto-trade-panel-how-it-works-note">
            OTA uses your trading history, pattern recognition, and AI learning to improve. The bot runs on the server; this page is a dashboard.
          </p>
        </div>
      </section>

      {/* Tabs: clear interactive area with no overlaps; id is used for scrolling from Direct Entry error modal. */}
      <div id="ota-auto-trade-panel-tabs" className="auto-trade-panel-tabs" role="tablist" aria-label="Policy, Limits, Allowlist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'policy'}
          className={`auto-trade-panel-tab ${activeTab === 'policy' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('policy');
            setTimeout(() => {
              document.getElementById('ota-tab-content-start')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 30);
          }}
        >
          <Settings size={18} />
          <span>Policy</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'limits'}
          className={`auto-trade-panel-tab ${activeTab === 'limits' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('limits');
            setTimeout(() => {
              document.getElementById('ota-tab-content-start')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 30);
          }}
        >
          <DollarSign size={18} />
          <span>Limits</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'allowlist'}
          className={`auto-trade-panel-tab ${activeTab === 'allowlist' ? 'active' : ''}`}
          onClick={() => {
            loadAllowlistFromStorage();
            setActiveTab('allowlist');
            setTimeout(() => {
              document.getElementById('ota-tab-content-start')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 30);
          }}
        >
          <List size={18} />
          <span>Allowlist</span>
        </button>
      </div>

      <div id="ota-tab-content-start">
        {/* Policy Tab – compact, intuitiv */}
        {activeTab === 'policy' && (
          <AutoTradePolicyTab
            policy={policy}
            setPolicy={setPolicy}
            saving={saving}
            handleSavePolicy={handleSavePolicy}
            walletAddress={walletAddress}
            policyAcceptedOnChain={policyAcceptedOnChain}
            policyLastCheckedAt={policyLastCheckedAt}
            verifyingPolicy={verifyingPolicy}
            policyVerificationMessage={policyVerificationMessage}
            onVerifyPolicyOnChain={handleVerifyPolicyOnChain}
            onInlineNotify={notifyInline}
            savedPolicySummary={savedPolicySummary}
            onDismissSummary={() => setSavedPolicySummary(null)}
          />
        )}

        {/* Limits Tab */}
        {activeTab === 'limits' && (
          <AutoTradeLimitsTab
            tokenLimits={tokenLimits}
            setTokenLimits={setTokenLimits}
            usdTradeLimits={usdTradeLimits}
            setUsdTradeLimits={setUsdTradeLimits}
            saving={saving}
            savingTokenLimits={savingTokenLimits}
            handleSaveTokenLimits={handleSaveTokenLimits}
            handleSaveUsdTradeLimits={handleSaveUsdTradeLimits}
            handleForceOpenNow={handleForceOpenNow}
            forceOpenMaxLossPct={forceOpenMaxLossPct}
            setForceOpenMaxLossPct={setForceOpenMaxLossPct}
            savedTokenLimitsFromBackend={savedTokenLimitsFromBackend}
            savedUsdLimitsFromBackend={savedUsdLimitsFromBackend}
            limitsFromBackendLoading={limitsFromBackendLoading}
            onRefreshLimitsFromBackend={handleRefreshLimitsFromBackend}
            otapolicyManagerAddress={getOTAPolicyManagerAddress()}
            tokenLimitPresets={tokenLimitPresetsFromBackend}
            newTradesDisabled={OTA_EMERGENCY_NEW_TRADES_DISABLED}
          />
        )}

        {/* Allowlist Tab */}
        {activeTab === 'allowlist' && (
          <AutoTradeAllowlistTab
            tokenAllowlist={tokenAllowlist}
            pairAllowlist={pairAllowlist}
            allowlistTokenInput={allowlistTokenInput}
            allowlistPairIn={allowlistPairIn}
            allowlistPairOut={allowlistPairOut}
            allowlistStatusMessage={allowlistStatusMessage}
            saving={saving}
            verifyingAllowlist={verifyingAllowlist}
            walletAddress={walletAddress}
            onVerifyApprovals={handleVerifyApprovals}
            onAddToken={handleAddTokenToAllowlist}
            onRemoveToken={handleRemoveTokenFromAllowlist}
            onAddPair={handleAddPairToAllowlist}
            onRemovePair={handleRemovePairFromAllowlist}
            onAddAllRecommended={handleAddAllRecommendedAllowlist}
            onAddCakeForDirectEntry={handleAddCakeForDirectEntry}
            onAddUsdtForDirectEntry={handleAddUsdtForDirectEntry}
            onAddSolForDirectEntry={handleAddSolForDirectEntry}
            onAddAllPairsForTokens={handleAddAllPairsForTokens}
            onCleanDuplicates={handleCleanAllowlistDuplicates}
            setAllowlistTokenInput={setAllowlistTokenInput}
            setAllowlistPairIn={setAllowlistPairIn}
            setAllowlistPairOut={setAllowlistPairOut}
            fetchTokenAllowedOnChain={isTokenAllowedOnChain}
            fetchPairAllowedOnChain={isPairAllowedOnChain}
            onLoadTokensFromChain={handleLoadTokensFromChain}
            onLoadPairsFromChain={handleLoadPairsFromChain}
          />
        )}
      </div>

      {/* OTA Executions: real transactions; profit is displayed only when backend sends PnL. */}
      <section className="auto-trade-panel-ota-executions" aria-label="OTA Executions">
        <div className="auto-trade-panel-ota-executions-card">
          <div className="auto-trade-panel-ota-executions-header">
            <Bot size={18} className="auto-trade-panel-ota-executions-icon" aria-hidden />
            <span className="auto-trade-panel-ota-executions-title">What OTA AI does – Executions & Profit</span>
            <span className="auto-trade-panel-ota-executions-subtitle" style={{ fontSize: '0.7rem', opacity: 0.85, marginLeft: 8 }} title="Each row = one transaction. Profit appears when backend saves PnL; — = not saved yet.">Real transactions · — = PnL not saved</span>
            {policy.enabled && loadingOtaExecutions && (
              <span className="auto-trade-panel-ota-executions-updating" aria-live="polite">
                <span className="auto-trade-panel-updating-dot" /> Updating…
              </span>
            )}
          </div>
          {otaExecutionsError && (
            <div className="auto-trade-panel-ota-executions-error" role="alert">
              <span>Could not load executions: {otaExecutionsError}</span>
              <button type="button" className="auto-trade-panel-ota-executions-retry" onClick={() => setRetryOtaExecutions(r => r + 1)}>Retry</button>
            </div>
          )}
          {loadingOtaExecutions && !policy.enabled ? (
            <span className="auto-trade-panel-ota-executions-loading">Loading…</span>
          ) : otaExecutions.length === 0 && !otaExecutionsError ? (
            <p className="auto-trade-panel-ota-executions-empty">
              No OTA executions yet. When OTA AI makes trades, they will appear here with pair, amount, profit/loss, and Tx link.
            </p>
          ) : otaExecutions.length === 0 ? null : (
            <div className="auto-trade-panel-ota-executions-list">
              {otaExecutions.map((t, i) => {
                const tokenIn = t.tokenIn ?? t.token_in ?? null;
                const tokenOut = t.tokenOut ?? t.token_out ?? t.token ?? null;
                const pair = [tokenIn, tokenOut].filter(Boolean).join('→') || '—';
                const quoteSymbols = ['USDT', 'BNB', 'ETH', 'WBNB', 'WETH'];
                const isSell = t.side === 'sell' || (tokenOut && quoteSymbols.includes(String(tokenOut).toUpperCase()));
                const sideLabel = isSell ? 'Sell' : 'Buy';
                const amountOutRaw = t.amountOut ?? t.amount_out ?? t.amount ?? 0;
                const amountOutNum = typeof amountOutRaw === 'string' ? parseFloat(amountOutRaw) : Number(amountOutRaw);
                const tokenOutSym = (pair.split('→')[1] || (tokenOut && String(tokenOut).length <= 10 ? tokenOut : '')).trim() || '—';
                const amtHuman = amountOutNum >= 1e12 ? amountOutNum / 1e18 : amountOutNum;
                const amtStr = amountOutNum >= 1e12 ? `${formatNumber(amtHuman, amtHuman >= 1 ? 2 : 4)} ${tokenOutSym}` : (amountOutNum > 0 ? formatNumber(amountOutNum, 4) : null);
                const amountInRaw = t.amountIn ?? t.amount_in ?? 0;
                const amountInNum = typeof amountInRaw === 'string' ? parseFloat(amountInRaw) : Number(amountInRaw);
                const tokenInSym = (pair.split('→')[0] || (tokenIn && String(tokenIn).length <= 10 ? tokenIn : '')).trim() || '—';
                const amtInHuman = amountInNum >= 1e12 ? amountInNum / 1e18 : amountInNum;
                const amtInStr = amountInNum > 0 ? (amountInNum >= 1e12 ? `${formatNumber(amtInHuman, amtInHuman >= 1 ? 2 : 4)} ${tokenInSym}` : formatNumber(amountInNum, 4)) : null;
                const pnl = t.pnl ?? t.pnlUsd ?? t.pnl_usd ?? t.profitUsd ?? t.profit_usd ?? t.realizedPnl ?? t.realized_pnl ?? null;
                const ts = t.timestamp || t.createdAt || t.executedAt;
                const pnlNum = pnl != null ? Number(pnl) : null;
                const execId = t.id || t._id || t.txHash;
                const isNew = execId && newExecIds.has(execId);
                const status = t.status ?? null;
                const chain = (t.chain ?? '').toString().toLowerCase();
                const valueRaw = t.value ?? t.total_value ?? t.total ?? null;
                let valueNum = valueRaw != null ? Number(valueRaw) : null;
                // Backend may send value in wei (18 decimals), either amountOut in wei or USD in wei.
                if (valueNum != null && Number.isFinite(valueNum) && valueNum >= 1e12) {
                  valueNum = valueNum / 1e18;
                }
                // Show "Value: X USD" only when tokenOut is a stablecoin. Otherwise value is amountOut in wei, not USD.
                const quoteStablecoins = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD'];
                const tokenOutUpper = (tokenOut && String(tokenOut).toUpperCase()) || '';
                const valueIsUsd = quoteStablecoins.some(s => tokenOutUpper === s);
                const closeReason = t.closeReason ?? t.close_reason ?? null;
                const timeInTrade = t.timeInTrade ?? t.time_in_trade ?? null;
                const fees = t.fees != null ? t.fees : null;
                const slippage = t.slippage != null ? t.slippage : null;
                const txHash = t.txHash ?? t.tx_hash ?? null;
                const txUrl = chain === 'sei' ? `https://seitrace.com/tx/${txHash}` : `https://bscscan.com/tx/${txHash}`;
                const hasMeta = amtInStr || valueNum != null || status || chain || closeReason || timeInTrade != null || fees != null || slippage != null;
                return (
                  <div key={execId || `exec-${i}`} className={`auto-trade-panel-ota-exec-row${isNew ? ' new-exec' : ''}`}>
                    <div className="auto-trade-panel-ota-exec-main">
                      <div className="auto-trade-panel-ota-exec-info">
                        <span className="auto-trade-panel-ota-exec-time">
                          {ts ? new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </span>
                        <span className={`auto-trade-panel-ota-exec-side ${isSell ? 'sell' : 'buy'}`} title={isSell ? 'Sell (base→quote)' : 'Buy (quote→base)'}>{sideLabel}</span>
                        <span className="auto-trade-panel-ota-exec-pair">{pair}</span>
                        {amtStr && <span className="auto-trade-panel-ota-exec-amt" title={amountOutRaw?.toString?.()}>{amtStr}</span>}
                        {amtInStr && <span className="auto-trade-panel-ota-exec-amt-in" title="Amount in">In: {amtInStr}</span>}
                      </div>
                      {hasMeta && (
                        <div className="auto-trade-panel-ota-exec-meta">
                          {status && <span className="auto-trade-panel-ota-exec-status" title="Status">{status}</span>}
                          {chain && <span className="auto-trade-panel-ota-exec-chain">{chain.toUpperCase()}</span>}
                          {valueNum != null && Number.isFinite(valueNum) && valueIsUsd && <span className="auto-trade-panel-ota-exec-value">Value: {formatNumber(valueNum, 2)} USD</span>}
                          {closeReason && <span className="auto-trade-panel-ota-exec-close-reason" title="Close reason">{closeReason}</span>}
                          {timeInTrade != null && <span className="auto-trade-panel-ota-exec-time-in-trade">Time: {typeof timeInTrade === 'number' ? `${timeInTrade}s` : String(timeInTrade)}</span>}
                          {fees != null && <span className="auto-trade-panel-ota-exec-fees">Fees: {typeof fees === 'number' ? formatNumber(fees, 4) : String(fees)}</span>}
                          {slippage != null && <span className="auto-trade-panel-ota-exec-slippage">Slippage: {typeof slippage === 'number' ? `${(slippage * 100).toFixed(2)}%` : String(slippage)}</span>}
                        </div>
                      )}
                    </div>
                    {pnlNum != null ? (
                      <span className={`auto-trade-panel-ota-exec-pnl ${pnlNum >= 0 ? 'positive' : 'negative'}`}>
                        {pnlNum >= 0 ? '+' : ''}{formatNumber(pnlNum, 2)} USD
                      </span>
                    ) : (
                      <span className="auto-trade-panel-ota-exec-pnl" style={{ opacity: 0.7 }} title="Backend did not send PnL for this transaction (old or unsaved record).">—</span>
                    )}
                    {txHash && (
                      <a
                        href={txUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="auto-trade-panel-ota-exec-tx"
                        title={chain === 'sei' ? 'View on SeiTrace' : 'View on BSCScan'}
                        aria-label={chain === 'sei' ? 'View transaction on SeiTrace' : 'View transaction on BSCScan'}
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Persistent popup: all LIVE details on OPEN from OTA LLM Auto. */}
      {otaOpenDetailModal && (
        <Modal
          isOpen={!!otaOpenDetailModal}
          onClose={() => setOtaOpenDetailModal(null)}
          title="OTA LLM Auto - Open position (OPEN)"
          size="large"
        >
          <div className="auto-trade-panel-ota-open-detail">
            <p className="auto-trade-panel-ota-open-detail-summary">
              {[otaOpenDetailModal.tokenIn, otaOpenDetailModal.tokenOut].filter(Boolean).join(' → ')}
              {(otaOpenDetailModal.amountIn != null || otaOpenDetailModal.amountOut != null) && (
                <> · In: {String(otaOpenDetailModal.amountIn ?? '—')} · Out: {String(otaOpenDetailModal.amountOut ?? '—')}</>
              )}
              {(otaOpenDetailModal.timestamp || otaOpenDetailModal.createdAt || otaOpenDetailModal.executedAt) && (
                <> · {new Date(otaOpenDetailModal.timestamp || otaOpenDetailModal.createdAt || otaOpenDetailModal.executedAt).toLocaleString()}</>
              )}
            </p>
            {(() => {
              const t = otaOpenDetailModal;
              const amountInRaw = t.amountIn ?? t.amount_in ?? 0;
              const amountOutRaw = t.amountOut ?? t.amount_out ?? t.amount ?? 0;
              const amountInNum = typeof amountInRaw === 'string' ? parseFloat(amountInRaw) : Number(amountInRaw);
              const amountOutNum = typeof amountOutRaw === 'string' ? parseFloat(amountOutRaw) : Number(amountOutRaw);
              const amountInHuman = amountInNum >= 1e12 ? amountInNum / 1e18 : amountInNum;
              const amountOutHuman = amountOutNum >= 1e12 ? amountOutNum / 1e18 : amountOutNum;
              const entryPriceFromApi = t.price != null ? Number(t.price) : null;
              const entryPrice = entryPriceFromApi ?? (Number.isFinite(amountInHuman) && Number.isFinite(amountOutHuman) && amountOutHuman > 0 ? amountInHuman / amountOutHuman : null);
              const valueRaw = t.value ?? t.total_value ?? t.total ?? null;
              let valueNum = valueRaw != null ? Number(valueRaw) : null;
              if (valueNum != null && Number.isFinite(valueNum) && valueNum >= 1e12) valueNum = valueNum / 1e18;
              const quoteStablecoins = ['USDT', 'USDC', 'BUSD', 'DAI'];
              const tokenInUpper = (t.tokenIn ?? t.token_in ?? '').toString().toUpperCase();
              const valueIsUsd = quoteStablecoins.includes(tokenInUpper);
              const pnlRealized = t.pnl ?? t.pnlUsd ?? t.pnl_usd ?? t.profitUsd ?? t.profit_usd ?? t.realizedPnl ?? t.realized_pnl ?? null;
              const currentPriceUsd = otaOpenDetailLivePrice;
              const canComputePnl = valueIsUsd && Number.isFinite(amountInHuman) && Number.isFinite(amountOutHuman) && Number.isFinite(currentPriceUsd);
              const estimatedPnlUsd = canComputePnl ? amountOutHuman * currentPriceUsd - amountInHuman : null;
              const positionValueUsd = (Number.isFinite(amountOutHuman) && Number.isFinite(currentPriceUsd)) ? amountOutHuman * currentPriceUsd : null;
              return (
                <>
                  <div className="auto-trade-panel-ota-open-detail-derived">
                    <span className="auto-trade-panel-ota-open-detail-label">Derived values (calculated in UI):</span>
                    <dl className="auto-trade-panel-ota-open-detail-dl">
                      {entryPrice != null && <><dt>Entry price (quote per base)</dt><dd>{formatNumber(entryPrice, 6)}</dd></>}
                      {valueNum != null && Number.isFinite(valueNum) && <><dt>Value {valueIsUsd ? 'USD' : ''}</dt><dd>{formatNumber(valueNum, 4)}{valueIsUsd ? ' USD' : ''}</dd></>}
                      {pnlRealized != null && <><dt>Realized PnL</dt><dd className={Number(pnlRealized) >= 0 ? 'positive' : 'negative'}>{formatNumber(Number(pnlRealized), 2)} USD</dd></>}
                    </dl>
                  </div>
                  <div className="auto-trade-panel-ota-open-detail-live">
                    <span className="auto-trade-panel-ota-open-detail-label">LIVE (current price + estimated PnL):</span>
                    <dl className="auto-trade-panel-ota-open-detail-dl">
                      {currentPriceUsd != null && Number.isFinite(currentPriceUsd) && (
                        <><dt>Current price ({t.tokenOut ?? t.token_out ?? 'base'} USD)</dt><dd>{formatNumber(currentPriceUsd, 4)} USD</dd></>
                      )}
                      {positionValueUsd != null && (
                        <><dt>Position value (est.)</dt><dd>{formatNumber(positionValueUsd, 2)} USD</dd></>
                      )}
                      {estimatedPnlUsd != null && (
                        <><dt>Estimated PnL (unrealized)</dt><dd className={estimatedPnlUsd >= 0 ? 'positive' : 'negative'}>{formatNumber(estimatedPnlUsd, 2)} USD</dd></>
                      )}
                      {otaOpenDetailModal && (otaOpenDetailLivePrice === null || otaOpenDetailLivePrice === undefined) && (t.tokenOut ?? t.token_out) && (
                        <><dt>Current price</dt><dd>Loading...</dd></>
                      )}
                    </dl>
                  </div>
                </>
              );
            })()}
            <div className="auto-trade-panel-ota-open-detail-meta">
              <span className="auto-trade-panel-ota-open-detail-label">All fields (LIVE):</span>
              <dl className="auto-trade-panel-ota-open-detail-dl">
                {Object.keys(otaOpenDetailModal).sort().map(key => {
                  const val = otaOpenDetailModal[key];
                  const display = val == null ? '—' : typeof val === 'object' && val !== null && !(val instanceof Date)
                    ? JSON.stringify(val)
                    : String(val);
                  return (
                    <React.Fragment key={key}>
                      <dt>{key}</dt>
                      <dd title={display}>{display}</dd>
                    </React.Fragment>
                  );
                })}
              </dl>
            </div>
            {(otaOpenDetailModal.txHash || otaOpenDetailModal.tx_hash) && (
              <p className="auto-trade-panel-ota-open-detail-tx">
                <a
                  href={((otaOpenDetailModal.chain || '').toString().toLowerCase() === 'sei')
                    ? `https://seitrace.com/tx/${otaOpenDetailModal.txHash || otaOpenDetailModal.tx_hash}`
                    : `https://bscscan.com/tx/${otaOpenDetailModal.txHash || otaOpenDetailModal.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View transaction on explorer <ExternalLink size={14} />
                </a>
              </p>
            )}
            <div className="modal-footer" style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-color, #333)' }}>
              <button type="button" className="btn btn-primary" onClick={() => setOtaOpenDetailModal(null)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Persistent popup: OTA LLM opened a Direct Entry position, all details, not a toast. */}
      {otaNewPositionPopup && (
        <Modal
          isOpen={!!otaNewPositionPopup}
          onClose={() => setOtaNewPositionPopup(null)}
          title="OTA LLM - Open position (Direct Entry)"
          size="large"
          closeOnBackdropClick={false}
          closeOnEscape={false}
        >
          <div className="auto-trade-panel-ota-open-detail">
            <p className="auto-trade-panel-ota-open-detail-summary">
              <strong>{otaNewPositionPopup.token ?? '—'}</strong>
              {otaNewPositionPopup.entryPriceUsd != null && ` · Entry: $${formatNumber(otaNewPositionPopup.entryPriceUsd, 4)}`}
              {otaNewPositionPopup.amountUsd != null && ` · Value: $${formatNumber(Number(otaNewPositionPopup.amountUsd), 2)} USD`}
              {otaNewPositionPopup.openedAt && ` · ${new Date(otaNewPositionPopup.openedAt).toLocaleString()}`}
            </p>
            <div className="auto-trade-panel-ota-open-detail-derived">
              <span className="auto-trade-panel-ota-open-detail-label">Position details:</span>
              <dl className="auto-trade-panel-ota-open-detail-dl">
                {otaNewPositionPopup.token != null && <><dt>Token</dt><dd>{otaNewPositionPopup.token}</dd></>}
                {(otaNewPositionPopup.positionId ?? otaNewPositionPopup.id) != null && <><dt>Position ID</dt><dd>{String(otaNewPositionPopup.positionId ?? otaNewPositionPopup.id)}</dd></>}
                {otaNewPositionPopup.status != null && <><dt>Status</dt><dd>{otaNewPositionPopup.status}</dd></>}
                {otaNewPositionPopup.amountOut != null && <><dt>Amount (out)</dt><dd>{formatNumber(Number(otaNewPositionPopup.amountOut), 6)}</dd></>}
                {otaNewPositionPopup.entryPriceUsd != null && <><dt>Entry price (USD)</dt><dd>{formatNumber(Number(otaNewPositionPopup.entryPriceUsd), 4)}</dd></>}
                {otaNewPositionPopup.amountUsd != null && <><dt>Value (USD)</dt><dd>{formatNumber(Number(otaNewPositionPopup.amountUsd), 2)} USD</dd></>}
                {otaNewPositionPopup.openedAt != null && <><dt>Opened at</dt><dd>{new Date(otaNewPositionPopup.openedAt).toLocaleString()}</dd></>}
                {otaNewPositionPopup.maxLossPct != null && <><dt>Max loss %</dt><dd>{formatNumber(Number(otaNewPositionPopup.maxLossPct), 1)}%</dd></>}
              </dl>
            </div>
            <div className="auto-trade-panel-ota-open-detail-meta">
              <span className="auto-trade-panel-ota-open-detail-label">All fields:</span>
              <dl className="auto-trade-panel-ota-open-detail-dl">
                {Object.keys(otaNewPositionPopup).sort().map(key => {
                  const val = otaNewPositionPopup[key];
                  const display = val == null ? '—' : typeof val === 'object' && val !== null && !(val instanceof Date)
                    ? JSON.stringify(val)
                    : String(val);
                  return (
                    <React.Fragment key={key}>
                      <dt>{key}</dt>
                      <dd title={display}>{display}</dd>
                    </React.Fragment>
                  );
                })}
              </dl>
            </div>
            <div className="modal-footer" style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-color, #333)' }}>
              <button type="button" className="btn btn-primary" onClick={() => setOtaNewPositionPopup(null)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* OTA Auto status: global blockers are separated from per-token telemetry. */}
      {(policy.enabled || walletAddress) && (
        <section className="auto-trade-panel-why-no-open" aria-label="Confirmed reasons OTA cannot open">
          <div className="auto-trade-panel-why-no-open-card">
            <div className="auto-trade-panel-why-no-open-header">
              <span className="auto-trade-panel-why-no-open-title">Stare OTA Auto (server)</span>
            </div>
            <div className="auto-trade-panel-why-no-open-body">
              {autoRuntimeSummary?.headline && (
                <div className={`auto-trade-panel-why-no-open-summary auto-trade-panel-why-no-open-summary--${autoRuntimeSummary.tone || 'warning'}`}>
                  <div className="auto-trade-panel-why-no-open-summary-headline">{autoRuntimeSummary.headline}</div>
                  <p className="auto-trade-panel-why-no-open-summary-copy">{autoRuntimeSummary.summary}</p>
                  {Array.isArray(autoRuntimeSummary.cards) && autoRuntimeSummary.cards.length > 0 && (
                    <div className="auto-trade-panel-why-no-open-metrics" role="list" aria-label="Server-confirmed auto runtime summary">
                      {autoRuntimeSummary.cards.map((card) => (
                        <div key={card.label} className="auto-trade-panel-why-no-open-metric" role="listitem">
                          <span className="auto-trade-panel-why-no-open-metric-label">{card.label}</span>
                          <strong className="auto-trade-panel-why-no-open-metric-value">{card.value}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {(() => {
                const hints = autoExecutionStatus?.diagnostic?.hints ?? [];
                const circuitOpen = autoExecutionStatus?.circuitBreaker?.openUntil;
                const noTrackedTokens = autoExecutionStatus?.diagnostic && Array.isArray(autoExecutionStatus.diagnostic.trackedTokens) && autoExecutionStatus.diagnostic.trackedTokens.length === 0;
                const workerDisabled = autoExecutionStatus != null && autoExecutionStatus.enabled === false;
                const loopNotRunning = autoExecutionStatus != null && autoExecutionStatus.enabled === true && autoExecutionStatus.isRunning === false;
                const userNotInQueue = autoExecutionStatus?.diagnostic && autoExecutionStatus.diagnostic.userInQueue === false && policy.enabled && walletAddress;
                const trackedTokens = Array.isArray(autoExecutionStatus?.diagnostic?.trackedTokens) ? autoExecutionStatus.diagnostic.trackedTokens : [];
                const latestExecutorDecision = autoExecutionStatus?.latestExecutorDecision || null;
                const latestAnalysisSignal = autoExecutionStatus?.latestAnalysisSignal || null;
                const latestAdaptiveGuardText = formatAdaptiveGuard(latestAnalysisSignal?.adaptiveGuard);
                const latestExecutionResult = autoExecutionStatus?.latestExecutionResult || null;
                const otaAutoClarity = autoExecutionStatus?.otaAutoClarity || null;
                const hasAny =
                  hints.length > 0 ||
                  circuitOpen ||
                  noTrackedTokens ||
                  workerDisabled ||
                  loopNotRunning ||
                  userNotInQueue ||
                  latestExecutorDecision ||
                  latestAnalysisSignal ||
                  latestExecutionResult ||
                  otaAutoClarity;
                if (autoExecutionStatus == null) {
                  return (
                    <p className="auto-trade-panel-why-no-open-none">
                      {walletAddress
                        ? 'Server status not loaded: wallet is connected, but backend has not returned confirmed Auto status yet.'
                        : 'Status not loaded: connect wallet and reload. Only server-confirmed causes appear here.'}
                    </p>
                  );
                }
                if (!hasAny) {
                  return <p className="auto-trade-panel-why-no-open-none">No impediment reported by the server. If positions still do not open, check backend logs for "blocked", "skipped", "Trade gate", or "PolicyEngine".</p>;
                }
                return (
                  <>
                    {hints.length > 0 && (
                      <div className="auto-trade-panel-why-no-open-hints">
                        <ul>
                          {hints.map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {circuitOpen && (
                      <div className="auto-trade-panel-why-no-open-circuit">
                        <strong>Circuit breaker active</strong> until {new Date(circuitOpen).toLocaleString()}
                        {autoExecutionStatus.circuitBreaker.consecutiveFailures != null && (
                          <span> ({autoExecutionStatus.circuitBreaker.consecutiveFailures} consecutive failures)</span>
                        )}
                      </div>
                    )}
                    {noTrackedTokens && (
                      <div className="auto-trade-panel-why-no-open-hint">OTA_TRACKED_TOKENS is empty on the server; there are no tokens to analyze. Set the production baseline on backend: BTC,ETH,BNB,LINK,XRP,ADA,AVAX,SOL,DOGE.</div>
                    )}
                    {workerDisabled && (
                      <div className="auto-trade-panel-why-no-open-hint">Worker disabled on server (OTA_AUTO_EXECUTION_ENABLED is not true).</div>
                    )}
                    {loopNotRunning && (
                      <div className="auto-trade-panel-why-no-open-hint">Monitoring loop is not running on backend (enabled but isRunning=false). Check Render startup logs for "Market monitoring cycle started"; redeploy if missing.</div>
                    )}
                    {userNotInQueue && (
                      <div className="auto-trade-panel-why-no-open-hint">You are not in the executor queue. Reload the OTA page with Auto ON after Authorize Bot so policy/get is called and you are registered.</div>
                    )}
                    <div className="auto-trade-panel-why-no-open-hints" style={{ marginTop: '0.75rem' }}>
                      <ul>
                        <li>
                          Worker runtime: <strong>{autoExecutionStatus?.enabled ? (autoExecutionStatus?.isRunning === false ? 'enabled but loop not running' : 'enabled and running') : 'disabled'}</strong>
                        </li>
                        {otaAutoClarity && (
                          <>
                            <li>
                              Executor queue: <strong>{otaAutoClarity.userCurrentlyActiveInExecutor ? 'wallet is in queue' : 'wallet is NOT in queue'}</strong>
                            </li>
                            <li>
                              Chain policy:{' '}
                              <strong>
                                {otaAutoClarity.chainPolicyEnabled === true
                                  ? 'enabled on-chain'
                                  : otaAutoClarity.chainPolicyEnabled === false
                                    ? 'disabled on-chain'
                                    : policy.enabled === true
                                      ? 'enabled via policy/get'
                                      : policy.enabled === false
                                        ? 'disabled via policy/get'
                                        : 'unknown'}
                              </strong>
                            </li>
                            <li>
                              Safety gate (BSC):{' '}
                              <strong>
                                {otaAutoClarity.safetyBlockedBsc === true
                                  ? 'blocked: stopAll/BSC safety stop active'
                                  : otaAutoClarity.safetyBlockedBsc === false
                                    ? 'clear: stopAll=false and BSC stop=false'
                                    : 'unknown: runtime safety check missing'}
                              </strong>
                            </li>
                          </>
                        )}
                        <li>
                          Tracked tokens on server: <strong>{trackedTokens.length > 0 ? trackedTokens.join(', ') : 'none configured'}</strong>
                        </li>
                        {latestAnalysisSignal && (
                          <li>
                            Latest analysis signal: <strong>{String(latestAnalysisSignal.signal || '—').toUpperCase()}</strong>
                            {latestAnalysisSignal.token ? ` · ${latestAnalysisSignal.token}` : ''}
                            {latestAnalysisSignal.created_at ? ` @ ${new Date(latestAnalysisSignal.created_at).toLocaleString()}` : ''}
                          </li>
                        )}
                        {latestAdaptiveGuardText && (
                          <li>
                            Adaptive open block: <strong>{latestAdaptiveGuardText}</strong>
                          </li>
                        )}
                        {latestExecutorDecision && (
                          <li>
                            Latest recorded executor decision (per-token): <strong>{String(latestExecutorDecision.final_action || '—')}</strong>
                            {latestExecutorDecision.final_reason ? ` · ${latestExecutorDecision.final_reason}` : ''}
                            {latestExecutorDecision.token ? ` · ${latestExecutorDecision.token}` : ''}
                            {latestExecutorDecision.created_at ? ` @ ${new Date(latestExecutorDecision.created_at).toLocaleString()}` : ''}
                          </li>
                        )}
                        {latestExecutionResult && (
                          <li>
                            Latest execution result: <strong>{String(latestExecutionResult.action || latestExecutionResult.side || latestExecutionResult.status || '—')}</strong>
                            {latestExecutionResult.token ? ` · ${latestExecutionResult.token}` : ''}
                            {latestExecutionResult.created_at ? ` @ ${new Date(latestExecutionResult.created_at).toLocaleString()}` : ''}
                          </li>
                        )}
                      </ul>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </section>
      )}

      {(policy.enabled || walletAddress) && (
        <section className="auto-trade-panel-matrix-trace" aria-label="OTA Matrix live analysis trace">
          <div className="auto-trade-panel-matrix-trace-card">
            <div className="auto-trade-panel-matrix-trace-header">
              <span className="auto-trade-panel-matrix-trace-title">Matrix live analysis</span>
              <span className="auto-trade-panel-matrix-trace-subtitle">
                OTA Engine / OpenAI / Claude events from the live executor buffer
              </span>
            </div>
            <OtaFuturesAgentTraceStrip userId={walletAddress} />
          </div>
        </section>
      )}

      {/* Analyzed tokens come from the backend production contract. */}
      {autoExecutionStatus?.diagnostic?.trackedTokens?.length > 0 && (policy.enabled || walletAddress) && (
        <section className="auto-trade-panel-why-no-open" aria-label="Tracked tokens and how to remove one">
          <div className="auto-trade-panel-why-no-open-card">
            <div className="auto-trade-panel-why-no-open-header">
              <span className="auto-trade-panel-why-no-open-title">Tokens currently analyzed on server</span>
            </div>
            <div className="auto-trade-panel-why-no-open-body">
              <p className="auto-trade-panel-why-no-open-hint" style={{ marginBottom: '0.5rem' }}>
                <strong>{autoExecutionStatus.diagnostic.trackedTokens.join(', ')}</strong>
              </p>
              <p className="auto-trade-panel-why-no-open-hint" style={{ fontSize: '0.85rem', marginTop: 0 }}>
                The list comes from <strong>Render → backend-server → Environment → OTA_TRACKED_TOKENS</strong>. You cannot deselect it from the UI.
              </p>
              <p className="auto-trade-panel-why-no-open-hint" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                <strong>To change analyzed tokens:</strong> edit <code>OTA_TRACKED_TOKENS</code> on Render, keep only tokens that pass <code>/ota-config-health</code>, then Save → Redeploy. Current production baseline:
              </p>
              <code className="auto-trade-panel-why-no-open-hint" style={{ display: 'block', marginTop: '0.25rem', padding: '0.35rem', background: 'rgba(0,0,0,0.2)', borderRadius: 4, fontSize: '0.8rem', wordBreak: 'break-all' }} title="Copy and set as OTA_TRACKED_TOKENS on Render">
                BTC,ETH,BNB,LINK,XRP,ADA,AVAX,SOL,DOGE
              </code>
            </div>
          </div>
        </section>
      )}

      {/* AI Monitoring Status Panel - ONLY when enabled */}
      {policy.enabled && (
        <section className="auto-trade-panel-monitoring" aria-label="AI Monitoring status">
          <div className="auto-trade-panel-monitoring-header">
            <div className="auto-trade-panel-monitoring-header-left">
              <div className="auto-trade-panel-monitoring-dot" aria-hidden />
              <div>
                <div className="auto-trade-panel-monitoring-title">
                  AI Monitoring Active
                </div>
                <div className="auto-trade-panel-monitoring-countdown">
                  Next scan in {Math.floor(nextScanCountdown / 60)}:{String(nextScanCountdown % 60).padStart(2, '0')}
                </div>
              </div>
            </div>
            <div className="auto-trade-panel-monitoring-actions">
              <button
                type="button"
                className="auto-trade-panel-btn-view-signals"
                onClick={() => navigate('/dex-edu/signals')}
              >
                <Eye size={14} aria-hidden />
                View Signals
              </button>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="auto-trade-panel-monitoring-stats">
            <div className="auto-trade-panel-monitoring-stat">
              <div className="auto-trade-panel-monitoring-stat-label">Signals Today</div>
              <div className="auto-trade-panel-monitoring-stat-value highlight">{stats.signalsToday}</div>
            </div>
            <div className="auto-trade-panel-monitoring-stat">
              <div className="auto-trade-panel-monitoring-stat-label">Total Signals</div>
              <div className="auto-trade-panel-monitoring-stat-value">{stats.totalSignals}</div>
            </div>
            <div className="auto-trade-panel-monitoring-stat">
              <div className="auto-trade-panel-monitoring-stat-label" title="From API signal history; not the executor's current decision">
                Latest analysis signal
              </div>
              <div className="auto-trade-panel-monitoring-stat-value secondary">
                {stats.lastSignal || 'None yet'}
              </div>
            </div>
          </div>

          {autoExecutionStatus?.latestExecutorDecision && (
            <div className="auto-trade-panel-monitoring-clarity" style={{ marginTop: 8, fontSize: '0.8rem', color: '#94a3b8' }}>
              <strong>Latest recorded executor decision (DB, per-token):</strong>{' '}
              {String(autoExecutionStatus.latestExecutorDecision.final_action || '—')} ·{' '}
              {String(autoExecutionStatus.latestExecutorDecision.final_reason || '—')} ·{' '}
              {autoExecutionStatus.latestExecutorDecision.token || '—'}
              {autoExecutionStatus.latestExecutorDecision.created_at
                ? ` @ ${new Date(autoExecutionStatus.latestExecutorDecision.created_at).toLocaleString()}`
                : ''}
            </div>
          )}
          
          {/* Worker status (when backend exposes GET /api/ai-trading/auto-execution/status) */}
          {(() => {
            return (
          <div className={`auto-trade-panel-worker-status ${workerActive ? 'active' : 'inactive'}`} aria-label="Worker status">
            <div className={`auto-trade-panel-worker-dot ${workerActive ? 'active' : 'inactive'}`} aria-hidden />
            {autoExecutionStatus ? (
              <>
                <span className="auto-trade-panel-worker-meta">
                  <strong className="auto-trade-panel-worker-label">Worker:</strong>{' '}
                  {workerActive ? (
                    <span className="auto-trade-panel-worker-value--active">Active</span>
                  ) : autoExecutionStatus.isRunning === false ? (
                    <span className="auto-trade-panel-worker-value--warn" title="Backend monitoring loop not running – check Render logs">Loop not running</span>
                  ) : (
                    <span>Paused</span>
                  )}
                  {autoExecutionStatus.agentMode && (
                    <>
                      <span className="auto-trade-panel-agent-badge" title="LLM Agent mode"> | Agent</span>
                      {walletAddress && (
                        <label className="auto-trade-panel-agent-mode-toggle" title="Use LLM Agent (ReAct + tools) vs standard analyze">
                          <input
                            type="checkbox"
                            checked={autoExecutionStatus.useAgentMode !== false}
                            onChange={async (e) => {
                              const next = e.target.checked;
                              try {
                                await setAgentMode(walletAddress, next);
                                const status = await getAutoExecutionStatus(walletAddress);
                                setAutoExecutionStatus(status);
                              } catch (err) {
                                toast.error(err?.message || 'Failed to update Agent mode');
                              }
                            }}
                            aria-label="Use LLM Agent mode"
                          />
                          <span className="auto-trade-panel-agent-mode-label">{autoExecutionStatus.useAgentMode !== false ? 'Agent ON' : 'Agent OFF'}</span>
                        </label>
                      )}
                    </>
                  )}
                </span>
                {autoExecutionStatus.lastRunAt != null && (
                  <span className="auto-trade-panel-worker-meta">
                    Last run: {new Date(autoExecutionStatus.lastRunAt).toLocaleString()}
                  </span>
                )}
                {typeof autoExecutionStatus.executionsCount24h === 'number' && (
                  <span className="auto-trade-panel-worker-meta">
                    Executions (24h): {autoExecutionStatus.executionsCount24h}
                  </span>
                )}
                {autoExecutionStatus.agentMode && Array.isArray(autoExecutionStatus.agent?.alerts) && autoExecutionStatus.agent.alerts.length > 0 && (
                  <div className="auto-trade-panel-agent-alerts" role="alert">
                    {autoExecutionStatus.agent.alerts.map((a, i) => (
                      <span key={i} className="auto-trade-panel-agent-alert" title={a.message}>
                        <AlertCircle size={12} aria-hidden /> {a.message}
                      </span>
                    ))}
                  </div>
                )}
                {autoExecutionStatus.agentMode && agentSessions.length > 0 && (
                  <div className="auto-trade-panel-agent-sessions" style={{ marginTop: 8 }} id="agent-decisions-log" role="region" aria-label="Agent decisions log">
                    <button
                      type="button"
                      className="auto-trade-panel-agent-sessions-toggle"
                      onClick={() => setAgentSessionsOpen(!agentSessionsOpen)}
                      aria-expanded={agentSessionsOpen}
                      title="View Agent decisions log (GET /api/ai-trading/agent/sessions)"
                    >
                      {agentSessionsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      View Agent decisions log ({agentSessions.length})
                    </button>
                    {agentSessionsOpen && (
                      <ul className="auto-trade-panel-agent-sessions-list">
                        {agentSessions.slice(0, 10).map((s) => {
                          const isExpanded = expandedSessionId === s.id;
                          const turns = Array.isArray(s.turns) ? s.turns : [];
                          return (
                            <li key={s.id} className="auto-trade-panel-agent-session-item">
                              <button
                                type="button"
                                className="auto-trade-panel-agent-session-header"
                                onClick={() => setExpandedSessionId(isExpanded ? null : s.id)}
                                aria-expanded={isExpanded}
                                aria-controls={`agent-session-turns-${s.id}`}
                              >
                                <span className={`auto-trade-panel-agent-decision auto-trade-panel-agent-decision--${s.decision || 'hold'}`}>
                                  {s.decision || 'hold'}
                                </span>
                                <span className="auto-trade-panel-agent-token">{s.token}</span>
                                {s.summary && <span className="auto-trade-panel-agent-summary" title={s.summary}>{String(s.summary).slice(0, 50)}…</span>}
                                {s.createdAt && <span className="auto-trade-panel-agent-time">{new Date(s.createdAt).toLocaleString()}</span>}
                                {turns.length > 0 && (
                                  <span className="auto-trade-panel-agent-expand-icon" aria-hidden>
                                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                  </span>
                                )}
                              </button>
                              {isExpanded && turns.length > 0 && (
                                <div id={`agent-session-turns-${s.id}`} className="auto-trade-panel-agent-turns" role="region" aria-label="Agent thought and action sequence">
                                  {turns.map((t, idx) => (
                                    <div key={idx} className="auto-trade-panel-agent-turn">
                                      {t.role === 'assistant' && t.content && (
                                        <div className="auto-trade-panel-agent-turn-thought">
                                          <strong>Agent thought:</strong> {String(t.content).slice(0, 300)}{String(t.content).length > 300 ? '…' : ''}
                                        </div>
                                      )}
                                      {t.tool && (
                                        <div className="auto-trade-panel-agent-turn-action">
                                          <strong>Action:</strong> {t.tool}
                                          {t.args && Object.keys(t.args).length > 0 && (
                                            <span> ({JSON.stringify(t.args).slice(0, 80)}{JSON.stringify(t.args).length > 80 ? '…' : ''})</span>
                                          )}
                                          {t.result != null && (
                                            <>
                                              {' → '}
                                              <strong>Result:</strong> {String(t.result).slice(0, 150)}{String(t.result).length > 150 ? '…' : ''}
                                            </>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </>
            ) : (
              <span className="auto-trade-panel-worker-meta">
                <strong className="auto-trade-panel-worker-label">Worker:</strong> status unavailable
              </span>
            )}
          </div>
            ); })()}

          {/* P1.5 PnL & risk observability: display when backend exposes GET /ai-trading/performance/metrics and /risk-metrics. */}
          <div className="auto-trade-panel-pnl-section" aria-label="PnL and risk metrics">
            <div className="auto-trade-panel-pnl-header">
              <BarChart2 size={14} aria-hidden />
              <span>PnL & risk</span>
            </div>
            {pnlMetrics === null && <span className="auto-trade-panel-worker-meta">Loading…</span>}
            {pnlMetrics === 'unavailable' && (
              <div className="auto-trade-panel-pnl-values-row">
                <span className="auto-trade-panel-pnl-item">
                  <span className="auto-trade-panel-pnl-item-label">OTA trades:</span>
                  <span className="auto-trade-panel-pnl-item-value neutral">{otaExecutions.length}</span>
                </span>
                {(() => {
                  const totalPnl = otaExecutions.reduce((sum, t) => {
                    const p = t.pnl ?? t.pnlUsd ?? t.pnl_usd ?? t.profitUsd ?? t.profit_usd ?? t.realizedPnl ?? t.realized_pnl;
                    return sum + (p != null ? Number(p) : 0);
                  }, 0);
                  if (otaExecutions.length > 0) {
                    return (
                      <span className="auto-trade-panel-pnl-item">
                        <span className="auto-trade-panel-pnl-item-label">Net P&L (from list):</span>
                        <span className={`auto-trade-panel-pnl-item-value ${totalPnl >= 0 ? 'positive' : 'negative'}`}>
                          {totalPnl >= 0 ? '+' : ''}{formatNumber(totalPnl, 2)} USD
                        </span>
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
            {pnlMetrics && pnlMetrics !== 'unavailable' && (
              <div className="auto-trade-panel-pnl-values-row">
                {(() => {
                  const profitTotal = (closedFromExecutions ?? 0) + (closedFromDirectEntry ?? 0);
                  return (
                    <span className="auto-trade-panel-pnl-item">
                      <span className="auto-trade-panel-pnl-item-label">Total profit obtained (USD):</span>
                      <span className={`auto-trade-panel-pnl-item-value ${Number(profitTotal) >= 0 ? 'positive' : 'negative'}`}>
                        {formatNumber(profitTotal, 2)}
                      </span>
                    </span>
                  );
                })()}
                {(() => {
                  const toPnlUsdWr = (raw) => {
                    if (raw == null) return 0;
                    const n = Number(raw);
                    if (!Number.isFinite(n)) return 0;
                    return n >= 1e12 ? n / 1e18 : n;
                  };
                  const wins = otaExecutions.filter(t => {
                    const p = t.pnl ?? t.pnlUsd ?? t.pnl_usd ?? t.profitUsd ?? t.profit_usd ?? t.realizedPnl ?? t.realized_pnl;
                    return toPnlUsdWr(p) > 0;
                  }).length;
                  const total = otaExecutions.length;
                  const computedWinRate = total > 0 ? (wins / total) * 100 : null;
                  const displayWinRate = (pnlMetrics.winRate != null && pnlMetrics.winRate > 0) ? pnlMetrics.winRate : computedWinRate;
                  if (displayWinRate == null) return null;
                  return (
                    <span className="auto-trade-panel-pnl-item">
                      <span className="auto-trade-panel-pnl-item-label">Win rate:</span>
                      <span className="auto-trade-panel-pnl-item-value neutral">{formatPercentage(displayWinRate)}</span>
                    </span>
                  );
                })()}
                {/* Number aligned with Worker: 24h Auto executions from status. Do not use trade_outcomes count; it may include manual/direct-entry and give unconfirmed figures. */}
                {(typeof autoExecutionStatus?.executionsCount24h === 'number' || pnlMetrics.tradesCount != null || otaExecutions.length > 0) && (
                  <span className="auto-trade-panel-pnl-item">
                    <span className="auto-trade-panel-pnl-item-label">Auto executions (24h):</span>
                    <span className="auto-trade-panel-pnl-item-value neutral">
                      {typeof autoExecutionStatus?.executionsCount24h === 'number'
                        ? autoExecutionStatus.executionsCount24h
                        : (pnlMetrics.tradesCount != null && pnlMetrics.tradesCount > 0 ? pnlMetrics.tradesCount : otaExecutions.length)}
                    </span>
                  </span>
                )}
                {pnlMetrics.maxDrawdown != null && (
                  <span className="auto-trade-panel-pnl-item">
                    <span className="auto-trade-panel-pnl-item-label">Max drawdown:</span>
                    <span className="auto-trade-panel-pnl-item-value neutral">{formatPercentage(pnlMetrics.maxDrawdown)}</span>
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Activity Feed – id pentru link din Open Orders */}
          <div id="ota-recent-activity">
            <div className="auto-trade-panel-activity-feed-header">
              <Activity size={14} aria-hidden />
              Recent Activity
            </div>
            <div className="auto-trade-panel-activity-feed">
              {activityFeed.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className={`auto-trade-panel-activity-item auto-trade-panel-activity-item--${activity.type === 'success' ? 'success' : activity.type === 'error' ? 'error' : activity.type === 'warning' ? 'warning' : 'info'}`}
                >
                  <span className="auto-trade-panel-activity-item-time">
                    {new Date(activity.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="auto-trade-panel-activity-item-msg">
                    {activity.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Info banner when Auto is enabled: OTA AI can execute automatically */}
      {policy.enabled && botAuthorized && (
        <div className="auto-trade-panel-banner auto-trade-panel-banner--success" role="status">
          <CheckCircle size={18} className="auto-trade-panel-banner-icon--success" aria-hidden />
          <p>OTA AI can execute <strong>buy</strong> and <strong>sell</strong> automatically: buy = open position (quote→token), sell = sell token from your vault (token→quote). Within your policy limits and the amount you authorized for the bot. Executions appear above with Buy/Sell label.</p>
        </div>
      )}
      {/* Info banner when bot is not authorized - informative, not blocking */}
      {!botAuthorized && (
        <div className="auto-trade-panel-banner auto-trade-panel-banner--warning" role="status">
          <AlertCircle size={18} className="auto-trade-panel-banner-icon--warning" aria-hidden />
          <p><strong className="auto-trade-panel-banner-strong">How to authorize OTA:</strong></p>
          <ol className="auto-trade-panel-banner-ol">
            <li>Connect wallet and complete <strong>OTA registration</strong> (right panel).</li>
            <li>Click the button above &quot;→ Go to Authorize Bot&quot; or scroll to the <strong>Authorize Bot</strong> panel on the right.</li>
            <li>Enter any amount in <strong>USD</strong> or <strong>BNB</strong> (10 recommended for start), click <strong>Authorize</strong> and sign in MetaMask.</li>
            <li>If you see &quot;Bot address is not configured&quot;, set <code>BOT_WALLET_ADDRESS</code> in backend (Render env vars).</li>
          </ol>
        </div>
      )}

      {/* LLM OTA AI – How to use (Agent Mode section) */}
      {autoExecutionStatus?.agentMode && (
        <section className={`auto-trade-panel-agent-howto ${agentHowToOpen ? 'is-open' : ''}`} aria-labelledby="ota-agent-howto-title">
          <button
            type="button"
            className="auto-trade-panel-learn-toggle auto-trade-panel-agent-howto-toggle"
            onClick={() => setAgentHowToOpen(!agentHowToOpen)}
            aria-expanded={agentHowToOpen}
            aria-controls="ota-agent-howto-body"
          >
            <Bot size={20} className="auto-trade-panel-agent-howto-icon" aria-hidden />
            <span id="ota-agent-howto-title">
              {agentHowToOpen ? 'LLM OTA AI – How to use it' : 'LLM OTA AI – How it works (click for details)'}
            </span>
            {agentHowToOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          <div id="ota-agent-howto-body" className="auto-trade-panel-learn-body auto-trade-panel-agent-howto-body" hidden={!agentHowToOpen}>
            <p className="auto-trade-panel-learn-desc">
              <strong>LLM OTA AI</strong> is an agent (ReAct + tool calling) that decides on its own: hold / open_buy / open_sell / close. It uses tools: get_market_data, get_recent_trades, get_agent_outcomes, finish.
            </p>
            <ol className="auto-trade-panel-how-it-works-steps" style={{ marginTop: 8, paddingLeft: 20 }}>
              <li><strong>Start Auto</strong> → Policy enabled + Bot authorized</li>
              <li><strong>Agent ON</strong> (default) → toggle in Worker area; you can disable (Agent OFF) for standard flow</li>
              <li><strong>Bot runs every 30–60s</strong> → backend sends market data + outcomes to OpenAI</li>
              <li><strong>Agent decides</strong> → hold / open_buy / open_sell / close, then executor runs if signal is valid</li>
              <li><strong>Executions</strong> appear in &quot;What OTA AI does&quot; + BSCScan link</li>
            </ol>
            <p className="auto-trade-panel-learn-tip" style={{ marginTop: 12 }}>
              <strong>Transparent decisions:</strong> &quot;View Agent decisions log&quot; – Thought → Action → Result for each session.
            </p>
          </div>
        </section>
      )}

      {/* How OTA learns – collapsible, buton evident */}
      <section className={`auto-trade-panel-learn ${learnSectionOpen ? 'is-open' : ''}`} aria-labelledby="ota-learn-title">
        <button
          type="button"
          className="auto-trade-panel-learn-toggle"
          onClick={() => setLearnSectionOpen(!learnSectionOpen)}
          aria-expanded={learnSectionOpen}
          aria-controls="ota-learn-body"
        >
          <Sparkles size={20} className="auto-trade-panel-learn-icon" aria-hidden />
          <span id="ota-learn-title">
            {learnSectionOpen ? 'How OTA learns (LLM – OpenAI)' : 'Click for more details – How OTA learns'}
          </span>
          {learnSectionOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        <div id="ota-learn-body" className="auto-trade-panel-learn-body" hidden={!learnSectionOpen}>
          <p className="auto-trade-panel-learn-desc">
            OTA is an LLM that learns from data exposed by the backend: <strong>Binance</strong> (24h trend, klines), <strong>your recent outcomes</strong> (manual + auto from DB), and <strong>live market data</strong>. Each scan sends context to the backend; the backend enriches it with Binance and your history, then sends it to OpenAI.
            {autoExecutionStatus?.agentMode && (
              <> <strong>Agent Mode</strong> adds tool calling (ReAct loop): the agent gathers data, reasons, and calls finish(decision).</>
            )}
          </p>
          <div className="auto-trade-panel-learn-badges">
            <span className="auto-trade-panel-learn-badge"><BarChart2 size={12} aria-hidden /> Binance 24h</span>
            <span className="auto-trade-panel-learn-badge">Recent outcomes</span>
            <span className="auto-trade-panel-learn-badge">Market data</span>
            {autoExecutionStatus?.agentMode && <span className="auto-trade-panel-learn-badge"><Bot size={12} aria-hidden /> Agent</span>}
            {aiModelStatus?.isFineTuned && (
              <span className="auto-trade-panel-learn-badge" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontWeight: 700 }}>
                🎯 Fine-Tuned OpenAI
              </span>
            )}
            {aiModelStatus?.outcomesCount > 0 && (
              <span className="auto-trade-panel-learn-badge" style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>
                {aiModelStatus.outcomesCount} outcomes recorded
              </span>
            )}
          </div>
          <p className="auto-trade-panel-learn-tip">
            <strong>To improve learning:</strong> Record outcomes after manual swaps on <button type="button" className="auto-trade-panel-learn-link" onClick={() => navigate('/dex-edu/swap')}>Swap</button> (so recentOutcomes grow). Keep Auto enabled so scans run with your history.
          </p>
        </div>
      </section>
      
      {accessRequirementsModal && (
        <Modal
          isOpen={!!accessRequirementsModal}
          onClose={() => setAccessRequirementsModal(null)}
          title={accessRequirementsModal.title}
          size="medium"
          className="auto-trade-panel-direct-entry-error-modal"
        >
          <div className="auto-trade-panel-direct-entry-error-content">
            <p className="auto-trade-panel-direct-entry-error-message" role="alert">
              Check the items below. Anything marked with <strong>✗</strong> must be fixed before continuing.
            </p>
            <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
              {(accessRequirementsModal.checks || []).map((item, idx) => (
                <div key={`access-check-${idx}`} style={{ border: '1px solid rgba(148, 163, 184, 0.25)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                    {item.ok ? <CheckCircle size={15} color="#22c55e" /> : <AlertCircle size={15} color="#ef4444" />}
                    <span>{item.ok ? '✓' : '✗'} {item.label}</span>
                  </div>
                  {!item.ok && item.fix && (
                    <div style={{ marginTop: 6, fontSize: 13, color: 'var(--dex-text-secondary, #aaa)' }}>
                      What to do: {item.fix}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {accessRequirementsModal.hint && (
              <p className="auto-trade-panel-direct-entry-error-allowlist-hint" style={{ marginTop: 10, fontSize: 13 }}>
                {accessRequirementsModal.hint}
              </p>
            )}
            <div className="auto-trade-panel-direct-entry-error-actions">
              {accessRequirementsModal.ctaLabel && (
                <button
                  type="button"
                  className="auto-trade-panel-btn-open-allowlist"
                  onClick={handleAccessRequirementsCta}
                >
                  {accessRequirementsModal.ctaLabel}
                </button>
              )}
              <button
                type="button"
                className="auto-trade-panel-btn-close-error"
                onClick={() => setAccessRequirementsModal(null)}
              >
                Got it
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Direct Entry error modal: consistent popup with full message. */}
      {directEntryErrorModal && (
        <Modal
          isOpen={!!directEntryErrorModal}
          onClose={() => setDirectEntryErrorModal(null)}
          title={directEntryErrorModal.title}
          size="medium"
          className="auto-trade-panel-direct-entry-error-modal"
        >
          <div className="auto-trade-panel-direct-entry-error-content">
            <p className="auto-trade-panel-direct-entry-error-message" role="alert">
              {directEntryErrorModal.message}
            </p>
            {directEntryErrorModal.openAllowlist && (
              <p className="auto-trade-panel-direct-entry-error-allowlist-hint" style={{ marginTop: 8, fontSize: 13, color: 'var(--dex-text-secondary, #aaa)' }}>
                BNB is represented on-chain as <strong>0x0</strong>. In Allowlist, add <strong>BNB</strong> and pair <strong>BNB → token</strong> (for example BNB -> LINK), then retry Direct Entry.
              </p>
            )}
            <div className="auto-trade-panel-direct-entry-error-actions">
              {directEntryErrorModal.openAllowlist && (
                <button
                  type="button"
                  className="auto-trade-panel-btn-open-allowlist"
                  onClick={() => {
                    loadAllowlistFromStorage();
                    setActiveTab('allowlist');
                    setDirectEntryErrorModal(null);
                    requestAnimationFrame(() => {
                      setTimeout(() => {
                        const el = document.getElementById('ota-auto-trade-panel-tabs');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 80);
                    });
                  }}
                >
                  Open Allowlist tab
                </button>
              )}
              {directEntryErrorModal.bscScanUrl && (
                <a
                  href={directEntryErrorModal.bscScanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="auto-trade-panel-btn-open-allowlist"
                  style={{ marginLeft: directEntryErrorModal.openAllowlist ? 8 : 0 }}
                >
                  View on BSCScan
                </a>
              )}
              {directEntryErrorModal.openRpcRepair && (
                <button
                  type="button"
                  className="auto-trade-panel-btn-open-allowlist"
                  style={{ background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.5)', color: '#ef4444', marginLeft: (directEntryErrorModal.openAllowlist || directEntryErrorModal.bscScanUrl) ? 8 : 0 }}
                  onClick={() => {
                    setDirectEntryErrorModal(null);
                    setShowRpcRepairModal(true);
                  }}
                >
                  🔧 Fix RPC automatically
                </button>
              )}
              <button
                type="button"
                className="auto-trade-panel-btn-close-error"
                onClick={() => setDirectEntryErrorModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      <RpcRepairModal
        isOpen={showRpcRepairModal}
        onClose={() => setShowRpcRepairModal(false)}
        onFixed={() => setShowRpcRepairModal(false)}
      />
    </div>
  )
});

AutoTradePanel.displayName = 'AutoTradePanel';

export default AutoTradePanel;
