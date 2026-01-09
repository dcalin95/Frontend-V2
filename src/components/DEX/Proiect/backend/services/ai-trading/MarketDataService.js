/**
 * 📊 Market Data Service - Market Data Fetching
 * 
 * Fetch market data pentru AI Trading:
 * - Price data (real-time și historical)
 * - Volume data
 * - Technical indicators
 * - Market statistics
 * 
 * @module MarketDataService
 */

const logger = require('../../utils/logger');

// Use node-fetch pentru Node.js < 18, sau global fetch pentru Node.js >= 18
let fetch;
try {
  // Try to use global fetch (Node.js >= 18)
  if (typeof globalThis.fetch === 'function') {
    fetch = globalThis.fetch;
  } else {
    // Fallback to node-fetch pentru versiuni mai vechi
    fetch = require('node-fetch');
  }
} catch (e) {
  // If node-fetch is not installed, use a simple wrapper
  logger.warn('Fetch not available, install node-fetch or use Node.js >= 18');
  fetch = require('node-fetch').default || require('node-fetch');
}

class MarketDataService {
  constructor() {
    // API endpoints
    this.coinGeckoAPI = 'https://api.coingecko.com/api/v3';
    this.pancakeSwapAPI = 'https://api.pancakeswap.info/api/v2';
    
    // Cache (pentru performance)
    this.cache = new Map();
    this.cacheTTL = 60000; // 1 minute TTL

    // Supported tokens (BSC) - cu Bitcoin support (Oxium-inspired)
    this.supportedTokens = {
      'BTC': 'bitcoin',
      'WBTC': 'bitcoin', // Wrapped Bitcoin - same price as BTC
      'BTCB': 'bitcoin', // Binance-Pegged Bitcoin - same price as BTC
      'ETH': 'ethereum',
      'BNB': 'binancecoin',
      'USDT': 'tether',
      'USDC': 'usd-coin',
      'BUSD': 'binance-usd',
      'BITS': 'bits' // TODO: Add CoinGecko ID dacă e listat
    };
    
    // Bitcoin tokens mapping (Oxium-inspired)
    this.bitcoinTokens = require('../../utils/bitcoinTokens');
  }

  /**
   * Get market data pentru un token (cu Bitcoin support - Oxium-inspired)
   * @param {string} token - Token symbol (BTC, WBTC, BTCB, ETH, BNB, etc.) sau address
   * @param {boolean} includeIndicators - Include technical indicators (default: true)
   * @returns {Promise<Object>} Market data
   */
  async getMarketData(token, includeIndicators = true) {
    try {
      // Check dacă e Bitcoin token (Oxium-inspired)
      const isBitcoin = this.bitcoinTokens.isBitcoinToken(token) || 
                        this.bitcoinTokens.getBitcoinTokenBySymbol(token);
      
      // Normalize Bitcoin token pentru CoinGecko (toate folosesc 'bitcoin' ID)
      let normalizedToken = token;
      if (isBitcoin) {
        const bitcoinToken = this.bitcoinTokens.getBitcoinTokenBySymbol(token) || 
                            this.bitcoinTokens.getBitcoinTokenByAddress(token);
        if (bitcoinToken) {
          normalizedToken = 'BTC'; // Use BTC pentru CoinGecko (same price pentru WBTC/BTCB)
        }
      }
      
      // Check cache (doar dacă nu avem nevoie de indicators noi)
      const cached = includeIndicators ? null : this.getCached(normalizedToken);
      if (cached) {
        // Add Bitcoin-specific info dacă e Bitcoin token
        if (isBitcoin) {
          cached.isBitcoin = true;
          cached.bitcoinToken = this.bitcoinTokens.formatBitcoinTokenForDisplay(token);
        }
        return cached;
      }

      // Fetch de la CoinGecko (cu historical data dacă avem nevoie de indicators)
      const coinGeckoData = await this.fetchFromCoinGecko(normalizedToken, includeIndicators);

      // Fetch de la PancakeSwap (dacă e token BSC)
      const pancakeSwapData = await this.fetchFromPancakeSwap(token);

      // Combine data
      const marketData = this.combineMarketData(coinGeckoData, pancakeSwapData);
      
      // Add Bitcoin-specific info dacă e Bitcoin token (Oxium-inspired)
      if (isBitcoin) {
        marketData.isBitcoin = true;
        marketData.bitcoinToken = this.bitcoinTokens.formatBitcoinTokenForDisplay(token);
        marketData.isMostLiquid = this.bitcoinTokens.isMostLiquidBitcoinToken(token);
      }

      // Calculate indicators dacă e necesar
      let indicators = {};
      if (includeIndicators) {
        indicators = await this.calculateIndicators(token, marketData, coinGeckoData.historical);
      }

      // Combine all
      const result = {
        token,
        price: marketData.price,
        price24h: marketData.price24h,
        change24h: marketData.change24h,
        volume24h: marketData.volume24h,
        marketCap: marketData.marketCap,
        indicators: includeIndicators ? indicators : {},
        timestamp: Date.now()
      };

      // Cache result (fără indicators pentru performance)
      if (!includeIndicators) {
        this.setCached(token, result);
      }

      return result;
    } catch (error) {
      logger.error(`Error fetching market data for ${token}:`, error);
      throw error;
    }
  }

