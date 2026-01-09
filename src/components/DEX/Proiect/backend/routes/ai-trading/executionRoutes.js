/**
 * 💼 Execution Routes - Trade Execution API Endpoints
 * 
 * REST API endpoints pentru trade execution:
 * - Execute trade
 * - List trades
 * - Get trade details
 * - Cancel pending trade
 * 
 * @module executionRoutes
 */

const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const ContractService = require('../../services/ai-trading/ContractService');
const AITradingService = require('../../services/ai-trading/AITradingService');
const { auth, optionalAuth } = require('../../middleware/auth');
const { tradingLimiter, authenticatedLimiter } = require('../../middleware/rateLimit');
const { validateAITradingExecute, sanitizeInput } = require('../../middleware/validation');
const logger = require('../../utils/logger');
const { Op } = require('sequelize');

const Trade = db.Trade;

/**
 * POST /api/ai-trading/execute
 * Execute trade
 */
router.post('/execute', auth, tradingLimiter, validateAITradingExecute, async (req, res, next) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const { signalId, tokenIn, tokenOut, amountIn, amountOutMin, deadline, userAddress } = req.body;

    if (!userId || !tokenIn || !tokenOut || !amountIn) {
      return res.status(400).json({
        success: false,
        error: 'User ID, tokenIn, tokenOut, and amountIn are required'
      });
    }

    // Use userAddress din body sau wallet address din authenticated user
    const walletAddress = userAddress || req.user?.walletAddress;
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required for trade execution'
      });
    }

      // Validate amountIn
      const amountInNum = parseFloat(amountIn);
      if (isNaN(amountInNum) || amountInNum <= 0) {
        return res.status(400).json({
          success: false,
          error: 'amountIn must be a positive number'
        });
      }

      // Calculate deadline (5 minutes default)
      const tradeDeadline = deadline || Math.floor(Date.now() / 1000) + 300;

      // Validate deadline (must be in the future)
      if (tradeDeadline <= Math.floor(Date.now() / 1000)) {
        return res.status(400).json({
          success: false,
          error: 'deadline must be in the future'
        });
      }

      // Calculate amountOutMin (1% slippage default)
      const minAmountOut = amountOutMin ? parseFloat(amountOutMin) : amountInNum * 0.99;

      if (isNaN(minAmountOut) || minAmountOut <= 0) {
        return res.status(400).json({
          success: false,
          error: 'amountOutMin must be a positive number'
        });
      }

      // Execute swap
      const swapResult = await ContractService.executeSwap({
        tokenIn,
        tokenOut,
        amountIn: amountInNum.toString(),
        amountOutMin: minAmountOut.toString(),
        deadline: tradeDeadline,
        userAddress: walletAddress
      });

      if (!swapResult.success) {
        return res.status(500).json({
          success: false,
          error: swapResult.error || 'Failed to execute swap'
        });
      }

      // Calculate entry price (tokenIn / tokenOut)
      const amountOutNum = parseFloat(swapResult.amountOut);
      const entryPrice = amountOutNum > 0 ? amountInNum / amountOutNum : null;

      // Save trade în database
      const trade = await Trade.create({
        userId,
        signalId: signalId || null,
        tokenIn,
        tokenOut,
        amountIn: amountInNum,
        amountOut: amountOutNum,
        entryPrice: entryPrice,
        txHash: swapResult.txHash,
        status: 'executed',
        executedAt: new Date()
      });

    logger.aiTrading('Trade executed', { 
      userId, 
      tradeId: trade.id, 
      txHash: swapResult.txHash,
      tokenIn,
      tokenOut,
      amountIn,
      amountOut: swapResult.amountOut
    });

    res.status(201).json({
      success: true,
      message: 'Trade executed successfully',
      trade: trade.toJSON ? trade.toJSON() : trade
    });
  } catch (error) {
    logger.error('Error executing trade:', error);
    next(error);
  }
});

/**
 * GET /api/ai-trading/trades
 * Get all trades pentru un user
 */
router.get('/trades', optionalAuth, authenticatedLimiter, sanitizeInput, async (req, res, next) => {
  try {
    const userId = req.user?.id || req.query.userId;
    const { status, tokenIn, tokenOut, limit = 50, offset = 0 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

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
      limit: Math.min(parseInt(limit) || 50, 100), // Max 100
      offset: parseInt(offset) || 0,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      trades: trades.map(t => t.toJSON ? t.toJSON() : t),
      pagination: {
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0,
        total: count,
        hasMore: (parseInt(offset) || 0) + trades.length < count
      }
    });
  } catch (error) {
    logger.error('Error getting trades:', error);
    next(error);
  }
});

/**
 * GET /api/ai-trading/trades/:id
 * Get trade details
 */
router.get('/trades/:id', optionalAuth, authenticatedLimiter, sanitizeInput, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Get trade from database
    const Signal = db.Signal;
    const trade = await Trade.findOne({
      where: { id: parseInt(id), userId },
      include: [{
        model: Signal,
        as: 'signal',
        required: false
      }]
    });

    if (!trade) {
      return res.status(404).json({
        success: false,
        error: 'Trade not found'
      });
    }

    res.json({
      success: true,
      trade: trade.toJSON ? trade.toJSON() : trade
    });
  } catch (error) {
    logger.error('Error getting trade:', error);
    next(error);
  }
});

/**
 * POST /api/ai-trading/trades/:id/cancel
 * Cancel pending trade
 */
router.post('/trades/:id/cancel', auth, authenticatedLimiter, sanitizeInput, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.body.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Get trade from database
    const trade = await Trade.findOne({
      where: { id: parseInt(id), userId }
    });

    if (!trade) {
      return res.status(404).json({
        success: false,
        error: 'Trade not found'
      });
    }

    // Check if trade can be cancelled
    if (trade.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Only pending trades can be cancelled'
      });
    }

    // Update trade status to cancelled
    trade.status = 'closed'; // Use 'closed' instead of 'cancelled' pentru consistency
    await trade.save();

    logger.info('Trade cancelled', { userId, tradeId: trade.id });

    res.json({
      success: true,
      message: 'Trade cancelled successfully',
      trade: trade.toJSON ? trade.toJSON() : trade
    });
  } catch (error) {
    logger.error('Error cancelling trade:', error);
    next(error);
  }
});

module.exports = router;

