# 🎨 DEX Design System - Binance/PancakeSwap Style

**Status:** ✅ Implementat  
**Data:** 2024-01-11  
**Last Updated:** 2025-01-27 (BridgeHandler added)  
**Stil:** Binance/PancakeSwap inspired - Modern Dark Trading Interface

---

## 📋 Overview

Design system standardizat pentru BitSwapDEX, inspirat din Binance și PancakeSwap, cu suport complet pentru logouri de criptomonede.

---

## 🎨 Design Tokens

### Color System

#### Primary Colors
- `--dex-primary`: `#4facfe` (Cyan/Blue)
- `--dex-primary-gradient`: `linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)`
- `--dex-secondary`: `#9945ff` (Purple)

#### Trading Colors
- `--dex-text-buy`: `#22c55e` (Green - pentru cumpărări)
- `--dex-text-sell`: `#ef4444` (Red - pentru vânzări)
- `--dex-success`: `#22c55e`
- `--dex-error`: `#ef4444`

#### Background Colors (Dark Theme)
- `--dex-bg-primary`: `#0b0e23` (Main background)
- `--dex-bg-secondary`: `#16182e` (Card backgrounds)
- `--dex-bg-tertiary`: `#1a1d35` (Nested cards, inputs)
- `--dex-bg-hover`: `#252840` (Hover states)

#### Text Colors
- `--dex-text-primary`: `#ffffff`
- `--dex-text-secondary`: `#8b9bb4`
- `--dex-text-tertiary`: `#6b7280`

### Typography

- **Font Family**: System fonts (SF Pro, Segoe UI, Roboto)
- **Font Family Mono**: `SF Mono`, `Monaco`, `Inconsolata` (pentru numere)
- **Font Sizes**: `xs` (10px) → `4xl` (40px)
- **Font Weights**: `normal` (400), `medium` (500), `semibold` (600), `bold` (700)

### Spacing System

- `--dex-spacing-xs`: `4px`
- `--dex-spacing-sm`: `8px`
- `--dex-spacing-md`: `12px`
- `--dex-spacing-lg`: `16px`
- `--dex-spacing-xl`: `24px`
- `--dex-spacing-2xl`: `32px`
- `--dex-spacing-3xl`: `48px`

### Border Radius

- `--dex-border-radius`: `8px` (standard)
- `--dex-border-radius-sm`: `4px`
- `--dex-border-radius-lg`: `12px`
- `--dex-border-radius-xl`: `16px`
- `--dex-border-radius-full`: `9999px` (circular)

### Shadows

- `--dex-shadow`: Standard shadow
- `--dex-shadow-md`: Medium shadow
- `--dex-shadow-lg`: Large shadow
- `--dex-shadow-primary`: Colored shadow pentru primary elements

---

## 🪙 Token Logo Component

### Location
`src/components/DEX/frontend/components/common/TokenLogo.jsx`

### Features
- Suport pentru logouri reale din `assets/icons/tokenIconMap.js`
- Fallback cu emoji/char pentru token-uri necunoscute
- Sizes: `xs`, `sm`, `md`, `lg`, `xl`, `2xl`
- Border option
- Auto-color pentru fallback

### Usage

```jsx
import TokenLogo from '../common/TokenLogo';

// Basic usage
<TokenLogo symbol="BTC" size="md" />

// With border
<TokenLogo symbol="ETH" size="lg" showBorder />

// Custom fallback
<TokenLogo symbol="UNKNOWN" size="md" fallbackImage="/path/to/image.png" />
```

### Supported Tokens

Logouri reale disponibile:
- `BNB`, `ETH`, `USDT`, `USDC`, `SOL`, `MATIC`, `SHIB`

Fallback cu emoji/char:
- `BTC`, `ETH`, `USDT`, `USDC`, `BNB`, `BUSD`, `BITS`, `SOL`

---

## 📦 Componente Actualizate

### ✅ SwapPanel
- Design system aplicat
- TokenLogo integrat pentru fromToken și toToken
- Gradient buttons cu shadow effects
- Hover states îmbunătățite

### ✅ Orderbook
- Design system aplicat
- Trading colors (green/red) pentru bids/asks
- Consistent spacing și typography

### ✅ MarketStats
- Design system aplicat
- Consistent card styling

