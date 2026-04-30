/**
 * useLeverageTrading – read/write LeverageTrading contract (BSC).
 * Requires REACT_APP_LEVERAGE_TRADING_ADDRESS or LEVERAGE_TRADING_ADDRESS in runtime-config.json.
 */
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_MAP, getActiveNetwork } from '../../../../contract/contractMap';
import { pickEvmProvider } from '../../utils/evmProviderResolver.js';
import useWallet from './useWallet.jsx';
import { LIVE_POSITIONS_POLL_MS } from '../constants/leverageLiveRefresh';
import {
  CFD_ASSETS,
  CFD_SYMBOLS,
  EXPECTED_LEVERAGE_CHAIN_ID,
  EXPECTED_LEVERAGE_CHAIN_NAME,
} from '../constants/leverageConstants';
import { parseCFDPosition, parseSpotPosition } from '../utils/leverageUtils';
import { normalizeTxError } from '../utils/leverageTxErrors';
import { buildLeverageChainGate } from '../utils/leverageChainGate';
import { emitLeverageActivity } from '../utils/leverageActivityBus';
import { LEVERAGE_ACTIVITY_KIND } from '../utils/leverageActivityTypes';
import { useLeverageEventHints } from './useLeverageEventHints';

/** Așteaptă minare și detectează revert (status 0). */
async function safeTransactionWait(tx) {
  const receipt = await tx.wait();
  if (receipt && receipt.status === 0) {
    const h = receipt.transactionHash;
    throw new Error(
      `Transaction failed on-chain (reverted). ${h ? `Check explorer for ${h}.` : ''}`.trim()
    );
  }
  return receipt;
}

async function requireCorrectChainForWrites(signer) {
  const net = await signer.provider.getNetwork();
  const cid =
    typeof net.chainId === 'number' ? net.chainId : parseInt(String(net.chainId), 10);
  if (!Number.isFinite(cid) || cid !== EXPECTED_LEVERAGE_CHAIN_ID) {
    throw new Error(
      `Wrong network: wallet is on chain ${Number.isFinite(cid) ? cid : 'unknown'}. Switch to ${EXPECTED_LEVERAGE_CHAIN_NAME} (chain ${EXPECTED_LEVERAGE_CHAIN_ID}) in your wallet.`
    );
  }
}

function rethrowNormalizedWriteError(err) {
  const { userMessage } = normalizeTxError(err);
  throw new Error(userMessage);
}

function phaseFromNormalizedError(err) {
  const k = normalizeTxError(err).kind;
  if (k === 'rejected') return 'rejected';
  if (k === 'onchain_fail') return 'reverted';
  return 'failed';
}

function emitLiveFailed(kind, err, extra = {}) {
  const n = normalizeTxError(err);
  emitLeverageActivity({
    scope: 'live',
    kind,
    phase: phaseFromNormalizedError(err),
    errorSummary: n.userMessage,
    at: new Date().toISOString(),
    ...extra,
  });
}

const BPS_DENOMINATOR = 10000;

/** Token addresses pentru vault balance: BITS, USDT, USDC, EURS, EURC (USD/EUR) */
function getVaultTokenAddresses() {
  const bits = CONTRACT_MAP?.BITS_TOKEN?.address || CONTRACT_MAP?.BITS?.address;
  const usdt = CONTRACT_MAP?.USDT?.address;
  const usdc = CONTRACT_MAP?.USDC?.address;
  const eurs = CONTRACT_MAP?.EURS?.address;
  const eurc = CONTRACT_MAP?.EURC?.address;
  return [bits, usdt, usdc, eurs, eurc].filter((a) => a && String(a).length > 10);
}

/** Token decimals */
const TOKEN_DECIMALS = {
  [CONTRACT_MAP?.BITS_TOKEN?.address]: 18,
  [CONTRACT_MAP?.BITS?.address]: 18,
  [CONTRACT_MAP?.USDT?.address]: CONTRACT_MAP?.USDT?.decimals ?? 18,
  [CONTRACT_MAP?.USDC?.address]: CONTRACT_MAP?.USDC?.decimals ?? 18,
  [CONTRACT_MAP?.EURS?.address]: CONTRACT_MAP?.EURS?.decimals ?? 18,
  [CONTRACT_MAP?.EURC?.address]: CONTRACT_MAP?.EURC?.decimals ?? 18,
};

