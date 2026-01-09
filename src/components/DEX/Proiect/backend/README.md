# 🖥️ Backend - BitSwapDEX AI Trading

## 📋 Overview

Backend server pentru AI Trading system, providing:
- Market data fetching și caching
- Trading execution via smart contracts
- Performance tracking și analytics
- User management (strategies, risk limits, config)
- Database storage (trades, signals, performance)

---

## 🏗️ Architecture

### **Structure:**
```
backend/
├── routes/
│   └── ai-trading/
│       ├── aiTradingRoutes.js        # Main AI Trading endpoints
│       ├── strategiesRoutes.js       # Strategy management endpoints
│       ├── signalsRoutes.js          # Signal generation endpoints
│       ├── executionRoutes.js        # Trade execution endpoints
│       └── performanceRoutes.js      # Performance tracking endpoints
│
├── services/
│   └── ai-trading/
│       ├── AITradingService.js       # AI Trading business logic
│       ├── MarketDataService.js      # Market data fetching
│       ├── ContractService.js        # Smart contract interaction
│       └── PerformanceService.js     # Performance analytics
│
├── models/
│   ├── Trade.js                      # Trade model
│   ├── Signal.js                     # Signal model
│   ├── Strategy.js                   # Strategy model
│   └── Performance.js                # Performance model
│
├── middleware/
│   ├── auth.js                       # Authentication (existing)
│   ├── rateLimit.js                  # Rate limiting
│   ├── validation.js                 # Input validation
│   └── errorHandler.js               # Error handling
│
├── config/
│   ├── database.js                   # Database config (existing)
│   ├── blockchain.js                 # Blockchain config (BSC)
│   └── aiConfig.js                   # AI Trading config
│
├── utils/
│   ├── encryption.js                 # Encryption utilities
│   ├── logger.js                     # Logging utilities
│   └── web3.js                       # Web3 utilities
│
├── scripts/
│   ├── backup.js                     # Database backup
│   └── migrate.js                    # Database migrations
│
└── migrations/
    └── 001_create_ai_trading_tables.sql
```

---

## 🔒 Backup & Security

### **Database Backups:**
- ✅ **Render PostgreSQL:** Automated daily backups (7 days retention)
- ✅ **Manual backups:** `npm run backup` (export SQL)
- ✅ **S3 backup:** Opțional (upload to S3)

### **Private Key Management:**
- ✅ **Render Environment Variables:** Secure storage în Render dashboard
- ✅ **Encryption:** Encrypt sensitive data (private keys, etc.)
- ✅ **Rotation:** Rotate keys periodic (monthly/quarterly)

### **Security Measures:**
- ✅ **HTTPS/SSL:** Render automatic SSL
- ✅ **CORS:** Configured pentru frontend domain
- ✅ **Rate Limiting:** 100-1000 requests/min
- ✅ **Authentication:** JWT tokens
- ✅ **Authorization:** Role-based access
- ✅ **Input Validation:** Sanitize inputs
- ✅ **SQL Injection Protection:** Parameterized queries

---

## 🚀 Deployment

### **Render (MVP):**
- ✅ **Auto-deploy** din Git
- ✅ **Environment Variables** în Render dashboard
- ✅ **PostgreSQL** inclus în plan
- ✅ **SSL/HTTPS** inclus în plan
- ✅ **Monitoring** built-in

**Cost:** $7-25/lună

### **AWS (Scale):**
- ✅ **EC2/ECS** pentru application
- ✅ **RDS PostgreSQL** pentru database
- ✅ **Secrets Manager** pentru keys
- ✅ **CloudWatch** pentru monitoring

**Cost:** $115-450/lună

---

## 📊 API Endpoints

### **AI Trading:**
- `POST /api/ai-trading/start` - Start AI Trading Bot
- `POST /api/ai-trading/stop` - Stop AI Trading Bot
- `GET /api/ai-trading/status` - Get bot status
- `GET /api/ai-trading/stats` - Get statistics
- `POST /api/ai-trading/analyze` - Analyze market
- `POST /api/ai-trading/execute` - Execute trade

---

## 🔧 Setup

### **1. Install Dependencies:**
```bash
cd backend-server/
npm install
```

### **2. Set Environment Variables:**
```bash
# Render Dashboard sau .env file
DATABASE_URL=...
WALLET_PRIVATE_KEY=...
WRAPPER_CONTRACT_ADDRESS=...
BSC_RPC_URL=...
```

### **3. Run Migrations:**
```bash
npm run migrate
```

### **4. Start Server:**
```bash
npm start
```

---

## 🚀 Quick Start

### **1. Install Dependencies:**
```bash
cd backend/
npm install
```

### **2. Set Environment Variables:**
```bash
# Copy .env.example to .env
cp ENV_EXAMPLE.txt .env

# Edit .env and fill in your values
# For Render deployment, set these in Render Dashboard
```

### **3. Run Migrations (dacă e necesar):**
```bash
npm run migrate
```

### **4. Start Server:**
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

### **5. Health Check:**
```bash
curl http://localhost:4000/api/health
```

---

## 📁 Complete Structure

```
backend/
├── server.js                 # ✅ Server entry point (STANDALONE)
├── package.json              # ✅ Dependencies
├── .env.example              # ⚠️ Use ENV_EXAMPLE.txt as reference
├── .gitignore                # ✅ Git ignore patterns
├── .eslintrc.js              # ✅ ESLint config
├── jest.config.js            # ✅ Jest config
├── nodemon.json              # ✅ Nodemon config
├── routes/                   # ✅ API Routes
├── services/                 # ✅ Business Logic
├── models/                   # ✅ Database Models
├── middleware/               # ✅ Middleware
├── config/                   # ✅ Configuration
├── utils/                    # ✅ Utilities
├── tests/                    # ✅ Test Structure
│   ├── setup.js              # ✅ Jest setup
│   ├── routes/               # ✅ Route tests
│   ├── services/             # ✅ Service tests
│   ├── utils/                # ✅ Utility tests
│   ├── models/               # ✅ Model tests
│   └── middleware/           # ✅ Middleware tests
├── migrations/               # ✅ Database Migrations
└── scripts/                  # ✅ Utility Scripts
```

---

## 🌐 Deployment

### **Render (Recommended for MVP):**
1. Push code to Git repository
2. Create new Web Service în Render
3. Connect repository
4. Set environment variables în Render Dashboard
5. Deploy automat

### **Environment Variables for Render:**
- `DATABASE_URL` - PostgreSQL connection string (Render PostgreSQL)
- `JWT_SECRET` - JWT secret key
- `BSC_RPC_URL` - BSC RPC endpoint
- `WRAPPER_CONTRACT_ADDRESS` - BitSwapDEX Wrapper contract address
- `WALLET_PRIVATE_KEY` - Wallet private key (secure!)
- `CORS_ALLOWED_ORIGINS` - Allowed origins (comma-separated)

---

**Last Updated:** 2026-01-09  
**Status:** ✅ Backend Structure Complete - Ready for Deployment

