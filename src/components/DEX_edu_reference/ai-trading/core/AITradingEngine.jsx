/**
 * 🤖 AI Trading Engine - Main Orchestrator
 * 
 * Orchestrează tot sistemul AI Trading:
 * - Local LLM pentru decizii rapide
 * - Cloud AI pentru analize complexe
 * - Fine-tuned Model pentru predicții specifice
 * - Strategies pentru diferite abordări
 * - Risk Management pentru protecție
 * - Execution pentru tranzacții
 * 
 * @module AITradingEngine
 */

import { AITradingStrategies } from './AITradingStrategies.js';
import { AITradingRiskManager } from './AITradingRiskManager.js';
import { AITradingExecution } from './AITradingExecution.js';
import { AITradingSignals } from './AITradingSignals.js';
import { 
  isBitcoinToken, 
  isBitcoinPair, 
  getBestBitcoinTokenForTrade,
  normalizeBitcoinTokenForMarketData,
  formatBitcoinTokenForDisplay
} from '../utils/bitcoinTokens.js';

export class AITradingEngine {
  constructor(config = {}) {
    // Initialize core components
    this.strategies = new AITradingStrategies();
    this.riskManager = new AITradingRiskManager(config.risk || {});
    this.executor = new AITradingExecution(config.execution || {});
    this.signals = new AITradingSignals();

    // AI Models (lazy loaded)
    this.localLLM = null;
    this.cloudAI = null;
    this.fineTunedModel = null;
    this.config = config;

    // State
    this.isRunning = false;
    this.monitoringInterval = null;
    this.tradingConfig = null;

    // Performance tracking
    this.stats = {
      signalsGenerated: 0,
      tradesExecuted: 0,
      tradesSuccessful: 0,
      tradesFailed: 0,
      totalProfit: 0,
      startTime: null
    };
  }

  /**
   * Analizează market conditions și generează trading signal (cu Bitcoin support - Oxium-inspired)
   * @param {string} token - Token symbol (BTC, WBTC, BTCB, ETH, BNB, etc.) sau address
   * @param {Object} marketData - Market data (price, volume, indicators, etc.)
   * @returns {Promise<Object>} Trading signal cu signal, confidence, reasoning, entryPrice, stopLoss, takeProfit
   */
  async analyzeMarket(token, marketData) {
    try {
      // Bitcoin token normalization (Oxium-inspired)
      const isBitcoin = isBitcoinToken(token);
      const normalizedToken = isBitcoin ? normalizeBitcoinTokenForMarketData(token) : token;
      
      // Add Bitcoin-specific info dacă e Bitcoin token
      if (isBitcoin) {
        marketData.isBitcoin = true;
        marketData.bitcoinToken = formatBitcoinTokenForDisplay(token);
        marketData.originalToken = token; // Keep original pentru execution
      }
      
      // 1. Analyze cu strategies (cu Bitcoin support)
      const strategySignals = await this.strategies.analyzeAll(normalizedToken, marketData);
      
      // 2. Combine signals
      const combinedSignal = this.strategies.combineSignals(strategySignals);

      // 3. Local LLM - Fast analysis (<100ms) - dacă e configurat
      let localAnalysis = null;
      if (this.localLLM && this.config.enableLocalLLM !== false) {
        try {
          localAnalysis = await this.localLLM.analyze({
            token: normalizedToken,
            originalToken: token, // Keep original pentru Bitcoin tokens
            marketData,
            strategies: this.strategies.getEnabledStrategies(),
            isBitcoin: isBitcoin
          });
        } catch (error) {
          console.warn('Local LLM analysis failed:', error);
        }
      }

      // 4. Cloud AI - Complex analysis (1-3s) dacă confidence < 0.7 sau dacă e configurat
      let cloudAnalysis = null;
      if ((combinedSignal.confidence < 0.7 || this.config.alwaysUseCloudAI) && this.cloudAI) {
        try {
          cloudAnalysis = await this.cloudAI.analyze({
            token: normalizedToken,
            originalToken: token, // Keep original pentru Bitcoin tokens
            marketData,
            context: { combinedSignal, localAnalysis },
            isBitcoin: isBitcoin
          });
        } catch (error) {
          console.warn('Cloud AI analysis failed:', error);
        }
      }

      // 5. Fine-tuned Model - Trading-specific prediction - dacă e configurat
      let fineTunedPrediction = null;
      if (this.fineTunedModel) {
        try {
          fineTunedPrediction = await this.fineTunedModel.predict({
            token: normalizedToken,
            originalToken: token, // Keep original pentru Bitcoin tokens
            marketData,
            combinedSignal,
            localAnalysis,
            isBitcoin: isBitcoin,
            cloudAnalysis
          });
        } catch (error) {
          console.warn('Fine-tuned model prediction failed:', error);
        }
      }

      // 6. Combine all analyses
      const finalAnalysis = this.combineAnalyses({
        combinedSignal,
        localAnalysis,
        cloudAnalysis,
        fineTunedPrediction,
        marketData
      });

      // 7. Generate signal
      const signal = this.signals.generateSignal(marketData, finalAnalysis);
      this.stats.signalsGenerated++;

      return signal;
    } catch (error) {
      console.error('Error in analyzeMarket:', error);
      return {
        signal: 'hold',
        confidence: 0,
        reasoning: `Error: ${error.message}`,
        entryPrice: null,
        stopLoss: null,
        takeProfit: null,
        valid: false
      };
    }
  }