### ✅ QuickStats
- Design system aplicat
- Trading colors pentru positive/negative changes
- Hover effects îmbunătățite

### ✅ PortfolioOverview
- Design system aplicat
- TokenLogo integrat pentru holdings
- Badge și ProgressBar folosite
- Trading colors standardizate

### ✅ RecentActivity
- Design system aplicat
- Trading colors pentru status (completed/pending/failed)
- Consistent spacing și typography

### ✅ PerformanceSummary
- Design system aplicat
- Consistent card styling
- Standardized spacing

### ✅ StrategiesStats
- Design system aplicat
- Hover effects îmbunătățite
- Consistent card styling

### ✅ ExecutionStatsCards
- Design system aplicat
- Trading colors pentru positive/negative
- Hover effects îmbunătățite

### ✅ SignalsFilters
- Design system aplicat
- Consistent input styling
- Standardized spacing

---

## 🎯 Design Principles

### 1. Consistency
- Toate componentele folosesc aceleași design tokens
- Spacing și typography standardizate
- Culori consistente pentru trading (green/red)

### 2. Binance/PancakeSwap Style
- Dark theme cu background-uri specifice
- Cards cu borders subtile
- Gradient accents pe butoane importante
- Logouri token-uri în componente

### 3. Trading Interface Optimized
- High contrast pentru lizibilitate
- Color coding pentru buy/sell
- Monospace font pentru numere
- Clear visual hierarchy

---

## 📁 File Structure

```
src/components/DEX/frontend/
├── styles/
│   ├── design-system.css          # ✅ Design tokens global
│   ├── global.css                 # ✅ Import design-system.css
│   └── components/
│       ├── token-logo.css         # ✅ TokenLogo styles
│       ├── swap-panel.css          # ✅ Actualizat
│       ├── orderbook.css          # ✅ Actualizat
│       ├── market-stats.css       # ✅ Actualizat
│       └── quick-stats.css        # ✅ Actualizat
└── components/
    └── common/
        └── TokenLogo.jsx          # ✅ Component nou
```

---

## 🚀 Usage Examples

### Using Design Tokens

```css
.my-component {
  background: var(--dex-bg-secondary);
  border: 1px solid var(--dex-border);
  border-radius: var(--dex-border-radius);
  padding: var(--dex-spacing-lg);
  color: var(--dex-text-primary);
  box-shadow: var(--dex-shadow);
}
```

### Using TokenLogo

```jsx
// In SwapPanel
<TokenLogo symbol={swapData.fromToken.symbol} size="md" showBorder />

// In Orderbook (future)
<TokenLogo symbol="BTC" size="sm" />

// In Trading Pairs List
<TokenLogo symbol={pair.symbol} size="lg" />
```

---

## ✅ Checklist Implementare

- [x] Design system CSS creat (`design-system.css`)
- [x] Design system importat în `global.css`
- [x] TokenLogo component creat
- [x] TokenLogo integrat în SwapPanel
- [x] SwapPanel actualizat cu design system
- [x] Orderbook actualizat cu design system
- [x] MarketStats actualizat cu design system
- [x] QuickStats actualizat cu design system
- [x] PortfolioOverview actualizat cu design system + TokenLogo
- [x] RecentActivity actualizat cu design system
- [x] PerformanceSummary actualizat cu design system
- [x] StrategiesStats actualizat cu design system
- [x] ExecutionStatsCards actualizat cu design system
- [x] SignalsFilters actualizat cu design system
- [x] Toate valorile hardcoded înlocuite cu design tokens

---

## 📝 Notes

1. **Logouri Token-uri**: Componenta TokenLogo folosește logouri reale din `assets/icons/tokenIconMap.js`. Pentru token-uri noi, adaugă logo-ul în acel fișier.

2. **Design System Global**: Toate variabilele CSS sunt disponibile global prin `design-system.css` importat în `global.css`.

3. **Light Theme**: Design system-ul suportă light theme prin `[data-theme="light"]` override, dar momentan focus-ul este pe dark theme (Binance/PancakeSwap style).

4. **Extensibilitate**: Design system-ul este ușor de extins - adaugă noi tokens în `design-system.css`.

---

**Status:** ✅ **Design System Implementat și Standardizat**  
**Last Updated:** 2024-01-11  
**Style:** Binance/PancakeSwap inspired - Modern Dark Trading Interface
