/**
 * ClobSeiMarketContext – perechea (market) selectată pe CLOB SEI.
 * Folosit în Header (selector) și ClobSeiTradePage (chart, order book, form).
 */
import React, { createContext, useContext, useState } from 'react';
import { CLOB_SEI_MARKETS } from '../config';

const defaultMarketId = CLOB_SEI_MARKETS[0]?.id || 'wSEI-USDC';

const ClobSeiMarketContext = createContext({
  marketId: defaultMarketId,
  setMarketId: () => {},
});

export function ClobSeiMarketProvider({ children }) {
  const [marketId, setMarketId] = useState(defaultMarketId);
  return (
    <ClobSeiMarketContext.Provider value={{ marketId, setMarketId }}>
      {children}
    </ClobSeiMarketContext.Provider>
  );
}

export function useClobSeiMarket() {
  const ctx = useContext(ClobSeiMarketContext);
  return ctx;
}
