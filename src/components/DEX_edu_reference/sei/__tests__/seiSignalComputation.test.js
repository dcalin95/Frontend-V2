/**
 * computeSignalFromMarketDiscrepancy — stale hard block, edge path, blockReason.
 */

import { computeSignalFromMarketDiscrepancy } from '../services/otaSeiMicroProfitService';
import { SEI_MARKET_DATA_STALE_MS } from '../constants/otaSeiPageDefaults';

const cfg = { maxAmountPerTrade: '10' };
const gas = 0.1;

function baseDiscrepancy(overrides = {}) {
  return {
    hasOpportunity: true,
    side: 'sell',
    reason: 'SEI is 5.00% MORE EXPENSIVE on pool → SELL SEI (bot profits)',
    discrepancyPct: -5,
    binanceSeiUsd: 0.5,
    poolSeiUsd: 0.475,
    fetchedAt: 1_000_000,
    marketSignalBasis: 'auxiliary_sei_atom_pool',
    ...overrides,
  };
}

describe('computeSignalFromMarketDiscrepancy', () => {
  it('hard-blocks stale bundle with blockReason stale_quote', () => {
    const t0 = 5_000_000;
    const d = baseDiscrepancy({ fetchedAt: t0 });
    const out = computeSignalFromMarketDiscrepancy(d, cfg, gas, t0 + SEI_MARKET_DATA_STALE_MS + 1000);
    expect(out.trigger).toBe(false);
    expect(out.isTradable).toBe(false);
    expect(out.isStale).toBe(true);
    expect(out.blockReason).toBe('stale_quote');
    expect(out.edgeNetBps).toBeNull();
    expect(out.reason).toMatch(/Stale market bundle/i);
  });

  it('fresh bundle with opportunity computes edge and may trigger', () => {
    const t0 = 8_000_000;
    const d = baseDiscrepancy({ fetchedAt: t0 });
    const out = computeSignalFromMarketDiscrepancy(d, cfg, gas, t0 + 1000);
    expect(out.isStale).toBe(false);
    expect(out.blockReason).toBeNull();
    expect(out.trigger).toBe(true);
    expect(out.isTradable).toBe(true);
    expect(out.edgeNetBps).not.toBeNull();
    expect(out.edgeBreakdown.staleDataPenaltyBps).toBe(0);
  });

  it('insufficient edge yields blockReason insufficient_edge', () => {
    const t0 = 9_000_000;
    const d = baseDiscrepancy({
      fetchedAt: t0,
      discrepancyPct: -2.1,
      hasOpportunity: true,
      side: 'sell',
      reason: 'edge case',
    });
    const out = computeSignalFromMarketDiscrepancy(d, cfg, gas, t0 + 500);
    expect(out.trigger).toBe(false);
    expect(out.isTradable).toBe(false);
    expect(out.blockReason).toBe('insufficient_edge');
  });

  it('no opportunity sets blockReason no_opportunity', () => {
    const t0 = 10_000_000;
    const d = baseDiscrepancy({
      fetchedAt: t0,
      hasOpportunity: false,
      side: null,
      reason: 'below threshold',
    });
    const out = computeSignalFromMarketDiscrepancy(d, cfg, gas, t0 + 100);
    expect(out.blockReason).toBe('no_opportunity');
    expect(out.trigger).toBe(false);
  });

  it('price feed error sets blockReason price_feed_error', () => {
    const out = computeSignalFromMarketDiscrepancy(
      baseDiscrepancy({ discrepancyPct: 50, hasOpportunity: true }),
      cfg,
      gas,
      11_000_000
    );
    expect(out.blockReason).toBe('price_feed_error');
    expect(out.trigger).toBe(false);
  });
});
