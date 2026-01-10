/**
 * 📊 TikTok Pixel Integration - Production Hardened
 * 
 * SSR-safe TikTok Pixel initialization with retry logic and event queue
 * Focus: Engagement intent tracking for TikTok Ads optimization
 * 
 * CRITICAL: This code trains TikTok's delivery algorithm. Signal quality is paramount.
 */

// 🛑 Global state for pixel initialization
let pixelInitialized = false;
let initPromise = null;
let eventQueue = []; // Queue events until pixel is ready

/**
 * Check if marketing consent is granted
 * Hook for GDPR/consent integration - can be replaced with CMP integration
 * @returns {boolean}
 */
export function hasMarketingConsent() {
  if (typeof window === 'undefined') return false;
  
  try {
    const consent = localStorage.getItem('marketing_consent');
    if (consent === 'false') return false;
    // Default: true (can be connected to cookie banner later)
    return true;
  } catch (e) {
    return true; // Default allow if localStorage fails
  }
}

/**
 * Set marketing consent
 * @param {boolean} granted
 */
export function setMarketingConsent(granted) {
  if (typeof window === 'undefined') return;
  try {
    if (granted) {
      localStorage.setItem('marketing_consent', 'true');
      // Initialize pixel if not already done
      if (!pixelInitialized) {
        initTikTokPixel();
      }
    } else {
      localStorage.setItem('marketing_consent', 'false');
    }
  } catch (e) {
    console.warn('[TikTok] Failed to set consent:', e);
  }
}

/**
 * Safe getter for window.ttq
 * @returns {object|null}
 */
export function safeGetTTQ() {
  if (typeof window === 'undefined') return null;
  return window.ttq || null;
}

/**
 * Check if pixel is ready (ttq.track function exists)
 * CRITICAL: We only mark as ready when ttq.track is confirmed available
 * @returns {boolean}
 */
function isPixelReady() {
  if (typeof window === 'undefined') return false;
  return !!(window.ttq && typeof window.ttq.track === 'function');
}

/**
 * Flush queued events to TikTok Pixel
 * Called after pixel initialization succeeds
 */
function flushEventQueue() {
  if (!isPixelReady()) return;
  
  const ttq = window.ttq;
  let flushed = 0;
  
  while (eventQueue.length > 0) {
    const [method, eventName, payload] = eventQueue.shift();
    try {
      if (method === 'page') {
        if (ttq.page) {
          ttq.page(payload);
        } else if (typeof ttq.track === 'function') {
          // Fallback: use PageView standard event
          ttq.track('PageView', payload);
        }
      } else if (method === 'track') {
        if (typeof ttq.track === 'function') {
          ttq.track(eventName, payload);
        }
      }
      flushed++;
    } catch (err) {
      console.error(`[TikTok] Queue flush error for ${eventName}:`, err);
    }
  }
  
  if (flushed > 0) {
    console.log(`[TikTok] Flushed ${flushed} queued events`);
  }
}

/**
 * Initialize TikTok Pixel with retry logic and exponential backoff
 * 
 * CRITICAL REQUIREMENTS:
 * - Never permanently mark as initialized unless ttq.track is confirmed ready
 * - Retry with exponential backoff: 1s, 2s, 4s, 8s, max 30s total
 * - Queue events until pixel is ready, then flush
 * - Never permanently block initialization after timeout
 * 
 * @returns {Promise<boolean>} true if pixel ready, false if failed after retries
 */
