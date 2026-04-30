/**
 * Contract GET /api/stripe/verify-session — mapare unică pentru UI (fără deducții fragile).
 * Backend: status business (success | pending | failed), paymentStatus, amount, amountMinor, metadata, ledger, follow-up.
 */

/** @typedef {'success'|'pending'|'failed'|'not_found'|'invalid_request'|'configuration_error'|'error'} VerifyBusinessStatus */

/**
 * @param {Record<string, unknown>} data
 * @param {{ httpOk?: boolean, httpStatus?: number }} [ctx]
 */
export function normalizeStripeVerifySession(data, ctx = {}) {
  const { httpOk = true, httpStatus = 200 } = ctx;
  if (!httpOk) {
    const code = data?.status;
    let businessStatus = 'error';
    if (httpStatus === 404 || code === 'not_found') businessStatus = 'not_found';
    else if (code === 'invalid_request') businessStatus = 'invalid_request';
    else if (code === 'configuration_error') businessStatus = 'configuration_error';
    return {
      ok: false,
      businessStatus,
      errorMessage: typeof data?.error === 'string' ? data.error : 'Request failed',
      raw: data,
    };
  }

  const d = data && typeof data === 'object' ? data : {};
  const paymentStatus = String(d.payment_status ?? d.paymentStatus ?? '');
  const paid = d.paid === true || paymentStatus === 'paid';
  const businessStatus = /** @type {VerifyBusinessStatus} */ (d.status || (paid ? 'success' : 'pending'));
  const purpose = String(d.purpose || (d.metadata && d.metadata.purpose) || '').trim();

  const checkoutStatus =
    d.checkout_status != null
      ? String(d.checkout_status)
      : d.checkoutStatus != null
        ? String(d.checkoutStatus)
        : '';

  return {
    ok: d.ok !== false,
    businessStatus,
    paymentStatus,
    checkoutStatus,
    purpose,
    sessionId: d.sessionId != null ? String(d.sessionId) : '',
    amount: pickAmountMajor(d),
    amountMinor: typeof d.amountMinor === 'number' ? d.amountMinor : null,
    chargeCurrency: d.chargeCurrency != null ? String(d.chargeCurrency) : (d.currency != null ? String(d.currency) : null),
    metadata: d.metadata && typeof d.metadata === 'object' ? { ...d.metadata } : null,
    ledgerCredited: !!(d.ledgerCredited ?? d.credited),
    fiatCreditOnly: !!d.fiatCreditOnly,
    leverageFollowUpRequired: !!d.leverageFollowUpRequired,
    tradeParams: d.tradeParams != null ? d.tradeParams : null,
    amountEur: d.amountEur != null ? Number(d.amountEur) : null,
    amountUsd: d.amountUsd != null ? Number(d.amountUsd) : null,
    currency: (d.currency != null ? String(d.currency) : 'eur').toLowerCase(),
    walletAddress: d.walletAddress != null ? String(d.walletAddress) : '',
    raw: d,
  };
}

/**
 * Sumă în unități majore: preferă `amount` din API; altfel amountMinor/100; altfel amountEur/Usd după currency.
 * @param {Record<string, unknown>} d
 */
export function pickAmountMajor(d) {
  if (d.amount != null && Number.isFinite(Number(d.amount))) return Number(d.amount);
  if (typeof d.amountMinor === 'number' && d.amountMinor >= 0) {
    const cur = (d.chargeCurrency || d.currency || 'eur').toString().toLowerCase();
    if (cur) return d.amountMinor / 100;
  }
  const c = (d.currency || 'eur').toString().toLowerCase();
  if (c === 'usd' && d.amountUsd != null && Number.isFinite(Number(d.amountUsd))) return Number(d.amountUsd);
  if (d.amountEur != null && Number.isFinite(Number(d.amountEur))) return Number(d.amountEur);
  if (d.amountUsd != null && Number.isFinite(Number(d.amountUsd))) return Number(d.amountUsd);
  return null;
}

/**
 * Text user-facing pentru sumă (EUR/USD) după contractul normalizat.
 * @param {ReturnType<typeof normalizeStripeVerifySession>} v
 */
export function formatVerifySessionAmountLabel(v) {
  if (v == null || v.ok === false) return '';
  const sym = v.currency === 'usd' ? '$' : '€';
  const n = v.amount;
  if (n != null && Number.isFinite(n)) return `${sym}${Number(n).toFixed(2)}`;
  const parts = [];
  if (v.amountEur != null && Number.isFinite(v.amountEur)) parts.push(`€${Number(v.amountEur).toFixed(2)}`);
  if (v.amountUsd != null && Number.isFinite(v.amountUsd)) parts.push(`$${Number(v.amountUsd).toFixed(2)}`);
  return parts.length ? parts.join(' · ') : '';
}
