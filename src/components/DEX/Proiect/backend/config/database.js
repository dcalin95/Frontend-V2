/**
 * 💾 Database Configuration
 * 
 * Sequelize database connection și models initialization:
 * - Sequelize connection setup
 * - Models registration
 * - Associations setup
 * - Connection pooling
 * 
 * @module database
 */

const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Database configuration
const DATABASE_URL = process.env.DATABASE_URL || '';
const DB_NAME = process.env.DB_NAME || '';
const DB_USER = process.env.DB_USER || '';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_SSL = process.env.DB_SSL === 'true';

// Create Sequelize instance
let sequelize;

if (DATABASE_URL) {
  // Use connection string (Render, AWS RDS)
  sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: DB_SSL ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  });
} else {
  // Use individual parameters
  sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
}

// Import models
const Trade = require('../models/Trade')(sequelize);
const Signal = require('../models/Signal')(sequelize);
const Strategy = require('../models/Strategy')(sequelize);
const Performance = require('../models/Performance')(sequelize);
const Bot = require('../models/Bot')(sequelize);

// Define associations
// Trade -> Signal (many-to-one)
Trade.belongsTo(Signal, {
  foreignKey: 'signalId',
  as: 'signal'
});

Signal.hasMany(Trade, {
  foreignKey: 'signalId',
  as: 'trades'
});

// Export models și sequelize instance
const models = {
  Trade,
  Signal,
  Strategy,
  Performance,
  Bot,
  sequelize
};

/**
 * Test database connection
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('Unable to connect to database:', error);
    throw error;
  }
};

/**
 * Sync database (create tables dacă nu există)
 * ⚠️ Use only în development!
 */
const syncDatabase = async (force = false) => {
  try {
    if (process.env.NODE_ENV === 'production' && force) {
      throw new Error('Cannot force sync în production!');
    }

    await sequelize.sync({ force });
    logger.info('Database synced successfully');
    return true;
  } catch (error) {
    logger.error('Error syncing database:', error);
    throw error;
  }
};

module.exports = {
  ...models,
  testConnection,
  syncDatabase
};

