/**
 * 🚀 AI Trading Routes - API Endpoints
 * 
 * REST API endpoints pentru AI Trading system:
 * - Start/Stop AI Trading Bot
 * - Get Status & Statistics
 * - Market Analysis
 * - Trade Execution
 * - Performance Tracking
 * 
 * @module aiTradingRoutes
 */

const express = require('express');
const router = express.Router();
const AITradingService = require('../../services/ai-trading/AITradingService');
const ContractService = require('../../services/ai-trading/ContractService');
const { auth, optionalAuth } = require('../../middleware/auth');
const { authenticatedLimiter, tradingLimiter } = require('../../middleware/rateLimit');
const { validateAITradingStart, validateAITradingAnalyze } = require('../../middleware/validation');
const logger = require('../../utils/logger');

/**
 * POST /api/ai-trading/start
 * Start AI Trading Bot pentru un user
 */
router.post('/start', auth, authenticatedLimiter, validateAITradingStart, async (req, res, next) => {
  try {
    // Get userId din authenticated user sau din body (pentru backward compatibility)
    const userId = req.user?.id || req.body.userId;
    const { config } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Start AI Trading Bot
    const result = await AITradingService.start(userId, config);

    logger.aiTrading('AI Trading Bot started', { userId, botId: result.botId });

    res.json({
      success: true,
      message: 'AI Trading Bot started successfully',
      botId: result.botId
    });
  } catch (error) {
    logger.error('Error starting AI Trading Bot:', error);
    next(error);
  }
});

/**
 * POST /api/ai-trading/stop
 * Stop AI Trading Bot pentru un user
 */
router.post('/stop', auth, authenticatedLimiter, async (req, res, next) => {
  try {
    // Get userId din authenticated user sau din body
    const userId = req.user?.id || req.body.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Stop AI Trading Bot
    const result = await AITradingService.stop(userId);

    logger.aiTrading('AI Trading Bot stopped', { userId });

    res.json({
      success: true,
      message: result.message || 'AI Trading Bot stopped successfully'
    });
  } catch (error) {
    logger.error('Error stopping AI Trading Bot:', error);
    next(error);
  }
});

/**
 * GET /api/ai-trading/status
 * Get AI Trading Bot status pentru un user
 */
router.get('/status', optionalAuth, authenticatedLimiter, async (req, res, next) => {
  try {
    // Get userId din authenticated user sau din query
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Get status
    const status = await AITradingService.getStatus(userId);

    res.json({
      success: true,
      status
    });
  } catch (error) {
    logger.error('Error getting AI Trading Bot status:', error);
    next(error);
  }
});

/**
 * GET /api/ai-trading/stats
 * Get AI Trading Bot statistics pentru un user
 */
router.get('/stats', optionalAuth, authenticatedLimiter, async (req, res, next) => {
  try {
    // Get userId din authenticated user sau din query
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Get stats
    const stats = await AITradingService.getStats(userId);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error getting AI Trading Bot stats:', error);
    next(error);
  }
});

/**
 * POST /api/ai-trading/analyze
 * Analyze market și generează trading signal
 */
router.post('/analyze', auth, tradingLimiter, validateAITradingAnalyze, async (req, res, next) => {
  try {
    // Get userId din authenticated user sau din body
    const userId = req.user?.id || req.body.userId || 'system';
    const { token, marketData } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    // Analyze market (marketData e optional - va fi fetched dacă nu e provided)
    const signal = await AITradingService.analyzeMarket(token, userId, marketData);

    logger.aiTrading('Market analysis completed', { userId, token, signal: signal.signal, confidence: signal.confidence });

    res.json({
      success: true,
      signal
    });
  } catch (error) {
    logger.error('Error analyzing market:', error);
    next(error);
  }
});

/**
 * GET /api/ai-trading/contract/state
 * Get contract state (fees, treasury, etc.)
 */
router.get('/contract/state', optionalAuth, authenticatedLimiter, async (req, res, next) => {
  try {
    // Get contract state
    const state = await ContractService.getContractState();

    res.json({
      success: true,
      state
    });
  } catch (error) {
    logger.error('Error getting contract state:', error);
    next(error);
  }
});

module.exports = router;

