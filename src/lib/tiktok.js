/**
 * 📊 TikTok Pixel Integration
 * 
 * SSR-safe TikTok Pixel initialization and event tracking
 * Focus: Engagement intent tracking (active time, return visits, Telegram clicks)
 */

// 🛑 Global flag to ensure pixel is initialized only once
let pixelInitialized = false;
let initPromise = null;

/**
 * Check if marketing consent is granted
 * Hook for GDPR/consent integration
 * @returns {boolean}
 */
export function hasMarketingConsent() {
  if (typeof window === 'undefined') return false;
  
  // Check localStorage for consent flag
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
 * Initialize TikTok Pixel (dedupe strict - only once)
 * @returns {Promise<boolean>}
 */
export function initTikTokPixel() {
  // Already initialized
  if (pixelInitialized) {
    return Promise.resolve(true);
  }

  // Return existing promise if init is in progress
  if (initPromise) {
    return initPromise;
  }

  // Check consent
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

  initPromise = new Promise((resolve) => {
    try {
      // Check if already loaded
      if (window.ttq && typeof window.ttq.track === 'function') {
        pixelInitialized = true;
        resolve(true);
        return;
      }

      // Initialize TikTok Pixel
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
        ttq.page();
      })(window, document, 'ttq');

      // Wait for pixel to be ready
      const checkReady = () => {
        if (window.ttq && typeof window.ttq.track === 'function') {
          pixelInitialized = true;
          resolve(true);
        } else if (window.ttq && typeof window.ttq.ready === 'function') {
          window.ttq.ready(() => {
            pixelInitialized = true;
            resolve(true);
          });
        } else {
          // Fallback: poll for readiness
          setTimeout(() => {
            if (window.ttq && typeof window.ttq.track === 'function') {
              pixelInitialized = true;
              resolve(true);
            } else {
              // Timeout after 5s
              setTimeout(() => {
                pixelInitialized = true; // Mark as initialized even if not ready
                resolve(false);
              }, 5000);
            }
          }, 1000);
        }
      };

      checkReady();
    } catch (err) {
      console.error('[TikTok] Pixel init error:', err);
      pixelInitialized = true; // Mark as initialized to prevent retries
      resolve(false);
    }
  });

  return initPromise;
}

/**
 * Track PageView event
 * Dedupe: one per route view (uses sessionStorage)
 * @param {string} pagePath - Current page path
 * @param {object} additionalData - Additional page data
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

  const ttq = safeGetTTQ();
  if (!ttq) {
    // Queue for later if pixel not ready
    if (typeof window !== 'undefined' && Array.isArray(window.ttq)) {
      window.ttq.push(['page', { content_name: pagePath, ...additionalData }]);
    }
    return;
  }

  try {
    const payload = {
      content_name: pagePath,
      ...additionalData
    };

    if (ttq.page) {
      ttq.page(payload);
    } else if (typeof ttq.track === 'function') {
      // Fallback: use ViewContent
      ttq.track('ViewContent', payload);
    } else if (Array.isArray(ttq)) {
      ttq.push(['page', payload]);
    }
  } catch (err) {
    console.error('[TikTok] PageView tracking error:', err);
  }
}

/**
 * Track standard TikTok event
 * Optimized with debounce for rapid-fire events (e.g., Subscribe)
 * @param {string} eventName - Standard event name (ViewContent, Subscribe, etc.)
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

  const ttq = safeGetTTQ();
  if (!ttq) {
    // Queue for later if pixel not ready
    if (typeof window !== 'undefined' && Array.isArray(window.ttq)) {
      window.ttq.push(['track', eventName, payload]);
    }
    return;
  }

  try {
    if (typeof ttq.track === 'function') {
      ttq.track(eventName, payload);
    } else if (Array.isArray(ttq)) {
      ttq.push(['track', eventName, payload]);
    }
  } catch (err) {
    console.error(`[TikTok] Event tracking error (${eventName}):`, err);
  }
}

