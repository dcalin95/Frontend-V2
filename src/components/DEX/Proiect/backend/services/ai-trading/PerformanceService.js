/**
 * 📈 Performance Service - Performance Analytics
 * 
 * Performance analytics pentru AI Trading:
 * - Calculate performance metrics
 * - Risk metrics calculation
 * - Performance history tracking
 * - Statistics aggregation
 * 
 * @module PerformanceService
 */

// Import database - adapt pentru pg Pool sau Sequelize
// Note: Acest serviciu va fi copiat în backend-server și va folosi pg Pool direct
// Pentru acum, folosim Sequelize pentru development
const db = require('../../config/database');
const logger = require('../../utils/logger');

// Try to import Op from Sequelize (fallback pentru pg Pool)
let Op;
try {
  Op = require('sequelize').Op;
} catch (e) {
  // Fallback pentru pg Pool - Op nu e necesar, folosim direct SQL
  Op = null;
}

class PerformanceService {
  constructor() {
    this.Trade = db.Trade;
    this.Performance = db.Performance;
  }

  /**
   * Get performance metrics pentru un user
   * @param {string} userId - User ID
   * @param {Date} periodStart - Period start date
   * @param {Date} periodEnd - Period end date
   * @returns {Promise<Object>} Performance metrics
   */
  async getMetrics(userId, periodStart, periodEnd) {
    try {
      // 1. Get all trades în period
      // Note: Adaptat pentru compatibilitate cu pg Pool și Sequelize
      let trades;
      if (Op && Op.between) {
        // Sequelize syntax
        trades = await this.Trade.findAll({
          where: {
            userId,
            status: 'executed',
            createdAt: {
              [Op.between]: [periodStart, periodEnd]
            }
          },
          order: [['createdAt', 'ASC']]
        });
      } else {
        // pg Pool syntax - direct query
        const dbQuery = this.Trade.query || require('../../config/database').query;
        const result = await dbQuery(`
          SELECT * FROM trades
          WHERE user_id = $1
            AND status = 'executed'
            AND created_at BETWEEN $2 AND $3
          ORDER BY created_at ASC
        `, [userId, periodStart, periodEnd]);
        trades = result.rows || result || [];
      }

      if (trades.length === 0) {
        return {
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          totalProfit: 0,
          totalLoss: 0,
          profitFactor: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          averageReturn: 0,
          bestTrade: 0,
          worstTrade: 0,
          averageWin: 0,
          averageLoss: 0,
          returnOnInvestment: 0
        };
      }

      // 2. Calculate metrics
      const totalTrades = trades.length;
      const winningTrades = trades.filter(t => parseFloat(t.pnl || 0) > 0);
      const losingTrades = trades.filter(t => parseFloat(t.pnl || 0) < 0);
      const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;

      const totalProfit = winningTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
      const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0));
      const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;

      // Calculate returns pentru Sharpe Ratio
      const returns = trades.map(t => parseFloat(t.pnl || 0));
      const averageReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const sharpeRatio = this.calculateSharpeRatio(returns);

      // Calculate drawdown
      const maxDrawdown = this.calculateMaxDrawdown(trades);

      // Best și worst trade
      const pnls = returns.map(r => r);
      const bestTrade = Math.max(...pnls, 0);
      const worstTrade = Math.min(...pnls, 0);

