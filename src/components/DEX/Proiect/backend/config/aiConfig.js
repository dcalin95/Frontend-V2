/**
 * 🤖 AI Trading Configuration
 * 
 * Configuration pentru AI Trading system:
 * - AI Models configuration
 * - Strategy settings
 * - Risk limits
 * - Performance thresholds
 * 
 * @module aiConfig
 */

module.exports = {
  // AI Models Configuration
  models: {
    // Local LLM
    localLLM: {
      enabled: process.env.ENABLE_LOCAL_LLM === 'true',
      modelPath: process.env.LOCAL_LLM_MODEL_PATH || './models/llama-3-70b-q4.gguf',
      gpuLayers: parseInt(process.env.LOCAL_LLM_GPU_LAYERS || '35'),
      contextSize: parseInt(process.env.LOCAL_LLM_CONTEXT_SIZE || '4096'),
      temperature: parseFloat(process.env.LOCAL_LLM_TEMPERATURE || '0.3')
    },

    // OpenAI API
    openAI: {
      enabled: process.env.ENABLE_OPENAI === 'true',
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.3'),
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '500')
    },

    // Anthropic Claude API
    anthropic: {
      enabled: process.env.ENABLE_ANTHROPIC === 'true',
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      model: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
      temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE || '0.3'),
      maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '500')
    },

    // Fine-tuned Model
    fineTuned: {
      enabled: process.env.ENABLE_FINE_TUNED === 'true',
      modelPath: process.env.FINE_TUNED_MODEL_PATH || './models/bit-swap-dex-trading',
      baseModel: process.env.FINE_TUNED_BASE_MODEL || 'llama-3-70b'
    }
  },

  // Strategy Configuration
  strategies: {
    defaultStrategies: [
      'trend-following',
      'mean-reversion',
      'arbitrage'
    ],
    enabledByDefault: true
  },

  // Risk Limits (Default)
  riskLimits: {
    maxPercentPerTrade: parseFloat(process.env.MAX_PERCENT_PER_TRADE || '5.0'), // 5%
    maxOpenPositions: parseInt(process.env.MAX_OPEN_POSITIONS || '5'),
    dailyLossLimit: parseFloat(process.env.DAILY_LOSS_LIMIT || '10.0'), // 10%
    stopLossDefault: parseFloat(process.env.STOP_LOSS_DEFAULT || '3.0'), // 3%
    takeProfitDefault: parseFloat(process.env.TAKE_PROFIT_DEFAULT || '6.0'), // 6%
    maxDrawdown: parseFloat(process.env.MAX_DRAWDOWN || '20.0'), // 20%
    minConfidence: parseFloat(process.env.MIN_CONFIDENCE || '0.65') // 65%
  },

  // Performance Thresholds
  performance: {
    minWinRate: parseFloat(process.env.MIN_WIN_RATE || '0.50'), // 50%
    minProfitFactor: parseFloat(process.env.MIN_PROFIT_FACTOR || '1.5'), // 1.5
    minSharpeRatio: parseFloat(process.env.MIN_SHARPE_RATIO || '1.0'), // 1.0
    maxDrawdown: parseFloat(process.env.MAX_DRAWDOWN || '0.20') // 20%
  },

  // Monitoring Configuration
  monitoring: {
    interval: parseInt(process.env.MONITORING_INTERVAL || '60000'), // 1 minute
    autoExecute: process.env.AUTO_EXECUTE !== 'false', // Default true
    enableNotifications: process.env.ENABLE_NOTIFICATIONS !== 'false' // Default true
  }
};

