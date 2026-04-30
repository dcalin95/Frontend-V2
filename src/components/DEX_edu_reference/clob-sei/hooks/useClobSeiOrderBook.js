/**
 * useClobSeiOrderBook – hook pentru order book CLOB SEI (Mangrove).
 * Citește bids/asks din chain; refresh la interval sau manual.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getOrderBook } from '../services/orderBookService';
import { CLOB_SEI_MARKETS } from '../config';

const REFRESH_MS = 15000;
const DEFAULT_MARKET_ID = CLOB_SEI_MARKETS[0]?.id || 'wSEI-USDC';

export function useClobSeiOrderBook(marketId = DEFAULT_MARKET_ID, options = {}) {
  const { refreshIntervalMs = REFRESH_MS, enabled = true } = options;
  const market = CLOB_SEI_MARKETS.find((m) => m.id === marketId) || CLOB_SEI_MARKETS[0];
  const hasFetchedOnce = useRef(false);

  const [asks, setAsks] = useState([]);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  /** True doar după fetch reușit: ambele părți au răspuns și nu există oferte. */
  const [isEmptyBook, setIsEmptyBook] = useState(false);

  const fetchBook = useCallback(async (isManualRefresh = false) => {
    if (!market?.outboundAddress || !market?.inboundAddress) {
      setError('Market config missing');
      setIsEmptyBook(false);
      setLoading(false);
      return;
    }
    setError(null);
    setIsEmptyBook(false);
    const showLoading = !hasFetchedOnce.current || isManualRefresh;
    if (showLoading) setLoading(true);
    try {
      const { asks: a, bids: b } = await getOrderBook({
        baseAddress: market.outboundAddress,
        quoteAddress: market.inboundAddress,
        tickSpacing: market.tickSpacing ?? 1,
        depth: 50,
      });
      setAsks(Array.isArray(a) ? a : []);
      setBids(Array.isArray(b) ? b : []);
      setIsEmptyBook(a.length === 0 && b.length === 0);
      hasFetchedOnce.current = true;
    } catch (e) {
      setError(e?.message || 'Failed to load order book');
      setIsEmptyBook(false);
      setAsks([]);
      setBids([]);
    } finally {
      setLoading(false);
    }
  }, [market?.id, market?.outboundAddress, market?.inboundAddress, market?.tickSpacing]);

  useEffect(() => {
    hasFetchedOnce.current = false;
  }, [marketId]);

  useEffect(() => {
    if (!enabled) return;
    fetchBook(false);
    const id = setInterval(() => fetchBook(false), refreshIntervalMs);
    return () => clearInterval(id);
  }, [enabled, fetchBook, refreshIntervalMs]);

  const refresh = useCallback(() => fetchBook(true), [fetchBook]);

  return { asks, bids, loading, error, refresh, market, isEmptyBook };
}

export default useClobSeiOrderBook;
