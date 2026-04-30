/**
 * Newsletter educațional legat de contul DEX: același endpoint ca backend-ul principal,
 * sursă `dex_personal_account` în `newsletter_subscribers`, email din profil când există.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useDexAuth } from '../../context/DexAuthContext';
import NewsletterSignup from '../../../../NewsletterSignup';

/**
 * @param {{ walletAddress?: string | null }} props
 */
export default function DexNewsletterSection({ walletAddress = null }) {
  const { isAuthenticated, user } = useDexAuth();
  if (!isAuthenticated) return null;

  const email = (user?.email || '').trim();

  return (
    <section
      className="personal-account-section personal-account-section--communications"
      aria-label="Education newsletter"
    >
      <h2 className="personal-account-section-title">
        <Mail size={20} aria-hidden />
        Education newsletter
      </h2>
      <p className="personal-account-page-muted" style={{ marginBottom: 12 }}>
        Same mailing list as <strong>edu.bits-ai.io</strong>. Subscriptions are stored on the server (PostgreSQL{' '}
        <code style={{ fontSize: 12 }}>newsletter_subscribers</code>), not only in the browser. Use your account email
        when it is set in{' '}
        <Link to="/dex-edu/profile" className="personal-account-page-link">
          Profile
        </Link>
        .
      </p>
      {!email ? (
        <p className="personal-account-page-muted" style={{ marginBottom: 12, fontSize: 13 }}>
          No email on this account yet — enter any address below or add one in Profile to lock it to your login.
        </p>
      ) : null}
      <div className="personal-account-newsletter-wrap">
        <NewsletterSignup
          compact
          hideTitle
          source="dex_personal_account"
          initialEmail={email}
          lockEmail={Boolean(email)}
          dexUserId={user?.id != null ? String(user.id) : undefined}
          walletHint={walletAddress ? `${String(walletAddress).slice(0, 6)}…${String(walletAddress).slice(-4)}` : undefined}
        />
      </div>
      <p className="personal-account-page-muted" style={{ marginTop: 10, fontSize: 12 }}>
        Unsubscribe:{' '}
        <Link to="/unsubscribe" className="personal-account-page-link">
          /unsubscribe
        </Link>{' '}
        (link also on the main education site footer).
      </p>
    </section>
  );
}
