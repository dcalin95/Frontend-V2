# Product Truth - DEX Project Definition

**Status:** 🔒 IMMUTABLE - DO NOT DELETE OR MODIFY  
**Purpose:** Authoritative product definition and truth  
**Last Updated:** 2024-01-10  
**Authority:** Based on confirmed project scope and intentions

---

## 🎯 PRODUCT IDENTITY

### Product Name:
**BitSwapDEX AI Trading** - Oxium-like AI Trading Interface

### Product Type:
**DEX (Decentralized Exchange) Interface** for AI Trading, integrated în frontend-edu

### Current Status:
⚠️ **DEVELOPMENT MODE** - NOT PRODUCTION READY  
**Stage:** Skeleton/Foundation (intentionally incomplete)

---

## 📐 CORE PRODUCT PURPOSE

The DEX project is an **Oxium-like AI Trading Interface** with the following core purposes:

1. **Provide DEX interface for AI Trading**
   - Trading interface similar to Oxium (https://app.oxium.xyz/trade)
   - AI-powered trading capabilities (intent selection, strategy configuration, risk gating)
   - Multiple trading modes: DEMO (simulated) and REAL (on-chain)

2. **Support wallet connection (multiple wallets)**
   - MetaMask, Trust Wallet, Coinbase Wallet, WalletConnect
   - Integration with `WalletContext` from main app
   - Error handling and retry logic

3. **Display performance charts (using Binance API in development)**
   - TradingView widget integration
   - Real-time price data (Binance API in development mode)
   - Fallback mechanism: Backend API → Binance API → Mock data

4. **User settings (theme, layout, language)**
   - Theme system (dark/light)
   - Layout settings (Trade Panel Position, Orderbook Position)
   - Language selection
   - localStorage persistence

5. **Separate UI from main frontend-edu app**
   - Route `/dex/*` separated from main app
   - UI isolation (hides HeaderEdu and Sidebar)
   - Independent routing and navigation

---

## 🏗️ PRODUCT ARCHITECTURE TARGET

### Target Architecture:
The product aims toward an architecture with:
- **Signals/** - Trading signals layer
- **Strategies/** - Strategy configuration layer
- **Execution/** - Trade execution layer
- **Services/** - API and service layer

**Note:** Not all layers are fully implemented yet. This is the TARGET architecture, not the current implementation state.

### Current Implementation:
- **Active Codebase:** Flat structure (components at root, `services/` at root, `Trade/` directory)
- **Trade Page:** Oxium-inspired structure with components (OrderBook, MarketStats, SwapLimitPanel, TradeHeader, TradeTabs)
- **Swap Execution:** Sub-module for swap functionality (PancakeSwap integration for REAL mode)
- **Proiect/ Directory:** Contains target architecture code (status unclear - may be legacy or future implementation)

---

## 🎯 WHAT THIS PRODUCT IS

### Core Product:
1. **Oxium-like Trading Interface**
   - Trade Page with charts, orderbook, swap/limit orders
   - Market statistics and real-time data
   - Positions tracking and order management

2. **AI Trading Capabilities**
   - AI Intelligence page (UI structure exists)
   - Intent selection system (target)
   - Strategy configuration (target)
   - Risk gating (target)

3. **DEX Features**
   - Swap functionality (PancakeSwap integration for REAL mode)
   - Liquidity pools (UI structure)
   - Stake vault (UI structure)
   - Governance/Vote center (UI structure)

4. **Development Mode Features**
   - Binance API integration for charts (development)
   - Mock data fallbacks
   - DEMO mode (simulated trading)
   - REAL mode (on-chain BSC integration)

---

## ❌ WHAT THIS PRODUCT IS NOT

1. **NOT Production Ready**
   - ⚠️ DEVELOPMENT MODE - NOT production ready
   - Backend API NOT deployed
   - NOT fully tested
   - NOT deployed

2. **NOT Complete Implementation**
   - Skeleton/Foundation stage (intentionally incomplete)
   - Missing features are intentional, not errors
   - Placeholders exist for future implementation
   - Gradual complexity addition planned

3. **NOT Just a Swap Module**
   - Existing swap and PancakeSwap integration is a **sub-module**, not the product definition
   - Product is broader: Oxium-like AI Trading Interface
   - Swap is one feature among many

---

## 📊 PRODUCT STATUS SUMMARY

### ✅ Implemented (Skeleton/Foundation):

1. **Project Structure**
   - DEX integration în frontend-edu
   - Directory structure established
   - Core component organization

2. **UI Components (Skeleton)**
   - Sidebar, SwapPanel, TradingChart, PositionsTable
   - DashboardOverview, LiquidityPools, StakeVault, VoteCenter
   - AIIntelligencePage (UI structure)
   - Trade Page structure (Oxium-inspired)

3. **Wallet Integration**
   - Wallet connection functional
   - Multiple wallet support
   - Integration with WalletContext

4. **Chart Integration (Development Mode)**
   - TradingView widget integration
   - Binance API for real data (development)
   - Fallback mechanism

5. **Account Modes**
   - DEMO mode (simulated trading)
   - REAL mode (on-chain BSC integration)
   - Mode switching functional

6. **Services Layer**
   - Swap execution services (PancakeSwap integration)
   - Token balance fetching
   - Network validation

### ⏳ In Progress / Pending:

1. **Backend API**
   - NOT DEPLOYED
   - Uses Binance API for development
   - Backend integration pending

2. **Trade Page UI (Complete Functionality)**
   - UI structure exists
   - Backend integration incomplete
   - Real-time updates pending

3. **AI Features (Core Logic)**
   - UI structure exists (AIIntelligencePage)
   - Core logic pending (intent selection, strategy config, risk gating)

4. **Settings & Theme System**
   - Documented but implementation unclear
   - Theme system (target)
   - Layout settings (target)

### ❌ NOT Implemented:

1. **Production Backend**
   - Custom backend API: NOT DEPLOYED
   - Database: NOT IMPLEMENTED
   - Authentication: NOT IMPLEMENTED

2. **Full AI Trading Engine**
   - Intent selection system: NOT IMPLEMENTED
   - Strategy configuration: NOT IMPLEMENTED
   - Risk gating: NOT IMPLEMENTED

3. **Production Requirements**
   - Full testing: NOT DONE
   - Security audit: NOT DONE
   - Production deployment: NOT READY

---

## 🎯 PRODUCT VISION

### Target Product:
An **Oxium-like AI Trading Interface** with:
- Complete Trade Page (charts, orderbook, swap/limit orders)
- AI-powered trading capabilities
- Full backend integration
- Production-ready deployment

### Current Stage:
- **Skeleton/Foundation** - Intentionally incomplete
- **Development Mode** - Using Binance API for development
- **Target Architecture** - Signals/Strategies/Execution layers (target, not all implemented)
- **Gradual Complexity** - Adding features incrementally

---

## ⚠️ CRITICAL CLARIFICATIONS

### 1. Skeleton Architecture
- The codebase is intentionally incomplete
- Missing features are **not errors** - they are placeholders for future implementation
- This is a **skeleton** aiming toward the target architecture

### 2. Swap Module vs Product
- Existing swap and PancakeSwap integration is a **sub-module**
- The product is broader: **Oxium-like AI Trading Interface**
- Swap is one feature, not the product definition

### 3. Target Architecture vs Current State
- Signals/Strategies/Execution represent the **TARGET architecture**
- Not all layers are implemented yet
- Current codebase uses a different structure (flat components, services at root, Trade/ directory)

### 4. Development Mode
- Uses Binance API for development (not production backend)
- Mock data fallbacks for UI development
- NOT production ready
- NOT deployed

---

## 📁 RELATED DOCUMENTS

For detailed information:
- `01_PROJECT_LOGIC.md` - Core business rules and logic
- `02_MVP_BOUNDARIES.md` - Scope boundaries
- `03_ARCHITECTURE_SKELETON.md` - Architecture overview
- `05_CURRENT_STATUS.md` - Current implementation status

---

## 🔒 IMMUTABILITY RULES

This file defines the **authoritative product truth**. It MUST NOT be:
- Deleted
- Renamed
- Overwritten (existing content must be preserved)

Updates MUST be:
- Append-only (new content added with date markers)
- Clearly marked with `## Added for context – YYYY-MM-DD`
- Preserve original intent

---

**This file is IMMUTABLE. Do NOT delete or modify.**

**Last Updated:** 2024-01-10  
**Authority:** Based on confirmed project scope and intentions from `SCOP_URI_INTENTII_DEX.md`
