# 📁 Arhitectura Fișierelor - BitSwapDEX Proiect

## 🎯 Structură Completă (Schelet - Nu Linkat încă)

```
src/components/DEX/Proiect/
│
├── 📄 README.md                          # Overview Proiect
├── 📄 TODO.md                            # TODO List Complet
├── 📄 IMPLEMENTATION_STATUS.md           # Status Implementare
│
├── 📁 architecture/                      # Documentație Arhitectură
│   ├── ARCHITECTURE.md                   # Arhitectură Generală
│   ├── SMART_CONTRACTS.md                # Smart Contracts Design
│   ├── AI_TRADING_ARCHITECTURE.md        # AI Trading System Design
│   └── DEPLOYMENT.md                     # Deployment Strategy
│
├── 📁 contracts/                         # Smart Contracts
│   ├── BitSwapDEXWrapper.sol             # ✅ Main Wrapper Contract (IMPLEMENTAT)
│   ├── BitSwapDEXSmartOffer.sol          # Smart Offers Contract (TO DO)
│   ├── BitSwapDEXAITradingHook.sol       # AI Trading Hook (TO DO)
│   ├── BitSwapDEXStaking.sol             # Staking Contract (TO DO)
│   ├── BitSwapDEXTreasury.sol            # Treasury Management (TO DO)
│   └── 📁 interfaces/
│       ├── IPancakeRouter.sol            # PancakeSwap Router Interface
│       ├── ISmartOffer.sol               # Smart Offer Interface
│       ├── IAITradingHook.sol            # AI Trading Hook Interface
│       └── IERC20.sol                    # ERC20 Interface (standard)
│
├── 📁 ai-trading/                        # 🤖 AI Trading System
│   │
│   ├── 📁 core/                          # Core AI Trading Engine
│   │   ├── AITradingEngine.js            # Main AI Trading Engine
│   │   ├── AITradingStrategies.js        # Trading Strategies (Trend, Mean Reversion, etc.)
│   │   ├── AITradingSignals.js           # Signal Generation
│   │   ├── AITradingRiskManager.js       # Risk Management
│   │   └── AITradingExecution.js         # Trade Execution
│   │
│   ├── 📁 models/                        # AI Models
│   │   ├── LocalLLMModel.js              # Local LLM Integration (Llama, Mistral, etc.)
│   │   ├── OpenAIModel.js                # OpenAI API Integration
│   │   ├── AnthropicModel.js             # Claude API Integration
│   │   ├── HybridModel.js                # Hybrid Approach (Local + API)
│   │   └── FineTunedModel.js             # Fine-tuned Model pentru Trading
│   │
│   ├── 📁 training/                      # Training & Learning
│   │   ├── TradingDataCollector.js       # Collect Historical Trading Data
│   │   ├── TradingDataPreprocessor.js    # Preprocess Data pentru Training
│   │   ├── TradingModelTrainer.js        # Train AI Model
│   │   ├── TradingModelEvaluator.js      # Evaluate Model Performance
│   │   ├── ReinforcementLearning.js      # RL pentru Trading
│   │   └── 📁 data/
│   │       ├── historical-trades/        # Historical Trade Data
│   │       ├── market-data/              # Market Data (prices, volume, etc.)
│   │       └── training-datasets/        # Prepared Training Datasets
│   │
│   ├── 📁 strategies/                    # Trading Strategies
│   │   ├── TrendFollowing.js             # Trend Following Strategy
│   │   ├── MeanReversion.js              # Mean Reversion Strategy
│   │   ├── Arbitrage.js                  # Arbitrage Strategy
│   │   ├── VolumeAnalysis.js             # Volume Analysis Strategy
│   │   ├── MarketMaking.js               # Market Making Strategy
│   │   └── PortfolioOptimization.js      # Portfolio Optimization Strategy
│   │
│   ├── 📁 indicators/                    # Technical Indicators
│   │   ├── MovingAverage.js              # MA, EMA, SMA
│   │   ├── RSI.js                        # Relative Strength Index
│   │   ├── MACD.js                       # MACD Indicator
│   │   ├── BollingerBands.js             # Bollinger Bands
│   │   ├── Stochastic.js                 # Stochastic Oscillator
│   │   └── VolumeIndicators.js           # Volume Indicators
│   │
│   ├── 📁 signals/                       # Trading Signals
│   │   ├── SignalGenerator.js            # Generate Trading Signals
│   │   ├── SignalValidator.js            # Validate Signals
│   │   ├── SignalExecutor.js             # Execute Signals
│   │   └── SignalBacktester.js           # Backtest Signals
│   │
│   ├── 📁 risk/                          # Risk Management
│   │   ├── RiskCalculator.js             # Calculate Risk Metrics
│   │   ├── PositionSizer.js              # Calculate Position Size
│   │   ├── StopLossManager.js            # Stop Loss Management
│   │   ├── TakeProfitManager.js          # Take Profit Management
│   │   └── RiskLimiter.js                # Risk Limit Enforcement
│   │
│   ├── 📁 execution/                     # Trade Execution
│   │   ├── OrderPlacer.js                # Place Orders
│   │   ├── OrderManager.js               # Manage Orders
│   │   ├── SmartOfferCreator.js          # Create Smart Offers
│   │   ├── SlippageCalculator.js         # Calculate Slippage
│   │   └── GasOptimizer.js               # Optimize Gas Costs
│   │
│   ├── 📁 monitoring/                    # Monitoring & Analytics
│   │   ├── PerformanceTracker.js         # Track Performance
│   │   ├── TradeAnalyzer.js              # Analyze Trades
│   │   ├── PortfolioAnalyzer.js          # Analyze Portfolio
│   │   ├── AlertManager.js               # Manage Alerts
│   │   └── ReportGenerator.js            # Generate Reports
│   │
│   ├── 📁 config/                        # Configuration
│   │   ├── aiConfig.js                   # AI Configuration
│   │   ├── strategyConfig.js             # Strategy Configuration
│   │   ├── riskConfig.js                 # Risk Configuration
│   │   └── executionConfig.js            # Execution Configuration
│   │
│   └── 📁 utils/                         # Utilities
│       ├── DataFetcher.js                # Fetch Market Data
│       ├── PriceOracle.js                # Price Oracle
│       ├── Logger.js                     # Logging Utility
│       └── Validator.js                  # Validation Utilities
│
├── 📁 services/                          # Backend Services
│   ├── SwapExecutionService.js           # Swap Execution (extended)
│   ├── SmartOfferService.js              # Smart Offer Management
│   ├── AITradingService.js               # AI Trading Service
│   ├── TreasuryService.js                # Treasury Management
│   ├── StakingService.js                 # Staking Service
│   └── AnalyticsService.js               # Analytics Service
│
├── 📁 frontend/                          # Frontend Components
│   ├── 📁 components/
│   │   ├── AITradingDashboard.jsx        # AI Trading Dashboard
│   │   ├── AITradingConfig.jsx           # AI Configuration UI
│   │   ├── StrategySelector.jsx          # Strategy Selection UI
│   │   ├── RiskLimitsConfig.jsx          # Risk Limits Configuration
│   │   ├── TradingConditions.jsx         # Trading Conditions UI
│   │   ├── ActiveTradesList.jsx          # Active Trades Display
│   │   ├── PerformanceChart.jsx          # Performance Charts
│   │   ├── TreasuryDashboard.jsx         # Treasury Dashboard
│   │   └── SmartOfferCreator.jsx         # Smart Offer Creator
│   │
│   ├── 📁 hooks/
│   │   ├── useAITrading.js               # AI Trading Hook
│   │   ├── useTradingStrategies.js       # Trading Strategies Hook
│   │   ├── useRiskManagement.js          # Risk Management Hook
│   │   └── usePerformanceTracking.js     # Performance Tracking Hook
│   │
│   └── 📁 styles/
│       ├── AITradingDashboard.css        # Dashboard Styles
│       └── TreasuryDashboard.css         # Treasury Styles
│
├── 📁 docs/                              # Documentație
│   ├── MY_PERSONAL_RECOMMENDATION_OXIUM.md
│   ├── OXIUM_INTEGRATION_ANALYSIS.md
│   ├── OXIUM_MONETIZATION_ANALYSIS.md
│   ├── AI_TRADING_AUTOMATION_PROPOSAL.md
│   ├── PHASE1_IMPLEMENTATION_PLAN.md
│   ├── OXIUM_NEXT_STEPS.md
│   └── DEPLOYMENT.md
│
├── 📁 tests/                             # Tests
│   ├── 📁 contracts/
│   │   ├── BitSwapDEXWrapper.test.js     # Wrapper Contract Tests
│   │   ├── BitSwapDEXSmartOffer.test.js  # Smart Offer Tests
│   │   └── BitSwapDEXAITradingHook.test.js # AI Hook Tests
│   │
│   ├── 📁 ai-trading/
│   │   ├── AITradingEngine.test.js       # AI Engine Tests
│   │   ├── Strategies.test.js            # Strategy Tests
│   │   └── RiskManager.test.js           # Risk Manager Tests
│   │
│   └── 📁 integration/
│       ├── SwapFlow.test.js              # End-to-End Swap Tests
│       └── AITradingFlow.test.js         # End-to-End AI Trading Tests
│
└── 📁 scripts/                           # Deployment & Utility Scripts
    ├── deploy.js                         # Deploy Contracts
    ├── verify.js                         # Verify Contracts
    ├── train-ai-model.js                 # Train AI Model
    ├── backtest-strategy.js              # Backtest Strategy
    └── generate-reports.js               # Generate Reports
```

