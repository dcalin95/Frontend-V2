/**
 * useBotAuthorizationFlow – orchestrator for OTA bot reauthorization (preference + on-chain tx + status refresh).
 * State machine: idle | preference_saved | reauthorization_required | awaiting_wallet_signature |
 *   transaction_submitted | transaction_confirmed | status_refreshing | active_on_chain | reauthorization_failed.
 * Logs: BOT_AUTH_REAUTHORIZE_STARTED, BOT_AUTH_AWAITING_WALLET_SIGNATURE, BOT_AUTH_REAUTHORIZE_TX_SUBMITTED,
 *   BOT_AUTH_REAUTHORIZE_TX_CONFIRMED, BOT_AUTH_STATUS_REFRESH_AFTER_REAUTHORIZE, BOT_AUTH_REAUTHORIZE_COMPLETED, BOT_AUTH_REAUTHORIZE_FAILED.
 * Deduplication: each (traceId, eventKey) logs only once per flow to avoid duplicate preflight logs.
 * @module useBotAuthorizationFlow
 */

import { useState, useCallback, useRef } from 'react';
import { useOTARegistrationContext } from '../context/OTARegistrationContext';
import { getBotAuthStatus, setBotAuthDuration } from '../services/aiTradingApiService';

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 5;

const loggedKeysByTrace = new Map();

function logReauthOnce(traceId, event, payload, eventKey = null) {
  const key = eventKey != null ? `${event}-${eventKey}` : event;
  const set = loggedKeysByTrace.get(traceId) || new Set();
  if (set.has(key)) return;
  set.add(key);
  loggedKeysByTrace.set(traceId, set);
  const msg = typeof payload === 'object' ? JSON.stringify(payload) : String(payload);
  console.log(`[BOT_AUTH_REAUTHORIZE] ${event}`, msg);
}

function clearTraceLogs(traceId) {
  if (traceId != null) loggedKeysByTrace.delete(traceId);
}

export const REAUTH_FLOW_STATES = {
  IDLE: 'idle',
  PREFERENCE_SAVED: 'preference_saved',
  REAUTHORIZATION_REQUIRED: 'reauthorization_required',
  AWAITING_WALLET_SIGNATURE: 'awaiting_wallet_signature',
  TRANSACTION_SUBMITTED: 'transaction_submitted',
  TRANSACTION_CONFIRMED: 'transaction_confirmed',
  STATUS_REFRESHING: 'status_refreshing',
  ACTIVE_ON_CHAIN: 'active_on_chain',
  REAUTHORIZATION_FAILED: 'reauthorization_failed',
};

/**
 * @returns {{
 *   reauthFlowState: string,
 *   lastReauthTxHash: string|null,
 *   lastReauthError: string|null,
 *   startReauthorization: (params: { walletAddress: string, botAddress: string, maxAmountUsdt: string, duration?: string }) => Promise<void>,
 *   savePreferenceOnly: (walletAddress: string, duration: string) => Promise<void>,
 *   resetReauthState: () => void,
 *   statusAfterReauth: object|null
 * }}
 */
