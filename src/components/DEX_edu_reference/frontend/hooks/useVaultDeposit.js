/**
 * useVaultDeposit – deposit/withdraw în UserVault (alimentare cont cu USD/EUR).
 * Soldurile se citesc din contract cu getUserBalances() – sursa de adevăr (BNB, DOGE, etc.).
 */
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_MAP, getActiveNetwork } from '../../../../contract/contractMap';
import { TOKEN_REGISTRY } from '../services/tokenRegistry';
import { indexManualVaultChainHistory } from '../services/analyticsApiService';
import useWallet from './useWallet.jsx';

/** WBNB pe BSC – folosim checksum acceptat de ethers (EIP-55 chainId 1) ca să nu apară "bad address checksum". */
const WBNB_BSC_RAW = '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c';
const WBNB_BSC = (() => {
  try {
    return ethers.utils.getAddress(WBNB_BSC_RAW);
  } catch {
    return WBNB_BSC_RAW;
  }
})();
const WBNB_BSC_LOWER = WBNB_BSC_RAW;
const ADDRESS_ZERO = ethers.constants.AddressZero;

/** Normalizează adresa la checksum acceptat de ethers (evită INVALID_ARGUMENT bad address checksum). */
function toSafeChecksumAddress(addr) {
  if (!addr || addr === ethers.constants.AddressZero) return addr;
  const s = String(addr).trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(s)) return s;
  try {
    return ethers.utils.getAddress(s.toLowerCase());
  } catch {
    return s.toLowerCase();
  }
}
/** DOGE pe BSC – returnat de bot la swap; nu e în userTokens[] (contractul îl adaugă doar la deposit user) */
const DOGE_BSC = '0xba2ae424d960c26247dd6c32edc70b295c744c43';
/** Binance-Peg STX pe BSC – afișare sold în Personal Account; swap pe Pancake nu e suportat (revert). */
const STX_BSC = '0x0104f019c8889BdabC62aE6C7b84F6f2ed351133';

const isDev = process.env.NODE_ENV === 'development';

/** Un singur fetch activ per wallet – evită fetch-uri paralele din PersonalAccountPage + PersonalAccountHeaderBadge */
let sharedFetchWallet = null;
let sharedFetchPromise = null;

/** Tokeni pentru alimentare + TOȚI tokenii pe care OTA Auto îi poate avea în vault (DOGE, XRP, etc.) – toți apar în Personal Account */
function getDepositTokenOptions() {
  const list = [
    { symbol: 'USDT', key: 'USDT', name: 'Tether USD', decimals: 18 },
    { symbol: 'USDC', key: 'USDC', name: 'USD Coin', decimals: 18 },
    { symbol: 'BNB', key: 'native', name: 'BNB', address: ethers.constants.AddressZero, decimals: 18 },
    { symbol: 'WBNB', key: 'WBNB', name: 'Wrapped BNB', address: WBNB_BSC, decimals: 18 },
  ];
  const eurs = CONTRACT_MAP?.EURS;
  if (eurs?.address && String(eurs.address).length > 10) {
    list.push({ symbol: 'EURS', key: 'EURS', name: eurs.name || 'EURS (Euro)', decimals: eurs.decimals ?? 18 });
  }
  const eurc = CONTRACT_MAP?.EURC;
  if (eurc?.address && String(eurc.address).length > 10) {
    list.push({ symbol: 'EURC', key: 'EURC', name: eurc.name || 'EURC (Euro)', decimals: eurc.decimals ?? 18 });
  }
  const fromContract = ['MATIC', 'BUSD', 'DAI', 'BITS'];
  for (const key of fromContract) {
    const info = CONTRACT_MAP?.[key];
    if (info?.address && String(info.address).length > 10 && !list.some((t) => t.symbol === (key === 'BITS' ? 'BITS' : key))) {
      list.push({
        symbol: key === 'BITS' ? 'BITS' : key,
        key,
        name: info.name || key,
        decimals: info.decimals ?? 18,
      });
    }
  }
  // STX: include pentru afișare sold în Personal Account (Binance-Peg pe BSC); swap pe Pancake nu e suportat.
  list.push({ symbol: 'STX', key: 'STX', name: 'Stacks (Binance-Peg)', address: toSafeChecksumAddress(STX_BSC), decimals: 18 });
  const registrySymbols = ['BTC', 'ETH', 'SOL', 'CAKE', 'DOGE', 'SHIB', 'XRP', 'ADA', 'LINK'];
  for (const symbol of registrySymbols) {
    const t = TOKEN_REGISTRY?.[symbol];
    if (t?.address && String(t.address).length > 10 && !list.some((x) => x.symbol === symbol)) {
      list.push({ symbol, key: symbol, name: t.name || symbol, address: t.address, decimals: t.decimals ?? 18 });
    }
  }
  return list.map((t) => {
    if (t.key === 'native') return t;
    if (t.address) return { ...t, decimals: t.decimals ?? 18 };
    const info = CONTRACT_MAP?.[t.key] || TOKEN_REGISTRY?.[t.symbol];
    return {
      ...t,
      address: info?.address ?? t.address ?? null,
      decimals: info?.decimals ?? t.decimals ?? 18,
    };
  }).filter((t) => t.address != null && (t.address === ethers.constants.AddressZero || String(t.address).length > 10));
}

