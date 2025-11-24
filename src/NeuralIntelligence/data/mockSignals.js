/**
 * Mock data for Neural Intelligence signals
 * Used for development and testing purposes
 */

export const mockStrategies = [
  {
    id: 'trend-following',
    name: 'Trend Following',
    enabled: true,
    riskLevel: 'Balanced',
    description: 'Identifies and follows market momentum using multiple timeframes',
    performance: {
      winRate: 68.5,
      avgProfit: 3.2,
      tradesLast30d: 45
    }
  },
  {
    id: 'mean-reversion',
    name: 'Mean Reversion',
    enabled: false,
    riskLevel: 'Conservative',
    description: 'Profits from price corrections back to statistical average',
    performance: {
      winRate: 72.1,
      avgProfit: 1.8,
      tradesLast30d: 23
    }
  },
  {
    id: 'arbitrage',
    name: 'Arbitrage (Simple)',
    enabled: true,
    riskLevel: 'Conservative',
    description: 'Exploits price differences across multiple exchanges',
    performance: {
      winRate: 91.2,
      avgProfit: 0.8,
      tradesLast30d: 156
    }
  },
  {
    id: 'volume-analysis',
    name: 'Volume Analysis',
    enabled: false,
    riskLevel: 'Aggressive',
    description: 'Trades based on volume patterns and orderbook depth',
    performance: {
      winRate: 58.3,
      avgProfit: 5.7,
      tradesLast30d: 12
    }
  }
];

export const mockRiskLimits = {
  maxPercentPerTrade: 2.5,
  maxOpenPositions: 3,
  dailyLossLimit: 5.0,
  stopLossDefault: 2.0,
  takeProfitDefault: 5.0
};

