/**
 * Pure helpers for leverage CFD: bytes32 assetId <-> UI index (vezi `CFD_SYMBOLS`), parse CFDPosition.
 * Used by useLeverageTrading; testable without wallet/contract deps.
 */
import { ethers } from 'ethers';
import { CFD_ASSETS } from '../constants/leverageConstants';

/** Contract: keccak(symbol) în fluxul live; aici decode pentru valori uint-like în teste legacy. */
export function assetIdBytes32ToIndex(assetId) {
  if (assetId == null) return 0;
  if (typeof assetId === 'number' && !Number.isNaN(assetId)) return assetId;
  try {
    const bn = ethers.BigNumber.from(assetId);
    const n = bn.toNumber();
    return Number.isSafeInteger(n) && n >= 0 && n <= 255 ? n : 0;
  } catch {
    return 0;
  }
}

/** Encode UI asset index la bytes32 uint-padded (folosit în teste; live = keccak din `CFD_SYMBOLS`). */
export function assetIndexToBytes32(assetIndex) {
  return ethers.utils.hexZeroPad(ethers.utils.hexlify(Number(assetIndex)), 32);
}

/**
 * LeverageTradingV2: `getCFDPosition` include takeProfitPrice / stopLossPrice; există `openCFDPositionWithTPSL`, `triggerCFDCloseIfTPSL`.
 */
export const CFD_TP_SL_ONCHAIN_SUPPORTED = true;

/** Spot leverage position tuple (getPosition) — 15 fields. */
export function toSpotPositionObj(raw) {
  if (!raw) return null;
  if (typeof raw.positionId !== 'undefined' && raw.positionId != null) {
    return raw;
  }
  if (Array.isArray(raw)) {
    if (raw.length < 15) return null;
    return {
      positionId: raw[0],
      user: raw[1],
      collateralToken: raw[2],
      borrowedToken: raw[3],
      collateralAmount: raw[4],
      borrowedAmount: raw[5],
      interestAccrued: raw[6],
      leverageRatio: raw[7],
      entryPrice: raw[8],
      liquidationPrice: raw[9],
      interestRate: raw[10],
      openedAt: raw[11],
      lastInterestUpdate: raw[12],
      closedAt: raw[13],
      isActive: raw[14],
    };
  }
  return raw;
}

/** Parsed spot position for UI — same shape as previous hook-local parsePosition. */
export function parseSpotPosition(raw) {
  const r = toSpotPositionObj(raw);
  if (!r || (r.positionId !== 0 && !r.positionId)) return null;
  return {
    positionId: r.positionId?.toString?.() ?? String(r.positionId),
    user: r.user,
    collateralToken: r.collateralToken,
    borrowedToken: r.borrowedToken,
    collateralAmount: (r.collateralAmount?.toString?.() ?? r.collateralAmount)?.toString?.() ?? '0',
    borrowedAmount: (r.borrowedAmount?.toString?.() ?? r.borrowedAmount)?.toString?.() ?? '0',
    interestAccrued: (r.interestAccrued?.toString?.() ?? r.interestAccrued)?.toString?.() ?? '0',
    leverageRatio: (r.leverageRatio?.toString?.() ?? r.leverageRatio)?.toString?.() ?? '0',
    entryPrice: (r.entryPrice?.toString?.() ?? r.entryPrice)?.toString?.() ?? '0',
    liquidationPrice: (r.liquidationPrice?.toString?.() ?? r.liquidationPrice)?.toString?.() ?? '0',
    interestRate: (r.interestRate?.toString?.() ?? r.interestRate)?.toString?.() ?? '0',
    openedAt: (r.openedAt?.toString?.() ?? r.openedAt)?.toString?.() ?? '0',
    lastInterestUpdate: (r.lastInterestUpdate?.toString?.() ?? r.lastInterestUpdate)?.toString?.() ?? '0',
    closedAt: (r.closedAt?.toString?.() ?? r.closedAt)?.toString?.() ?? '0',
    isActive: !!r.isActive,
  };
}

