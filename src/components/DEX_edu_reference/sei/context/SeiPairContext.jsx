/**
 * SeiPairContext – Perechea de trade (ex: SEI/USDC) partajată între header și SeiTradePage.
 */

import React, { createContext, useContext, useState } from 'react';

const SeiPairContext = createContext(null);

export function SeiPairProvider({ children }) {
  const [pair, setPair] = useState('SEI/USDC');
  const value = { pair, setPair };
  return <SeiPairContext.Provider value={value}>{children}</SeiPairContext.Provider>;
}

export function useSeiPair() {
  const ctx = useContext(SeiPairContext);
  if (!ctx) throw new Error('useSeiPair must be used within SeiPairProvider');
  return ctx;
}
