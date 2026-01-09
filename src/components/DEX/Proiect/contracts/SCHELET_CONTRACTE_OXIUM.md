# 🏗️ Schelet Contracte - Oxium Inspired - BitSwapDEX

**Data:** 2025-01-09  
**Status:** 📋 **SCHELET PROIECT** - Contracte Future Documentate

---

## 📊 Overview

Scheletul contractelor future pentru BitSwapDEX, inspirat din arhitectura Oxium DEX, documentat pentru dezvoltare viitoare.

---

## ✅ Contracte Existente (MVP - Current)

### **Core DEX:**
1. ✅ BitSwapDEXWrapper.sol - Core swap execution
2. ✅ FeeDistributionAutomation.sol - Fee distribution

### **Smart Offers:**
3. ✅ SmartOffersManager.sol - Conditional offers

### **Liquidity:**
4. ✅ UserVault.sol - User vault management

### **AI Trading:**
5. ✅ AITradingExecutor.sol - AI trading execution
6. ✅ AITradingAccessControl.sol - Bot authorization

### **Supporting:**
7. ✅ OraclePriceFeed.sol - Price feeds
8. ✅ TreasuryManagement.sol - Treasury management
9. ✅ StakingRewards.sol - Staking și rewards

**Total:** 9 contracte implementate ✅

---

## ⏸️ Contracte Propuse - Oxium Inspired (Schelet)

### **🔴 HIGH Priority - MVP Extension**

#### **1. HookInterface.sol** ✅ (CREATED)
**Status:** ✅ **INTERFACE CREATED**  
**Priority:** 🟡 MEDIUM  
**Complexity:** ⭐⭐ (Low-Medium)

**Descriere:**
- Standard interface pentru custom hooks
- Inspirat din Oxium hooks system
- Permite dezvoltatorilor să creeze hooks personalizate

**Functions:**
- `validateOffer()` - Validate offer înainte de creation
- `beforeExecution()` - Logic înainte de execution
- `afterExecution()` - Logic după execution
- `onCancellation()` - Logic la cancellation
- `getHookType()` - Get hook type
- `getHookName()` - Get hook name
- `isActive()` - Check dacă hook-ul este activ

**Status:** ✅ Interface creat - ready pentru implementare

---

#### **2. HookRegistry.sol** ⏸️ (PLANNED)
**Status:** ⏸️ **PLANNED** - Schelet documentat  
**Priority:** 🟡 MEDIUM  
**Complexity:** ⭐⭐ (Low-Medium)  
**Lines:** ~200-300 linii estimate

**Descriere:**
- Registry pentru hooks personalizate
- Whitelist/blacklist management
- Hook validation și verification
- Fee collection pentru hooks

**Key Functions (Schelet):**
```solidity
// Register/unregister hooks
function registerHook(address hook, HookType hookType) external;
function unregisterHook(address hook) external;

// Hook validation
function isHookValid(address hook) external view returns (bool);
function getHookType(address hook) external view returns (HookType);

// Hook management
function enableHook(address hook) external;
function disableHook(address hook) external;

// Fee management (pentru hook usage)
function setHookFee(address hook, uint256 feeBps) external;
function getHookFee(address hook) external view returns (uint256);
```

**State Variables (Schelet):**
```solidity
mapping(address => bool) public isRegisteredHook;
mapping(address => HookType) public hookTypes;
mapping(address => bool) public isActiveHook;
mapping(address => uint256) public hookFees; // in basis points
address[] public registeredHooks;
```

**Integration Points:**
- SmartOffersManager (pentru hook lookup și execution)
- UserVault (pentru liquidity hooks)
- AITradingExecutor (pentru AI hooks)

**Security:**
- OnlyOwner pentru register/unregister
- Hook validation înainte de registration
- Fee limits (max 5% pentru hooks)
- ReentrancyGuard

---

#### **3. LiquidityPromise.sol** ⏸️ (PLANNED)
**Status:** ⏸️ **PLANNED** - Schelet documentat  
**Priority:** 🟡 MEDIUM  
**Complexity:** ⭐⭐⭐ (Medium)  
**Lines:** ~300-400 linii estimate

**Descriere:**
- Management pentru promised liquidity (neblocată)
- Validation când condițiile sunt îndeplinite
- Cross-protocol integration support
- Promise fulfillment automation

