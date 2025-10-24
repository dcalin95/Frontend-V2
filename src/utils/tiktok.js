// Lightweight TikTok Pixel event tracker
// Usage: trackTikTokEvent('CompletePayment', { value: 100, currency: 'USD' })

export function trackTikTokEvent(eventName, payload = {}) {
  try {
    if (typeof window !== 'undefined' && window.ttq && typeof window.ttq.track === 'function') {
      window.ttq.track(eventName, payload || {});
    } else {
      // Pixel not loaded yet or blocked by CSP/adblock; safely no-op
      // console.warn('[TikTok] ttq not available');
    }
  } catch (err) {
    // Never let analytics break UX
    // console.error('[TikTok] track error:', err);
  }
}

















