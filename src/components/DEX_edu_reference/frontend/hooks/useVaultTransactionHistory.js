/**
 * useVaultTransactionHistory – istoric depuneri/retrageri crypto din UserVault (BSC).
 * Evenimente: FundsDeposited / FundsWithdrawn pe **proxy-ul** UserVault (getUserVaultProxyAddressForHistory); logs nu sunt pe implementation.
 *
 * Strategie: backend GET /api/ai-trading/analytics/vault-chain-history este calea principală (fără race scurt).
 * Fallback getLogs în browser: opțional (REACT_APP_VAULT_HISTORY_BROWSER_FALLBACK=true sau options.enableBrowserFallback),
 * strict timeboxed — nu este calea „normală” pentru UX.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_MAP, getActiveNetwork, getUserVaultProxyAddressForHistory } from '../../../../contract/contractMap';
import { getVaultChainHistory } from '../services/analyticsApiService';
import useWallet from './useWallet.jsx';
import {
  clearOtaWalletSession,
  ensureOtaWalletForApiIfNeeded,
  getOtaWalletAuthToken,
  validateCachedOtaWalletSession,
} from '../utils/otaWalletSession';

const BLOCK_CHUNK = 250;
/** Browser fallback: fără scan adânc (evită blocaje RPC în practică). */
const CHUNKS_TO_SCAN_LIMITED = 48;
const CHUNKS_TO_SCAN_FULL = 800;
/** Alchemy Free (BNB): max ~9 blocuri/interval inclusiv. PAYG: REACT_APP_BSC_ALCHEMY_NO_GETLOGS_CAP=true */
const ALCHEMY_FREE_GETLOGS_MAX_BLOCKS = 9;
const CHUNK_PAUSE_MS = 25;
/** Cap soft scan browser când fallback e activat (secundar). */
const SCAN_SOFT_CAP_BROWSER_MS = 22000;
const STOP_AFTER_FOUND_EMPTY_CHUNKS = 8;

/** Buget total pentru ramura browser (când e activă). */
export const VAULT_HISTORY_BROWSER_PATH_MAX_MS = 28000;

/**
 * @deprecated Păstrat pentru teste care verifică alinierea la timeout axios; fluxul principal nu mai folosește race scurt.
 * Backend: await direct getVaultChainHistory (timeout client 120s în analyticsApiService).
 */
export const VAULT_CHAIN_HISTORY_BACKEND_RACE_MS = 120000;

/** Cooldown între Refresh manual (anti-spam). */
const MANUAL_REFETCH_COOLDOWN_MS = 2600;

const TIMEOUT_GET_BLOCK_NUMBER_MS = 12000;
const TIMEOUT_QUERY_FILTER_CHUNK_MS = 12000;
const TIMEOUT_GET_BLOCK_MS = 8000;

const BSC_RPC_FREE = [
  'https://bsc-dataseed1.binance.org',
  'https://bsc-dataseed2.binance.org',
  'https://bsc-dataseed3.binance.org',
  'https://bsc-dataseed4.binance.org',
  'https://bsc-dataseed1.ninicoin.io',
  'https://bsc-dataseed2.ninicoin.io',
  'https://bsc-dataseed.bnbchain.org',
  'https://bsc-dataseed1.defibit.io',
  'https://bsc-dataseed2.defibit.io',
  'https://bsc-dataseed3.defibit.io',
  'https://bsc-dataseed4.defibit.io',
];

const RPC_HOST_DEPRIORITIZE = /publicnode\.com|\.allnodes\.com|chainstack\.com/i;
const RPC_HOST_DEPRIORITIZE_SEED4 = /bsc-dataseed4\.binance\.org/i;

function isAnkrBscPublicWithoutKey(url) {
  const s = String(url || '').trim();
  if (!s) return false;
  try {
    const u = new URL(s);
    if (!/^rpc\.ankr\.com$/i.test(u.hostname)) return false;
    const parts = u.pathname.split('/').filter(Boolean);
    return parts.length === 1 && parts[0].toLowerCase() === 'bsc';
  } catch {
    const t = s.replace(/\/$/, '');
    return /^https?:\/\/rpc\.ankr\.com\/bsc$/i.test(t);
  }
}

