# 🔧 Services Adaptation Guide - pg Pool Integration

**Data:** 2026-01-09  
**Purpose:** Guide pentru adaptarea serviciilor AI Trading să folosească `pg` Pool în loc de Sequelize

---

## 📋 Overview

Backend-server folosește `pg` Pool direct, nu Sequelize. Serviciile AI Trading trebuie adaptate să folosească `pg` Pool când sunt copiate în `backend-server/`.

**Soluție:** Am creat `dbAdapter.js` care oferă o interfață Sequelize-like pentru `pg` Pool.

---

## 🔄 Strategy

### **Opțiunea 1: Use dbAdapter (Recomandat)** ✅

Când copiezi serviciile în `backend-server/`, adaptează imports:

**Înainte (Sequelize):**
```javascript
const db = require('../../config/database');
// db.Trade.create(), db.Signal.findAll(), etc.
```

**După (pg Pool cu adapter):**
```javascript
const db = require('../database'); // pg Pool
const { createDbAdapter } = require('../utils/dbAdapter');
const dbAdapter = createDbAdapter(db);

// Merge adapter models cu existing db
db.Bot = dbAdapter.Bot;
db.Signal = dbAdapter.Signal;
db.Trade = dbAdapter.Trade;
db.Strategy = dbAdapter.Strategy;
```

---

## 📝 Services to Adapt

### **1. AITradingService.js**
- ✅ Folosește `db.Bot.create()`, `db.Bot.findOne()`, `db.Bot.update()`
- ✅ Folosește `db.Signal.create()`
- ✅ Folosește `db.Trade.findAll()`, `db.Trade.count()`
- **Adaptation:** Replace `require('../../config/database')` cu `require('../database')` + adapter

### **2. PerformanceService.js**
- ✅ Folosește `db.Trade.findAll()` cu `Op.between`
- ✅ Folosește `db.Performance` (nu e implementat în adapter încă)
- **Adaptation:** Folosește `db.query()` direct pentru complex queries, sau extinde adapter

### **3. MarketDataService.js**
- ✅ Nu necesită database (API calls only)
- **Adaptation:** Niciuna

### **4. ContractService.js**
- ✅ Nu necesită database (contract interactions only)
- **Adaptation:** Niciuna

---

## 🔧 dbAdapter Features

Adapter-ul oferă următoarele metode pentru fiecare model:

### **Signal Model:**
- `create(data)` - Create signal
- `findAll(options)` - Find all signals cu where, limit, offset, order
- `findOne(options)` - Find one signal
- `count(options)` - Count signals

### **Trade Model:**
- `create(data)` - Create trade
- `findAll(options)` - Find all trades
- `findAndCountAll(options)` - Find all cu pagination metadata
- `findOne(options)` - Find one trade
- `count(options)` - Count trades

### **Strategy Model:**
- `create(data)` - Create strategy
- `findAll(options)` - Find all strategies
- `findOne(options)` - Find one strategy
- `update(data, options)` - Update strategy
- `destroy(options)` - Delete strategy

### **Bot Model:**
- `create(data)` - Create bot
- `findOne(options)` - Find one bot
- `update(data, options)` - Update bot

---

## 📊 Column Mapping

Adapter-ul mapează automat între:
- **Database (snake_case):** `user_id`, `created_at`, `entry_price`
- **Service (camelCase):** `userId`, `createdAt`, `entryPrice`

---

## ⚠️ Limitations

### **1. Op Operators (Sequelize)**
Adapter-ul nu suportă `Op.between`, `Op.gte`, etc. direct.

**Soluție:** Pentru queries complexe, folosește `db.query()` direct:

```javascript
// În loc de:
const trades = await db.Trade.findAll({
  where: {
    createdAt: { [Op.between]: [startDate, endDate] }
  }
});

// Folosește:
const result = await db.query(`
  SELECT * FROM trades
  WHERE created_at BETWEEN $1 AND $2
`, [startDate, endDate]);
const trades = result.rows.map(mapRowToCamelCase);
```

### **2. Performance Model**
Nu e implementat în adapter încă. Poate fi adăugat dacă e necesar.

### **3. Associations (Joins)**
Adapter-ul nu suportă Sequelize associations (`include`). Folosește SQL JOIN direct:

```javascript
const result = await db.query(`
  SELECT t.*, s.signal, s.confidence
  FROM trades t
  LEFT JOIN signals s ON t.signal_id = s.id
  WHERE t.user_id = $1
`, [userId]);
```

---

## 🚀 Quick Start pentru Adaptation

### **Step 1: Copy dbAdapter.js**
```bash
cp src/components/DEX/Proiect/backend/utils/dbAdapter.js backend-server/utils/dbAdapter.js
```

### **Step 2: Adapt Service Import**
```javascript
// În AITradingService.js (în backend-server/)
const db = require('../database');
const { createDbAdapter } = require('../utils/dbAdapter');
const dbAdapter = createDbAdapter(db);

// Merge adapter
db.Bot = dbAdapter.Bot;
db.Signal = dbAdapter.Signal;
db.Trade = dbAdapter.Trade;
db.Strategy = dbAdapter.Strategy;
```

### **Step 3: Test**
```javascript
// Test create
const signal = await db.Signal.create({
  userId: 'test',
  token: 'BTC',
  signal: 'buy',
  confidence: 0.8
});

// Test find
const signals = await db.Signal.findAll({
  where: { userId: 'test' }
});
```

---

## 📚 Examples

### **Example 1: Simple Query**
```javascript
// Works with adapter
const strategies = await db.Strategy.findAll({
  where: { userId: 'user123', enabled: true }
});
```

### **Example 2: Complex Query (folosește db.query direct)**
```javascript
// Pentru queries complexe, folosește db.query direct
const result = await db.query(`
  SELECT 
    s.*,
    COUNT(t.id) as trade_count,
    SUM(t.pnl) as total_pnl
  FROM strategies s
  LEFT JOIN trades t ON s.id = t.strategy_id
  WHERE s.user_id = $1
  GROUP BY s.id
`, [userId]);
```

---

## ✅ Checklist pentru Adaptation

Când adaptezi un service:
- [ ] Replace `require('../../config/database')` cu `require('../database')`
- [ ] Add `createDbAdapter` și merge models
- [ ] Replace `Op.between`, `Op.gte`, etc. cu direct SQL queries
- [ ] Replace `attributes` option cu direct SQL SELECT columns
- [ ] Test all database operations
- [ ] Verify column mapping (snake_case ↔ camelCase)

---

## 🎯 Next Steps

1. **Copy dbAdapter.js** în `backend-server/utils/`
2. **Adapt AITradingService.js** când e copiat în backend-server
3. **Adapt PerformanceService.js** pentru complex queries
4. **Test** toate database operations
5. **Extend adapter** dacă e nevoie de mai multe metode

---

**Last Updated:** 2026-01-09  
**Status:** ✅ Adapter Created - Ready for Services Adaptation

