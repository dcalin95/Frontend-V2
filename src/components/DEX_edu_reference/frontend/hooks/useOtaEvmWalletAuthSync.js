import { useEffect, useRef } from 'react';
import { useWallet } from '../../context/WalletContext.jsx';
import {
  ensureOtaWalletForApiIfNeeded,
  clearOtaWalletSession,
} from '../utils/otaWalletSession';

/** După respingere în MetaMask (4001 / user denied), nu relansa imediat ensure — evită buclă de prompturi. */
const USER_REJECT_OTA_ENSURE_COOLDOWN_MS = 60000;

function isWalletUserRejectionError(err) {
  const m = String(err?.message || err?.reason || err || '');
  const c = err?.code;
  return (
    c === 4001 ||
    c === 'ACTION_REJECTED' ||
    /user rejected|user denied|rejected the request|denied transaction signature/i.test(m)
  );
}

/**
 * Obține token OTA (challenge + semnătură EIP-191) când wallet-ul EVM e conectat,
 * sau folosește doar sesiunea DEX dacă GET /api/dex/v1/auth/me confirmă același wallet (un singur lanț).
 * @param {{ enabled?: boolean }} [opts]
 */
export function useOtaEvmWalletAuthSync(opts = {}) {
  const { enabled = true } = opts;
  const { isConnected, walletAddress, walletType, signer } = useWallet();
  /** NU folosi `signer` (obiect) în deps — wagmi îl recreează des → efectul se re-executa în buclă și putea redeclanșa MetaMask. Folosim boolean + ref. */
  const hasEvmSigner = Boolean(signer);
  const prevAddr = useRef(null);
  const lastUserRejectEnsureAtRef = useRef(0);
  const signerRef = useRef(signer);
  signerRef.current = signer;

  useEffect(() => {
    if (!enabled) return;
    const s = signerRef.current;
    if (!isConnected || walletType !== 'EVM' || !s || !walletAddress) {
      if (prevAddr.current && (!isConnected || !walletAddress)) {
        clearOtaWalletSession();
      }
      prevAddr.current = walletAddress || null;
      return;
    }
    const addr = String(walletAddress).toLowerCase();
    if (prevAddr.current && prevAddr.current !== addr) {
      clearOtaWalletSession();
      lastUserRejectEnsureAtRef.current = 0;
    }
    prevAddr.current = addr;

    let cancelled = false;
    (async () => {
      if (Date.now() - lastUserRejectEnsureAtRef.current < USER_REJECT_OTA_ENSURE_COOLDOWN_MS) {
        return;
      }
      try {
        if (cancelled) return;
        await ensureOtaWalletForApiIfNeeded(s, addr);
      } catch (e) {
        if (isWalletUserRejectionError(e)) {
          lastUserRejectEnsureAtRef.current = Date.now();
        }
        if (!cancelled && process.env.NODE_ENV === 'development') {
          console.warn('[useOtaEvmWalletAuthSync]', e?.message || e);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, isConnected, walletType, walletAddress, hasEvmSigner]);

  /**
   * Nu relansa automat challenge + semnătură după invalidări OTA venite din poll-uri / refresh-uri de fundal.
   * Tokenul se curăță în otaApiClient, iar reautentificarea se întâmplă doar pe o acțiune explicită a userului
   * sau la următoarea intrare reală într-un flux care chiar are nevoie de sesiune nouă.
   */
}
