jest.mock('../../utils/customTokenManager', () => ({
  getCombinedTokens: (registry) => Object.values(registry),
  getCustomTokens: () => ({})
}));

describe('tokenRegistry OTA baseline', () => {
  test('contains address metadata for every production OTA tracked token', () => {
    const { getTokenAddress } = require('../tokenRegistry');
    const baseline = ['BTC', 'ETH', 'LINK', 'XRP', 'ADA', 'AVAX', 'SOL', 'DOGE', 'USDT'];

    for (const symbol of baseline) {
      expect(getTokenAddress(symbol)).toMatch(/^0x[a-fA-F0-9]{40}$/);
    }
  });
});
