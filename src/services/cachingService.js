// 💾 Caching Service for Performance Optimization
class CachingService {
  constructor() {
    this.memoryCache = new Map();
    this.cacheVersion = 'v1.0.0';
    this.maxMemorySize = 50 * 1024 * 1024; // 50MB
    this.currentMemorySize = 0;
    this.isInitialized = false;
  }

  // 🎯 Initialize caching service
  async init() {
    if (this.isInitialized) return;

    await this.setupServiceWorker();
    this.setupMemoryCache();
    this.isInitialized = true;

    console.log('💾 Caching service initialized');
  }

  // 🔧 Setup service worker for caching
  async setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registered:', registration);
      } catch (error) {
        console.warn('⚠️ Service Worker registration failed:', error);
      }
    }
  }

  // 🧠 Setup memory cache
  setupMemoryCache() {
    // Monitor memory usage
    setInterval(() => {
      this.cleanupMemoryCache();
    }, 60000); // Every minute
  }

  // 💾 Cache data in memory
  setMemoryCache(key, data, ttl = 300000) { // 5 minutes default
    const item = {
      data,
      timestamp: Date.now(),
      ttl,
      size: this.calculateSize(data),
    };

    // Check if adding this item would exceed memory limit
    if (this.currentMemorySize + item.size > this.maxMemorySize) {
      this.cleanupMemoryCache();
    }

    this.memoryCache.set(key, item);
    this.currentMemorySize += item.size;
  }

  // 📖 Get data from memory cache
  getMemoryCache(key) {
    const item = this.memoryCache.get(key);
    
    if (!item) return null;

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.memoryCache.delete(key);
      this.currentMemorySize -= item.size;
      return null;
    }

    return item.data;
  }

  // 🧹 Cleanup memory cache
  cleanupMemoryCache() {
    const now = Date.now();
    const entries = Array.from(this.memoryCache.entries());
    
    // Remove expired entries
    entries.forEach(([key, item]) => {
      if (now - item.timestamp > item.ttl) {
        this.memoryCache.delete(key);
        this.currentMemorySize -= item.size;
      }
    });

    // If still over limit, remove oldest entries
    if (this.currentMemorySize > this.maxMemorySize) {
      const sortedEntries = entries
        .filter(([_, item]) => now - item.timestamp <= item.ttl)
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      while (this.currentMemorySize > this.maxMemorySize && sortedEntries.length > 0) {
        const [key, item] = sortedEntries.shift();
        this.memoryCache.delete(key);
        this.currentMemorySize -= item.size;
      }
    }
  }

  // 📊 Calculate data size
  calculateSize(data) {
    if (typeof data === 'string') {
      return new Blob([data]).size;
    } else if (typeof data === 'object') {
      return new Blob([JSON.stringify(data)]).size;
    }
    return 0;
  }

  // 🌐 Cache network request
  async cacheRequest(url, options = {}) {
    const {
      ttl = 300000, // 5 minutes
      strategy = 'cache-first', // cache-first, network-first, stale-while-revalidate
    } = options;

    const cacheKey = `request-${url}`;

    // Check memory cache first
    const cachedData = this.getMemoryCache(cacheKey);
    if (cachedData && strategy === 'cache-first') {
      return cachedData;
    }

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Cache the response
      this.setMemoryCache(cacheKey, data, ttl);

      return data;
    } catch (error) {
      console.error('❌ Request failed:', error);
      
      // Return cached data if available (for stale-while-revalidate)
      if (cachedData && strategy === 'stale-while-revalidate') {
        return cachedData;
      }
      
      throw error;
    }
  }

  // 📊 Get cache statistics
  getCacheStats() {
    const memoryStats = {
      size: this.currentMemorySize,
      maxSize: this.maxMemorySize,
      entries: this.memoryCache.size,
      utilization: (this.currentMemorySize / this.maxMemorySize) * 100,
    };

    return {
      memory: memoryStats,
      version: this.cacheVersion,
      initialized: this.isInitialized,
    };
  }

  // 🧹 Clear all caches
  async clearAllCaches() {
    // Clear memory cache
    this.memoryCache.clear();
    this.currentMemorySize = 0;

    // Clear browser caches
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('🗑️ All caches cleared');
      } catch (error) {
        console.warn('⚠️ Failed to clear browser caches:', error);
      }
    }
  }

  // 🧹 Cleanup
  destroy() {
    this.memoryCache.clear();
    this.currentMemorySize = 0;
    this.isInitialized = false;
  }
}

// 🚀 Export singleton instance
const cachingService = new CachingService();

// 🎯 Auto-initialize in browser
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    cachingService.init();
  });
}

export default cachingService; 