/**
 * OTA Page – doar componente care fac ceva clar.
 * - Mod (Advisory / Assisted / Auto) + AutoTradePanel când mod Auto (policy, status din API).
 * - OTA Access Control, Settings, Conditions Editor.
 * Panouri: Auto (policy, Model Inference), Advisory (Market Analysis), Access, Settings.
 * @module OTAPage
 */

import React, { lazy, Suspense, memo, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { HelpCircle, ExternalLink, BookOpen, Shield, ChevronRight, ArrowRightLeft, LineChart, Info, Play, Square, Radio } from 'lucide-react';
import Skeleton from '../components/common/Skeleton';
import ErrorBoundary from '../components/common/ErrorBoundary';
import OTABrand from '../components/ai-trading/OTABrand';
import OTAAccessControl from '../../ota/OTAAccessControl.jsx';
import OTASettingsPanel from '../../ota/OTASettingsPanel.jsx';
import OTANetPnlCard from '../components/ai-trading/OTANetPnlCard';
import OTAPriceChart from '../components/ai-trading/OTAPriceChart';
import OpenOrdersPanel from '../components/ai-trading/OpenOrdersPanel';
import OpenPositionPnLStrip from '../components/ai-trading/OpenPositionPnLStrip';
import LLMMonitoringPanel from '../components/ai-trading/LLMMonitoringPanel';
import OTAActivityPanel from '../components/ai-trading/OTAActivityPanel';
import OTATutorial from '../components/common/OTATutorial';
import OTATradingModeHeaderDropdown from '../components/ai-trading/OTATradingModeHeaderDropdown';
// OTAOpenAIConnectionStatus omis din UI – poluare vizuală lângă logo
import OTAVaultBalanceCard from '../components/ai-trading/OTAVaultBalanceCard';
import { Modal } from '../components/common/Modal';
import { useOTAAccess } from '../hooks/useOTAAccess';
import { useOTAMode } from '../hooks/useOTAMode';
import { useContractDeploymentStatus } from '../hooks/useContractDeploymentStatus';
import { isContractsNotDeployed } from '../utils/contractDeploymentUtils';
import { useDexAuth } from '../context/DexAuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import { getOTAHealth } from '../services/aiTradingApiService';
import { analyzeMarketWithLlmProvider } from '../services/otaAnalyzeFacade';
import { useBackendStatusOptional } from '../context/BackendStatusContext';
import HeaderTokenSelector from '../components/common/HeaderTokenSelector';
import { useHeaderToken } from '../context/HeaderTokenContext';
import { loadOutcomesForAnalyze, buildAnalyzeOptions } from '../utils/otaOutcomesHelper';
import { computeOtaHeaderLiveGo } from '../utils/otaAutoHeaderLiveGo';
import { getApiBaseUrl } from '../../config/apiEndpoints.js';
import { useOtaEvmWalletAuthSync } from '../hooks/useOtaEvmWalletAuthSync';
import OtaBscAutoStatusBanner from '../components/ai-trading/OtaBscAutoStatusBanner';
import OtaLlmAnalyzeModeControls from '../components/ai-trading/OtaLlmAnalyzeModeControls';
import { OtaAutoDashboardProvider, useOtaAutoDashboard } from '../context/OtaAutoDashboardContext.jsx';
import '../styles/pages.css';
import '../styles/components/dashboard-page.css';
import '../styles/components/ota-page.css';
import '../styles/components/trade-cost-analytics.css';

const AutoTradePanel = lazy(() =>
  import('../components/ai-trading/AutoTradePanel').catch(err => {
    console.error('Failed to load AutoTradePanel:', err);
    return { default: () => <div>Error loading AutoTradePanel</div> };
  })
);

const ModelInferencePanel = lazy(() =>
  import('../components/ai-trading/ModelInferencePanel').catch(err => {
    console.error('Failed to load ModelInferencePanel:', err);
    return { default: () => <div style={{ padding: 12, color: '#94a3b8', fontSize: '0.85em' }}>AI Model Inference – backend not yet configured.</div> };
  })
);

const MarketAnalysis = lazy(() =>
  import('../components/ai-trading/MarketAnalysis').catch(err => {
    console.error('Failed to load MarketAnalysis:', err);
    return { default: () => <div>Error loading Market Analysis</div> };
  })
);

function OtaSafetyDashboard() {
  const dashboard = useOtaAutoDashboard();
  const status = dashboard?.autoStatus;
  const safetyLoaded = !!status?.safety;
  const safety = status?.safety || {};
  const pnl = safety?.pnlAccounting || {};
  const activeUsers = status?.activeUsers ?? 0;
  const realMoneyLocked = !safetyLoaded || safety.paperOnlyMode === true || safety.emergencyNewTradesDisabled === true;
  const pnlHealthy = safetyLoaded && pnl.healthy !== false;
  const updated = dashboard?.lastFetchAt ? new Date(dashboard.lastFetchAt).toLocaleTimeString() : 'not checked';
  const stateLabel = !safetyLoaded ? 'Checking safety' : (realMoneyLocked ? 'Real money locked' : 'Real money enabled');

  return (
    <section className="ota-safety-dashboard" aria-label="OTA safety status">
      <div className="ota-safety-dashboard__header">
        <span className={`ota-safety-dashboard__state ${realMoneyLocked ? 'is-locked' : 'is-live'}`}>
          <Shield size={16} aria-hidden />
          {stateLabel}
        </span>
        <button type="button" className="ota-safety-dashboard__refresh" onClick={dashboard?.refresh}>
          <Radio size={14} aria-hidden />
          Refresh
        </button>
      </div>
      <div className="ota-safety-dashboard__grid">
        <div className="ota-safety-dashboard__item">
          <span>Paper only</span>
          <strong>{safetyLoaded ? (safety.paperOnlyMode === true ? 'ON' : 'OFF') : '-'}</strong>
        </div>
        <div className="ota-safety-dashboard__item">
          <span>Active users</span>
          <strong>{activeUsers}</strong>
        </div>
        <div className="ota-safety-dashboard__item">
          <span>Production profile</span>
          <strong>{safetyLoaded ? (safety.productionLiveProfileEnabled === true ? 'ON' : 'OFF') : '-'}</strong>
        </div>
        <div className="ota-safety-dashboard__item">
          <span>PnL accounting</span>
          <strong>{safetyLoaded ? (pnlHealthy ? 'OK' : 'BLOCKING') : '-'}</strong>
        </div>
        <div className="ota-safety-dashboard__item">
          <span>PnL coverage</span>
          <strong>{Number.isFinite(Number(pnl.coveragePct)) ? `${Number(pnl.coveragePct).toFixed(1)}%` : '-'}</strong>
        </div>
        <div className="ota-safety-dashboard__item">
          <span>Missing PnL</span>
          <strong>{safetyLoaded ? (pnl.missingPnl ?? 0) : '-'}</strong>
        </div>
        <div className="ota-safety-dashboard__item">
          <span>Loss cooldown</span>
          <strong>{safety.pairLossChurnGuardEnabled === false ? 'OFF' : `${safety.pairLossCooldownMinutes ?? '-'} min`}</strong>
        </div>
      </div>
      <p className="ota-safety-dashboard__note">
        Auto opens stay blocked while paper-only, emergency lock, or PnL accounting guard is active. Last check: {updated}.
        {dashboard?.autoStatusError?.message ? ` Status error: ${dashboard.autoStatusError.message}` : ''}
      </p>
    </section>
  );
}

const OTAPageInner = memo(() => {
  const navigate = useNavigate();
  const { walletAddress, isAuthenticated, user } = useDexAuth();
  const userId = useMemo(
    () => walletAddress || user?.walletAddress || user?.id || null,
    [walletAddress, user]
  );
  // Single hook call (useOTAAccess reads from OTARegistrationContext)
  const {
    isRegistered,
    isLoading: otaLoading,
    error: otaError,
    register: registerOTA,
    isRegistering,
    accessLevel,
    isPreviewMode,
    hasFullAccess,
    botAuthorizations,
    executorBotAddress
  } = useOTAAccess();
  const { currentMode } = useOTAMode();
  const contractStatus = useContractDeploymentStatus(); // registration scope (UserVault/AccessControl/BITS)
  const [showTutorial, setShowTutorial] = useState(false);
  const [advisoryToken, setAdvisoryToken] = useHeaderToken();
  const [headerSlotEl, setHeaderSlotEl] = useState(null);
  const [marketSlotEl, setMarketSlotEl] = useState(null);
  const modelInferenceRef = useRef(null);
  const [advisoryModalOpen, setAdvisoryModalOpen] = useState(false);
  const [governanceRunLoading, setGovernanceRunLoading] = useState(false);
  const [governanceRunStatus, setGovernanceRunStatus] = useState(null);
  const [brainTabRequest, setBrainTabRequest] = useState(null);
  const [headerLiveStatus, setHeaderLiveStatus] = useState({
    loading: false,
    liveGo: null,
    reasons: [],
    checkedAt: null
  });
  const backendStatus = useBackendStatusOptional();
  const [localBackendUnavailable, setLocalBackendUnavailable] = useState(null);
  useOtaEvmWalletAuthSync({ enabled: true });
  useEffect(() => {
    if (backendStatus != null) return;
    if (process.env.NODE_ENV === 'test' || typeof getOTAHealth !== 'function') return;
    let cancelled = false;
    getOTAHealth()
      .then(() => { if (!cancelled) setLocalBackendUnavailable(false); })
      .catch(() => { if (!cancelled) setLocalBackendUnavailable(true); });
    return () => { cancelled = true; };
  }, [backendStatus]);
  const backendUnavailable = backendStatus != null
    ? backendStatus.isReachable === false
    : localBackendUnavailable === true;

  // Header slot: OTA tools – portal în dex-header-ota-tools-slot (header-right, lângă Social)
  const { pathname, search, hash } = useLocation();
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const run = () => {
      const el = document.getElementById('dex-header-ota-tools-slot') || document.getElementById('dex-header-center-slot');
      if (el) setHeaderSlotEl(el);
    };
    run();
    const t = setTimeout(run, 50);
    return () => clearTimeout(t);
  }, [pathname]);

  // Wrapper pentru header: Mode selector + slot pentru Market Analysis
  const headerPortalContent = headerSlotEl && hasFullAccess ? (
    <div className="ota-header-tools">
      <OTATradingModeHeaderDropdown />
      <div ref={(el) => setMarketSlotEl(el)} className="ota-header-market-slot" aria-hidden="true" />
    </div>
  ) : null;
  const handleRetryBackend = useCallback(() => {
    if (backendStatus?.triggerCheck) {
      backendStatus.triggerCheck();
      return;
    }
    setLocalBackendUnavailable(null);
    if (typeof getOTAHealth !== 'function') return;
    getOTAHealth()
      .then(() => setLocalBackendUnavailable(false))
      .catch(() => setLocalBackendUnavailable(true));
  }, [backendStatus]);

  const handleRunGovernanceCycle = useCallback(async () => {
    if (governanceRunLoading) return;
    setGovernanceRunLoading(true);
    setGovernanceRunStatus(null);
    try {
      const apiBase = getApiBaseUrl();
      // Ordine recomandată: Level65 → Level64 → Level69 (sync+audit) → Level67 → Level68 (doc OTA_LLM_AUTONOMY)
      await fetch(`${apiBase}/ai-trading/level5/level65/run`, { method: 'POST' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      await fetch(`${apiBase}/ai-trading/level5/level64/run`, { method: 'POST' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      const level69Data = await fetch(`${apiBase}/ai-trading/level5/level69/run`, { method: 'POST' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      const [l67Run, l68Run] = await Promise.all([
        fetch(`${apiBase}/ai-trading/level5/level67/run`, { method: 'POST' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch(`${apiBase}/ai-trading/level5/level68/run`, { method: 'POST' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      const status = {
        at: new Date().toISOString(),
        level69Status: level69Data?.status || level69Data?.code || 'n/a',
        level67Code: l67Run?.code || 'n/a',
        level68Code: l68Run?.code || 'n/a',
      };
      setGovernanceRunStatus(status);
      toast.success(`Governance cycle: L69 ${status.level69Status} | L67 ${status.level67Code} | L68 ${status.level68Code}`, { autoClose: 4000 });
    } catch (err) {
      const message = err?.message || 'Governance cycle failed';
      setGovernanceRunStatus({ at: new Date().toISOString(), error: message });
      toast.error(message, { autoClose: 4500 });
    } finally {
      setGovernanceRunLoading(false);
    }
  }, [governanceRunLoading]);

  const handleOpenGovernanceTab = useCallback(() => {
    setBrainTabRequest({ tab: 'governance', requestedAt: Date.now() });
    if (modelInferenceRef.current) {
      modelInferenceRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  useEffect(() => {
    if (currentMode !== 'auto') return;
    const params = new URLSearchParams(search || '');
    const requested = params.get('brainTab');
    if (!requested) return;
    if (requested === 'meta' || requested === 'bandit' || requested === 'backtest' || requested === 'governance') {
      setBrainTabRequest({ tab: requested, requestedAt: Date.now() });
      if (modelInferenceRef.current) {
        modelInferenceRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [search, currentMode]);

  // Scroll to Advisory "Analyze Market" section when link is opened with #ota-advisory-analyze
  useEffect(() => {
    if (currentMode !== 'advisory' || hash !== '#ota-advisory-analyze') return;
    const el = document.getElementById('ota-advisory-analyze');
    if (el) {
      const t = setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      return () => clearTimeout(t);
    }
  }, [currentMode, hash]);

  const otaDashboard = useOtaAutoDashboard();
  useEffect(() => {
    if (currentMode !== 'auto' || !hasFullAccess || !walletAddress) {
      setHeaderLiveStatus({ loading: false, liveGo: null, reasons: [], checkedAt: null });
      return;
    }
    if (!otaDashboard?.lastFetchAt) {
      setHeaderLiveStatus((prev) => ({ ...prev, loading: true }));
      return;
    }
    const { liveGo, reasons } = computeOtaHeaderLiveGo({
      isRegistered,
      botAuthorizations,
      executorBotAddress,
      policy: otaDashboard.policy,
      autoExecutionStatus: otaDashboard.autoStatus,
      guards: otaDashboard.guards,
    });
    setHeaderLiveStatus({
      loading: false,
      liveGo,
      reasons,
      checkedAt: otaDashboard.lastFetchAt || new Date().toISOString(),
    });
  }, [currentMode, hasFullAccess, walletAddress, isRegistered, botAuthorizations, executorBotAddress, otaDashboard]);

  const tutorialCompleted = useMemo(() => {
    return localStorage.getItem('ota-tutorial-completed') === 'true' || 
           localStorage.getItem('ota-tutorial-skipped') === 'true';
  }, []);

  // Tutorial: manual only (no auto-start)

  const handleTutorialComplete = () => {
    localStorage.setItem('ota-tutorial-completed', 'true');
    setShowTutorial(false);
    toast.success('Tutorial completed! You can restart it anytime using the help button.');
  };

  const handleTutorialSkip = () => {
    // Save skip preference - tutorial will not show automatically again
    localStorage.setItem('ota-tutorial-skipped', 'true');
    setShowTutorial(false);
  };

  // Advisory: analyze market (POST /api/ai-trading/analyze) with recentOutcomes for LLM
  const handleAnalyzeMarket = useCallback(async (token) => {
    if (!token) throw new Error('Token is required');
    const recentOutcomes = userId ? await loadOutcomesForAnalyze(userId).catch(() => []) : [];
    const options = buildAnalyzeOptions(userId, { quoteToken: 'USDT', recentOutcomes });
    return await analyzeMarketWithLlmProvider(token, options);
  }, [userId]);

  // Advisory/Assisted: navigate to Swap with prefilled from/to (and optional amount)
  const handleExecuteSwap = useCallback((tokenIn, tokenOut, amountIn) => {
    const params = new URLSearchParams({ from: tokenIn || '', to: tokenOut || 'USDT' });
    if (amountIn) params.set('amount', amountIn);
    navigate(`/dex-edu/swap?${params.toString()}`);
  }, [navigate]);

  if (otaLoading && isAuthenticated) {
    return (
      <div className="dashboard-page ota-page">
        <main className="ota-page-main ota-page-loading">
          <LoadingSpinner size="medium" message="Checking OTA registration..." />
        </main>
      </div>
    );
  }

  // Show OTA features (full access or preview mode) – un singur container principal, fără containere multiple
  return (
    <div className="dashboard-page ota-page">
      {backendUnavailable === true && (
        <div className="ota-backend-unavailable-banner" role="alert">
          <span>Backend temporarily unavailable – some features may not work.</span>
          <button type="button" className="ota-backend-unavailable-retry" onClick={handleRetryBackend}>
            Retry
          </button>
        </div>
      )}

      {/* Header: Trading Mode + Token Selector + OTA Advisory block + Market Analysis (portal în dex-header-center-slot) */}
      {headerSlotEl && hasFullAccess && typeof document !== 'undefined' && createPortal(
        <div className="ota-header-tools">
          <OTATradingModeHeaderDropdown />
          {currentMode === 'advisory' && (
            <button
              type="button"
              className="ota-header-advisory-trigger"
              onClick={() => setAdvisoryModalOpen(true)}
              aria-label="OTA Advisory – open instructions"
              title="Open OTA Advisory instructions"
              id="ota-features"
            >
              <Info size={14} aria-hidden />
              <span>OTA Advisory</span>
            </button>
          )}
          {currentMode === 'auto' && (
            <div className="ota-header-governance-wrap">
              <button
                type="button"
                className={`ota-header-live-badge ${headerLiveStatus.loading ? 'checking' : headerLiveStatus.liveGo ? 'go' : 'nogo'}`}
                onClick={handleOpenGovernanceTab}
                title={
                  headerLiveStatus.loading
                    ? 'Checking live runtime guards... Click to open Governance tab.'
                    : headerLiveStatus.liveGo === true
                      ? `Live GO${headerLiveStatus.checkedAt ? ` · ${new Date(headerLiveStatus.checkedAt).toLocaleTimeString()}` : ''}. Click to open Governance tab.`
                      : `Live NO-GO: ${(headerLiveStatus.reasons || []).join(', ') || 'runtime checks'}. Click to open Governance tab.`
                }
                aria-label="Open Governance tab in LLM Brain"
              >
                {headerLiveStatus.loading ? 'LIVE CHECK' : headerLiveStatus.liveGo ? 'LIVE GO' : 'LIVE NO-GO'}
              </button>
              <button
                type="button"
                className="ota-header-governance-trigger"
                onClick={handleRunGovernanceCycle}
                disabled={governanceRunLoading}
                title={governanceRunStatus?.error
                  ? `Last run failed: ${governanceRunStatus.error}`
                  : governanceRunStatus?.at
                    ? `Last run: L69 ${governanceRunStatus.level69Status} | L67 ${governanceRunStatus.level67Code} | L68 ${governanceRunStatus.level68Code}`
                    : 'Run governance cycle (65→64→69→67→68)'}
                aria-label="Run governance cycle now"
              >
                {governanceRunLoading ? <Square size={14} aria-hidden /> : <Play size={14} aria-hidden />}
                <span>{governanceRunLoading ? 'Running...' : 'Governance'}</span>
              </button>
              {governanceRunStatus?.at && (
                <span className={`ota-header-governance-result ${governanceRunStatus?.error ? 'error' : 'ok'}`}>
                  {governanceRunStatus?.error
                    ? 'Failed'
                    : `L69 ${governanceRunStatus.level69Status} | L67 ${governanceRunStatus.level67Code} | L68 ${governanceRunStatus.level68Code}`}
                </span>
              )}
            </div>
          )}
          <div ref={(el) => setMarketSlotEl(el)} className="ota-header-market-slot" />
        </div>,
        headerSlotEl
      )}
      {/* Token selector în header pentru Auto – Direct Entry: tokenul selectat = ce cumperi */}
      {marketSlotEl && hasFullAccess && currentMode === 'auto' && typeof document !== 'undefined' && createPortal(
        <div className="ota-header-token-slot" role="group" aria-label="Direct Entry – select token to buy">
          <span className="ota-header-token-label" title="Token you buy with Direct Entry. Pay with BNB/USDT/ETH from Personal Account.">
            Direct Entry · Buy:
          </span>
          <HeaderTokenSelector
            selectedToken={advisoryToken}
            onTokenChange={setAdvisoryToken}
            ariaLabel="Select token to buy with Direct Entry – chart and panel update"
            excludeStablecoins
          />
        </div>,
        marketSlotEl
      )}

      {showTutorial && (
        <OTATutorial
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
          startStep={0}
        />
      )}

      {!showTutorial && (
        <button
          onClick={() => setShowTutorial(true)}
          className="ota-floating-tutorial-btn"
          title="Help"
          aria-label="Help"
        >
          <BookOpen size={18} />
        </button>
      )}

      <Modal isOpen={advisoryModalOpen} onClose={() => setAdvisoryModalOpen(false)} title="OTA Advisory – Instructions" size="small">
        <div className="ota-advisory-modal-content">
          <p className="ota-advisory-modal-desc">
            1. Click Analyze Market (below). 2. Click Execute on Swap or the Swap / Trade view links.
          </p>
          <div className="ota-advisory-modal-steps">
            <span className="ota-advisory-modal-step"><span className="ota-advisory-modal-step-num">1</span> Click Analyze Market</span>
            <ChevronRight size={16} className="ota-advisory-modal-step-arrow" aria-hidden />
            <span className="ota-advisory-modal-step"><span className="ota-advisory-modal-step-num">2</span> Click Execute on Swap or Swap / Trade view</span>
          </div>
          <div className="ota-advisory-modal-nav" role="navigation">
            <Link to="/dex-edu/swap" className="ota-advisory-modal-btn ota-advisory-modal-btn-swap" onClick={() => setAdvisoryModalOpen(false)}>
              <ArrowRightLeft size={16} aria-hidden />
              <span>Swap</span>
            </Link>
            <Link to="/dex-edu/ota/trade" className="ota-advisory-modal-btn ota-advisory-modal-btn-trade" onClick={() => setAdvisoryModalOpen(false)}>
              <LineChart size={16} aria-hidden />
              <span>Trade view</span>
            </Link>
          </div>
        </div>
      </Modal>

      <main className="ota-page-main" aria-labelledby="ota-features">
        <OtaBscAutoStatusBanner />
        {/* Profit / Loss sub Header, sub butonul Personal Account – dinamic când există poziție Direct Entry */}
        <OpenPositionPnLStrip />
        {isPreviewMode && (
          <div className="ota-preview-bar">
            <span className="ota-preview-bar-text">Limited access. Register for OTA for full access.</span>
            {walletAddress && isAuthenticated && !isRegistered && (
              <button
                type="button"
                className="ota-preview-bar-btn"
                onClick={async () => {
                  try {
                    toast.info('Preparing registration... MetaMask will open.', { autoClose: 4000 });
                    await registerOTA();
                    toast.success('OTA registration successful.', { autoClose: 5000 });
                  } catch (err) {
                    const msg = err.message || 'Registration failed.';
                    if (isContractsNotDeployed(msg)) toast.info(contractStatus.message, { autoClose: 5000 });
                    else if (msg.includes('rejected') || msg.includes('cancelled')) toast.warning('Transaction cancelled.');
                    else if (msg.includes('insufficient') || msg.includes('BITS')) toast.error('Insufficient BITS (min 5,000).');
                    else toast.error(msg);
                  }
                }}
                disabled={isRegistering || otaLoading}
              >
                {isRegistering ? <><LoadingSpinner size="small" message="" /> Registering...</> : <><Shield size={14} /> Register for OTA</>}
              </button>
            )}
          </div>
        )}

        {/* Header block: skip for Auto (mode already in DEX Header); show for preview / other modes */}
        {!(hasFullAccess && currentMode === 'advisory') && currentMode !== 'auto' && (
          <header className="ota-page-header-block">
            <h2 className="ota-page-title ota-title-row" id="ota-features">
              <OTABrand size="md" className="ota-page-title-logo" />
              {isPreviewMode && <span className="ota-page-badge">Limited access</span>}
              {hasFullAccess && !isPreviewMode && <span className="ota-page-badge">{(currentMode === 'advisory' ? 'Signals only' : currentMode === 'auto' ? 'Auto' : currentMode)}</span>}
            </h2>
            <p className="ota-page-desc">
              1. Click Analyze Market (below). 2. Click Execute on Swap or the Swap / Trade view links.
            </p>
          </header>
        )}

        {hasFullAccess && currentMode === 'advisory' && (
          <div id="ota-advisory-analyze" className="ota-page-advisory-section">
            <div className="short-ops-panel ota-advisory-llm-wrap">
              <OtaLlmAnalyzeModeControls
                walletAddress={walletAddress}
                openLivePositionsCount={0}
                futuresPanelLabel="Advisory"
                compact
              />
            </div>
            <ErrorBoundary>
              <Suspense fallback={<Skeleton variant="card" height={320} />}>
                <MarketAnalysis
                userId={userId}
                selectedToken={advisoryToken}
                onTokenChange={setAdvisoryToken}
                onAnalyze={handleAnalyzeMarket}
                onExecuteSwap={handleExecuteSwap}
                loading={false}
                headerSlot={currentMode === 'advisory' && hasFullAccess ? marketSlotEl : null}
              />
              </Suspense>
            </ErrorBoundary>
          </div>
        )}

        {hasFullAccess && currentMode === 'auto' && (
          <div className="ota-page-auto-layout" role="region" aria-label="Auto mode: policy and configuration">
            <div className="ota-page-auto-main">
              <OtaSafetyDashboard />
              <ErrorBoundary>
                <Suspense fallback={<Skeleton variant="card" height={420} />}>
                  <AutoTradePanel />
                </Suspense>
              </ErrorBoundary>
            </div>
            <div className="ota-page-auto-config">
              <div ref={modelInferenceRef}>
                <ErrorBoundary>
                  <Suspense fallback={<Skeleton variant="card" height={200} />}>
                    <ModelInferencePanel className="ota-page-model-inference" externalBrainTabRequest={brainTabRequest} />
                  </Suspense>
                </ErrorBoundary>
              </div>
              <OTAVaultBalanceCard />
              <OTANetPnlCard walletAddress={walletAddress} />
              <OTAAccessControl />
              <OTASettingsPanel />
              <ErrorBoundary>
                <Suspense fallback={<Skeleton variant="card" height={520} />}>
                  <OTAPriceChart height={480} interval="60" className="ota-page-auto-chart" token={advisoryToken} />
                </Suspense>
              </ErrorBoundary>
              {/* Activity & metrics – Worker status, PnL, Risk; buton expand/collapse */}
              <OTAActivityPanel className="ota-page-activity-panel" defaultExpanded={false} />
              {/* Open Orders – Direct Entry positions sub Chart; Close manual or LLM */}
              <OpenOrdersPanel token={advisoryToken} className="ota-page-open-orders" />
              {/* LLM Monitoring – price source, P&L evolution, LLM tips */}
              <LLMMonitoringPanel token={advisoryToken} className="ota-page-llm-monitoring" />
            </div>
          </div>
        )}

        {hasFullAccess && currentMode !== 'auto' && (
          <div className="ota-page-config-grid" role="region" aria-label="OTA Configuration">
            <OTAAccessControl />
            <OTASettingsPanel />
          </div>
        )}

        {isPreviewMode && isAuthenticated && (
          <div className="ota-page-config-grid" role="region" aria-label="OTA registration">
            <OTAAccessControl />
          </div>
        )}

        <section className="ota-page-help" aria-labelledby="ota-help-title">
          <h3 className="ota-page-help-title ota-title-row" id="ota-help-title">
            <HelpCircle size={18} className="ota-page-help-icon ota-title-row-icon" />
            Help &amp; Documentation
          </h3>
          <p className="ota-page-help-desc">
            Learn more about OTA features, configuration, and best practices.
          </p>
          <div className="ota-page-help-links">
            <a href="/dex-edu/ota" className="ota-page-help-link" target="_blank" rel="noopener noreferrer">
              <BookOpen size={14} /><span>OTA Overview</span><ExternalLink size={12} />
            </a>
            <a href="/dex-edu/dashboard" className="ota-page-help-link" rel="noopener noreferrer">
              <BookOpen size={14} /><span>Dashboard</span><ExternalLink size={12} />
            </a>
            <Link to="/dex-edu/signals" className="ota-page-help-link">
              <Radio size={14} aria-hidden /><span>Trading signals (history)</span><ExternalLink size={12} />
            </Link>
            <a href="/dex-edu/swap" className="ota-page-help-link" rel="noopener noreferrer">
              <BookOpen size={14} /><span>Swap</span><ExternalLink size={12} />
            </a>
            <a href="/dex-edu/ota/chat" className="ota-page-help-link" rel="noopener noreferrer">
              <BookOpen size={14} /><span>Chat OpenAI</span><ExternalLink size={12} />
            </a>
            <Link to="/dex-edu/ota/sei" className="ota-page-help-link">
              <span>OTA SEI (Micro-Profit)</span><ExternalLink size={12} />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
});

OTAPageInner.displayName = 'OTAPage';

function OTAPageRoot() {
  const { walletAddress } = useDexAuth();
  const { currentMode } = useOTAMode();
  const { hasFullAccess } = useOTAAccess();
  const enabled = Boolean(hasFullAccess && currentMode === 'auto');
  return (
    <OtaAutoDashboardProvider walletAddress={walletAddress} enabled={enabled}>
      <OTAPageInner />
    </OtaAutoDashboardProvider>
  );
}

export default OTAPageRoot;
