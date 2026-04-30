/**
 * 🛡️ AI Trading Risk Manager - Risk Management (cu Bitcoin support - Oxium-inspired)
 * 
 * Gestionare risc pentru trading:
 * - Position sizing
 * - Stop loss
 * - Take profit
 * - Daily loss limits
 * - Max open positions
 * - Risk score calculation
 * - Bitcoin-specific risk adjustments
 * 
 * @module AITradingRiskManager
 */

import { isBitcoinToken, isBitcoinPair } from '../utils/bitcoinTokens.js';

export class AITradingRiskManager {
  constructor(config = {}) {
    // Risk limits configuration
    this.config = {
      maxPercentPerTrade: config.maxPercentPerTrade || 5.0, // Max 5% din balance per trade
      maxOpenPositions: config.maxOpenPositions || 5, // Max 5 poziții deschise
      dailyLossLimit: config.dailyLossLimit || 10.0, // Stop dacă pierzi 10% într-o zi
      stopLossDefault: config.stopLossDefault || 3.0, // Stop-loss 3% default
      takeProfitDefault: config.takeProfitDefault || 6.0, // Take-profit 6% default
      maxDrawdown: config.maxDrawdown || 20.0, // Max drawdown 20%
      minConfidence: config.minConfidence || 0.65 // Min confidence 65% pentru trade
    };

    // Track current state
    this.dailyLoss = 0;
    this.openPositions = [];
    this.dailyTrades = [];
    this.initialBalance = null;
    this.currentBalance = null;
  }

  /**
   * Check dacă un trade trece verificările de risc (cu Bitcoin support - Oxium-inspired)
   * @param {Object} signal - Trading signal
   * @param {number} balance - Current balance
   * @param {number} currentPrice - Current token price
   * @param {Object} options - Additional options { isBitcoin, tokenIn, tokenOut }
   * @returns {Promise<Object>} Risk check result cu { passed, reason, positionSize, stopLoss, takeProfit }
   */
  async check(signal, balance, currentPrice, options = {}) {
    // Initialize balance tracking
    if (this.initialBalance === null) {
      this.initialBalance = balance;
      this.currentBalance = balance;
    } else {
      this.currentBalance = balance;
    }

    // Check 1: Confidence level
    if (signal.confidence < this.config.minConfidence) {
      return {
        passed: false,
        reason: `Confidence too low: ${(signal.confidence * 100).toFixed(1)}% < ${(this.config.minConfidence * 100).toFixed(1)}%`,
        positionSize: 0,
        stopLoss: 0,
        takeProfit: 0
      };
    }

    // Check 2: Daily loss limit
    const dailyLossPercent = (this.dailyLoss / this.initialBalance) * 100;
    if (dailyLossPercent >= this.config.dailyLossLimit) {
      return {
        passed: false,
        reason: `Daily loss limit reached: ${dailyLossPercent.toFixed(2)}% >= ${this.config.dailyLossLimit}%`,
        positionSize: 0,
        stopLoss: 0,
        takeProfit: 0
      };
    }

    // Check 3: Max open positions
    if (this.openPositions.length >= this.config.maxOpenPositions) {
      return {
        passed: false,
        reason: `Max open positions reached: ${this.openPositions.length} >= ${this.config.maxOpenPositions}`,
        positionSize: 0,
        stopLoss: 0,
        takeProfit: 0
      };
    }

    // Check 4: Max drawdown
    const drawdown = ((this.initialBalance - this.currentBalance) / this.initialBalance) * 100;
    if (drawdown >= this.config.maxDrawdown) {
      return {
        passed: false,
        reason: `Max drawdown reached: ${drawdown.toFixed(2)}% >= ${this.config.maxDrawdown}%`,
        positionSize: 0,
        stopLoss: 0,
        takeProfit: 0
      };
    }

    // Bitcoin-specific risk adjustments (Oxium-inspired)
    let positionSizeMultiplier = 1.0;
    let stopLossMultiplier = 1.0;
    let takeProfitMultiplier = 1.0;
    
    if (options.isBitcoin || isBitcoinPair(signal.tokenIn, signal.tokenOut)) {
      // Bitcoin tokens sunt mai stabile - allow slightly larger positions
      positionSizeMultiplier = 1.1; // +10% pentru Bitcoin
      
      // Tighter stop loss pentru Bitcoin (mai puțin volatil)
      stopLossMultiplier = 0.8; // -20% stop loss (tighter)
      
      // Slightly higher take profit pentru Bitcoin
      takeProfitMultiplier = 1.1; // +10% take profit
      
      console.log('[Bitcoin Risk] Applying Bitcoin-specific risk adjustments');
    }
    
    // Calculate position size (max % of balance)
    const maxTradeAmount = (balance * this.config.maxPercentPerTrade * positionSizeMultiplier) / 100;
    const positionSize = Math.min(maxTradeAmount, balance * 0.1); // Never more than 10% of balance

    // Calculate stop loss și take profit (cu Bitcoin adjustments)
    const baseStopLoss = signal.stopLoss || (currentPrice * (1 - this.config.stopLossDefault / 100));
    const baseTakeProfit = signal.takeProfit || (currentPrice * (1 + this.config.takeProfitDefault / 100));
    
    const stopLoss = baseStopLoss * (1 - (this.config.stopLossDefault / 100) * (1 - stopLossMultiplier));
    const takeProfit = baseTakeProfit * (1 + (this.config.takeProfitDefault / 100) * (takeProfitMultiplier - 1));

    // All checks passed
    return {
      passed: true,
      reason: 'All risk checks passed',
      positionSize,
      stopLoss,
      takeProfit,
      riskScore: this.calculateRiskScore(signal, positionSize, balance)
    };
  }