**Key Functions (Schelet):**
```solidity
// Promise creation și management
function createLiquidityPromise(PromiseParams calldata params) external returns (uint256 promiseId);
function fulfillPromise(uint256 promiseId) external;
function cancelPromise(uint256 promiseId) external;
function updatePromise(uint256 promiseId, PromiseParams calldata params) external;

// Promise validation
function isPromiseValid(uint256 promiseId) external view returns (bool);
function canFulfillPromise(uint256 promiseId) external view returns (bool);
function getPromise(uint256 promiseId) external view returns (Promise memory);

// Promise tracking
function getUserPromises(address user) external view returns (uint256[] memory);
function getActivePromises() external view returns (uint256[] memory);
```

**Structs (Schelet):**
```solidity
struct Promise {
    uint256 promiseId;
    address user;
    address token;
    uint256 promisedAmount;    // Amount promised (nu blocat)
    uint256 availableAmount;   // Amount available în momentul fulfillment
    uint256 conditionPrice;    // Condition price pentru fulfillment
    address conditionToken;    // Token pentru price check
    uint256 expiry;            // Expiry timestamp
    PromiseStatus status;      // PENDING, ACTIVE, FULFILLED, CANCELLED
    address externalProtocol;  // Protocol unde e folosit (opțional)
    bytes32 externalPositionId; // Position ID în external protocol
    uint256 createdAt;
    uint256 fulfilledAt;
}

enum PromiseStatus {
    PENDING,
    ACTIVE,
    FULFILLED,
    CANCELLED,
    EXPIRED
}
```

**Integration Points:**
- UserVault (pentru promised liquidity tracking)
- SmartOffersManager (pentru conditional promises)
- OraclePriceFeed (pentru price validation)

**Security:**
- User authorization pentru promises
- Price validation pentru fulfillment
- Timelock pentru large promises
- External protocol verification

---

### **🟡 MEDIUM Priority - Expansion**

#### **4. ReStakingHook.sol** ⏸️ (PLANNED)
**Status:** ⏸️ **PLANNED** - Schelet documentat  
**Priority:** 🟢 LOW  
**Complexity:** ⭐⭐⭐⭐ (High)  
**Lines:** ~400-500 linii estimate

**Descriere:**
- Hook pentru re-staking strategies
- Integration cu PancakeSwap staking
- Auto-compounding rewards
- Multi-protocol yield aggregation

**Key Functions (Schelet):**
```solidity
// Staking operations
function stakeOnExternalProtocol(address protocol, address token, uint256 amount) external;
function unstakeFromExternalProtocol(address protocol, address token, uint256 amount) external;
function claimRewards(address protocol) external;
function compoundRewards(address protocol) external;

// Yield information
function getYieldRate(address protocol, address token) external view returns (uint256);
function getTotalYield(address user) external view returns (uint256);
function getStakedAmount(address protocol, address token) external view returns (uint256);

// Protocol management
function addSupportedProtocol(address protocol, ProtocolConfig calldata config) external;
function removeSupportedProtocol(address protocol) external;
```

**Integration Points:**
- StakingRewards (pentru BITS staking)
- UserVault (pentru vault strategies)
- HookRegistry (pentru hook registration)

---

#### **5. VaultStrategy.sol** ⏸️ (PLANNED)
**Status:** ⏸️ **PLANNED** - Schelet documentat  
**Priority:** 🟢 LOW  
**Complexity:** ⭐⭐⭐ (Medium)  
**Lines:** ~300-400 linii estimate

**Descriere:**
- Base contract pentru vault strategies
- Auto-compounding și rebalancing
- Strategy templates
- Vault factory support

**Key Functions (Schelet):**
```solidity
// Strategy lifecycle
function initialize(VaultConfig calldata config) external;
function deposit(uint256 amount) external;
function withdraw(uint256 amount) external;
function harvest() external; // Claim rewards
function rebalance() external;

// Strategy info
function getStrategyInfo() external view returns (StrategyInfo memory);
function getAPY() external view returns (uint256);
function getTotalAssets() external view returns (uint256);
```

**Integration Points:**
- UserVault (pentru strategy execution)
- HookInterface (pentru custom strategies)

---

#### **6. DEXAggregator.sol** ⏸️ (PLANNED)
**Status:** ⏸️ **PLANNED** - Schelet documentat  
**Priority:** 🟢 LOW  
**Complexity:** ⭐⭐⭐⭐ (High)  
**Lines:** ~500-600 linii estimate