export function initTikTokPixel() {
  // Already initialized and confirmed ready
  if (pixelInitialized && isPixelReady()) {
    return Promise.resolve(true);
  }

  // Return existing promise if init is in progress
  if (initPromise) {
    return initPromise;
  }

  // Check consent - REQUIRED: do not initialize without consent
  if (!hasMarketingConsent()) {
    console.log('[TikTok] Pixel init skipped - no marketing consent');
    return Promise.resolve(false);
  }

  // SSR check
  if (typeof window === 'undefined') {
    return Promise.resolve(false);
  }

  // Get pixel ID from env
  const pixelId = process.env.REACT_APP_TIKTOK_PIXEL_ID || 'D3RH23RC77U1STIOO1T0';
  
  if (!pixelId) {
    console.warn('[TikTok] No pixel ID found in env vars');
    return Promise.resolve(false);
  }

  // Retry configuration: exponential backoff
  const MAX_RETRIES = 5;
  const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000]; // 1s, 2s, 4s, 8s, 16s (total max ~30s)
  let retryAttempt = 0;

  initPromise = new Promise((resolve) => {
    // Check if already loaded (edge case: script loaded externally)
    if (isPixelReady()) {
      pixelInitialized = true;
      flushEventQueue();
      resolve(true);
      return;
    }

    // Initialize TikTok Pixel script
    try {
      (function (w, d, t) {
        w.TiktokAnalyticsObject = t;
        var ttq = w[t] = w[t] || [];
        ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"];
        ttq.setAndDefer = function(t, e) {
          t[e] = function() {
            t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
          };
        };
        for (var i = 0; i < ttq.methods.length; i++) {
          ttq.setAndDefer(ttq, ttq.methods[i]);
        }
        ttq.instance = function(t) {
          for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) {
            ttq.setAndDefer(e, ttq.methods[n]);
          }
          return e;
        };
        ttq.load = function(e, n) {
          var r = "https://analytics.tiktok.com/i18n/pixel/events.js";
          var o = n && n.partner;
          ttq._i = ttq._i || {};
          ttq._i[e] = [];
          ttq._i[e]._u = r;
          ttq._t = ttq._t || {};
          ttq._t[e] = +new Date();
          ttq._o = ttq._o || {};
          ttq._o[e] = n || {};
          n = d.createElement("script");
          n.type = "text/javascript";
          n.async = !0;
          n.src = r + "?sdkid=" + e + "&lib=" + t;
          e = d.getElementsByTagName("script")[0];
          e.parentNode.insertBefore(n, e);
        };
        ttq.load(pixelId);
        // CRITICAL: Do NOT call ttq.page() here - page views are handled by trackPageView()
      })(window, document, 'ttq');
    } catch (err) {
      console.error('[TikTok] Pixel script injection error:', err);
      initPromise = null;
      resolve(false);
      return;
    }

    // Retry logic with exponential backoff
    const attemptInit = () => {
      // Try ready callback first (most reliable)
      if (window.ttq && typeof window.ttq.ready === 'function') {
        window.ttq.ready(() => {
          if (isPixelReady()) {
            pixelInitialized = true;
            flushEventQueue();
            initPromise = null;
            resolve(true);
          } else {
            // Ready callback fired but track not available - retry
            scheduleRetry();
          }
        });
        
        // Fallback timeout for ready callback (10s max wait)
        setTimeout(() => {
          if (!pixelInitialized && isPixelReady()) {
            pixelInitialized = true;
            flushEventQueue();
            initPromise = null;
            resolve(true);
          } else if (!pixelInitialized) {
            scheduleRetry();
          }
        }, 10000);
        
        return;
      }

      // Poll for readiness
      if (isPixelReady()) {
        pixelInitialized = true;
        flushEventQueue();
        initPromise = null;
        resolve(true);
      } else {
        scheduleRetry();
      }
    };

    const scheduleRetry = () => {
      if (retryAttempt >= MAX_RETRIES) {
        // Max retries reached - mark as failed but DO NOT permanently block
        // Events remain in queue and will flush if pixel loads later
        console.warn('[TikTok] Pixel init failed after max retries. Events queued.');
        pixelInitialized = false; // CRITICAL: Do not mark as initialized if not ready
        initPromise = null;
        resolve(false);
        return;
      }

      const delay = RETRY_DELAYS[retryAttempt];
      retryAttempt++;
      
      setTimeout(() => {
        if (!pixelInitialized) {
          attemptInit();
        }
      }, delay);
    };

    // Initial attempt after short delay (allow script to start loading)
    setTimeout(attemptInit, 500);
  });

  return initPromise;
}

/**
 * Track PageView event (standard TikTok event)
 * 
 * CRITICAL: Use ONLY for actual page views (route changes)
 * Do NOT use for time-based engagement - use CUSTOM EVENTS instead
 * 
 * @param {string} pagePath - Current page path
 * @param {object} additionalData - Additional page data (no currency/value)
 */
