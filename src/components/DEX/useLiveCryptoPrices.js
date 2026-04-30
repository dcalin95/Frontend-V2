import { useState, useEffect } from 'react';
import getCurrentBitsPrice from '../../Presale/BITSAnalytics/common/getCurrentBitsPrice';
import backendClient from './services/backendClient';
import { DEX_DATA_SOURCE } from './config/dataSource';

/**
 * Hook pentru prețuri LIVE crypto - DEV MODE with backend integration
 * ✅ Folosește componenta existentă pentru BITS price
 * DEV MODE – Tries backend first, falls back to CoinGecko if backend unavailable
 */
export const useLiveCryptoPrices = () => {
  const [prices, setPrices] = useState({});
  const [priceChanges, setPriceChanges] = useState({}); // 24h % change
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('LOADING...');

  // ✅ Folosește funcția existentă pentru BITS price
  const fetchBitsPrice = async () => {
    try {
      console.log('💰 [useLiveCryptoPrices] Fetching BITS price using existing component...');
      const price = await getCurrentBitsPrice(null, null); // Nu necesită provider/wallet pentru read-only
      console.log(`✅ BITS PRICE from Contract (via existing component): $${price}`);
      return price > 0 ? price : null;
    } catch (error) {
      console.error('❌ Failed to fetch BITS price:', error);
      return null;
    }
  };

  const fetchPrices = async () => {
    try {
      setLoading(true);
      setSource('LOADING...');
      
      // DEV MODE – Check backend health first (if AUTO or BACKEND mode)
      let useBackend = false;
      if (DEX_DATA_SOURCE === 'AUTO' || DEX_DATA_SOURCE === 'BACKEND') {
        try {
          const healthResult = await backendClient.checkBackendHealth();
          if (healthResult.ok) {
            useBackend = true;
            console.log('✅ Backend is healthy, will use backend API');
          } else {
            console.warn('⚠️ Backend health check failed, falling back to CoinGecko:', healthResult.error);
          }
        } catch (healthError) {
          console.warn('⚠️ Backend health check error, falling back to CoinGecko:', healthError);
        }
      }

      // If backend is available and we want to use it, try backend first
      // Note: Backend /market/price doesn't support batch, so for multiple tokens we still use CoinGecko
      // But we verify backend is available first
      if (useBackend && DEX_DATA_SOURCE === 'BACKEND') {
        // For BACKEND-only mode, we could call backend 4 times (inefficient)
        // For now, fall through to CoinGecko (backend is just a proxy anyway)
        console.log('DEV MODE – Backend-only mode, but using CoinGecko for batch (backend is proxy)');
      }

      // DEV MODE – Use CoinGecko (browser-friendly, CORS-enabled)
      // IMPORTANT: Binance API is NOT browser-safe (CORS restrictions)
      // Binance APIs should be used ONLY behind a proxy/backend later
      console.log('🔄 Fetching from CoinGecko API...');
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,binancecoin,ethereum,stacks&vs_currencies=usd&include_24hr_change=true'
      );
      
      if (!response.ok) {
        throw new Error('CoinGecko API failed');
      }
      
      const data = await response.json();
      const bitsPrice = await fetchBitsPrice();
      
      const coingeckoPrices = {
        BTC: data.bitcoin?.usd || null,
        BNB: data.binancecoin?.usd || null,
        ETH: data.ethereum?.usd || null,
        STX: data.stacks?.usd || null,
        USDT: 1.00,
        BITS: bitsPrice,
      };
      
      const coingeckoChanges = {
        BTC: data.bitcoin?.usd_24h_change || 0,
        BNB: data.binancecoin?.usd_24h_change || 0,
        ETH: data.ethereum?.usd_24h_change || 0,
        STX: data.stacks?.usd_24h_change || 0,
        USDT: 0,
        BITS: 0, // BITS doesn't have 24h data
      };
      
      // ✅ BITS nu este obligatoriu - se ia separat din useCellManagerData
      const allValid = coingeckoPrices.BTC && coingeckoPrices.BNB && coingeckoPrices.ETH;
      
      if (!allValid) {
        throw new Error('Some critical CoinGecko prices are NULL');
      }
      
      if (!coingeckoPrices.BITS) {
        console.warn('⚠️ BITS price is NULL from CoinGecko, but continuing...');
      }
      
      // Set source label based on backend availability
      const sourceLabel = useBackend 
        ? 'Backend (available) + CoinGecko + Contract'
        : 'CoinGecko (DEV fallback) + Contract';
      
      console.log(`✅ LIVE PRICES FROM ${sourceLabel}:`, coingeckoPrices);
      setPrices(coingeckoPrices);
      setPriceChanges(coingeckoChanges);
      setSource(sourceLabel);
      setError(null);
    } catch (err) {
      console.error('❌ ALL APIs FAILED:', err);
      setError(err.message);
      setSource('ERROR');
      // Don't block UI - set empty prices but allow component to render
      setPrices({});
      setPriceChanges({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchPrices, 10000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    prices,
    priceChanges,
    loading,
    error,
    source,
    refresh: fetchPrices
  };
};

export default useLiveCryptoPrices;
