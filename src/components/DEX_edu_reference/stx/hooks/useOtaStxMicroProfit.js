/**
 * useOtaStxMicroProfit – hook pentru strategia OTA micro-profit pe STX.
 * Expune config, estimare gas, semnal și execuție round-trip.
 * Plan: stx/OTA_STX_MICRO_PROFIT_IMPLEMENTATION_PLAN.md
 */

import { useState, useCallback, useMemo } from 'react';
import {
  getStrategyConfig,
  estimateGasCostPerRoundTrip,
  shouldTriggerRoundTrip,
  executeRoundTrip,
  getMinProfitUsd,
} from '../services/otaStxMicroProfitService';

export function useOtaStxMicroProfit() {
  const [config, setConfig] = useState(null);
  const [gasEstimateUsd, setGasEstimateUsd] = useState(null);
  const [signal, setSignal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [executeResult, setExecuteResult] = useState(null);
  const [minProfitOverGasPercentOverride, setMinProfitOverGasPercentOverride] = useState(null);

  const refreshConfig = useCallback(async () => {
    setLoading(true);
    try {
      const c = await getStrategyConfig();
      setConfig(c);
      return c;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshGasEstimate = useCallback(async () => {
    setLoading(true);
    try {
      const gas = await estimateGasCostPerRoundTrip();
      setGasEstimateUsd(gas);
      return gas;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkSignal = useCallback(async (marketData) => {
    setLoading(true);
    try {
      const s = await shouldTriggerRoundTrip(marketData ?? {});
      setSignal(s);
      return s;
    } finally {
      setLoading(false);
    }
  }, []);

  const runRoundTrip = useCallback(async (params) => {
    setLoading(true);
    setExecuteResult(null);
    try {
      const result = await executeRoundTrip(params);
      setExecuteResult(result);
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      const c = await getStrategyConfig();
      setConfig(c);
      const gas = await estimateGasCostPerRoundTrip();
      setGasEstimateUsd(gas);
      return { config: c, gasEstimateUsd: gas };
    } finally {
      setLoading(false);
    }
  }, []);

  const effectivePercent = minProfitOverGasPercentOverride ?? config?.minProfitOverGasPercent ?? 100;
  const effectiveConfig = useMemo(() => {
    if (!config) return null;
    if (minProfitOverGasPercentOverride != null) {
      const { minProfitOverGasUsd, ...rest } = config;
      return { ...rest, minProfitOverGasPercent: minProfitOverGasPercentOverride };
    }
    return config;
  }, [config, minProfitOverGasPercentOverride]);
  const minProfitUsd = useMemo(
    () => getMinProfitUsd(effectiveConfig, gasEstimateUsd ?? 0),
    [effectiveConfig, gasEstimateUsd]
  );

  return {
    config,
    gasEstimateUsd,
    minProfitUsd,
    minProfitOverGasPercent: effectivePercent,
    setMinProfitOverGasPercent: setMinProfitOverGasPercentOverride,
    signal,
    executeResult,
    loading,
    refreshConfig,
    refreshGasEstimate,
    refreshAll,
    checkSignal,
    runRoundTrip,
  };
}

export default useOtaStxMicroProfit;
