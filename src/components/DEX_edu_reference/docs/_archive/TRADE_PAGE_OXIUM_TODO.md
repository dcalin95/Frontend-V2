# 📋 TODO: Trade Page - Interfață Similară cu Oxium DEX

**Data:** 2026-01-09  
**Referință:** https://app.oxium.xyz/trade  
**Status:** 🟡 Planning Phase

---

## 🎯 Obiectiv

Creează o pagină de trading completă similară cu Oxium DEX, cu toate componentele necesare pentru trading avansat:
- TradingView chart integrat
- Order Book live
- Swap/Limit orders
- Open Orders management
- Positions tracking
- Order History

---

## 📍 Locație Implementare

**Opțiunea Recomandată:**
```
src/components/DEX/TradePage.jsx  (nouă pagină dedicată)
src/components/DEX/TradePageMobile.jsx  (versiune mobile)
```

**Alternativă (extindere):**
- Extinde `SwapPage.jsx` existent cu componente noi
- Adaugă route nou în `App.js` pentru `/trade`

**Structură Recomandată:**
```
src/components/DEX/
├── TradePage.jsx              # Main trade page (desktop)
├── TradePageMobile.jsx         # Mobile version
├── components/
│   ├── TradeHeader.jsx         # Header cu pair selector și stats
│   ├── TradingViewChart.jsx    # TradingView chart wrapper
│   ├── OrderBook.jsx          # Order book component
│   ├── TradeTabs.jsx          # Tabs: Open Orders, Positions, History
│   ├── SwapLimitPanel.jsx     # Swap/Limit order panel
│   └── MarketStats.jsx        # 24h stats (price, volume, high/low)
└── styles/
    ├── TradePage.css
    └── TradePage.mobile.css
```

---

## ✅ TODO List - Componente Principale

### **Phase 1: Structură de Bază (2-3 zile)**

#### 1.1. **TradePage.jsx - Main Component**
- [ ] Creează componenta principală `TradePage.jsx`
- [ ] Layout cu 2 coloane: Chart + Order Book | Swap Panel
- [ ] Responsive design (desktop/mobile)
- [ ] Integrare cu WalletContext
- [ ] State management pentru selected pair
- [ ] Route setup în `App.js` pentru `/trade`

#### 1.2. **TradeHeader.jsx - Header Component**
- [ ] Pair selector (token1/token2) cu dropdown
- [ ] Quick search (Ctrl+K) pentru pair selection
- [ ] Market stats display:
  - [ ] Current Price
  - [ ] 24h Change (% și valoare)
  - [ ] 24h Volume
  - [ ] 24h High
  - [ ] 24h Low
- [ ] Connect Wallet button
- [ ] Favorite pairs toggle
- [ ] Settings button

#### 1.3. **MarketStats.jsx - Market Statistics**
- [ ] Price display cu formatare corectă
- [ ] 24h Change cu color coding (green/red)
- [ ] Volume formatat ($1,087,413.58)
- [ ] High/Low prices
- [ ] Real-time updates (WebSocket sau polling)

---

### **Phase 2: Trading Chart (2-3 zile)**

#### 2.1. **TradingViewChart.jsx - Chart Integration**
- [ ] Integrare TradingView Widget (lightweight-charts sau TradingView widget)
- [ ] Configurare chart:
  - [ ] Symbol: `BSC:TOKEN1/TOKEN2`
  - [ ] Interval selector (1m, 5m, 15m, 1h, 4h, 1d, etc.)
  - [ ] Chart type (Candles, Line, Area)
  - [ ] Timezone display
- [ ] Chart toolbar:
  - [ ] Drawing tools (trend lines, Fibonacci, etc.)
  - [ ] Indicators selector
  - [ ] Chart settings
  - [ ] Fullscreen mode
  - [ ] Save layout
- [ ] OHLC display (Open, High, Low, Close)
- [ ] Volume indicator
- [ ] Real-time price updates

#### 2.2. **Chart Controls**
- [ ] Interval selector (1m, 5m, 15m, 1h, 4h, 1d, 1w, 1M)
- [ ] Chart type toggle
- [ ] Indicators management
- [ ] Drawing tools toolbar
- [ ] Chart settings modal

---

### **Phase 3: Order Book (2-3 zile)**

#### 3.1. **OrderBook.jsx - Order Book Component**
- [ ] Layout cu 2 secțiuni: Bids (asks) și Asks (bids)
- [ ] Tabs: "Order Book" și "Trades"
- [ ] Column headers: Price | Size | Total
- [ ] Clickable rows pentru pre-fill order
- [ ] Depth visualization (background color intensity)
- [ ] Mid price display
- [ ] Spread calculation și display
- [ ] Decimal precision selector (0,0 / 0,00 / 0,000)
- [ ] Real-time updates (WebSocket)

