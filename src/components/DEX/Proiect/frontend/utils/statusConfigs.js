/**
 * 🏷️ Status Configs - Status Configuration Utilities
 * 
 * Utilities pentru status configurations:
 * - Trade status configs
 * - Signal status configs
 * - Bot status configs
 * 
 * @module statusConfigs
 */

import { CheckCircle, XCircle, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { TRADE_STATUS, SIGNAL_TYPES } from './constants';

/**
 * Get trade status configuration
 * @param {string} status - Trade status
 * @returns {Object} Status configuration object
 */
export const getTradeStatusConfig = (status) => {
  const configs = {
    [TRADE_STATUS.EXECUTED]: {
      icon: CheckCircle,
      label: 'Executed',
      className: 'executed',
      color: '#10b981'
    },
    [TRADE_STATUS.FAILED]: {
      icon: XCircle,
      label: 'Failed',
      className: 'failed',
      color: '#ef4444'
    },
    [TRADE_STATUS.CLOSED]: {
      icon: CheckCircle,
      label: 'Closed',
      className: 'closed',
      color: '#6366f1'
    },
    [TRADE_STATUS.PENDING]: {
      icon: Clock,
      label: 'Pending',
      className: 'pending',
      color: '#f59e0b'
    }
  };

  return configs[status] || configs[TRADE_STATUS.PENDING];
};

/**
 * Get signal type configuration
 * @param {string} signalType - Signal type
 * @returns {Object} Signal configuration object
 */
export const getSignalTypeConfig = (signalType) => {
  const type = signalType?.toLowerCase();
  
  const configs = {
    buy: {
      icon: TrendingUp,
      label: 'BUY',
      className: 'buy',
      color: '#10b981'
    },
    sell: {
      icon: TrendingDown,
      label: 'SELL',
      className: 'sell',
      color: '#ef4444'
    },
    hold: {
      icon: Minus,
      label: 'HOLD',
      className: 'hold',
      color: '#6b7280'
    }
  };

  return configs[type] || configs.hold;
};

/**
 * Get bot status configuration
 * @param {string} status - Bot status
 * @returns {Object} Bot status configuration object
 */
export const getBotStatusConfig = (status) => {
  const configs = {
    running: {
      label: 'Running',
      className: 'running',
      color: '#10b981',
      icon: CheckCircle
    },
    stopped: {
      label: 'Stopped',
      className: 'stopped',
      color: '#6b7280',
      icon: XCircle
    },
    paused: {
      label: 'Paused',
      className: 'paused',
      color: '#f59e0b',
      icon: Clock
    },
    error: {
      label: 'Error',
      className: 'error',
      color: '#ef4444',
      icon: XCircle
    }
  };

  return configs[status] || configs.stopped;
};

/**
 * Get confidence level configuration
 * @param {number} confidence - Confidence value (0-1)
 * @returns {Object} Confidence level configuration
 */
export const getConfidenceLevelConfig = (confidence) => {
  const percentage = confidence * 100;
  
  if (percentage >= 70) {
    return {
      level: 'high',
      className: 'high',
      color: '#10b981'
    };
  } else if (percentage >= 50) {
    return {
      level: 'medium',
      className: 'medium',
      color: '#f59e0b'
    };
  } else {
    return {
      level: 'low',
      className: 'low',
      color: '#ef4444'
    };
  }
};

