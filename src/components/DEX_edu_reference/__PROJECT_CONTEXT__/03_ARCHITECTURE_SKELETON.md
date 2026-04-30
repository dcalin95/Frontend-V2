# 🏗️ ARCHITECTURE SKELETON - System Architecture Overview

**Status:** 🔒 IMMUTABLE - DO NOT DELETE OR MODIFY  
**Purpose:** Document system architecture and structure  
**Last Updated:** 2024-01-10

---

## 📐 ARCHITECTURE OVERVIEW

### System Type:
**DEX (Decentralized Exchange) Interface** integrated în Create React App project

### Integration Model:
- **Main App:** `frontend-edu` (Create React App)
- **DEX App:** Integrated as separate route `/dex/*`
- **Source:** Copied from `src/components/DEX/Proiect/` to `src/components/DEX/`
- **Isolation:** DEX UI isolated from main app (hides HeaderEdu and Sidebar)

---

## 📁 FILE STRUCTURE

### Root Integration Files:
```
frontend-edu/
├── src/
│   ├── pages/
│   │   └── DEXPage.js          # Entry point for /dex route
│   ├── components/
│   │   └── DEX/
│   │       ├── DEXApp.jsx      # Main DEX app component
│   │       ├── common/         # Shared components
│   │       │   ├── Layout.jsx
│   │       │   ├── Header.jsx
│   │       │   ├── Sidebar.jsx
│   │       │   └── SettingsModal/
│   │       └── frontend/       # DEX frontend components
│   │           ├── pages/
│   │           ├── components/
│   │           └── hooks/
│   ├── hooks/
│   │   └── DEX/
│   │       ├── useDEXWallet.js
│   │       ├── useDEXSettings.js
│   │       └── usePerformance.js
│   ├── utils/
│   │   └── DEX/
│   │       ├── binanceApi.js   # Binance API helper
│   │       ├── mockData.js
│   │       └── helpers.js
│   └── styles/
│       └── DEX/
│           ├── layout-settings.css
│           └── header.css
```

---

## 🔄 ARCHITECTURAL LAYERS

### Layer 1: Routing & Entry Points
- **Entry:** `src/pages/DEXPage.js` - Wrapper for `/dex` route
- **App:** `src/components/DEX/DEXApp.jsx` - Main DEX app
- **Routing:** React Router nested routes (`/dex/*`)
- **Isolation:** CSS classes to hide main app UI

### Layer 2: Layout & Navigation
- **Layout:** `src/components/DEX/common/Layout.jsx` - Main layout
- **Header:** `src/components/DEX/common/Header.jsx` - Header with wallet
- **Sidebar:** `src/components/DEX/common/Sidebar.jsx` - Navigation
- **Settings:** `src/components/DEX/common/SettingsModal/` - Settings modal

### Layer 3: Pages & Components
- **Pages:** `src/components/DEX/frontend/pages/` - DEX pages
  - Dashboard
  - Strategies
  - Signals
  - Performance
  - Execution
- **Components:** `src/components/DEX/frontend/components/` - Reusable components

### Layer 4: Hooks & State Management
- **Wallet:** `src/hooks/DEX/useDEXWallet.js` - Wallet connection
- **Settings:** `src/hooks/DEX/useDEXSettings.js` - Settings management
- **Performance:** `src/hooks/DEX/usePerformance.js` - Performance data
- **Context:** Uses `WalletContext` from main app

### Layer 5: Utils & Services
- **API:** `src/utils/DEX/binanceApi.js` - Binance API helper
- **Mock (interzis în DEX):** `src/utils/DEX/mockData.js` - Doar teste. DEX = date reale only.
- **Helpers:** `src/utils/DEX/helpers.js` - Helper functions
- **Services:** `src/services/DEX/` - API services (for future backend)

---

## 🔌 INTEGRATION POINTS

### 1. Main App Integration
- **Route:** `/dex/*` în main app router
- **Wrapper:** `DEXPage.js` hides main app UI
- **Context:** Uses `WalletContext` from main app
- **Modal:** Uses `UnifiedWalletModal` from main app

### 2. Wallet Integration
- **Source:** `WalletContext` (from main app)
- **Hook:** `useDEXWallet` (wraps WalletContext)
- **Modal:** `UnifiedWalletModal` (from main app)
- **Wallets:** MetaMask, Trust, Coinbase, WalletConnect

### 3. API Integration (Current - Development)
- **Charts:** Binance API (`api.binance.com/api/v3/klines`)
- **Helper:** `binanceApi.js`
- **Fallback:** Mock data
- **Future:** Backend API (when deployed)

### 4. Storage Integration
- **Settings:** localStorage (`dex_settings`)
- **Theme:** Applied to `document.documentElement`
- **Layout:** Applied via data attributes

---

## 📊 DATA FLOW ARCHITECTURE

