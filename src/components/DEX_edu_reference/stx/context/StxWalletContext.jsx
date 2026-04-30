/**
 * StxWalletContext – Wallet Stacks (Leather / Hiro) pentru fluxul STX Trade.
 * Complet separat de WalletContext (wagmi/EVM). Folosit doar în rutele /dex-edu/stx/*.
 * @module StxWalletContext
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

const StxWalletContext = createContext(null);

/** Detectează dacă există un wallet Stacks (Leather, Hiro, Xverse). Leather injectează window.LeatherProvider (doc: leather.gitbook.io/developers). */
function getStacksProvider() {
  if (typeof window === 'undefined') return null;
  return window.LeatherProvider || window.Leather || window.leather || window.StacksConnect || null;
}

export function StxWalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [walletType, setWalletType] = useState(null);

  const isConnected = !!address;

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  const connect = useCallback(async () => {
    setError(null);
    setIsConnecting(true);
    try {
      const provider = getStacksProvider();
      if (!provider) {
        setError('Install Leather or Hiro wallet to connect to Stacks.');
        return;
      }
      let addr = null;
      // Leather: window.LeatherProvider.request("getAddresses") → result.addresses[]; găsim adresa cu symbol === 'STX'
      if (typeof provider.request === 'function') {
        const res = await provider.request('getAddresses').catch(() => null);
        if (res?.result?.addresses && Array.isArray(res.result.addresses)) {
          const stxEntry = res.result.addresses.find((a) => a && (a.symbol === 'STX' || a.type === 'stx'));
          addr = stxEntry?.address ?? null;
        }
        if (!addr) {
          const legacy = await provider.request({ method: 'stacks_requestAccounts' }).catch(() => null);
          addr = legacy?.[0] ?? null;
        }
      }
      if (typeof provider.getAddress === 'function' && !addr) {
        addr = await provider.getAddress();
      }
      if (addr) {
        setAddress(addr);
        setWalletType('leather');
      } else {
        setError('Could not get Stacks address from wallet.');
      }
    } catch (err) {
      const msg = err?.message || String(err);
      setError(msg);
      setAddress(null);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setBalance(null);
    setError(null);
    setWalletType(null);
  }, []);

  const value = {
    address,
    shortAddress,
    balance,
    isConnected,
    isConnecting,
    error,
    walletType,
    connect,
    disconnect,
    getStacksProvider,
  };

  return (
    <StxWalletContext.Provider value={value}>
      {children}
    </StxWalletContext.Provider>
  );
}

export function useStxWallet() {
  const ctx = useContext(StxWalletContext);
  if (!ctx) {
    throw new Error('useStxWallet must be used within StxWalletProvider');
  }
  return ctx;
}

export default StxWalletContext;
