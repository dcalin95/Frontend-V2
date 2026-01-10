/**
 * 📊 Engagement Tracking
 * 
 * Active time tracking with Page Visibility API, focus/blur, and activity gating
 * Threshold management for ViewContent events
 */

// 🕐 Active time tracking state
let activeTimeState = {
  sessionStartTime: null,
  pageStartTime: null,
  lastActivityTime: null,
  totalActiveSeconds: 0,
  pageActiveSeconds: 0,
  isVisible: true,
  hasFocus: true,
  isIdle: false,
  idleThreshold: 15000, // 15 seconds of no activity = idle
};

// 🎯 Thresholds configuration
const PRESALE_THRESHOLDS = [15, 45, 120]; // seconds
const SITE_THRESHOLDS = [30, 90]; // seconds

// 📝 Activity tracking
let activityListeners = [];
let visibilityListener = null;
let focusListener = null;
let blurListener = null;
let idleCheckInterval = null;

/**
 * Get visitor identity data (lightweight, no PII)
 * @returns {object}
 */
export function getVisitorIdentity() {
  if (typeof window === 'undefined') {
    return {
      is_returning: false,
      distinct_day_count: 1,
      days_since_first_seen: 0,
      visit_count: 1,
    };
  }

  try {
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Get or initialize visitor data
    let firstSeen = localStorage.getItem('visitor_first_seen');
    let lastSeenDate = localStorage.getItem('visitor_last_seen_date');
    let visitCount = parseInt(localStorage.getItem('visitor_visit_count') || '0', 10);
    let distinctDays = parseInt(localStorage.getItem('visitor_distinct_days') || '0', 10);
    
    if (!firstSeen) {
      firstSeen = now.toString();
      localStorage.setItem('visitor_first_seen', firstSeen);
      lastSeenDate = today;
      distinctDays = 1;
    }
    
    // Check if returning (different calendar day)
    const isReturning = lastSeenDate !== today;
    
    if (isReturning) {
      // New day - increment distinct days
      distinctDays += 1;
      localStorage.setItem('visitor_distinct_days', distinctDays.toString());
      localStorage.setItem('visitor_last_seen_date', today);
    } else if (!lastSeenDate) {
      // First visit today
      localStorage.setItem('visitor_last_seen_date', today);
    }
    
    // Increment visit count
    visitCount += 1;
    localStorage.setItem('visitor_visit_count', visitCount.toString());
    
    // Calculate days since first seen
    const daysSinceFirstSeen = Math.floor((now - parseInt(firstSeen, 10)) / (1000 * 60 * 60 * 24));
    
    return {
      is_returning: isReturning,
      distinct_day_count: distinctDays,
      days_since_first_seen: daysSinceFirstSeen,
      visit_count: visitCount,
    };
  } catch (e) {
    console.warn('[Engagement] Failed to get visitor identity:', e);
    return {
      is_returning: false,
      distinct_day_count: 1,
      days_since_first_seen: 0,
      visit_count: 1,
    };
  }
}

/**
 * Get session ID (persists for this browser session)
 * @returns {string}
 */
export function getSessionId() {
  if (typeof window === 'undefined') return 'unknown';
  
  try {
    let sessionId = sessionStorage.getItem('engagement_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('engagement_session_id', sessionId);
    }
    return sessionId;
  } catch (e) {
    return `session_${Date.now()}`;
  }
}

/**
 * Check if threshold was already fired (dedupe)
 * @param {string} key - Dedupe key
 * @param {boolean} useLocalStorage - Use localStorage (persists) vs sessionStorage (session only)
 * @returns {boolean}
 */
export function isThresholdFired(key, useLocalStorage = false) {
  if (typeof window === 'undefined') return false;
  
  try {
    const storage = useLocalStorage ? localStorage : sessionStorage;
    return storage.getItem(key) === '1';
  } catch (e) {
    return false;
  }
}

