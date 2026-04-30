import {
  mapExecutionTradeToDashboardActivity,
  mapExecutionTradesToDashboardActivities,
  tradeAmountFieldToHuman,
  MAX_DASHBOARD_ACTIVITY_USD,
  executionPriceMatchesRawAmountRatio,
  pickStableLegUsdFromTrade,
  DASHBOARD_AMOUNT_UNAVAILABLE,
  DASHBOARD_BADGE_QUOTE_MISSING,
  shouldOmitExecutionRowFromLedger,
} from '../dashboardActivityMap';

describe('mapExecutionTradeToDashboardActivity', () => {
  it('normalizes USDT amount from integer string wei (18 decimals)', () => {
    const wei = '5000000000000000000'; // 5 USDT
    const row = mapExecutionTradeToDashboardActivity({
      id: '1',
      tokenOut: 'USDT',
      amountOut: wei,
      price: 1,
      status: 'completed',
      createdAt: Date.now(),
    });
    expect(row.amountLabel).toMatch(/^5[\s.,]?/);
    expect(row.amountLabel).toContain('USDT');
    expect(row.valueUsd).toBe(5);
    expect(row.activitySource).toBe('execution');
  });

  it('uses explicit valueUsd when present', () => {
    const row = mapExecutionTradeToDashboardActivity({
      id: '2',
      tokenOut: 'XRP',
      amountOut: '1000000000000000000',
      valueUsd: 42.5,
      price: 0.5,
      status: 'completed',
      createdAt: Date.now(),
    });
    expect(row.valueUsd).toBe(42.5);
  });

  it('does not multiply raw wei by price when explicit USD missing — uses normalized amount * price', () => {
    const row = mapExecutionTradeToDashboardActivity({
      id: '3',
      tokenOut: 'XRP',
      amountOut: '1000000000000000000',
      price: 2,
      status: 'completed',
      createdAt: Date.now(),
    });
    const human = 1000000000000000000 / 1e18;
    expect(row.valueUsd).toBeCloseTo(human * 2, 5);
  });

  it('uses USDT leg for USD when backend price is raw amountOut/amountIn (not $/unit)', () => {
    const amountIn = '30600000000000000000'; // 30.6 USDT (18 dec)
    const amountOut = '22547200000000000000'; // 22.5472 XRP (18 dec)
    const rawPrice = parseFloat(amountOut) / parseFloat(amountIn);
    expect(executionPriceMatchesRawAmountRatio({ amountIn, amountOut, price: rawPrice }, rawPrice)).toBe(true);
    const row = mapExecutionTradeToDashboardActivity({
      id: 'swap-xrp',
      tokenIn: 'USDT',
      tokenOut: 'XRP',
      amountIn,
      amountOut,
      price: rawPrice,
      status: 'completed',
      createdAt: Date.now(),
    });
    expect(row.valueUsd).toBeCloseTo(30.6, 5);
    expect(row.amountLabel).toMatch(/XRP/);
  });

  it('USDT leg yields ~1:1 USD, not bogus ratio × displayed amount', () => {
    const amountIn = '22547000000000000000'; // 22.547 XRP in (18 dec)
    const amountOut = '4796500000000000000'; // 4.7965 USDT out (18 dec)
    const badPrice = parseFloat(amountOut) / parseFloat(amountIn);
    const row = mapExecutionTradeToDashboardActivity({
      id: 'usdt-leg',
      tokenIn: 'XRP',
      tokenOut: 'USDT',
      amountIn,
      amountOut,
      price: badPrice,
      status: 'completed',
      createdAt: Date.now(),
    });
    expect(pickStableLegUsdFromTrade({ tokenIn: 'XRP', tokenOut: 'USDT', amountIn, amountOut })).toBeCloseTo(4.7965, 3);
    expect(row.valueUsd).toBeCloseTo(4.7965, 3);
    expect(row.amountLabel).toMatch(/USDT/);
  });

  it('keeps row with value em dash when no trustworthy USD (non-stable swap ratio only)', () => {
    const amountIn = '1000000000000000000';
    const amountOut = '2000000000000000000';
    const ratio = parseFloat(amountOut) / parseFloat(amountIn);
    const row = mapExecutionTradeToDashboardActivity({
      id: 'no-stable',
      tokenIn: 'WBNB',
      tokenOut: 'CAKE',
      amountIn,
      amountOut,
      price: ratio,
      status: 'completed',
      createdAt: Date.now(),
    });
    expect(row.valueUsd).toBeNull();
  });

  it('rejects absurd explicit USD over cap and does not invent value without amounts', () => {
    const row = mapExecutionTradeToDashboardActivity({
      id: '4',
      tokenOut: 'USDT',
      valueUsd: MAX_DASHBOARD_ACTIVITY_USD * 10,
      price: 1,
      status: 'completed',
      createdAt: Date.now(),
    });
    expect(row.valueUsd).toBeNull();
    expect(row.amountLabel).toBe(DASHBOARD_AMOUNT_UNAVAILABLE);
    expect(shouldOmitExecutionRowFromLedger(row)).toBe(true);
  });

  it('returns Amount unavailable when amount cannot be parsed safely', () => {
    const row = mapExecutionTradeToDashboardActivity({
      id: '5',
      tokenOut: 'USDT',
      amountOut: 'not-a-number',
      price: 1,
      status: 'completed',
      createdAt: Date.now(),
    });
    expect(row.amountLabel).toBe(DASHBOARD_AMOUNT_UNAVAILABLE);
    expect(shouldOmitExecutionRowFromLedger(row)).toBe(true);
  });

  it('XRP with parseable amount but no trustworthy USD shows quote-leg badge, not fake value', () => {
    const row = mapExecutionTradeToDashboardActivity({
      id: 'xrp-no-usd',
      tokenIn: 'BNB',
      tokenOut: 'XRP',
      amountIn: '1000000000000000000',
      amountOut: '22547200000000000000',
      price: parseFloat('22547200000000000000') / parseFloat('1000000000000000000'),
      status: 'completed',
      createdAt: Date.now(),
    });
    expect(row.valueUsd).toBeNull();
    expect(row.valueStatus).toBe('unavailable');
    expect(row.amountStatus).toBe('ok');
    expect(row.dataBadge).toBe(DASHBOARD_BADGE_QUOTE_MISSING);
  });
});