function isLimitExceeded(err) {
  const inner = err?.error?.code;
  const c = typeof inner === 'number' ? inner : typeof err?.code === 'number' ? err.code : undefined;
  if (c === -32005) return true;
  if (c === -32600) return true;
  if (c === -32000 && /invalid block range/i.test(String(err?.message || ''))) return true;
  const msg = String(err?.message || '');
  if (/10 block range|eth_getLogs requests with up to a 10 block/i.test(msg)) return true;
  return /limit exceeded/i.test(msg);
}

function userFacingHistoryError(err, browserFallbackUsed) {
  const s = String(err?.message || '');
  if (/vault_chain_history_backend_timeout|timeout/i.test(s) && !browserFallbackUsed) {
    return 'The server did not return history in time. Try again; you can verify transactions on BscScan.';
  }
  if (isLimitExceeded(err) || /-32005|limit exceeded|processing response error/i.test(s)) {
    return 'Network event reading was limited (getLogs). Try again later or check on BscScan.';
  }
  if (/403|Forbidden|bad response|SERVER_ERROR/i.test(s)) {
    return 'The RPC node refused the request. Try again or use a stable RPC (for example REACT_APP_BSC_RPC).';
  }
  if (/vault history: browser path/i.test(s)) {
    return 'Network read (fallback) timed out or failed. Try again; full history is usually available through the server.';
  }
  return s || 'Could not load history.';
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function orderRpcUrlsForSingleBlock(urls) {
  const u = [...new Set((urls || []).filter(Boolean))];
  const seed4 = u.filter((x) => RPC_HOST_DEPRIORITIZE_SEED4.test(x));
  const rest = u.filter((x) => !RPC_HOST_DEPRIORITIZE_SEED4.test(x));
  return [...rest, ...seed4];
}

async function querySingleBlockWithRpcRotation(uv, userAddr, blockNum, rpcUrls) {
  const urls = orderRpcUrlsForSingleBlock(rpcUrls);
  if (!urls.length) throw new Error('BSC RPC: no endpoints for single-block getLogs');
  let lastErr;
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    if (i) await sleep(90);
    try {
      const rpc = createBscJsonRpcProvider(url);
      const c = new ethers.Contract(uv.address, uv.abi, rpc);
      const deposits = await c.queryFilter(c.filters.FundsDeposited(userAddr), blockNum, blockNum);
      const withdrawals = await c.queryFilter(c.filters.FundsWithdrawn(userAddr), blockNum, blockNum);
      return { deposits, withdrawals };
    } catch (e2) {
      lastErr = e2;
      if (!isLimitExceeded(e2)) throw e2;
    }
  }
  throw lastErr;
}

async function queryVaultLogsWithSplit(c, userAddr, fromBlock, toBlock, uv, rpcUrls) {
  const list = Array.isArray(rpcUrls) && rpcUrls.length ? rpcUrls : [];
  try {
    const deposits = await c.queryFilter(c.filters.FundsDeposited(userAddr), fromBlock, toBlock);
    const withdrawals = await c.queryFilter(c.filters.FundsWithdrawn(userAddr), fromBlock, toBlock);
    return { deposits, withdrawals };
  } catch (e) {
    if (isLimitExceeded(e) && toBlock > fromBlock) {
      const mid = Math.floor((fromBlock + toBlock) / 2);
      const left = await queryVaultLogsWithSplit(c, userAddr, fromBlock, mid, uv, list);
      const right = await queryVaultLogsWithSplit(c, userAddr, mid + 1, toBlock, uv, list);
      return {
        deposits: [...left.deposits, ...right.deposits],
        withdrawals: [...left.withdrawals, ...right.withdrawals],
      };
    }
    if (isLimitExceeded(e) && toBlock === fromBlock) {
      return querySingleBlockWithRpcRotation(uv, userAddr, fromBlock, list);
    }
    throw e;
  }
}

