/**
 * Dashboard KPI normalization: OTA quota and tooltip source labels without UI hardcoding.
 * Backend (AITradingService.getQuota): exempt users receive isExempt: true and analysesLeft = 999999 as a "practically uncapped" sentinel.
 */

/** Inclusive threshold: at or above this value, UI displays "Unlimited", not the raw number. */
export const DASHBOARD_QUOTA_UNLIMITED_THRESHOLD = 999999;

/**
 * @param {unknown} otaQuota - obiect din getOTAQuota / useDashboardAggregate
 * @returns {{
 *   displayValue: string,
 *   hint: string,
 *   isUnlimited: boolean,
 *   rawNumeric: number | null,
 *   isExempt: boolean,
 * }}
 */
export function normalizeDashboardQuotaForDisplay(otaQuota) {
  if (otaQuota == null || typeof otaQuota !== 'object') {
    return {
      displayValue: '—',
      hint: 'Quota unavailable (no API response).',
      isUnlimited: false,
      rawNumeric: null,
      isExempt: false,
    };
  }

  const isExempt = Boolean(otaQuota.isExempt);
  const raw =
    otaQuota.analysesLeft != null
      ? otaQuota.analysesLeft
      : otaQuota.analyses_left != null
        ? otaQuota.analyses_left
        : null;

  if (raw === null || raw === undefined) {
    return {
      displayValue: '—',
      hint: 'analysesLeft field missing in response.',
      isUnlimited: false,
      rawNumeric: null,
      isExempt: false,
    };
  }

  const n = typeof raw === 'number' ? raw : Number(raw);

  if (isExempt || (Number.isFinite(n) && n >= DASHBOARD_QUOTA_UNLIMITED_THRESHOLD)) {
    return {
      displayValue: 'Unlimited',
      hint: isExempt
        ? 'Exempt user: no daily analysis cap (backend: isExempt). analysesLeft is a sentinel, not a remaining-count number.'
        : 'Value at or above the API contract "unlimited" threshold, displayed as Unlimited.',
      isUnlimited: true,
      rawNumeric: Number.isFinite(n) ? n : null,
      isExempt,
    };
  }

  if (!Number.isFinite(n)) {
    return {
      displayValue: String(raw),
      hint: 'Unexpected analysesLeft shape.',
      isUnlimited: false,
      rawNumeric: null,
      isExempt: false,
    };
  }

  const floored = Math.max(0, Math.floor(n));
  return {
    displayValue: String(floored),
    hint: `Analyses remaining today (raw numeric value: ${n}).`,
    isUnlimited: false,
    rawNumeric: n,
    isExempt: false,
  };
}

/**
 * Short product card footer label, without API paths.
 * @param {'native'|'vault'|'pnl'|'exposure'} kind
 * @param {string} [humanLine]
 */
export function formatDashboardHeroFooterLine(kind, humanLine) {
  const s = humanLine != null && String(humanLine).trim() !== '' ? String(humanLine).trim() : '';
  if (s) return s;
  switch (kind) {
    case 'native':
      return 'On-chain';
    case 'vault':
      return 'Vault';
    case 'pnl':
      return 'Estimate';
    case 'exposure':
      return 'Positions';
    default:
      return '';
  }
}