#### 3.2. **Order Book Features**
- [ ] Aggregation levels (0.01, 0.1, 1, etc.)
- [ ] Cumulative totals
- [ ] Hover effects pentru better UX
- [ ] Click to fill order price
- [ ] Market depth chart (opțional)

#### 3.3. **Recent Trades Tab**
- [ ] Lista cu tranzacții recente
- [ ] Columns: Price | Size | Time
- [ ] Color coding (green pentru buy, red pentru sell)
- [ ] Real-time updates
- [ ] Auto-scroll la tranzacții noi

---

### **Phase 4: Swap/Limit Orders (3-4 zile)**

#### 4.1. **SwapLimitPanel.jsx - Trading Panel**
- [ ] Tabs: "Swap" și "Limit"
- [ ] Swap interface:
  - [ ] "Pay" input cu token selector
  - [ ] "Receive" input cu token selector
  - [ ] Swap button (sau arrow pentru reverse)
  - [ ] USD value display sub fiecare input
  - [ ] Slippage settings
  - [ ] Transaction fee display
  - [ ] Route information
  - [ ] "Connect wallet" button dacă nu e conectat
- [ ] Limit order interface:
  - [ ] Order type selector (Buy/Sell)
  - [ ] Price input
  - [ ] Amount input
  - [ ] Total calculation
  - [ ] Expiry date/time
  - [ ] Place order button

#### 4.2. **Token Selector**
- [ ] Modal pentru token selection
- [ ] Search functionality
- [ ] Favorite tokens
- [ ] Token balance display
- [ ] Token logo și symbol

#### 4.3. **Swap Execution**
- [ ] Quote fetching (getAmountsOut)
- [ ] Slippage calculation
- [ ] Transaction preview
- [ ] Execute swap (PancakeSwap integration)
- [ ] Transaction status tracking
- [ ] Success/error notifications

---

### **Phase 5: Orders Management (2-3 zile)**

#### 5.1. **TradeTabs.jsx - Orders Tabs**
- [ ] Tab: "Open Orders"
- [ ] Tab: "Positions"
- [ ] Tab: "Order History"
- [ ] Toggle: "Show all markets"

#### 5.2. **OpenOrders.jsx - Open Orders Table**
- [ ] Table columns:
  - [ ] Market (sortable)
  - [ ] Trade Value (sortable)
  - [ ] Limit Price (sortable)
  - [ ] Amount Filled (sortable)
  - [ ] Time (sortable)
  - [ ] Actions (Cancel)
- [ ] Cancel individual order
- [ ] Cancel all orders button
- [ ] Empty state
- [ ] Real-time updates

#### 5.3. **Positions.jsx - Positions Table**
- [ ] Table columns:
  - [ ] Market
  - [ ] Size
  - [ ] Entry Price
  - [ ] Mark Price
  - [ ] PnL (Profit/Loss)
  - [ ] PnL %
  - [ ] Actions (Close)
- [ ] PnL color coding
- [ ] Close position functionality
- [ ] Real-time PnL updates

#### 5.4. **OrderHistory.jsx - Order History**
- [ ] Table columns:
  - [ ] Market
  - [ ] Type (Buy/Sell)
  - [ ] Price
  - [ ] Amount
  - [ ] Filled
  - [ ] Status
  - [ ] Time
- [ ] Filter by market
- [ ] Filter by date range
- [ ] Pagination
- [ ] Export to CSV (opțional)

---

### **Phase 6: Backend Integration (2-3 zile)**

#### 6.1. **WebSocket Service**
- [ ] WebSocket connection pentru real-time data
- [ ] Order book updates
- [ ] Recent trades updates
- [ ] Price updates
- [ ] Connection management (reconnect logic)

#### 6.2. **API Services**
- [ ] `tradeApiService.js` - Trade operations
- [ ] `orderBookApiService.js` - Order book data
- [ ] `marketDataApiService.js` - Market stats
- [ ] `orderApiService.js` - Order management

#### 6.3. **Smart Contract Integration**
- [ ] PancakeSwap Router integration
- [ ] Swap execution
- [ ] Limit order placement (dacă avem contract)
- [ ] Transaction status tracking

---

### **Phase 7: Styling & UX (2-3 zile)**

