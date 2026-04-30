/**
 * DEV MODE – External API Service for Market Data
 * ⚠️ TEMPORARY: This service will be replaced by backend API when deployed
 * 
 * Purpose: Fetch real market data from browser-friendly APIs for development/testing
 * APIs Used: CoinGecko API (browser-friendly, CORS-enabled)
 * 
 * IMPORTANT: Binance API is NOT browser-safe (CORS restrictions).
 * Binance APIs should be used ONLY behind a proxy/backend later.
 * For DEV MODE frontend, we use CoinGecko only (browser-friendly).
 */

// DEV MODE – External API, will be replaced by backend
const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

/**
 * NOTE: Binance symbol mapping removed from browser code
 * Binance APIs are NOT used in browser due to CORS restrictions.
 * CoinGecko uses token IDs directly, no symbol mapping needed.
 */

/**
 * Get CoinGecko ID for token
 * DEV MODE – Helper function for external API
 */
const getCoinGeckoId = (token) => {
  const ids = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'BNB': 'binancecoin',
    'USDT': 'tether',
    'STX': 'stacks',
  };
  const symbol = token?.symbol || token;
  return ids[symbol] || 'bitcoin';
};

/**
 * NOTE: Binance API functions removed from browser code
 * Binance APIs are NOT browser-safe (CORS restrictions).
 * Binance should be used ONLY behind a proxy/backend.
 * For DEV MODE, we use CoinGecko only (browser-friendly).
 */

/**
 * DEV MODE – Fetch market data from CoinGecko (fallback)
 * Will be replaced by backend API
 */
const fetchCoinGeckoMarketData = async (tokenIn, tokenOut) => {
  try {
    const inId = getCoinGeckoId(tokenIn);
    const outId = getCoinGeckoId(tokenOut);
    
    // Fetch both tokens' data
    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/price?ids=${inId},${outId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_last_updated_at=true`
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    const inData = data[inId];
    const outData = data[outId];
    
    if (!inData || !outData) {
      throw new Error('CoinGecko data incomplete');
    }
    
    // Calculate exchange rate
    const exchangeRate = inData.usd / outData.usd;
    const change24h = (inData.usd_24h_change || 0) - (outData.usd_24h_change || 0);
    
    return {
      price: exchangeRate,
      change24h: change24h * exchangeRate / 100, // Approximate USD change
      changePercent24h: change24h,
      volume24h: (inData.usd_24h_vol || 0) * exchangeRate, // Approximate volume
      high24h: exchangeRate * 1.02, // CoinGecko doesn't provide pair high/low
      low24h: exchangeRate * 0.98,
      source: 'coingecko'
    };
  } catch (error) {
    console.error('DEV MODE – CoinGecko API error:', error);
    throw error;
  }
};

/**
 * DEV MODE – Market Data Service
 * Fetches real market data from browser-friendly APIs (CoinGecko primary)
 * ⚠️ TEMPORARY: Will be replaced by backend API
 * 
 * IMPORTANT: Binance API is NOT browser-safe (CORS). CoinGecko is browser-friendly.
 * Binance APIs should be used ONLY behind a proxy/backend later.
 */
const devMarketDataService = {
  /**
   * Get 24h market statistics for trading pair
   * DEV MODE – Uses CoinGecko API (browser-friendly)
   * Binance is NOT used in browser due to CORS restrictions
   */
  async getMarketData(tokenIn, tokenOut) {
    try {
      // Primary: CoinGecko (browser-friendly, CORS-enabled)
      const coingeckoData = await fetchCoinGeckoMarketData(tokenIn, tokenOut);
      console.log('DEV MODE – Market data from CoinGecko:', coingeckoData);
      return coingeckoData;
    } catch (error) {
      console.error('DEV MODE – CoinGecko API failed:', error);
      throw new Error('Failed to fetch market data (DEV MODE)');
    }
  }
};

export default devMarketDataService;
