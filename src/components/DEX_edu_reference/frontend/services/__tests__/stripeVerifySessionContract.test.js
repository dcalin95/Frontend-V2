import {
  normalizeStripeVerifySession,
  formatVerifySessionAmountLabel,
  pickAmountMajor,
} from '../stripeVerifySessionContract';

describe('normalizeStripeVerifySession', () => {
  test('HTTP 404 → not_found', () => {
    const v = normalizeStripeVerifySession(
      { ok: false, status: 'not_found', error: 'missing' },
      { httpOk: false, httpStatus: 404 }
    );
    expect(v.ok).toBe(false);
    expect(v.businessStatus).toBe('not_found');
  });

  test('success vault_fund + amount + metadata + ledger', () => {
    const v = normalizeStripeVerifySession({
      ok: true,
      status: 'success',
      paid: true,
      paymentStatus: 'paid',
      sessionId: 'cs_1',
      purpose: 'vault_fund',
      amount: 50,
      amountMinor: 5000,
      chargeCurrency: 'eur',
      metadata: { purpose: 'vault_fund', walletAddress: '0xabc' },
      ledgerCredited: true,
      fiatCreditOnly: true,
      leverageFollowUpRequired: false,
      tradeParams: null,
      currency: 'eur',
      amountEur: 50,
      amountUsd: 54,
    });
    expect(v.ok).toBe(true);
    expect(v.businessStatus).toBe('success');
    expect(v.purpose).toBe('vault_fund');
    expect(v.amount).toBe(50);
    expect(v.metadata?.walletAddress).toBe('0xabc');
    expect(v.ledgerCredited).toBe(true);
    expect(formatVerifySessionAmountLabel(v)).toContain('€50.00');
  });

  test('leverage_fiat_open + leverageFollowUpRequired + tradeParams', () => {
    const v = normalizeStripeVerifySession({
      ok: true,
      status: 'success',
      paid: true,
      paymentStatus: 'paid',
      purpose: 'leverage_fiat_open',
      amount: 100,
      amountMinor: 10000,
      chargeCurrency: 'eur',
      metadata: { purpose: 'leverage_fiat_open', tradeParams: '{}' },
      ledgerCredited: true,
      fiatCreditOnly: false,
      leverageFollowUpRequired: true,
      tradeParams: { tradeType: 'cfd', assetId: 1 },
      currency: 'eur',
    });
    expect(v.leverageFollowUpRequired).toBe(true);
    expect(v.tradeParams?.tradeType).toBe('cfd');
    expect(v.ledgerCredited).toBe(true);
  });

  test('pending unpaid', () => {
    const v = normalizeStripeVerifySession({
      ok: true,
      status: 'pending',
      paid: false,
      paymentStatus: 'unpaid',
      sessionId: 'cs_x',
      amount: 50,
      amountMinor: 5000,
      chargeCurrency: 'eur',
    });
    expect(v.businessStatus).toBe('pending');
  });

  test('checkout_status din API', () => {
    const v = normalizeStripeVerifySession({
      ok: true,
      status: 'failed',
      checkout_status: 'expired',
      sessionId: 'cs_e',
    });
    expect(v.checkoutStatus).toBe('expired');
  });

  test('pickAmountMajor fallback from amountMinor', () => {
    const n = pickAmountMajor({
      amountMinor: 2500,
      chargeCurrency: 'usd',
      currency: 'usd',
    });
    expect(n).toBe(25);
  });
});
