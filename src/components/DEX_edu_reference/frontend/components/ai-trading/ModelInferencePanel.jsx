import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Brain, TrendingUp, TrendingDown, Minus, Activity, RefreshCw,
  AlertTriangle, Shield, Target, Database, Zap, BookOpen, ChevronDown, CheckCircle, AlertCircle } from 'lucide-react';
import { useModelInference } from '../../hooks/useModelInference';
import { useOTAAccess } from '../../hooks/useOTAAccess';
import { getAutoExecutionStatus, getAgentSessions, getLastSignal, getOTAQuota, getOTAStats } from '../../services/aiTradingApiService';
import { getMetaControllerStatus, makeDecision as metaMakeDecision, recordOutcome as metaRecordOutcome } from '../../services/otaMetaControllerService';
import { getBanditStatistics, selectStrategy as banditSelectStrategy, resetStatistics as banditResetStatistics } from '../../services/otaBanditService';
import { getBacktestMetrics, runBacktest, runWalkForward } from '../../services/otaBacktestService';
import { getMetrics, getRiskMetrics, getTokenBreakdown } from '../../services/performanceApiService';
import { otaApiRequest } from '../../utils/otaApiClient';
import { getApiBaseUrl, API_ENDPOINTS } from '../../../config/apiEndpoints.js';
import TokenLogo from '../common/TokenLogo';
import '../../styles/components/model-inference-panel.css';
import '../../styles/components/auto-trade-panel.css';

const TOKENS = [
  { symbol: 'BTC',  label: 'BTC/USDT' },
  { symbol: 'ETH',  label: 'ETH/USDT' },
  { symbol: 'BNB',  label: 'BNB/USDT' },
  { symbol: 'LINK', label: 'LINK/USDT' },
  { symbol: 'XRP',  label: 'XRP/USDT' },
  { symbol: 'ADA',  label: 'ADA/USDT' },
  { symbol: 'AVAX', label: 'AVAX/USDT' },
  { symbol: 'SOL',  label: 'SOL/USDT' },
  { symbol: 'DOGE', label: 'DOGE/USDT' },
];

const REGIME_CONFIG = {
  bull:     { icon: TrendingUp,   color: '#10b981', label: 'BULL' },
  bear:     { icon: TrendingDown, color: '#ef4444', label: 'BEAR' },
  sideways: { icon: Minus,        color: '#94a3b8', label: 'SIDEWAYS' },
};

const isFineTuneQuotaError = (msg) =>
  typeof msg === 'string' &&
  (
    msg.toLowerCase().includes('hard limit') ||
    msg.toLowerCase().includes('quota remaining') ||
    msg.toLowerCase().includes('billing')
  );

const extractFineTuneJobId = (value) => {
  if (typeof value !== 'string') return null;
  const m = value.match(/\b(ftjob-[A-Za-z0-9]+)\b/i);
  return m?.[1] || null;
};

/** Formats the Level69 recommendation for UI: spacing, explicit "Level 64"/"Level 65" to avoid 64/61 confusion. */
function formatLevel69Recommendation(recommendation) {
  if (recommendation == null || typeof recommendation !== 'string') return recommendation || '';
  let s = recommendation.replace(/_/g, ' ');
  s = s.replace(/\blevel64\b/gi, 'Level 64').replace(/\blevel65\b/gi, 'Level 65').replace(/\blevel69\b/gi, 'Level 69');
  return s;
}

