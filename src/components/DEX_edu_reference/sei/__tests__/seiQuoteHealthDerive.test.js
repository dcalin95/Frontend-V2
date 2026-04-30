import { deriveSeiQuoteHealthState } from '../utils/seiQuoteHealthDerive';
import { SEI_MARKET_DATA_STALE_MS } from '../constants/otaSeiPageDefaults';

describe('deriveSeiQuoteHealthState', () => {
  const now = 1_000_000;

  it('exec fresh when hasExecutionQuote and recent timestamp', () => {
    const s = deriveSeiQuoteHealthState({
      hasExecutionQuote: true,
      usedFallbackPrice: false,
      lastExecutionQuoteAt: now - 1000,
      now,
    });
    expect(s.labels).toContain('Exec fresh');
    expect(s.executionReady).toBe(true);
    expect(s.degraded).toBe(false);
  });

  it('exec stale when quote older than threshold', () => {
    const s = deriveSeiQuoteHealthState({
      hasExecutionQuote: true,
      usedFallbackPrice: false,
      lastExecutionQuoteAt: now - SEI_MARKET_DATA_STALE_MS - 1,
      now,
    });
    expect(s.labels).toContain('Exec stale');
    expect(s.executionReady).toBe(false);
  });

  it('fallback without exec = degraded, not execution ready', () => {
    const s = deriveSeiQuoteHealthState({
      hasExecutionQuote: false,
      usedFallbackPrice: true,
      lastExecutionQuoteAt: null,
      now,
    });
    expect(s.labels).toEqual(expect.arrayContaining(['Fallback', 'Degraded']));
    expect(s.executionReady).toBe(false);
  });

  it('ref only when no exec and no fallback', () => {
    const s = deriveSeiQuoteHealthState({
      hasExecutionQuote: false,
      usedFallbackPrice: false,
      lastExecutionQuoteAt: null,
      now,
    });
    expect(s.labels).toContain('Ref only');
    expect(s.executionReady).toBe(false);
  });
});
