/**
 * 📡 Signals Routes - Signal Generation API Endpoints
 * 
 * REST API endpoints pentru signal generation:
 * - List signals
 * - Get signal details
 * - Generate new signal
 * - Validate signal
 * 
 * @module signalsRoutes
 */

const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const AITradingService = require('../../services/ai-trading/AITradingService');
const { auth, optionalAuth } = require('../../middleware/auth');
const { authenticatedLimiter, tradingLimiter } = require('../../middleware/rateLimit');
const { validateAITradingAnalyze, sanitizeInput } = require('../../middleware/validation');
const logger = require('../../utils/logger');
const { Op } = require('sequelize');

const Signal = db.Signal;

/**
 * GET /api/ai-trading/signals
 * Get all signals pentru un user
 */
router.get('/', optionalAuth, authenticatedLimiter, sanitizeInput, async (req, res, next) => {
  try {
    const userId = req.user?.id || req.query.userId;
    const { token, signal, valid, limit = 50, offset = 0 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Build query
    const where = { userId };
    if (token) where.token = token;
    if (signal && ['buy', 'sell', 'hold'].includes(signal)) {
      where.signal = signal;
    }
    if (valid !== undefined) {
      where.valid = valid === 'true' || valid === true;
    }

    // Get signals with pagination
    const { count, rows: signals } = await Signal.findAndCountAll({
      where,
      limit: Math.min(parseInt(limit) || 50, 100), // Max 100
      offset: parseInt(offset) || 0,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      signals: signals.map(s => s.toJSON ? s.toJSON() : s),
      pagination: {
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0,
        total: count,
        hasMore: (parseInt(offset) || 0) + signals.length < count
      }
    });
  } catch (error) {
    logger.error('Error getting signals:', error);
    next(error);
  }
});

/**
 * GET /api/ai-trading/signals/:id
 * Get signal details
 */
router.get('/:id', optionalAuth, authenticatedLimiter, sanitizeInput, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Get signal from database
    const signal = await Signal.findOne({
      where: { id: parseInt(id), userId }
    });

    if (!signal) {
      return res.status(404).json({
        success: false,
        error: 'Signal not found'
      });
    }

    res.json({
      success: true,
      signal: signal.toJSON ? signal.toJSON() : signal
    });
  } catch (error) {
    logger.error('Error getting signal:', error);
    next(error);
  }
});

/**
 * POST /api/ai-trading/signals/generate
 * Generate new trading signal
 */
router.post('/generate', auth, tradingLimiter, validateAITradingAnalyze, async (req, res, next) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const { token, marketData } = req.body;

    if (!userId || !token) {
      return res.status(400).json({
        success: false,
        error: 'User ID and token are required'
      });
    }

    // Analyze market (signal va fi saved în AITradingService.analyzeMarket)
    const signalData = await AITradingService.analyzeMarket(token, userId, marketData);

    logger.aiTrading('Signal generated', { userId, token, signal: signalData.signal, confidence: signalData.confidence });

    res.json({
      success: true,
      message: 'Signal generated successfully',
      signal: signalData
    });
  } catch (error) {
    logger.error('Error generating signal:', error);
    next(error);
  }
});

/**
 * POST /api/ai-trading/signals/:id/validate
 * Validate signal
 */
router.post('/:id/validate', auth, authenticatedLimiter, sanitizeInput, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.body.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Get signal from database
    const signal = await Signal.findOne({
      where: { id: parseInt(id), userId }
    });

    if (!signal) {
      return res.status(404).json({
        success: false,
        error: 'Signal not found'
      });
    }

    // Validate signal (basic validation - check confidence, entry price, etc.)
    let isValid = true;
    const validationErrors = [];

    if (signal.confidence < 0.5) {
      isValid = false;
      validationErrors.push('Confidence too low (< 0.5)');
    }

    if (signal.signal === 'buy' || signal.signal === 'sell') {
      if (!signal.entryPrice || signal.entryPrice <= 0) {
        isValid = false;
        validationErrors.push('Invalid entry price');
      }
    }

    // Update signal validation status
    signal.valid = isValid;
    signal.validationErrors = isValid ? null : validationErrors;
    await signal.save();

    logger.info('Signal validated', { userId, signalId: signal.id, valid: isValid });

    res.json({
      success: true,
      valid: isValid,
      message: isValid ? 'Signal validated successfully' : 'Signal validation failed',
      validationErrors: isValid ? null : validationErrors,
      signal: signal.toJSON ? signal.toJSON() : signal
    });
  } catch (error) {
    logger.error('Error validating signal:', error);
    next(error);
  }
});

module.exports = router;

