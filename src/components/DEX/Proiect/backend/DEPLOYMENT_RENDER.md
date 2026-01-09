# 🚀 Deployment Guide - Render

## 🎯 Recomandarea Mea: Render pentru MVP

**De ce Render:**
1. ✅ **Deja folosești Render** - Ai experiență cu `backend-server-f82y.onrender.com`
2. ✅ **Simplu și rapid** - Deployment automat din Git (minute, nu ore)
3. ✅ **Cost mic** - $7-25/lună (perfect pentru MVP)
4. ✅ **PostgreSQL inclus** - Database gratis cu plan
5. ✅ **SSL/HTTPS gratis** - Inclus în plan
6. ✅ **Auto-scaling** - Render scalează automat
7. ✅ **Monitoring inclus** - Logs și metrics built-in

---

## 📋 Setup Render pentru AI Trading Backend

### **Step 1: Update render.yaml**

```yaml
# render.yaml (în backend-server/)
services:
  - type: web
    name: bitswapdex-backend
    runtime: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: DATABASE_URL
        fromDatabase:
          name: bitswapdex-db
          property: connectionString
      - key: WALLET_PRIVATE_KEY
        sync: false # Set manual în Render dashboard
      - key: WRAPPER_CONTRACT_ADDRESS
        sync: false # Set manual după deployment
      - key: BSC_RPC_URL
        value: https://bsc-dataseed.binance.org/
      - key: JWT_SECRET
        generateValue: true
      - key: ADMIN_PASSWORD
        sync: false # Set manual
    healthCheckPath: /health
    regions:
      - oregon

databases:
  - name: bitswapdex-db
    databaseName: bitswapdex
    user: bitswapdex
    plan: starter # $0 pentru 90 days, apoi $7/lună
    region: oregon
```

---

### **Step 2: Environment Variables (Render Dashboard)**

**Set manual în Render dashboard:**
```
WALLET_PRIVATE_KEY=0x... (encrypted în Render)
WRAPPER_CONTRACT_ADDRESS=0x... (după deployment contract)
ADMIN_PASSWORD=... (strong password)
OPENAI_API_KEY=... (dacă folosești OpenAI)
ANTHROPIC_API_KEY=... (dacă folosești Claude)
```

---

### **Step 3: Update server.js**

```javascript
// server.js (în backend-server/)
const express = require('express');
const app = express();

// ... existing code ...

// TODO: Add AI Trading routes
const aiTradingRoutes = require('./routes/ai-trading/aiTradingRoutes');
app.use('/api/ai-trading', aiTradingRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// ... existing code ...
```

---

### **Step 4: Database Migrations**

```sql
-- Create tables pentru AI Trading
CREATE TABLE trades (...);
CREATE TABLE signals (...);
CREATE TABLE strategies (...);
CREATE TABLE performance (...);
```

**Run migrations:**
```bash
npm run migrate
```

---

## 💰 Cost Estimation (Render)

### **MVP (Month 1-6):**
- **Web Service:** $7/lună (Starter plan)
- **PostgreSQL:** $0 (90 days free), apoi $7/lună
- **SSL/HTTPS:** $0 (inclus)
- **Monitoring:** $0 (inclus)
- **Total:** $7-14/lună (primul an), $14/lună (după 90 days)

### **Scale (Month 7-12):**
- **Web Service:** $25/lună (Standard plan)
- **PostgreSQL:** $20/lună (Standard plan)
- **SSL/HTTPS:** $0 (inclus)
- **Monitoring:** $0 (inclus)
- **Total:** $45/lună

---

## 🔒 Security Setup (Render)

### **1. Environment Variables:**
- ✅ Set în Render dashboard (encrypted)
- ✅ Separate per environment (dev, staging, prod)
- ✅ No keys în code
- ✅ Rotate periodic

### **2. Database:**
- ✅ PostgreSQL cu SSL
- ✅ Automated backups (7 days retention)
- ✅ Access control (whitelist IPs)

### **3. Application:**
- ✅ HTTPS only
- ✅ CORS configured
- ✅ Rate limiting
- ✅ Authentication required

---

## 📊 Monitoring (Render)

### **Built-in Features:**
- ✅ **Logs** - Real-time logs în Render dashboard
- ✅ **Metrics** - CPU, Memory, Request rate
- ✅ **Alerts** - Email alerts pentru errors
- ✅ **Deployments** - Deploy history

### **Custom Monitoring:**
- ✅ **Health check endpoint** (`/health`)
- ✅ **Error tracking** (Sentry, opțional)
- ✅ **Uptime monitoring** (UptimeRobot, opțional)

---

## 🚀 Deployment Steps

### **1. Update Code:**
```bash
cd backend-server/
# Add AI Trading routes și services
git add .
git commit -m "Add AI Trading backend"
git push
```

### **2. Render Auto-Deploy:**
- Render detectează changes automat
- Build și deploy automat
- Health check automat
- Rollback automat dacă fail

### **3. Verify:**
```bash
# Check health
curl https://backend-server-f82y.onrender.com/health

# Test AI Trading endpoint
curl https://backend-server-f82y.onrender.com/api/ai-trading/status?userId=test
```

---

## ⚠️ Migration la AWS (După Scale)

### **Când migrezi:**
- Revenue > $100K/lună
- Volum > $10M/zi
- Necesită features avansate (Lambda, SQS, etc.)
- Echipa pentru management

### **Plan Migrare:**
1. **Setup AWS Infrastructure** (EC2, RDS, Secrets Manager)
2. **Migrate Database** (Dump din Render, Restore în AWS)
3. **Deploy Application** (ECS sau EC2)
4. **Update DNS** (Route traffic la AWS)
5. **Monitor** (Verify functionality)
6. **Shutdown Render** (după verificare)

**Timeline:** 1-2 săptămâni  
**Cost:** $115-450/lună (AWS) vs $45/lună (Render)

---

**Last Updated:** 2026-01-08  
**Status:** 🟡 Ready for Deployment

