// frontend/src/utils/requestCache.js
// 🔧 LOCAL CACHE SYSTEM to reduce backend requests and prevent rate limiting

class RequestCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 60000; // 1 minute default cache
  }

  // Generate cache key from URL and params
  generateKey(url, params = {}) {
    const paramStr = Object.keys(params).length > 0 
      ? '?' + new URLSearchParams(params).toString() 
      : '';
    return `${url}${paramStr}`;
  }

  // Get cached data if still valid
  get(url, params = {}) {
    const key = this.generateKey(url, params);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    const { data, timestamp, ttl } = cached;
    const now = Date.now();
    
    if (now - timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }
    
    console.log(`📦 CACHE HIT: ${key} (${Math.round((ttl - (now - timestamp)) / 1000)}s remaining)`);
    return data;
  }

  // Store data in cache
  set(url, data, params = {}, ttl = this.defaultTTL) {
    const key = this.generateKey(url, params);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    console.log(`💾 CACHED: ${key} for ${Math.round(ttl / 1000)}s`);
  }

  // Clear specific cache entry
  delete(url, params = {}) {
    const key = this.generateKey(url, params);
    this.cache.delete(key);
    console.log(`🗑️ CACHE CLEARED: ${key}`);
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    console.log('🗑️ ALL CACHE CLEARED');
  }

  // Get cache statistics
  getStats() {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();
    
    return {
      totalEntries: entries.length,
      validEntries: entries.filter(([, { timestamp, ttl }]) => 
        now - timestamp <= ttl
      ).length,
      expiredEntries: entries.filter(([, { timestamp, ttl }]) => 
        now - timestamp > ttl
      ).length,
      cacheSize: this.cache.size
    };
  }

  // Cleanup expired entries
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, { timestamp, ttl }] of this.cache.entries()) {
      if (now - timestamp > ttl) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.cache.delete(key));
    console.log(`🧹 CACHE CLEANUP: Removed ${expiredKeys.length} expired entries`);
    
    return expiredKeys.length;
  }
}

// 🔧 CACHED FETCH WRAPPER
class CachedFetch {
  constructor() {
    this.cache = new RequestCache();
    
    // Auto-cleanup every 5 minutes
    setInterval(() => {
      this.cache.cleanup();
    }, 5 * 60 * 1000);
  }

  // Cached GET request
  async get(url, options = {}) {
    const { 
      cacheTTL = 60000, // 1 minute default
      forceRefresh = false,
      ...fetchOptions 
    } = options;

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = this.cache.get(url);
      if (cached) return cached;
    }

    try {
      console.log(`🌐 FETCHING: ${url}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers
        },
        ...fetchOptions
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache successful response
      this.cache.set(url, data, {}, cacheTTL);
      
      return data;
    } catch (error) {
      console.error(`❌ FETCH ERROR: ${url}`, error);
      
      // Try to return stale cache data if available
      const staleData = this.cache.get(url);
      if (staleData) {
        console.warn(`⚠️ USING STALE CACHE: ${url}`);
        return staleData;
      }
      
      throw error;
    }
  }

  // Cached POST request (no caching for mutations)
  async post(url, data, options = {}) {
    console.log(`🌐 POSTING: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data),
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Clear related cache entries after mutations
    if (url.includes('/api/')) {
      this.invalidateRelatedCache(url);
    }
    
    return result;
  }

  // Invalidate cache entries related to a URL
  invalidateRelatedCache(url) {
    const urlParts = url.split('/');
    const baseUrl = urlParts.slice(0, -1).join('/');
    
    for (const [key] of this.cache.cache.entries()) {
      if (key.startsWith(baseUrl)) {
        this.cache.delete(key);
      }
    }
  }

  // Manual cache control
  clearCache() {
    this.cache.clear();
  }

  getCacheStats() {
    return this.cache.getStats();
  }
}

// Create singleton instance
const cachedFetch = new CachedFetch();

export default cachedFetch;
export { RequestCache, CachedFetch };

// 🔧 RATE LIMITING PREVENTION UTILITIES

export const rateLimitConfig = {
  // Different cache TTLs for different data types
  presaleData: 10000,      // 10 seconds (changes frequently during presale)
  telegramRewards: 30000,  // 30 seconds (more responsive for user activity)
  referralData: 90000,     // 1.5 minutes
  priceData: 15000,        // 15 seconds (crypto prices)
  userBalance: 60000,      // 1 minute
  
  // Request intervals (minimum time between requests)
  minIntervals: {
    presale: 5000,      // 5s minimum between presale updates
    payment: 10000,     // 10s minimum between payment polls
    analytics: 20000,   // 20s minimum between analytics updates
    rewards: 10000      // 10s minimum between reward fetches
  }
};

// Request frequency limiter
export class RequestLimiter {
  constructor() {
    this.lastRequests = new Map();
  }

  canMakeRequest(endpoint, minInterval) {
    const now = Date.now();
    const lastRequest = this.lastRequests.get(endpoint);
    
    if (!lastRequest || now - lastRequest >= minInterval) {
      this.lastRequests.set(endpoint, now);
      return true;
    }
    
    const remaining = Math.ceil((minInterval - (now - lastRequest)) / 1000);
    console.warn(`⏳ RATE LIMIT: Wait ${remaining}s before ${endpoint}`);
    return false;
  }
}

export const requestLimiter = new RequestLimiter();


