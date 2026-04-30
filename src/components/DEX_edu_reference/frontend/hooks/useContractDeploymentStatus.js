/**
 * useContractDeploymentStatus Hook
 * 
 * Hook for checking contract deployment status:
 * - Detects whether contracts are deployed.
 * - Provides standardized messages.
 * - Manages loading/error state.
 * 
 * @module useContractDeploymentStatus
 */

import { useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_MAP, getActiveNetwork } from '../../../../contract/contractMap';
import { getContractDeploymentMessage } from '../utils/contractDeploymentUtils';

/**
 * Hook for checking contract deployment status.
 * @param {object} opts
 * @param {'registration'|'auto'} opts.scope - feature to check (default: 'registration')
 * @returns {object} Status and messages for contract deployment
 */
export const useContractDeploymentStatus = (opts = {}) => {
  const scope = opts?.scope || 'registration';

  const [state, setState] = useState({
    isLoading: true,
    isNotDeployed: false,
    error: null,
    missingKeys: [],
  });

  useEffect(() => {
    let cancelled = false;

    const requirements =
      scope === 'auto'
        ? [
            'BITS_TOKEN',
            'AI_TRADING_ACCESS_CONTROL',
            'USER_VAULT',
            // Auto-mode requires these, but they are intentionally absent until deployed/configured.
            'OTA_POLICY_MANAGER',
            'OTA_AUTO_EXECUTOR',
          ]
        : ['BITS_TOKEN', 'AI_TRADING_ACCESS_CONTROL', 'USER_VAULT'];

    const RPC_FALLBACKS = [
      getActiveNetwork?.()?.rpcUrl,
      'https://bsc-dataseed1.binance.org',
      'https://bsc-dataseed2.binance.org',
      'https://bsc-dataseed3.binance.org',
    ].filter(Boolean);

    const getCodeWithFallback = async (address) => {
      for (const rpcUrl of RPC_FALLBACKS) {
        try {
          const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
          const code = await Promise.race([
            provider.getCode(address),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
          ]);
          if (code !== undefined) return code;
        } catch {
          // incearca urmatorul RPC
        }
      }
      // Toate RPC-urile au esuat (geo-block browser) — nu marcam ca nedeployat
      return 'RPC_UNAVAILABLE';
    };

    const run = async () => {
      try {
        const missing = [];

        for (const key of requirements) {
          const info = CONTRACT_MAP?.[key];
          if (!info?.address) {
            missing.push(key);
            continue;
          }
          const code = await getCodeWithFallback(info.address);
          // RPC_UNAVAILABLE = browser geo-blocked, nu stim starea reala — nu marcam ca missing
          if (code === 'RPC_UNAVAILABLE') continue;
          if (!code || code === '0x') missing.push(key);
        }

        if (!cancelled) {
          setState({
            isLoading: false,
            isNotDeployed: missing.length > 0,
            error: null,
            missingKeys: missing,
          });
        }
      } catch (e) {
        // Eroare generala — nu blocam UI-ul, presupunem deployed
        if (!cancelled) {
          setState({
            isLoading: false,
            isNotDeployed: false,
            error: null,
            missingKeys: [],
          });
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [scope]);

  const isDeployed = useMemo(() => !state.isNotDeployed, [state.isNotDeployed]);
  const isNotDeployed = state.isNotDeployed;

  const message = useMemo(() => {
    if (!isNotDeployed) return null;
    if (scope === 'auto') {
      return 'Auto Mode is not available yet: OTAPolicyManager/OTAAutoExecutor are not deployed/configured on BSC.';
    }
    return getContractDeploymentMessage('short');
  }, [isNotDeployed, scope]);

  const detailedMessage = useMemo(() => {
    if (!isNotDeployed) return null;
    if (scope === 'auto') {
      const missing = state.missingKeys?.length ? ` Missing: ${state.missingKeys.join(', ')}.` : '';
      return `Auto Mode (Mode 3) requires OTAPolicyManager and OTAAutoExecutor on BSC.${missing}`;
    }
    return getContractDeploymentMessage('detailed');
  }, [isNotDeployed, scope, state.missingKeys]);

  const title = useMemo(() => {
    if (!isNotDeployed) return null;
    if (scope === 'auto') return 'Auto Mode unavailable';
    return getContractDeploymentMessage('title');
  }, [isNotDeployed, scope]);

  const tooltip = useMemo(() => {
    if (!isNotDeployed) return null;
    if (scope === 'auto') return 'Auto Mode requires additional contracts deployed on BSC';
    return getContractDeploymentMessage('tooltip');
  }, [isNotDeployed, scope]);

  return {
    isDeployed,
    isNotDeployed,
    isLoading: state.isLoading,
    error: state.error,
    message,
    detailedMessage,
    title,
    tooltip,
    whatsNext: isNotDeployed && scope !== 'auto' ? getContractDeploymentMessage('whats_next') : null,
    missingKeys: state.missingKeys,
  };
};
