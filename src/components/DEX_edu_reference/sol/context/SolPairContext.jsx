/**
 * SolPairContext – Perechea de trade (ex: SOL/USDC) partajată între header și SolTradePage.
 */

import React, { createContext, useContext, useState } from 'react';

const SolPairContext = createContext(null);

export function SolPairProvider({ children }) {
  const [pair, setPair] = useState('SOL/USDC');
  const value = { pair, setPair };
  return <SolPairContext.Provider value={value}>{children}</SolPairContext.Provider>;
}

export function useSolPair() {
  const ctx = useContext(SolPairContext);
  if (!ctx) throw new Error('useSolPair must be used within SolPairProvider');
  return ctx;
}
