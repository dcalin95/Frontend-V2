/**
 * Validări pure add/remove collateral spot (fără wallet).
 * Contract: addCollateral — amount > 0; removeCollateral — amount > 0 && amount < collateralAmount (strict).
 */
import { ethers } from 'ethers';

/**
 * @param {string} amountHuman
 * @param {number} decimals
 * @param {ethers.BigNumber | string} vaultBalanceWei
 * @returns {{ ok: boolean, error?: string, amountWei?: ethers.BigNumber }}
 */
export function validateSpotAddCollateral(amountHuman, decimals, vaultBalanceWei) {
  const t = (amountHuman || '').trim();
  if (!t || Number.isNaN(Number(t)) || Number(t) <= 0) {
    return { ok: false, error: 'Enter a valid amount greater than zero.' };
  }
  let amountWei;
  try {
    amountWei = ethers.utils.parseUnits(t, decimals);
  } catch {
    return { ok: false, error: 'Invalid amount format.' };
  }
  const vaultBn = ethers.BigNumber.from(vaultBalanceWei || '0');
  if (amountWei.gt(vaultBn)) {
    return { ok: false, error: 'Amount exceeds vault balance for this token.' };
  }
  return { ok: true, amountWei };
}

/**
 * @param {string} amountHuman
 * @param {number} decimals
 * @param {ethers.BigNumber | string} collateralWei locked in position
 */
export function validateSpotRemoveCollateral(amountHuman, decimals, collateralWei) {
  const t = (amountHuman || '').trim();
  if (!t || Number.isNaN(Number(t)) || Number(t) <= 0) {
    return { ok: false, error: 'Enter a valid amount greater than zero.' };
  }
  let amountWei;
  try {
    amountWei = ethers.utils.parseUnits(t, decimals);
  } catch {
    return { ok: false, error: 'Invalid amount format.' };
  }
  const collBn = ethers.BigNumber.from(collateralWei || '0');
  if (collBn.lte(1)) {
    return {
      ok: false,
      error: 'Collateral too small to remove (contract needs amount strictly below full collateral). Close position instead.',
    };
  }
  if (amountWei.gte(collBn)) {
    return {
      ok: false,
      error: 'Remove amount must be less than total collateral (use Close to exit fully).',
    };
  }
  return { ok: true, amountWei };
}