  /**
   * Combine multiple analyses într-unul final
   * @private
   */
  combineAnalyses({ combinedSignal, localAnalysis, cloudAnalysis, fineTunedPrediction, marketData }) {
    // Priority: fineTunedPrediction > cloudAnalysis > localAnalysis > combinedSignal
    let final = { ...combinedSignal };

    if (fineTunedPrediction) {
      // Fine-tuned model are prioritate maximă
      final = {
        ...final,
        signal: fineTunedPrediction.signal || final.signal,
        confidence: Math.max(final.confidence, fineTunedPrediction.confidence || 0),
        reasoning: `Fine-tuned: ${fineTunedPrediction.reasoning || ''}; ${final.reasoning}`,
        entryPrice: fineTunedPrediction.entryPrice || final.entryPrice || marketData.price,
        stopLoss: fineTunedPrediction.stopLoss || final.stopLoss,
        takeProfit: fineTunedPrediction.takeProfit || final.takeProfit
      };
    } else if (cloudAnalysis) {
      // Cloud AI are prioritate secundară
      final = {
        ...final,
        signal: cloudAnalysis.signal || final.signal,
        confidence: Math.max(final.confidence, cloudAnalysis.confidence || 0),
        reasoning: `Cloud AI: ${cloudAnalysis.reasoning || ''}; ${final.reasoning}`,
        entryPrice: cloudAnalysis.entryPrice || final.entryPrice || marketData.price,
        stopLoss: cloudAnalysis.stopLoss || final.stopLoss,
        takeProfit: cloudAnalysis.takeProfit || final.takeProfit
      };
    } else if (localAnalysis) {
      // Local LLM are prioritate terțiară
      final = {
        ...final,
        signal: localAnalysis.signal || final.signal,
        confidence: Math.max(final.confidence, localAnalysis.confidence || 0),
        reasoning: `Local LLM: ${localAnalysis.reasoning || ''}; ${final.reasoning}`,
        entryPrice: localAnalysis.entryPrice || final.entryPrice || marketData.price,
        stopLoss: localAnalysis.stopLoss || final.stopLoss,
        takeProfit: localAnalysis.takeProfit || final.takeProfit
      };
    }

    return final;
  }

  /**
   * Execută trade bazat pe signal (cu Bitcoin routing optimization - Oxium-inspired)
   * @param {Object} signal - Trading signal de la analyzeMarket
   * @param {Object} options - Execution options { provider, tokenIn, tokenOut, balance, currentPrice }
   * @returns {Promise<Object>} Trade execution result
   */
  async executeTrade(signal, options = {}) {
    if (!signal.valid) {
      return {
        success: false,
        error: `Signal invalid: ${signal.validationErrors?.join(', ') || 'Unknown error'}`,
        tradeId: null
      };
    }

    if (signal.signal === 'hold') {
      return {
        success: false,
        error: 'Signal is hold, no trade to execute',
        tradeId: null
      };
    }

    try {
      // Bitcoin routing optimization (Oxium-inspired)
      const tokenIn = options.tokenIn || signal.tokenIn;
      const tokenOut = options.tokenOut || signal.tokenOut;
      
      // Optimize Bitcoin token selection pentru best liquidity
      if (isBitcoinPair(tokenIn, tokenOut)) {
        const bestBitcoinToken = getBestBitcoinTokenForTrade(tokenIn, tokenOut);
        if (bestBitcoinToken) {
          // Update tokenIn/tokenOut cu best Bitcoin token
          if (isBitcoinToken(tokenIn)) {
            options.tokenIn = bestBitcoinToken.address;
          }
          if (isBitcoinToken(tokenOut)) {
            options.tokenOut = bestBitcoinToken.address;
          }
          
          console.log(`[Bitcoin Routing] Using ${bestBitcoinToken.symbol} for better liquidity`);
        }
      }
      
      // 1. Risk check (cu Bitcoin-specific adjustments)
      const riskCheck = await this.riskManager.check(
        signal,
        options.balance || 0,
        options.currentPrice || signal.entryPrice,
        { isBitcoin: isBitcoinPair(tokenIn, tokenOut) }
      );

      if (!riskCheck.passed) {
        return {
          success: false,
          error: riskCheck.reason,
          tradeId: null,
          riskCheck
        };
      }

      // 2. Execute trade
      const executionResult = await this.executor.execute(signal, riskCheck, options);

      // 3. Track statistics
      if (executionResult.success) {
        this.stats.tradesExecuted++;
        this.stats.tradesSuccessful++;

        // Register position în risk manager
        this.riskManager.registerPosition({
          id: executionResult.tradeId,
          token: options.tokenOut || signal.token,
          entryPrice: executionResult.entryPrice,
          stopLoss: executionResult.stopLoss,
          takeProfit: executionResult.takeProfit,
          amount: executionResult.amountIn
        });
      } else {
        this.stats.tradesExecuted++;
        this.stats.tradesFailed++;
      }

      return executionResult;
    } catch (error) {
      this.stats.tradesExecuted++;
      this.stats.tradesFailed++;

      return {
        success: false,
        error: error.message || 'Unknown execution error',
        tradeId: null
      };
    }
  }

