/**
 * 📊 useMarketData Hook
 * 
 * Hook pentru market data (24h stats)
 * DEV MODE – Uses CoinGecko API (browser-friendly), will be replaced by backend
 * NOTE: Binance API is NOT browser-safe (CORS) - used only behind backend/proxy
 */

import { useState, useEffect } from 'react';
import devMarketDataService from '../../services/devMarketDataService';

const useMarketData = (tokenIn, tokenOut) => {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tokenIn || !tokenOut) {
      setMarketData(null);
      setLoading(false);
      return;
    }

    const fetchMarketData = async () => {
      setLoading(true);
      try {
        // DEV MODE – External API, will be replaced by backend
        const data = await devMarketDataService.getMarketData(tokenIn, tokenOut);
        setMarketData(data);
        setError(null);
      } catch (err) {
        console.error('DEV MODE – Market data fetch error:', err);
        setError(err.message);
        // Don't set marketData to null on error, keep last valid data
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();

    // Poll for updates every 5 seconds (DEV MODE)
    // Pause polling when tab is hidden to reduce unnecessary requests
    let interval;
    const startPolling = () => {
      interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchMarketData();
        }
      }, 5000);
    };
    
    startPolling();
    
    // Pause/resume based on visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchMarketData(); // Immediate update when tab becomes visible
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [tokenIn, tokenOut]);

  return { marketData, loading, error };
};

export default useMarketData;

