/**
 * Etichete user-facing pentru statusuri retragere FIAT (backend stripe_vault_withdrawals).
 * Nu implică payout automat — vezi docs/FIAT_BANK_WITHDRAWAL_MODEL.md.
 */

const LABELS = {
  queued: 'Queued for processing',
  requested: 'Requested',
  pending: 'Pending',
  processing: 'Processing',
  manual_review: 'Under review',
  completed: 'Completed',
  paid: 'Paid out',
  failed: 'Failed',
  cancelled: 'Cancelled',
  validation_failed: 'Not accepted',
  rejected: 'Rejected',
};

/**
 * @param {string|null|undefined} status
 * @returns {string}
 */
export function formatFiatWithdrawalStatusLabel(status) {
  const s = String(status || '').toLowerCase();
  return LABELS[s] || (s ? s.replace(/_/g, ' ') : 'Unknown');
}

/**
 * @param {{ status?: string, failure_reason?: string, processor_note?: string }} row
 * @returns {string|null}
 */
export function fiatWithdrawalDetailLine(row) {
  if (!row) return null;
  if (row.failure_reason) return String(row.failure_reason);
  if (row.processor_note) return String(row.processor_note);
  return null;
}
