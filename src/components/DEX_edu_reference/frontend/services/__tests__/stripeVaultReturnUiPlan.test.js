import { normalizeStripeVerifySession } from '../stripeVerifySessionContract';
import {
  planStripeVaultReturnUx,
  planStripeVaultReturnMissingSessionId,
  planStripeVaultReturnNetworkError,
} from '../stripeVaultReturnUiPlan';

describe('planStripeVaultReturnUx', () => {
  test('HTTP not_found → warning + refresh', () => {
    const v = normalizeStripeVerifySession(
      { ok: false, status: 'not_found', error: 'x' },
      { httpOk: false, httpStatus: 404 },
    );
    const plan = planStripeVaultReturnUx(v, {});
    expect(plan.error).toBe(true);
    expect(plan.toasts[0].type).toBe('warning');
    expect(plan.toasts[0].message.toLowerCase()).toContain('personal account');
    expect(plan.toasts[0].requestRefresh).toBe(true);
  });

  test('failed + checkout_status expired → mesaj expirat', () => {
    const v = normalizeStripeVerifySession({
      ok: true,
      status: 'failed',
      paid: false,
      paymentStatus: 'unpaid',
      checkout_status: 'expired',
      sessionId: 'cs_1',
    });
    const plan = planStripeVaultReturnUx(v, { legacyPaid: false, paidOk: false });
    expect(plan.error).toBeFalsy();
    expect(plan.toasts[0].message.toLowerCase()).toContain('expired');
  });

  test('pending unpaid → info, nu success', () => {
    const v = normalizeStripeVerifySession({
      ok: true,
      status: 'pending',
      paid: false,
      paymentStatus: 'unpaid',
      sessionId: 'cs_1',
    });
    const plan = planStripeVaultReturnUx(v, { legacyPaid: false, paidOk: false });
    expect(plan.toasts[0].type).toBe('info');
    expect(plan.toasts[0].message.toLowerCase()).toContain('processing');
  });

  test('vault_fund success → card balance wording', () => {
    const v = normalizeStripeVerifySession({
      ok: true,
      status: 'success',
      paid: true,
      paymentStatus: 'paid',
      purpose: 'vault_fund',
      amount: 25,
      currency: 'eur',
      ledgerCredited: true,
      sessionId: 'cs_1',
    });
    const plan = planStripeVaultReturnUx(v, { legacyPaid: true, paidOk: true });
    expect(plan.toasts[0].type).toBe('success');
    expect(plan.toasts[0].message.toLowerCase()).toContain('card balance');
  });

  test('leverage_fiat_open + ledger + tradeParams → leverageCallback + no auto-open în mesaj', () => {
    const v = normalizeStripeVerifySession({
      ok: true,
      status: 'success',
      paid: true,
      paymentStatus: 'paid',
      purpose: 'leverage_fiat_open',
      amount: 50,
      currency: 'eur',
      ledgerCredited: true,
      leverageFollowUpRequired: true,
      tradeParams: { tradeType: 'cfd', assetId: 1 },
      sessionId: 'cs_1',
    });
    const plan = planStripeVaultReturnUx(v, { legacyPaid: true, paidOk: true });
    expect(plan.leverageCallback).toBe(true);
    expect(plan.toasts[0].message.toLowerCase()).toContain('automatic');
  });

  test('leverage_fiat_open fără tradeParams dar credited → fără leverageCallback', () => {
    const v = normalizeStripeVerifySession({
      ok: true,
      status: 'success',
      paid: true,
      purpose: 'leverage_fiat_open',
      ledgerCredited: true,
      leverageFollowUpRequired: false,
      tradeParams: null,
      sessionId: 'cs_1',
    });
    const plan = planStripeVaultReturnUx(v, { legacyPaid: true, paidOk: true });
    expect(plan.leverageCallback).toBe(false);
    expect(plan.toasts[0].message.toLowerCase()).toContain('automatic');
  });
});

describe('planStripeVaultReturnMissingSessionId / NetworkError', () => {
  test('missing session_id → info', () => {
    const p = planStripeVaultReturnMissingSessionId();
    expect(p.type).toBe('info');
    expect(p.requestRefresh).toBe(true);
  });

  test('network error → warning, nu success', () => {
    const p = planStripeVaultReturnNetworkError();
    expect(p.type).toBe('warning');
    expect(p.message.toLowerCase()).not.toContain('likely');
  });
});
