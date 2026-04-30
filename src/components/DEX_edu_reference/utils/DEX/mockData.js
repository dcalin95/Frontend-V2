/**
 * 🎭 Mock Data - DOAR PENTRU TESTE (jest), NU pentru DEX UI/flux.
 *
 * INTERZIS: import în componente DEX sau în fluxuri de date DEX.
 * DEX folosește exclusiv date reale (API, wallet, blockchain). Vezi docs/DATA_POLICY.md.
 * Acest fișier există doar pentru teste unitare (__tests__) care mock-uiesc servicii.
 */

/**
 * Generate mock chart data for performance
 */
export const generateMockChartData = (period = '30d') => {
  const days = period === '1d' ? 24 : period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
  const data = [];
  const now = new Date();
  
  let cumulative = 0;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate random P/L value
    const value = (Math.random() * 2000 - 1000) * (0.5 + Math.random()); // -1000 to 1000
    cumulative += value;
    
    data.push({
      date: date.toISOString().split('T')[0],
      timestamp: date.getTime(),
      value: Math.round(value * 100) / 100,
      cumulative: Math.round(cumulative * 100) / 100,
      pnl: Math.round(value * 100) / 100,
      totalProfit: Math.round(cumulative * 100) / 100
    });
  }
  
  return data;
};

/**
 * Mock metrics data
 */
export const getMockMetrics = () => ({
  totalProfit: 12345.67,
  totalLoss: -2345.67,
  netProfit: 10000.00,
  winRate: 65.5,
  totalTrades: 150,
  winningTrades: 98,
  losingTrades: 52,
  averageWin: 125.89,
  averageLoss: -45.12,
  profitFactor: 2.79,
  sharpeRatio: 1.85,
  maxDrawdown: -12.5,
  returnOnInvestment: 15.8
});

/**
 * Mock risk metrics data
 */
export const getMockRiskMetrics = () => ({
  maxDrawdown: -12.5,
  maxDrawdownDuration: 5,
  volatility: 8.5,
  sharpeRatio: 1.85,
  sortinoRatio: 2.15,
  calmarRatio: 1.26,
  valueAtRisk: -2500.00,
  expectedShortfall: -3200.00,
  beta: 0.85,
  alpha: 2.5
});

/**
 * Mock charts data structure
 */
export const getMockChartsData = (period = '30d') => ({
  data: generateMockChartData(period),
  history: generateMockChartData(period),
  period,
  generatedAt: new Date().toISOString()
});

/**
 * Mock AI Trading status
 */
export const getMockAITradingStatus = () => ({
  isRunning: false,
  status: 'stopped',
  startedAt: null,
  stoppedAt: new Date().toISOString(),
  currentStrategy: null,
  activeSignals: 0
});

/**
 * Mock AI Trading stats
 */
export const getMockAITradingStats = () => ({
  totalTrades: 150,
  winningTrades: 98,
  losingTrades: 52,
  winRate: 65.33,
  totalProfit: 12345.67,
  totalLoss: -2345.67,
  netProfit: 10000.00,
  averageProfit: 82.30,
  maxProfit: 1250.00,
  maxLoss: -450.00,
  profitFactor: 2.79,
  sharpeRatio: 1.85
});

/**
 * Mock orderbook data for Trade page
 */
export const getMockOrderbook = () => {
  const generateOrders = (side, count, basePrice, spread = 50) => {
    const orders = [];
    for (let i = 0; i < count; i++) {
      const priceOffset = (Math.random() * spread * (side === 'asks' ? 1 : -1));
      const price = basePrice + priceOffset;
      const amount = Math.random() * 10 + 0.1;
      orders.push({
        price: Number(price.toFixed(2)),
        amount: Number(amount.toFixed(4)),
        total: Number((price * amount).toFixed(2))
      });
    }
    return orders.sort((a, b) => side === 'asks' ? a.price - b.price : b.price - a.price);
  };

  const basePrice = 45000; // BTC price example
  return {
    bids: generateOrders('bids', 15, basePrice),
    asks: generateOrders('asks', 15, basePrice),
    lastPrice: basePrice,
    spread: 12.5,
    updatedAt: new Date().toISOString()
  };
};

/**
 * Mock market stats data
 */