export function useBotAuthorizationFlow() {
  const { authorizeBot: contextAuthorizeBot, checkRegistrationStatus } = useOTARegistrationContext();
  const [reauthFlowState, setReauthFlowState] = useState(REAUTH_FLOW_STATES.IDLE);
  const [lastReauthTxHash, setLastReauthTxHash] = useState(null);
  const [lastReauthError, setLastReauthError] = useState(null);
  const [statusAfterReauth, setStatusAfterReauth] = useState(null);
  const cancelledRef = useRef(false);

  const resetReauthState = useCallback(() => {
    cancelledRef.current = false;
    setReauthFlowState(REAUTH_FLOW_STATES.IDLE);
    setLastReauthTxHash(null);
    setLastReauthError(null);
    setStatusAfterReauth(null);
  }, []);

  const savePreferenceOnly = useCallback(async (walletAddress, duration) => {
    if (!walletAddress || !duration) return;
    const traceId = `pref-${Date.now()}`;
    try {
      await setBotAuthDuration(walletAddress, duration);
      setReauthFlowState(REAUTH_FLOW_STATES.PREFERENCE_SAVED);
      setLastReauthError(null);
      logReauthOnce(traceId, 'BOT_AUTH_PREFERENCE_SAVED', { wallet: walletAddress, selectedDuration: duration });
    } catch (err) {
      setLastReauthError(err?.message || 'Failed to save preference');
      setReauthFlowState(REAUTH_FLOW_STATES.REAUTHORIZATION_FAILED);
      logReauthOnce(traceId, 'BOT_AUTH_REAUTHORIZE_FAILED', { reason: 'save_preference', error: err?.message });
    } finally {
      clearTraceLogs(traceId);
    }
  }, []);

  const startReauthorization = useCallback(async ({ walletAddress, botAddress, maxAmountUsdt, duration }) => {
    if (!walletAddress || !botAddress) {
      setLastReauthError('Wallet and bot address required');
      setReauthFlowState(REAUTH_FLOW_STATES.REAUTHORIZATION_FAILED);
      return;
    }
    const traceId = `reauth-${Date.now()}`;
    cancelledRef.current = false;
    setLastReauthError(null);
    setLastReauthTxHash(null);
    setStatusAfterReauth(null);

    let previousOnChainExpiresAtRaw = null;
    try {
      const initialStatus = await getBotAuthStatus(walletAddress);
      previousOnChainExpiresAtRaw = initialStatus?.onChainExpiresAtRaw ?? null;
    } catch (_) {}

    logReauthOnce(traceId, 'BOT_AUTH_REAUTHORIZE_STARTED', {
      wallet: walletAddress,
      botAddress,
      maxAmountUsdt,
      selectedDuration: duration || null,
    });

    setReauthFlowState(REAUTH_FLOW_STATES.AWAITING_WALLET_SIGNATURE);
    logReauthOnce(traceId, 'BOT_AUTH_AWAITING_WALLET_SIGNATURE', { wallet: walletAddress, botAddress });

    try {
      const txResult = await contextAuthorizeBot(botAddress, maxAmountUsdt);
      if (cancelledRef.current) { clearTraceLogs(traceId); return; }

      const hash = txResult?.hash ?? txResult?.receipt?.transactionHash;
      setLastReauthTxHash(hash || null);
      setReauthFlowState(REAUTH_FLOW_STATES.TRANSACTION_SUBMITTED);

      logReauthOnce(traceId, 'BOT_AUTH_REAUTHORIZE_TX_SUBMITTED', {
        wallet: walletAddress,
        txHash: hash,
        selectedDuration: duration || null,
      });

      setReauthFlowState(REAUTH_FLOW_STATES.TRANSACTION_CONFIRMED);
      logReauthOnce(traceId, 'BOT_AUTH_REAUTHORIZE_TX_CONFIRMED', { wallet: walletAddress, txHash: hash });

      // Pauză 2s ca blocul să fie indexat înainte de citire status; altfel UI arată în continuare data veche.
      await new Promise((r) => setTimeout(r, 2000));

      if (duration) {
        try {
          await setBotAuthDuration(walletAddress, duration);
        } catch (_) {
          // preference save best-effort
        }
      }

      setReauthFlowState(REAUTH_FLOW_STATES.STATUS_REFRESHING);
      let lastStatus = null;
      for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
        if (cancelledRef.current) { clearTraceLogs(traceId); return; }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        const statusRes = await getBotAuthStatus(walletAddress);
        if (cancelledRef.current) { clearTraceLogs(traceId); return; }
        lastStatus = statusRes;
        const effective = statusRes?.onChainEffectiveActive === true;
        logReauthOnce(traceId, 'BOT_AUTH_STATUS_REFRESH_AFTER_REAUTHORIZE', {
          wallet: walletAddress,
          attempt: attempt + 1,
          onChainEffectiveActive: effective,
          onChainExpiresAt: statusRes?.onChainExpiresAtIso ?? statusRes?.onChainExpiresAtRaw ?? null,
        }, attempt);
        if (effective) {
          setStatusAfterReauth(statusRes);
          setReauthFlowState(REAUTH_FLOW_STATES.ACTIVE_ON_CHAIN);
          logReauthOnce(traceId, 'BOT_AUTH_REAUTHORIZE_COMPLETED', {
            wallet: walletAddress,
            txHash: hash,
            onChainEffectiveActive: true,
            onChainExpiresAt: statusRes?.onChainExpiresAtIso ?? statusRes?.onChainExpiresAtRaw,
          });
          if (hash && previousOnChainExpiresAtRaw != null && statusRes?.onChainExpiresAtRaw != null && String(statusRes.onChainExpiresAtRaw) === String(previousOnChainExpiresAtRaw)) {
            console.error('[BOT_AUTH_REAUTHORIZE] HARD ERROR: on-chain state was not updated after tx confirmation. onChainExpiresAtRaw unchanged:', previousOnChainExpiresAtRaw, 'txHash:', hash);
          }
          if (checkRegistrationStatus) {
            await checkRegistrationStatus({ force: true, walletAddressOverride: walletAddress });
          }
          clearTraceLogs(traceId);
          return;
        }
      }

      const chainNotUpdated = lastStatus?.onChainEffectiveActive !== true;
      if (chainNotUpdated) {
        setStatusAfterReauth(null);
        const errMsg = 'The transaction was signed, but authorization did not update on the contract. Check on BSCScan that the transaction targets the correct address (UserVault Proxy).';
        setLastReauthError(errMsg);
        setReauthFlowState(REAUTH_FLOW_STATES.REAUTHORIZATION_FAILED);
        logReauthOnce(traceId, 'BOT_AUTH_REAUTHORIZE_CHAIN_NOT_UPDATED', {
          wallet: walletAddress,
          txHash: hash,
          onChainEffectiveActive: lastStatus?.onChainEffectiveActive ?? false,
          onChainExpiresAtRaw: lastStatus?.onChainExpiresAtRaw,
          previousExpiresAtRaw: previousOnChainExpiresAtRaw,
        });
        if (hash && previousOnChainExpiresAtRaw != null && lastStatus?.onChainExpiresAtRaw != null && String(lastStatus.onChainExpiresAtRaw) === String(previousOnChainExpiresAtRaw)) {
          console.error('[BOT_AUTH_REAUTHORIZE] on-chain state was not updated after tx. onChainExpiresAtRaw unchanged:', previousOnChainExpiresAtRaw, 'txHash:', hash);
        }
      } else {
        setStatusAfterReauth(lastStatus);
        setReauthFlowState(REAUTH_FLOW_STATES.ACTIVE_ON_CHAIN);
        logReauthOnce(traceId, 'BOT_AUTH_REAUTHORIZE_COMPLETED', {
          wallet: walletAddress,
          txHash: hash,
          onChainEffectiveActive: true,
        });
        if (checkRegistrationStatus) {
          await checkRegistrationStatus({ force: true, walletAddressOverride: walletAddress });
        }
      }
      clearTraceLogs(traceId);
    } catch (err) {
      if (cancelledRef.current) { clearTraceLogs(traceId); return; }
      const msg = err?.message || 'Reauthorization failed';
      setLastReauthError(msg);
      setReauthFlowState(REAUTH_FLOW_STATES.REAUTHORIZATION_FAILED);
      logReauthOnce(traceId, 'BOT_AUTH_REAUTHORIZE_FAILED', {
        wallet: walletAddress,
        selectedDuration: duration || null,
        error: msg,
      });
      clearTraceLogs(traceId);
    }
  }, [contextAuthorizeBot, checkRegistrationStatus]);

  return {
    reauthFlowState,
    lastReauthTxHash,
    lastReauthError,
    startReauthorization,
    savePreferenceOnly,
    resetReauthState,
    statusAfterReauth,
  };
}

export default useBotAuthorizationFlow;
