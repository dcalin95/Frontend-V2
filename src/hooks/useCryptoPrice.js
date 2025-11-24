import { useState, useEffect } from 'react';

/**
 * Hook pentru obținerea prețurilor crypto în timp real
 * Folosește CoinGecko API (gratuit, fără API key)
 * 
 * @param {string[]} coinIds - Array de coin IDs (ex: ['bitcoin', 'ethereum', 'binancecoin'])
 * @returns {Object} { prices, loading, error, refresh }
 */
export const useCryptoPrice = (coinIds = ['bitcoin']) => {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const idsString = coinIds.join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${idsString}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch prices');
      }
      
      const data = await response.json();
      setPrices(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching crypto prices:', err);
      setError(err.message);
      
      // Fallback prices
      const fallbackPrices = {};
      coinIds.forEach(id => {
        fallbackPrices[id] = {
          usd: id === 'bitcoin' ? 43250 : id === 'ethereum' ? 2280 : 1,
          usd_24h_change: 2.3
        };
      });
      setPrices(fallbackPrices);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPrices, 30000);
    
    return () => clearInterval(interval);
  }, [coinIds.join(',')]);

  return {
    prices,
    loading,
    error,
    refresh: fetchPrices
  };
};

/**
 * Hook pentru calcularea valorii swap bazată pe prețuri live
 * 
 * @param {string} fromToken - Token de la care faci swap
 * @param {string} toToken - Token la care faci swap  
 * @param {number} amount - Cantitate
 * @returns {Object} { value, rate, loading }
 */
export const useSwapCalculator = (fromToken, toToken, amount) => {
  const coinIds = [fromToken, toToken].filter(Boolean);
  const { prices, loading } = useCryptoPrice(coinIds);
  
  const [swapValue, setSwapValue] = useState(0);
  const [rate, setRate] = useState(0);

  useEffect(() => {
    if (!loading && prices[fromToken] && prices[toToken] && amount > 0) {
      const fromPrice = prices[fromToken].usd;
      const toPrice = prices[toToken].usd;
      
      // Calculate swap rate
      const swapRate = fromPrice / toPrice;
      setRate(swapRate);
      
      // Calculate output amount
      const output = amount * swapRate;
      setSwapValue(output);
    } else {
      setSwapValue(0);
      setRate(0);
    }
  }, [fromToken, toToken, amount, prices, loading]);

  return {
    value: swapValue,
    rate: rate,
    loading,
    fromPrice: prices[fromToken]?.usd || 0,
    toPrice: prices[toToken]?.usd || 0
  };
};

export default useCryptoPrice;