function buildBscRpcFallbackList() {
  const seen = new Set();
  const preferred = [];
  const deprioritized = [];
  const push = (url) => {
    if (!url) return;
    const u = String(url).trim().replace(/\/$/, '');
    if (!u || /1rpc\.io|llamarpc\.com/i.test(u)) return;
    if (isAnkrBscPublicWithoutKey(u)) return;
    if (seen.has(u)) return;
    seen.add(u);
    if (RPC_HOST_DEPRIORITIZE.test(u) || RPC_HOST_DEPRIORITIZE_SEED4.test(u)) deprioritized.push(u);
    else preferred.push(u);
  };
  const envRpc = (process.env.REACT_APP_BSC_RPC || '').trim().replace(/\/$/, '');
  if (envRpc) push(envRpc);
  for (const u of BSC_RPC_FREE) push(u);
  return [...preferred, ...deprioritized];
}

const BSC_RPC_FALLBACKS = (() => {
  const raw = buildBscRpcFallbackList().filter((u) => !isAnkrBscPublicWithoutKey(u));
  return raw.length ? raw : ['https://bsc-dataseed1.binance.org'];
})();

/**
 * Alchemy BSC Free: shrink the getLogs chunk.
 * @param {string[]} rpcUrls
 * @returns {{ blockChunk: number, chunksToScan: number }}
 */
export function getAlchemyAdjustedVaultScanParams(rpcUrls, chunksToScanTarget = CHUNKS_TO_SCAN_FULL) {
  const urls = Array.isArray(rpcUrls) ? rpcUrls : [];
  const usesAlchemy = urls.some((u) => /\.alchemy\.com/i.test(String(u)));
  const noCap = String(process.env.REACT_APP_BSC_ALCHEMY_NO_GETLOGS_CAP || '').toLowerCase() === 'true';
  let blockChunk = BLOCK_CHUNK;
  let chunksToScan = chunksToScanTarget;
  const cap = Math.max(
    1,
    Math.min(ALCHEMY_FREE_GETLOGS_MAX_BLOCKS, parseInt(process.env.REACT_APP_BSC_ALCHEMY_GETLOGS_MAX_BLOCKS || '9', 10) || 9)
  );
  if (!usesAlchemy || noCap || blockChunk <= cap) {
    return { blockChunk, chunksToScan };
  }
  blockChunk = cap;
  const targetBlocks = chunksToScanTarget * BLOCK_CHUNK;
  chunksToScan = Math.min(20000, Math.max(1, Math.ceil(targetBlocks / blockChunk)));
  return { blockChunk, chunksToScan };
}

const BSC_CHAIN_STATIC = Object.freeze({ chainId: 56, name: 'bsc' });

function createBscJsonRpcProvider(url) {
  return new ethers.providers.StaticJsonRpcProvider(url, BSC_CHAIN_STATIC);
}

function withTimeout(promise, ms, errMessage) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(errMessage || `timeout_${ms}ms`)), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

function getReadProvider() {
  const active = (getActiveNetwork?.()?.rpcUrl || '').trim().replace(/\/$/, '');
  let rpcUrl =
    active && !RPC_HOST_DEPRIORITIZE.test(active) && !/1rpc\.io|llamarpc\.com/i.test(active)
      ? active
      : (BSC_RPC_FALLBACKS[0] || BSC_RPC_FREE[0]);
  if (!rpcUrl) rpcUrl = 'https://bsc-dataseed1.binance.org';
  if (isAnkrBscPublicWithoutKey(rpcUrl)) rpcUrl = 'https://bsc-dataseed1.binance.org';
  return createBscJsonRpcProvider(rpcUrl);
}

function getTokenInfo(address) {
  if (!address || address === ethers.constants.AddressZero) return { symbol: 'BNB', decimals: 18 };
  const addr = String(address).toLowerCase();
  for (const [key, info] of Object.entries(CONTRACT_MAP || {})) {
    if (info?.address && String(info.address).toLowerCase() === addr) {
      return { symbol: key, decimals: info.decimals ?? 18 };
    }
  }
  return { symbol: addr.slice(0, 6) + '…', decimals: 18 };
}

