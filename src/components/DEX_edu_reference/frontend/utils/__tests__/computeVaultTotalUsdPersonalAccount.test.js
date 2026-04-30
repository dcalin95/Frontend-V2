import { ethers } from 'ethers';
import { computeVaultTotalUsdPersonalAccount } from '../computeVaultTotalUsdPersonalAccount';

describe('computeVaultTotalUsdPersonalAccount', () => {
  const usdtAddr = '0x55d398326f99059ff775485246999027b3197955';

  it('sums stables at 1:1 and altcoins from prices; excludes BITS from total', () => {
    const tokenOptions = [
      { symbol: 'USDT', address: usdtAddr, decimals: 18 },
      { symbol: 'BITS', address: '0xbits', decimals: 18 },
    ];
    const balances = {
      [usdtAddr.toLowerCase()]: ethers.utils.parseUnits('10', 18).toString(),
      '0xbits': ethers.utils.parseUnits('1000', 18).toString(),
    };
    const vaultTokenPrices = { BITS: 0.05 };
    const { totalUsd } = computeVaultTotalUsdPersonalAccount({
      tokenOptions,
      balances,
      vaultTokenPrices,
    });
    expect(totalUsd).toBe(10);
  });

  it('returns 0 when no tokens', () => {
    const { totalUsd } = computeVaultTotalUsdPersonalAccount({
      tokenOptions: [],
      balances: {},
      vaultTokenPrices: {},
    });
    expect(totalUsd).toBe(0);
  });
});
