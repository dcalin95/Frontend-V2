/**
 * Net edge in basis points for SEI micro-profit gating.
 * executionQuote / fallbackPrice must NOT be mixed here — caller passes gross bps from CEX vs pool only.
 *
 * edgeNetBps = expectedGrossBps - dexFeeBps - slippageGuardBps - gasCostBps - staleDataPenaltyBps
 * SEI micro-profit treats stale bundle as hard block upstream; staleDataPenaltyBps stays for tests/other callers.
 */

/**
 * @param {object} o
 * @param {number} o.expectedGrossBps - unsigned gross opportunity in bps (e.g. |discrepancyPct| * 100)
 * @param {number} [o.dexFeeBps] - DEX fee both legs conservative default
 * @param {number} [o.slippageGuardBps]
 * @param {number} [o.gasCostBps] - gas USD / notional USD * 10000
 * @param {number} [o.staleDataPenaltyBps]
 * @returns {{ edgeNetBps: number, breakdown: object }}
 */
export function computeEdgeNetBps({
  expectedGrossBps,
  dexFeeBps = 30,
  slippageGuardBps = 50,
  gasCostBps = 0,
  staleDataPenaltyBps = 0,
}) {
  const gross = Number(expectedGrossBps);
  const g = Number.isFinite(gross) ? Math.max(0, gross) : 0;
  const d = Number(dexFeeBps) || 0;
  const s = Number(slippageGuardBps) || 0;
  const gas = Number(gasCostBps) || 0;
  const stale = Number(staleDataPenaltyBps) || 0;
  const edgeNetBps = g - d - s - gas - stale;
  return {
    edgeNetBps,
    breakdown: {
      expectedGrossBps: g,
      dexFeeBps: d,
      slippageGuardBps: s,
      gasCostBps: gas,
      staleDataPenaltyBps: stale,
    },
  };
}