  /**
   * Fetch data de la CoinGecko
   * @private
   */
  async fetchFromCoinGecko(token, includeHistorical = false) {
    const coinId = this.supportedTokens[token];
    if (!coinId) {
      throw new Error(`Token ${token} not supported`);
    }

    try {
      // Fetch current price și 24h stats
      const response = await fetch(
        `${this.coinGeckoAPI}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch from CoinGecko: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const tokenData = data[coinId];

      const result = {
        price: tokenData.usd || 0,
        change24h: tokenData.usd_24h_change || 0,
        volume24h: tokenData.usd_24h_vol || 0,
        marketCap: tokenData.usd_market_cap || 0
      };

      // Fetch historical data dacă e necesar (pentru indicators)
      if (includeHistorical) {
        try {
          const historicalResponse = await fetch(
            `${this.coinGeckoAPI}/coins/${coinId}/market_chart?vs_currency=usd&days=7&interval=hourly`
          );

          if (historicalResponse.ok) {
            const historicalData = await historicalResponse.json();
            result.historical = historicalData.prices || [];
          }
        } catch (histError) {
          logger.warn('Error fetching historical data from CoinGecko:', histError);
          // Continue without historical data
        }
      }

      return result;
    } catch (error) {
      logger.error('Error fetching from CoinGecko:', error);
      throw error;
    }
  }

  /**
   * Fetch data de la PancakeSwap
   * @private
   */
  async fetchFromPancakeSwap(token) {
    // TODO: Implementation
    // 1. Get PancakeSwap pair address
    // 2. Fetch price data
    // 3. Fetch volume
    // 4. Return formatted data

    // For now, return empty (va fi implementat când avem pair addresses)
    return {
      price: null,
      volume24h: null
    };
  }

  /**
   * Combine market data din multiple sources
   * @private
   */
  combineMarketData(coinGeckoData, pancakeSwapData) {
    // Priority: PancakeSwap > CoinGecko (pentru BSC tokens)
    return {
      price: pancakeSwapData.price || coinGeckoData.price,
      price24h: coinGeckoData.price24h || null,
      change24h: coinGeckoData.change24h || 0,
      volume24h: pancakeSwapData.volume24h || coinGeckoData.volume24h || 0,
      marketCap: coinGeckoData.marketCap || null
    };
  }

  /**
   * Calculate technical indicators
   * @private
   */
  async calculateIndicators(token, marketData, historicalPrices = null) {
    try {
      // 1. Get historical prices (dacă nu sunt provided)
      let prices = [];
      if (historicalPrices && Array.isArray(historicalPrices) && historicalPrices.length > 0) {
        // Format: [[timestamp, price], ...]
        prices = historicalPrices.map(([timestamp, price]) => parseFloat(price));
      } else {
        // Fallback: Use current price cu aproximări simple
        prices = [parseFloat(marketData.price || 0)];
      }

      // Ne trebuie cel puțin 50 de puncte pentru calculare corectă
      // Pentru acum, calculăm cu ce avem (sau folosim aproximări)
      if (prices.length < 50) {
        // Duplicăm ultimul preț pentru a avea suficiente date
        while (prices.length < 50) {
          prices.unshift(prices[0] || marketData.price);
        }
      }

      // 2. Calculate SMA (20, 50)
      const sma20 = this.calculateSMA(prices, 20);
      const sma50 = this.calculateSMA(prices, 50);

      // 3. Calculate RSI (14)
      const rsi = this.calculateRSI(prices, 14);

      // 4. Calculate MACD
      const macd = this.calculateMACD(prices, 12, 26, 9);

      // 5. Calculate Bollinger Bands (20, 2)
      const bollingerBands = this.calculateBollingerBands(prices, 20, 2);

      return {
        sma20,
        sma50,
        rsi,
        macd,
        bollingerBands,
        currentPrice: prices[prices.length - 1],
        priceChange: prices.length > 1 ? prices[prices.length - 1] - prices[prices.length - 2] : 0,
        priceChangePercent: prices.length > 1 ? ((prices[prices.length - 1] - prices[prices.length - 2]) / prices[prices.length - 2]) * 100 : 0
      };
    } catch (error) {
      logger.error('Error calculating indicators:', error);
      // Return basic indicators cu current price
      return {
        sma20: marketData.price,
        sma50: marketData.price,
        rsi: 50, // Neutral
        macd: { macd: 0, signal: 0, histogram: 0 },
        bollingerBands: {
          upper: marketData.price * 1.02,
          middle: marketData.price,
          lower: marketData.price * 0.98
        },
        currentPrice: marketData.price,
        error: error.message
      };
    }
  }

  /**
   * Calculate Simple Moving Average (SMA)
   * @private
   */
  calculateSMA(prices, period) {
    if (prices.length < period) {
      return prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    }

    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  }

  /**
   * Calculate Relative Strength Index (RSI)
   * @private
   */
  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) {
      return 50; // Neutral RSI
    }

    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }

    const gains = changes.filter(c => c > 0);
    const losses = changes.filter(c => c < 0).map(c => Math.abs(c));

    if (losses.length === 0) return 100;
    if (gains.length === 0) return 0;

    const avgGain = gains.reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   * @private
   */
  calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    if (prices.length < slowPeriod + signalPeriod) {
      return { macd: 0, signal: 0, histogram: 0 };
    }

    // Calculate EMA (Exponential Moving Average)
    const calculateEMA = (data, period) => {
      const multiplier = 2 / (period + 1);
      let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;

      for (let i = period; i < data.length; i++) {
        ema = (data[i] - ema) * multiplier + ema;
      }

      return ema;
    };

    const fastEMA = calculateEMA(prices, fastPeriod);
    const slowEMA = calculateEMA(prices, slowPeriod);
    const macdLine = fastEMA - slowEMA;

    // Calculate signal line (EMA of MACD)
    // For simplicity, use SMA of recent MACD values
    const recentPrices = prices.slice(-signalPeriod);
    const signalLine = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;

    return {
      macd: macdLine,
      signal: signalLine,
      histogram: macdLine - signalLine
    };
  }

  /**
   * Calculate Bollinger Bands
   * @private
   */
  calculateBollingerBands(prices, period = 20, numStdDev = 2) {
    if (prices.length < period) {
      const avg = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
      return {
        upper: avg * (1 + numStdDev * 0.01),
        middle: avg,
        lower: avg * (1 - numStdDev * 0.01)
      };
    }

    const slice = prices.slice(-period);
    const sma = slice.reduce((a, b) => a + b, 0) / period;

    // Calculate standard deviation
    const variance = slice.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    return {
      upper: sma + (numStdDev * stdDev),
      middle: sma,
      lower: sma - (numStdDev * stdDev)
    };
  }

  /**
   * Get cached data
   * @private
   */
  getCached(token) {
    const cached = this.cache.get(token);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set cached data
   * @private
   */
  setCached(token, data) {
    this.cache.set(token, {
      data,
      timestamp: Date.now()
    });
  }
}

module.exports = new MarketDataService();

