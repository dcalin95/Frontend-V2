/**
 * 🧠 AI Trading Engine Service - Frontend Integration
 * 
 * Frontend service pentru integrare directă cu AI Trading Engine (ES modules):
 * - Load AI Trading Engine din frontend
 * - Analyze market local (dacă e necesar)
 * - Integrare cu backend API
 * 
 * @module aiTradingEngineService
 */

// Note: AI Trading Engine este ES module, va fi importat dinamic
let AITradingEngine = null;
let enginePath = null;

/**
 * Initialize AI Trading Engine path
 */
export function initEnginePath(basePath = '../../ai-trading/core/AITradingEngine.js') {
  enginePath = basePath;
}

/**
 * Load AI Trading Engine (lazy load)
 * @returns {Promise<Class>} AITradingEngine class
 */
export async function loadAITradingEngine() {
  if (AITradingEngine) {
    return AITradingEngine;
  }

  try {
    // Dynamic import pentru ES modules
    if (!enginePath) {
      enginePath = '../../ai-trading/core/AITradingEngine.js';
    }
    
    const engineModule = await import(enginePath);
    AITradingEngine = engineModule.AITradingEngine;
    return AITradingEngine;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error loading AI Trading Engine:', error);
    }
    throw new Error('Failed to load AI Trading Engine. Make sure the engine file exists.');
  }
}

/**
 * Create AI Trading Engine instance
 * @param {Object} config - Engine configuration
 * @returns {Promise<Object>} Engine instance
 */
export async function createEngineInstance(config = {}) {
  const EngineClass = await loadAITradingEngine();
  return new EngineClass(config);
}

/**
 * Analyze market local (using AI Trading Engine)
 * @param {Object} engine - Engine instance
 * @param {string} token - Token symbol
 * @param {Object} marketData - Market data
 * @returns {Promise<Object>} Trading signal
 */
export async function analyzeMarketLocal(engine, token, marketData) {
  if (!engine || typeof engine.analyzeMarket !== 'function') {
    throw new Error('Invalid engine instance');
  }

  try {
    const signal = await engine.analyzeMarket(token, marketData);
    return signal;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error analyzing market locally:', error);
    }
    throw error;
  }
}

/**
 * Start engine local (pentru testing sau offline mode)
 * @param {Object} engine - Engine instance
 * @param {Object} config - Trading configuration
 * @returns {Promise<void>}
 */
export async function startEngineLocal(engine, config) {
  if (!engine || typeof engine.start !== 'function') {
    throw new Error('Invalid engine instance');
  }

  try {
    await engine.start(config);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error starting engine locally:', error);
    }
    throw error;
  }
}

/**
 * Stop engine local
 * @param {Object} engine - Engine instance
 * @returns {Promise<void>}
 */
export async function stopEngineLocal(engine) {
  if (!engine || typeof engine.stop !== 'function') {
    throw new Error('Invalid engine instance');
  }

  try {
    await engine.stop();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error stopping engine locally:', error);
    }
    throw error;
  }
}

/**
 * Get engine stats
 * @param {Object} engine - Engine instance
 * @returns {Object} Engine statistics
 */
export function getEngineStats(engine) {
  if (!engine || typeof engine.getStats !== 'function') {
    return null;
  }

  try {
    return engine.getStats();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting engine stats:', error);
    }
    return null;
  }
}

export default {
  initEnginePath,
  loadAITradingEngine,
  createEngineInstance,
  analyzeMarketLocal,
  startEngineLocal,
  stopEngineLocal,
  getEngineStats
};

