/**
 * Private owner area: site-wide user list, stats, newsletter send (manual).
 * English UI (DEX policy). Auth: logged-in user + admin password (+ optional email allowlist).
 *
 * Legacy alignment with bits-ai.io /admin-test: same build-time env REACT_APP_ADMIN_PASS
 * (must match backend ADMIN_PASSWORD / ADMIN_PASS when calling APIs).
 */
import React, { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  RefreshCw,
  Send,
  Users,
  BarChart2,
  Mail,
  Eye,
  EyeOff,
  KeyRound,
  ArrowLeft,
} from 'lucide-react';
import { useDexAuth } from '../context/DexAuthContext';
import { getApiBaseUrl, API_ENDPOINTS } from '../../config/apiEndpoints.js';
import '../styles/components/site-admin-page.css';

/** Inlined at build; same pattern as frontend/src/Presale/Timer/logic/AdminPanel.js */
const REACT_APP_ADMIN_PASS =
  typeof process !== 'undefined' && process.env && process.env.REACT_APP_ADMIN_PASS
    ? String(process.env.REACT_APP_ADMIN_PASS).trim()
    : '';
if (process.env.NODE_ENV === 'production' && !REACT_APP_ADMIN_PASS) {
  console.error(
    '[SECURITY] REACT_APP_ADMIN_PASS is required in production for /dex-edu/site-admin (or type password manually). Same as legacy REACT_APP_ADMIN_PASS for /admin-test.'
  );
}

