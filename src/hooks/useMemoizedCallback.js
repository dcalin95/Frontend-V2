import { useCallback, useRef, useMemo } from 'react';

export const useMemoizedCallback = (callback, deps, config = {}) => {
  const defaultConfig = {
    maxCacheSize: 100,
    enableLogging: process.env.NODE_ENV === 'development',
    cacheTimeout: 5 * 60 * 1000 // 5 minutes
  };

  const finalConfig = { ...defaultConfig, ...config };
  const cacheRef = useRef(new Map());
  const lastArgsRef = useRef('');

  const memoizedCallback = useCallback((...args) => {
    const argsKey = JSON.stringify(args);
    const now = Date.now();

    // Check cache
    const cached = cacheRef.current.get(argsKey);
    if (cached && (now - cached.timestamp) < finalConfig.cacheTimeout) {
      cached.accessCount++;
      lastArgsRef.current = argsKey;
      
      if (finalConfig.enableLogging) {
        console.log(`🎯 Cache hit for ${callback.name || 'anonymous'}:`, {
          args,
          accessCount: cached.accessCount,
          age: now - cached.timestamp
        });
      }
      
      return cached.value;
    }

    // Execute callback
    const result = callback(...args);
    
    // Cache result
    if (cacheRef.current.size >= finalConfig.maxCacheSize) {
      // Remove oldest entry
      const oldestKey = cacheRef.current.keys().next().value;
      cacheRef.current.delete(oldestKey);
    }

    cacheRef.current.set(argsKey, {
      value: result,
      timestamp: now,
      accessCount: 1
    });

    lastArgsRef.current = argsKey;

    if (finalConfig.enableLogging) {
      console.log(`🔄 Cache miss for ${callback.name || 'anonymous'}:`, {
        args,
        result,
        cacheSize: cacheRef.current.size
      });
    }

    return result;
  }, [callback, finalConfig]);

  // Cleanup old cache entries
  const cleanupCache = useCallback(() => {
    const now = Date.now();
    for (const [key, entry] of cacheRef.current.entries()) {
      if ((now - entry.timestamp) > finalConfig.cacheTimeout) {
        cacheRef.current.delete(key);
      }
    }
  }, [finalConfig.cacheTimeout]);

  // Auto-cleanup every minute
  useMemo(() => {
    const interval = setInterval(cleanupCache, 60000);
    return () => clearInterval(interval);
  }, [cleanupCache]);

  return memoizedCallback;
};

export default useMemoizedCallback; 