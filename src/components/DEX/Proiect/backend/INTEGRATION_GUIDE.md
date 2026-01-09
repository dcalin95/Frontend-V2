# 🔗 Integration Guide - BitSwapDEX AI Trading Backend

**Cum să integrezi AI Trading backend cu existing backend-server**

---

## 📋 Overview

This guide explains how to integrate the AI Trading backend routes și services with the existing `backend-server` (`c:\Users\bits\Desktop\backend-server\`).

---

## 🎯 Step 1: Copy Files to Existing Backend

### **1.1 Copy Routes**
```bash
# Copy AI Trading routes
cp -r src/components/DEX/Proiect/backend/routes/ai-trading c:\Users\bits\Desktop\backend-server\routes\ai-trading
```

### **1.2 Copy Services**
```bash
# Copy AI Trading services
cp -r src/components/DEX/Proiect/backend/services/ai-trading c:\Users\bits\Desktop\backend-server\services\ai-trading
```

### **1.3 Copy Models**
```bash
# Copy models
cp -r src/components/DEX/Proiect/backend/models c:\Users\bits\Desktop\backend-server\models\ai-trading
```

### **1.4 Copy Middleware**
```bash
# Copy middleware
cp src/components/DEX/Proiect/backend/middleware/errorHandler.js c:\Users\bits\Desktop\backend-server\middleware\errorHandler.js
cp src/components/DEX/Proiect/backend/middleware/auth.js c:\Users\bits\Desktop\backend-server\middleware\auth.js
cp src/components/DEX/Proiect/backend/middleware/rateLimit.js c:\Users\bits\Desktop\backend-server\middleware\rateLimit.js
cp src/components/DEX/Proiect/backend/middleware/validation.js c:\Users\bits\Desktop\backend-server\middleware\validation.js
```

### **1.5 Copy Config**
```bash
# Copy config
cp -r src/components/DEX/Proiect/backend/config c:\Users\bits\Desktop\backend-server\config\ai-trading
```

### **1.6 Copy Utils**
```bash
# Copy utils
cp src/components/DEX/Proiect/backend/utils/encryption.js c:\Users\bits\Desktop\backend-server\utils\encryption.js
cp src/components/DEX/Proiect/backend/utils/logger.js c:\Users\bits\Desktop\backend-server\utils\logger.js
cp src/components/DEX/Proiect/backend/utils/web3.js c:\Users\bits\Desktop\backend-server\utils\web3.js
```

---

## 🔧 Step 2: Update server.js

### **2.1 Add Routes în server.js**

Add these lines în `server.js` (după existing routes):

```javascript
// ... existing imports ...

// AI Trading Routes
const aiTradingRoutes = require('./routes/ai-trading/aiTradingRoutes');
const strategiesRoutes = require('./routes/ai-trading/strategiesRoutes');
const signalsRoutes = require('./routes/ai-trading/signalsRoutes');
const executionRoutes = require('./routes/ai-trading/executionRoutes');
const performanceRoutes = require('./routes/ai-trading/performanceRoutes');
const healthRoutes = require('./routes/health');

// ... existing routes ...

// AI Trading API Routes
app.use('/api/ai-trading', aiTradingRoutes);
app.use('/api/ai-trading/strategies', strategiesRoutes);
app.use('/api/ai-trading/signals', signalsRoutes);
app.use('/api/ai-trading', executionRoutes); // Includes /execute and /trades
app.use('/api/ai-trading/performance', performanceRoutes);

// Health Check
app.use('/health', healthRoutes);

// ... rest of server.js ...
```

### **2.2 Add Error Handler**

Add error handler at the end of `server.js` (before `app.listen`):

```javascript
// ... existing code ...

// Error Handler (trebuie să fie ultimul middleware)
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
app.use(notFoundHandler); // 404 handler
app.use(errorHandler); // Global error handler

// ... app.listen ...
```

---

## 📦 Step 3: Install Dependencies

Add to `package.json` în `backend-server`:

```json
{
  "dependencies": {
    "sequelize": "^6.35.0",
    "express-validator": "^7.0.1",
    "jsonwebtoken": "^9.0.2",
    "winston": "^3.11.0",
    "winston-daily-rotate-file": "^4.7.1"
  }
}
```

Then run:
```bash
cd c:\Users\bits\Desktop\backend-server
npm install
```

---

## 🗄️ Step 4: Update Database Configuration

### **4.1 Update database.js**

Modify `c:\Users\bits\Desktop\backend-server\database.js` to include AI Trading models:

```javascript
// ... existing code ...

// Import AI Trading models
const Trade = require('./models/ai-trading/Trade')(sequelize);
const Signal = require('./models/ai-trading/Signal')(sequelize);
const Strategy = require('./models/ai-trading/Strategy')(sequelize);
const Performance = require('./models/ai-trading/Performance')(sequelize);
const Bot = require('./models/ai-trading/Bot')(sequelize);

// Define associations (după existing associations)
Trade.belongsTo(Signal, { foreignKey: 'signalId', as: 'signal' });
Signal.hasMany(Trade, { foreignKey: 'signalId', as: 'trades' });

// Export models (adaugă la existing exports)
module.exports = {
  // ... existing models ...
  Trade,
  Signal,
  Strategy,
  Performance,
  Bot
};
```

### **4.2 Run Migrations**

Run SQL migration pentru AI Trading tables:

```bash
cd c:\Users\bits\Desktop\backend-server
psql $DATABASE_URL -f src/components/DEX/Proiect/backend/migrations/001_create_ai_trading_tables.sql
```

Or manually în PostgreSQL client:
```sql
-- Copy and paste content from 001_create_ai_trading_tables.sql
```

---

## ⚙️ Step 5: Set Environment Variables

Add to Render Dashboard (sau `.env` pentru local):

```bash
# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production-minimum-32-characters
JWT_EXPIRES_IN=24h

# Blockchain Configuration
BSC_RPC_URL=https://bsc-dataseed.binance.org/
WRAPPER_CONTRACT_ADDRESS=0x...  # Set după contract deployment
WALLET_PRIVATE_KEY=0x...  # ⚠️ SECURE! Set în Render Secrets Manager

# AI Trading Configuration
ENABLE_OPENAI=true
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview

# CORS (dacă nu e deja setat)
CORS_ALLOWED_ORIGINS=https://bits-ai.io,https://www.bits-ai.io
```

---

## 🧪 Step 6: Test Integration

### **6.1 Test Health Check**
```bash
curl http://localhost:4000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-08T...",
  "services": {
    "database": "connected",
    "blockchain": "connected"
  }
}
```

### **6.2 Test AI Trading Routes**
```bash
# Get status (trebuie authentication)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:4000/api/ai-trading/status?userId=test
```

---

## ✅ Step 7: Verify Integration

Checklist:
- [ ] Routes added în `server.js`
- [ ] Dependencies installed
- [ ] Database models imported
- [ ] Migrations run successfully
- [ ] Environment variables set
- [ ] Health check works
- [ ] Routes respond (cu authentication)

---

## 🚀 Step 8: Deploy to Render

### **8.1 Update render.yaml**

Add AI Trading environment variables în `render.yaml`:

```yaml
envVars:
  - key: JWT_SECRET
    sync: false  # Set manual în Render dashboard
  - key: WALLET_PRIVATE_KEY
    sync: false  # Set manual în Render dashboard
  - key: WRAPPER_CONTRACT_ADDRESS
    sync: false  # Set după contract deployment
  - key: BSC_RPC_URL
    value: https://bsc-dataseed.binance.org/
  - key: OPENAI_API_KEY
    sync: false  # Set manual
```

### **8.2 Deploy**

```bash
git add .
git commit -m "Add AI Trading backend integration"
git push
```

Render will auto-deploy.

---

## ⚠️ Troubleshooting

### **Error: Cannot find module 'sequelize'**
```bash
npm install sequelize pg
```

### **Error: Database connection failed**
- Check `DATABASE_URL` în environment variables
- Verify database is accessible
- Check SSL settings pentru Render/AWS

### **Error: JWT secret not set**
- Set `JWT_SECRET` în environment variables
- Minimum 32 characters

### **Error: Routes not found (404)**
- Verify routes are added în `server.js`
- Check route paths (should be `/api/ai-trading/*`)
- Verify server restarted după changes

---

## 📚 Next Steps

1. Complete service implementations (remove TODO comments)
2. Add unit tests
3. Add integration tests
4. Deploy contract și set `WRAPPER_CONTRACT_ADDRESS`
5. Configure monitoring și alerts

---

**Last Updated:** 2026-01-08  
**Status:** ✅ Integration Guide Complete

