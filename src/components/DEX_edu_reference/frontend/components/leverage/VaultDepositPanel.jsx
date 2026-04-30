/**
 * VaultDepositPanel – Alimentare cont: stablecoins USD (USDT, USDC), EUR (EURS, EURC) și fiat (Stripe EUR/USD).
 * Folosit pentru Trade with Leverage și CFD – depuneri în UserVault.
 * Include profitul OTA Auto – user poate withdraw tokenii din Vault.
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ethers } from 'ethers';
import { Wallet, ArrowDownCircle, ArrowUpCircle, CreditCard, Landmark, ChevronDown, RefreshCw } from 'lucide-react';
import { useVaultDeposit } from '../../hooks/useVaultDeposit';
import { getOTAMarketData } from '../../services/aiTradingApiService';
import tokenPriceService from '../../services/tokenPriceService';
import walletBalanceService from '../../services/walletBalanceService';
import StripeVaultDeposit from './StripeVaultDeposit';
import StripeWithdrawToBank from './StripeWithdrawToBank';
import TokenLogo from '../common/TokenLogo';
import { toast } from 'react-toastify';
import '../../styles/components/vault-deposit-panel.css';

const FIAT_PRESETS = [10, 30, 50, 100, 200, 500];

function formatDemoTokenAmount(bal) {
  const n = parseFloat(bal);
  if (Number.isNaN(n) || n <= 0) return '0';
  return n >= 0.0001 ? n.toFixed(4).replace(/\.?0+$/, '') : n.toFixed(8).replace(/\.?0+$/, '');
}

/** Timeout pentru citirea soldului din wallet (ms) – mărit ca pe rețea lentă să apară WBNB, nu 0 */
const WALLET_BALANCE_TIMEOUT_MS = 18000;
/** Timeout pentru fallback RPC BSC (ms) */
const BSC_RPC_FALLBACK_TIMEOUT_MS = 15000;

/** Citește sold ERC20 din wallet prin RPC BSC – toate RPC-urile în paralel, primul răspuns câștigă (evită timeout pe rețea lentă). Fără 1rpc.io/llamarpc – blochează CORS din browser. */
async function fetchErc20BalanceViaBscRpc(walletAddress, tokenAddress, decimals = 18) {
  const addr = (() => { try { return ethers.utils.getAddress(walletAddress); } catch { return walletAddress; } })();
  const tokenAddr = (() => {
    try { return ethers.utils.getAddress(tokenAddress); } catch { }
    try { return ethers.utils.getAddress(String(tokenAddress).toLowerCase()); } catch { }
    return String(tokenAddress).toLowerCase();
  })();
  const rpcs = [
    'https://bsc-dataseed1.binance.org',
    'https://bsc-dataseed2.binance.org',
    'https://bsc-dataseed.binance.org',
    'https://bsc.publicnode.com',
    'https://rpc.ankr.com/bsc',
    'https://bsc-dataseed1.defibit.io',
    'https://bsc-dataseed2.defibit.io',
    'https://bsc-dataseed3.binance.org',
    'https://bsc-dataseed4.binance.org',
  ];
  const abi = ['function balanceOf(address owner) view returns (uint256)'];
  const promises = rpcs.map((rpcUrl) => {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(tokenAddr, abi, provider);
    return contract.balanceOf(addr).then((b) => ethers.utils.formatUnits(b, decimals));
  });
  return firstSuccessful(promises);
}

/** Primul promise care se rezolvă cu succes (fără Promise.any, compatibil peste tot). Folosit și în fetchErc20BalanceViaBscRpc. */
function firstSuccessful(promises) {
  return new Promise((resolve, reject) => {
    let rejected = 0;
    const n = promises.length;
    if (n === 0) {
      reject(new Error('No promises'));
      return;
    }
    promises.forEach((p) => {
      p.then((v) => resolve(v)).catch(() => {
        if (++rejected === n) reject(new Error('All failed'));
      });
    });
  });
}

