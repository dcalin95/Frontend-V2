/**
 * 👤 OTA Profile Page - Complete Profile Management
 * 
 * Complete profile page pentru OTA cu:
 * - Editare profil (username, email)
 * - Wallet management (add/remove wallets)
 * - Change password
 * - OTA registration status
 * - OTA settings panel
 * 
 * @module OTAProfilePage
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Plus, Shield, RefreshCw, AlertCircle, Fingerprint, Send, LogOut, Zap, ChevronRight, Landmark, ArrowDownCircle, Circle } from 'lucide-react';
import {
  IconUser, IconMail, IconPhone, IconTelegram, IconCamera, IconEdit,
  IconCreditCard, IconFileCheck, IconWallet, IconCopy, IconCheckCircle, IconXCircle,
  IconStar, IconTrash, IconLock
} from '../components/icons/ProfileIcons';
import OTALogo from '../components/ai-trading/OTALogo';
import OTABrand from '../components/ai-trading/OTABrand';
import { useDexAuth } from '../context/DexAuthContext';
import { useOTARegistrationContext } from '../context/OTARegistrationContext';
import { useWallet as useUnifiedWallet } from '../../context/WalletContext.jsx';
import authApiService, { getPaymentsHistory, getDocuments, uploadDocument, parseProfileBankStatement } from '../services/authApiService';
import { parseDeviceDisplayInfo } from '../../utils/deviceFingerprint.js';
import { getChainDisplay, getWalletTypeDisplay } from '../utils/chainDisplayConfig';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/formatters';
import { validateIban, maskIban, normalizeIban } from '../utils/ibanValidation';
import { getStripeBalance, getStripeHistory } from '../services/stripeWithdrawalService';
import { BITS_FIAT_BALANCE_REFRESH } from '../utils/fiatBalanceEvents';
import { formatFiatWithdrawalStatusLabel, fiatWithdrawalDetailLine } from '../utils/fiatWithdrawalStatusUi';
import OTASettingsPanel from '../../ota/OTASettingsPanel';
import OtaBscAutoStatusBanner from '../components/ai-trading/OtaBscAutoStatusBanner';
import { isBotAuthorized, getExecutorBotAuth } from '../utils/otaTradingModes';
import ProfileAvatarDisplay from '../components/profile/ProfileAvatarDisplay';
import '../styles/pages.css';
import '../styles/components/ota-profile-page.css';

const PHONE_E164_REGEX = /^\+?[1-9]\d{1,14}$/;

const OTAProfilePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    user,
    walletAddress: dexAuthWallet,
    isAuthenticated,
    loading: authLoading,
    checkAuthStatus,
    updateProfile,
    saveProfilePhone,
    saveProfileBank,
    uploadProfilePhoto,
    changePassword,
    updatePhoneNumber,
    registerBiometric,
    isBiometricAvailable,
    hasBiometricCredential,
    removeBiometricCredential,
    logout,
  } = useDexAuth();
  const unifiedWallet = useUnifiedWallet();

  const effectiveWalletAddress = useMemo(() => {
    if (unifiedWallet?.isConnected && unifiedWallet?.walletType === 'EVM' && unifiedWallet?.walletAddress) {
      return unifiedWallet.walletAddress;
    }
    return dexAuthWallet || null;
  }, [unifiedWallet?.isConnected, unifiedWallet?.walletType, unifiedWallet?.walletAddress, dexAuthWallet]);

  const {
    isRegistered,
    isLoading: otaLoading,
    bitsBalance,
    registrationStatus,
    privileges,
    botAuthorizations,
    executorBotAddress,
    isRegistering,
    error: otaError,
    register: registerOTA,
    refresh: refreshOTA
  } = useOTARegistrationContext();

  const executorBotAuth = useMemo(() => getExecutorBotAuth(botAuthorizations, executorBotAddress), [botAuthorizations, executorBotAddress]);

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isAddingWallet, setIsAddingWallet] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityBusy, setSecurityBusy] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricRegistered, setBiometricRegistered] = useState(false);
  
  // Multi-wallet state
  const [savedWallets, setSavedWallets] = useState([]);
  const [walletsLoading, setWalletsLoading] = useState(false);
  const [mainWalletAddress, setMainWalletAddress] = useState(null);

  // Profile photo upload
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const avatarInputRef = React.useRef(null);

  // Phone: add/change + verification (OTP sent by backend; e.g. Amazon SNS when implemented)
  const [phoneDraft, setPhoneDraft] = useState('');
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [phoneSendCodeBusy, setPhoneSendCodeBusy] = useState(false);
  const [phoneResendCooldown, setPhoneResendCooldown] = useState(0);
  const [phoneFormOpen, setPhoneFormOpen] = useState(false);
  const [phoneFormMode, setPhoneFormMode] = useState('save'); // 'save' = add/change number only; 'verify' = send code + verify

  // Bank account (IBAN) for withdrawals
  const [ibanDraft, setIbanDraft] = useState('');
  const [bicDraft, setBicDraft] = useState('');
  const [holderDraft, setHolderDraft] = useState('');
  const [bankFormOpen, setBankFormOpen] = useState(false);
  const [bankBusy, setBankBusy] = useState(false);
  const [bankParseBusy, setBankParseBusy] = useState(false);
  const [bankProofUploading, setBankProofUploading] = useState(false);
  /** Fișier folosit la „Extrage automat” — poate fi încărcat și ca dovadă (extras în `user_documents`). */
  const [lastParsedFileForProof, setLastParsedFileForProof] = useState(null);
  const bankStatementInputRef = React.useRef(null);
  const bankProofInputRef = React.useRef(null);

  // Stripe / Fiat (vault deposits from card – balance + history for profile)
  const [stripeBalanceEur, setStripeBalanceEur] = useState(0);
  const [stripeBalanceUsd, setStripeBalanceUsd] = useState(0);
  const [stripeDeposits, setStripeDeposits] = useState([]);
  const [stripeWithdrawals, setStripeWithdrawals] = useState([]);
  const [stripePaymentsHistory, setStripePaymentsHistory] = useState([]);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState(null);

  // Legal documents (ID, bank statement) – upload + verification
  const [documents, setDocuments] = useState([]);
  const [documentsUploading, setDocumentsUploading] = useState(false);
  const legalIdDocumentInputRef = React.useRef(null);
  const legalBankStatementDocumentInputRef = React.useRef(null);

  // Telegram: link, validation, display (same as Profile.jsx)
  const [telegramFromWallet, setTelegramFromWallet] = useState(null);
  const [telegramLink, setTelegramLink] = useState(null);
  const [telegramLinkBusy, setTelegramLinkBusy] = useState(false);
  const [telegramProfile, setTelegramProfile] = useState(null);
  const [telegramProfileLoading, setTelegramProfileLoading] = useState(false);
  const shouldFetchTelegramProfile = useMemo(() => {
    if (!isAuthenticated || !user?.id) return false;
    return !!(user?.telegram_id || telegramFromWallet?.telegram_id || telegramLink?.code);
  }, [isAuthenticated, user?.id, user?.telegram_id, telegramFromWallet?.telegram_id, telegramLink?.code]);

  // OAuth redirect: sync session from main site when ?auth=success (e.g. after Google login)
  useEffect(() => {
    if (searchParams.get('auth') !== 'success') return;
    let cleared = false;
    const cleanup = () => {
      if (!cleared) {
        cleared = true;
        setSearchParams({}, { replace: true });
      }
    };
    const t1 = setTimeout(() => {
      checkAuthStatus()
        .then(() => toast.success('Authentication successful.'))
        .catch(() => {});
      setTimeout(cleanup, 800);
    }, 400);
    return () => clearTimeout(t1);
  }, [searchParams, setSearchParams, checkAuthStatus]);

  // Redirect if not authenticated (skip while auth=success so session can sync)
  useEffect(() => {
    if (searchParams.get('auth') === 'success') return;
    if (!authLoading && !isAuthenticated) {
      navigate('/dex-edu/ota/login');
    }
  }, [isAuthenticated, authLoading, navigate, searchParams]);

  useEffect(() => {
    if (user?.username) setUsernameDraft(user.username);
  }, [user?.username]);

  useEffect(() => {
    const checkBio = async () => {
      try {
        if (!isBiometricAvailable) return;
        const availability = await isBiometricAvailable();
        const ok = !!availability?.available;
        setBiometricAvailable(ok);
        setBiometricRegistered(ok ? !!hasBiometricCredential?.() : false);
      } catch {
        setBiometricAvailable(false);
        setBiometricRegistered(false);
      }
    };
    checkBio();
  }, [isBiometricAvailable, hasBiometricCredential]);

  useEffect(() => {
    let cancelled = false;
    if (user?.telegram_id) return;
    if (!effectiveWalletAddress) return;
    const run = async () => {
      try {
        const tg = await authApiService.getTelegramByWallet?.(effectiveWalletAddress);
        if (!cancelled) setTelegramFromWallet(tg || null);
      } catch {
        // ignore
      }
    };
    run();
    return () => { cancelled = true; };
  }, [user?.telegram_id, effectiveWalletAddress]);

  useEffect(() => {
    let cancelled = false;
    if (!shouldFetchTelegramProfile) return;
    setTelegramProfileLoading(true);
    const run = async () => {
      try {
        const res = await authApiService.getTelegramProfile?.();
        if (!cancelled) setTelegramProfile(res || null);
      } catch {
        if (!cancelled && !telegramProfile) setTelegramProfile(null);
      } finally {
        if (!cancelled) setTelegramProfileLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [shouldFetchTelegramProfile]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    if (!telegramLink?.code) return;
    if (user?.telegram_id || telegramProfile?.ok) return;
    let cancelled = false;
    const startedAt = Date.now();
    const maxMs = 60000;
    const tickMs = 2000;
    const tick = async () => {
      if (cancelled) return;
      if (Date.now() - startedAt > maxMs) return;
      try {
        const res = await authApiService.getTelegramProfile?.();
        if (!cancelled && res?.ok) {
          setTelegramProfile(res);
          return;
        }
      } catch {
        // continue polling
      }
      if (!cancelled) setTimeout(tick, tickMs);
    };
    setTimeout(tick, 500);
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.id, telegramLink?.code, user?.telegram_id]);

  const handleStartTelegramLink = useCallback(async () => {
    try {
      setTelegramLinkBusy(true);
      const res = await authApiService.startTelegramLink?.();
      if (res?.code) {
        setTelegramLink({ code: res.code, expiresAt: res.expiresAt || null });
        toast.info('Code generated. Send it to the Telegram bot.');
      } else {
        toast.error('Could not generate Telegram linking code.');
      }
    } catch (e) {
      toast.error(e?.message || 'Could not generate Telegram linking code.');
    } finally {
      setTelegramLinkBusy(false);
    }
  }, []);

  // Load saved wallets from backend
  const loadWallets = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setWalletsLoading(true);
      const wallets = await authApiService.getUserWallets();
      setSavedWallets(wallets || []);
      
      // Set main wallet (first one marked as main, or first in list)
      const mainWallet = wallets?.find(w => w.is_main) || wallets?.[0];
      setMainWalletAddress(mainWallet?.wallet_address || null);
    } catch (error) {
      console.warn('[Profile] Error loading wallets:', error);
      // Don't show error toast - wallets might not be configured yet
    } finally {
      setWalletsLoading(false);
    }
  }, [isAuthenticated]);

  // One-time Telegram wallet sync (if backend supports it)
  const telegramSyncAttemptedRef = React.useRef(false);
  useEffect(() => {
    if (!isAuthenticated || !user?.telegram_id) return;
    if (telegramSyncAttemptedRef.current) return;
    if (savedWallets.length > 0) return;
    telegramSyncAttemptedRef.current = true;
    (async () => {
      try {
        const res = await authApiService.syncTelegramWallet?.();
        if (res) {
          await loadWallets();
          toast.info('Telegram wallet synced');
        }
      } catch (_) {
        // ignore (endpoint may not exist)
      }
    })();
  }, [isAuthenticated, user?.telegram_id, savedWallets.length, loadWallets]);

  // Load wallets on mount and when tab changes to wallets
  useEffect(() => {
    if (activeTab === 'wallets') {
      loadWallets();
    }
  }, [activeTab, loadWallets]);

  const refreshProfileStripe = useCallback(async () => {
    if (!isAuthenticated) return;
    setStripeLoading(true);
    setStripeError(null);
    try {
      const [balance, history, paymentsRes, docRes] = await Promise.all([
        getStripeBalance(),
        getStripeHistory(),
        getPaymentsHistory().catch(() => ({ ok: true, payments: [] })),
        getDocuments().catch(() => ({ documents: [] })),
      ]);
      setStripeBalanceEur(balance.balanceEur ?? 0);
      setStripeBalanceUsd(balance.balanceUsd ?? 0);
      setStripeDeposits(history.deposits ?? []);
      setStripeWithdrawals(history.withdrawals ?? []);
      setStripePaymentsHistory(paymentsRes.payments ?? []);
      setDocuments(docRes.documents ?? []);
    } catch (e) {
      setStripeError(e?.message || 'Failed to load Stripe data');
    } finally {
      setStripeLoading(false);
    }
  }, [isAuthenticated]);

  // Load Stripe balance + history + payment history (same API as Join) when on profile tab
  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'profile') return;
    refreshProfileStripe();
  }, [isAuthenticated, activeTab, refreshProfileStripe]);

  useEffect(() => {
    const onFiat = () => {
      refreshProfileStripe();
    };
    window.addEventListener(BITS_FIAT_BALANCE_REFRESH, onFiat);
    return () => window.removeEventListener(BITS_FIAT_BALANCE_REFRESH, onFiat);
  }, [refreshProfileStripe]);

  // Auto-add currently connected wallet if not in list
  useEffect(() => {
    const currentWallet = unifiedWallet?.walletAddress || dexAuthWallet;
    if (!currentWallet || !isAuthenticated || activeTab !== 'wallets') return;
    
    const isAlreadySaved = savedWallets.some(
      w => w.wallet_address?.toLowerCase() === currentWallet.toLowerCase()
    );
    
    if (!isAlreadySaved && savedWallets.length > 0) {
      handleAddWallet(currentWallet, 'evm', false);
    }
  }, [unifiedWallet?.walletAddress, dexAuthWallet, savedWallets, activeTab, isAuthenticated]);

  // Add wallet to backend
  const handleAddWallet = async (address, type = 'evm', showToast = true) => {
    if (!address) {
      if (showToast) toast.error('Please connect a wallet first');
      return;
    }
    
    try {
      await authApiService.associateWallet(address, type);
      if (showToast) toast.success('Wallet added successfully');
      await loadWallets();
    } catch (error) {
      const errorMsg = error.message || 'Failed to add wallet';
      if (!errorMsg.includes('already')) {
        if (showToast) toast.error(errorMsg);
      }
      console.warn('[Profile] Add wallet error:', errorMsg);
    }
  };

  // Set main wallet (future: implement backend endpoint)
  const handleSetMainWallet = async (address) => {
    setMainWalletAddress(address);
    toast.success('Main wallet updated');
    // TODO: Call backend to persist main wallet preference
  };

  // Upload profile photo
  const handleAvatarChange = useCallback(async (e) => {
    const file = e?.target?.files?.[0];
    if (!file || !uploadProfilePhoto) return;
    setSelectedFileName(file.name);
    setAvatarUploading(true);
    try {
      await uploadProfilePhoto(file);
      toast.success('Profile photo updated');
      setSelectedFileName('');
    } catch (err) {
      toast.error(err?.message || 'Upload failed');
      setSelectedFileName('');
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  }, [uploadProfilePhoto]);

  // Get current wallet address and chain (prefer unified, fallback to dexAuth)
  const currentWallet = unifiedWallet?.walletAddress || dexAuthWallet;
  const connectedChainId = unifiedWallet?.chainId;

  const copyWallet = useCallback((address) => {
    if (!address) return;
    navigator.clipboard.writeText(address).then(
      () => toast.success('Address copied to clipboard'),
      () => toast.error('Failed to copy')
    );
  }, []);

  const RESEND_COOLDOWN_SEC = 60;

  const handleSendPhoneCode = useCallback(async () => {
    const raw = (phoneDraft || '').trim().replace(/\s/g, '');
    if (!raw) {
      toast.error('Enter a phone number');
      return;
    }
    if (!PHONE_E164_REGEX.test(raw)) {
      toast.error('Invalid phone format. Use international format (e.g. +40761133771)');
      return;
    }
    setPhoneSendCodeBusy(true);
    try {
      const res = await authApiService.sendPhoneVerificationCode(raw);
      setPhoneCodeSent(true);
      setPhoneResendCooldown(RESEND_COOLDOWN_SEC);
      if (res?.code) {
        setPhoneCode(res.code); // Pre-completare: codul din răspuns (când SMS nu ajunge – SNS Sandbox)
        toast.success(`Code: ${res.code}. SMS not delivered in Sandbox – code is already entered. Press Verify.`);
      } else {
        setPhoneCode('');
        toast.success('Verification code sent');
      }
      if (process.env.NODE_ENV === 'development' && res?.debug?.messageId) {
        console.log('[OTAProfile] send-code debug messageId=', res.debug.messageId);
      }
    } catch (err) {
      console.error('[OTAProfile] send-code error:', err);
      toast.error(err?.message || 'Failed to send code');
    } finally {
      setPhoneSendCodeBusy(false);
    }
  }, [phoneDraft]);

  useEffect(() => {
    if (phoneResendCooldown <= 0) return;
    const t = setInterval(() => setPhoneResendCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(t);
  }, [phoneResendCooldown]);

  const handleSavePhone = useCallback(async () => {
    const raw = (phoneDraft || '').trim().replace(/\s/g, '');
    if (!raw) {
      toast.error('Enter a phone number');
      return;
    }
    if (!PHONE_E164_REGEX.test(raw)) {
      toast.error('Invalid phone format. Use international format (e.g. +40761133771)');
      return;
    }
    setPhoneBusy(true);
    try {
      await saveProfilePhone(raw);
      toast.success('Phone number saved. You can verify it to confirm ownership.');
      setPhoneFormOpen(false);
      setPhoneDraft('');
      setPhoneCodeSent(false);
      setPhoneCode('');
      setPhoneResendCooldown(0);
    } catch (err) {
      toast.error(err?.message || 'Failed to save');
    } finally {
      setPhoneBusy(false);
    }
  }, [phoneDraft, saveProfilePhone]);

  const handleVerifyPhone = useCallback(async () => {
    const raw = (phoneDraft || '').trim().replace(/\s/g, '');
    const code = (phoneCode || '').trim();
    if (!raw || !code) {
      toast.error('Enter phone number and code');
      return;
    }
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      toast.error('Code must be 6 digits');
      return;
    }
    if (!updatePhoneNumber) return;
    setPhoneBusy(true);
    try {
      await updatePhoneNumber(raw, code);
      toast.success('Phone number verified');
      setPhoneFormOpen(false);
      setPhoneCodeSent(false);
      setPhoneDraft('');
      setPhoneCode('');
      setPhoneResendCooldown(0);
    } catch (err) {
      toast.error(err?.message || 'Verification failed');
    } finally {
      setPhoneBusy(false);
    }
  }, [phoneDraft, phoneCode, updatePhoneNumber]);

  const handleSaveBank = useCallback(async () => {
    const ibanRaw = normalizeIban(ibanDraft);
    const { valid, error: ibanError } = validateIban(ibanDraft);
    if (!valid) {
      toast.error(ibanError || 'Invalid IBAN');
      return;
    }
    setBankBusy(true);
    try {
      await saveProfileBank({
        iban: ibanRaw,
        bic_swift: bicDraft.trim() || undefined,
        bank_account_holder: holderDraft.trim() || undefined,
      });
      toast.success('Bank account saved. You can use this IBAN for withdrawal requests.');
      try {
        const docRes = await getDocuments();
        const list = docRes.documents ?? [];
        setDocuments(list);
        const hasId = list.some((d) => d.document_type === 'id');
        const hasBankProof = list.some((d) => d.document_type === 'bank_statement');
        if (!hasId || !hasBankProof) {
          toast.warning(
            'Fiat withdrawals require both a government-issued ID and a bank statement on file. Upload both under Legal trading documents (or use “Upload statement as proof” in Bank account).',
            { autoClose: 10000 }
          );
        }
      } catch {
        /* ignore doc refresh */
      }
      setBankFormOpen(false);
      setIbanDraft('');
      setBicDraft('');
      setHolderDraft('');
      setLastParsedFileForProof(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to save bank account');
    } finally {
      setBankBusy(false);
    }
  }, [ibanDraft, bicDraft, holderDraft, saveProfileBank]);

  const handleParseBankStatement = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setLastParsedFileForProof(file);
    setBankParseBusy(true);
    try {
      const data = await parseProfileBankStatement(file);
      const ex = data?.extracted;
      if (!ex) throw new Error('Could not read data from the file.');
      if (ex.iban) setIbanDraft(ex.iban);
      const bicVal = ex.bic_swift || ex.bic_swift_suggested || '';
      if (bicVal) setBicDraft(bicVal);
      if (ex.bank_account_holder) setHolderDraft(ex.bank_account_holder);
      const parts = [];
      if (data?.hint) parts.push(data.hint);
      if (ex.iban_error) parts.push(ex.iban_error);
      if (ex.bic_warning) parts.push(ex.bic_warning);
      toast.success(parts.filter(Boolean).join(' ') || 'Fields filled from statement — review before Save.');
      if (ex.bank_name) {
        toast.info(`Bank detected: ${ex.bank_name}`, { autoClose: 5000 });
      }
    } catch (err) {
      toast.error(err?.message || 'Could not extract data from the file.');
    } finally {
      setBankParseBusy(false);
    }
  }, []);

  const handleBankProofFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setBankProofUploading(true);
    try {
      const res = await uploadDocument(file, 'bank_statement');
      setDocuments(res.documents ?? []);
      const st = res.document?.verification_status;
      toast.success(
        st === 'verified'
          ? 'Statement uploaded as proof (document type verified).'
          : st === 'rejected'
            ? 'Statement uploaded; automatic type check failed — support may review manually.'
            : 'Statement uploaded as proof (pending verification).'
      );
    } catch (err) {
      toast.error(err?.message || 'Upload failed.');
    } finally {
      setBankProofUploading(false);
    }
  }, []);

  const handleUploadLastParsedAsProof = useCallback(async () => {
    const file = lastParsedFileForProof;
    if (!file) return;
    setBankProofUploading(true);
    try {
      const res = await uploadDocument(file, 'bank_statement');
      setDocuments(res.documents ?? []);
      setLastParsedFileForProof(null);
      toast.success('Same file saved as bank-statement proof.');
    } catch (err) {
      toast.error(err?.message || 'Upload failed.');
    } finally {
      setBankProofUploading(false);
    }
  }, [lastParsedFileForProof]);

  /** Extras(e) de cont depuse ca dovadă (aceeași listă ca la „Legal trading documents”). */
  const bankStatementProofDocs = useMemo(
    () => (documents || []).filter((d) => d.document_type === 'bank_statement'),
    [documents]
  );

  const idProofDocs = useMemo(
    () => (documents || []).filter((d) => d.document_type === 'id'),
    [documents]
  );

  const fiatLegalDocumentsComplete = useMemo(
    () => idProofDocs.length > 0 && bankStatementProofDocs.length > 0,
    [idProofDocs.length, bankStatementProofDocs.length]
  );

  const handleLegalDocumentFileChange = useCallback(async (documentType, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setDocumentsUploading(true);
    try {
      const res = await uploadDocument(file, documentType);
      setDocuments(res.documents ?? []);
      const st = res.document?.verification_status;
      const label = documentType === 'id' ? 'Government ID' : 'Bank statement';
      toast.success(
        st === 'verified'
          ? `${label} uploaded — document type auto-verified.`
          : st === 'rejected'
            ? `${label} uploaded; automatic type check did not match (rejected). Try a clearer image or the correct document.`
            : `${label} uploaded — verification pending.`
      );
    } catch (err) {
      toast.error(err?.message || 'Upload failed.');
    } finally {
      setDocumentsUploading(false);
    }
  }, []);

  const bankProofStatusLine = useMemo(() => {
    if (bankStatementProofDocs.length === 0) {
      return { text: 'Bank statement proof: not uploaded yet.', tone: 'muted' };
    }
    const latest = [...bankStatementProofDocs].sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    )[0];
    const st = latest.verification_status;
    if (st === 'verified') return { text: 'Bank statement proof: uploaded and type verified.', tone: 'ok' };
    if (st === 'rejected') return { text: 'Bank statement proof: uploaded — automatic check rejected; you can re-upload.', tone: 'warn' };
    return { text: 'Bank statement proof: uploaded — verification pending.', tone: 'pending' };
  }, [bankStatementProofDocs]);

  // Display IBAN: backend may return iban_masked or full iban; we mask client-side if full
  const displayIban = useMemo(() => {
    const raw = user?.iban || user?.iban_masked;
    if (!raw) return null;
    if (raw.includes('*')) return raw;
    return maskIban(raw);
  }, [user?.iban, user?.iban_masked]);

  // Format member since date
  const memberSince = useMemo(() => {
    if (!user?.created_at) return null;
    try {
      const date = new Date(user.created_at);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return null;
    }
  }, [user?.created_at]);

  // Total spent from Stripe payment history (same as /join)
  const totalSpent = useMemo(() => {
    if (!stripePaymentsHistory?.length) return { eur: 0, usd: 0 };
    let eur = 0, usd = 0;
    stripePaymentsHistory.forEach((p) => {
      const amount = (p.amount_total || 0) / 100;
      if (p.currency === 'usd') usd += amount; else eur += amount;
    });
    return { eur, usd };
  }, [stripePaymentsHistory]);

  // Email: show verified if backend says so OR if user has paid with this account (payment history / total spent is per-user; e.g. Google sign-in + card)
  const emailDisplayVerified = useMemo(() => {
    if (user?.emailVerified === true) return true;
    if (!user?.email) return false;
    if (stripePaymentsHistory?.length) return true;
    return (totalSpent.eur + totalSpent.usd) > 0;
  }, [user?.email, user?.emailVerified, stripePaymentsHistory, totalSpent.eur, totalSpent.usd]);

  const deviceDisplayInfo = useMemo(() => parseDeviceDisplayInfo(), []);

  if (authLoading || !user) {
    return (
      <div className="ota-profile-page">
        <div className="ota-profile-loading">
          <LoadingSpinner message="Loading profile..." />
        </div>
      </div>
    );
  }

  return (
    <div className="ota-profile-page">
      <div className="ota-profile-container">
        <div style={{ width: '100%', marginBottom: 12, boxSizing: 'border-box' }}>
          <OtaBscAutoStatusBanner />
        </div>
        {/* Header: avatar + upload on left, tabs on right */}
        <div className="ota-profile-header">
          <div className="ota-profile-header-avatar">
            <div className="ota-profile-avatar" aria-hidden="true">
              <ProfileAvatarDisplay
                avatar={user?.avatar}
                username={user?.username}
                email={user?.email}
                imgClassName="ota-profile-avatar-img"
                svgClassName="ota-profile-avatar-img"
                fallbackClassName="ota-profile-avatar-initial"
              />
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="ota-profile-avatar-input"
              aria-label="Upload profile photo"
              onChange={handleAvatarChange}
              disabled={avatarUploading}
            />
            <div className="ota-profile-header-upload">
              <p className="ota-profile-photo-hint">
                Upload a profile photo (JPEG, PNG, GIF, or WebP). It is saved to your account and shown here and in the site header.
              </p>
              <span className="ota-profile-file-label">{selectedFileName || 'No file chosen'}</span>
              <button
                type="button"
                className="ota-profile-avatar-btn"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                aria-label="Upload profile photo"
              >
                {avatarUploading ? (
                  <LoadingSpinner size="small" message="" />
                ) : (
                  <IconCamera size={18} />
                )}
                <span>{avatarUploading ? 'Uploading...' : 'Upload photo'}</span>
              </button>
            </div>
          </div>
          <div className="ota-profile-tabs" role="tablist" aria-label="Profile and settings">
            <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'profile'}
            aria-controls="ota-profile-panel"
            id="ota-tab-profile"
            className={`ota-profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <IconUser size={18} />
            Profile
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'wallets'}
            aria-controls="ota-wallets-panel"
            id="ota-tab-wallets"
            className={`ota-profile-tab ${activeTab === 'wallets' ? 'active' : ''}`}
            onClick={() => setActiveTab('wallets')}
          >
            <IconWallet size={18} />
            Wallets
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'security'}
            aria-controls="ota-security-panel"
            id="ota-tab-security"
            className={`ota-profile-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <IconLock size={18} />
            Security
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'ota'}
            aria-controls="ota-ota-panel"
            id="ota-tab-ota"
            className={`ota-profile-tab ${activeTab === 'ota' ? 'active' : ''}`}
            onClick={() => setActiveTab('ota')}
          >
            <OTABrand size="sm" text="OTA Settings" />
          </button>
          </div>
          <Link
            to="/dex-edu/account"
            className="ota-profile-personal-account-btn"
            aria-label="Personal account — crypto and fiat; only you can withdraw"
          >
            <Landmark size={18} aria-hidden />
            <span>Personal account</span>
          </Link>
        </div>

        {/* Tab Content */}
        <div className="ota-profile-content" id="ota-profile-panel" role="tabpanel" aria-labelledby={activeTab === 'profile' ? 'ota-tab-profile' : activeTab === 'wallets' ? 'ota-tab-wallets' : activeTab === 'security' ? 'ota-tab-security' : 'ota-tab-ota'}>
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <>
            {/* Account details — modern 2026 layout: Email first, 4 columns. term + value on same line. */}
            <div className="ota-profile-section ota-profile-account-data">
              <div className="ota-profile-details" role="list">
                <div className="ota-profile-detail-row" role="listitem">
                  <span className="ota-profile-detail-term"><IconMail size={20} aria-hidden className="ota-profile-row-icon" /> Email</span>
                  <div className="ota-profile-detail-desc ota-profile-detail-desc--block">
                    <span>
                      {user?.email || '—'}
                      {emailDisplayVerified ? <IconCheckCircle size={16} className="ota-profile-verified-icon" title={user?.emailVerified ? 'Verified' : 'Verified (used for payment)'} /> : user?.email ? <IconXCircle size={16} className="ota-profile-unverified-icon" title="Not verified" /> : null}
                    </span>
                    {user?.email && !user?.emailVerified && emailDisplayVerified && (
                      <span className="ota-profile-email-verified-hint">
                        This email was used for a successful payment (e.g. Google sign-in + card). Shown as verified.
                      </span>
                    )}
                  </div>
                </div>
                <div className="ota-profile-detail-row ota-profile-detail-row--editable" role="listitem">
                  <span className="ota-profile-detail-term">
                    <IconTelegram size={20} aria-hidden className="ota-profile-row-icon" />
                    Telegram
                    <span className="ota-profile-edit-pencil" title="Editable" aria-hidden><IconEdit size={18} /></span>
                  </span>
                  <span className="ota-profile-detail-desc">
                    {user?.telegram_id ? (
                      user.telegram_id
                    ) : telegramFromWallet?.telegram_id ? (
                      <span title={telegramFromWallet?.username ? `@${telegramFromWallet.username}` : undefined}>
                        {telegramFromWallet.telegram_id}
                      </span>
                    ) : telegramProfile?.telegram_id ? (
                      <span title={telegramProfile?.telegram_username ? `@${telegramProfile.telegram_username}` : undefined}>
                        {telegramProfile.telegram_id}
                      </span>
                    ) : (
                      <span className="ota-profile-detail-inline-actions">
                        <span className="ota-profile-telegram-not-connected">Not connected</span>
                        <button
                          type="button"
                          className="ota-profile-avatar-btn"
                          onClick={handleStartTelegramLink}
                          disabled={telegramLinkBusy}
                          title="Generate code to link Telegram"
                        >
                          {telegramLinkBusy ? 'Generating…' : 'Connect Telegram'}
                        </button>
                        {telegramLink?.code && (
                          <span className="ota-profile-telegram-link-code">
                            Send to bot: <code>/link {telegramLink.code}</code>
                            {telegramLink.expiresAt && (
                              <span className="ota-profile-telegram-expires"> Expires: {new Date(telegramLink.expiresAt).toLocaleString()}</span>
                            )}
                          </span>
                        )}
                      </span>
                    )}
                  </span>
                </div>
                <div className="ota-profile-detail-row ota-profile-detail-row--editable" role="listitem">
                  <span className="ota-profile-detail-term">
                    <IconUser size={20} aria-hidden className="ota-profile-row-icon" />
                    Username
                    <button type="button" className="ota-profile-edit-pencil" onClick={() => { if (user?.username) setUsernameDraft(user.username); setIsEditingProfile(true); }} aria-label="Edit username" title="Edit"><IconEdit size={18} /></button>
                  </span>
                  {isEditingProfile ? (
                    <div className="ota-profile-detail-desc ota-profile-detail-desc--block ota-profile-inline-edit">
                      <input type="text" className="ota-profile-input" value={usernameDraft} onChange={(e) => setUsernameDraft(e.target.value)} placeholder="Username" style={{ maxWidth: 220, marginRight: 8 }} />
                      <button type="button" className="ota-profile-avatar-btn" onClick={async () => { try { setSecurityBusy(true); await updateProfile((usernameDraft || '').trim()); toast.success('Profile updated'); setIsEditingProfile(false); } catch (e) { toast.error(e?.message || 'Failed'); } finally { setSecurityBusy(false); }} } disabled={securityBusy}>Save</button>
                      <button type="button" className="ota-profile-cancel-btn" onClick={() => { setIsEditingProfile(false); }}>Cancel</button>
                    </div>
                  ) : (
                    <span className="ota-profile-detail-desc">{user?.username || '—'}</span>
                  )}
                </div>
                <div className="ota-profile-detail-row ota-profile-detail-row--block ota-profile-detail-row--editable" role="listitem">
                  <span className="ota-profile-detail-term">
                    <IconPhone size={20} aria-hidden className="ota-profile-row-icon" />
                    Phone
                    <span className="ota-profile-edit-pencil" title="Editable" aria-hidden><IconEdit size={18} /></span>
                  </span>
                  <div className="ota-profile-detail-desc ota-profile-detail-desc--block" style={{ width: '100%' }}>
                    {user?.phone && !phoneFormOpen ? (
                      <span className="ota-profile-detail-inline-actions">
                        <span>{user.phone}</span>
                        {user.phoneVerified ? <IconCheckCircle size={16} className="ota-profile-verified-icon" title="Verified" /> : <IconXCircle size={16} className="ota-profile-unverified-icon" title="Not verified" />}
                        {!user.phoneVerified && (
                          <button type="button" className="ota-profile-avatar-btn" onClick={() => { setPhoneFormOpen(true); setPhoneFormMode('verify'); setPhoneDraft(user.phone || ''); setPhoneCodeSent(false); setPhoneCode(''); }}>Verify</button>
                        )}
                        <button type="button" className="ota-profile-avatar-btn" onClick={() => { setPhoneFormOpen(true); setPhoneFormMode('save'); setPhoneDraft(user.phone || ''); setPhoneCodeSent(false); setPhoneCode(''); setPhoneResendCooldown(0); }}>Change</button>
                      </span>
                    ) : !phoneFormOpen ? (
                      <span className="ota-profile-detail-inline-actions">
                        <span>—</span>
                        <button type="button" className="ota-profile-avatar-btn" onClick={() => { setPhoneFormOpen(true); setPhoneFormMode('save'); setPhoneDraft(process.env.NODE_ENV === 'development' ? '+40761133771' : ''); setPhoneCodeSent(false); setPhoneCode(''); setPhoneResendCooldown(0); }}>Add phone</button>
                      </span>
                    ) : phoneFormMode === 'save' ? (
                      <div className="ota-profile-phone-form">
                        <input
                          type="tel"
                          className="ota-profile-input"
                          placeholder="+40761133771 (E.164)"
                          value={phoneDraft}
                          onChange={(e) => setPhoneDraft(e.target.value)}
                          style={{ maxWidth: '220px', marginRight: '8px' }}
                        />
                        <button type="button" className="ota-profile-avatar-btn" onClick={handleSavePhone} disabled={phoneBusy}>
                          {phoneBusy ? 'Saving…' : 'Save'}
                        </button>
                        <button type="button" className="ota-profile-cancel-btn" style={{ marginLeft: '8px' }} onClick={() => { setPhoneFormOpen(false); setPhoneDraft(''); setPhoneCode(''); }}>Cancel</button>
                      </div>
                    ) : (
                      <div className="ota-profile-phone-form">
                        <span style={{ marginRight: '8px' }}>{phoneDraft || user?.phone}</span>
                        {!phoneCodeSent ? (
                          <button type="button" className="ota-profile-avatar-btn" onClick={handleSendPhoneCode} disabled={phoneSendCodeBusy}>
                            {phoneSendCodeBusy ? 'Sending…' : 'Send verification code'}
                          </button>
                        ) : (
                          <>
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              className="ota-profile-input"
                              placeholder="Code"
                              value={phoneCode}
                              onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, ''))}
                              style={{ width: '80px', marginRight: '8px' }}
                            />
                            <button type="button" className="ota-profile-avatar-btn" onClick={handleVerifyPhone} disabled={phoneBusy}>
                              {phoneBusy ? 'Verifying…' : 'Verify'}
                            </button>
                            <button
                              type="button"
                              className="ota-profile-avatar-btn"
                              onClick={handleSendPhoneCode}
                              disabled={phoneSendCodeBusy || phoneResendCooldown > 0}
                              title={phoneResendCooldown > 0 ? `Resend in ${phoneResendCooldown}s` : 'Resend code'}
                              style={{ marginLeft: '8px' }}
                            >
                              {phoneSendCodeBusy ? 'Sending…' : phoneResendCooldown > 0 ? `Resend (${phoneResendCooldown}s)` : 'Resend'}
                            </button>
                          </>
                        )}
                        <button type="button" className="ota-profile-cancel-btn" style={{ marginLeft: '8px' }} onClick={() => { setPhoneFormOpen(false); setPhoneCodeSent(false); setPhoneDraft(''); setPhoneCode(''); setPhoneResendCooldown(0); }}>Cancel</button>
                      </div>
                    )}
                  </div>
                </div>
                {(user?.telegram_id || telegramProfile?.ok) && (
                  <div className="ota-profile-detail-row ota-profile-detail-row--block ota-profile-detail-row--full" role="listitem">
                    <span className="ota-profile-detail-term"><IconTelegram size={20} aria-hidden className="ota-profile-row-icon" /> Telegram data (all)</span>
                    <div className="ota-profile-detail-desc ota-profile-detail-desc--block">
                      {telegramProfileLoading ? (
                        <div style={{ padding: '10px 0' }}>
                          <LoadingSpinner size="small" message="Loading Telegram data…" />
                        </div>
                      ) : telegramProfile?.ok ? (
                        <div className="ota-profile-telegram-bundle">
                          <div className="ota-profile-telegram-bundle-row">
                            <span><strong>Username:</strong> {telegramProfile.telegram_username || telegramProfile.activity?.username || '—'}</span>
                            <span className="ota-profile-copyable-wallet">
                              <strong>Wallet:</strong> {telegramProfile.activity?.wallet_address || '—'}
                              {telegramProfile.activity?.wallet_address && (
                                <button type="button" className="ota-profile-wallet-copy-btn" onClick={() => copyWallet(telegramProfile.activity.wallet_address)} title="Copy address"><IconCopy size={12} /></button>
                              )}
                            </span>
                            <span><strong>Seconds spent:</strong> {telegramProfile.activity?.seconds_spent ?? 0}</span>
                            <span><strong>Messages:</strong> {telegramProfile.activity?.messages_total ?? 0}</span>
                            <span><strong>Streak:</strong> {telegramProfile.activity?.streak_days ?? 0}</span>
                            <span><strong>Rewards pending:</strong> {telegramProfile.rewards?.summary?.pending ?? 0}</span>
                            <span><strong>Rewards claimed:</strong> {telegramProfile.rewards?.summary?.claimed ?? 0}</span>
                            <span><strong>Words:</strong> {telegramProfile.words?.total ?? 0}</span>
                          </div>
                          <details className="ota-profile-telegram-raw">
                            <summary>Raw JSON (all fields)</summary>
                            <pre>{JSON.stringify(telegramProfile, null, 2)}</pre>
                          </details>
                        </div>
                      ) : (
                        <span className="ota-profile-telegram-not-available">Telegram data not available yet.</span>
                      )}
                    </div>
                  </div>
                )}
                {memberSince && (
                  <div className="ota-profile-detail-row" role="listitem">
                    <span className="ota-profile-detail-term">Member since</span>
                    <span className="ota-profile-detail-desc">{memberSince}</span>
                  </div>
                )}
                {(totalSpent.eur > 0 || totalSpent.usd > 0) && (
                  <div className="ota-profile-detail-row" role="listitem">
                    <span className="ota-profile-detail-term">Total spent (Stripe)</span>
                    <span className="ota-profile-detail-desc ota-profile-amount-value">
                      {totalSpent.eur > 0 && `€${totalSpent.eur.toFixed(2)}`}
                      {totalSpent.eur > 0 && totalSpent.usd > 0 && ' · '}
                      {totalSpent.usd > 0 && `$${totalSpent.usd.toFixed(2)}`}
                    </span>
                  </div>
                )}
                <div className="ota-profile-detail-row ota-profile-detail-row--block ota-profile-detail-row--editable" role="listitem">
                  <span className="ota-profile-detail-term">
                    <IconCreditCard size={20} aria-hidden className="ota-profile-row-icon" />
                    Bank account (withdrawals)
                    <span className="ota-profile-edit-pencil" title="Editable" aria-hidden><IconEdit size={18} /></span>
                  </span>
                  <div className="ota-profile-detail-desc ota-profile-detail-desc--block" style={{ width: '100%' }}>
                    {displayIban && !bankFormOpen ? (
                      <>
                        <span className="ota-profile-detail-desc">{displayIban}</span>
                        {user?.bank_account_holder && <span className="ota-profile-detail-desc ota-profile-detail-desc--muted" style={{ display: 'block', marginTop: 4 }}>{user.bank_account_holder}</span>}
                        <p
                          className="ota-profile-detail-desc"
                          style={{
                            marginTop: 10,
                            marginBottom: 8,
                            color:
                              bankProofStatusLine.tone === 'ok'
                                ? 'rgba(0, 255, 163, 0.85)'
                                : bankProofStatusLine.tone === 'warn'
                                  ? 'rgba(255, 180, 100, 0.95)'
                                  : 'rgba(200, 210, 220, 0.85)',
                          }}
                        >
                          {bankProofStatusLine.text}
                        </p>
                        <input
                          ref={bankProofInputRef}
                          type="file"
                          accept="image/*,.pdf"
                          className="ota-profile-avatar-input"
                          style={{ display: 'none' }}
                          aria-hidden
                          onChange={handleBankProofFileChange}
                          disabled={bankProofUploading}
                        />
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                          <button
                            type="button"
                            className="ota-profile-avatar-btn"
                            style={{ minHeight: 44 }}
                            onClick={() => bankProofInputRef.current?.click()}
                            disabled={bankProofUploading}
                          >
                            {bankProofUploading ? 'Uploading…' : 'Upload statement as proof'}
                          </button>
                        </div>
                        <p className="ota-profile-detail-desc ota-profile-detail-desc--muted" style={{ marginTop: 0, marginBottom: 12, fontSize: 13 }}>
                          You can set IBAN manually or via auto-extract; the statement uploaded here is stored as <strong>proof</strong> in the system (same flow as Legal trading documents).
                        </p>
                        <span className="ota-profile-detail-inline-actions">
                          <button type="button" className="ota-profile-avatar-btn" style={{ minHeight: 48, paddingTop: 14, paddingBottom: 14, paddingLeft: 20, paddingRight: 20, boxSizing: 'border-box', lineHeight: 1.5 }} onClick={() => { setBankFormOpen(true); setIbanDraft(''); setBicDraft(user?.bic_swift || ''); setHolderDraft(user?.bank_account_holder || ''); }}>Change</button>
                        </span>
                      </>
                    ) : !bankFormOpen ? (
                      <span className="ota-profile-detail-inline-actions">
                        <button
                          type="button"
                          className="ota-profile-avatar-btn"
                          onClick={() => { setBankFormOpen(true); setIbanDraft(''); setBicDraft(''); setHolderDraft(''); }}
                          style={{ minHeight: 48, paddingTop: 14, paddingBottom: 14, paddingLeft: 20, paddingRight: 20, boxSizing: 'border-box', lineHeight: 1.5 }}
                        >
                          Add bank account
                        </button>
                      </span>
                    ) : (
                      <div className="ota-profile-phone-form">
                        <input
                          ref={bankStatementInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                          className="ota-profile-avatar-input"
                          style={{ display: 'none' }}
                          aria-hidden
                          onChange={handleParseBankStatement}
                          disabled={bankParseBusy || bankBusy}
                        />
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                          <button
                            type="button"
                            className="ota-profile-avatar-btn"
                            style={{ minHeight: 44 }}
                            onClick={() => bankStatementInputRef.current?.click()}
                            disabled={bankParseBusy || bankBusy}
                          >
                            {bankParseBusy ? 'Analyzing statement…' : 'Auto-fill from statement (PDF / image)'}
                          </button>
                        </div>
                        <p className="ota-profile-detail-desc ota-profile-detail-desc--muted" style={{ marginTop: 0, marginBottom: 10 }}>
                          Upload a bank statement or a clear screenshot. Fields are filled automatically (AI) — verify IBAN and BIC before Save.
                        </p>
                        {lastParsedFileForProof && (
                          <div style={{ marginBottom: 12 }}>
                            <button
                              type="button"
                              className="ota-profile-avatar-btn"
                              style={{ minHeight: 44 }}
                              onClick={handleUploadLastParsedAsProof}
                              disabled={bankProofUploading || bankBusy}
                            >
                              {bankProofUploading ? 'Uploading proof…' : 'Save same file as statement proof'}
                            </button>
                            <p className="ota-profile-detail-desc ota-profile-detail-desc--muted" style={{ marginTop: 6, fontSize: 13 }}>
                              Optional: keep the file used for extraction as account <strong>proof</strong> (stored as a “bank statement” document).
                            </p>
                          </div>
                        )}
                        <div
                          style={{
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: 8,
                            padding: 12,
                            marginBottom: 12,
                          }}
                        >
                          <p
                            className="ota-profile-detail-desc"
                            style={{
                              marginTop: 0,
                              marginBottom: 8,
                              color:
                                bankProofStatusLine.tone === 'ok'
                                  ? 'rgba(0, 255, 163, 0.85)'
                                  : bankProofStatusLine.tone === 'warn'
                                    ? 'rgba(255, 180, 100, 0.95)'
                                    : 'rgba(200, 210, 220, 0.85)',
                            }}
                          >
                            {bankProofStatusLine.text}
                          </p>
                          <input
                            ref={bankProofInputRef}
                            type="file"
                            accept="image/*,.pdf"
                            className="ota-profile-avatar-input"
                            style={{ display: 'none' }}
                            aria-hidden
                            onChange={handleBankProofFileChange}
                            disabled={bankProofUploading}
                          />
                          <button
                            type="button"
                            className="ota-profile-avatar-btn"
                            style={{ minHeight: 44 }}
                            onClick={() => bankProofInputRef.current?.click()}
                            disabled={bankProofUploading || bankBusy}
                          >
                            {bankProofUploading ? 'Uploading…' : 'Upload statement as proof (PDF / image)'}
                          </button>
                          <p className="ota-profile-detail-desc ota-profile-detail-desc--muted" style={{ marginTop: 8, marginBottom: 0, fontSize: 13 }}>
                            Separate from auto-fill: the file is saved as withdrawal <strong>proof</strong> (document registry). You can enter IBAN manually below without using AI.
                          </p>
                        </div>
                        <input
                          type="text"
                          placeholder="IBAN (e.g. RO49 AAAA 1B31 0075 9384 0000)"
                          aria-label="IBAN"
                          className="ota-profile-input"
                          value={ibanDraft}
                          onChange={(e) => setIbanDraft(e.target.value.toUpperCase())}
                        />
                        <input
                          type="text"
                          placeholder="BIC/SWIFT (optional)"
                          aria-label="BIC/SWIFT"
                          className="ota-profile-input"
                          value={bicDraft}
                          onChange={(e) => setBicDraft(e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Account holder name (optional)"
                          aria-label="Account holder"
                          className="ota-profile-input"
                          value={holderDraft}
                          onChange={(e) => setHolderDraft(e.target.value)}
                        />
                        <button type="button" className="ota-profile-avatar-btn" onClick={handleSaveBank} disabled={bankBusy}>
                          {bankBusy ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          type="button"
                          className="ota-profile-cancel-btn"
                          style={{ marginLeft: '8px' }}
                          onClick={() => {
                            setBankFormOpen(false);
                            setIbanDraft('');
                            setBicDraft('');
                            setHolderDraft('');
                            setLastParsedFileForProof(null);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="ota-profile-detail-row ota-profile-detail-row--block ota-profile-detail-row--full" role="listitem">
                  <span className="ota-profile-detail-term"><IconCreditCard size={20} aria-hidden className="ota-profile-row-icon" /> Stripe / Fiat (card deposits)</span>
                  <div className="ota-profile-detail-desc ota-profile-detail-desc--block" style={{ width: '100%' }}>
                    {stripeLoading ? (
                      <LoadingSpinner size="small" message="Loading balance…" />
                    ) : stripeError ? (
                      <span className="ota-profile-detail-desc ota-profile-detail-desc--muted">{stripeError}</span>
                    ) : (
                      <>
                        <div className="ota-profile-stripe-balance">
                          <span className="ota-profile-detail-desc"><strong>Balance:</strong> <span className="ota-profile-amount-value">€{Number(stripeBalanceEur).toFixed(2)}</span> EUR</span>
                          <span className="ota-profile-detail-desc" style={{ marginLeft: 12 }}><span className="ota-profile-amount-value">${Number(stripeBalanceUsd).toFixed(2)}</span> USD</span>
                        </div>
                        <p className="ota-profile-detail-desc ota-profile-detail-desc--muted" style={{ marginTop: 6, marginBottom: 4 }}>
                          Same EUR/USD figures as Personal Account — one ledger. Bank withdrawal is a <strong>request</strong> (manual processing until automation); not an instant transfer.
                        </p>
                        <p style={{ marginTop: 10, marginBottom: 10, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                          <Link
                            to="/dex-edu/leverage?tab=stripe"
                            className="ota-profile-avatar-btn"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
                          >
                            <IconCreditCard size={18} aria-hidden />
                            Add funds with card (Vault)
                            <ChevronRight size={16} aria-hidden />
                          </Link>
                          <Link
                            to="/dex-edu/account#fiat-convert-anchor"
                            className="ota-profile-avatar-btn"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
                          >
                            <ArrowDownCircle size={18} aria-hidden />
                            Convert fiat → BNB
                            <ChevronRight size={16} aria-hidden />
                          </Link>
                          <Link
                            to="/dex-edu/leverage?tab=bank"
                            className="ota-profile-avatar-btn"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
                          >
                            <Landmark size={18} aria-hidden />
                            Bank withdrawal (request)
                            <ChevronRight size={16} aria-hidden />
                          </Link>
                        </p>
                        <p className="ota-profile-detail-desc ota-profile-detail-desc--muted" style={{ marginBottom: 8 }}>One-time payments (e.g. membership with Revolut card) appear in <strong>Payment history</strong> below but do not add to this balance — they are product purchases, not Vault deposits.</p>
                        {stripeDeposits.length === 0 && stripeWithdrawals.length === 0 && (
                          <>
                            <p className="ota-profile-detail-desc ota-profile-detail-desc--muted" style={{ marginTop: 4 }}>No Vault card deposits yet. Add funds via the Leverage / Vault deposit (card) flow to see a balance here.</p>
                            <p className="ota-profile-detail-desc ota-profile-detail-desc--muted" style={{ marginTop: 4 }}>If you already paid with a wallet, add that wallet in the <strong>Wallets</strong> tab so your balance appears here.</p>
                          </>
                        )}
                        {(stripeDeposits.length > 0 || stripeWithdrawals.length > 0) && (
                          <div className="ota-profile-stripe-history">
                            <table className="ota-profile-wallet-table" role="grid" aria-label="Stripe deposits and withdrawals" style={{ marginTop: 8 }}>
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
                                    <td className="ota-profile-amount-cell"><span className="ota-profile-amount-value">{d.currency === 'usd' ? `$${Number(d.amount_usd || 0).toFixed(2)}` : `€${Number(d.amount_eur || 0).toFixed(2)}`}</span></td>
                                    <td>{d.payment_status || 'paid'}</td>
                                    <td style={{ fontSize: 12, color: 'var(--ds-text-tertiary)' }}>
                                      {d.customer_email && <span title={d.customer_email}>{d.customer_email}</span>}
                                      {d.wallet_address && <span style={{ fontFamily: 'ui-monospace, monospace' }} title={d.wallet_address}>{d.wallet_address.slice(0, 8)}…{d.wallet_address.slice(-6)}</span>}
                                      {!d.customer_email && !d.wallet_address && '—'}
                                    </td>
                                  </tr>
                                ))}
                                {stripeWithdrawals.map((w) => (
                                  <tr key={`wit-${w.id}`}>
                                    <td>{w.created_at ? new Date(w.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                                    <td>Withdrawal</td>
                                    <td className="ota-profile-amount-cell"><span className="ota-profile-amount-value">{w.currency === 'usd' ? `$${Number(w.amount || 0).toFixed(2)}` : `€${Number(w.amount || 0).toFixed(2)}`}</span></td>
                                    <td title={fiatWithdrawalDetailLine(w) || undefined}>{formatFiatWithdrawalStatusLabel(w.status)}</td>
                                    <td style={{ fontSize: 12, color: 'var(--ds-text-tertiary)', maxWidth: 220 }}>
                                      {fiatWithdrawalDetailLine(w) || '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {stripePaymentsHistory.length > 0 && (
                          <div className="ota-profile-stripe-history" style={{ marginTop: 16 }}>
                            <p className="ota-profile-detail-desc ota-profile-detail-desc--muted" style={{ marginBottom: 8 }}>Payment history (Stripe checkout – same as /join)</p>
                            <table className="ota-profile-wallet-table" role="grid" aria-label="Stripe payment history">
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Amount</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {stripePaymentsHistory.map((p) => (
                                  <tr key={p.id || p.stripe_session_id}>
                                    <td>{p.created_at ? new Date(p.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                                    <td className="ota-profile-amount-cell"><span className="ota-profile-amount-value">{p.currency === 'usd' ? `$${((p.amount_total || 0) / 100).toFixed(2)}` : `€${((p.amount_total || 0) / 100).toFixed(2)}`}</span></td>
                                    <td>{p.payment_status || 'paid'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="ota-profile-detail-row ota-profile-detail-row--block ota-profile-detail-documents-block ota-profile-detail-row--editable" role="region" aria-label="Legal trading documents">
                  <span className="ota-profile-detail-term">
                    <IconFileCheck size={20} aria-hidden className="ota-profile-row-icon" />
                    Legal trading documents
                    <span className="ota-profile-edit-pencil" title="Editable" aria-hidden><IconEdit size={18} /></span>
                  </span>
                  <div className="ota-profile-detail-desc">
                    <p className="ota-profile-hint" style={{ marginTop: 0 }}>
                      For <strong>fiat withdrawals</strong> to your bank you must upload <strong>both</strong> a government-issued ID (or passport) and a bank statement. The server classifies document types automatically when possible (same records as under <strong>Bank account (withdrawals)</strong>).
                    </p>
                    <ul className="ota-profile-kyc-checklist" aria-label="Fiat document checklist">
                      <li className={`ota-profile-kyc-step${idProofDocs.length > 0 ? ' ota-profile-kyc-step--ok' : ''}`}>
                        {idProofDocs.length > 0 ? (
                          <IconCheckCircle size={16} aria-hidden className="ota-profile-kyc-step-icon-ok" />
                        ) : (
                          <Circle size={16} aria-hidden className="ota-profile-kyc-step-icon-pending" />
                        )}
                        <span>Government ID or passport</span>
                        {idProofDocs.length > 0 ? (
                          <span className="ota-profile-kyc-step-status">On file</span>
                        ) : (
                          <span className="ota-profile-kyc-step-status ota-profile-kyc-step-status--missing">Required</span>
                        )}
                      </li>
                      <li className={`ota-profile-kyc-step${bankStatementProofDocs.length > 0 ? ' ota-profile-kyc-step--ok' : ''}`}>
                        {bankStatementProofDocs.length > 0 ? (
                          <IconCheckCircle size={16} aria-hidden className="ota-profile-kyc-step-icon-ok" />
                        ) : (
                          <Circle size={16} aria-hidden className="ota-profile-kyc-step-icon-pending" />
                        )}
                        <span>Bank statement</span>
                        {bankStatementProofDocs.length > 0 ? (
                          <span className="ota-profile-kyc-step-status">On file</span>
                        ) : (
                          <span className="ota-profile-kyc-step-status ota-profile-kyc-step-status--missing">Required</span>
                        )}
                      </li>
                      <li className="ota-profile-kyc-step ota-profile-kyc-step--disabled">
                        <AlertCircle size={16} aria-hidden />
                        <span>Facial match (selfie vs ID)</span>
                        <span className="ota-profile-kyc-step-status">Not available in-app</span>
                      </li>
                    </ul>
                    <p className="ota-profile-detail-desc ota-profile-detail-desc--muted" style={{ fontSize: 13, marginBottom: 12 }}>
                      Face-to-ID matching needs a certified KYC provider (e.g. Sumsub, Onfido) and backend integration — it is not wired here yet; compliance may rely on manual review.
                    </p>
                    {fiatLegalDocumentsComplete && (
                      <p className="ota-profile-kyc-ready" role="status">
                        ID and bank statement are on file — minimum document set for fiat payout review.
                      </p>
                    )}
                    <div className="ota-profile-documents-upload ota-profile-documents-upload-stack">
                      <div className="ota-profile-documents-upload-row">
                        <input
                          ref={legalIdDocumentInputRef}
                          type="file"
                          accept="image/*,.pdf"
                          className="ota-profile-documents-file-input"
                          aria-hidden
                          onChange={(e) => handleLegalDocumentFileChange('id', e)}
                        />
                        <button
                          type="button"
                          className="ota-profile-edit-btn ota-profile-documents-upload-btn"
                          disabled={documentsUploading}
                          onClick={() => legalIdDocumentInputRef.current?.click()}
                        >
                          {documentsUploading ? 'Uploading…' : 'Upload government ID'}
                        </button>
                      </div>
                      <div className="ota-profile-documents-upload-row">
                        <input
                          ref={legalBankStatementDocumentInputRef}
                          type="file"
                          accept="image/*,.pdf"
                          className="ota-profile-documents-file-input"
                          aria-hidden
                          onChange={(e) => handleLegalDocumentFileChange('bank_statement', e)}
                        />
                        <button
                          type="button"
                          className="ota-profile-edit-btn ota-profile-documents-upload-btn"
                          disabled={documentsUploading}
                          onClick={() => legalBankStatementDocumentInputRef.current?.click()}
                        >
                          {documentsUploading ? 'Uploading…' : 'Upload bank statement'}
                        </button>
                      </div>
                    </div>
                    {documents.length > 0 && (
                      <ul className="ota-profile-documents-list">
                        {documents.map((d) => (
                          <li key={d.id} className="ota-profile-documents-item">
                            <span className="ota-profile-documents-name">{d.file_name}</span>
                            <span className="ota-profile-documents-meta">
                              {d.document_type === 'bank_statement' ? 'Bank statement' : 'ID'}
                              {' · '}
                              {d.verification_status === 'verified' && <IconCheckCircle size={14} className="ota-profile-doc-verified" />}
                              {d.verification_status === 'rejected' && <IconXCircle size={14} className="ota-profile-doc-rejected" />}
                              {d.verification_status === 'pending' && <AlertCircle size={14} className="ota-profile-doc-pending" />}
                              {' '}
                              {d.verification_result || d.verification_status}
                              {' · '}
                              {d.created_at ? new Date(d.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
            </>
          )}

          {/* Wallets Tab */}
          {activeTab === 'wallets' && (
            <div className="ota-profile-section">
              <div className="ota-profile-section-header">
                <h2 className="ota-profile-section-title">Wallet Management</h2>
                <button
                  className="ota-profile-add-btn"
                  onClick={() => {
                    if (currentWallet) {
                      handleAddWallet(currentWallet, 'evm', true);
                    } else {
                      toast.info('Please connect a wallet first');
                      unifiedWallet?.connectWallet?.('evm');
                    }
                  }}
                  disabled={walletsLoading}
                  aria-busy={walletsLoading}
                  aria-label={currentWallet ? 'Add current wallet to saved list' : 'Connect wallet'}
                >
                  {walletsLoading ? (
                    <RefreshCw size={16} className="spinning" />
                  ) : (
                    <Plus size={16} />
                  )}
                  {currentWallet ? 'Add Current Wallet' : 'Connect Wallet'}
                </button>
              </div>

              {walletsLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <LoadingSpinner message="Loading wallets..." />
                </div>
              ) : savedWallets.length > 0 ? (
                <div className="ota-profile-wallet-table-wrap">
                  <table className="ota-profile-wallet-table" role="grid" aria-label="Saved wallets">
                    <thead>
                      <tr>
                        <th scope="col">Address</th>
                        <th scope="col">Type</th>
                        <th scope="col">Added</th>
                        <th scope="col" className="ota-profile-wallet-table-actions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedWallets.map((wallet, index) => {
                        const isMain = wallet.wallet_address === mainWalletAddress;
                        const isCurrentlyConnected =
                          wallet.wallet_address?.toLowerCase() === currentWallet?.toLowerCase();
                        return (
                          <tr key={wallet.id || index}>
                            <td>
                              <span className="ota-profile-wallet-addr-cell">
                                <IconWallet size={14} className="ota-profile-wallet-addr-icon" aria-hidden />
                                <span className="ota-profile-wallet-table-addr" title={wallet.wallet_address}>
                                  {wallet.wallet_address.slice(0, 6)}...{wallet.wallet_address.slice(-4)}
                                </span>
                              <button type="button" className="ota-profile-wallet-copy-btn" onClick={() => copyWallet(wallet.wallet_address)} title="Copy address" aria-label="Copy address"><IconCopy size={14} /></button>
                              </span>
                              <span className="ota-profile-wallet-table-badges">
                                {isMain && <span className="ota-profile-wallet-badge main"><IconStar size={10} /> Main</span>}
                                {isCurrentlyConnected && <span className="ota-profile-wallet-badge connected"><IconCheckCircle size={10} /> Connected</span>}
                              </span>
                            </td>
                            <td>
                              {(() => {
                                const isConnected = wallet.wallet_address?.toLowerCase() === currentWallet?.toLowerCase();
                                const display = isConnected && connectedChainId
                                  ? getChainDisplay(connectedChainId)
                                  : getWalletTypeDisplay(wallet.wallet_type);
                                const color = display?.color || '#64748b';
                                const label = display?.label || 'EVM';
                                const logo = display?.logo;
                                return (
                                  <span className="ota-profile-wallet-type-badge" style={{ '--chain-color': color }}>
                                    {logo ? (
                                      <img
                                        src={logo}
                                        alt=""
                                        className="ota-profile-wallet-type-logo"
                                        width={20}
                                        height={20}
                                        loading="lazy"
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          const fb = e.target.nextElementSibling;
                                          if (fb) fb.style.display = '';
                                        }}
                                      />
                                    ) : null}
                                    <span className="ota-profile-wallet-type-icon" aria-hidden style={{ display: logo ? 'none' : undefined }} />
                                    {label}
                                  </span>
                                );
                              })()}
                            </td>
                            <td>{wallet.created_at ? new Date(wallet.created_at).toLocaleDateString() : '—'}</td>
                            <td className="ota-profile-wallet-table-actions">
                              {!isMain && (
                                <button type="button" className="ota-profile-wallet-action-btn" onClick={() => handleSetMainWallet(wallet.wallet_address)} title="Set as main" aria-label="Set as main wallet"><IconStar size={14} /></button>
                              )}
                              <button type="button" className="ota-profile-wallet-remove-btn" onClick={() => toast.info('Wallet removal coming soon')} title="Remove" aria-label="Remove wallet" disabled={isMain}><IconTrash size={14} /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="ota-profile-empty-state">
                  <IconWallet size={48} className="ota-profile-empty-icon" />
                  <p className="ota-profile-empty-text">No wallets saved</p>
                  <p className="ota-profile-empty-hint">
                    Connect a wallet to get started. Your connected wallets will appear here.
                  </p>
                  <button
                    className="ota-profile-empty-action"
                    onClick={() => {
                      if (currentWallet) {
                        handleAddWallet(currentWallet, 'evm', true);
                      } else {
                        unifiedWallet?.connectWallet?.('evm');
                      }
                    }}
                  >
                    {currentWallet ? 'Save Current Wallet' : 'Connect Wallet'}
                  </button>
                </div>
              )}
              
              {currentWallet && (
                <div className="ota-profile-wallet-hint">
                  <AlertCircle size={16} />
                  <span>Currently connected: {currentWallet.slice(0, 6)}...{currentWallet.slice(-4)}</span>
                  <button type="button" className="ota-profile-wallet-copy-btn" onClick={() => copyWallet(currentWallet)} title="Copy address" aria-label="Copy connected wallet address"><IconCopy size={14} /></button>
                </div>
              )}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="ota-profile-section">
              <div className="ota-profile-section-header">
                <h2 className="ota-profile-section-title">Security Settings</h2>
              </div>

              {!isChangingPassword ? (
                <div className="ota-profile-security-options">
                  <div className="ota-profile-security-item">
                    <div className="ota-profile-security-info">
                      <span className="ota-profile-row-icon"><IconLock size={20} aria-hidden /></span>
                      <div>
                        <div className="ota-profile-security-title">Password</div>
                        <div className="ota-profile-security-description">
                          Change your account password
                        </div>
                      </div>
                    </div>
                    <button
                      className="ota-profile-security-action-btn"
                      onClick={() => setIsChangingPassword(true)}
                    >
                      Change Password
                    </button>
                  </div>
                  
                  <div className="ota-profile-security-item">
                    <div className="ota-profile-security-info">
                      <span className="ota-profile-row-icon"><Fingerprint size={18} aria-hidden /></span>
                      <div>
                        <div className="ota-profile-security-title">Biometric</div>
                        <div className="ota-profile-security-description">
                          {biometricAvailable
                            ? (biometricRegistered ? 'Enabled on this device' : 'Available on this device')
                            : 'Not available on this device'}
                        </div>
                      </div>
                    </div>
                    {biometricAvailable && !biometricRegistered ? (
                      <button
                        className="ota-profile-security-action-btn"
                        onClick={async () => {
                          try {
                            setSecurityBusy(true);
                            await registerBiometric();
                            setBiometricRegistered(true);
                            toast.success('Biometric enabled');
                          } catch (err) {
                            toast.error(err?.message || 'Failed to enable biometric');
                          } finally {
                            setSecurityBusy(false);
                          }
                        }}
                        disabled={securityBusy}
                      >
                        Enable
                      </button>
                    ) : biometricAvailable && biometricRegistered ? (
                      <button
                        className="ota-profile-security-action-btn"
                        onClick={() => {
                          removeBiometricCredential?.();
                          setBiometricRegistered(false);
                          toast.info('Biometric disabled on this device');
                        }}
                        disabled={securityBusy}
                      >
                        Disable
                      </button>
                    ) : (
                      <button className="ota-profile-security-action-btn" disabled>
                        {biometricRegistered ? 'Enabled' : 'Unavailable'}
                      </button>
                    )}
                  </div>

                  <div className="ota-profile-security-item ota-profile-security-item--logout">
                    <div className="ota-profile-security-info">
                      <span className="ota-profile-row-icon"><LogOut size={20} aria-hidden /></span>
                      <div>
                        <div className="ota-profile-security-title">Log out</div>
                        <div className="ota-profile-security-description">
                          Sign out from this device. You will need to log in again to access your account.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="ota-profile-security-action-btn ota-profile-logout-btn"
                      onClick={async () => {
                        try {
                          setSecurityBusy(true);
                          await logout?.();
                          toast.success('Logged out');
                          navigate('/dex-edu/ota/login');
                        } catch (err) {
                          toast.error(err?.message || 'Logout failed');
                          navigate('/dex-edu/ota/login');
                        } finally {
                          setSecurityBusy(false);
                        }
                      }}
                      disabled={securityBusy}
                    >
                      Log out
                    </button>
                  </div>

                  <div className="ota-profile-security-item ota-profile-security-item--info" aria-label="Registered device: current session active">
                    <div className="ota-profile-security-info">
                      <span className="ota-profile-row-icon"><IconCheckCircle size={18} aria-hidden /></span>
                      <div>
                        <div className="ota-profile-security-title">Registered device</div>
                        <div className="ota-profile-security-description">
                          <span className="ota-profile-device-row">Operating system: {deviceDisplayInfo.os}</span>
                          <span className="ota-profile-device-row">Browser: {deviceDisplayInfo.browser}</span>
                        </div>
                      </div>
                    </div>
                    <span className="ota-profile-security-status">Active</span>
                  </div>
                </div>
              ) : (
                <div className="ota-profile-change-password-form">
                  <div className="ota-profile-form-group">
                    <label className="ota-profile-label">Current Password</label>
                    <input
                      type="password"
                      className="ota-profile-input"
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="ota-profile-form-group">
                    <label className="ota-profile-label">New Password</label>
                    <input
                      type="password"
                      className="ota-profile-input"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <p className="ota-profile-hint">Min 8 characters, must include uppercase, lowercase, and number</p>
                  </div>
                  <div className="ota-profile-form-group">
                    <label className="ota-profile-label">Confirm New Password</label>
                    <input
                      type="password"
                      className="ota-profile-input"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <div className="ota-profile-form-actions">
                    <button
                      className="ota-profile-cancel-btn"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="ota-profile-save-btn"
                      onClick={async () => {
                        try {
                          setSecurityBusy(true);
                          if (!currentPassword || !newPassword) {
                            toast.error('Enter current and new password');
                            return;
                          }
                          if (newPassword !== confirmPassword) {
                            toast.error('Passwords do not match');
                            return;
                          }
                          await changePassword(currentPassword, newPassword);
                          toast.success('Password changed successfully');
                          setIsChangingPassword(false);
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                        } catch (err) {
                          toast.error(err?.message || 'Failed to change password');
                        } finally {
                          setSecurityBusy(false);
                        }
                      }}
                      disabled={securityBusy}
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* OTA Settings Tab */}
          {activeTab === 'ota' && (
            <div className="ota-profile-section">
              <div className="ota-profile-section-header">
                <h2 className="ota-profile-section-title ota-title-row">
                  <OTALogo size="sm" className="ota-profile-section-title-logo" />
                  OTA AI Registration & Settings
                </h2>
                <button
                  className="ota-profile-refresh-btn"
                  onClick={refreshOTA}
                  disabled={otaLoading}
                  title="Refresh OTA status"
                  aria-label="Refresh OTA status"
                >
                  <RefreshCw size={16} className={otaLoading ? 'spinning' : ''} />
                  Refresh
                </button>
              </div>

              {otaError && (
                <div className="ota-profile-error">
                  <AlertCircle size={16} />
                  <span>{otaError}</span>
                </div>
              )}

              <div className="ota-profile-ota-options">
                <div className="ota-profile-security-item">
                  <div className="ota-profile-security-info">
                    <span className="ota-profile-row-icon"><Shield size={18} aria-hidden /></span>
                    <div>
                      <div className="ota-profile-security-title">OTA Registration</div>
                      <div className="ota-profile-security-description">
                        On-chain registration for OTA AI. Requires 5,000+ BITS and connected wallet.
                      </div>
                    </div>
                  </div>
                  {isRegistered ? (
                    <span className="ota-profile-security-status ota-profile-ota-status-ok">
                      <IconCheckCircle size={14} /> Registered
                    </span>
                  ) : currentWallet ? (
                    <button
                      className="ota-profile-security-action-btn"
                      onClick={async () => {
                        try {
                          await registerOTA();
                          toast.success('OTA registration successful!');
                        } catch (err) {
                          toast.error(err?.message || 'Failed to register for OTA');
                        }
                      }}
                      disabled={isRegistering}
                    >
                      {isRegistering ? 'Registering...' : 'Register for OTA'}
                    </button>
                  ) : (
                    <span className="ota-profile-security-description">Connect wallet first</span>
                  )}
                </div>

                <div className="ota-profile-security-item">
                  <div className="ota-profile-security-info">
                    <span className="ota-profile-row-icon"><IconCreditCard size={18} aria-hidden /></span>
                    <div>
                      <div className="ota-profile-security-title">BITS Balance</div>
                      <div className="ota-profile-security-description">
                        Your on-chain BITS tokens (min 5,000 required for OTA).
                      </div>
                    </div>
                  </div>
                  <span className="ota-profile-security-value">
                    {bitsBalance !== null ? `${formatCurrency(bitsBalance, '', 2)} BITS` : '—'}
                  </span>
                </div>

                <div className="ota-profile-security-item">
                  <div className="ota-profile-security-info">
                    <span className="ota-profile-row-icon"><IconStar size={18} aria-hidden /></span>
                    <div>
                      <div className="ota-profile-security-title">Privileges</div>
                      <div className="ota-profile-security-description">
                        {privileges && (privileges.payGasWithBITS || privileges.accessAdvancedOTA) ? (
                          <>
                            Pay gas with BITS: {privileges.payGasWithBITS ? 'Yes' : 'No'}
                            {' · '}
                            Advanced OTA: {privileges.accessAdvancedOTA ? 'Yes' : 'No'}
                            {privileges.cashbackRate && privileges.cashbackRate !== '0' ? ` · Cashback ${privileges.cashbackRate}%` : ''}
                          </>
                        ) : 'Available after registration'}
                      </div>
                    </div>
                  </div>
                  <span className={`ota-profile-security-status ${(privileges?.payGasWithBITS || privileges?.accessAdvancedOTA) ? 'ota-profile-ota-status-ok' : ''}`}>
                    {privileges && (privileges.payGasWithBITS || privileges.accessAdvancedOTA) ? 'Active' : '—'}
                  </span>
                </div>

                <div className="ota-profile-security-item">
                  <div className="ota-profile-security-info">
                    <span className="ota-profile-row-icon"><Zap size={18} aria-hidden /></span>
                    <div>
                      <div className="ota-profile-security-title">OTA LLM bot (authorization)</div>
                      <div className="ota-profile-security-description">
                        {(() => {
                          const auth = executorBotAuth;
                          const ok = isBotAuthorized(botAuthorizations, executorBotAddress);
                          if (ok) {
                            return 'Executor bot authorized for amount (remaining limit).';
                          }
                          if (auth && !auth.effectiveActive) {
                            return auth.reason === 'AMOUNT_EXHAUSTED'
                                ? 'Authorized amount exhausted. Renew to continue.'
                                : 'Authorization inactive. Renew in OTA.';
                          }
                          return 'Authorize the bot below to enable Auto mode.';
                        })()}
                      </div>
                      {executorBotAuth && !executorBotAuth.effectiveActive && (
                        <Link to="/dex-edu/ota" className="ota-profile-renew-bot-link">{executorBotAuth.reason === 'AMOUNT_EXHAUSTED' ? 'Increase limit →' : 'Authorize →'}</Link>
                      )}
                    </div>
                  </div>
                  <span className={`ota-profile-security-status ${isBotAuthorized(botAuthorizations, executorBotAddress) ? 'ota-profile-ota-status-ok' : (executorBotAuth && !executorBotAuth.effectiveActive ? 'ota-profile-ota-status-expired' : '')}`}>
                    {isBotAuthorized(botAuthorizations, executorBotAddress) ? <><IconCheckCircle size={14} /> Active</> : (executorBotAuth && !executorBotAuth.effectiveActive ? <>{executorBotAuth.reason === 'AMOUNT_EXHAUSTED' ? 'Amount exhausted' : 'Inactive'}</> : <>Not authorized</>)}
                  </span>
                </div>
              </div>

              <div className="ota-profile-ota-panel-wrap">
                <OTASettingsPanel className="ota-profile-ota-panel" />
              </div>

              {isRegistered && (
                <div className="ota-profile-ota-cta">
                  <Link to="/dex-edu/ota" className="ota-profile-ota-cta-link">
                    <span>Go to OTA AI Trading</span>
                    <ChevronRight size={18} />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OTAProfilePage;
