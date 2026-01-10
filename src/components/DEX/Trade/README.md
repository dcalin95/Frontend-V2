# 📊 Trade Chart - Oxium-Inspired Trading Interface

**Data:** 2026-01-09  
**Referință:** https://app.oxium.xyz/trade  
**Status:** 🟡 In Development

---

## 📁 Structură Director

```
src/components/DEX/Trade/
├── README.md                    # Acest fișier
├── TradePage.jsx               # Main page component (desktop)
├── TradePageMobile.jsx          # Mobile version
├── components/
│   ├── TradeHeader/
│   │   ├── TradeHeader.jsx     # Header cu pair selector și stats
│   │   ├── TradeHeader.css
│   │   └── index.js
│   ├── TradingViewChart/
│   │   ├── TradingViewChart.jsx # TradingView chart wrapper
│   │   ├── TradingViewChart.css
│   │   ├── ChartControls.jsx    # Chart controls (interval, indicators)
│   │   └── index.js
│   ├── OrderBook/
│   │   ├── OrderBook.jsx        # Order book component
│   │   ├── OrderBook.css
│   │   ├── OrderBookRow.jsx     # Individual order row
│   │   ├── RecentTrades.jsx     # Recent trades tab
│   │   └── index.js
│   ├── MarketStats/
│   │   ├── MarketStats.jsx      # 24h market statistics
│   │   ├── MarketStats.css
│   │   └── index.js
│   ├── SwapLimitPanel/
│   │   ├── SwapLimitPanel.jsx   # Swap/Limit order panel
│   │   ├── SwapLimitPanel.css
│   │   ├── SwapPanel.jsx        # Swap interface
│   │   ├── LimitPanel.jsx       # Limit order interface
│   │   ├── TokenSelector.jsx    # Token selection modal
│   │   └── index.js
│   └── TradeTabs/
│       ├── TradeTabs.jsx        # Tabs container
│       ├── OpenOrders.jsx      # Open orders table
│       ├── Positions.jsx        # Positions table
│       ├── OrderHistory.jsx     # Order history table
│       └── index.js
├── hooks/
│   ├── useOrderBook.js         # Order book data hook
│   ├── useMarketData.js         # Market data hook
│   ├── useTradingPair.js        # Trading pair management
│   └── useWebSocket.js          # WebSocket connection
├── services/
│   ├── orderBookService.js     # Order book API service
│   ├── marketDataService.js    # Market data API service
│   ├── tradeService.js         # Trade execution service
│   └── websocketService.js     # WebSocket service
├── utils/
│   ├── formatPrice.js          # Price formatting
│   ├── formatVolume.js         # Volume formatting
│   ├── calculateSpread.js      # Spread calculation
│   └── tradingHelpers.js       # Trading utilities
└── styles/
    ├── TradePage.css           # Main page styles
    ├── TradePage.mobile.css    # Mobile styles
    └── variables.css           # CSS variables
```

---

## 🎯 Componente Principale

### **1. TradePage.jsx**
Main page component care orquestrează toate componentele:
- Layout cu 2 coloane: Chart + Order Book | Swap Panel
- State management pentru trading pair
- Wallet integration
- Responsive design

### **2. TradeHeader/**
- Pair selector (token1/token2)
- Market stats display
- Connect wallet button
- Quick search (Ctrl+K)

### **3. TradingViewChart/**
- TradingView widget integration
- Chart controls (interval, indicators)
- Drawing tools
- OHLC display
- Volume indicator

### **4. OrderBook/**
- Bids/Asks display
- Recent trades tab
- Depth visualization
- Click to fill order

### **5. MarketStats/**
- Current price
- 24h Change
- 24h Volume
- 24h High/Low

### **6. SwapLimitPanel/**
- Swap interface
- Limit order interface
- Token selector
- Transaction preview

### **7. TradeTabs/**
- Open Orders
- Positions
- Order History

---

## 🚀 Features Oxium-Inspired

✅ TradingView chart integrat  
✅ Order Book live cu bids/asks  
✅ Recent Trades feed  
✅ Market statistics (24h)  
✅ Swap/Limit orders  
✅ Open Orders management  
✅ Positions tracking  
✅ Order History  

---

## 📦 Dependencies

```json
{
  "lightweight-charts": "^4.1.0",
  "socket.io-client": "^4.6.0",
  "react-hot-toast": "^2.4.0",
  "date-fns": "^2.30.0"
}
```

---

## 🔗 Integration

### **Route Setup:**
```jsx
// App.js
<Route path="/trade" element={<TradePage />} />
```

### **Wallet Integration:**
Folosește `WalletContext` existent pentru:
- Wallet connection
- Balance fetching
- Transaction signing

### **Backend Integration:**
- WebSocket pentru real-time data
- REST API pentru market data
- Smart contract pentru trade execution

---

**Last Updated:** 2026-01-09

