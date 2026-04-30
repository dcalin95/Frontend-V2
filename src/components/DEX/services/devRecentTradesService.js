/**
 * DEV MODE – External API Service for Recent Trades
 * ⚠️ TEMPORARY: This service will be replaced by backend API when deployed
 *
 * Purpose: Generate realistic recent trades data for development/testing
 * Note: Public APIs don't provide real-time trade streams, so we simulate realistic trades
 * APIs Used: CoinGecko API (browser-friendly, for price estimation only)
 *
 * IMPORTANT: Binance API is NOT browser-safe (CORS restrictions).
 * Binance APIs should be used ONLY behind a proxy/backend later.
 * For DEV MODE, we use CoinGecko for price data (browser-friendly) and simulate trades.
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
    'ADA': 'cardano',
    'SOL': 'solana',
    'XRP': 'ripple',
    'DOT': 'polkadot',
    'DOGE': 'dogecoin',
    'MATIC': 'matic-network',
    'LINK': 'chainlink',
    'LTC': 'litecoin',
    'AVAX': 'avalanche-2',
    'UNI': 'uniswap',
  };
  const symbol = token?.symbol || token;
  return ids[symbol] || 'bitcoin';
};

/**
 * Simple deterministic hash for pair (seed for randomness)
 * DEV MODE – Helper function for stable trade simulation
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
 * DEV MODE – Generate realistic recent trades simulation from current price
 * Will be replaced by backend API which provides real trade stream
 * Uses deterministic randomness per pair for stability
 */
const generateRecentTrades = (currentPrice, count = 20, seed = 0) => {
  const now = Date.now();
  const trades = [];
  const priceVariationPercent = 0.15; // ±0.15% price variation
  const minAmount = 0.01;
  const maxAmount = 50;
  const timeStepMs = 3000; // 3 seconds between trades

  // Simple seeded RNG for deterministic randomness
  const seededRandom = (index) => {
    const x = Math.sin(seed + index) * 10000;
    return x - Math.floor(x);
  };

  for (let i = 0; i < count; i++) {
    const timeAgo = (count - i) * timeStepMs;
    const randomFactor = seededRandom(i);
    const priceVariation = currentPrice * priceVariationPercent * (randomFactor - 0.5) / 100;
    const price = Math.max(0.0001, currentPrice + priceVariation);
    
    // Amount varies with deterministic randomness
    const amount = minAmount + (maxAmount - minAmount) * seededRandom(i + count);
    
    // Side alternates more deterministically (based on seed + index)
    const isBuy = seededRandom(i + count * 2) > 0.5;
    
    trades.push({
      id: `dev-trade-${now - timeAgo}-${i}`,
      price: Math.round(price * 10000) / 10000, // Round to 4 decimals
      size: Math.round(amount * 100) / 100, // Round to 2 decimals (using 'size' to match component)
      timestamp: now - timeAgo, // Using 'timestamp' to match component
      side: isBuy ? 'buy' : 'sell'
    });
  }

  return trades.sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp descending (newest first)
};

/**
 * DEV MODE – Recent Trades Service
 * Simulates recent trades from browser-friendly API data
 * ⚠️ TEMPORARY: Will be replaced by backend API
 */
const devRecentTradesService = {
  /**
   * Get recent trades for trading pair
   * DEV MODE – Simulates trades from CoinGecko price data (browser-friendly)
   */
  async getRecentTrades(tokenIn, tokenOut, limit = 20) {
    try {
      // Fetch current price from CoinGecko
      const currentPrice = await fetchCurrentPrice(tokenIn, tokenOut);

      // Generate realistic trade simulation with deterministic seed
      const seed = getPairSeed(tokenIn, tokenOut);
      const trades = generateRecentTrades(currentPrice, limit, seed);

      console.log('DEV MODE – Simulated recent trades from CoinGecko price:', {
        tokenIn: tokenIn?.symbol || tokenIn,
        tokenOut: tokenOut?.symbol || tokenOut,
        currentPrice,
        tradesCount: trades.length
      });

      return trades;
    } catch (error) {
      console.error('DEV MODE – Recent trades generation failed:', error);
      // Return empty array on error (fallback)
      return [];
    }
  }
};

export default devRecentTradesService;
