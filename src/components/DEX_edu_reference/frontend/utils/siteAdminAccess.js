const SITE_ADMIN_SESSION_KEY = 'bits_site_admin_validated_v1';
const SITE_ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const DEFAULT_SITE_ADMIN_IDENTITIES = [
  'cezarp',
  'dcalin95',
  'cezarp@hotmail.com',
  'dcalin95@gmail.com',
];

export function parseSiteAdminAllowedIdentities() {
  const raw =
    typeof process !== 'undefined' && process.env && process.env.REACT_APP_SITE_ADMIN_EMAILS
      ? String(process.env.REACT_APP_SITE_ADMIN_EMAILS).trim()
      : '';
  const envTokens = raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set([...DEFAULT_SITE_ADMIN_IDENTITIES, ...envTokens]));
}

export function getSiteAdminActorKey(user) {
  const email = String(user?.email || '').trim().toLowerCase();
  const username = String(user?.username || '').trim().toLowerCase();
  return email || username || '';
}

export function isSiteAdminAllowlisted(user) {
  const allowed = parseSiteAdminAllowedIdentities();
  if (allowed.length === 0) return false;
  const email = String(user?.email || '').trim().toLowerCase();
  const username = String(user?.username || '').trim().toLowerCase();
  return allowed.some((token) => {
    if (token.includes('@')) return !!email && email === token;
    return !!username && username === token;
  });
}

export function getSiteAdminIdentityStatus(user) {
  const email = String(user?.email || '').trim().toLowerCase();
  const username = String(user?.username || '').trim().toLowerCase();
  const allowed = parseSiteAdminAllowedIdentities();
  const matched = allowed.find((token) => {
    if (token.includes('@')) return !!email && email === token;
    return !!username && username === token;
  });
  if (matched) {
    return {
      isAdmin: true,
      actorLabel: matched.includes('@') ? matched : `@${matched}`,
      matched,
      missingIdentity: false,
    };
  }
  return {
    isAdmin: false,
    actorLabel: email || (username ? `@${username}` : ''),
    matched: '',
    missingIdentity: !email && !username,
  };
}

export function hasValidatedSiteAdminSession(user) {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  const actorKey = getSiteAdminActorKey(user);
  if (!actorKey) return false;
  try {
    const raw = window.localStorage.getItem(SITE_ADMIN_SESSION_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.actorKey !== actorKey || !parsed.validatedAt) return false;
    return Date.now() - Number(parsed.validatedAt) <= SITE_ADMIN_SESSION_TTL_MS;
  } catch (_) {
    return false;
  }
}

export function rememberValidatedSiteAdminSession(user) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const actorKey = getSiteAdminActorKey(user);
  if (!actorKey) return;
  try {
    window.localStorage.setItem(
      SITE_ADMIN_SESSION_KEY,
      JSON.stringify({ actorKey, validatedAt: Date.now() })
    );
  } catch (_) {
    // localStorage can be unavailable in strict privacy modes.
  }
}

export function clearValidatedSiteAdminSession() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(SITE_ADMIN_SESSION_KEY);
  } catch (_) {
    // ignore
  }
}

export function shouldShowSiteAdminEntry(user) {
  return isSiteAdminAllowlisted(user);
}