function getReadProvider() {
  const rpcUrl = getActiveNetwork?.()?.rpcUrl || 'https://bsc-dataseed1.binance.org';
  return new ethers.providers.JsonRpcProvider(rpcUrl);
}

function getTokenDecimals(tokenAddress) {
  return TOKEN_DECIMALS[tokenAddress] ?? 18;
}

export function useLeverageTrading() {
  const { walletAddress, provider, isConnected, connectWallet } = useWallet();
  const [positions, setPositions] = useState([]);
  const [cfdPositions, setCfdPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vaultBalanceMap, setVaultBalanceMap] = useState({});
  const [configuredCFDAssets, setConfiguredCFDAssets] = useState(CFD_ASSETS);
  const [spotAvailable, setSpotAvailable] = useState(false);
  /** ms epoch — last successful on-chain positions read (spot + CFD + vault) */
  const [positionsLastSyncedAt, setPositionsLastSyncedAt] = useState(null);
  /** undefined = încă nu am citit eth_chainId; null = citire eșuată */
  const [connectedChainId, setConnectedChainId] = useState(undefined);
  /** Monotonic id — stale async refetch results must not overwrite newer state */
  const refetchGenRef = useRef(0);

  const info = CONTRACT_MAP?.LEVERAGE_TRADING;
  const contractAddress = (info?.address || '').trim();
  const contractReady = !!contractAddress && !!info?.abi;

  /** Returns vault balances map without setState — for refetch stale-guard batching */
  const loadVaultBalanceMap = useCallback(async () => {
    const uv = CONTRACT_MAP?.USER_VAULT;
    if (!walletAddress || !uv?.address || !uv?.abi) return {};
    try {
      const readProvider = getReadProvider();
      const uvContract = new ethers.Contract(uv.address, uv.abi, readProvider);
      const tokens = getVaultTokenAddresses();
      const map = {};
      for (const token of tokens) {
        const bal = await uvContract.getBalance(walletAddress, token);
        map[token] = bal?.toString?.() || '0';
      }
      return map;
    } catch {
      return {};
    }
  }, [walletAddress]);

  const fetchVaultBalances = useCallback(async () => {
    const map = await loadVaultBalanceMap();
    setVaultBalanceMap(map);
  }, [loadVaultBalanceMap]);

  const getVaultBalance = useCallback(
    (tokenAddress) => vaultBalanceMap[tokenAddress] || '0',
    [vaultBalanceMap]
  );

  const refetch = useCallback(
    async (opts = {}) => {
      const silent = opts.silent === true;
      const gen = ++refetchGenRef.current;
      const isLatest = () => gen === refetchGenRef.current;

      if (!contractReady || !walletAddress) {
        if (!isLatest()) return;
        setPositions([]);
        setCfdPositions([]);
        if (!silent) setPositionsLastSyncedAt(null);
        return;
      }
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const readProvider = getReadProvider();
        const contract = new ethers.Contract(contractAddress, info.abi, readProvider);

        try {
          const pool = await contract.lendingPool();
          if (!isLatest()) return;
          setSpotAvailable(pool && pool !== ethers.constants.AddressZero && pool !== '0x0000000000000000000000000000000000000000');
        } catch {
          if (!isLatest()) return;
          setSpotAvailable(false);
        }

        try {
          const ids = await contract.userPositions(walletAddress);
          const list = [];
          for (let i = 0; i < ids.length; i++) {
            try {
              const id = ids[i];
              const pos = await contract.getPosition(id);
              const parsed = parseSpotPosition(pos);
              if (parsed && parsed.isActive) list.push(parsed);
            } catch (_) {
              // skip single position (e.g. decode / RPC) so one bad position doesn't clear the list
            }
          }
          if (!isLatest()) return;
          setPositions(list);
        } catch {
          if (!isLatest()) return;
          setPositions([]);
        }

        try {
          const cfdIds = await contract.userCFDPositions(walletAddress);
          const cfdList = [];
          const assetIdToIndex = {};
          for (let i = 0; i < CFD_SYMBOLS.length; i++) {
            const idBytes32 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(CFD_SYMBOLS[i]));
            assetIdToIndex[idBytes32] = i;
          }
          for (let i = 0; i < cfdIds.length; i++) {
            const cfd = await contract.getCFDPosition(cfdIds[i]);
            const aid = cfd.assetId ?? cfd[2];
            const assetNum = assetIdToIndex[aid] ?? 0;
            const label = CFD_ASSETS[assetNum]?.label ?? `Asset ${assetNum}`;
            const parsed = parseCFDPosition(cfd, label, assetNum);
            if (parsed && parsed.isActive) cfdList.push(parsed);
          }
          if (!isLatest()) return;
          setCfdPositions(cfdList);
        } catch {
          if (!isLatest()) return;
          setCfdPositions([]);
        }

        const vMap = await loadVaultBalanceMap();
        if (!isLatest()) return;
        setVaultBalanceMap(vMap);
        setPositionsLastSyncedAt(Date.now());
      } catch (e) {
        if (!isLatest()) return;
        if (!silent) {
          setError(e?.message || 'Error loading positions');
          setPositions([]);
          setCfdPositions([]);
        } else if (typeof console !== 'undefined' && console.warn) {
          console.warn('[useLeverageTrading] silent refetch failed', e?.message);
        }
      } finally {
        if (!silent && gen === refetchGenRef.current) setLoading(false);
      }
    },
    [contractReady, contractAddress, walletAddress, info?.abi, loadVaultBalanceMap],
  );

  useEffect(() => {
    refetch({ silent: false });
  }, [refetch]);

  /** Sincronizare chain din wallet (EIP-1193) — UI wrong-chain + listener chainChanged */
  useEffect(() => {
    if (!isConnected || !walletAddress) {
      setConnectedChainId(undefined);
      return undefined;
    }
    const raw = pickEvmProvider();
    if (!raw?.request) {
      setConnectedChainId(null);
      return undefined;
    }
    let cancelled = false;
    const readChain = async () => {
      try {
        const hex = await raw.request({ method: 'eth_chainId' });
        const id = parseInt(hex, 16);
        if (!cancelled) setConnectedChainId(Number.isFinite(id) ? id : null);
      } catch {
        if (!cancelled) setConnectedChainId(null);
      }
    };
    readChain();
    const onChain = (chainHex) => {
      try {
        const id = parseInt(String(chainHex), 16);
        setConnectedChainId(Number.isFinite(id) ? id : null);
      } catch {
        setConnectedChainId(null);
      }
    };
    raw.on?.('chainChanged', onChain);
    return () => {
      cancelled = true;
      raw.removeListener?.('chainChanged', onChain);
    };
  }, [isConnected, walletAddress]);

  /**
   * All contract writes use the same signer path: EIP-1193 provider from pickEvmProvider() (SSOT),
   * then ethers Web3Provider.getSigner(). Avoids mixing wagmi transport vs injected for open vs close.
   */
  const getSignerForWrites = useCallback(() => {
    const raw = pickEvmProvider();
    if (raw) return new ethers.providers.Web3Provider(raw).getSigner();
    if (!provider || !walletAddress) {
      throw new Error('No EVM wallet provider — connect a compatible wallet (e.g. MetaMask) on BSC.');
    }
    return new ethers.providers.Web3Provider(provider).getSigner();
  }, [provider, walletAddress]);

  const openPosition = useCallback(
    async (collateralToken, borrowedToken, collateralAmountWei, leverageRatioBps) => {
      if (!contractReady) throw new Error('Leverage contract not configured');
      try {
        const signer = getSignerForWrites();
        await requireCorrectChainForWrites(signer);
        const iface = new ethers.utils.Interface(info.abi);
        const data = iface.encodeFunctionData('openLeveragePosition', [
          collateralToken,
          borrowedToken,
          collateralAmountWei,
          leverageRatioBps,
        ]);
        const tx = await signer.sendTransaction({
          to: contractAddress,
          data,
          gasLimit: 600000,
        });
        emitLeverageActivity({
          scope: 'live',
          kind: LEVERAGE_ACTIVITY_KIND.SPOT_OPEN,
          phase: 'submitted',
          txHash: tx.hash,
          at: new Date().toISOString(),
        });
        await safeTransactionWait(tx);
        emitLeverageActivity({
          scope: 'live',
          kind: LEVERAGE_ACTIVITY_KIND.SPOT_OPEN,
          phase: 'confirmed',
          txHash: tx.hash,
          at: new Date().toISOString(),
        });
        refetch().catch(() => {});
        return tx;
      } catch (e) {
        emitLiveFailed(LEVERAGE_ACTIVITY_KIND.SPOT_OPEN, e);
        rethrowNormalizedWriteError(e);
      }
    },
    [contractReady, contractAddress, info?.abi, getSignerForWrites, refetch]
  );

  const closePosition = useCallback(
    async (positionId) => {
      if (!contractReady) throw new Error('Leverage contract not configured');
      try {
        const signer = getSignerForWrites();
        await requireCorrectChainForWrites(signer);
        const contract = new ethers.Contract(contractAddress, info.abi, signer);
        const tx = await contract.closeLeveragePosition(positionId);
        emitLeverageActivity({
          scope: 'live',
          kind: LEVERAGE_ACTIVITY_KIND.SPOT_CLOSE,
          phase: 'submitted',
          txHash: tx.hash,
          positionId: String(positionId),
          at: new Date().toISOString(),
        });
        await safeTransactionWait(tx);
        emitLeverageActivity({
          scope: 'live',
          kind: LEVERAGE_ACTIVITY_KIND.SPOT_CLOSE,
          phase: 'confirmed',
          txHash: tx.hash,
          positionId: String(positionId),
          at: new Date().toISOString(),
        });
        await refetch();
        return tx;
      } catch (e) {
        emitLiveFailed(LEVERAGE_ACTIVITY_KIND.SPOT_CLOSE, e, { positionId: String(positionId) });
        rethrowNormalizedWriteError(e);
      }
    },
    [contractReady, contractAddress, info?.abi, getSignerForWrites, refetch]
  );

  const addCollateral = useCallback(
    async (positionId, amountWei) => {
      if (!contractReady) throw new Error('Leverage contract not configured');
      try {
        const signer = getSignerForWrites();
        await requireCorrectChainForWrites(signer);
        const contract = new ethers.Contract(contractAddress, info.abi, signer);
        const tx = await contract.addCollateral(positionId, amountWei);
        emitLeverageActivity({
          scope: 'live',
          kind: LEVERAGE_ACTIVITY_KIND.COLLATERAL_ADD,
          phase: 'submitted',
          txHash: tx.hash,
          positionId: String(positionId),
          amountLabel: amountWei?.toString?.(),
          at: new Date().toISOString(),
        });
        await safeTransactionWait(tx);
        emitLeverageActivity({
          scope: 'live',
          kind: LEVERAGE_ACTIVITY_KIND.COLLATERAL_ADD,
          phase: 'confirmed',
          txHash: tx.hash,
          positionId: String(positionId),
          at: new Date().toISOString(),
        });
        await refetch();
        return tx;
      } catch (e) {
        emitLiveFailed(LEVERAGE_ACTIVITY_KIND.COLLATERAL_ADD, e, { positionId: String(positionId) });
        rethrowNormalizedWriteError(e);
      }
    },
    [contractReady, contractAddress, info?.abi, getSignerForWrites, refetch]
  );

  const removeCollateral = useCallback(
    async (positionId, amountWei) => {
      if (!contractReady) throw new Error('Leverage contract not configured');
      try {
        const signer = getSignerForWrites();
        await requireCorrectChainForWrites(signer);
        const contract = new ethers.Contract(contractAddress, info.abi, signer);
        const tx = await contract.removeCollateral(positionId, amountWei);
        emitLeverageActivity({
          scope: 'live',
          kind: LEVERAGE_ACTIVITY_KIND.COLLATERAL_REMOVE,
          phase: 'submitted',
          txHash: tx.hash,
          positionId: String(positionId),
          amountLabel: amountWei?.toString?.(),
          at: new Date().toISOString(),
        });
        await safeTransactionWait(tx);
        emitLeverageActivity({
          scope: 'live',
          kind: LEVERAGE_ACTIVITY_KIND.COLLATERAL_REMOVE,
          phase: 'confirmed',
          txHash: tx.hash,
          positionId: String(positionId),
          at: new Date().toISOString(),
        });
        await refetch();
        return tx;
      } catch (e) {
        emitLiveFailed(LEVERAGE_ACTIVITY_KIND.COLLATERAL_REMOVE, e, { positionId: String(positionId) });
        rethrowNormalizedWriteError(e);
      }
    },
    [contractReady, contractAddress, info?.abi, getSignerForWrites, refetch]
  );

  /** assetId(bytes32) în contract = keccak256(abi.encodePacked(symbol)); calcul local ca să nu depindem de RPC view. */
  const symbolToAssetIdBytes32 = useCallback((symbol) => {
    return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(symbol));
  }, []);

  const openCFDPosition = useCallback(
    async (assetIndex, marginToken, marginAmountWei, leverageBps, isLong) => {
      if (!contractReady) throw new Error('Leverage contract not configured');
      if (!walletAddress) throw new Error('Wallet not connected');
      try {
        const signer = getSignerForWrites();
        await requireCorrectChainForWrites(signer);
        const symbol = CFD_SYMBOLS[Number(assetIndex)] ?? CFD_SYMBOLS[0];
        const assetIdBytes32 = symbolToAssetIdBytes32(symbol);
        const iface = new ethers.utils.Interface(info.abi);
        const data = iface.encodeFunctionData('openCFDPosition', [
          assetIdBytes32,
          marginToken,
          marginAmountWei,
          leverageBps,
          isLong,
        ]);
        const prov = signer.provider;
        let gasPrice = await prov.getGasPrice();
        const BSC_GAS_PRICE_FLOOR_GWEI = 3;
        try {
          const network = await prov.getNetwork?.();
          const chainId =
            network?.chainId != null
              ? typeof network.chainId === 'number'
                ? network.chainId
                : parseInt(network.chainId, 10)
              : null;
          if (chainId === EXPECTED_LEVERAGE_CHAIN_ID) {
            const floor = ethers.utils.parseUnits(String(BSC_GAS_PRICE_FLOOR_GWEI), 'gwei');
            if (gasPrice.lt(floor)) gasPrice = floor;
          }
        } catch (_) {
          gasPrice = ethers.utils.parseUnits(String(BSC_GAS_PRICE_FLOOR_GWEI), 'gwei');
        }
        const nonce = await prov.getTransactionCount(walletAddress, 'pending');
        const GAS_LIMIT_CFD = 500000;

        const raw = pickEvmProvider();
        if (raw?.request) {
          try {
            const txHex = await raw.request({
              method: 'eth_sendTransaction',
              params: [{
                from: walletAddress,
                to: contractAddress,
                data,
                gasLimit: '0x' + GAS_LIMIT_CFD.toString(16),
                gasPrice: ethers.BigNumber.from(gasPrice).toHexString(),
                nonce: '0x' + Number(nonce).toString(16),
              }],
            });
            if (txHex && typeof txHex === 'string') {
              emitLeverageActivity({
                scope: 'live',
                kind: LEVERAGE_ACTIVITY_KIND.CFD_OPEN,
                phase: 'submitted',
                txHash: txHex,
                at: new Date().toISOString(),
              });
              const receipt = await prov.waitForTransaction(txHex);
              if (receipt && receipt.status === 0) {
                throw new Error(
                  `Transaction failed on-chain (reverted). ${receipt.transactionHash ? `Check explorer for ${receipt.transactionHash}.` : ''}`.trim()
                );
              }
              emitLeverageActivity({
                scope: 'live',
                kind: LEVERAGE_ACTIVITY_KIND.CFD_OPEN,
                phase: 'confirmed',
                txHash: txHex,
                at: new Date().toISOString(),
              });
              refetch().catch(() => {});
              return { hash: txHex, wait: () => prov.waitForTransaction(txHex) };
            }
          } catch (_) {
            // Fall through to signer.sendTransaction
          }
        }

        const tx = await signer.sendTransaction({
          to: contractAddress,
          data,
          gasLimit: GAS_LIMIT_CFD,
          gasPrice,
          nonce,
        });
        emitLeverageActivity({
          scope: 'live',
          kind: LEVERAGE_ACTIVITY_KIND.CFD_OPEN,
          phase: 'submitted',
          txHash: tx.hash,
          at: new Date().toISOString(),
        });
        await safeTransactionWait(tx);
        emitLeverageActivity({
          scope: 'live',
          kind: LEVERAGE_ACTIVITY_KIND.CFD_OPEN,
          phase: 'confirmed',
          txHash: tx.hash,
          at: new Date().toISOString(),
        });
        refetch().catch(() => {});
        return tx;
      } catch (e) {
        emitLiveFailed(LEVERAGE_ACTIVITY_KIND.CFD_OPEN, e);
        rethrowNormalizedWriteError(e);
      }
    },
    [contractReady, contractAddress, info?.abi, getSignerForWrites, refetch, symbolToAssetIdBytes32, walletAddress]
  );

  const closeCFDPosition = useCallback(
    async (positionId) => {
      if (!contractReady) throw new Error('Leverage contract not configured');
      try {
        const signer = getSignerForWrites();
        await requireCorrectChainForWrites(signer);
        const contract = new ethers.Contract(contractAddress, info.abi, signer);
        const tx = await contract.closeCFDPosition(positionId);
        emitLeverageActivity({
          scope: 'live',
          kind: LEVERAGE_ACTIVITY_KIND.CFD_CLOSE,
          phase: 'submitted',
          txHash: tx.hash,
          positionId: String(positionId),
          at: new Date().toISOString(),
        });
        await safeTransactionWait(tx);
        emitLeverageActivity({
          scope: 'live',
          kind: LEVERAGE_ACTIVITY_KIND.CFD_CLOSE,
          phase: 'confirmed',
          txHash: tx.hash,
          positionId: String(positionId),
          at: new Date().toISOString(),
        });
        await refetch();
        return tx;
      } catch (e) {
        emitLiveFailed(LEVERAGE_ACTIVITY_KIND.CFD_CLOSE, e, { positionId: String(positionId) });
        rethrowNormalizedWriteError(e);
      }
    },
    [contractReady, contractAddress, info?.abi, getSignerForWrites, refetch]
  );

  /** Moderate polling + visibility/focus refresh — keeps live list fresh without hammering RPC. */
  useEffect(() => {
    if (!contractReady || !walletAddress) return undefined;
    const tick = () => refetch({ silent: true });
    const id = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      tick();
    }, LIVE_POSITIONS_POLL_MS);
    const onVis = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') tick();
    };
    const onFocus = () => tick();
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVis);
    if (typeof window !== 'undefined') window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(id);
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVis);
      if (typeof window !== 'undefined') window.removeEventListener('focus', onFocus);
    };
  }, [contractReady, walletAddress, refetch]);

  const refetchSilentRef = useRef(() => {});
  useEffect(() => {
    refetchSilentRef.current = () => refetch({ silent: true });
  }, [refetch]);

  useLeverageEventHints({
    enabled: !!(contractReady && walletAddress),
    contractAddress,
    abi: info?.abi,
    walletAddress,
    onHint: () => refetchSilentRef.current(),
  });

  const leverageChainGate = useMemo(
    () =>
      buildLeverageChainGate(
        isConnected,
        connectedChainId,
        EXPECTED_LEVERAGE_CHAIN_ID,
        EXPECTED_LEVERAGE_CHAIN_NAME,
      ),
    [isConnected, connectedChainId],
  );

  return {
    contractReady,
    spotAvailable,
    contractAddress,
    configuredCFDAssets,
    positions,
    cfdPositions,
    loading,
    error,
    refetch,
    positionsLastSyncedAt,
    LIVE_POSITIONS_POLL_MS,
    openPosition,
    closePosition,
    openCFDPosition,
    closeCFDPosition,
    addCollateral,
    removeCollateral,
    isConnected,
    walletAddress,
    connectWallet,
    connectedChainId,
    expectedLeverageChainId: EXPECTED_LEVERAGE_CHAIN_ID,
    expectedLeverageChainName: EXPECTED_LEVERAGE_CHAIN_NAME,
    leverageChainGate,
    vaultBalanceMap,
    getVaultBalance,
    fetchVaultBalances,
    getTokenDecimals,
    BPS_DENOMINATOR,
  };
}

export { BPS_DENOMINATOR, getTokenDecimals };
