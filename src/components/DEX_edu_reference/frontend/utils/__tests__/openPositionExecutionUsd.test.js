import { computeExecutionPositionUsd, STABLE_QUOTES } from '../openPositionExecutionUsd';

describe('computeExecutionPositionUsd', () => {
  it('BNB quote: cost in BNB × bnbUsd = entry USD; token USD × amount = current', () => {
    const amount = 22.738844;
    const costBnb = 0.0522;
    const bnbUsd = 670;
    const xrpUsd = 1.55;
    const r = computeExecutionPositionUsd({
      quoteToken: 'BNB',
      amountHuman: amount,
      costQuoteHuman: costBnb,
      entryPerTokenQuote: costBnb / amount,
      currentPriceStablePerToken: null,
      tokenUsdPerToken: xrpUsd,
      bnbUsd,
      ethUsd: null,
    });
    expect(r.entryValueUsd).toBeCloseTo(costBnb * bnbUsd, 2);
    expect(r.currentValueUsd).toBeCloseTo(amount * xrpUsd, 2);
    expect(r.pnlUsd).toBeCloseTo(amount * xrpUsd - costBnb * bnbUsd, 2);
  });

  it('USDT quote: entry × amount as before', () => {
    const r = computeExecutionPositionUsd({
      quoteToken: 'USDT',
      amountHuman: 10,
      costQuoteHuman: 50,
      entryPerTokenQuote: 5,
      currentPriceStablePerToken: 5.2,
      tokenUsdPerToken: 5.2,
      bnbUsd: 600,
      ethUsd: 3000,
    });
    expect(r.entryValueUsd).toBe(50);
    expect(r.currentValueUsd).toBe(52);
    expect(r.pnlUsd).toBeCloseTo(2, 5);
  });

  it('STABLE_QUOTES includes USDC', () => {
    expect(STABLE_QUOTES.has('USDC')).toBe(true);
  });
});
