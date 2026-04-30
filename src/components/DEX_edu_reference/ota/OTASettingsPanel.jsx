/* eslint-disable */
/**
 * Authorize Bot � on-chain UserVault.authorizeBot(botAddress, maxAmount).
 * Bot address: ONLY from backend API GET /api/ai-trading/bot-address (Render). No frontend env.
 * User can enter Max in USD (e.g. 10) � we convert to BNB automatically.
 * @see docs/OTA_FLOW_AND_CONTRACT_LOGIC.md
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { Shield, CheckCircle, Zap, ExternalLink, ArrowDownCircle, ArrowUpCircle, Landmark, AlertCircle } from 'lucide-react';
import { CONTRACT_MAP, getActiveNetwork } from '../../../contract/contractMap';

/** BSCScan base URL: mainnet or testnet. */
function getBscScanBase() {
  const net = getActiveNetwork?.();
  return net?.chainId === 97 ? 'https://testnet.bscscan.com' : 'https://bscscan.com';
}

/** authorizeBot function signature from ABI: no hardcoding; source: CONTRACT_MAP.USER_VAULT.abi. */
function getAuthorizeBotSignatureFromAbi(abi) {
  if (!abi || !Array.isArray(abi)) return '';
  const fn = abi.find((item) => item.type === 'function' && item.name === 'authorizeBot');
  if (!fn || !fn.inputs?.length) return '';
  const args = fn.inputs.map((inp) => (inp.name ? `${inp.type} ${inp.name}` : inp.type).trim()).join(', ');
  return `${fn.name}(${args})`;
}

/** Format wei � BNB + USD for BNB/ETH display. */
function formatWeiToBnbUsd(wei, bnbPrice) {
  if (!wei || wei === '0') return { bnbStr: '0', usdStr: '' };
  try {
    const bnb = ethers.utils.formatEther(wei);
    const num = parseFloat(bnb);
    if (!Number.isFinite(num) || num === 0) return { bnbStr: '0', usdStr: '' };
    const bnbStr = num.toFixed(6).replace(/\.?0+$/, '') || '0';
    const usdStr = (bnbPrice && bnbPrice > 0) ? ` (? ${(num * bnbPrice).toFixed(2)} USD)` : '';
    return { bnbStr, usdStr };
  } catch {
    return { bnbStr: String(wei), usdStr: '' };
  }
}

/** Contract stores maxAmount/usedAmount in USDT wei (18 decimals). Format for display. */
function formatWeiToUsdt(wei) {
  if (!wei || wei === '0') return { usdtStr: '0', raw: '0' };
  try {
    const raw = ethers.utils.formatEther(String(wei));
    const num = parseFloat(raw);
    if (!Number.isFinite(num) || num === 0) return { usdtStr: '0', raw: '0' };
    const usdtStr = num >= 0.01 ? String(Number(num.toFixed(2))) : raw.slice(0, 10);
    return { usdtStr, raw };
  } catch {
    return { usdtStr: String(wei), raw: String(wei) };
  }
}

/** User explanation for why the app shows yes/no versus contract values. */
function explainBotAuthStatus(auth) {
  if (!auth) return '';
  if (auth.reason === 'INACTIVE_FLAG') return 'Contract: isActive = false (authorization is disabled on-chain).';
  if (auth.reason === 'AMOUNT_EXHAUSTED') return 'The maximum limit has been consumed (used >= max); a new authorization with a higher limit is required.';
  if (auth.reason === 'OK_UNLIMITED' || auth.unlimitedCap) return 'Unlimited limit (max = 0 on contract).';
  if (auth.reason === 'OK') return '';
  if (auth.reason === 'UNKNOWN') return 'Could not clearly read the on-chain state.';
  return '';
}

