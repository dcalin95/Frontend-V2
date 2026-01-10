/**
 * 📊 useMarketData Hook
 * 
 * Hook pentru market data (24h stats)
 */

import { useState, useEffect } from 'react';

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
        // TODO: Replace with real API call
        // const response = await marketDataService.getMarketData(tokenIn, tokenOut);
        
        // Mock data
        const mockData = {
          price: 0.123,
          change24h: -0.0005,
          changePercent24h: -0.41,
          volume24h: 1087413.58,
          high24h: 0.13,
          low24h: 0.12
        };

        setMarketData(mockData);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchMarketData, 5000);

    return () => clearInterval(interval);
  }, [tokenIn, tokenOut]);

  return { marketData, loading, error };
};

export default useMarketData;