/**
 * Normalize struct tuple from ethers. LeverageTradingV2: 12 câmpuri (leverageBps, isLong la 5–6, TP/SL la 10–11).
 * Layout vechi (ABI greșit): isLong la index 8, closedAt la 10.
 */
export function toCFDPositionObj(raw) {
  if (!raw) return null;
  if (typeof raw.positionId !== 'undefined' && raw.marginAmount !== undefined && raw.assetId !== undefined) {
    return raw;
  }
  if (!Array.isArray(raw)) return raw;
  if (raw.length < 10) return null;
  const v2Shape = typeof raw[6] === 'boolean';
  if (v2Shape && raw.length >= 12) {
    return {
      positionId: raw[0],
      user: raw[1],
      assetId: raw[2],
      settlementToken: raw[3],
      marginAmount: raw[4],
      leverageBps: raw[5],
      isLong: raw[6],
      entryPrice: raw[7],
      openedAt: raw[8],
      isActive: raw[9],
      takeProfitPrice: raw[10],
      stopLossPrice: raw[11],
    };
  }
  if (raw.length >= 12) {
    return {
      positionId: raw[0],
      user: raw[1],
      assetId: raw[2],
      settlementToken: raw[3],
      marginAmount: raw[4],
      leverageRatio: raw[5],
      entryPrice: raw[6],
      liquidationPrice: raw[7],
      isLong: raw[8],
      openedAt: raw[9],
      closedAt: raw[10],
      isActive: raw[11],
    };
  }
  return raw;
}

/** Parse CFD position – V2: leverageBps, takeProfitPrice/stopLossPrice opționale (wei 1e18). */
export function parseCFDPosition(raw, assetLabel, assetIndex = null) {
  const r = toCFDPositionObj(raw);
  if (!r || r.positionId == null) return null;
  const assetNum =
    assetIndex !== null && assetIndex !== undefined
      ? Number(assetIndex)
      : assetIdBytes32ToIndex(r.assetId ?? r.asset);
  const leverageBpsStr = r.leverageBps?.toString?.() ?? r.leverageRatio?.toString?.() ?? '0';
  const entryWei = r.entryPrice?.toString?.() ?? '0';
  const liqWei = r.liquidationPrice?.toString?.() ?? '0';
  let entryPriceHuman = null;
  let liquidationPriceHuman = null;
  let takeProfitHuman = undefined;
  let stopLossHuman = undefined;
  try {
    const e = ethers.utils.formatUnits(entryWei, 18);
    const n = parseFloat(e);
    if (Number.isFinite(n) && n > 0) entryPriceHuman = n;
  } catch (_) {}
  try {
    const l = ethers.utils.formatUnits(liqWei, 18);
    const n = parseFloat(l);
    if (Number.isFinite(n) && n >= 0) liquidationPriceHuman = n;
  } catch (_) {}
  const tp = r.takeProfitPrice?.toString?.();
  const sl = r.stopLossPrice?.toString?.();
  if (tp && tp !== '0') {
    try {
      const t = parseFloat(ethers.utils.formatUnits(tp, 18));
      if (Number.isFinite(t) && t > 0) takeProfitHuman = t;
    } catch (_) {}
  }
  if (sl && sl !== '0') {
    try {
      const s = parseFloat(ethers.utils.formatUnits(sl, 18));
      if (Number.isFinite(s) && s > 0) stopLossHuman = s;
    } catch (_) {}
  }
  return {
    positionId: r.positionId?.toString(),
    user: r.user,
    asset: assetNum,
    assetLabel: assetLabel ?? CFD_ASSETS[assetNum]?.label ?? `Activ ${assetNum}`,
    settlementToken: r.settlementToken,
    marginAmount: r.marginAmount?.toString(),
    leverageBps: leverageBpsStr,
    leverageRatio: leverageBpsStr,
    isLong: !!r.isLong,
    entryPrice: entryWei,
    liquidationPrice: liqWei,
    entryPriceHuman,
    liquidationPriceHuman,
    openedAt: r.openedAt?.toString(),
    isActive: r?.isActive !== false,
    takeProfitHuman,
    stopLossHuman,
  };
}
