/**
 * 📋 Constants - Frontend Constants
 * 
 * Constants pentru frontend:
 * - API endpoints
 * - Status values
 * - Configuration
 * - Enums
 * 
 * @module constants
 */

// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000/api';
export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';

// Feature Flags
export const ENABLE_AI_TRADING = process.env.REACT_APP_ENABLE_AI_TRADING !== 'false';
export const ENABLE_STRATEGIES = process.env.REACT_APP_ENABLE_STRATEGIES !== 'false';
export const ENABLE_SIGNALS = process.env.REACT_APP_ENABLE_SIGNALS !== 'false';
export const ENABLE_PERFORMANCE = process.env.REACT_APP_ENABLE_PERFORMANCE !== 'false';
export const ENABLE_EXECUTION = process.env.REACT_APP_ENABLE_EXECUTION !== 'false';

// AI Trading Status
export const BOT_STATUS = {
  STOPPED: 'stopped',
  RUNNING: 'running',
  PAUSED: 'paused',
  ERROR: 'error'
};

// Trade Status
export const TRADE_STATUS = {
  PENDING: 'pending',
  EXECUTED: 'executed',
  FAILED: 'failed',
  CLOSED: 'closed'
};

// Signal Types
export const SIGNAL_TYPES = {
  BUY: 'buy',
  SELL: 'sell',
  HOLD: 'hold'
};

// Strategy Types
export const STRATEGY_TYPES = {
  CONSERVATIVE: 'conservative',
  BALANCED: 'balanced',
  AGGRESSIVE: 'aggressive',
  CUSTOM: 'custom'
};

// Risk Levels
export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

// Time Periods
export const TIME_PERIODS = {
  '1D': '1d',
  '7D': '7d',
  '30D': '30d',
  '90D': '90d',
  '1Y': '1y',
  ALL: 'all'
};

// Chart Types
export const CHART_TYPES = {
  LINE: 'line',
  AREA: 'area',
  BAR: 'bar',
  CANDLESTICK: 'candlestick'
};

// Colors (Theme)
export const COLORS = {
  PRIMARY: '#6366f1',
  SECONDARY: '#8b5cf6',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#3b82f6',
  DARK: '#1f2937',
  LIGHT: '#f9fafb'
};

// API Endpoints
export const API_ENDPOINTS = {
  // AI Trading
  AI_TRADING_START: '/ai-trading/start',
  AI_TRADING_STOP: '/ai-trading/stop',
  AI_TRADING_STATUS: '/ai-trading/status',
  AI_TRADING_STATS: '/ai-trading/stats',
  AI_TRADING_ANALYZE: '/ai-trading/analyze',
  
  // Strategies
  STRATEGIES_LIST: '/ai-trading/strategies',
  STRATEGIES_CREATE: '/ai-trading/strategies',
  STRATEGIES_UPDATE: (id) => `/ai-trading/strategies/${id}`,
  STRATEGIES_DELETE: (id) => `/ai-trading/strategies/${id}`,
  STRATEGIES_ENABLE: (id) => `/ai-trading/strategies/${id}/enable`,
  STRATEGIES_DISABLE: (id) => `/ai-trading/strategies/${id}/disable`,
  
  // Signals
  SIGNALS_LIST: '/ai-trading/signals',
  SIGNALS_GET: (id) => `/ai-trading/signals/${id}`,
  SIGNALS_GENERATE: '/ai-trading/signals/generate',
  SIGNALS_VALIDATE: (id) => `/ai-trading/signals/${id}/validate`,
  
  // Execution
  EXECUTION_EXECUTE: '/ai-trading/execution/execute',
  EXECUTION_TRADES: '/ai-trading/execution/trades',
  EXECUTION_TRADE: (id) => `/ai-trading/execution/trades/${id}`,
  EXECUTION_CANCEL: (id) => `/ai-trading/execution/trades/${id}/cancel`,
  
  // Performance
  PERFORMANCE_METRICS: '/ai-trading/performance/metrics',
  PERFORMANCE_RISK: '/ai-trading/performance/risk-metrics',
  PERFORMANCE_HISTORY: '/ai-trading/performance/history',
  PERFORMANCE_CHARTS: '/ai-trading/performance/charts',
  
  // Health
  HEALTH: '/health'
};

// Default Values
export const DEFAULT_VALUES = {
  RISK_LIMITS: {
    MAX_PERCENT_PER_TRADE: 5.0,
    MAX_OPEN_POSITIONS: 5,
    DAILY_LOSS_LIMIT: 10.0,
    STOP_LOSS_DEFAULT: 3.0,
    TAKE_PROFIT_DEFAULT: 6.0,
    MAX_DRAWDOWN: 20.0,
    MIN_CONFIDENCE: 0.65
  },
  PAGINATION: {
    LIMIT: 50,
    OFFSET: 0
  },
  REFRESH_INTERVAL: 30000 // 30 seconds
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Unauthorized. Please log in.',
  FORBIDDEN: 'Forbidden. You don\'t have permission.',
  NOT_FOUND: 'Resource not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Validation error. Please check your input.',
  UNKNOWN_ERROR: 'An unknown error occurred.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  BOT_STARTED: 'AI Trading Bot started successfully',
  BOT_STOPPED: 'AI Trading Bot stopped successfully',
  STRATEGY_CREATED: 'Strategy created successfully',
  STRATEGY_UPDATED: 'Strategy updated successfully',
  STRATEGY_DELETED: 'Strategy deleted successfully',
  TRADE_EXECUTED: 'Trade executed successfully',
  SIGNAL_GENERATED: 'Signal generated successfully'
};

// Bitcoin Token Support (Oxium-inspired)
export { 
  BITCOIN_TOKENS,
  BITCOIN_TOKEN_ADDRESSES,
  BITCOIN_TOKEN_SYMBOLS,
  isBitcoinToken,
  areBitcoinEquivalents,
  getMostLiquidBitcoinToken,
  isBitcoinArbitragePair,
  getBitcoinTokenForPromise,
  getEquivalentBitcoinToken,
  isMostLiquidBitcoinToken,
  getAllBitcoinTokens,
  getBitcoinTokenByAddress,
  getBitcoinTokenBySymbol,
  getBitcoinTokenName,
  getBitcoinTokenSymbol,
  isBitcoinPair,
  getBestBitcoinTokenForTrade,
  formatBitcoinTokenForDisplay
} from './bitcoinTokens';

