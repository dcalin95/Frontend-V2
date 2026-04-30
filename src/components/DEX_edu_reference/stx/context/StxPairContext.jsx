/**
 * StxPairContext – Perechea de trade (ex: STX/USDA) partajată între header și StxTradePage.
 */

import React, { createContext, useContext, useState } from 'react';

const StxPairContext = createContext(null);

export function StxPairProvider({ children }) {
  const [pair, setPair] = useState('STX/USDA');
  const value = { pair, setPair };
  return <StxPairContext.Provider value={value}>{children}</StxPairContext.Provider>;
}

export function useStxPair() {
  const ctx = useContext(StxPairContext);
  if (!ctx) throw new Error('useStxPair must be used within StxPairProvider');
  return ctx;
}