/**
 * Mark threshold as fired
 * @param {string} key - Dedupe key
 * @param {boolean} useLocalStorage - Use localStorage vs sessionStorage
 */
export function markThresholdFired(key, useLocalStorage = false) {
  if (typeof window === 'undefined') return;
  
  try {
    const storage = useLocalStorage ? localStorage : sessionStorage;
    storage.setItem(key, '1');
  } catch (e) {
    // Ignore storage errors
  }
}

/**
 * Record user activity (mouse, scroll, keyboard, touch)
 */
function recordActivity() {
  const now = Date.now();
  activeTimeState.lastActivityTime = now;
  
  if (activeTimeState.isIdle) {
    activeTimeState.isIdle = false;
    // Resume active time tracking
  }
}

/**
 * Check if user is idle (no activity in last N seconds)
 */
function checkIdle() {
  if (!activeTimeState.isVisible || !activeTimeState.hasFocus) {
    return; // Already paused
  }
  
  const now = Date.now();
  const timeSinceActivity = now - (activeTimeState.lastActivityTime || now);
  
  if (timeSinceActivity > activeTimeState.idleThreshold) {
    if (!activeTimeState.isIdle) {
      activeTimeState.isIdle = true;
    }
  } else {
    if (activeTimeState.isIdle) {
      activeTimeState.isIdle = false;
    }
  }
}

/**
 * Update active time counters
 */
function updateActiveTime() {
  if (!activeTimeState.isVisible || !activeTimeState.hasFocus || activeTimeState.isIdle) {
    return; // Not active
  }
  
  const now = Date.now();
  
  // Update session active time
  if (activeTimeState.sessionStartTime) {
    const sessionElapsed = Math.floor((now - activeTimeState.sessionStartTime) / 1000);
    activeTimeState.totalActiveSeconds = sessionElapsed;
  }
  
  // Update page active time
  if (activeTimeState.pageStartTime) {
    const pageElapsed = Math.floor((now - activeTimeState.pageStartTime) / 1000);
    activeTimeState.pageActiveSeconds = pageElapsed;
  }
}

/**
 * Start engagement timer
 * Call this when page loads or route changes
 */
