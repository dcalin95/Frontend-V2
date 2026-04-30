/**
 * SeiWalletContext – Wallet SEI (Keplr/Compass/Leap) pentru fluxul SEI Trade.
 * Complet separat de WalletContext (wagmi/EVM). Folosit doar în rutele /dex-edu/sei/*.
 * @module SeiWalletContext
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { chainConfigs } from '../../bridge/bridgeConfig';

const seiConf = chainConfigs?.sei ?? {};
const SEI_CHAIN_ID = seiConf.chainId || 'pacific-1';
// RPC-uri în ordinea priorității — primul disponibil e folosit
const SEI_RPC_LIST = [
  seiConf.rpcEndpoint,
  'https://rpc.sei-apis.com',
  'https://rpc-sei.stingray.plus',
  'https://sei-rpc.polkachu.com',
].filter(Boolean);
const SEI_RPC = SEI_RPC_LIST[0];
const SEI_REST = seiConf.restEndpoint || 'https://sei-api.polkachu.com';

const SEI_CHAIN_INFO = {
  chainId: SEI_CHAIN_ID,
  chainName: 'Sei',
  rpc: SEI_RPC,
  rest: SEI_REST,
  bip44: { coinType: 118 },
  bech32Config: {
    bech32PrefixAccAddr: 'sei',
    bech32PrefixAccPub: 'seipub',
    bech32PrefixValAddr: 'seivaloper',
    bech32PrefixValPub: 'seivaloperpub',
    bech32PrefixConsAddr: 'seivalcons',
    bech32PrefixConsPub: 'seivalconspub',
  },
  currencies: [{ coinDenom: 'SEI', coinMinimalDenom: 'usei', coinDecimals: 6 }],
  feeCurrencies: [{ coinDenom: 'SEI', coinMinimalDenom: 'usei', coinDecimals: 6 }],
  stakeCurrency: { coinDenom: 'SEI', coinMinimalDenom: 'usei', coinDecimals: 6 },
  features: ['ibc-transfer', 'cosmwasm'],
};

const SeiWalletContext = createContext(null);
const SEI_WALLET_PERSIST_KEY = 'sei_wallet_persist';

/** Returnează instanța wallet corectă pentru un tip dat, direct din window */
function resolveWallet(type) {
  if (typeof window === 'undefined') return null;
  if (type === 'compass') return window.compass || null;
  if (type === 'leap')    return window.leap    || null;
  if (type === 'keplr')  return window.keplr   || null;
  // Fallback autodetect — preferăm Compass (SEI-native) față de Keplr
  return window.compass || window.leap || window.keplr || null;
}