### Charts Data Flow (Current):
```
User → Performance Page
  ↓
usePerformance Hook
  ↓
1. Try Backend API → FAIL (not deployed)
  ↓
2. Fallback to Binance API → SUCCESS
  ↓
3. Format Data
  ↓
4. Display in PerformanceChart Component
```

### Settings Flow:
```
User → Settings Modal
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
5. UI Updates
```

### Wallet Flow:
```
User → Connect Wallet Button
  ↓
useDEXWallet Hook
  ↓
1. Check Available Wallets
  ↓
2. Open UnifiedWalletModal (if multiple)
  ↓
3. User Selects Wallet
  ↓
4. Connect via WalletContext
  ↓
5. Update State
  ↓
6. Display Wallet Address
```

---

## 🎨 STYLING ARCHITECTURE

### CSS Organization:
- **Global:** `src/components/DEX/frontend/styles/global.css` - Global styles, theme
- **Layout:** `src/styles/DEX/layout-settings.css` - Layout positions
- **Header:** `src/styles/DEX/header.css` - Header styles
- **Components:** Component-specific CSS files

### Theme System:
- **Storage:** localStorage
- **Application:** `data-theme` attribute on `document.documentElement`
- **CSS:** CSS variables for theme colors
- **Toggle:** Settings modal

### Layout System:
- **Storage:** localStorage
- **Application:** `data-trade-panel-position`, `data-orderbook-position`
- **CSS:** Flex `order` property
- **Toggle:** Settings modal

---

## 🔧 TECHNOLOGY STACK

### Frontend Framework:
- **Main App:** Create React App
- **DEX:** React components (integrated)
- **Routing:** React Router v6
- **State:** React Hooks + Context

### UI Libraries:
- **Icons:** lucide-react
- **Charts:** recharts
- **Date:** date-fns

### External APIs (Development):
- **Charts:** Binance API (public, free)
- **Future:** Backend API (when deployed)

### Storage:
- **Settings:** localStorage
- **Theme:** localStorage + DOM attributes

---

## 🏛️ COMPONENT ARCHITECTURE

### Common Components:
- `Layout.jsx` - Main layout wrapper
- `Header.jsx` - Header with wallet connection
- `Sidebar.jsx` - Navigation sidebar
- `SettingsModal/` - Settings modal component
- `ErrorBoundary.jsx` - Error boundary
- `LoadingSpinner.jsx` - Loading spinner

### Page Components:
- `Dashboard.jsx` - Dashboard page
- `Strategies.jsx` - Strategies page
- `Signals.jsx` - Signals page
- `Performance.jsx` - Performance page (with charts)
- `Execution.jsx` - Execution page

### Feature Components:
- `PerformanceChart.jsx` - Charts component (recharts)
- `MetricsDisplay.jsx` - Metrics display
- `RiskMetrics.jsx` - Risk metrics
- `PerformanceHistory.jsx` - History display

---

## 🔐 SECURITY CONSIDERATIONS

### Current (Development Mode):
- ✅ XSS protection (existing code)
- ✅ Input sanitization (existing code)
- ⚠️ Uses public APIs (Binance - safe for development)
- ⚠️ NOT production security audit

### Future (Production):
- 🔒 Security audit required
- 🔒 Authentication required
- 🔒 Authorization required
- 🔒 Rate limiting required
- 🔒 API security required

---

## 📝 ARCHITECTURE CONSTRAINTS

### DO NOT:
1. Modify core architecture without documentation
2. Change routing structure without update
3. Modify integration points without review
4. Remove existing components
5. Change file structure without documentation

### MUST:
1. Document architecture changes
2. Update this file if structure changes
3. Preserve integration points
4. Maintain isolation from main app
5. Follow existing patterns

---

## 📁 REFERENCE DOCUMENTS

For detailed architecture:
- `../src/components/DEX/architecture/ARCHITECTURE.md` - Detailed architecture
- `../DEX_PROJECT_COMPLETE_STATUS.md` - Complete status with file list
- `../DOCUMENTATION_INDEX.md` - Documentation index

---

**This file is IMMUTABLE. Do NOT delete or modify.**

---

## Architecture Clarification

**Added for context – 2024-01-10**

### Target Architecture vs Current State

The architecture described above (signals/strategies/execution/services) represents the **TARGET architecture** for the DEX product, not necessarily the current implementation state.

**Key Points:**
1. **Signals/Strategies/Execution layers** are the **target architecture** for the Oxium-like AI Trading Interface
2. **Not all layers are fully implemented yet** - this is intentional (skeleton stage)
3. **Current codebase** may use a different structure (flat components, services at root, Trade/ directory)
4. **Target architecture** exists in `Proiect/` directory (status: unclear if active or legacy)

**For current implementation status:** See `05_CURRENT_STATUS.md` and `07_PRODUCT_TRUTH.md`

---

**Last Updated:** 2024-01-10  
**Next File to Read:** `04_DO_NOT_MODIFY.md`
