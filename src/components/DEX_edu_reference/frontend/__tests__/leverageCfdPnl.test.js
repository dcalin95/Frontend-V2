import { ethers } from 'ethers';
import { computeCfdPositionPnlAmount, sumCfdUnrealizedPnlUsdt } from '../utils/leverageCfdPnl';

const BPS = 10000;

describe('leverageCfdPnl', () => {
  const getTokenDecimals = () => 18;

  test('computeCfdPositionPnlAmount long matches margin * lev * price change', () => {
    const marginWei = ethers.utils.parseEther('100').toString();
    const p = {
      isLong: true,
      settlementToken: '0x1',
      marginAmount: marginWei,
      entryPriceHuman: 100,
      leverageBps: 50000,
    };
    const pnl = computeCfdPositionPnlAmount(p, 110, { getTokenDecimals, BPS_DENOMINATOR: BPS });
    expect(pnl).toBeCloseTo(50, 5);
  });

  test('sumCfdUnrealizedPnlUsdt skips positions without feed', () => {
    const positions = [
      {
        asset: 7,
        isLong: true,
        settlementToken: '0x1',
        marginAmount: ethers.utils.parseEther('100').toString(),
        entryPriceHuman: 100,
        leverageBps: 50000,
      },
      {
        asset: 21,
        isLong: true,
        settlementToken: '0x1',
        marginAmount: ethers.utils.parseEther('50').toString(),
        entryPriceHuman: 200,
        leverageBps: 50000,
      },
    ];
    const prices = { 7: 110 };
    const r = sumCfdUnrealizedPnlUsdt(positions, prices, { getTokenDecimals, BPS_DENOMINATOR: BPS });
    expect(r.withFeed).toBe(1);
    expect(r.withoutFeed).toBe(1);
    expect(r.total).toBeCloseTo(50, 5);
  });
});
