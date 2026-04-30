/**
 * HeaderTokenContext - SSOT pentru tokenul selectat în header
 *
 * Când utilizatorul schimbă perechea în selectorul din header, valoarea se propagă
 * peste tot (Trade, Swap, OTA Trade, Leverage). Persistență în localStorage.
 *
 * @module HeaderTokenContext
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'dex_header_selected_token';
const DEFAULT_TOKEN = 'BNB';

const HeaderTokenContext = createContext(null);

export function HeaderTokenProvider({ children }) {
  const [selectedToken, setSelectedTokenState] = useState(() => {
    try {
      const stored = typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY);
      return stored && stored.trim() ? stored.trim() : DEFAULT_TOKEN;
    } catch (_) {
      return DEFAULT_TOKEN;
    }
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && selectedToken) {
        window.localStorage.setItem(STORAGE_KEY, selectedToken);
      }
    } catch (_) {}
  }, [selectedToken]);

  const setSelectedToken = useCallback((token) => {
    setSelectedTokenState((prev) => (typeof token === 'function' ? token(prev) : token) || DEFAULT_TOKEN);
  }, []);

  const value = { selectedToken, setSelectedToken };

  return (
    <HeaderTokenContext.Provider value={value}>
      {children}
    </HeaderTokenContext.Provider>
  );
}

export function useHeaderToken() {
  const ctx = useContext(HeaderTokenContext);
  if (!ctx) {
    return [DEFAULT_TOKEN, () => {}];
  }
  return [ctx.selectedToken, ctx.setSelectedToken];
}

export default HeaderTokenContext;
