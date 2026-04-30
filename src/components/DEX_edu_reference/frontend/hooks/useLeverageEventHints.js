/**
 * Hint-uri de refresh din evenimente LeverageTrading (BSC JSON-RPC).
 * Nu există evenimente on-chain pentru add/remove collateral în contract — acolo rămâne doar refetch post-tx + polling.
 * Debounce pentru a evita furtuni de refetch când vin mai multe log-uri.
 */
import { useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { getActiveNetwork } from '../../../../contract/contractMap';

function getReadProvider() {
  const rpcUrl = getActiveNetwork?.()?.rpcUrl || 'https://bsc-dataseed1.binance.org';
  return new ethers.providers.JsonRpcProvider(rpcUrl);
}

/** Exportat pentru teste — același debounce ca în hook */
export function createDebouncedRefetchHint(ms, run) {
  let timer = null;
  return {
    schedule() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        run();
      }, ms);
    },
    cancel() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    },
  };
}

/**
 * @param {object} p
 * @param {boolean} p.enabled
 * @param {string} p.contractAddress
 * @param {any[]} p.abi
 * @param {string} [p.walletAddress]
 * @param {() => void} p.onHint debounced refetch silent
 */
export function useLeverageEventHints({ enabled, contractAddress, abi, walletAddress, onHint }) {
  const onHintRef = useRef(onHint);
  useEffect(() => {
    onHintRef.current = onHint;
  }, [onHint]);

  useEffect(() => {
    if (!enabled || !contractAddress || !abi?.length || !walletAddress) return undefined;

    const provider = getReadProvider();
    let contract;
    try {
      contract = new ethers.Contract(contractAddress, abi, provider);
    } catch {
      return undefined;
    }

    const deb = createDebouncedRefetchHint(450, () => onHintRef.current?.());
    const match = (user) =>
      user &&
      walletAddress &&
      String(user).toLowerCase() === String(walletAddress).toLowerCase();

    const onPosOpen = (positionId, user) => {
      if (match(user)) deb.schedule();
    };
    const onPosClose = (positionId, user) => {
      if (match(user)) deb.schedule();
    };
    const onCfdOpen = (positionId, user) => {
      if (match(user)) deb.schedule();
    };
    const onCfdClose = (positionId, user) => {
      if (match(user)) deb.schedule();
    };

    try {
      contract.on('PositionOpened', onPosOpen);
      contract.on('PositionClosed', onPosClose);
      contract.on('CFDPositionOpened', onCfdOpen);
      contract.on('CFDPositionClosed', onCfdClose);
    } catch {
      deb.cancel();
      return undefined;
    }

    return () => {
      deb.cancel();
      try {
        contract.off('PositionOpened', onPosOpen);
        contract.off('PositionClosed', onPosClose);
        contract.off('CFDPositionOpened', onCfdOpen);
        contract.off('CFDPositionClosed', onCfdClose);
      } catch {
        /* ignore */
      }
    };
  }, [enabled, contractAddress, abi, walletAddress]);
}
