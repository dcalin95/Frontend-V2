/**
 * 📈 Binance API Helper - Date Reale pentru Charts
 * 
 * Folosim Binance API public pentru date reale în development
 * Când vom deploya backend-ul propriu, vom înlocui cu endpoint-uri proprii
 * 
 * DOCUMENTAȚIE BACKEND: Vezi DEX_BACKEND_API_PLAN.md
 */

/**
 * Get historical klines data from Binance
 * @param {string} symbol - Trading symbol (e.g., 'BTCUSDT')
 * @param {string} interval - Kline interval (1m, 5m, 15m, 1h, 4h, 1d, etc.)
 * @param {number} limit - Number of data points (max 1000)
 * @returns {Promise<Array>} Array of kline data
 */
export const getBinanceKlines = async (symbol = 'BTCUSDT', interval = '1d', limit = 30) => {
  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform Binance klines to our format
    return data.map((kline) => ({
      timestamp: kline[0], // Open time
      date: new Date(kline[0]).toISOString().split('T')[0],
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5]),
      // For performance charts, use close price as value
      value: parseFloat(kline[4]), // Close price
      cumulative: 0 // Will be calculated later
    }));
  } catch (error) {
    console.error('[Binance API] Error fetching klines:', error);
    throw error;
  }
};

/**
 * Get 24h ticker data (current price + 24h change)
 * @param {string} symbol - Trading symbol (e.g., 'BTCUSDT')
 * @returns {Promise<Object>} Ticker data
 */
export const getBinanceTicker = async (symbol = 'BTCUSDT') => {
  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`
    );
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      symbol: data.symbol,
      price: parseFloat(data.lastPrice),
      priceChange: parseFloat(data.priceChange),
      priceChangePercent: parseFloat(data.priceChangePercent),
      high: parseFloat(data.highPrice),
      low: parseFloat(data.lowPrice),
      volume: parseFloat(data.volume),
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('[Binance API] Error fetching ticker:', error);
    throw error;
  }
};

/**
 * Generate performance chart data from Binance klines
 * @param {string} symbol - Trading symbol (e.g., 'BTCUSDT')
 * @param {string} period - Period (1d, 7d, 30d, 90d, 1y, all)
 * @returns {Promise<Array>} Formatted chart data with cumulative P/L simulation
 */
export const getBinanceChartData = async (symbol = 'BTCUSDT', period = '30d') => {
  try {
    // Map period to Binance interval and limit
    const periodMap = {
      '1d': { interval: '1h', limit: 24 },
      '7d': { interval: '4h', limit: 42 },
      '30d': { interval: '1d', limit: 30 },
      '90d': { interval: '1d', limit: 90 },
      '1y': { interval: '1w', limit: 52 },
      'all': { interval: '1M', limit: 100 }
    };
    
    const config = periodMap[period] || periodMap['30d'];
    const klines = await getBinanceKlines(symbol, config.interval, config.limit);
    
    if (klines.length === 0) {
      return [];
    }
    
    // Calculate cumulative P/L simulation (for demo purposes)
    // In production, this will come from actual trading data
    const firstPrice = klines[0].close;
    let cumulative = 0;
    
    return klines.map((kline, index) => {
      // Calculate cumulative P/L simulation (for demo purposes)
      // In production, this will come from actual trading data
      cumulative += (kline.close - (klines[index - 1]?.close || firstPrice)) * 10; // Simulate 10 units
      
      return {
        date: kline.date,
        timestamp: kline.timestamp,
        value: Math.round((kline.close - firstPrice) * 100) / 100, // Daily P/L
        cumulative: Math.round(cumulative * 100) / 100,
        pnl: Math.round((kline.close - firstPrice) * 100) / 100,
        totalProfit: Math.round(cumulative * 100) / 100,
        price: kline.close,
        volume: kline.volume
      };
    });
  } catch (error) {
    console.error('[Binance API] Error generating chart data:', error);
    throw error;
  }
};

/**
 * Symbol mapping for our tokens to Binance symbols
 */
export const SYMBOL_MAP = {
  'BTC': 'BTCUSDT',
  'ETH': 'ETHUSDT',
  'BNB': 'BNBUSDT',
  'USDT': 'USDTUSDT',
  'BITS': 'BTCUSDT' // Fallback to BTC for BITS
};
