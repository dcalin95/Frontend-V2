# 📦 Frontend Services - AI Trading

**Location:** `src/components/DEX/Proiect/services/`

**Purpose:** Frontend services pentru interacțiune cu AI Trading Backend API și AI Trading Engine.

---

## 📁 Files Structure

```
services/
├── aiTradingApiService.js      # API client pentru AI Trading endpoints
├── strategyApiService.js        # API client pentru Strategy management
├── signalApiService.js          # API client pentru Signal management
├── performanceApiService.js     # API client pentru Performance tracking
├── aiTradingEngineService.js    # Frontend integration cu AI Trading Engine
├── index.js                     # Central export
└── README.md                    # This file
```

---

## 🔧 Services Overview

### **1. aiTradingApiService.js**
Frontend API client pentru AI Trading endpoints:
- `startAITradingBot(userId, config)` - Start bot
- `stopAITradingBot(userId)` - Stop bot
- `getAITradingBotStatus(userId)` - Get status
- `getAITradingBotStats(userId)` - Get statistics
- `analyzeMarket(userId, token, marketData)` - Analyze market
- `getContractState()` - Get contract state

**API Base URL:** `process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/ai-trading'`

---

### **2. strategyApiService.js**
Frontend API client pentru Strategy management:
- `getStrategies(userId)` - List all strategies
- `getStrategy(strategyId, userId)` - Get strategy details
- `createStrategy(strategyData)` - Create new strategy
- `updateStrategy(strategyId, updates)` - Update strategy
- `deleteStrategy(strategyId, userId)` - Delete strategy
- `enableStrategy(strategyId, userId)` - Enable strategy
- `disableStrategy(strategyId, userId)` - Disable strategy

**API Base URL:** `process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/ai-trading/strategies'`

---

### **3. signalApiService.js**
Frontend API client pentru Signal management:
- `getSignals(userId, filters)` - List signals (cu filters: token, signal, valid, limit, offset)
- `getSignal(signalId, userId)` - Get signal details
- `generateSignal(userId, token, marketData)` - Generate new signal
- `validateSignal(signalId, userId)` - Validate signal

**API Base URL:** `process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/ai-trading/signals'`

---

### **4. performanceApiService.js**
Frontend API client pentru Performance tracking:
- `getPerformanceMetrics(userId, periodStart, periodEnd)` - Get performance metrics
- `getRiskMetrics(userId)` - Get risk metrics
- `getTradingHistory(userId, filters)` - Get trading history
- `getPerformanceCharts(userId, period)` - Get charts data

**API Base URL:** `process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/ai-trading/performance'`

---

### **5. aiTradingEngineService.js**
Frontend integration cu AI Trading Engine (ES modules):
- `loadAITradingEngine()` - Load engine class (lazy load)
- `createEngineInstance(config)` - Create engine instance
- `analyzeMarketLocal(engine, token, marketData)` - Analyze market local
- `startEngineLocal(engine, config)` - Start engine local
- `stopEngineLocal(engine)` - Stop engine local
- `getEngineStats(engine)` - Get engine statistics

**Engine Path:** `../../ai-trading/core/AITradingEngine.js`

---

## 📖 Usage Examples

### **Example 1: Start AI Trading Bot**
```javascript
import { startAITradingBot } from './services/aiTradingApiService';

const config = {
  strategies: ['momentum', 'mean_reversion'],
  riskLimits: {
    maxPositionSize: 1000,
    maxDailyLoss: 100,
    stopLossPercentage: 5
  },
  mode: 'automated'
};

try {
  const result = await startAITradingBot(userId, config);
  console.log('Bot started:', result.botId);
} catch (error) {
  console.error('Failed to start bot:', error);
}
```

### **Example 2: Get Strategies**
```javascript
import { getStrategies } from './services/strategyApiService';

try {
  const response = await getStrategies(userId);
  console.log('Strategies:', response.strategies);
} catch (error) {
  console.error('Failed to get strategies:', error);
}
```

### **Example 3: Generate Signal**
```javascript
import { generateSignal } from './services/signalApiService';

try {
  const response = await generateSignal(userId, 'BTC');
  console.log('Signal:', response.signal);
} catch (error) {
  console.error('Failed to generate signal:', error);
}
```

### **Example 4: Use AI Trading Engine Local**
```javascript
import { createEngineInstance, analyzeMarketLocal } from './services/aiTradingEngineService';

// Create engine instance
const engine = await createEngineInstance({
  marketDataService: marketDataService,
  contractService: contractService
});

// Analyze market
const signal = await analyzeMarketLocal(engine, 'BTC', marketData);
console.log('Signal:', signal);
```

---

## ⚙️ Configuration

### **Environment Variables**

Set these în `.env` file:

```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

Pentru production:
```env
REACT_APP_API_BASE_URL=https://api.bitswapdex.com/api
```

### **Authentication**

Currently, authentication token is not implemented. Add în `apiRequest` helper:

```javascript
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getAuthToken()}`
}
```

---

## 🔗 Integration cu Backend

Aceste servicii frontend trebuie să fie integrate cu backend-ul din:
- `src/components/DEX/Proiect/backend/routes/ai-trading/`

Backend routes trebuie să fie complete și funcționale pentru ca aceste servicii să funcționeze.

---

## 📝 TODO

- [ ] Add authentication token support
- [ ] Add request retry logic
- [ ] Add request caching
- [ ] Add WebSocket support pentru real-time updates
- [ ] Add error handling improvements
- [ ] Add TypeScript types (opțional)

---

**Last Updated:** 2026-01-09

