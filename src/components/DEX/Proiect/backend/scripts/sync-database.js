/**
 * 🔄 Sync Database Script - Database Sync (Development Only)
 * 
 * Sync database models (development only):
 * - Sync all models to database
 * - Create/update tables
 * - WARNING: Only use în development!
 * 
 * @module sync-database
 */

require('dotenv').config();

const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Sync database
 */
async function syncDatabase() {
  try {
    logger.info('Starting database sync...');

    // Check if in development mode
    const NODE_ENV = process.env.NODE_ENV || 'development';
    if (NODE_ENV === 'production') {
      logger.error('Cannot sync database în production mode!');
      logger.error('Use migrations instead: npm run migrate');
      process.exit(1);
    }

    // Test database connection
    if (!db || !db.sequelize) {
      logger.error('Database not configured!');
      logger.error('Please set DATABASE_URL or DB_* environment variables');
      process.exit(1);
    }

    await db.sequelize.authenticate();
    logger.info('Database connection established');

    // Sync models (alter: false pentru siguranță - nu modifică existent tables)
    const force = process.env.SYNC_DB_FORCE === 'true';
    if (force) {
      logger.warn('⚠️  FORCE sync enabled - existing tables will be dropped!');
    }

    await db.sequelize.sync({ alter: false, force: force });
    logger.info('Database models synced successfully');

    logger.info('Database sync completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error syncing database:', error);
    process.exit(1);
  }
}

// Run sync dacă e executat direct
if (require.main === module) {
  syncDatabase();
}

module.exports = {
  syncDatabase
};

