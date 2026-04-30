/**
 * Trade with Leverage – open/close positions using LeverageTrading contract (BSC).
 * Spot + CFD (gold, oil, crypto). USD/EUR margin from UserVault.
 * Tab URL: /dex-edu/leverage = Spot, /dex-edu/leverage/cfd = CFD; if `SPOT_LEVERAGE_UI_DISABLED`, Spot is closed and the spot route redirects to CFD (without ?tab=fund).
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ethers } from 'ethers';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, useSearchParams, NavLink } from 'react-router-dom';
import LeverageCfdHeaderDropdown from '../components/leverage/LeverageCfdHeaderDropdown';
import { useLeverageTrading } from '../hooks/useLeverageTrading';
import { useLeveragePage } from '../hooks/useLeveragePage';
import { useStripeVaultReturn } from '../hooks/useStripeVaultReturn';
import { useLeverageDemoAccount } from '../hooks/useLeverageDemoAccount';
import VaultDepositPanel from '../components/leverage/VaultDepositPanel';
import LeverageSpotForm from '../components/leverage/LeverageSpotForm';
import LeverageCFDForm from '../components/leverage/LeverageCFDForm';
import LeveragePositionsTable from '../components/leverage/LeveragePositionsTable';
import LeverageSpotCollateralModal from '../components/leverage/LeverageSpotCollateralModal';
import LeverageRecentActivity from '../components/leverage/LeverageRecentActivity';
import LeverageProductNotice from '../components/leverage/LeverageProductNotice';
import { subscribeLeverageActivity } from '../utils/leverageActivityBus';
import { prependLeverageActivity, loadLeverageActivitySession } from '../utils/leverageActivityStorage';
import TradingViewChart from '../components/common/TradingViewChart';
import HeaderTokenSelector from '../components/common/HeaderTokenSelector';
import { useHeaderToken } from '../context/HeaderTokenContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import {
  CFD_ASSETS,
  DEMO_DEFAULT_VAULT_BALANCES,
  SPOT_LEVERAGE_UI_DISABLED,
  parseCfdAssetQueryParam,
  getRawCfdInstrumentQuery,
  normalizeCfdAssetId,
} from '../constants/leverageConstants';
import { getOTAMarketData } from '../services/aiTradingApiService.jsx';
import { fetchCFDLivePrice } from '../services/cfdPriceService';
import { sumCfdUnrealizedPnlUsdt } from '../utils/leverageCfdPnl';
import { repairBscNetwork } from '../services/repairBscNetwork';
import { pickEvmProvider } from '../../utils/evmProviderResolver.js';
import { AlertCircle } from 'lucide-react';
import TokenLogo from '../components/common/TokenLogo';
import '../styles/components/dashboard-page.css';
import '../styles/components/leverage-page.css';
import '../styles/components/header-token-selector.css';

const FUND_TABS = ['deposit', 'withdraw', 'stripe', 'bank'];

export default function LeveragePage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fundTabFromUrl = searchParams.get('tab');
  /** When the user arrives with ?tab=deposit|withdraw|stripe|bank: focused view, only Fund account, no Chart/Open position, forced Real. */
  const isFundFocus = FUND_TABS.includes(fundTabFromUrl);
  const leverage = useLeverageTrading();
  const demo = useLeverageDemoAccount();
  // Binance public API (no auth) -> OTA fallback for Gold/Oil.
  const otaFallback = React.useCallback(async (assetId) => {
    const asset = CFD_ASSETS.find((a) => a.id === assetId);
    if (!asset?.priceToken) return null;
    const res = await getOTAMarketData(asset.priceToken);
    const md = res?.marketData ?? res;
    const price = md?.currentPrice ?? md?.price ?? null;
    return price != null ? Number(price) : null;
  }, []);

  const getCurrentPriceForAsset = React.useCallback(async (assetId) => {
    try {
      return await fetchCFDLivePrice(assetId, otaFallback);
    } catch {
      return null;
    }
  }, [otaFallback]);
  const activeTab = pathname.endsWith('/cfd') ? 'cfd' : 'spot';
  const [headerSlotEl, setHeaderSlotEl] = useState(null);
  const [selectedToken, setSelectedToken] = useHeaderToken();
  const [cfdPricesByAsset, setCfdPricesByAsset] = useState({});
  /** 'real' | 'demo' | null: user choice. null = use default (demo if has account). */
  const [modeOverride, setModeOverride] = useState(null);
  const [rpcFixLoading, setRpcFixLoading] = useState(false);
  const [rpcFixMessage, setRpcFixMessage] = useState('');
  const [activityEntries, setActivityEntries] = useState(() => loadLeverageActivitySession());
  const [collateralModalPos, setCollateralModalPos] = useState(null);

  const forceRealMode = modeOverride === 'real';
  /** When ?tab=deposit|withdraw|stripe|bank -> forced Real (no Demo). */
  const effectiveDemoMode = isFundFocus ? false : (demo.isDemoMode && modeOverride !== 'real');
  const page = useLeveragePage(leverage, demo, { getCurrentPriceForAsset, forceRealMode });

  useEffect(() => {
    const el = document.getElementById('dex-header-center-slot');
    setHeaderSlotEl(el);
  }, []);

  useEffect(() => {
    return subscribeLeverageActivity((entry) => {
      setActivityEntries((prev) => prependLeverageActivity(entry, prev));
    });
  }, []);

  const {
    contractReady,
    contractAddress,
    error,
    refetch,
    walletAddress: leverageWalletAddress,
    positionsLastSyncedAt,
    LIVE_POSITIONS_POLL_MS,
  } = leverage;

  // Fiat -> Leverage: after Stripe redirect with leverage_fiat_open.
  // Pre-populates the form from tradeParams and navigates to the correct tab.
  // Instant on-chain auto-open is not possible after Stripe because the on-chain vault is not credited
  // immediately; backend/operator must transfer the USDC/USDT equivalent first.
  const handleFiatLeverageSuccess = React.useCallback(({ tradeParams, amountEur, amountUsd, amount }) => {
    if (!tradeParams) return;
    const { tradeType, assetId, leverageBps: lbps, isLong, settlementToken, collateralToken, borrowedToken } = tradeParams;
    // Paid amount: prefer `amount` from verify-session (major units); legacy fallback.
    const EUR_USD = 1.08;
    const humanAmt =
      amount != null && Number.isFinite(Number(amount))
        ? String(Number(amount))
        : String(amountUsd || (amountEur ? Math.round(amountEur * EUR_USD) : '') || '');

    if (tradeType === 'cfd') {
      if (assetId != null)  page.setCfdAssetId?.(assetId);
      if (lbps)             page.setCfdLeverageBps?.(lbps);
      if (isLong != null)   page.setCfdIsLong?.(isLong);
      if (settlementToken)  page.setCfdSettlementToken?.(settlementToken);
      if (humanAmt)         page.setCfdAmount?.(humanAmt);
      navigate(`/dex-edu/leverage/cfd?cfd=${tradeParams.assetId ?? 0}`, { replace: true });
    } else {
      if (SPOT_LEVERAGE_UI_DISABLED) {
        navigate('/dex-edu/leverage/cfd', { replace: true });
        return;
      }
      if (collateralToken) page.setCollateralToken?.(collateralToken);
      if (borrowedToken)   page.setBorrowedToken?.(borrowedToken);
      if (lbps)            page.setLeverageBps?.(lbps);
      if (humanAmt)        page.setAmount?.(humanAmt);
      navigate('/dex-edu/leverage', { replace: true });
    }
  }, [page, navigate]);

  useStripeVaultReturn({ onFiatLeverageSuccess: handleFiatLeverageSuccess });

  /** Without ?tab=fund: /dex-edu/leverage (spot) redirects to CFD when spot is closed in UI. */
  useEffect(() => {
    if (!SPOT_LEVERAGE_UI_DISABLED) return;
    if (isFundFocus) return;
    if (pathname === '/dex-edu/leverage' || pathname === '/dex-edu/leverage/') {
      navigate('/dex-edu/leverage/cfd', { replace: true });
    }
  }, [SPOT_LEVERAGE_UI_DISABLED, isFundFocus, pathname, navigate]);

  const handleFixBscRpc = React.useCallback(async () => {
    setRpcFixMessage('');
    setRpcFixLoading(true);
    try {
      const eth = pickEvmProvider();
      const ok = await repairBscNetwork(eth);
      setRpcFixMessage(ok ? 'BSC RPC updated. Try Open again.' : 'Rejected or failed.');
    } catch (e) {
      setRpcFixMessage(e?.message || 'Failed');
    } finally {
      setRpcFixLoading(false);
    }
  }, []);

  const {
    collateralToken,
    setCollateralToken,
    borrowedToken,
    setBorrowedToken,
    amount,
    setAmount,
    leverageBps,
    setLeverageBps,
    spotAvailable,
    txPendingDemo,
    txPendingReal,
    txError,
    cfdSettlementToken,
    setCfdSettlementToken,
    cfdAssetId = 0,
    setCfdAssetId = () => {},
    cfdAmount,
    setCfdAmount,
    cfdLeverageBps,
    setCfdLeverageBps,
    cfdIsLong,
    setCfdIsLong,
    tokenOptions,
    cfdMarginOptions,
    vaultBalanceFormatted,
    cfdVaultBalanceFormatted,
    sameToken,
    handleMax,
    handleOpen,
    handleClose,
    handleCfdMax,
    handleOpenCFD,
    handleCloseCFD,
    handleVaultBalanceChange,
    positions,
    loading,
    cfdPositions,
    isConnected,
    connectWallet,
    BPS_DENOMINATOR,
    getTokenDecimals,
    vaultBalanceMap,
    liveTradingBlocked,
    leverageChainGate,
    handleSpotAddCollateral,
    handleSpotRemoveCollateral,
  } = page;

  /** Instrument CFD: stare formular + `?cfd=` (index sau simbol în URL). */
  const applyCfdAsset = React.useCallback(
    (id) => {
      const n = normalizeCfdAssetId(id);
      setCfdAssetId(n);
      if (!pathname.endsWith('/cfd')) {
        navigate(`/dex-edu/leverage/cfd?cfd=${n}`);
        return;
      }
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          p.delete('ctd');
          p.set('cfd', String(n));
          return p;
        },
        { replace: true }
      );
    },
    [pathname, navigate, setSearchParams, setCfdAssetId]
  );

  /** Sync instrument din `?cfd=` sau `?ctd=` (typo); normalizează mereu la `cfd`. */
  useEffect(() => {
    if (!pathname.endsWith('/cfd')) return;
    const raw = getRawCfdInstrumentQuery(searchParams);
    const parsed = parseCfdAssetQueryParam(raw);
    if (parsed !== null && parsed !== cfdAssetId) {
      setCfdAssetId(parsed);
    }
    if (searchParams.has('ctd')) {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          const hadCfd = p.get('cfd');
          p.delete('ctd');
          if (hadCfd == null || hadCfd === '') {
            const n = parseCfdAssetQueryParam(p.get('cfd') || raw);
            if (n != null) p.set('cfd', String(n));
            else if (raw) p.set('cfd', raw);
          }
          return p;
        },
        { replace: true }
      );
    }
  }, [pathname, searchParams, cfdAssetId, setCfdAssetId, setSearchParams]);

  const collateralModalSymbol = collateralModalPos
    ? tokenOptions.find((o) => o.address === collateralModalPos.collateralToken)?.symbol || 'Token'
    : 'Token';
  const collateralModalVaultFmt = useMemo(() => {
    if (!collateralModalPos) return '0';
    const raw = vaultBalanceMap?.[collateralModalPos.collateralToken] || '0';
    const dec = getTokenDecimals(collateralModalPos.collateralToken);
    try {
      return ethers.utils.formatUnits(raw, dec);
    } catch {
      return '0';
    }
  }, [collateralModalPos, vaultBalanceMap, getTokenDecimals]);

  const txPending = effectiveDemoMode ? txPendingDemo : txPendingReal;

  const cfdPriceFetchRef = useRef({ lastRun: 0 });
  const assetIdsKey = activeTab === 'cfd' && cfdPositions?.length
    ? [...new Set(cfdPositions.map((p) => p.asset))].sort((a, b) => a - b).join(',')
    : '';
  useEffect(() => {
    if (activeTab !== 'cfd' || !assetIdsKey) return;
    const assetIds = assetIdsKey.split(',').map(Number).filter((n) => !Number.isNaN(n));
    let cancelled = false;
    const minIntervalMs = 5000;
    const fetchPrices = async () => {
      const now = Date.now();
      if (now - cfdPriceFetchRef.current.lastRun < minIntervalMs) return;
      cfdPriceFetchRef.current.lastRun = now;
      const next = {};
      for (const id of assetIds) {
        if (cancelled) return;
        try {
          const price = await getCurrentPriceForAsset(id);
          if (!cancelled && price != null) next[id] = Number(price);
        } catch (_) {}
      }
      if (!cancelled) setCfdPricesByAsset((prev) => ({ ...prev, ...next }));
    };
    const t = setTimeout(fetchPrices, 300);
    const interval = setInterval(fetchPrices, 5000);
    return () => {
      cancelled = true;
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [activeTab, assetIdsKey, getCurrentPriceForAsset]);

  const cfdUnrealizedTotals = useMemo(() => {
    if (activeTab !== 'cfd' || !cfdPositions?.length) {
      return { total: null, withFeed: 0, withoutFeed: 0 };
    }
    return sumCfdUnrealizedPnlUsdt(cfdPositions, cfdPricesByAsset, { getTokenDecimals, BPS_DENOMINATOR });
  }, [activeTab, cfdPositions, cfdPricesByAsset, getTokenDecimals, BPS_DENOMINATOR]);

  return (
    <div className={`dashboard-page-shell leverage-page-shell${isFundFocus ? ' leverage-fund-focus' : ''}`}>
      {!contractReady && !effectiveDemoMode && (
        <div className="leverage-not-deployed leverage-banner">
          <p className="leverage-not-deployed-desc">
            Loading Leverage contract… Check <code>runtime-config.json</code> or env. Fallback BSC: <code>0x14e89879f5e7715Ea59ae54A5A161E28A9d58452</code>
          </p>
        </div>
      )}

      {error && (
        <div className="leverage-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={refetch} className="leverage-retry">Retry</button>
        </div>
      )}

      {!effectiveDemoMode && isConnected && leverageChainGate?.chainPending && (
        <div className="leverage-chain-pending-banner" role="status" aria-live="polite">
          Checking wallet network…
        </div>
      )}

      {!effectiveDemoMode && isConnected && (leverageChainGate?.isWrongChain || leverageChainGate?.chainReadFailed) && (
        <div className="leverage-wrong-chain-banner" role="alert">
          <strong>Wrong or unreadable network</strong>
          <p className="leverage-wrong-chain-desc">
            {leverageChainGate.chainReadFailed
              ? 'Could not read the chain from your wallet. Unlock the wallet or try switching network below.'
              : `Your wallet is on chain ${leverageChainGate.connectedChainId}. Live trades require ${leverageChainGate.expectedLeverageChainName} (chain ${leverageChainGate.expectedLeverageChainId}).`}
          </p>
          <div className="leverage-wrong-chain-actions">
            <button
              type="button"
              className="leverage-btn leverage-btn-primary leverage-btn-sm"
              onClick={handleFixBscRpc}
              disabled={rpcFixLoading}
              aria-busy={rpcFixLoading}
            >
              {rpcFixLoading ? 'Switching…' : 'Switch to BSC'}
            </button>
            <span className="leverage-wrong-chain-hint">Uses the wallet prompt to add/switch BNB Smart Chain.</span>
          </div>
        </div>
      )}

      {txError && (
        <div className="leverage-tx-error" role="alert">{txError}</div>
      )}

      {!isFundFocus && (
        <LeverageProductNotice isDemoMode={effectiveDemoMode} />
      )}

      {/* Când fund-focus: link înapoi la trading */}
      {isFundFocus && (
        <div className="leverage-fund-focus-back">
          <button
            type="button"
            className="leverage-fund-focus-back-btn"
            onClick={() => navigate(SPOT_LEVERAGE_UI_DISABLED ? '/dex-edu/leverage/cfd' : '/dex-edu/leverage')}
            aria-label="Back to Leverage trading"
          >
            ← Back to trading
          </button>
        </div>
      )}

      {!isFundFocus && (demo.needsAuth || demo.error) && (
        <div className="leverage-demo-banner" role="region" aria-label="Demo account">
          {demo.needsAuth && (
            <p className="leverage-demo-msg">Sign in or register to use a demo account.</p>
          )}
          {demo.error && (
            <p className="leverage-demo-error" role="alert" aria-live="polite">
              {demo.error}
            </p>
          )}
        </div>
      )}

      {headerSlotEl && typeof document !== 'undefined' && !isFundFocus && createPortal(
        <div className="leverage-header-toolbar">
          <HeaderTokenSelector
            selectedToken={selectedToken}
            onTokenChange={setSelectedToken}
            ariaLabel="Select token for chart"
          />
          <nav className="leverage-header-tabs" aria-label="Leverage type">
            {SPOT_LEVERAGE_UI_DISABLED ? (
              <span
                className="leverage-header-tab is-disabled"
                title="Spot leverage is temporarily unavailable — use CFD until a compatible lending pool integration exists."
              >
                Spot (unavailable)
              </span>
            ) : (
              <NavLink
                to="/dex-edu/leverage"
                end
                className={({ isActive }) => `leverage-header-tab ${isActive ? 'is-active' : ''}`}
              >
                Spot Leverage
              </NavLink>
            )}
            <LeverageCfdHeaderDropdown
              isCfdRoute={activeTab === 'cfd'}
              cfdAssetId={cfdAssetId}
              onSelectInstrument={applyCfdAsset}
            />
          </nav>
          <div className="leverage-header-mode-wrap" aria-label="Trading mode">
            {demo.canUseDemo && !demo.needsAuth && !demo.needsWallet ? (
              <>
                <div className="leverage-header-mode-row">
                  <span
                    className={`leverage-mode-pill ${effectiveDemoMode ? 'leverage-mode-pill-demo' : 'leverage-mode-pill-real'}`}
                  >
                    <span className="leverage-mode-pill-dot" aria-hidden />
                    {effectiveDemoMode ? 'Demo' : 'Live'}
                  </span>
                  <div className="leverage-mode-toggle" role="group" aria-label="Demo or Real trading">
                    <button
                      type="button"
                      className={`leverage-mode-toggle-btn leverage-mode-toggle-btn--demo${effectiveDemoMode ? ' is-active' : ''}`}
                      onClick={() => setModeOverride('demo')}
                      aria-pressed={effectiveDemoMode}
                      aria-label="Demo mode: same market prices as live, virtual margin only"
                    >
                      Demo
                    </button>
                    <button
                      type="button"
                      className={`leverage-mode-toggle-btn leverage-mode-toggle-btn--real ${!effectiveDemoMode ? ' is-active' : ''}`}
                      onClick={() => setModeOverride('real')}
                      aria-pressed={!effectiveDemoMode}
                      aria-label="Real mode: BSC vault and contract, real funds"
                    >
                      Real
                    </button>
                  </div>
                </div>
                <span className="leverage-mode-label" aria-live="polite">
                  {effectiveDemoMode
                    ? `Training · same live quotes as Real · not on-chain${demo.hasAccount && !demo.isDemoExpired && demo.daysLeft != null ? ` · ${demo.daysLeft}d demo left` : ''}`
                    : 'Live BSC · UserVault + contract · real funds'}
                </span>
                {(!demo.hasAccount || demo.isDemoExpired) && (
                  <button
                    type="button"
                    className="leverage-header-demo-btn"
                    onClick={() => {
                      demo.openDemoAccount().catch((e) => {
                        if (!e?.status || e.status !== 401) console.error('[Leverage] Open demo failed', e);
                      });
                    }}
                    disabled={demo.loading}
                    aria-busy={demo.loading}
                    aria-label={demo.loading ? 'Opening demo account' : demo.isDemoExpired ? 'Open new demo account' : 'Open demo account'}
                  >
                    {demo.loading ? 'Opening…' : demo.isDemoExpired ? 'Open new demo' : 'Open demo'}
                  </button>
                )}
              </>
            ) : (
              <span className="leverage-mode-badge leverage-mode-real">Real</span>
            )}
            {demo.error && (
              <span className="leverage-header-demo-error" role="alert">
                {demo.error}
              </span>
            )}
          </div>
        </div>,
        headerSlotEl
      )}

      {/* 3 componente pe un rând – Chart | Fund account | Open position/CFD */}
      <div className="leverage-top-row">
        <section className="leverage-chart-section" aria-label="Price chart">
          <ErrorBoundary fallback={<div className="leverage-chart-fallback">Chart failed to load.</div>}>
            <TradingViewChart
              symbol={activeTab === 'cfd' ? (CFD_ASSETS.find((a) => a.id === cfdAssetId)?.chartSymbol || 'BINANCE:BNBUSDT') : `BINANCE:${selectedToken}USDT`}
              interval="60"
              theme="dark"
              height={320}
              autosize
            />
          </ErrorBoundary>
        </section>
        <div className="leverage-grid-cell">
          <VaultDepositPanel
            onBalanceChange={effectiveDemoMode ? demo.refreshDemoStatus : handleVaultBalanceChange}
            isDemoMode={effectiveDemoMode}
            demoVaultBalances={demo.demoAccount?.vaultBalances}
            onResetDemoBalance={
              demo.updateDemoAccount
                ? () =>
                    demo.updateDemoAccount({
                      vaultBalances: { ...DEMO_DEFAULT_VAULT_BALANCES },
                      positions: demo.demoAccount?.positions || [],
                    })
                : undefined
            }
            onAddDemoFiatFunds={
              demo.updateDemoAccount
                ? async (amount, currency) => {
                    const EUR_USD = 1.08;
                    const usdEq = currency === 'eur' ? Math.round(amount * EUR_USD * 100) / 100 : amount;
                    const current = demo.demoAccount || {};
                    const vaultBalances = { ...(current.vaultBalances || {}) };
                    const cur = parseFloat(vaultBalances['USDT'] || '0');
                    vaultBalances['USDT'] = String(Math.round((cur + usdEq) * 100) / 100);
                    await demo.updateDemoAccount({ vaultBalances, positions: current.positions || [] });
                  }
                : undefined
            }
          />
        </div>
        {activeTab === 'spot' ? (
          <section className="leverage-card">
            <h2 className="leverage-card-title">
              <TokenLogo
                symbol={tokenOptions?.find((o) => o.address === collateralToken)?.symbol || 'BNB'}
                size="sm"
                aria-hidden
              />
              Open position
            </h2>
            <LeverageSpotForm
              collateralToken={collateralToken}
              setCollateralToken={setCollateralToken}
              borrowedToken={borrowedToken}
              setBorrowedToken={setBorrowedToken}
              amount={amount}
              setAmount={setAmount}
              leverageBps={leverageBps}
              setLeverageBps={setLeverageBps}
              vaultBalanceFormatted={vaultBalanceFormatted}
              onMax={handleMax}
              sameToken={sameToken}
              isConnected={isConnected}
              connectWallet={connectWallet}
              tokenOptions={tokenOptions}
              onOpen={handleOpen}
              contractReady={effectiveDemoMode ? true : contractReady}
              spotAvailable={spotAvailable}
              txPending={txPending}
              walletAddress={leverageWalletAddress}
              isDemoMode={effectiveDemoMode}
              liveTradingBlocked={!effectiveDemoMode && liveTradingBlocked}
              chainGatePending={!effectiveDemoMode && !!leverageChainGate?.chainPending}
              spotUiDisabled={SPOT_LEVERAGE_UI_DISABLED}
            />
          </section>
        ) : (
          <section className="leverage-card">
            <h2 className="leverage-card-title">
              <TokenLogo
                symbol={CFD_ASSETS.find((a) => a.id === cfdAssetId)?.priceToken || 'BTC'}
                size="sm"
                aria-hidden
              />
              Open CFD
            </h2>
            <LeverageCFDForm
              settlementToken={cfdSettlementToken}
              setSettlementToken={setCfdSettlementToken}
              assetId={cfdAssetId}
              setAssetId={applyCfdAsset}
              amount={cfdAmount}
              setAmount={setCfdAmount}
              leverageBps={cfdLeverageBps}
              setLeverageBps={setCfdLeverageBps}
              isLong={cfdIsLong}
              setIsLong={setCfdIsLong}
              vaultBalanceFormatted={cfdVaultBalanceFormatted}
              onMax={handleCfdMax}
              isConnected={isConnected}
              connectWallet={connectWallet}
              marginOptions={cfdMarginOptions}
              onOpen={handleOpenCFD}
              contractReady={effectiveDemoMode ? true : contractReady}
              txPending={txPending}
              walletAddress={leverageWalletAddress}
              isDemoMode={effectiveDemoMode}
              liveTradingBlocked={!effectiveDemoMode && liveTradingBlocked}
              chainGatePending={!effectiveDemoMode && !!leverageChainGate?.chainPending}
            />
            {!effectiveDemoMode && isConnected && (
              <p className="leverage-cfd-rpc-fix">
                <button
                  type="button"
                  className="leverage-btn leverage-btn-outline leverage-btn-sm"
                  onClick={handleFixBscRpc}
                  disabled={rpcFixLoading}
                  aria-busy={rpcFixLoading}
                  aria-label={rpcFixLoading ? 'Updating BSC RPC…' : 'Use recommended BSC RPC'}
                >
                  {rpcFixLoading ? 'Updating…' : 'Use recommended BSC RPC'}
                </button>
                {rpcFixMessage && <span className="leverage-cfd-rpc-fix-msg" role="status">{rpcFixMessage}</span>}
              </p>
            )}
          </section>
        )}
      </div>

      <section className="leverage-positions-row leverage-card" aria-label="Open positions">
        <div className="leverage-positions-header">
          <h2 className="leverage-card-title">
            {activeTab === 'spot' ? 'Your positions' : 'CFD positions'}
          </h2>
          {(activeTab === 'spot' ? positions : cfdPositions).length === 0 && (
            <p className="leverage-placeholder leverage-placeholder--inline">
              {activeTab === 'spot' ? 'No open positions. Open one from the form.' : 'No CFD positions. Open one from the form.'}
            </p>
          )}
          {!effectiveDemoMode && isConnected && (
            <div className="leverage-positions-refresh-wrap">
              <button type="button" onClick={() => refetch()} disabled={loading} className="leverage-btn leverage-btn-outline leverage-btn-sm" aria-label="Refresh positions">
                Refresh
              </button>
              {positionsLastSyncedAt != null && (
                <span className="leverage-sync-meta" title={`Polling ~${Math.round(LIVE_POSITIONS_POLL_MS / 1000)}s + contract event hints (open/close). Collateral changes: post-tx + poll (no chain event).`}>
                  Last synced: {new Date(positionsLastSyncedAt).toLocaleTimeString()}
                </span>
              )}
            </div>
          )}
        </div>
        <LeveragePositionsTable
          mode={activeTab}
          positions={positions}
          cfdPositions={cfdPositions}
          cfdPricesByAsset={cfdPricesByAsset}
          loading={loading}
          BPS_DENOMINATOR={BPS_DENOMINATOR}
          getTokenDecimals={getTokenDecimals}
          onClose={handleClose}
          onCloseCFD={handleCloseCFD}
          txPending={txPending}
          isDemoMode={effectiveDemoMode}
          liveTradingBlocked={!effectiveDemoMode && liveTradingBlocked}
          chainGatePending={!effectiveDemoMode && !!leverageChainGate?.chainPending}
          showSpotCollateralUi={!effectiveDemoMode && !!contractReady}
          onManageSpotCollateral={(p) => setCollateralModalPos(p)}
        />
        {activeTab === 'cfd' && cfdPositions.length > 0 && (
          <div
            className={`leverage-cfd-total-pnl ${
              cfdUnrealizedTotals.total == null
                ? 'leverage-cfd-total-pnl--na'
                : cfdUnrealizedTotals.total >= 0
                  ? 'leverage-cfd-total-pnl--profit'
                  : 'leverage-cfd-total-pnl--loss'
            }`}
            role="status"
            aria-live="polite"
          >
            <div className="leverage-cfd-total-pnl-head">
              <span className="leverage-cfd-total-pnl-label">Total profit (unrealized)</span>
              <span className="leverage-cfd-total-pnl-value">
                {cfdUnrealizedTotals.total != null ? (
                  <>
                    <span className="leverage-cfd-total-pnl-sum">
                      {cfdUnrealizedTotals.total >= 0 ? '+' : ''}
                      {Number(cfdUnrealizedTotals.total).toFixed(2)} USDT
                    </span>
                    {cfdUnrealizedTotals.withoutFeed > 0 ? (
                      <span className="leverage-cfd-total-pnl-meta">
                        {' '}
                        · {cfdUnrealizedTotals.withFeed}/{cfdPositions.length} positions with feed
                      </span>
                    ) : (
                      <span className="leverage-cfd-total-pnl-meta"> · {cfdUnrealizedTotals.withFeed} positions</span>
                    )}
                  </>
                ) : (
                  <span className="leverage-cfd-total-pnl-na">— (no price feed)</span>
                )}
              </span>
            </div>
            <details className="leverage-cfd-total-pnl-details">
              <summary className="leverage-cfd-total-pnl-details-summary">How the total is calculated</summary>
              <p className="leverage-cfd-total-pnl-foot">
                Sum of PnL from the rows above (live prices). Positions without a feed are not included in the total.
              </p>
            </details>
          </div>
        )}
      </section>

      <LeverageRecentActivity entries={activityEntries} />

      <LeverageSpotCollateralModal
        open={!!collateralModalPos}
        onClose={() => setCollateralModalPos(null)}
        position={collateralModalPos}
        collateralSymbol={collateralModalSymbol}
        collateralDecimals={collateralModalPos ? getTokenDecimals(collateralModalPos.collateralToken) : 18}
        vaultBalanceFormatted={collateralModalVaultFmt}
        liveTradingBlocked={!effectiveDemoMode && liveTradingBlocked}
        chainGatePending={!effectiveDemoMode && !!leverageChainGate?.chainPending}
        txPending={txPending}
        onSubmitAdd={(pid, amt) =>
          handleSpotAddCollateral(pid, amt, { onSuccess: () => setCollateralModalPos(null) })
        }
        onSubmitRemove={(pid, amt) =>
          handleSpotRemoveCollateral(pid, amt, { onSuccess: () => setCollateralModalPos(null) })
        }
      />

      <details className="leverage-footer-details" role="contentinfo">
        <summary className="leverage-footer-summary">Technical details (contract, stack)</summary>
        <p className="leverage-footer-body">
          {contractAddress ? `BSC LeverageTrading: ${contractAddress}. ` : ''}
          Not the OTA/Binance futures stack. Spot: UserVault collateral. CFD: on-chain margin; LeverageTradingV2 can store
          TP/SL on-chain — closing at TP/SL requires a <code>triggerCFDCloseIfTPSL</code> tx (not sent by Bits). Close
          manually or when a trigger is mined.
        </p>
      </details>

    </div>
  );
}
