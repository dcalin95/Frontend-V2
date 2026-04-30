# 📐 PROJECT LOGIC - Core Business Rules and Logic

**Status:** 🔒 IMMUTABLE - DO NOT DELETE OR MODIFY  
**Purpose:** Document core project logic and business rules  
**Last Updated:** 2024-01-10

---

## 🎯 PROJECT IDENTITY

### What This Project Is:
**BitSwapDEX AI Trading** - A DEX (Decentralized Exchange) interface integrated în frontend-edu

- **Type:** DEX interface for AI Trading
- **Integration:** Integrated în `frontend-edu` as separate route `/dex/*`
- **Source:** Copied from `src/components/DEX/Proiect/` to `src/components/DEX/`
- **Status:** ⚠️ DEVELOPMENT MODE - NOT production ready

### Core Purpose:
- Provide DEX interface for AI Trading
- Support wallet connection (multiple wallets)
- Display performance charts (using Binance API in development)
- User settings (theme, layout, language)
- Separate UI from main frontend-edu app

---

## 🔄 CORE LOGIC FLOWS

### 1. Routing Logic
- **Entry Point:** `/dex` route în frontend-edu
- **Nested Routes:** `/dex/*` (dashboard, strategies, signals, performance, execution)
- **Isolation:** DEX UI is isolated from main app (hides HeaderEdu and Sidebar)
- **Implementation:** Uses React Router with nested routes

### 2. Wallet Connection Logic
- **Hook:** `useDEXWallet` (`src/hooks/DEX/useDEXWallet.js`)
- **Supported Wallets:** MetaMask, Trust Wallet, Coinbase Wallet, WalletConnect
- **Integration:** Uses `UnifiedWalletModal` from main app
- **Error Handling:** Robust error handling with retry logic
- **State:** Managed through `WalletContext`

### 3. Charts Data Logic (Current - Development Mode)
```
Flow:
1. Try Backend API → Fails (backend not deployed)
2. Fallback to Binance API → Success (uses public API)
3. If Binance fails → Fallback to Mock Data
```

**Current Implementation:**
- Uses Binance API public endpoints (`api.binance.com/api/v3/klines`)
- Helper: `src/utils/DEX/binanceApi.js`
- Hook: `src/hooks/DEX/usePerformance.js` (updated)
- Hook (local): `src/components/DEX/frontend/hooks/usePerformance.js` (updated)

**Future (Production):**
- Will use backend API when deployed
- Fallback logic already exists (no code changes needed)
- See `DEX_BACKEND_API_PLAN.md` for details

### 4. Settings Management Logic
- **Hook:** `useDEXSettings` (`src/hooks/DEX/useDEXSettings.js`)
- **Storage:** localStorage (`dex_settings`)
- **Settings:**
  - Theme (dark/light)
  - Trade Panel Position (left/right)
  - Orderbook Position (left/right)
  - Language (en, ro, es, fr, de)
- **Application:** Applied to `document.documentElement` via data attributes

### 5. Theme Application Logic
- **Storage:** localStorage
- **Application:** Applied to `document.documentElement`
- **CSS:** Uses CSS variables (`data-theme="dark"` or `data-theme="light"`)
- **Implementation:** `src/styles/DEX/global.css` and component styles

### 6. Layout Settings Logic
- **Settings:** Trade Panel Position, Orderbook Position
- **Application:** Via `data-trade-panel-position` and `data-orderbook-position` attributes
- **CSS:** Uses CSS `order` property for flex layout
- **Implementation:** `src/styles/DEX/layout-settings.css`

---

## 📊 DATA FLOW ARCHITECTURE

### Charts Data Flow (Current - Development):
```
User Action
  ↓
Performance Page Component
  ↓
usePerformance Hook
  ↓
1. Try: performanceApiService.getChartsData() → FAILS (backend not deployed)
  ↓
2. Fallback: getBinanceChartData() → SUCCESS (Binance API)
  ↓
3. Format: Binance data → Chart format
  ↓
4. Display: PerformanceChart component (recharts)
```

### Settings Data Flow:
```
User Action (Settings Modal)
  ↓
useDEXSettings Hook
  ↓
1. Update State
  ↓
2. Save to localStorage
  ↓
3. Apply to document.documentElement
  ↓
4. CSS reads data attributes
  ↓
5. UI updates
```

### Wallet Connection Flow:
```
User Click "Connect Wallet"
  ↓
useDEXWallet Hook
  ↓
1. Check available wallets
  ↓
2. If multiple → Open UnifiedWalletModal
  ↓
3. User selects wallet
  ↓
4. Connect via WalletContext
  ↓
5. Update state
  ↓
6. Display wallet address
```

