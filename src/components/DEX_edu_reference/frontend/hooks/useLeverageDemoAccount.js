/**
 * useLeverageDemoAccount – status, open, get/update demo account (30-day, per user + wallet).
 * Requires: user authenticated (useDexAuth), wallet connected (useWallet).
 * Fallback: if backend fails (e.g. 401), uses localStorage for same key (userId + walletAddress).
 */

import { useState, useCallback, useEffect } from 'react';
import { useDexAuth } from '../context/DexAuthContext';
import useWallet from './useWallet';
import * as leverageDemoApi from '../services/leverageDemoApiService';
import { DEMO_ACCOUNT_DURATION_DAYS, DEMO_DEFAULT_VAULT_BALANCES } from '../constants/leverageConstants';

const STORAGE_PREFIX = 'leverage_demo_';

/** Normalizează chei simbol (USDT vs usdt) pentru citire API/JSON */
function normalizeVaultBalanceKeys(vb) {
  if (!vb || typeof vb !== 'object') return {};
  const out = {};
  for (const [k, v] of Object.entries(vb)) {
    const key = String(k).toUpperCase();
    if (v == null) continue;
    out[key] = typeof v === 'string' ? v : String(v);
  }
  return out;
}

/** Ensure account has { vaultBalances: object, positions: array } from API or storage */
function normalizeAccount(acc) {
  if (!acc) return null;
  const raw = acc.vaultBalances && typeof acc.vaultBalances === 'object' ? acc.vaultBalances : {};
  const vaultBalances = normalizeVaultBalanceKeys(raw);
  const positions = Array.isArray(acc.positions) ? acc.positions : [];
  return { vaultBalances, positions };
}

function storageKey(userId, walletAddress) {
  if (!userId || !walletAddress) return null;
  return `${STORAGE_PREFIX}${String(userId)}_${String(walletAddress).toLowerCase()}`;
}

function loadFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const expiresAt = data.expiresAt ? new Date(data.expiresAt).getTime() : 0;
    return {
      ...data,
      isExpired: expiresAt <= Date.now(),
      daysLeft: Math.max(0, Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000))),
    };
  } catch {
    return null;
  }
}

function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('[useLeverageDemoAccount] localStorage set failed', e);
  }
}