/* Custom token dropdown with logos */
function TokenDropdown({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = TOKENS.find(t => t.symbol === value) || TOKENS[0];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="mip-token-dropdown" style={{ position: 'relative' }}>
      <button
        type="button"
        className="mip-token-trigger"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
      >
        <TokenLogo symbol={selected.symbol} size="xs" />
        <span className="mip-token-trigger-label">{selected.label}</span>
        <ChevronDown size={13} style={{ marginLeft: 'auto', opacity: 0.6, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      {open && (
        <div className="mip-token-menu">
          {TOKENS.map(t => (
            <button
              key={t.symbol}
              type="button"
              className={`mip-token-option ${t.symbol === value ? 'active' : ''}`}
              onClick={() => { onChange(t.symbol); setOpen(false); }}
            >
              <TokenLogo symbol={t.symbol} size="xs" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ModelInferencePanel({ className = '', externalBrainTabRequest = null }) {
  const { walletAddress } = useOTAAccess();
  const {
    status, regimePrediction, returnPrediction,
    loading, error, predictRegime, predictReturn, clearPredictions
  } = useModelInference();

  const [token, setToken] = useState('BNB');
  const [ftStats, setFtStats] = useState(null);
  const [ftLoading, setFtLoading] = useState(false);
  const [ftJobStatus, setFtJobStatus] = useState(null);
  const [ftTrackedJobId, setFtTrackedJobId] = useState(null);
  const [ftQuotaPrecheck, setFtQuotaPrecheck] = useState({
    checking: false,
    blocked: false,
    reason: null,
    checkedAt: null,
    estimatedCostUsd: null,
    quotaRemainingUsd: null,
  });
  const [ftStatsLoaded, setFtStatsLoaded] = useState(false);
  const [ftStatsError, setFtStatsError] = useState(null);
  const [ftStatsCheckedAt, setFtStatsCheckedAt] = useState(null);
  const [runtimeStatus, setRuntimeStatus] = useState(null);
  const [runtimeLoading, setRuntimeLoading] = useState(false);
  const [brainTab, setBrainTab] = useState('meta');
  const [brainData, setBrainData] = useState({
    loading: false,
    error: null,
    meta: null,
    bandit: null,
    backtest: null,
    walkForwardInsufficientData: false,
    walkForwardMessage: null,
    lastCheckedAt: null,
  });
  const [learningTelemetry, setLearningTelemetry] = useState({
    loading: false,
    error: null,
    analysesToday: null,
    analysesLeft: null,
    maxAnalysesPerDay: null,
    outcomesLearned: null,
    winRate: null,
    totalSignals: null,
    executions24h: null,
    workerEnabled: null,
    sessionsCount: null,
    recentSessions: [],
    lastSignal: null,
    lastCheckedAt: null,
  });
  const [trendTelemetry, setTrendTelemetry] = useState({
    loading: false,
    error: null,
    winRate24h: null,
    winRate7d: null,
    drawdown24h: null,
    drawdown7d: null,
    lastCheckedAt: null,
  });
  const [tokenTelemetry, setTokenTelemetry] = useState({
    loading: false,
    error: null,
    rows: [],
    lastCheckedAt: null,
  });
  const [llmCommand, setLlmCommand] = useState('');
  const [llmCommandLoading, setLlmCommandLoading] = useState(false);
  const [llmCommandResult, setLlmCommandResult] = useState(null);
  const [llmCommandError, setLlmCommandError] = useState(null);
  const [governanceRunLoading, setGovernanceRunLoading] = useState(false);
  const [governanceRunResult, setGovernanceRunResult] = useState(null);
  const [governanceRunError, setGovernanceRunError] = useState(null);
  const [deployments, setDeployments] = useState([]);
  const [deploymentsLoading, setDeploymentsLoading] = useState(false);
  const [addChallengerLoading, setAddChallengerLoading] = useState(false);
  const [addChallengerError, setAddChallengerError] = useState(null);
  const [addChallengerName, setAddChallengerName] = useState('challenger-v1');
  const [addChallengerRollout, setAddChallengerRollout] = useState(10);
  const [showAddChallengerForm, setShowAddChallengerForm] = useState(false);
  const [banditRegime, setBanditRegime] = useState('bull');
  const [banditSelectLoading, setBanditSelectLoading] = useState(false);
  const [banditSelectError, setBanditSelectError] = useState(null);
  const [banditSelectResult, setBanditSelectResult] = useState(null);
  const [banditResetLoading, setBanditResetLoading] = useState(false);
  const [metaDecisionLoading, setMetaDecisionLoading] = useState(false);
  const [metaDecisionError, setMetaDecisionError] = useState(null);
  const [metaDecisionResult, setMetaDecisionResult] = useState(null);
  const [metaRecordLoading, setMetaRecordLoading] = useState(false);
  const [metaRecordError, setMetaRecordError] = useState(null);
  const [metaRecordPnl, setMetaRecordPnl] = useState('');
  const [backtestStrategy, setBacktestStrategy] = useState('trend-following');
  const [backtestRunLoading, setBacktestRunLoading] = useState(false);
  const [lastBacktestResult, setLastBacktestResult] = useState(null);
  const [walkForwardRunLoading, setWalkForwardRunLoading] = useState(false);
  const [lastWalkForwardResult, setLastWalkForwardResult] = useState(null);

  useEffect(() => {
    const requestedTab = externalBrainTabRequest?.tab;
    if (!requestedTab) return;
    if (requestedTab === 'meta' || requestedTab === 'bandit' || requestedTab === 'backtest' || requestedTab === 'governance') {
      setBrainTab(requestedTab);
    }
  }, [externalBrainTabRequest?.tab, externalBrainTabRequest?.requestedAt]);

  const loadFtStats = useCallback(async () => {
    try {
      const base = getApiBaseUrl();
      const r = await fetch(`${base}/ai-trading/fine-tuning/stats`, { cache: 'no-store' });
      const d = r.ok ? await r.json() : null;
      const stats = d?.stats ?? (d?.success ? { ...d, success: undefined } : null);
      if (d?.success && stats) {
        setFtStats(stats);
        setFtStatsError(null);
      } else {
        setFtStats(null);
        setFtStatsError('fine-tuning stats unavailable');
      }
    } catch {
      setFtStats(null);
      setFtStatsError('fine-tuning stats unavailable');
    } finally {
      setFtStatsLoaded(true);
      setFtStatsCheckedAt(new Date().toISOString());
    }
  }, []);

  useEffect(() => {
    loadFtStats();
    const id = setInterval(loadFtStats, 30000);
    return () => clearInterval(id);
  }, [loadFtStats]);

  const loadRuntimeStatus = useCallback(async () => {
    setRuntimeLoading(true);
    try {
      const base = getApiBaseUrl();
      const [r64, r66, r67, r68, r69, r73, r74] = await Promise.all([
        fetch(`${base}/ai-trading/level5/level64/status`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch(`${base}/ai-trading/level5/level66/status`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch(`${base}/ai-trading/level5/level67/status`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch(`${base}/ai-trading/level5/level68/status`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch(`${base}/ai-trading/level5/level69/status`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch(`${base}/ai-trading/level5/level73/status`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch(`${base}/ai-trading/level5/level74/status`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      setRuntimeStatus({ level64: r64, level66: r66, level67: r67, level68: r68, level69: r69, level73: r73, level74: r74 });
    } catch {
      setRuntimeStatus(null);
    } finally {
      setRuntimeLoading(false);
    }
  }, []);

  const loadDeployments = useCallback(async () => {
    setDeploymentsLoading(true);
    try {
      const base = getApiBaseUrl();
      const r = await fetch(`${base}/ai-trading/model-policy/deployments`, { cache: 'no-store' });
      const d = r.ok ? await r.json() : null;
      if (d?.success && Array.isArray(d.deployments)) {
        setDeployments(d.deployments);
      } else {
        setDeployments([]);
      }
    } catch {
      setDeployments([]);
    } finally {
      setDeploymentsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRuntimeStatus();
  }, [loadRuntimeStatus]);

  useEffect(() => {
    if (brainTab === 'governance') loadDeployments();
  }, [brainTab, loadDeployments]);

  const loadBrainData = useCallback(async (includeWalkForward = false) => {
    setBrainData((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [meta, bandit, backtest, walkForward] = await Promise.all([
        getMetaControllerStatus().catch(() => null),
        getBanditStatistics(walletAddress ? { userId: walletAddress } : {}).catch(() => null),
        getBacktestMetrics({ token, timeframe: '5m', quoteToken: 'USDT', strategy: backtestStrategy }).catch(() => null),
        includeWalkForward
          ? runWalkForward({
              strategy: 'trend-following',
              token,
              timeframe: '5m',
              quoteToken: 'USDT',
              trainBars: 288,
              testBars: 144,
              stepBars: 144,
              maxFolds: 6,
            }).catch(() => null)
          : Promise.resolve(null),
      ]);
      const mergedBacktest = walkForward?.results
        ? {
            ...(backtest || {}),
            walkForward: walkForward.results,
          }
        : backtest;
      setBrainData({
        loading: false,
        error: null,
        meta,
        bandit,
        backtest: mergedBacktest,
        walkForwardInsufficientData: walkForward?.insufficientData === true,
        walkForwardMessage: walkForward?.message ?? null,
        lastCheckedAt: new Date().toISOString(),
      });
    } catch (e) {
      setBrainData((prev) => ({
        ...prev,
        loading: false,
        error: e?.message || 'brain telemetry unavailable',
        walkForwardInsufficientData: false,
        walkForwardMessage: null,
        lastCheckedAt: new Date().toISOString(),
      }));
    }
  }, [token, walletAddress, backtestStrategy]);

  useEffect(() => {
    loadBrainData(false);
    const id = setInterval(() => loadBrainData(false), 45000);
    return () => clearInterval(id);
  }, [loadBrainData]);

  useEffect(() => {
    if (brainTab !== 'backtest') return;
    loadBrainData(true);
    const id = setInterval(() => loadBrainData(true), 45000);
    return () => clearInterval(id);
  }, [brainTab, loadBrainData]);

  useEffect(() => {
    if (brainTab !== 'meta') return;
    loadBrainData(false);
  }, [brainTab, loadBrainData]);

  const handleBanditSelect = useCallback(async () => {
    setBanditSelectError(null);
    setBanditSelectResult(null);
    setBanditSelectLoading(true);
    try {
      const res = await banditSelectStrategy({
        regime: banditRegime,
        userId: walletAddress || undefined,
      });
      setBanditSelectResult(res?.strategy ?? res?.selectedStrategy ?? res?.selected ?? null);
      await loadBrainData();
    } catch (e) {
      setBanditSelectError(e?.message || 'Select strategy failed');
    } finally {
      setBanditSelectLoading(false);
    }
  }, [banditRegime, walletAddress, loadBrainData]);

  const handleRunBacktest = useCallback(async () => {
    setBacktestRunLoading(true);
    try {
      const res = await runBacktest({
        strategy: backtestStrategy,
        token,
        timeframe: '5m',
        quoteToken: 'USDT',
        initialCapital: 10000,
      });
      setLastBacktestResult(res?.results ? { backtest: res.results } : null);
      if (res?.results) await loadBrainData(false);
    } catch (e) {
      setLastBacktestResult({ error: e?.message || 'Backtest failed' });
    } finally {
      setBacktestRunLoading(false);
    }
  }, [backtestStrategy, token, loadBrainData]);

  const handleRunWalkForward = useCallback(async () => {
    setWalkForwardRunLoading(true);
    try {
      const res = await runWalkForward({
        strategy: backtestStrategy,
        token,
        timeframe: '5m',
        quoteToken: 'USDT',
        initialCapital: 10000,
        trainBars: 288,
        testBars: 144,
        stepBars: 144,
        maxFolds: 6,
      });
      if (res?.insufficientData) {
        setLastWalkForwardResult({ insufficientData: true, message: res?.message });
      } else {
        setLastWalkForwardResult(res?.results ? res : null);
        if (res?.results) await loadBrainData(false);
      }
    } catch (e) {
      setLastWalkForwardResult({ error: e?.message || 'Walk-forward failed' });
    } finally {
      setWalkForwardRunLoading(false);
    }
  }, [backtestStrategy, token, loadBrainData]);

  const handleBanditReset = useCallback(async () => {
    setBanditSelectError(null);
    setBanditResetLoading(true);
    try {
      await banditResetStatistics();
      await loadBrainData();
    } catch (e) {
      setBanditSelectError(e?.message || 'Reset failed');
    } finally {
      setBanditResetLoading(false);
    }
  }, [loadBrainData]);

  const handleMetaMakeDecision = useCallback(async () => {
    setMetaDecisionError(null);
    setMetaDecisionResult(null);
    setMetaDecisionLoading(true);
    try {
      const res = await metaMakeDecision({
        context: { token, timeframe: '5m', quoteToken: 'USDT' },
        strategySignals: []
      });
      const d = res?.decision;
      if (d && typeof d === 'object') {
        const act = d.action ?? d.decision;
        const conf = d.confidence != null ? ` ${(Number(d.confidence) * 100).toFixed(0)}%` : '';
        setMetaDecisionResult(`${act ?? '—'}${conf}`);
      } else {
        setMetaDecisionResult(res?.decision != null ? String(res.decision) : (res?.action != null ? String(res.action) : null));
      }
      await loadBrainData();
    } catch (e) {
      setMetaDecisionError(e?.message || 'Make decision failed');
    } finally {
      setMetaDecisionLoading(false);
    }
  }, [token, loadBrainData]);

  const handleMetaRecordOutcome = useCallback(async () => {
    setMetaRecordError(null);
    setMetaRecordLoading(true);
    try {
      const raw = metaRecordPnl.trim() === '' ? 0 : Number(metaRecordPnl);
      const pnl = Number.isFinite(raw) ? raw : 0;
      const ts = new Date().toISOString();
      await metaRecordOutcome({
        tradeResult: { pnl, strategy: 'manual', timestamp: ts },
        context: { pnl, timestamp: ts }
      });
      setMetaRecordPnl('');
      await loadBrainData();
    } catch (e) {
      setMetaRecordError(e?.message || 'Record outcome failed');
    } finally {
      setMetaRecordLoading(false);
    }
  }, [metaRecordPnl, loadBrainData]);

  const loadLearningTelemetry = useCallback(async () => {
    if (!walletAddress) {
      setLearningTelemetry((prev) => ({
        ...prev,
        loading: false,
        error: null,
        analysesToday: null,
        analysesLeft: null,
        maxAnalysesPerDay: null,
        outcomesLearned: null,
        winRate: null,
        totalSignals: null,
        executions24h: null,
        workerEnabled: null,
        sessionsCount: null,
        recentSessions: [],
        lastSignal: null,
        lastCheckedAt: null,
      }));
      return;
    }
    setLearningTelemetry((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [quota, autoStatus, sessionsRes, lastSignalRes, otaStats] = await Promise.all([
        getOTAQuota(walletAddress).catch(() => null),
        getAutoExecutionStatus(walletAddress).catch(() => null),
        getAgentSessions(walletAddress, 10).catch(() => null),
        getLastSignal(walletAddress).catch(() => null),
        getOTAStats(walletAddress).catch(() => null),
      ]);
      const sessions = Array.isArray(sessionsRes?.sessions) ? sessionsRes.sessions : [];
      const statsRoot = otaStats?.stats || otaStats?.data || otaStats || {};
      const outcomesLearned =
        statsRoot.totalOutcomes ??
        statsRoot.outcomesCount ??
        statsRoot.learnedOutcomes ??
        statsRoot.tradeOutcomesCount ??
        null;
      const winRate =
        statsRoot.winRate ??
        statsRoot.win_rate ??
        statsRoot.learningWinRate ??
        null;
      const totalSignals =
        statsRoot.totalSignals ??
        statsRoot.signalsCount ??
        statsRoot.analysesCount ??
        null;
      setLearningTelemetry({
        loading: false,
        error: null,
        analysesToday: quota?.analysesToday ?? null,
        analysesLeft: quota?.analysesLeft ?? null,
        maxAnalysesPerDay: quota?.maxAnalysesPerDay ?? null,
        outcomesLearned,
        winRate,
        totalSignals,
        executions24h: typeof autoStatus?.executionsCount24h === 'number' ? autoStatus.executionsCount24h : null,
        workerEnabled: typeof autoStatus?.enabled === 'boolean' ? autoStatus.enabled : null,
        sessionsCount: sessions.length,
        recentSessions: sessions.slice(0, 5),
        lastSignal: lastSignalRes?.lastSignal || null,
        lastCheckedAt: new Date().toISOString(),
      });
    } catch (e) {
      setLearningTelemetry((prev) => ({
        ...prev,
        loading: false,
        error: e?.message || 'learning telemetry unavailable',
        lastCheckedAt: new Date().toISOString(),
      }));
    }
  }, [walletAddress]);

  useEffect(() => {
    loadLearningTelemetry();
    const id = setInterval(loadLearningTelemetry, 30000);
    return () => clearInterval(id);
  }, [loadLearningTelemetry]);

  const loadTrendTelemetry = useCallback(async () => {
    if (!walletAddress) {
      setTrendTelemetry({
        loading: false,
        error: null,
        winRate24h: null,
        winRate7d: null,
        drawdown24h: null,
        drawdown7d: null,
        lastCheckedAt: null,
      });
      return;
    }
    setTrendTelemetry((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [m24, m7, r24, r7] = await Promise.all([
        getMetrics(walletAddress, { period: '24h' }).catch(() => null),
        getMetrics(walletAddress, { period: '7d' }).catch(() => null),
        getRiskMetrics(walletAddress, { period: '24h' }).catch(() => null),
        getRiskMetrics(walletAddress, { period: '7d' }).catch(() => null),
      ]);
      const getWinRate = (obj) => obj?.winRate ?? obj?.win_rate ?? obj?.metrics?.winRate ?? null;
      const getDrawdown = (obj) => obj?.riskMetrics?.maxDrawdown ?? obj?.maxDrawdown ?? obj?.max_drawdown ?? null;
      setTrendTelemetry({
        loading: false,
        error: null,
        winRate24h: getWinRate(m24),
        winRate7d: getWinRate(m7),
        drawdown24h: getDrawdown(r24),
        drawdown7d: getDrawdown(r7),
        lastCheckedAt: new Date().toISOString(),
      });
    } catch (e) {
      setTrendTelemetry((prev) => ({
        ...prev,
        loading: false,
        error: e?.message || 'trend telemetry unavailable',
        lastCheckedAt: new Date().toISOString(),
      }));
    }
  }, [walletAddress]);

  useEffect(() => {
    loadTrendTelemetry();
    const id = setInterval(loadTrendTelemetry, 45000);
    return () => clearInterval(id);
  }, [loadTrendTelemetry]);

  const loadTokenTelemetry = useCallback(async () => {
    if (!walletAddress) {
      setTokenTelemetry({ loading: false, error: null, rows: [], lastCheckedAt: null });
      return;
    }
    setTokenTelemetry((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const breakdown = await getTokenBreakdown(walletAddress, { period: '30d', limit: 8 }).catch(() => null);
      const rows = Array.isArray(breakdown?.breakdown) ? breakdown.breakdown : [];
      setTokenTelemetry({
        loading: false,
        error: null,
        rows,
        lastCheckedAt: new Date().toISOString(),
      });
    } catch (e) {
      setTokenTelemetry((prev) => ({
        ...prev,
        loading: false,
        error: e?.message || 'token telemetry unavailable',
        lastCheckedAt: new Date().toISOString(),
      }));
    }
  }, [walletAddress]);

  useEffect(() => {
    loadTokenTelemetry();
    const id = setInterval(loadTokenTelemetry, 60000);
    return () => clearInterval(id);
  }, [loadTokenTelemetry]);

  const sendLlmCommand = useCallback(async (presetCommand = null) => {
    const command = ((presetCommand ?? llmCommand) || '').trim();
    if (!command || llmCommandLoading) return;
    setLlmCommandLoading(true);
    setLlmCommandError(null);
    try {
      const level66Decision = runtimeStatus?.level66?.decision || null;
      const level73Decision = runtimeStatus?.level73?.decision || null;
      const level74Decision = runtimeStatus?.level74?.decision || null;
      const level69Latest = runtimeStatus?.level69?.latest || null;
      const localNoGoReasons = [
        learningTelemetry.workerEnabled === false ? 'worker paused' : null,
        level66Decision?.allowAutoStart === false ? 'level66 blocked' : null,
        level73Decision?.allowAutoStart === false ? 'level73 blocked' : null,
        level74Decision?.allowAutoStart === false ? 'level74 blocked' : null,
        level69Latest?.status && ['degraded', 'blocked'].includes(String(level69Latest.status).toLowerCase()) ? 'level69 issue' : null,
      ].filter(Boolean);
      const context = [
        `walletAddress=${walletAddress || 'unknown'}`,
        `token=${token}`,
        `autonomy=${localNoGoReasons.length === 0 ? 'GO' : `NO-GO(${localNoGoReasons.join(', ')})`}`,
      ].join(' | ');
      const res = await otaApiRequest(API_ENDPOINTS.OTA_CHAT, {
        method: 'POST',
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `OTA DIRECT COMMAND: ${command}\nContext: ${context}\nReturn: 1) interpretation 2) action 3) constraints 4) next step.`,
            },
          ],
          systemPrompt: 'You are OTA command interpreter. Never fabricate backend execution. If action needs backend endpoint not available, explicitly say blocked and what endpoint/config is needed.',
        }),
      });
      setLlmCommandResult({
        content: String(res?.content || '').trim() || 'No response',
        checkedAt: new Date().toISOString(),
      });
    } catch (e) {
      setLlmCommandError(e?.message || 'command failed');
    } finally {
      setLlmCommandLoading(false);
    }
  }, [llmCommand, llmCommandLoading, walletAddress, token, runtimeStatus, learningTelemetry.workerEnabled]);

  const quickCommands = [
    'Run guards check now and explain GO/NO-GO in 4 bullets.',
    `Analyze ${token}/USDT risk now and recommend AUTO ON or OFF.`,
    'Summarize last 5 decisions and what to improve next.',
    'Create a safer next-step plan for my OTA setup in 3 steps.',
  ];

  const getFineTuningJobStatus = useCallback(async (jobId) => {
    if (!jobId) return null;
    const base = getApiBaseUrl();
    const r = await fetch(`${base}/ai-trading/fine-tuning/jobs/${encodeURIComponent(jobId)}`, { cache: 'no-store' });
    if (!r.ok) return null;
    return r.json().catch(() => null);
  }, []);

  const runFineTuneQuotaPrecheck = useCallback(async () => {
    setFtQuotaPrecheck({
      checking: true,
      blocked: false,
      reason: null,
      checkedAt: new Date().toISOString(),
      estimatedCostUsd: null,
      quotaRemainingUsd: null,
    });
    try {
      const base = getApiBaseUrl();
      // Explicit quota pre-check (dry-run) before starting a real FT job.
      const governedRes = await fetch(`${base}/ai-trading/fine-tuning/start-governed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: true }),
      }).catch(() => null);
      if (governedRes?.ok) {
        const governedData = await governedRes.json().catch(() => ({}));
        const pre = governedData?.precheck || governedData?.data || governedData || {};
        const toNum = (v) => {
          const n = Number(v);
          return Number.isFinite(n) ? n : null;
        };
        const estimatedCostUsd = toNum(
          pre?.estimatedCostUsd ??
          pre?.estimatedCost ??
          pre?.jobCostUsd ??
          pre?.costUsd
        );
        const quotaRemainingUsd = toNum(
          pre?.quotaRemainingUsd ??
          pre?.quotaRemaining ??
          pre?.remainingQuotaUsd ??
          pre?.remainingUsd
        );
        const message = String(
          pre?.error ||
          pre?.reason ||
          pre?.message ||
          governedData?.error ||
          governedData?.message ||
          ''
        );
        const explicitNoGo = (
          pre?.canStart === false ||
          pre?.allowed === false ||
          pre?.quotaOk === false ||
          pre?.okToStart === false
        );
        const numericNoGo = (
          estimatedCostUsd != null &&
          quotaRemainingUsd != null &&
          quotaRemainingUsd < estimatedCostUsd
        );
        if (explicitNoGo || numericNoGo || isFineTuneQuotaError(message)) {
          setFtQuotaPrecheck({
            checking: false,
            blocked: true,
            reason: message || 'Quota pre-check blocked by governed dry-run.',
            checkedAt: new Date().toISOString(),
            estimatedCostUsd,
            quotaRemainingUsd,
          });
          return false;
        }
        setFtQuotaPrecheck({
          checking: false,
          blocked: false,
          reason: message || null,
          checkedAt: new Date().toISOString(),
          estimatedCostUsd,
          quotaRemainingUsd,
        });
      }

      await loadFtStats();
      const candidateJobId =
        ftJobStatus?.jobId ||
        ftTrackedJobId ||
        extractFineTuneJobId(ftJobStatus?.error || '');
      if (candidateJobId) {
        const jobData = await getFineTuningJobStatus(candidateJobId).catch(() => null);
        const jobError =
          jobData?.error ||
          jobData?.job?.error ||
          jobData?.statusDetails?.error ||
          jobData?.statusMessage ||
          jobData?.message ||
          '';
        if (isFineTuneQuotaError(jobError)) {
          setFtQuotaPrecheck({
            checking: false,
            blocked: true,
            reason: `Quota pre-check blocked by latest FT job (${candidateJobId}).`,
            checkedAt: new Date().toISOString(),
            estimatedCostUsd: null,
            quotaRemainingUsd: null,
          });
          setFtJobStatus({ status: 'error', error: String(jobError), jobId: candidateJobId });
          return false;
        }
      }
      if (isFineTuneQuotaError(ftJobStatus?.error)) {
        setFtQuotaPrecheck({
          checking: false,
          blocked: true,
          reason: 'Quota pre-check blocked by previous fine-tuning error.',
          checkedAt: new Date().toISOString(),
          estimatedCostUsd: null,
          quotaRemainingUsd: null,
        });
        return false;
      }
      setFtQuotaPrecheck({
        checking: false,
        blocked: false,
        reason: null,
        checkedAt: new Date().toISOString(),
        estimatedCostUsd: null,
        quotaRemainingUsd: null,
      });
      return true;
    } catch {
      setFtQuotaPrecheck({
        checking: false,
        blocked: false,
        reason: 'Quota pre-check endpoint unavailable; using existing guards.',
        checkedAt: new Date().toISOString(),
        estimatedCostUsd: null,
        quotaRemainingUsd: null,
      });
      return true;
    }
  }, [loadFtStats, ftJobStatus?.jobId, ftJobStatus?.error, ftTrackedJobId, getFineTuningJobStatus]);

  const handleStartFineTuning = useCallback(async () => {
    const msg = 'Each job costs OpenAI credits. On Render, set OTA_AUTO_RETRAIN=false, OTA_LEVEL64_ENABLED=false, OTA_LEVEL64_AUTO_START=false so it does not start automatically. Are you sure you want to send it now?';
    if (!window.confirm(msg)) return;
    const canStart = await runFineTuneQuotaPrecheck();
    if (!canStart) return;
    setFtLoading(true);
    try {
      const base = getApiBaseUrl();
      const r = await fetch(`${base}/ai-trading/fine-tuning/start`, { method: 'POST' });
      const d = await r.json();
      if (d.success) {
        setFtTrackedJobId(d.jobId || null);
        setFtJobStatus({ status: 'started', jobId: d.jobId });
      } else {
        const extractedJobId = extractFineTuneJobId(d?.error || '');
        if (extractedJobId) setFtTrackedJobId(extractedJobId);
        setFtJobStatus({ status: 'error', error: d.error, jobId: extractedJobId || null });
        if (isFineTuneQuotaError(d?.error)) {
          setFtQuotaPrecheck({
            checking: false,
            blocked: true,
            reason: 'Fine-tuning blocked by project quota.',
            checkedAt: new Date().toISOString(),
            estimatedCostUsd: null,
            quotaRemainingUsd: null,
          });
        }
      }
    } catch (e) {
      const extractedJobId = extractFineTuneJobId(e?.message || '');
      if (extractedJobId) setFtTrackedJobId(extractedJobId);
      setFtJobStatus({ status: 'error', error: e.message });
      if (isFineTuneQuotaError(e?.message)) {
        setFtQuotaPrecheck({
          checking: false,
          blocked: true,
          reason: 'Fine-tuning blocked by project quota.',
          checkedAt: new Date().toISOString(),
          estimatedCostUsd: null,
          quotaRemainingUsd: null,
        });
      }
    } finally {
      setFtLoading(false);
    }
  }, [runFineTuneQuotaPrecheck, setFtTrackedJobId]);

  useEffect(() => {
    if (!ftStats?.readyForFineTuning || ftLoading) return;
    runFineTuneQuotaPrecheck();
    const id = setInterval(() => {
      if (!ftLoading) {
        runFineTuneQuotaPrecheck();
      }
    }, 60000);
    return () => clearInterval(id);
  }, [ftStats?.readyForFineTuning, ftLoading, runFineTuneQuotaPrecheck]);

  const handleRunGovernanceCycle = useCallback(async () => {
    if (governanceRunLoading) return;
    setGovernanceRunLoading(true);
    setGovernanceRunError(null);
    try {
      const base = getApiBaseUrl();
      // Recommended order for Level69 degraded: Level65 -> Level64 -> Level69 (doc OTA_LLM_AUTONOMY_LEVEL64_LEVEL69_REFERENCE).
      const level65Res = await fetch(`${base}/ai-trading/level5/level65/run`, { method: 'POST' });
      const level65Data = await level65Res.json().catch(() => null);
      const level64Res = await fetch(`${base}/ai-trading/level5/level64/run`, { method: 'POST' });
      const level64Data = await level64Res.json().catch(() => null);
      const level69Res = await fetch(`${base}/ai-trading/level5/level69/run`, { method: 'POST' });
      const level69Data = await level69Res.json().catch(() => null);
      const level67Res = await fetch(`${base}/ai-trading/level5/level67/run`, { method: 'POST' });
      const level67Data = await level67Res.json().catch(() => null);
      const level68Res = await fetch(`${base}/ai-trading/level5/level68/run`, { method: 'POST' });
      const level68Data = await level68Res.json().catch(() => null);
      setGovernanceRunResult({
        checkedAt: new Date().toISOString(),
        level65: level65Data,
        level64: level64Data,
        level69: level69Data,
        level67: level67Data,
        level68: level68Data,
      });
      await Promise.allSettled([loadRuntimeStatus(), loadBrainData()]);
    } catch (e) {
      setGovernanceRunError(e?.message || 'governance cycle failed');
    } finally {
      setGovernanceRunLoading(false);
    }
  }, [governanceRunLoading, loadRuntimeStatus, loadBrainData]);

  const handleAddChallenger = useCallback(async (e) => {
    e?.preventDefault?.();
    const name = (addChallengerName || 'challenger-v1').trim();
    if (!name) {
      setAddChallengerError('Name is required');
      return;
    }
    setAddChallengerLoading(true);
    setAddChallengerError(null);
    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/ai-trading/model-policy/deployments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          deployment_type: 'challenger',
          rollout_percent: Math.max(0, Math.min(100, Number(addChallengerRollout) || 10)),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.deploymentId) {
        setShowAddChallengerForm(false);
        setAddChallengerName('challenger-v1');
        setAddChallengerRollout(10);
        await loadDeployments();
        await loadRuntimeStatus();
      } else {
        setAddChallengerError(data?.error || res.statusText || 'Failed to create challenger');
      }
    } catch (err) {
      setAddChallengerError(err?.message || 'Request failed');
    } finally {
      setAddChallengerLoading(false);
    }
  }, [addChallengerName, addChallengerRollout, loadDeployments, loadRuntimeStatus]);

  const handlePredict = useCallback(async () => {
    const params = { token, quoteToken: 'USDT', timeframe: '5m' };
    await Promise.allSettled([predictRegime(params), predictReturn({ ...params, horizon: '5m' })]);
  }, [token, predictRegime, predictReturn]);

  const isFineTuned = status?.openAIModel?.startsWith('ft:');
  const fineTuneQuotaBlocked = ftJobStatus?.status === 'error' && isFineTuneQuotaError(ftJobStatus?.error);
  const fineTunePrecheckBlocked = fineTuneQuotaBlocked || ftQuotaPrecheck.blocked;
  const regimeKey = (regimePrediction?.regime || 'sideways').toLowerCase();
  const rc = REGIME_CONFIG[regimeKey] || REGIME_CONFIG.sideways;
  const RegimeIcon = rc.icon;
  const patterns = regimePrediction?.patterns || [];
  const trend = regimePrediction?.trend || null;
  const support = regimePrediction?.support;
  const resistance = regimePrediction?.resistance;
  const confidence = regimePrediction?.confidence;
  const expectedReturn = returnPrediction?.expectedReturn;
  const formatBlockedUntil = (ts) => {
    if (!ts) return 'n/a';
    const d = new Date(ts);
    return Number.isNaN(d.getTime()) ? String(ts) : d.toLocaleString();
  };
  const level66Decision = runtimeStatus?.level66?.decision;
  const level73Decision = runtimeStatus?.level73?.decision;
  const level74Decision = runtimeStatus?.level74?.decision;
  const level69Latest = runtimeStatus?.level69?.latest;
  const level64LatestRun = runtimeStatus?.level64?.recentRuns?.[0];
  const level67Latest = runtimeStatus?.level67?.latest;
  const level68LatestAction = runtimeStatus?.level68?.recentActions?.[0];
  const level67Details = level67Latest?.details || {};
  const level67GuardSignals = level67Details?.guardSignals || {};
  const level67WalkForward = level67Details?.walkForwardProxy || {};
  const governanceAction = level67Latest?.recommended_action || level67Latest?.recommendedAction || level68LatestAction?.action || null;
  const governanceReason = level67Latest?.reason || level68LatestAction?.reason || null;
  const governanceRecommendations = Array.isArray(runtimeStatus?.level67?.recentRecommendations)
    ? runtimeStatus.level67.recentRecommendations.slice(0, 5)
    : [];
  const governanceActions = Array.isArray(runtimeStatus?.level68?.recentActions)
    ? runtimeStatus.level68.recentActions.slice(0, 5)
    : [];
  const isGuardBlocked = (
    (level66Decision && level66Decision.allowAutoStart === false) ||
    (level73Decision && level73Decision.allowAutoStart === false) ||
    (level74Decision && level74Decision.allowAutoStart === false)
  );
  const liveGo = Boolean(runtimeStatus && !runtimeLoading && !isGuardBlocked);
  const liveNoGoReasons = [
    !runtimeStatus ? 'runtime status unavailable' : null,
    level66Decision?.allowAutoStart === false ? 'Level66 guard active' : null,
    level73Decision?.allowAutoStart === false ? 'Level73 execution quality guard active' : null,
    level74Decision?.allowAutoStart === false ? 'Level74 guard active' : null,
    level69Latest?.status && ['degraded', 'blocked'].includes(String(level69Latest.status).toLowerCase())
      ? `Level69 ${String(level69Latest.status).toLowerCase()}`
      : null,
  ].filter(Boolean);

  /* shorten model id: ft:gpt-4o-mini-2024-07-18:personal:ota-trader:DDNm325h → ota-trader:DDNm… */
  const shortModelId = status?.openAIModel
    ? status.openAIModel.split(':').slice(-2).join(':').slice(0, 22) + '…'
    : null;
  const outcomesLearnedDisplay =
    learningTelemetry.outcomesLearned ??
    status?.outcomesCount ??
    ftStats?.totalOutcomes ??
    null;
  const lastSignalDisplay = learningTelemetry.lastSignal
    ? `${String(learningTelemetry.lastSignal.token || '').toUpperCase()} ${String(learningTelemetry.lastSignal.side || '').toUpperCase()}`
    : null;
  const metaRoot = brainData.meta?.status || brainData.meta || {};
  const banditStatus = brainData.bandit?.status || {};
  const banditRoot = brainData.bandit?.statistics || brainData.bandit?.data || brainData.bandit || {};
  const lastBt = lastBacktestResult?.backtest;
  const backtestRoot = lastBt
    ? {
        winRate: lastBt.metrics?.winRate != null ? lastBt.metrics.winRate / 100 : null,
        sharpeRatio: lastBt.metrics?.sharpeRatio ?? null,
        maxDrawdown: lastBt.metrics?.maxDrawdown ?? null,
        totalReturn: lastBt.totalReturnPercent != null ? lastBt.totalReturnPercent / 100 : null,
        tradesCount: lastBt.trades ?? null,
      }
    : (brainData.backtest?.metrics || brainData.backtest || {});
  const walkForwardRoot = lastWalkForwardResult?.metrics ? { ...lastWalkForwardResult, metrics: lastWalkForwardResult.metrics } : (brainData.backtest?.walkForward || {});
  const wfMetrics = walkForwardRoot?.metrics || {};
  const banditRawStrategies = banditRoot?.strategies ?? banditRoot?.arms;
  let banditEntries = [];
  if (Array.isArray(banditRawStrategies)) {
    banditEntries = banditRawStrategies.map((s) => {
      if (s == null) return { name: '—', plays: 0 };
      if (typeof s === 'string') return { name: s, plays: 0 };
      if (typeof s === 'object' && (s.name != null || s.strategy != null)) return { name: s.name ?? s.strategy ?? '—', ...s };
      return { name: '—', plays: 0, ...(typeof s === 'object' ? s : {}) };
    });
  } else if (banditRawStrategies && typeof banditRawStrategies === 'object' && !Array.isArray(banditRawStrategies)) {
    banditEntries = Object.entries(banditRawStrategies).map(([name, s]) => ({ name, ...(s && typeof s === 'object' ? s : { plays: 0 }) }));
  } else if (Array.isArray(banditRoot?.strategyNames)) {
    banditEntries = banditRoot.strategyNames.map((n) => ({ name: typeof n === 'string' ? n : String(n), plays: 0 }));
  } else if (Array.isArray(banditRoot?.strategy_names)) {
    banditEntries = banditRoot.strategy_names.map((n) => ({ name: typeof n === 'string' ? n : String(n), plays: 0 }));
  } else if (typeof banditRoot === 'object' && banditRoot !== null && Object.keys(banditRoot).length > 0) {
    const skipKeys = ['algorithm', 'epsilon', 'totalPulls', 'pulls', 'status', 'statistics', 'bestStrategy', 'selectedStrategy', 'strategyNames', 'strategy_names'];
    banditEntries = Object.entries(banditRoot)
      .filter(([k]) => !skipKeys.includes(k))
      .map(([name, s]) => (s && typeof s === 'object' ? { name, ...s } : { name, plays: 0, value: s }));
  }
  const banditTotalPulls = banditEntries.reduce((sum, e) => sum + (Number(e.plays) || 0), 0);
  const banditBestStrategy = banditTotalPulls > 0 && banditEntries.length
    ? banditEntries.reduce((a, b) => (Number(a.avgReward ?? a.winRate ?? 0) >= Number(b.avgReward ?? b.winRate ?? 0) ? a : b))?.name ?? null
    : null;
  const banditAlgorithmDisplay = banditStatus?.algorithm
    ?? banditRoot?.algorithm
    ?? brainData.bandit?.algorithm
    ?? (typeof banditRoot?.epsilon === 'number' && Number.isFinite(banditRoot.epsilon) ? `ε=${Number(banditRoot.epsilon).toFixed(3)}` : null)
    ?? '—';
  const autonomyNoGoReasons = [
    learningTelemetry.workerEnabled === false ? 'worker paused' : null,
    level66Decision?.allowAutoStart === false ? `Level66 ${level66Decision.code || 'guard_active'} (${level66Decision.reason || 'blocked'})` : null,
    level73Decision?.allowAutoStart === false ? `Level73 ${level73Decision.code || 'guard_active'} (${level73Decision.reason || 'blocked'})` : null,
    level74Decision?.allowAutoStart === false ? `Level74 ${level74Decision.code || 'guard_active'} (${level74Decision.reason || 'blocked'})` : null,
    level69Latest?.status && ['degraded', 'blocked'].includes(String(level69Latest.status).toLowerCase())
      ? `Level69 ${String(level69Latest.status).toLowerCase()} (${level69Latest.code || formatLevel69Recommendation(level69Latest.recommendation) || 'degraded'})`
      : null,
  ].filter(Boolean);
  const autonomyGo = autonomyNoGoReasons.length === 0 && learningTelemetry.workerEnabled !== false;
  /** GOVERNANCE NO-GO: one reason per guard, avoids L74 duplication from L67 guardSignals + GET /level74. */
  const governanceNoGoReasons = (() => {
    const r = [];
    if (level73Decision?.allowAutoStart === false) {
      r.push(`Level73 blocked (${level73Decision.reason || level73Decision.code || 'execution_quality'})`);
    } else if (level67GuardSignals?.level73Blocked) {
      r.push('Level73 execution quality guard active');
    }
    if (level74Decision?.allowAutoStart === false) {
      r.push(`Level74 blocked (${level74Decision.reason || level74Decision.code || 'guard_active'})`);
    } else if (level67GuardSignals?.level74Blocked) {
      r.push('Level74 fine-tune reliability guard active');
    }
    if (level66Decision?.allowAutoStart === false) {
      r.push(`Level66 blocked (${level66Decision.reason || level66Decision.code || 'guard_active'})`);
    }
    if (level69Latest?.status && ['degraded', 'blocked'].includes(String(level69Latest.status).toLowerCase())) {
      r.push(`Level69 ${String(level69Latest.status).toLowerCase()}`);
    }
    return r;
  })();
  const governanceGo = governanceNoGoReasons.length === 0;
  /** When the only NO-GO reason is Level69 degraded, show a warning (orange), not red. */
  const governanceOnlyLevel69Degraded = governanceNoGoReasons.length === 1
    && String(governanceNoGoReasons[0]).toLowerCase().startsWith('level69');

  return (
    <div className={`model-inference-panel ${className}`}>

      {/* ── Header ── */}
      <div className="model-inference-panel-header">
        <div className="model-inference-panel-title-wrapper">
          <Brain size={16} className="model-inference-panel-icon" />
          <h3 className="model-inference-panel-title">AI Model Inference</h3>
          {isFineTuned && <span className="mip-badge-ft">Fine-Tuned</span>}
        </div>
        {(regimePrediction || returnPrediction) && (
          <button type="button" className="model-inference-panel-clear-btn" onClick={clearPredictions}>Clear</button>
        )}
      </div>

      {error && (
        <div className="model-inference-panel-error">
          <AlertTriangle size={13} /> <span>{typeof error === 'string' ? error : 'API error'}</span>
        </div>
      )}

      <div className="model-inference-panel-content">

        {/* ── Model Status ── */}
        {status && (
          <div className="model-inference-panel-section">
            <div className="model-inference-panel-section-title-wrapper">
              <Activity size={12} />
              <h4 className="model-inference-panel-section-title">Model Status</h4>
            </div>
            <div className="mip-status-card">
              <div className="mip-status-row">
                <span className="mip-status-label">Source</span>
                <span className="mip-status-value">
                  {isFineTuned ? '✦ Fine-Tuned OpenAI' : status?.source || 'Heuristic'}
                </span>
              </div>
              {isFineTuned && shortModelId && (
                <div className="mip-status-row">
                  <span className="mip-status-label">Model</span>
                  <span className="mip-status-value mip-model-id" title={status.openAIModel}>
                    {shortModelId}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Predict ── */}
        <div className="model-inference-panel-section">
          <div className="model-inference-panel-section-title-wrapper">
            <Target size={12} />
            <h4 className="model-inference-panel-section-title">Predict</h4>
          </div>
          <div className="mip-predict-row">
            <TokenDropdown value={token} onChange={setToken} disabled={loading} />
            <button
              type="button"
              className="model-inference-panel-predict-btn"
              onClick={handlePredict}
              disabled={loading}
            >
              {loading
                ? <><RefreshCw size={13} style={{ animation: 'mip-spin 1s linear infinite' }} /> Analyzing…</>
                : <><Brain size={13} /> Predict</>}
            </button>
          </div>
        </div>

        {/* ── Regime Result ── */}
        {regimePrediction && (
          <div className="model-inference-panel-section">
            <div className="model-inference-panel-section-title-wrapper">
              <Shield size={12} />
              <h4 className="model-inference-panel-section-title">Regime · {token}/USDT</h4>
            </div>
            <div className="model-inference-panel-prediction">
              <div className="model-inference-panel-prediction-header">
                <TokenLogo symbol={token} size="sm" />
                <RegimeIcon size={20} className={`regime-icon ${regimeKey}`} />
                <span className={`model-inference-panel-prediction-regime ${regimeKey}`}>{rc.label}</span>
                {confidence != null && (
                  <span className="mip-confidence-chip" title="Heuristic score; not a calibrated probability.">{(confidence * 100).toFixed(0)}%</span>
                )}
              </div>

              {patterns.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {patterns.map((p, i) => <span key={i} className="mip-pattern-tag">{p}</span>)}
                </div>
              )}

              {trend && (
                <div style={{ marginTop: 7, fontSize: '0.8em', color: 'var(--ds-text-secondary)' }}>
                  Trend:&nbsp;
                  <strong style={{ color: trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#94a3b8' }}>
                    {trend === 'up' ? '↑ UP' : trend === 'down' ? '↓ DOWN' : '→ FLAT'}
                  </strong>
                </div>
              )}

              {(support != null || resistance != null) && (
                <div style={{ marginTop: 6, display: 'flex', gap: 14, fontSize: '0.78em' }}>
                  {support != null && <span style={{ color: '#10b981' }}>▲ Support ${Number(support).toFixed(2)}</span>}
                  {resistance != null && <span style={{ color: '#ef4444' }}>▼ Resist ${Number(resistance).toFixed(2)}</span>}
                </div>
              )}

              {!regimePrediction.is_mock && (
                <div className="mip-prediction-meta">
                  <span className="model-inference-panel-prediction-label">Source</span>
                  <span style={{ fontSize: '0.75em', fontWeight: 700, color: '#10b981' }}>✦ Fine-Tuned AI</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Return Prediction ── */}
        {returnPrediction && (
          <div className="model-inference-panel-section">
            <div className="model-inference-panel-section-title-wrapper">
              <TrendingUp size={12} />
              <h4 className="model-inference-panel-section-title">Expected Return · 5m</h4>
            </div>
            <div className="model-inference-panel-prediction">
              <div className="model-inference-panel-prediction-header">
                <TokenLogo symbol={token} size="sm" />
                <span className={`model-inference-panel-prediction-return ${expectedReturn >= 0 ? 'positive' : 'negative'}`}>
                  {expectedReturn != null
                    ? `${expectedReturn >= 0 ? '+' : ''}${(expectedReturn * 100).toFixed(3)}%`
                    : '—'}
                </span>
                {returnPrediction.confidence != null && (
                  <span className="mip-confidence-chip" title="Heuristic score; not a calibrated probability.">{(returnPrediction.confidence * 100).toFixed(0)}%</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── LLM Fine-Tuning ── */}
        <div className="model-inference-panel-section">
          <div className="model-inference-panel-section-title-wrapper">
            <BookOpen size={12} />
            <h4 className="model-inference-panel-section-title">LLM Fine-Tuning</h4>
          </div>
          <p className="mip-ft-subtitle" style={{ marginTop: 4, marginBottom: 8, fontSize: '0.85rem', color: '#94a3b8' }}>
            You decide when and what gets sent. Below you can see all data that will be sent to OpenAI.
          </p>
          <div className="mip-ft-card">
            {ftStats ? (
              <>
                <div className="mip-ft-stats-grid">
                  {[
                    { val: ftStats.totalOutcomes, label: 'Dataset outcomes', color: '#818cf8' },
                    { val: ftStats.profitable,    label: 'Successful (profitable)', color: '#10b981' },
                    { val: ftStats.losing,        label: 'Losing',               color: '#ef4444' },
                    { val: ftStats.distinctTokens, label: 'Distinct tokens',     color: '#f59e0b' },
                  ].map(({ val, label, color }) => (
                    <div key={label} className="mip-ft-stat">
                      <div className="mip-ft-stat-value" style={{ color }}>{val}</div>
                      <div className="mip-ft-stat-label">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="mip-ft-job-status" style={{ marginTop: 6, background: ftStats.openAiConfigured ? 'rgba(16,185,129,0.08)' : 'rgba(100,116,139,0.15)', color: ftStats.openAiConfigured ? '#10b981' : '#94a3b8' }}>
                  <strong>OpenAI</strong>: {ftStats.openAiConfigured ? 'configured ✓' : 'not configured (set OPENAI_API_KEY on Render)'}
                  {ftStats.openAiConfigured && (
                    <span style={{ marginLeft: 8 }}>
                      · Jobs: {ftStats.totalJobs != null ? `${ftStats.totalJobs} run, ${ftStats.succeededJobs ?? 0} succeeded, ${ftStats.failedJobs ?? 0} failed` : '—'}
                      {ftStats.lastJobFinishedAt && ` · Last: ${typeof ftStats.lastJobFinishedAt === 'number' ? new Date(ftStats.lastJobFinishedAt * 1000).toLocaleString() : String(ftStats.lastJobFinishedAt)}`}
                    </span>
                  )}
                </div>
                <div className="mip-ft-source-note">
                  Source: <code>/ai-trading/fine-tuning/stats</code> — dataset from DB; OpenAI job counts from OpenAI API when backend has OPENAI_API_KEY.
                </div>
                <div className="mip-ft-job-status" style={{ marginTop: 8, background: 'rgba(99,102,241,0.12)', color: '#c7d2fe', border: '1px solid rgba(99,102,241,0.3)' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>What is sent to OpenAI (when you press the button)</div>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    <li>Dataset from DB: <strong>{ftStats.totalOutcomes ?? '—'}</strong> outcomes (min. {ftStats.minRequired ?? '—'}), buy {ftStats.buyExamples ?? '—'} / sell {ftStats.sellExamples ?? '—'}</li>
                    <li>Weighting: {ftStats.weighting?.enabled ? `ON (maxReplica=${ftStats.weighting?.maxReplica ?? '—'}, lookback=${ftStats.weighting?.tokenLookbackDays ?? '—'} days)` : 'OFF'}</li>
                    {Array.isArray(ftStats.topTokens) && ftStats.topTokens.length > 0 && (
                      <li>Included tokens (top): {ftStats.topTokens.slice(0, 5).map((t) => `${t.token} (${t.trades} trades)`).join(', ')}</li>
                    )}
                    <li>An OpenAI job is created; it costs credits (see quota below).</li>
                  </ul>
                </div>
                <div className="mip-ft-job-status" style={{ marginTop: 8, background: 'rgba(15,23,42,0.55)', color: '#cbd5e1' }}>
                  <div><strong>Dataset explainability</strong> <span style={{ opacity: 0.7, fontSize: '0.85em' }}>(updates when backend records new trade outcomes)</span></div>
                  <div>
                    Balance: buy {ftStats.buyExamples ?? '—'} / sell {ftStats.sellExamples ?? '—'}
                    {ftStats.buySellRatio != null && Number.isFinite(Number(ftStats.buySellRatio))
                      ? ` (ratio ${Number(ftStats.buySellRatio).toFixed(2)})`
                      : ''}
                  </div>
                  <div>
                    Outcomes: total {ftStats.totalOutcomes ?? '—'}, successful {ftStats.profitable ?? '—'}, losing {ftStats.losing ?? '—'} (same as grid above)
                  </div>
                  <div>
                    Weighting: {ftStats.weighting?.enabled ? 'ON' : 'OFF'}
                    {ftStats.weighting?.enabled
                      ? ` | maxReplica=${ftStats.weighting?.maxReplica ?? '—'} | tokenLookback=${ftStats.weighting?.tokenLookbackDays ?? '—'}d | tokenMinTrades=${ftStats.weighting?.tokenMinTrades ?? '—'}`
                      : ''}
                  </div>
                  {Array.isArray(ftStats.topTokens) && ftStats.topTokens.length > 0 && (
                    <div>
                      Top tokens: {ftStats.topTokens
                        .slice(0, 3)
                        .map((t) => `${t.token} (${t.trades} trades, ${(Number(t.winRate || 0) * 100).toFixed(1)}% WR)`)
                        .join(' | ')}
                    </div>
                  )}
                </div>

                {isFineTuned ? (
                  <div className="mip-ft-job-status" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                    ✅ Fine-Tuned model active — {shortModelId}
                  </div>
                ) : (
                  <>
                    <div className="mip-ft-progress-bar-track">
                      <div
                        className="mip-ft-progress-bar-fill"
                        style={{
                          width: `${Math.min(100, (ftStats.totalOutcomes / ftStats.minRequired) * 100)}%`,
                          background: ftStats.readyForFineTuning
                            ? 'linear-gradient(90deg,#10b981,#059669)'
                            : 'linear-gradient(90deg,#818cf8,#6366f1)',
                        }}
                      />
                    </div>
                    <div className="mip-ft-progress-label">
                      {ftStats.readyForFineTuning
                        ? '✅ Ready for OpenAI fine-tuning'
                        : `${ftStats.totalOutcomes} / ${ftStats.minRequired} outcomes needed`}
                    </div>
                  </>
                )}

                {ftJobStatus && (
                  <div
                    className="mip-ft-job-status"
                    style={{
                      background: ftJobStatus.status === 'started' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: ftJobStatus.status === 'started' ? '#10b981' : '#ef4444',
                    }}
                  >
                    {ftJobStatus.status === 'started' ? `✅ Job started: ${ftJobStatus.jobId || 'in progress'}` : `❌ ${ftJobStatus.error}`}
                  </div>
                )}
                {fineTuneQuotaBlocked && (
                  <div className="mip-ft-job-status" style={{ marginTop: 8, background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }}>
                    Fine-tuning blocked by project quota. Increase budget in OpenAI Limits/Billing, wait a few minutes, then retry.
                  </div>
                )}
                <div className="mip-ft-source-note">
                  Quota pre-check: {ftQuotaPrecheck.checking ? 'checking...' : fineTunePrecheckBlocked ? 'BLOCKED' : 'OK'}
                  {ftQuotaPrecheck.reason ? ` | ${ftQuotaPrecheck.reason}` : ''}
                  {ftQuotaPrecheck.estimatedCostUsd != null ? ` | est. cost $${Number(ftQuotaPrecheck.estimatedCostUsd).toFixed(2)}` : ''}
                  {ftQuotaPrecheck.quotaRemainingUsd != null ? ` | remaining $${Number(ftQuotaPrecheck.quotaRemainingUsd).toFixed(2)}` : ''}
                </div>

                {(runtimeLoading || runtimeStatus) && (
                  <div className="mip-ft-job-status" style={{ marginTop: 8, background: 'rgba(15,23,42,0.55)', color: '#cbd5e1' }}>
                    {runtimeLoading ? (
                      <>Checking runtime guards…</>
                    ) : (
                      <>
                        <div style={{ marginBottom: 6 }}>
                          <span
                            className={`auto-trade-panel-status-badge ${liveGo ? 'active' : 'inactive'}`}
                            title={liveGo ? 'All runtime guards allow execution.' : `Blocked by: ${liveNoGoReasons.join(', ') || 'runtime checks'}`}
                            style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                          >
                            {liveGo ? (
                              <>
                                <CheckCircle size={12} />
                                <span>LIVE GO</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle size={12} />
                                <span>LIVE NO-GO</span>
                              </>
                            )}
                          </span>
                        </div>
                        <div><strong>Runtime checks</strong></div>
                        {level64LatestRun && <div>Level64: {level64LatestRun.status} ({level64LatestRun.reason || level64LatestRun.gate_code || 'n/a'})</div>}
                        {level66Decision && (
                          <div>
                            Level66: {level66Decision.allowAutoStart === false ? 'BLOCKED' : 'ALLOW'}
                            {level66Decision.allowAutoStart === false ? ` until ${formatBlockedUntil(level66Decision.blockedUntil)}` : ''}
                          </div>
                        )}
                        {level73Decision && (
                          <div>
                            Level73: {level73Decision.allowAutoStart === false ? 'BLOCKED' : 'ALLOW'}
                            {level73Decision.allowAutoStart === false ? ` until ${formatBlockedUntil(level73Decision.blockedUntil)}` : ''}
                          </div>
                        )}
                        {level74Decision && (
                          <div>
                            Level74: {level74Decision.allowAutoStart === false ? 'BLOCKED' : 'ALLOW'}
                            {level74Decision.allowAutoStart === false ? ` until ${formatBlockedUntil(level74Decision.blockedUntil)}` : ''}
                          </div>
                        )}
                        {level69Latest && <div>Level69: {level69Latest.status} ({formatLevel69Recommendation(level69Latest.recommendation) || 'no recommendation'})</div>}
                        {level67Latest && <div>Level67: {(level67Latest.recommended_action || level67Latest.recommendedAction || 'hold').toUpperCase()} ({level67Latest.reason || 'no reason'})</div>}
                        {level68LatestAction && <div>Level68: {level68LatestAction.action || 'hold'} ({level68LatestAction.reason || 'no reason'})</div>}
                        {!liveGo && liveNoGoReasons.length > 0 && (
                          <div className="auto-trade-panel-status-meta">Blocked by: {liveNoGoReasons.join(', ')}</div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {isGuardBlocked && (
                  <div className="mip-ft-job-status" style={{ marginTop: 8, background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                    Safety guards are active. Fine-tuning start is temporarily blocked until the runtime windows expire.
                    {((level66Decision?.allowAutoStart === false && level66Decision?.blockedUntil)
                      || (level73Decision?.allowAutoStart === false && level73Decision?.blockedUntil)
                      || (level74Decision?.allowAutoStart === false && level74Decision?.blockedUntil)) && (
                      <div style={{ marginTop: 6, fontSize: '0.9em' }}>
                        You can send again after: <strong>{[
                          level66Decision?.allowAutoStart === false && level66Decision?.blockedUntil ? formatBlockedUntil(level66Decision.blockedUntil) : null,
                          level73Decision?.allowAutoStart === false && level73Decision?.blockedUntil ? formatBlockedUntil(level73Decision.blockedUntil) : null,
                          level74Decision?.allowAutoStart === false && level74Decision?.blockedUntil ? formatBlockedUntil(level74Decision.blockedUntil) : null,
                        ].filter(Boolean).join(' / ')}</strong>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 10, marginBottom: 4 }}>
                  <button
                    type="button"
                    className={`mip-ft-start-btn ${ftStats.readyForFineTuning && !ftLoading ? 'ready' : 'disabled'}`}
                    style={{ minWidth: 200 }}
                    onClick={handleStartFineTuning}
                    disabled={ftLoading || ftQuotaPrecheck.checking || !ftStats.readyForFineTuning || isGuardBlocked || fineTunePrecheckBlocked}
                  >
                    {ftLoading
                      ? <><RefreshCw size={12} style={{ animation: 'mip-spin 1s linear infinite' }} /> Training…</>
                      : <><Zap size={12} /> Send to OpenAI now - you decide when</>}
                  </button>
                  <button
                    type="button"
                    className="mip-ft-source-note"
                    style={{ padding: '6px 12px', cursor: 'pointer', border: '1px solid rgba(148,163,184,0.4)', borderRadius: 6, background: 'rgba(15,23,42,0.5)', color: '#94a3b8', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    onClick={() => loadFtStats()}
                    title="Refresh server data (outcomes, buy/sell, weighting)"
                  >
                    <RefreshCw size={12} /> Refresh data
                  </button>
                </div>
                <div className="mip-ft-source-note" style={{ marginTop: 4 }}>
                  Job only on click. On Render, set <code>OTA_AUTO_RETRAIN=false</code>, <code>OTA_LEVEL64_ENABLED=false</code>, <code>OTA_LEVEL64_AUTO_START=false</code> so it does not consume automatically.
                </div>
                    <div className="mip-ft-source-note">
                      {ftStatsCheckedAt ? `Checked at ${new Date(ftStatsCheckedAt).toLocaleTimeString()}` : 'No stats check yet'}
                      {ftStatsError ? ` | ${ftStatsError}` : ''}
                    </div>
                    <div className="mip-learning-telemetry">
                      <div className="mip-learning-telemetry-title">
                        <BookOpen size={12} />
                        <span>Personal Learning Telemetry</span>
                      </div>
                      <div className="mip-learning-telemetry-grid">
                        <div className="mip-learning-telemetry-item">
                          <span className="mip-learning-telemetry-label">Outcomes learned</span>
                          <span className="mip-learning-telemetry-value">{outcomesLearnedDisplay ?? '—'}</span>
                        </div>
                        <div className="mip-learning-telemetry-item">
                          <span className="mip-learning-telemetry-label">Signals</span>
                          <span className="mip-learning-telemetry-value">{learningTelemetry.totalSignals ?? '—'}</span>
                        </div>
                        <div className="mip-learning-telemetry-item">
                          <span className="mip-learning-telemetry-label">Win rate</span>
                          <span className="mip-learning-telemetry-value">
                            {learningTelemetry.winRate != null ? `${(Number(learningTelemetry.winRate) * 100).toFixed(1)}%` : '—'}
                          </span>
                        </div>
                        <div className="mip-learning-telemetry-item">
                          <span className="mip-learning-telemetry-label">Analyses left today</span>
                          <span className="mip-learning-telemetry-value">
                            {learningTelemetry.analysesLeft != null
                              ? `${learningTelemetry.analysesLeft}/${learningTelemetry.maxAnalysesPerDay ?? '—'}`
                              : '—'}
                          </span>
                        </div>
                        <div className="mip-learning-telemetry-item">
                          <span className="mip-learning-telemetry-label">Executions (24h)</span>
                          <span className="mip-learning-telemetry-value">{learningTelemetry.executions24h ?? '—'}</span>
                        </div>
                        <div className="mip-learning-telemetry-item">
                          <span className="mip-learning-telemetry-label">Agent sessions</span>
                          <span className="mip-learning-telemetry-value">{learningTelemetry.sessionsCount ?? '—'}</span>
                        </div>
                        <div className="mip-learning-telemetry-item">
                          <span className="mip-learning-telemetry-label">Last signal</span>
                          <span className="mip-learning-telemetry-value">{lastSignalDisplay || '—'}</span>
                        </div>
                      </div>
                      <div className="mip-learning-telemetry-meta">
                        {learningTelemetry.loading
                          ? 'Refreshing learning telemetry...'
                          : learningTelemetry.lastCheckedAt
                            ? `Checked at ${new Date(learningTelemetry.lastCheckedAt).toLocaleTimeString()}`
                            : 'Learning telemetry idle'}
                        {learningTelemetry.error ? ` | ${learningTelemetry.error}` : ''}
                      </div>
                    </div>
                    <div className="mip-token-telemetry">
                      <div className="mip-learning-telemetry-title">
                        <BookOpen size={12} />
                        <span>Token Performance (30d)</span>
                      </div>
                      {tokenTelemetry.rows.length > 0 ? (
                        <div className="mip-token-telemetry-table">
                          <div className="mip-token-telemetry-head">
                            <span>Token</span>
                            <span>Trades</span>
                            <span>Win rate</span>
                            <span>Net PnL</span>
                            <span>Max DD</span>
                          </div>
                          {tokenTelemetry.rows.map((row) => (
                            <div key={row.token} className="mip-token-telemetry-row">
                              <span>{row.token}</span>
                              <span>{row.tradesCount ?? '—'}</span>
                              <span>{row.winRate != null ? `${(Number(row.winRate) * 100).toFixed(1)}%` : '—'}</span>
                              <span>{row.netPnl != null ? Number(row.netPnl).toFixed(2) : '—'}</span>
                              <span>{row.maxDrawdown != null ? `${(Number(row.maxDrawdown) * 100).toFixed(1)}%` : '—'}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mip-token-telemetry-empty">
                          {tokenTelemetry.loading ? 'Loading token breakdown...' : 'No token performance data yet.'}
                        </div>
                      )}
                      <div className="mip-learning-telemetry-meta">
                        {tokenTelemetry.lastCheckedAt
                          ? `Checked at ${new Date(tokenTelemetry.lastCheckedAt).toLocaleTimeString()}`
                          : 'Token telemetry idle'}
                        {tokenTelemetry.error ? ` | ${tokenTelemetry.error}` : ''}
                      </div>
                    </div>
            </>
          ) : ftStatsLoaded ? (
              <div className="mip-ft-loading">
                <Database size={13} />
                <span>Fine-tuning stats unavailable</span>
              </div>
            ) : (
              <div className="mip-ft-loading">
                <RefreshCw size={13} style={{ animation: 'mip-spin 1s linear infinite' }} />
                <span>Loading…</span>
              </div>
            )}
          </div>
        </div>

        <div className="model-inference-panel-section">
          <div className="model-inference-panel-section-title-wrapper">
            <Brain size={12} />
            <h4 className="model-inference-panel-section-title">LLM Brain</h4>
          </div>
          <div className="mip-brain-card">
            <div className="mip-brain-autonomy">
              <span className={`auto-trade-panel-status-badge ${autonomyGo ? 'active' : 'inactive'}`}>
                {autonomyGo ? (
                  <>
                    <CheckCircle size={12} />
                    <span>LLM AUTONOMY GO</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={12} />
                    <span>LLM AUTONOMY NO-GO</span>
                  </>
                )}
              </span>
              {!autonomyGo && autonomyNoGoReasons.length > 0 && (
                <span className="mip-brain-autonomy-reasons">Blocked by: {autonomyNoGoReasons.join(', ')}</span>
              )}
            </div>

            <div className="mip-brain-tabs" role="tablist" aria-label="LLM brain tabs">
              <button
                type="button"
                className={`mip-brain-tab ${brainTab === 'meta' ? 'active' : ''}`}
                onClick={() => setBrainTab('meta')}
                role="tab"
                aria-selected={brainTab === 'meta'}
              >
                Meta Controller
              </button>
              <button
                type="button"
                className={`mip-brain-tab ${brainTab === 'bandit' ? 'active' : ''}`}
                onClick={() => setBrainTab('bandit')}
                role="tab"
                aria-selected={brainTab === 'bandit'}
              >
                Bandit
              </button>
              <button
                type="button"
                className={`mip-brain-tab ${brainTab === 'backtest' ? 'active' : ''}`}
                onClick={() => setBrainTab('backtest')}
                role="tab"
                aria-selected={brainTab === 'backtest'}
              >
                Backtest
              </button>
              <button
                type="button"
                className={`mip-brain-tab ${brainTab === 'governance' ? 'active' : ''}`}
                onClick={() => setBrainTab('governance')}
                role="tab"
                aria-selected={brainTab === 'governance'}
              >
                Governance
              </button>
            </div>

            <div className="mip-brain-content">
              {brainTab === 'meta' && (
                <>
                  <p className="mip-brain-hint" style={{ marginBottom: 8 }}>
                    Meta Controller: ensemble decision (allow/block) from strategy signals and regime. When you close a trade in Auto mode, outcome is recorded automatically; you can also record a manual outcome below for learning.
                  </p>
                  <div className="mip-brain-grid">
                    <div className="mip-brain-item"><span>Status</span><strong>{metaRoot?.status || metaRoot?.health || level64LatestRun?.status || '—'}</strong></div>
                    <div className="mip-brain-item"><span>Decision</span><strong>{metaRoot?.decision || metaRoot?.latestDecision?.action || (level66Decision?.allowAutoStart === false || level74Decision?.allowAutoStart === false ? 'block' : 'allow')}</strong></div>
                    <div className="mip-brain-item" title="Heuristic score; not a calibrated probability."><span>Decision score</span><strong>{metaRoot?.confidence != null ? `${(Number(metaRoot.confidence) * 100).toFixed(1)}%` : '—'}</strong></div>
                    <div className="mip-brain-item"><span>Reason</span><strong>{metaRoot?.reason || metaRoot?.latestDecision?.reason || level64LatestRun?.reason || level64LatestRun?.gate_code || '—'}</strong></div>
                    <div className="mip-brain-item"><span>Governance action</span><strong>{governanceAction || '—'}</strong></div>
                    <div className="mip-brain-item"><span>Governance reason</span><strong>{governanceReason || '—'}</strong></div>
                    <div className="mip-brain-item"><span>L67 guard check</span><strong>{level67GuardSignals?.level73Blocked || level67GuardSignals?.level74Blocked ? 'blocked' : 'clear'}</strong></div>
                    <div className="mip-brain-item"><span>L67 WF avg win</span><strong>{level67WalkForward?.avgWinRate != null ? `${(Number(level67WalkForward.avgWinRate) * 100).toFixed(1)}%` : '—'}</strong></div>
                  </div>
                  {(() => {
                    const weights = metaRoot?.weights;
                    const strategyWeights = metaRoot?.strategyWeights;
                    if (Array.isArray(strategyWeights) && strategyWeights.length > 0) {
                      return (
                        <div className="mip-brain-hint" style={{ marginTop: 8 }}>
                          Weights: {strategyWeights.map((w, i) => `${w?.name ?? w?.strategy ?? `Strategy ${i + 1}`}: ${Number(w?.weight ?? w?.value ?? 0).toFixed(2)}`).join(', ')}
                        </div>
                      );
                    }
                    if (weights && typeof weights === 'object') {
                      const entries = Array.isArray(weights)
                        ? weights.map((v, i) => [`Strategy ${i + 1}`, v])
                        : Object.entries(weights);
                      if (entries.length > 0) {
                        return (
                          <div className="mip-brain-hint" style={{ marginTop: 8 }}>
                            Weights: {entries.map(([k, v]) => `${k}: ${Number(v).toFixed(2)}`).join(', ')}
                          </div>
                        );
                      }
                    }
                    return null;
                  })()}
                  <div className="mip-brain-bandit-actions" style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <button
                      type="button"
                      className="model-inference-panel-clear-btn"
                      onClick={handleMetaMakeDecision}
                      disabled={metaDecisionLoading}
                      title="Request ensemble decision for current token/timeframe"
                    >
                      {metaDecisionLoading ? 'Requesting…' : 'Make decision'}
                    </button>
                    <span className="mip-brain-hint" style={{ marginRight: 4 }}>PnL (optional):</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      placeholder="0"
                      value={metaRecordPnl}
                      onChange={(e) => setMetaRecordPnl(e.target.value)}
                      className="mip-meta-pnl-input"
                      aria-label="PnL for manual outcome (USD)"
                    />
                    <button
                      type="button"
                      className="model-inference-panel-clear-btn"
                      onClick={handleMetaRecordOutcome}
                      disabled={metaRecordLoading}
                      title="Record outcome manually (sends to meta-controller + bandit)"
                    >
                      {metaRecordLoading ? 'Recording…' : 'Record outcome (manual)'}
                    </button>
                  </div>
                  {metaDecisionResult != null && (
                    <div className="mip-brain-hint" style={{ marginTop: 6 }}>Last decision: <strong>{String(metaDecisionResult)}</strong></div>
                  )}
                  {(metaDecisionError || metaRecordError) && (
                    <div className="mip-command-error" style={{ marginTop: 6 }}>{metaDecisionError || metaRecordError}</div>
                  )}
                  {!brainData.meta && (
                    <div className="mip-brain-fallback-note">Meta endpoint unavailable - showing runtime guard fallback.</div>
                  )}
                </>
              )}

              {brainTab === 'bandit' && (
                <>
                  <p className="mip-brain-hint" style={{ marginBottom: 8 }}>
                    Multi-armed bandit: picks a strategy (trend-following, mean-reversion, momentum) from observed performance. Stats persist across restarts (DB). When you close a trade in Auto mode, reward is recorded for the last selected strategy. Choose <strong>Regime</strong>, then <strong>Select strategy</strong> — UCB balances exploration vs exploitation.
                  </p>
                  <div className="mip-brain-grid">
                    <div className="mip-brain-item"><span>Best strategy</span><strong>{banditBestStrategy ?? banditRoot?.bestStrategy ?? banditRoot?.selectedStrategy ?? (banditTotalPulls === 0 ? '— (no data)' : '—')}</strong></div>
                    <div className="mip-brain-item"><span>Total pulls</span><strong>{banditEntries.length > 0 ? banditTotalPulls : (banditRoot?.totalPulls ?? banditRoot?.pulls) ?? '—'}</strong></div>
                    <div className="mip-brain-item"><span>Algorithm</span><strong title={typeof banditAlgorithmDisplay === 'string' && banditAlgorithmDisplay.toLowerCase() === 'ucb' ? 'Upper Confidence Bound: balances exploration (trying strategies) vs exploitation (using best so far)' : undefined}>{banditAlgorithmDisplay}</strong></div>
                    <div className="mip-brain-item"><span>Strategies tracked</span><strong>{banditEntries.length > 0 ? banditEntries.length : '—'}</strong></div>
                    {banditEntries.slice(0, 5).map((entry, idx) => {
                      const plays = Number(entry.plays) || 0;
                      const hasData = plays > 0;
                      const strategyLabel = entry.name || entry.strategy || `Strategy ${idx + 1}`;
                      const valueDisplay = hasData
                        ? `${entry.plays} plays, ${Number(entry.winRate ?? 0).toFixed(1)}% WR`
                        : '0 plays';
                      return (
                        <div key={`${strategyLabel}-${idx}`} className="mip-brain-item">
                          <span>{strategyLabel}</span>
                          <strong>{valueDisplay}</strong>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mip-brain-bandit-actions" style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <span className="mip-brain-hint" style={{ marginRight: 4 }}>Regime:</span>
                    {['bull', 'bear', 'sideways'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        className={`model-inference-panel-clear-btn mip-regime-btn mip-regime-btn--${r} ${banditRegime === r ? 'active' : ''}`}
                        onClick={() => setBanditRegime(r)}
                        aria-pressed={banditRegime === r}
                      >
                        {r === 'bull' && <TrendingUp size={12} style={{ marginRight: 4 }} aria-hidden />}
                        {r === 'bear' && <TrendingDown size={12} style={{ marginRight: 4 }} aria-hidden />}
                        {r === 'sideways' && <Minus size={12} style={{ marginRight: 4 }} aria-hidden />}
                        {r}
                      </button>
                    ))}
                    <span className="mip-brain-hint" style={{ marginLeft: 4 }} aria-live="polite">
                      selected:{' '}
                      <strong className={`mip-bandit-regime-selected mip-bandit-regime-selected--${banditRegime}`}>
                        {banditRegime}
                      </strong>
                    </span>
                    <button
                      type="button"
                      className="model-inference-panel-clear-btn"
                      onClick={handleBanditSelect}
                      disabled={banditSelectLoading}
                    >
                      {banditSelectLoading ? 'Selecting…' : 'Select strategy'}
                    </button>
                    <button
                      type="button"
                      className="model-inference-panel-clear-btn"
                      onClick={handleBanditReset}
                      disabled={banditResetLoading}
                      title="Reset bandit plays/wins (in-memory + DB)"
                    >
                      {banditResetLoading ? 'Resetting…' : 'Reset statistics'}
                    </button>
                  </div>
                  {banditSelectResult != null && (
                    <div className="mip-brain-hint" style={{ marginTop: 6 }}>
                      Last selected: <strong>{String(banditSelectResult)}</strong>
                    </div>
                  )}
                  {banditSelectError && (
                    <div className="mip-command-error" style={{ marginTop: 6 }}>{banditSelectError}</div>
                  )}
                  {!brainData.bandit && (
                    <div className="mip-brain-fallback-note">Bandit endpoint unavailable - showing agent decision fallback.</div>
                  )}
                </>
              )}

              {brainTab === 'backtest' && (
                <>
                  <p className="mip-brain-hint" style={{ marginBottom: 8 }}>
                    Backtest on historical data ({token}/USDT 5m). Strategies: trend-following, mean-reversion, momentum. Run <strong>Run backtest</strong> or <strong>Run walk-forward</strong> for metrics.
                  </p>
                  <div className="mip-brain-bandit-actions" style={{ marginBottom: 10, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <span className="mip-brain-hint" style={{ marginRight: 4 }}>Strategy:</span>
                    {['trend-following', 'mean-reversion', 'momentum'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`model-inference-panel-clear-btn mip-strategy-pill-btn ${backtestStrategy === s ? 'active' : ''}`}
                        onClick={() => setBacktestStrategy(s)}
                        aria-pressed={backtestStrategy === s}
                      >
                        {s.replace(/-/g, ' ')}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="model-inference-panel-clear-btn"
                      onClick={handleRunBacktest}
                      disabled={backtestRunLoading}
                      title="Run single backtest on historical bars"
                    >
                      {backtestRunLoading ? 'Running…' : 'Run backtest'}
                    </button>
                    <button
                      type="button"
                      className="model-inference-panel-clear-btn"
                      onClick={handleRunWalkForward}
                      disabled={walkForwardRunLoading}
                      title="Rolling walk-forward validation (no look-ahead)"
                    >
                      {walkForwardRunLoading ? 'Running…' : 'Run walk-forward'}
                    </button>
                  </div>
                  {(lastBacktestResult?.error || lastWalkForwardResult?.error) && (
                    <div className="mip-command-error" style={{ marginBottom: 8 }}>
                      {lastBacktestResult?.error || lastWalkForwardResult?.error}
                    </div>
                  )}
                  {lastWalkForwardResult?.insufficientData && (
                    <div className="mip-brain-fallback-note" style={{ marginBottom: 8 }}>
                      {lastWalkForwardResult?.message || 'Not enough historical data (need at least 433 bars).'}
                    </div>
                  )}
                  <div className="mip-brain-grid">
                    <div className="mip-brain-item"><span>Token</span><strong>{token}/USDT</strong></div>
                    <div className="mip-brain-item"><span>Win rate</span><strong>{backtestRoot?.winRate != null ? `${(Number(backtestRoot.winRate) > 1 ? Number(backtestRoot.winRate) : Number(backtestRoot.winRate) * 100).toFixed(1)}%` : (trendTelemetry.winRate7d != null ? `${(Number(trendTelemetry.winRate7d) * 100).toFixed(1)}%` : '—')}</strong></div>
                    <div className="mip-brain-item"><span>Sharpe</span><strong>{backtestRoot?.sharpeRatio ?? backtestRoot?.sharpe ?? '—'}</strong></div>
                    <div className="mip-brain-item"><span>Max DD</span><strong>{backtestRoot?.maxDrawdown != null ? `${Number(backtestRoot.maxDrawdown).toFixed(1)}%` : (trendTelemetry.drawdown7d != null ? `${(Number(trendTelemetry.drawdown7d) * 100).toFixed(1)}%` : '—')}</strong></div>
                    <div className="mip-brain-item"><span>Total return</span><strong>{backtestRoot?.totalReturn != null ? `${(Number(backtestRoot.totalReturn) > 1 ? Number(backtestRoot.totalReturn) : Number(backtestRoot.totalReturn) * 100).toFixed(2)}%` : '—'}</strong></div>
                    <div className="mip-brain-item"><span>Trades</span><strong>{backtestRoot?.tradesCount ?? backtestRoot?.totalTrades ?? learningTelemetry.executions24h ?? '—'}</strong></div>
                    <div className="mip-brain-item"><span>WF folds</span><strong>{walkForwardRoot?.foldsCount ?? '—'}</strong></div>
                    <div className="mip-brain-item"><span>WF win rate</span><strong>{wfMetrics?.walkForwardWinRate != null ? `${Number(wfMetrics.walkForwardWinRate).toFixed(1)}%` : '—'}</strong></div>
                    <div className="mip-brain-item"><span>WF Sharpe</span><strong>{wfMetrics?.walkForwardSharpe ?? '—'}</strong></div>
                    <div className="mip-brain-item"><span>WF max DD</span><strong>{wfMetrics?.walkForwardMaxDrawdown != null ? `${Number(wfMetrics.walkForwardMaxDrawdown).toFixed(2)}%` : '—'}</strong></div>
                  </div>
                  {brainData.walkForwardInsufficientData && !lastWalkForwardResult && (
                    <div className="mip-brain-fallback-note" style={{ marginTop: 8 }}>
                      Walk-forward: {brainData.walkForwardMessage || 'Not enough historical data (need at least 433 bars). Backend data may be missing for this symbol/timeframe.'}
                    </div>
                  )}
                  {!brainData.backtest && !lastBacktestResult && (
                    <div className="mip-brain-fallback-note">Backtest endpoint unavailable - run backtest or walk-forward to see metrics.</div>
                  )}
                  {(() => {
                    const curve = lastBacktestResult?.backtest?.equityCurve || brainData.backtest?.lastRun?.equityCurve;
                    if (!Array.isArray(curve) || curve.length < 2) return null;
                    const values = curve.map((p) => Number(typeof p === 'number' ? p : (p?.equity ?? p?.equityCurve ?? 0))).filter(Number.isFinite);
                    if (values.length < 2) return null;
                    const min = Math.min(...values);
                    const max = Math.max(...values);
                    const range = max - min || 1;
                    const w = 320;
                    const h = 56;
                    const pts = values.map((v, i) => {
                      const x = (i / (values.length - 1)) * w;
                      const y = h - ((v - min) / range) * (h - 4) - 2;
                      return `${x},${y}`;
                    });
                    return (
                      <div className="mip-brain-hint" style={{ marginTop: 10 }}>
                        <div style={{ marginBottom: 4 }}>Equity curve</div>
                        <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ maxWidth: w, height: h, background: 'var(--ds-bg-surface)', borderRadius: 4 }} role="img" aria-label="Equity curve chart">
                          <polyline fill="none" stroke="var(--primary, currentColor)" strokeWidth="1.5" points={pts.join(' ')} />
                        </svg>
                      </div>
                    );
                  })()}
                </>
              )}

              {brainTab === 'governance' && (
                <>
                  <div
                    className="mip-ft-job-status"
                    style={{
                      marginBottom: 10,
                      background: governanceGo
                        ? 'rgba(16,185,129,0.12)'
                        : governanceOnlyLevel69Degraded
                          ? 'rgba(245,158,11,0.12)'
                          : 'rgba(239,68,68,0.12)',
                      color: governanceGo
                        ? '#10b981'
                        : governanceOnlyLevel69Degraded
                          ? '#d97706'
                          : '#ef4444',
                    }}
                  >
                    <div style={{ marginBottom: 4 }}>
                      <span className={`auto-trade-panel-status-badge ${governanceGo ? 'active' : governanceOnlyLevel69Degraded ? 'warning' : 'inactive'}`}>
                        {governanceGo ? (
                          <>
                            <CheckCircle size={12} />
                            <span>GOVERNANCE GO</span>
                          </>
                        ) : governanceOnlyLevel69Degraded ? (
                          <>
                            <AlertCircle size={12} />
                            <span>GOVERNANCE DEGRADED (Level69)</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={12} />
                            <span>GOVERNANCE NO-GO</span>
                          </>
                        )}
                      </span>
                    </div>
                    <div>Action: {(governanceAction || 'hold').toString().toUpperCase()}</div>
                    <div>Reason: {governanceReason || 'no explicit reason from advisor'}</div>
                    {governanceOnlyLevel69Degraded && (
                      <div style={{ marginTop: 4, fontSize: '0.9em', opacity: 0.95 }}>Run "Run Governance Cycle now" to re-evaluate Level69.</div>
                    )}
                    {!governanceGo && governanceNoGoReasons.length > 0 && (
                      <div style={{ marginTop: 4 }}>
                        {governanceNoGoReasons.slice(0, 4).map((reason, idx) => (
                          <div key={`gov-reason-${idx}`}>- {reason}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mip-brain-meta" style={{ marginBottom: 10 }}>
                    <button
                      type="button"
                      className="model-inference-panel-clear-btn"
                      onClick={handleRunGovernanceCycle}
                      disabled={governanceRunLoading}
                    >
                      {governanceRunLoading
                        ? <><RefreshCw size={12} style={{ animation: 'mip-spin 1s linear infinite' }} /> Running…</>
                        : <><RefreshCw size={12} /> Run Governance Cycle now</>}
                    </button>
                    <span>
                      {governanceRunResult?.checkedAt
                        ? `Last run: ${new Date(governanceRunResult.checkedAt).toLocaleTimeString()}`
                        : 'No manual governance run yet'}
                    </span>
                  </div>
                  {governanceRunError && (
                    <div className="mip-command-error">Error: {governanceRunError}</div>
                  )}
                  {governanceRunResult && (
                    <div className="mip-command-result" style={{ marginBottom: 10 }}>
                      <div className="mip-command-result-meta">
                        L65: {governanceRunResult.level65?.code ?? (governanceRunResult.level65?.ok === true ? 'ok' : 'n/a')} | L64: {governanceRunResult.level64?.code ?? (governanceRunResult.level64?.status ?? 'n/a')} | L69: {governanceRunResult.level69?.status ?? governanceRunResult.level69?.code ?? 'n/a'}
                        {governanceRunResult.level69?.status === 'degraded' && governanceRunResult.level69?.recommendation && (
                          <span title={formatLevel69Recommendation(governanceRunResult.level69.recommendation)}> (degraded)</span>
                        )}
                      </div>
                      <div className="mip-command-result-meta" style={{ marginTop: 4, fontSize: '0.85em' }}>
                        L67: {governanceRunResult.level67?.code || 'n/a'} | L68: {governanceRunResult.level68?.code || 'n/a'}
                      </div>
                    </div>
                  )}
                  <div className="mip-brain-grid">
                    <div className="mip-brain-item"><span>L67 recommendation</span><strong>{(governanceAction || 'hold').toString().toUpperCase()}</strong></div>
                    <div className="mip-brain-item"><span>L67 reason</span><strong>{governanceReason || '—'}</strong></div>
                    <div className="mip-brain-item"><span>L67 guard state</span><strong>{level67GuardSignals?.level73Blocked || level67GuardSignals?.level74Blocked ? 'blocked' : 'clear'}</strong></div>
                    <div className="mip-brain-item"><span>L67 WF avg win</span><strong>{level67WalkForward?.avgWinRate != null ? `${(Number(level67WalkForward.avgWinRate) * 100).toFixed(1)}%` : '—'}</strong></div>
                    <div className="mip-brain-item"><span>L67 WF negative folds</span><strong>{level67WalkForward?.negativeFolds ?? '—'}</strong></div>
                    <div className="mip-brain-item"><span>L68 latest action</span><strong>{level68LatestAction?.action || '—'}</strong></div>
                  </div>
                  <div className="mip-brain-history" style={{ marginTop: 10 }}>
                    <div className="mip-brain-trends-title">Governance recommendations (latest 5)</div>
                    {governanceRecommendations.length > 0 ? (
                      <ul className="mip-brain-history-list">
                        {governanceRecommendations.map((r, idx) => (
                          <li key={r.id || `gr-${idx}`} className="mip-brain-history-item">
                            <span className="mip-brain-history-decision">{(r.recommended_action || 'hold').toUpperCase()}</span>
                            <span>{r.divergence_rate != null ? `div ${(Number(r.divergence_rate) * 100).toFixed(1)}%` : '—'}</span>
                            <span>{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="mip-brain-history-empty">No governance recommendations yet.</div>
                    )}
                  </div>
                  <div className="mip-brain-history" style={{ marginTop: 10 }}>
                    <div className="mip-brain-trends-title">Champion / Challenger (0/80 = add challenger)</div>
                    {deploymentsLoading ? (
                      <div className="mip-brain-history-empty">Loading deployments…</div>
                    ) : (
                      <>
                        <div className="mip-brain-grid" style={{ marginBottom: 8 }}>
                          <div className="mip-brain-item">
                            <span>Champion</span>
                            <strong>
                              {deployments.filter((d) => d.deployment_type === 'champion')[0]?.name ?? '—'}
                              {deployments.filter((d) => d.deployment_type === 'champion')[0]?.id != null && ` (id ${deployments.filter((d) => d.deployment_type === 'champion')[0].id})`}
                            </strong>
                          </div>
                          <div className="mip-brain-item">
                            <span>Challengers</span>
                            <strong>
                              {deployments.filter((d) => d.deployment_type === 'challenger').length === 0
                                ? 'None – add one so 0/80 can fill'
                                : deployments.filter((d) => d.deployment_type === 'challenger').map((d) => `${d.name} (${d.rollout_percent}%)`).join(', ')}
                            </strong>
                          </div>
                        </div>
                        {!showAddChallengerForm ? (
                          <button
                            type="button"
                            className="model-inference-panel-clear-btn"
                            onClick={() => setShowAddChallengerForm(true)}
                          >
                            Add challenger
                          </button>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320 }}>
                            <input
                              type="text"
                              placeholder="Name (e.g. challenger-v1)"
                              value={addChallengerName}
                              onChange={(e) => setAddChallengerName(e.target.value)}
                              className="mip-command-input"
                              aria-label="Challenger name"
                            />
                            <input
                              type="number"
                              min={0}
                              max={100}
                              placeholder="Rollout % (default 10)"
                              value={addChallengerRollout}
                              onChange={(e) => setAddChallengerRollout(Number(e.target.value) || 10)}
                              className="mip-command-input"
                              aria-label="Rollout percent"
                            />
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <button
                                type="button"
                                className="model-inference-panel-clear-btn"
                                onClick={handleAddChallenger}
                                disabled={addChallengerLoading}
                              >
                                {addChallengerLoading ? 'Creating…' : 'Create challenger'}
                              </button>
                              <button
                                type="button"
                                className="model-inference-panel-clear-btn"
                                onClick={() => { setShowAddChallengerForm(false); setAddChallengerError(null); }}
                                disabled={addChallengerLoading}
                              >
                                Cancel
                              </button>
                            </div>
                            {addChallengerError && <div className="mip-command-error">{addChallengerError}</div>}
                          </div>
                        )}
                        <button type="button" className="model-inference-panel-clear-btn" style={{ marginLeft: 8, marginTop: 4 }} onClick={loadDeployments} disabled={deploymentsLoading}>
                          <RefreshCw size={12} /> Refresh list
                        </button>
                      </>
                    )}
                  </div>
                  <div className="mip-brain-history" style={{ marginTop: 10 }}>
                    <div className="mip-brain-trends-title">Governance actions (latest 5)</div>
                    {governanceActions.length > 0 ? (
                      <ul className="mip-brain-history-list">
                        {governanceActions.map((a, idx) => (
                          <li key={a.id || `ga-${idx}`} className="mip-brain-history-item">
                            <span className="mip-brain-history-decision">{(a.action || 'hold').toUpperCase()}</span>
                            <span>{a.applied === true ? 'applied' : 'not applied'}</span>
                            <span>{a.created_at ? new Date(a.created_at).toLocaleString() : '—'}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="mip-brain-history-empty">No governance actions yet.</div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="mip-brain-trends">
              <div className="mip-brain-trends-title">Learning trend (24h vs 7d)</div>
              <div className="mip-brain-grid">
                <div className="mip-brain-item">
                  <span>Win rate 24h</span>
                  <strong>{trendTelemetry.winRate24h != null ? `${(Number(trendTelemetry.winRate24h) * 100).toFixed(1)}%` : '—'}</strong>
                </div>
                <div className="mip-brain-item">
                  <span>Win rate 7d</span>
                  <strong>{trendTelemetry.winRate7d != null ? `${(Number(trendTelemetry.winRate7d) * 100).toFixed(1)}%` : '—'}</strong>
                </div>
                <div className="mip-brain-item">
                  <span>Max DD 24h</span>
                  <strong>{trendTelemetry.drawdown24h != null ? `${(Number(trendTelemetry.drawdown24h) * 100).toFixed(1)}%` : '—'}</strong>
                </div>
                <div className="mip-brain-item">
                  <span>Max DD 7d</span>
                  <strong>{trendTelemetry.drawdown7d != null ? `${(Number(trendTelemetry.drawdown7d) * 100).toFixed(1)}%` : '—'}</strong>
                </div>
              </div>
            </div>

            <div className="mip-brain-history">
              <div className="mip-brain-trends-title">Decision history (latest 5)</div>
              {Array.isArray(learningTelemetry.recentSessions) && learningTelemetry.recentSessions.length > 0 ? (
                <ul className="mip-brain-history-list">
                  {learningTelemetry.recentSessions.map((s, idx) => (
                    <li key={s.id || `${s.createdAt || 'row'}-${idx}`} className="mip-brain-history-item">
                      <span className="mip-brain-history-decision">{s.decision || 'hold'}</span>
                      <span>{s.token || '—'}</span>
                      <span>{s.summary ? String(s.summary).slice(0, 36) : 'no summary'}</span>
                      <span>{s.createdAt ? new Date(s.createdAt).toLocaleString() : '—'}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mip-brain-history-empty">No decision history yet.</div>
              )}
            </div>

            <div className="mip-brain-meta">
              <button type="button" className="model-inference-panel-clear-btn" onClick={loadBrainData} disabled={brainData.loading}>
                {brainData.loading ? <><RefreshCw size={12} style={{ animation: 'mip-spin 1s linear infinite' }} /> Refreshing…</> : <><RefreshCw size={12} /> Refresh Brain</>}
              </button>
              <span>
                {brainData.lastCheckedAt ? `Checked at ${new Date(brainData.lastCheckedAt).toLocaleTimeString()}` : 'No brain check yet'}
                {brainData.error ? ` | ${brainData.error}` : ''}
                {trendTelemetry.lastCheckedAt ? ` | trend ${new Date(trendTelemetry.lastCheckedAt).toLocaleTimeString()}` : ''}
                {trendTelemetry.loading ? ' | trend refreshing...' : ''}
                {trendTelemetry.error ? ` | ${trendTelemetry.error}` : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="model-inference-panel-section">
          <div className="model-inference-panel-section-title-wrapper">
            <Zap size={12} />
            <h4 className="model-inference-panel-section-title">OTA LLM Direct Command</h4>
          </div>
          <div className="mip-command-card">
            <div className="mip-command-row">
              <textarea
                className="mip-command-input"
                value={llmCommand}
                onChange={(e) => setLlmCommand(e.target.value)}
                placeholder='Example: "Analyze LINK risk now and tell me if Auto should stay ON."'
                rows={3}
                disabled={llmCommandLoading}
              />
              <div className="mip-command-quick-actions">
                {quickCommands.map((cmd) => (
                  <button
                    key={cmd}
                    type="button"
                    className="mip-command-quick-btn"
                    onClick={() => sendLlmCommand(cmd)}
                    disabled={llmCommandLoading}
                    title={cmd}
                  >
                    {cmd}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="mip-ft-start-btn ready"
                onClick={sendLlmCommand}
                disabled={llmCommandLoading || !llmCommand.trim()}
              >
                {llmCommandLoading
                  ? <><RefreshCw size={12} style={{ animation: 'mip-spin 1s linear infinite' }} /> Sending…</>
                  : <><Zap size={12} /> Send Command</>}
              </button>
            </div>
            {llmCommandError && (
              <div className="mip-command-error">Error: {llmCommandError}</div>
            )}
            {llmCommandResult?.content && (
              <div className="mip-command-result">
                <div className="mip-command-result-meta">
                  Response {llmCommandResult.checkedAt ? `at ${new Date(llmCommandResult.checkedAt).toLocaleTimeString()}` : ''}
                </div>
                <div className="mip-command-result-content">{llmCommandResult.content}</div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
