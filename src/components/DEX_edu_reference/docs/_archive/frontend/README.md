# 🎨 BitSwapDEX AI Trading Frontend

## 📖 Despre Frontend

Frontend standalone pentru BitSwapDEX AI Trading system. Complet independent - poate fi deployat separat pe Vercel, Netlify sau alt platform.

---

## 📁 Structura Frontend

```
frontend/
├── components/              # React Components
│   ├── ai-trading/          # AI Trading Components
│   │   ├── AITradingDashboard.jsx
│   │   ├── BotStatus.jsx
│   │   ├── BotControls.jsx
│   │   └── MarketAnalysis.jsx
│   ├── strategies/          # Strategy Components
│   │   ├── StrategySelector.jsx
│   │   ├── StrategyConfig.jsx
│   │   ├── StrategyList.jsx
│   │   └── StrategyCard.jsx
│   ├── signals/             # Signal Components
│   │   ├── SignalList.jsx
│   │   ├── SignalCard.jsx
│   │   ├── SignalDetails.jsx
│   │   └── SignalValidator.jsx
│   ├── performance/         # Performance Components
│   │   ├── PerformanceChart.jsx
│   │   ├── MetricsDisplay.jsx
│   │   ├── RiskMetrics.jsx
│   │   └── PerformanceHistory.jsx
│   ├── execution/           # Execution Components
│   │   ├── TradeList.jsx
│   │   ├── TradeCard.jsx
│   │   ├── TradeDetails.jsx
│   │   └── ExecutionMonitor.jsx
│   └── common/              # Common Components
│       ├── Layout.jsx
│       ├── Header.jsx
│       ├── Sidebar.jsx
│       ├── LoadingSpinner.jsx
│       └── ErrorBoundary.jsx
│
├── pages/                   # Page Components
│   ├── Dashboard.jsx        # Main Dashboard
│   ├── Strategies.jsx       # Strategies Page
│   ├── Signals.jsx          # Signals Page
│   ├── Performance.jsx      # Performance Page
│   └── Execution.jsx        # Execution Page
│
├── hooks/                   # Custom React Hooks
│   ├── useAITrading.js
│   ├── useStrategies.js
│   ├── useSignals.js
│   ├── usePerformance.js
│   └── useExecution.js
│
├── context/                 # React Context
│   ├── AITradingContext.jsx
│   └── AuthContext.jsx
│
├── utils/                   # Utility Functions
│   ├── formatters.js
│   ├── validators.js
│   ├── constants.js
│   └── helpers.js
│
├── styles/                  # Styles & Theme
│   ├── theme.css
│   ├── global.css
│   ├── components.css
│   └── responsive.css
│
├── services/                # API Services (from Proiect/services)
│   ├── aiTradingApiService.js
│   ├── strategyApiService.js
│   ├── signalApiService.js
│   ├── performanceApiService.js
│   └── aiTradingEngineService.js
│
├── App.jsx                  # Main App Component
├── routes.jsx               # Routing Configuration
├── package.json             # Dependencies
└── .env.example             # Environment Variables
```

---

## 🚀 Quick Start

### **1. Setup:**
```bash
cd frontend/
npm install
cp .env.example .env
# Edit .env with your API URL
```

### **2. Development:**
```bash
npm start
```

### **3. Build:**
```bash
npm run build
```

---

## 🌐 Environment Variables

```env
REACT_APP_API_BASE_URL=http://localhost:4000/api
REACT_APP_ENVIRONMENT=development
```

---

## 📊 Component Features

### **AI Trading Dashboard:**
- Bot status și controls
- Market analysis
- Real-time statistics
- Bot configuration

### **Strategies:**
- Strategy selector
- Strategy configuration
- Strategy management (CRUD)
- Strategy performance

### **Signals:**
- Signal list și details
- Signal validation
- Signal history
- Signal priority

### **Performance:**
- Performance charts
- Metrics display
- Risk metrics
- Performance history

### **Execution:**
- Trade list și details
- Execution monitoring
- Trade history
- Trade status

---

## 🎨 Styling

- CSS Modules sau Styled Components
- Responsive design
- Dark/Light theme support
- Modern UI/UX

---

## 🔌 API Integration

Frontend-ul se conectează la backend-ul separat prin API endpoints:
- `POST /api/ai-trading/start`
- `POST /api/ai-trading/stop`
- `GET /api/ai-trading/status`
- `GET /api/ai-trading/stats`
- etc.

---

**Last Updated:** 2026-01-09  
**Status:** 🟡 Frontend Structure - Ready for Implementation

