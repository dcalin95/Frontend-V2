/**
 * 📊 Strategies Routes - Strategy Management API Endpoints
 * 
 * REST API endpoints pentru strategy management:
 * - List strategies
 * - Create strategy
 * - Update strategy
 * - Delete strategy
 * - Enable/disable strategy
 * 
 * @module strategiesRoutes
 */

const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { auth, optionalAuth } = require('../../middleware/auth');
const { authenticatedLimiter } = require('../../middleware/rateLimit');
const { sanitizeInput } = require('../../middleware/validation');
const logger = require('../../utils/logger');

const Strategy = db.Strategy;

/**
 * GET /api/ai-trading/strategies
 * Get all strategies pentru un user
 */
router.get('/', optionalAuth, authenticatedLimiter, sanitizeInput, async (req, res, next) => {
  try {
    // Get userId din authenticated user sau din query
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Get strategies from database
    const strategies = await Strategy.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      raw: true
    });

    res.json({
      success: true,
      strategies: strategies || []
    });
  } catch (error) {
    logger.error('Error getting strategies:', error);
    next(error);
  }
});

/**
 * GET /api/ai-trading/strategies/:id
 * Get strategy details
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

    // Get strategy from database
    const strategy = await Strategy.findOne({
      where: { id: parseInt(id), userId }
    });

    if (!strategy) {
      return res.status(404).json({
        success: false,
        error: 'Strategy not found'
      });
    }

    res.json({
      success: true,
      strategy: strategy.toJSON ? strategy.toJSON() : strategy
    });
  } catch (error) {
    logger.error('Error getting strategy:', error);
    next(error);
  }
});

/**
 * POST /api/ai-trading/strategies
 * Create new strategy
 */
router.post('/', auth, authenticatedLimiter, sanitizeInput, async (req, res, next) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const { name, type, config, riskLevel } = req.body;

    if (!userId || !name || !type || !config) {
      return res.status(400).json({
        success: false,
        error: 'User ID, name, type, and config are required'
      });
    }

    // Validate type
    const validTypes = ['trend-following', 'mean-reversion', 'arbitrage', 'volume-analysis', 'market-making'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid strategy type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Validate riskLevel
    const validRiskLevels = ['conservative', 'balanced', 'aggressive'];
    if (riskLevel && !validRiskLevels.includes(riskLevel)) {
      return res.status(400).json({
        success: false,
        error: `Invalid risk level. Must be one of: ${validRiskLevels.join(', ')}`
      });
    }

    // Create strategy
    const strategy = await Strategy.create({
      userId,
      name: name.trim(),
      type,
      config,
      riskLevel: riskLevel || 'balanced',
      enabled: true
    });

    logger.info('Strategy created', { userId, strategyId: strategy.id, type });

    res.status(201).json({
      success: true,
      message: 'Strategy created successfully',
      strategy: strategy.toJSON ? strategy.toJSON() : strategy
    });
  } catch (error) {
    logger.error('Error creating strategy:', error);
    next(error);
  }
});

/**
 * PUT /api/ai-trading/strategies/:id
 * Update strategy
 */
router.put('/:id', auth, authenticatedLimiter, sanitizeInput, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.body.userId;
    const { name, type, config, riskLevel, enabled } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Get strategy from database
    const strategy = await Strategy.findOne({
      where: { id: parseInt(id), userId }
    });

    if (!strategy) {
      return res.status(404).json({
        success: false,
        error: 'Strategy not found'
      });
    }

    // Validate type dacă e provided
    if (type) {
      const validTypes = ['trend-following', 'mean-reversion', 'arbitrage', 'volume-analysis', 'market-making'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          error: `Invalid strategy type. Must be one of: ${validTypes.join(', ')}`
        });
      }
    }

    // Validate riskLevel dacă e provided
    if (riskLevel) {
      const validRiskLevels = ['conservative', 'balanced', 'aggressive'];
      if (!validRiskLevels.includes(riskLevel)) {
        return res.status(400).json({
          success: false,
          error: `Invalid risk level. Must be one of: ${validRiskLevels.join(', ')}`
        });
      }
    }

    // Update strategy
    if (name) strategy.name = name.trim();
    if (type) strategy.type = type;
    if (config) strategy.config = { ...strategy.config, ...config };
    if (riskLevel) strategy.riskLevel = riskLevel;
    if (enabled !== undefined) strategy.enabled = enabled;
    
    await strategy.save();

    logger.info('Strategy updated', { userId, strategyId: strategy.id });

    res.json({
      success: true,
      message: 'Strategy updated successfully',
      strategy: strategy.toJSON ? strategy.toJSON() : strategy
    });
  } catch (error) {
    logger.error('Error updating strategy:', error);
    next(error);
  }
});

/**
 * DELETE /api/ai-trading/strategies/:id
 * Delete strategy
 */
router.delete('/:id', auth, authenticatedLimiter, sanitizeInput, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Get strategy from database
    const strategy = await Strategy.findOne({
      where: { id: parseInt(id), userId }
    });

    if (!strategy) {
      return res.status(404).json({
        success: false,
        error: 'Strategy not found'
      });
    }

    // Delete strategy
    await strategy.destroy();

    logger.info('Strategy deleted', { userId, strategyId: id });

    res.json({
      success: true,
      message: 'Strategy deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting strategy:', error);
    next(error);
  }
});

/**
 * POST /api/ai-trading/strategies/:id/enable
 * Enable strategy
 */
router.post('/:id/enable', auth, authenticatedLimiter, sanitizeInput, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.body.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Get strategy
    const strategy = await Strategy.findOne({
      where: { id: parseInt(id), userId }
    });

    if (!strategy) {
      return res.status(404).json({
        success: false,
        error: 'Strategy not found'
      });
    }

    // Enable strategy
    strategy.enabled = true;
    await strategy.save();

    logger.info('Strategy enabled', { userId, strategyId: strategy.id });

    res.json({
      success: true,
      message: 'Strategy enabled successfully',
      strategy: strategy.toJSON ? strategy.toJSON() : strategy
    });
  } catch (error) {
    logger.error('Error enabling strategy:', error);
    next(error);
  }
});

/**
 * POST /api/ai-trading/strategies/:id/disable
 * Disable strategy
 */
router.post('/:id/disable', auth, authenticatedLimiter, sanitizeInput, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.body.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Get strategy
    const strategy = await Strategy.findOne({
      where: { id: parseInt(id), userId }
    });

    if (!strategy) {
      return res.status(404).json({
        success: false,
        error: 'Strategy not found'
      });
    }

    // Disable strategy
    strategy.enabled = false;
    await strategy.save();

    logger.info('Strategy disabled', { userId, strategyId: strategy.id });

    res.json({
      success: true,
      message: 'Strategy disabled successfully',
      strategy: strategy.toJSON ? strategy.toJSON() : strategy
    });
  } catch (error) {
    logger.error('Error disabling strategy:', error);
    next(error);
  }
});

module.exports = router;

