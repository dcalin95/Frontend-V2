# 🖥️ Backend Architecture - BitSwapDEX AI Trading

## 🎯 Overview

Backend server pentru AI Trading system, providing:
- Market data fetching și caching
- Trading execution via smart contracts
- Performance tracking și analytics
- User management (strategies, risk limits, config)
- Database storage (trades, signals, performance)

---

## 📋 Recomandarea Mea: Render vs AWS

### **Render (RECOMANDAT pentru MVP)** ✅ ✅ ✅

**De ce:**
1. ✅ **Deja folosești Render** - ai experiență cu `backend-server-f82y.onrender.com`
2. ✅ **Simplu și rapid** - deployment automat din Git (minute, nu ore)
3. ✅ **Cost mic** - $7-25/lună (perfect pentru MVP)
4. ✅ **PostgreSQL inclus** - database gratis cu plan
5. ✅ **SSL/HTTPS gratis** - inclus în plan
6. ✅ **Auto-scaling** - Render scalează automat
7. ✅ **Monitoring inclus** - logs și metrics built-in
8. ✅ **Zero config** - deployment automat

**Dezavantaje:**
- ⚠️ **Cold starts** - primul request poate fi lent (5-10s)
- ⚠️ **Limite** - Request timeout (100s default)
- ⚠️ **Less control** - mai puțin control față de AWS

**Cost:** $7-25/lună  
**Timeline:** 1-2 săptămâni  
**Recomandare:** ✅ **DA pentru MVP** (până la $100K/lună revenue)

---

### **AWS (RECOMANDAT pentru scale)** ✅ (După MVP)

**Avantaje:**
- ✅ **Scalabilitate nelimitată** - milioane de requests
- ✅ **Full control** - control complet asupra infrastructurii
- ✅ **No cold starts** - EC2 instances rămân active
- ✅ **Advanced features** - Lambda, SQS, CloudWatch, etc.
- ✅ **Enterprise-grade** - perfect pentru high volume

**Dezavantaje:**
- ❌ **Complex** - mai mult setup și config
- ❌ **Cost mai mare** - $115-450/lună (minim)
- ❌ **Time consuming** - 2-3 săptămâni setup
- ❌ **Management overhead** - trebuie să gestionezi totul

**Cost:** $115-450/lună (minim), $500-2,000/lună (scale)  
**Timeline:** 2-3 săptămâni (setup)  
**Recomandare:** ✅ **DA pentru scale** (după $100K/lună revenue)

---

### **Hybrid Approach (RECOMANDAT)** ✅ ✅ ✅

**Plan:**
1. **MVP (Month 1-6):** Render (simplu, rapid, ieftin)
2. **Scale (Month 7-12):** AWS (scalabilitate, control, performance)

**Recomandare:** ✅ ✅ ✅ **PERFECT APPROACH!**

---

## 🏗️ Backend Structure

### **Current Backend:**
```
c:\Users\bits\Desktop\backend-server\
├── server.js                  # Main Express server
├── routes/                    # API routes
├── services/                  # Business logic
├── middleware/                # Auth, validation, etc.
├── config/                    # Configuration
├── database.js                # Database connection
└── render.yaml                # Render deployment config
```

