/**
 * ❤️ Health Check Route
 * 
 * Health check endpoint pentru monitoring:
 * - Database connection check
 * - Blockchain connection check
 * - Service status
 * 
 * @module health
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const logger = require('../utils/logger');

// Helper function pentru test database connection
async function testDatabaseConnection() {
  try {
    await db.sequelize.authenticate();
    return { connected: true };
  } catch (error) {
    return { connected: false, error: error.message };
  }
}

/**
 * GET /health
 * Health check endpoint
 */
router.get('/', async (req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
      services: {
        database: 'unknown',
        blockchain: 'unknown'
      }
    };

    // Check database connection
    try {
      const dbCheck = await testDatabaseConnection();
      health.services.database = dbCheck.connected ? 'connected' : 'disconnected';
      if (!dbCheck.connected) {
        health.status = 'degraded';
      }
    } catch (error) {
      health.services.database = 'disconnected';
      health.status = 'degraded';
    }

    // Check blockchain connection (placeholder - will be implemented when web3 utils are ready)
    try {
      // TODO: Test blockchain connection when web3 utils are ready
      // const provider = web3Utils.getProvider();
      // await provider.getBlockNumber();
      health.services.blockchain = 'unknown'; // Placeholder until web3 utils are implemented
    } catch (error) {
      health.services.blockchain = 'disconnected';
      health.status = 'degraded';
    }

    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message || 'Health check failed'
    });
  }
});

/**
 * GET /health/detailed
 * Detailed health check endpoint
 */
router.get('/detailed', async (req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      services: {
        database: {
          status: 'unknown',
          latency: null
        },
        blockchain: {
          status: 'unknown',
          latency: null,
          chainId: null
        }
      }
    };

    // Detailed database check
    try {
      const start = Date.now();
      const dbCheck = await testDatabaseConnection();
      health.services.database.latency = Date.now() - start;
      health.services.database.status = dbCheck.connected ? 'connected' : 'disconnected';
      if (!dbCheck.connected) {
        health.services.database.error = dbCheck.error;
        health.status = 'degraded';
      }
    } catch (error) {
      health.services.database.status = 'disconnected';
      health.services.database.error = error.message;
      health.status = 'degraded';
    }

    // Detailed blockchain check (placeholder - will be implemented when web3 utils are ready)
    try {
      // TODO: Test blockchain with latency measurement when web3 utils are ready
      // const provider = web3Utils.getProvider();
      // const start = Date.now();
      // const blockNumber = await provider.getBlockNumber();
      // health.services.blockchain.latency = Date.now() - start;
      // health.services.blockchain.chainId = await provider.getNetwork().then(n => n.chainId);
      health.services.blockchain.status = 'unknown'; // Placeholder until web3 utils are implemented
      health.services.blockchain.latency = null;
      health.services.blockchain.chainId = null;
    } catch (error) {
      health.services.blockchain.status = 'disconnected';
      health.services.blockchain.error = error.message;
      health.status = 'degraded';
    }

    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Detailed health check error:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message || 'Health check failed'
    });
  }
});

module.exports = router;

