import React, { useEffect, useMemo, useState } from 'react';
import { getApiBaseUrl, API_ENDPOINTS } from '../config/apiEndpoints';
import './NewsletterSignup.css';

function getStoredUtms() {
  try {
    const s = sessionStorage.getItem('utm_params');
    return s ? JSON.parse(s) : {};
  } catch {
    return {};
  }
}

/**
 * @param {object} props
 * @param {string} [props.source] — sursă pentru coloana `source` în DB (POST canonic).
 */
export default function NewsletterSignup({
  compact = false,
  onSubscribed,
  source = 'website',
  initialEmail = '',
  lockEmail = false,
  hideTitle = false,
  dexUserId,
  walletHint,
}) {
  const [email, setEmail] = useState(() => (initialEmail || '').trim());
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  useEffect(() => {
    const next = (initialEmail || '').trim();
    if (next) setEmail(next);
  }, [initialEmail]);

  const utms = useMemo(() => {
    const url = new URL(window.location.href);
    const fromUrl = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].reduce((acc, key) => {
      const v = url.searchParams.get(key);
      if (v) acc[key] = v;
      return acc;
    }, {});
    return { ...getStoredUtms(), ...fromUrl };
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem('utm_params', JSON.stringify(utms));
    } catch {}
  }, [utms]);

  /** Override complet URL (ex. serviciu extern); payload „flat” legacy. Altfel → backend canonic cu `userInfo`. */
  function resolveNewsletterPostUrl() {
    const raw =
      typeof process !== 'undefined' && process.env && process.env.REACT_APP_NEWSLETTER_POST_URL
        ? String(process.env.REACT_APP_NEWSLETTER_POST_URL).trim()
        : '';
    if (raw) {
      return { url: raw, legacyFlatPayload: true };
    }
    try {
      const base = getApiBaseUrl();
      return {
        url: `${String(base).replace(/\/$/, '')}${API_ENDPOINTS.EMAIL_NEWSLETTER_SUBSCRIBE}`,
        legacyFlatPayload: false,
      };
    } catch {
      return { url: null, legacyFlatPayload: false };
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!consent) {
      setStatus({ state: 'error', message: 'Please accept the consent to subscribe.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus({ state: 'error', message: 'Please enter a valid email address.' });
      return;
    }
    setStatus({ state: 'loading', message: 'Submitting…' });

    const ts = new Date().toISOString();
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    const { url, legacyFlatPayload } = resolveNewsletterPostUrl();

    const userInfo = {
      consent: true,
      ts,
      source,
      path,
      ...utms,
    };
    if (dexUserId) userInfo.dexUserId = dexUserId;
    if (walletHint) userInfo.walletHint = walletHint;

    const legacyBody = { email, consent: true, ts, source, ...utms, path };
    const canonicalBody = { email, userInfo };

    let usedLocalFallback = false;
    let backendRespondedOk = false;

    try {
      if (!url) throw new Error('No API URL');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(legacyFlatPayload ? legacyBody : canonicalBody),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      backendRespondedOk = true;
      setStatus({
        state: 'success',
        message: 'Subscribed! Check your inbox for confirmation when the server sends the welcome email.',
      });
      setEmail(lockEmail ? email : '');
      setConsent(false);
      if (typeof onSubscribed === 'function') onSubscribed();
      try {
        window.gtag && window.gtag('event', 'newsletter_subscribe', { method: 'api' });
        window.ttq && window.ttq.track && window.ttq.track('CompleteRegistration', { content_name: 'newsletter' });
      } catch {}
    } catch {
      try {
        const key = 'newsletter_pending_submissions';
        const arr = JSON.parse(localStorage.getItem(key) || '[]');
        arr.push(legacyFlatPayload ? legacyBody : { email, ...userInfo });
        localStorage.setItem(key, JSON.stringify(arr));
        usedLocalFallback = true;
        backendRespondedOk = true;
        setStatus({
          state: 'success',
          message: 'Saved locally (API unreachable). We will import this when the server is available.',
        });
        setEmail(lockEmail ? email : '');
        setConsent(false);
        if (typeof onSubscribed === 'function') onSubscribed();
        try {
          window.gtag && window.gtag('event', 'newsletter_subscribe', { method: 'local_fallback' });
        } catch {}
      } catch {
        setStatus({ state: 'error', message: 'Could not subscribe right now. Please try again later.' });
        return;
      }
    }

    const forceForward = String(process.env.REACT_APP_NEWSLETTER_ALWAYS_FORWARD_TO_FORMSUBMIT || '').trim() === '1';
    const disableForward = String(process.env.REACT_APP_DISABLE_EMAIL_FORWARD || '').trim() === '1';
    const shouldFormSubmit = (usedLocalFallback || forceForward) && !disableForward;

    if (shouldFormSubmit && backendRespondedOk) {
      try {
        const forwardPayload = {
          email,
          _replyto: email,
          _subject: 'Newsletter signup (edu.bits-ai.io)',
          _captcha: 'false',
          _template: 'table',
          _autoresponse:
            'Thanks for subscribing! Your one‑page cheat sheet: https://edu.bits-ai.io/lead/bitcoin-fundamentals\n\nYou will receive occasional educational micro‑lessons. Join Telegram for quick Q&A: https://t.me/BitSwapDEX_AI',
          message: JSON.stringify(legacyFlatPayload ? legacyBody : { email, userInfo }),
        };
        const cc = String(process.env.REACT_APP_EMAIL_FORWARD_CC || '').trim();
        if (cc) forwardPayload._cc = cc;
        fetch('https://formsubmit.co/ajax/contact@bits-ai.io', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(forwardPayload),
        }).catch(() => {});
      } catch {}
    }
  }

  return (
    <div className={`newsletter ${compact ? 'compact' : ''}`}>
      {!hideTitle ? (
        <h2 className="newsletter-title">
          <span className="title-ico">
            <i className="fa-solid fa-envelope-open-text" />
          </span>{' '}
          {compact ? 'Newsletter' : 'Stay in the loop'}
        </h2>
      ) : null}
      {!compact && (
        <p className="newsletter-sub">
          Get occasional educational updates. No spam. Data is stored on our API when available. You can unsubscribe any
          time.
        </p>
      )}
      <form className="newsletter-form" onSubmit={handleSubmit}>
        <div className="row">
          <input
            type="email"
            className="email-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email address"
            readOnly={lockEmail}
            autoComplete="email"
          />
          <button className="subscribe-btn" disabled={!email || !consent || status.state === 'loading'}>
            {status.state === 'loading' ? 'Submitting…' : 'Subscribe'}
          </button>
        </div>
        <label className="consent">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>I agree to receive occasional educational emails. I can unsubscribe anytime.</span>
        </label>
        {status.message && <div className={`status ${status.state}`}>{status.message}</div>}
      </form>
      {!compact && (
        <div className="legal-note">We store only what you provide. See Privacy in Contact for details.</div>
      )}
    </div>
  );
}