function normalizeHistoryItems(items) {
  return (items || []).map((row) => {
    const amount = row?.amount;
    try {
      const bn = ethers.BigNumber.isBigNumber(amount) ? amount : ethers.BigNumber.from(String(amount ?? '0'));
      return { ...row, amount: bn };
    } catch {
      return { ...row, amount: ethers.BigNumber.from(0) };
    }
  });
}

function isAuthoritativeVaultHistorySource(source) {
  return String(source || '').startsWith('user_vault_events');
}

/** Discreet warning for a partial backend list. */
export function buildBackendPartialMessage(meta) {
  if (!meta) return null;
  const {
    truncated,
    stopReason,
    syncStatus,
    stale,
    recentBridgeCoverageOk,
    recentDiscoveryReady,
    recentUserFacingCoverageOk,
  } = meta;
  if (stale || syncStatus === 'stale') {
    return 'Data may be stale; sync is running in the background. Refresh or check on BscScan.';
  }
  if (syncStatus === 'syncing') {
    if (recentUserFacingCoverageOk === true || recentDiscoveryReady === true) {
      return null;
    }
    return 'The index is aligning to the latest blocks; very recent withdrawals/deposits may appear after refresh.';
  }
  if (syncStatus === 'backfill_partial') {
    if (recentUserFacingCoverageOk === true || recentDiscoveryReady === true) {
      return 'Older history is being backfilled in the background; deposits/withdrawals from the recent window are indexed.';
    }
    if (recentBridgeCoverageOk === true) {
      return 'Older history is being backfilled in the background; recent events should already be visible.';
    }
    return 'Older history is being backfilled in the background; refresh if you do not see the latest movement.';
  }
  if (syncStatus === 'no_data_yet' || syncStatus === 'partial') {
    return 'History is loading from the chain index; retry in a few moments or check on BscScan.';
  }
  if (!truncated && !stopReason) return null;
  if (truncated) {
    return 'The list may be incomplete (index still backfilling or scan limit reached). You can check on BscScan.';
  }
  if (stopReason === 'recent_history_window_complete' || stopReason === 'bscscan_recent_history_window_complete') {
    return null;
  }
  if (stopReason === 'indexed_partial_backfill') {
    return 'The history index is being filled incrementally; the list may grow after refresh.';
  }
  return 'Some records may be missing from the list. Check BscScan if you need full confirmation.';
}

function envBrowserFallbackEnabled() {
  return String(process.env.REACT_APP_VAULT_HISTORY_BROWSER_FALLBACK || '').toLowerCase() === 'true';
}

/**
 * @param {string|null|undefined} walletAddress
 * @param {{ enableBrowserFallback?: boolean }} [options]
 */