export function trackPageView(pagePath = '/', additionalData = {}) {
  if (typeof window === 'undefined') return;
  if (!hasMarketingConsent()) return;

  // Dedupe: check if we already tracked this route in this session
  const dedupeKey = `ttq_pageview_${pagePath}`;
  try {
    if (sessionStorage.getItem(dedupeKey)) {
      return; // Already tracked
    }
    sessionStorage.setItem(dedupeKey, '1');
  } catch (e) {
    // Ignore storage errors
  }

  // Clean payload - remove currency/value (not applicable for page views)
  const payload = {
    content_name: pagePath,
    ...additionalData
  };

  // Remove currency/value if present (semantic cleanup)
  delete payload.currency;
  delete payload.value;

  const ttq = safeGetTTQ();
  if (!ttq || !isPixelReady()) {
    // Queue for later if pixel not ready
    if (typeof window !== 'undefined' && Array.isArray(window.ttq)) {
      eventQueue.push(['page', null, payload]);
    }
    return;
  }

  try {
    if (ttq.page) {
      ttq.page(payload);
    } else if (typeof ttq.track === 'function') {
      // Fallback: use PageView standard event (correct semantic)
      ttq.track('PageView', payload);
    } else if (Array.isArray(ttq)) {
      ttq.push(['page', payload]);
    }
  } catch (err) {
    console.error('[TikTok] PageView tracking error:', err);
  }
}

/**
 * Track standard TikTok event (PageView, ViewContent, Subscribe, etc.)
 * 
 * CRITICAL: ViewContent should ONLY be used for real content exposure (e.g., presale page entry)
 * DO NOT use ViewContent for time-based engagement - use trackCustomEvent() with CUSTOM EVENTS
 * 
 * @param {string} eventName - Standard event name (PageView, ViewContent, Subscribe)
 * @param {object} payload - Event payload
 * @param {object} options - Options: { debounce: number }
 */
const eventDebounceMap = new Map();

export function trackStandardEvent(eventName, payload = {}, options = {}) {
  if (typeof window === 'undefined') return;
  if (!hasMarketingConsent()) return;

  // Debounce for Subscribe events (prevent double-firing)
  if (eventName === 'Subscribe' && options.debounce !== false) {
    const debounceKey = `subscribe_${payload.method || 'default'}`;
    const now = Date.now();
    const lastFired = eventDebounceMap.get(debounceKey) || 0;
    const debounceMs = options.debounce || 500; // Default 500ms debounce
    
    if (now - lastFired < debounceMs) {
      return; // Skip duplicate within debounce window
    }
    eventDebounceMap.set(debounceKey, now);
  }

  // Clean payload - remove currency/value for non-monetary events
  const cleanPayload = { ...payload };
  if (eventName !== 'CompletePayment' && eventName !== 'Purchase') {
    delete cleanPayload.currency;
    delete cleanPayload.value;
  }

  const ttq = safeGetTTQ();
  if (!ttq || !isPixelReady()) {
    // Queue for later if pixel not ready
    if (typeof window !== 'undefined' && Array.isArray(window.ttq)) {
      eventQueue.push(['track', eventName, cleanPayload]);
    }
    return;
  }

  try {
    if (typeof ttq.track === 'function') {
      ttq.track(eventName, cleanPayload);
    } else if (Array.isArray(ttq)) {
      ttq.push(['track', eventName, cleanPayload]);
    }
  } catch (err) {
    console.error(`[TikTok] Event tracking error (${eventName}):`, err);
  }
}

/**
 * Track CUSTOM EVENT for TikTok Custom Conversions
 * 
 * CRITICAL: Use this for time-based engagement thresholds
 * Custom events: Engaged15s, Engaged45s, Engaged120s, SiteEngaged30s, SiteEngaged90s
 * These are compatible with TikTok Custom Conversions for optimization
 * 
 * @param {string} eventName - Custom event name (must match TikTok Custom Conversion)
 * @param {object} payload - Event payload (no currency/value)
 */
export function trackCustomEvent(eventName, payload = {}) {
  if (typeof window === 'undefined') return;
  if (!hasMarketingConsent()) return;

  // Clean payload - NO currency/value for engagement events
  const cleanPayload = { ...payload };
  delete cleanPayload.currency;
  delete cleanPayload.value;

  const ttq = safeGetTTQ();
  if (!ttq || !isPixelReady()) {
    // Queue for later if pixel not ready
    if (typeof window !== 'undefined' && Array.isArray(window.ttq)) {
      eventQueue.push(['track', eventName, cleanPayload]);
    }
    return;
  }

  try {
    // TikTok accepts custom events via track() - they become Custom Conversions
    if (typeof ttq.track === 'function') {
      ttq.track(eventName, cleanPayload);
    } else if (Array.isArray(ttq)) {
      ttq.push(['track', eventName, cleanPayload]);
    }
  } catch (err) {
    console.error(`[TikTok] Custom event tracking error (${eventName}):`, err);
  }
}