### **New Backend Structure (AI Trading):**
```
backend-server/
├── server.js                  # Main server (existing - extend)
├── routes/
│   ├── ai-trading/
│   │   ├── aiTradingRoutes.js       # AI Trading API endpoints
│   │   ├── strategiesRoutes.js      # Strategy management
│   │   ├── signalsRoutes.js         # Signal generation
│   │   ├── executionRoutes.js       # Trade execution
│   │   └── performanceRoutes.js     # Performance tracking
│   └── ... (existing routes)
├── services/
│   ├── ai-trading/
│   │   ├── AITradingService.js      # AI Trading orchestration
│   │   ├── MarketDataService.js     # Market data fetching
│   │   ├── ContractService.js       # Smart contract interaction
│   │   ├── PerformanceService.js    # Performance analytics
│   │   └── NotificationService.js   # Alerts & notifications
│   └── ... (existing services)
├── models/
│   ├── Trade.js                     # Trade model
│   ├── Signal.js                    # Signal model
│   ├── Strategy.js                  # Strategy model
│   ├── Performance.js               # Performance metrics
│   └── ... (existing models)
├── middleware/
│   ├── auth.js                      # Authentication (existing)
│   ├── rateLimit.js                 # Rate limiting
│   ├── validation.js                # Input validation
│   ├── errorHandler.js              # Error handling
│   └── ... (existing middleware)
├── config/
│   ├── database.js                  # Database config (existing)
│   ├── blockchain.js                # Blockchain config (BSC)
│   ├── aiConfig.js                  # AI Trading config
│   └── ... (existing config)
├── utils/
│   ├── encryption.js                # Encryption utilities
│   ├── logger.js                    # Logging utilities
│   ├── web3.js                      # Web3 utilities
│   └── ... (existing utils)
└── scripts/
    ├── backup.js                    # Database backup
    ├── migrate.js                   # Database migration
    └── ... (existing scripts)
```

---

## 🔒 Backup & Security - Plan Complet

### **1. Database Backups** 💾

#### **Render PostgreSQL (MVP):**
- ✅ **Automated daily backups** (inclus în Render)
- ✅ **Retention:** 7 days (inclus)
- ✅ **Manual backups** (export SQL cu `pg_dump`)
- ✅ **Point-in-time recovery** (opțional, cu upgrade plan)

**Cost:** $0 (inclus în Render plan)

#### **AWS RDS (Scale):**
- ✅ **Automated snapshots** (daily + retention 35 days)
- ✅ **Point-in-time recovery** (up to 35 days)
- ✅ **Multi-AZ deployment** (high availability)
- ✅ **Cross-region backups** (disaster recovery)

**Cost:** $50-150/lună (RDS) + $10-50/lună (backup storage)

---

### **2. Private Key Management** 🔐

#### **MVP (Render):**
- ✅ **Environment Variables** (secure storage în Render dashboard)
- ✅ **Encryption at rest** (Render database)
- ✅ **HTTPS only** (SSL/TLS for all connections)
- ✅ **No keys in code** - toate keys în environment variables

**Best Practices:**
- ✅ Separate keys per environment (dev, staging, prod)
- ✅ Rotate keys periodic (monthly/quarterly)
- ✅ Limit access (only necessary team members)
- ✅ Audit logs (who accessed keys)

**Cost:** $0 (inclus în Render)

#### **Scale (AWS):**
- ✅ **AWS Secrets Manager** ($0.40/secret/lună)
- ✅ **AWS KMS** (encryption keys management)
- ✅ **IAM Roles** (role-based access control)
- ✅ **CloudTrail** (audit logs)
- ✅ **Hardware Security Module (HSM)** (opțional, enterprise)

**Cost:** $5-50/lună (Secrets Manager + KMS)

---

### **3. Application Backups** 💿

#### **Code:**
- ✅ **Git Repository** (GitHub/GitLab)
- ✅ **Automated backups** (GitLab/GitHub automatic backups)
- ✅ **Tags & Releases** (version control)

#### **Configuration:**
- ✅ **Environment Variables** (backup manual în secure location)
- ✅ **Infrastructure as Code** (Terraform/CloudFormation pentru AWS)
- ✅ **render.yaml** (Render configuration în Git)

**Cost:** $0 (GitHub public), $4-20/lună (GitHub private)

---

### **4. Security Measures** 🛡️

#### **Application Security:**
- ✅ **HTTPS/SSL** (Render inclus, AWS cu Certificate Manager)
- ✅ **CORS** (configured pentru frontend domain)
- ✅ **Rate limiting** (API protection - 100 requests/min per IP)
- ✅ **Authentication** (JWT tokens)
- ✅ **Authorization** (role-based access)
- ✅ **Input validation** (sanitize inputs, prevent SQL injection)
- ✅ **SQL injection protection** (parameterized queries)

