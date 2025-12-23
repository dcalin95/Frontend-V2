import { useState, useEffect } from 'react';
import getCurrentBitsPrice from '../../../Presale/BITSAnalytics/common/getCurrentBitsPrice';

/**
 * Hook pentru prețuri LIVE crypto - FĂRĂ FALLBACK HARDCODAT!
 * ✅ Folosește componenta existentă pentru BITS price
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
      
      // Try Binance first (faster, no rate limit) - Use 24h ticker for price changes
      try {
        console.log('🔄 Fetching from Binance 24h Ticker API...');
        const response = await fetch(
          'https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","BNBUSDT","ETHUSDT","STXUSDT"]'
        );
        
        if (response.ok) {
          const data = await response.json();
          
          // Fetch BITS price from contract
          const bitsPrice = await fetchBitsPrice();
          
          const binancePrices = {
            BTC: parseFloat(data.find(t => t.symbol === 'BTCUSDT')?.lastPrice) || null,
            BNB: parseFloat(data.find(t => t.symbol === 'BNBUSDT')?.lastPrice) || null,
            ETH: parseFloat(data.find(t => t.symbol === 'ETHUSDT')?.lastPrice) || null,
            STX: parseFloat(data.find(t => t.symbol === 'STXUSDT')?.lastPrice) || null,
            USDT: 1.00,
            BITS: bitsPrice,
          };
          
          const binanceChanges = {
            BTC: parseFloat(data.find(t => t.symbol === 'BTCUSDT')?.priceChangePercent) || 0,
            BNB: parseFloat(data.find(t => t.symbol === 'BNBUSDT')?.priceChangePercent) || 0,
            ETH: parseFloat(data.find(t => t.symbol === 'ETHUSDT')?.priceChangePercent) || 0,
            STX: parseFloat(data.find(t => t.symbol === 'STXUSDT')?.priceChangePercent) || 0,
            USDT: 0,
            BITS: 0, // BITS doesn't have 24h data
          };
          
          console.log('✅ LIVE PRICES FROM BINANCE + CONTRACT:', binancePrices);
          console.log('📊 24H PRICE CHANGES:', binanceChanges);
          
          // Verifică dacă prețurile CRITICE sunt valide (BTC, BNB, ETH)
          // ✅ BITS nu este obligatoriu aici (vine separat din useCellManagerData în SwapPanel)
          const allValid = binancePrices.BTC && binancePrices.BNB && binancePrices.ETH;
          
          if (!allValid) {
            console.error('❌ Some critical prices are NULL! Cannot proceed!');
            setError('Failed to fetch critical prices');
            setSource('ERROR');
            setPrices({});
            setPriceChanges({});
            setLoading(false);
            return;
          }
          
          // ⚠️ BITS poate fi null și e ok - se ia din useCellManagerData
          if (!binancePrices.BITS) {
            console.warn('⚠️ BITS price is NULL, but continuing with other prices...');
          }
          
          setPrices(binancePrices);
          setPriceChanges(binanceChanges);
          setSource('Binance API + Contract');
          setError(null);
          setLoading(false);
          return;
        }
      } catch (binanceError) {
        console.error('❌ Binance API failed:', binanceError.message);
      }

      // Fallback to CoinGecko
      console.log('🔄 Fetching from CoinGecko API...');
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,binancecoin,ethereum,stacks&vs_currencies=usd'
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
      
      // ✅ BITS nu este obligatoriu - se ia separat din useCellManagerData
      const allValid = coingeckoPrices.BTC && coingeckoPrices.BNB && coingeckoPrices.ETH;
      
      if (!allValid) {
        throw new Error('Some critical CoinGecko prices are NULL');
      }
      
      if (!coingeckoPrices.BITS) {
        console.warn('⚠️ BITS price is NULL from CoinGecko, but continuing...');
      }
      
      const coingeckoChanges = {
        BTC: 0,
        BNB: 0,
        ETH: 0,
        STX: 0,
        USDT: 0,
        BITS: 0,
      };
      
      console.log('✅ LIVE PRICES FROM COINGECKO + CONTRACT:', coingeckoPrices);
      setPrices(coingeckoPrices);
      setPriceChanges(coingeckoChanges); // CoinGecko simple/price doesn't have 24h change
      setSource('CoinGecko API + Contract');
      setError(null);
    } catch (err) {
      console.error('❌ ALL APIs FAILED:', err);
      setError(err.message);
      setSource('ERROR');
      setPrices({}); // ❌ FĂRĂ FALLBACK HARDCODAT!
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

