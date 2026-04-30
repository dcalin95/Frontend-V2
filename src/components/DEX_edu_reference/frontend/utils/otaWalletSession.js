/**
 * Sesiune OTA backend: challenge EIP-191 + token opac (Bearer otaw_*).
 * Doar EVM (ethers signMessage). Non-EVM: nu se emite token aici.
 *
 * Token + adresă: **localStorage** — persistă între tab-uri/refresh-uri cât timp backend-ul consideră sesiunea validă.
 * Fallback: dacă există token vechi în sessionStorage, îl mută în localStorage.
 */
import * as apiEndpoints from '../../config/apiEndpoints.js';
import { getAuthStatus } from '../services/authApiService';

const TOKEN_KEY = 'bits_ota_wallet_session_token_v1';
const ADDR_KEY = 'bits_ota_wallet_session_addr_v1';
const LOCK_KEY = 'bits_ota_wallet_session_lock_v1';

/** Dacă există token vechi doar în sessionStorage, îl mută în localStorage. */
function migrateOtaSessionFromLocalStorageIfNeeded() {
  if (typeof localStorage === 'undefined' || typeof sessionStorage === 'undefined') return;
  try {
    if (localStorage.getItem(TOKEN_KEY)) return;
    const t = sessionStorage.getItem(TOKEN_KEY);
    if (!t) return;
    const a = sessionStorage.getItem(ADDR_KEY);
    localStorage.setItem(TOKEN_KEY, t);
    if (a) localStorage.setItem(ADDR_KEY, a);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(ADDR_KEY);
  } catch (_) {
    /* quota / private mode */
  }
}

/** Emis după verify reușit sau refresh reușit — ascultat de waitForOtaWalletSessionRefresh. */
export const OTA_SESSION_REFRESH_EVENT = 'bits:ota-wallet-session-ready';

/** Emis când API returnează 401/403 OTA — useOtaEvmWalletAuthSync poate relansa ensure. */
export const OTA_SESSION_INVALID_EVENT = 'bits:ota-wallet-session-invalid';

const MAX_REFRESH_WAIT_MS = 120000;
const AUTH_LOCK_TTL_MS = 90000;
/** După un GET /session reușit, evităm probe repetate (reduce spam + fals 401 la LB / instanțe). Sesiunea server e ore — 15 min e sigur. */
const SESSION_PROBE_OK_CACHE_MS = 15 * 60 * 1000;
const SESSION_PROBE_MAX_ATTEMPTS = 3;
/** @type {{ key: string, until: number }} */
let sessionProbeOkCache = { key: '', until: 0 };

function sessionProbeCacheKey(token, expectedWalletAddress) {
  if (!token) return '';
  const addr = expectedWalletAddress ? String(expectedWalletAddress).toLowerCase() : '_';
  return `${String(token).slice(0, 32)}_${addr}`;
}

function touchSessionProbeOkCache(token, expectedWalletAddress) {
  const key = sessionProbeCacheKey(token, expectedWalletAddress);
  if (!key) return;
  sessionProbeOkCache = { key, until: Date.now() + SESSION_PROBE_OK_CACHE_MS };
}

function readSessionProbeOkCache(token, expectedWalletAddress) {
  const key = sessionProbeCacheKey(token, expectedWalletAddress);
  if (!key || sessionProbeOkCache.key !== key) return false;
  return Date.now() < sessionProbeOkCache.until;
}
let ensureSessionInFlight = null;
let ensureSessionInFlightAddr = null;
const tabOwnerId = `ota_tab_${Math.random().toString(36).slice(2)}_${Date.now()}`;