---

## 🔑 KEY BUSINESS RULES

### 1. Development Mode Rules
- **Current Mode:** DEVELOPMENT MODE
- **Charts:** Use Binance API (public, free)
- **Backend:** NOT deployed (use Binance API)
- **Testing:** Limited testing
- **Production:** NOT ready

### 2. Production Mode Rules (Future)
- **Charts:** Use backend API (when deployed)
- **Backend:** Deployed and functional
- **Testing:** Full testing required
- **Fallback:** Binance API → Mock Data (if backend fails)

### 3. Documentation Rules
- **Immutable:** Documentation files MUST NOT be deleted
- **Append-Only:** Only append new content (with date markers)
- **No Overwriting:** Existing content MUST NOT be removed
- **Read First:** Read documentation before code changes

### 4. Code Modification Rules
- **Read First:** Read documentation before changes
- **No Refactoring:** Without explicit permission
- **No Assumptions:** Do NOT infer missing logic
- **Ask if Unclear:** Stop and ask if context incomplete

---

## 📁 KEY FILES AND THEIR PURPOSE

### Hooks:
- `src/hooks/DEX/useDEXWallet.js` - Wallet connection logic
- `src/hooks/DEX/useDEXSettings.js` - Settings management
- `src/hooks/DEX/usePerformance.js` - Performance data (global)
- `src/components/DEX/frontend/hooks/usePerformance.js` - Performance data (local)

### Utils:
- `src/utils/DEX/binanceApi.js` - Binance API helper (development mode)
- `src/utils/DEX/mockData.js` - Interzis în flux DEX (doar pentru teste jest). DEX = date reale only.
- `src/utils/DEX/helpers.js` - Helper functions

### Components:
- `src/components/DEX/common/Layout.jsx` - Main layout
- `src/components/DEX/common/Header.jsx` - Header with wallet connection
- `src/components/DEX/common/SettingsModal/` - Settings modal
- `src/components/DEX/frontend/pages/Performance.jsx` - Performance page

### Styles:
- `src/styles/DEX/layout-settings.css` - Layout settings CSS
- `src/styles/DEX/header.css` - Header styles
- `src/components/DEX/frontend/styles/global.css` - Global styles (theme)

---

## ⚠️ CRITICAL CONSTRAINTS

### DO NOT:
1. Delete documentation files
2. Rename documentation files
3. Overwrite existing content
4. Claim project is "production ready" (it's NOT)
5. Modify code without reading documentation
6. Refactor without permission
7. Infer missing logic (ask instead)

### MUST:
1. Read documentation in mandatory order
2. Understand current status (DEVELOPMENT MODE)
3. Respect boundaries and constraints
4. Ask if unclear
5. Document changes (append-only)
6. Preserve original intent

---

## 🔄 STATE MANAGEMENT

### Settings State:
- **Storage:** localStorage
- **Key:** `dex_settings`
- **Structure:**
  ```javascript
  {
    theme: 'dark' | 'light',
    tradePanelPosition: 'left' | 'right',
    orderbookPosition: 'left' | 'right',
    language: 'en' | 'ro' | 'es' | 'fr' | 'de',
    country: 'US' | 'RO' | 'ES' | 'FR' | 'DE'
  }
  ```

### Wallet State:
- **Source:** `WalletContext` (from main app)
- **Hook:** `useDEXWallet` (wraps WalletContext)
- **State:**
  - `walletAddress` - Connected wallet address
  - `isConnected` - Connection status
  - `error` - Error messages
  - `isLoading` - Loading state

### Performance Data State:
- **Hook:** `usePerformance`
- **State:**
  - `metrics` - Performance metrics
  - `riskMetrics` - Risk metrics
  - `history` - Trading history
  - `chartsData` - Charts data (from Binance API in development)
  - `loading` - Loading state
  - `error` - Error state

---

## 📝 DOCUMENTATION REFERENCES

For detailed information, see:
- `../DEX_PROJECT_COMPLETE_STATUS.md` - Complete status
- `../DEX_BACKEND_API_PLAN.md` - Backend API plan
- `../DEX_WALLET_IMPROVEMENTS.md` - Wallet implementation
- `../CHARTS_TEST_SUCCESS.md` - Charts implementation
- `../DOCUMENTATION_INDEX.md` - Documentation index

---

**This file is IMMUTABLE. Do NOT delete or modify.**

**Last Updated:** 2024-01-10  
**Next File to Read:** `02_MVP_BOUNDARIES.md`