      // Average win și loss
      const averageWin = winningTrades.length > 0 ? 
        winningTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0) / winningTrades.length : 0;
      const averageLoss = losingTrades.length > 0 ? 
        Math.abs(losingTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0) / losingTrades.length) : 0;

      // Return on Investment (simplified - ar trebui să folosim capital inițial)
      const totalReturn = totalProfit - totalLoss;
      const returnOnInvestment = totalTrades > 0 ? (totalReturn / totalTrades) * 100 : 0;

      return {
        totalTrades,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        winRate: parseFloat(winRate.toFixed(2)),
        totalProfit: parseFloat(totalProfit.toFixed(8)),
        totalLoss: parseFloat(totalLoss.toFixed(8)),
        profitFactor: profitFactor === Infinity ? Infinity : parseFloat(profitFactor.toFixed(4)),
        sharpeRatio: parseFloat(sharpeRatio.toFixed(4)),
        maxDrawdown: parseFloat(maxDrawdown.toFixed(4)),
        averageReturn: parseFloat(averageReturn.toFixed(8)),
        bestTrade: parseFloat(bestTrade.toFixed(8)),
        worstTrade: parseFloat(worstTrade.toFixed(8)),
        averageWin: parseFloat(averageWin.toFixed(8)),
        averageLoss: parseFloat(averageLoss.toFixed(8)),
        returnOnInvestment: parseFloat(returnOnInvestment.toFixed(2)),
        periodStart,
        periodEnd
      };
    } catch (error) {
      logger.error('Error calculating performance metrics:', error);
      throw error;
    }
  }

  /**
   * Get risk metrics pentru un user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Risk metrics
   */
  async getRiskMetrics(userId) {
    try {
      // Get all executed trades
      const allTrades = await this.Trade.findAll({
        where: {
          userId,
          status: 'executed'
        },
        order: [['createdAt', 'ASC']]
      });

      if (allTrades.length === 0) {
        return {
          currentDrawdown: 0,
          maxDrawdown: 0,
          averageLoss: 0,
          largestLoss: 0,
          riskScore: 0,
          dailyLossLimit: 0,
          dailyLossUsed: 0,
          maxOpenPositions: 0,
          currentOpenPositions: 0,
          averagePositionSize: 0,
          volatility: 0,
          valueAtRisk: 0
        };
      }

      // Calculate current drawdown (from peak)
      const pnls = allTrades.map(t => parseFloat(t.pnl || 0));
      const cumulativePnls = [];
      let cumulative = 0;
      for (const pnl of pnls) {
        cumulative += pnl;
        cumulativePnls.push(cumulative);
      }

      const currentValue = cumulativePnls[cumulativePnls.length - 1];
      const peakValue = Math.max(...cumulativePnls, 0);
      const currentDrawdown = peakValue > 0 ? ((peakValue - currentValue) / peakValue) * 100 : 0;

      // Calculate max drawdown
      const maxDrawdown = this.calculateMaxDrawdown(allTrades);

      // Calculate loss metrics
      const losses = pnls.filter(p => p < 0);
      const averageLoss = losses.length > 0 ? 
        Math.abs(losses.reduce((sum, l) => sum + l, 0) / losses.length) : 0;
      const largestLoss = losses.length > 0 ? Math.abs(Math.min(...losses)) : 0;

      // Calculate daily loss (ultimele 24h)
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const dailyTrades = allTrades.filter(t => new Date(t.createdAt) >= oneDayAgo);
      const dailyLoss = Math.abs(dailyTrades
        .filter(t => parseFloat(t.pnl || 0) < 0)
        .reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0));

      // Position size metrics
      const positionSizes = allTrades.map(t => parseFloat(t.amountIn || 0));
      const averagePositionSize = positionSizes.length > 0 ?
        positionSizes.reduce((sum, s) => sum + s, 0) / positionSizes.length : 0;

      // Current open positions (pending trades)
      const openPositions = await this.Trade.count({
        where: {
          userId,
          status: 'pending'
        }
      });

      // Calculate volatility (standard deviation of returns)
      const returns = pnls;
      const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
      const volatility = Math.sqrt(variance);

      // Value at Risk (VaR) - 95% confidence (simplified)
      const sortedReturns = [...returns].sort((a, b) => a - b);
      const varIndex = Math.floor(sortedReturns.length * 0.05);
      const valueAtRisk = Math.abs(sortedReturns[varIndex] || 0);

      // Calculate risk score (0-100, higher = riskier)
      // Factors: drawdown, volatility, loss rate, position size
      const lossRate = losses.length / pnls.length;
      const riskScore = Math.min(100, Math.round(
        (currentDrawdown * 0.3) +
        (volatility * 0.3) +
        (lossRate * 100 * 0.2) +
        ((averagePositionSize / (averagePositionSize + 1)) * 100 * 0.2)
      ));

      return {
        currentDrawdown: parseFloat(currentDrawdown.toFixed(2)),
        maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
        averageLoss: parseFloat(averageLoss.toFixed(8)),
        largestLoss: parseFloat(largestLoss.toFixed(8)),
        riskScore: Math.min(100, Math.max(0, riskScore)),
        dailyLossLimit: 0, // Va fi setat din config
        dailyLossUsed: parseFloat(dailyLoss.toFixed(8)),
        maxOpenPositions: 0, // Va fi setat din config
        currentOpenPositions: openPositions,
        averagePositionSize: parseFloat(averagePositionSize.toFixed(8)),
        volatility: parseFloat(volatility.toFixed(8)),
        valueAtRisk: parseFloat(valueAtRisk.toFixed(8))
      };
    } catch (error) {
      logger.error('Error calculating risk metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate Sharpe Ratio
   * @private
   */
  calculateSharpeRatio(returns, riskFreeRate = 0) {
    // Sharpe Ratio = (Average Return - Risk Free Rate) / Standard Deviation of Returns
    if (returns.length === 0) return 0;
    if (returns.length === 1) return 0;

    // Calculate average return
    const averageReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;

    // Calculate standard deviation
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - averageReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    // Avoid division by zero
    if (stdDev === 0) return 0;

    // Calculate Sharpe Ratio (annualized - simplified)
    const excessReturn = averageReturn - riskFreeRate;
    return excessReturn / stdDev;
  }

  /**
   * Calculate Maximum Drawdown
   * @private
   */
  calculateMaxDrawdown(trades) {
    // Max Drawdown = (Peak - Trough) / Peak
    if (trades.length === 0) return 0;

    // Calculate cumulative PnL
    const pnls = trades.map(t => parseFloat(t.pnl || 0));
    const cumulativePnls = [];
    let cumulative = 0;
    for (const pnl of pnls) {
      cumulative += pnl;
      cumulativePnls.push(cumulative);
    }

    // Find peak și trough
    let peak = 0;
    let maxDrawdown = 0;

    for (const value of cumulativePnls) {
      if (value > peak) {
        peak = value;
      }

      const drawdown = peak > 0 ? ((peak - value) / peak) * 100 : 0;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }
}

module.exports = new PerformanceService();

