/**
 * Personal Account: standalone page with all financial data.
 * Crypto (UserVault) + Fiat (Stripe EUR/USD) + clear links.
 * Only the user can withdraw funds: personal account like a bank account.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ethers } from 'ethers';
import {
  Landmark,
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  CircleDollarSign,
  CreditCard,
  Layers,
  Wallet,
  ExternalLink,
  RefreshCw,
  User,
  BarChart2,
  TrendingUp,
} from 'lucide-react';
import { useVaultDeposit } from '../hooks/useVaultDeposit';
import { useClosedPositionsProfitUsd } from '../hooks/useClosedPositionsProfitUsd';
import { useVaultTransactionHistory } from '../hooks/useVaultTransactionHistory';
import { getStripeBalance, getStripeHistory } from '../services/stripeWithdrawalService';
import tokenPriceService from '../services/tokenPriceService';
import FiatConvertPanel from '../components/personal-account/FiatConvertPanel';
import DexNewsletterSection from '../components/personal-account/DexNewsletterSection';
import OtaAgentActiveConfigSection from '../components/personal-account/OtaAgentActiveConfigSection';
import { getBackendUrl } from '../../config/apiEndpoints.js';
import { API_ENDPOINTS } from '../utils/constants';
import { formatNumber } from '../utils/formatters';
import { BITS_FIAT_BALANCE_REFRESH } from '../utils/fiatBalanceEvents';
import { formatFiatWithdrawalStatusLabel, fiatWithdrawalDetailLine } from '../utils/fiatWithdrawalStatusUi';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { CONTRACT_MAP } from '../../../../contract/contractMap';
import '../styles/components/personal-account-page.css';

/** Format history amount (BigNumber or string) with decimals. */
function formatAmountFromHistory(amount, decimals) {
  if (amount == null) return '0';
  try {
    const bn = ethers.BigNumber.isBigNumber(amount) ? amount : ethers.BigNumber.from(String(amount));
    return ethers.utils.formatUnits(bn, decimals);
  } catch {
    return '0';
  }
}

