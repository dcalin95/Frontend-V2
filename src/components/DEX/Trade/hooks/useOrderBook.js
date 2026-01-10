/**
 * 📊 useOrderBook Hook
 * 
 * Hook pentru order book data
 */

import { useState, useEffect } from 'react';

const useOrderBook = (tokenIn, tokenOut) => {
  const [bids, setBids] = useState([]);
  const [asks, setAsks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tokenIn || !tokenOut) {
      setBids([]);
      setAsks([]);
      setLoading(false);
      return;
    }

    // Mock data - replace with real API call
    const fetchOrderBook = async () => {
      setLoading(true);
      try {
        // TODO: Replace with real API call
        // const response = await orderBookService.getOrderBook(tokenIn, tokenOut);
        
        // Mock data
        const mockBids = Array.from({ length: 10 }, (_, i) => ({
          price: 0.123 - (i * 0.001),
          size: Math.random() * 100,
          total: 0
        }));

        const mockAsks = Array.from({ length: 10 }, (_, i) => ({
          price: 0.124 + (i * 0.001),
          size: Math.random() * 100,
          total: 0
        }));

        setBids(mockBids);
        setAsks(mockAsks);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderBook();

    // Poll for updates every 2 seconds
    const interval = setInterval(fetchOrderBook, 2000);

    return () => clearInterval(interval);
  }, [tokenIn, tokenOut]);

  return { bids, asks, loading, error };
};

export default useOrderBook;