export function SeiWalletProvider({ children }) {
  const [address, setAddress]       = useState(null);
  const [balance, setBalance]       = useState(null);
  /** true cât timp încă încercăm prima citire on-chain (nu echivalent cu sold 0) */
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [chainId, setChainId]       = useState(SEI_CHAIN_ID);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError]           = useState(null);
  const [walletType, setWalletType] = useState(null); // 'keplr' | 'compass' | 'leap'

  const isConnected = !!address;
  const shortAddress = address ? `${address.slice(0, 8)}...${address.slice(-6)}` : '';

  /** Returnează wallet-ul activ (respectă walletType setat la connect) */
  const getKeplr = useCallback(() => resolveWallet(walletType), [walletType]);

  /** OfflineSigner pentru CosmJS — folosește wallet-ul activ */
  const getOfflineSigner = useCallback(async () => {
    const wallet = resolveWallet(walletType);
    if (!wallet) return null;
    try {
      await wallet.enable(SEI_CHAIN_ID);
      return wallet.getOfflineSigner?.(SEI_CHAIN_ID)
          ?? wallet.getOfflineSignerOnly?.(SEI_CHAIN_ID)
          ?? null;
    } catch (e) {
      console.warn('[SeiWallet] getOfflineSigner failed:', e?.message);
      return null;
    }
  }, [walletType]);

  /** Conectare explicită — userul alege wallet-ul (compass/keplr/leap) */
  const connect = useCallback(async (provider = 'keplr') => {
    setError(null);
    setIsConnecting(true);
    try {
      const wallet = resolveWallet(provider);
      if (!wallet) {
        setError(`${provider} wallet not found. Please install it.`);
        return;
      }
      try { await wallet.experimentalSuggestChain?.(SEI_CHAIN_INFO); } catch (_) {}
      await wallet.enable(SEI_CHAIN_ID);
      const key = await wallet.getKey(SEI_CHAIN_ID);
      if (key?.bech32Address) {
        setAddress(key.bech32Address);
        setChainId(SEI_CHAIN_ID);
        setWalletType(provider);
        try { sessionStorage.setItem(SEI_WALLET_PERSIST_KEY, provider); } catch (_) {}
      } else {
        setError('Could not get SEI address from wallet.');
      }
    } catch (err) {
      setError(err?.message || String(err));
      setAddress(null);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    try { sessionStorage.removeItem(SEI_WALLET_PERSIST_KEY); } catch (_) {}
    setAddress(null);
    setBalance(null);
    setError(null);
    setWalletType(null);
  }, []);

  // Restaurare la mount — folosește wallet-ul salvat, NU default Keplr
  useEffect(() => {
    if (address) return;
    let stored;
    try { stored = sessionStorage.getItem(SEI_WALLET_PERSIST_KEY); } catch (_) { return; }
    if (!stored) return;

    const resolvedType = ['compass', 'leap', 'keplr'].includes(stored) ? stored : 'keplr';
    const wallet = resolveWallet(resolvedType);
    if (!wallet) return;

    setIsConnecting(true);
    setError(null);
    (async () => {
      try { await wallet.experimentalSuggestChain?.(SEI_CHAIN_INFO); } catch (_) {}
      try {
        await wallet.enable(SEI_CHAIN_ID);
        const key = await wallet.getKey(SEI_CHAIN_ID);
        if (key?.bech32Address) {
          setAddress(key.bech32Address);
          setChainId(SEI_CHAIN_ID);
          setWalletType(resolvedType);
        } else {
          sessionStorage.removeItem(SEI_WALLET_PERSIST_KEY);
        }
      } catch (_) {
        try { sessionStorage.removeItem(SEI_WALLET_PERSIST_KEY); } catch (__) {}
      } finally {
        setIsConnecting(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Balanță din blockchain (retry scurt — RPC public poate eșua tranzitoriu)
  useEffect(() => {
    if (!address) {
      setBalance(null);
      setBalanceLoading(false);
      return;
    }
    let cancelled = false;
    setBalanceLoading(true);
    (async () => {
      try {
        // Încearcă fiecare RPC din listă până unul funcționează
        for (const rpcUrl of SEI_RPC_LIST) {
          if (cancelled) break;
          const rpc = rpcUrl.replace(/\/$/, '');
          for (let attempt = 0; attempt < 2 && !cancelled; attempt++) {
            try {
              const client = await CosmWasmClient.connect(rpc);
              const coin = await client.getBalance(address, 'usei');
              if (!cancelled) {
                setBalance(coin ? Number(coin.amount || 0) / 1e6 : 0);
              }
              return;
            } catch (e) {
              if (attempt < 1) await new Promise((r) => setTimeout(r, 600));
            }
          }
        }
        if (!cancelled) setBalance(null);
      } finally {
        if (!cancelled) setBalanceLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [address]);

  return (
    <SeiWalletContext.Provider value={{
      address, shortAddress, balance, balanceLoading, chainId,
      isConnected, isConnecting, error, walletType,
      connect, disconnect, getKeplr, getOfflineSigner, SEI_CHAIN_ID,
    }}>
      {children}
    </SeiWalletContext.Provider>
  );
}

export function useSeiWallet() {
  const ctx = useContext(SeiWalletContext);
  if (!ctx) throw new Error('useSeiWallet must be used within SeiWalletProvider');
  return ctx;
}

export default SeiWalletContext;
