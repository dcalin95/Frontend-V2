/* eslint-disable */
/**
 * 📋 Header Component - Main Header
 * 
 * Header component for the BitSwapDEX AI Trading Frontend:
 * - Logo
 * - Navigation
 * - User info
 * - Wallet connection (optional)
 * 
 * @module Header
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Wallet, Settings, Coins, Loader2, Palette, Send, X, BookOpen, LogOut, Activity, Layers, TrendingUp, User, Mail, Fingerprint, ChevronDown, Copy, Check, Menu, Search } from 'lucide-react';
import PersonalAccountHeaderBadge from '../frontend/components/ai-trading/PersonalAccountHeaderBadge';
import ChainToggle from './ChainToggle';
import { useDexAuth } from '../frontend/context/DexAuthContext';
import { getBiometricErrorMessage } from '../frontend/utils/biometricAuth';
import EmailAuthModal from '../frontend/components/auth/EmailAuthModal';
import walletBalanceService from '../frontend/services/walletBalanceService';
import { useDEXTheme } from '../frontend/context/DEXThemeContext';
import { useWallet } from '../context/WalletContext.jsx';
import { pickEvmProvider as pickEvmProviderSSoT } from '../utils/evmProviderResolver.js';
import { useSeiWallet } from '../sei/context/SeiWalletContext';
import { SEI_REST } from '../sei/seiConfig';
import { useStxWallet } from '../stx/context/StxWalletContext';
import { useSolPair } from '../sol/context/SolPairContext';
import { getAuthBackendUrl } from '../config/apiEndpoints.js';
import { useStxPair } from '../stx/context/StxPairContext';
import { useSeiPair } from '../sei/context/SeiPairContext';
import WalletConnectorSei from '../sei/WalletConnector.sei';
import TokenSelectorSol from '../sol/TokenSelector.sol';
import WalletConnectorSol from '../sol/WalletConnector.sol';
import TokenSelectorStx from '../stx/TokenSelector.stx';
import WalletConnectorStx from '../stx/WalletConnector.stx';
import TokenSelectorSei from '../sei/TokenSelector.sei';
import ClobSeiMarketSelect from '../clob-sei/components/ClobSeiMarketSelect';
import { useClobSeiMarket } from '../clob-sei/context/ClobSeiMarketContext';
import { CLOB_SEI_MARKETS, CLOB_SEI_CHAIN_ID, CLOB_SEI_RPC } from '../clob-sei/config';
import SolTokenIcon from '../sol/SolTokenIcon';
import { getChainDisplay } from '../frontend/utils/chainDisplayConfig';
import { tokenIconMap } from '../frontend/assets/icons/tokenIconMap';
import { toast } from 'react-toastify';
import ProfileAvatarDisplay from '../frontend/components/profile/ProfileAvatarDisplay';

function useSeiUsdPrice() {
  const [price, setPrice] = React.useState(null);
  React.useEffect(() => {
    const fetch_ = () =>
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=SEIUSDT')
        .then(r => r.json()).then(d => setPrice(parseFloat(d.price) || null)).catch(() => {});
    fetch_();
    const id = setInterval(fetch_, 60000);
    return () => clearInterval(id);
  }, []);
  return price;
}

const ATOM_IBC_DENOM = 'ibc/6CDD4663F2F09CD62285E2D45891FC149A3568E316CE3EBBE201A71A78A69388';

function useSeiAtomBalance(address) {
  const [atomBalance, setAtomBalance] = React.useState(null);
  const [atomPrice, setAtomPrice] = React.useState(null);
  React.useEffect(() => {
    fetch('https://api.binance.com/api/v3/ticker/price?symbol=ATOMUSDT')
      .then(r => r.json()).then(d => setAtomPrice(parseFloat(d.price) || null)).catch(() => {});
  }, []);
  React.useEffect(() => {
    if (!address) { setAtomBalance(null); return; }
    const fetchBalance = () =>
      fetch(`${String(SEI_REST).replace(/\/$/, '')}/cosmos/bank/v1beta1/balances/${address}`)
        .then(r => r.json())
        .then(d => {
          const coin = (d.balances || []).find(b => b.denom === ATOM_IBC_DENOM);
          setAtomBalance(coin ? Number(coin.amount) / 1e6 : 0);
        }).catch(() => {});
    fetchBalance();
    const id = setInterval(fetchBalance, 30000);
    return () => clearInterval(id);
  }, [address]);
  return { atomBalance, atomPrice };
}

const SEI_EVM_CHAIN_ID_HEX = `0x${Number(CLOB_SEI_CHAIN_ID).toString(16)}`;
const SEI_EVM_PARAMS = {
  chainId: SEI_EVM_CHAIN_ID_HEX,
  chainName: 'Sei EVM',
  nativeCurrency: { name: 'SEI', symbol: 'SEI', decimals: 18 },
  rpcUrls: [CLOB_SEI_RPC],
  blockExplorerUrls: ['https://seiscan.io'],
};
const METAMASK_INSTALL_URL = 'https://metamask.io/download/';

/** EVM chainId → display label and native symbol (detected from connected wallet) */
const EVM_CHAIN_INFO = {
  1: { label: 'Ethereum', symbol: 'ETH' },
  5: { label: 'Goerli', symbol: 'ETH' },
  56: { label: 'BSC', symbol: 'BNB' },
  97: { label: 'BSC Testnet', symbol: 'tBNB' },
  137: { label: 'Polygon', symbol: 'MATIC' },
  42161: { label: 'Arbitrum One', symbol: 'ETH' },
  8453: { label: 'Base', symbol: 'ETH' },
  43114: { label: 'Avalanche', symbol: 'AVAX' },
  250: { label: 'Fantom', symbol: 'FTM' },
  59144: { label: 'Linea', symbol: 'ETH' },
  10: { label: 'Optimism', symbol: 'ETH' },
  324: { label: 'zkSync Era', symbol: 'ETH' },
  [Number(CLOB_SEI_CHAIN_ID)]: { label: 'Sei EVM', symbol: 'SEI' },
};
import '../../../styles/DEX/header.css';
import '../frontend/styles/components/chain-header-wallet.css';
import bitsLogo from '../../../assets/logo.png';