function getReadProvider() {
  let rpcUrl = getActiveNetwork?.()?.rpcUrl || 'https://bsc-dataseed1.binance.org';
  if (!rpcUrl || /1rpc\.io|llamarpc\.com/i.test(rpcUrl)) rpcUrl = 'https://bsc-dataseed1.binance.org';
  return new ethers.providers.JsonRpcProvider(rpcUrl);
}

function slimReceiptLogs(logs) {
  return (Array.isArray(logs) ? logs : []).map((log) => ({
    address: log?.address || null,
    topics: Array.isArray(log?.topics) ? log.topics : [],
    data: log?.data || '0x',
    logIndex: log?.logIndex ?? null,
    blockNumber: log?.blockNumber ?? null,
    transactionHash: log?.transactionHash || null,
  }));
}
/** RPC alternativ – uneori nodul principal returnează 0 pentru getBalance */
const FALLBACK_RPC = 'https://bsc-dataseed2.binance.org';
const FALLBACK_RPC_3 = 'https://bsc-dataseed3.binance.org';
const BSCSCAN_API = 'https://api.bscscan.com/api';

/** Ultim fallback: citește getBalance prin BscScan eth_call (nod propriu BscScan) */
async function fetchBnbDogeViaBscScan(vaultAddress, userAddress, abi) {
  const iface = new ethers.utils.Interface(abi);
  const user = ethers.utils.getAddress(userAddress);
  const res = { bnbSum: ethers.BigNumber.from(0), dogeVal: '0' };
  try {
    const calls = [
      { data: iface.encodeFunctionData('getBalance', [user, ADDRESS_ZERO]), key: 'native' },
      { data: iface.encodeFunctionData('getBalance', [user, WBNB_BSC]), key: 'wbnb' },
      { data: iface.encodeFunctionData('getBalance', [user, DOGE_BSC]), key: 'doge' },
    ];
    for (const { data, key } of calls) {
      const url = `${BSCSCAN_API}?module=proxy&action=eth_call&to=${vaultAddress}&data=${encodeURIComponent(data)}&tag=latest`;
      const r = await fetch(url).then((x) => x.json()).catch(() => ({}));
      const hex = r?.result;
      if (hex && typeof hex === 'string' && hex !== '0x') {
        const val = ethers.BigNumber.from(hex);
        if (key === 'doge') res.dogeVal = val.toString();
        else res.bnbSum = res.bnbSum.add(val);
      }
    }
  } catch (_) {}
  return res;
}

