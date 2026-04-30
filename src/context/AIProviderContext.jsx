import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import {
  getOtaFuturesAnalyzeLlmMode,
  setOtaFuturesAnalyzeLlmMode,
  OTA_ANALYZE_LLM_WITH_OPENAI,
  OTA_ANALYZE_LLM_OTA_BITS_ONLY,
  OTA_ANALYZE_LLM_ANTHROPIC,
  OTA_FUTURES_ANALYZE_LLM_CHANGE,
} from '../components/DEX_edu_reference/frontend/utils/otaAnalysisModePreference';
import { useWallet as useUnifiedWallet } from './WalletContext.jsx';
import { getLlmTuning, setLlmTuning } from '../components/DEX_edu_reference/frontend/services/otaPolicyService.jsx';

const AIProviderContext = createContext(null);

const STORAGE_KEY = 'ai_provider';

/** @param {'openai' | 'claude' | 'ota'} p */
function mapToOtaAnalyzeMode(p) {
  if (p === 'claude') return OTA_ANALYZE_LLM_ANTHROPIC;
  if (p === 'ota') return OTA_ANALYZE_LLM_OTA_BITS_ONLY;
  return OTA_ANALYZE_LLM_WITH_OPENAI;
}

/**
 * Aliniat la OtaLlmAnalyzeModeControls: SSOT = bits_ota_futures_analyze_llm (getOtaFuturesAnalyzeLlmMode).
 * Nu citim ai_provider cu prioritate — altfel Header rămâne în urmă după schimbarea din Future OPS.
 */
function providerFromOtaFuturesMode() {
  try {
    const m = getOtaFuturesAnalyzeLlmMode();
    if (m === OTA_ANALYZE_LLM_ANTHROPIC) return 'claude';
    if (m === OTA_ANALYZE_LLM_OTA_BITS_ONLY) return 'ota';
    return 'openai';
  } catch (_) {
    return 'openai';
  }
}

function readInitialProvider() {
  if (typeof window === 'undefined') return 'openai';
  const p = providerFromOtaFuturesMode();
  try {
    window.localStorage.setItem(STORAGE_KEY, p);
  } catch (_) {}
  return p;
}

function mapServerAnalyzeModeToProvider(rawMode) {
  return rawMode === OTA_ANALYZE_LLM_OTA_BITS_ONLY ? 'ota' : 'openai';
}

export function AIProviderProvider({ children }) {
  const unifiedWallet = useUnifiedWallet?.() || null;
  const [provider, setProvider] = useState(() => readInitialProvider());
  const [executorProvider, setExecutorProvider] = useState(null);
  const [executorSyncing, setExecutorSyncing] = useState(false);
  const walletAddress =
    unifiedWallet?.walletType === 'EVM' && unifiedWallet?.walletAddress
      ? String(unifiedWallet.walletAddress).trim()
      : '';

  const syncExecutorProviderFromServer = useCallback(async (address) => {
    const normalized = String(address || '').trim();
    if (!normalized) {
      setExecutorProvider(null);
      return null;
    }
    setExecutorSyncing(true);
    try {
      const res = await getLlmTuning(normalized);
      const serverMode =
        res?.llmTuning?.analyzeLlmMode === OTA_ANALYZE_LLM_OTA_BITS_ONLY
          ? OTA_ANALYZE_LLM_OTA_BITS_ONLY
          : OTA_ANALYZE_LLM_WITH_OPENAI;
      const nextProvider = mapServerAnalyzeModeToProvider(serverMode);
      setExecutorProvider(nextProvider);
      return nextProvider;
    } catch (_) {
      return null;
    } finally {
      setExecutorSyncing(false);
    }
  }, []);

  useEffect(() => {
    const syncFromOtaFutures = () => {
      const p = providerFromOtaFuturesMode();
      try {
        window.localStorage.setItem(STORAGE_KEY, p);
      } catch (_) {}
      setProvider(p);
    };
    window.addEventListener(OTA_FUTURES_ANALYZE_LLM_CHANGE, syncFromOtaFutures);
    return () => window.removeEventListener(OTA_FUTURES_ANALYZE_LLM_CHANGE, syncFromOtaFutures);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const normalized = String(walletAddress || '').trim();
    if (!normalized) {
      setExecutorProvider(null);
      setExecutorSyncing(false);
      return undefined;
    }
    (async () => {
      const nextProvider = await syncExecutorProviderFromServer(normalized);
      if (cancelled || !nextProvider) return;
      setExecutorProvider(nextProvider);
    })();
    return () => {
      cancelled = true;
    };
  }, [walletAddress, syncExecutorProviderFromServer]);

  const switchProvider = useCallback(async (newProvider) => {
    const next =
      newProvider === 'claude' || newProvider === 'ota' || newProvider === 'openai' ? newProvider : 'openai';
    setProvider(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch (_) {}
    try {
      setOtaFuturesAnalyzeLlmMode(mapToOtaAnalyzeMode(next), { source: 'click' });
    } catch (_) {}
    if (!walletAddress || next === 'claude') return;
    try {
      const analyzeLlmMode = next === 'ota' ? OTA_ANALYZE_LLM_OTA_BITS_ONLY : OTA_ANALYZE_LLM_WITH_OPENAI;
      const res = await setLlmTuning(walletAddress, { analyzeLlmMode });
      const persistedMode =
        res?.llmTuning?.analyzeLlmMode === OTA_ANALYZE_LLM_OTA_BITS_ONLY
          ? OTA_ANALYZE_LLM_OTA_BITS_ONLY
          : analyzeLlmMode;
      setExecutorProvider(mapServerAnalyzeModeToProvider(persistedMode));
      setOtaFuturesAnalyzeLlmMode(persistedMode, { source: 'server' });
    } catch (_) {}
  }, [walletAddress]);

  const value = useMemo(
    () => ({ provider, switchProvider, executorProvider, executorSyncing }),
    [provider, switchProvider, executorProvider, executorSyncing],
  );

  return <AIProviderContext.Provider value={value}>{children}</AIProviderContext.Provider>;
}

export function useAIProvider() {
  const ctx = useContext(AIProviderContext);
  if (!ctx) {
    throw new Error('useAIProvider must be used within AIProviderProvider');
  }
  return ctx;
}
