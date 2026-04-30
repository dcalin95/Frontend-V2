/**
 * 📡 AI Trading Signals - Signal Generation (cu Bitcoin support - Oxium-inspired)
 * 
 * Generare și validare trading signals:
 * - Generate signals din market data
 * - Validate signals
 * - Combine multiple signals
 * - Signal priority scoring
 * - Bitcoin-specific signal validation
 * 
 * @module AITradingSignals
 */

import { isBitcoinToken, isBitcoinPair } from '../utils/bitcoinTokens.js';

export class AITradingSignals {
  constructor() {
    this.signalHistory = [];
    this.signalValidators = [];
  }

  /**
   * Generează trading signal din market data (cu Bitcoin support - Oxium-inspired)
   * @param {Object} marketData - Market data (price, volume, indicators, etc.)
   * @param {Object} analysis - AI analysis result
   * @param {string} token - Token symbol sau address (opțional, pentru Bitcoin detection)
   * @returns {Object} Trading signal
   */
  generateSignal(marketData, analysis, token = null) {
    // Check dacă e Bitcoin token (Oxium-inspired)
    const isBitcoin = token ? isBitcoinToken(token) : marketData.isBitcoin || false;
    
    const signal = {
      signal: analysis.signal || 'hold', // 'buy', 'sell', 'hold'
      confidence: analysis.confidence || 0.5, // 0-1
      reasoning: analysis.reasoning || '',
      entryPrice: analysis.entryPrice || marketData.price,
      stopLoss: analysis.stopLoss || null,
      takeProfit: analysis.takeProfit || null,
      timestamp: Date.now(),
      isBitcoin: isBitcoin,
      bitcoinToken: isBitcoin ? (marketData.bitcoinToken || token) : null,
      marketData: {
        price: marketData.price,
        volume: marketData.volume24h,
        change24h: marketData.change24h,
        volatility: marketData.volatility,
        isBitcoin: isBitcoin
      }
    };

    // Calculate stop loss și take profit dacă nu sunt specificate (cu Bitcoin adjustments)
    const stopLossPercent = isBitcoin ? 2.4 : 3.0; // Tighter pentru Bitcoin (-2.4% vs -3%)
    const takeProfitPercent = isBitcoin ? 6.6 : 6.0; // Slightly higher pentru Bitcoin (+6.6% vs +6%)
    
    if (!signal.stopLoss && signal.signal === 'buy') {
      signal.stopLoss = signal.entryPrice * (1 - stopLossPercent / 100);
    } else if (!signal.stopLoss && signal.signal === 'sell') {
      signal.stopLoss = signal.entryPrice * (1 + stopLossPercent / 100);
    }

    if (!signal.takeProfit && signal.signal === 'buy') {
      signal.takeProfit = signal.entryPrice * (1 + takeProfitPercent / 100);
    } else if (!signal.takeProfit && signal.signal === 'sell') {
      signal.takeProfit = signal.entryPrice * (1 - takeProfitPercent / 100);
    }

    // Calculate priority score
    signal.priority = this.calculatePriority(signal, marketData);

    // Validate signal
    const validation = this.validateSignal(signal);
    signal.valid = validation.valid;
    signal.validationErrors = validation.errors;

    // Add to history
    this.signalHistory.push(signal);

    return signal;
  }

  /**
   * Validează un signal
   * @param {Object} signal - Trading signal
   * @returns {Object} Validation result cu { valid, errors }
   */
  validateSignal(signal) {
    const errors = [];

    // Check 1: Confidence level
    if (signal.confidence < 0.5) {
      errors.push('Confidence too low');
    }

    // Check 2: Entry price
    if (!signal.entryPrice || signal.entryPrice <= 0) {
      errors.push('Invalid entry price');
    }

    // Check 3: Stop loss și take profit pentru buy/sell
    if (signal.signal === 'buy' || signal.signal === 'sell') {
      if (!signal.stopLoss || signal.stopLoss <= 0) {
        errors.push('Stop loss required for buy/sell signals');
      }
      if (!signal.takeProfit || signal.takeProfit <= 0) {
        errors.push('Take profit required for buy/sell signals');
      }

      // Check 4: Stop loss și take profit logic
      if (signal.signal === 'buy') {
        if (signal.stopLoss >= signal.entryPrice) {
          errors.push('Stop loss must be below entry price for buy');
        }
        if (signal.takeProfit <= signal.entryPrice) {
          errors.push('Take profit must be above entry price for buy');
        }
      } else if (signal.signal === 'sell') {
        if (signal.stopLoss <= signal.entryPrice) {
          errors.push('Stop loss must be above entry price for sell');
        }
        if (signal.takeProfit >= signal.entryPrice) {
          errors.push('Take profit must be below entry price for sell');
        }
      }
    }

    // Check 5: Reasoning
    if (!signal.reasoning || signal.reasoning.length < 10) {
      errors.push('Reasoning too short or missing');
    }

    // Run custom validators
    for (const validator of this.signalValidators) {
      try {
        const result = validator(signal);
        if (!result.valid) {
          errors.push(...result.errors);
        }
      } catch (error) {
        console.error('Error in custom validator:', error);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculează priority score pentru un signal
   * @private
   */
  calculatePriority(signal, marketData) {
    let priority = 0;

    // Confidence contribution (0-40 points)
    priority += signal.confidence * 40;

    // Volume contribution (0-20 points)
    const volumeScore = Math.min(1, marketData.volume24h / 1000000); // Normalize to 0-1
    priority += volumeScore * 20;

    // Price change contribution (0-20 points)
    const changeScore = Math.min(1, Math.abs(marketData.change24h || 0) / 10); // Normalize to 0-1
    priority += changeScore * 20;

    // Signal type contribution (0-20 points)
    if (signal.signal === 'buy' || signal.signal === 'sell') {
      priority += 20; // Buy/sell signals are higher priority than hold
    }

    return Math.min(100, priority); // Cap at 100
  }

  /**
   * Add custom validator
   * @param {Function} validator - Validator function
   */
  addValidator(validator) {
    if (typeof validator === 'function') {
      this.signalValidators.push(validator);
    }
  }

  /**
   * Get signal history
   * @param {number} limit - Number of signals to return
   * @returns {Array} Array cu recent signals
   */
  getSignalHistory(limit = 100) {
    return this.signalHistory.slice(-limit);
  }

  /**
   * Get signals by status
   * @param {string} status - 'valid', 'invalid', 'all'
   * @returns {Array} Array cu signals
   */
  getSignalsByStatus(status = 'all') {
    if (status === 'all') {
      return [...this.signalHistory];
    }
    return this.signalHistory.filter(s => 
      status === 'valid' ? s.valid : !s.valid
    );
  }
}

