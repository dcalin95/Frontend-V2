/**
 * 🔒 SSOT: EVM Provider Resolver
 *
 * MODUL UNIC pentru selectarea providerului EVM corect.
 * TOATE componentele din site TREBUIE să importe de aici.
 *
 * Mecanism:
 * 1) EIP-6963 provider izolat (NU poate fi hijackat)
 * 2) window.ethereum.providers[] (multi-provider array)
 * 3) window.ethereum direct (fallback)
 *
 * Respectă preferința userului din localStorage key 'bits_evm_preferred_connector_name'.
 *
 * 🔥 INTERZIS: duplicarea acestei logici în alte fișiere.
 */

import { ethers } from 'ethers';

const PREFERRED_CONNECTOR_KEY = 'bits_evm_preferred_connector_name';

// ── EIP-6963 provider cache ──
const _eip6963Cache = [];

if (typeof window !== 'undefined') {
  const handler = (event) => {
    const info = event?.detail?.info;
    const provider = event?.detail?.provider;
    if (info && provider && typeof provider.request === 'function') {
      if (!_eip6963Cache.some(e => e.info.uuid === info.uuid)) {
        _eip6963Cache.push({ info, provider });
      }
    }
  };
  window.addEventListener('eip6963:announceProvider', handler);
  try { window.dispatchEvent(new Event('eip6963:requestProvider')); } catch (_) {}
}

function getPreferredName() {
  try { return (localStorage.getItem(PREFERRED_CONNECTOR_KEY) || '').toLowerCase(); }
  catch (_) { return ''; }
}

/**
 * Returnează providerul EVM corect, respectând wallet-ul selectat de user.
 *
 * @returns {Object|null} raw EVM provider (are .request())
 */
export function pickEvmProvider() {
  if (typeof window === 'undefined') return null;

  const preferredName = getPreferredName();
  const wantsMetaMask = preferredName.includes('metamask') || preferredName.includes('meta mask');
  const wantsTrust = preferredName.includes('trust');
  const wantsCoinbase = preferredName.includes('coinbase');
  const wantsBinance = preferredName.includes('binance');

  // ── 1) EIP-6963: provider izolat, NU poate fi hijackat ──
  if (_eip6963Cache.length > 0) {
    if (wantsMetaMask) {
      const mm = _eip6963Cache.find(e => e.info.rdns === 'io.metamask');
      if (mm) return mm.provider;
    }
    if (wantsTrust) {
      const trust = _eip6963Cache.find(e => e.info.rdns === 'com.trustwallet.app');
      if (trust) return trust.provider;
    }
    if (wantsCoinbase) {
      const cb = _eip6963Cache.find(e => e.info.rdns === 'com.coinbase.wallet');
      if (cb) return cb.provider;
    }
  }

  const eth = window.ethereum;
  if (!eth) return null;

  // ── 2) window.ethereum.providers[] ──
  const list = (eth.providers && Array.isArray(eth.providers) && eth.providers.length > 0)
    ? eth.providers
    : [eth];

  if (wantsMetaMask) {
    const mm = list.find(p => p?.isMetaMask && !p?.isTrust && !p?.isPhantom && typeof p?.request === 'function');
    if (mm) return mm;
  }

  if (wantsTrust) {
    const trust = list.find(p => p?.isTrust && !p?.isPhantom && typeof p?.request === 'function');
    if (trust) return trust;
  }

  if (wantsCoinbase) {
    const cb = list.find(p => p?.isCoinbaseWallet && typeof p?.request === 'function');
    if (cb) return cb;
  }

  if (wantsBinance) {
    const bn = (typeof window.binancew3w?.ethereum?.request === 'function')
      ? window.binancew3w.ethereum
      : list.find(p => p?.isBinanceWeb3Wallet && typeof p?.request === 'function');
    if (bn) return bn;
  }

  // ── 3) Fallback: first non-Phantom usable provider ──
  return list.find(p => !p?.isPhantom && typeof p?.request === 'function') || null;
}

/**
 * Returnează un ethers Web3Provider legat de wallet-ul selectat de user.
 * @returns {ethers.providers.Web3Provider|null}
 */
export function getWeb3Provider() {
  const raw = pickEvmProvider();
  if (!raw) return null;
  return new ethers.providers.Web3Provider(raw, 'any');
}

/**
 * Returnează un signer de la wallet-ul selectat de user.
 * @param {string|null} expectedAddress - verifică dacă adresa signer-ului coincide
 * @returns {Promise<ethers.providers.JsonRpcSigner>}
 */
export async function getSignerFromPreferredWallet(expectedAddress = null) {
  const raw = pickEvmProvider();
  if (!raw) {
    const name = getPreferredName();
    throw new Error(name
      ? `Selected wallet (${name}) is not available. Reconnect and retry.`
      : 'Wallet not connected. Please connect your wallet.'
    );
  }

  const provider = new ethers.providers.Web3Provider(raw, 'any');
  let accounts = await raw.request({ method: 'eth_accounts' }).catch(() => []);
  if (!Array.isArray(accounts) || accounts.length === 0) {
    accounts = await raw.request({ method: 'eth_requestAccounts' }).catch(() => []);
  }

  if (expectedAddress) {
    const target = String(expectedAddress).toLowerCase();
    const hasTarget = Array.isArray(accounts) && accounts.some(a => String(a).toLowerCase() === target);
    if (!hasTarget) {
      const requested = await raw.request({ method: 'eth_requestAccounts' }).catch(() => accounts);
      if (Array.isArray(requested) && requested.length > 0) accounts = requested;
      const hasNow = Array.isArray(accounts) && accounts.some(a => String(a).toLowerCase() === target);
      if (!hasNow) {
        throw new Error(
          `Wallet mismatch. Expected ${expectedAddress}, got ${accounts?.[0] || 'no account'}.`
        );
      }
    }
  }

  return accounts?.length > 0 ? provider.getSigner(accounts[0]) : provider.getSigner();
}

/** EIP-6963 cache expus pentru debug */
export function getEip6963Cache() { return [..._eip6963Cache]; }
