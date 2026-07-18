jest.mock('../../utils/customTokenManager', () => ({
  getCombinedTokens: (registry) => Object.values(registry),
  getCustomTokens: () => ({})
}));

describe('tokenRegistry OTA baseline', () => {
  test('contains address metadata for every production OTA tracked token', () => {
    const { ethers } = require('ethers');
    const { getTokenAddress } = require('../tokenRegistry');
    const baseline = ['BTC', 'ETH', 'LINK', 'XRP', 'ADA', 'AVAX', 'SOL', 'DOGE', 'USDT'];

    for (const symbol of baseline) {
      const address = getTokenAddress(symbol);
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(() => ethers.utils.getAddress(address)).not.toThrow();
    }
  });

  test('keeps AVAX on the canonical Binance-Peg Avalanche BSC contract', () => {
    const { ethers } = require('ethers');
    const { getTokenAddress } = require('../tokenRegistry');
    const address = getTokenAddress('AVAX');

    expect(address).toBe('0x1CE0c2827e2eF14D5C4f29a091d735A204794041');
    expect(ethers.utils.getAddress(address)).toBe(address);
  });
});
