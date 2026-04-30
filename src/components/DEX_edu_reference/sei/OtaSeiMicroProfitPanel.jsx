/**
 * OtaSeiMicroProfitPanel – UI for OTA micro-profit strategy on SEI.
 * Config, gas estimate, signal, round-trip execution; Activity & Profit block (rounds, accumulated profit, time span).
 * Settings stopIfCannotEstimate and maxRounds: backend-only (no localStorage); synced via getSeiAutoStatus / setSeiAuto.
 * Plan: OTA_SEI_MICRO_PROFIT_IMPLEMENTATION_PLAN.md
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { Link } from 'react-router-dom';
import { Zap, CheckCircle, XCircle, ExternalLink, Info, Cpu, X, Bot, ChevronDown, ChevronUp, Sparkles, TrendingUp, Clock, Copy, Check } from 'lucide-react';
import TokenLogo from '../frontend/components/common/TokenLogo';
import OTALogo from '../frontend/components/ai-trading/OTALogo';
import { useSeiWallet } from './context/SeiWalletContext';
import { useOtaSeiMicroProfit } from './hooks/useOtaSeiMicroProfit';
import { symbolToDenom, SEI_AUTO_DEFAULT_PAIR, SEI_AUTO_PAIRS, SEI_AUTO_PAIR_IDS } from './seiTokenConfig';
import TokenSelectorSei from './TokenSelector.sei';
import { SEI_CONTRACTS } from './seiContractConfig';
import { seiNetwork, SEI_RPC, SEI_RPC_LIST } from './seiConfig';
import { queryContract } from './services/seiContractService';
import { useDexAuth } from '../frontend/context/DexAuthContext';
import { setLocalEnabled, requestOtaAiSeiRoundTripAck, getSeiAutoStatus, getSeiBotAddress, setSeiAuto, executeRoundTrip, openSeiPosition } from './services/otaSeiMicroProfitService';
import { getTrades } from '../frontend/services/executionApiService';
import { getOTAQuote, recordManualOutcome, unwrapOtaQuotePayload } from '../frontend/services/aiTradingApiService';
import { analyzeMarketWithLlmProvider } from '../frontend/services/otaAnalyzeFacade';
import { useOtaSeiPairOptional } from './context/OtaSeiPairContext';
import { useSeiPoolAndAuxiliarySignal } from './hooks/useSeiPoolAndAuxiliarySignal';
import SeiQuoteHealthBadge from './components/SeiQuoteHealthBadge';
import SeiAuxiliarySignalStatus from './components/SeiAuxiliarySignalStatus';
import { buildSeiRoundTripManualOutcomePayload } from './utils/seiManualOutcomePayload';
import { seiAutoReadinessHint } from './utils/seiAutoReadiness';
import { displaySeiTradePair } from './utils/displaySeiTradePair';
import { isOpenAiUnavailableResult, OTA_OPENAI_UNAVAILABLE_MESSAGE } from '../frontend/utils/helpers';
import { getApiBaseUrl, API_ENDPOINTS } from '../config/apiEndpoints.js';
import { DEFAULT_OTA_SEI_PAGE_PAIR } from './constants/otaSeiPageDefaults';
import OtaSeiCheckSignalModal from './components/OtaSeiCheckSignalModal';
import OtaSeiContractDataModal from './components/OtaSeiContractDataModal';
import OtaSeiAutoLaunchConfirmModal from './components/OtaSeiAutoLaunchConfirmModal';
import OtaSeiRoundTripResultModal from './components/OtaSeiRoundTripResultModal';
import SeiAuxiliaryVsPairCallout from './components/SeiAuxiliaryVsPairCallout';
import { parseConfig, toMinimalUnits, formatOtaAiSignal, formatOtaAiSignalShort, parsePairId } from './utils/otaSeiMicroProfitPanelHelpers';
import '../frontend/styles/components/ota-sei-micro-profit.css';

const STORAGE_KEY_PERCENT = 'ota-sei-micro-profit-percent';

export default function OtaSeiMicroProfitPanel({ splitLayout = false, pair: pairProp, setPair: setPairProp }) {
  const [internalPair, setInternalPair] = useState(DEFAULT_OTA_SEI_PAGE_PAIR);
  const effectivePair = pairProp != null ? pairProp : internalPair;
  const setEffectivePair = setPairProp || setInternalPair;
  const { base, quote } = useMemo(() => parsePairId(effectivePair), [effectivePair]);
  const pairPageCtx = useOtaSeiPairOptional();
  const livePrice = pairPageCtx?.livePriceUsd ?? null;
  const livePriceError = pairPageCtx?.livePriceError ?? null;
  const hasExecutionQuote = pairPageCtx?.livePriceHasExecutionQuote ?? false;
  const usedFallbackPrice = pairPageCtx?.livePriceUsedFallback ?? false;
  const lastExecutionQuoteAt = pairPageCtx?.livePriceLastExecutionAt ?? null;
  const {
    poolHealth,
    poolHealthLoading,
    checkPoolHealth,
    priceDiscrepancy,
    priceDiscrepancyLoading,
  } = useSeiPoolAndAuxiliarySignal();

  const { user } = useDexAuth();
  const userId = user?.id ?? user?.walletAddress ?? null;
  const { isConnected, address, getOfflineSigner } = useSeiWallet();
  const [signerError, setSignerError] = useState(null);
  const [contractStatus, setContractStatus] = useState(null); // 'ok' | 'error' | 'verifying' | null
  const [contractConfig, setContractConfig] = useState(null); // { fee_percentage, ota_only_mode, dex_addresses }
  const [whitelisted, setWhitelisted] = useState(null); // boolean | null
  const [verifyError, setVerifyError] = useState(null); // last error message
  const [verifying, setVerifying] = useState(false); // true while Verify request is in flight
  const [verifyModalOpen, setVerifyModalOpen] = useState(false); // popup with full contract data after Verify
  const [signalModalOpen, setSignalModalOpen] = useState(false); // popup for Check signal (what it does + result)
  const [roundTripModalOpen, setRoundTripModalOpen] = useState(false);
  const [roundTripResult, setRoundTripResult] = useState(null); // { success, txHash?, error? } after run
  const [otaAiMessage, setOtaAiMessage] = useState(null);
  const [otaAiLoading, setOtaAiLoading] = useState(false);
  const [otaAiAnalysis, setOtaAiAnalysis] = useState(null); // { signal, confidence, reasoning, entryPrice, ... } from OpenAI
  const [otaAiAnalysisLoading, setOtaAiAnalysisLoading] = useState(false);
  const [otaAiAnalysisError, setOtaAiAnalysisError] = useState(null);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [amountSei, setAmountSei] = useState('1');
  const [amountUsdc, setAmountUsdc] = useState('1');
  const [openPositionLoading, setOpenPositionLoading] = useState(false);
  const [openPositionError, setOpenPositionError] = useState(null);
  const [seiAutoStatus, setSeiAutoStatus] = useState(null);
  const [seiBotAddress, setSeiBotAddress] = useState(null);
  const [botSeiBalance, setBotSeiBalance] = useState(null);
  const [botSeiBalanceLoading, setBotSeiBalanceLoading] = useState(false);
  const [seiAutoLoading, setSeiAutoLoading] = useState(false);
  const [seiAutoSaving, setSeiAutoSaving] = useState(false);
  const [seiAutoOpen, setSeiAutoOpen] = useState(false);
  const [openAiConnected, setOpenAiConnected] = useState(null); // null = loading, true = OK, false = API disconnected
  const [seiHistoryOpen, setSeiHistoryOpen] = useState(false);
  const [seiHistory, setSeiHistory] = useState([]);
  const [seiHistoryLoading, setSeiHistoryLoading] = useState(false);
  const [seiHistoryError, setSeiHistoryError] = useState(null);
  const [stopIfCannotEstimate, setStopIfCannotEstimate] = useState(false);
  const [maxRounds, setMaxRounds] = useState(''); // '' = unlimited, number = limit
  const [seiAutoLaunchModalOpen, setSeiAutoLaunchModalOpen] = useState(false);
  const [botAddrCopied, setBotAddrCopied] = useState(false);
  const [depositGuideOpen, setDepositGuideOpen] = useState(false);
  const {
    config,
    gasEstimateUsd,
    minProfitUsd,
    minProfitOverGasPercent,
    setMinProfitOverGasPercent,
    signal,
    executeResult,
    loading,
    refreshConfig,
    refreshGasEstimate,
    refreshAll,
    checkSignal,
    runRoundTrip,
  } = useOtaSeiMicroProfit();

  useEffect(() => {
    const savedPercent = localStorage.getItem(STORAGE_KEY_PERCENT);
    if (savedPercent != null) {
      const p = parseInt(savedPercent, 10);
      if ([50, 100, 150, 200].includes(p)) setMinProfitOverGasPercent(p);
    }
  }, [setMinProfitOverGasPercent]);


  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const fetchOtaAiAnalysis = useCallback(async () => {
    setOtaAiAnalysisError(null);
    setOtaAiAnalysisLoading(true);
    try {
      const marketData = {
        note: `Micro-profit strategy ${effectivePair} on SEI Mainnet (pacific-1)`,
        pair: effectivePair,
        chain: 'sei',
      };
      if (typeof gasEstimateUsd === 'number') marketData.gasEstimateUsd = gasEstimateUsd;
      if (typeof minProfitUsd === 'number') marketData.minProfitUsd = minProfitUsd;
      if (config?.strategyName) marketData.strategy = config.strategyName;
      if (config?.minProfitOverGasPercent != null) marketData.minProfitOverGasPercent = config.minProfitOverGasPercent;
      const res = await analyzeMarketWithLlmProvider(base, {
        quoteToken: quote,
        userId: userId ?? undefined,
        marketData,
      });
      if (isOpenAiUnavailableResult(res)) {
        setOtaAiAnalysisError(OTA_OPENAI_UNAVAILABLE_MESSAGE);
        setOtaAiAnalysis(null);
        return;
      }
      const signal = res?.signal ?? res?.analysis?.signal;
      const confidence = res?.confidence ?? res?.analysis?.confidence;
      const reasoning = res?.reasoning ?? res?.analysis?.reasoning ?? '';
      setOtaAiAnalysis({ signal, confidence, reasoning, ...res });
    } catch (e) {
      setOtaAiAnalysisError(e?.message || 'Backend unavailable. OTA AI (OpenAI) runs on the server.');
    } finally {
      setOtaAiAnalysisLoading(false);
    }
  }, [userId, config, gasEstimateUsd, minProfitUsd, effectivePair, base, quote]);

  useEffect(() => {
    if (isConnected) fetchOtaAiAnalysis();
  }, [isConnected, fetchOtaAiAnalysis]);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.OTA_READY}`, { method: 'GET', credentials: 'include' });
        const data = res.ok ? await res.json().catch(() => ({})) : {};
        const cb = data?.checks?.circuitBreaker;
        if (!cancelled) setOpenAiConnected(cb !== 'OPEN');
      } catch {
        if (!cancelled) setOpenAiConnected(false);
      }
    };
    check();
    const t = setInterval(check, 60000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  const fetchBotBalance = useCallback(async (addr) => {
    if (!addr) return;
    setBotSeiBalanceLoading(true);
    try {
      // Încearcă RPC-urile în ordine — primul disponibil câștigă
      let fetched = false;
      for (const rpcUrl of SEI_RPC_LIST) {
        try {
          const client = await CosmWasmClient.connect(rpcUrl.replace(/\/$/, ''));
          const coin = await client.getBalance(addr, 'usei');
          const amount = coin ? (Number(coin.amount || 0) / 1e6).toFixed(4) : '0.0000';
          setBotSeiBalance(amount);
          fetched = true;
          break;
        } catch (_) { /* încearcă următorul */ }
      }
      if (!fetched) setBotSeiBalance(null);
    } finally {
      setBotSeiBalanceLoading(false);
    }
  }, []);

  const loadSeiAuto = useCallback(async () => {
    if (!userId) return;
    setSeiAutoLoading(true);
    try {
      const [statusRes, botRes] = await Promise.all([getSeiAutoStatus(userId), getSeiBotAddress()]);
      setSeiAutoStatus(statusRes);
      const addr = botRes?.botSeiAddress ?? null;
      setSeiBotAddress(addr);
      // botSeiBalance vine direct din același răspuns (backend fetch fără CORS)
      if (botRes?.botSeiBalance != null) {
        setBotSeiBalance(botRes.botSeiBalance);
      } else if (addr) {
        fetchBotBalance(addr);
      }
      if (statusRes?.stopIfCannotEstimate !== undefined) setStopIfCannotEstimate(!!statusRes.stopIfCannotEstimate);
      if (statusRes?.maxRounds !== undefined) setMaxRounds(statusRes.maxRounds == null ? '' : String(statusRes.maxRounds));
    } catch {
      setSeiAutoStatus(null);
      setSeiBotAddress(null);
    } finally {
      setSeiAutoLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadSeiAuto();
  }, [loadSeiAuto]);

  useEffect(() => {
    if (seiAutoStatus?.enabled) setSeiAutoOpen(true);
  }, [seiAutoStatus?.enabled]);

  const handleSeiAutoToggle = useCallback(async () => {
    if (!userId) return;
    setSeiAutoSaving(true);
    try {
      const next = !(seiAutoStatus?.enabled ?? false);
      await setSeiAuto(userId, { enabled: next });
      setSeiAutoStatus((s) => (s ? { ...s, enabled: next } : { enabled: next, minProfitOverGasPercent: 100, maxAmountPerTrade: '10', preferredPair: SEI_AUTO_DEFAULT_PAIR, workerActive: false, lastRunAt: null, executions24h: 0 }));
    } finally {
      setSeiAutoSaving(false);
    }
  }, [userId, seiAutoStatus?.enabled]);

  const handleSeiAutoSaveParams = useCallback(async () => {
    if (!userId || !seiAutoStatus) return;
    setSeiAutoSaving(true);
    try {
      const maxRoundsNum = maxRounds.trim() === '' ? null : parseInt(maxRounds, 10);
      await setSeiAuto(userId, {
        enabled: seiAutoStatus.enabled,
        minProfitOverGasPercent: seiAutoStatus.minProfitOverGasPercent,
        maxAmountPerTrade: seiAutoStatus.maxAmountPerTrade,
        preferredPair: seiAutoStatus.preferredPair || SEI_AUTO_DEFAULT_PAIR,
        stopIfCannotEstimate: stopIfCannotEstimate,
        maxRounds: Number.isFinite(maxRoundsNum) ? maxRoundsNum : null,
      });
      await loadSeiAuto();
    } finally {
      setSeiAutoSaving(false);
    }
  }, [userId, seiAutoStatus, loadSeiAuto, stopIfCannotEstimate, maxRounds]);

  const handleResetRounds = useCallback(async () => {
    if (!userId) return;
    setSeiAutoSaving(true);
    try {
      await setSeiAuto(userId, { resetRounds: true });
      await loadSeiAuto();
    } finally {
      setSeiAutoSaving(false);
    }
  }, [userId, loadSeiAuto]);

  const loadSeiHistory = useCallback(async () => {
    if (!userId) return;
    setSeiHistoryError(null);
    setSeiHistoryLoading(true);
    try {
      const res = await getTrades(userId, { chain: 'sei', limit: 20 });
      const trades = Array.isArray(res?.trades) ? res.trades : Array.isArray(res?.data?.trades) ? res.data.trades : [];
      setSeiHistory(trades);
    } catch (e) {
      setSeiHistoryError(e?.message || 'Failed to load SEI executions');
      setSeiHistory([]);
    } finally {
      setSeiHistoryLoading(false);
    }
  }, [userId]);

  const recentActivity = useMemo(() => (Array.isArray(seiHistory) ? seiHistory.slice(0, 3) : []), [seiHistory]);

  useEffect(() => {
    if (seiHistoryOpen && userId) loadSeiHistory();
  }, [seiHistoryOpen, userId, loadSeiHistory]);

  useEffect(() => {
    if (userId) loadSeiHistory();
  }, [userId, loadSeiHistory]);

  const handlePercentChange = useCallback((pct) => {
    setMinProfitOverGasPercent(pct);
    localStorage.setItem(STORAGE_KEY_PERCENT, String(pct));
  }, [setMinProfitOverGasPercent]);

  const strategyEnabled = userId
    ? (seiAutoStatus != null ? seiAutoStatus.enabled : false)
    : (config?.enabled ?? false);
  const strategyLoading = Boolean(userId && seiAutoStatus == null && seiAutoLoading);
  const seiAutoBackendReadinessHint = useMemo(
    () => seiAutoReadinessHint(seiAutoStatus?.readiness),
    [seiAutoStatus]
  );
  const handleToggleEnabled = useCallback(async () => {
    const next = !strategyEnabled;
    if (userId) {
      setSeiAutoSaving(true);
      try {
        await setSeiAuto(userId, { enabled: next });
        setSeiAutoStatus((s) => (s ? { ...s, enabled: next } : { enabled: next, minProfitOverGasPercent: 100, maxAmountPerTrade: '10', preferredPair: SEI_AUTO_DEFAULT_PAIR, workerActive: false, lastRunAt: null, executions24h: 0 }));
        await loadSeiAuto();
      } finally {
        setSeiAutoSaving(false);
      }
    } else {
      setLocalEnabled(next);
      refreshConfig();
    }
  }, [userId, strategyEnabled, loadSeiAuto]);

  const settingsValidation = useMemo(() => {
    const maxAmount = parseFloat(String(seiAutoStatus?.maxAmountPerTrade ?? '0'));
    const pct = seiAutoStatus?.minProfitOverGasPercent ?? minProfitOverGasPercent ?? 0;
    const maxR = maxRounds.trim() === '' ? null : Number(maxRounds);
    return {
      hasUser: Boolean(userId),
      hasWallet: Boolean(isConnected),
      hasStatus: seiAutoStatus != null,
      hasValidMaxAmount: Number.isFinite(maxAmount) && maxAmount > 0,
      hasMinProfitPct: Number.isFinite(pct) && pct >= 0,
      maxRoundsValid: maxR === null || (Number.isFinite(maxR) && maxR >= 0),
    };
  }, [userId, isConnected, seiAutoStatus, minProfitOverGasPercent, maxRounds]);

  const seiServerManualOnly = seiAutoStatus?.mode === 'manual_only';
  const canLaunchSession = useMemo(() => {
    const v = settingsValidation;
    return (
      v.hasUser
      && v.hasWallet
      && v.hasStatus
      && v.hasValidMaxAmount
      && v.hasMinProfitPct
      && v.maxRoundsValid
      && !seiAutoStatus?.enabled
      && !seiServerManualOnly
    );
  }, [settingsValidation, seiAutoStatus?.enabled, seiServerManualOnly]);

  const handleOpenLaunchModal = useCallback(() => {
    setSeiAutoLaunchModalOpen(true);
  }, []);

  const handleLaunchSessionConfirm = useCallback(async () => {
    if (!userId || !canLaunchSession) return;
    const pct = seiAutoStatus?.minProfitOverGasPercent ?? minProfitOverGasPercent ?? 100;
    const maxAmount = String(seiAutoStatus?.maxAmountPerTrade ?? '10');
    const maxR = maxRounds.trim() === '' ? null : Number(maxRounds);
    setSeiAutoSaving(true);
    try {
      const pair = seiAutoStatus?.preferredPair || SEI_AUTO_DEFAULT_PAIR;
      await setSeiAuto(userId, {
        enabled: true,
        minProfitOverGasPercent: pct,
        maxAmountPerTrade: maxAmount,
        preferredPair: pair,
        stopIfCannotEstimate,
        maxRounds: maxR,
      });
      setSeiAutoStatus((s) => (s ? { ...s, enabled: true, minProfitOverGasPercent: pct, maxAmountPerTrade: maxAmount, preferredPair: pair, stopIfCannotEstimate, maxRounds: maxR } : { enabled: true, minProfitOverGasPercent: pct, maxAmountPerTrade: maxAmount, preferredPair: pair, stopIfCannotEstimate, maxRounds: maxR, workerActive: false, lastRunAt: null, executions24h: 0 }));
      setSeiAutoLaunchModalOpen(false);
      await loadSeiAuto();
    } finally {
      setSeiAutoSaving(false);
    }
  }, [userId, canLaunchSession, seiAutoStatus, minProfitOverGasPercent, maxRounds, stopIfCannotEstimate, loadSeiAuto]);

  const verifyContract = useCallback(async () => {
    setVerifying(true);
    setVerifyError(null);
    if (!SEI_CONTRACTS.SWAP_EXECUTOR) {
      setContractStatus('error');
      setContractConfig(null);
      setWhitelisted(null);
      setVerifyError('REACT_APP_SEI_SWAP_EXECUTOR_ADDRESS not set');
      setVerifying(false);
      return;
    }
    try {
      const configRes = await queryContract(SEI_CONTRACTS.SWAP_EXECUTOR, { config: {} });
      setContractStatus('ok');
      setVerifyError(null);
      const cfg = parseConfig(configRes);
      setContractConfig(cfg);
      setWhitelisted(null);
      if (address && cfg?.ota_only_mode) {
        try {
          const w = await queryContract(SEI_CONTRACTS.SWAP_EXECUTOR, { is_whitelisted: { address } });
          const data = w?.data ?? w;
          setWhitelisted(!!data?.is_whitelisted);
        } catch {
          setWhitelisted(false);
        }
      }
    } catch (e) {
      setContractStatus('error');
      setVerifyError(e?.message || String(e) || 'Network or contract error');
    } finally {
      setVerifying(false);
      setVerifyModalOpen(true); // always open popup after Verify (success or error)
    }
  }, [address]);

  useEffect(() => {
    if (SEI_CONTRACTS.SWAP_EXECUTOR) verifyContract();
  }, [verifyContract]);

  useEffect(() => {
    if (!roundTripModalOpen && !signalModalOpen && !verifyModalOpen && !seiAutoLaunchModalOpen) return;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      if (seiAutoLaunchModalOpen) setSeiAutoLaunchModalOpen(false);
      else if (roundTripModalOpen) setRoundTripModalOpen(false);
      else if (signalModalOpen) setSignalModalOpen(false);
      else if (verifyModalOpen) setVerifyModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [roundTripModalOpen, signalModalOpen, verifyModalOpen, seiAutoLaunchModalOpen]);

  const handleCheckSignal = useCallback(() => {
    setSignalModalOpen(true);
    // Nu mai pasăm date hardcodate — shouldTriggerRoundTrip va fetch date reale
    checkSignal({});
  }, [checkSignal]);

  const handleOpenPosition = useCallback(async () => {
    setSignerError(null);
    setOpenPositionError(null);
    if (!address) return;
    const amtUsdc = toMinimalUnits(amountUsdc || '1', quote);
    if (amtUsdc === '0') {
      setOpenPositionError('Enter a valid USDC amount (e.g. 1).');
      return;
    }
    const signer = await getOfflineSigner();
    if (!signer) {
      setOpenPositionError('No signer. Reconnect SEI wallet (Keplr/Compass) and try again.');
      return;
    }
    setOpenPositionLoading(true);
    try {
      const result = await executeRoundTrip({
        userAddress: address,
        tokenIn: symbolToDenom(quote),
        tokenOut: symbolToDenom(base),
        amountIn: amtUsdc,
        signer,
        userId: userId ?? address ?? undefined,
      });
      if (!result?.success) {
        setOpenPositionError(result?.error || 'Swap failed');
        return;
      }
      let amountOutSei = undefined;
      try {
        const q = await getOTAQuote(quote, base, amountUsdc || '1', { chain: 'sei' });
        const quotePayload = unwrapOtaQuotePayload(q);
        if (quotePayload?.amountOut != null) amountOutSei = String(quotePayload.amountOut);
        else if (quotePayload?.minOut != null) amountOutSei = String(quotePayload.minOut);
      } catch (_) {}
      await openSeiPosition({
        userId: userId ?? address,
        base,
        quote,
        tokenIn: symbolToDenom(quote),
        tokenOut: symbolToDenom(base),
        amountIn: amtUsdc,
        amountOut: amountOutSei,
        entryPrice: livePrice ?? undefined,
        txHash: result.txHash,
      });
      setOpenPositionError(null);
      setAmountUsdc('1');
      window.dispatchEvent(new CustomEvent('ota-sei-open-orders-refresh'));
    } catch (e) {
      setOpenPositionError(e?.message || 'Failed to open position');
    } finally {
      setOpenPositionLoading(false);
    }
  }, [address, amountUsdc, base, quote, getOfflineSigner, userId, livePrice]);

  const handleRunRoundTrip = useCallback(async () => {
    setSignerError(null);
    setRoundTripResult(null);
    setOtaAiMessage(null);
    if (!address) return;
    const amt = toMinimalUnits(amountSei || '1', base);
    if (amt === '0') {
      setSignerError('Enter a valid amount (e.g. 1).');
      return;
    }
    const signer = await getOfflineSigner();
    if (!signer) {
      setSignerError('No signer. Reconnect SEI wallet (Keplr/Compass) and try again.');
      return;
    }
    const result = await runRoundTrip({
      userAddress: address,
      tokenIn: symbolToDenom(base),
      tokenOut: symbolToDenom(quote),
      amountIn: amt,
      signer,
      userId: userId ?? address ?? undefined,
    });
    if (result?.success) {
      setSignerError(null);
      setSeiHistoryOpen(true);
      loadSeiHistory();
      // Record outcome so it appears in GET execution/trades?chain=sei (fire-and-forget; 404/501 = no-op)
      const uid = userId ?? address ?? null;
      if (uid && result?.txHash) {
        recordManualOutcome(
          buildSeiRoundTripManualOutcomePayload({
            userId: uid,
            effectivePair,
            base,
            quote,
            amountSei,
            txHash: result.txHash,
          })
        ).catch(() => {});
      }
      setTimeout(() => loadSeiHistory(), 2000);
    }
    setRoundTripResult(result ?? { success: false, error: 'Unknown error' });
    setRoundTripModalOpen(true);
    setOtaAiLoading(true);
    try {
      const ack = await requestOtaAiSeiRoundTripAck({
        txHash: result?.txHash,
        amountSei: amountSei || '1',
      });
      setOtaAiMessage(ack?.message ?? null);
    } catch {
      setOtaAiMessage('OTA AI: Round-trip on SEI recorded. Backend unavailable for AI reply.');
    } finally {
      setOtaAiLoading(false);
    }
  }, [address, amountSei, base, quote, effectivePair, getOfflineSigner, runRoundTrip, userId, loadSeiHistory]);

  const blockExplorer = seiNetwork?.blockExplorer || 'https://www.sei.explorers.guru';
  const txUrl = (hash) => (hash ? (blockExplorer.endsWith('/') ? `${blockExplorer}transaction/${hash}` : `${blockExplorer}/transaction/${hash}`) : null);

  const { accumulatedProfitUsd, roundsCount, timeSpanText } = useMemo(() => {
    if (!Array.isArray(seiHistory) || seiHistory.length === 0) {
      return { accumulatedProfitUsd: null, roundsCount: 0, timeSpanText: '—' };
    }
    let sum = 0;
    let hasValidProfit = false;
    for (const t of seiHistory) {
      const profitUsd = t.profitUsd != null && Number.isFinite(Number(t.profitUsd)) ? Number(t.profitUsd) : null;
      // Only use explicit profit_usd from DB — NEVER calculate from amountOut-amountIn
      // (amountIn/amountOut use different token units for cross-asset trades, subtraction is meaningless)
      if (profitUsd != null && Math.abs(profitUsd) < 1000) {
        sum += profitUsd;
        hasValidProfit = true;
      }
    }
    const first = seiHistory[seiHistory.length - 1];
    const last = seiHistory[0];
    const tsFirst = first?.timestamp ?? first?.createdAt ?? first?.executedAt;
    const tsLast = last?.timestamp ?? last?.createdAt ?? last?.executedAt;
    let timeSpanText = '—';
    if (tsFirst && tsLast) {
      const a = new Date(tsFirst).getTime();
      const b = new Date(tsLast).getTime();
      const diffMs = Math.abs(b - a);
      if (diffMs < 60000) timeSpanText = '< 1 min';
      else if (diffMs < 3600000) timeSpanText = `${Math.round(diffMs / 60000)} min`;
      else if (diffMs < 86400000) timeSpanText = `${(diffMs / 3600000).toFixed(1)} h`;
      else timeSpanText = `${(diffMs / 86400000).toFixed(1)} days`;
    }
    return { accumulatedProfitUsd: hasValidProfit ? sum : null, roundsCount: seiHistory.length, timeSpanText };
  }, [seiHistory]);

  const handleExportReport = useCallback(() => {
    if (!Array.isArray(seiHistory) || seiHistory.length === 0) return;
    const rows = seiHistory.map((t) => {
      const ts = t.timestamp ?? t.createdAt ?? t.executedAt;
      const dateStr = ts ? new Date(ts).toISOString() : '';
      const amountIn = t.amountIn != null ? Number(t.amountIn) : null;
      const amountOut = t.amountOut != null ? Number(t.amountOut) : null;
      const profitUsd = t.profitUsd != null && Number.isFinite(Number(t.profitUsd)) ? Number(t.profitUsd) : null;
      const estProfit = profitUsd != null ? profitUsd : (amountIn != null && amountOut != null && Number.isFinite(amountIn) && Number.isFinite(amountOut) ? amountOut - amountIn : null);
      const pair = displaySeiTradePair(t) ?? '';
      return { date: dateStr, pair, amountIn, amountOut, estProfit, status: t.status ?? '', txHash: t.txHash ?? '' };
    });
    const summary = { rounds: roundsCount, accumulatedProfitUsd, timeSpanText, exportedAt: new Date().toISOString() };
    const csvHeader = 'Date,Pair,Amount In,Amount Out,Est. Profit,Status,Tx Hash\n';
    const csvBody = rows.map((r) => `${r.date},${String(r.pair).replace(/,/g, ' ')},${r.amountIn ?? ''},${r.amountOut ?? ''},${r.estProfit ?? ''},${String(r.status).replace(/,/g, ' ')},${r.txHash}`).join('\n');
    const csv = csvHeader + csvBody + '\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ota-sei-activity-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [seiHistory, roundsCount, accumulatedProfitUsd, timeSpanText]);

  if (!isConnected) {
    return (
      <section className="ota-sei-micro-profit" aria-labelledby="ota-sei-micro-profit-heading">
        <h2 id="ota-sei-micro-profit-heading" className="ota-sei-micro-profit__heading ota-sei-micro-profit__heading--compact">
          OTA Micro-Profit SEI
        </h2>
        <p className="ota-sei-micro-profit__subtitle ota-sei-micro-profit__subtitle--alone">
          Connect your SEI wallet to enable the micro-profit (dump & pump) strategy.
        </p>
        <div className="ota-sei-micro-profit__live-price" role="status" aria-live="polite">
          <span className="ota-sei-micro-profit__live-price-label">{effectivePair}</span>
          {livePriceError ? (
            <span className="ota-sei-micro-profit__live-price-err">{livePriceError}</span>
          ) : livePrice != null ? (
            <>
              <span className="ota-sei-micro-profit__live-price-value">${Number(livePrice).toFixed(4)}</span>
              <span className="ota-sei-micro-profit__live-price-dot" aria-hidden />
            </>
          ) : (
            <span className="ota-sei-micro-profit__live-price-loading">…</span>
          )}
        </div>
        <SeiQuoteHealthBadge
          hasExecutionQuote={hasExecutionQuote}
          usedFallbackPrice={usedFallbackPrice}
          lastExecutionQuoteAt={lastExecutionQuoteAt}
        />
        <div className="ota-sei-micro-profit__recent-activity" aria-label="Recent SEI activity">
          <span className="ota-sei-micro-profit__recent-activity-title">Recent activity</span>
          <p className="ota-sei-micro-profit__signal-status">Connect SEI wallet and sign in to see executions.</p>
        </div>
      </section>
    );
  }

  if (splitLayout) {
    return (
      <>
        <section className="ota-sei-window ota-sei-micro-profit ota-sei-micro-profit-settings" aria-label="OTA Micro-Profit SEI – Settings">
          <div className="ota-sei-micro-profit__row ota-sei-micro-profit__row--pair" role="group" aria-label="Trading pair">
            <span className="ota-sei-micro-profit__label">Pair</span>
            <TokenSelectorSei variant="pair" customList={SEI_AUTO_PAIRS} value={effectivePair} onChange={setEffectivePair} label="Select trading pair" />
          </div>
          <div className="ota-sei-micro-profit__row">
            <span className="ota-sei-micro-profit__label">OTA AI auto-trade:</span>
            {userId && seiServerManualOnly ? (
              <>
                <span className="ota-sei-micro-profit__badge ota-sei-micro-profit__badge--stopped" role="status">Manual only</span>
                <span className="ota-sei-micro-profit__label-inline">(server auto off)</span>
              </>
            ) : (
              <>
                <button type="button" onClick={handleToggleEnabled} disabled={loading || strategyLoading || (!!userId && seiAutoSaving)} className={`ota-sei-micro-profit__btn-toggle${strategyEnabled ? ' is-enabled' : ''}`} title={userId ? (strategyEnabled ? 'Session is on – OTA AI runs auto round-trips' : 'Session is off – click to turn on (or use Execute session below)') : 'Toggle strategy (local)'}>
                  {strategyLoading ? 'Loading…' : strategyEnabled ? 'On' : 'Off'}
                </button>
                <span className="ota-sei-micro-profit__label-inline">{userId ? '(saved on server)' : '(saved locally)'}</span>
              </>
            )}
          </div>
          {seiServerManualOnly && userId ? (
            <div className="ota-sei-micro-profit__execute-cta" role="region" aria-label="Auto-trade unavailable">
              <p className="ota-sei-micro-profit__hint" style={{ margin: 0 }}>
                <strong>Auto-trade unavailable</strong> on SEI (manual-only). Use <strong>Run round-trip</strong> or <strong>Open position</strong> below — on-demand only.
              </p>
            </div>
          ) : seiAutoStatus?.enabled ? (
            <div className="ota-sei-micro-profit__session-active-cta" role="region" aria-label="Session active">
              <span className="ota-sei-micro-profit__execute-cta-label">Session is active.</span>
              <span className="ota-sei-micro-profit__hint">Settings and &quot;Stop session&quot;: open <strong>SEI Auto</strong> below. To run a manual round-trip: use <strong>Run round-trip</strong> below.</span>
            </div>
          ) : (
            <div className="ota-sei-micro-profit__execute-cta" role="region" aria-label="Execute auto-trade session">
              <span className="ota-sei-micro-profit__execute-cta-label">Start auto-trade session:</span>
              <button type="button" onClick={handleOpenLaunchModal} disabled={seiAutoSaving || !canLaunchSession} className="ota-sei-micro-profit__btn-primary ota-sei-micro-profit__btn--execute-cta" title={!canLaunchSession ? 'Complete settings in SEI Auto below' : 'Opens confirmation before execution'}>
                Execute session
              </button>
              {!canLaunchSession && <span className="ota-sei-micro-profit__hint">Complete all settings (sign in, SEI wallet, min profit %, max SEI per trade) in &quot;SEI Auto&quot; below to enable launch.</span>}
            </div>
          )}
          <div className="ota-sei-micro-profit__manual-round-trip" role="region" aria-label="Manual round-trip">
            <div className="ota-sei-micro-profit__row ota-sei-micro-profit__row--manual">
              <span className="ota-sei-micro-profit__label">Manual round-trip</span>
            </div>
            <div className="ota-sei-micro-profit__input-group">
              <label className="ota-sei-micro-profit__input-label">{base} amount (round-trip):</label>
              <input type="text" inputMode="decimal" value={amountSei} onChange={(e) => setAmountSei(e.target.value)} placeholder="1" className="ota-sei-micro-profit__input" />
            </div>
            <SeiQuoteHealthBadge
              hasExecutionQuote={hasExecutionQuote}
              usedFallbackPrice={usedFallbackPrice}
              lastExecutionQuoteAt={lastExecutionQuoteAt}
            />
            <SeiAuxiliarySignalStatus
              showPoolChips
              onRecheckPools={checkPoolHealth}
              priceDiscrepancy={priceDiscrepancy}
              priceDiscrepancyLoading={priceDiscrepancyLoading}
              poolHealth={poolHealth}
              poolHealthLoading={poolHealthLoading}
            />
            <SeiAuxiliaryVsPairCallout effectivePair={effectivePair} base={base} quote={quote} />

            <div className="ota-sei-micro-profit__actions">
              <button type="button" onClick={handleCheckSignal} disabled={loading} className="ota-sei-micro-profit__btn-signal" aria-busy={loading}>
                {loading && signalModalOpen ? 'Checking…' : 'Check signal'}
              </button>
              <button
                type="button"
                onClick={handleRunRoundTrip}
                disabled={loading || (poolHealth !== null && !poolHealth.ok)}
                className="ota-sei-micro-profit__btn-round-trip"
                aria-label="Run round-trip swap test on SEI"
                aria-busy={loading}
                title={poolHealth && !poolHealth.ok ? poolHealth.reason : undefined}
              >
                {loading ? 'Running…' : 'Run round-trip (test)'}
              </button>
            </div>
          </div>
          <div className="ota-sei-micro-profit__open-position" role="region" aria-label="Open position">
            <div className="ota-sei-micro-profit__row ota-sei-micro-profit__row--manual">
              <span className="ota-sei-micro-profit__label">Open position</span>
            </div>
            <p className="ota-sei-micro-profit__hint">Buy {base} with {quote}. Position appears in Open Orders. When Est. profit turns green, the row is highlighted – click Close to lock in. OTA AI cannot auto-close (requires your wallet signature).</p>
            {!SEI_AUTO_PAIR_IDS.includes(effectivePair) && (
              <p className="ota-sei-micro-profit__hint ota-sei-micro-profit__hint--muted" role="status">Open position works with SEI/USDC or SEI/USDT. Select a SEI pair above.</p>
            )}
            <div className="ota-sei-micro-profit__input-group">
              <label className="ota-sei-micro-profit__input-label">{quote} amount:</label>
              <input type="text" inputMode="decimal" value={amountUsdc} onChange={(e) => setAmountUsdc(e.target.value)} placeholder="1" className="ota-sei-micro-profit__input" disabled={!SEI_AUTO_PAIR_IDS.includes(effectivePair)} aria-disabled={!SEI_AUTO_PAIR_IDS.includes(effectivePair)} />
            </div>
            {openPositionError && <p className="ota-sei-micro-profit__signal-status ota-sei-micro-profit__signal-status--error" role="alert">{openPositionError}</p>}
            <button type="button" onClick={handleOpenPosition} disabled={openPositionLoading || loading || !SEI_AUTO_PAIR_IDS.includes(effectivePair)} className="ota-sei-micro-profit__btn-round-trip ota-sei-micro-profit__btn-open-position" aria-busy={openPositionLoading} title={!SEI_AUTO_PAIR_IDS.includes(effectivePair) ? 'Select SEI/USDC or SEI/USDT' : undefined}>
              {openPositionLoading ? 'Opening…' : `Open position (buy ${base})`}
            </button>
          </div>
          <div className="ota-sei-micro-profit__sei-auto">
            <button type="button" className="ota-sei-micro-profit__sei-auto-head" onClick={() => setSeiAutoOpen((o) => !o)} aria-expanded={seiAutoOpen}>
              {seiAutoOpen ? <ChevronUp size={18} aria-hidden /> : <ChevronDown size={18} aria-hidden />}
              <span>SEI Auto</span>
              <span className="ota-sei-micro-profit__label-inline">
                {seiServerManualOnly ? '(manual-only — server auto off)' : '(bot runs round-trips for you)'}
              </span>
            </button>
            {seiAutoOpen && (
              <div className="ota-sei-micro-profit__sei-auto-body">
                {seiAutoLoading && !seiAutoStatus ? (
                  <p className="ota-sei-micro-profit__signal-status">Loading…</p>
                ) : (
                  <>
                    {seiServerManualOnly && (
                      <p className="ota-sei-micro-profit__signal-status" role="status">
                        <strong>Manual only.</strong> Server-side SEI auto is turned off. Use on-demand quotes and <strong>Run round-trip</strong> / open position manually.
                      </p>
                    )}
                    <div className="ota-sei-micro-profit__row ota-sei-micro-profit__row--launch">
                      {seiAutoStatus?.enabled ? (
                        <>
                          <span className="ota-sei-micro-profit__label">Session:</span>
                          <span className="ota-sei-micro-profit__badge ota-sei-micro-profit__badge--active" role="status">Active</span>
                          <button type="button" onClick={handleSeiAutoToggle} disabled={seiAutoSaving} className="ota-sei-micro-profit__btn-outline ota-sei-micro-profit__btn--stop">
                            Stop session
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="ota-sei-micro-profit__label">Launch session:</span>
                          <button type="button" onClick={handleOpenLaunchModal} disabled={!canLaunchSession || seiAutoSaving} className="ota-sei-micro-profit__btn-primary ota-sei-micro-profit__btn--launch" title={!canLaunchSession ? (seiServerManualOnly ? 'SEI auto unavailable (manual-only on server)' : 'Complete all settings (account, SEI wallet, profit %, max SEI per trade)') : ''}>
                            Launch OTA AI session
                          </button>
                          {!canLaunchSession && (
                            <span className="ota-sei-micro-profit__hint">
                              {seiServerManualOnly ? 'Auto launch disabled — server is manual-only for SEI.' : 'Complete all settings to enable launch.'}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    {seiBotAddress && (
                      <div className="ota-sei-micro-profit__sei-auto-deposit">
                        <div className="ota-sei-micro-profit__deposit-header">
                          <span className="ota-sei-micro-profit__label">Fund Bot Wallet</span>
                          <button
                            type="button"
                            className="ota-sei-micro-profit__btn-ghost"
                            onClick={() => setDepositGuideOpen((v) => !v)}
                            aria-expanded={depositGuideOpen}
                          >
                            {depositGuideOpen ? 'Hide guide' : 'How to transfer SEI?'}
                          </button>
                        </div>

                        {/* Bot address + balance */}
                        <div className="ota-sei-micro-profit__bot-addr-row">
                          <code className="ota-sei-micro-profit__modal-monospace ota-sei-micro-profit__bot-addr-code" title={seiBotAddress}>
                            {seiBotAddress}
                          </code>
                          <button
                            type="button"
                            className="ota-sei-micro-profit__btn-copy"
                            title="Copy bot address"
                            onClick={() => {
                              navigator.clipboard.writeText(seiBotAddress).then(() => {
                                setBotAddrCopied(true);
                                setTimeout(() => setBotAddrCopied(false), 2000);
                              }).catch(() => {});
                            }}
                          >
                            {botAddrCopied ? <Check size={14} /> : <Copy size={14} />}
                            {botAddrCopied ? 'Copied!' : 'Copy'}
                          </button>
                          <button
                            type="button"
                            className="ota-sei-micro-profit__btn-ghost"
                            title="Refresh bot balance"
                            onClick={() => fetchBotBalance(seiBotAddress)}
                            disabled={botSeiBalanceLoading}
                          >
                            ↻
                          </button>
                        </div>
                        <div className="ota-sei-micro-profit__bot-balance-row">
                          <span className="ota-sei-micro-profit__label-inline">Bot balance (Mainnet):</span>
                          {botSeiBalanceLoading
                            ? <span className="ota-sei-micro-profit__label-inline">Loading…</span>
                            : <strong className="ota-sei-micro-profit__bot-balance-val">
                                {botSeiBalance !== null ? `${botSeiBalance} SEI` : '—'}
                              </strong>
                          }
                        </div>

                        {/* Expandable step-by-step guide */}
                        {depositGuideOpen && (
                          <div className="ota-sei-micro-profit__deposit-guide">
                            <p className="ota-sei-micro-profit__deposit-guide-title">Step-by-step: How to fund the bot</p>
                            <ol className="ota-sei-micro-profit__deposit-steps">
                              <li>
                                <strong>Buy SEI on an exchange</strong>
                                <span> — Binance, Coinbase, Kraken, OKX, KuCoin or Bybit. Search for "SEI". Withdraw as SEI native (not ERC-20).</span>
                              </li>
                              <li>
                                <strong>With Ledger</strong>
                                <span> — Install the "Cosmos" or "SEI" app on Ledger. Connect via <a href="https://wallet.keplr.app" target="_blank" rel="noopener noreferrer" className="ota-sei-micro-profit__link">Keplr wallet</a> (Ledger as hardware signer). In Keplr → SEI chain → Send → paste the bot address above.</span>
                              </li>
                              <li>
                                <strong>From Keplr / Compass / Fin wallet</strong>
                                <span> — Open wallet → SEI → Send → paste the bot address → confirm amount → submit.</span>
                              </li>
                              <li>
                                <strong>Recommended amount</strong>
                                <span> — Start with <strong>10–50 SEI</strong> for testing. Bot uses your "Max SEI per trade" setting per round-trip.</span>
                              </li>
                              <li>
                                <strong>Verify deposit</strong>
                                <span> — Check the bot address on <a href={`https://www.seiscan.app/pacific-1/accounts/${seiBotAddress}`} target="_blank" rel="noopener noreferrer" className="ota-sei-micro-profit__link">SeiScan</a>. After confirmation, enable SEI Auto above.</span>
                              </li>
                            </ol>
                            <p className="ota-sei-micro-profit__sei-auto-custodial-warning" role="alert">
                              Custodial risk: funds sent to the bot address are held by the bot wallet. Only send amounts you are willing to risk. Start small.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    {seiAutoStatus && (
                      <>
                        <div className="ota-sei-micro-profit__sei-auto-status">
                          <span className="ota-sei-micro-profit__label-inline">Worker:</span>
                          <span>{seiAutoStatus.workerActive ? 'Active' : 'Inactive'}</span>
                          {seiAutoStatus.lastRunAt && <span>Last run: {new Date(seiAutoStatus.lastRunAt).toLocaleString()}</span>}
                          <span>Executions (24h): {seiAutoStatus.executions24h ?? 0}</span>
                        </div>
                        {seiAutoBackendReadinessHint ? (
                          <p className="ota-sei-micro-profit__hint ota-sei-micro-profit__sei-auto-readiness-hint">{seiAutoBackendReadinessHint}</p>
                        ) : null}
                        <div className="ota-sei-micro-profit__percent-row">
                          <span className="ota-sei-micro-profit__label-inline">Min profit % over gas:</span>
                          {[50, 100, 150, 200].map((pct) => (
                            <button key={pct} type="button" onClick={() => setSeiAutoStatus((s) => s ? { ...s, minProfitOverGasPercent: pct } : null)} className={`ota-sei-micro-profit__btn-pct${seiAutoStatus?.minProfitOverGasPercent === pct ? ' is-selected' : ''}`}>
                              {pct}%
                            </button>
                          ))}
                        </div>
                        <div className="ota-sei-micro-profit__input-group">
                          <label className="ota-sei-micro-profit__input-label">Max SEI per trade (Auto)</label>
                          <input type="text" inputMode="decimal" value={seiAutoStatus?.maxAmountPerTrade ?? '10'} onChange={(e) => setSeiAutoStatus((s) => s ? { ...s, maxAmountPerTrade: e.target.value } : null)} className="ota-sei-micro-profit__input" />
                        </div>
                        <div className="ota-sei-micro-profit__input-group">
                          <label className="ota-sei-micro-profit__input-label">Preferred pair (Auto)</label>
                          <select
                            value={seiAutoStatus?.preferredPair ?? SEI_AUTO_DEFAULT_PAIR}
                            onChange={(e) => setSeiAutoStatus((s) => s ? { ...s, preferredPair: e.target.value } : null)}
                            className="ota-sei-micro-profit__input ota-sei-micro-profit__select"
                            aria-label="Preferred pair for Auto"
                          >
                            {SEI_AUTO_PAIRS.map((p) => (
                              <option key={p.id} value={p.id}>{p.label}</option>
                            ))}
                          </select>
                        </div>
                        <button type="button" onClick={handleSeiAutoSaveParams} disabled={seiAutoSaving} className="ota-sei-micro-profit__btn-outline">
                          {seiAutoSaving ? 'Saving…' : 'Save Auto params'}
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          <div className="ota-sei-micro-profit__gas-row">
            <div className="ota-sei-micro-profit__gas-value">
              <span className="ota-sei-micro-profit__label-inline">Gas est. (round-trip): </span>
              {gasEstimateUsd != null ? `$${gasEstimateUsd.toFixed(6)}` : '—'}
            </div>
            <button type="button" onClick={refreshGasEstimate} disabled={loading} aria-label="Refresh gas estimate" className="ota-sei-micro-profit__btn-secondary">Refresh gas</button>
          </div>
          <div className="ota-sei-micro-profit__profit-block">
            <div className="ota-sei-micro-profit__profit-line">
              <span className="ota-sei-micro-profit__label">Min profit: </span>
              <strong>{typeof minProfitUsd === 'number' ? `$${minProfitUsd.toFixed(6)}` : '—'}</strong>
              {typeof minProfitOverGasPercent === 'number' && <span className="ota-sei-micro-profit__label">({minProfitOverGasPercent}% above gas)</span>}
              <span title="Min profit = gas cost × (1 + %/100). E.g. 100% = 2× gas." className="ota-sei-micro-profit__info-icon" aria-hidden><Info size={14} /></span>
            </div>
            <div className="ota-sei-micro-profit__percent-row">
              <span className="ota-sei-micro-profit__label-inline">% above gas:</span>
              {[50, 100, 150, 200].map((pct) => (
                <button key={pct} type="button" onClick={() => handlePercentChange(pct)} className={`ota-sei-micro-profit__btn-pct${minProfitOverGasPercent === pct ? ' is-selected' : ''}`}>{pct}%</button>
              ))}
            </div>
          </div>
          <div className="ota-sei-micro-profit__input-group ota-sei-micro-profit__input-group--row">
            <label className="ota-sei-micro-profit__checkbox-label" title="If OTA AI cannot reliably estimate profit vs gas, it will stop instead of executing.">
              <input
                type="checkbox"
                checked={stopIfCannotEstimate}
                onChange={(e) => setStopIfCannotEstimate(e.target.checked)}
              />
              <span>Stop when profit cannot be estimated</span>
              <Info size={12} className="ota-sei-micro-profit__input-hint-icon" aria-hidden />
            </label>
          </div>
          <div className="ota-sei-micro-profit__input-group">
            <label className="ota-sei-micro-profit__input-label" title="Maximum number of profit rounds to run (0 = no limit).">Max rounds (0 = unlimited):</label>
            <input
              type="number"
              min={0}
              value={maxRounds}
              onChange={(e) => setMaxRounds(e.target.value)}
              placeholder="0"
              className="ota-sei-micro-profit__input ota-sei-micro-profit__input--narrow"
              aria-label="Max profit rounds (0 = unlimited)"
            />
            {maxRounds.trim() !== '' && Number(maxRounds) > 0 && (
              <span className="ota-sei-micro-profit__input-hint">Reset rounds counter in the Activity block when cap is set.</span>
            )}
          </div>
        </section>
        <section className="ota-sei-window ota-sei-micro-profit ota-sei-micro-profit-display" aria-label="OTA Micro-Profit SEI – Display and verification">
      <div className="ota-sei-micro-profit__live-price" role="status" aria-live="polite">
        <span className="ota-sei-micro-profit__live-price-label">{effectivePair}</span>
        {livePriceError ? (
          <span className="ota-sei-micro-profit__live-price-err">{livePriceError}</span>
        ) : livePrice != null ? (
          <>
            <span className="ota-sei-micro-profit__live-price-value">${Number(livePrice).toFixed(4)}</span>
            <span className="ota-sei-micro-profit__live-price-dot" aria-hidden />
          </>
        ) : (
          <span className="ota-sei-micro-profit__live-price-loading">…</span>
        )}
      </div>
      <SeiQuoteHealthBadge
        hasExecutionQuote={hasExecutionQuote}
        usedFallbackPrice={usedFallbackPrice}
        lastExecutionQuoteAt={lastExecutionQuoteAt}
      />

      <div className="ota-sei-micro-profit__presence" role="status" aria-live="polite">
        <div className="ota-sei-micro-profit__presence-head">
          <OTALogo size={28} showBorder animated={openAiConnected === true} className="ota-sei-micro-profit__presence-logo" aria-hidden />
          <div className="ota-sei-micro-profit__presence-identity">
            <span className="ota-sei-micro-profit__presence-name">OTA AI</span>
            <span className="ota-sei-micro-profit__presence-model">
              {otaAiAnalysis?.model
                ? String(otaAiAnalysis.model).replace(/^gpt/i, (m) => m.toUpperCase())
                : 'OpenAI (set in API)'}
            </span>
          </div>
          <div className="ota-sei-micro-profit__presence-status">
            <span
              className={`ota-sei-micro-profit__presence-dot ota-sei-micro-profit__presence-dot--${otaAiAnalysis ? 'present' : otaAiAnalysisLoading ? 'connecting' : 'off'}`}
              aria-hidden
            />
            <span className="ota-sei-micro-profit__presence-status-text">
              {otaAiAnalysis ? 'Present' : otaAiAnalysisLoading ? 'Connecting…' : otaAiAnalysisError ? 'Unavailable' : 'Connecting…'}
            </span>
          </div>
        </div>
        <ul className="ota-sei-micro-profit__presence-caps" aria-label="OTA AI capabilities">
          <li><Sparkles size={12} aria-hidden /> Knows your SEI strategy</li>
          <li>
            <Sparkles size={12} aria-hidden />
            {userId && seiServerManualOnly
              ? ' Manual round-trip only (server auto off)'
              : ' Can execute round-trip'}
          </li>
          <li><Sparkles size={12} aria-hidden /> Learns from context</li>
        </ul>
      </div>

      {!splitLayout && (
        <div className="ota-sei-micro-profit__row">
          <span className="ota-sei-micro-profit__label">OTA AI auto-trade:</span>
          {userId && seiServerManualOnly ? (
            <>
              <span className="ota-sei-micro-profit__badge ota-sei-micro-profit__badge--stopped" role="status">Manual only</span>
              <span className="ota-sei-micro-profit__label-inline">(server auto off)</span>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleToggleEnabled}
                disabled={loading || strategyLoading || (!!userId && seiAutoSaving)}
                className={`ota-sei-micro-profit__btn-toggle${strategyEnabled ? ' is-enabled' : ''}`}
                title={userId ? (strategyEnabled ? 'Session is on – OTA AI runs auto round-trips' : 'Session is off') : 'Toggle strategy (local)'}
              >
                {strategyLoading ? 'Loading…' : strategyEnabled ? 'On' : 'Off'}
              </button>
              <span className="ota-sei-micro-profit__label-inline">{userId ? '(saved on server)' : '(saved locally)'}</span>
            </>
          )}
        </div>
      )}

      {seiServerManualOnly && userId ? (
        <div className="ota-sei-micro-profit__execute-cta" role="region" aria-label="Auto-trade unavailable">
          <p className="ota-sei-micro-profit__hint" style={{ margin: 0 }}>
            <strong>Auto-trade unavailable</strong> on SEI (manual-only). Use <strong>Run round-trip</strong> below.
          </p>
        </div>
      ) : seiAutoStatus?.enabled ? (
        <div className="ota-sei-micro-profit__session-active-cta" role="region" aria-label="Session active">
          <span className="ota-sei-micro-profit__execute-cta-label">Session is active.</span>
          <span className="ota-sei-micro-profit__hint">Settings and &quot;Stop session&quot;: open <strong>SEI Auto</strong> below. To run a manual round-trip: use <strong>Run round-trip</strong> below.</span>
        </div>
      ) : (
        <div className="ota-sei-micro-profit__execute-cta" role="region" aria-label="Execute auto-trade session">
          <span className="ota-sei-micro-profit__execute-cta-label">Start auto-trade session:</span>
          <button type="button" onClick={handleOpenLaunchModal} disabled={seiAutoSaving || !canLaunchSession} className="ota-sei-micro-profit__btn-primary ota-sei-micro-profit__btn--execute-cta" title={!canLaunchSession ? 'Complete settings in SEI Auto below' : 'Opens confirmation before execution'}>
            Execute session
          </button>
          {!canLaunchSession && <span className="ota-sei-micro-profit__hint">Complete all settings (sign in, SEI wallet, min profit %, max SEI per trade) in the &quot;SEI Auto&quot; section below to enable launch.</span>}
        </div>
      )}

      {userId && (
        <div className="ota-sei-micro-profit__recent-activity" aria-label="Recent SEI activity">
          <span className="ota-sei-micro-profit__recent-activity-title">Recent activity</span>
          {seiHistoryLoading && recentActivity.length === 0 ? (
            <p className="ota-sei-micro-profit__signal-status">Loading…</p>
          ) : recentActivity.length === 0 ? (
            <p className="ota-sei-micro-profit__signal-status">No SEI executions yet.</p>
          ) : (
            <ul className="ota-sei-micro-profit__recent-activity-list">
              {recentActivity.map((t) => {
                const ts = t.timestamp ?? t.createdAt ?? t.executedAt;
                const dateStr = ts ? new Date(ts).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '—';
                const hash = t.txHash ?? null;
                const url = txUrl(hash);
                return (
                  <li key={t.id ?? t._id ?? hash ?? dateStr} className="ota-sei-micro-profit__recent-activity-item">
                    <span className="ota-sei-micro-profit__recent-activity-time">{dateStr}</span>
                    <span className="ota-sei-micro-profit__recent-activity-pair">{base} → {quote}</span>
                    {hash && url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="ota-sei-micro-profit__result-link">
                        {hash.slice(0, 8)}… <ExternalLink size={10} aria-hidden />
                      </a>
                    ) : hash ? (
                      <span className="ota-sei-micro-profit__modal-monospace">{hash.slice(0, 8)}…</span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <div className="ota-sei-micro-profit__activity-profit" aria-label="OTA AI Activity & Profit">
        <div className="ota-sei-micro-profit__activity-profit-head">
          <span className="ota-sei-micro-profit__activity-profit-title">OTA AI Micro-Trade</span>
          <button type="button" onClick={() => { loadSeiHistory(); loadSeiAuto(); }} disabled={seiHistoryLoading || !userId} className="ota-sei-micro-profit__btn-secondary ota-sei-micro-profit__activity-profit-refresh" aria-label="Refresh activity and profit">
            {seiHistoryLoading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        <div className="ota-sei-micro-profit__activity-profit-status">
          <span
            className={`ota-sei-micro-profit__activity-profit-badge ota-sei-micro-profit__activity-profit-badge--${
              userId && seiServerManualOnly ? 'stopped' : seiAutoStatus?.workerActive ? 'action' : seiAutoStatus?.enabled ? 'waiting' : 'stopped'
            }`}
            aria-live="polite"
          >
            {userId && seiServerManualOnly ? 'Manual only' : seiAutoStatus?.workerActive ? 'In action' : seiAutoStatus?.enabled ? 'Waiting' : 'Stopped'}
          </span>
          {seiAutoStatus?.lastRunAt && (
            <span className="ota-sei-micro-profit__activity-profit-lastrun">
              Last run: {new Date(seiAutoStatus.lastRunAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
            </span>
          )}
        </div>
        {userId && seiServerManualOnly && (
          <p className="ota-sei-micro-profit__hint ota-sei-micro-profit__activity-profit-hint" role="status" style={{ marginTop: 6 }}>
            Server auto round-trips are off. History below includes past manual and any legacy auto runs.
          </p>
        )}
        <div className="ota-sei-micro-profit__activity-profit-kpis">
          <div className="ota-sei-micro-profit__activity-profit-kpi">
            <TrendingUp size={14} aria-hidden />
            <span className="ota-sei-micro-profit__activity-profit-label">Accumulated profit</span>
            <span className="ota-sei-micro-profit__activity-profit-value" style={{ color: accumulatedProfitUsd == null ? '#94a3b8' : accumulatedProfitUsd >= 0 ? '#4ade80' : '#f87171' }}>
              {accumulatedProfitUsd == null ? 'N/A' : `$${accumulatedProfitUsd.toFixed(4)}`}
            </span>
          </div>
          <div className="ota-sei-micro-profit__activity-profit-kpi">
            <span className="ota-sei-micro-profit__activity-profit-label">Rounds</span>
            <span className="ota-sei-micro-profit__activity-profit-value">{roundsCount}</span>
            {seiAutoStatus?.maxRounds != null && Number(seiAutoStatus.maxRounds) > 0 && (
              <>
                <span className="ota-sei-micro-profit__activity-profit-cap" title="Rounds toward cap (from Auto status)">
                  {' '}(cap: {seiAutoStatus?.roundsDone ?? 0} / {seiAutoStatus?.maxRounds})
                </span>
                <button type="button" onClick={handleResetRounds} disabled={seiAutoSaving} className="ota-sei-micro-profit__btn-secondary ota-sei-micro-profit__activity-profit-reset" aria-label="Reset rounds counter">
                  {seiAutoSaving ? '…' : 'Reset rounds'}
                </button>
              </>
            )}
          </div>
          <div className="ota-sei-micro-profit__activity-profit-kpi">
            <Clock size={14} aria-hidden />
            <span className="ota-sei-micro-profit__activity-profit-label">Time span</span>
            <span className="ota-sei-micro-profit__activity-profit-value">{timeSpanText}</span>
          </div>
        </div>
        {seiAutoStatus?.maxRounds != null && Number(seiAutoStatus.maxRounds) > 0 && (seiAutoStatus?.roundsDone ?? 0) >= Number(seiAutoStatus.maxRounds) && (
          <p className="ota-sei-micro-profit__activity-profit-cap-hint" role="status">
            Cap reached. Reset rounds or increase Max rounds to run more.
          </p>
        )}
        <p className="ota-sei-micro-profit__activity-profit-hint">
          {roundsCount > 0
            ? `${roundsCount} round${roundsCount !== 1 ? 's' : ''} in ${timeSpanText}. Total profit estimated from history.`
            : 'Profit and rounds are calculated from SEI execution history.'}
        </p>
        {roundsCount > 0 && (
          <button type="button" onClick={handleExportReport} className="ota-sei-micro-profit__btn-secondary ota-sei-micro-profit__activity-profit-export" aria-label="Export activity report as CSV">
            Export report
          </button>
        )}
      </div>

      <div className="ota-sei-micro-profit__contract-row" data-status={contractStatus} data-verifying={verifying}>
        {verifying && (
          <span className="ota-sei-micro-profit__contract-verifying" aria-live="polite">Verifying…</span>
        )}
        {!verifying && contractStatus === 'ok' && (
          <><CheckCircle size={18} className="ota-sei-micro-profit__contract-ok" aria-hidden /> Contract reachable (Mainnet ✓)</>
        )}
        {!verifying && contractStatus === 'error' && SEI_CONTRACTS.SWAP_EXECUTOR && (
          <>
            <XCircle size={18} className="ota-sei-micro-profit__contract-err" aria-hidden />
            <span className="ota-sei-micro-profit__contract-err-msg">{verifyError || 'Contract not reachable.'}</span>
          </>
        )}
        {!verifying && contractStatus === 'error' && !SEI_CONTRACTS.SWAP_EXECUTOR && (
          <span className="ota-sei-micro-profit__label-inline" style={{ color: 'var(--ds-text-secondary)', fontSize: '11px' }}>Swap contract: not configured (optional)</span>
        )}
        {!verifying && contractStatus === null && (
          <span className="ota-sei-micro-profit__label-inline">Click Verify to check contract.</span>
        )}
        {SEI_CONTRACTS.SWAP_EXECUTOR && (
          <button type="button" onClick={verifyContract} disabled={verifying} className="ota-sei-micro-profit__btn-verify" aria-busy={verifying}>
            {verifying ? 'Verifying…' : 'Verify'}
          </button>
        )}
      </div>

      {contractStatus === 'ok' && contractConfig && (
        <div className="ota-sei-micro-profit__onchain">
          <span className="ota-sei-micro-profit__onchain-label">On-chain</span>
          <span>Fee: {contractConfig.fee_percentage != null ? `${Number(contractConfig.fee_percentage) / 100}%` : '—'}</span>
          <span>OTA-only: {contractConfig.ota_only_mode ? 'Yes' : 'No'}</span>
          <span>Pair: {contractConfig.dex_addresses?.length ? `${contractConfig.dex_addresses.length} address(es)` : 'none'}</span>
          {contractConfig.ota_only_mode && whitelisted !== null && (
            <span>Whitelisted: {whitelisted ? 'Yes' : 'No'}</span>
          )}
        </div>
      )}

      {!splitLayout && (
        <div className="ota-sei-micro-profit__sei-auto">
          <button
            type="button"
            className="ota-sei-micro-profit__sei-auto-head"
            onClick={() => setSeiAutoOpen((o) => !o)}
            aria-expanded={seiAutoOpen}
          >
            {seiAutoOpen ? <ChevronUp size={18} aria-hidden /> : <ChevronDown size={18} aria-hidden />}
            <span>SEI Auto</span>
            <span className="ota-sei-micro-profit__label-inline">
              {seiServerManualOnly ? '(manual-only — server auto off)' : '(bot runs round-trips for you)'}
            </span>
          </button>
          {seiAutoOpen && (
            <div className="ota-sei-micro-profit__sei-auto-body">
              {seiAutoLoading && !seiAutoStatus ? (
                <p className="ota-sei-micro-profit__signal-status">Loading…</p>
              ) : (
                <>
                  {seiServerManualOnly && (
                    <p className="ota-sei-micro-profit__signal-status" role="status">
                      <strong>Manual only.</strong> Server-side SEI auto is turned off. Use on-demand quotes and <strong>Run round-trip</strong> / open position manually.
                    </p>
                  )}
                  <div className="ota-sei-micro-profit__row ota-sei-micro-profit__row--launch">
                    {seiAutoStatus?.enabled ? (
                      <>
                        <span className="ota-sei-micro-profit__label">Session:</span>
                        <span className="ota-sei-micro-profit__badge ota-sei-micro-profit__badge--active" role="status">Active</span>
                        <button type="button" onClick={handleSeiAutoToggle} disabled={seiAutoSaving} className="ota-sei-micro-profit__btn-outline ota-sei-micro-profit__btn--stop">
                          Stop session
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="ota-sei-micro-profit__label">Launch session:</span>
                        <button type="button" onClick={handleOpenLaunchModal} disabled={!canLaunchSession || seiAutoSaving} className="ota-sei-micro-profit__btn-primary ota-sei-micro-profit__btn--launch" title={!canLaunchSession ? (seiServerManualOnly ? 'SEI auto unavailable (manual-only on server)' : 'Complete all settings (account, SEI wallet, profit %, max SEI per trade)') : ''}>
                          Launch OTA AI session
                        </button>
                        {!canLaunchSession && (
                          <span className="ota-sei-micro-profit__hint">
                            {seiServerManualOnly ? 'Auto launch disabled — server is manual-only for SEI.' : 'Complete all settings to enable launch.'}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  {seiBotAddress && (
                    <div className="ota-sei-micro-profit__sei-auto-deposit">
                      <div className="ota-sei-micro-profit__deposit-header">
                        <span className="ota-sei-micro-profit__label">Fund Bot Wallet</span>
                        <button
                          type="button"
                          className="ota-sei-micro-profit__btn-ghost"
                          onClick={() => setDepositGuideOpen((v) => !v)}
                          aria-expanded={depositGuideOpen}
                        >
                          {depositGuideOpen ? 'Hide guide' : 'How to transfer SEI?'}
                        </button>
                      </div>
                      <div className="ota-sei-micro-profit__bot-addr-row">
                        <code className="ota-sei-micro-profit__modal-monospace ota-sei-micro-profit__bot-addr-code" title={seiBotAddress}>
                          {seiBotAddress}
                        </code>
                        <button
                          type="button"
                          className="ota-sei-micro-profit__btn-copy"
                          title="Copy bot address"
                          onClick={() => {
                            navigator.clipboard.writeText(seiBotAddress).then(() => {
                              setBotAddrCopied(true);
                              setTimeout(() => setBotAddrCopied(false), 2000);
                            }).catch(() => {});
                          }}
                        >
                          {botAddrCopied ? <Check size={14} /> : <Copy size={14} />}
                          {botAddrCopied ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                          type="button"
                          className="ota-sei-micro-profit__btn-ghost"
                          title="Refresh bot balance"
                          onClick={() => fetchBotBalance(seiBotAddress)}
                          disabled={botSeiBalanceLoading}
                        >
                          ↻
                        </button>
                      </div>
                      <div className="ota-sei-micro-profit__bot-balance-row">
                        <span className="ota-sei-micro-profit__label-inline">Bot balance (Mainnet):</span>
                        {botSeiBalanceLoading
                          ? <span className="ota-sei-micro-profit__label-inline">Loading…</span>
                          : <strong className="ota-sei-micro-profit__bot-balance-val">
                              {botSeiBalance !== null ? `${botSeiBalance} SEI` : '—'}
                            </strong>
                        }
                      </div>
                      {depositGuideOpen && (
                        <div className="ota-sei-micro-profit__deposit-guide">
                          <p className="ota-sei-micro-profit__deposit-guide-title">Step-by-step: How to fund the bot</p>
                          <ol className="ota-sei-micro-profit__deposit-steps">
                            <li><strong>Buy SEI on an exchange</strong><span> — Binance, Coinbase, Kraken, OKX or Bybit. Withdraw as native SEI (not ERC-20).</span></li>
                            <li><strong>With Ledger</strong><span> — Install "Cosmos" app on Ledger. Connect via <a href="https://wallet.keplr.app" target="_blank" rel="noopener noreferrer" className="ota-sei-micro-profit__link">Keplr</a> (Ledger as signer). Send SEI to bot address above.</span></li>
                            <li><strong>From Keplr / Compass</strong><span> — Wallet → SEI chain → Send → paste bot address → confirm.</span></li>
                            <li><strong>Recommended</strong><span> — Start with <strong>10–50 SEI</strong>. Bot uses your "Max SEI per trade" per round-trip.</span></li>
                            <li><strong>Verify</strong><span> — Check on <a href={`https://www.seiscan.app/pacific-1/accounts/${seiBotAddress}`} target="_blank" rel="noopener noreferrer" className="ota-sei-micro-profit__link">SeiScan</a>. Then enable SEI Auto.</span></li>
                          </ol>
                          <p className="ota-sei-micro-profit__sei-auto-custodial-warning" role="alert">
                            Custodial risk: funds sent to the bot address are held by the bot wallet. Only send amounts you are willing to risk. Start small.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {seiAutoStatus && (
                    <>
                      <div className="ota-sei-micro-profit__sei-auto-status">
                        <span className="ota-sei-micro-profit__label-inline">Worker:</span>
                        <span>{seiAutoStatus.workerActive ? 'Active' : 'Inactive'}</span>
                        {seiAutoStatus.lastRunAt && <span>Last run: {new Date(seiAutoStatus.lastRunAt).toLocaleString()}</span>}
                        <span>Executions (24h): {seiAutoStatus.executions24h ?? 0}</span>
                      </div>
                      {seiAutoBackendReadinessHint ? (
                        <p className="ota-sei-micro-profit__hint ota-sei-micro-profit__sei-auto-readiness-hint">{seiAutoBackendReadinessHint}</p>
                      ) : null}
                      <div className="ota-sei-micro-profit__percent-row">
                        <span className="ota-sei-micro-profit__label-inline">Min profit % over gas:</span>
                        {[50, 100, 150, 200].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setSeiAutoStatus((s) => s ? { ...s, minProfitOverGasPercent: pct } : null)}
                            className={`ota-sei-micro-profit__btn-pct${seiAutoStatus?.minProfitOverGasPercent === pct ? ' is-selected' : ''}`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                      <div className="ota-sei-micro-profit__input-group">
                        <label className="ota-sei-micro-profit__input-label">Max SEI per trade (Auto)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={seiAutoStatus?.maxAmountPerTrade ?? '10'}
                          onChange={(e) => setSeiAutoStatus((s) => s ? { ...s, maxAmountPerTrade: e.target.value } : null)}
                          className="ota-sei-micro-profit__input"
                        />
                      </div>
                      <div className="ota-sei-micro-profit__input-group">
                        <label className="ota-sei-micro-profit__input-label">Preferred pair (Auto)</label>
                        <select
                          value={seiAutoStatus?.preferredPair ?? SEI_AUTO_DEFAULT_PAIR}
                          onChange={(e) => setSeiAutoStatus((s) => s ? { ...s, preferredPair: e.target.value } : null)}
                          className="ota-sei-micro-profit__input ota-sei-micro-profit__select"
                          aria-label="Preferred pair for Auto"
                        >
                          {SEI_AUTO_PAIRS.map((p) => (
                            <option key={p.id} value={p.id}>{p.label}</option>
                          ))}
                        </select>
                      </div>
                      <button type="button" onClick={handleSeiAutoSaveParams} disabled={seiAutoSaving} className="ota-sei-micro-profit__btn-outline">
                        {seiAutoSaving ? 'Saving…' : 'Save Auto params'}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      <div className="ota-sei-micro-profit__sei-auto">
        <button
          type="button"
          className="ota-sei-micro-profit__sei-auto-head"
          onClick={() => setSeiHistoryOpen((o) => !o)}
          aria-expanded={seiHistoryOpen}
        >
          {seiHistoryOpen ? <ChevronUp size={18} aria-hidden /> : <ChevronDown size={18} aria-hidden />}
          <span>SEI execution history</span>
        </button>
        {seiHistoryOpen && (
          <div className="ota-sei-micro-profit__sei-auto-body">
            {!userId ? (
              <p className="ota-sei-micro-profit__signal-status">Sign in to see execution history.</p>
            ) : seiHistoryLoading && seiHistory.length === 0 ? (
              <p className="ota-sei-micro-profit__signal-status">Loading…</p>
            ) : seiHistoryError ? (
              <p className="ota-sei-micro-profit__ota-ai-error">{seiHistoryError}</p>
            ) : seiHistory.length === 0 ? (
              <p className="ota-sei-micro-profit__signal-status">No SEI executions yet. Run a round-trip or enable Auto.</p>
            ) : (
              <div className="ota-sei-micro-profit__history-wrap">
                <button type="button" onClick={loadSeiHistory} disabled={seiHistoryLoading} className="ota-sei-micro-profit__btn-secondary" style={{ marginBottom: 8 }}>
                  {seiHistoryLoading ? 'Refreshing…' : 'Refresh'}
                </button>
                <table className="ota-sei-micro-profit__history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Pair</th>
                      <th>Amount</th>
                      <th>Est. profit</th>
                      <th>Status</th>
                      <th>Tx</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seiHistory.map((t) => {
                      const ts = t.timestamp ?? t.createdAt ?? t.executedAt;
                      const dateStr = ts ? new Date(ts).toLocaleString() : '—';
                      const pairLabel = displaySeiTradePair(t);
                      const amount = t.amountOut ?? t.amount ?? t.amountIn ?? '—';
                      const amountIn = t.amountIn != null ? Number(t.amountIn) : null;
                      const amountOut = t.amountOut != null ? Number(t.amountOut) : null;
                      const profitUsd = t.profitUsd != null && Number.isFinite(Number(t.profitUsd)) ? Number(t.profitUsd) : null;
                      const estProfit = profitUsd != null ? profitUsd : (amountIn != null && amountOut != null && Number.isFinite(amountIn) && Number.isFinite(amountOut) ? (amountOut - amountIn) : null);
                      const isProfitUsd = profitUsd != null;
                      const status = t.status ?? '—';
                      const hash = t.txHash ?? null;
                      const url = txUrl(hash);
                      return (
                        <tr key={t.id ?? t._id ?? hash ?? dateStr}>
                          <td>{dateStr}</td>
                          <td>{pairLabel ?? '—'}</td>
                          <td>{typeof amount === 'number' ? amount.toLocaleString(undefined, { maximumFractionDigits: 6 }) : String(amount)}</td>
                          <td>
                            {estProfit != null ? (
                              <span className={estProfit >= 0 ? 'ota-sei-micro-profit__profit--pos' : 'ota-sei-micro-profit__profit--neg'}>
                                {isProfitUsd ? '$' : ''}{estProfit >= 0 ? '+' : ''}{estProfit.toFixed(4)}
                              </span>
                            ) : '—'}
                          </td>
                          <td>{status}</td>
                          <td>
                            {hash && url ? (
                              <a href={url} target="_blank" rel="noopener noreferrer" className="ota-sei-micro-profit__result-link">
                                {hash.slice(0, 10)}… <ExternalLink size={12} aria-hidden />
                              </a>
                            ) : hash ? (
                              <span className="ota-sei-micro-profit__modal-monospace">{hash.slice(0, 14)}…</span>
                            ) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {typeof minProfitUsd === 'number' && minProfitUsd > 0 && (
        <div className="ota-sei-micro-profit__insight" role="status">
          <Cpu size={14} className="ota-sei-micro-profit__insight-icon" aria-hidden />
          <span>Profitable when spread ≥ ${minProfitUsd.toFixed(6)}</span>
        </div>
      )}

      <div className="ota-sei-micro-profit__ota-ai-section">
        {openAiConnected === false && (
          <div className="ota-sei-micro-profit__ota-ai-disconnected" role="alert">
            <div className="ota-sei-micro-profit__ota-ai-disconnected-head">
              <XCircle size={18} aria-hidden />
              <span>SEI analysis is blocked (circuit breaker open). OpenAI Chat (<Link to="/dex-edu/ota/chat" className="ota-sei-micro-profit__chat-link">/dex-edu/ota/chat</Link>) can still work.</span>
            </div>
            <p className="ota-sei-micro-profit__ota-ai-why">
              <strong>How to fix for analysis:</strong> OTA → <em>OTA Access Control</em> → <strong>Reset Circuit</strong>. Check backend: <code>OPENAI_API_KEY</code>, quota, rate limit.
            </p>
          </div>
        )}
        {openAiConnected === true && (
          <>
            <div className="ota-sei-micro-profit__ota-ai-header">
              <Bot size={20} className="ota-sei-micro-profit__ota-ai-icon" aria-hidden />
              <span className="ota-sei-micro-profit__ota-ai-title">OTA AI (OpenAI)</span>
              <span className="ota-sei-micro-profit__ota-ai-badge">GPT</span>
              <button type="button" onClick={fetchOtaAiAnalysis} disabled={otaAiAnalysisLoading} className="ota-sei-micro-profit__btn-secondary" style={{ marginLeft: 'auto' }}>
                {otaAiAnalysisLoading ? 'Asking…' : 'Refresh'}
              </button>
            </div>
            <div className="ota-sei-micro-profit__ota-ai-content">
              {otaAiAnalysisLoading && !otaAiAnalysis && (
                <p className="ota-sei-micro-profit__signal-status">Asking OpenAI for SEI analysis…</p>
              )}
              {otaAiAnalysisError && !otaAiAnalysis && (
                <p className="ota-sei-micro-profit__ota-ai-error">{otaAiAnalysisError}</p>
              )}
              {otaAiAnalysis && (
                <>
                  <div className="ota-sei-micro-profit__ota-ai-signal">
                    <span className="ota-sei-micro-profit__label">Signal:</span>
                    <strong
                      className={`ota-sei-micro-profit__ota-ai-signal-value ota-sei-micro-profit__ota-ai-signal--${formatOtaAiSignalShort(otaAiAnalysis.signal).split('–')[0].trim().toLowerCase().replace('…', '')}`}
                      title={formatOtaAiSignal(otaAiAnalysis.signal)}
                    >
                      {formatOtaAiSignalShort(otaAiAnalysis.signal).toUpperCase()}
                    </strong>
                    {otaAiAnalysis.confidence != null && (
                      <span className="ota-sei-micro-profit__label-inline">Confidence: {Math.round(Number(otaAiAnalysis.confidence) * 100)}%</span>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}
        {openAiConnected === null && (
          <p className="ota-sei-micro-profit__signal-status">Checking OpenAI connection…</p>
        )}
      </div>

      {!splitLayout && (
        <>
          <div className="ota-sei-micro-profit__gas-row">
            <div className="ota-sei-micro-profit__gas-value">
              <span className="ota-sei-micro-profit__label-inline">Gas est. (round-trip): </span>
              {gasEstimateUsd != null ? `$${gasEstimateUsd.toFixed(6)}` : '—'}
            </div>
            <button type="button" onClick={refreshGasEstimate} disabled={loading} aria-label="Refresh gas estimate" className="ota-sei-micro-profit__btn-secondary">
              Refresh gas
            </button>
          </div>
          <div className="ota-sei-micro-profit__profit-block">
            <div className="ota-sei-micro-profit__profit-line">
              <span className="ota-sei-micro-profit__label">Min profit: </span>
              <strong>{typeof minProfitUsd === 'number' ? `$${minProfitUsd.toFixed(6)}` : '—'}</strong>
              {typeof minProfitOverGasPercent === 'number' && (
                <span className="ota-sei-micro-profit__label">({minProfitOverGasPercent}% above gas)</span>
              )}
              <span title="Min profit = gas cost × (1 + %/100). E.g. 100% = 2× gas." className="ota-sei-micro-profit__info-icon" aria-hidden>
                <Info size={14} />
              </span>
            </div>
            <div className="ota-sei-micro-profit__percent-row">
              <span className="ota-sei-micro-profit__label-inline">% above gas:</span>
              {[50, 100, 150, 200].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handlePercentChange(pct)}
                  className={`ota-sei-micro-profit__btn-pct${minProfitOverGasPercent === pct ? ' is-selected' : ''}`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {signerError && (
        <div className="ota-sei-micro-profit__alert" role="alert">
          {signerError}
        </div>
      )}
      {signal && (
        <div className="ota-sei-micro-profit__signal-box">
          Signal: {signal.trigger ? `${signal.side} – ${signal.reason}` : signal.reason}
        </div>
      )}

      {executeResult && (
        <div className="ota-sei-micro-profit__result-block">
          <div className={`ota-sei-micro-profit__result${executeResult.success ? ' ota-sei-micro-profit__result--success' : ' ota-sei-micro-profit__result--error'}`}>
            {executeResult.success ? (
              <span>Tx: {executeResult.txHash ? (
                <a href={txUrl(executeResult.txHash)} target="_blank" rel="noopener noreferrer" className="ota-sei-micro-profit__result-link">
                  {executeResult.txHash.slice(0, 12)}…{executeResult.txHash.slice(-6)}
                  <ExternalLink size={12} aria-hidden />
                </a>
              ) : 'ok'}</span>
            ) : (
              `Error: ${executeResult.error}`
            )}
          </div>
          {executeResult.success && (
            <p className="ota-sei-micro-profit__result-hint">
              Round-trip executed on SEI. Open the <strong>SEI execution history</strong> section below and click <strong>Refresh</strong> to see the execution in the table and accumulated profit.
            </p>
          )}
        </div>
      )}

      {!splitLayout && (
        <div className="ota-sei-micro-profit__input-group">
          <label className="ota-sei-micro-profit__input-label">
            {base} amount (round-trip):
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={amountSei}
            onChange={(e) => setAmountSei(e.target.value)}
            placeholder="1"
            className="ota-sei-micro-profit__input"
          />
        </div>
      )}

      <p className="ota-sei-micro-profit__hint ota-sei-micro-profit__hint--muted" style={{ marginTop: 8, fontSize: 11 }} role="note">
        Pool signal: auxiliary SEI/ATOM vs CEX. Execution pair: <code>{effectivePair}</code>.
      </p>
      <div className="ota-sei-micro-profit__actions">
        <button type="button" onClick={handleCheckSignal} disabled={loading} className="ota-sei-micro-profit__btn-signal" aria-busy={loading}>
          {loading && signalModalOpen ? 'Checking…' : 'Check signal'}
        </button>
        <button type="button" onClick={handleRunRoundTrip} disabled={loading} className="ota-sei-micro-profit__btn-round-trip" aria-label="Run round-trip swap test on SEI" aria-busy={loading}>
          {loading ? 'Running…' : 'Run round-trip (test)'}
        </button>
      </div>

      {!splitLayout && (
        <div className="ota-sei-micro-profit__open-position ota-sei-micro-profit__open-position--compact">
          <span className="ota-sei-micro-profit__label">Open position:</span>
          <input type="text" inputMode="decimal" value={amountUsdc} onChange={(e) => setAmountUsdc(e.target.value)} placeholder="1" className="ota-sei-micro-profit__input ota-sei-micro-profit__input--small" disabled={!SEI_AUTO_PAIR_IDS.includes(effectivePair)} aria-disabled={!SEI_AUTO_PAIR_IDS.includes(effectivePair)} />
          <span className="ota-sei-micro-profit__label-inline">{quote}</span>
          {openPositionError && <span className="ota-sei-micro-profit__signal-status ota-sei-micro-profit__signal-status--error" role="alert">{openPositionError}</span>}
          <button type="button" onClick={handleOpenPosition} disabled={openPositionLoading || loading || !SEI_AUTO_PAIR_IDS.includes(effectivePair)} className="ota-sei-micro-profit__btn-round-trip ota-sei-micro-profit__btn-open-position" aria-busy={openPositionLoading} title={!SEI_AUTO_PAIR_IDS.includes(effectivePair) ? 'Select SEI/USDC or SEI/USDT' : undefined}>
            {openPositionLoading ? 'Opening…' : `Open (buy ${base})`}
          </button>
        </div>
      )}

    </section>
      {roundTripModalOpen && (
        <OtaSeiRoundTripResultModal
          onClose={() => setRoundTripModalOpen(false)}
          roundTripResult={roundTripResult}
          base={base}
          quote={quote}
          effectivePair={effectivePair}
          livePrice={livePrice}
          livePriceError={livePriceError}
          txUrl={txUrl}
          otaAiMessage={otaAiMessage}
          includeOtaAiBlock={false}
        />
      )}
      {signalModalOpen && (
        <OtaSeiCheckSignalModal loading={loading} signal={signal} onClose={() => setSignalModalOpen(false)} />
      )}
      {verifyModalOpen && (
        <OtaSeiContractDataModal
          seiNetwork={seiNetwork}
          contractAddress={SEI_CONTRACTS.SWAP_EXECUTOR}
          contractStatus={contractStatus}
          verifyError={verifyError}
          contractConfig={contractConfig}
          whitelisted={whitelisted}
          onClose={() => setVerifyModalOpen(false)}
        />
      )}
      {seiAutoLaunchModalOpen && (
        <OtaSeiAutoLaunchConfirmModal
          onClose={() => setSeiAutoLaunchModalOpen(false)}
          settingsValidation={settingsValidation}
          canLaunchSession={canLaunchSession}
          seiAutoSaving={seiAutoSaving}
          onConfirm={handleLaunchSessionConfirm}
          seiAutoStatus={seiAutoStatus}
          minProfitOverGasPercent={minProfitOverGasPercent}
          stopIfCannotEstimate={stopIfCannotEstimate}
          maxRounds={maxRounds}
        />
      )}
      </>
    );
  }
  return (
    <section className="ota-sei-micro-profit" aria-labelledby="ota-sei-micro-profit-heading">
      <h2 id="ota-sei-micro-profit-heading" className="ota-sei-micro-profit__heading">
        <Zap size={30} className="ota-sei-micro-profit__heading-icon" aria-hidden />
        <TokenLogo symbol="SEI" size="30" showBorder />
        <span>OTA Micro-Profit SEI</span>
        <span className="ota-sei-micro-profit__badge">Strategy</span>
      </h2>
      <div className="ota-sei-micro-profit__row ota-sei-micro-profit__row--pair" role="group" aria-label="Trading pair">
        <span className="ota-sei-micro-profit__label">Pair</span>
        <TokenSelectorSei variant="pair" customList={SEI_AUTO_PAIRS} value={effectivePair} onChange={setEffectivePair} label="Select trading pair" />
      </div>
      <p className="ota-sei-micro-profit__subtitle">
        Small profit per round-trip, above gas cost. Strategy: {config?.strategyName ?? '—'} · Pair: {effectivePair}
      </p>
      <div className="ota-sei-micro-profit__live-price" role="status" aria-live="polite">
        <span className="ota-sei-micro-profit__live-price-label">{effectivePair}</span>
        {livePriceError ? (
          <span className="ota-sei-micro-profit__live-price-err">{livePriceError}</span>
        ) : livePrice != null ? (
          <>
            <span className="ota-sei-micro-profit__live-price-value">${Number(livePrice).toFixed(4)}</span>
            <span className="ota-sei-micro-profit__live-price-dot" aria-hidden />
          </>
        ) : (
          <span className="ota-sei-micro-profit__live-price-loading">…</span>
        )}
      </div>
      <SeiQuoteHealthBadge
        hasExecutionQuote={hasExecutionQuote}
        usedFallbackPrice={usedFallbackPrice}
        lastExecutionQuoteAt={lastExecutionQuoteAt}
      />
      <div className="ota-sei-micro-profit__presence" role="status" aria-live="polite">
        <div className="ota-sei-micro-profit__presence-head">
          <OTALogo size={28} showBorder animated={openAiConnected === true} className="ota-sei-micro-profit__presence-logo" aria-hidden />
          <div className="ota-sei-micro-profit__presence-identity">
            <span className="ota-sei-micro-profit__presence-name">OTA AI</span>
            <span className="ota-sei-micro-profit__presence-model">
              {otaAiAnalysis?.model ? String(otaAiAnalysis.model).replace(/^gpt/i, (m) => m.toUpperCase()) : 'OpenAI (set in API)'}
            </span>
          </div>
          <div className="ota-sei-micro-profit__presence-status">
            <span className={`ota-sei-micro-profit__presence-dot ota-sei-micro-profit__presence-dot--${otaAiAnalysis ? 'present' : otaAiAnalysisLoading ? 'connecting' : 'off'}`} aria-hidden />
            <span className="ota-sei-micro-profit__presence-status-text">
              {otaAiAnalysis ? 'Present' : otaAiAnalysisLoading ? 'Connecting…' : otaAiAnalysisError ? 'Unavailable' : 'Connecting…'}
            </span>
          </div>
        </div>
        <ul className="ota-sei-micro-profit__presence-caps" aria-label="OTA AI capabilities">
          <li><Sparkles size={12} aria-hidden /> Knows your SEI strategy</li>
          <li>
            <Sparkles size={12} aria-hidden />
            {userId && seiServerManualOnly ? ' Manual round-trip only (server auto off)' : ' Can execute round-trip'}
          </li>
          <li><Sparkles size={12} aria-hidden /> Learns from context</li>
        </ul>
      </div>
      <div className="ota-sei-micro-profit__row">
        <span className="ota-sei-micro-profit__label">OTA AI auto-trade:</span>
        {userId && seiServerManualOnly ? (
          <>
            <span className="ota-sei-micro-profit__badge ota-sei-micro-profit__badge--stopped" role="status">Manual only</span>
            <span className="ota-sei-micro-profit__label-inline">(server auto off)</span>
          </>
        ) : (
          <>
            <button type="button" onClick={handleToggleEnabled} disabled={loading || strategyLoading || (!!userId && seiAutoSaving)} className={`ota-sei-micro-profit__btn-toggle${strategyEnabled ? ' is-enabled' : ''}`} title={userId ? (strategyEnabled ? 'Session is on – OTA AI runs auto round-trips' : 'Session is off') : 'Toggle strategy (local)'}>
              {strategyLoading ? 'Loading…' : strategyEnabled ? 'On' : 'Off'}
            </button>
            <span className="ota-sei-micro-profit__label-inline">{userId ? '(saved on server)' : '(saved locally)'}</span>
          </>
        )}
      </div>
      {userId && (
        <div className="ota-sei-micro-profit__recent-activity" aria-label="Recent SEI activity">
          <span className="ota-sei-micro-profit__recent-activity-title">Recent activity</span>
          {seiHistoryLoading && recentActivity.length === 0 ? (
            <p className="ota-sei-micro-profit__signal-status">Loading…</p>
          ) : recentActivity.length === 0 ? (
            <p className="ota-sei-micro-profit__signal-status">No SEI executions yet.</p>
          ) : (
            <ul className="ota-sei-micro-profit__recent-activity-list">
              {recentActivity.map((t) => {
                const ts = t.timestamp ?? t.createdAt ?? t.executedAt;
                const dateStr = ts ? new Date(ts).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '—';
                const hash = t.txHash ?? null;
                const url = txUrl(hash);
                return (
                  <li key={t.id ?? t._id ?? hash ?? dateStr} className="ota-sei-micro-profit__recent-activity-item">
                    <span className="ota-sei-micro-profit__recent-activity-time">{dateStr}</span>
                    <span className="ota-sei-micro-profit__recent-activity-pair">{base} → {quote}</span>
                    {hash && url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="ota-sei-micro-profit__result-link">
                        {hash.slice(0, 8)}… <ExternalLink size={10} aria-hidden />
                      </a>
                    ) : hash ? (
                      <span className="ota-sei-micro-profit__modal-monospace">{hash.slice(0, 8)}…</span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
      <div className="ota-sei-micro-profit__activity-profit" aria-label="OTA AI Activity & Profit">
        <div className="ota-sei-micro-profit__activity-profit-head">
          <span className="ota-sei-micro-profit__activity-profit-title">OTA AI Micro-Trade</span>
          <button type="button" onClick={() => { loadSeiHistory(); loadSeiAuto(); }} disabled={seiHistoryLoading || !userId} className="ota-sei-micro-profit__btn-secondary ota-sei-micro-profit__activity-profit-refresh" aria-label="Refresh activity and profit">
            {seiHistoryLoading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        <div className="ota-sei-micro-profit__activity-profit-status">
          <span className={`ota-sei-micro-profit__activity-profit-badge ota-sei-micro-profit__activity-profit-badge--${userId && seiServerManualOnly ? 'stopped' : seiAutoStatus?.workerActive ? 'action' : seiAutoStatus?.enabled ? 'waiting' : 'stopped'}`} aria-live="polite">
            {userId && seiServerManualOnly ? 'Manual only' : seiAutoStatus?.workerActive ? 'In action' : seiAutoStatus?.enabled ? 'Waiting' : 'Stopped'}
          </span>
          {seiAutoStatus?.lastRunAt && (
            <span className="ota-sei-micro-profit__activity-profit-lastrun">
              Last run: {new Date(seiAutoStatus.lastRunAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
            </span>
          )}
        </div>
        {userId && seiServerManualOnly && (
          <p className="ota-sei-micro-profit__hint ota-sei-micro-profit__activity-profit-hint" role="status" style={{ marginTop: 6 }}>
            Server auto round-trips are off. History below includes past manual and any legacy auto runs.
          </p>
        )}
        <div className="ota-sei-micro-profit__activity-profit-kpis">
          <div className="ota-sei-micro-profit__activity-profit-kpi">
            <TrendingUp size={14} aria-hidden />
            <span className="ota-sei-micro-profit__activity-profit-label">Accumulated profit</span>
            <span className="ota-sei-micro-profit__activity-profit-value" style={{ color: accumulatedProfitUsd == null ? '#94a3b8' : accumulatedProfitUsd >= 0 ? '#4ade80' : '#f87171' }}>{accumulatedProfitUsd == null ? 'N/A' : `$${accumulatedProfitUsd.toFixed(4)}`}</span>
          </div>
          <div className="ota-sei-micro-profit__activity-profit-kpi">
            <span className="ota-sei-micro-profit__activity-profit-label">Rounds</span>
            <span className="ota-sei-micro-profit__activity-profit-value">{roundsCount}</span>
            {seiAutoStatus?.maxRounds != null && Number(seiAutoStatus.maxRounds) > 0 && (
              <>
                <span className="ota-sei-micro-profit__activity-profit-cap" title="Rounds toward cap (from Auto status)">
                  {' '}(cap: {seiAutoStatus?.roundsDone ?? 0} / {seiAutoStatus?.maxRounds})
                </span>
                <button type="button" onClick={handleResetRounds} disabled={seiAutoSaving} className="ota-sei-micro-profit__btn-secondary ota-sei-micro-profit__activity-profit-reset" aria-label="Reset rounds counter">
                  {seiAutoSaving ? '…' : 'Reset rounds'}
                </button>
              </>
            )}
          </div>
          <div className="ota-sei-micro-profit__activity-profit-kpi">
            <Clock size={14} aria-hidden />
            <span className="ota-sei-micro-profit__activity-profit-label">Time span</span>
            <span className="ota-sei-micro-profit__activity-profit-value">{timeSpanText}</span>
          </div>
        </div>
        {seiAutoStatus?.maxRounds != null && Number(seiAutoStatus.maxRounds) > 0 && (seiAutoStatus?.roundsDone ?? 0) >= Number(seiAutoStatus.maxRounds) && (
          <p className="ota-sei-micro-profit__activity-profit-cap-hint" role="status">
            Cap reached. Reset rounds or increase Max rounds to run more.
          </p>
        )}
        {seiAutoStatus?.enabled && (
          <p className="ota-sei-micro-profit__activity-profit-session-hint" role="status">
            Session runs with no time limit; it stops only when: round limit (if set), profit cannot be estimated (or waiting for market), or manual stop.
          </p>
        )}
        <p className="ota-sei-micro-profit__activity-profit-hint">
          {roundsCount > 0 ? `${roundsCount} round${roundsCount !== 1 ? 's' : ''} in ${timeSpanText}. Total profit estimated from history.` : 'Profit and rounds are calculated from SEI execution history.'}
        </p>
        {roundsCount > 0 && (
          <button type="button" onClick={handleExportReport} className="ota-sei-micro-profit__btn-secondary ota-sei-micro-profit__activity-profit-export" aria-label="Export activity report as CSV">
            Export report
          </button>
        )}
      </div>

      <div className="ota-sei-micro-profit__gas-row">
        <div className="ota-sei-micro-profit__gas-value">
          <span className="ota-sei-micro-profit__label-inline">Gas est. (round-trip): </span>
          {gasEstimateUsd != null ? `$${gasEstimateUsd.toFixed(6)}` : '—'}
        </div>
        <button type="button" onClick={refreshGasEstimate} disabled={loading} aria-label="Refresh gas estimate" className="ota-sei-micro-profit__btn-secondary">
          Refresh gas
        </button>
      </div>
      <div className="ota-sei-micro-profit__profit-block">
        <div className="ota-sei-micro-profit__profit-line">
          <span className="ota-sei-micro-profit__label">Min profit: </span>
          <strong>{typeof minProfitUsd === 'number' ? `$${minProfitUsd.toFixed(6)}` : '—'}</strong>
          {typeof minProfitOverGasPercent === 'number' && (
            <span className="ota-sei-micro-profit__label">({minProfitOverGasPercent}% above gas)</span>
          )}
          <span title="Min profit = gas cost × (1 + %/100). E.g. 100% = 2× gas." className="ota-sei-micro-profit__info-icon" aria-hidden>
            <Info size={14} />
          </span>
        </div>
        <div className="ota-sei-micro-profit__percent-row">
          <span className="ota-sei-micro-profit__label-inline">% above gas:</span>
          {[50, 100, 150, 200].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => handlePercentChange(pct)}
              className={`ota-sei-micro-profit__btn-pct${minProfitOverGasPercent === pct ? ' is-selected' : ''}`}
            >
              {pct}%
            </button>
          ))}
        </div>
      </div>

      {signerError && (
        <div className="ota-sei-micro-profit__alert" role="alert">
          {signerError}
        </div>
      )}
      {signal && (
        <div className="ota-sei-micro-profit__signal-box">
          Signal: {signal.trigger ? `${signal.side} – ${signal.reason}` : signal.reason}
        </div>
      )}

      {executeResult && (
        <div className="ota-sei-micro-profit__result-block">
          <div className={`ota-sei-micro-profit__result${executeResult.success ? ' ota-sei-micro-profit__result--success' : ' ota-sei-micro-profit__result--error'}`}>
            {executeResult.success ? (
              <span>Tx: {executeResult.txHash ? (
                <a href={txUrl(executeResult.txHash)} target="_blank" rel="noopener noreferrer" className="ota-sei-micro-profit__result-link">
                  {executeResult.txHash.slice(0, 12)}…{executeResult.txHash.slice(-6)}
                  <ExternalLink size={12} aria-hidden />
                </a>
              ) : 'ok'}</span>
            ) : (
              `Error: ${executeResult.error}`
            )}
          </div>
          {executeResult.success && (
            <p className="ota-sei-micro-profit__result-hint">
              Round-trip executed on SEI. Open the <strong>SEI execution history</strong> section below and click <strong>Refresh</strong> to see the execution in the table and accumulated profit.
            </p>
          )}
        </div>
      )}

      <div className="ota-sei-micro-profit__manual-round-trip" role="region" aria-label="Manual round-trip">
        <div className="ota-sei-micro-profit__row ota-sei-micro-profit__row--manual">
          <span className="ota-sei-micro-profit__label">Manual round-trip</span>
        </div>
        <div className="ota-sei-micro-profit__input-group">
          <label className="ota-sei-micro-profit__input-label">{base} amount (round-trip):</label>
          <input type="text" inputMode="decimal" value={amountSei} onChange={(e) => setAmountSei(e.target.value)} placeholder="1" className="ota-sei-micro-profit__input" />
        </div>
        <SeiAuxiliarySignalStatus
          showPoolChips
          onRecheckPools={checkPoolHealth}
          priceDiscrepancy={priceDiscrepancy}
          priceDiscrepancyLoading={priceDiscrepancyLoading}
          poolHealth={poolHealth}
          poolHealthLoading={poolHealthLoading}
        />
        <SeiAuxiliaryVsPairCallout effectivePair={effectivePair} base={base} quote={quote} />

        <div className="ota-sei-micro-profit__actions">
          <button type="button" onClick={handleCheckSignal} disabled={loading} className="ota-sei-micro-profit__btn-signal" aria-busy={loading}>
            {loading && signalModalOpen ? 'Checking…' : 'Check signal'}
          </button>
          <button
            type="button"
            onClick={handleRunRoundTrip}
            disabled={loading || (poolHealth !== null && !poolHealth.ok)}
            className="ota-sei-micro-profit__btn-round-trip"
            aria-label="Run round-trip swap test on SEI"
            aria-busy={loading}
            title={poolHealth && !poolHealth.ok ? poolHealth.reason : undefined}
          >
            {loading ? 'Running…' : 'Run round-trip (test)'}
          </button>
        </div>
      </div>
      <div className="ota-sei-micro-profit__open-position" role="region" aria-label="Open position">
        <div className="ota-sei-micro-profit__row ota-sei-micro-profit__row--manual">
          <span className="ota-sei-micro-profit__label">Open position</span>
        </div>
        <p className="ota-sei-micro-profit__hint">Buy {base} with {quote}. Position appears in Open Orders. When Est. profit turns green, the row is highlighted – click Close to lock in. OTA AI cannot auto-close (requires your wallet signature).</p>
        {!SEI_AUTO_PAIR_IDS.includes(effectivePair) && (
          <p className="ota-sei-micro-profit__hint ota-sei-micro-profit__hint--muted" role="status">Open position works with SEI/USDC or SEI/USDT. Select a SEI pair above.</p>
        )}
        <div className="ota-sei-micro-profit__input-group">
          <label className="ota-sei-micro-profit__input-label">{quote} amount:</label>
          <input type="text" inputMode="decimal" value={amountUsdc} onChange={(e) => setAmountUsdc(e.target.value)} placeholder="1" className="ota-sei-micro-profit__input" disabled={!SEI_AUTO_PAIR_IDS.includes(effectivePair)} aria-disabled={!SEI_AUTO_PAIR_IDS.includes(effectivePair)} />
        </div>
        {openPositionError && <p className="ota-sei-micro-profit__signal-status ota-sei-micro-profit__signal-status--error" role="alert">{openPositionError}</p>}
        <button type="button" onClick={handleOpenPosition} disabled={openPositionLoading || loading || !SEI_AUTO_PAIR_IDS.includes(effectivePair)} className="ota-sei-micro-profit__btn-round-trip ota-sei-micro-profit__btn-open-position" aria-busy={openPositionLoading} title={!SEI_AUTO_PAIR_IDS.includes(effectivePair) ? 'Select SEI/USDC or SEI/USDT' : undefined}>
          {openPositionLoading ? 'Opening…' : `Open position (buy ${base})`}
        </button>
      </div>

      <div className="ota-sei-micro-profit__contract-row" data-status={contractStatus} data-verifying={verifying}>
        {verifying && <span className="ota-sei-micro-profit__contract-verifying" aria-live="polite">Verifying…</span>}
        {!verifying && contractStatus === 'ok' && (
          <><CheckCircle size={18} className="ota-sei-micro-profit__contract-ok" aria-hidden /> Contract reachable (Mainnet ✓)</>
        )}
        {!verifying && contractStatus === 'error' && SEI_CONTRACTS.SWAP_EXECUTOR && (
          <>
            <XCircle size={18} className="ota-sei-micro-profit__contract-err" aria-hidden />
            <span className="ota-sei-micro-profit__contract-err-msg">{verifyError || 'Contract not reachable.'}</span>
          </>
        )}
        {!verifying && contractStatus === 'error' && !SEI_CONTRACTS.SWAP_EXECUTOR && (
          <span className="ota-sei-micro-profit__label-inline" style={{ color: 'var(--ds-text-secondary)', fontSize: '11px' }}>Swap contract: not configured (optional)</span>
        )}
        {!verifying && contractStatus === null && (
          <span className="ota-sei-micro-profit__label-inline">Click Verify to check contract.</span>
        )}
        {SEI_CONTRACTS.SWAP_EXECUTOR && (
          <button type="button" onClick={verifyContract} disabled={verifying} className="ota-sei-micro-profit__btn-verify" aria-busy={verifying}>
            {verifying ? 'Verifying…' : 'Verify'}
          </button>
        )}
      </div>
      {contractStatus === 'ok' && contractConfig && (
        <div className="ota-sei-micro-profit__onchain">
          <span className="ota-sei-micro-profit__onchain-label">On-chain</span>
          <span>Fee: {contractConfig.fee_percentage != null ? `${Number(contractConfig.fee_percentage) / 100}%` : '—'}</span>
          <span>OTA-only: {contractConfig.ota_only_mode ? 'Yes' : 'No'}</span>
          <span>Pair: {contractConfig.dex_addresses?.length ? `${contractConfig.dex_addresses.length} address(es)` : 'none'}</span>
          {contractConfig.ota_only_mode && whitelisted !== null && <span>Whitelisted: {whitelisted ? 'Yes' : 'No'}</span>}
        </div>
      )}
      <p className="ota-sei-micro-profit__signal-status">Use split layout on OTA SEI page for Chart | Settings | Display.</p>

      {roundTripModalOpen && (
        <OtaSeiRoundTripResultModal
          onClose={() => setRoundTripModalOpen(false)}
          roundTripResult={roundTripResult}
          base={base}
          quote={quote}
          effectivePair={effectivePair}
          livePrice={livePrice}
          livePriceError={livePriceError}
          txUrl={txUrl}
          otaAiMessage={otaAiMessage}
          includeOtaAiBlock
        />
      )}
      {signalModalOpen && (
        <OtaSeiCheckSignalModal loading={loading} signal={signal} onClose={() => setSignalModalOpen(false)} />
      )}
      {verifyModalOpen && (
        <OtaSeiContractDataModal
          seiNetwork={seiNetwork}
          contractAddress={SEI_CONTRACTS.SWAP_EXECUTOR}
          contractStatus={contractStatus}
          verifyError={verifyError}
          contractConfig={contractConfig}
          whitelisted={whitelisted}
          onClose={() => setVerifyModalOpen(false)}
        />
      )}
      {seiAutoLaunchModalOpen && (
        <OtaSeiAutoLaunchConfirmModal
          onClose={() => setSeiAutoLaunchModalOpen(false)}
          settingsValidation={settingsValidation}
          canLaunchSession={canLaunchSession}
          seiAutoSaving={seiAutoSaving}
          onConfirm={handleLaunchSessionConfirm}
          seiAutoStatus={seiAutoStatus}
          minProfitOverGasPercent={minProfitOverGasPercent}
          stopIfCannotEstimate={stopIfCannotEstimate}
          maxRounds={maxRounds}
        />
      )}
    </section>
  );
}
