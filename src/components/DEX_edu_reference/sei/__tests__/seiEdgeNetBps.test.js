import { computeEdgeNetBps } from '../utils/seiEdgeNetBps';

describe('computeEdgeNetBps', () => {
  it('subtracts fees from gross', () => {
    const { edgeNetBps, breakdown } = computeEdgeNetBps({
      expectedGrossBps: 200,
      dexFeeBps: 30,
      slippageGuardBps: 50,
      gasCostBps: 40,
      staleDataPenaltyBps: 0,
    });
    expect(breakdown.expectedGrossBps).toBe(200);
    expect(edgeNetBps).toBe(200 - 30 - 50 - 40);
  });

  it('optional staleDataPenaltyBps reduces edge (utility; micro-profit uses hard block instead)', () => {
    const { edgeNetBps } = computeEdgeNetBps({
      expectedGrossBps: 500,
      staleDataPenaltyBps: 10000,
    });
    expect(edgeNetBps).toBeLessThan(0);
  });
});
