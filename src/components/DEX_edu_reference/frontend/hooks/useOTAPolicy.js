/**
 * 🔐 useOTAPolicy Hook
 * 
 * Production-first:
 * - NU folosește deployments localhost.
 * - Citește/scrie prin backend (`/api/ai-trading/policy/*`) care returnează tx data,
 *   iar semnarea se face în MetaMask (fără custody pe server).
 * 
 * @module useOTAPolicy
 */

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from './useWallet';
import { toast } from 'react-toastify';
import { getPolicy, setPolicy as setPolicyOnChain, setAllowlistEnforcement, setTokenAllowed } from '../services/otaPolicyService';

export const useOTAPolicy = () => {
  const wallet = useWallet();
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [txState, setTxState] = useState(null); // { status: 'idle' | 'pending' | 'success' | 'error', hash: null, error: null }
  const [error, setError] = useState(null);

  /**
   * Load policy (read-only) via backend → chain.
   */
  const loadPolicy = useCallback(async (userAddress) => {
    if (!userAddress) {
      setPolicy(null);
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const policyData = await getPolicy(userAddress);

      const loadedPolicy = {
        enabled: !!policyData?.enabled,
        maxSlippageBps: Number(policyData?.maxSlippageBps || 0),
        maxTradeSize: policyData?.maxTradeSize || '0',
        maxTradeSizeFormatted: policyData?.maxTradeSizeFormatted || '0',
        cooldownSeconds: Number(policyData?.cooldownSeconds ?? policyData?.minDelaySeconds ?? 0),
        minDelaySeconds: Number(policyData?.cooldownSeconds ?? policyData?.minDelaySeconds ?? 0),
        expiresAt: 0,
        lastTradeAt: Number(policyData?.lastTradeAt || 0),
        enforceTokenAllowlist: !!policyData?.enforceTokenAllowlist,
        enforcePairAllowlist: !!policyData?.enforcePairAllowlist,
        maxDailyLossBps: Number(policyData?.maxSlippageBps || 0),
        allowedTokens: [],
        /** Aliniat cu DEFAULT_LLM_TUNING.minConfidenceToOpen (policy on-chain nu stochează acest câmp). */
        minConfidence: 0.65,
      };

      setPolicy(loadedPolicy);
      return loadedPolicy;
    } catch (err) {
      console.error('[useOTAPolicy] Error loading policy:', err);
      setError(err?.message || 'Failed to load policy');
      setPolicy(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Save policy to chain (MetaMask signing), via backend tx preparation.
   */
  const savePolicy = useCallback(async (userAddress, policyData) => {
    if (!userAddress) {
      throw new Error('User address missing');
    }

    try {
      setSaving(true);
      setError(null);
      setTxState({ status: 'pending', hash: null, error: null });

      const enabled = policyData.enabled ?? false;
      const maxSlippageBps = policyData.maxSlippageBps || policyData.maxDailyLossBps || 300;
      const maxTradeSize = policyData.maxTradeSize || undefined;
      const cooldownSeconds = policyData.cooldownSeconds ?? policyData.minDelaySeconds ?? 60;

      const tx1 = await setPolicyOnChain(userAddress, {
        enabled,
        maxSlippageBps,
        maxTradeSize,
        cooldownSeconds
      });

      setTxState({ status: 'pending', hash: tx1?.hash || null, error: null });
      toast.info('Transaction submitted. Waiting for confirmation...', { autoClose: 3000 });

      // 2. Set allowlist enforcement
      if (policyData.enforceTokenAllowlist !== undefined || policyData.enforcePairAllowlist !== undefined) {
        const tx2 = await setAllowlistEnforcement(
          userAddress,
          policyData.enforceTokenAllowlist ?? false,
          policyData.enforcePairAllowlist ?? false
        );
        if (tx2?.hash) setTxState({ status: 'pending', hash: tx2.hash, error: null });
      }

      // 3. Update token allowlist (each change requires a MetaMask signature)
      if (policyData.allowedTokens && Array.isArray(policyData.allowedTokens)) {
        for (const token of policyData.allowedTokens) {
          if (token.address && token.allowed !== undefined) {
            // eslint-disable-next-line no-await-in-loop
            const tx3 = await setTokenAllowed(userAddress, token.address, !!token.allowed);
            if (tx3?.hash) setTxState({ status: 'pending', hash: tx3.hash, error: null });
          }
        }
      }

      setTxState({ status: 'success', hash: tx1?.hash || null, error: null });
      toast.success('Policy saved successfully!', { autoClose: 3000 });

      // Reload policy to reflect changes
      await loadPolicy(userAddress);

      return tx1?.hash || null;
    } catch (err) {
      console.error('[useOTAPolicy] Error saving policy:', err);
      const errorMsg = err.message || 'Failed to save policy';
      setError(errorMsg);
      setTxState({ status: 'error', hash: null, error: errorMsg });
      
      if (err.code === 4001) {
        toast.error('Transaction rejected by user');
      } else {
        toast.error(`Failed to save policy: ${errorMsg}`);
      }
      
      throw err;
    } finally {
      setSaving(false);
    }
  }, [loadPolicy]);

  return {
    contract: null,
    contractAddress: null,
    policy,
    loading,
    saving,
    txState,
    error,
    loadPolicy,
    savePolicy,
    isReady: !!wallet?.provider && !!wallet?.walletAddress,
  };
};

export default useOTAPolicy;
