/**
 * PnL nerealizat CFD — aceeași formulă ca în LeveragePositionsTable (margine × lev × Δ% preț).
 */
import { ethers } from 'ethers';

/**
 * @param {object} p – poziție CFD (demo sau live)
 * @param {number|null|undefined} currentPrice – preț mark din feed
 * @param {{ getTokenDecimals?: (addr: string) => number, BPS_DENOMINATOR: number }} deps
 * @returns {number|null}
 */
export function computeCfdPositionPnlAmount(p, currentPrice, { getTokenDecimals, BPS_DENOMINATOR }) {
  if (currentPrice == null || !Number.isFinite(Number(currentPrice))) return null;
  const marginDec = getTokenDecimals?.(p.settlementToken) ?? 18;
  const entryHuman =
    p.entryPriceHuman != null
      ? Number(p.entryPriceHuman)
      : parseFloat(ethers.utils.formatUnits(p.entryPrice || '0', 18));
  const marginNum = parseFloat(ethers.utils.formatUnits(p.marginAmount || '0', marginDec));
  if (!Number.isFinite(entryHuman) || entryHuman <= 0 || !Number.isFinite(marginNum)) return null;
  const pnlPct = p.isLong
    ? (currentPrice - entryHuman) / entryHuman
    : (entryHuman - currentPrice) / entryHuman;
  const leverageMultiplier = Number(p.leverageRatio ?? p.leverageBps ?? BPS_DENOMINATOR) / BPS_DENOMINATOR;
  const pnlAmount = marginNum * leverageMultiplier * pnlPct;
  return Number.isFinite(pnlAmount) ? pnlAmount : null;
}

/**
 * @returns {{ total: number|null, withFeed: number, withoutFeed: number }}
 */
export function sumCfdUnrealizedPnlUsdt(cfdPositions, cfdPricesByAsset, deps) {
  if (!Array.isArray(cfdPositions) || cfdPositions.length === 0) {
    return { total: null, withFeed: 0, withoutFeed: 0 };
  }
  let sum = 0;
  let withFeed = 0;
  let withoutFeed = 0;
  for (const p of cfdPositions) {
    const price = cfdPricesByAsset[p.asset] != null ? cfdPricesByAsset[p.asset] : null;
    const amt = computeCfdPositionPnlAmount(p, price, deps);
    if (amt != null) {
      sum += amt;
      withFeed += 1;
    } else {
      withoutFeed += 1;
    }
  }
  return {
    total: withFeed > 0 ? sum : null,
    withFeed,
    withoutFeed,
  };
}