export default function VaultDepositPanel({
  onBalanceChange,
  className = '',
  isDemoMode = false,
  demoVaultBalances = null,
  onResetDemoBalance = null,
  onAddDemoFiatFunds = null,
}) {
  const {
    tokenOptions,
    balances,
    loading,
    error,
    refetch,
    deposit,
    withdraw,
    isConnected,
    connectWallet,
    walletAddress,
    vaultReady,
  } = useVaultDeposit();

  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const initialMode = (tabFromUrl === 'withdraw' || tabFromUrl === 'stripe' || tabFromUrl === 'bank')
    ? tabFromUrl
    : 'deposit';

  const [selectedToken, setSelectedToken] = useState(null);
  useEffect(() => {
    if (tokenOptions.length && !selectedToken) setSelectedToken(tokenOptions[0]);
  }, [tokenOptions, selectedToken]);
  const [amount, setAmount] = useState('');
  const [txPending, setTxPending] = useState(false);
  const [txError, setTxError] = useState(null);
  const [demoResetting, setDemoResetting] = useState(false);
  const [demoBalancesOpen, setDemoBalancesOpen] = useState(false);
  const demoBalancesWrapRef = useRef(null);
  const [demoTab, setDemoTab] = useState('balances'); // 'balances' | 'fiat'
  const [fiatCurrency, setFiatCurrency] = useState('eur');
  const [fiatSelected, setFiatSelected] = useState(50);
  const [fiatCustom, setFiatCustom] = useState('');
  const [fiatPending, setFiatPending] = useState(false);
  const [fiatMsg, setFiatMsg] = useState(null); // { type: 'ok'|'err', text }
  const [mode, setMode] = useState(initialMode); // 'deposit' | 'withdraw' | 'stripe' | 'bank'
  const [tokenPriceUsd, setTokenPriceUsd] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [tokenSelectOpen, setTokenSelectOpen] = useState(false);
  const tokenSelectRef = useRef(null);
  const [walletBalance, setWalletBalance] = useState('');
  const [walletBalanceLoading, setWalletBalanceLoading] = useState(false);
  const [walletBalanceRefresh, setWalletBalanceRefresh] = useState(0);

  const demoBalancesSummary = useMemo(() => {
    if (!isDemoMode || !tokenOptions?.length) return { primary: null, count: 0 };
    const usdt = demoVaultBalances?.USDT;
    if (usdt != null && parseFloat(usdt) > 0) {
      return { primary: { symbol: 'USDT', amt: formatDemoTokenAmount(usdt) }, count: tokenOptions.length };
    }
    for (const opt of tokenOptions) {
      const b = demoVaultBalances?.[opt.symbol];
      if (b != null && parseFloat(b) > 0) {
        return { primary: { symbol: opt.symbol, amt: formatDemoTokenAmount(b) }, count: tokenOptions.length };
      }
    }
    return { primary: null, count: tokenOptions.length };
  }, [isDemoMode, demoVaultBalances, tokenOptions]);

  useEffect(() => {
    if (!demoBalancesOpen) return undefined;
    const onDoc = (e) => {
      if (demoBalancesWrapRef.current && !demoBalancesWrapRef.current.contains(e.target)) {
        setDemoBalancesOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [demoBalancesOpen]);

  useEffect(() => {
    setDemoBalancesOpen(false);
  }, [demoTab]);

  useEffect(() => {
    const onOutside = (e) => {
      if (tokenSelectRef.current && !tokenSelectRef.current.contains(e.target)) setTokenSelectOpen(false);
    };
    if (tokenSelectOpen) {
      document.addEventListener('mousedown', onOutside);
      return () => document.removeEventListener('mousedown', onOutside);
    }
  }, [tokenSelectOpen]);

  useEffect(() => {
    if (tabFromUrl === 'deposit' || tabFromUrl === 'withdraw' || tabFromUrl === 'stripe' || tabFromUrl === 'bank') {
      setMode(tabFromUrl);
    }
  }, [tabFromUrl]);

  const token = selectedToken || tokenOptions[0];
  /** Preț din piață – getAllTokenPrices dă fallback (BNB 620, CAKE 1.3) când API eșuează, astfel USD value se afișează mereu. */
  const fetchTokenPrice = useCallback(async (symbol) => {
    if (!symbol) return null;
    try {
      if (symbol === 'USDT' || symbol === 'USDC' || symbol === 'BUSD') return 1;
      const prices = await tokenPriceService.getAllTokenPrices([symbol]);
      const price = prices[symbol] ?? prices[String(symbol).toUpperCase()];
      if (typeof price === 'number' && price > 0) return price;
      try {
        const res = await getOTAMarketData(symbol, 'USDT');
        const raw = res?.marketData?.price ?? res?.marketData?.currentPrice ?? res?.price ?? res?.data?.price ?? res?.currentPrice ?? null;
        const p = raw != null && Number.isFinite(Number(raw)) ? Number(raw) : null;
        if (p != null && p > 0) return p;
      } catch (_) { /* backend fail */ }
      return typeof price === 'number' ? price : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const sym = token?.symbol ? String(token.symbol).toUpperCase() : null;
    if (!sym) return;
    const isStable = sym === 'USDT' || sym === 'USDC' || sym === 'BUSD';
    if (isStable) {
      setTokenPriceUsd(1);
      setPriceLoading(false);
      return;
    }
    let cancelled = false;
    setPriceLoading(true);
    setTokenPriceUsd(null);
    fetchTokenPrice(sym)
      .then((price) => {
        if (!cancelled && price != null && typeof price === 'number') setTokenPriceUsd(price);
      })
      .catch(() => {
        if (!cancelled) setTokenPriceUsd(null);
      })
      .finally(() => {
        if (!cancelled) setPriceLoading(false);
      });
    return () => { cancelled = true; };
  }, [token?.symbol, fetchTokenPrice]);

  // Sold în wallet pentru Deposit. Întâi provider injectat; la timeout/eroare pentru ERC20 (ex. WBNB) fallback RPC BSC.
  useEffect(() => {
    if (mode !== 'deposit' || !walletAddress || !token) {
      setWalletBalance('');
      return;
    }
    let cancelled = false;
    setWalletBalanceLoading(true);
    setWalletBalance('');
    const isNative = !token.address || token.address === ethers.constants.AddressZero;
    const decimals = token.decimals ?? 18;

    const applyBalance = (val) => {
      if (!cancelled) setWalletBalance(val || '0');
    };
    const done = () => {
      if (!cancelled) setWalletBalanceLoading(false);
    };

    const fetchWalletBalance = async () => {
      try {
        if (isNative) {
          const addr = (() => { try { return ethers.utils.getAddress(walletAddress); } catch { return walletAddress; } })();
          const bal = await Promise.race([
            walletBalanceService.getNativeBalance(addr),
            new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout')), WALLET_BALANCE_TIMEOUT_MS)),
          ]);
          applyBalance(bal);
        } else {
          // ERC20 (ex. WBNB): citim în paralel de la RPC BSC și de la provider – primul răspuns valid câștigă
          const withTimeout = (p, ms) =>
            Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout')), ms))]);
          const fromRpc = withTimeout(
            fetchErc20BalanceViaBscRpc(walletAddress, token.address, decimals),
            BSC_RPC_FALLBACK_TIMEOUT_MS
          );
          const fromProvider = withTimeout(
            walletBalanceService.getTokenBalance(walletAddress, token.address).then((r) => r?.balance ?? null),
            WALLET_BALANCE_TIMEOUT_MS
          );
          const balance = await firstSuccessful([fromRpc, fromProvider]).catch(() => null);
          if (balance != null && balance !== '') {
            applyBalance(balance);
          } else {
            // Retry o singură dată cu RPC (rețea lentă) înainte de 0
            try {
              const retryMs = 25000;
              const retryBalance = await Promise.race([
                fetchErc20BalanceViaBscRpc(walletAddress, token.address, decimals),
                new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout')), retryMs)),
              ]);
              applyBalance(retryBalance ?? '0');
            } catch (_) {
              applyBalance('0');
            }
          }
        }
      } catch (_) {
        if (!isNative) {
          try {
            const balance = await fetchErc20BalanceViaBscRpc(walletAddress, token.address, decimals);
            applyBalance(balance);
          } catch (_) {
            applyBalance('0');
          }
        } else {
          applyBalance('0');
        }
      } finally {
        done();
      }
    };
    fetchWalletBalance();
    return () => { cancelled = true; };
  }, [mode, walletAddress, token?.address, token?.symbol, token?.decimals, walletBalanceRefresh]);

  const normalizeAmount = (str) => (str == null || str === '' ? '' : String(str).trim().replace(/,/g, '.'));
  const formatUsd = (val) => {
    if (val == null || !Number.isFinite(val)) return '';
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(2)}K`;
    if (val >= 1) return `$${val.toFixed(2)}`;
    if (val >= 0.01) return `$${val.toFixed(4)}`;
    return `$${val.toFixed(6)}`;
  };

  const decimals = token?.decimals ?? 18;
  const amountNum = parseFloat(normalizeAmount(amount));
  const sym = token?.symbol ? String(token.symbol).toUpperCase() : '';
  const isStablecoin = sym === 'USDT' || sym === 'USDC' || sym === 'BUSD';
  const effectivePriceUsd = isStablecoin ? 1 : tokenPriceUsd;
  const usdValue = effectivePriceUsd != null && !Number.isNaN(amountNum) && amountNum >= 0
    ? amountNum * effectivePriceUsd
    : null;
  const balanceRaw = token
    ? (balances[token.address] || balances[String(token.address || '').toLowerCase()] || (token.symbol === 'BNB' ? balances['BNB'] : null) || '0')
    : '0';
  const demoBalanceStr = isDemoMode && demoVaultBalances && token ? (demoVaultBalances[token.symbol] || '0') : null;
  const balanceFormatted = isDemoMode && demoBalanceStr != null
    ? demoBalanceStr
    : ethers.utils.formatUnits(balanceRaw, decimals);
  const balanceNum = parseFloat(balanceFormatted) || 0;
  const formatBalanceDisplay = (v) => {
    const n = parseFloat(v);
    if (Number.isNaN(n) || n <= 0) return '0';
    return n >= 0.0001 ? n.toFixed(6).replace(/\.?0+$/, '') : n.toFixed(8).replace(/\.?0+$/, '');
  };
  const balanceDisplay = formatBalanceDisplay(balanceFormatted);
  /** Sold în cont (vault) – suma afișată lângă Amount, refactorizat într-un singur loc */
  const accountBalanceText = token?.symbol ? `${balanceDisplay} ${token.symbol}` : balanceDisplay;
  /** Sold în wallet (pentru Deposit) – text afișat ca "In wallet: X BNB" */
  const walletBalanceDisplay = walletBalanceLoading
    ? 'Loading…'
    : (mode === 'deposit' && token?.symbol)
      ? `${formatBalanceDisplay(walletBalance)} ${token.symbol}`
      : null;

  /** Text afișat imediat după "USD value:" – mereu non-gol, fallback nbsp dacă gol */
  const usdLineText =
    mode !== 'deposit' && mode !== 'withdraw'
      ? '—'
      : priceLoading
        ? 'Loading price…'
        : !amount.trim()
          ? 'Enter amount above'
          : usdValue != null
            ? `≈ ${usdValue === 0 ? '$0.00' : formatUsd(usdValue)} USD`
            : 'Price unavailable';
  const usdLineDisplay = (usdLineText && String(usdLineText).trim()) ? usdLineText : '\u00A0';

  const getActivePercent = () => {
    if (balanceNum <= 0 || Number.isNaN(amountNum) || amountNum <= 0) return null;
    const ratio = amountNum / balanceNum;
    if (Math.abs(ratio - 0.25) < 0.0001) return 25;
    if (Math.abs(ratio - 0.5) < 0.0001) return 50;
    if (Math.abs(ratio - 0.75) < 0.0001) return 75;
    if (Math.abs(ratio - 1) < 0.0001) return 100;
    return null;
  };
  const activePercent = getActivePercent();
  const walletBalanceNum = parseFloat(walletBalance) || 0;
  const getActivePercentDeposit = () => {
    if (walletBalanceNum <= 0 || Number.isNaN(amountNum) || amountNum <= 0) return null;
    const ratio = amountNum / walletBalanceNum;
    if (Math.abs(ratio - 0.25) < 0.0001) return 25;
    if (Math.abs(ratio - 0.5) < 0.0001) return 50;
    if (Math.abs(ratio - 0.75) < 0.0001) return 75;
    if (Math.abs(ratio - 1) < 0.0001) return 100;
    return null;
  };
  const activePercentDeposit = getActivePercentDeposit();

  const handleMaxDeposit = () => {
    if (walletBalanceLoading || !walletBalance || walletBalanceNum <= 0) return;
    setAmount(walletBalance);
  };

  const handlePercentDeposit = (percent) => {
    if (walletBalanceNum <= 0) return;
    const value = (walletBalanceNum * percent) / 100;
    const formatted = value >= 0.0001 ? value.toFixed(6).replace(/\.?0+$/, '') : value.toFixed(8).replace(/\.?0+$/, '');
    setAmount(formatted);
  };

  const handleMaxWithdraw = () => {
    // Use exact on-chain balance (formatted), never rounded display value.
    // Rounded values can exceed real balance by a few wei and trigger false "Insufficient balance in vault".
    setAmount(balanceFormatted);
  };

  const handlePercentWithdraw = (percent) => {
    if (!balanceRaw) return;
    try {
      const raw = ethers.BigNumber.from(balanceRaw);
      if (raw.lte(0)) return;
      const valueRaw = raw.mul(percent).div(100);
      if (valueRaw.lte(0)) return;
      const exact = ethers.utils.formatUnits(valueRaw, decimals);
      setAmount(exact);
    } catch {
      // Fallback to previous UI behavior if parsing fails unexpectedly.
      const balanceNum = parseFloat(balanceFormatted);
      if (Number.isNaN(balanceNum) || balanceNum <= 0) return;
      const value = (balanceNum * percent) / 100;
      const formatted = value >= 0.0001 ? value.toFixed(6).replace(/\.?0+$/, '') : value.toFixed(8).replace(/\.?0+$/, '');
      setAmount(formatted);
    }
  };

  const handleDeposit = async () => {
    setTxError(null);
    const amtNorm = normalizeAmount(amount);
    if (!amtNorm || isNaN(Number(amtNorm)) || Number(amtNorm) <= 0) {
      setTxError('Enter a valid amount (use . for decimals, e.g. 0.001)');
      return;
    }
    const isNative = !token?.address || token?.address === ethers.constants.AddressZero;
    let amountWei;
    try {
      amountWei = isNative
        ? ethers.utils.parseEther(amtNorm)
        : ethers.utils.parseUnits(amtNorm, decimals);
    } catch (parseErr) {
      setTxError('Invalid amount format. Use dot for decimals (e.g. 0.001)');
      return;
    }
    setTxPending(true);
    try {
      await deposit(token?.address || ethers.constants.AddressZero, amountWei);
      setAmount('');
      onBalanceChange?.();
      toast.success(`Deposit successful. ${amtNorm} ${token?.symbol} added to your Personal Account.`);
    } catch (e) {
      const msg = e?.message || '';
      const code = e?.code;
      if (code === 4001 || /user rejected|user denied|action rejected/i.test(msg)) {
        setTxError('Transaction cancelled in MetaMask.');
      } else if (/insufficient funds|insufficient balance/i.test(msg)) {
        setTxError('Insufficient funds. Keep BNB for gas fees.');
      } else {
        setTxError(msg || 'Deposit failed');
      }
    } finally {
      setTxPending(false);
    }
  };

  const handleWithdraw = async () => {
    setTxError(null);
    const amtNorm = normalizeAmount(amount);
    if (!amtNorm || isNaN(Number(amtNorm)) || Number(amtNorm) <= 0) {
      setTxError('Enter a valid amount (use . for decimals)');
      return;
    }
    let amountWei;
    try {
      amountWei = ethers.utils.parseUnits(amtNorm, decimals);
    } catch {
      setTxError('Invalid amount format. Use dot for decimals');
      return;
    }
    if (ethers.BigNumber.from(balanceRaw).lt(amountWei)) {
      setTxError('Insufficient balance in vault');
      return;
    }
    setTxPending(true);
    try {
      await withdraw(token?.address || ethers.constants.AddressZero, amountWei);
      setAmount('');
      onBalanceChange?.();
      toast.success(`Withdrawal successful. ${amtNorm} ${token?.symbol} sent to your wallet.`);
    } catch (e) {
      setTxError(e?.message || 'Withdraw failed');
    } finally {
      setTxPending(false);
    }
  };

  if (!vaultReady || tokenOptions.length === 0) return null;

  return (
    <section className={`vault-deposit-panel ${className}`}>
      <h2 className="vault-deposit-panel-title">
        <span className="vault-deposit-panel-icon-3d vault-deposit-panel-icon-title" aria-hidden>
          <Wallet size={28} strokeWidth={2} />
        </span>
        {isDemoMode ? 'Demo balance' : 'Fund account (USD / EUR)'}
      </h2>
      <p className="vault-deposit-panel-desc">
        {isDemoMode
          ? 'Same live prices as Real; margin is virtual (saved via demo API when signed in, else locally).'
          : 'Deposit USDT, USDC (USD), EURS, EURC (Euro) or pay with card (Stripe EUR/USD) for Trade with Leverage and CFD. Includes OTA Auto profits – withdraw to wallet.'}
      </p>

      {isDemoMode && onResetDemoBalance ? (
        <div className="vault-deposit-panel-demo" aria-label="Demo balance section">
          <p className="vault-deposit-panel-demo-msg">Training wallet · same market prices as Live · not on-chain.</p>

          {/* Tabs: Balances / Fiat (demo) */}
          <div className="vault-demo-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={demoTab === 'balances'}
              className={`vault-demo-tab${demoTab === 'balances' ? ' active' : ''}`}
              onClick={() => { setDemoTab('balances'); setFiatMsg(null); }}
            >
              <Wallet size={13} aria-hidden /> Balances
            </button>
            {onAddDemoFiatFunds && (
              <button
                type="button"
                role="tab"
                aria-selected={demoTab === 'fiat'}
                className={`vault-demo-tab${demoTab === 'fiat' ? ' active' : ''}`}
                onClick={() => { setDemoTab('fiat'); setFiatMsg(null); }}
              >
                <CreditCard size={13} aria-hidden /> Fiat (demo)
              </button>
            )}
          </div>

          {demoTab === 'balances' ? (
            <>
              {/* Mesaj success după add fiat (persistă în Balances tab) */}
              {fiatMsg?.type === 'ok' && (
                <p className="vault-demo-fiat-msg vault-demo-fiat-msg--ok" role="status">
                  {fiatMsg.text}
                </p>
              )}

              <div className="vault-demo-balances-wrap" ref={demoBalancesWrapRef}>
                <button
                  type="button"
                  className="vault-demo-balances-trigger"
                  aria-expanded={demoBalancesOpen}
                  aria-controls="vault-demo-balances-dropdown"
                  id="vault-demo-balances-trigger"
                  onClick={() => setDemoBalancesOpen((o) => !o)}
                >
                  <span className="vault-demo-balances-trigger-summary">
                    {demoBalancesSummary.primary ? (
                      <>
                        <span className="vault-demo-balances-trigger-logo" aria-hidden>
                          <TokenLogo symbol={demoBalancesSummary.primary.symbol} size="sm" />
                        </span>
                        <span className="vault-demo-balances-trigger-main">
                          {demoBalancesSummary.primary.symbol} {demoBalancesSummary.primary.amt}
                        </span>
                      </>
                    ) : (
                      <span className="vault-demo-balances-trigger-main">All balances zero</span>
                    )}
                    <span className="vault-demo-balances-trigger-meta">
                      {demoBalancesSummary.count} assets · expand
                    </span>
                  </span>
                  <ChevronDown
                    size={18}
                    className={`vault-demo-balances-chevron${demoBalancesOpen ? ' is-open' : ''}`}
                    aria-hidden
                  />
                </button>
                {demoBalancesOpen && (
                  <div
                    className="vault-demo-balances-dropdown"
                    id="vault-demo-balances-dropdown"
                    role="list"
                    aria-label="Demo token balances"
                  >
                    {tokenOptions.map((opt) => {
                      const bal = demoVaultBalances?.[opt.symbol] ?? '0';
                      const n = parseFloat(bal);
                      const display = formatDemoTokenAmount(bal);
                      const hasBalance = !Number.isNaN(n) && n > 0;
                      return (
                        <div
                          key={opt.address || opt.symbol}
                          role="listitem"
                          className={`vault-demo-balance-row${hasBalance ? ' vault-demo-balance-row--has-balance' : ''}`}
                        >
                          <span className="vault-demo-balance-logo" aria-hidden>
                            <TokenLogo symbol={opt.symbol} size="sm" />
                          </span>
                          <span className="vault-demo-balance-symbol">{opt.symbol}</span>
                          <span className="vault-demo-balance-amount">{display}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setDemoResetting(true);
                  onResetDemoBalance()
                    .then(() => onBalanceChange?.())
                    .catch(() => {})
                    .finally(() => setDemoResetting(false));
                }}
                disabled={demoResetting}
                aria-busy={demoResetting}
                className="vault-deposit-panel-btn vault-deposit-panel-btn-secondary vault-deposit-panel-btn-full vault-demo-reset-btn"
              >
                <RefreshCw size={13} aria-hidden />
                {demoResetting ? 'Resetting…' : 'Reset to 10,000 USDT'}
              </button>
            </>
          ) : (
            /* ── Fiat demo panel ── */
            <div className="vault-demo-fiat">
              <p className="vault-demo-fiat-hint">
                Simulate a Fiat deposit. Amount is converted to USDT and added to your demo vault instantly — no real payment.
              </p>

              {/* Currency toggle cu logos — clasele unificate lev-flag-* */}
              <div className="lev-flag-toggle" role="group" aria-label="Currency">
                {[
                  { id: 'eur', symbol: 'EUR', label: 'EUR' },
                  { id: 'usd', symbol: 'USD', label: 'USD' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`lev-flag-btn${fiatCurrency === c.id ? ' active' : ''}`}
                    onClick={() => { setFiatCurrency(c.id); setFiatCustom(''); setFiatSelected(50); setFiatMsg(null); }}
                    aria-pressed={fiatCurrency === c.id}
                  >
                    <span className="lev-flag-logo" aria-hidden>
                      <TokenLogo symbol={c.symbol} size="xs" />
                    </span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>

              {/* Presets — clase unificate lev-amount-* */}
              <div className="lev-amount-presets" role="group" aria-label="Amount presets">
                {FIAT_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`lev-amount-preset${!fiatCustom && fiatSelected === p ? ' active' : ''}`}
                    onClick={() => { setFiatSelected(p); setFiatCustom(''); setFiatMsg(null); }}
                    aria-pressed={!fiatCustom && fiatSelected === p}
                  >
                    {fiatCurrency === 'eur' ? `€${p}` : `$${p}`}
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <input
                type="number"
                min="10"
                step="1"
                className="vault-deposit-panel-input"
                value={fiatCustom}
                onChange={(e) => { setFiatCustom(e.target.value); setFiatMsg(null); }}
                placeholder={`Custom (min. ${fiatCurrency === 'eur' ? '€' : '$'}10)`}
                aria-label="Custom fiat amount"
              />

              {fiatMsg && (
                <p className={`vault-demo-fiat-msg vault-demo-fiat-msg--${fiatMsg.type}`} role="alert">
                  {fiatMsg.text}
                </p>
              )}

              <button
                type="button"
                disabled={fiatPending}
                aria-busy={fiatPending}
                className="vault-deposit-panel-btn vault-deposit-panel-btn-primary vault-deposit-panel-btn-full vault-demo-fiat-pay-btn"
                onClick={async () => {
                  const amt = fiatCustom ? Number(fiatCustom) : fiatSelected;
                  if (!amt || amt < 10) {
                    setFiatMsg({ type: 'err', text: `Minimum ${fiatCurrency === 'eur' ? '€10' : '$10'}.` });
                    return;
                  }
                  setFiatPending(true);
                  setFiatMsg(null);
                  try {
                    await onAddDemoFiatFunds(amt, fiatCurrency);
                    await onBalanceChange?.();
                    const EUR_USD = 1.08;
                    const usdEq = fiatCurrency === 'eur' ? Math.round(amt * EUR_USD) : amt;
                    // Switch automat la tab Balances ca userul sa vada soldul
                    setDemoTab('balances');
                    setFiatMsg({ type: 'ok', text: `✓ ${fiatCurrency === 'eur' ? `€${amt}` : `$${amt}`} → +${usdEq} USDT added. Now open a position →` });
                  } catch {
                    setFiatMsg({ type: 'err', text: 'Failed to add demo funds. Try again.' });
                  } finally {
                    setFiatPending(false);
                  }
                }}
              >
                <CreditCard size={14} aria-hidden />
                {fiatPending
                  ? 'Adding…'
                  : `Add ${fiatCurrency === 'eur' ? `€` : `$`}${fiatCustom || fiatSelected} demo funds`}
              </button>
            </div>
          )}
        </div>
      ) : !isConnected ? (
        <div className="vault-deposit-panel-connect">
          <p>Connect your wallet to deposit or withdraw.</p>
          <button type="button" onClick={connectWallet} className="vault-deposit-panel-btn vault-deposit-panel-btn-primary">
            Connect
          </button>
        </div>
      ) : (
        <>
          <div className="vault-deposit-panel-tabs">
            <button
              type="button"
              className={`vault-deposit-panel-tab ${mode === 'deposit' ? 'active' : ''}`}
              onClick={() => setMode('deposit')}
            >
              <span className="vault-deposit-panel-icon-tab" aria-hidden>
                <ArrowDownCircle size={14} strokeWidth={2} />
              </span>
              Deposit
            </button>
            <button
              type="button"
              className={`vault-deposit-panel-tab ${mode === 'withdraw' ? 'active' : ''}`}
              onClick={() => setMode('withdraw')}
            >
              <span className="vault-deposit-panel-icon-tab" aria-hidden>
                <ArrowUpCircle size={14} strokeWidth={2} />
              </span>
              Withdraw
            </button>
            <button
              type="button"
              className={`vault-deposit-panel-tab ${mode === 'stripe' ? 'active' : ''}`}
              onClick={() => setMode('stripe')}
            >
              <span className="vault-deposit-panel-icon-tab" aria-hidden>
                <CreditCard size={14} strokeWidth={2} />
              </span>
              Card (Stripe)
            </button>
            <button
              type="button"
              className={`vault-deposit-panel-tab ${mode === 'bank' ? 'active' : ''}`}
              onClick={() => setMode('bank')}
            >
              <span className="vault-deposit-panel-icon-tab" aria-hidden>
                <Landmark size={14} strokeWidth={2} />
              </span>
              To bank
            </button>
          </div>

          {mode === 'bank' ? (
            <StripeWithdrawToBank onSuccess={() => { refetch(); onBalanceChange?.(); }} />
          ) : mode === 'stripe' ? (
            <StripeVaultDeposit
              walletAddress={walletAddress}
              isConnected={isConnected}
              connectWallet={connectWallet}
              onSuccess={() => { refetch(); onBalanceChange?.(); }}
            />
          ) : (
          <div className="vault-deposit-panel-form-block">
          <div className="vault-deposit-panel-field vault-deposit-panel-token-field" ref={tokenSelectRef}>
            <label className="vault-deposit-panel-label">Token</label>
            <div
              className={`vault-deposit-panel-token-wrap ${tokenSelectOpen ? 'vault-deposit-panel-token-wrap-open' : ''}`}
            >
              {token?.symbol && (
                <span className="vault-deposit-panel-token-logo" aria-hidden>
                  {TokenLogo ? <TokenLogo symbol={token.symbol} size="sm" /> : <span>{token.symbol}</span>}
                </span>
              )}
              <button
                type="button"
                className="vault-deposit-panel-token-trigger"
                onClick={() => setTokenSelectOpen((o) => !o)}
                aria-label="Select token"
                aria-expanded={tokenSelectOpen}
                aria-haspopup="listbox"
              >
                <span className="vault-deposit-panel-token-trigger-text">
                  {token?.symbol} {token?.name ? `(${token.name})` : ''}
                </span>
                <ChevronDown size={14} className="vault-deposit-panel-token-chevron" aria-hidden />
              </button>
            </div>
            {tokenSelectOpen && (
              <ul className="vault-deposit-panel-token-dropdown" role="listbox" aria-label="Token options">
                {tokenOptions.map((opt) => (
                  <li
                    key={opt.address || 'native'}
                    role="option"
                    aria-selected={(token?.address || ethers.constants.AddressZero) === (opt.address || ethers.constants.AddressZero)}
                    className="vault-deposit-panel-token-option"
                    onClick={() => {
                      setSelectedToken(opt);
                      setTokenSelectOpen(false);
                    }}
                  >
                    <span className="vault-deposit-panel-token-option-logo" aria-hidden>
                      {TokenLogo ? <TokenLogo symbol={opt.symbol} size="sm" /> : <span>{opt.symbol}</span>}
                    </span>
                    <span className="vault-deposit-panel-token-option-text">
                      {opt.symbol} {opt.name ? `(${opt.name})` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="vault-deposit-panel-field vault-deposit-panel-amount-field">
            <div className="vault-deposit-panel-amount-row">
              <span className="vault-deposit-panel-balance vault-deposit-panel-in-account" title={`Balance in Personal Account (vault) for ${token?.symbol || ''}`}>
                <span style={{ color: '#4facfe' }}>In account:</span> {accountBalanceText}
              </span>
              {walletBalanceDisplay != null && (
                <span className="vault-deposit-panel-balance vault-deposit-panel-in-wallet" title={`Balance in connected wallet for ${token?.symbol || ''}`} style={{ display: 'block', marginTop: 4 }}>
                  <span style={{ color: '#7dd87d' }}>In wallet:</span> {walletBalanceDisplay}
                  {mode === 'deposit' && token?.address && !walletBalanceLoading && (parseFloat(walletBalance) || 0) === 0 && (
                    <span className="vault-deposit-panel-wallet-hint" style={{ display: 'block', fontSize: 11, color: 'var(--ds-text-tertiary)', marginTop: 4 }}>Slow network? Press <strong>Refresh balance</strong>.</span>
                  )}
                </span>
              )}
            </div>
            {/* Single 25% 50% 75% Max row: equally visible for Deposit and Withdraw. */}
            {(mode === 'deposit' || mode === 'withdraw') && (
              <div className="vault-deposit-panel-percent-row" data-mode={mode}>
                {mode === 'withdraw' ? (
                  <>
                    <button type="button" onClick={() => handlePercentWithdraw(25)} className={`vault-deposit-panel-percent-btn${activePercent === 25 ? ' active' : ''}`} aria-label="25% of balance">
                      25%
                    </button>
                    <button type="button" onClick={() => handlePercentWithdraw(50)} className={`vault-deposit-panel-percent-btn${activePercent === 50 ? ' active' : ''}`} aria-label="50% of balance">
                      50%
                    </button>
                    <button type="button" onClick={() => handlePercentWithdraw(75)} className={`vault-deposit-panel-percent-btn${activePercent === 75 ? ' active' : ''}`} aria-label="75% of balance">
                      75%
                    </button>
                    <button type="button" onClick={handleMaxWithdraw} className={`vault-deposit-panel-percent-btn vault-deposit-panel-percent-max${activePercent === 100 ? ' active' : ''}`} aria-label="Max (100%)">
                      Max
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => handlePercentDeposit(25)} className={`vault-deposit-panel-percent-btn${activePercentDeposit === 25 ? ' active' : ''}`} aria-label="25% of wallet balance" disabled={walletBalanceLoading || walletBalanceNum <= 0}>
                      25%
                    </button>
                    <button type="button" onClick={() => handlePercentDeposit(50)} className={`vault-deposit-panel-percent-btn${activePercentDeposit === 50 ? ' active' : ''}`} aria-label="50% of wallet balance" disabled={walletBalanceLoading || walletBalanceNum <= 0}>
                      50%
                    </button>
                    <button type="button" onClick={() => handlePercentDeposit(75)} className={`vault-deposit-panel-percent-btn${activePercentDeposit === 75 ? ' active' : ''}`} aria-label="75% of wallet balance" disabled={walletBalanceLoading || walletBalanceNum <= 0}>
                      75%
                    </button>
                    <button type="button" onClick={handleMaxDeposit} className={`vault-deposit-panel-percent-btn vault-deposit-panel-percent-max${activePercentDeposit === 100 ? ' active' : ''}`} aria-label="Max (100% of wallet)" disabled={walletBalanceLoading || walletBalanceNum <= 0}>
                      Max
                    </button>
                  </>
                )}
              </div>
            )}
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(String(e.target.value).replace(/,/g, '.'))}
              placeholder="0"
              className="vault-deposit-panel-input vault-deposit-panel-amount-input"
              aria-label="Amount"
            />
            {/* Loc exact: /dex-edu/leverage?tab=withdraw – un singur text "USD value: X" fără span-uri interioare */}
            <div className="vault-deposit-panel-usd-wrap" data-usd-line="always-visible" data-usd-value={usdLineDisplay}>
              <span className="vault-deposit-panel-usd-label" style={{ color: '#b8b8b8', fontSize: 12, fontWeight: 600 }}>
                {`USD value: ${usdLineDisplay}`}
              </span>
            </div>
            {mode === 'deposit' && token?.symbol === 'BNB' && (
              <p className="vault-deposit-panel-hint">Use dot for decimals (0.001). Keep extra BNB in wallet for gas fees.</p>
            )}
          </div>

          {txPending && (
            <p className="vault-deposit-panel-hint vault-deposit-panel-pending-msg">
              Open MetaMask (check behind other windows). Confirm the transaction.
            </p>
          )}
          {(error || txError) && (
            <div className="vault-deposit-panel-error" role="alert">
              {txError || error}
            </div>
          )}

          <button
            type="button"
            onClick={mode === 'deposit' ? handleDeposit : handleWithdraw}
            disabled={loading || txPending || !amount.trim()}
            className="vault-deposit-panel-btn vault-deposit-panel-btn-primary vault-deposit-panel-btn-full"
          >
            {txPending ? 'Confirm in MetaMask…' : mode === 'deposit' ? 'Deposit to account' : 'Withdraw to wallet'}
          </button>

          <button type="button" onClick={() => { refetch(); setWalletBalanceRefresh((s) => s + 1); }} className="vault-deposit-panel-refresh" disabled={loading}>
            Refresh balance
          </button>
          </div>
          )}
        </>
      )}
    </section>
  );
}