export function useLeverageDemoAccount() {
  const { user, isAuthenticated } = useDexAuth();
  const { walletAddress } = useWallet();
  const userId = user?.id ?? null;
  const effectiveWallet = walletAddress ? String(walletAddress).trim().toLowerCase() : null;

  const [status, setStatus] = useState({
    hasAccount: false,
    isExpired: false,
    daysLeft: null,
    openedAt: null,
    expiresAt: null,
  });
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useBackend, setUseBackend] = useState(true);

  const fetchStatus = useCallback(async () => {
    if (!userId || !effectiveWallet) {
      setStatus({ hasAccount: false, isExpired: false, daysLeft: null, openedAt: null, expiresAt: null });
      setAccount(null);
      return;
    }
    setError(null);
    if (useBackend) {
      try {
        const data = await leverageDemoApi.getDemoStatus(effectiveWallet);
        setStatus({
          hasAccount: data.hasAccount || false,
          isExpired: data.isExpired || false,
          daysLeft: data.daysLeft ?? null,
          openedAt: data.openedAt ?? null,
          expiresAt: data.expiresAt ?? null,
        });
        if (data.hasAccount && !data.isExpired) {
          // Placeholder până la GET account: altfel isDemoMode e true dar demoAccount e null → solduri 0 în UI.
          setAccount((prev) =>
            prev == null
              ? normalizeAccount({ vaultBalances: DEMO_DEFAULT_VAULT_BALANCES, positions: [] })
              : prev
          );
          const accRes = await leverageDemoApi.getDemoAccount(effectiveWallet);
          const loaded = normalizeAccount(accRes?.account ?? null);
          setAccount((prev) => loaded ?? prev);
        } else {
          setAccount(null);
        }
        return;
      } catch (err) {
        if (err.status === 401) {
          setUseBackend(false);
          // fall through to localStorage
        } else {
          setError(err.message || 'Failed to load demo status');
          return;
        }
      }
    }
    const key = storageKey(userId, effectiveWallet);
    const local = key ? loadFromStorage(key) : null;
    if (local) {
      setStatus({
        hasAccount: true,
        isExpired: local.isExpired,
        daysLeft: local.daysLeft,
        openedAt: local.openedAt,
        expiresAt: local.expiresAt,
      });
      setAccount(normalizeAccount({ vaultBalances: local.vaultBalances, positions: local.positions }));
    } else {
      setStatus({ hasAccount: false, isExpired: false, daysLeft: null, openedAt: null, expiresAt: null });
      setAccount(null);
    }
  }, [userId, effectiveWallet, useBackend]);

  const openDemoAccount = useCallback(async () => {
    if (!userId || !effectiveWallet) throw new Error('User and wallet required');
    setLoading(true);
    setError(null);
    try {
      if (useBackend) {
        const data = await leverageDemoApi.openDemoAccount(effectiveWallet);
        setStatus({
          hasAccount: true,
          isExpired: data.account?.isExpired || false,
          daysLeft: data.account?.daysLeft ?? DEMO_ACCOUNT_DURATION_DAYS,
          openedAt: data.account?.openedAt ?? null,
          expiresAt: data.account?.expiresAt ?? null,
        });
        setAccount(normalizeAccount(data.account ?? null));
        return data;
      }
      const key = storageKey(userId, effectiveWallet);
      const openedAt = new Date();
      const expiresAt = new Date(openedAt.getTime() + DEMO_ACCOUNT_DURATION_DAYS * 24 * 60 * 60 * 1000);
      const data = {
        openedAt: openedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        vaultBalances: { ...DEMO_DEFAULT_VAULT_BALANCES },
        positions: [],
      };
      saveToStorage(key, data);
      setStatus({
        hasAccount: true,
        isExpired: false,
        daysLeft: DEMO_ACCOUNT_DURATION_DAYS,
        openedAt: data.openedAt,
        expiresAt: data.expiresAt,
      });
      setAccount(normalizeAccount({ vaultBalances: data.vaultBalances, positions: data.positions }));
      return { success: true, account: data };
    } catch (err) {
      if (err.status === 401 && userId && effectiveWallet) {
        setUseBackend(false);
        const key = storageKey(userId, effectiveWallet);
        const openedAt = new Date();
        const expiresAt = new Date(openedAt.getTime() + DEMO_ACCOUNT_DURATION_DAYS * 24 * 60 * 60 * 1000);
        const data = {
          openedAt: openedAt.toISOString(),
          expiresAt: expiresAt.toISOString(),
          vaultBalances: { ...DEMO_DEFAULT_VAULT_BALANCES },
          positions: [],
        };
        saveToStorage(key, data);
        setStatus({
          hasAccount: true,
          isExpired: false,
          daysLeft: DEMO_ACCOUNT_DURATION_DAYS,
          openedAt: data.openedAt,
          expiresAt: data.expiresAt,
        });
        setAccount(normalizeAccount({ vaultBalances: data.vaultBalances, positions: data.positions }));
        setError(null);
        return { success: true, account: data };
      }
      setError(err.message || 'Failed to open demo account');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, effectiveWallet, useBackend]);

  const updateDemoAccount = useCallback(
    async (updates) => {
      if (!userId || !effectiveWallet) return;
      const nextVault = updates.vaultBalances ?? account?.vaultBalances ?? {};
      const nextPositions = updates.positions ?? account?.positions ?? [];
      const applyLocal = () => {
        const key = storageKey(userId, effectiveWallet);
        const current = loadFromStorage(key) || {};
        const next = {
          ...current,
          vaultBalances: nextVault,
          positions: nextPositions,
        };
        saveToStorage(key, next);
        setAccount(normalizeAccount({ vaultBalances: nextVault, positions: nextPositions }));
      };
      if (useBackend) {
        try {
          const next = { vaultBalances: nextVault, positions: nextPositions };
          const data = await leverageDemoApi.updateDemoAccount(effectiveWallet, next);
          setAccount(normalizeAccount(data.account ?? null));
          return data;
        } catch (err) {
          if (err.status === 401) {
            setUseBackend(false);
            applyLocal();
            setError(null);
            return { success: true, account: normalizeAccount({ vaultBalances: nextVault, positions: nextPositions }) };
          }
          setError(err.message || 'Failed to update demo account');
          throw err;
        }
      }
      applyLocal();
    },
    [userId, effectiveWallet, useBackend, account]
  );

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const isDemoMode = status.hasAccount && !status.isExpired;
  const isDemoExpired = status.hasAccount && status.isExpired;

  return {
    isDemoMode,
    isDemoExpired,
    hasAccount: status.hasAccount,
    daysLeft: status.daysLeft,
    openedAt: status.openedAt,
    expiresAt: status.expiresAt,
    demoAccount: account,
    loading,
    error,
    openDemoAccount,
    refreshDemoStatus: fetchStatus,
    updateDemoAccount,
    canUseDemo: !!userId && !!effectiveWallet,
    needsAuth: !isAuthenticated || !userId,
    needsWallet: !effectiveWallet,
  };
}

export default useLeverageDemoAccount;
