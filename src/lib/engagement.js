/**
 * 📊 Engagement Tracking - Production Hardened
 * 
 * Active time tracking with Page Visibility API, focus/blur, and activity gating
 * CRITICAL: Time accumulation is millisecond-based for accuracy, converted to seconds only for thresholds
 * 
 * This module provides accurate "ACTIVE TIME" tracking (not elapsed time):
 * - Only counts when document is visible, window has focus, and user is not idle
 * - Idle threshold: 30 seconds (increased from 15s to avoid false positives for reading)
 * - Update interval: 5 seconds (optimal balance between accuracy and performance)
 */

// 🕐 Active time tracking state - MILLISECOND-BASED for accuracy
let activeTimeState = {
  sessionStartTime: null,           // Timestamp when session started
  pageStartTime: null,               // Timestamp when current page started
  lastActivityTime: null,            // Last timestamp of user activity
  lastUpdateTime: null,              // Last timestamp when we updated counters
  totalActiveMs: 0,                  // Total active milliseconds in session (accumulated)
  pageActiveMs: 0,                   // Active milliseconds on current page (accumulated)
  isVisible: true,                   // Document visibility state (Page Visibility API)
  hasFocus: true,                    // Window focus state
  isIdle: false,                     // User idle state (no activity in last N ms)
  idleThreshold: 30000,              // 30 seconds of no activity = idle (increased from 15s)
};

// 🎯 Thresholds configuration (in seconds - converted from ms when checking)
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
let visitorIdentityCache = null;

function initializeVisitorIdentity() {
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
    
    // Check if already initialized this session
    const sessionInitKey = `visitor_init_${today}`;
    if (sessionStorage.getItem(sessionInitKey)) {
      // Return cached identity (already initialized this session)
      if (visitorIdentityCache) {
        return visitorIdentityCache;
      }
    }
    
    // Get or initialize visitor data
    let firstSeen = localStorage.getItem('visitor_first_seen');
    let lastSeenDate = localStorage.getItem('visitor_last_seen_date');
    let visitCount = parseInt(localStorage.getItem('visitor_visit_count') || '0', 10);
    let distinctDays = parseInt(localStorage.getItem('visitor_distinct_days') || '0', 10);
    
    if (!firstSeen) {
      // First visit ever
      firstSeen = now.toString();
      localStorage.setItem('visitor_first_seen', firstSeen);
      lastSeenDate = today;
      distinctDays = 1;
      visitCount = 1;
      localStorage.setItem('visitor_last_seen_date', today);
      localStorage.setItem('visitor_distinct_days', '1');
      localStorage.setItem('visitor_visit_count', '1');
    } else {
      // Check if returning (different calendar day)
      const isReturning = lastSeenDate !== today;
      
      if (isReturning) {
        // New day - increment distinct days only once per day
        distinctDays += 1;
        localStorage.setItem('visitor_distinct_days', distinctDays.toString());
        localStorage.setItem('visitor_last_seen_date', today);
      }
      
      // Increment visit count (only once per session)
      visitCount += 1;
      localStorage.setItem('visitor_visit_count', visitCount.toString());
      
      // Update last seen date if not set
      if (!lastSeenDate) {
        localStorage.setItem('visitor_last_seen_date', today);
      }
    }
    
    // Calculate days since first seen
    const daysSinceFirstSeen = Math.floor((now - parseInt(firstSeen, 10)) / (1000 * 60 * 60 * 24));
    
    const identity = {
      is_returning: lastSeenDate !== today && distinctDays > 1,
      distinct_day_count: distinctDays,
      days_since_first_seen: daysSinceFirstSeen,
      visit_count: visitCount,
    };
    
    // Cache identity for this session
    visitorIdentityCache = identity;
    sessionStorage.setItem(sessionInitKey, '1');
    
    return identity;
  } catch (e) {
    console.warn('[Engagement] Failed to initialize visitor identity:', e);
    return {
      is_returning: false,
      distinct_day_count: 1,
      days_since_first_seen: 0,
      visit_count: 1,
    };
  }
}