export default function PersonalAccountPage() {
  const navigate = useNavigate();
  const {
    tokenOptions,
    balances,
    loading: cryptoLoading,
    error: cryptoError,
    refetch: refetchCrypto,
    isConnected,
    connectWallet,
    walletAddress,
    vaultReady,
  } = useVaultDeposit();

  const [stripeBalanceEur, setStripeBalanceEur] = useState(0);
  const [stripeBalanceUsd, setStripeBalanceUsd] = useState(0);
  const [stripeDeposits, setStripeDeposits] = useState([]);
  const [stripeWithdrawals, setStripeWithdrawals] = useState([]);
  const [stripeLoading, setStripeLoading] = useState(true);
  const [stripeError, setStripeError] = useState(null);
  const [claimEmail, setClaimEmail] = useState('');
  const [claimCode, setClaimCode] = useState('');
  const [claimStep, setClaimStep] = useState('idle');
  const [claimError, setClaimError] = useState(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [vaultTokenPrices, setVaultTokenPrices] = useState({});
  const [vaultAddressCopied, setVaultAddressCopied] = useState(false);

  const {
    items: cryptoHistory,
    loading: cryptoHistoryLoading,
    error: cryptoHistoryError,
    warning: cryptoHistoryWarning,
    authRequired: cryptoHistoryAuthRequired,
    loadingPhase: cryptoHistoryLoadingPhase,
    isRefreshing: cryptoHistoryRefreshing,
    meta: cryptoHistoryMeta,
    refetch: refetchCryptoHistory,
  } = useVaultTransactionHistory(walletAddress, {
    enableBrowserFallback: false,
    autoEnsureSession: false,
  });

  const {
    totalProfitUsd: otaProfitUsd,
    loading: otaProfitLoading,
    error: otaProfitError,
    authRequired: otaProfitAuthRequired,
    refresh: refreshOtaProfit,
  } = useClosedPositionsProfitUsd(walletAddress, {
    refreshIntervalMs: 60000,
    autoEnsureSession: false,
  });

  const lastVisibilityRefetchRef = useRef(0);
  const lastFiatVisibilityRefetchRef = useRef(0);
  const VISIBILITY_REFETCH_MS = 15000;

  const loadStripe = useCallback(async () => {
    setStripeLoading(true);
    setStripeError(null);
    try {
      const [balanceRes, historyRes] = await Promise.all([
        getStripeBalance(),
        getStripeHistory(),
      ]);
      setStripeBalanceEur(balanceRes.balanceEur ?? 0);
      setStripeBalanceUsd(balanceRes.balanceUsd ?? 0);
      setStripeDeposits(historyRes.deposits ?? []);
      setStripeWithdrawals(historyRes.withdrawals ?? []);
    } catch (e) {
      setStripeError(e?.message || 'Failed to load fiat balance');
      setStripeBalanceEur(0);
      setStripeBalanceUsd(0);
      setStripeDeposits([]);
      setStripeWithdrawals([]);
    } finally {
      setStripeLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStripe();
  }, [loadStripe]);

  useEffect(() => {
    const onFiatRefresh = () => {
      loadStripe();
    };
    window.addEventListener(BITS_FIAT_BALANCE_REFRESH, onFiatRefresh);
    return () => window.removeEventListener(BITS_FIAT_BALANCE_REFRESH, onFiatRefresh);
  }, [loadStripe]);

  /** After an OTA swap, vault balances update on-chain. Refetch when user returns to the tab, limited to 15s to avoid errors / "connecting too often". */
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastFiatVisibilityRefetchRef.current >= VISIBILITY_REFETCH_MS) {
        lastFiatVisibilityRefetchRef.current = now;
        loadStripe();
      }
      if (!isConnected || !vaultReady) return;
      if (cryptoError) {
        lastVisibilityRefetchRef.current = 0;
        refetchCrypto();
        refetchCryptoHistory();
        return;
      }
      if (now - lastVisibilityRefetchRef.current < VISIBILITY_REFETCH_MS) return;
      lastVisibilityRefetchRef.current = now;
      refetchCrypto();
      refetchCryptoHistory();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [isConnected, vaultReady, cryptoError, refetchCrypto, refetchCryptoHistory, loadStripe]);

  /** USD prices for vault tokens, once after balances load; avoids loop because tokenOptions is now stable in useVaultDeposit. */
  const tokenSymbolsKey = tokenOptions?.length ? tokenOptions.map((t) => t.symbol).sort().join(',') : '';
  useEffect(() => {
    if (cryptoLoading || !tokenSymbolsKey) return;
    const symbols = tokenSymbolsKey.split(',');
    tokenPriceService.getAllTokenPrices(symbols).then((p) => setVaultTokenPrices(p || {})).catch(() => {});
  }, [cryptoLoading, tokenSymbolsKey]);

  /** All vault tokens (tokenOptions): preferred order, then alphabetical. Includes all vault values (USDT, BNB, DOGE, XRP, etc.). */
  const PREFERRED_ORDER = ['USDT', 'USDC', 'BNB', 'MATIC', 'DOGE', 'XRP', 'BITS', 'ETH', 'BTC', 'SOL', 'CAKE', 'SHIB', 'ADA', 'LINK', 'EURS', 'EURC', 'BUSD', 'DAI'];
  const visibleCrypto = [...(tokenOptions || [])].sort((a, b) => {
    const iA = PREFERRED_ORDER.indexOf(a.symbol);
    const iB = PREFERRED_ORDER.indexOf(b.symbol);
    if (iA !== -1 && iB !== -1) return iA - iB;
    if (iA !== -1) return -1;
    if (iB !== -1) return 1;
    return (a.symbol || '').localeCompare(b.symbol || '');
  });

  const hasCryptoBalance = visibleCrypto.some((t) => {
    const raw = balances[t.address] || balances[String(t.address || '').toLowerCase()] || (t.symbol === 'BNB' ? balances['BNB'] : null) || '0';
    return raw !== '0' && raw !== '0x0';
  });
  /** Vault tokens: show tokens with balance > 0 plus always BNB, DOGE, and STX, even if 0, so they remain visible. */
  const cryptoWithBalance = visibleCrypto.filter((t) => {
    const raw = balances[t.address] || balances[String(t.address || '').toLowerCase()] || (t.symbol === 'BNB' ? balances['BNB'] : null) || (t.symbol === 'DOGE' ? (balances['DOGE'] ?? balances['0xba2ae424d960c26247dd6c32edc70b295c744c43'] ?? balances['0xba2ae424d960c26247dd6c32edc70b295c744c43'.toLowerCase()]) : null) || '0';
    if (t.symbol === 'BNB' || t.symbol === 'DOGE' || t.symbol === 'STX') return true;
    if (raw === '0' || raw === '0x0') return false;
    try {
      const formatted = ethers.utils.formatUnits(raw, t.decimals ?? 18);
      if (parseFloat(formatted) <= 0 || !Number.isFinite(parseFloat(formatted))) return false;
    } catch {
      return false;
    }
    return true;
  });
  const hasFiatBalance = (stripeBalanceEur && stripeBalanceEur > 0) || (stripeBalanceUsd && stripeBalanceUsd > 0);
  const needsClaim = stripeError && /authenticated|401/i.test(String(stripeError));

  const handleClaimSendCode = async () => {
    const email = claimEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setClaimError('Enter a valid email address.');
      return;
    }
    setClaimError(null);
    setClaimLoading(true);
    try {
      const res = await fetch(`${getBackendUrl()}${API_ENDPOINTS.AUTH_CLAIM_STRIPE_SEND_CODE || '/api/auth/claim-stripe/send-code'}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || data?.error || 'Failed to send');
      }
      setClaimStep('email_sent');
    } catch (e) {
      setClaimError(e?.message || 'Error');
    } finally {
      setClaimLoading(false);
    }
  };

  const handleClaimVerify = async () => {
    const email = claimEmail.trim().toLowerCase();
    const code = claimCode.trim();
    if (!email || !code || code.length !== 6) {
      setClaimError('Code must be 6 digits.');
      return;
    }
    setClaimError(null);
    setClaimLoading(true);
    try {
      const res = await fetch(`${getBackendUrl()}${API_ENDPOINTS.AUTH_CLAIM_STRIPE_VERIFY || '/api/auth/claim-stripe/verify'}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || data?.error || 'Invalid code');
      }
      setClaimStep('verified');
      setClaimEmail('');
      setClaimCode('');
      loadStripe();
    } catch (e) {
      setClaimError(e?.message || 'Error');
    } finally {
      setClaimLoading(false);
    }
  };

  const goTo = (tab) => {
    navigate(`/dex-edu/leverage?tab=${tab}`);
  };

  const renderCryptoHistoryTable = (rows, emptyText) => {
    if (!rows.length) {
      return (
        <div className="personal-account-history-wrap" style={{ padding: 24, textAlign: 'center', color: 'var(--ds-text-tertiary)', fontSize: 13 }}>
          {emptyText}
        </div>
      );
    }
    return (
      <div className="personal-account-history-wrap" role="region" aria-label="Crypto history table">
        <table className="personal-account-history-table" role="grid" aria-label="Deposit and withdrawal history">
          <thead>
            <tr>
              <th>Date</th>
              <th>Token</th>
              <th>Amount</th>
              <th>Tx</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const amtStr = formatAmountFromHistory(r.amount, r.decimals);
              const amtNum = parseFloat(amtStr) || 0;
              const price = vaultTokenPrices[r.symbol] ?? 0;
              const usd = amtNum * price;
              const usdStr = usd > 0 ? ` ≈ $${usd.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '';
              return (
                <tr key={`${r.type}-${r.txHash}-${r._sort}`}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                    {r.blockTimestamp
                      ? new Date(r.blockTimestamp * 1000).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : `Block ${r.blockNumber}`}
                  </td>
                  <td style={{ fontWeight: 600 }} title={r.token || r.symbol}>{r.symbol}</td>
                  <td className="personal-account-amount-cell">
                    <span className="personal-account-amount-value">{amtStr}</span>
                    {usdStr && <span style={{ fontSize: 11, color: 'var(--ds-text-secondary)', marginLeft: 4 }}>{usdStr}</span>}
                  </td>
                  <td>
                    <a href={`https://bscscan.com/tx/${r.txHash}`} target="_blank" rel="noopener noreferrer" className="personal-account-tx-link" title={r.txHash}>
                      {r.txHash ? `${String(r.txHash).slice(0, 10)}…` : '—'}
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="personal-account-page">
      <div className="personal-account-page-header">
        <div className="personal-account-page-header-row">
          <h1 className="personal-account-page-title">
            <Landmark size={28} aria-hidden />
            Personal Account
          </h1>
          {isConnected && walletAddress ? (
            <Link
              to="/dex-edu/site-admin"
              className="personal-account-site-admin-link"
              aria-label="Site admin (owner tools)"
              title="Site admin"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </Link>
          ) : null}
        </div>
        <p className="personal-account-page-desc">
          Your funds – only you can withdraw. Crypto for trading; fiat (card) for Leverage/CFD or bank withdrawal.
        </p>
        <div className="personal-account-page-actions">
          <Link to="/dex-edu/account/analytics" className="personal-account-page-btn personal-account-page-btn-ghost" aria-label="Trade Cost Analytics - OTA costs, gas, PnL">
            <BarChart2 size={16} aria-hidden />
            Cost Analytics
          </Link>
          <Link to="/dex-edu/profile" className="personal-account-page-btn personal-account-page-btn-ghost personal-account-profile-link" aria-label="Profile – email, phone, IBAN">
            <User size={16} aria-hidden />
            Profile
          </Link>
          <button type="button" onClick={() => { refetchCrypto(); refetchCryptoHistory(); loadStripe(); try { window.dispatchEvent(new CustomEvent('bits-vault-balances-refetch')); } catch (_) {} }} disabled={cryptoLoading || stripeLoading} className="personal-account-page-btn personal-account-page-btn-ghost" aria-label="Refresh all balances">
            <RefreshCw size={16} className={cryptoLoading || stripeLoading ? 'spinning' : ''} aria-hidden />
            Refresh
          </button>
        </div>
      </div>

      {/* OTA Trading: realized profit; money is already in Vault, shown here for accounting. */}
      {isConnected && walletAddress && (
        <section className="personal-account-section" role="region" aria-label="OTA Trading profit">
          <h2 className="personal-account-section-title">
            <TrendingUp size={20} aria-hidden />
            OTA Trading - realized profit
          </h2>
          <p className="personal-account-page-muted personal-account-vault-hint" style={{ marginBottom: 12 }}>
            Profit from closed OTA transactions (Auto + Direct Entry). Funds are already in Vault; see balances below.
          </p>
          {otaProfitLoading ? (
            <LoadingSpinner size="small" message="Loading…" />
          ) : otaProfitAuthRequired ? (
            <p className="personal-account-page-muted" style={{ marginBottom: 0 }}>
              OTA profit is displayed only when an active OTA session already exists. The Account page no longer opens MetaMask automatically for this card.
            </p>
          ) : otaProfitError ? (
            <p className="personal-account-page-muted" style={{ color: 'var(--color-error, #f44)' }}>{otaProfitError}</p>
          ) : (
            <div className="personal-account-ota-profit-row" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
              <span className="personal-account-balance-token" style={{ fontWeight: 600 }}>Total realized profit</span>
              <span className="personal-account-balance-amount personal-account-amount-value" style={{ fontSize: '1.25rem', fontWeight: 700, color: otaProfitUsd >= 0 ? 'var(--color-success, #0a0)' : 'var(--color-error, #f44)' }}>
                ${formatNumber(otaProfitUsd, 2)} USD
              </span>
              <button type="button" onClick={() => { refreshOtaProfit(); refetchCrypto(); }} disabled={otaProfitLoading} className="personal-account-page-btn personal-account-page-btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} aria-label="Refresh OTA profit">
                <RefreshCw size={14} className={otaProfitLoading ? 'spinning' : ''} aria-hidden />
              </button>
            </div>
          )}
          <div className="personal-account-link-row" style={{ marginTop: 8 }}>
            <Link to="/dex-edu/ota" className="personal-account-page-link">Auto Trade (execution details)</Link>
            <Link to="/dex-edu/account/analytics" className="personal-account-page-link">Cost Analytics (gas, PnL)</Link>
          </div>
        </section>
      )}

      {/* Crypto balances – requires vault + wallet */}
      {vaultReady && (
      <section className="personal-account-section" role="region" aria-label="Vault balances">
        <h2 className="personal-account-section-title">
          <Wallet size={20} aria-hidden />
          Vault (contract - not your wallet)
        </h2>
        <p className="personal-account-page-muted personal-account-vault-hint">
          On-chain balances in the <strong>Vault contract</strong>. <strong>USD estimates</strong> from market prices (cache/fallback if unavailable). Values may differ from BscScan. To add funds: use "Deposit from wallet". After an OTA swap: press <strong>Refresh</strong> or return to this tab to see the new amounts.
        </p>
        {CONTRACT_MAP?.USER_VAULT?.address && (
          <div className="personal-account-vault-address-row" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="personal-account-page-muted" style={{ fontSize: 12 }}>Contract (BSC):</span>
            <code className="personal-account-vault-address" style={{ fontSize: 12, padding: '4px 8px', background: 'var(--ds-bg-subtle, #f0f0f0)', borderRadius: 6, wordBreak: 'break-all', userSelect: 'all' }} title="Click to select, then copy">
              {CONTRACT_MAP.USER_VAULT.address}
            </code>
            <button
              type="button"
              onClick={() => {
                try {
                  navigator.clipboard.writeText(CONTRACT_MAP.USER_VAULT.address);
                  setVaultAddressCopied(true);
                  setTimeout(() => setVaultAddressCopied(false), 2000);
                } catch (_) {}
              }}
              className="personal-account-page-btn personal-account-page-btn-ghost"
              style={{ padding: '4px 10px', fontSize: 12 }}
              aria-label="Copy Vault contract address"
              title="Copy address"
            >
              {vaultAddressCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}
        {!isConnected ? (
          <div className="personal-account-connect-prompt">
            <p className="personal-account-page-muted">Connect wallet to see crypto balance.</p>
            <button
              type="button"
              onClick={() => { if (typeof connectWallet === 'function') connectWallet('evm'); }}
              className="personal-account-page-btn personal-account-page-btn-primary"
              aria-label="Open wallet connection modal"
            >
              Connect wallet
            </button>
          </div>
        ) : cryptoLoading ? (
          <LoadingSpinner size="small" message="Loading…" />
        ) : (
          <>
            {cryptoError && (
              <p className="personal-account-page-muted" style={{ color: 'var(--color-error, #f44)', marginBottom: 12 }}>
                {cryptoError}
                <button type="button" onClick={() => { refetchCrypto(); try { window.dispatchEvent(new CustomEvent('bits-vault-balances-refetch')); } catch (_) {} }} className="personal-account-page-btn personal-account-page-btn-ghost" style={{ marginLeft: 8, padding: '2px 8px', fontSize: 12 }}>Retry</button>
              </p>
            )}
          <ul className="personal-account-balance-list">
            {(() => {
              const getRaw = (t) => balances[t.address] || balances[String(t.address || '').toLowerCase()] || (t.symbol === 'BNB' ? balances['BNB'] : null) || (t.symbol === 'DOGE' ? (balances['DOGE'] ?? balances['0xba2ae424d960c26247dd6c32edc70b295c744c43'] ?? balances['0xba2ae424d960c26247dd6c32edc70b295c744c43'.toLowerCase()]) : null) || '0';
              const rows = cryptoWithBalance.map((t) => {
                const raw = getRaw(t);
                const num = parseFloat(ethers.utils.formatUnits(raw, t.decimals ?? 18));
                const isStable = (t.symbol || '').match(/USDT|USDC|BUSD|EURS|EURC/i);
                const isPresaleToken = (t.symbol || '').toUpperCase() === 'BITS';
                const decimals = isStable ? 2 : (t.symbol === 'BITS' ? 2 : 6);
                const display = num >= 0.000001 ? (num < 0.01 ? '<0.01' : formatNumber(num, Math.min(decimals, 8))) : '0';
                const priceUsd = isStable ? 1 : (vaultTokenPrices[t.symbol] ?? 0);
                const usdValue = num * priceUsd;
                return { t, display, priceUsd, usdValue, isPresaleToken };
              });
              // Total (USD) = sum of displayed rows, excluding BITS (Presale price, not listed). One faithful calculation.
              const totalVaultUsd = rows.reduce((sum, r) => sum + (r.isPresaleToken ? 0 : r.usdValue), 0);
              return (
                <>
                  {rows.map(({ t, display, priceUsd, usdValue, isPresaleToken }) => {
                    const usdDisplay = priceUsd > 0 ? `≈ $${formatNumber(usdValue, usdValue >= 1 ? 2 : 4)}` : null;
                    const presaleLabel = isPresaleToken && usdDisplay ? ' (Presale price – not listed)' : null;
                    const unitPriceLabel = isPresaleToken && priceUsd > 0
                      ? `1 ${t.symbol} = $${formatNumber(priceUsd, priceUsd >= 0.01 ? 2 : priceUsd >= 0.001 ? 3 : priceUsd >= 0.0001 ? 4 : 6)}`
                      : null;
                    return (
                      <li key={t.symbol} className="personal-account-balance-item">
                        <span className="personal-account-balance-token">{t.symbol}</span>
                        <span className="personal-account-balance-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                          <span className="personal-account-balance-amount personal-account-amount-value">{display}</span>
                          {usdDisplay != null && (
                            <span className="personal-account-balance-usd" aria-label={isPresaleToken ? `${t.symbol} value at Presale price, not listed` : `${t.symbol} value in USD`}>
                              {usdDisplay}
                              {unitPriceLabel && <span className="personal-account-presale-label">{unitPriceLabel}</span>}
                              {presaleLabel && <span className="personal-account-presale-label">{presaleLabel}</span>}
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                  {cryptoWithBalance.length === 0 && (
                    <li className="personal-account-balance-item personal-account-balance-empty personal-account-page-muted" style={{ listStyle: 'none', padding: 8 }}>
                      No balance in vault. Use Deposit from wallet to add funds.
                    </li>
                  )}
                  {rows.length > 0 && (
                    <li key="total-vault-usd" className="personal-account-balance-item personal-account-balance-total">
                      <span className="personal-account-balance-token">Total (USD)</span>
                      <span className="personal-account-balance-amount personal-account-amount-value">${formatNumber(totalVaultUsd, totalVaultUsd >= 1 ? 2 : 4)}</span>
                    </li>
                  )}
                </>
              );
            })()}
          </ul>
          </>
        )}
        {isConnected && (
        <div className="personal-account-link-row">
          <button type="button" onClick={() => goTo('deposit')} className="personal-account-page-link">
            <ArrowDownCircle size={16} aria-hidden />
            Deposit from wallet
          </button>
          <button type="button" onClick={() => goTo('withdraw')} className="personal-account-page-link">
            <ArrowUpCircle size={16} aria-hidden />
            Withdraw to wallet
          </button>
        </div>
        )}
      </section>
      )}

      {/* Fiat (Stripe) balances: uses session, no wallet needed; visually grouped with Convert below in the same FIAT area. */}
      <section className="personal-account-section personal-account-fiat-card" role="region" aria-label="Fiat balances">
        <h2 className="personal-account-section-title">
          <CreditCard size={20} aria-hidden />
          Fiat (card – EUR / USD)
        </h2>
        <p className="personal-account-fiat-lead personal-account-fiat-lead--tight">
          EUR and USD share one server-side ledger — same pool here, in Profile, Leverage, and <strong>Convert</strong> below.
        </p>
        {!stripeLoading && !needsClaim && !stripeError && (
          <div
            className="personal-account-fiat-source"
            aria-label="Available fiat by currency (server ledger)"
          >
            <div className="personal-account-fiat-source__head">
              <Layers className="personal-account-fiat-source__head-ico" size={17} strokeWidth={1.75} aria-hidden />
              <div className="personal-account-fiat-source__head-text">
                <span className="personal-account-fiat-source__eyebrow">Source of funds</span>
                <span className="personal-account-fiat-source__title">Available fiat</span>
                <span className="personal-account-fiat-source__hint">
                  Card top-ups held on the server ledger (not a live bank-balance feed). Convert draws from these EUR/USD buckets.
                </span>
              </div>
            </div>
            <div className="personal-account-fiat-source__stats">
              <div className="personal-account-fiat-stat personal-account-fiat-stat--eur">
                <span className="personal-account-fiat-stat__label">
                  <Banknote size={13} strokeWidth={1.75} className="personal-account-fiat-stat__label-ico" aria-hidden />
                  EUR
                </span>
                <span className="personal-account-fiat-stat__value personal-account-amount-value">
                  €{formatNumber(stripeBalanceEur, 2)}
                </span>
              </div>
              <div className="personal-account-fiat-stat personal-account-fiat-stat--usd">
                <span className="personal-account-fiat-stat__label">
                  <CircleDollarSign size={13} strokeWidth={1.75} className="personal-account-fiat-stat__label-ico" aria-hidden />
                  USD
                </span>
                <span className="personal-account-fiat-stat__value personal-account-amount-value">
                  ${formatNumber(stripeBalanceUsd, 2)}
                </span>
              </div>
            </div>
          </div>
        )}
        <div className="personal-account-fiat-hub" role="navigation" aria-label="Fiat card: main actions">
          <p className="personal-account-fiat-hub-note personal-account-page-muted">
            {!stripeLoading && !needsClaim && !stripeError
              ? 'These actions apply to the EUR and USD amounts above (same ledger Convert uses).'
              : 'Add funds, convert to BNB/USDT on BSC, or request a bank withdrawal (processed manually).'}
          </p>
          <div className="personal-account-fiat-hub-actions">
            <button type="button" onClick={() => goTo('stripe')} className="personal-account-page-btn personal-account-page-btn-primary">
              <CreditCard size={16} aria-hidden />
              Add funds (card)
            </button>
            <button
              type="button"
              onClick={() => { document.getElementById('fiat-convert-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
              className="personal-account-page-btn personal-account-page-btn-outline"
            >
              <ArrowDownCircle size={16} aria-hidden />
              Convert fiat → crypto
            </button>
            <button type="button" onClick={() => goTo('bank')} className="personal-account-page-btn personal-account-page-btn-outline">
              <Landmark size={16} aria-hidden />
              Bank withdrawal
            </button>
          </div>
        </div>
        {stripeLoading ? (
          <div className="personal-account-fiat-status personal-account-fiat-status--loading" aria-live="polite">
            <LoadingSpinner size="small" message="Loading fiat balance…" />
          </div>
        ) : needsClaim ? (
          <div className="personal-account-claim-box">
            <p className="personal-account-page-muted" style={{ marginBottom: 12 }}>
              Paid with card but don&apos;t see the balance? Enter the email used at Stripe Checkout to identify your account.
            </p>
            {claimStep === 'idle' && (
              <>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={claimEmail}
                  onChange={(e) => { setClaimEmail(e.target.value); setClaimError(null); }}
                  className="personal-account-input"
                  autoComplete="email"
                  disabled={claimLoading}
                  aria-label="Email used at checkout"
                />
                <button type="button" onClick={handleClaimSendCode} disabled={claimLoading} className="personal-account-page-btn personal-account-page-btn-primary" style={{ marginTop: 8 }}>
                  {claimLoading ? 'Sending…' : 'Send code to email'}
                </button>
              </>
            )}
            {claimStep === 'email_sent' && (
              <>
                <p className="personal-account-page-muted" style={{ marginBottom: 8 }}>Code sent to {claimEmail}. Check your inbox (and spam).</p>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="000000"
                  maxLength={6}
                  value={claimCode}
                  onChange={(e) => { setClaimCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setClaimError(null); }}
                  className="personal-account-input"
                  style={{ width: 120 }}
                  disabled={claimLoading}
                  aria-label="6-digit verification code"
                />
                <button type="button" onClick={handleClaimVerify} disabled={claimLoading || claimCode.length !== 6} className="personal-account-page-btn personal-account-page-btn-primary" style={{ marginTop: 8 }}>
                  {claimLoading ? 'Verifying…' : 'Verify'}
                </button>
              </>
            )}
            {claimStep === 'verified' && (
              <p className="personal-account-page-muted" style={{ color: 'var(--color-success, #00ffa3)' }}>Verified. Reloading balance…</p>
            )}
            {claimError && <p className="personal-account-page-muted" style={{ color: 'var(--color-error, #f44)', marginTop: 8 }}>{claimError}</p>}
          </div>
        ) : stripeError ? (
          <p className="personal-account-page-muted">{stripeError}</p>
        ) : null}
      </section>

      {/* Convert Fiat → crypto: immediately after card balance (same ledger), before crypto History. Anchor always in DOM for hub scroll. */}
      <div id="fiat-convert-anchor" className="personal-account-fiat-convert-anchor personal-account-fiat-convert-anchor--grouped" tabIndex={-1}>
        {!stripeLoading && !stripeError && !needsClaim ? (
          <FiatConvertPanel
            stripeBalanceEur={stripeBalanceEur}
            stripeBalanceUsd={stripeBalanceUsd}
            walletAddress={walletAddress}
            isConnected={isConnected}
            connectWallet={connectWallet}
            onSuccess={loadStripe}
          />
        ) : null}
      </div>

      {/* History (crypto): UserVault BSC FundsDeposited / FundsWithdrawn, list from backend analytics. */}
      {walletAddress && (
        <section className="personal-account-section personal-account-section--history-secondary" role="region" aria-label="Crypto deposit and withdrawal history">
          <div className="personal-account-history-header-row">
            <div>
              <h2 className="personal-account-section-title personal-account-section-title--secondary">History (crypto)</h2>
              <p className="personal-account-page-muted personal-account-history-bsc-tag">BSC · UserVault</p>
            </div>
            <button
              type="button"
              onClick={() => refetchCryptoHistory({ manual: true })}
              disabled={cryptoHistoryLoading}
              className="personal-account-page-btn personal-account-page-btn-outline personal-account-history-refresh-btn"
            >
              {cryptoHistoryLoading ? (cryptoHistoryRefreshing ? 'Updating...' : 'Loading...') : 'Refresh'}
            </button>
          </div>
          <p className="personal-account-page-muted personal-account-history-lead">
            Transfers between the connected wallet and UserVault (BSC): UserVault events (deposits/withdrawals) and, where applicable, ERC20 transfer from the vault contract to the wallet (for example BEP20 token). Internal OTA executions are not included. The list comes from the server index; if it is syncing, recent withdrawals may not be listed yet. You can verify the transaction on BscScan at the UserVault proxy address.
          </p>
          {CONTRACT_MAP?.USER_VAULT?.address && walletAddress && (
            <div className="personal-account-bscscan-hint personal-account-bscscan-hint--compact">
              <span className="personal-account-bscscan-hint-label">Explorer check</span>
              {' — '}
              your address and the Vault contract; same chain (BSC) as below.
              <div className="personal-account-bscscan-hint-links">
                <a
                  href={`https://bscscan.com/address/${ethers.utils.getAddress(walletAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="personal-account-page-link personal-account-page-link--compact"
                >
                  <ExternalLink size={14} aria-hidden className="personal-account-bscscan-icon" />
                  Wallet
                </a>
                <a
                  href={`https://bscscan.com/address/${ethers.utils.getAddress(CONTRACT_MAP.USER_VAULT.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="personal-account-page-link personal-account-page-link--compact"
                >
                  <ExternalLink size={14} aria-hidden className="personal-account-bscscan-icon" />
                  UserVault
                </a>
              </div>
            </div>
          )}
          {cryptoHistoryWarning && !cryptoHistoryError && (
            <div className="personal-account-history-banner personal-account-history-banner--warn" role="status">
              {cryptoHistoryWarning}
            </div>
          )}
          {cryptoHistoryAuthRequired && !cryptoHistoryError && !cryptoHistoryLoading && (
            <div className="personal-account-history-banner personal-account-history-banner--warn" role="status">
              History (crypto) is displayed only when an active OTA session already exists. The Account page no longer opens MetaMask automatically for this table.
            </div>
          )}
          {cryptoHistoryError && (
            <div className="personal-account-history-banner personal-account-history-banner--error">
              {cryptoHistoryError}
              <button type="button" onClick={() => refetchCryptoHistory({ manual: true })} className="personal-account-page-btn personal-account-page-btn-outline personal-account-history-retry">
                Retry
              </button>
            </div>
          )}
          {cryptoHistoryLoading && !cryptoHistoryRefreshing ? (
            <div className="personal-account-history-wrap personal-account-history-loading">
              {cryptoHistoryLoadingPhase === 'browser'
                ? 'Short network read (fallback enabled)... max ~30s.'
                : 'Loading history from index...'}
            </div>
          ) : null}
          {(!cryptoHistoryLoading || cryptoHistoryRefreshing) ? (() => {
            const list = Array.isArray(cryptoHistory) ? cryptoHistory : [];
            const deposits = list.filter((r) => r?.type === 'deposit');
            const withdrawals = list.filter((r) => r?.type === 'withdraw');
            const recentUserFacingOk = cryptoHistoryMeta?.recentUserFacingCoverageOk === true;
            const possiblyIncompleteRecent =
              !recentUserFacingOk &&
              (cryptoHistoryMeta?.syncStatus === 'syncing' ||
                cryptoHistoryMeta?.syncStatus === 'backfill_partial' ||
                cryptoHistoryMeta?.historicalBackfillInProgress === true);
            const emptyWithdrawCopy = possiblyIncompleteRecent
              ? 'No withdrawal appears in the loaded list yet; the recent window may still be indexing, or the transaction may have just confirmed. Retry Refresh; on BscScan, verify the transfer from the UserVault proxy to wallet.'
              : 'No withdrawal in the loaded list.';
            if (cryptoHistoryAuthRequired) {
              return (
                <div className="personal-account-history-wrap personal-account-history-empty-ok">
                  Crypto history remains available after a valid OTA session already exists. On `/dex-edu/account`, we no longer request a MetaMask signature automatically.
                </div>
              );
            }
            if (list.length === 0) {
              if (cryptoHistoryError) {
                return (
                  <div className="personal-account-history-wrap personal-account-history-empty-error">
                    The list could not load from the server; see the message above. This does not necessarily mean there are no on-chain events.
                  </div>
                );
              }
              return (
                <div className="personal-account-history-wrap personal-account-history-empty-ok">
                  No deposit or withdrawal found in the loaded list. If you just made a transaction, wait for confirmation or press Refresh; you can also verify on BscScan.
                </div>
              );
            }
            return (
              <div className={`personal-account-history-body-wrap${cryptoHistoryRefreshing ? ' personal-account-history-body-wrap--refreshing' : ''}`}>
                {cryptoHistoryRefreshing ? (
                  <div className="personal-account-history-refresh-overlay" role="status">
                    Updating list...
                  </div>
                ) : null}
                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <div className="personal-account-history-subtitle personal-account-history-subtitle--dep">Deposits</div>
                    {renderCryptoHistoryTable(deposits, 'No deposit in the loaded list.')}
                  </div>
                  <div>
                    <div className="personal-account-history-subtitle personal-account-history-subtitle--wit">Withdrawals</div>
                    {renderCryptoHistoryTable(withdrawals, emptyWithdrawCopy)}
                  </div>
                </div>
              </div>
            );
          })() : null}
        </section>
      )}

      {/* History (card) – Stripe deposits/withdrawals */}
      {(stripeDeposits.length > 0 || stripeWithdrawals.length > 0) && (
        <section className="personal-account-section" role="region" aria-label="Card deposit and withdrawal history">
          <h2 className="personal-account-section-title">History (card)</h2>
          <p className="personal-account-page-muted" style={{ marginBottom: 8, fontSize: 12 }}>
            Stripe provides customer_email and metadata.wallet_address – the backend returns them for clear attribution.
          </p>
          <div className="personal-account-history-wrap">
            <table className="personal-account-history-table" role="grid">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {stripeDeposits.map((d) => (
                  <tr key={`dep-${d.id}`}>
                    <td>{d.created_at ? new Date(d.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                    <td>Deposit</td>
                    <td className="personal-account-amount-cell"><span className="personal-account-amount-value">{d.currency === 'usd' ? `$${Number(d.amount_usd || 0).toFixed(2)}` : `€${Number(d.amount_eur || 0).toFixed(2)}`}</span></td>
                    <td>{d.payment_status || 'paid'}</td>
                    <td className="personal-account-attribution-cell">
                      {d.customer_email && <span className="personal-account-deposit-email" title={d.customer_email}>{d.customer_email}</span>}
                      {d.wallet_address && <span className="personal-account-deposit-wallet" title={d.wallet_address}>{d.wallet_address.slice(0, 8)}…{d.wallet_address.slice(-6)}</span>}
                      {!d.customer_email && !d.wallet_address && '—'}
                    </td>
                  </tr>
                ))}
                {stripeWithdrawals.map((w) => (
                  <tr key={`wit-${w.id}`}>
                    <td>{w.created_at ? new Date(w.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                    <td>Withdrawal</td>
                    <td className="personal-account-amount-cell"><span className="personal-account-amount-value">{w.currency === 'usd' ? `$${Number(w.amount || 0).toFixed(2)}` : `€${Number(w.amount || 0).toFixed(2)}`}</span></td>
                    <td title={fiatWithdrawalDetailLine(w) || undefined}>{formatFiatWithdrawalStatusLabel(w.status)}</td>
                    <td className="personal-account-page-muted" style={{ fontSize: 12, maxWidth: 220 }}>
                      {fiatWithdrawalDetailLine(w) || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {walletAddress && <OtaAgentActiveConfigSection walletAddress={walletAddress} />}

      <DexNewsletterSection walletAddress={walletAddress} />

      {/* Quick link to Leverage full page */}
      <div className="personal-account-footer">
        <button type="button" onClick={() => navigate('/dex-edu/leverage')} className="personal-account-page-btn personal-account-page-btn-outline">
          <ExternalLink size={16} aria-hidden />
          Open Leverage (full Deposit/Withdraw/Stripe)
        </button>
      </div>
    </div>
  );
}