  /**
   * Calculează risk score pentru un trade
   * @private
   */
  calculateRiskScore(signal, positionSize, balance) {
    const positionSizePercent = (positionSize / balance) * 100;
    const confidenceScore = signal.confidence || 0;
    
    // Risk score: 0-100 (0 = no risk, 100 = maximum risk)
    const sizeRisk = Math.min(100, positionSizePercent * 10); // 10% position = 100 risk
    const confidenceRisk = (1 - confidenceScore) * 100; // Lower confidence = higher risk
    const volatilityRisk = signal.marketData?.volatility || 0; // Higher volatility = higher risk

    return (sizeRisk * 0.4 + confidenceRisk * 0.4 + volatilityRisk * 0.2);
  }

  /**
   * Register o poziție deschisă
   * @param {Object} position - Position object cu { id, token, entryPrice, stopLoss, takeProfit, amount }
   */
  registerPosition(position) {
    this.openPositions.push({
      ...position,
      openedAt: Date.now()
    });
  }

  /**
   * Close o poziție
   * @param {string} positionId - Position ID
   * @param {number} exitPrice - Exit price
   * @param {boolean} isProfit - Dacă e profit sau loss
   */
  closePosition(positionId, exitPrice, isProfit) {
    const positionIndex = this.openPositions.findIndex(p => p.id === positionId);
    if (positionIndex === -1) {
      return;
    }

    const position = this.openPositions[positionIndex];
    const pnl = (exitPrice - position.entryPrice) / position.entryPrice * 100;
    
    if (!isProfit) {
      this.dailyLoss += Math.abs(pnl) * position.amount / 100;
    }

    this.openPositions.splice(positionIndex, 1);
    this.dailyTrades.push({
      ...position,
      exitPrice,
      pnl,
      closedAt: Date.now()
    });
  }

  /**
   * Reset daily tracking
   */
  resetDaily() {
    this.dailyLoss = 0;
    this.dailyTrades = [];
    this.initialBalance = this.currentBalance;
  }

  /**
   * Get current risk metrics
   * @returns {Object} Risk metrics
   */
  getRiskMetrics() {
    return {
      dailyLoss: this.dailyLoss,
      dailyLossPercent: this.initialBalance ? (this.dailyLoss / this.initialBalance) * 100 : 0,
      openPositions: this.openPositions.length,
      maxOpenPositions: this.config.maxOpenPositions,
      dailyTrades: this.dailyTrades.length,
      currentBalance: this.currentBalance,
      initialBalance: this.initialBalance,
      drawdown: this.initialBalance ? ((this.initialBalance - this.currentBalance) / this.initialBalance) * 100 : 0
    };
  }
}