**Descriere:**
- Aggregation din multiple DEX-uri
- Intelligent routing pentru best prices
- Split routing pentru large orders
- Gas optimization

**Key Functions (Schelet):**
```solidity
// Price quotes
function getBestPrice(address tokenIn, address tokenOut, uint256 amountIn) external view returns (DEXQuote memory);
function getAllPrices(address tokenIn, address tokenOut, uint256 amountIn) external view returns (DEXQuote[] memory);

// Execution
function swapBestPrice(SwapParams calldata params) external returns (uint256);
function swapSplit(SplitSwapParams calldata params) external returns (uint256);

// DEX management
function addDEX(address dex, DEXType dexType, address router) external;
function removeDEX(address dex) external;
function isDEXSupported(address dex) external view returns (bool);
```

**Integration Points:**
- BitSwapDEXWrapper (pentru routing)
- AITradingExecutor (pentru best execution)

---

### **🟢 LOW Priority - Advanced Features**

#### **7. OrderBook.sol** ⏸️ (PLANNED)
**Status:** ⏸️ **PLANNED** - Schelet documentat  
**Priority:** 🟢 LOW  
**Complexity:** ⭐⭐⭐⭐⭐ (Very High)  
**Lines:** ~1,000-1,500 linii estimate

**Descriere:**
- On-chain order book (CLOB)
- Order matching engine
- Order book state management
- Similar cu Oxium order book

**Key Functions (Schelet):**
```solidity
// Order management
function placeOrder(OrderParams calldata params) external returns (uint256 orderId);
function cancelOrder(uint256 orderId) external;
function modifyOrder(uint256 orderId, OrderParams calldata params) external;

// Order matching
function matchOrders(uint256 buyOrderId, uint256 sellOrderId) external;
function executeMarketOrder(OrderParams calldata params) external returns (uint256);

// Order book queries
function getBestBid(address tokenPair) external view returns (Order memory);
function getBestAsk(address tokenPair) external view returns (Order memory);
function getOrderBook(address tokenPair, uint256 depth) external view returns (OrderBook memory);
```

**Note:** Foarte complex - necesită research extensiv și design arhitectural

---

#### **8. ConcentratedLiquidityPool.sol** ⏸️ (PLANNED)
**Status:** ⏸️ **PLANNED** - Schelet documentat  
**Priority:** 🟢 LOW  
**Complexity:** ⭐⭐⭐⭐⭐ (Very High)  
**Lines:** ~800-1,000 linii estimate

**Descriere:**
- Concentrated liquidity pools (similar cu Uniswap V3)
- Precise price range management
- Capital efficiency optimization
- Tick-based liquidity

**Key Functions (Schelet):**
```solidity
// Liquidity management
function addLiquidity(AddLiquidityParams calldata params) external returns (uint256 positionId);
function removeLiquidity(RemoveLiquidityParams calldata params) external;
function updateLiquidity(uint256 positionId, UpdateParams calldata params) external;

// Swaps
function swap(SwapParams calldata params) external returns (uint256);

// Position queries
function getPosition(uint256 positionId) external view returns (Position memory);
function getPriceRange(uint256 positionId) external view returns (PriceRange memory);
```

**Note:** Foarte complex - similar cu Uniswap V3

---

## 📋 Schelet Contracte - Summary

### **Interfaces (1 contract):**
1. ✅ **IHook.sol** - Interface pentru custom hooks (CREATED)

### **Core Hooks System (2 contracte - PLANNED):**
2. ⏸️ **HookRegistry.sol** - Registry pentru hooks (~200-300 linii)
3. ⏸️ **LiquidityPromise.sol** - Promised liquidity (~300-400 linii)

### **Strategy Hooks (2 contracte - PLANNED):**
4. ⏸️ **ReStakingHook.sol** - Re-staking strategies (~400-500 linii)
5. ⏸️ **VaultStrategy.sol** - Base vault strategy (~300-400 linii)

### **Advanced Features (2 contracte - PLANNED):**
6. ⏸️ **DEXAggregator.sol** - Multi-DEX aggregation (~500-600 linii)
7. ⏸️ **OrderBook.sol** - On-chain order book (~1,000-1,500 linii)
8. ⏸️ **ConcentratedLiquidityPool.sol** - Concentrated liquidity (~800-1,000 linii)

