# 🔒 Environment Variables Documentation

**BitSwapDEX AI Trading Backend**

---

## 📋 Overview

This document describes all environment variables required for the BitSwapDEX AI Trading backend.

**⚠️ IMPORTANT:** Never commit `.env` files to Git! Use `.env.example` as a template.

---

## 🔴 CRITIC - Required Variables

### **Server Configuration**
```bash
NODE_ENV=production          # Environment: development, staging, production
PORT=4000                    # Server port
APP_VERSION=1.0.0            # Application version
```

### **Database Configuration**
```bash
# Option 1: Connection String (Recommended pentru Render, AWS RDS)
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Option 2: Individual Parameters
DB_NAME=bitswapdex
DB_USER=bitswapdex_user
DB_PASSWORD=your_secure_password  # ⚠️ SECURE!
DB_HOST=localhost
DB_PORT=5432
DB_SSL=false  # true pentru Render/AWS
```

### **JWT Authentication**
```bash
JWT_SECRET=your-super-secret-jwt-key-change-in-production-minimum-32-characters
JWT_EXPIRES_IN=24h
```

### **Session Configuration**
```bash
SESSION_SECRET=your-super-secret-session-key-change-in-production-minimum-32-characters
COOKIE_DOMAIN=.bitswapdex.com  # Opțional, pentru subdomains
```

### **Blockchain Configuration (BSC)**
```bash
BSC_RPC_URL=https://bsc-dataseed.binance.org/
WRAPPER_CONTRACT_ADDRESS=0x...  # Set după contract deployment
BITS_TOKEN_ADDRESS=0x...        # BITS token address pe BSC
MAX_GAS_PRICE=50
DEFAULT_GAS_LIMIT=300000
```

### **Wallet Configuration**
```bash
WALLET_PRIVATE_KEY=0x...  # ⚠️ VERY SECURE! Set în Render/AWS Secrets Manager
WALLET_ADDRESS=0x...      # Calculat automat din private key
```

---

## 🟡 HIGH - Recommended Variables

### **AI Trading Configuration**
```bash
# OpenAI API (Recommended pentru MVP)
ENABLE_OPENAI=true
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_TEMPERATURE=0.3
OPENAI_MAX_TOKENS=500

# Risk Limits (Default)
MAX_PERCENT_PER_TRADE=5.0
MAX_OPEN_POSITIONS=5
DAILY_LOSS_LIMIT=10.0
MIN_CONFIDENCE=0.65
```

### **CORS Configuration**
```bash
CORS_ALLOWED_ORIGINS=https://bits-ai.io,https://www.bits-ai.io
```

### **Logging Configuration**
```bash
LOG_LEVEL=info  # debug, info, warn, error
ENABLE_FILE_LOGGING=true
LOG_DIR=./logs
```

---

## 🟢 MEDIUM - Optional Variables

### **Email Notifications**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@bitswapdex.com
```

### **SMS Notifications (Twilio)**
```bash
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

### **Telegram Notifications**
```bash
TELEGRAM_BOT_TOKEN=
```

### **Backup Configuration**
```bash
BACKUP_DIR=./backups
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=
BACKUP_S3_REGION=us-east-1
```

### **Monitoring & Error Tracking**
```bash
SENTRY_DSN=  # Opțional, pentru error tracking
UPTIME_ROBOT_API_KEY=  # Opțional, pentru uptime monitoring
```

---

## 📍 Where to Set Variables

### **Render (MVP):**
1. Go to Render Dashboard
2. Select your service
3. Go to "Environment" tab
4. Add environment variables
5. ⚠️ Set `WALLET_PRIVATE_KEY` și `JWT_SECRET` cu `sync: false` în `render.yaml`

### **AWS (Scale):**
1. Use AWS Secrets Manager pentru sensitive keys
2. Use AWS Systems Manager Parameter Store pentru config
3. Use environment variables în ECS Task Definition pentru non-sensitive

---

## 🔐 Security Best Practices

1. ✅ **Never commit `.env` files** - Use `.env.example` as template
2. ✅ **Use strong secrets** - Minimum 32 characters pentru JWT_SECRET, SESSION_SECRET
3. ✅ **Rotate keys periodic** - Monthly pentru dev, quarterly pentru prod
4. ✅ **Use Secrets Manager** - AWS Secrets Manager pentru production
5. ✅ **Limit access** - Only necessary team members
6. ✅ **Audit logs** - Track who accessed sensitive keys

---

## ✅ Validation Checklist

Before deployment, verify:
- [ ] All CRITIC variables are set
- [ ] `JWT_SECRET` și `SESSION_SECRET` are at least 32 characters
- [ ] `WALLET_PRIVATE_KEY` is set în secure location (Render/AWS Secrets Manager)
- [ ] `DATABASE_URL` is correct și accessible
- [ ] `BSC_RPC_URL` is correct
- [ ] `CORS_ALLOWED_ORIGINS` includes frontend domains
- [ ] `NODE_ENV=production` pentru production

---

**Last Updated:** 2026-01-08  
**Status:** ✅ Complete

