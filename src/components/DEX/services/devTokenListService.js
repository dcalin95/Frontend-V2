/**
 * DEV MODE – External API Service for Token List
 * ⚠️ TEMPORARY: This service will be replaced by backend API when deployed
 * 
 * Purpose: Fetch popular tokens from browser-friendly APIs for development/testing
 * APIs Used: CoinGecko API (browser-friendly, CORS-enabled)
 * 
 * IMPORTANT: Binance API is NOT browser-safe (CORS restrictions).
 * Binance APIs should be used ONLY behind a proxy/backend later.
 * For DEV MODE, we use CoinGecko only (browser-friendly).
 */

// DEV MODE – External API, will be replaced by backend
const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

/**
 * Popular token IDs for CoinGecko
 * DEV MODE – Helper mapping for common tokens
 */
const POPULAR_TOKEN_IDS = [
  'bitcoin', 'ethereum', 'tether', 'binancecoin', 'cardano',
  'solana', 'ripple', 'polkadot', 'dogecoin', 'matic-network',
  'stacks', 'chainlink', 'litecoin', 'avalanche-2', 'uniswap'
];

/**
 * Symbol to CoinGecko ID mapping
 * DEV MODE – Helper function for token lookup
 */
const SYMBOL_TO_ID = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDT': 'tether',
  'BNB': 'binancecoin',
  'ADA': 'cardano',
  'SOL': 'solana',
  'XRP': 'ripple',
  'DOT': 'polkadot',
  'DOGE': 'dogecoin',
  'MATIC': 'matic-network',
  'STX': 'stacks',
  'LINK': 'chainlink',
  'LTC': 'litecoin',
  'AVAX': 'avalanche-2',
  'UNI': 'uniswap'
};

/**
 * ID to symbol mapping
 * DEV MODE – Helper function for symbol lookup
 */
const ID_TO_SYMBOL = Object.fromEntries(
  Object.entries(SYMBOL_TO_ID).map(([symbol, id]) => [id, symbol])
);

/**
 * Get token icon URL (generic fallback)
 * DEV MODE – Helper function for token icons
 */
const getTokenIconUrl = (symbol) => {
  // Generic icon URLs (can be replaced with actual token icons)
  const iconUrls = {
    'BTC': 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    'ETH': 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    'USDT': 'https://cryptologos.cc/logos/tether-usdt-logo.png',
    'BNB': 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
    'STX': 'https://cryptologos.cc/logos/stacks-stx-logo.png',
  };
  return iconUrls[symbol] || `https://cryptologos.cc/logos/${symbol.toLowerCase()}-${symbol.toLowerCase()}-logo.png`;
};

/**
 * DEV MODE – Fetch popular tokens from CoinGecko
 * Will be replaced by backend API
 */
const fetchPopularTokens = async () => {
  try {
    // Fetch token data with prices
    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/price?ids=${POPULAR_TOKEN_IDS.join(',')}&vs_currencies=usd&include_24hr_change=true`
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform CoinGecko data to token list format
    const tokens = POPULAR_TOKEN_IDS
      .map((id) => {
        const tokenData = data[id];
        if (!tokenData) return null;
        
        const symbol = ID_TO_SYMBOL[id] || id.toUpperCase();
        const price = tokenData.usd || 0;
        
        return {
          symbol: symbol,
          name: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' '),
          icon: getTokenIconUrl(symbol),
          price: price,
          change24h: tokenData.usd_24h_change || 0
        };
      })
      .filter(token => token !== null);
    
    return tokens;
  } catch (error) {
    console.error('DEV MODE – CoinGecko token fetch error:', error);
    throw error;
  }
};

/**
 * DEV MODE – Token List Service
 * Fetches popular tokens from browser-friendly APIs
 * ⚠️ TEMPORARY: Will be replaced by backend API
 */
const devTokenListService = {
  /**
   * Get popular tokens list
   * DEV MODE – Uses CoinGecko API (browser-friendly)
   */
  async getPopularTokens() {
    try {
      const tokens = await fetchPopularTokens();
      console.log('DEV MODE – Popular tokens from CoinGecko:', tokens.length, 'tokens');
      return tokens;
    } catch (error) {
      console.error('DEV MODE – Token list fetch failed:', error);
      // Return fallback tokens on error
      return [
        { symbol: 'BTC', name: 'Bitcoin', icon: getTokenIconUrl('BTC'), price: 0 },
        { symbol: 'ETH', name: 'Ethereum', icon: getTokenIconUrl('ETH'), price: 0 },
        { symbol: 'USDT', name: 'Tether USD', icon: getTokenIconUrl('USDT'), price: 0 },
        { symbol: 'BNB', name: 'Binance Coin', icon: getTokenIconUrl('BNB'), price: 0 }
      ];
    }
  }
};

export default devTokenListService;
