/**
 * 🚦 Rate Limiting Middleware
 * 
 * Rate limiting pentru API endpoints:
 * - Public endpoints: 100 requests/min per IP
 * - Authenticated: 1000 requests/min per user
 * - Trading execution: 10 requests/min per IP
 * - Admin endpoints: 1000 requests/min per user
 * 
 * @module rateLimit
 */

const rateLimit = require('express-rate-limit');

// Rate limit pentru public endpoints
const publicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limit pentru authenticated endpoints
const authenticatedLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute per user
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  },
  keyGenerator: (req) => {
    // Use user ID dacă e authenticated, altfel IP
    return req.user?.id || req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limit pentru trading execution (more strict)
const tradingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  message: {
    success: false,
    error: 'Too many trading requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limit pentru admin endpoints
const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute per user
  message: {
    success: false,
    error: 'Too many admin requests, please try again later.'
  },
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  publicLimiter,
  authenticatedLimiter,
  tradingLimiter,
  adminLimiter
};

