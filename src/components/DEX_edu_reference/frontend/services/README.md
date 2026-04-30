# 📦 Frontend Services - DEX Complete Documentation

**Location:** `src/components/DEX/frontend/services/`

**Purpose:** Frontend services pentru interacțiune cu DEX Backend API, blockchain operations, și AI Trading Engine.

---

## 📁 Files Structure

```
services/
├── authApiService.js              # 🔐 Authentication API (wallet, email, phone, OAuth)
├── dexApiService.js               # 🔗 DEX Trading API (orders, trades, orderbook)
├── aiTradingApiService.jsx         # 🤖 AI Trading API endpoints
├── strategyApiService.jsx          # 📊 Strategy management API
├── signalApiService.jsx            # 📡 Signal management API
├── performanceApiService.jsx      # 📈 Performance tracking API
├── executionApiService.jsx         # ⚡ Execution API
├── swapExecutionService.jsx       # 💱 Swap execution (blockchain)
├── tokenPriceService.jsx           # 💰 Token prices (CoinGecko)
├── walletBalanceService.jsx       # 💼 Wallet balances (blockchain)
├── otaContractService.jsx          # 📝 OTA Contract interactions
├── otaBacktestService.js           # 🧪 OTA Backtest service
├── otaStrategyService.js           # 🎯 OTA Strategy service
├── otaModelInferenceService.js     # 🧠 OTA Model Inference service
├── otaBanditService.js             # 🎰 OTA Bandit service
├── otaMetaControllerService.js     # 🎮 OTA Meta Controller service
├── index.js                        # Central export
└── __tests__/                      # Test files
    └── otaServices.test.js
```

---

## 🔧 Services Overview

### **1. authApiService.js** 🔐
Frontend API client pentru DEX authentication (wallet-based, email, phone, OAuth):

**Wallet-based Authentication:**
- `getNonce(walletAddress)` - Request nonce for wallet address
- `verifySignature(walletAddress, message, signature)` - Verify signature and authenticate
- `getAuthStatus()` - Get current authentication status
- `logout()` - Logout current user

**Email Authentication:**
- `registerWithEmail(email, username, password, redirectTo?)` - Register new user
- `loginWithEmail(email, password, deviceInfo?)` - Login with email
- `verifyEmail(token)` - Verify email with token
- `forgotPassword(email)` - Request password reset
- `resetPassword(token, newPassword)` - Reset password with token
- `resendVerification(email, redirectTo?)` - Resend email verification

**Phone Authentication:**
- `sendPhoneVerificationCode(phone)` - Send phone verification code
- `verifyPhoneCode(phone, code)` - Verify phone code and login/register

**Profile Management:**
- `updateProfile(username)` - Update profile (username)
- `changePassword(currentPassword, newPassword)` - Change password
- `getUserWallets()` - Get user's associated wallets

**OAuth:**
- `loginWithProvider(provider)` - Login with OAuth provider (Google, Facebook, etc.)

**Token Management:**
- `refreshToken(refreshToken)` - Refresh authentication token

**API Base URL:** `BACKEND_URL` from `../utils/constants`

---

### **2. dexApiService.js** 🔗
Frontend API client pentru DEX trading endpoints:
- `getOrderbook(baseToken, quoteToken, depth?)` - Get orderbook for trading pair
- `createOrder(orderData)` - Create new order
- `getOrders(filters?)` - List orders (cu filters)
- `getOrder(orderId)` - Get order details
- `cancelOrder(orderId)` - Cancel order
- `getTrades(filters?)` - List trades (cu filters)
- `getTrade(tradeId)` - Get trade details

**API Base URL:** `BACKEND_URL` from `../utils/constants`

---

### **3. aiTradingApiService.jsx** 🤖
Frontend API client pentru AI Trading endpoints:
- `startAITradingBot(userId, config)` - Start bot
- `stopAITradingBot(userId)` - Stop bot
- `getAITradingBotStatus(userId)` - Get status
- `getAITradingBotStats(userId)` - Get statistics
- `analyzeMarket(token, options)` - Analyze market. **Options:** `userId`, `quoteToken` (default USDT), `marketData`, `amountIn`, `recentOutcomes` (array, max 10 pentru LLM). Use `buildAnalyzeOptions()` from otaOutcomesHelper for consistent shape.
- `getContractState()` - Get contract state

**API Base URL:** `process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/ai-trading'`

---

### **4. strategyApiService.jsx** 📊
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

### **5. signalApiService.jsx** 📡
Frontend API client pentru Signal management:
- `getSignals(userId, filters)` - List signals (cu filters: token, signal, valid, limit, offset)
- `getSignal(signalId, userId)` - Get signal details
- `generateSignal(userId, token, marketData)` - Generate new signal
- `validateSignal(signalId, userId)` - Validate signal
- `getSignalPerformance(userId, options?)` - Signal performance (win rate, outcomes); returnează `null` dacă backend nu expune `/ai-trading/signals/performance`