---

## 🎯 Structură AI Trading (Detaliată)

### **1. Core AI Trading Engine**
```
ai-trading/core/
├── AITradingEngine.js          # Orchestrează tot sistemul AI
├── AITradingStrategies.js      # Gestionare strategii multiple
├── AITradingSignals.js         # Generare semnale de trading
├── AITradingRiskManager.js     # Gestionare risc
└── AITradingExecution.js       # Executare tranzacții
```

### **2. AI Models**
```
ai-trading/models/
├── LocalLLMModel.js            # Llama 3, Mistral, etc. (local)
├── OpenAIModel.js              # GPT-4, GPT-4 Turbo (API)
├── AnthropicModel.js           # Claude 3 Opus, Sonnet (API)
├── HybridModel.js              # Combină Local + API
└── FineTunedModel.js           # Model antrenat specific pentru trading
```

### **3. Training System**
```
ai-trading/training/
├── TradingDataCollector.js     # Colectează date istorice
├── TradingDataPreprocessor.js  # Preprocesare date
├── TradingModelTrainer.js      # Antrenare model
├── TradingModelEvaluator.js    # Evaluare performanță
└── ReinforcementLearning.js    # RL pentru trading automat
```

---

## 🚀 Next Steps

1. **Week 1-2:** Creare schelet (toate fișierele goale cu comentarii)
2. **Week 3-4:** Implementare Core AI Trading Engine
3. **Week 5-6:** Implementare Training System
4. **Week 7-8:** Integrare cu Smart Contracts

---

**Last Updated:** 2026-01-08  
**Status:** 🟡 Architecture Planning Phase

