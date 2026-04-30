/**
 * Consolidated polling for OTA Auto: auto-execution status (incl. otaAutoClarity + latest* telemetry) + Level5 guards + policy/get mirror.
 * Single interval; focus refetch skipped if last fetch < 8s; transient skip window on HTTP 429 (backoff).
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getApiBaseUrl } from '../../config/apiEndpoints.js';
import { getAutoExecutionStatus } from '../services/aiTradingApiService';
import { getPolicy } from '../services/otaPolicyService';

const OtaAutoDashboardContext = createContext(null);

const MIN_FOCUS_MS = 8000;
const BASE_INTERVAL_MS = 30000;
const MAX_BACKOFF_MS = 120000;

export function OtaAutoDashboardProvider({ walletAddress, enabled, children }) {
  const [bundle, setBundle] = useState({
    autoStatus: null,
    /** Când getAutoExecutionStatus reușește, null. Altfel { message, code?, status? } fără a marca tot fetchError (Promise.all reușește). */
    autoStatusError: null,
    policy: null,
    guards: { level66: null, level73: null, level74: null, level69: null },
    lastFetchAt: null,
    fetchError: null,
  });
  const lastFetchAtMs = useRef(0);
  const backoffMs = useRef(BASE_INTERVAL_MS);
  const skipUntilMs = useRef(0);

  const runFetch = useCallback(
    async (reason) => {
      if (!enabled || !walletAddress?.trim()) return;
      const now = Date.now();
      if (now < skipUntilMs.current) return;
      if (reason === 'focus' && now - lastFetchAtMs.current < MIN_FOCUS_MS) return;
      try {
        const apiBase = getApiBaseUrl();
        let autoStatusError = null;
        const [autoStatus, policy, level66, level73, level74, level69] = await Promise.all([
          getAutoExecutionStatus(walletAddress).catch((e) => {
            autoStatusError = {
              message: e?.message || String(e),
              code: e?.code,
              status: e?.failedStatus != null ? e.failedStatus : e?.status,
            };
            return null;
          }),
          getPolicy(walletAddress).catch(() => null),
          fetch(`${apiBase}/ai-trading/level5/level66/status`).then((r) => {
            if (r.status === 429) throw Object.assign(new Error('429'), { status: 429 });
            return r.ok ? r.json() : null;
          }),
          fetch(`${apiBase}/ai-trading/level5/level73/status`).then((r) => {
            if (r.status === 429) throw Object.assign(new Error('429'), { status: 429 });
            return r.ok ? r.json() : null;
          }),
          fetch(`${apiBase}/ai-trading/level5/level74/status`).then((r) => {
            if (r.status === 429) throw Object.assign(new Error('429'), { status: 429 });
            return r.ok ? r.json() : null;
          }),
          fetch(`${apiBase}/ai-trading/level5/level69/status`).then((r) => {
            if (r.status === 429) throw Object.assign(new Error('429'), { status: 429 });
            return r.ok ? r.json() : null;
          }),
        ]);
        lastFetchAtMs.current = Date.now();
        backoffMs.current = BASE_INTERVAL_MS;
        setBundle({
          autoStatus,
          autoStatusError,
          policy,
          guards: { level66, level73, level74, level69 },
          lastFetchAt: new Date().toISOString(),
          fetchError: null,
        });
      } catch (e) {
        const is429 = e?.status === 429 || String(e?.message || '').includes('429');
        if (is429) {
          backoffMs.current = Math.min(MAX_BACKOFF_MS, Math.max(BASE_INTERVAL_MS, backoffMs.current * 2));
          skipUntilMs.current = Date.now() + backoffMs.current;
        }
        setBundle((prev) => ({
          ...prev,
          fetchError: e?.message || String(e),
        }));
      }
    },
    [enabled, walletAddress]
  );

  useEffect(() => {
    if (!enabled || !walletAddress?.trim()) {
      setBundle({
        autoStatus: null,
        autoStatusError: null,
        policy: null,
        guards: { level66: null, level73: null, level74: null, level69: null },
        lastFetchAt: null,
        fetchError: null,
      });
      skipUntilMs.current = 0;
      backoffMs.current = BASE_INTERVAL_MS;
      return undefined;
    }
    runFetch('mount');
    const id = window.setInterval(() => runFetch('interval'), BASE_INTERVAL_MS);
    const onFocus = () => runFetch('focus');
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [enabled, walletAddress, runFetch]);

  const value = useMemo(
    () => ({
      ...bundle,
      refresh: () => runFetch('manual'),
    }),
    [bundle, runFetch]
  );

  return <OtaAutoDashboardContext.Provider value={value}>{children}</OtaAutoDashboardContext.Provider>;
}

export function useOtaAutoDashboard() {
  return useContext(OtaAutoDashboardContext);
}