/** Format unix timestamp � relative label, for example "2 days ago". */
function formatAuthorizedAt(ts) {
  if (!ts || ts === '0') return null;
  const t = parseInt(String(ts), 10);
  if (!Number.isFinite(t) || t <= 0) return null;
  const sec = Math.floor(Date.now() / 1000) - t;
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} h ago`;
  if (sec < 2592000) return `${Math.floor(sec / 86400)} days ago`;
  return new Date(t * 1000).toLocaleDateString();
}

/** Label for known bots, for UI clarity. */
function getBotLabel(botAddress) {
  if (!botAddress || typeof botAddress !== 'string') return null;
  const addr = botAddress.toLowerCase();
  const aiTask = CONTRACT_MAP?.AI_TASK_MANAGER?.address?.toLowerCase?.();
  const otaAuto = CONTRACT_MAP?.OTA_AUTO_EXECUTOR?.address?.toLowerCase?.();
  const aiExec = CONTRACT_MAP?.AI_TRADING_EXECUTOR?.address?.toLowerCase?.();
  if (aiTask && addr === aiTask) return 'AITaskManager � task queue on-chain';
  if (otaAuto && addr === otaAuto) return 'OTA Auto Executor';
  if (aiExec && addr === aiExec) return 'AITradingExecutor';
  return null;
}
import OTALogo from '../frontend/components/ai-trading/OTALogo';
import TokenLogo from '../frontend/components/common/TokenLogo';
import { useDexAuth } from '../frontend/context/DexAuthContext';
import { useOTARegistrationContext } from '../frontend/context/OTARegistrationContext';
import { useWallet as useUnifiedWallet } from '../context/WalletContext.jsx';
import { toast } from 'react-toastify';
import { getBotWalletAddress } from '../frontend/utils/otaApiClient';
import tokenPriceService from '../frontend/services/tokenPriceService';
import { getBotAuthStatus } from '../frontend/services/aiTradingApiService';
import { useBotAuthorizationFlow, REAUTH_FLOW_STATES } from '../frontend/hooks/useBotAuthorizationFlow';
import '../frontend/styles/components/ota-settings-panel.css';

const OTASettingsPanel = React.memo(({ className = '' }) => {
  const navigate = useNavigate();
  const { walletAddress, associatedWalletAddress, isAuthenticated } = useDexAuth();
  const unifiedWallet = useUnifiedWallet();
  const { isRegistered, botAuthorizations, isAuthorizing, authorizeBot, checkRegistrationStatus } = useOTARegistrationContext();
  const {
    reauthFlowState,
    lastReauthTxHash,
    lastReauthError,
    startReauthorization,
    resetReauthState,
    statusAfterReauth,
  } = useBotAuthorizationFlow();
  /** Wallet that will sign the Authorize tx (WalletContext). Button enabled only when this is connected and registered. */
  const effectiveWallet = useMemo(() => {
    if (unifiedWallet?.isConnected && unifiedWallet?.walletType === 'EVM' && unifiedWallet?.walletAddress) {
      return unifiedWallet.walletAddress;
    }
    return null;
  }, [unifiedWallet?.isConnected, unifiedWallet?.walletType, unifiedWallet?.walletAddress]);
  const [botAddressFromApi, setBotAddressFromApi] = useState(null);
  const effectiveAddress = botAddressFromApi || null;
  const [loadingBot, setLoadingBot] = useState(true);
  const [maxAmount, setMaxAmount] = useState('5');
  const [amountUnit, setAmountUnit] = useState('usd'); // 'usd' | 'bnb' | 'eth'; always send USDT to backend.
  const [bnbPrice, setBnbPrice] = useState(null);
  const [ethPrice, setEthPrice] = useState(null);
  const [authorizeError, setAuthorizeError] = useState(null);
  const [refreshingFromChain, setRefreshingFromChain] = useState(false);
  const [botAuthStatusFromApi, setBotAuthStatusFromApi] = useState(null);
  const [confirmReauth, setConfirmReauth] = useState(false);
  const initializedMaxRef = React.useRef(false);
  /** Tx hash from the last successful reauthorization, persisted in sessionStorage across remount/navigation. */
  const [confirmedReauthTxHash, setConfirmedReauthTxHash] = useState(null);

  /** Data for the "Contract + called function" block: only from CONTRACT_MAP + ABI, no hardcoding. */
  const authorizeCallInfo = useMemo(() => {
    const uv = CONTRACT_MAP?.USER_VAULT;
    if (!uv) return { contractName: '', contractAddress: '', fnSignature: '' };
    return {
      contractName: uv.name || '',
      contractAddress: uv.address || '',
      fnSignature: getAuthorizeBotSignatureFromAbi(uv.abi),
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    tokenPriceService.getAllTokenPrices(['BNB', 'ETH'])
      .then((prices) => {
        if (cancelled) return;
        if (prices?.BNB > 0) setBnbPrice(prices.BNB);
        if (prices?.ETH > 0) setEthPrice(prices.ETH);
      })
      .catch(() => {
        if (!cancelled) { setBnbPrice(null); setEthPrice(null); }
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getBotWalletAddress()
      .then((addr) => { if (!cancelled) setBotAddressFromApi(addr); })
      .catch(() => { if (!cancelled) setBotAddressFromApi(null); })
      .finally(() => { if (!cancelled) setLoadingBot(false); });
    return () => { cancelled = true; };
  }, []);

  /** On-chain status for explicit messages: reauthorizationRequired, onChainEffectiveActive (amount-based authorization, not time-based). */
  useEffect(() => {
    if (!effectiveWallet) return;
    let cancelled = false;
    getBotAuthStatus(effectiveWallet)
      .then((res) => {
        if (cancelled || !res?.success) return;
        setBotAuthStatusFromApi(res);
      })
      .catch(() => { if (!cancelled) setBotAuthStatusFromApi(null); });
    return () => { cancelled = true; };
  }, [effectiveWallet]);

  /** Reset reauth flow when wallet changes */
  useEffect(() => {
    resetReauthState();
  }, [effectiveWallet, resetReauthState]);

  /** Persist last reauth tx hash (proof user signed); read from sessionStorage on mount so UI stays correct after remount/refresh */
  const REAUTH_TX_KEY = 'ota_last_reauth_tx';
  const REAUTH_TX_MAX_AGE_MS = 15 * 60 * 1000; // 15 min
  useEffect(() => {
    if (!effectiveWallet) { setConfirmedReauthTxHash(null); return; }
    const key = `${REAUTH_TX_KEY}_${effectiveWallet.toLowerCase()}`;
    if (lastReauthTxHash) {
      try {
        sessionStorage.setItem(key, JSON.stringify({ hash: lastReauthTxHash, ts: Date.now() }));
      } catch (_) {}
      setConfirmedReauthTxHash(lastReauthTxHash);
      return;
    }
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) { setConfirmedReauthTxHash(null); return; }
      const { hash, ts } = JSON.parse(raw);
      if (Date.now() - ts < REAUTH_TX_MAX_AGE_MS) setConfirmedReauthTxHash(hash);
      else { sessionStorage.removeItem(key); setConfirmedReauthTxHash(null); }
    } catch (_) { setConfirmedReauthTxHash(null); }
  }, [effectiveWallet, lastReauthTxHash]);

  /** After the user signs and we have a tx hash, refresh on-chain data after 3s so "Authorized at" updates. */
  useEffect(() => {
    const hash = lastReauthTxHash || confirmedReauthTxHash;
    if (!hash || !effectiveWallet || !checkRegistrationStatus) return;
    const t = setTimeout(() => {
      checkRegistrationStatus({ force: true, walletAddressOverride: effectiveWallet });
      getBotAuthStatus(effectiveWallet).then((res) => { if (res?.success) setBotAuthStatusFromApi(res); }).catch(() => {});
    }, 3000);
    return () => clearTimeout(t);
  }, [lastReauthTxHash, confirmedReauthTxHash, effectiveWallet, checkRegistrationStatus]);

  /** Sync status only when on-chain confirms; success toast only if API reports onChainEffectiveActive === true, no hardcoding. */
  useEffect(() => {
    if (!statusAfterReauth || !effectiveWallet) return;
    const onChainOk = statusAfterReauth.onChainEffectiveActive === true;
    setBotAuthStatusFromApi(statusAfterReauth);
    setConfirmReauth(false);
    setAuthorizeError(null);
    try {
      const k = effectiveWallet.toLowerCase();
      if (effectiveAddress) localStorage.setItem(`ota_last_bot_address_${k}`, effectiveAddress);
      const raw = maxAmount.trim() || '0';
      localStorage.setItem(`ota_last_bot_max_${k}`, raw);
      localStorage.setItem(`ota_last_bot_unit_${k}`, amountUnit);
    } catch (_) {}
    if (onChainOk) {
      toast.success('Amount-based authorization confirmed on contract. The bot can execute up to the authorized limit.');
    }
    const t = setTimeout(() => {
      getBotAuthStatus(effectiveWallet).then((res) => {
        if (res?.success) setBotAuthStatusFromApi(res);
      }).catch(() => {});
    }, 2500);
    return () => clearTimeout(t);
  }, [statusAfterReauth, effectiveWallet, effectiveAddress, maxAmount, amountUnit]);

  /** Show reauth failure in UI */
  useEffect(() => {
    if (reauthFlowState === REAUTH_FLOW_STATES.REAUTHORIZATION_FAILED && lastReauthError) {
      setAuthorizeError(lastReauthError);
      toast.error(lastReauthError);
    }
  }, [reauthFlowState, lastReauthError]);

  /** Existing authorization for the same bot: check before re-authorize. */
  const existingAuthForBot = useMemo(() => {
    if (!effectiveAddress || !Array.isArray(botAuthorizations)) return null;
    const addr = String(effectiveAddress).toLowerCase();
    return botAuthorizations.find(
      (a) => String(a?.botAddress || '').toLowerCase() === addr
    ) || null;
  }, [effectiveAddress, botAuthorizations]);

  /** Compute max amount in USDT string from form (maxAmount, amountUnit, prices). Used by Authorize and by duration-triggered reauth. Returns null if invalid. */
  const getMaxUsdtStrFromForm = useCallback(() => {
    const raw = maxAmount.trim() || '0';
    if (amountUnit === 'usd') {
      const usdVal = parseFloat(raw);
      if (Number.isNaN(usdVal) || usdVal < 0) return null;
      return usdVal === 0 ? '0' : raw;
    }
    if (amountUnit === 'bnb') {
      const bnbVal = parseFloat(raw);
      if (Number.isNaN(bnbVal) || bnbVal < 0 || !bnbPrice || bnbPrice <= 0) return null;
      return bnbVal === 0 ? '0' : String(Number((bnbVal * bnbPrice).toFixed(2)));
    }
    if (amountUnit === 'eth') {
      const ethVal = parseFloat(raw);
      if (Number.isNaN(ethVal) || ethVal < 0 || !ethPrice || ethPrice <= 0) return null;
      return ethVal === 0 ? '0' : String(Number((ethVal * ethPrice).toFixed(2)));
    }
    return null;
  }, [maxAmount, amountUnit, bnbPrice, ethPrice]);

  useEffect(() => {
    if (initializedMaxRef.current) return;
    // Always show the on-chain limit in USD (USDT); contract stores maxAmount in USDT wei (18 decimals).
    // This keeps the field equal to what we send and avoids 0.03 BNB � switch to USD � send 0.03 USDT.
    const target = existingAuthForBot || (Array.isArray(botAuthorizations) && botAuthorizations.find((a) => a?.maxAmount && a.maxAmount !== '0'));
    if (target?.maxAmount && target.maxAmount !== '0') {
      try {
        const formatted = ethers.utils.formatEther(target.maxAmount);
        const clean = parseFloat(formatted);
        if (Number.isFinite(clean) && clean >= 0) {
          setMaxAmount(clean === 0 ? '0' : (clean < 0.01 ? formatted.slice(0, 8) : String(Number(clean.toFixed(2)))));
          setAmountUnit('usd');
          initializedMaxRef.current = true;
          return;
        }
      } catch (_) {}
    }
    const keyWallet = (walletAddress || associatedWalletAddress)?.toLowerCase();
    if (keyWallet) {
      try {
        const saved = localStorage.getItem(`ota_last_bot_max_${keyWallet}`);
        const savedUnit = localStorage.getItem(`ota_last_bot_unit_${keyWallet}`);
        if (saved) {
          setMaxAmount(saved);
          if (savedUnit === 'bnb' || savedUnit === 'usd' || savedUnit === 'eth') setAmountUnit(savedUnit);
          initializedMaxRef.current = true;
        }
      } catch (_) {}
    }
  }, [botAuthorizations, existingAuthForBot, walletAddress, associatedWalletAddress]);

  const handleAuthorizeBot = useCallback(async () => {
    if (!effectiveAddress || !isAuthenticated || !effectiveWallet || !isRegistered) return;
    const raw = maxAmount.trim() || '0';
    // Always send max amount in USDT, the same unit as amountIn in executeTrade, not BNB.
    // Backend does parseUnits(maxAmount, 18) � 20e18 for "20"; contract compares against amountIn (USDT wei).
    let maxUsdtStr = raw;
    if (amountUnit === 'usd') {
      const usdVal = parseFloat(raw);
      if (Number.isNaN(usdVal) || usdVal < 0) {
        setAuthorizeError('Enter a valid number in USD.');
        return;
      }
      maxUsdtStr = usdVal === 0 ? '0' : raw;
    } else if (amountUnit === 'bnb') {
      const bnbVal = parseFloat(raw);
      if (Number.isNaN(bnbVal) || bnbVal < 0) {
        setAuthorizeError('Enter a valid number in BNB.');
        return;
      }
      if (!bnbPrice || bnbPrice <= 0) {
        setAuthorizeError('BNB price unavailable. Try again.');
        return;
      }
      const usdVal = bnbVal * bnbPrice;
      maxUsdtStr = bnbVal === 0 ? '0' : String(Number(usdVal.toFixed(2)));
    } else if (amountUnit === 'eth') {
      const ethVal = parseFloat(raw);
      if (Number.isNaN(ethVal) || ethVal < 0) {
        setAuthorizeError('Enter a valid number in ETH.');
        return;
      }
      if (!ethPrice || ethPrice <= 0) {
        setAuthorizeError('ETH price unavailable. Try again.');
        return;
      }
      const usdVal = ethVal * ethPrice;
      maxUsdtStr = ethVal === 0 ? '0' : String(Number(usdVal.toFixed(2)));
    }
    let maxWei;
    try {
      maxWei = maxUsdtStr === '0' ? ethers.BigNumber.from(0) : ethers.utils.parseEther(maxUsdtStr);
    } catch (_) {
      setAuthorizeError('Enter a valid amount.');
      return;
    }
    const isSameOrSimilarLimit = existingAuthForBot?.maxAmount && maxWei.eq(ethers.BigNumber.from(existingAuthForBot.maxAmount));
    const authExpiredOrExhausted = existingAuthForBot && !existingAuthForBot.effectiveActive;
    if (existingAuthForBot && isSameOrSimilarLimit && !confirmReauth) {
      if (authExpiredOrExhausted) {
        const ok = window.confirm(
          'Authorization expired or the amount was exhausted. Renew now (costs gas) to allow the bot to execute again.'
        );
        if (!ok) return;
        setConfirmReauth(true);
      } else {
        const ok = window.confirm(
          'The same amount is already authorized and still active. Re-authorizing costs gas without changing the limit. Continue anyway?'
        );
        if (!ok) return;
        setConfirmReauth(true);
      }
    }
    const maxUsdNum = parseFloat(maxUsdtStr);
    if (Number.isFinite(maxUsdNum) && maxUsdNum > 0 && maxUsdNum < 5) {
      const ok = window.confirm(
        `You're setting the bot limit to ${maxUsdtStr} USDT. For trades of 20 USDT you need at least 20. Continue with ${maxUsdtStr} USDT?`
      );
      if (!ok) return;
    }
    setAuthorizeError(null);
    await startReauthorization({
      walletAddress: effectiveWallet,
      botAddress: effectiveAddress,
      maxAmountUsdt: maxUsdtStr,
    });
    setMaxAmount(raw === '0' ? '' : raw);
  }, [effectiveAddress, isAuthenticated, effectiveWallet, isRegistered, maxAmount, amountUnit, bnbPrice, ethPrice, existingAuthForBot, confirmReauth, startReauthorization]);

  /** Reset local authorization state (expired/inactive bot). Clears sessionStorage + refetches status. */
  const handleResetReauthState = useCallback(() => {
    if (!effectiveWallet) return;
    const key = `ota_last_reauth_tx_${effectiveWallet.toLowerCase()}`;
    try { sessionStorage.removeItem(key); } catch (_) {}
    setConfirmedReauthTxHash(null);
    setAuthorizeError(null);
    resetReauthState();
    getBotAuthStatus(effectiveWallet).then((res) => {
      if (res?.success) setBotAuthStatusFromApi(res);
    });
    toast.info('State reset. Press Authorize to sign on the current contract (proxy).');
  }, [effectiveWallet, resetReauthState]);

  /** Refresh on-chain data (maxAmount, usedAmount): what is already set in blockchain. */
  const handleRefreshFromChain = useCallback(async () => {
    if (!effectiveWallet) {
      toast.info('Connect your wallet to read from chain.');
      return;
    }
    setRefreshingFromChain(true);
    setAuthorizeError(null);
    try {
      await checkRegistrationStatus({ force: true, walletAddressOverride: effectiveWallet });
      toast.success('Data reloaded from chain. See the current values below.');
    } catch (err) {
      const msg = err?.message || 'Error reading from chain';
      setAuthorizeError(msg);
      toast.error(msg);
    } finally {
      setRefreshingFromChain(false);
    }
  }, [effectiveWallet, checkRegistrationStatus]);

  const hasConfirmedReauthTx = lastReauthTxHash || confirmedReauthTxHash;
  // Reauth needed from API or chain read (existingAuthForBot expired). When API says onChainEffectiveActive=true, respect it and do not force reauth.
  const needReauthFromApi = botAuthStatusFromApi?.reauthorizationRequired === true || botAuthStatusFromApi?.onChainEffectiveActive === false;
  const needReauthFromChain = existingAuthForBot && existingAuthForBot.effectiveActive === false;
  const apiSaysActive = botAuthStatusFromApi?.onChainEffectiveActive === true && !botAuthStatusFromApi?.reauthorizationRequired;
  const needReauth = (needReauthFromApi || needReauthFromChain) && !apiSaysActive;
  const botAlreadyActive = !needReauth && (
    existingAuthForBot?.effectiveActive === true ||
    botAuthStatusFromApi?.onChainEffectiveActive === true ||
    (!!hasConfirmedReauthTx && botAuthStatusFromApi?.onChainEffectiveActive === true)
  );
  /** User entered a different amount from the on-chain limit; allow Authorize for reauthorization, for example 5 instead of 20. */
  const userWantsToChangeLimit = (() => {
    const formStr = getMaxUsdtStrFromForm();
    if (!existingAuthForBot?.maxAmount || formStr == null) return false;
    try {
      const formWei = formStr === '0' ? ethers.BigNumber.from(0) : ethers.utils.parseEther(formStr);
      const chainWei = ethers.BigNumber.from(existingAuthForBot.maxAmount);
      return !formWei.eq(chainWei);
    } catch (_) {
      return false;
    }
  })();
  /** Visible when reauthorization is needed (API or expired chain state); user can reset local state and press Authorize to reactivate the bot. */
  const showResetReauthButton = !!effectiveWallet && needReauth;
  const canSubmit = isAuthenticated && effectiveWallet && isRegistered;
  const reauthInProgress = [
    REAUTH_FLOW_STATES.AWAITING_WALLET_SIGNATURE,
    REAUTH_FLOW_STATES.TRANSACTION_SUBMITTED,
    REAUTH_FLOW_STATES.STATUS_REFRESHING,
  ].includes(reauthFlowState);
  const authorizeButtonLabel =
    reauthFlowState === REAUTH_FLOW_STATES.AWAITING_WALLET_SIGNATURE
      ? 'Signing...'
      : reauthFlowState === REAUTH_FLOW_STATES.TRANSACTION_SUBMITTED
        ? 'Submitted...'
        : reauthFlowState === REAUTH_FLOW_STATES.STATUS_REFRESHING
          ? 'Verifying...'
          : isAuthorizing
            ? '�'
            : userWantsToChangeLimit
              ? 'Re-authorize'
              : 'Authorize';

  if (loadingBot) {
    return (
      <div className={`ota-settings-panel ${className}`}>
        <div className="ota-settings-panel-header ota-title-row">
          <OTALogo size="sm" className="ota-settings-panel-logo" />
          <h3 className="ota-settings-panel-title">Bot Authorization</h3>
        </div>
        <div className="ota-settings-panel-content"><p className="ota-settings-panel-muted">Loading bot address�</p></div>
      </div>
    );
  }

  if (!effectiveAddress) {
    return (
      <div className={`ota-settings-panel ${className}`}>
        <div className="ota-settings-panel-header ota-title-row">
          <OTALogo size="sm" className="ota-settings-panel-logo" />
          <h3 className="ota-settings-panel-title">Bot Authorization</h3>
        </div>
        <div className="ota-settings-panel-content">
          <p className="ota-settings-panel-muted" style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
            Bot address is not configured. Set <code style={{ fontSize: '12px' }}>BOT_WALLET_ADDRESS</code> in the backend environment (e.g. .env or Render env vars). Until then, use Advisory or Assisted mode.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="ota-authorize-bot" className={`ota-settings-panel ${className}`}>
      <div className="ota-settings-panel-header">
        <div className="ota-settings-panel-header-left ota-title-row">
          <OTALogo size="sm" className="ota-settings-panel-logo" />
          <h3 className="ota-settings-panel-title">Authorize Bot</h3>
        </div>
      </div>
      <div className="ota-settings-panel-content">
        {/* Clear alert: authorization expired; user must know they need to renew. */}
        {effectiveAddress && existingAuthForBot && !existingAuthForBot.effectiveActive && (
          <div className="ota-settings-panel-auth-expired-alert" role="alert" aria-live="polite">
            <AlertCircle size={22} className="ota-settings-panel-auth-expired-alert-icon" aria-hidden />
            <div className="ota-settings-panel-auth-expired-alert-body">
              <p className="ota-settings-panel-auth-expired-alert-title">
                {existingAuthForBot.reason === 'AMOUNT_EXHAUSTED'
                  ? 'Authorized amount is exhausted.'
                  : 'Bot authorization expired or is inactive.'}
              </p>
              <p className="ota-settings-panel-auth-expired-alert-desc">
                The bot cannot execute transactions until you renew. Enter the amount (USD or BNB) below, press <strong>Authorize</strong>, and sign in your wallet.
              </p>
            </div>
          </div>
        )}
        <div className="ota-settings-panel-section">
          <div className="ota-settings-panel-bot-authorization">
            <div className="ota-settings-panel-deposit-step" role="region" aria-label="Step 1: Personal Account � Deposit & Withdraw">
              <span className="ota-settings-panel-step-label">Step 1</span>
              <p className="ota-settings-panel-deposit-desc">
                <Landmark size={18} className="ota-settings-panel-personal-account-icon" aria-hidden />
                <strong>Your Personal Account</strong> � like a bank account. Only <em>you</em> can withdraw. Transfer BNB, USDT or ETH here (required before Authorize). Changed your mind? Withdraw back anytime.
              </p>
              <div className="ota-settings-panel-deposit-withdraw-row">
                <button
                  type="button"
                  className="ota-settings-panel-deposit-btn"
                  onClick={() => navigate('/dex-edu/leverage?tab=deposit')}
                  aria-label="Deposit to Personal Account � transfer funds from wallet"
                  title="Leverage � Deposit"
                >
                  <ArrowDownCircle size={18} aria-hidden />
                  Deposit
                </button>
                <button
                  type="button"
                  className="ota-settings-panel-withdraw-btn"
                  onClick={() => navigate('/dex-edu/leverage?tab=withdraw')}
                  aria-label="Withdraw from Personal Account � move funds back to wallet"
                  title="Leverage � Withdraw � get your funds back when you change your mind"
                >
                  <ArrowUpCircle size={18} aria-hidden />
                  Withdraw
                </button>
              </div>
            </div>
            <div className="ota-settings-panel-step-divider" aria-hidden />
            <span className="ota-settings-panel-step-label">Step 2</span>
            {effectiveAddress && existingAuthForBot && (
              <div className="ota-settings-panel-bot-status-banner" role="status" aria-live="polite">
                <div className="ota-settings-panel-bot-status-row">
                  <span className="ota-settings-panel-bot-status-label">Bot OTA LLM:</span>
                  <span className={`ota-settings-panel-bot-status-badge ${existingAuthForBot.effectiveActive ? 'active' : 'expired'}`}>
                    {existingAuthForBot.effectiveActive ? 'Active' : (existingAuthForBot.reason === 'AMOUNT_EXHAUSTED' ? 'Amount exhausted' : 'Inactive')}
                  </span>
                </div>
                <div className="ota-settings-panel-bot-duration-row">
                  {existingAuthForBot.authorizedAtIso ? `Authorized at: ${new Date(existingAuthForBot.authorizedAtIso).toLocaleString()}` : '�'}
                </div>
                {!existingAuthForBot.effectiveActive && existingAuthForBot.reason === 'AMOUNT_EXHAUSTED' && (
                  <p className="ota-settings-panel-bot-expired-hint">
                    Authorized amount is exhausted. You can increase the limit below (Authorize).
                  </p>
                )}
                {!existingAuthForBot.effectiveActive && (
                  <button
                    type="button"
                    className="ota-settings-panel-renew-bot-btn"
                    onClick={() => document.getElementById('ota-bot-max-amount')?.focus({ preventScroll: false }) || document.querySelector('.ota-settings-panel-bot-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    aria-label="Authorize bot or increase limit - focus amount field"
                  >
                    {existingAuthForBot.reason === 'AMOUNT_EXHAUSTED' ? 'Increase limit' : 'Authorize'}
                  </button>
                )}
              </div>
            )}
            {effectiveAddress && (
              <div className="ota-settings-panel-existing-auth-banner" role="alert">
                <p className="ota-settings-panel-existing-auth-intro" style={{ marginBottom: '0.5rem' }}>
                  <strong>You already have an authorization</strong> for this bot:{' '}
                  <span className="ota-settings-panel-existing-auth-amount" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3b82f6' }}>
                    {existingAuthForBot
                      ? (() => {
                          const m = String(existingAuthForBot.maxAmount ?? '');
                          if (m === '0' || !m) return '? USDT (unlimited)';
                          try {
                            const { usdtStr } = formatWeiToUsdt(m);
                            return `Max: ${usdtStr || '0'} USDT`;
                          } catch {
                            return '0 USDT';
                          }
                        })()
                      : '0 USDT'}
                  </span>
                </p>
                <p className="ota-settings-panel-existing-auth-hint" style={{ margin: 0, fontSize: '0.875rem' }}>
                  {existingAuthForBot?.effectiveActive
                    ? 'Re-authorizing costs gas. Skip it if the current limit is already enough.'
                    : 'The limit is exhausted or you are not authorized. Set or increase the limit below (Authorize).'}
                </p>
                <button
                  type="button"
                  className="ota-settings-panel-refresh-chain-btn"
                  onClick={handleRefreshFromChain}
                  disabled={refreshingFromChain || !effectiveWallet}
                  aria-label="Call UserVault.getBotAuthorization and show the returned result"
                  title="Call the on-chain getBotAuthorization(user, bot) function from the UserVault contract and show the result (isActive, authorizedAt, maxAmount, usedAmount)"
                  style={{ marginTop: '0.5rem' }}
                >
                  {refreshingFromChain ? 'Querying contract...' : 'Query contract - show result'}
                </button>
                {/* Effective result returned by the contract (getBotAuthorization): real chain data, not hardcoded. */}
                <div className="ota-settings-panel-contract-result" role="region" aria-label="Contract query result" style={{ marginTop: '0.75rem' }}>
                  <div className="ota-settings-panel-contract-result-title">
                    Contract query result
                  </div>
                  <div className="ota-settings-panel-contract-result-desc">
                    Direct blockchain read (UserVault). The limit does not expire by time; it is consumed when the bot uses funds.
                  </div>
                  {existingAuthForBot ? (
                    <>
                      {(() => {
                        const max = existingAuthForBot.maxAmount || '0';
                        const used = existingAuthForBot.usedAmount || '0';
                        let remWei = '0';
                        try {
                          if (!existingAuthForBot.unlimitedCap) {
                            remWei = ethers.BigNumber.from(max).sub(ethers.BigNumber.from(used)).toString();
                          }
                        } catch { remWei = '0'; }
                        const maxUsdt = formatWeiToUsdt(max).usdtStr;
                        const usedUsdt = formatWeiToUsdt(used).usdtStr;
                        const remUsdt = existingAuthForBot.unlimitedCap ? 'unlimited' : formatWeiToUsdt(remWei).usdtStr;
                        const authDate =
                          existingAuthForBot.authorizedAt && existingAuthForBot.authorizedAt !== '0'
                            ? new Date((existingAuthForBot.authorizedAtSeconds || 0) * 1000).toLocaleString()
                            : null;
                        const contractOk =
                          existingAuthForBot.isActive &&
                          (existingAuthForBot.unlimitedCap || !existingAuthForBot.amountExhausted);
                        return (
                          <div className="ota-settings-panel-contract-summary">
                            <p className="ota-settings-panel-contract-summary-main">
                              {existingAuthForBot.unlimitedCap ? (
                                <>
                                  <strong>Unlimited limit</strong> on contract.
                                </>
                              ) : (
                                <>
                                  The bot can still use up to <strong>{remUsdt} USDT</strong> from the authorization
                                  <span className="ota-settings-panel-contract-summary-sub">
                                    {' '}
                                    (max {maxUsdt} USDT, already used {usedUsdt} USDT
                                    {used === '0' ? ' - nothing consumed yet' : ''})
                                  </span>
                                  .
                                </>
                              )}
                            </p>
                            {authDate ? (
                              <p className="ota-settings-panel-contract-summary-line">
                                Authorization set: <strong>{authDate}</strong>
                              </p>
                            ) : null}
                            <p className="ota-settings-panel-contract-summary-line">
                              Auto mode:{' '}
                              <strong className={existingAuthForBot.effectiveActive ? 'ota-contract-ok' : 'ota-contract-bad'}>
                                {existingAuthForBot.effectiveActive ? 'active - you can run the bot' : 'not ready - see below'}
                              </strong>
                            </p>
                            {!existingAuthForBot.effectiveActive && (
                              <p className="ota-settings-panel-contract-hint ota-contract-hint-block">
                                {explainBotAuthStatus(existingAuthForBot) ||
                                  (!contractOk
                                    ? 'On contract, authorization is inactive or the limit is exhausted.'
                                    : null)}
                                {!existingAuthForBot.effectiveActive &&
                                existingAuthForBot.isActive &&
                                !existingAuthForBot.unlimitedCap &&
                                !existingAuthForBot.amountExhausted ? (
                                  <> Reload with the button above or re-authorize.</>
                                ) : null}
                              </p>
                            )}
                          </div>
                        );
                      })()}
                      <details className="ota-settings-panel-contract-technical">
                        <summary>Technical details (wei, isActive, contract call)</summary>
                        <dl className="ota-settings-panel-contract-result-dl">
                          <dt>Call</dt>
                          <dd>
                            <code>{(authorizeCallInfo.contractName || 'UserVault')}.getBotAuthorization(user, bot)</code>
                          </dd>
                          <dt>isActive</dt>
                          <dd>{String(existingAuthForBot.isActive)}</dd>
                          <dt>authorizedAt</dt>
                          <dd>
                            {existingAuthForBot.authorizedAt || '0'}
                            {existingAuthForBot.authorizedAtIso
                              ? ` -> ${new Date(existingAuthForBot.authorizedAtIso).toLocaleString()}`
                              : ''}
                          </dd>
                          <dt>maxAmount (wei)</dt>
                          <dd>{existingAuthForBot.maxAmount ?? '0'}</dd>
                          <dt>usedAmount (wei)</dt>
                          <dd>{existingAuthForBot.usedAmount ?? '0'}</dd>
                          <dt>remaining (wei)</dt>
                          <dd>
                            {existingAuthForBot.unlimitedCap
                              ? '- (unlimited)'
                              : (() => {
                                  try {
                                    return ethers.BigNumber.from(existingAuthForBot.maxAmount || '0')
                                      .sub(ethers.BigNumber.from(existingAuthForBot.usedAmount || '0'))
                                      .toString();
                                  } catch {
                                    return '�';
                                  }
                                })()}
                          </dd>
                        </dl>
                      </details>
                    </>
                  ) : (
                    <p className="ota-settings-panel-contract-result-empty">
                      Press the button above to call the contract. If there is no authorization for this bot, no record appears.
                    </p>
                  )}
                  {Array.isArray(botAuthorizations) && botAuthorizations.length > 0 && (
                    <p className="ota-settings-panel-contract-result-extra" style={{ fontSize: '0.8rem', marginTop: '0.35rem', opacity: 0.9 }}>
                      {botAuthorizations.length} on-chain authorization(s) for this wallet � bot: {effectiveAddress.slice(0, 10)}�{effectiveAddress.slice(-6)}
                    </p>
                  )}
                </div>
              </div>
            )}
            <p className="ota-settings-panel-description ota-settings-panel-bot-intro" role="status">
              Set the <strong>maximum</strong> the bot can use from your Personal Account (funds from Step 1). Enter in <strong>USD</strong> (USDT), <strong>BNB</strong>, or <strong>ETH</strong>. <strong>0</strong> = unlimited. For other tokens: <strong>Auto</strong> tab � <strong>Policy</strong>.
            </p>
            <div className="ota-settings-panel-bot-form">
              <div className="ota-settings-panel-bot-field">
                <span className="ota-settings-panel-bot-label">Bot address</span>
                <div className="ota-settings-panel-bot-readonly" aria-live="polite">
                  <Shield size={26} className="ota-settings-panel-bot-address-icon" aria-hidden />
                  <span className="ota-settings-panel-bot-address" title={effectiveAddress}>
                    {effectiveAddress.slice(0, 10)}�{effectiveAddress.slice(-8)}
                  </span>
                </div>
              </div>
              <div className="ota-settings-panel-bot-field">
                <label htmlFor="ota-bot-max-amount" className="ota-settings-panel-bot-label">
                  Max in {amountUnit === 'usd' ? 'USD (USDT)' : amountUnit === 'bnb' ? 'BNB' : 'ETH'} (0 = unlimited)
                </label>
                <div className="ota-settings-panel-bot-input-row">
                  <input
                    id="ota-bot-max-amount"
                    type="text"
                    className="ota-settings-panel-bot-input"
                    placeholder={amountUnit === 'usd' ? 'ex. 5' : amountUnit === 'bnb' ? 'ex. 0.02' : 'ex. 0.005'}
                    value={maxAmount}
                    onChange={(e) => { setMaxAmount(e.target.value); setAuthorizeError(null); }}
                    disabled={isAuthorizing}
                    aria-describedby="ota-bot-max-hint"
                    aria-label={amountUnit === 'usd' ? 'Max in USD the bot can use; 0 = unlimited' : amountUnit === 'bnb' ? 'Max in BNB; 0 = unlimited' : 'Max in ETH; 0 = unlimited'}
                    title={amountUnit === 'usd' ? 'Enter amount in USD (e.g. 5). Default 5 USD for calibration.' : amountUnit === 'bnb' ? 'Enter amount in BNB. Helper shows USD value below.' : 'Enter amount in ETH. Helper shows USD value below.'}
                  />
                  <div className="ota-settings-panel-bot-unit-toggle">
                    <button
                      type="button"
                      className={amountUnit === 'usd' ? 'active' : ''}
                      onClick={() => { setAmountUnit('usd'); setAuthorizeError(null); }}
                      aria-pressed={amountUnit === 'usd'}
                      title="Enter value in USD (USDT)"
                    >
                      <TokenLogo symbol="USDT" size="lg" showBorder className="ota-settings-panel-bot-unit-logo" aria-hidden />
                      <span>USD</span>
                    </button>
                    <button
                      type="button"
                      className={amountUnit === 'bnb' ? 'active' : ''}
                      onClick={() => { setAmountUnit('bnb'); setAuthorizeError(null); }}
                      aria-pressed={amountUnit === 'bnb'}
                      title="Enter value in BNB"
                    >
                      <TokenLogo symbol="BNB" size="lg" showBorder className="ota-settings-panel-bot-unit-logo" aria-hidden />
                      <span>BNB</span>
                    </button>
                    <button
                      type="button"
                      className={amountUnit === 'eth' ? 'active' : ''}
                      onClick={() => { setAmountUnit('eth'); setAuthorizeError(null); }}
                      aria-pressed={amountUnit === 'eth'}
                      title="Enter value in ETH"
                    >
                      <TokenLogo symbol="ETH" size="lg" showBorder className="ota-settings-panel-bot-unit-logo" aria-hidden />
                      <span>ETH</span>
                    </button>
                  </div>
                </div>
                {amountUnit === 'usd' && maxAmount.trim() && bnbPrice && bnbPrice > 0 && (() => {
                  const usdVal = parseFloat(maxAmount.trim());
                  if (!Number.isNaN(usdVal) && usdVal >= 0) {
                    const bnbEquiv = usdVal / bnbPrice;
                    return <p className="ota-settings-panel-field-hint" id="ota-bot-max-hint">? {bnbEquiv.toFixed(6)} BNB</p>;
                  }
                  return null;
                })()}
                {amountUnit === 'bnb' && maxAmount.trim() && bnbPrice && bnbPrice > 0 && (() => {
                  const bnbVal = parseFloat(maxAmount.trim());
                  if (!Number.isNaN(bnbVal) && bnbVal >= 0) {
                    const usdEquiv = bnbVal * bnbPrice;
                    return <p className="ota-settings-panel-field-hint" id="ota-bot-max-hint">? {usdEquiv.toFixed(2)} USDT</p>;
                  }
                  return null;
                })()}
                {amountUnit === 'eth' && maxAmount.trim() && ethPrice && ethPrice > 0 && (() => {
                  const ethVal = parseFloat(maxAmount.trim());
                  if (!Number.isNaN(ethVal) && ethVal >= 0) {
                    const usdEquiv = ethVal * ethPrice;
                    return <p className="ota-settings-panel-field-hint" id="ota-bot-max-hint">? {usdEquiv.toFixed(2)} USDT</p>;
                  }
                  return null;
                })()}
                {(!maxAmount.trim() || (amountUnit === 'usd' && !bnbPrice) || (amountUnit === 'bnb' && !bnbPrice) || (amountUnit === 'eth' && !ethPrice)) && (
                  <p className="ota-settings-panel-field-hint" id="ota-bot-max-hint">
                    {amountUnit === 'usd'
                      ? (bnbPrice ? 'Recommended 5 USD (calibration). Enter amount in USD.' : 'Loading prices...')
                      : amountUnit === 'bnb'
                        ? (bnbPrice ? 'Enter BNB. Value in USDT shown below.' : 'Loading BNB price�')
                        : (ethPrice ? 'Enter ETH. Value in USDT shown below.' : 'Loading ETH price�')}
                  </p>
                )}
              </div>
              {reauthFlowState === REAUTH_FLOW_STATES.AWAITING_WALLET_SIGNATURE && (
                <p className="ota-settings-panel-reauth-msg ota-settings-panel-reauth-waiting" role="status">
                  Waiting for wallet signature...
                </p>
              )}
              {reauthFlowState === REAUTH_FLOW_STATES.TRANSACTION_SUBMITTED && (
                <p className="ota-settings-panel-reauth-msg ota-settings-panel-reauth-submitted" role="status">
                  Transaction submitted...
                </p>
              )}
              {reauthFlowState === REAUTH_FLOW_STATES.STATUS_REFRESHING && (
                <p className="ota-settings-panel-reauth-msg ota-settings-panel-reauth-refreshing" role="status">
                  Checking on-chain status...
                </p>
              )}
              {/* Amount-based authorization: active when on-chain confirms (onChainEffectiveActive); no time expiration. */}
              {((statusAfterReauth ?? botAuthStatusFromApi)?.onChainEffectiveActive === true) && (
                <p className="ota-settings-panel-reauth-msg ota-settings-panel-reauth-active" role="status">
                  Authorization active on contract. The bot can execute up to the authorized amount limit.
                </p>
              )}
              {reauthFlowState === REAUTH_FLOW_STATES.REAUTHORIZATION_FAILED && lastReauthError && (
                <p className="ota-settings-panel-reauth-msg ota-settings-panel-reauth-failed" role="alert">
                  Authorization was not updated on-chain. Try again.
                </p>
              )}
              {hasConfirmedReauthTx && (
                <p className="ota-settings-panel-field-hint" style={{ marginTop: 4 }}>
                  <a href={`${getBscScanBase()}/tx/${hasConfirmedReauthTx}`} target="_blank" rel="noopener noreferrer">
                    View transaction on BSCScan
                  </a>
                </p>
              )}
              {hasConfirmedReauthTx && (existingAuthForBot?.effectiveActive === false || (statusAfterReauth ?? botAuthStatusFromApi)?.onChainEffectiveActive === false) && (
                <p className="ota-settings-panel-reauth-msg ota-settings-panel-reauth-just-signed" role="alert" style={{ marginTop: 6 }}>
                  You signed, but the contract state did not update. Check on BSCScan that the transaction targets the correct address (UserVault Proxy). Without the on-chain update, automatic execution remains stopped.
                </p>
              )}
              {authorizeError && (
                <div className="ota-settings-panel-error" role="alert">
                  {authorizeError}
                </div>
              )}
              {!canSubmit && (
                <p className="ota-settings-panel-field-hint ota-settings-panel-bot-required" role="status">
                  {!effectiveWallet
                    ? 'To enable the button: connect your wallet (wallet selector or top of page), then complete <strong>Registration</strong> in the section above (OTA Access Control).'
                    : 'To enable the button: complete <strong>Registration</strong> in the section above (OTA Access Control).'}
                </p>
              )}
              {authorizeCallInfo.contractAddress && (
              <div className="ota-settings-panel-authorize-call-info" role="region" aria-label="Contract and function called by the Authorize button">
                <div className="ota-settings-panel-authorize-call-row">
                  <span className="ota-settings-panel-authorize-call-label">Contract:</span>
                  <span className="ota-settings-panel-authorize-call-value">{authorizeCallInfo.contractName || '�'}</span>
                  <a href={`${getBscScanBase()}/address/${authorizeCallInfo.contractAddress}`} target="_blank" rel="noopener noreferrer" className="ota-settings-panel-authorize-call-link" title="Open contract on BSCScan">
                    <ExternalLink size={12} />
                    {authorizeCallInfo.contractAddress.slice(0, 6)}�{authorizeCallInfo.contractAddress.slice(-4)}
                  </a>
                </div>
                {authorizeCallInfo.fnSignature && (
                <div className="ota-settings-panel-authorize-call-row">
                  <span className="ota-settings-panel-authorize-call-label">Called function:</span>
                  <code className="ota-settings-panel-authorize-call-fn">{authorizeCallInfo.fnSignature}</code>
                </div>
                )}
                <p className="ota-settings-panel-authorize-call-desc">The <strong>Authorize</strong> button sends an on-chain transaction to this contract (proxy). You sign in your wallet; no funds are withdrawn, only the bot limit is recorded.</p>
              </div>
              )}
              <button
                type="button"
                className="ota-settings-panel-authorize-btn"
                onClick={handleAuthorizeBot}
                disabled={!canSubmit || isAuthorizing || reauthInProgress || (botAlreadyActive && !userWantsToChangeLimit)}
                aria-label="Authorize bot (sign on-chain; requires wallet connected and registered above)"
                title={botAlreadyActive && !userWantsToChangeLimit ? 'Bot is already authorized on-chain' : userWantsToChangeLimit ? 'Re-authorize with new limit (costs gas)' : !canSubmit ? 'Connect wallet and complete Registration above first' : 'Sign transaction to authorize the bot'}
              >
                {isAuthorizing || reauthInProgress ? <Zap size={16} className="spinning" /> : <Shield size={16} />}
                {authorizeButtonLabel}
              </button>
              {showResetReauthButton && (
                <button
                  type="button"
                  className="ota-settings-panel-reset-reauth-btn"
                  onClick={handleResetReauthState}
                  aria-label="Reset authorization state and re-authorize bot"
                  title="Bot authorization expired or is inactive. Reset and press Authorize to reactivate."
                >
                  Reset and re-authorize bot
                </button>
              )}
            </div>
            {Array.isArray(botAuthorizations) && botAuthorizations.length > 0 && (
              <div className="ota-settings-panel-bot-list">
                {botAuthorizations.map((auth, index) => (
                  <div key={index} className="ota-settings-panel-bot-item">
                    <CheckCircle size={16} className="check-passed" />
                    <div className="ota-settings-panel-bot-item-info">
                      <div className="ota-settings-panel-bot-item-address-wrap">
                        <div className="ota-settings-panel-bot-item-address-row">
                          <span className="ota-settings-panel-bot-item-address" title={auth.botAddress}>
                            {auth.botAddress?.slice(0, 10)}�{auth.botAddress?.slice(-8)}
                          </span>
                          <a
                            href={`${getBscScanBase()}/address/${auth.botAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ota-settings-panel-bot-item-bscscan"
                            title="View on BSCScan"
                            aria-label="View contract on BSCScan"
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>
                        {getBotLabel(auth.botAddress) && (
                          <span className="ota-settings-panel-bot-item-label">
                            {getBotLabel(auth.botAddress)}
                          </span>
                        )}
                      </div>
                      <div className="ota-settings-panel-bot-item-details">
                        <span className="ota-settings-panel-bot-item-amount">
                          {auth.maxAmount === '0' || !auth.maxAmount
                            ? '? USDT (unlimited)'
                            : (() => {
                                const { usdtStr } = formatWeiToUsdt(auth.maxAmount);
                                return `Max: ${usdtStr} USDT`;
                              })()}
                        </span>
                        {auth.usedAmount && auth.usedAmount !== '0' && (() => {
                          const { usdtStr } = formatWeiToUsdt(auth.usedAmount);
                          return (
                            <span className="ota-settings-panel-bot-item-used">
                              Used: {usdtStr} USDT
                            </span>
                          );
                        })()}
                        {auth.maxAmount && auth.maxAmount !== '0' && auth.usedAmount && auth.usedAmount !== '0' && (() => {
                          try {
                            const maxBn = ethers.BigNumber.from(auth.maxAmount);
                            const usedBn = ethers.BigNumber.from(auth.usedAmount);
                            const rem = maxBn.sub(usedBn);
                            if (rem.gt(0)) {
                              const { usdtStr } = formatWeiToUsdt(rem.toString());
                              return (
                                <span className="ota-settings-panel-bot-item-remaining">
                                  Remaining: {usdtStr} USDT
                                </span>
                              );
                            }
                          } catch (_) {}
                          return null;
                        })()}
                        {formatAuthorizedAt(auth.authorizedAt) && (
                          <span className="ota-settings-panel-bot-item-since">
                            Since: {formatAuthorizedAt(auth.authorizedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

OTASettingsPanel.displayName = 'OTASettingsPanel';
export default OTASettingsPanel;
