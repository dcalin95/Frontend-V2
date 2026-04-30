import { normalizeConvertQuote, normalizeConvertOrderResponse } from '../fiatConvertService';

describe('normalizeConvertQuote', () => {
  test('maps explicit API fields (BNB path)', () => {
    const q = normalizeConvertQuote({
      ok: true,
      inputAmount: 100,
      inputCurrency: 'eur',
      targetToken: 'bnb',
      estimatedOutput: 0.12,
      estimatedOutputFormatted: '0.120000',
      rateBnbUsd: 600,
      spreadMultiplier: 0.995,
      spreadFeeApproxUsd: 2.5,
      amountUsdNet: 500,
      executionAvailable: true,
    });
    expect(q.inputAmount).toBe(100);
    expect(q.targetToken).toBe('bnb');
    expect(q.rateBnbUsd).toBe(600);
    expect(q.executionAvailable).toBe(true);
  });

  test('USDT → executionAvailable din API (false când kill-switch)', () => {
    const q = normalizeConvertQuote({
      ok: true,
      inputAmount: 50,
      inputCurrency: 'eur',
      targetToken: 'usdt',
      estimatedOutputFormatted: '48.00',
      executionAvailable: false,
      executionUnavailableReason: 'USDT conversion is temporarily disabled.',
    });
    expect(q.targetToken).toBe('usdt');
    expect(q.executionAvailable).toBe(false);
    expect(q.executionUnavailableReason).toMatch(/USDT|disabled/i);
  });

  test('USDT → executionAvailable true + usdtExecution din API', () => {
    const q = normalizeConvertQuote({
      ok: true,
      targetToken: 'usdt',
      executionAvailable: true,
      usdtExecution: { destinationType: 'user_bsc_wallet', notUserVault: true, chain: 'bsc' },
    });
    expect(q.executionAvailable).toBe(true);
    expect(q.usdtExecution?.notUserVault).toBe(true);
    expect(q.usdtExecution?.chain).toBe('bsc');
  });

  test('legacy aliases amountFiat / bnbPriceUsd', () => {
    const q = normalizeConvertQuote({
      ok: true,
      amountFiat: 20,
      currency: 'usd',
      tokenOut: 'bnb',
      amountOut: 0.03,
      amountOutFormatted: '0.030000',
      bnbPriceUsd: 700,
      executionAvailable: true,
    });
    expect(q.inputAmount).toBe(20);
    expect(q.rateBnbUsd).toBe(700);
  });

  test('bnbExecution din API (relayer → wallet, nu vault)', () => {
    const q = normalizeConvertQuote({
      ok: true,
      tokenOut: 'bnb',
      bnbExecution: { destinationType: 'user_bsc_wallet', notUserVault: true },
    });
    expect(q.bnbExecution?.notUserVault).toBe(true);
    expect(q.bnbExecution?.destinationType).toBe('user_bsc_wallet');
  });
});

describe('normalizeConvertOrderResponse', () => {
  test('idempotentReplay passthrough', () => {
    const o = normalizeConvertOrderResponse({
      ok: true,
      orderId: 5,
      status: 'pending',
      idempotentReplay: true,
      message: 'Conversion order already exists (idempotent).',
    });
    expect(o.idempotentReplay).toBe(true);
    expect(o.message).toContain('idempotent');
  });

  test('usdtExecution passthrough', () => {
    const o = normalizeConvertOrderResponse({
      ok: true,
      orderId: 9,
      usdtExecution: { notUserVault: true, chain: 'bsc' },
    });
    expect(o.usdtExecution?.notUserVault).toBe(true);
  });
});