export function getOtaWalletAuthToken() {
  migrateOtaSessionFromLocalStorageIfNeeded();
  const store = typeof localStorage !== 'undefined'
    ? localStorage
    : typeof sessionStorage !== 'undefined'
      ? sessionStorage
      : null;
  if (!store) return null;
  try {
    return store.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Adresa normalizată stocată alături de tokenul otaw_* (dacă există). */
export function getOtaWalletSessionStoredAddress() {
  migrateOtaSessionFromLocalStorageIfNeeded();
  const store = typeof localStorage !== 'undefined'
    ? localStorage
    : typeof sessionStorage !== 'undefined'
      ? sessionStorage
      : null;
  if (!store) return null;
  try {
    return store.getItem(ADDR_KEY);
  } catch {
    return null;
  }
}

export function setOtaWalletAuthToken(token, normalizedAddress) {
  const store = typeof localStorage !== 'undefined'
    ? localStorage
    : typeof sessionStorage !== 'undefined'
      ? sessionStorage
      : null;
  if (!store) return;
  try {
    if (token) {
      store.setItem(TOKEN_KEY, token);
      if (normalizedAddress) store.setItem(ADDR_KEY, String(normalizedAddress).toLowerCase());
    } else {
      store.removeItem(TOKEN_KEY);
      store.removeItem(ADDR_KEY);
    }
    if (typeof sessionStorage !== 'undefined' && sessionStorage !== store) {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(ADDR_KEY);
    }
  } catch (_) {
    /* quota */
  }
}

export function clearOtaWalletSession() {
  setOtaWalletAuthToken(null);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ADDR_KEY);
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(ADDR_KEY);
    }
  } catch (_) {
    /* quota */
  }
  sessionProbeOkCache = { key: '', until: 0 };
}

/** Potrivește adresa EVM cu câmpurile uzuale din răspunsul /auth/me. */
function dexMeWalletMatchesUser(user, evmLower) {
  if (!user || typeof user !== 'object') return false;
  const candidates = [
    user.walletAddress,
    user.wallet,
    user.associatedWalletAddress,
    ...(Array.isArray(user.wallets)
      ? user.wallets.map((w) => (typeof w === 'string' ? w : w?.address || w?.walletAddress))
      : []),
  ].filter((x) => x != null && String(x).trim() !== '');
  return candidates.some((c) => String(c).toLowerCase() === evmLower);
}

/**
 * Verifică pe server dacă există sesiune DEX (cookie) pentru același wallet EVM — același lanț de încredere ca OTA (fără a doua semnătură).
 * @param {string} evmAddress
 * @returns {Promise<boolean>}
 */
export async function isDexWalletSessionActiveForAddress(evmAddress) {
  if (!evmAddress || typeof evmAddress !== 'string') return false;
  const evmLower = String(evmAddress).toLowerCase();
  try {
    const r = await getAuthStatus();
    const authed = r && (r.authenticated === true || r.success === true);
    if (!authed) return false;
    if (r.walletAddress && String(r.walletAddress).toLowerCase() === evmLower) return true;
    if (r.user && dexMeWalletMatchesUser(r.user, evmLower)) return true;
    return false;
  } catch {
    return false;
  }
}

function readSessionLock() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSessionLock(address, owner = tabOwnerId) {
  if (typeof localStorage === 'undefined') return null;
  const lock = {
    owner,
    address: String(address || '').toLowerCase(),
    expiresAt: Date.now() + AUTH_LOCK_TTL_MS,
  };
  try {
    localStorage.setItem(LOCK_KEY, JSON.stringify(lock));
  } catch {}
  return lock;
}

function clearSessionLock(address, owner = tabOwnerId) {
  if (typeof localStorage === 'undefined') return;
  const current = readSessionLock();
  const normalizedAddr = String(address || '').toLowerCase();
  if (!current) return;
  if (current.owner !== owner) return;
  if (normalizedAddr && current.address !== normalizedAddr) return;
  try {
    localStorage.removeItem(LOCK_KEY);
  } catch {}
}

function dispatchSessionReady() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OTA_SESSION_REFRESH_EVENT));
}

/**
 * Verifică pe server dacă tokenul din sessionStorage mai există în sesiunea în memorie (după redeploy etc.).
 * true = sesiune validă, false = sesiune invalidă confirmat (401/403 sau wallet diferit), null = neconcludent (5xx/rețea).
 * @param {string|null} [expectedWalletAddress] — dacă e setat, la 200 se compară cu `walletAddress` din răspuns (evită token reutilizat pe alt cont).
 * @returns {Promise<boolean|null>}
 */
