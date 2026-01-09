/**
 * 🤖 AI Trading Service - Business Logic
 * 
 * Business logic pentru AI Trading system:
 * - Orchestrate AI Trading Engine
 * - Manage user configurations
 * - Track performance
 * - Handle errors
 * 
 * @module AITradingService
 */

const path = require('path');
const MarketDataService = require('./MarketDataService');
const ContractService = require('./ContractService');
const PerformanceService = require('./PerformanceService');
const logger = require('../../utils/logger');

// Import database - adapt pentru pg Pool sau Sequelize
// Note: Acest serviciu va fi copiat în backend-server și va folosi pg Pool direct
// Pentru acum, folosim Sequelize pentru development
const db = require('../../config/database');

// Note: AITradingEngine folosește ES modules, va fi importat dinamic
let AITradingEngine = null;

class AITradingService {
  constructor() {
    this.marketDataService = MarketDataService;
    this.contractService = ContractService;
    this.performanceService = PerformanceService;
    this.db = db;
    
    // User bot instances (pentru multi-user support)
    this.userBots = new Map();
    
    // Lazy load AITradingEngine (ES module)
    this.enginePath = path.join(__dirname, '../../../ai-trading/core/AITradingEngine.js');
  }

  /**
   * Lazy load AITradingEngine (ES module support)
   * @private
   */
  async loadEngine() {
    if (!AITradingEngine) {
      try {
        // Dynamic import pentru ES modules în Node.js
        const engineModule = await import(this.enginePath);
        AITradingEngine = engineModule.AITradingEngine;
      } catch (error) {
        logger.error('Error loading AITradingEngine:', error);
        // Fallback: Create mock engine pentru development
        logger.warn('Using mock AITradingEngine for development');
        AITradingEngine = this.createMockEngine();
      }
    }
    return AITradingEngine;
  }

  /**
   * Create mock engine pentru development/testing
   * @private
   */
  createMockEngine() {
    return class MockAITradingEngine {
      constructor(config) {
        this.config = config;
        this.isRunning = false;
        this.stats = {
          signalsGenerated: 0,
          tradesExecuted: 0,
          tradesSuccessful: 0,
          tradesFailed: 0,
          totalProfit: 0
        };
      }

      async analyzeMarket(token, marketData) {
        return {
          signal: 'hold',
          confidence: 0.5,
          reasoning: 'Mock analysis',
          entryPrice: marketData?.price || null,
          stopLoss: null,
          takeProfit: null
        };
      }

      async start(config) {
        this.isRunning = true;
        this.config = config;
      }

      async stop() {
        this.isRunning = false;
      }

      getStats() {
        return this.stats;
      }
    };
  }

  /**
   * Start AI Trading Bot pentru un user
   * @param {string} userId - User ID
   * @param {Object} config - Trading configuration
   * @returns {Promise<Object>} Bot instance ID
   */
  async start(userId, config) {
    try {
      // 1. Check dacă user are deja bot running
      if (this.userBots.has(userId)) {
        throw new Error('AI Trading Bot already running for this user');
      }

      // 2. Validate config
      this.validateConfig(config);

      // 3. Load AITradingEngine
      const EngineClass = await this.loadEngine();

      // 4. Create AI Trading Engine instance
      const engineConfig = {
        ...config,
        marketDataService: this.marketDataService,
        contractService: this.contractService
      };
      const bot = new EngineClass(engineConfig);

      // 5. Start bot
      await bot.start(config);

      // 6. Generate bot ID
      const botId = `bot_${userId}_${Date.now()}`;

      // 7. Save în database
      try {
        await this.db.Bot.create({
          userId,
          botId,
          config: config,
          status: 'running',
          startedAt: new Date()
        });
      } catch (dbError) {
        logger.warn('Error saving bot to database (continuing anyway):', dbError);
        // Continue even if database save fails
      }

      // 8. Store în memory
      this.userBots.set(userId, {
        botId,
        engine: bot,
        userId,
        config,
        startedAt: new Date()
      });

      return {
        botId,
        message: 'AI Trading Bot started successfully'
      };
    } catch (error) {
      logger.error('Error starting AI Trading Bot:', error);
      throw error;
    }
  }