  /**
   * Start AI Trading Bot
   * @param {Object} config - Trading configuration (strategies, risk limits, monitoringInterval, etc.)
   */
  async start(config) {
    if (this.isRunning) {
      console.warn('AI Trading Bot is already running');
      return;
    }

    // 1. Validate config
    if (!config || !config.token || !config.marketDataProvider) {
      throw new Error('Invalid config: token and marketDataProvider required');
    }

    this.tradingConfig = {
      token: config.token,
      tokenIn: config.tokenIn || 'USDT',
      tokenOut: config.tokenOut || config.token,
      marketDataProvider: config.marketDataProvider,
      monitoringInterval: config.monitoringInterval || 60000, // 1 minute default
      autoExecute: config.autoExecute !== false, // Default true
      provider: config.provider, // Web3 provider
      ...config
    };

    // 2. Initialize strategies (dacă nu sunt deja)
    if (config.strategies && Array.isArray(config.strategies)) {
      for (const strategyName of config.strategies) {
        this.strategies.enableStrategy(strategyName);
      }
    }

    // 3. Initialize AI models (lazy load)
    if (this.config.localLLM && !this.localLLM) {
      // Lazy load LocalLLMModel
      const { LocalLLMModel } = await import('../models/LocalLLMModel.js');
      this.localLLM = new LocalLLMModel(this.config.localLLM);
    }

    if (this.config.openAI && !this.cloudAI) {
      // Lazy load OpenAIModel
      const { OpenAIModel } = await import('../models/OpenAIModel.js');
      this.cloudAI = new OpenAIModel(this.config.openAI);
    }

    // 4. Start monitoring loop
    this.isRunning = true;
    this.stats.startTime = Date.now();

    this.monitoringLoop();

    console.log('AI Trading Bot started');
  }

  /**
   * Monitoring loop pentru automated trading
   * @private
   */
  async monitoringLoop() {
    while (this.isRunning) {
      try {
        // Fetch market data
        const marketData = await this.tradingConfig.marketDataProvider(
          this.tradingConfig.token
        );

        // Analyze market
        const signal = await this.analyzeMarket(this.tradingConfig.token, marketData);

        // Execute trade dacă e valid și auto-execute e enabled
        if (signal.valid && signal.signal !== 'hold' && this.tradingConfig.autoExecute) {
          const balance = await this.getBalance(this.tradingConfig.provider);
          
          await this.executeTrade(signal, {
            provider: this.tradingConfig.provider,
            tokenIn: this.tradingConfig.tokenIn,
            tokenOut: this.tradingConfig.tokenOut,
            balance,
            currentPrice: marketData.price
          });
        }

        // Wait pentru next iteration
        await this.delay(this.tradingConfig.monitoringInterval);
      } catch (error) {
        console.error('Error in monitoring loop:', error);
        // Continue loop chiar dacă apare eroare
        await this.delay(5000); // Short delay în caz de eroare
      }
    }
  }

  /**
   * Stop AI Trading Bot
   */
  async stop() {
    if (!this.isRunning) {
      console.warn('AI Trading Bot is not running');
      return;
    }

    // 1. Stop monitoring loop
    this.isRunning = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // 2. Cancel pending orders (dacă e implementat)
    // TODO: Implement cancel pending orders

    // 3. Close open positions (optional) - NU by default
    // Dacă vrei să închizi pozițiile, apelează explicit

    console.log('AI Trading Bot stopped');
  }

  /**
   * Get balance helper
   * @private
   */
  async getBalance(provider) {
    if (!provider) {
      return 0;
    }

    try {
      const address = await provider.getAddress();
      const balance = await provider.getBalance(address);
      return parseFloat(balance.toString()) / 1e18; // Convert from wei to ETH
    } catch (error) {
      console.error('Error getting balance:', error);
      return 0;
    }
  }

  /**
   * Delay helper
   * @private
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get performance statistics
   * @returns {Object} Performance stats
   */
  getStats() {
    const uptime = this.stats.startTime ? Date.now() - this.stats.startTime : 0;
    const successRate = this.stats.tradesExecuted > 0
      ? (this.stats.tradesSuccessful / this.stats.tradesExecuted) * 100
      : 0;

    return {
      ...this.stats,
      uptime,
      uptimeFormatted: this.formatUptime(uptime),
      successRate: `${successRate.toFixed(2)}%`,
      riskMetrics: this.riskManager.getRiskMetrics(),
      executedTrades: this.executor.getExecutedTrades()
    };
  }

  /**
   * Format uptime
   * @private
   */
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}