export async function validateCachedOtaWalletSession(expectedWalletAddress = null) {
  const tok = getOtaWalletAuthToken();
  if (!tok) return false;
  if (readSessionProbeOkCache(tok, expectedWalletAddress)) {
    return true;
  }
  const base = apiEndpoints.getApiBaseUrl();
  if (!base || typeof base !== 'string') return null;
  const root = base.replace(/\/$/, '');
  const url = `${root}/ai-trading/auth/evm/session`;
  try {
    for (let attempt = 0; attempt < SESSION_PROBE_MAX_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 200 * attempt));
      }
      const r = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${tok}` },
        credentials: 'include',
        cache: 'no-store',
      });
      if (r.ok) {
        if (!expectedWalletAddress) {
          touchSessionProbeOkCache(tok, expectedWalletAddress);
          return true;
        }
        const j = await r.json().catch(() => ({}));
        const wan = j.walletAddress != null ? String(j.walletAddress).toLowerCase() : '';
        const exp = String(expectedWalletAddress).toLowerCase();
        if (!wan || !exp) {
          touchSessionProbeOkCache(tok, expectedWalletAddress);
          return true;
        }
        const match = wan === exp;
        if (match) touchSessionProbeOkCache(tok, expectedWalletAddress);
        return match;
      }
      if (r.status === 401 || r.status === 403) {
        if (attempt < SESSION_PROBE_MAX_ATTEMPTS - 1) continue;
        return false;
      }
      return null;
    }
    return false;
  } catch {
    return null;
  }
}

/**
 * Pentru apeluri API OTA: dacă Bearer-ul otaw_* e deja valid pentru wallet, nu face nimic.
 * Altfel pornește challenge + semnătură (EIP-191). Sesiunea DEX (cookie) singură nu înlocuiește
 * `Authorization: Bearer otaw_*` pe rutele /ai-trading cu enforce — fără token valid trebuie semnătură.
 * Evită apelul la fiecare interval la ensureEvmOtaWalletSession({ skipIfDexSessionAligned }) care
 * putea relansa probe / ramuri care deranjau utilizatorul fără schimbare reală de stare.
 *
 * @param {import('ethers').Signer} signer
 * @param {string} walletAddress
 * @returns {Promise<void>}
 */
export async function ensureOtaWalletForApiIfNeeded(signer, walletAddress) {
  if (!signer || !walletAddress) return;
  const addr = String(walletAddress).toLowerCase();
  const tok = getOtaWalletAuthToken();
  const stored = getOtaWalletSessionStoredAddress();
  if (tok && stored && String(stored).toLowerCase() === addr) {
    const otaOk = await validateCachedOtaWalletSession(addr);
    if (otaOk === true) {
      return;
    }
  }
  await ensureEvmOtaWalletSession(signer);
}

/**
 * Așteaptă un token nou după bits:ota-wallet-session-invalid + ensure în hook (utilizator semnează în portofel).
 * @returns {Promise<void>}
 */
export function waitForOtaWalletSessionRefresh(timeoutMs = MAX_REFRESH_WAIT_MS) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('OTA refresh: no window'));
      return;
    }
    if (getOtaWalletAuthToken()) {
      resolve();
      return;
    }
    let done = false;
    const cleanup = () => {
      clearTimeout(t);
      clearInterval(iv);
      window.removeEventListener(OTA_SESSION_REFRESH_EVENT, onReady);
    };
    const finish = () => {
      if (done) return;
      if (getOtaWalletAuthToken()) {
        done = true;
        cleanup();
        resolve();
      }
    };
    function onReady() {
      finish();
    }
    const t = setTimeout(() => {
      if (done) return;
      done = true;
      cleanup();
      reject(new Error('OTA wallet re-auth timed out'));
    }, timeoutMs);
    const iv = setInterval(finish, 200);
    window.addEventListener(OTA_SESSION_REFRESH_EVENT, onReady);
    finish();
  });
}

/**
 * @param {import('ethers').Signer} signer
 * @param {{ skipIfDexSessionAligned?: boolean }} [options] — dacă e true, nu cere challenge OTA: același wallet e deja autentificat la DEX (cookie); șterge otaw_* ca să nu trimită Bearer invalid.
 * @returns {Promise<string|null>} token otaw_* sau null când se folosește doar sesiunea DEX
 */
export async function ensureEvmOtaWalletSession(signer, options = {}) {
  const { skipIfDexSessionAligned = false } = options || {};
  if (skipIfDexSessionAligned) {
    // Înainte: clearOtaWalletSession() la fiecare apel — ștergea tokenul otaw_* valid și forța challenge+MetaMask
    // la fiecare poll (Analytics) / rerandări. Păstrăm Bearer dacă GET /auth/evm/session îl confirmă; curățăm doar invalid / alt wallet.
    if (!signer || typeof signer.getAddress !== 'function') return null;
    const addrSkip = (await signer.getAddress()).toLowerCase();
    const existingSkip = getOtaWalletAuthToken();
    const storedAddrSkip = getOtaWalletSessionStoredAddress();
    if (existingSkip && storedAddrSkip && storedAddrSkip !== addrSkip) {
      clearOtaWalletSession();
    } else if (existingSkip) {
      const stillValid = await validateCachedOtaWalletSession(addrSkip);
      if (stillValid === false) clearOtaWalletSession();
    }
    return null;
  }
  if (!signer || typeof signer.getAddress !== 'function') return null;
  const addr = (await signer.getAddress()).toLowerCase();
  let existing = getOtaWalletAuthToken();
  const storedAddr = getOtaWalletSessionStoredAddress();
  /** Token pentru altă adresă decât portofelul curent — curățăm, altfel UI cere semnături în buclă. */
  if (existing && storedAddr && storedAddr !== addr) {
    clearOtaWalletSession();
    existing = null;
  }
  /**
   * Dacă există token dar lipsea ADDR_KEY (migrare / stocare parțială), înainte refăceam mereu challenge+sign.
   * Validăm cu adresa curentă și reparăm ADDR_KEY când GET /session confirmă.
   */
  if (existing) {
    const stillValid = await validateCachedOtaWalletSession(addr);
    if (stillValid !== false) {
      if (stillValid === true && !storedAddr) {
        setOtaWalletAuthToken(existing, addr);
      }
      return existing;
    }
    clearOtaWalletSession();
  }
  if (ensureSessionInFlight && ensureSessionInFlightAddr === addr) {
    return ensureSessionInFlight;
  }
  const activeLock = readSessionLock();
  if (
    activeLock &&
    activeLock.address === addr &&
    activeLock.owner !== tabOwnerId &&
    Number(activeLock.expiresAt || 0) > Date.now()
  ) {
    try {
      await waitForOtaWalletSessionRefresh(
        Math.min(MAX_REFRESH_WAIT_MS, Math.max(1000, Number(activeLock.expiresAt) - Date.now() + 5000))
      );
      const refreshed = getOtaWalletAuthToken();
      const refreshedAddr = getOtaWalletSessionStoredAddress();
      if (refreshed && refreshedAddr === addr) {
        const stillValid = await validateCachedOtaWalletSession(addr);
        if (stillValid !== false) return refreshed;
        clearOtaWalletSession();
      }
    } catch {
      // Lock owner may have failed or the user rejected the signature; continue with our own attempt.
    }
  }

  ensureSessionInFlightAddr = addr;
  ensureSessionInFlight = (async () => {
    writeSessionLock(addr);
    const base = apiEndpoints.getApiBaseUrl();
    if (!base || typeof base !== 'string') return null;
    const root = base.replace(/\/$/, '');
    const chRes = await fetch(`${root}/ai-trading/auth/evm/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      cache: 'no-store',
    });
    if (!chRes.ok) {
      const err = await chRes.json().catch(() => ({}));
      throw new Error(err.error || `OTA challenge HTTP ${chRes.status}`);
    }
    const chJson = await chRes.json();
    const message = chJson.message;
    const challengeId = chJson.challengeId;
    if (!message || !challengeId) throw new Error('OTA challenge response invalid');

    const signature = await signer.signMessage(message);
    const vRes = await fetch(`${root}/ai-trading/auth/evm/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      cache: 'no-store',
      body: JSON.stringify({
        challengeId,
        address: addr,
        signature,
      }),
    });
    const vJson = await vRes.json().catch(() => ({}));
    if (!vRes.ok || !vJson.token) {
      throw new Error(vJson.error || `OTA verify HTTP ${vRes.status}`);
    }
    setOtaWalletAuthToken(vJson.token, addr);
    dispatchSessionReady();
    return vJson.token;
  })().finally(() => {
    clearSessionLock(addr);
    if (ensureSessionInFlightAddr === addr) {
      ensureSessionInFlight = null;
      ensureSessionInFlightAddr = null;
    }
  });

  return ensureSessionInFlight;
}