export function useVaultTransactionHistory(walletAddress, options = {}) {
  /** Implicit false; true doar dacă e setat explicit sau REACT_APP_VAULT_HISTORY_BROWSER_FALLBACK=true. */
  let enableBrowserFallback = false;
  if (options.enableBrowserFallback === true) enableBrowserFallback = true;
  else if (options.enableBrowserFallback === false) enableBrowserFallback = false;
  else enableBrowserFallback = envBrowserFallbackEnabled();
  const autoEnsureSession = options.autoEnsureSession !== false;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [historyWarning, setHistoryWarning] = useState(null);
  const [loadingPhase, setLoadingPhase] = useState('idle');
  const [meta, setMeta] = useState(null);
  const [authRequired, setAuthRequired] = useState(false);

  const fetchSeqRef = useRef(0);
  const itemsRef = useRef([]);
  const lastManualRefetchAtRef = useRef(0);
  const { signer } = useWallet();
  const signerRef = useRef(signer);
  signerRef.current = signer;

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const fetchHistory = useCallback(
    async (opts = {}) => {
      const manual = opts.manual === true;
      if (!walletAddress || !getUserVaultProxyAddressForHistory()) return;

      if (manual) {
        const now = Date.now();
        if (now - lastManualRefetchAtRef.current < MANUAL_REFETCH_COOLDOWN_MS) return;
        lastManualRefetchAtRef.current = now;
      }

      const seq = ++fetchSeqRef.current;
      const hadItemsSnapshot = itemsRef.current.length > 0;

      const isStale = () => seq !== fetchSeqRef.current;

      setLoading(true);
      setLoadingPhase('backend');
      setAuthRequired(false);
      if (!hadItemsSnapshot) {
        setError(null);
        setHistoryWarning(null);
        setMeta(null);
      } else {
        setError(null);
      }

      let browserFallbackRan = false;

      const safe = (fn) => {
        if (isStale()) return;
        fn();
      };

      try {
        if (!autoEnsureSession) {
          const existingToken = getOtaWalletAuthToken();
          if (!existingToken) {
            safe(() => {
              setItems([]);
              setMeta(null);
              setHistoryWarning(null);
              setError(null);
              setAuthRequired(true);
            });
            return;
          }
          const sessionValid = await validateCachedOtaWalletSession();
          if (isStale()) return;
          if (sessionValid === false) {
            clearOtaWalletSession();
            safe(() => {
              setItems([]);
              setMeta(null);
              setHistoryWarning(null);
              setError(null);
              setAuthRequired(true);
            });
            return;
          }
        } else if (walletAddress) {
          const s = signerRef.current;
          if (s) {
            try {
              await ensureOtaWalletForApiIfNeeded(s, walletAddress);
            } catch (_) {
              /* refuz semnătură — continuă; 401 mapat din otaApiClient */
            }
          }
        }

        let res = null;
        try {
          res = await getVaultChainHistory(walletAddress);
        } catch (e) {
          if (isStale()) return;
          if (!enableBrowserFallback) {
            safe(() => {
              setError(userFacingHistoryError(e, false));
              if (!hadItemsSnapshot) setItems([]);
            });
            return;
          }
          res = null;
        }

        if (isStale()) return;

        if (res?.success && Array.isArray(res.items) && isAuthoritativeVaultHistorySource(res.source)) {
          const normalized = normalizeHistoryItems(res.items);
          const nextMeta = {
            truncated: !!res.truncated,
            stopReason: res.stopReason ?? null,
            source: res.source ?? null,
            logSource: res.logSource ?? null,
            syncStatus: res.syncStatus ?? null,
            stale: !!res.stale,
            lastUpdatedAt: res.lastUpdatedAt ?? null,
            semantic: res.semantic ?? null,
            recentLagBlocks: res.recentLagBlocks ?? null,
            chainHeadObserved: res.chainHeadObserved ?? null,
            recentBridgeCoverageOk: res.recentBridgeCoverageOk ?? null,
            recentDiscoveryReady: res.recentDiscoveryReady ?? null,
            recentDiscoveryHeadBandBlocks: res.recentDiscoveryHeadBandBlocks ?? null,
            recentHeadBandFloorBlock: res.recentHeadBandFloorBlock ?? null,
            recentHeadBandCoverageOk: res.recentHeadBandCoverageOk ?? null,
            recentDiscoveryWindowBlocks: res.recentDiscoveryWindowBlocks ?? null,
            recentDiscoveryFloorBlock: res.recentDiscoveryFloorBlock ?? null,
            recentDiscoveryNextToBlock: res.recentDiscoveryNextToBlock ?? null,
            recentDiscoveryBlocksSweptFromHead: res.recentDiscoveryBlocksSweptFromHead ?? null,
            userFacingRecentIndexIncomplete: res.userFacingRecentIndexIncomplete ?? null,
            recentUserFacingCoverageOk: res.recentUserFacingCoverageOk ?? null,
            recentWithdrawCoverageOk: res.recentWithdrawCoverageOk ?? null,
            historyMaxBlock: res.historyMaxBlock ?? res.recentMaxBlock ?? null,
            headObserved: res.headObserved ?? res.chainHeadObserved ?? null,
            recentReady: res.recentReady ?? res.recentBridgeCoverageOk ?? null,
            historicalBackfillInProgress: res.historicalBackfillInProgress ?? res.truncated ?? null,
            recentMaxBlock: res.recentMaxBlock ?? res.latestBlockScanned ?? null,
          };
          const partialMsg = buildBackendPartialMessage(nextMeta);
          safe(() => {
            setItems(normalized);
            setMeta(nextMeta);
            setHistoryWarning(partialMsg);
            setError(null);
          });
          return;
        }

        if (res?.success && Array.isArray(res.items) && res.source && !isAuthoritativeVaultHistorySource(res.source)) {
          safe(() => {
            setMeta({
              truncated: false,
              stopReason: res.stopReason ?? res.source,
              source: res.source,
              logSource: null,
            });
          });
        }

        if (!enableBrowserFallback) {
          safe(() => {
            setError(
              'History could not be confirmed by the server (incomplete source). Try again; check BscScan. Browser fallback is disabled.'
            );
            if (!hadItemsSnapshot) setItems([]);
            setHistoryWarning(null);
          });
          return;
        }

        browserFallbackRan = true;
        safe(() => {
          setLoadingPhase('browser');
          setHistoryWarning(
            'The server could not return the full list. Trying a short network read (max ~30s)...'
          );
        });

        await withTimeout(
          (async () => {
            const userAddr = ethers.utils.getAddress(String(walletAddress).trim());
            const provider = getReadProvider();
            const vaultAddr = getUserVaultProxyAddressForHistory();
            if (!vaultAddr) throw new Error('UserVault proxy address unavailable');
            const uv = { ...CONTRACT_MAP.USER_VAULT, address: vaultAddr };

            const currentBlock = await withTimeout(
              provider.getBlockNumber(),
              TIMEOUT_GET_BLOCK_NUMBER_MS,
              'BSC RPC: getBlockNumber timed out.'
            );
            if (isStale()) return;

            const allDeposits = [];
            const allWithdrawals = [];
            let workingProvider = provider;
            let rpcChunkLimitHit = false;
            const scanStartedAt = Date.now();
            let foundAnyOnChainRows = false;
            let emptyChunksAfterHit = 0;

            const rpcUrls = BSC_RPC_FALLBACKS.length ? BSC_RPC_FALLBACKS : ['https://bsc-dataseed1.binance.org'];
            const { blockChunk, chunksToScan } = getAlchemyAdjustedVaultScanParams(rpcUrls, CHUNKS_TO_SCAN_LIMITED);

            rpcLoop: for (let rpcIdx = 0; rpcIdx < rpcUrls.length; rpcIdx++) {
              allDeposits.length = 0;
              allWithdrawals.length = 0;
              rpcChunkLimitHit = false;
              foundAnyOnChainRows = false;
              emptyChunksAfterHit = 0;
              try {
                for (let i = 0; i < chunksToScan; i++) {
                  if (isStale()) return;
                  if (Date.now() - scanStartedAt >= SCAN_SOFT_CAP_BROWSER_MS) {
                    safe(() =>
                      setHistoryWarning(
                        (prev) =>
                          prev ||
                          'Network reading was stopped on time; only what could be loaded is displayed.'
                      )
                    );
                    break rpcLoop;
                  }
                  const rpcUrl = rpcUrls[(rpcIdx + i) % rpcUrls.length];
                  const rpc = createBscJsonRpcProvider(rpcUrl);
                  const c = new ethers.Contract(uv.address, uv.abi, rpc);
                  const toBlock = currentBlock - i * blockChunk;
                  const fromBlock = Math.max(0, toBlock - blockChunk + 1);
                  if (fromBlock >= toBlock) break;

                  try {
                    const { deposits, withdrawals } = await withTimeout(
                      queryVaultLogsWithSplit(c, userAddr, fromBlock, toBlock, uv, rpcUrls),
                      TIMEOUT_QUERY_FILTER_CHUNK_MS * 2,
                      'BSC RPC: vault chunk timed out.'
                    );
                    allDeposits.push(...deposits);
                    allWithdrawals.push(...withdrawals);
                    workingProvider = rpc;
                    if (deposits.length || withdrawals.length) {
                      foundAnyOnChainRows = true;
                      emptyChunksAfterHit = 0;
                    } else if (foundAnyOnChainRows) {
                      emptyChunksAfterHit += 1;
                      if (emptyChunksAfterHit >= STOP_AFTER_FOUND_EMPTY_CHUNKS) break rpcLoop;
                    }
                  } catch (chunkErr) {
                    if (isLimitExceeded(chunkErr)) {
                      rpcChunkLimitHit = true;
                      continue;
                    }
                    throw chunkErr;
                  }
                  await new Promise((r) => setTimeout(r, CHUNK_PAUSE_MS));
                }
                break;
              } catch (e) {
                if (rpcIdx === rpcUrls.length - 1) throw e;
              }
            }

            if (isStale()) return;

            const rows = [];
            for (const e of allDeposits) {
              const args = e.args;
              const amount = args?.amount ? ethers.BigNumber.from(args.amount) : ethers.BigNumber.from(0);
              const { symbol, decimals } = getTokenInfo(args?.token);
              rows.push({
                type: 'deposit',
                token: args?.token || ethers.constants.AddressZero,
                symbol,
                decimals,
                amount,
                blockNumber: e.blockNumber,
                txHash: e.transactionHash,
                _sort: e.blockNumber * 1000 + (e.logIndex || 0),
              });
            }
            for (const e of allWithdrawals) {
              const args = e.args;
              const amount = args?.amount ? ethers.BigNumber.from(args.amount) : ethers.BigNumber.from(0);
              const { symbol, decimals } = getTokenInfo(args?.token);
              rows.push({
                type: 'withdraw',
                token: args?.token || ethers.constants.AddressZero,
                symbol,
                decimals,
                amount,
                blockNumber: e.blockNumber,
                txHash: e.transactionHash,
                _sort: e.blockNumber * 1000 + (e.logIndex || 0),
              });
            }
            rows.sort((a, b) => b._sort - a._sort);

            if (rpcChunkLimitHit && rows.length === 0) {
              safe(() => {
                setError('Network reading failed (RPC limit). Try again or check on BscScan.');
                if (!hadItemsSnapshot) setItems([]);
                setHistoryWarning(null);
              });
              return;
            }

            safe(() => {
              setHistoryWarning(
                rpcChunkLimitHit && rows.length > 0
                  ? 'The network list may be incomplete (RPC limit).'
                  : null
              );
            });

            const blockNumbers = [...new Set(rows.map((r) => r.blockNumber))].slice(0, 80);
            const blockMap = {};
            await Promise.all(
              blockNumbers.map(async (bn) => {
                try {
                  const block = await withTimeout(
                    workingProvider.getBlock(bn),
                    TIMEOUT_GET_BLOCK_MS,
                    'getBlock timeout'
                  );
                  if (block) blockMap[bn] = block.timestamp;
                } catch (_) {}
              })
            );
            rows.forEach((r) => {
              r.blockTimestamp = blockMap[r.blockNumber] || 0;
            });

            safe(() => {
              setItems(rows);
              setMeta({ truncated: rpcChunkLimitHit, stopReason: rpcChunkLimitHit ? 'rpc_limit' : null, source: 'browser_getlogs', logSource: null });
              setError(null);
            });
          })(),
          VAULT_HISTORY_BROWSER_PATH_MAX_MS,
          'vault history: browser path exceeded time limit'
        );
      } catch (e) {
        if (isStale()) return;
        safe(() => {
          setError(userFacingHistoryError(e, browserFallbackRan));
          if (!hadItemsSnapshot) setItems([]);
          if (!browserFallbackRan) setHistoryWarning(null);
        });
      } finally {
        if (!isStale()) {
          setLoading(false);
          setLoadingPhase('idle');
        }
      }
    },
    [walletAddress, enableBrowserFallback, autoEnsureSession]
  );

  useEffect(() => {
    fetchHistory({});
  }, [fetchHistory]);

  const isRefreshing = loading && items.length > 0;

  return {
    items,
    loading,
    error,
    warning: historyWarning,
    loadingPhase,
    meta,
    authRequired,
    isRefreshing,
    refetch: fetchHistory,
    enableBrowserFallback,
  };
}
