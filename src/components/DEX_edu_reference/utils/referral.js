export function captureReferralFromUrl() {
  try {
    const url = new URL(window.location.href);
    const ref = url.searchParams.get('ref');
    if (ref) {
      localStorage.setItem('ref', ref);
    }
  } catch (_) {}
}

export function getStoredReferral() {
  try { return localStorage.getItem('ref') || ''; } catch { return ''; }
}

export function withReferral(url) {
  try {
    const res = new URL(url, window.location.origin);
    const ref = getStoredReferral();
    if (ref) res.searchParams.set('ref', ref);
    return res.toString();
  } catch {
    return url;
  }
}


