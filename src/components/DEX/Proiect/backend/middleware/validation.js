/**
 * ✅ Validation Middleware
 * 
 * Input validation pentru API endpoints:
 * - Validate request body
 * - Validate query parameters
 * - Sanitize inputs
 * - Prevent SQL injection
 * - Prevent XSS attacks
 * 
 * @module validation
 */

const { body, query, param, validationResult } = require('express-validator');

/**
 * Validate AI Trading start request
 */
const validateAITradingStart = [
  body('userId').notEmpty().isString().trim().escape(),
  body('config').isObject(),
  body('config.strategies').optional().isArray(),
  body('config.riskLimits').optional().isObject(),
  body('config.riskLimits.maxPercentPerTrade').optional().isFloat({ min: 0, max: 100 }),
  body('config.riskLimits.dailyLossLimit').optional().isFloat({ min: 0, max: 100 }),
  body('config.conditions').optional().isObject(),
  body('config.automation').optional().isObject(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * Validate AI Trading analyze request
 */
const validateAITradingAnalyze = [
  body('token').notEmpty().isString().trim().escape(),
  body('marketData').optional().isObject(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * Validate AI Trading execute request
 */
const validateAITradingExecute = [
  body('signal').isObject(),
  body('signal.signal').isIn(['buy', 'sell', 'hold']),
  body('signal.confidence').isFloat({ min: 0, max: 1 }),
  body('signal.entryPrice').optional().isFloat({ min: 0 }),
  body('signal.stopLoss').optional().isFloat({ min: 0 }),
  body('signal.takeProfit').optional().isFloat({ min: 0 }),
  body('tokenIn').optional().isString().trim().escape(),
  body('tokenOut').optional().isString().trim().escape(),
  body('amountIn').optional().isFloat({ min: 0 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * Validate user ID parameter
 */
const validateUserId = [
  param('userId').notEmpty().isString().trim().escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * Sanitize input (prevent XSS)
 */
const sanitizeInput = (req, res, next) => {
  // TODO: Implementation
  // - Sanitize string inputs
  // - Remove HTML tags
  // - Escape special characters
  // - Prevent SQL injection
  
  // Example: Sanitize string fields
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim().replace(/[<>]/g, '');
      }
    }
  }
  
  next();
};

module.exports = {
  validateAITradingStart,
  validateAITradingAnalyze,
  validateAITradingExecute,
  validateUserId,
  sanitizeInput
};

