/**
 * DEV MODE – External API Service for Order Book Data
 * ⚠️ TEMPORARY: This service will be replaced by backend API when deployed
 * 
 * Purpose: Simulate orderbook data from browser-friendly APIs for development/testing
 * Note: Public APIs don't provide full orderbook, so we simulate realistic orderbook
 * APIs Used: CoinGecko API (browser-friendly, for price estimation)
 * 
 * IMPORTANT: Binance API is NOT browser-safe (CORS restrictions).
 * Binance APIs should be used ONLY behind a proxy/backend later.
 * For DEV MODE, we use CoinGecko for price data (browser-friendly).
 */

// DEV MODE – External API, will be replaced by backend
const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

/**
 * Get CoinGecko ID for token
 * DEV MODE – Helper function for browser-friendly API
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
 * Simple deterministic hash for pair (seed for randomness)
 * DEV MODE – Helper function for stable orderbook simulation
 */
const getPairSeed = (tokenIn, tokenOut) => {
  const pairKey = `${tokenIn?.symbol || tokenIn}/${tokenOut?.symbol || tokenOut}`;
  let hash = 0;
  for (let i = 0; i < pairKey.length; i++) {
    hash = ((hash << 5) - hash) + pairKey.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

/**
 * DEV MODE – Generate realistic orderbook simulation from current price
 * Will be replaced by backend API which provides real orderbook
 * Uses deterministic randomness per pair for stability
 */
const generateOrderBookFromPrice = (currentPrice, baseVolume = 100, seed = 0) => {
  const numLevels = 10;
  const spreadPercent = 0.1; // 0.1% spread
  const priceStepPercent = 0.05; // 0.05% between levels
  const minVolume = 0.1;
  const maxVolume = baseVolume * 2; // Clamp max volume
  
  // Simple seeded RNG for deterministic randomness
  const seededRandom = (index) => {
    const x = Math.sin(seed + index) * 10000;
    return x - Math.floor(x);
  };
  
  const midPrice = currentPrice;
  const spread = midPrice * (spreadPercent / 100);
  const bestBid = midPrice - spread / 2;
  const bestAsk = midPrice + spread / 2;
  
  // Generate bids (descending from best bid)
  const bids = Array.from({ length: numLevels }, (_, i) => {
    const priceOffset = i * (midPrice * priceStepPercent / 100);
    const price = bestBid - priceOffset;
    // Size decreases with distance from best bid (deterministic randomness)
    const randomFactor = 0.9 + seededRandom(i) * 0.2;
    const size = Math.min(
      Math.max(
        baseVolume * Math.pow(0.8, i) * randomFactor,
        minVolume
      ),
      maxVolume
    );
    
    return {
      price: Math.max(price, bestBid * 0.95), // Don't go too far down
      size: size
    };
  }).sort((a, b) => b.price - a.price); // Sort descending
  
  // Generate asks (ascending from best ask)
  const asks = Array.from({ length: numLevels }, (_, i) => {
    const priceOffset = i * (midPrice * priceStepPercent / 100);
    const price = bestAsk + priceOffset;
    // Size decreases with distance from best ask (deterministic randomness)
    const randomFactor = 0.9 + seededRandom(i + numLevels) * 0.2;
    const size = Math.min(
      Math.max(
        baseVolume * Math.pow(0.8, i) * randomFactor,
        minVolume
      ),
      maxVolume
    );
    
    return {
      price: Math.min(price, bestAsk * 1.05), // Don't go too far up
      size: size
    };
  }).sort((a, b) => a.price - b.price); // Sort ascending
  
  return { bids, asks };
};

/**
 * DEV MODE – Fetch current price from CoinGecko (browser-friendly)
 * Will be replaced by backend API
 */
const fetchCurrentPrice = async (tokenIn, tokenOut) => {
  try {
    const inId = getCoinGeckoId(tokenIn);
    const outId = getCoinGeckoId(tokenOut);
    
    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/price?ids=${inId},${outId}&vs_currencies=usd`
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    const inPrice = data[inId]?.usd || 0;
    const outPrice = data[outId]?.usd || 1;
    
    if (!inPrice || !outPrice) {
      throw new Error('CoinGecko price data incomplete');
    }
    
    // Calculate exchange rate
    return inPrice / outPrice;
  } catch (error) {
    console.error('DEV MODE – CoinGecko price fetch error:', error);
    throw error;
  }
};

/**
 * DEV MODE – Estimate volume from CoinGecko (browser-friendly)
 * Will be replaced by backend API
 */
const estimateVolume = async (tokenIn, tokenOut) => {
  try {
    const inId = getCoinGeckoId(tokenIn);
    
    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/price?ids=${inId}&vs_currencies=usd&include_24hr_vol=true`
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    const volume = data[inId]?.usd_24h_vol || 0;
    
    // Estimate per-level volume (divide by levels and time)
    return Math.max(volume / (24 * 60 * 60 * 10), 10); // Average per second per level, min 10
  } catch (error) {
    console.warn('DEV MODE – Volume estimation failed, using default:', error);
    return 100; // Default base volume
  }
};

/**
 * DEV MODE – Order Book Service
 * Simulates orderbook from browser-friendly API data
 * ⚠️ TEMPORARY: Will be replaced by backend API
 */
const devOrderBookService = {
  /**
   * Get orderbook for trading pair
   * DEV MODE – Simulates orderbook from CoinGecko price data (browser-friendly)
   */
  async getOrderBook(tokenIn, tokenOut) {
    try {
      // Fetch current price and volume estimate from CoinGecko
      const [currentPrice, baseVolume] = await Promise.all([
        fetchCurrentPrice(tokenIn, tokenOut),
        estimateVolume(tokenIn, tokenOut)
      ]);
      
      // Generate realistic orderbook simulation with deterministic seed
      const seed = getPairSeed(tokenIn, tokenOut);
      const { bids, asks } = generateOrderBookFromPrice(currentPrice, baseVolume, seed);
      
      console.log('DEV MODE – Simulated orderbook from CoinGecko price:', {
        tokenIn: tokenIn?.symbol || tokenIn,
        tokenOut: tokenOut?.symbol || tokenOut,
        currentPrice,
        bids: bids.length,
        asks: asks.length
      });
      
      return {
        bids,
        asks,
        timestamp: Date.now(),
        source: 'coingecko_simulated'
      };
    } catch (error) {
      console.error('DEV MODE – Orderbook generation failed:', error);
      throw new Error('Failed to fetch orderbook (DEV MODE)');
    }
  }
};

export default devOrderBookService;
