/**
 * User complaints — POST /api/dex-edu-complaints (save + email to contact inbox, see backend dexComplaints).
 * Optional context: connected wallet + open-positions snapshot (same APIs as OTA chat live data).
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getApiBaseUrl, API_ENDPOINTS } from '../../config/apiEndpoints.js';
import { useDexAuth } from '../context/DexAuthContext';
import { useWallet } from '../../context/WalletContext.jsx';
import { fetchOpenPositionsAnalyticsBundle } from '../services/openPositionsAnalyticsLoader';
import OTALogo from '../components/ai-trading/OTALogo';
import '../styles/components/complaints-page.css';

/** Valid checksummed or lower-case EVM address (40 hex chars). */
function normalizeEvmAddress(addr) {
  if (addr == null || typeof addr !== 'string') return null;
  const s = addr.trim();
  return /^0x[a-fA-F0-9]{40}$/.test(s) ? s.toLowerCase() : null;
}

function buildClientHints() {
  if (typeof window === 'undefined') return {};
  try {
    return {
      pageUrl: window.location.href,
      referrer: typeof document !== 'undefined' && document.referrer ? document.referrer : undefined,
      documentTitle: typeof document !== 'undefined' && document.title ? document.title : undefined,
      /** Helps support email when server-side “page HTML fetch” returns empty for SPAs. */
      spaClientNote:
        'Single-page app: server HTML snapshot may be empty; use pageUrl, documentTitle, and image attachments.',
    };
  } catch {
    return {};
  }
}

const MAX_COMPLAINT_IMAGES = 4;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MiB each — keep JSON body within typical API limits
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function readImageFileAsAttachment(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== 'string') {
        reject(new Error('Could not read file'));
        return;
      }
      const comma = dataUrl.indexOf(',');
      const dataBase64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
      resolve({
        filename: String(file.name || 'screenshot').slice(0, 200),
        mimeType: file.type || 'application/octet-stream',
        dataBase64,
      });
    };
    reader.onerror = () => reject(reader.error || new Error('Read failed'));
    reader.readAsDataURL(file);
  });
}

function slimOpenPositionsContext([directEntry, costBasis, analytics]) {
  const positions = Array.isArray(analytics?.positions) ? analytics.positions : [];
  const slim = positions.slice(0, 40).map((p) => ({
    symbol: p.symbol ?? p.pair ?? null,
    side: p.side ?? null,
    size: p.size ?? p.quantity ?? null,
    entry: p.entryPrice ?? p.entry ?? null,
    pnlUsd: p.pnlUsd ?? p.unrealizedPnlUsd ?? null,
  }));
  return {
    directEntryCount: Array.isArray(directEntry) ? directEntry.length : 0,
    costBasisPositionCount: Array.isArray(costBasis?.positions) ? costBasis.positions.length : 0,
    analyticsSummary: analytics?.summary ?? null,
    positionsSample: slim,
  };
}

