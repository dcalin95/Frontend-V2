/**
 * Hook: profit total în USD din pozițiile închise (OTA + Direct Entry).
 * Folosește closedPositionsProfitService pentru extragere, calcul și conversie în USD.
 *
 * @module useClosedPositionsProfitUsd
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getClosedPositionsProfitUsd } from '../services/closedPositionsProfitService';
import useWallet from '../hooks/useWallet.jsx';
import {
  clearOtaWalletSession,
  ensureOtaWalletForApiIfNeeded,
  getOtaWalletAuthToken,
  validateCachedOtaWalletSession,
} from '../utils/otaWalletSession';

const REFRESH_MS = 30000;

/**
 * @param {string} walletAddress - Adresa wallet
 * @param {{ refreshIntervalMs?: number, autoEnsureSession?: boolean }} opts
 * @returns {{ totalProfitUsd: number, fromExecutions: number, fromDirectEntry: number, executionsDetail: array, directEntryDetail: array, loading: boolean, error: string | null, authRequired: boolean, refresh: function }}
 */
export function useClosedPositionsProfitUsd(walletAddress, opts = {}) {
  const { signer } = useWallet();
  const signerRef = useRef(signer);
  signerRef.current = signer;
  const intervalMs = opts.refreshIntervalMs ?? REFRESH_MS;
  const autoEnsureSession = opts.autoEnsureSession !== false;
  const [totalProfitUsd, setTotalProfitUsd] = useState(0);
  const [fromExecutions, setFromExecutions] = useState(0);
  const [fromDirectEntry, setFromDirectEntry] = useState(0);
  const [executionsDetail, setExecutionsDetail] = useState([]);
  const [directEntryDetail, setDirectEntryDetail] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authRequired, setAuthRequired] = useState(false);

  const fetchProfit = useCallback(async () => {
    if (!walletAddress) {
      setTotalProfitUsd(0);
      setFromExecutions(0);
      setFromDirectEntry(0);
      setExecutionsDetail([]);
      setDirectEntryDetail([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    setAuthRequired(false);
    try {
      if (!autoEnsureSession) {
        const existingToken = getOtaWalletAuthToken();
        if (!existingToken) {
          setLoading(false);
          setAuthRequired(true);
          return;
        }
        const stillValid = await validateCachedOtaWalletSession(walletAddress);
        if (stillValid === false) {
          clearOtaWalletSession();
          setLoading(false);
          setAuthRequired(true);
          return;
        }
      } else if (walletAddress) {
        const s = signerRef.current;
        if (s) {
          try {
            await ensureOtaWalletForApiIfNeeded(s, walletAddress);
          } catch (_) {
            /* semnătură refuzată — continuă; erorile OTA vor fi mapate în service */
          }
        }
      }
      const result = await getClosedPositionsProfitUsd(walletAddress, {
        executionLimit: 50,
        closedLimit: 50
      });
      setTotalProfitUsd(result.totalProfitUsd ?? 0);
      setFromExecutions(result.fromExecutions ?? 0);
      setFromDirectEntry(result.fromDirectEntry ?? 0);
      setExecutionsDetail(Array.isArray(result.executionsDetail) ? result.executionsDetail : []);
      setDirectEntryDetail(Array.isArray(result.directEntryDetail) ? result.directEntryDetail : []);
      if (result.errors?.length) setError(result.errors.join('; '));
    } catch (e) {
      setTotalProfitUsd(0);
      setFromExecutions(0);
      setFromDirectEntry(0);
      setExecutionsDetail([]);
      setDirectEntryDetail([]);
      setError(e?.message || 'Failed to load profit');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchProfit();
    const t = setInterval(fetchProfit, intervalMs);
    return () => clearInterval(t);
  }, [fetchProfit, intervalMs]);

  return {
    totalProfitUsd,
    fromExecutions,
    fromDirectEntry,
    executionsDetail,
    directEntryDetail,
    loading,
    error,
    authRequired,
    refresh: fetchProfit
  };
}

export default useClosedPositionsProfitUsd;