const THEME_OPTIONS = [
  { value: 'sonnet', label: 'Sonnet (UI theme)', desc: 'Compact · Blue — not the LLM provider', color: '#3b82f6' },
  { value: 'claude', label: 'Claude (UI theme)', desc: 'Warm · Amber — not Anthropic by itself', color: '#f59e0b' },
  { value: 'gemini', label: 'Gemini', desc: 'Airy · Violet', color: '#8b5cf6' },
  { value: 'default', label: 'Default', desc: 'No theme', color: '#64748b' }
];

const Header = ({ 
  user = null, 
  walletAddress = null, 
  onConnectWallet = null, 
  onDisconnectWallet = null,
  isConnecting = false,
  error = null,
  onOpenSettings = null,
  onOpenMenu = null,
  selectedChain = 'evm',
  onChainChange = null
}) => {
  const { pathname } = useLocation();
  const showSeiWalletInHeader = pathname && pathname.includes('/dex-edu/ota/sei');
  const showStxWalletInHeader = pathname && pathname.includes('/dex-edu/ota/stx');
  const isOnSol = pathname && pathname.startsWith('/dex-edu/sol');
  const isOnStx = pathname && pathname.startsWith('/dex-edu/stx');
  const isOnSei = pathname && (pathname.startsWith('/dex-edu/sei') || pathname.startsWith('/dex-edu/clob-sei'));
  const isOnClobSei = pathname && pathname.startsWith('/dex-edu/clob-sei');
  const isOnLeverage = pathname && pathname.includes('/dex-edu/leverage');
  const isOnOtaBsc = pathname && pathname.startsWith('/dex-edu/ota') && !pathname.includes('/dex-edu/ota/sei') && !pathname.includes('/dex-edu/ota/stx');
  const isOnAccount = pathname && pathname.includes('/dex-edu/account');
  const showPersonalAccountBadge = isOnLeverage || isOnOtaBsc || isOnAccount;

  const { isConnected: seiConnected, address: seiAddress, shortAddress: seiShortAddress, balance: seiBalance, balanceLoading: seiBalanceLoading, chainId: seiChainId, disconnect: seiDisconnect } = useSeiWallet();
  const seiNetworkLabel = seiChainId === 'atlantic-2' ? 'Atlantic-2 (Testnet)' : seiChainId === 'pacific-1' ? 'Pacific-1 (Mainnet)' : seiChainId || 'SEI';
  const seiUsdPrice = useSeiUsdPrice();
  const { atomBalance, atomPrice } = useSeiAtomBalance(seiConnected ? seiAddress : null);

  const {
    evmWalletAddress: ctxEvmWalletAddress,
    solanaWalletAddress: ctxSolanaWalletAddress,
    chainId: ctxChainId,
    disconnectSolanaWallet: ctxDisconnectSolanaWallet,
  } = useWallet();
  const { isConnected: stxConnected, shortAddress: stxShortAddress, disconnect: stxDisconnect } = useStxWallet();
  const { pair: solPair, setPair: setSolPair } = useSolPair();
  const { pair: stxPair, setPair: setStxPair } = useStxPair();
  const { pair: seiPair, setPair: setSeiPair } = useSeiPair();
  const { marketId: clobSeiMarketId, setMarketId: setClobSeiMarketId } = useClobSeiMarket();

  const [chainId, setChainId] = useState(null);
  const [nativeBalance, setNativeBalance] = useState('0');
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [themePopoverOpen, setThemePopoverOpen] = useState(false);
  const [seiEvmConnecting, setSeiEvmConnecting] = useState(false);
  /** On /dex-edu/clob-sei: the injected provider has account + Sei EVM chain (Mangrove), so hide the duplicate CTA. */
  const [clobSeiEvmWalletReady, setClobSeiEvmWalletReady] = useState(false);
  const themePopoverRef = useRef(null);
  const accountDropdownRef = useRef(null);
  const { theme, setTheme } = useDEXTheme();

  const {
    isAuthenticated,
    user: authUser,
    walletAddress: authWalletAddress,
    loading: authLoading,
    login: authLogin,
    logout: authLogout,
    loginWithProvider,
    loginBiometric,
    checkBiometricAvailable,
    hasBiometricCredential: checkHasBiometricCredential,
    clearAuthError
  } = useDexAuth();

  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [authMethodsOpen, setAuthMethodsOpen] = useState(false);
  const [seiCopySuccess, setSeiCopySuccess] = useState(false);
  const [emailAuthModalOpen, setEmailAuthModalOpen] = useState(false);
  const [emailAuthInitialMode, setEmailAuthInitialMode] = useState('login');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricRegistered, setBiometricRegistered] = useState(false);
  const [isBiometricLoggingIn, setIsBiometricLoggingIn] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        if (checkBiometricAvailable) {
          const availability = await checkBiometricAvailable();
          setBiometricAvailable(availability?.available ?? false);
          if (availability?.available && checkHasBiometricCredential && authUser?.id) {
            setBiometricRegistered(!!checkHasBiometricCredential(authUser.id));
          } else {
            setBiometricRegistered(false);
          }
        }
      } catch {
        setBiometricAvailable(false);
        setBiometricRegistered(false);
      }
    };
    check();
  }, [checkBiometricAvailable, checkHasBiometricCredential, authUser?.id]);

  useEffect(() => {
    if (!accountDropdownOpen && !authMethodsOpen) return;
    const handleClickOutside = (e) => {
      const wrap = accountDropdownRef.current;
      const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
      /** After setState, the dropdown item can unmount in the same click event; `contains(target)` becomes false, so use composedPath from dispatch. */
      const insideAccount =
        wrap &&
        (wrap.contains(e.target) || path.includes(wrap));
      const onThemePopover =
        (e.target && e.target.closest?.('.ai-trading-theme-popover')) ||
        path.some((n) => n && n.classList && n.classList.contains('ai-trading-theme-popover'));
      if (!insideAccount && !onThemePopover) {
        setAccountDropdownOpen(false);
        setAuthMethodsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [accountDropdownOpen, authMethodsOpen]);

  const handleAuthWallet = useCallback(async () => {
    try {
      await authLogin();
      setAuthMethodsOpen(false);
    } catch (err) {
      console.error('[Header] Auth wallet:', err);
    }
  }, [authLogin]);

  /** Close the dropdown, then open the modal after the click event ends to avoid click-outside interference with unmounted nodes. */
  const openEmailAuthLogin = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setEmailAuthInitialMode('login');
    setAuthMethodsOpen(false);
    window.setTimeout(() => setEmailAuthModalOpen(true), 0);
  }, []);

  const openEmailAuthRegister = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setEmailAuthInitialMode('register');
    setAuthMethodsOpen(false);
    window.setTimeout(() => setEmailAuthModalOpen(true), 0);
  }, []);

  const handleAuthBiometric = useCallback(async () => {
    try {
      setIsBiometricLoggingIn(true);
      await loginBiometric();
      setAuthMethodsOpen(false);
    } catch (err) {
      alert(getBiometricErrorMessage(err));
    } finally {
      setIsBiometricLoggingIn(false);
    }
  }, [loginBiometric]);

  const handleAuthLogout = useCallback(async () => {
    try {
      await authLogout();
      setAccountDropdownOpen(false);
    } catch (err) {
      console.error('[Header] Logout:', err);
    }
  }, [authLogout]);

  const handleCopySeiAddress = useCallback(async () => {
    if (!seiAddress) return;
    try {
      await navigator.clipboard.writeText(seiAddress);
      setSeiCopySuccess(true);
      setTimeout(() => setSeiCopySuccess(false), 2000);
    } catch {
      setSeiCopySuccess(false);
    }
  }, [seiAddress]);

  const displayName = authUser?.username || authUser?.email || (authWalletAddress ? `${authWalletAddress.slice(0, 6)}...${authWalletAddress.slice(-4)}` : 'Account');

  const handleConnectSeiEvm = async () => {
    const ethereum = pickEvmProvider();
    if (!ethereum) {
      window.open(METAMASK_INSTALL_URL, '_blank', 'noopener,noreferrer');
      toast.info('Install MetaMask (or an injected EVM wallet), then try again.');
      return;
    }
    setSeiEvmConnecting(true);
    try {
      try {
        await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: SEI_EVM_CHAIN_ID_HEX }] });
      } catch (switchErr) {
        if (switchErr?.code === 4902 || switchErr?.message?.includes('Unrecognized chain')) {
          await ethereum.request({ method: 'wallet_addEthereumChain', params: [SEI_EVM_PARAMS] });
        } else throw switchErr;
      }
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const addr = accounts && accounts[0];
      toast.success(
        addr
          ? `Sei EVM: ${addr.slice(0, 6)}…${addr.slice(-4)} — confirm Place order uses this wallet on chain ${CLOB_SEI_CHAIN_ID}`
          : 'Sei EVM network ready — approve account access in the wallet if prompted'
      );
    } catch (err) {
      console.error('[Header] Sei EVM connect:', err);
      toast.error(err?.message || 'Sei EVM: network switch or connect failed');
    } finally {
      setSeiEvmConnecting(false);
    }
  };

  const clobSeiTargetChainId = useMemo(() => Number(CLOB_SEI_CHAIN_ID), []);

  useEffect(() => {
    if (!isOnClobSei) {
      setClobSeiEvmWalletReady(false);
      return undefined;
    }
    if (typeof window === 'undefined') return undefined;

    let cancelled = false;
    const refresh = async () => {
      try {
        const eth = pickEvmProviderSSoT();
        if (!eth) {
          if (!cancelled) setClobSeiEvmWalletReady(false);
          return;
        }
        const chainHex = await eth.request({ method: 'eth_chainId' });
        const accounts = await eth.request({ method: 'eth_accounts' });
        if (cancelled) return;
        const cid = parseInt(String(chainHex), 16);
        const ok =
          Array.isArray(accounts) &&
          accounts.length > 0 &&
          Number.isFinite(cid) &&
          cid === clobSeiTargetChainId;
        setClobSeiEvmWalletReady(ok);
      } catch {
        if (!cancelled) setClobSeiEvmWalletReady(false);
      }
    };

    refresh();
    const eth = pickEvmProviderSSoT();
    const onChange = () => {
      refresh();
    };
    if (eth && typeof eth.on === 'function') {
      eth.on('chainChanged', onChange);
      eth.on('accountsChanged', onChange);
    }
    return () => {
      cancelled = true;
      if (eth && typeof eth.removeListener === 'function') {
        eth.removeListener('chainChanged', onChange);
        eth.removeListener('accountsChanged', onChange);
      }
    };
  }, [isOnClobSei, clobSeiTargetChainId]);

  useEffect(() => {
    if (!themePopoverOpen) return;
    const close = (e) => {
      if (themePopoverRef.current && !themePopoverRef.current.contains(e.target)) setThemePopoverOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [themePopoverOpen]);

  const pickEvmProvider = () => pickEvmProviderSSoT();

  // Global wallet slot is EVM-only. Solana has its own SOL header slot and must
  // never replace the MetaMask/BSC wallet used by OTA authorization.
  const effectiveWalletAddress = walletAddress || ctxEvmWalletAddress || null;
  /** On OTA SEI, Keplr is on the left; the right-side button is EVM only, with a separate label. */
  const otaSeiShowEvmOptionalLabel = showSeiWalletInHeader && seiConnected && !effectiveWalletAddress;
  // Effective chainId: only meaningful when an EVM wallet exists.
  const effectiveChainId = effectiveWalletAddress ? (ctxChainId ?? chainId) : null;

  const networkName = useMemo(() => {
    if (effectiveChainId == null) return null;
    const info = EVM_CHAIN_INFO[effectiveChainId];
    return info ? info.label : `Chain ${effectiveChainId}`;
  }, [effectiveChainId]);

  const nativeSymbol = useMemo(() => {
    if (effectiveChainId == null) return '—';
    const info = EVM_CHAIN_INFO[effectiveChainId];
    return info ? info.symbol : 'ETH';
  }, [effectiveChainId]);

  const chainDisplay = useMemo(() => getChainDisplay(effectiveChainId), [effectiveChainId]);

  const displayBalance = nativeBalance;

  // Get chainId from window.ethereum for the EVM wallet only.
  useEffect(() => {
    if (!effectiveWalletAddress) {
      setChainId(null);
      return;
    }
    const getChainId = async () => {
      try {
        const ethereum = pickEvmProvider();
        if (ethereum) {
          const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
          const chainIdNum = parseInt(chainIdHex, 16);
          setChainId(chainIdNum);
        }
      } catch (error) {
        console.error('[Header] Error getting chainId:', error);
        setChainId(null);
      }
    };
    getChainId();
    let ethereum = pickEvmProvider();
    if (ethereum && typeof ethereum.on === 'function') {
      const handleChainChanged = (hexChainId) => {
        const chainIdNum = parseInt(hexChainId, 16);
        setChainId(chainIdNum);
      };
      ethereum.on('chainChanged', handleChainChanged);
      return () => {
        if (ethereum && ethereum.removeListener) {
          ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [effectiveWalletAddress]);

  // Get native balance via walletBalanceService for the EVM wallet only.
  useEffect(() => {
    if (!effectiveWalletAddress) {
      setNativeBalance('0');
      return;
    }
    const loadBalance = async () => {
      try {
        setBalanceLoading(true);
        const balance = await walletBalanceService.getNativeBalance(effectiveWalletAddress, effectiveChainId);
        const formattedBalance = parseFloat(balance || '0').toFixed(4);
        setNativeBalance(formattedBalance);
      } catch (error) {
        console.error('[Header] Error loading balance:', error);
        setNativeBalance('0');
      } finally {
        setBalanceLoading(false);
      }
    };
    loadBalance();
    const intervalId = setInterval(loadBalance, 10000);
    return () => clearInterval(intervalId);
  }, [effectiveWalletAddress, effectiveChainId]);
  const handleConnect = async () => {
    if (onConnectWallet && !isConnecting) {
      try {
        // This right-side wallet button is the EVM/OTA authorization slot,
        // even on SOL pages where the chain toggle is set to Solana.
        await onConnectWallet('evm');
      } catch (err) {
        console.error('[DEX Header] Connection error:', err);
      }
    }
  };

  const handleDisconnect = async () => {
    if (onDisconnectWallet && !isConnecting) {
      try {
        await onDisconnectWallet();
      } catch (err) {
        console.error('[DEX Header] Disconnect error:', err);
      }
    }
  };

  const handleOpenSettings = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setThemePopoverOpen(false);
    setAccountDropdownOpen(false);
    setAuthMethodsOpen(false);
    onOpenSettings?.();
  }, [onOpenSettings]);

  return (
    <header className="ai-trading-header" role="banner">
      <div className="ai-trading-header-left">
        <button
          type="button"
          className="dex-header-mobile-menu"
          onClick={() => onOpenMenu?.()}
          aria-label="Open menu"
          title="Menu"
        >
          <Menu size={20} aria-hidden />
        </button>
        <div className="ai-trading-logo" aria-label="ɃitS Logo">
          <img
            src={bitsLogo}
            alt="ɃitS"
            width="26"
            height="26"
            style={{ borderRadius: 6, objectFit: 'contain' }}
          />
          <span className="ai-trading-logo-text">
            <span className="bits-b-dollar">Ƀ</span>it<span className="bits-s-dollar">S</span>
          </span>
        </div>
        {/* Leverage title: icon-only hint for Leverage Trade, without long text. */}
        {isOnLeverage && (
          <span className="ai-trading-header-leverage-title" title="Leverage Trade" aria-label="Leverage Trade">
            <TrendingUp size={24} aria-hidden />
          </span>
        )}
        {/* Personal Account badge: OTA BSC or Leverage; shows that funds belong to this user and only they can withdraw. */}
        {showPersonalAccountBadge && (
          <PersonalAccountHeaderBadge />
        )}
        {/* SEI wallet only on /dex-edu/ota/sei: left-side, highlighted, with Copy + Disconnect. */}
        {showSeiWalletInHeader && (
          <div className="ai-trading-sei-wallet" aria-label="SEI wallet status">
            {seiConnected ? (
              <>
                <div className="ai-trading-sei-wallet-main">
                  <img src={tokenIconMap.SEI} alt="SEI" className="ai-trading-sei-wallet-logo" width={24} height={24} />
                  <div className="ai-trading-sei-wallet-info">
                    <span className="ai-trading-sei-wallet-top">
                      <span className="ai-trading-sei-wallet-label">SEI</span>
                      <span className="ai-trading-sei-wallet-network">{seiNetworkLabel}</span>
                    </span>
                    <span className="ai-trading-sei-wallet-address" title={seiAddress}>{seiShortAddress}</span>
                    <span className="ai-trading-sei-wallet-balance" title={seiBalanceLoading ? 'Reading balance from RPC...' : seiUsdPrice ? `1 SEI ≈ $${seiUsdPrice.toFixed(4)} (Binance)` : 'SEI balance'}>
                      {seiBalanceLoading ? (
                        <>
                          <Loader2 size={12} className="ai-trading-balance-loader" style={{ marginRight: '4px', verticalAlign: 'middle' }} aria-hidden />
                          Loading…
                        </>
                      ) : seiBalance !== null && seiBalance !== undefined ? (
                        `${Number(seiBalance).toFixed(4)} SEI`
                      ) : (
                        <span title="Could not read balance from RPC. Refresh the page.">— SEI</span>
                      )}
                      {seiUsdPrice && seiBalance != null && (
                        <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '4px' }}>
                          ≈ ${(Number(seiBalance) * seiUsdPrice).toFixed(2)}
                        </span>
                      )}
                    </span>
                    {atomBalance != null && atomBalance > 0 && (
                      <span className="ai-trading-sei-wallet-balance" title={atomPrice ? `1 ATOM ≈ $${atomPrice.toFixed(4)} (Binance)` : 'ATOM balance (IBC)'} style={{ marginTop: '1px' }}>
                        {atomBalance.toFixed(4)} ATOM
                        {atomPrice && (
                          <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '4px' }}>
                            ≈ ${(atomBalance * atomPrice).toFixed(2)}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
                <div className="ai-trading-sei-wallet-actions">
                  <button type="button" onClick={handleCopySeiAddress} className="ai-trading-sei-wallet-copy" aria-label="Copy address" title="Copy address">
                    {seiCopySuccess ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                  <button type="button" onClick={seiDisconnect} className="ai-trading-sei-wallet-disconnect" aria-label="Disconnect SEI wallet" title="Disconnect SEI wallet">
                    <LogOut size={14} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="ai-trading-sei-wallet-label">SEI</span>
                <span className="ai-trading-sei-wallet-not-connected">not connected</span>
                <WalletConnectorSei />
              </>
            )}
          </div>
        )}
        {/* STX wallet (doar pe /dex-edu/ota/stx) – paritate cu SEI OTA */}
        {showStxWalletInHeader && (
          <div className="ai-trading-sei-wallet" aria-label="STX wallet status">
            {stxConnected ? (
              <>
                <Wallet size={14} className="ai-trading-sei-wallet-icon" aria-hidden />
                <span className="ai-trading-sei-wallet-label">STX</span>
                <span className="ai-trading-sei-wallet-address" title="Address">{stxShortAddress}</span>
                <button type="button" onClick={stxDisconnect} className="ai-trading-sei-wallet-disconnect" aria-label="Disconnect STX wallet" title="Disconnect STX wallet">
                  <LogOut size={12} />
                </button>
              </>
            ) : (
              <>
                <span className="ai-trading-sei-wallet-label">STX</span>
                <span className="ai-trading-sei-wallet-not-connected">not connected</span>
                <WalletConnectorStx />
              </>
            )}
          </div>
        )}
      </div>

      {/* Chain toolbar: SOL / STX / SEI, shown only on /dex-edu/sol, /dex-edu/stx, or /dex-edu/sei routes. */}
      <div
        className="ai-trading-header-center"
        id="dex-header-center-slot"
        aria-label="Chain tools"
        style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}
      >
        {isOnSol && (
          <>
            <div className={`chain-header-wallet${!ctxSolanaWalletAddress ? ' chain-header-wallet--not-connected' : ''}`} style={{ marginRight: 0 }} aria-label="SOL wallet">
              {ctxSolanaWalletAddress ? (
                <>
                  <Wallet size={14} style={{ color: 'var(--ds-success)', flexShrink: 0 }} aria-hidden />
                  <span style={{ fontWeight: 600, fontSize: '12px' }}>SOL</span>
                  <span style={{ fontSize: '12px', fontFamily: 'ui-monospace, monospace' }} title={ctxSolanaWalletAddress}>{ctxSolanaWalletAddress.length >= 8 ? `${ctxSolanaWalletAddress.slice(0, 4)}...${ctxSolanaWalletAddress.slice(-4)}` : ctxSolanaWalletAddress}</span>
                  <button type="button" onClick={() => ctxDisconnectSolanaWallet?.()} style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 6px', border: '1px solid var(--ds-border-color)', borderRadius: '6px', background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: '12px' }} aria-label="Disconnect SOL wallet"><LogOut size={12} /></button>
                </>
              ) : (
                <>
                  <span style={{ fontWeight: 600, fontSize: '12px' }}>SOL</span>
                  <span style={{ fontSize: '11px', color: 'var(--ds-text-secondary)' }}>not connected</span>
                  <WalletConnectorSol />
                </>
              )}
            </div>
            <SolTokenIcon symbol="SOL" size={24} />
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>SOL Trade</span>
            {pathname === '/dex-edu/sol/trade' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} aria-label="Select pair">
                <TokenSelectorSol value={solPair} onChange={setSolPair} label="Pair" variant="pair" />
              </div>
            )}
            <nav style={{ display: 'flex', gap: '6px' }} aria-label="SOL Trade navigation">
              <Link to="/dex-edu/sol/trade" style={{ padding: '6px 12px', borderRadius: '6px', textDecoration: 'none', color: pathname === '/dex-edu/sol/trade' ? 'var(--ds-accent, #14f195)' : 'inherit', fontWeight: pathname === '/dex-edu/sol/trade' ? 600 : 400 }} aria-current={pathname === '/dex-edu/sol/trade' ? 'page' : undefined}>Trade</Link>
              <Link to="/dex-edu/sol/swap" style={{ padding: '6px 12px', borderRadius: '6px', textDecoration: 'none', color: pathname === '/dex-edu/sol/swap' ? 'var(--ds-accent, #14f195)' : 'inherit', fontWeight: pathname === '/dex-edu/sol/swap' ? 600 : 400 }} aria-current={pathname === '/dex-edu/sol/swap' ? 'page' : undefined}>Swap</Link>
            </nav>
          </>
        )}
        {isOnStx && (
          <>
            <div className={`chain-header-wallet${!stxConnected ? ' chain-header-wallet--not-connected' : ''}`} style={{ marginRight: 0 }} aria-label="STX wallet">
              {stxConnected ? (
                <>
                  <Wallet size={14} style={{ color: 'var(--ds-success)', flexShrink: 0 }} aria-hidden />
                  <span style={{ fontWeight: 600, fontSize: '12px' }}>STX</span>
                  <span style={{ fontSize: '12px', fontFamily: 'ui-monospace, monospace' }} title="Address">{stxShortAddress}</span>
                  <button type="button" onClick={stxDisconnect} style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 6px', border: '1px solid var(--ds-border-color)', borderRadius: '6px', background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: '12px' }} aria-label="Disconnect STX wallet"><LogOut size={12} /></button>
                </>
              ) : (
                <>
                  <span style={{ fontWeight: 600, fontSize: '12px' }}>STX</span>
                  <span style={{ fontSize: '11px', color: 'var(--ds-text-secondary)' }}>not connected</span>
                  <WalletConnectorStx />
                </>
              )}
            </div>
            <Layers size={22} aria-hidden />
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>STX Trade</span>
            {pathname === '/dex-edu/stx/trade' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} aria-label="Select pair">
                <TokenSelectorStx value={stxPair} onChange={setStxPair} label="Pair" variant="pair" />
              </div>
            )}
            <nav style={{ display: 'flex', gap: '6px' }} aria-label="STX Trade navigation">
              <Link to="/dex-edu/stx/trade" style={{ padding: '6px 12px', borderRadius: '6px', textDecoration: 'none', color: pathname === '/dex-edu/stx/trade' ? 'var(--ds-accent, #f7931a)' : 'inherit', fontWeight: pathname === '/dex-edu/stx/trade' ? 600 : 400 }} aria-current={pathname === '/dex-edu/stx/trade' ? 'page' : undefined}>Trade</Link>
              <Link to="/dex-edu/stx/swap" style={{ padding: '6px 12px', borderRadius: '6px', textDecoration: 'none', color: pathname === '/dex-edu/stx/swap' ? 'var(--ds-accent, #f7931a)' : 'inherit', fontWeight: pathname === '/dex-edu/stx/swap' ? 600 : 400 }} aria-current={pathname === '/dex-edu/stx/swap' ? 'page' : undefined}>Swap</Link>
              <Link to="/dex-edu/ota/stx" style={{ padding: '6px 12px', borderRadius: '6px', textDecoration: 'none', color: pathname === '/dex-edu/ota/stx' ? 'var(--ds-accent, #f7931a)' : 'inherit', fontWeight: pathname === '/dex-edu/ota/stx' ? 600 : 400 }} aria-current={pathname === '/dex-edu/ota/stx' ? 'page' : undefined}>OTA AI · Micro-Profit</Link>
            </nav>
          </>
        )}
        {isOnSei && (
          <>
            {isOnClobSei ? (
              <div className="chain-header-wallet chain-header-wallet--clob-sei-evm" style={{ marginRight: 0 }} aria-label="Sei EVM wallet for Mangrove">
                <span style={{ fontWeight: 600, fontSize: '12px' }}>Sei EVM</span>
                <span style={{ fontSize: '11px', color: 'var(--ds-text-secondary)' }}>for Mangrove orders</span>
                {!clobSeiEvmWalletReady &&
                  (typeof window !== 'undefined' && pickEvmProvider() ? (
                    <button type="button" onClick={handleConnectSeiEvm} disabled={seiEvmConnecting} style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 12px', border: '1px solid var(--ds-accent)', borderRadius: '6px', background: 'transparent', color: 'var(--ds-accent)', cursor: seiEvmConnecting ? 'wait' : 'pointer', fontSize: '12px', fontWeight: 500 }} aria-label="Connect Sei EVM wallet (MetaMask or Trust)">
                      {seiEvmConnecting ? 'Connecting…' : 'Connect wallet to Sei EVM'}
                    </button>
                  ) : (
                    <a href={METAMASK_INSTALL_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 12px', border: '1px solid var(--ds-accent)', borderRadius: '6px', background: 'transparent', color: 'var(--ds-accent)', textDecoration: 'none', fontSize: '12px', fontWeight: 500 }} aria-label="Install MetaMask">
                      Install MetaMask
                    </a>
                  ))}
              </div>
            ) : (
              <div className={`chain-header-wallet${!seiConnected ? ' chain-header-wallet--not-connected' : ''}`} style={{ marginRight: 0 }} aria-label="SEI wallet">
                {seiConnected ? (
                  <>
                    <Wallet size={14} style={{ color: 'var(--ds-success)', flexShrink: 0 }} aria-hidden />
                    <span style={{ fontWeight: 600, fontSize: '12px' }}>SEI</span>
                    <span style={{ fontSize: '12px', color: 'var(--ds-text-secondary)' }} title="Network">{seiNetworkLabel}</span>
                    <span style={{ fontSize: '12px', fontFamily: 'ui-monospace, monospace' }} title={seiShortAddress}>{seiShortAddress || '—'}</span>
                    <button type="button" onClick={seiDisconnect} style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 6px', border: '1px solid var(--ds-border-color)', borderRadius: '6px', background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: '12px' }} aria-label="Disconnect SEI wallet"><LogOut size={12} /></button>
                  </>
                ) : (
                  <>
                    <span style={{ fontWeight: 600, fontSize: '12px' }}>SEI</span>
                    <span style={{ fontSize: '11px', color: 'var(--ds-text-secondary)' }}>not connected</span>
                    <WalletConnectorSei />
                  </>
                )}
              </div>
            )}
            <Activity size={22} aria-hidden />
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{isOnClobSei ? 'CLOB SEI' : 'SEI Trade'}</span>
            {isOnClobSei && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} aria-label="CLOB trading pair">
                <ClobSeiMarketSelect value={clobSeiMarketId} onChange={setClobSeiMarketId} markets={CLOB_SEI_MARKETS} label="Select trading pair" />
              </div>
            )}
            {pathname === '/dex-edu/sei/trade' && !isOnClobSei && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} aria-label="Select pair">
                <TokenSelectorSei value={seiPair} onChange={setSeiPair} label="Pair" variant="pair" />
              </div>
            )}
            <nav style={{ display: 'flex', gap: '6px' }} aria-label="SEI navigation">
              <Link to="/dex-edu/sei/trade" style={{ padding: '6px 12px', borderRadius: '6px', textDecoration: 'none', color: pathname === '/dex-edu/sei/trade' ? 'var(--ds-accent, #6366f1)' : 'inherit', fontWeight: pathname === '/dex-edu/sei/trade' ? 600 : 400 }} aria-current={pathname === '/dex-edu/sei/trade' ? 'page' : undefined}>Trade</Link>
              <Link to="/dex-edu/sei/swap" style={{ padding: '6px 12px', borderRadius: '6px', textDecoration: 'none', color: pathname === '/dex-edu/sei/swap' ? 'var(--ds-accent, #6366f1)' : 'inherit', fontWeight: pathname === '/dex-edu/sei/swap' ? 600 : 400 }} aria-current={pathname === '/dex-edu/sei/swap' ? 'page' : undefined}>Swap</Link>
              <Link to="/dex-edu/clob-sei" style={{ padding: '6px 12px', borderRadius: '6px', textDecoration: 'none', color: isOnClobSei ? 'var(--ds-accent, #6366f1)' : 'inherit', fontWeight: isOnClobSei ? 600 : 400 }} aria-current={isOnClobSei ? 'page' : undefined}>Order Book</Link>
              <Link to="/dex-edu/ota/sei" style={{ padding: '6px 12px', borderRadius: '6px', textDecoration: 'none', color: pathname === '/dex-edu/ota/sei' ? 'var(--ds-accent, #6366f1)' : 'inherit', fontWeight: pathname === '/dex-edu/ota/sei' ? 600 : 400 }} aria-current={pathname === '/dex-edu/ota/sei' ? 'page' : undefined}>OTA AI · Micro-Profit</Link>
            </nav>
          </>
        )}
      </div>
      
      <div className="ai-trading-header-right">
        <Link
          to="/investigator"
          className="dex-header-investigator-link"
          aria-label="Open Crypto Investigator"
          title="Crypto Investigator — analyze an EVM address"
        >
          <Search size={15} aria-hidden />
          <span>Investigator</span>
        </Link>
        {/* OTA tools slot (Signals Only, BNB, Analyze): portal from OTAPage, next to Social. */}
        <div id="dex-header-ota-tools-slot" className="dex-header-ota-tools-slot" />
        {/* Social / Docs: compact top-right links. */}
        <div className="header-social-links" aria-label="Social links">
          <a
            className="header-social-link"
            href="https://t.me/BitSwapDEX_AI"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram"
            title="Telegram"
          >
            <Send size={14} aria-hidden="true" />
          </a>
          <a
            className="header-social-link"
            href="https://x.com/BitSwapDEX_AI"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X"
            title="X"
          >
            <X size={14} aria-hidden="true" />
          </a>
          <a
            className="header-social-link"
            href="https://bitswap-5.gitbook.io/bitswapdex-ai"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Documentation"
            title="Documentation"
          >
            <BookOpen size={14} aria-hidden="true" />
          </a>
        </div>
        {/* Theme switcher: popover with swatches and descriptions. */}
        <div className="ai-trading-theme-switcher" ref={themePopoverRef}>
          <button
            type="button"
            className="ai-trading-theme-trigger"
            onClick={() => setThemePopoverOpen((o) => !o)}
            aria-label="Choose display theme"
            aria-expanded={themePopoverOpen}
            aria-haspopup="listbox"
            title="UI color themes (Sonnet, Claude, Gemini, Default) — separate from OpenAI / Claude LLM providers"
          >
            <Palette size={16} aria-hidden="true" />
            <span className="ai-trading-theme-trigger-label">{THEME_OPTIONS.find((t) => t.value === theme)?.label ?? theme}</span>
          </button>
          {themePopoverOpen && (
            <div className="ai-trading-theme-popover" role="listbox" aria-label="Available themes">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={theme === opt.value}
                  className={`ai-trading-theme-option ${theme === opt.value ? 'selected' : ''}`}
                  onClick={() => {
                    setTheme(opt.value);
                    setThemePopoverOpen(false);
                  }}
                >
                  <span className="ai-trading-theme-swatch" style={{ backgroundColor: opt.color }} aria-hidden="true" />
                  <span className="ai-trading-theme-option-label">{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Chain Toggle - Minimalist */}
        {onChainChange && (
          <ChainToggle 
            selectedChain={selectedChain}
            onChainChange={onChainChange}
            variant="header"
          />
        )}
        
        {/* Settings Button */}
        {onOpenSettings && (
          <button
            type="button"
            className="ai-trading-settings-btn"
            onClick={handleOpenSettings}
            aria-label="Open global DEX settings"
            title="Global DEX settings"
          >
            <Settings size={18} aria-hidden="true" />
          </button>
        )}

        {/* Account / Profile: next to Wallet, either connected profile info or Login/Register. */}
        <div className="header-account-wrap" ref={accountDropdownRef} aria-label="Account and profile">
          {isAuthenticated ? (
            <>
              <Link
                to="/dex-edu/profile"
                className="header-account-link"
                aria-label="Go to profile"
                title={`${displayName} - Profile`}
              >
                <span className="header-account-avatar-slot" aria-hidden="true">
                  <ProfileAvatarDisplay
                    avatar={authUser?.avatar}
                    username={authUser?.username}
                    email={authUser?.email}
                    imgClassName="header-account-avatar-img-fill"
                    svgClassName="header-account-avatar-img-fill"
                    fallbackClassName="header-account-initial"
                  />
                </span>
                <span className="header-account-name">{displayName}</span>
                {authWalletAddress && (
                  <span className="header-account-address" title={authWalletAddress}>
                    {authWalletAddress.slice(0, 6)}…{authWalletAddress.slice(-4)}
                  </span>
                )}
              </Link>
              <button
                type="button"
                className="header-account-chevron"
                onClick={() => setAccountDropdownOpen((o) => !o)}
                aria-expanded={accountDropdownOpen}
                aria-label="Open account menu"
              >
                <ChevronDown size={14} />
              </button>
              {accountDropdownOpen && (
                <div className="header-account-dropdown" role="menu">
                  <Link to="/dex-edu/profile" className="header-account-dropdown-item" onClick={() => setAccountDropdownOpen(false)} role="menuitem">
                    <User size={14} />
                    Profile
                  </Link>
                  <button type="button" className="header-account-dropdown-item header-account-signout" onClick={handleAuthLogout} role="menuitem">
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                className="header-account-login-btn"
                onClick={() => setAuthMethodsOpen((o) => !o)}
                aria-expanded={authMethodsOpen}
                aria-label="Login or register"
              >
                <User size={16} />
                Login / Register
              </button>
              {authMethodsOpen && (
                <div className="header-account-auth-dropdown" role="menu">
                  <button type="button" className="header-account-auth-item" onClick={handleAuthWallet} disabled={authLoading} role="menuitem">
                    <Wallet size={14} />
                    Wallet
                  </button>
                  <button type="button" className="header-account-auth-item" onClick={openEmailAuthLogin} role="menuitem" data-auth-method="email" aria-label="Sign in with email">
                    <Mail size={14} />
                    Email
                  </button>
                  <button type="button" className="header-account-auth-item" onClick={openEmailAuthRegister} role="menuitem">
                    <User size={14} />
                    Create account
                  </button>
                  <button type="button" className="header-account-auth-item header-account-google" onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (authLoading) return; setAuthMethodsOpen(false); const base = getAuthBackendUrl(); if (!base || typeof base !== 'string') { toast.error('OAuth base URL is not configured. Set AUTH_BACKEND_URL or REACT_APP_AUTH_BACKEND_URL.'); return; } loginWithProvider('google'); }} disabled={authLoading} role="menuitem">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </button>
                  {biometricAvailable && biometricRegistered && (
                    <button type="button" className="header-account-auth-item" onClick={handleAuthBiometric} disabled={authLoading || isBiometricLoggingIn} role="menuitem">
                      <Fingerprint size={14} />
                      Biometric
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {effectiveWalletAddress ? (
          <div className="ai-trading-wallet-connected" aria-label={`Wallet connected: ${effectiveWalletAddress}`}>
            {networkName && (
              <div className="ai-trading-network-info" title={`Network: ${networkName}`} data-chain={effectiveChainId ?? ''}>
                {chainDisplay?.logo ? (
                  <img src={chainDisplay.logo} alt="" className="ai-trading-network-logo" width={18} height={18} referrerPolicy="no-referrer" />
                ) : null}
                <span>{networkName}</span>
              </div>
            )}
            <Wallet size={16} className="ai-trading-wallet-icon" aria-hidden />
            <span className="ai-trading-wallet-address" title={effectiveWalletAddress}>
              {effectiveWalletAddress.slice(0, 6)}...{effectiveWalletAddress.slice(-4)}
            </span>
            <span className="ai-trading-wallet-balance" title={balanceLoading ? 'Loading balance...' : `Balance: ${displayBalance} ${nativeSymbol}`}>
              {balanceLoading ? (
                <>
                  <Loader2 size={12} className="ai-trading-balance-loader" style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  Loading...
                </>
              ) : (
                <>
                  <Coins size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  {displayBalance} {nativeSymbol}
                </>
              )}
            </span>
            {onDisconnectWallet && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="ai-trading-disconnect-wallet-btn"
                aria-label="Disconnect wallet"
                title="Disconnect wallet"
              >
                ×
              </button>
            )}
          </div>
        ) : (
          onConnectWallet && (
            <button 
              className={`ai-trading-connect-wallet-btn ${isConnecting ? 'connecting' : ''}`}
              onClick={handleConnect}
              type="button"
              aria-label={isConnecting ? 'Connecting wallet...' : (otaSeiShowEvmOptionalLabel ? 'Connect EVM wallet (optional, separate from Keplr)' : 'Connect wallet')}
              title={otaSeiShowEvmOptionalLabel ? 'EVM wallet (MetaMask/Trust etc.) - separate from the SEI Keplr wallet on the left' : undefined}
              disabled={isConnecting}
            >
              <Wallet size={16} className="ai-trading-wallet-icon" aria-hidden />
              {isConnecting ? 'Connecting...' : (otaSeiShowEvmOptionalLabel ? 'Connect EVM (optional)' : 'Connect Wallet')}
            </button>
          )
        )}
      </div>

      <EmailAuthModal
        isOpen={emailAuthModalOpen}
        onClose={() => {
          clearAuthError();
          setEmailAuthModalOpen(false);
        }}
        initialMode={emailAuthInitialMode}
      />
    </header>
  );
};

export default Header;
