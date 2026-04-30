/**
 * Global switch: OpenAI | Claude (Anthropic) | OTA Engine only (no consumer LLM on analyze from browser).
 * Used in Futures Ops and OTA Advisory. Preference: otaAnalysisModePreference.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  getOtaFuturesAnalyzeLlmMode,
  setOtaFuturesAnalyzeLlmMode,
  OTA_ANALYZE_LLM_WITH_OPENAI,
  OTA_ANALYZE_LLM_OTA_BITS_ONLY,
  OTA_ANALYZE_LLM_ANTHROPIC,
  OTA_FUTURES_ANALYZE_LLM_CHANGE,
} from '../../utils/otaAnalysisModePreference';
import { getLlmTuning, setLlmTuning } from '../../services/otaPolicyService';
import { getApiBaseUrl, API_ENDPOINTS } from '../../../config/apiEndpoints.js';
import { otaApiRequest } from '../../utils/otaApiClient';
import { parseOtaTradingReadyPayload } from '../../utils/otaReadyOpenAiLlm';
import {
  createOtaLlmBillingTopupCheckout,
  verifyOtaLlmBillingTopupSession,
} from '../../services/otaLlmBillingTopupService';
import { OTA_LLM_BILLING_REFRESH } from '../../utils/otaLlmBillingRefresh';
import { formatLedgerUsdDisplay } from '../../utils/otaBillingUsdDisplay';

function isProductionBundle() {
  try {
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') return true;
  } catch (_) {}
  try {
    if (typeof window !== 'undefined') {
      const host = String(window.location?.hostname || '').toLowerCase();
      if (host === 'edu.bits-ai.io' || host.endsWith('.bits-ai.io')) return true;
    }
  } catch (_) {}
  return false;
}

function formatAckTime(d) {
  try {
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (_) {
    return d.toTimeString().slice(0, 8);
  }
}

function formatUsdAmount(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return `$${n.toFixed(2)}`;
}

function formatUsdRatePer1k(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  if (n >= 1) return `$${n.toFixed(2)} / 1k tok`;
  if (n >= 0.1) return `$${n.toFixed(3)} / 1k tok`;
  if (n >= 0.01) return `$${n.toFixed(4)} / 1k tok`;
  return `$${n.toFixed(5)} / 1k tok`;
}

function labelForPendingMode(mode) {
  if (mode === OTA_ANALYZE_LLM_OTA_BITS_ONLY) return 'OTA Engine only (no consumer LLM on analyze from this browser)';
  if (mode === OTA_ANALYZE_LLM_WITH_OPENAI) return 'OpenAI (server analyze endpoint)';
  if (mode === OTA_ANALYZE_LLM_ANTHROPIC) return 'Claude (Anthropic) (server analyze endpoint)';
  return '—';
}

function formatEventTimestamp(value) {
  if (!value) return null;
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return null;
  try {
    return d.toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (_) {
    return d.toISOString();
  }
}

function formatBillingEventLine(event) {
  if (!event || typeof event !== 'object') return null;
  const provider = String(event.provider || 'provider').trim();
  const status = String(event.status || '').trim().toLowerCase();
  const totalTokens = Number(event.tokenTotal);
  const tokenPart = Number.isFinite(totalTokens) && totalTokens > 0 ? `${totalTokens} tok` : null;
  const numericCost = Number(event.costUsd);
  const cost = Number.isFinite(numericCost) && numericCost > 0 ? formatUsdAmount(numericCost) : null;
  if (status === 'credit_grant') {
    const amount = formatUsdAmount(event.meta?.amountUsd);
    return `${provider.toUpperCase()} top-up ${amount || 'credit'} added`;
  }
  if (status === 'blocked_no_credit') {
    return `${provider.toUpperCase()} analyze blocked by exhausted separate credit`;
  }
  const parts = [`${provider.toUpperCase()} usage`];
  if (cost) parts.push(cost);
  if (tokenPart) parts.push(tokenPart);
  if (!cost && tokenPart) parts.push('USD pending');
  return parts.join(' · ');
}

function formatProviderLabel(provider) {
  return provider === 'anthropic' ? 'Claude' : provider === 'openai' ? 'OpenAI' : 'Provider';
}

function looksLikeMissingWalletSessionError(value) {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return false;
  return (
    text.includes('invalid or missing ota wallet session token') ||
    text.includes('ota wallet session token') ||
    text.includes('wallet-backed status') ||
    text.includes('wallet session')
  );
}

function estimateRemainingRuns({ billing, historyEvents, provider }) {
  if (!billing || !Array.isArray(historyEvents) || !provider) return null;
  const providerHistory = historyEvents.filter((event) => {
    if (!event || typeof event !== 'object') return false;
    return (
      String(event.provider || '').trim().toLowerCase() === provider &&
      String(event.status || '').trim().toLowerCase() === 'charged'
    );
  });
  if (!providerHistory.length) return null;
  const sampleCosts = providerHistory
    .map((event) => Number(event.costUsd))
    .filter((value) => Number.isFinite(value) && value > 0);
  if (!sampleCosts.length) return null;
  const avgCost = sampleCosts.reduce((sum, value) => sum + value, 0) / sampleCosts.length;
  if (!(avgCost > 0)) return null;
  const available = Number(billing.availableCreditUsd);
  if (!Number.isFinite(available) || available <= 0) return 0;
  return Math.max(0, Math.floor(available / avgCost));
}

function BillingDisclosureBadge({ variant, children }) {
  return (
    <span className={`futures-ops-peer-nav__mode-disclosure futures-ops-peer-nav__mode-disclosure--${variant}`}>
      {children}
    </span>
  );
}

/**
 * @param {{
 *   walletAddress?: string | null,
 *   openLivePositionsCount?: number,
 *   futuresPanelLabel?: string,
 *   compact?: boolean,
 * }} props
 */
