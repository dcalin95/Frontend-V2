// 🚀 Performance Monitoring Service
class PerformanceService {
  constructor() {
    this.metrics = {
      fcp: null,
      lcp: null,
      fid: null,
      cls: null,
      ttfb: null,
      bundleSize: null,
      memoryUsage: null,
    };
    this.observers = [];
    this.isInitialized = false;
  }

  // 🎯 Initialize performance monitoring
  init() {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.setupCoreWebVitals();
    this.setupBundleSizeMonitoring();
    this.setupMemoryMonitoring();
    this.setupPerformanceObserver();
    this.isInitialized = true;

    console.log('🚀 Performance monitoring initialized');
  }

  // 📊 Setup Core Web Vitals monitoring
  setupCoreWebVitals() {
    if ('PerformanceObserver' in window) {
      // First Contentful Paint
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.metrics.fcp = entry.startTime;
            this.trackMetric('fcp', entry.startTime);
          });
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
      } catch (e) {
        console.warn('FCP observer failed:', e);
      }

      // Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.lcp = lastEntry.startTime;
          this.trackMetric('lcp', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP observer failed:', e);
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.metrics.fid = entry.processingStart - entry.startTime;
            this.trackMetric('fid', this.metrics.fid);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.warn('FID observer failed:', e);
      }

      // Cumulative Layout Shift
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.metrics.cls = clsValue;
          this.trackMetric('cls', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('CLS observer failed:', e);
      }
    }
  }

  // 📦 Monitor bundle sizes
  setupBundleSizeMonitoring() {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
        this.trackMetric('ttfb', this.metrics.ttfb);
      }
    }
  }

  // 💾 Monitor memory usage
  setupMemoryMonitoring() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        this.metrics.memoryUsage = {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
        };
        this.trackMetric('memory', this.metrics.memoryUsage);
      }, 30000); // Check every 30 seconds
    }
  }

  // 👀 Setup performance observer for custom metrics
  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'measure') {
            this.trackMetric('custom', {
              name: entry.name,
              duration: entry.duration,
            });
          }
        });
      });
      observer.observe({ entryTypes: ['measure'] });
    }
  }

  // 📈 Track performance metric
  trackMetric(type, value) {
    const metric = {
      type,
      value,
      timestamp: Date.now(),
      url: window.location.href,
    };

    // Store locally
    this.metrics[type] = value;

    // Send to analytics if available
    if (typeof window !== 'undefined' && window.trackGoogleAnalytics) {
      window.trackGoogleAnalytics.trackPerformance(type, value);
    }

    // Notify observers
    this.observers.forEach(callback => callback(metric));
  }

  // 🎯 Start performance measurement
  startMeasure(name) {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-start`);
    }
  }

  // 🎯 End performance measurement
  endMeasure(name) {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    }
  }

  // 📊 Get current metrics
  getMetrics() {
    return { ...this.metrics };
  }

  // 📈 Get performance score
  getPerformanceScore() {
    const scores = {
      fcp: this.getScoreForMetric('fcp', 1800, 3000),
      lcp: this.getScoreForMetric('lcp', 2500, 4000),
      fid: this.getScoreForMetric('fid', 100, 300),
      cls: this.getScoreForMetric('cls', 0.1, 0.25),
    };

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    return Math.round(totalScore / Object.keys(scores).length);
  }

  // 🎯 Calculate score for a metric
  getScoreForMetric(metric, good, poor) {
    const value = this.metrics[metric];
    if (!value) return 0;

    if (value <= good) return 100;
    if (value >= poor) return 0;
    return Math.round(100 - ((value - good) / (poor - good)) * 100);
  }

  // 📋 Get optimization recommendations
  getOptimizationRecommendations() {
    const recommendations = [];

    if (this.metrics.fcp > 1800) {
      recommendations.push({
        type: 'critical',
        metric: 'FCP',
        message: 'First Contentful Paint is slow. Consider optimizing critical rendering path.',
        suggestions: [
          'Minimize critical CSS',
          'Optimize images',
          'Use CDN for static assets',
          'Implement resource hints (preload, prefetch)',
        ],
      });
    }

    if (this.metrics.lcp > 2500) {
      recommendations.push({
        type: 'critical',
        metric: 'LCP',
        message: 'Largest Contentful Paint is slow. Optimize main content loading.',
        suggestions: [
          'Optimize hero images',
          'Use next-gen image formats (WebP, AVIF)',
          'Implement lazy loading',
          'Optimize font loading',
        ],
      });
    }

    if (this.metrics.fid > 100) {
      recommendations.push({
        type: 'important',
        metric: 'FID',
        message: 'First Input Delay is high. Reduce JavaScript execution time.',
        suggestions: [
          'Split JavaScript bundles',
          'Optimize event handlers',
          'Use web workers for heavy computations',
          'Implement code splitting',
        ],
      });
    }

    if (this.metrics.cls > 0.1) {
      recommendations.push({
        type: 'important',
        metric: 'CLS',
        message: 'Cumulative Layout Shift is high. Prevent layout shifts.',
        suggestions: [
          'Set explicit dimensions for images',
          'Reserve space for dynamic content',
          'Avoid inserting content above existing content',
          'Use transform instead of changing layout properties',
        ],
      });
    }

    return recommendations;
  }

  // 📊 Subscribe to performance updates
  subscribe(callback) {
    this.observers.push(callback);
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  // 🧹 Cleanup
  destroy() {
    this.observers = [];
    this.isInitialized = false;
  }
}

// 🚀 Export singleton instance
const performanceService = new PerformanceService();

// 🎯 Auto-initialize in browser
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    performanceService.init();
  });
}

export default performanceService; 