**Total:** 8 contracte propuse (1 interface creat, 7 planned)  
**Total Lines:** ~3,500-4,700 linii estimate (pentru toate)

---

## 🎯 Priorizare Contracte - Oxium Inspired

### **🔴 IMMEDIATE (MVP Extension):**
1. ✅ **IHook.sol** - Interface creat ✅
2. ⏸️ **HookRegistry.sol** - Registry pentru hooks
3. ⏸️ **LiquidityPromise.sol** - Promised liquidity

**Timeline:** 2-3 săptămâni development  
**Impact:** HIGH - Extend MVP cu concepte Oxium

### **🟡 FUTURE (Expansion):**
4. ⏸️ **ReStakingHook.sol** - Re-staking strategies
5. ⏸️ **VaultStrategy.sol** - Vault strategies
6. ⏸️ **DEXAggregator.sol** - Multi-DEX aggregation

**Timeline:** 4-6 săptămâni development  
**Impact:** MEDIUM - Expansion features

### **🟢 FUTURE (Advanced):**
7. ⏸️ **OrderBook.sol** - On-chain order book
8. ⏸️ **ConcentratedLiquidityPool.sol** - Concentrated liquidity

**Timeline:** 8-12 săptămâni development  
**Impact:** LOW (foarte complex, necesită research extensiv)

---

## 🔗 Integration Points - Future

### **SmartOffersManager Extension:**
```
SmartOffersManager (Current)
  ├── Conditional Offers ✅
  └── [FUTURE] Hook System ⏸️
      ├── HookRegistry ⏸️
      ├── Custom Hooks (IHook) ⏸️
      └── Hook Execution ⏸️
```

### **UserVault Extension:**
```
UserVault (Current)
  ├── Deposit/Withdraw ✅
  └── [FUTURE] Promised Liquidity ⏸️
      ├── LiquidityPromise ⏸️
      ├── Vault Strategies ⏸️
      └── Re-Staking Hooks ⏸️
```

### **BitSwapDEXWrapper Extension:**
```
BitSwapDEXWrapper (Current)
  ├── PancakeSwap Integration ✅
  └── [FUTURE] Multi-DEX ⏸️
      ├── DEXAggregator ⏸️
      ├── Router ⏸️
      └── Best Price Execution ⏸️
```

---

## 📚 Concepte Oxium - Documentate pentru Schelet

### **1. Custom Hooks System** ✅
- ✅ Interface creat (IHook.sol)
- ⏸️ HookRegistry - Planned
- ⏸️ Integration cu SmartOffersManager - Planned

### **2. Promised Liquidity** ⏸️
- ⏸️ LiquidityPromise contract - Planned
- ⏸️ Integration cu UserVault - Planned
- ⏸️ Cross-protocol support - Planned

### **3. Re-Staking Strategies** ⏸️
- ⏸️ ReStakingHook contract - Planned
- ⏸️ Integration cu StakingRewards - Planned
- ⏸️ Multi-protocol yield - Planned

### **4. Vault Strategies** ⏸️
- ⏸️ VaultStrategy base contract - Planned
- ⏸️ Auto-compounding - Planned
- ⏸️ Auto-rebalancing - Planned

### **5. Order Book On-Chain** ⏸️
- ⏸️ OrderBook contract - Planned (foarte complex)
- ⏸️ Order matching engine - Planned
- ⏸️ CLOB implementation - Planned

---

## ✅ Status Final - Schelet

### **Contracte Existente (MVP):**
- ✅ **9 contracte** implementate și funcționale
- ✅ **Bitcoin support** implementat
- ✅ **Smart Offers** implementat
- ✅ **AI Trading** implementat

### **Contracte Propuse (Oxium Inspired):**
- ✅ **1 interface** creat (IHook.sol)
- ⏸️ **7 contracte** planned și documentate
- 📋 **Schelet complet** pentru future development

### **Ready pentru:**
- ✅ Current MVP deployment
- ⏸️ Future extensions (hooks, promises, etc.)
- ⏸️ Research și design pentru advanced features

---

**Last Updated:** 2025-01-09  
**Status:** 📋 **SCHELET PROIECT COMPLETE** - Contracte Future Documentate!

**Next Steps:** Păstrăm scheletul actual și documentăm extensiile viitoare! 🚀