export const getMockMarketStats = () => ({
  pair: 'BTC/USDT',
  price: 45000.50,
  priceChange24h: 2.5,
  priceChangePercent24h: 2.5,
  high24h: 45500.00,
  low24h: 44200.00,
  volume24h: 1250000000,
  volume24hUSDT: 1250000000,
  marketCap: 850000000000,
  liquidity: 45000000000,
  trades24h: 125000,
  updatedAt: new Date().toISOString()
});

/**
 * Mock trading pairs list (extended)
 */
export const getMockTradingPairs = () => [
  { symbol: 'BTC/USDT', baseToken: 'BTC', quoteToken: 'USDT', price: 45000.50, change24h: 2.5, volume24h: 1250000000, volume24hFormatted: '1.25B' },
  { symbol: 'ETH/USDT', baseToken: 'ETH', quoteToken: 'USDT', price: 2850.25, change24h: 1.8, volume24h: 850000000, volume24hFormatted: '850M' },
  { symbol: 'BNB/USDT', baseToken: 'BNB', quoteToken: 'USDT', price: 320.75, change24h: -0.5, volume24h: 250000000, volume24hFormatted: '250M' },
  { symbol: 'SOL/USDT', baseToken: 'SOL', quoteToken: 'USDT', price: 98.50, change24h: 3.2, volume24h: 180000000, volume24hFormatted: '180M' },
  { symbol: 'MATIC/USDT', baseToken: 'MATIC', quoteToken: 'USDT', price: 0.85, change24h: -1.2, volume24h: 45000000, volume24hFormatted: '45M' },
  { symbol: 'AVAX/USDT', baseToken: 'AVAX', quoteToken: 'USDT', price: 35.20, change24h: 2.1, volume24h: 75000000, volume24hFormatted: '75M' },
  { symbol: 'BITS/USDT', baseToken: 'BITS', quoteToken: 'USDT', price: 0.001, change24h: 5.2, volume24h: 15000000, volume24hFormatted: '15M' },
  { symbol: 'BTC/ETH', baseToken: 'BTC', quoteToken: 'ETH', price: 15.79, change24h: 0.7, volume24h: 50000000, volume24hFormatted: '50M' },
  { symbol: 'ETH/BNB', baseToken: 'ETH', quoteToken: 'BNB', price: 8.89, change24h: 2.3, volume24h: 30000000, volume24hFormatted: '30M' },
  { symbol: 'USDC/USDT', baseToken: 'USDC', quoteToken: 'USDT', price: 1.00, change24h: 0.01, volume24h: 200000000, volume24hFormatted: '200M' }
];

/**
 * Mock tokens list for TokenSelector
 */
export const getMockTokens = () => [
  { symbol: 'BTC', name: 'Bitcoin', balance: '0.5', price: 45000, chain: 'BSC' },
  { symbol: 'ETH', name: 'Ethereum', balance: '10.25', price: 2850, chain: 'BSC' },
  { symbol: 'BNB', name: 'Binance Coin', balance: '50.0', price: 320, chain: 'BSC' },
  { symbol: 'USDT', name: 'Tether', balance: '50000.0', price: 1, chain: 'BSC' },
  { symbol: 'USDC', name: 'USD Coin', balance: '25000.0', price: 1, chain: 'BSC' },
  { symbol: 'SOL', name: 'Solana', balance: '100.5', price: 98.5, chain: 'BSC' },
  { symbol: 'MATIC', name: 'Polygon', balance: '5000.0', price: 0.85, chain: 'BSC' },
  { symbol: 'AVAX', name: 'Avalanche', balance: '200.0', price: 35.2, chain: 'BSC' },
  { symbol: 'BITS', name: 'BitSwapDEX Token', balance: '5000000.0', price: 0.001, chain: 'BSC' },
  { symbol: 'LINK', name: 'Chainlink', balance: '500.0', price: 14.5, chain: 'BSC' },
  { symbol: 'UNI', name: 'Uniswap', balance: '1000.0', price: 6.2, chain: 'BSC' },
  { symbol: 'ADA', name: 'Cardano', balance: '5000.0', price: 0.45, chain: 'BSC' },
  { symbol: 'DOT', name: 'Polkadot', balance: '2000.0', price: 7.2, chain: 'BSC' },
  { symbol: 'XRP', name: 'Ripple', balance: '10000.0', price: 0.52, chain: 'BSC' },
  { symbol: 'DOGE', name: 'Dogecoin', balance: '50000.0', price: 0.08, chain: 'BSC' },
  { symbol: 'SHIB', name: 'Shiba Inu', balance: '10000000.0', price: 0.000008, chain: 'BSC' },
  { symbol: 'ATOM', name: 'Cosmos', balance: '500.0', price: 9.5, chain: 'BSC' },
  { symbol: 'ALGO', name: 'Algorand', balance: '5000.0', price: 0.18, chain: 'BSC' },
  { symbol: 'NEAR', name: 'NEAR Protocol', balance: '1000.0', price: 3.2, chain: 'BSC' },
  { symbol: 'FTM', name: 'Fantom', balance: '5000.0', price: 0.35, chain: 'BSC' }
];