export default function ComplaintsPage() {
  const { user, associatedWalletAddress, connectedWalletAddress } = useDexAuth();
  const { isConnected, walletAddress, walletType } = useWallet();

  /**
   * Single SSOT for complaint + snapshot: prefer live connected EVM, then backend profile.
   * Do not require walletType === 'EVM' only — wagmi/DexAuth can hydrate in different order than the header.
   */
  const resolvedEvmWallet = useMemo(() => {
    if (walletType === 'SOLANA') {
      return null;
    }
    const fromUi =
      normalizeEvmAddress(connectedWalletAddress) ||
      (isConnected && walletAddress ? normalizeEvmAddress(walletAddress) : null) ||
      (walletType === 'EVM' && walletAddress ? normalizeEvmAddress(walletAddress) : null);
    const fromProfile =
      normalizeEvmAddress(user?.walletAddress) || normalizeEvmAddress(associatedWalletAddress);
    return fromUi || fromProfile || null;
  }, [
    walletType,
    connectedWalletAddress,
    isConnected,
    walletAddress,
    user?.walletAddress,
    associatedWalletAddress,
  ]);

  const [subject, setSubject] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [contextPayload, setContextPayload] = useState(null);
  const [loadingCtx, setLoadingCtx] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  /** { id: string, file: File, previewUrl: string }[] */
  const [attachmentItems, setAttachmentItems] = useState([]);

  useEffect(() => {
    if (user?.email && !contactEmail) setContactEmail(user.email);
  }, [user?.email, contactEmail]);

  const buildSnapshotPayload = useCallback(async () => {
    const w = resolvedEvmWallet;
    const hints = buildClientHints();
    if (!w) {
      return {
        note: 'No EVM wallet address available for snapshot.',
        ...hints,
      };
    }
    try {
      const bundle = await fetchOpenPositionsAnalyticsBundle(w);
      return {
        walletAddress: w,
        capturedAt: new Date().toISOString(),
        openPositions: slimOpenPositionsContext(bundle),
        ...hints,
      };
    } catch (e) {
      return {
        walletAddress: w,
        capturedAt: new Date().toISOString(),
        captureError: e?.message || String(e),
        ...hints,
      };
    }
  }, [resolvedEvmWallet]);

  const loadContext = useCallback(async () => {
    setLoadingCtx(true);
    try {
      const payload = await buildSnapshotPayload();
      setContextPayload(payload);
    } finally {
      setLoadingCtx(false);
    }
  }, [buildSnapshotPayload]);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  const onPickImages = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setError(null);
    setAttachmentItems((prev) => {
      const next = [...prev];
      for (const file of files) {
        if (next.length >= MAX_COMPLAINT_IMAGES) break;
        if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
          setError('Only JPEG, PNG, WebP, or GIF images are allowed.');
          continue;
        }
        if (file.size > MAX_IMAGE_BYTES) {
          setError(`Each image must be at most ${MAX_IMAGE_BYTES / (1024 * 1024)} MB.`);
          continue;
        }
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const previewUrl = URL.createObjectURL(file);
        next.push({ id, file, previewUrl });
      }
      return next;
    });
  };

  const removeAttachment = (id) => {
    setAttachmentItems((prev) => {
      const it = prev.find((x) => x.id === id);
      if (it) {
        try {
          URL.revokeObjectURL(it.previewUrl);
        } catch {
          /* ignore */
        }
      }
      return prev.filter((x) => x.id !== id);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = (message || '').trim();
    if (!text || submitting) return;
    setSubmitting(true);
    setError(null);
    setStatus(null);
    try {
      // Always rebuild snapshot at submit so email/backend never get a stale "no wallet" context
      // when the UI already shows a connected address (hydration race on first paint).
      const freshContext = await buildSnapshotPayload();
      setContextPayload(freshContext);

      let attachmentsPayload;
      if (attachmentItems.length > 0) {
        attachmentsPayload = await Promise.all(
          attachmentItems.map((it) => readImageFileAsAttachment(it.file))
        );
      }

      const url = `${getApiBaseUrl().replace(/\/$/, '')}${API_ENDPOINTS.DEX_COMPLAINTS}`;
      const body = {
        message: text,
        subject: subject.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        walletAddress: resolvedEvmWallet || undefined,
        context: freshContext,
        ...(attachmentsPayload && attachmentsPayload.length > 0 ? { attachments: attachmentsPayload } : {}),
      };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail =
          data.details != null
            ? ` ${typeof data.details === 'string' ? data.details : JSON.stringify(data.details)}`
            : '';
        throw new Error((data.error || data.message || `HTTP ${res.status}`) + detail);
      }
      const n = typeof data.attachmentsReceived === 'number' ? data.attachmentsReceived : 0;
      const prov = data.provider ? String(data.provider) : '';
      const attachLine =
        attachmentItems.length > 0
          ? n >= attachmentItems.length
            ? ` ${n} screenshot(s) received by support${prov ? ` (${prov})` : ''}.`
            : ` Warning: expected ${attachmentItems.length} image(s); server reported ${n}.`
          : '';
      setStatus(
        data.warning
          ? `Saved. ${data.warning}${attachLine}`
          : `Thank you. Your complaint was received.${attachLine}`
      );
      setMessage('');
      setSubject('');
      setAttachmentItems((prev) => {
        prev.forEach((it) => {
          try {
            URL.revokeObjectURL(it.previewUrl);
          } catch {
            /* ignore */
          }
        });
        return [];
      });
    } catch (err) {
      setError(err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="complaints-page">
      <header className="complaints-page__header">
        <div className="complaints-page__brand">
          <div className="complaints-page__brand-logo" aria-hidden="true">
            <OTALogo size="xl" className="complaints-page__ota-logo" />
          </div>
          <div className="complaints-page__brand-text">
            <h1 className="complaints-page__title">OTA AI $BITS</h1>
            <p className="complaints-page__subtitle">Complaints & feedback</p>
          </div>
        </div>
        <p className="complaints-page__lead">
          Describe your issue. We attach your connected wallet (if any), a snapshot of open-position data,
          and optional screenshots. Submissions are stored and sent to support by email.
        </p>
        <Link to="/dex-edu/dashboard" className="complaints-page__back">
          ← Back to dashboard
        </Link>
      </header>

      <section className="complaints-page__panel" aria-labelledby="complaints-form-title">
        <h2 id="complaints-form-title" className="complaints-page__h2">
          Submit a complaint
        </h2>

        <div className="complaints-page__meta">
          <div>
            <span className="complaints-page__label">Wallet (EVM)</span>
            <code className="complaints-page__code">{resolvedEvmWallet || '—'}</code>
          </div>
          <div>
            <span className="complaints-page__label">Wallet connected in UI</span>
            <span>{isConnected && walletAddress ? `${walletType}: ${walletAddress}` : '—'}</span>
          </div>
          <div>
            <button type="button" className="complaints-page__btn-secondary" onClick={loadContext} disabled={loadingCtx}>
              {loadingCtx ? 'Refreshing context…' : 'Refresh open-positions context'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="complaints-page__form">
          <label className="complaints-page__field">
            <span>Subject (optional)</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={500}
              placeholder="Short summary"
              autoComplete="off"
            />
          </label>
          <label className="complaints-page__field">
            <span>Your email (optional, for follow-up)</span>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
          <label className="complaints-page__field">
            <span>Message (required)</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              required
              minLength={1}
              maxLength={12000}
              placeholder="What went wrong? What did you expect?"
            />
          </label>

          <div className="complaints-page__attachments">
            <span className="complaints-page__field-label">Screenshots (optional)</span>
            <p className="complaints-page__attachments-hint">
              Up to {MAX_COMPLAINT_IMAGES} images (JPEG, PNG, WebP, GIF), max {MAX_IMAGE_BYTES / (1024 * 1024)} MB each.
              On iPhone, pick Photos that are JPEG/PNG — HEIC files are not accepted here.
            </p>
            <input
              id="complaints-images-input"
              className="complaints-page__file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={onPickImages}
            />
            <label htmlFor="complaints-images-input" className="complaints-page__file-label">
              Add images
            </label>
            {attachmentItems.length > 0 ? (
              <ul className="complaints-page__thumb-list" aria-label="Attached images">
                {attachmentItems.map((it) => (
                  <li key={it.id} className="complaints-page__thumb-item">
                    <img src={it.previewUrl} alt="" className="complaints-page__thumb-img" />
                    <button
                      type="button"
                      className="complaints-page__thumb-remove"
                      onClick={() => removeAttachment(it.id)}
                      aria-label="Remove image"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <button type="submit" className="complaints-page__submit" disabled={submitting || !message.trim()}>
            {submitting ? 'Sending…' : 'Send complaint'}
          </button>
        </form>

        {status ? (
          <p className="complaints-page__ok" role="status">
            {status}
          </p>
        ) : null}
        {error ? (
          <p className="complaints-page__err" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      <section className="complaints-page__hint" aria-label="OTA chat note">
        <p>
          In <Link to="/dex-edu/ota/chat">OTA Chat</Link>, answers about open positions and your wallet use the same live
          data snapshot (<strong>USER LIVE DATA</strong> in the model context) when your wallet is available.
        </p>
      </section>
    </div>
  );
}