export function useVaultDeposit() {
  const { walletAddress, provider, signer: walletSigner, isConnected, connectWallet } = useWallet();
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const lastFetchTimeRef = useRef(0);
  const lastWalletForFetchRef = useRef(null);
  const timeoutRetryCountRef = useRef(0);
  const forceRefetchRef = useRef(false);

  const uv = CONTRACT_MAP?.USER_VAULT;
  // Referință stabilă – evită buclă infinită pe /dex-edu/account (useEffect din pagină depinde de tokenOptions)
  const tokenOptions = useMemo(() => getDepositTokenOptions(), []);

  const fetchBalances = useCallback(async () => {
    if (!walletAddress || !uv?.address || !uv?.abi) {
      setBalances({});
      return;
    }
    const tokens = getDepositTokenOptions();
    if (!tokens.length) {
      setBalances({});
      return;
    }
    const forceRefresh = forceRefetchRef.current;
    if (forceRefresh) forceRefetchRef.current = false;

    if (forceRefresh) {
      lastFetchTimeRef.current = 0;
      lastWalletForFetchRef.current = null;
      sharedFetchWallet = null;
      sharedFetchPromise = null;
      timeoutRetryCountRef.current = 0;
    }

    // Evită refetch-uri la < 5s pentru același wallet (doar dacă nu e refetch forțat)
    if (
      !forceRefresh &&
      lastWalletForFetchRef.current === walletAddress &&
      Date.now() - lastFetchTimeRef.current < 5000
    ) {
      return;
    }
    if (!forceRefresh) lastFetchTimeRef.current = Date.now();
    lastWalletForFetchRef.current = walletAddress;

    // Un singur fetch activ per wallet – nu alăturăm request vechi la refetch forțat
    if (!forceRefresh && sharedFetchWallet === walletAddress && sharedFetchPromise) {
      setLoading(true);
      setError(null);
      try {
        const r = await sharedFetchPromise;
        setBalances(r.map);
        setError(r.error || null);
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError(null);
    const userChecksum = (() => { try { return ethers.utils.getAddress(walletAddress); } catch { return walletAddress; } })();
    const userLower = String(walletAddress || '').toLowerCase();
    // Vault balance read: use public RPC, not the injected provider, to avoid MetaMask/SES instability and reduce wallet prompts.
    let readProvider;
    try {
      readProvider = getReadProvider();
    } catch (e) {
      setError('RPC unavailable. Try again.');
      setLoading(false);
      return;
    }
    const uvContract = new ethers.Contract(uv.address, uv.abi, readProvider);
    const map = {};
    const TIMEOUT_MS = forceRefresh ? 22000 : 15000; // Refresh/Retry: 22s so the network has a chance.
    const timeoutReject = new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT')), TIMEOUT_MS));

    sharedFetchWallet = walletAddress;
    sharedFetchPromise = (async () => {
      try {
        await Promise.race([
        (async () => {
      // 1) Source of truth: getUserBalances(user) returns the exact vault tokens, including WBNB and DOGE.
      let tokensFromVault = [];
      let amountsFromVault = [];
      const tryGetUserBalances = async (user) => {
        const [tokens, amounts] = await uvContract.getUserBalances(user);
        return { tokens: tokens || [], amounts: amounts || [] };
      };
      try {
        const result = await tryGetUserBalances(userChecksum);
        tokensFromVault = result.tokens;
        amountsFromVault = result.amounts;
      } catch (_) {
        try {
          const result = await tryGetUserBalances(userLower);
          tokensFromVault = result.tokens;
          amountsFromVault = result.amounts;
        } catch (__) {
          tokensFromVault = [];
          amountsFromVault = [];
        }
      }

      // Match BscScan: do not add native BNB + WBNB into map['BNB']; BNB = native only, WBNB = separate.
      if (Array.isArray(tokensFromVault) && tokensFromVault.length > 0 && tokensFromVault.length === amountsFromVault.length) {
        let nativeBn = ethers.BigNumber.from(0);
        for (let i = 0; i < tokensFromVault.length; i++) {
          const tokenAddr = tokensFromVault[i];
          const amt = amountsFromVault[i];
          const key = String(tokenAddr || '').toLowerCase();
          const val = (amt && typeof amt.toString === 'function' ? amt.toString() : String(amt || '0'));
          map[key] = val;
          if (key !== tokenAddr) map[tokenAddr] = val;
          if (key === ADDRESS_ZERO.toLowerCase()) nativeBn = ethers.BigNumber.from(val);
        }
        if (!nativeBn.isZero()) map['BNB'] = nativeBn.toString();
      }

      // 1b) BNB = native only (0x0); WBNB = separate, aligned with BscScan Net Worth / Token Holdings.
      const fetchBnbDoge = async (contract) => {
        const [nativeBn, wbnbBn, dogeBn] = await Promise.all([
          contract.getBalance(userChecksum, ADDRESS_ZERO).catch(() => contract.getBalance(userLower, ADDRESS_ZERO)).catch(() => ethers.BigNumber.from(0)),
          contract.getBalance(userChecksum, WBNB_BSC).catch(() => contract.getBalance(userLower, WBNB_BSC)).catch(() => ethers.BigNumber.from(0)),
          contract.getBalance(userChecksum, DOGE_BSC).catch(() => contract.getBalance(userLower, DOGE_BSC)).catch(() => ethers.BigNumber.from(0)),
        ]);
        const dogeVal = dogeBn?.toString?.() || '0';
        return { nativeBn, wbnbRaw: wbnbBn, dogeVal };
      };
      const wbnbKey = WBNB_BSC.toLowerCase();
      try {
        let { nativeBn, wbnbRaw, dogeVal } = await fetchBnbDoge(uvContract);
        if (nativeBn && !ethers.BigNumber.from(nativeBn.toString()).isZero()) map['BNB'] = nativeBn.toString();
        map[wbnbKey] = (wbnbRaw?.toString?.() || '0');
        map[WBNB_BSC] = map[wbnbKey];
        if (dogeVal !== '0' && !ethers.BigNumber.from(dogeVal).isZero()) {
          const dogeKey = DOGE_BSC.toLowerCase();
          map[dogeKey] = dogeVal;
          map[DOGE_BSC] = dogeVal;
        }
        const bnbFromFetchZero = !map['BNB'] || map['BNB'] === '0' || ethers.BigNumber.from(map['BNB'] || '0').isZero();
        if (bnbFromFetchZero && (dogeVal === '0' || ethers.BigNumber.from(dogeVal).isZero())) {
          const fallbackProvider = new ethers.providers.JsonRpcProvider(FALLBACK_RPC);
          const fallbackContract = new ethers.Contract(uv.address, uv.abi, fallbackProvider);
          const fallback = await fetchBnbDoge(fallbackContract);
          if (fallback.nativeBn && !ethers.BigNumber.from(fallback.nativeBn.toString()).isZero()) map['BNB'] = fallback.nativeBn.toString();
          if (fallback.wbnbRaw != null) { map[wbnbKey] = fallback.wbnbRaw.toString(); map[WBNB_BSC] = map[wbnbKey]; }
          if (fallback.dogeVal !== '0' && !ethers.BigNumber.from(fallback.dogeVal).isZero()) {
            const dogeKey = DOGE_BSC.toLowerCase();
            map[dogeKey] = fallback.dogeVal;
            map[DOGE_BSC] = fallback.dogeVal;
          }
          if (!map['BNB'] || !map[DOGE_BSC.toLowerCase()]) {
            const provider3 = new ethers.providers.JsonRpcProvider(FALLBACK_RPC_3);
            const contract3 = new ethers.Contract(uv.address, uv.abi, provider3);
            const fallback3 = await fetchBnbDoge(contract3);
            if (!map['BNB'] && fallback3.nativeBn && !ethers.BigNumber.from(fallback3.nativeBn.toString()).isZero()) map['BNB'] = fallback3.nativeBn.toString();
            if (fallback3.wbnbRaw != null) { map[wbnbKey] = fallback3.wbnbRaw.toString(); map[WBNB_BSC] = map[wbnbKey]; }
            if (!map[DOGE_BSC.toLowerCase()] && fallback3.dogeVal !== '0' && !ethers.BigNumber.from(fallback3.dogeVal).isZero()) {
              const dogeKey = DOGE_BSC.toLowerCase();
              map[dogeKey] = fallback3.dogeVal;
              map[DOGE_BSC] = fallback3.dogeVal;
            }
          }
          if (!map['BNB'] || !map[DOGE_BSC.toLowerCase()]) {
            const bscScan = await fetchBnbDogeViaBscScan(uv.address, userChecksum, uv.abi);
            if (!map['BNB'] && bscScan.bnbSum && !bscScan.bnbSum.isZero()) map['BNB'] = bscScan.bnbSum.toString();
            if (!map[DOGE_BSC.toLowerCase()] && bscScan.dogeVal !== '0' && !ethers.BigNumber.from(bscScan.dogeVal).isZero()) {
              const dogeKey = DOGE_BSC.toLowerCase();
              map[dogeKey] = bscScan.dogeVal;
              map[DOGE_BSC] = bscScan.dogeVal;
            }
          }
        }
      } catch (_) {}

      // 2) If getUserBalances returned nothing, fall back to getBalance per token (legacy behavior).
      const tokens = getDepositTokenOptions();
      if (Object.keys(map).length === 0 && tokens.length > 0) {
        for (const t of tokens) {
          try {
            let bal = null;
            if (t.symbol === 'BNB' && (t.address === ADDRESS_ZERO || !t.address)) {
              const [nativeBn, wbnbBn] = await Promise.all([
                uvContract.getBalance(userChecksum, ADDRESS_ZERO)
                  .catch(() => uvContract.getBalance(userLower, ADDRESS_ZERO))
                  .catch(() => ethers.BigNumber.from(0)),
                uvContract.getBalance(userChecksum, WBNB_BSC)
                  .catch(() => uvContract.getBalance(userLower, WBNB_BSC))
                  .catch(() => ethers.BigNumber.from(0)),
              ]);
              bal = ethers.BigNumber.from(nativeBn?.toString?.() || '0').add(ethers.BigNumber.from(wbnbBn?.toString?.() || '0'));
            } else {
              bal = await uvContract.getBalance(userChecksum, t.address)
                .catch(() => uvContract.getBalance(userLower, t.address))
                .catch(() => ethers.BigNumber.from(0));
            }
            const key = String(t.address || '').toLowerCase();
            const val = (bal && typeof bal.toString === 'function' ? bal.toString() : String(bal || '0'));
            map[key] = val;
            if (key !== t.address) map[t.address] = val;
            if (t.symbol === 'BNB') map['BNB'] = val;
          } catch (_) {
            const key = String(t.address || '').toLowerCase();
            map[key] = '0';
            if (t.address) map[t.address] = '0';
            if (t.symbol === 'BNB') map['BNB'] = '0';
          }
        }
      } else {
        // Fill map with 0 for tokenOptions tokens not returned by getUserBalances so the UI still has symbols.
        for (const t of tokens) {
          const key = String(t.address || '').toLowerCase();
          if (map[key] === undefined && map[t.address] === undefined) {
            if (t.symbol === 'BNB' && map['BNB'] === undefined) map['BNB'] = '0';
            map[key] = '0';
            if (t.address) map[t.address] = '0';
          }
        }
      }

      // Align with BscScan Net Worth / Token Holdings: BNB = vault native balance, WBNB = balanceOf(vault).
      const erc20Abi = CONTRACT_MAP?.USDT?.abi || [{ inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' }];
      try {
        const wbnbContract = new ethers.Contract(WBNB_BSC, erc20Abi, readProvider);
        const [vaultNativeBn, vaultWbnb] = await Promise.all([
          readProvider.getBalance(uv.address).catch(() => ethers.BigNumber.from(0)),
          wbnbContract.balanceOf(uv.address).catch(() => ethers.BigNumber.from(0)),
        ]);
        map['BNB'] = (vaultNativeBn?.toString?.() || '0');
        map[wbnbKey] = (vaultWbnb?.toString?.() || '0');
        map[WBNB_BSC] = map[wbnbKey];
      } catch (_) {}

      // DOGE fallback when missing: vault DOGE balance, matching BscScan.
      const dogeKey = DOGE_BSC.toLowerCase();
      const dogeIsZero = !map[dogeKey] || map[dogeKey] === '0' || ethers.BigNumber.from(map[dogeKey] || '0').isZero();
      if (dogeIsZero) {
        try {
          const dogeContract = new ethers.Contract(DOGE_BSC, erc20Abi, readProvider);
          const vaultDoge = await dogeContract.balanceOf(uv.address).catch(() => ethers.BigNumber.from(0));
          if (!vaultDoge.isZero()) {
            map[dogeKey] = vaultDoge.toString();
            map[DOGE_BSC] = vaultDoge.toString();
          }
        } catch (_) {}
      }

      })(), timeoutReject ]);
        return { map, error: null };
      } catch (e) {
        if (e?.message === 'TIMEOUT') {
          try { window.dispatchEvent(new CustomEvent('network-slow', { detail: { source: 'vault' } })); } catch (_) {}
          return { map, error: 'TIMEOUT' };
        }
        return { map, error: e?.message || 'Could not load balances.' };
      } finally {
        lastFetchTimeRef.current = Date.now();
      }
    })();

    try {
      const r = await sharedFetchPromise;
      if (r.error === 'TIMEOUT' && timeoutRetryCountRef.current < 1) {
        timeoutRetryCountRef.current += 1;
        sharedFetchPromise = null;
        sharedFetchWallet = null;
        lastFetchTimeRef.current = 0;
        setLoading(false);
        await new Promise((ok) => setTimeout(ok, 800));
        return fetchBalances();
      }
      setBalances(r.map);
      setError(r.error === 'TIMEOUT' ? 'The blockchain response (BSC) was delayed. Press Refresh or Retry.' : (r.error || null));
      if (r.error !== 'TIMEOUT') timeoutRetryCountRef.current = 0;
      if (isDev && !r.error) console.log('[useVaultDeposit] fetchBalances OK', { keys: Object.keys(r.map).length });
    } catch (e) {
      setError(e?.message || 'Could not load balances.');
      setBalances(map);
    } finally {
      sharedFetchPromise = null;
      sharedFetchWallet = null;
      setLoading(false);
    }
  // Do not include provider: use getReadProvider() for reads; provider in deps recreated this on every render (Header + Page) -> loop.
  }, [walletAddress, uv?.address, uv?.abi]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const refetch = useCallback(() => {
    setError(null);
    forceRefetchRef.current = true;
    fetchBalances();
  }, [fetchBalances]);

  // Guard: if loading stays true too long (slow network/timeout), leave loading so the user can press Refresh.
  const loadingStartedRef = useRef(0);
  useEffect(() => {
    if (loading) {
      loadingStartedRef.current = loadingStartedRef.current || Date.now();
    } else {
      loadingStartedRef.current = 0;
    }
  }, [loading]);
  useEffect(() => {
    if (!loading) return;
    const SAFETY_MS = 25000; // 25s: above 15s timeout + retry.
    const t = setTimeout(() => {
      const elapsed = loadingStartedRef.current ? Date.now() - loadingStartedRef.current : 0;
      if (elapsed >= SAFETY_MS) {
        setLoading(false);
        setError((prev) => prev || 'Loading timed out. Press Refresh or Retry.');
      }
    }, SAFETY_MS);
    return () => clearTimeout(t);
  }, [loading]);

  const getSigner = useCallback(() => {
    if (!walletAddress) throw new Error('Wallet not connected');
    // Prefer WalletContext signer (MetaMask/wagmi) – avoids double-wrap and ensures MetaMask is triggered
    if (walletSigner) return walletSigner;
    if (!provider) throw new Error('Wallet not connected');
    return new ethers.providers.Web3Provider(provider).getSigner();
  }, [provider, walletAddress, walletSigner]);

  const deposit = useCallback(
    async (tokenAddress, amountWei) => {
      if (!uv?.address || !uv?.abi) throw new Error('UserVault not configured');
      setError(null);
      setLoading(true);
      const safeTokenAddr = toSafeChecksumAddress(tokenAddress);
      try {
        const signer = getSigner();
        if (!signer) throw new Error('Wallet signer not available. Please reconnect MetaMask.');
        const uvContract = new ethers.Contract(uv.address, uv.abi, signer);
        const signerProvider = signer.provider || provider || null;
        const isNative = !safeTokenAddr || safeTokenAddr === ethers.constants.AddressZero;
        let receipt = null;
        if (isNative) {
          if (isDev) console.log('[useVaultDeposit] Sending BNB deposit – MetaMask should open:', { amountWei: amountWei.toString(), vault: uv.address });
          const tx = await uvContract.deposit(ethers.constants.AddressZero, amountWei, { value: amountWei });
          receipt = await tx.wait();
        } else {
          const tokenEntry = Object.entries(CONTRACT_MAP || {}).find(
            ([, v]) => v?.address && String(v.address).toLowerCase() === String(safeTokenAddr).toLowerCase()
          );
          const abi = tokenEntry?.[1]?.abi ?? CONTRACT_MAP?.USDT?.abi ?? [];
          const erc20 = new ethers.Contract(safeTokenAddr, abi, signer);
          const allowance = await erc20.allowance(walletAddress, uv.address);
          if (allowance.lt(amountWei)) {
            const approveTx = await erc20.approve(uv.address, amountWei);
            await approveTx.wait();
          }
          const tx = await uvContract.deposit(safeTokenAddr, amountWei);
          receipt = await tx.wait();
        }
        try {
          const network = await signerProvider?.getNetwork?.().catch(() => null);
          const block = receipt?.blockNumber && signerProvider?.getBlock
            ? await signerProvider.getBlock(receipt.blockNumber).catch(() => null)
            : null;
          await indexManualVaultChainHistory({
            userId: walletAddress,
            walletAddress,
            vaultAddress: uv.address,
            chainId: receipt?.chainId || network?.chainId || null,
            txHash: receipt?.transactionHash || null,
            blockNumber: receipt?.blockNumber ?? null,
            blockTimestamp: block?.timestamp ?? null,
            logs: slimReceiptLogs(receipt?.logs),
          });
        } catch (indexErr) {
          if (isDev) console.warn('[useVaultDeposit] manual history index failed', indexErr?.message || indexErr);
        }
        await fetchBalances();
      } catch (e) {
        let msg = e?.message || 'Deposit failed';
        if (/revert|execution reverted|not accepted|whitelist|denied/i.test(String(msg))) {
          msg = `${msg} (If the token is not accepted by the vault, contact the team.)`;
        }
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [uv?.address, uv?.abi, getSigner, walletAddress, fetchBalances, provider]
  );

  const withdraw = useCallback(
    async (tokenAddress, amountWei) => {
      if (!uv?.address || !uv?.abi) throw new Error('UserVault not configured');
      setError(null);
      setLoading(true);
      const safeTokenAddr = toSafeChecksumAddress(tokenAddress);
      try {
        const signer = getSigner();
        const uvContract = new ethers.Contract(uv.address, uv.abi, signer);
        const signerProvider = signer.provider || provider || null;
        const tx = await uvContract.withdraw(safeTokenAddr, amountWei);
        const receipt = await tx.wait();
        try {
          const network = await signerProvider?.getNetwork?.().catch(() => null);
          const block = receipt?.blockNumber && signerProvider?.getBlock
            ? await signerProvider.getBlock(receipt.blockNumber).catch(() => null)
            : null;
          await indexManualVaultChainHistory({
            userId: walletAddress,
            walletAddress,
            vaultAddress: uv.address,
            chainId: receipt?.chainId || network?.chainId || null,
            txHash: receipt?.transactionHash || null,
            blockNumber: receipt?.blockNumber ?? null,
            blockTimestamp: block?.timestamp ?? null,
            logs: slimReceiptLogs(receipt?.logs),
          });
        } catch (indexErr) {
          if (isDev) console.warn('[useVaultDeposit] manual history index failed', indexErr?.message || indexErr);
        }
        await fetchBalances();
      } catch (e) {
        const msg = e?.message || 'Withdraw failed';
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [uv?.address, uv?.abi, getSigner, fetchBalances, provider, walletAddress]
  );

  return {
    tokenOptions,
    balances,
    loading,
    error,
    refetch,
    deposit,
    withdraw,
    isConnected,
    walletAddress,
    connectWallet,
    vaultReady: !!uv?.address,
  };
}