  /**
   * Stop AI Trading Bot pentru un user
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async stop(userId) {
    try {
      // 1. Get bot instance
      const botInstance = this.userBots.get(userId);
      if (!botInstance) {
        // Check în database dacă există
        const dbBot = await this.db.Bot.findOne({
          where: { userId, status: 'running' }
        });
        
        if (!dbBot) {
          throw new Error('AI Trading Bot not running for this user');
        }

        // Update database only
        await this.db.Bot.update(
          { status: 'stopped', stoppedAt: new Date() },
          { where: { userId, status: 'running' } }
        );

        return { message: 'AI Trading Bot stopped successfully (was already stopped in memory)' };
      }

      // 2. Stop bot engine
      if (botInstance.engine && typeof botInstance.engine.stop === 'function') {
        await botInstance.engine.stop();
      }

      // 3. Update database
      try {
        await this.db.Bot.update(
          { status: 'stopped', stoppedAt: new Date() },
          { where: { userId, status: 'running' } }
        );
      } catch (dbError) {
        logger.warn('Error updating bot in database (continuing anyway):', dbError);
      }

      // 4. Remove din memory
      this.userBots.delete(userId);

      return { message: 'AI Trading Bot stopped successfully' };
    } catch (error) {
      logger.error('Error stopping AI Trading Bot:', error);
      throw error;
    }
  }

  /**
   * Get AI Trading Bot status
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Bot status
   */
  async getStatus(userId) {
    try {
      // 1. Get bot instance from memory
      const botInstance = this.userBots.get(userId);
      
      if (botInstance && botInstance.engine) {
        // Bot is running în memory
        const engineStats = botInstance.engine.getStats ? botInstance.engine.getStats() : {};
        const isRunning = botInstance.engine.isRunning !== false;

        return {
          isRunning,
          mode: botInstance.config?.mode || 'automated', // 'advisory', 'semi-automatic', 'automated'
          strategies: botInstance.config?.strategies || [],
          riskLimits: botInstance.config?.riskLimits || {},
          botId: botInstance.botId,
          startedAt: botInstance.startedAt,
          lastUpdate: new Date(),
          stats: engineStats
        };
      }

      // 2. Check în database
      const dbBot = await this.db.Bot.findOne({
        where: { userId, status: 'running' },
        order: [['startedAt', 'DESC']]
      });

      if (dbBot) {
        return {
          isRunning: true,
          mode: dbBot.config?.mode || 'automated',
          strategies: dbBot.config?.strategies || [],
          riskLimits: dbBot.config?.riskLimits || {},
          botId: dbBot.botId,
          startedAt: dbBot.startedAt,
          lastUpdate: dbBot.updatedAt || dbBot.createdAt,
          note: 'Bot is running but not loaded în memory (will be loaded on next operation)'
        };
      }

      // 3. Bot is not running
      return {
        isRunning: false,
        mode: 'offline',
        message: 'AI Trading Bot is not running'
      };
    } catch (error) {
      logger.error('Error getting bot status:', error);
      throw error;
    }
  }

