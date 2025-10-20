# 🔧 BACKEND RATE LIMIT OPTIMIZATIONS FOR RENDER

## CURRENT ISSUE: Error 429 - Too Many Requests

Your frontend is making too many API calls to the Render-hosted backend, causing rate limiting.

## 🎯 BACKEND OPTIMIZATIONS NEEDED:

### 1. IMPLEMENT API RATE LIMITING (Server-side)
```javascript
// backend/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// Different limits for different endpoints
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message },
  standardHeaders: true,
  legacyHeaders: false,
});

// Presale data - less frequent updates needed
const presaleLimit = createRateLimit(
  60 * 1000, // 1 minute
  30, // 30 requests per minute per IP
  'Too many presale requests'
);

// Telegram rewards - cache server-side
const telegramLimit = createRateLimit(
  60 * 1000, // 1 minute  
  20, // 20 requests per minute per IP
  'Too many telegram reward requests'
);

// Apply to routes
app.use('/api/presale', presaleLimit);
app.use('/api/telegram-rewards', telegramLimit);
```

### 2. SERVER-SIDE CACHING
```javascript
// backend/middleware/cache.js
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60 }); // 1 minute default

const cacheMiddleware = (ttl = 60) => {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cached = cache.get(key);
    
    if (cached) {
      console.log(`📦 CACHE HIT: ${key}`);
      return res.json(cached);
    }
    
    // Store response in cache
    const originalSend = res.json;
    res.json = function(data) {
      cache.set(key, data, ttl);
      console.log(`💾 CACHED: ${key} for ${ttl}s`);
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Apply caching
app.get('/api/presale/current', cacheMiddleware(30), getPresaleData);
app.get('/api/telegram-rewards/status/:wallet', cacheMiddleware(120), getTelegramStatus);
```

### 3. DATABASE CONNECTION POOLING
```javascript
// backend/config/database.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Optimize connection pooling for Render
  max: 10, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // return an error after 2 seconds if connection could not be established
  maxUses: 7500, // close (and replace) a connection after it has been used 7500 times
});

// Proper cleanup
process.on('SIGINT', () => {
  pool.end().then(() => console.log('Pool has ended'));
});
```

### 4. RESPONSE COMPRESSION
```javascript
// backend/app.js
const compression = require('compression');

app.use(compression({
  level: 6,
  threshold: 100 * 1000, // Only compress responses > 100KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));
```

## 🚀 RENDER-SPECIFIC OPTIMIZATIONS:

### 1. Environment Variables:
```env
# .env
NODE_ENV=production
DATABASE_URL=your_postgres_url
WEB_CONCURRENCY=1
MEMORY_LIMIT=512MB
PORT=10000

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
CACHE_TTL_SECONDS=60
```

### 2. Health Check Endpoint:
```javascript
// Prevent cold starts
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

### 3. Keep-Alive Service:
```javascript
// Keep Render service warm
if (process.env.NODE_ENV === 'production') {
  setInterval(async () => {
    try {
      const response = await fetch(`${process.env.RENDER_EXTERNAL_URL}/health`);
      console.log('⏰ Keep-alive ping:', response.status);
    } catch (error) {
      console.error('❌ Keep-alive failed:', error.message);
    }
  }, 14 * 60 * 1000); // Every 14 minutes
}
```

## 📊 MONITORING & DEBUGGING:

### Request Logging:
```javascript
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});
```

### Error Handling:
```javascript
app.use((error, req, res, next) => {
  console.error('❌ API Error:', error);
  
  if (error.code === 'ECONNRESET') {
    return res.status(503).json({ error: 'Service temporarily unavailable' });
  }
  
  if (error.code === 'ETIMEOUT') {
    return res.status(504).json({ error: 'Request timeout' });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});
```

## 🎯 IMPLEMENTATION PRIORITY:

1. ✅ **Frontend optimizations** (DONE) - Reduce request frequency
2. 🔧 **Backend rate limiting** - Prevent abuse
3. 📦 **Server-side caching** - Reduce database load  
4. 🔗 **Connection pooling** - Optimize PostgreSQL usage
5. 📊 **Monitoring** - Track request patterns

## 💰 COST ANALYSIS:

```
Current: Starter ($7/month) + Rate limit issues
Option 1: Keep Starter + Backend optimizations = $7/month ✅
Option 2: Upgrade to Standard ($25/month) = No rate limits
Option 3: Move to VPS (DigitalOcean $10/month) = More control

Recommendation: Try backend optimizations first, then upgrade if needed.
```







