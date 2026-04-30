/**
 * 📊 useRecentTrades Hook
 * 
 * Hook pentru recent trades data
 * DEV MODE – Uses CoinGecko API to simulate trades (browser-friendly), will be replaced by backend
 * NOTE: Binance API is NOT browser-safe (CORS) - used only behind backend/proxy
 */

import { useState, useEffect, useRef } from 'react';
import devRecentTradesService from '../../services/devRecentTradesService';

const useRecentTrades = (tokenIn, tokenOut, limit = 20) => {
  const [recentTrades, setRecentTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!tokenIn || !tokenOut) {
      setRecentTrades([]);
      setLoading(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // DEV MODE – External API simulation, will be replaced by backend
    const fetchRecentTrades = async () => {
      setLoading(true);
      try {
        // DEV MODE – External API, will be replaced by backend
        const trades = await devRecentTradesService.getRecentTrades(tokenIn, tokenOut, limit);
        setRecentTrades(trades || []);
        setError(null);
      } catch (err) {
        console.error('DEV MODE – Recent trades fetch error:', err);
        setError(err.message);
        // Don't clear trades on error, keep last valid data
      } finally {
        setLoading(false);
      }
    };

    fetchRecentTrades();

    // Poll for updates every 4 seconds (DEV MODE) - safer rate
    // Pause polling when tab is hidden to reduce unnecessary requests
    let interval;
    const startPolling = () => {
      interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchRecentTrades();
        }
      }, 4000);
    };
    
    startPolling();
    intervalRef.current = interval;
    
    // Pause/resume based on visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Fetch immediately when tab becomes visible
        fetchRecentTrades();
        // Restart polling
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(() => {
          if (document.visibilityState === 'visible') {
            fetchRecentTrades();
          }
        }, 4000);
      } else {
        // Pause polling when tab is hidden
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [tokenIn, tokenOut, limit]);

  return { recentTrades, loading, error };
};

export default useRecentTrades;