function parseAllowedEmailsFromEnv() {
  const raw = typeof process !== 'undefined' && process.env && process.env.REACT_APP_SITE_ADMIN_EMAILS
    ? String(process.env.REACT_APP_SITE_ADMIN_EMAILS).trim()
    : '';
  if (!raw) return [];
  return raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

function YesNoBadge({ ok }) {
  return (
    <span className={`site-admin-badge ${ok ? 'site-admin-badge-yes' : 'site-admin-badge-no'}`}>
      {ok ? 'yes' : 'no'}
    </span>
  );
}

export default function SiteAdminPage() {
  const { user } = useDexAuth();
  const actorEmail = user?.email || '';
  const actorUsername = user?.username || '';

  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 25;
  const [searchQ, setSearchQ] = useState('');
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState(null);

  const [emailSubject, setEmailSubject] = useState('Bits AI — update');
  const [emailHtml, setEmailHtml] = useState('<p>Hello,</p><p>Your message here.</p>');
  const [singleTo, setSingleTo] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState(null);

  const uiAllowed = useMemo(() => {
    const allowed = parseAllowedEmailsFromEnv();
    if (allowed.length === 0) return true;
    const e = (actorEmail || '').trim().toLowerCase();
    const u = (actorUsername || '').trim().toLowerCase();
    return allowed.some((token) => {
      if (token.includes('@')) {
        return !!e && e === token;
      }
      return !!u && u === token;
    });
  }, [actorEmail, actorUsername]);

  /** Typed password overrides build-time REACT_APP_ADMIN_PASS (same logic as legacy AdminPanel default). */
  const effectiveAdminPassword = useMemo(
    () => adminPassword.trim() || REACT_APP_ADMIN_PASS || '',
    [adminPassword]
  );

  const base = getApiBaseUrl();

  const postAdmin = useCallback(
    async (path, body) => {
      const res = await fetch(`${base}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errLabel = data.error || data.message || `HTTP ${res.status}`;
        const detail = data.details != null && String(data.details).trim() ? String(data.details).trim() : '';
        throw new Error(detail ? `${errLabel}: ${detail}` : errLabel);
      }
      return data;
    },
    [base]
  );

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    setError(null);
    try {
      const data = await postAdmin(API_ENDPOINTS.SITE_ADMIN_STATS, {
        password: effectiveAdminPassword,
        actorEmail,
        actorUsername: actorUsername || undefined,
      });
      setStats(data.stats || null);
    } catch (e) {
      setError(e.message);
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  }, [effectiveAdminPassword, actorEmail, actorUsername, postAdmin]);

  /**
   * @param {number} off
   * @param {{ qOverride?: string }} [opts] — if `qOverride` is set (e.g. `''`), it is used instead of `searchQ`
   *        so we can load all rows immediately after clearing the filter (avoids stale `searchQ` in the same tick).
   */
  const loadUsersAt = useCallback(
    async (off, opts) => {
      setLoadingUsers(true);
      setError(null);
      const rawQ = opts && Object.prototype.hasOwnProperty.call(opts, 'qOverride') ? opts.qOverride : searchQ;
      const qBody = String(rawQ ?? '').trim() || undefined;
      try {
        const data = await postAdmin(API_ENDPOINTS.SITE_ADMIN_USERS, {
          password: effectiveAdminPassword,
          actorEmail,
          actorUsername: actorUsername || undefined,
          limit,
          offset: off,
          q: qBody,
        });
        setUsers(data.users || []);
        setTotalUsers(typeof data.total === 'number' ? data.total : 0);
        setOffset(off);
      } catch (e) {
        setError(e.message);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    },
    [effectiveAdminPassword, actorEmail, actorUsername, searchQ, postAdmin]
  );

  const clearSearchAndLoadAll = useCallback(async () => {
    setSearchQ('');
    await loadUsersAt(0, { qOverride: '' });
  }, [loadUsersAt]);

  const sendBroadcast = async (dryRun) => {
    setEmailBusy(true);
    setEmailMsg(null);
    try {
      const data = await postAdmin('/email/admin/newsletter/broadcast', {
        password: effectiveAdminPassword,
        subject: emailSubject,
        htmlContent: emailHtml,
        dryRun: !!dryRun,
      });
      setEmailMsg(
        dryRun
          ? `Dry run: would send to ${data.recipientTotal} recipients.`
          : `Sent: ${data.sent}, failed: ${data.failed} (total ${data.recipientTotal}).`
      );
    } catch (e) {
      setEmailMsg(`Error: ${e.message}`);
    } finally {
      setEmailBusy(false);
    }
  };

  const sendOne = async () => {
    if (!singleTo.trim()) {
      setEmailMsg('Enter recipient email.');
      return;
    }
    setEmailBusy(true);
    setEmailMsg(null);
    try {
      const data = await postAdmin('/email/admin/newsletter/send-one', {
        password: effectiveAdminPassword,
        to: singleTo.trim(),
        subject: emailSubject,
        htmlContent: emailHtml,
      });
      setEmailMsg(data.messageId ? `Sent to ${singleTo} (${data.via || 'ok'}).` : 'Sent.');
    } catch (e) {
      setEmailMsg(`Error: ${e.message}`);
    } finally {
      setEmailBusy(false);
    }
  };

  if (!uiAllowed) {
    return (
      <div className="site-admin-wrap">
        <div className="site-admin-card site-admin-deny">
          <Shield size={32} aria-hidden />
          <h1>Access restricted</h1>
          <p>
            This URL is for site operators only. Your account is not listed in{' '}
            <code>REACT_APP_SITE_ADMIN_EMAILS</code> (email or username tokens, same as backend{' '}
            <code>SITE_ADMIN_ALLOWED_EMAILS</code>), or you are not logged in.
          </p>
          <Link to="/dex-edu/dashboard">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="site-admin-wrap">
      <header className="site-admin-header">
        <div className="site-admin-header-brand">
          <Shield className="site-admin-icon" size={28} aria-hidden />
          <div>
            <h1>Site admin</h1>
            <p className="site-admin-sub">
              Owner tools for <code>site_users</code>, stats, and newsletter. Do not record or share this screen.
            </p>
          </div>
        </div>
        <Link to="/dex-edu/dashboard" className="site-admin-back">
          <ArrowLeft size={16} aria-hidden /> Dashboard
        </Link>
      </header>

      <details className="site-admin-details">
        <summary className="site-admin-details-summary">
          <span className="site-admin-details-title">How login vs admin password works</span>
          <span className="site-admin-hint site-admin-details-hint">DEX account password ≠ API admin secret</span>
        </summary>
        <ol className="site-admin-help-list">
          <li>
            <strong>App login</strong> — email + user password (Profile). Normal account, not the admin API secret.
          </li>
          <li>
            <strong>This page</strong> — field below must match <code>ADMIN_PASSWORD</code> / <code>ADMIN_PASS</code> on
            the backend (Render). Build-time <code>REACT_APP_ADMIN_PASS</code> only applies after <code>npm run build</code>{' '}
            + deploy; otherwise type the secret here.
          </li>
        </ol>
        <p className="site-admin-hint">
          If <strong>Build secret</strong> shows <strong>off</strong>, type the admin password manually or rebuild with{' '}
          <code>REACT_APP_ADMIN_PASS</code>.
        </p>
      </details>

      {!actorEmail && !actorUsername && (
        <div className="site-admin-alert" role="status">
          Your session has <strong>no email and no username</strong>. Link an email or set a username in Profile, or log
          in with email/username so the API receives <code>actorEmail</code> / <code>actorUsername</code>. If the backend
          uses <code>SITE_ADMIN_ALLOWED_EMAILS</code>, your login email or username must be listed there.
        </div>
      )}

      <section className="site-admin-card site-admin-card-auth">
        <h2>
          <KeyRound size={18} aria-hidden /> Admin API password
        </h2>
        <p className="site-admin-section-lead">Required for all actions below. Must match backend admin env on Render.</p>
        <label className="site-admin-label">
          Password
          <div className="site-admin-password-row">
            <input
              type={showAdminPassword ? 'text' : 'password'}
              className="site-admin-input site-admin-password-input"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              autoComplete="off"
              placeholder={
                REACT_APP_ADMIN_PASS
                  ? 'Leave empty to use build-time REACT_APP_ADMIN_PASS'
                  : 'Type backend ADMIN_PASSWORD (or set REACT_APP_ADMIN_PASS at build)'
              }
            />
            <button
              type="button"
              className="site-admin-password-toggle"
              onClick={() => setShowAdminPassword((v) => !v)}
              aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
            >
              {showAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        <div className="site-admin-meta-row">
          <span className={`site-admin-chip ${REACT_APP_ADMIN_PASS ? 'site-admin-chip-on' : 'site-admin-chip-off'}`}>
            Build secret {REACT_APP_ADMIN_PASS ? 'on' : 'off'}
          </span>
          {actorEmail ? (
            <span className="site-admin-chip site-admin-chip-neutral" title="Actor email sent to API">
              {actorEmail}
            </span>
          ) : null}
          {actorUsername ? (
            <span className="site-admin-chip site-admin-chip-neutral" title="Actor username sent to API">
              @{actorUsername}
            </span>
          ) : null}
          {!actorEmail && !actorUsername ? (
            <span className="site-admin-chip site-admin-chip-warn">No actor email/username</span>
          ) : null}
        </div>
      </section>

      {error && (
        <div className="site-admin-alert" role="alert">
          {error}
        </div>
      )}

      <section className="site-admin-card">
        <div className="site-admin-card-head">
          <h2>
            <BarChart2 size={18} aria-hidden /> Statistics
          </h2>
          <p className="site-admin-section-lead">Snapshot from the database (same server as the API).</p>
        </div>
        <div className="site-admin-actions">
          <button
            type="button"
            className="site-admin-btn"
            disabled={loadingStats || !effectiveAdminPassword}
            onClick={loadStats}
          >
            <RefreshCw size={16} className={loadingStats ? 'site-admin-icon-spin' : undefined} aria-hidden />
            {loadingStats ? 'Loading…' : 'Refresh stats'}
          </button>
        </div>
        {stats && (
          <div className="site-admin-stat-grid" role="list">
            <div className="site-admin-stat-tile" role="listitem">
              <span className="site-admin-stat-label">Site users</span>
              <span className="site-admin-stat-value">{stats.siteUsersTotal}</span>
            </div>
            <div className="site-admin-stat-tile" role="listitem">
              <span className="site-admin-stat-label">Email verified</span>
              <span className="site-admin-stat-value">{stats.siteUsersEmailVerified}</span>
            </div>
            <div className="site-admin-stat-tile" role="listitem">
              <span className="site-admin-stat-label">Members</span>
              <span className="site-admin-stat-value">{stats.siteUsersMembers}</span>
            </div>
            <div className="site-admin-stat-tile" role="listitem">
              <span className="site-admin-stat-label">Newsletter (active)</span>
              <span className="site-admin-stat-value">{stats.newsletterSubscribersActive}</span>
            </div>
          </div>
        )}
      </section>

      <section className="site-admin-card">
        <div className="site-admin-card-head">
          <h2>
            <Users size={18} aria-hidden /> Users
          </h2>
          <p className="site-admin-section-lead">
            Table <code>site_users</code> — filter by substring on email, username, wallet, phone, or Telegram.
          </p>
        </div>
        <div className="site-admin-row">
          <input
            className="site-admin-input"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Filter (optional)…"
            aria-label="Filter users"
          />
          <button
            type="button"
            className="site-admin-btn"
            disabled={loadingUsers || !effectiveAdminPassword}
            onClick={() => loadUsersAt(0)}
          >
            <RefreshCw size={16} className={loadingUsers ? 'site-admin-icon-spin' : undefined} aria-hidden />
            {loadingUsers ? 'Loading…' : 'Apply & load'}
          </button>
          <button
            type="button"
            className="site-admin-btn site-admin-btn-secondary"
            disabled={loadingUsers || !effectiveAdminPassword}
            onClick={() => clearSearchAndLoadAll()}
          >
            Show all
          </button>
        </div>
        <div className="site-admin-toolbar-meta">
          <span>
            Page <strong>{Math.floor(offset / limit) + 1}</strong> /{' '}
            <strong>{Math.max(1, Math.ceil(totalUsers / limit) || 1)}</strong>
          </span>
          <span className="site-admin-toolbar-dot" aria-hidden />
          <span>
            <strong>{totalUsers}</strong> matching
          </span>
        </div>
        <div className="site-admin-table-wrap">
          <table className="site-admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Username</th>
                <th>Wallet</th>
                <th>Phone</th>
                <th title="Email verified (site_users.email_verified)">Verified</th>
                <th>Member</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && !loadingUsers && searchQ.trim() ? (
                <tr>
                  <td colSpan={8} className="site-admin-table-empty">
                    <strong>No rows match this filter.</strong>{' '}
                    {stats && stats.siteUsersTotal > 0 ? (
                      <>
                        Stats show <strong>{stats.siteUsersTotal}</strong> user(s) total — none contain &quot;
                        {searchQ.trim()}&quot;. Click <strong>Show all</strong>.
                      </>
                    ) : (
                      <>Try <strong>Show all</strong> or adjust the filter.</>
                    )}
                  </td>
                </tr>
              ) : (
                users.map((row) => (
                  <tr key={row.id}>
                    <td className="site-admin-td-id">{row.id}</td>
                    <td>{row.email || '—'}</td>
                    <td>{row.username || '—'}</td>
                    <td className="site-admin-mono site-admin-wallet-cell" title={row.wallet_address || undefined}>
                      {row.wallet_address || '—'}
                    </td>
                    <td>{row.phone || '—'}</td>
                    <td>
                      <YesNoBadge ok={!!row.email_verified} />
                    </td>
                    <td>
                      <YesNoBadge ok={!!row.is_member} />
                    </td>
                    <td className="site-admin-td-date">
                      {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="site-admin-pagination">
          <button
            type="button"
            className="site-admin-btn site-admin-btn-ghost"
            disabled={offset <= 0 || loadingUsers || !effectiveAdminPassword}
            onClick={() => loadUsersAt(Math.max(0, offset - limit))}
          >
            Previous
          </button>
          <button
            type="button"
            className="site-admin-btn site-admin-btn-ghost"
            disabled={loadingUsers || offset + limit >= totalUsers || !effectiveAdminPassword}
            onClick={() => loadUsersAt(offset + limit)}
          >
            Next
          </button>
        </div>
      </section>

      <section className="site-admin-card site-admin-card-newsletter">
        <div className="site-admin-card-head">
          <h2>
            <Mail size={18} aria-hidden /> Newsletter (HTML)
          </h2>
          <p className="site-admin-section-lead">
            Uses backend email routes; same admin password. Sending requires AWS SES env on the server (or Gmail SMTP
            fallback via <code>EMAIL_USER</code> / <code>EMAIL_PASSWORD</code>). If a send fails, the error message below
            includes the server <code>details</code> (e.g. SES sandbox / unverified address).
          </p>
        </div>
        <label className="site-admin-label">
          Subject
          <input
            className="site-admin-input"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
          />
        </label>
        <label className="site-admin-label">
          HTML body
          <textarea
            className="site-admin-textarea"
            rows={8}
            value={emailHtml}
            onChange={(e) => setEmailHtml(e.target.value)}
          />
        </label>
        <div className="site-admin-actions">
          <button
            type="button"
            className="site-admin-btn site-admin-btn-warn"
            disabled={emailBusy || !effectiveAdminPassword}
            onClick={() => sendBroadcast(true)}
          >
            Dry run (count only)
          </button>
          <button
            type="button"
            className="site-admin-btn site-admin-btn-primary"
            disabled={emailBusy || !effectiveAdminPassword}
            onClick={() => {
              if (!window.confirm('Send this HTML to ALL active newsletter subscribers?')) return;
              sendBroadcast(false);
            }}
          >
            <Send size={16} /> Broadcast to all subscribers
          </button>
        </div>
        <label className="site-admin-label">
          Single recipient email
          <input
            className="site-admin-input"
            value={singleTo}
            onChange={(e) => setSingleTo(e.target.value)}
            placeholder="one@address.com"
          />
        </label>
        <button type="button" className="site-admin-btn" disabled={emailBusy || !effectiveAdminPassword} onClick={sendOne}>
          Send to single address
        </button>
        {emailMsg && <p className="site-admin-msg">{emailMsg}</p>}
      </section>
    </div>
  );
}
