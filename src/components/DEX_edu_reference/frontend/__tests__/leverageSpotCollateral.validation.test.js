import { ethers } from 'ethers';
import { validateSpotAddCollateral, validateSpotRemoveCollateral } from '../utils/leverageSpotCollateral';

describe('validateSpotAddCollateral', () => {
  test('rejects empty amount', () => {
    const r = validateSpotAddCollateral('', 18, '1000000000000000000');
    expect(r.ok).toBe(false);
  });

  test('rejects over vault', () => {
    const r = validateSpotAddCollateral('10', 18, ethers.utils.parseUnits('1', 18).toString());
    expect(r.ok).toBe(false);
  });

  test('accepts valid', () => {
    const r = validateSpotAddCollateral('1', 18, ethers.utils.parseUnits('5', 18).toString());
    expect(r.ok).toBe(true);
    expect(r.amountWei?.toString()).toBe(ethers.utils.parseUnits('1', 18).toString());
  });
});

describe('validateSpotRemoveCollateral', () => {
  test('rejects amount gte collateral', () => {
    const coll = ethers.utils.parseUnits('2', 18);
    const r = validateSpotRemoveCollateral('2', 18, coll.toString());
    expect(r.ok).toBe(false);
  });

  test('accepts strictly less than collateral', () => {
    const coll = ethers.utils.parseUnits('2', 18);
    const r = validateSpotRemoveCollateral('1', 18, coll.toString());
    expect(r.ok).toBe(true);
  });
});
