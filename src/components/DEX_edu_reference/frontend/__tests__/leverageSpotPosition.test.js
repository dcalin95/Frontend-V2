/**
 * Spot + CFD position parsing — contract tuple / object edge cases
 */
import { ethers } from 'ethers';
import { parseSpotPosition, toSpotPositionObj, toCFDPositionObj, parseCFDPosition } from '../utils/leverageUtils';

const ADDR_A = '0x1111111111111111111111111111111111111111';
const ADDR_B = '0x2222222222222222222222222222222222222222';

describe('parseSpotPosition / toSpotPositionObj', () => {
  test('returns null for short tuple', () => {
    expect(toSpotPositionObj([1, 2, 3])).toBeNull();
    expect(parseSpotPosition([1, 2, 3])).toBeNull();
  });

  test('parses 15-field tuple', () => {
    const tuple = [
      ethers.BigNumber.from(7),
      ADDR_A,
      ADDR_A,
      ADDR_B,
      '1000',
      '2000',
      '0',
      '50000',
      '0',
      '0',
      '0',
      '1',
      '2',
      '0',
      true,
    ];
    const p = parseSpotPosition(tuple);
    expect(p).not.toBeNull();
    expect(p.positionId).toBe('7');
    expect(p.isActive).toBe(true);
    expect(p.leverageRatio).toBe('50000');
  });

  test('parses object-shaped position', () => {
    const raw = {
      positionId: '3',
      user: ADDR_A,
      collateralToken: ADDR_A,
      borrowedToken: ADDR_B,
      collateralAmount: '1000',
      borrowedAmount: '0',
      interestAccrued: '0',
      leverageRatio: '30000',
      entryPrice: '0',
      liquidationPrice: '0',
      interestRate: '0',
      openedAt: '0',
      lastInterestUpdate: '0',
      closedAt: '0',
      isActive: true,
    };
    const p = parseSpotPosition(raw);
    expect(p.positionId).toBe('3');
    expect(p.liquidationPrice).toBe('0');
  });
});

describe('toCFDPositionObj malformed', () => {
  test('returns null for short CFD tuple', () => {
    expect(toCFDPositionObj([1, 2, 3])).toBeNull();
    expect(parseCFDPosition([1, 2, 3], 'X', 0)).toBeNull();
  });
});