  /**
   * Get AI Trading Bot statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Bot statistics
   */
  async getStats(userId) {
    try {
      // 1. Get bot instance from memory
      const botInstance = this.userBots.get(userId);
      
      // 2. Get stats from bot engine (dacă e running)
      let engineStats = {};
      if (botInstance && botInstance.engine && typeof botInstance.engine.getStats === 'function') {
        engineStats = botInstance.engine.getStats();
      }

      // 3. Get stats from database (trades, signals, performance)
      // Note: Op will be available from Sequelize sau adaptat pentru pg Pool
      let Op;
      try {
        Op = require('sequelize').Op;
      } catch (e) {
        // Fallback pentru pg Pool (nu folosim Op, folosim direct SQL)
        Op = null;
      }
      
      // Get trades count
      const trades = await this.db.Trade.findAll({
        where: { userId, status: 'executed' },
        attributes: ['status', 'pnl']
      });

      const tradesExecuted = trades.length;
      const tradesSuccessful = trades.filter(t => t.pnl > 0).length;
      const tradesFailed = trades.filter(t => t.pnl <= 0).length;
      const totalProfit = trades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
      const successRate = tradesExecuted > 0 ? ((tradesSuccessful / tradesExecuted) * 100).toFixed(2) : 0;

      // Get signals count
      const signals = await this.db.Signal.count({
        where: { userId }
      });

      // Get performance metrics
      const performance = await this.performanceService.getMetrics(userId, new Date(0), new Date());

      // 4. Calculate uptime
      let uptime = '0s';
      if (botInstance && botInstance.startedAt) {
        const uptimeMs = Date.now() - new Date(botInstance.startedAt).getTime();
        const seconds = Math.floor(uptimeMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
          uptime = `${days}d ${hours % 24}h ${minutes % 60}m`;
        } else if (hours > 0) {
          uptime = `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
          uptime = `${minutes}m ${seconds % 60}s`;
        } else {
          uptime = `${seconds}s`;
        }
      }

      // 5. Combine stats
      return {
        signalsGenerated: engineStats.signalsGenerated || signals,
        tradesExecuted: engineStats.tradesExecuted || tradesExecuted,
        tradesSuccessful: engineStats.tradesSuccessful || tradesSuccessful,
        tradesFailed: engineStats.tradesFailed || tradesFailed,
        totalProfit: engineStats.totalProfit || totalProfit,
        successRate: `${successRate}%`,
        uptime,
        riskMetrics: performance || {},
        engineStats: engineStats
      };
    } catch (error) {
      logger.error('Error getting bot stats:', error);
      // Return minimal stats on error
      return {
        signalsGenerated: 0,
        tradesExecuted: 0,
        tradesSuccessful: 0,
        tradesFailed: 0,
        totalProfit: 0,
        successRate: '0%',
        uptime: '0s',
        error: error.message
      };
    }
  }

  /**
   * Analyze market și generează trading signal
   * @param {string} token - Token symbol
   * @param {string} userId - User ID (optional, pentru user-specific analysis)
   * @param {Object} marketData - Market data (optional, va fi fetched dacă nu e provided)
   * @returns {Promise<Object>} Trading signal
   */
  async analyzeMarket(token, userId = 'system', marketData = null) {
    try {
      // 1. Fetch market data dacă nu e provided
      if (!marketData) {
        marketData = await this.marketDataService.getMarketData(token);
      }

      // 2. Get bot instance (dacă e user-specific) sau create temporary engine
      let engine = null;
      if (userId !== 'system') {
        const botInstance = this.userBots.get(userId);
        if (botInstance && botInstance.engine) {
          engine = botInstance.engine;
        }
      }

      // 3. Create temporary engine dacă nu există
      if (!engine) {
        const EngineClass = await this.loadEngine();
        engine = new EngineClass({
          marketDataService: this.marketDataService,
          contractService: this.contractService
        });
      }

      // 4. Analyze cu AI Trading Engine
      const signal = await engine.analyzeMarket(token, marketData);

      // 5. Save signal în database
      try {
        await this.db.Signal.create({
          userId: userId || 'system',
          token,
          signal: signal.signal, // 'buy', 'sell', 'hold'
          confidence: signal.confidence || 0.5,
          reasoning: signal.reasoning || 'AI analysis',
          entryPrice: signal.entryPrice,
          stopLoss: signal.stopLoss,
          takeProfit: signal.takeProfit,
          priority: signal.priority || 50,
          valid: signal.valid !== false
        });
      } catch (dbError) {
        logger.warn('Error saving signal to database (continuing anyway):', dbError);
        // Continue even if database save fails
      }

      // 6. Return signal
      return {
        signal: signal.signal,
        confidence: signal.confidence || 0.5,
        reasoning: signal.reasoning || 'AI analysis completed',
        entryPrice: signal.entryPrice,
        stopLoss: signal.stopLoss,
        takeProfit: signal.takeProfit,
        token,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Error analyzing market:', error);
      // Return hold signal on error
      return {
        signal: 'hold',
        confidence: 0,
        reasoning: `Error: ${error.message}`,
        entryPrice: null,
        stopLoss: null,
        takeProfit: null,
        token,
        timestamp: new Date(),
        valid: false
      };
    }
  }

  /**
   * Validate trading configuration
   * @private
   */
  validateConfig(config) {
    if (!config) {
      throw new Error('Config is required');
    }

    // Validate strategies array
    if (!config.strategies || !Array.isArray(config.strategies) || config.strategies.length === 0) {
      throw new Error('Strategies array is required and must contain at least one strategy');
    }

    // Validate each strategy
    const validStrategies = ['momentum', 'mean_reversion', 'breakout', 'trend_following', 'arbitrage'];
    for (const strategy of config.strategies) {
      if (typeof strategy === 'string' && !validStrategies.includes(strategy)) {
        throw new Error(`Invalid strategy: ${strategy}. Valid strategies: ${validStrategies.join(', ')}`);
      }
      if (typeof strategy === 'object' && (!strategy.name || !validStrategies.includes(strategy.name))) {
        throw new Error(`Invalid strategy object: ${JSON.stringify(strategy)}`);
      }
    }

    // Validate risk limits
    if (!config.riskLimits || typeof config.riskLimits !== 'object') {
      throw new Error('Risk limits object is required');
    }

    // Validate risk limits values
    const riskLimits = config.riskLimits;
    if (riskLimits.maxPositionSize && (typeof riskLimits.maxPositionSize !== 'number' || riskLimits.maxPositionSize <= 0)) {
      throw new Error('maxPositionSize must be a positive number');
    }

    if (riskLimits.maxDailyLoss && (typeof riskLimits.maxDailyLoss !== 'number' || riskLimits.maxDailyLoss < 0)) {
      throw new Error('maxDailyLoss must be a non-negative number');
    }

    if (riskLimits.maxDrawdown && (typeof riskLimits.maxDrawdown !== 'number' || riskLimits.maxDrawdown < 0 || riskLimits.maxDrawdown > 100)) {
      throw new Error('maxDrawdown must be a number between 0 and 100');
    }

    if (riskLimits.stopLossPercentage && (typeof riskLimits.stopLossPercentage !== 'number' || riskLimits.stopLossPercentage < 0 || riskLimits.stopLossPercentage > 100)) {
      throw new Error('stopLossPercentage must be a number between 0 and 100');
    }

    // Validate mode
    const validModes = ['advisory', 'semi-automatic', 'automated'];
    if (config.mode && !validModes.includes(config.mode)) {
      throw new Error(`Invalid mode: ${config.mode}. Valid modes: ${validModes.join(', ')}`);
    }

    // Validate token (dacă e specificat)
    if (config.token && typeof config.token !== 'string') {
      throw new Error('token must be a string (token symbol)');
    }

    // Validate automation settings (dacă mode este automated)
    if (config.mode === 'automated') {
      if (config.automation === undefined || typeof config.automation !== 'object') {
        throw new Error('automation settings are required for automated mode');
      }
    }
  }
}

module.exports = new AITradingService();

