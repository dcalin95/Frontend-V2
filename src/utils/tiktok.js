// TikTok Pixel event tracker with wait mechanism and retry logic
// Usage: trackTikTokEvent('CompletePayment', { value: 100, currency: 'USD' })

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
 * @param {object} options - Options: { retry: boolean, maxRetries: number, retryDelay: number }
 */
export async function trackTikTokEvent(eventName, payload = {}, options = {}) {
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
          // Pixel not available - TikTok queue system will handle it if pixel loads later
          // But we can also push to queue manually as fallback
          if (window.ttq && Array.isArray(window.ttq)) {
            window.ttq.push(['track', eventName, payload || {}]);
            return true;
          }
          return false;
        }
      }

      // Pixel is ready, track event
      if (window.ttq && typeof window.ttq.track === 'function') {
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
        window.ttq.track(eventName, payload || {});
      } else if (Array.isArray(window.ttq)) {
        // Pixel not loaded yet, but queue exists - push to queue
        window.ttq.push(['track', eventName, payload || {}]);
      }
    }
  } catch (err) {
    // Silently fail - analytics should never break UX
  }
}




























