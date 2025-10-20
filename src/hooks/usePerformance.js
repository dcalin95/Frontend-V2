import { useEffect, useRef, useCallback } from 'react';

export const usePerformance = (componentName, config = {}) => {
  const defaultConfig = {
    enableMonitoring: process.env.NODE_ENV === 'development',
    logToConsole: true,
    sendToAnalytics: false,
    threshold: 16 // 60fps threshold
  };

  const finalConfig = { ...defaultConfig, ...config };
  const mountTimeRef = useRef(0);
  const updateCountRef = useRef(0);
  const lastRenderTimeRef = useRef(0);

  const logPerformance = useCallback((metrics) => {
    if (!finalConfig.enableMonitoring) return;

    if (finalConfig.logToConsole) {
      console.group(`📊 Performance: ${metrics.componentName}`);
      console.log(`Render time: ${metrics.renderTime}ms`);
      console.log(`Mount time: ${metrics.mountTime}ms`);
      console.log(`Update count: ${metrics.updateCount}`);
      if (metrics.memoryUsage) {
        console.log(`Memory usage: ${metrics.memoryUsage}MB`);
      }
      console.groupEnd();
    }

    if (finalConfig.sendToAnalytics && typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'performance', {
        component_name: metrics.componentName,
        render_time: metrics.renderTime,
        mount_time: metrics.mountTime,
        update_count: metrics.updateCount,
        memory_usage: metrics.memoryUsage
      });
    }

    // Warn if performance is poor
    if (metrics.renderTime > finalConfig.threshold) {
      console.warn(
        `⚠️ Performance warning: ${metrics.componentName} took ${metrics.renderTime}ms to render (threshold: ${finalConfig.threshold}ms)`
      );
    }
  }, [finalConfig]);

  // Measure mount time
  useEffect(() => {
    mountTimeRef.current = performance.now();
    updateCountRef.current = 0;

    return () => {
      const mountTime = performance.now() - mountTimeRef.current;
      const memoryUsage = performance.memory?.usedJSHeapSize / 1024 / 1024;

      logPerformance({
        componentName,
        renderTime: 0,
        mountTime,
        updateCount: updateCountRef.current,
        memoryUsage
      });
    };
  }, [componentName, logPerformance]);

  // Measure render time
  useEffect(() => {
    const startTime = performance.now();
    updateCountRef.current++;

    return () => {
      const renderTime = performance.now() - startTime;
      lastRenderTimeRef.current = renderTime;

      logPerformance({
        componentName,
        renderTime,
        mountTime: 0,
        updateCount: updateCountRef.current
      });
    };
  });
};

export default usePerformance; 