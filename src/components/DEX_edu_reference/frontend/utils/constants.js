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

// API Configuration - Uses centralized apiEndpoints module
/**
 * This module now uses the centralized apiEndpoints module
 * which supports runtime configuration via runtime-config.json
 */
import { getBackendUrl, getApiBaseUrl } from '../../config/apiEndpoints.js';

// Export constants using centralized resolver
export const BACKEND_URL = getBackendUrl();
export const API_BASE_URL = getApiBaseUrl();

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

// API Endpoints - Re-export from SSOT
// NOTE: SSOT is src/config/apiEndpoints.js - import from there directly when possible
// This re-export is kept for backward compatibility with existing imports
export { API_ENDPOINTS } from '../../config/apiEndpoints.js';

/** Estimare taxe rețea (gas) per tranzacție – folosit la Grid și OTA AI Profit pentru profit efectiv (net). */
export const GAS_ESTIMATE_USD_PER_TRADE = {
  evm: 0.47,
  nonEvm: 0.005
};
/** Plafon: nr max de „deschideri” folosit la estimarea gas (evită 90+ USD când lista are multe rânduri fără PnL). */
export const GAS_ESTIMATE_MAX_OPENS = 50;

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

