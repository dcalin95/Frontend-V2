/**
 * 📊 useOrderBook Hook
 * 
 * Hook pentru order book data
 * DEV MODE – Uses CoinGecko API to simulate orderbook (browser-friendly), will be replaced by backend
 * NOTE: Binance API is NOT browser-safe (CORS) - used only behind backend/proxy
 */

import { useState, useEffect } from 'react';
import devOrderBookService from '../../services/devOrderBookService';

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

    // DEV MODE – External API simulation, will be replaced by backend
    const fetchOrderBook = async () => {
      setLoading(true);
      try {
        // DEV MODE – External API, will be replaced by backend
        const data = await devOrderBookService.getOrderBook(tokenIn, tokenOut);
        setBids(data.bids || []);
        setAsks(data.asks || []);
        setError(null);
      } catch (err) {
        console.error('DEV MODE – Orderbook fetch error:', err);
        setError(err.message);
        // Don't clear bids/asks on error, keep last valid data
      } finally {
        setLoading(false);
      }
    };

    fetchOrderBook();

    // Poll for updates every 4 seconds (DEV MODE) - safer rate
    // Pause polling when tab is hidden to reduce unnecessary requests
    let interval;
    const startPolling = () => {
      interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchOrderBook();
        }
      }, 4000);
    };
    
    startPolling();
    
    // Pause/resume based on visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchOrderBook(); // Immediate update when tab becomes visible
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [tokenIn, tokenOut]);

  return { bids, asks, loading, error };
};

export default useOrderBook;

