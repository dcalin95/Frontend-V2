/**
 * 🔧 Route Helpers - Utility Functions pentru Routes
 * 
 * Helper functions pentru common operations în routes:
 * - Extract userId
 * - Parse query parameters
 * - Validate pagination
 * 
 * @module helpers
 */

/**
 * Extract userId din request (din authenticated user sau din query/body)
 * @param {Object} req - Express request object
 * @param {string} source - 'body' sau 'query' (default: 'query')
 * @returns {string|null} User ID sau null
 */
function extractUserId(req, source = 'query') {
  // Priority: authenticated user > body > query
  if (req.user?.id) {
    return req.user.id;
  }
  
  if (source === 'body' && req.body?.userId) {
    return req.body.userId;
  }
  
  if (source === 'query' && req.query?.userId) {
    return req.query.userId;
  }
  
  return null;
}

/**
 * Parse și validate pagination parameters
 * @param {Object} query - Query object
 * @param {number} defaultLimit - Default limit (default: 50)
 * @param {number} maxLimit - Maximum limit (default: 100)
 * @returns {Object} { limit, offset, hasMore }
 */
function parsePagination(query, defaultLimit = 50, maxLimit = 100) {
  const limit = Math.min(parseInt(query.limit) || defaultLimit, maxLimit);
  const offset = parseInt(query.offset) || 0;
  
  return { limit, offset };
}

/**
 * Parse și validate period string (1d, 7d, 30d, 90d, 1y)
 * @param {string} period - Period string
 * @returns {number} Number of days
 */
function parsePeriod(period) {
  const periodMap = {
    '1d': 1,
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365,
    'all': 0 // 0 = all time
  };
  
  return periodMap[period] !== undefined ? periodMap[period] : 30; // Default 30 days
}

/**
 * Get date range from period
 * @param {string} period - Period string
 * @returns {Object} { startDate, endDate }
 */
function getDateRangeFromPeriod(period) {
  const endDate = new Date();
  const days = parsePeriod(period);
  
  if (days === 0) {
    // All time - use epoch start
    return {
      startDate: new Date(0),
      endDate
    };
  }
  
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return { startDate, endDate };
}

/**
 * Safe parse integer
 * @param {*} value - Value to parse
 * @param {number} defaultValue - Default value dacă parsing fails
 * @returns {number} Parsed integer
 */
function safeParseInt(value, defaultValue = 0) {
  const parsed = parseInt(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Safe parse float
 * @param {*} value - Value to parse
 * @param {number} defaultValue - Default value dacă parsing fails
 * @returns {number} Parsed float
 */
function safeParseFloat(value, defaultValue = 0) {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Calculate pagination metadata
 * @param {number} offset - Current offset
 * @param {number} limit - Current limit
 * @param {number} total - Total count
 * @param {number} returned - Number of items returned
 * @returns {Object} Pagination metadata
 */
function getPaginationMetadata(offset, limit, total, returned) {
  return {
    limit,
    offset,
    total,
    hasMore: offset + returned < total,
    currentPage: Math.floor(offset / limit) + 1,
    totalPages: Math.ceil(total / limit)
  };
}

module.exports = {
  extractUserId,
  parsePagination,
  parsePeriod,
  getDateRangeFromPeriod,
  safeParseInt,
  safeParseFloat,
  getPaginationMetadata
};