describe('tradeAmountFieldToHuman', () => {
  it('parses full integer wei string without float precision loss for large values', () => {
    const s = '1234567890123456789';
    const h = tradeAmountFieldToHuman(s, 'USDT');
    expect(h).toBeCloseTo(parseFloat('1.234567890123456789'), 12);
  });
});

describe('mapExecutionTradesToDashboardActivities', () => {
  it('maps array', () => {
    const rows = mapExecutionTradesToDashboardActivities([
      {
        id: 'a',
        tokenOut: 'USDT',
        amountOut: '3000000000000000000',
        price: 1,
        status: 'done',
        createdAt: 1,
      },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].valueUsd).toBe(3);
  });

  it('filters out zero BNB rows with no USD as noise', () => {
    const row = mapExecutionTradeToDashboardActivity({
      id: 'zero-bnb',
      tokenOut: 'BNB',
      amountOut: '0',
      status: 'completed',
      createdAt: Date.now(),
    });
    expect(row.amountLabel).toMatch(/^0 BNB$/);
    expect(shouldOmitExecutionRowFromLedger(row)).toBe(true);
    const rows = mapExecutionTradesToDashboardActivities([
      {
        id: 'zero-bnb',
        tokenOut: 'BNB',
        amountOut: '0',
        status: 'completed',
        createdAt: Date.now(),
      },
    ]);
    expect(rows).toHaveLength(0);
  });
});