#### **Infrastructure Security:**
- ✅ **Firewall** (Render/AWS Security Groups)
- ✅ **DDoS protection** (CloudFlare/AWS Shield)
- ✅ **Monitoring & alerting** (Render/AWS CloudWatch)
- ✅ **Log aggregation** (centralized logging)
- ✅ **Intrusion detection** (AWS GuardDuty - opțional)

**Cost:** $0-50/lună (Render), $50-200/lună (AWS)

---

## 📊 API Endpoints (Schema)

### **AI Trading Endpoints:**

```
POST   /api/ai-trading/start
POST   /api/ai-trading/stop
GET    /api/ai-trading/status
GET    /api/ai-trading/stats

POST   /api/ai-trading/analyze
GET    /api/ai-trading/signals
GET    /api/ai-trading/signals/:id

POST   /api/ai-trading/execute
GET    /api/ai-trading/trades
GET    /api/ai-trading/trades/:id

GET    /api/ai-trading/strategies
POST   /api/ai-trading/strategies
PUT    /api/ai-trading/strategies/:id
DELETE /api/ai-trading/strategies/:id

GET    /api/ai-trading/performance
GET    /api/ai-trading/risk-metrics

GET    /api/ai-trading/market-data/:token
GET    /api/ai-trading/indicators/:token
```

---

## 🔐 Security Implementation

### **1. Authentication & Authorization:**
```javascript
// middleware/auth.js
- JWT token validation
- Role-based access (user, admin, system)
- Session management
- Token refresh mechanism
```

### **2. Rate Limiting:**
```javascript
// middleware/rateLimit.js
- 100 requests/min per IP (public endpoints)
- 1000 requests/min per user (authenticated)
- 10 requests/min per IP (trading execution)
```

### **3. Input Validation:**
```javascript
// middleware/validation.js
- Sanitize inputs (XSS protection)
- Validate data types
- Check required fields
- Validate ranges (amounts, prices, etc.)
```

### **4. Error Handling:**
```javascript
// middleware/errorHandler.js
- Centralized error handling
- No sensitive data în error messages
- Logging errors pentru debugging
- User-friendly error messages
```

---

## 💾 Database Schema

### **Tables:**

```sql
-- Trades Table
CREATE TABLE trades (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  signal_id INTEGER REFERENCES signals(id),
  token_in VARCHAR(50) NOT NULL,
  token_out VARCHAR(50) NOT NULL,
  amount_in DECIMAL(18, 8) NOT NULL,
  amount_out DECIMAL(18, 8),
  entry_price DECIMAL(18, 8) NOT NULL,
  exit_price DECIMAL(18, 8),
  stop_loss DECIMAL(18, 8),
  take_profit DECIMAL(18, 8),
  tx_hash VARCHAR(66),
  status VARCHAR(20) NOT NULL, -- 'pending', 'executed', 'failed', 'closed'
  pnl DECIMAL(18, 8),
  created_at TIMESTAMP DEFAULT NOW(),
  executed_at TIMESTAMP,
  closed_at TIMESTAMP
);

-- Signals Table
CREATE TABLE signals (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  token VARCHAR(50) NOT NULL,
  signal VARCHAR(10) NOT NULL, -- 'buy', 'sell', 'hold'
  confidence DECIMAL(5, 4) NOT NULL, -- 0-1
  reasoning TEXT,
  entry_price DECIMAL(18, 8),
  stop_loss DECIMAL(18, 8),
  take_profit DECIMAL(18, 8),
  priority INTEGER,
  valid BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Strategies Table
CREATE TABLE strategies (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'trend-following', 'mean-reversion', etc.
  config JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Performance Table
CREATE TABLE performance (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  total_profit DECIMAL(18, 8) DEFAULT 0,
  total_loss DECIMAL(18, 8) DEFAULT 0,
  win_rate DECIMAL(5, 4), -- 0-1
  profit_factor DECIMAL(10, 4),
  sharpe_ratio DECIMAL(10, 4),
  max_drawdown DECIMAL(5, 4), -- 0-1
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

**Last Updated:** 2026-01-08  
**Status:** 🟡 Architecture Planning Phase