**API Base URL:** `process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/ai-trading/signals'`

---

### **6. performanceApiService.jsx** 📈
Frontend API client pentru Performance tracking:
- `getPerformanceMetrics(userId, periodStart, periodEnd)` - Get performance metrics
- `getRiskMetrics(userId)` - Get risk metrics
- `getTradingHistory(userId, filters)` - Get trading history
- `getPerformanceCharts(userId, period)` - Get charts data

**API Base URL:** `process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/ai-trading/performance'`

---

### **7. executionApiService.jsx** ⚡
Frontend API client pentru Execution API:
- `getExecutions(userId, filters?)` - List executions
- `getExecution(executionId, userId)` - Get execution details
- `createExecution(executionData)` - Create new execution

**API Base URL:** `process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/ai-trading/execution'`

---

### **8. swapExecutionService.jsx** 💱
Service pentru execuția swap-urilor reale pe blockchain:
- `checkAllowance(tokenAddress, ownerAddress, spenderAddress)` - Verificare allowance
- `approveToken(tokenAddress, spenderAddress, amount)` - Approve token
- `executeSwap(swapParams)` - Construire și trimitere transaction
- `getTokenDecimals(tokenAddress)` - Get token decimals
- `getSwapTxData(swapParams)` - Get swap transaction data

**Blockchain:** BSC Mainnet (PancakeSwap Router V2)

---

### **9. tokenPriceService.jsx** 💰
Service pentru obținerea prețurilor reale ale tokenilor:
- `getAllTokenPrices(tokenSymbols?)` - Get prices for multiple tokens (CoinGecko)
- `getTokenPrice(tokenSymbol)` - Get price for single token
- `getBITSPrice()` - Get BITS token price from contract

**Data Source:** CoinGecko API (browser-friendly, CORS-enabled)

---

### **10. walletBalanceService.jsx** 💼
Service pentru obținerea balanțelor reale ale tokenilor din blockchain:
- `getBalances(walletAddress, tokenSymbols?)` - Get balances for multiple tokens
- `getBalance(walletAddress, tokenSymbol)` - Get balance for single token
- `getNativeBalance(walletAddress)` - Get native BNB balance

**Blockchain:** BSC Mainnet (via ethers.js + MetaMask)

---

### **11. otaContractService.jsx** 📝
Service pentru interacțiuni cu OTA Contract:
- `getContractState()` - Get contract state
- `registerUser(userData)` - Register user in contract
- `authorizeBot(authorizationData)` - Authorize bot
- `getUserRegistration(userId)` - Get user registration status

**Blockchain:** BSC Mainnet

---

### **12. otaBacktestService.js** 🧪
OTA Backtest service (Faza 0):
- `runBacktest(backtestConfig)` - Run backtest
- `getBacktestMetrics(backtestId)` - Get backtest metrics

**API Base URL:** `BACKEND_URL` from `../utils/constants`

---

### **13. otaStrategyService.js** 🎯
OTA Strategy service (Faza 1):
- `listStrategies()` - List all strategies
- `executeStrategy(strategyName, token, params)` - Execute strategy
- `getStrategyStatus(strategyId)` - Get strategy status

**API Base URL:** `BACKEND_URL` from `../utils/constants`

---

### **14. otaModelInferenceService.js** 🧠
OTA Model Inference service (Faza 2):
- `getModelInferenceStatus()` - Get model inference status
- `predictRegime(token, marketData)` - Predict market regime
- `predictReturn(token, marketData)` - Predict return

**API Base URL:** `BACKEND_URL` from `../utils/constants`

---

### **15. otaBanditService.js** 🎰
OTA Bandit service (Faza 2):
- `getBanditStatistics()` - Get bandit statistics
- `selectStrategy(context)` - Select strategy using bandit
- `recordReward(strategy, reward)` - Record reward
- `resetStatistics()` - Reset statistics

**API Base URL:** `BACKEND_URL` from `../utils/constants`

---

### **16. otaMetaControllerService.js** 🎮
OTA Meta Controller service (Faza 3):
- `getMetaControllerStatus()` - Get meta controller status
- `makeDecision({ context, strategySignals })` - Make ensemble decision (body API: token/quoteToken/timeframe/regime)
- `recordOutcome({ tradeResult, context? })` - Record outcome (tradeResult required; optional context for bandit learning)
- **Doc:** `docs/OTA_META_CONTROLLER_REFERENCE.md`, `docs/OTA_LLM_BRAIN_TABS_REFERENCE.md`
- **aiTradingApiService:** `recordManualOutcome(payload)` - POST manual trade outcome for LLM (ota.trade_outcomes, source='manual'); called after swap success from SwapPanel.

