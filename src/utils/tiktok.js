// TikTok Pixel event tracker with wait mechanism and retry logic
// Usage: trackTikTokEvent('CompletePayment', { value: 100, currency: 'USD' })

// 🧪 Lista de adrese wallet-uri de test (adaugă aici adresele tale de test)
const TEST_WALLET_ADDRESSES = [
  // Adaugă aici adresele tale de test (lowercase pentru comparație)
  // Exemplu: '0x1234567890123456789012345678901234567890',
  // 'So11111111111111111111111111111111111111112', // Solana test
];

// 🛑 Check if we should disable tracking (localhost, development, test wallets, or explicit disable)
const shouldDisableTracking = (walletAddress = null) => {
  if (typeof window === 'undefined') return true;
  
  // Disable in development mode
  if (process.env.NODE_ENV === 'development') return true;
  
  // Disable on localhost
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
    return true;
  }
  
  // Disable if explicitly requested via URL parameter
  if (window.location.search.includes('disable_tiktok=true')) {
    // Set flag in localStorage for future sessions
    try {
      localStorage.setItem('disable_tiktok_tracking', 'true');
    } catch (e) {}
    return true;
  }
  
  // Disable if flag is set in localStorage
  try {
    if (localStorage.getItem('disable_tiktok_tracking') === 'true') {
      return true;
    }
  } catch (e) {}
  
  // Disable if current wallet is a test wallet
  if (walletAddress) {
    const addressLower = walletAddress.toLowerCase();
    if (TEST_WALLET_ADDRESSES.some(addr => addr.toLowerCase() === addressLower)) {
      if (TIKTOK_DEBUG) {
        debugLog(`🚫 Test wallet detected, tracking disabled: ${walletAddress.substring(0, 10)}...`);
      }
      return true;
    }
  }
  
  return false;
};

// 🔧 Helper function to enable/disable tracking manually
export const setTikTokTrackingEnabled = (enabled) => {
  try {
    if (enabled) {
      localStorage.removeItem('disable_tiktok_tracking');
      console.log('✅ TikTok tracking enabled');
    } else {
      localStorage.setItem('disable_tiktok_tracking', 'true');
      console.log('🚫 TikTok tracking disabled');
    }
  } catch (e) {
    console.error('Error setting TikTok tracking:', e);
  }
};

// 🔧 Helper function to add test wallet addresses
export const addTestWalletAddress = (address) => {
  if (!address) return;
  const addressLower = address.toLowerCase();
  if (!TEST_WALLET_ADDRESSES.includes(addressLower)) {
    TEST_WALLET_ADDRESSES.push(addressLower);
    console.log(`🧪 Test wallet added: ${address.substring(0, 10)}...`);
  }
};

// 🐛 Debug mode - set to true to see detailed logs
const TIKTOK_DEBUG = process.env.NODE_ENV === 'development' || 
  (typeof window !== 'undefined' && window.location.search.includes('tiktok_debug=true'));

function debugLog(...args) {
  if (TIKTOK_DEBUG) {
    console.log('🔵 [TikTok Pixel]', ...args);
  }
}

function debugError(...args) {
  if (TIKTOK_DEBUG) {
    console.error('🔴 [TikTok Pixel]', ...args);
  }
}

/**
 * Wait for TikTok Pixel to be ready
 * @returns {Promise<boolean>} True if pixel is ready, false otherwise
 */
function waitForTikTokPixel(maxWait = 5000) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    // If pixel is already ready
    if (window.ttq && typeof window.ttq.track === 'function') {
      resolve(true);
      return;
    }

    // Wait for pixel to load using ttq.ready() if available
    if (window.ttq && typeof window.ttq.ready === 'function') {
      const timeout = setTimeout(() => {
        resolve(false);
      }, maxWait);

      window.ttq.ready(() => {
        clearTimeout(timeout);
        resolve(true);
      });
    } else {
      // Fallback: poll for pixel availability
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (window.ttq && typeof window.ttq.track === 'function') {
          clearInterval(checkInterval);
          resolve(true);
        } else if (Date.now() - startTime > maxWait) {
          clearInterval(checkInterval);
          resolve(false);
        }
      }, 100);
    }
  });
}

/**
 * Track TikTok event with automatic retry for important events
 * @param {string} eventName - Event name (e.g., 'CompletePayment', 'ViewContent')
 * @param {object} payload - Event payload
 * @param {object} options - Options: { retry: boolean, maxRetries: number, retryDelay: number, walletAddress: string }
 */
