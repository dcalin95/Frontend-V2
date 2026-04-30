/**
 * Timestamps for OTA analysis cards (LONG/SHORT).
 *
 * UI ORDER: displayed time = **only the row generation date/time** from API (`created_at` / `createdAt`).
 * Not `analyzed_at`, `timestamp`, `updated_at`, `executed_at`; those can be newer and misleading.
 *
 * Feed sorting / dedupe: `pickAnalysisEventEpochMs` (same meaning as display).
 */

/** Row "last touch" time; only for legacy cases that require max across all fields. */
const SIGNAL_RECENCY_FIELDS = [
  'created_at',
  'createdAt',
  'timestamp',
  'updated_at',
  'updatedAt',
  'analyzed_at',
  'analyzedAt',
  'executed_at',
  'executedAt',
];

/** Strict: analysis registration in DB / API (generation). */
const ANALYSIS_GENERATION_TIME_FIELDS = ['created_at', 'createdAt'];

/** Epoch ms (maximum across all fields); avoid for UI generation time. */
export function pickSignalRecencyEpochMs(sig) {
  if (!sig || typeof sig !== 'object') return 0;
  let best = 0;
  for (const k of SIGNAL_RECENCY_FIELDS) {
    const raw = sig[k];
    if (raw == null || raw === '') continue;
    const t = new Date(raw).getTime();
    if (Number.isFinite(t) && t > best) best = t;
  }
  return best;
}

/** Epoch ms at **analysis generation** (created_at), for UI-aligned sort/dedupe. */
export function pickAnalysisEventEpochMs(sig) {
  if (!sig || typeof sig !== 'object') return 0;
  for (const k of ANALYSIS_GENERATION_TIME_FIELDS) {
    const raw = sig[k];
    if (raw == null || raw === '') continue;
    const t = new Date(raw).getTime();
    if (Number.isFinite(t) && t > 0) return t;
  }
  return 0;
}

export function pickAnalysisInstant(sig) {
  const ms = pickAnalysisEventEpochMs(sig);
  if (ms <= 0) return null;
  return new Date(ms);
}

export function fmtOtaAnalysisDateTimeFull(instant) {
  if (!instant) return '—';
  return instant.toLocaleString('ro-RO', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/** DEX UI: absolute generation time (local browser TZ), English. */
export function fmtOtaAnalysisDateTimeFullEn(instant) {
  if (!instant) return '—';
  return instant.toLocaleString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/** Accent by age (ms from generation to `now`); only for color, not "ago" text. */
export function analysisAgeAccentMs(ageMs) {
  if (!Number.isFinite(ageMs) || ageMs < 0) return '#38bdf8';
  if (ageMs < 5 * 60 * 1000) return '#4ade80';
  if (ageMs < 60 * 60 * 1000) return '#38bdf8';
  if (ageMs < 24 * 60 * 60 * 1000) return '#fbbf24';
  return '#fb7185';
}

/** Below this duration, show total hours (+ minutes), not "X days", so "99 hours" is possible. */
const ELAPSED_HOURS_MAX_BEFORE_DAYS = 168;

/**
 * Elapsed timer from generation time (`created_at`), updated with `nowMs`.
 */
export function formatGeneratCronometruRo(instant, nowMs) {
  if (!instant) return '—';
  const diff = Math.max(0, nowMs - instant.getTime());
  const secTotal = Math.floor(diff / 1000);

  if (secTotal < 60) {
    if (secTotal <= 0) return 'Generated just now';
    if (secTotal === 1) return 'Generated 1 second ago';
    return `Generated ${secTotal} seconds ago`;
  }

  const minTotal = Math.floor(secTotal / 60);
  if (minTotal < 60) {
    if (minTotal === 1) return 'Generated 1 minute ago';
    return `Generated ${minTotal} minutes ago`;
  }

  const hTotal = Math.floor(secTotal / 3600);
  const remMin = Math.floor((secTotal % 3600) / 60);

  if (hTotal < ELAPSED_HOURS_MAX_BEFORE_DAYS) {
    const hourStr = hTotal === 1 ? '1 hour' : `${hTotal} hours`;
    if (remMin === 0) return `Generated ${hourStr} ago`;
    const minStr = remMin === 1 ? '1 minute' : `${remMin} minutes`;
    return `Generated ${hourStr} and ${minStr} ago`;
  }

  const days = Math.floor(secTotal / 86400);
  const remAfterDays = secTotal % 86400;
  const hRem = Math.floor(remAfterDays / 3600);
  const mRem = Math.floor((remAfterDays % 3600) / 60);
  const dayStr = days === 1 ? '1 day' : `${days} days`;
  const parts = [dayStr];
  if (hRem > 0) parts.push(hRem === 1 ? '1 hour' : `${hRem} hours`);
  if (mRem > 0) parts.push(mRem === 1 ? '1 minute' : `${mRem} minutes`);
  if (parts.length === 1) return `Generated ${dayStr} ago`;
  return `Generated ${parts.join(' and ')} ago`;
}

/** @deprecated Prefer `formatGeneratCronometruRo` for UI. */
export function formatOtaAnalysisElapsed(instant, nowMs) {
  return formatGeneratCronometruRo(instant, nowMs);
}

/** Same window as RO: show hours+minutes until 7 days, then days. DEX UI (English). */
const GENERATED_RELATIVE_HOURS_CAP = 168;

/**
 * Relative time since generation (`created_at`) — DEX: "Generated … ago".
 */
export function formatGeneratedRelativeEn(instant, nowMs) {
  if (!instant) return '—';
  const diff = Math.max(0, nowMs - instant.getTime());
  const secTotal = Math.floor(diff / 1000);

  if (secTotal < 60) {
    if (secTotal <= 0) return 'Just generated';
    if (secTotal === 1) return 'Generated 1 second ago';
    return `Generated ${secTotal} seconds ago`;
  }

  const minTotal = Math.floor(secTotal / 60);
  if (minTotal < 60) {
    if (minTotal === 1) return 'Generated 1 minute ago';
    return `Generated ${minTotal} minutes ago`;
  }

  const hTotal = Math.floor(secTotal / 3600);
  const remMin = Math.floor((secTotal % 3600) / 60);

  if (hTotal < GENERATED_RELATIVE_HOURS_CAP) {
    if (remMin === 0) {
      return hTotal === 1 ? 'Generated 1 hour ago' : `Generated ${hTotal} hours ago`;
    }
    const minPhrase = remMin === 1 ? '1 minute' : `${remMin} minutes`;
    return hTotal === 1
      ? `Generated 1 hour and ${minPhrase} ago`
      : `Generated ${hTotal} hours and ${minPhrase} ago`;
  }

  const days = Math.floor(secTotal / 86400);
  const remAfterDays = secTotal % 86400;
  const hRem = Math.floor(remAfterDays / 3600);
  const mRem = Math.floor((remAfterDays % 3600) / 60);
  const dayPart = days === 1 ? '1 day' : `${days} days`;
  const parts = [dayPart];
  if (hRem > 0) parts.push(hRem === 1 ? '1 hour' : `${hRem} hours`);
  if (mRem > 0) parts.push(mRem === 1 ? '1 minute' : `${mRem} minutes`);
  if (parts.length === 1) return `Generated ${dayPart} ago`;
  return `Generated ${parts.join(', ')} ago`;
}