**API Base URL:** `BACKEND_URL` from `../utils/constants`

---

## 📖 Usage Examples

### **Example 1: Wallet Authentication**
```javascript
import { getNonce, verifySignature } from './services/authApiService';

// Step 1: Get nonce
const nonceResponse = await getNonce(walletAddress);
const message = nonceResponse.message;

// Step 2: Sign message with wallet
const signature = await wallet.signMessage(message);

// Step 3: Verify signature
const authResponse = await verifySignature(walletAddress, message, signature);
console.log('Authenticated:', authResponse.user);
```

### **Example 2: Email Authentication**
```javascript
import { loginWithEmail, registerWithEmail } from './services/authApiService';

// Register
const registerResponse = await registerWithEmail(
  'user@example.com',
  'username',
  'password',
  '/dex/profile' // redirectTo
);

// Login
const loginResponse = await loginWithEmail('user@example.com', 'password');
console.log('User:', loginResponse);
```

### **Example 3: Get Token Prices**
```javascript
import tokenPriceService from './services/tokenPriceService';

const prices = await tokenPriceService.getPrices(['BTC', 'ETH', 'USDT']);
console.log('Prices:', prices); // { BTC: 45000, ETH: 3000, USDT: 1 }
```

### **Example 4: Get Wallet Balances**
```javascript
import walletBalanceService from './services/walletBalanceService';

const balances = await walletBalanceService.getBalances(
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  ['BNB', 'USDT', 'BITS']
);
console.log('Balances:', balances); // { BNB: '1.0', USDT: '100.0', BITS: '500.0' }
```

### **Example 5: Execute Swap**
```javascript
import swapExecutionService from './services/swapExecutionService';

// Check allowance
const allowance = await swapExecutionService.checkAllowance(
  tokenAddress,
  walletAddress,
  routerAddress
);

// Approve if needed
if (allowance < amount) {
  await swapExecutionService.approveToken(tokenAddress, routerAddress, amount);
}

// Execute swap
const tx = await swapExecutionService.executeSwap({
  tokenIn: 'USDT',
  tokenOut: 'BITS',
  amountIn: '100',
  amountOutMin: '95',
  to: walletAddress
});
```

### **Example 6: OTA Services**
```javascript
import { otaBacktestService, otaStrategyService } from './services';

// Run backtest
const backtest = await otaBacktestService.runBacktest({
  strategy: 'trend-following',
  token: 'BTC',
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

// Execute strategy
const execution = await otaStrategyService.executeStrategy({
  strategyName: 'trend-following',
  token: 'BTC',
  amount: 1000
});
```

---

## ⚙️ Configuration

### **Environment Variables**

Set these în `.env` file:

```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
BACKEND_URL=http://localhost:5000
```

Pentru production:
```env
REACT_APP_API_BASE_URL=https://api.bitswapdex.com/api
BACKEND_URL=https://api.bitswapdex.com
```

### **Authentication**

Authentication folosește session-based cookies (`credentials: 'include'`). Pentru token-based auth, vezi `authApiService.refreshToken()`.

---

## 🔗 Integration cu Backend

Aceste servicii frontend trebuie să fie integrate cu backend-ul:
- Authentication: `/api/auth/*` și `/api/dex/v1/auth/*`
- DEX Trading: `/api/dex/v1/*`
- AI Trading: `/api/ai-trading/*`
- OTA Services: `/ai-trading/*`

Backend routes trebuie să fie complete și funcționale pentru ca aceste servicii să funcționeze.

---

## 📝 Testing

Teste existente:
- `__tests__/otaServices.test.js` - Tests pentru OTA services

Teste necesare:
- [ ] `__tests__/authApiService.test.js` - Tests pentru authentication
- [ ] `__tests__/dexApiService.test.js` - Tests pentru DEX API
- [ ] `__tests__/swapExecutionService.test.js` - Tests pentru swap execution
- [ ] `__tests__/tokenPriceService.test.js` - Tests pentru token prices
- [ ] `__tests__/walletBalanceService.test.js` - Tests pentru wallet balances

---

## 🐛 Known Issues

1. **authApiService.js**: Referință la `updatePhoneNumber` în export default, dar funcția nu este definită (linia 346)
2. **Documentație veche**: `docs/_archive/services/README.md` este depășită și nu include toate serviciile

---

## 📚 Related Documentation

- [DEX Architecture Report](../../../docs/_archive_completed/2026-01-18/DEX_ARCHITECTURE_REPORT.md)
- [DEX Backend Endpoints Complete](../../../docs/_archive_completed/2026-01-18/DEX_BACKEND_ENDPOINTS_COMPLETE.md)
- [DEX Frontend API Connections Complete](../../../docs/_archive_completed/2026-01-18/DEX_FRONTEND_API_CONNECTIONS_COMPLETE.md)

---

**Last Updated:** 2026-01-18
