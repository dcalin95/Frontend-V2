/**
 * 🚀 BitSwapDEX AI Trading Backend Server
 * 
 * Backend server standalone pentru BitSwapDEX AI Trading system.
 * Complet independent - poate fi deployat separat pe Render sau alt platform.
 * 
 * @module server
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import database config (pentru viitor - când va fi propriul database)
const db = require('./config/database');

// Import routes
const healthRoutes = require('./routes/health');
const aiTradingRoutes = require('./routes/ai-trading/aiTradingRoutes');
const strategiesRoutes = require('./routes/ai-trading/strategiesRoutes');
const signalsRoutes = require('./routes/ai-trading/signalsRoutes');
const executionRoutes = require('./routes/ai-trading/executionRoutes');
const performanceRoutes = require('./routes/ai-trading/performanceRoutes');

// Create Express app
const app = express();

// ===== Server Configuration =====
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const APP_VERSION = process.env.APP_VERSION || '1.0.0';

// CORS configuration
const CORS_ALLOWED_ORIGINS = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:5173']; // Default pentru development

// ===== Middleware Setup =====

// Security headers
app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false, // Disable CSP în development pentru debugging
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (CORS_ALLOWED_ORIGINS.includes(origin) || NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (în development)
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, { ip: req.ip, userAgent: req.get('user-agent') });
    next();
  });
}

// ===== Routes Setup =====

// Health check (public - nu necesită auth)
app.use('/api/health', healthRoutes);
app.use('/health', healthRoutes); // Alias pentru compatibility

// AI Trading routes (protected - necesită auth)
app.use('/api/ai-trading', aiTradingRoutes);

// Strategy management routes (protected)
app.use('/api/ai-trading/strategies', strategiesRoutes);

// Signal management routes (protected)
app.use('/api/ai-trading/signals', signalsRoutes);

// Trade execution routes (protected)
app.use('/api/ai-trading/execution', executionRoutes);

// Performance tracking routes (protected, dar unele endpoints pot fi public)
app.use('/api/ai-trading/performance', performanceRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'BitSwapDEX AI Trading Backend',
    version: APP_VERSION,
    status: 'running',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      aiTrading: '/api/ai-trading',
      strategies: '/api/ai-trading/strategies',
      signals: '/api/ai-trading/signals',
      execution: '/api/ai-trading/execution',
      performance: '/api/ai-trading/performance'
    }
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'BitSwapDEX AI Trading API',
    version: APP_VERSION,
    status: 'running',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    documentation: 'https://github.com/bitswapdex/backend#api-documentation',
    endpoints: {
      health: '/api/health',
      aiTrading: {
        base: '/api/ai-trading',
        start: 'POST /api/ai-trading/start',
        stop: 'POST /api/ai-trading/stop',
        status: 'GET /api/ai-trading/status',
        stats: 'GET /api/ai-trading/stats',
        analyze: 'POST /api/ai-trading/analyze'
      },
      strategies: {
        base: '/api/ai-trading/strategies',
        list: 'GET /api/ai-trading/strategies',
        create: 'POST /api/ai-trading/strategies',
        update: 'PUT /api/ai-trading/strategies/:id',
        delete: 'DELETE /api/ai-trading/strategies/:id'
      },
      signals: {
        base: '/api/ai-trading/signals',
        list: 'GET /api/ai-trading/signals',
        get: 'GET /api/ai-trading/signals/:id',
        generate: 'POST /api/ai-trading/signals/generate',
        validate: 'POST /api/ai-trading/signals/:id/validate'
      },
      execution: {
        base: '/api/ai-trading/execution',
        execute: 'POST /api/ai-trading/execution/execute',
        trades: 'GET /api/ai-trading/execution/trades',
        trade: 'GET /api/ai-trading/execution/trades/:id',
        cancel: 'POST /api/ai-trading/execution/trades/:id/cancel'
      },
      performance: {
        base: '/api/ai-trading/performance',
        metrics: 'GET /api/ai-trading/performance/metrics',
        riskMetrics: 'GET /api/ai-trading/performance/risk-metrics',
        history: 'GET /api/ai-trading/performance/history',
        charts: 'GET /api/ai-trading/performance/charts'
      }
    }
  });
});

// ===== Error Handling =====

// 404 Not Found handler (trebuie să fie după toate routes)
app.use(notFoundHandler);

// Global error handler (trebuie să fie ultimul middleware)
app.use(errorHandler);

// ===== Database Connection (pentru viitor - când va fi propriul database) =====

async function initializeDatabase() {
  try {
    // Test database connection
    if (db && db.sequelize) {
      await db.sequelize.authenticate();
      logger.info('Database connection established successfully');
      
      // Sync models (doar în development - în production folosește migrations)
      if (NODE_ENV === 'development' && process.env.SYNC_DB === 'true') {
        logger.warn('Syncing database models (development mode)');
        await db.sequelize.sync({ alter: false }); // alter: false pentru siguranță
        logger.info('Database models synced');
      }
    } else {
      logger.warn('Database not configured - running without database');
    }
  } catch (error) {
    logger.error('Database connection error:', error);
    // Nu opri server-ul dacă database nu e disponibil - poate rula fără (pentru testing)
    if (NODE_ENV === 'production') {
      logger.error('Cannot start server without database in production mode');
      // process.exit(1); // Uncomment dacă vrei să oprești server-ul dacă database nu e disponibil
    }
  }
}

// ===== Server Startup =====

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();

    // Start HTTP server
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 BitSwapDEX AI Trading Backend Server started`);
      logger.info(`   Version: ${APP_VERSION}`);
      logger.info(`   Environment: ${NODE_ENV}`);
      logger.info(`   Port: ${PORT}`);
      logger.info(`   Health Check: http://localhost:${PORT}/api/health`);
      logger.info(`   API Info: http://localhost:${PORT}/api`);
      
      if (NODE_ENV === 'development') {
        logger.info(`   🛠️  Development mode - Debug logging enabled`);
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        
        // Close database connection
        if (db && db.sequelize) {
          db.sequelize.close().then(() => {
            logger.info('Database connection closed');
            process.exit(0);
          }).catch((error) => {
            logger.error('Error closing database connection:', error);
            process.exit(1);
          });
        } else {
          process.exit(0);
        }
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        
        // Close database connection
        if (db && db.sequelize) {
          db.sequelize.close().then(() => {
            logger.info('Database connection closed');
            process.exit(0);
          }).catch((error) => {
            logger.error('Error closing database connection:', error);
            process.exit(1);
          });
        } else {
          process.exit(0);
        }
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Nu opri server-ul, doar loghează eroarea
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      // Opțiune: oprește server-ul pentru uncaught exceptions
      // process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server (dacă e rulat direct, nu când e importat ca modul)
if (require.main === module) {
  startServer();
}

// Export app pentru testing
module.exports = app;

