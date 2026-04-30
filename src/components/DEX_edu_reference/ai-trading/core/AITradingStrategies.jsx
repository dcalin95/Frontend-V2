/**
 * 📊 AI Trading Strategies - Strategy Management (cu Bitcoin support - Oxium-inspired)
 * 
 * Gestionare strategii de trading multiple:
 * - Trend Following
 * - Mean Reversion
 * - Arbitrage
 * - Bitcoin Arbitrage (Oxium-inspired)
 * - Volume Analysis
 * - Market Making
 * 
 * @module AITradingStrategies
 */

import { isBitcoinToken, isBitcoinPair } from '../utils/bitcoinTokens.js';

export class AITradingStrategies {
  constructor() {
    this.strategies = new Map();
    this.enabledStrategies = [];
  }

  /**
   * Register o strategie nouă
   * @param {string} name - Nume strategie
   * @param {Object} strategy - Strategie object cu { analyze, execute, riskLevel }
   */
  registerStrategy(name, strategy) {
    this.strategies.set(name, strategy);
  }

  /**
   * Enable o strategie
   * @param {string} name - Nume strategie
   */
  enableStrategy(name) {
    if (!this.strategies.has(name)) {
      throw new Error(`Strategy ${name} not found`);
    }
    if (!this.enabledStrategies.includes(name)) {
      this.enabledStrategies.push(name);
    }
  }

  /**
   * Disable o strategie
   * @param {string} name - Nume strategie
   */
  disableStrategy(name) {
    const index = this.enabledStrategies.indexOf(name);
    if (index > -1) {
      this.enabledStrategies.splice(index, 1);
    }
  }

  /**
   * Analizează market cu toate strategiile enabled (cu Bitcoin support - Oxium-inspired)
   * @param {string} token - Token symbol sau address
   * @param {Object} marketData - Market data
   * @returns {Promise<Array>} Array cu signals de la fiecare strategie
   */
  async analyzeAll(token, marketData) {
    const signals = [];
    
    // Check dacă e Bitcoin token (Oxium-inspired)
    const isBitcoin = isBitcoinToken(token);
    if (isBitcoin) {
      // Add Bitcoin-specific market data
      marketData.isBitcoin = true;
      marketData.bitcoinToken = token;
    }

    for (const strategyName of this.enabledStrategies) {
      const strategy = this.strategies.get(strategyName);
      if (strategy && strategy.analyze) {
        try {
          // Skip non-Bitcoin strategies pentru Bitcoin tokens (dacă e configurat)
          if (isBitcoin && strategy.bitcoinOnly === false) {
            continue; // Skip strategies care nu suportă Bitcoin
          }
          
          const signal = await strategy.analyze(token, marketData);
          signals.push({
            strategy: strategyName,
            signal,
            riskLevel: strategy.riskLevel || 'balanced',
            isBitcoin: isBitcoin
          });
        } catch (error) {
          console.error(`Error in strategy ${strategyName}:`, error);
        }
      }
    }

    return signals;
  }

  /**
   * Combine signals de la multiple strategii
   * @param {Array} signals - Array cu signals de la fiecare strategie
   * @returns {Object} Combined signal
   */
  combineSignals(signals) {
    if (signals.length === 0) {
      return { signal: 'hold', confidence: 0, reasoning: 'No signals' };
    }

    // Count signals by type
    const buyCount = signals.filter(s => s.signal.signal === 'buy').length;
    const sellCount = signals.filter(s => s.signal.signal === 'sell').length;
    const holdCount = signals.filter(s => s.signal.signal === 'hold').length;

    // Calculate weighted confidence
    let totalConfidence = 0;
    let weightedConfidence = 0;
    signals.forEach(s => {
      totalConfidence += s.signal.confidence || 0;
      weightedConfidence += (s.signal.confidence || 0) * (s.riskLevel === 'aggressive' ? 1.2 : s.riskLevel === 'conservative' ? 0.8 : 1.0);
    });

    const avgConfidence = signals.length > 0 ? weightedConfidence / signals.length : 0;

    // Determine final signal (majority vote)
    let finalSignal = 'hold';
    if (buyCount > sellCount && buyCount > holdCount) {
      finalSignal = 'buy';
    } else if (sellCount > buyCount && sellCount > holdCount) {
      finalSignal = 'sell';
    }

    // Combine reasoning
    const reasoning = signals.map(s => `${s.strategy}: ${s.signal.reasoning || ''}`).join('; ');

    return {
      signal: finalSignal,
      confidence: Math.min(1.0, avgConfidence),
      reasoning,
      strategies: signals.length,
      buyVotes: buyCount,
      sellVotes: sellCount,
      holdVotes: holdCount
    };
  }

  /**
   * Get all available strategies
   * @returns {Array} Array cu numele strategiilor
   */
  getAvailableStrategies() {
    return Array.from(this.strategies.keys());
  }

  /**
   * Get enabled strategies
   * @returns {Array} Array cu numele strategiilor enabled
   */
  getEnabledStrategies() {
    return [...this.enabledStrategies];
  }
}