/**
 * Get visitor identity (cached, initialized once per session)
 */
export function getVisitorIdentity() {
  // Initialize if not cached
  if (!visitorIdentityCache) {
    return initializeVisitorIdentity();
  }
  return visitorIdentityCache;
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
 * CRITICAL: This resets idle state and updates lastActivityTime
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
 * Check if user is idle (no activity in last N milliseconds)
 * CRITICAL: Idle threshold is 30 seconds (30000ms) - increased from 15s
 * Reason: 15s was too aggressive, causing false positives when users read content
 */
function checkIdle() {
  if (!activeTimeState.isVisible || !activeTimeState.hasFocus) {
    return; // Already paused - don't check idle if not visible/focused
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
 * Update active time counters - MILLISECOND-BASED accumulation
 * 
 * CRITICAL: This function accumulates time in milliseconds for accuracy
 * Only accumulates when ALL conditions are met:
 * - document is visible (Page Visibility API)
 * - window has focus
 * - user is not idle (activity within last 30s)
 * 
 * Time is accumulated incrementally based on elapsedMs since last update
 * This prevents undercounting due to missed intervals or system delays
 */
function updateActiveTime() {
  const now = Date.now();
  
  // Initialize lastUpdateTime if not set
  if (!activeTimeState.lastUpdateTime) {
    activeTimeState.lastUpdateTime = now;
    return;
  }
  
  // Calculate elapsed milliseconds since last update
  const elapsedMs = now - activeTimeState.lastUpdateTime;
  
  // Only accumulate time if ALL conditions are met
  if (activeTimeState.isVisible && activeTimeState.hasFocus && !activeTimeState.isIdle) {
    // Accumulate session active time (in milliseconds)
    if (activeTimeState.sessionStartTime) {
      activeTimeState.totalActiveMs += elapsedMs;
    }
    
    // Accumulate page active time (in milliseconds)
    if (activeTimeState.pageStartTime) {
      activeTimeState.pageActiveMs += elapsedMs;
    }
  }
  
  // Update last update time for next iteration
  activeTimeState.lastUpdateTime = now;
}

/**
 * Start engagement timer
 * Call this when page loads or route changes
 * 
 * CRITICAL: Sets up all event listeners and starts interval-based updates
 * Update interval: 5 seconds (optimal balance between accuracy and performance)
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
  activeTimeState.pageActiveMs = 0; // Reset page time (milliseconds)
  activeTimeState.lastActivityTime = now;
  activeTimeState.lastUpdateTime = now; // Reset update time
  activeTimeState.isIdle = false;
  
  // Page Visibility API - CRITICAL: track when tab is hidden/visible
  if (!visibilityListener) {
    const handleVisibilityChange = () => {
      // Update active time BEFORE changing visibility state (accumulate final ms)
      updateActiveTime();
      
      activeTimeState.isVisible = !document.hidden;
      if (activeTimeState.isVisible) {
        activeTimeState.lastActivityTime = Date.now();
        activeTimeState.lastUpdateTime = Date.now(); // Reset update time when becoming visible
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    visibilityListener = handleVisibilityChange;
    activeTimeState.isVisible = !document.hidden;
  }
  
  // Window focus/blur - CRITICAL: track when window loses/gains focus
  if (!focusListener) {
    focusListener = () => {
      // Update active time BEFORE changing focus state (accumulate final ms)
      updateActiveTime();
      
      activeTimeState.hasFocus = true;
      activeTimeState.lastActivityTime = Date.now();
      activeTimeState.lastUpdateTime = Date.now(); // Reset update time when gaining focus
    };
    
    blurListener = () => {
      // Update active time BEFORE losing focus (accumulate final ms)
      updateActiveTime();
      
      activeTimeState.hasFocus = false;
    };
    
    window.addEventListener('focus', focusListener);
    window.addEventListener('blur', blurListener);
    activeTimeState.hasFocus = document.hasFocus();
  }
  
  // Activity listeners (mouse, scroll, keyboard, touch) - Throttled for performance
  // CRITICAL: Throttle to max 1/sec to avoid performance issues
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
  
  // Idle check + Active time update interval
  // CRITICAL: 5 second interval is optimal - balances accuracy with performance
  // Do NOT reduce to 1s as it increases CPU usage without significant accuracy gain
  if (!idleCheckInterval) {
    idleCheckInterval = setInterval(() => {
      checkIdle();
      updateActiveTime(); // Accumulate active time incrementally (millisecond-based)
    }, 5000);
    
    // Initial check
    checkIdle();
    updateActiveTime();
  }
  
  // Initialize last update time
  activeTimeState.lastUpdateTime = now;
}

/**
 * Reset engagement timer (for route changes)
 * Keeps session time, resets page time
 * 
 * CRITICAL: Update active time BEFORE resetting to accumulate final milliseconds
 */
export function resetOnRouteChange() {
  // Update active time before resetting (accumulate final milliseconds)
  updateActiveTime();
  
  const now = Date.now();
  activeTimeState.pageStartTime = now;
  activeTimeState.pageActiveMs = 0; // Reset page time (milliseconds)
  activeTimeState.lastActivityTime = now;
  activeTimeState.lastUpdateTime = now; // Reset update time for new page
  activeTimeState.isIdle = false;
}

/**
 * Get active seconds for current page
 * CRITICAL: Convert from milliseconds to seconds only when checking thresholds
 * @returns {number} Active seconds (rounded down)
 */
export function getPageActiveSeconds() {
  updateActiveTime(); // Ensure time is up-to-date
  return Math.floor(activeTimeState.pageActiveMs / 1000); // Convert ms to seconds
}

/**
 * Get active seconds for current session
 * CRITICAL: Convert from milliseconds to seconds only when checking thresholds
 * @returns {number} Active seconds (rounded down)
 */
export function getSessionActiveSeconds() {
  updateActiveTime(); // Ensure time is up-to-date
  return Math.floor(activeTimeState.totalActiveMs / 1000); // Convert ms to seconds
}

/**
 * Cleanup engagement timer (remove all listeners)
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
 * 
 * CRITICAL: Thresholds fire exactly once per session per threshold
 * Fires immediately when threshold is crossed (within 5s check interval)
 * Uses CUSTOM EVENTS (Engaged15s, Engaged45s, Engaged120s) for TikTok Custom Conversions
 * 
 * @param {function} onThreshold - Callback when threshold is reached
 */
export function checkPresaleThresholds(onThreshold) {
  // CRITICAL: Convert milliseconds to seconds for threshold comparison
  const pageActiveSeconds = getPageActiveSeconds();
  
  // Check all thresholds that have been reached but not yet fired
  // CRITICAL: Fire immediately when crossed (no delay beyond check interval)
  PRESALE_THRESHOLDS.forEach(threshold => {
    if (pageActiveSeconds >= threshold) {
      const key = `presale_engaged_${threshold}s`;
      if (!isThresholdFired(key, false)) { // sessionStorage dedupe
        markThresholdFired(key, false);
        onThreshold(threshold, 'presale');
      }
    }
  });
}

/**
 * Check and fire site-wide engagement thresholds
 * 
 * CRITICAL: Thresholds fire exactly once per session per threshold
 * Fires immediately when threshold is crossed (within 5s check interval)
 * Uses CUSTOM EVENTS (SiteEngaged30s, SiteEngaged90s) for TikTok Custom Conversions
 * 
 * @param {function} onThreshold - Callback when threshold is reached
 */
export function checkSiteThresholds(onThreshold) {
  // CRITICAL: Convert milliseconds to seconds for threshold comparison
  const sessionActiveSeconds = getSessionActiveSeconds();
  
  // Check all thresholds that have been reached but not yet fired
  // CRITICAL: Fire immediately when crossed (no delay beyond check interval)
  SITE_THRESHOLDS.forEach(threshold => {
    if (sessionActiveSeconds >= threshold) {
      const key = `site_engaged_${threshold}s`;
      if (!isThresholdFired(key, false)) { // sessionStorage dedupe
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