/**
 * Mock swap/trade data
 */
export const getMockSwapData = () => ({
  fromToken: { symbol: 'BTC', balance: 0.5, price: 45000 },
  toToken: { symbol: 'USDT', balance: 12500, price: 1 },
  rate: 45000,
  slippage: 0.5,
  fee: 0.1,
  estimatedOutput: 22500
});

/**
 * Mock portfolio overview data
 */
export const getMockPortfolio = () => ({
  totalValue: 125000.50,
  totalValueChange24h: 2.5,
  totalValueChangePercent24h: 2.5,
  holdings: [
    { symbol: 'BTC', amount: 0.5, value: 22500, change24h: 2.5 },
    { symbol: 'ETH', amount: 10, value: 28500, change24h: 1.8 },
    { symbol: 'BNB', amount: 50, value: 16037.50, change24h: -0.5 },
    { symbol: 'BITS', amount: 5000000, value: 5000, change24h: 5.2 },
    { symbol: 'USDT', amount: 50000, value: 50000, change24h: 0 }
  ],
  updatedAt: new Date().toISOString()
});

/**
 * Mock recent activity/trades
 */
export const getMockRecentActivity = () => {
  const activities = [];
  const types = ['buy', 'sell', 'swap', 'deposit', 'withdraw'];
  const tokens = ['BTC', 'ETH', 'BNB', 'BITS', 'USDT'];
  
  for (let i = 0; i < 10; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const token = tokens[Math.floor(Math.random() * tokens.length)];
    const amount = Math.random() * 10 + 0.1;
    const price = Math.random() * 50000 + 1000;
    const date = new Date();
    date.setHours(date.getHours() - i);
    
    activities.push({
      id: `activity-${i}`,
      type,
      token,
      amount: Number(amount.toFixed(4)),
      price: Number(price.toFixed(2)),
      value: Number((amount * price).toFixed(2)),
      timestamp: date.toISOString(),
      status: Math.random() > 0.2 ? 'completed' : 'pending'
    });
  }
  
  return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

/**
 * Mock quick stats for dashboard
 */
export const getMockQuickStats = () => ({
  totalProfit: 12345.67,
  totalTrades: 150,
  winRate: 65.5,
  activePositions: 5,
  totalVolume: 1250000,
  avgTradeSize: 8333.33,
  bestTrade: 1250.00,
  worstTrade: -450.00
});

/**
 * Mock limit orders data
 */
export const getMockLimitOrders = () => {
  const orders = [];
  const types = ['buy', 'sell'];
  const tokens = ['BTC', 'ETH', 'BNB', 'BITS'];
  const statuses = ['active', 'filled', 'cancelled'];
  
  for (let i = 0; i < 15; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const token = tokens[Math.floor(Math.random() * tokens.length)];
    const basePrice = type === 'buy' ? 40000 : 45000;
    const price = basePrice + (Math.random() * 5000 - 2500);
    const amount = Math.random() * 2 + 0.1;
    const date = new Date();
    date.setHours(date.getHours() - Math.floor(Math.random() * 48));
    
    orders.push({
      id: `limit-order-${i}`,
      type,
      token,
      pair: `${token}/USDT`,
      price: Number(price.toFixed(2)),
      amount: Number(amount.toFixed(4)),
      total: Number((price * amount).toFixed(2)),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdAt: date.toISOString(),
      filledAt: Math.random() > 0.5 ? new Date(date.getTime() + Math.random() * 3600000).toISOString() : null,
      filledAmount: Math.random() > 0.5 ? Number((amount * Math.random()).toFixed(4)) : 0
    });
  }
  
  return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

/**
 * Mock current market price for a token
 */
export const getMockMarketPrice = (token = 'BTC') => {
  const prices = {
    BTC: 42500,
    ETH: 2850,
    BNB: 320,
    BITS: 0.001
  };
  return prices[token] || 1000;
};

/**
 * Mock AI Trading Intents (for Intent Selection)
 */
export const getMockAITradingIntents = () => [
  {
    id: 'buy',
    type: 'buy',
    label: 'Buy',
    description: 'Purchase tokens based on AI analysis',
    icon: '📈',
    color: '#22c55e',
    confidence: 85,
    reasoning: 'Strong bullish signals detected',
    recommendedTokens: ['BTC', 'ETH', 'BNB'],
    riskLevel: 'medium'
  },
  {
    id: 'sell',
    type: 'sell',
    label: 'Sell',
    description: 'Sell tokens based on AI analysis',
    icon: '📉',
    color: '#ef4444',
    confidence: 72,
    reasoning: 'Bearish trend identified',
    recommendedTokens: ['MATIC', 'AVAX'],
    riskLevel: 'low'
  },
  {
    id: 'hold',
    type: 'hold',
    label: 'Hold',
    description: 'Maintain current positions',
    icon: '⏸️',
    color: '#f59e0b',
    confidence: 65,
    reasoning: 'Market conditions uncertain',
    recommendedTokens: [],
    riskLevel: 'low'
  },
  {
    id: 'swap',
    type: 'swap',
    label: 'Swap',
    description: 'Swap tokens based on AI recommendations',
    icon: '🔄',
    color: '#4facfe',
    confidence: 78,
    reasoning: 'Better opportunities in other pairs',
    recommendedTokens: ['BTC', 'ETH'],
    riskLevel: 'medium'
  }
];

/**
 * Mock AI Trading Strategies (for Strategy Configuration)
 */
export const getMockAITradingStrategies = () => [
  {
    id: 'momentum',
    name: 'Momentum Trading',
    description: 'Trade based on price momentum and trends',
    type: 'momentum',
    riskLevel: 'medium',
    winRate: 68.5,
    avgProfit: 125.50,
    parameters: {
      lookbackPeriod: 14,
      momentumThreshold: 1.5,
      stopLoss: 2.0,
      takeProfit: 5.0
    },
    isActive: false,
    isTemplate: true
  },
  {
    id: 'mean-reversion',
    name: 'Mean Reversion',
    description: 'Trade when price deviates from mean',
    type: 'mean-reversion',
    riskLevel: 'low',
    winRate: 72.3,
    avgProfit: 95.20,
    parameters: {
      lookbackPeriod: 20,
      deviationThreshold: 2.0,
      stopLoss: 1.5,
      takeProfit: 3.0
    },
    isActive: false,
    isTemplate: true
  },
  {
    id: 'arbitrage',
    name: 'Arbitrage',
    description: 'Exploit price differences across markets',
    type: 'arbitrage',
    riskLevel: 'low',
    winRate: 85.0,
    avgProfit: 45.80,
    parameters: {
      minPriceDiff: 0.5,
      maxSlippage: 0.3,
      executionSpeed: 'fast'
    },
    isActive: false,
    isTemplate: true
  },
  {
    id: 'scalping',
    name: 'Scalping',
    description: 'Quick trades for small profits',
    type: 'scalping',
    riskLevel: 'high',
    winRate: 55.2,
    avgProfit: 25.30,
    parameters: {
      entryTimeframe: 1,
      exitTimeframe: 5,
      minProfit: 0.1,
      maxLoss: 0.2
    },
    isActive: false,
    isTemplate: true
  }
];

/**
 * Mock Risk Limits (for Risk Gating)
 */
export const getMockRiskLimits = () => ({
  maxPercentPerTrade: 5.0,
  maxPercentPerDay: 10.0,
  dailyLossLimit: 1000.0,
  maxDrawdown: 20.0,
  maxPositionSize: 50000.0,
  minLiquidity: 100000.0,
  maxSlippage: 1.0,
  requireStopLoss: true,
  requireTakeProfit: false,
  maxLeverage: 1.0,
  riskScoreThreshold: 70
});