export async function trackTikTokEvent(eventName, payload = {}, options = {}) {
  // Extract walletAddress from options or payload
  const walletAddress = options.walletAddress || payload.wallet_address || payload.walletAddress || null;
  
  // 🛑 Skip tracking if disabled (localhost/development/test wallet)
  if (shouldDisableTracking(walletAddress)) {
    if (TIKTOK_DEBUG) {
      debugLog(`🚫 Tracking disabled: ${eventName}`, { reason: walletAddress ? 'test_wallet' : 'localhost/dev', wallet: walletAddress?.substring(0, 10) });
    }
    return;
  }

  const {
    retry = false,
    maxRetries = 3,
    retryDelay = 1000,
  } = options;

  // Important events that should be retried
  const importantEvents = ['CompletePayment', 'CompleteRegistration', 'Purchase'];
  const shouldRetry = retry || importantEvents.includes(eventName);

  const attemptTrack = async (attempt = 1) => {
  try {
      if (typeof window === 'undefined') {
        return false;
      }

      // Wait for pixel to be ready (only on first attempt or if retrying)
      if (attempt === 1 || shouldRetry) {
        const isReady = await waitForTikTokPixel(shouldRetry ? 3000 : 1000);
        if (!isReady && shouldRetry && attempt < maxRetries) {
          // Retry after delay
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          return attemptTrack(attempt + 1);
        }
        if (!isReady) {
          debugError(`⚠️ TikTok Pixel not ready after ${shouldRetry ? 3000 : 1000}ms`);
          // Pixel not available - TikTok queue system will handle it if pixel loads later
          // But we can also push to queue manually as fallback
          if (window.ttq && Array.isArray(window.ttq)) {
            debugLog(`📤 Queuing event (pixel not ready): ${eventName}`, payload);
            window.ttq.push(['track', eventName, payload || {}]);
            return true;
          }
          debugError(`❌ Cannot track ${eventName} - ttq not available`);
          return false;
        }
      }

      // Pixel is ready, track event
      if (window.ttq && typeof window.ttq.track === 'function') {
        debugLog(`✅ Tracking event: ${eventName}`, payload);
        window.ttq.track(eventName, payload || {});
        return true;
      }

      // Fallback: push to queue if available
      if (window.ttq && Array.isArray(window.ttq)) {
        window.ttq.push(['track', eventName, payload || {}]);
        return true;
      }

      return false;
    } catch (err) {
      // Never let analytics break UX
      if (shouldRetry && attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        return attemptTrack(attempt + 1);
      }
      return false;
    }
  };

  // For important events, use async tracking with retry
  if (shouldRetry) {
    attemptTrack().catch(() => {
      // Silently fail - analytics should never break UX
    });
    return;
  }

  // For non-critical events, use synchronous tracking (faster)
  try {
    if (typeof window !== 'undefined' && window.ttq) {
      if (typeof window.ttq.track === 'function') {
        debugLog(`✅ Tracking event (sync): ${eventName}`, payload);
        window.ttq.track(eventName, payload || {});
      } else if (Array.isArray(window.ttq)) {
        // Pixel not loaded yet, but queue exists - push to queue
        debugLog(`📤 Queuing event (sync): ${eventName}`, payload);
        window.ttq.push(['track', eventName, payload || {}]);
      } else {
        debugError(`❌ Cannot track ${eventName} - ttq.track not available`);
      }
    } else {
      debugError(`❌ Cannot track ${eventName} - window.ttq not available`);
    }
  } catch (err) {
    debugError(`❌ Error tracking ${eventName}:`, err);
    // Silently fail - analytics should never break UX
  }
}

/**
 * Track TikTok PageView event (for SPA hash routing)
 * @param {string} pagePath - Current page path (e.g., '/presale')
 * @param {object} additionalData - Additional page data (can include walletAddress)
 */
export function trackTikTokPageView(pagePath = '/', additionalData = {}) {
  // Extract walletAddress from additionalData
  const walletAddress = additionalData.walletAddress || additionalData.wallet_address || null;
  
  // 🛑 Skip tracking if disabled (localhost/development/test wallet)
  if (shouldDisableTracking(walletAddress)) {
    if (TIKTOK_DEBUG) {
      debugLog(`🚫 PageView tracking disabled: ${pagePath}`, { reason: walletAddress ? 'test_wallet' : 'localhost/dev' });
    }
    return;
  }

  try {
    if (typeof window === 'undefined' || !window.ttq) {
      debugError('❌ Cannot track PageView - window.ttq not available');
      return;
    }

    const payload = {
      content_name: pagePath,
      ...additionalData
    };

    if (window.ttq.page) {
      debugLog('📄 Tracking PageView:', payload);
      window.ttq.page(payload);
    } else if (typeof window.ttq.track === 'function') {
      // Fallback: use track with ViewContent
      debugLog('📄 Tracking PageView (via ViewContent):', payload);
      window.ttq.track('ViewContent', payload);
    } else if (Array.isArray(window.ttq)) {
      debugLog('📤 Queuing PageView:', payload);
      window.ttq.push(['page', payload]);
    }
  } catch (err) {
    debugError('❌ Error tracking PageView:', err);
  }
}




