export default function OtaLlmAnalyzeModeControls({
  walletAddress = null,
  openLivePositionsCount = 0,
  futuresPanelLabel = 'SHORT',
  compact = false,
}) {
  const prodBundle = isProductionBundle();

  const [llmMode, setLlmMode] = useState(() => getOtaFuturesAnalyzeLlmMode());
  const [pendingMode, setPendingMode] = useState(null);
  const [backdropReady, setBackdropReady] = useState(false);
  const [ack, setAck] = useState(() => ({ at: new Date(), source: 'init' }));
  const [pulse, setPulse] = useState(false);
  const [otaReadySnapshot, setOtaReadySnapshot] = useState(() => ({
    fetchOk: true,
    status: null,
    reason: null,
    openaiKeyConfigured: null,
    openaiLlmEnabled: null,
    circuitBreaker: null,
  }));
  const [otaReadyHydrated, setOtaReadyHydrated] = useState(false);
  const [openAiBudget, setOpenAiBudget] = useState({
    status: 'idle',
    prepaidAvailableUsd: null,
    monthSpendUsd: null,
    error: null,
  });
  const [anthropicBudget, setAnthropicBudget] = useState({
    status: 'idle',
    keyConfigured: null,
    model: null,
    costUsdLast30d: null,
    costReportError: null,
    disclaimerRo: null,
    billingConsoleUrl: null,
    adminConfigured: null,
    error: null,
  });
  const [llmBilling, setLlmBilling] = useState({
    status: 'idle',
    billing: null,
    error: null,
  });
  const [llmBillingHistory, setLlmBillingHistory] = useState({
    status: 'idle',
    events: [],
    error: null,
  });
  const [historyProviderFilter, setHistoryProviderFilter] = useState('all');
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [billingRefreshStatus, setBillingRefreshStatus] = useState('idle');
  const [providerControlPending, setProviderControlPending] = useState(null);
  const [topupPendingCurrency, setTopupPendingCurrency] = useState(null);
  const autoFallbackNoticeRef = useRef('');
  const handledStripeTopupSessionRef = useRef('');

  const liveOpen = Number(openLivePositionsCount) > 0 ? Math.floor(Number(openLivePositionsCount)) : 0;

  const refreshServerOpenAiLlmEnabled = useCallback(async () => {
    try {
      const url = `${getApiBaseUrl()}${API_ENDPOINTS.OTA_READY}`;
      const res = await fetch(url, { method: 'GET', credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      const snap = parseOtaTradingReadyPayload(data);
      setOtaReadySnapshot(snap);
      setOtaReadyHydrated(true);
      return snap.openaiLlmEnabled;
    } catch (_) {
      const failed = {
        fetchOk: false,
        status: null,
        reason: null,
        openaiKeyConfigured: null,
        openaiLlmEnabled: null,
        circuitBreaker: null,
      };
      setOtaReadySnapshot(failed);
      setOtaReadyHydrated(true);
      return null;
    }
  }, []);

  const refreshOpenAiBudget = useCallback(async () => {
    setOpenAiBudget((s) => ({ ...s, status: 'loading' }));
    try {
      const url = `${getApiBaseUrl()}${API_ENDPOINTS.OTA_OPENAI_PLATFORM_BUDGET}`;
      const res = await fetch(url, { method: 'GET', credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        setOpenAiBudget({
          status: 'err',
          prepaidAvailableUsd: null,
          monthSpendUsd: null,
          error: data.error || String(res.status),
        });
        return;
      }
      setOpenAiBudget({
        status: 'ok',
        prepaidAvailableUsd: data.prepaidAvailableUsd ?? null,
        monthSpendUsd: data.monthSpendUsd ?? null,
        otaAnalysesEstimatedUsdMtd: data.otaAnalysesEstimatedUsdMtd ?? null,
        error: null,
        meta: data.meta,
      });
    } catch (e) {
      setOpenAiBudget({
        status: 'err',
        prepaidAvailableUsd: null,
        monthSpendUsd: null,
        error: e?.message || 'fetch',
      });
    }
  }, []);

  const refreshAnthropicBudget = useCallback(async () => {
    setAnthropicBudget((s) => ({ ...s, status: 'loading' }));
    try {
      const url = `${getApiBaseUrl()}${API_ENDPOINTS.CLAUDE_BUDGET}`;
      const res = await fetch(url, { method: 'GET', credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        setAnthropicBudget({
          status: 'err',
          keyConfigured: null,
          model: null,
          costUsdLast30d: null,
          costReportError: null,
          disclaimerRo: null,
          billingConsoleUrl: null,
          adminConfigured: null,
          error: data.error || String(res.status),
        });
        return;
      }
      setAnthropicBudget({
        status: 'ok',
        keyConfigured: data.keyConfigured ?? null,
        model: data.model ?? null,
        costUsdLast30d: data.costUsdLast30d ?? null,
        costReportError: data.costReportError ?? null,
        disclaimerRo: data.disclaimerRo ?? null,
        billingConsoleUrl: data.billingConsoleUrl ?? null,
        adminConfigured: data.adminConfigured ?? null,
        error: null,
      });
    } catch (e) {
      setAnthropicBudget({
        status: 'err',
        keyConfigured: null,
        model: null,
        costUsdLast30d: null,
        costReportError: null,
        disclaimerRo: null,
        billingConsoleUrl: null,
        adminConfigured: null,
        error: e?.message || 'fetch',
      });
    }
  }, []);

  const refreshLlmBilling = useCallback(async () => {
    const w = String(walletAddress || '').trim();
    if (!w) {
      setLlmBilling({ status: 'idle', billing: null, error: null });
      return;
    }
    setLlmBilling((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const qs = new URLSearchParams({ userId: w });
      const data = await otaApiRequest(`${API_ENDPOINTS.OTA_LLM_BILLING_STATUS}?${qs.toString()}`, {
        method: 'GET',
      });
      if (data.success === false || !data.billing || typeof data.billing !== 'object') {
        setLlmBilling({
          status: 'err',
          billing: null,
          error: data.error || 'billing unavailable',
        });
        return;
      }
      setLlmBilling({
        status: 'ok',
        billing: data.billing,
        error: null,
      });
    } catch (e) {
      const msg =
        (typeof e?.responseBody?.error === 'string' && e.responseBody.error) ||
        (typeof e?.responseBody?.message === 'string' && e.responseBody.message) ||
        e?.message ||
        'fetch';
      setLlmBilling({
        status: 'err',
        billing: null,
        error: msg,
      });
    }
  }, [walletAddress]);

  const refreshLlmBillingHistory = useCallback(async () => {
    const w = String(walletAddress || '').trim();
    if (!w) {
      setLlmBillingHistory({ status: 'idle', events: [], error: null });
      return;
    }
    setLlmBillingHistory((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const params = new URLSearchParams({
        userId: w,
        limit: String(historyExpanded ? 8 : 3),
      });
      if (historyProviderFilter !== 'all') {
        params.set('provider', historyProviderFilter);
      }
      const data = await otaApiRequest(`${API_ENDPOINTS.OTA_LLM_BILLING_HISTORY}?${params.toString()}`, {
        method: 'GET',
      });
      if (data.success === false || !Array.isArray(data.events)) {
        setLlmBillingHistory({
          status: 'err',
          events: [],
          error: data.error || 'history unavailable',
        });
        return;
      }
      setLlmBillingHistory({
        status: 'ok',
        events: data.events,
        error: null,
      });
    } catch (e) {
      const msg =
        (typeof e?.responseBody?.error === 'string' && e.responseBody.error) ||
        (typeof e?.responseBody?.message === 'string' && e.responseBody.message) ||
        e?.message ||
        'fetch';
      setLlmBillingHistory({
        status: 'err',
        events: [],
        error: msg,
      });
    }
  }, [historyExpanded, historyProviderFilter, walletAddress]);

  useEffect(() => {
    refreshServerOpenAiLlmEnabled();
  }, [refreshServerOpenAiLlmEnabled]);

  useEffect(() => {
    refreshOpenAiBudget();
    refreshAnthropicBudget();
    const id = window.setInterval(() => {
      refreshOpenAiBudget();
      refreshAnthropicBudget();
    }, 90000);
    return () => window.clearInterval(id);
  }, [refreshOpenAiBudget, refreshAnthropicBudget]);

  useEffect(() => {
    refreshLlmBilling();
    if (!walletAddress) return undefined;
    const id = window.setInterval(() => {
      refreshLlmBilling();
    }, 60000);
    return () => window.clearInterval(id);
  }, [walletAddress, refreshLlmBilling]);

  useEffect(() => {
    refreshLlmBillingHistory();
    if (!walletAddress) return undefined;
    const id = window.setInterval(() => {
      refreshLlmBillingHistory();
    }, 60000);
    return () => window.clearInterval(id);
  }, [walletAddress, refreshLlmBillingHistory]);

  /** După analize reușite din fațadă (`analyzeMarketWithLlmProvider`) — fără a aștepta poll ~60s. */
  useEffect(() => {
    const onBillingRefresh = () => {
      void refreshLlmBilling();
      void refreshLlmBillingHistory();
    };
    if (typeof window === 'undefined') return undefined;
    window.addEventListener(OTA_LLM_BILLING_REFRESH, onBillingRefresh);
    return () => window.removeEventListener(OTA_LLM_BILLING_REFRESH, onBillingRefresh);
  }, [refreshLlmBilling, refreshLlmBillingHistory]);

  const refreshBillingDetails = useCallback(async () => {
    setBillingRefreshStatus('loading');
    try {
      await Promise.all([
        refreshLlmBilling(),
        refreshLlmBillingHistory(),
        refreshOpenAiBudget(),
        refreshAnthropicBudget(),
      ]);
      setBillingRefreshStatus('ok');
    } catch (_) {
      setBillingRefreshStatus('err');
    }
  }, [refreshAnthropicBudget, refreshLlmBilling, refreshLlmBillingHistory, refreshOpenAiBudget]);
  const walletSessionBillingUnavailable =
    looksLikeMissingWalletSessionError(llmBilling.error) || looksLikeMissingWalletSessionError(llmBillingHistory.error);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const currentUrl = new URL(window.location.href);
    const payment = String(currentUrl.searchParams.get('payment') || '').trim().toLowerCase();
    const sessionId = String(currentUrl.searchParams.get('session_id') || '').trim();
    if (payment === 'stripe-llm-billing-cancel') {
      toast.info('Stripe top-up was cancelled. OTA Engine remains available.', { autoClose: 5000 });
      currentUrl.searchParams.delete('payment');
      currentUrl.searchParams.delete('session_id');
      window.history.replaceState({}, '', `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
      return undefined;
    }
    if (payment !== 'stripe-llm-billing-success' || !sessionId) return undefined;
    if (handledStripeTopupSessionRef.current === sessionId) return undefined;
    handledStripeTopupSessionRef.current = sessionId;
    let cancelled = false;
    (async () => {
      try {
        const verified = await verifyOtaLlmBillingTopupSession(sessionId);
        if (cancelled) return;
        await refreshBillingDetails();
        const creditLabel = formatUsdAmount(verified.creditAmountUsd || verified.amountUsd) || 'credit';
        toast.success(`Stripe top-up confirmed: ${creditLabel} added to your separate provider credit.`, {
          autoClose: 7000,
        });
      } catch (error) {
        if (cancelled) return;
        toast.warning(`Stripe top-up verification failed: ${error?.message || 'unknown error'}`, {
          autoClose: 8000,
        });
      } finally {
        if (cancelled) return;
        const cleanedUrl = new URL(window.location.href);
        cleanedUrl.searchParams.delete('payment');
        cleanedUrl.searchParams.delete('session_id');
        window.history.replaceState({}, '', `${cleanedUrl.pathname}${cleanedUrl.search}${cleanedUrl.hash}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshBillingDetails]);

  const toggleProviderPause = useCallback(async (provider, paused) => {
    const w = String(walletAddress || '').trim();
    if (!w) {
      toast.info('Connect a wallet first to manage separate provider controls.', { autoClose: 5000 });
      return;
    }
    setProviderControlPending(provider);
    try {
      const data = await otaApiRequest(API_ENDPOINTS.OTA_LLM_BILLING_PROVIDER_CONTROL, {
        method: 'POST',
        body: JSON.stringify({
          userId: w,
          provider,
          paused,
          reason: paused ? 'user_paused' : null,
        }),
      });
      if (data.success === false || !data.billing) {
        throw new Error(data.error || 'Provider control failed');
      }
      setLlmBilling({
        status: 'ok',
        billing: data.billing,
        error: null,
      });
      await refreshLlmBillingHistory();
      toast.success(
        paused
          ? `${provider === 'openai' ? 'OpenAI' : 'Claude'} paused for this wallet.`
          : `${provider === 'openai' ? 'OpenAI' : 'Claude'} resumed for this wallet.`,
        { autoClose: 4000 },
      );
    } catch (e) {
      toast.warning(`Could not update provider control: ${e?.message || 'error'}`, { autoClose: 7000 });
    } finally {
      setProviderControlPending(null);
    }
  }, [refreshLlmBillingHistory, walletAddress]);

  const startStripeTopup = useCallback(async (currency) => {
    const w = String(walletAddress || '').trim();
    if (!w) {
      toast.info('Connect a wallet first so Stripe can attach the credit to your OTA billing account.', {
        autoClose: 6000,
      });
      return;
    }
    const normalizedCurrency = String(currency || 'usd').trim().toLowerCase() === 'eur' ? 'eur' : 'usd';
    setTopupPendingCurrency(normalizedCurrency);
    try {
      const amount = normalizedCurrency === 'eur' ? 10 : 10;
      const checkout = await createOtaLlmBillingTopupCheckout({
        walletAddress: w,
        currency: normalizedCurrency,
        amount,
      });
      window.location.assign(checkout.url);
    } catch (error) {
      toast.warning(`Stripe top-up could not start: ${error?.message || 'unknown error'}`, { autoClose: 8000 });
      setTopupPendingCurrency(null);
    }
  }, [walletAddress]);

  useEffect(() => {
    const onChange = (e) => {
      const m = e?.detail?.mode ?? getOtaFuturesAnalyzeLlmMode();
      const rawSrc = e?.detail?.source;
      const src = rawSrc === 'click' ? 'click' : rawSrc === 'server' ? 'server' : 'event';
      setLlmMode(m);
      setAck({ at: new Date(), source: src });
      setPulse(true);
      setPendingMode(null);
    };
    window.addEventListener(OTA_FUTURES_ANALYZE_LLM_CHANGE, onChange);
    return () => window.removeEventListener(OTA_FUTURES_ANALYZE_LLM_CHANGE, onChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const w = String(walletAddress || '').trim();
    if (!w) return undefined;
    (async () => {
      try {
        if (getOtaFuturesAnalyzeLlmMode() === OTA_ANALYZE_LLM_ANTHROPIC) return;
        const res = await getLlmTuning(w);
        if (cancelled || !res?.llmTuning || typeof res.llmTuning !== 'object') return;
        const serverMode =
          res.llmTuning.analyzeLlmMode === 'ota_bits_only'
            ? OTA_ANALYZE_LLM_OTA_BITS_ONLY
            : OTA_ANALYZE_LLM_WITH_OPENAI;
        if (serverMode !== getOtaFuturesAnalyzeLlmMode()) {
          setOtaFuturesAnalyzeLlmMode(serverMode, { source: 'server' });
        }
      } catch (_) {}
    })();
    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  useEffect(() => {
    if (pendingMode == null) {
      setBackdropReady(false);
      return undefined;
    }
    setBackdropReady(false);
    const t = window.setTimeout(() => setBackdropReady(true), 480);
    return () => window.clearTimeout(t);
  }, [pendingMode]);

  useEffect(() => {
    if (pendingMode == null) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setPendingMode(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pendingMode]);

  useEffect(() => {
    if (pendingMode == null || typeof document === 'undefined') return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [pendingMode]);

  useEffect(() => {
    if (!pulse) return undefined;
    const t = window.setTimeout(() => setPulse(false), 800);
    return () => window.clearTimeout(t);
  }, [pulse]);

  const requestSwitchTo = useCallback((mode) => {
    setPendingMode(mode);
    toast.info('Confirm or cancel the mode change in the dialog.', { autoClose: 4000 });
  }, []);

  const onChooseOpenAi = useCallback(() => {
    if (llmBilling.status === 'ok' && llmBilling.billing?.providerAvailability?.openai?.pausedByUser === true) {
      toast.warning('OpenAI is paused for this wallet. Resume it in the billing controls first.', { autoClose: 7000 });
      return;
    }
    if (llmBilling.status === 'ok' && llmBilling.billing?.creditBlocked === true) {
      toast.warning('OpenAI is paused until more separate provider credit is added.', { autoClose: 7000 });
      return;
    }
    if (llmMode === OTA_ANALYZE_LLM_WITH_OPENAI) {
      if (pendingMode != null) setPendingMode(null);
      toast.warning('Already on OpenAI. Choose Claude or OTA Engine only for a different mode.', {
        autoClose: 7000,
      });
      return;
    }
    requestSwitchTo(OTA_ANALYZE_LLM_WITH_OPENAI);
  }, [llmBilling.billing, llmBilling.status, llmMode, pendingMode, requestSwitchTo]);

  const onChooseAnthropic = useCallback(() => {
    if (llmBilling.status === 'ok' && llmBilling.billing?.providerAvailability?.anthropic?.pausedByUser === true) {
      toast.warning('Claude is paused for this wallet. Resume it in the billing controls first.', { autoClose: 7000 });
      return;
    }
    if (llmBilling.status === 'ok' && llmBilling.billing?.creditBlocked === true) {
      toast.warning('Claude is paused until more separate provider credit is added.', { autoClose: 7000 });
      return;
    }
    if (llmMode === OTA_ANALYZE_LLM_ANTHROPIC) {
      if (pendingMode != null) setPendingMode(null);
      toast.warning('Already on Claude (Anthropic). Choose OpenAI or OTA Engine only to switch.', {
        autoClose: 7000,
      });
      return;
    }
    requestSwitchTo(OTA_ANALYZE_LLM_ANTHROPIC);
  }, [llmBilling.billing, llmBilling.status, llmMode, pendingMode, requestSwitchTo]);

  const onChooseOtaBits = useCallback(() => {
    if (llmMode === OTA_ANALYZE_LLM_OTA_BITS_ONLY) {
      if (pendingMode != null) setPendingMode(null);
      toast.warning('Already on OTA Engine only. Choose OpenAI or Claude if you want a consumer LLM.', { autoClose: 7000 });
      return;
    }
    requestSwitchTo(OTA_ANALYZE_LLM_OTA_BITS_ONLY);
  }, [llmMode, pendingMode, requestSwitchTo]);

  const confirmPending = useCallback(async () => {
    if (pendingMode == null) return;
    const modeToSet = pendingMode;
    setOtaFuturesAnalyzeLlmMode(modeToSet, { source: 'click' });

    if (modeToSet === OTA_ANALYZE_LLM_ANTHROPIC) {
      toast.success(
        'Saved: Claude (Anthropic). Analyze from this browser uses the Claude path on the server (ANTHROPIC_API_KEY). Executor policy (llm_tuning) is not auto-synced.',
        { autoClose: 9000 },
      );
      refreshAnthropicBudget();
      const w = String(walletAddress || '').trim();
      if (!w) {
        toast.info('Connect a wallet to sync OpenAI vs OTA Engine mode with the executor policy.', {
          autoClose: 6000,
        });
      }
      return;
    }

    if (modeToSet === OTA_ANALYZE_LLM_WITH_OPENAI) {
      toast.success('Saved: OpenAI.', { autoClose: 3500 });
      const llmOn = await refreshServerOpenAiLlmEnabled();
      refreshOpenAiBudget();
      if (llmOn === false) {
        toast.warning(
          'On the server, OTA_OPENAI_LLM_ENABLED is off — analyze may not call OpenAI (OTA Engine only). Set it to true next to OPENAI_API_KEY in your host env.',
          { autoClose: 10000 },
        );
      }
    } else {
      toast.success('Saved: OTA Engine only.', { autoClose: 3500 });
    }

    const w = String(walletAddress || '').trim();
    const analyzeLlmMode = modeToSet === OTA_ANALYZE_LLM_OTA_BITS_ONLY ? 'ota_bits_only' : 'with_openai';
    if (!w) {
      toast.info('Connect a wallet to persist the same mode for the server executor (llm_tuning).', {
        autoClose: 6000,
      });
      return;
    }
    try {
      const res = await setLlmTuning(w, { analyzeLlmMode });
      if (res && typeof res === 'object' && res.success === false) {
        throw new Error(res.error || res.message || 'Policy llm-tuning rejected by server');
      }
      toast.success('Server: analysis mode saved for executor (llm_tuning).', { autoClose: 4000 });
    } catch (err) {
      toast.warning(
        `Could not update server policy: ${err?.message || 'error'}. This browser already uses the new mode.`,
        { autoClose: 8000 },
      );
    }
  }, [pendingMode, walletAddress, refreshServerOpenAiLlmEnabled, refreshOpenAiBudget, refreshAnthropicBudget]);

  const dismissBackdrop = useCallback(() => {
    if (!backdropReady) return;
    setPendingMode(null);
  }, [backdropReady]);

  const isOpenAi = llmMode === OTA_ANALYZE_LLM_WITH_OPENAI;
  const isAnthropic = llmMode === OTA_ANALYZE_LLM_ANTHROPIC;
  const isOtaBits = llmMode === OTA_ANALYZE_LLM_OTA_BITS_ONLY;
  const isSeparateProviderBlocked = llmBilling.status === 'ok' && llmBilling.billing?.creditBlocked === true;
  const openAiPausedByUser = llmBilling.status === 'ok' && llmBilling.billing?.providerAvailability?.openai?.pausedByUser === true;
  const anthropicPausedByUser =
    llmBilling.status === 'ok' && llmBilling.billing?.providerAvailability?.anthropic?.pausedByUser === true;
  const isOpenAiUnavailable = isSeparateProviderBlocked || openAiPausedByUser;
  const isAnthropicUnavailable = isSeparateProviderBlocked || anthropicPausedByUser;

  useEffect(() => {
    let nextNotice = '';
    let shouldFallback = false;
    let reasonText = '';
    if (llmMode === OTA_ANALYZE_LLM_WITH_OPENAI && isOpenAiUnavailable) {
      shouldFallback = true;
      reasonText = openAiPausedByUser
        ? 'OpenAI was paused for this wallet, so analysis moved back to OTA Engine.'
        : 'OpenAI credit is exhausted, so analysis moved back to OTA Engine.';
      nextNotice = `openai:${openAiPausedByUser ? 'paused' : 'credit'}`;
    } else if (llmMode === OTA_ANALYZE_LLM_ANTHROPIC && isAnthropicUnavailable) {
      shouldFallback = true;
      reasonText = anthropicPausedByUser
        ? 'Claude was paused for this wallet, so analysis moved back to OTA Engine.'
        : 'Claude credit is exhausted, so analysis moved back to OTA Engine.';
      nextNotice = `anthropic:${anthropicPausedByUser ? 'paused' : 'credit'}`;
    }
    if (!shouldFallback) {
      autoFallbackNoticeRef.current = '';
      return;
    }
    if (autoFallbackNoticeRef.current === nextNotice) return;
    autoFallbackNoticeRef.current = nextNotice;
    setPendingMode(null);
    setOtaFuturesAnalyzeLlmMode(OTA_ANALYZE_LLM_OTA_BITS_ONLY, { source: 'server' });
    toast.info(reasonText, { autoClose: 6000 });
  }, [
    anthropicPausedByUser,
    isAnthropicUnavailable,
    isOpenAiUnavailable,
    isSeparateProviderBlocked,
    llmMode,
    openAiPausedByUser,
  ]);

  const snap = otaReadySnapshot;
  const openAiAnalyzeFullyOk =
    isOpenAi &&
    otaReadyHydrated &&
    snap.fetchOk &&
    snap.openaiKeyConfigured !== false &&
    snap.openaiLlmEnabled !== false &&
    String(snap.circuitBreaker || '').toLowerCase() !== 'open';

  let bannerVariant = 'ota';
  if (isOpenAi) bannerVariant = 'openai';
  else if (isAnthropic) bannerVariant = 'anthropic';

  const bannerClass =
    `futures-ops-peer-nav__mode-banner futures-ops-peer-nav__mode-banner--${bannerVariant}` +
    (isOpenAi && !openAiAnalyzeFullyOk ? ' futures-ops-peer-nav__mode-banner--openai-warn' : '') +
    (pulse ? ' futures-ops-peer-nav__mode-banner--pulse' : '') +
    (compact ? ' futures-ops-peer-nav__mode-banner--compact' : '');

  const onBannerAnimEnd = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.animationName && e.animationName !== 'futures-ops-mode-banner-ack') return;
    setPulse(false);
  };

  const showBudget = !compact && isOpenAi;
  const showAnthropicBudget = !compact;

  const bannerDetail = (() => {
    if (isAnthropic) {
      if (walletSessionBillingUnavailable) {
        return 'Selected: Claude stays chosen, but the wallet-backed billing gate is locked until the OTA wallet session is restored.';
      }
      return 'Active: browser analyze uses Claude (Anthropic) on the server (ANTHROPIC_API_KEY).';
    }
    if (isOtaBits) {
      return 'Active: analyze uses OTA Engine only (no consumer LLM on this path).';
    }
    if (walletSessionBillingUnavailable) {
      return 'Selected: OpenAI stays chosen, but the wallet-backed billing gate is locked until the OTA wallet session is restored.';
    }
    if (!otaReadyHydrated) {
      return 'Checking server readiness…';
    }
    if (!snap.fetchOk) {
      return 'Could not read readiness (network/CORS). Analyze may fall back to OTA Engine without confirmation.';
    }
    if (snap.openaiKeyConfigured === false) {
      return 'Server: OPENAI_API_KEY missing — OpenAI cannot be called. Add the key in your host environment.';
    }
    if (snap.openaiLlmEnabled === false) {
      return 'OpenAI is selected here, but OTA_OPENAI_LLM_ENABLED is off on the server; analyze may stay on OTA Engine only. Enable it next to OPENAI_API_KEY.';
    }
    if (String(snap.circuitBreaker || '').toLowerCase() === 'open') {
      return 'OpenAI circuit breaker is OPEN — LLM calls are paused; analyze may use OTA Engine until it clears.';
    }
    if (snap.status === 'not_ready' && snap.reason && /circuit/i.test(snap.reason)) {
      return `Server not_ready: ${snap.reason}. Analyze may skip OpenAI until the service recovers.`;
    }
    if (snap.openaiLlmEnabled == null || snap.openaiKeyConfigured == null) {
      return 'Incomplete readiness payload from server — check backend; analyze may use OTA Engine only.';
    }
    return 'Active: analyze can call OpenAI on the server when policy and keys allow.';
  })();

  const modalBodyExtra =
    pendingMode === OTA_ANALYZE_LLM_ANTHROPIC ? (
      <>
        {' '}
        Claude requests use the dedicated Claude analyze route (does not change OTA Engine-only flags on the core analyze path).
        Executor <code>llm_tuning</code> still governs OpenAI vs OTA Engine for auto-trading.
      </>
    ) : (
      <>
        {' '}
        Browser analyze sends <code>engineNoOpenAi</code> according to the selected mode; with a connected wallet the same{' '}
        <strong>OpenAI vs OTA Engine</strong> choice is saved in <code>llm_tuning.analyzeLlmMode</code> for the{' '}
        <strong>auto executor</strong>. Global <code>OTA_EXECUTOR_ANALYZE_ENGINE_NO_OPENAI</code> can force engine-only for
        everyone.
      </>
    );

  const transparencyTone = isOtaBits ? 'included' : walletSessionBillingUnavailable ? 'locked' : 'paid';
  const transparencyTitle = isOtaBits
    ? 'Billing status: included in OTA'
    : isSeparateProviderBlocked || openAiPausedByUser || anthropicPausedByUser
      ? 'Billing status: separate provider cost — paused'
      : 'Billing status: separate provider cost';
  const isWalletSessionBillingUnavailable = walletSessionBillingUnavailable;
  const perUserBillingLine = (() => {
    if (isOtaBits) return null;
    if (!walletAddress) return 'Per-user credit: connect wallet to load your trial status.';
    if (llmBilling.status === 'loading' || llmBilling.status === 'idle') return 'Per-user credit: loading your trial status…';
    if (llmBilling.status === 'err' || !llmBilling.billing) {
      if (isWalletSessionBillingUnavailable) {
        return 'Per-user credit: OTA wallet session needed to unlock this wallet-backed ledger.';
      }
      return `Per-user credit: unavailable (${llmBilling.error || 'status fetch failed'}).`;
    }
    const trial = formatUsdAmount(llmBilling.billing.trialCreditUsd);
    const spent = formatLedgerUsdDisplay(llmBilling.billing.spentCreditUsd);
    const available = formatLedgerUsdDisplay(llmBilling.billing.availableCreditUsd);
    const gate = llmBilling.billing.creditBlocked
      ? 'Provider gate: paused until payment/top-up adds more credit.'
      : 'Provider gate: active while available credit stays above $0.';
    return `Per-user trial: ${trial || '—'} · spent: ${spent || '—'} · available: ${available || '—'}. ${gate}`;
  })();
  const transparencyItems = (() => {
    if (isOtaBits) {
      return [
        'Scope: this path stays included in OTA.',
        'Provider charge: no separate OpenAI or Claude provider billing on this mode.',
        'Enforcement: no credit gate or auto-stop is needed here.',
      ];
    }
    if (isAnthropic) {
      const orgSpend =
        anthropicBudget.costUsdLast30d != null
          ? `Org/global spend snapshot (30d): ~$${Number(anthropicBudget.costUsdLast30d).toFixed(2)}.`
          : 'Org/global spend snapshot: unavailable from Anthropic budget API.';
      return [
        'Scope: provider spend shown here is org/global, not a personal invoice.',
        orgSpend,
        perUserBillingLine || 'Per-user credit: unavailable.',
        anthropicPausedByUser
          ? 'Status: Claude is manually paused for this wallet until you resume it below.'
          : isSeparateProviderBlocked
          ? 'Status: paid Claude analyzes are paused until new credit is added.'
          : 'Status: Claude analyzes can run while separate credit remains available.',
      ];
    }
    const openAiOrgSpend =
      openAiBudget.monthSpendUsd != null
        ? `OpenAI org/global month snapshot: ~$${Number(openAiBudget.monthSpendUsd).toFixed(2)}.`
        : 'OpenAI org/global month snapshot: unavailable.';
    const otaEstimate =
      openAiBudget.otaAnalysesEstimatedUsdMtd != null
        ? `OTA analyses estimate (MTD, global): ~$${Number(openAiBudget.otaAnalysesEstimatedUsdMtd).toFixed(2)}.`
        : 'OTA analyses estimate (MTD): unavailable.';
    return [
      'Scope: spend shown here is org/global and OTA-global, not a per-user invoice.',
      openAiOrgSpend,
      `${otaEstimate} ${perUserBillingLine || 'Per-user credit: unavailable.'}`,
      openAiPausedByUser
        ? 'Status: OpenAI is manually paused for this wallet until you resume it below.'
        : isSeparateProviderBlocked
        ? 'Status: paid OpenAI analyzes are paused until new credit is added.'
        : 'Status: OpenAI analyzes can run while separate credit remains available.',
    ];
  })();
  const filteredHistoryEvents = Array.isArray(llmBillingHistory.events) ? llmBillingHistory.events : [];
  const billingHistoryItems = filteredHistoryEvents
    .map((event) => ({
      id: event?.id ?? `${event?.provider || 'event'}-${event?.createdAt || 'unknown'}`,
      text: formatBillingEventLine(event),
      timestamp: formatEventTimestamp(event?.createdAt),
    }))
    .filter((item) => item.text);
  const chargedHistoryEvents = filteredHistoryEvents.filter((event) => {
    if (!event || typeof event !== 'object') return false;
    return String(event.status || '').trim().toLowerCase() === 'charged';
  });
  const chargedHistoryCostValues = chargedHistoryEvents
    .map((event) => Number(event.costUsd))
    .filter((value) => Number.isFinite(value) && value > 0);
  const chargedHistoryTotalCost = chargedHistoryCostValues.length
    ? chargedHistoryCostValues.reduce((sum, value) => sum + value, 0)
    : 0;
  const chargedHistoryAverageCost = chargedHistoryCostValues.length
    ? chargedHistoryTotalCost / chargedHistoryCostValues.length
    : null;
  const historyFocusSummary = (() => {
    const label = historyProviderFilter === 'openai'
      ? 'OpenAI'
      : historyProviderFilter === 'anthropic'
        ? 'Claude'
        : 'All providers';
    if (llmBillingHistory.status === 'loading' || llmBillingHistory.status === 'idle') {
      return `${label}: refreshing ledger focus…`;
    }
    if (!filteredHistoryEvents.length) {
      return `${label}: no recent events in the current ledger slice.`;
    }
    const chargedEventsWithTokensOnly = chargedHistoryEvents.filter((event) => {
      const totalTokens = Number(event?.tokenTotal);
      const cost = Number(event?.costUsd);
      return Number.isFinite(totalTokens) && totalTokens > 0 && !(Number.isFinite(cost) && cost > 0);
    });
    if (!chargedHistoryEvents.length || !chargedHistoryCostValues.length || chargedHistoryAverageCost == null) {
      if (chargedEventsWithTokensOnly.length > 0) {
        return `${label}: ${chargedEventsWithTokensOnly.length} charged run(s) have token usage, but USD is still pending on those event rows.`;
      }
      return `${label}: ${filteredHistoryEvents.length} event(s) loaded, but no charged usage with cost yet.`;
    }
    const avgCostLabel = formatUsdAmount(chargedHistoryAverageCost);
    const totalCostLabel = formatUsdAmount(chargedHistoryTotalCost);
    return `${label}: ${chargedHistoryEvents.length} charged run(s) • avg ${avgCostLabel || 'n/a'} • total ${totalCostLabel || 'n/a'}`;
  })();
  const historyFocusSummaryResolved =
    isWalletSessionBillingUnavailable && llmBillingHistory.status !== 'loading' && llmBillingHistory.status !== 'idle'
      ? `${
          historyProviderFilter === 'openai'
            ? 'OpenAI'
            : historyProviderFilter === 'anthropic'
              ? 'Claude'
              : 'All providers'
        }: OTA wallet session needed before per-wallet ledger events can load again.`
      : historyFocusSummary;
  const historyProviderOptions = [
    { value: 'all', label: 'All' },
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Claude' },
  ];
  const billingSummaryItems = (() => {
    if (isOtaBits) return [];
    if (!walletAddress) {
      return [
        { label: 'Provider gate', value: 'Wallet needed', tone: 'muted' },
        { label: 'Available credit', value: 'Connect wallet', tone: 'muted' },
        { label: 'Spent from trial', value: 'Connect wallet', tone: 'muted' },
        { label: 'Paid top-up', value: 'Connect wallet', tone: 'muted' },
      ];
    }
    if (llmBilling.status === 'loading' || llmBilling.status === 'idle') {
      return [
        { label: 'Provider gate', value: 'Loading…', tone: 'muted' },
        { label: 'Available credit', value: 'Loading…', tone: 'muted' },
        { label: 'Spent from trial', value: 'Loading…', tone: 'muted' },
        { label: 'Paid top-up', value: 'Loading…', tone: 'muted' },
      ];
    }
    if (llmBilling.status === 'err' || !llmBilling.billing) {
      const selectedProviderActiveLabel = isAnthropic
        ? 'Claude active'
        : isOpenAi
          ? 'OpenAI active'
          : 'Selected active';
      return [
        {
          label: isWalletSessionBillingUnavailable ? 'Analyze state' : 'Provider gate',
          value: isWalletSessionBillingUnavailable ? selectedProviderActiveLabel : 'Unavailable',
          tone: 'warn',
        },
        {
          label: 'Available credit',
          value: isWalletSessionBillingUnavailable ? 'Stripe top-up ready' : 'Unavailable',
          tone: 'warn',
        },
        {
          label: 'Spent from trial',
          value: isWalletSessionBillingUnavailable ? 'Hidden' : 'Unavailable',
          tone: 'warn',
        },
        {
          label: 'Paid top-up',
          value: isWalletSessionBillingUnavailable ? 'Hidden' : 'Unavailable',
          tone: 'warn',
        },
      ];
    }
    return [
      {
        label: 'Provider gate',
        value: llmBilling.billing.creditBlocked ? 'Credit paused' : 'Active',
        tone: llmBilling.billing.creditBlocked ? 'warn' : 'ok',
      },
      {
        label: 'Available credit',
        value: formatLedgerUsdDisplay(llmBilling.billing.availableCreditUsd) || '—',
        tone: llmBilling.billing.creditBlocked ? 'warn' : 'ok',
      },
      {
        label: 'Spent from trial',
        value: formatLedgerUsdDisplay(llmBilling.billing.spentCreditUsd) || '—',
        tone: 'muted',
      },
      {
        label: 'Paid top-up',
        value: formatLedgerUsdDisplay(llmBilling.billing.paidCreditUsd) || '—',
        tone:
          Number.isFinite(Number(llmBilling.billing.paidCreditUsd)) && Number(llmBilling.billing.paidCreditUsd) > 0
            ? 'ok'
            : 'muted',
      },
    ];
  })();
  const providerHealthCards =
    !isOtaBits && llmBilling.status === 'ok' && llmBilling.billing
      ? ['openai', 'anthropic'].map((provider) => {
          const label = formatProviderLabel(provider);
          const providerAvailability = llmBilling.billing?.providerAvailability?.[provider] || {};
          const pausedByUser = providerAvailability.pausedByUser === true;
          const blockedByCredit = providerAvailability.blockedByCredit === true;
          const providerSpend =
            provider === 'openai'
              ? openAiBudget.status === 'ok'
                ? openAiBudget.monthSpendUsd
                : null
              : anthropicBudget.status === 'ok'
                ? anthropicBudget.costUsdLast30d
                : null;
          const providerRatePer1k =
            provider === 'openai'
              ? llmBilling.billing?.providerRatesUsdPer1k?.openai
              : llmBilling.billing?.providerRatesUsdPer1k?.anthropic;
          const providerHistoryEvents = Array.isArray(llmBillingHistory.events)
            ? llmBillingHistory.events.filter((event) => {
                if (!event || typeof event !== 'object') return false;
                return String(event.provider || '').trim().toLowerCase() === provider;
              })
            : [];
          const latestChargedEvent =
            providerHistoryEvents.find(
              (event) => String(event?.status || '').trim().toLowerCase() === 'charged',
            ) || null;
          const latestEvent = providerHistoryEvents[0] || null;
          const remainingRuns = estimateRemainingRuns({
            billing: llmBilling.billing,
            historyEvents: llmBillingHistory.events || [],
            provider,
          });
          let stateLabel = 'Ready';
          let tone = 'ok';
          if (pausedByUser) {
            stateLabel = 'Paused by you';
            tone = 'warn';
          } else if (blockedByCredit) {
            stateLabel = 'Credit exhausted';
            tone = 'warn';
          }
          return {
            provider,
            label,
            tone,
            stateLabel,
            spendLabel: formatUsdAmount(providerSpend) || '—',
            rateLabel: formatUsdRatePer1k(providerRatePer1k) || 'Rate not configured',
            remainingRunsLabel:
              remainingRuns == null
                ? 'Need charged history'
                : remainingRuns === 0
                  ? '0 more at recent pace'
                  : `~${remainingRuns} more at recent pace`,
            lastChargedLabel: latestChargedEvent?.createdAt
              ? `Last charged ${formatEventTimestamp(latestChargedEvent.createdAt) || 'unknown time'}`
              : 'No charged run yet',
            latestEventLabel: latestEvent ? formatBillingEventLine(latestEvent) || 'No recent event cue' : 'No recent event cue',
            reasonLabel: pausedByUser
              ? 'Manual pause active'
              : blockedByCredit
                ? 'Waiting for top-up'
                : 'Available to analyze',
          };
        })
      : [];
  const nextBestAction = (() => {
    if (!walletAddress) {
      return 'Connect a wallet to activate per-user billing visibility.';
    }
    if (isWalletSessionBillingUnavailable) {
      if (isOpenAi) {
        return 'OpenAI analyze stays active. Stripe top-up works now for this wallet, while per-wallet trial, history, and billing controls stay hidden until the OTA wallet session is restored.';
      }
      if (isAnthropic) {
        return 'Claude analyze stays active. Stripe top-up works now for this wallet, while per-wallet trial, history, and billing controls stay hidden until the OTA wallet session is restored.';
      }
      return 'The selected paid analyze mode stays active. Stripe top-up works now for this wallet. Restore the OTA wallet session to see wallet trial, top-up history, and billing controls again.';
    }
    if (llmBilling.status === 'err') {
      return 'Refresh billing to recover the wallet-backed credit snapshot.';
    }
    if (isOtaBits) {
      return 'OTA Engine is active. Switch to OpenAI or Claude only when you want paid analysis again.';
    }
    if (isSeparateProviderBlocked) {
      return 'Credit is exhausted. Stay on OTA Engine until a backend top-up is applied.';
    }
    if (openAiPausedByUser && anthropicPausedByUser) {
      return 'Both paid providers are paused. Resume one provider or keep OTA Engine active.';
    }
    if (openAiPausedByUser) {
      return 'OpenAI is paused. Claude is still available, or resume OpenAI when you want it back.';
    }
    if (anthropicPausedByUser) {
      return 'Claude is paused. OpenAI is still available, or resume Claude when you want it back.';
    }
    return 'Paid providers are available. Use Refresh billing before long sessions to keep the ledger current.';
  })();
  /**
   * Pe OTA Engine panoul „Recent separate billing ledger” e ascuns — dar dacă userul a pus Pause pe OpenAI/Claude,
   * auto-fallback-ul trece UI pe OTA și ascundea butoanele Resume. Păstrăm aceleași controale vizibile cât timp
   * un provider plătit e încă marcat paused, ca să poată relua fără să fie blocați pe header.
   */
  const showPaidProviderPauseControls =
    !isOtaBits || openAiPausedByUser || anthropicPausedByUser;

  const providerControlItems = !showPaidProviderPauseControls
    ? []
    : [
        {
          provider: 'openai',
          label: isWalletSessionBillingUnavailable
            ? 'OpenAI billing controls hidden'
            : openAiPausedByUser
              ? 'Resume OpenAI'
              : 'Pause OpenAI',
          paused: openAiPausedByUser,
          disabled: !walletAddress || isWalletSessionBillingUnavailable || providerControlPending === 'anthropic',
        },
        {
          provider: 'anthropic',
          label: isWalletSessionBillingUnavailable
            ? 'Claude billing controls hidden'
            : anthropicPausedByUser
              ? 'Resume Claude'
              : 'Pause Claude',
          paused: anthropicPausedByUser,
          disabled: !walletAddress || isWalletSessionBillingUnavailable || providerControlPending === 'openai',
        },
      ];
  const providerControlsHelpText = isWalletSessionBillingUnavailable
    ? 'Manual provider pause and resume stay hidden until the OTA wallet session is restored for this connected address.'
    : 'Manual provider pause is separate from credit exhaustion: you can stop only OpenAI or only Claude for this wallet.';
  const billingTopupHelpText = isWalletSessionBillingUnavailable
    ? 'Stripe top-up already works for this connected address. The OTA wallet session is only needed to reveal wallet-specific trial, history, and billing controls again.'
    : 'After the $5 trial is consumed, add at least €10 or $10 through Stripe to keep OpenAI or Claude available.';
  const billingHistoryToggleDisabled = billingRefreshStatus === 'loading' || isWalletSessionBillingUnavailable;
  const billingRefreshDisabled = billingRefreshStatus === 'loading' || isWalletSessionBillingUnavailable;
  const billingRefreshButtonLabel = isWalletSessionBillingUnavailable ? 'Refresh after OTA unlock' : 'Refresh billing';
  const showLedgerActions = !isWalletSessionBillingUnavailable;
  const showLedgerFilters = !isWalletSessionBillingUnavailable;
  const billingHeaderStatusPill = isWalletSessionBillingUnavailable
    ? 'Wallet ledger hidden'
    : llmBilling.status === 'ok' && llmBilling.billing
      ? 'Wallet ledger live'
      : null;
  const billingHistorySubtitle = isWalletSessionBillingUnavailable
    ? 'Per-wallet trial, history, and billing controls stay hidden until the OTA wallet session is restored. Analyze and Stripe top-up already work for this connected address.'
    : 'Wallet-backed trial status and the latest provider usage events.';
  const billingIntelligenceHeader = isWalletSessionBillingUnavailable && !providerHealthCards.length
    ? 'Analyze active'
    : 'Provider health';
  const billingRecommendationLabel = isWalletSessionBillingUnavailable ? 'Analyze active' : 'Next best action';
  const openAiActivePillLabel = 'ACTIVE';
  const anthropicActivePillLabel = 'ACTIVE';
  const openAiLockedSelectedClass = '';
  const anthropicLockedSelectedClass = '';
  const openAiModeTitle = isWalletSessionBillingUnavailable
    ? 'OpenAI analyze stays active. The wallet-backed billing ledger stays hidden until the OTA wallet session is restored.'
    : openAiPausedByUser
      ? 'OpenAI is manually paused for this wallet. Resume it below.'
      : isSeparateProviderBlocked
        ? 'Separate provider credit is exhausted. Add more credit to resume OpenAI.'
        : undefined;
  const anthropicModeTitle = isWalletSessionBillingUnavailable
    ? 'Claude analyze stays active. The wallet-backed billing ledger stays hidden until the OTA wallet session is restored.'
    : anthropicPausedByUser
      ? 'Claude is manually paused for this wallet. Resume it below.'
      : isSeparateProviderBlocked
        ? 'Separate provider credit is exhausted. Add more credit to resume Claude.'
        : undefined;
  const transparencyTitleResolved =
    !isOtaBits && isWalletSessionBillingUnavailable
      ? 'Billing status: separate provider cost — wallet ledger locked'
      : transparencyTitle;
  const transparencyItemsResolved =
    !isOtaBits && isWalletSessionBillingUnavailable
      ? [
          'Scope: org/global provider spend shown here is not a per-user invoice.',
          transparencyItems[1],
          'Wallet ledger: restore the OTA wallet session to reveal trial, top-up history, and provider controls for this address.',
          'Stripe top-up: payment can still be started right now for the connected wallet address.',
        ]
      : transparencyItems;
  const modeDisclosureNoteText = isWalletSessionBillingUnavailable
    ? 'OpenAI and Claude may incur separate provider cost. OTA Engine stays included here. Stripe top-up already works, while wallet-specific trial and history unlock again after the OTA wallet session is restored.'
    : 'OpenAI and Claude may incur separate provider cost. OTA Engine stays included on this path. Trial credit and provider stop now follow the internal per-user billing ledger when your wallet-backed status is available.';
  const billingStripTitleResolved = transparencyTitleResolved;
  const hideModeBanner = !isOtaBits && isWalletSessionBillingUnavailable;
  const modeDisclosureNoteResolved =
    !isOtaBits && isWalletSessionBillingUnavailable
      ? 'OpenAI and Claude may incur separate provider cost. The selected analyze provider stays active here, OTA Engine remains available, and Stripe top-up already works. Restore the OTA wallet session only to reveal wallet-specific trial, history, and billing controls again.'
      : modeDisclosureNoteText;
  const billingStripTitleDisplay =
    !isOtaBits && isWalletSessionBillingUnavailable
      ? isAnthropic
        ? 'Billing status: Claude analyze active — wallet ledger hidden'
        : 'Billing status: OpenAI analyze active — wallet ledger hidden'
      : billingStripTitleResolved;
  const transparencyItemsDisplay =
    !isOtaBits && isWalletSessionBillingUnavailable
      ? [
          'Scope: org/global provider spend shown here is not a per-user invoice, and the selected analyze provider stays available.',
          transparencyItems[1],
          'Wallet ledger: restore the OTA wallet session to reveal per-wallet trial, top-up history, and billing controls for this address.',
          'Stripe top-up: payment can already be started right now for the connected wallet address.',
        ]
      : transparencyItemsResolved;

  return (
    <>
      <div className={`futures-ops-peer-nav__analyze-head${compact ? ' futures-ops-peer-nav__analyze-head--compact' : ''}`}>
        <span className="futures-ops-peer-nav__analyze-label">Live Analysis</span>
        <span className="futures-ops-peer-nav__analyze-scope">
          {compact ? 'OpenAI · Claude · OTA Engine' : 'Server analyze · OpenAI or Claude or OTA Engine'}
        </span>
      </div>
      <div
        className="futures-ops-peer-nav__mode-actions"
        role="group"
        aria-label="Analysis mode — confirm on change"
      >
        <button
          type="button"
          aria-pressed={isOpenAi}
          aria-disabled={isOpenAiUnavailable}
          disabled={isOpenAiUnavailable}
          className={
            'futures-ops-peer-nav__mode-btn futures-ops-peer-nav__mode-btn--openai' +
            (isOpenAi ? ' futures-ops-peer-nav__mode-btn--active' : ' futures-ops-peer-nav__mode-btn--idle') +
            openAiLockedSelectedClass +
            (pendingMode === OTA_ANALYZE_LLM_WITH_OPENAI ? ' futures-ops-peer-nav__mode-btn--pending' : '')
          }
          onClick={onChooseOpenAi}
          title={openAiModeTitle}
        >
          <span className="futures-ops-peer-nav__mode-btn-label">OpenAI</span>
          <BillingDisclosureBadge variant="paid">Separate cost</BillingDisclosureBadge>
          {isOpenAi ? (
            <span className="futures-ops-peer-nav__mode-btn-active-pill" aria-hidden>
              {openAiActivePillLabel}
            </span>
          ) : null}
        </button>
        {showBudget ? (
          <span
            className="futures-ops-peer-nav__openai-budget"
            title="OTA analyses: estimated from DB (current month UTC). OpenAI org spend from billing API (may include non-OTA usage). Credit from credit_grants when available."
          >
            {openAiBudget.status === 'loading' || openAiBudget.status === 'idle' ? (
              <span className="futures-ops-peer-nav__openai-budget-muted">OpenAI Platform…</span>
            ) : openAiBudget.status === 'err' ? (
              <span className="futures-ops-peer-nav__openai-budget-warn">Billing: unavailable</span>
            ) : (
              <>
                {openAiBudget.prepaidAvailableUsd != null && (
                  <span>Credit ~${Number(openAiBudget.prepaidAvailableUsd).toFixed(2)}</span>
                )}
                {openAiBudget.otaAnalysesEstimatedUsdMtd != null && (
                  <span>
                    {openAiBudget.prepaidAvailableUsd != null ? ' · ' : ''}
                    OTA LLM analyses (est.) ~${Number(openAiBudget.otaAnalysesEstimatedUsdMtd).toFixed(2)}
                  </span>
                )}
                {openAiBudget.monthSpendUsd != null && (
                  <span>
                    {openAiBudget.prepaidAvailableUsd != null || openAiBudget.otaAnalysesEstimatedUsdMtd != null
                      ? ' · '
                      : ''}
                    OpenAI org (month) ~${Number(openAiBudget.monthSpendUsd).toFixed(2)}
                  </span>
                )}
                {openAiBudget.prepaidAvailableUsd == null &&
                  openAiBudget.otaAnalysesEstimatedUsdMtd == null &&
                  openAiBudget.monthSpendUsd == null && (
                    <span
                      className="futures-ops-peer-nav__openai-budget-muted"
                      title={
                        openAiBudget.meta && typeof openAiBudget.meta === 'object'
                          ? [
                              openAiBudget.meta.costsHttpStatus != null
                                ? `costs HTTP ${openAiBudget.meta.costsHttpStatus}`
                                : null,
                              openAiBudget.meta.costsError ? String(openAiBudget.meta.costsError) : null,
                              openAiBudget.meta.costs403Hint ? String(openAiBudget.meta.costs403Hint) : null,
                              openAiBudget.meta.costsRetriedWithoutOrgHeader
                                ? 'Costs: retry succeeded without OpenAI-Organization header'
                                : null,
                              openAiBudget.meta.creditGrantsHttpStatus != null
                                ? `credit_grants HTTP ${openAiBudget.meta.creditGrantsHttpStatus}`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(' · ') || openAiBudget.meta.disclaimer
                          : undefined
                      }
                    >
                      {(() => {
                        const st = openAiBudget.meta?.costsHttpStatus;
                        const cg = openAiBudget.meta?.creditGrantsHttpStatus;
                        const billingAdmin = openAiBudget.meta?.billingUsesAdminKey === true;
                        if (st != null && st !== 200) {
                          if (st === 403 && !billingAdmin) {
                            return 'Org spend: set OPENAI_ADMIN_API_KEY on server';
                          }
                          return `Costs API ${st}`;
                        }
                        if (cg === 403) return 'Credit API 403 (key cannot read billing)';
                        return 'Partial API data';
                      })()}
                    </span>
                  )}
              </>
            )}
          </span>
        ) : null}
        <button
          type="button"
          aria-pressed={isAnthropic}
          aria-disabled={isAnthropicUnavailable}
          disabled={isAnthropicUnavailable}
          className={
            'futures-ops-peer-nav__mode-btn futures-ops-peer-nav__mode-btn--anthropic' +
            (isAnthropic ? ' futures-ops-peer-nav__mode-btn--active' : ' futures-ops-peer-nav__mode-btn--idle') +
            anthropicLockedSelectedClass +
            (pendingMode === OTA_ANALYZE_LLM_ANTHROPIC ? ' futures-ops-peer-nav__mode-btn--pending' : '')
          }
          onClick={onChooseAnthropic}
          title={anthropicModeTitle}
        >
          <span className="futures-ops-peer-nav__mode-btn-label">Claude (Anthropic)</span>
          <BillingDisclosureBadge variant="paid">Separate cost</BillingDisclosureBadge>
          {isAnthropic ? (
            <span className="futures-ops-peer-nav__mode-btn-active-pill" aria-hidden>
              {anthropicActivePillLabel}
            </span>
          ) : null}
        </button>
        {showAnthropicBudget ? (
          <span
            className="futures-ops-peer-nav__anthropic-budget"
            title="Anthropic: ANTHROPIC_API_KEY on server; org spend (~30d) when ANTHROPIC_ADMIN_API_KEY is set. Prepaid balance not exposed via standard API — see Anthropic billing console."
          >
            {anthropicBudget.status === 'loading' || anthropicBudget.status === 'idle' ? (
              <span className="futures-ops-peer-nav__anthropic-budget-muted">Claude API…</span>
            ) : anthropicBudget.status === 'err' ? (
              <span className="futures-ops-peer-nav__anthropic-budget-warn">
                Billing: {anthropicBudget.error || 'unavailable'}
              </span>
            ) : (
              <>
                {anthropicBudget.keyConfigured === false && (
                  <span className="futures-ops-peer-nav__anthropic-budget-warn">No ANTHROPIC_API_KEY on server</span>
                )}
                {anthropicBudget.keyConfigured !== false && anthropicBudget.model ? (
                  <span>Model {String(anthropicBudget.model)}</span>
                ) : null}
                {anthropicBudget.costUsdLast30d != null && (
                  <span>
                    {anthropicBudget.keyConfigured !== false && anthropicBudget.model ? ' · ' : ''}
                    Org spend (30d) ~${Number(anthropicBudget.costUsdLast30d).toFixed(2)}
                  </span>
                )}
                {anthropicBudget.costReportError ? (
                  <span className="futures-ops-peer-nav__anthropic-budget-warn">
                    {anthropicBudget.keyConfigured !== false && anthropicBudget.model ? ' · ' : ''}
                    Cost report: {String(anthropicBudget.costReportError)}
                  </span>
                ) : null}
                {anthropicBudget.costUsdLast30d == null &&
                  !anthropicBudget.costReportError &&
                  anthropicBudget.adminConfigured === false &&
                  anthropicBudget.disclaimerRo ? (
                  <span className="futures-ops-peer-nav__anthropic-budget-muted">
                    {anthropicBudget.disclaimerRo}{' '}
                    <a
                      href={anthropicBudget.billingConsoleUrl || 'https://console.anthropic.com/settings/billing'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="futures-ops-peer-nav__anthropic-budget-link"
                    >
                      Console Billing
                    </a>
                  </span>
                ) : null}
                {anthropicBudget.adminConfigured === true &&
                  anthropicBudget.costUsdLast30d == null &&
                  !anthropicBudget.costReportError &&
                  anthropicBudget.keyConfigured !== false && (
                    <span className="futures-ops-peer-nav__anthropic-budget-muted">Org spend: no data in response</span>
                  )}
              </>
            )}
          </span>
        ) : null}
        <button
          type="button"
          aria-pressed={isOtaBits}
          className={
            'futures-ops-peer-nav__mode-btn futures-ops-peer-nav__mode-btn--ota' +
            (isOtaBits ? ' futures-ops-peer-nav__mode-btn--active' : ' futures-ops-peer-nav__mode-btn--idle') +
            (pendingMode === OTA_ANALYZE_LLM_OTA_BITS_ONLY ? ' futures-ops-peer-nav__mode-btn--pending' : '')
          }
          onClick={onChooseOtaBits}
        >
          <span className="futures-ops-peer-nav__mode-btn-label">OTA Engine</span>
          <BillingDisclosureBadge variant="included">Included in OTA</BillingDisclosureBadge>
          {isOtaBits ? (
            <span className="futures-ops-peer-nav__mode-btn-active-pill" aria-hidden>
              ACTIVE
            </span>
          ) : null}
        </button>
      </div>
      <p className="futures-ops-peer-nav__mode-disclosure-note" role="note">
        {modeDisclosureNoteResolved}
      </p>
      <div
        className={`futures-ops-peer-nav__billing-strip futures-ops-peer-nav__billing-strip--${transparencyTone}`}
        role="note"
      >
        <div className="futures-ops-peer-nav__billing-strip-title">{billingStripTitleDisplay}</div>
        <ul className="futures-ops-peer-nav__billing-strip-list">
          {transparencyItemsDisplay.map((item) => (
            <li key={item} className="futures-ops-peer-nav__billing-strip-item">
              {item}
            </li>
          ))}
        </ul>
      </div>
      {isOtaBits && providerControlItems.length > 0 ? (
        <div
          className="futures-ops-peer-nav__provider-resume-when-ota"
          role="region"
          aria-label="Resume or pause paid providers"
        >
          <p className="futures-ops-peer-nav__provider-resume-when-ota__lead">
            A paid provider is paused for this wallet. While OTA Engine is selected, the full billing ledger (including
            Ledger focus) stays hidden — use Resume below to re-enable OpenAI or Claude, then you can switch mode in the
            header.
          </p>
          <div className="futures-ops-peer-nav__llm-confirm-actions">
            {providerControlItems.map((item) => (
              <button
                key={item.provider}
                type="button"
                className="futures-ops-peer-nav__llm-confirm-btn futures-ops-peer-nav__llm-confirm-btn--ghost"
                onClick={() => toggleProviderPause(item.provider, !item.paused)}
                disabled={item.disabled || providerControlPending === item.provider}
              >
                {providerControlPending === item.provider ? 'Saving…' : item.label}
              </button>
            ))}
          </div>
          <p className="futures-ops-peer-nav__billing-history-help futures-ops-peer-nav__provider-resume-when-ota__help">
            {providerControlsHelpText}
          </p>
        </div>
      ) : null}
      {!isOtaBits ? (
        <div className="futures-ops-peer-nav__billing-history" role="note">
          <div className="futures-ops-peer-nav__billing-history-split">
            <div className="futures-ops-peer-nav__billing-history-col futures-ops-peer-nav__billing-history-col--main">
          <div className="futures-ops-peer-nav__billing-history-header">
            <div className="futures-ops-peer-nav__billing-history-title-wrap">
              <div className="futures-ops-peer-nav__billing-history-title">Recent separate billing ledger</div>
              <p className="futures-ops-peer-nav__billing-history-subtitle">
                {billingHistorySubtitle}
              </p>
              {billingHeaderStatusPill ? (
                <div
                  className={
                    'futures-ops-peer-nav__billing-history-status-pill' +
                    (isWalletSessionBillingUnavailable
                      ? ' futures-ops-peer-nav__billing-history-status-pill--warn'
                      : ' futures-ops-peer-nav__billing-history-status-pill--ok')
                  }
                >
                  {billingHeaderStatusPill}
                </div>
              ) : null}
            </div>
            {showLedgerActions ? (
              <div className="futures-ops-peer-nav__billing-history-actions">
                <button
                  type="button"
                  className="futures-ops-peer-nav__billing-history-toggle"
                  onClick={() => setHistoryExpanded((value) => !value)}
                  disabled={billingHistoryToggleDisabled}
                >
                  {historyExpanded ? 'Show recent' : 'Show more'}
                </button>
                <button
                  type="button"
                  className="futures-ops-peer-nav__billing-refresh-btn"
                  onClick={refreshBillingDetails}
                  disabled={billingRefreshDisabled}
                >
                  <RefreshCw
                    size={14}
                    className={billingRefreshStatus === 'loading' ? 'futures-ops-peer-nav__billing-refresh-icon-spin' : ''}
                    aria-hidden
                  />
                  {billingRefreshButtonLabel}
                </button>
              </div>
            ) : null}
          </div>
          <div className="futures-ops-peer-nav__billing-summary-grid">
            {billingSummaryItems.map((item) => (
              <div
                key={item.label}
                className={`futures-ops-peer-nav__billing-summary-card futures-ops-peer-nav__billing-summary-card--${item.tone}`}
              >
                <span className="futures-ops-peer-nav__billing-summary-label">{item.label}</span>
                <strong className="futures-ops-peer-nav__billing-summary-value">{item.value}</strong>
              </div>
            ))}
          </div>
          {providerHealthCards.length || isWalletSessionBillingUnavailable ? (
            <div className="futures-ops-peer-nav__billing-intelligence">
              <div className="futures-ops-peer-nav__billing-intelligence-header">{billingIntelligenceHeader}</div>
              {providerHealthCards.length ? (
                <div className="futures-ops-peer-nav__billing-intelligence-grid">
                  {providerHealthCards.map((card) => (
                    <div
                      key={card.provider}
                      className={`futures-ops-peer-nav__billing-intelligence-card futures-ops-peer-nav__billing-intelligence-card--${card.tone}`}
                    >
                      <div className="futures-ops-peer-nav__billing-intelligence-provider">{card.label}</div>
                      <div className="futures-ops-peer-nav__billing-intelligence-state">{card.stateLabel}</div>
                      <div className="futures-ops-peer-nav__billing-intelligence-meta">Org spend: {card.spendLabel}</div>
                      <div className="futures-ops-peer-nav__billing-intelligence-meta">Rate: {card.rateLabel}</div>
                      <div className="futures-ops-peer-nav__billing-intelligence-meta">{card.remainingRunsLabel}</div>
                      <div className="futures-ops-peer-nav__billing-intelligence-meta">{card.lastChargedLabel}</div>
                      <div className="futures-ops-peer-nav__billing-intelligence-meta futures-ops-peer-nav__billing-intelligence-meta--event">
                        {card.latestEventLabel}
                      </div>
                      <div className="futures-ops-peer-nav__billing-intelligence-meta">{card.reasonLabel}</div>
                    </div>
                  ))}
                </div>
              ) : null}
              <div
                className={
                  'futures-ops-peer-nav__billing-intelligence-recommendation' +
                  (isWalletSessionBillingUnavailable
                    ? ' futures-ops-peer-nav__billing-intelligence-recommendation--available-locked'
                    : '')
                }
              >
                <span className="futures-ops-peer-nav__billing-intelligence-recommendation-label">{billingRecommendationLabel}</span>
                <strong className="futures-ops-peer-nav__billing-intelligence-recommendation-text">{nextBestAction}</strong>
              </div>
            </div>
          ) : null}
            </div>
            <div className="futures-ops-peer-nav__billing-history-col futures-ops-peer-nav__billing-history-col--ledger">
          <div className="futures-ops-peer-nav__billing-history-focus">
            <div className="futures-ops-peer-nav__billing-history-focus-label">Ledger focus</div>
            {showLedgerFilters ? (
              <div className="futures-ops-peer-nav__billing-history-filters" role="tablist" aria-label="Billing history provider filter">
                {historyProviderOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={
                      'futures-ops-peer-nav__billing-filter-btn' +
                      (historyProviderFilter === option.value ? ' futures-ops-peer-nav__billing-filter-btn--active' : '') +
                      (isWalletSessionBillingUnavailable ? ' futures-ops-peer-nav__billing-filter-btn--disabled' : '')
                    }
                    onClick={() => setHistoryProviderFilter(option.value)}
                    aria-pressed={historyProviderFilter === option.value}
                    disabled={isWalletSessionBillingUnavailable}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
            <p className="futures-ops-peer-nav__billing-history-focus-summary">{historyFocusSummaryResolved}</p>
          </div>
          <div className="futures-ops-peer-nav__billing-history-ledger-stack">
            <div className="futures-ops-peer-nav__llm-confirm-actions">
              <button
                type="button"
                className="futures-ops-peer-nav__llm-confirm-btn futures-ops-peer-nav__llm-confirm-btn--ok"
                onClick={() => startStripeTopup('eur')}
                disabled={!walletAddress || topupPendingCurrency != null}
              >
                {topupPendingCurrency === 'eur' ? 'Opening Stripe…' : 'Top up €10'}
              </button>
              <button
                type="button"
                className="futures-ops-peer-nav__llm-confirm-btn futures-ops-peer-nav__llm-confirm-btn--ok"
                onClick={() => startStripeTopup('usd')}
                disabled={!walletAddress || topupPendingCurrency != null}
              >
                {topupPendingCurrency === 'usd' ? 'Opening Stripe…' : 'Top up $10'}
              </button>
            </div>
            <p className="futures-ops-peer-nav__billing-history-help">
              {isWalletSessionBillingUnavailable
                ? 'You can still top up this connected wallet through Stripe right now. The payment is attached to the wallet address, while the per-wallet credit ledger becomes visible again after the OTA wallet session is restored.'
                : billingTopupHelpText}
            </p>
            <div className="futures-ops-peer-nav__llm-confirm-actions">
              {providerControlItems.map((item) => (
                <button
                  key={item.provider}
                  type="button"
                  className="futures-ops-peer-nav__llm-confirm-btn futures-ops-peer-nav__llm-confirm-btn--ghost"
                  onClick={() => toggleProviderPause(item.provider, !item.paused)}
                  disabled={item.disabled || providerControlPending === item.provider}
                >
                  {providerControlPending === item.provider ? 'Saving…' : item.label}
                </button>
              ))}
            </div>
            <p className="futures-ops-peer-nav__billing-history-help">
              {providerControlsHelpText}
            </p>
            {llmBillingHistory.status === 'loading' || llmBillingHistory.status === 'idle' ? (
              <p className="futures-ops-peer-nav__billing-history-empty">Loading recent usage and credit events…</p>
            ) : llmBillingHistory.status === 'err' ? (
              <p className="futures-ops-peer-nav__billing-history-empty">
                {isWalletSessionBillingUnavailable
                  ? 'Billing history is waiting for the OTA wallet session to unlock this wallet-backed ledger again.'
                  : `Billing history unavailable (${llmBillingHistory.error || 'fetch failed'}).`}
              </p>
            ) : billingHistoryItems.length > 0 ? (
              <ul className="futures-ops-peer-nav__billing-history-list">
                {billingHistoryItems.map((item) => (
                  <li key={item.id} className="futures-ops-peer-nav__billing-history-item">
                    <span className="futures-ops-peer-nav__billing-history-text">{item.text}</span>
                    {item.timestamp ? (
                      <span className="futures-ops-peer-nav__billing-history-time">{item.timestamp}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="futures-ops-peer-nav__billing-history-empty">
                No separate billing events yet for this wallet-backed user.
              </p>
            )}
            {isSeparateProviderBlocked ? (
              <p className="futures-ops-peer-nav__billing-history-help">
                Separate provider credit is exhausted. A backend top-up must be applied before OpenAI or Claude can run again.
              </p>
            ) : openAiPausedByUser || anthropicPausedByUser ? (
              <p className="futures-ops-peer-nav__billing-history-help">
                One provider is manually paused for this wallet. Resume it above whenever you want analyses to use it again.
              </p>
            ) : null}
          </div>
          {!hideModeBanner && !isOtaBits ? (
            <p
              className={`${bannerClass} futures-ops-peer-nav__mode-banner--in-ledger-col`}
              role="status"
              aria-live="polite"
              onAnimationEnd={onBannerAnimEnd}
            >
              <span className="futures-ops-peer-nav__mode-banner-detail">{bannerDetail}</span>{' '}
              <span className="futures-ops-peer-nav__mode-banner-meta">
                {ack.source === 'server' ? 'synced from server · ' : ''}
                saved {formatAckTime(ack.at)}
                {ack.source === 'click' ? ' · click' : ''}
              </span>
            </p>
          ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {pendingMode != null &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className={
              'futures-ops-llm-modal-overlay' +
              (backdropReady ? ' futures-ops-llm-modal-overlay--backdrop-armed' : '')
            }
            role="presentation"
          >
            <button
              type="button"
              className="futures-ops-llm-modal-backdrop"
              aria-label="Cancel mode change"
              onClick={dismissBackdrop}
            />
            <div
              className="futures-ops-peer-nav__llm-confirm futures-ops-llm-modal-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="futures-ops-llm-confirm-title"
            >
              {prodBundle ? (
                <div className="futures-ops-llm-modal-prod-strip" role="status">
                  <AlertTriangle size={16} strokeWidth={2.2} aria-hidden className="futures-ops-llm-modal-prod-icon" />
                  <span>Production build — confirm only if intended.</span>
                </div>
              ) : null}
              <div id="futures-ops-llm-confirm-title" className="futures-ops-peer-nav__llm-confirm-title">
                Confirm analysis mode change
              </div>
              <p className="futures-ops-peer-nav__llm-confirm-body">
                Switch to: <strong>{labelForPendingMode(pendingMode)}</strong>. This does not close positions.{modalBodyExtra}
                {liveOpen > 0 ? (
                  <>
                    {' '}
                    <span className="futures-ops-peer-nav__llm-confirm-warn">
                      You have {liveOpen} open position(s) in this panel ({futuresPanelLabel}).
                    </span>
                  </>
                ) : null}
              </p>
              <p className="futures-ops-peer-nav__llm-confirm-billing-note">
                {pendingMode === OTA_ANALYZE_LLM_OTA_BITS_ONLY
                  ? 'OTA Engine stays included here: no separate provider billing is added on this path.'
                  : 'This provider may add separate cost outside OTA. Trial credit and provider blocking now follow the internal per-user billing ledger; UI top-up/payment is still not built here.'}
              </p>
              <div className="futures-ops-peer-nav__llm-confirm-actions">
                <button
                  type="button"
                  className="futures-ops-peer-nav__llm-confirm-btn futures-ops-peer-nav__llm-confirm-btn--ghost"
                  onClick={() => setPendingMode(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="futures-ops-peer-nav__llm-confirm-btn futures-ops-peer-nav__llm-confirm-btn--ok"
                  onClick={confirmPending}
                >
                  Confirm
                </button>
              </div>
              <p className="futures-ops-peer-nav__llm-confirm-hint">
                {backdropReady ? 'Esc or the dimmed area closes without changes.' : 'Please wait — preparing dialog…'}
              </p>
            </div>
          </div>,
          document.body,
        )}
      {!hideModeBanner && isOtaBits ? (
        <p className={bannerClass} role="status" aria-live="polite" onAnimationEnd={onBannerAnimEnd}>
          <span className="futures-ops-peer-nav__mode-banner-detail">{bannerDetail}</span>{' '}
          <span className="futures-ops-peer-nav__mode-banner-meta">
            {ack.source === 'server' ? 'synced from server · ' : ''}
            saved {formatAckTime(ack.at)}
            {ack.source === 'click' ? ' · click' : ''}
          </span>
        </p>
      ) : null}
    </>
  );
}