export function startEngagementTimer() {
  if (typeof window === 'undefined') return;
  
  const now = Date.now();
  
  // Initialize session start time if not set
  if (!activeTimeState.sessionStartTime) {
    activeTimeState.sessionStartTime = now;
    activeTimeState.lastActivityTime = now;
  }
  
  // Reset page start time (new route)
  activeTimeState.pageStartTime = now;
  activeTimeState.pageActiveSeconds = 0;
  activeTimeState.lastActivityTime = now;
  activeTimeState.isIdle = false;
  
  // Page Visibility API
  if (!visibilityListener) {
    const handleVisibilityChange = () => {
      activeTimeState.isVisible = !document.hidden;
      if (activeTimeState.isVisible) {
        activeTimeState.lastActivityTime = Date.now();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    visibilityListener = handleVisibilityChange;
    activeTimeState.isVisible = !document.hidden;
  }
  
  // Window focus/blur
  if (!focusListener) {
    focusListener = () => {
      activeTimeState.hasFocus = true;
      activeTimeState.lastActivityTime = Date.now();
    };
    
    blurListener = () => {
      activeTimeState.hasFocus = false;
    };
    
    window.addEventListener('focus', focusListener);
    window.addEventListener('blur', blurListener);
    activeTimeState.hasFocus = document.hasFocus();
  }
  
  // Activity listeners (mouse, scroll, keyboard, touch) - Throttled for performance
  let lastActivityRecord = 0;
  const ACTIVITY_THROTTLE = 1000; // Record activity max once per second
  
  const throttledRecordActivity = () => {
    const now = Date.now();
    if (now - lastActivityRecord > ACTIVITY_THROTTLE) {
      recordActivity();
      lastActivityRecord = now;
    }
  };
  
  const activityEvents = ['mousemove', 'scroll', 'keydown', 'touchstart', 'click'];
  activityEvents.forEach(eventType => {
    const handler = throttledRecordActivity;
    document.addEventListener(eventType, handler, { passive: true });
    activityListeners.push({ eventType, handler });
  });
  
  // Idle check interval (every 5 seconds) - Optimized
  if (!idleCheckInterval) {
    idleCheckInterval = setInterval(() => {
      checkIdle();
      updateActiveTime();
    }, 5000);
    
    // Initial check
    checkIdle();
    updateActiveTime();
  }
  
  // Initial update
  updateActiveTime();
}

/**
 * Reset engagement timer (for route changes)
 * Keeps session time, resets page time
 */
export function resetOnRouteChange() {
  activeTimeState.pageStartTime = Date.now();
  activeTimeState.pageActiveSeconds = 0;
  activeTimeState.lastActivityTime = Date.now();
  activeTimeState.isIdle = false;
}

/**
 * Get active seconds for current page
 * @returns {number}
 */
export function getPageActiveSeconds() {
  updateActiveTime();
  return activeTimeState.pageActiveSeconds;
}

/**
 * Get active seconds for current session
 * @returns {number}
 */
export function getSessionActiveSeconds() {
  updateActiveTime();
  return activeTimeState.totalActiveSeconds;
}

/**
 * Cleanup engagement timer
 */
export function cleanupEngagementTimer() {
  // Remove activity listeners
  activityListeners.forEach(({ eventType, handler }) => {
    document.removeEventListener(eventType, handler);
  });
  activityListeners = [];
  
  // Remove visibility listener
  if (visibilityListener) {
    document.removeEventListener('visibilitychange', visibilityListener);
    visibilityListener = null;
  }
  
  // Remove focus/blur listeners
  if (focusListener) {
    window.removeEventListener('focus', focusListener);
    focusListener = null;
  }
  if (blurListener) {
    window.removeEventListener('blur', blurListener);
    blurListener = null;
  }
  
  // Clear idle check interval
  if (idleCheckInterval) {
    clearInterval(idleCheckInterval);
    idleCheckInterval = null;
  }
}

/**
 * Check and fire presale engagement thresholds
 * @param {function} onThreshold - Callback when threshold is reached
 */
export function checkPresaleThresholds(onThreshold) {
  const pageActiveSeconds = getPageActiveSeconds();
  
  PRESALE_THRESHOLDS.forEach(threshold => {
    if (pageActiveSeconds >= threshold) {
      const key = `presale_engaged_${threshold}s`;
      if (!isThresholdFired(key, false)) { // sessionStorage
        markThresholdFired(key, false);
        onThreshold(threshold, 'presale');
      }
    }
  });
}

/**
 * Check and fire site-wide engagement thresholds
 * @param {function} onThreshold - Callback when threshold is reached
 */
export function checkSiteThresholds(onThreshold) {
  const sessionActiveSeconds = getSessionActiveSeconds();
  
  SITE_THRESHOLDS.forEach(threshold => {
    if (sessionActiveSeconds >= threshold) {
      const key = `site_engaged_${threshold}s`;
      if (!isThresholdFired(key, false)) { // sessionStorage
        markThresholdFired(key, false);
        onThreshold(threshold, 'site');
      }
    }
  });
}

/**
 * Check if return visit event should be fired (once per day)
 * @returns {boolean}
 */
export function shouldFireReturnVisit() {
  if (typeof window === 'undefined') return false;
  
  try {
    const today = new Date().toISOString().split('T')[0];
    const key = `return_visit_${today}`;
    
    if (isThresholdFired(key, true)) { // localStorage (once per day)
      return false;
    }
    
    const identity = getVisitorIdentity();
    if (identity.is_returning && identity.distinct_day_count > 1) {
      markThresholdFired(key, true);
      return true;
    }
    
    return false;
  } catch (e) {
    return false;
  }
}