#### 7.1. **CSS Styling**
- [ ] `TradePage.css` - Desktop styles
- [ ] `TradePage.mobile.css` - Mobile responsive
- [ ] Dark theme support
- [ ] Animations și transitions
- [ ] Loading states
- [ ] Error states

#### 7.2. **UX Improvements**
- [ ] Keyboard shortcuts (Ctrl+K pentru search)
- [ ] Tooltips pentru features
- [ ] Confirmation modals
- [ ] Toast notifications
- [ ] Loading spinners
- [ ] Empty states

---

### **Phase 8: Testing & Optimization (2-3 zile)**

#### 8.1. **Testing**
- [ ] Unit tests pentru componente
- [ ] Integration tests
- [ ] E2E tests pentru flow-uri principale
- [ ] Performance testing

#### 8.2. **Optimization**
- [ ] Code splitting
- [ ] Lazy loading pentru chart
- [ ] Memoization pentru expensive calculations
- [ ] WebSocket optimization
- [ ] Bundle size optimization

---

## 🔧 Dependencies Necesare

### **NPM Packages:**
```json
{
  "lightweight-charts": "^4.1.0",  // TradingView alternative (lightweight)
  // SAU
  "react-tradingview-widget": "^1.0.0",  // TradingView widget wrapper
  
  "recharts": "^2.10.0",  // Pentru depth chart (opțional)
  "socket.io-client": "^4.6.0",  // WebSocket client
  "ethers": "^6.0.0",  // Smart contract interaction
  "react-hot-toast": "^2.4.0",  // Toast notifications
  "date-fns": "^2.30.0"  // Date formatting
}
```

---

## 📐 Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│ Header: Pair Selector | Market Stats | Connect Wallet  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────┐  ┌──────────────────────┐  │
│  │                      │  │  Order Book           │  │
│  │  TradingView Chart  │  │  ┌─────────────────┐  │  │
│  │                      │  │  │ Bids (Asks)     │  │  │
│  │                      │  │  ├─────────────────┤  │  │
│  │                      │  │  │ Mid: 0.123      │  │  │
│  │                      │  │  ├─────────────────┤  │  │
│  │                      │  │  │ Asks (Bids)     │  │  │
│  │                      │  │  └─────────────────┘  │  │
│  │                      │  │                       │  │
│  │                      │  │  Tabs:               │  │
│  │                      │  │  [Order Book] [Trades]│  │
│  └──────────────────────┘  └──────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Open Orders | Positions | Order History         │  │
│  │ [Table with orders/positions/history]           │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ [Swap] [Limit]                                   │  │
│  │ Pay: [Input] [Token Selector]                   │  │
│  │        ↓                                         │  │
│  │ Receive: [Input] [Token Selector]              │  │
│  │ [Connect Wallet / Swap Button]                  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Design Guidelines

### **Colors:**
- Primary: `#00aaff` (similar cu Oxium)
- Success (buy): `#00ffc3` (green)
- Danger (sell): `#ff4444` (red)
- Background: Dark theme
- Text: White/Gray

### **Typography:**
- Headers: Bold, uppercase
- Numbers: Monospace font pentru alignment
- Small text: 0.75rem - 0.85rem

### **Spacing:**
- Padding: 1rem - 1.5rem
- Gap între componente: 1rem
- Border radius: 8px - 12px

---

## 📝 Notes

1. **TradingView Integration:**
   - Poți folosi TradingView Widget (gratuit, dar cu branding)
   - SAU lightweight-charts (open source, fără branding)
   - SAU Chart.js cu custom implementation

2. **Order Book:**
   - Poate fi mock data inițial
   - Integrare reală cu backend/WebSocket mai târziu

3. **Limit Orders:**
   - Dacă nu avem contract pentru limit orders, poți face UI-ul pregătit
   - Sau folosește PancakeSwap limit orders (dacă există)

4. **Mobile:**
   - Stack components vertical
   - Collapsible sections
   - Bottom sheet pentru swap panel

---

## 🚀 Prioritate Implementare

**High Priority (MVP):**
1. TradePage.jsx structure
2. TradeHeader.jsx cu market stats
3. TradingViewChart.jsx (basic)
4. SwapLimitPanel.jsx (Swap only)
5. OrderBook.jsx (basic)

**Medium Priority:**
6. OpenOrders.jsx
7. Positions.jsx
8. OrderHistory.jsx
9. Limit orders
10. WebSocket integration

**Low Priority (Nice to Have):**
11. Advanced chart features
12. Depth chart
13. Export functionality
14. Advanced filters

---

**Last Updated:** 2026-01-09  
**Status:** 🟡 Ready for Implementation

