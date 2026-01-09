/**
 * 📈 Performance Routes - Performance Tracking API Endpoints
 * 
 * REST API endpoints pentru performance tracking:
 * - Get performance metrics
 * - Get risk metrics
 * - Get performance history
 * 
 * @module performanceRoutes
 */

const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const PerformanceService = require('../../services/ai-trading/PerformanceService');
const { optionalAuth } = require('../../middleware/auth');
const { authenticatedLimiter } = require('../../middleware/rateLimit');
const { sanitizeInput } = require('../../middleware/validation');
const logger = require('../../utils/logger');
const { Op } = require('sequelize');
const { extractUserId, parsePagination, getDateRangeFromPeriod, safeParseFloat, getPaginationMetadata } = require('../helpers');

const Trade = db.Trade;

/**
 * GET /api/ai-trading/performance/metrics
 * Get performance metrics pentru un user
 */
router.get('/metrics', optionalAuth, authenticatedLimiter, sanitizeInput, async (req, res, next) => {
  try {
    const userId = extractUserId(req, 'query');
    const { period = '30d', periodStart, periodEnd } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Parse period
    let startDate, endDate;
    
    if (periodStart && periodEnd) {
      startDate = new Date(periodStart);
      endDate = new Date(periodEnd);
      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)'
        });
      }
      if (startDate > endDate) {
        return res.status(400).json({
          success: false,
          error: 'periodStart must be before periodEnd'
        });
      }
    } else {
      const dateRange = getDateRangeFromPeriod(period);
      startDate = dateRange.startDate;
      endDate = dateRange.endDate;
    }

    // Get performance metrics
    const metrics = await PerformanceService.getMetrics(userId, startDate, endDate);

    res.json({
      success: true,
      metrics,
      period: periodStart && periodEnd ? 'custom' : period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    });
  } catch (error) {
    logger.error('Error getting performance metrics:', error);
    next(error);
  }
});

/**
 * GET /api/ai-trading/performance/risk
 * Get risk metrics pentru un user
 */
router.get('/risk', optionalAuth, authenticatedLimiter, sanitizeInput, async (req, res, next) => {
  try {
    const userId = extractUserId(req, 'query');

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Get risk metrics
    const riskMetrics = await PerformanceService.getRiskMetrics(userId);

    res.json({
      success: true,
      riskMetrics
    });
  } catch (error) {
    logger.error('Error getting risk metrics:', error);
    next(error);
  }
});

/**
 * GET /api/ai-trading/performance/history
 * Get trading history pentru un user (from Trade model)
 */
router.get('/history', optionalAuth, authenticatedLimiter, sanitizeInput, async (req, res, next) => {
  try {
    const userId = extractUserId(req, 'query');
    const { status, tokenIn, tokenOut } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Parse pagination
    const { limit, offset } = parsePagination(req.query, 50, 100);

    // Build query
    const where = { userId };
    if (status && ['pending', 'executed', 'failed', 'closed'].includes(status)) {
      where.status = status;
    }
    if (tokenIn) where.tokenIn = tokenIn;
    if (tokenOut) where.tokenOut = tokenOut;

    // Get trades with pagination
    const { count, rows: trades } = await Trade.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      history: trades.map(t => t.toJSON ? t.toJSON() : t),
      pagination: getPaginationMetadata(offset, limit, count, trades.length)
    });
  } catch (error) {
    logger.error('Error getting performance history:', error);
    next(error);
  }
});

/**
 * GET /api/ai-trading/performance/charts
 * Get performance charts data pentru un user
 */
router.get('/charts', optionalAuth, authenticatedLimiter, sanitizeInput, async (req, res, next) => {
  try {
    const userId = extractUserId(req, 'query');
    const { period = '30d' } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Parse period
    const { startDate, endDate } = getDateRangeFromPeriod(period);

    // Get performance metrics for charts
    const metrics = await PerformanceService.getMetrics(userId, startDate, endDate);
    const riskMetrics = await PerformanceService.getRiskMetrics(userId);

    // Get trades pentru chart data
    const trades = await Trade.findAll({
      where: {
        userId,
        status: 'executed',
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['createdAt', 'ASC']],
      attributes: ['createdAt', 'pnl', 'amountIn', 'amountOut']
    });

    // Generate chart data (cumulative PnL over time)
    const chartData = [];
    let cumulativePnL = 0;
    trades.forEach(trade => {
      const pnl = safeParseFloat(trade.pnl, 0);
      cumulativePnL += pnl;
      chartData.push({
        date: trade.createdAt,
        pnl,
        cumulativePnL
      });
    });

    res.json({
      success: true,
      charts: {
        performance: chartData,
        metrics,
        riskMetrics
      },
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    });
  } catch (error) {
    logger.error('Error getting performance charts:', error);
    next(error);
  }
});

module.exports = router;

