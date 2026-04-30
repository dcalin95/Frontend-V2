const makeChain = (id, name) => ({ id, name, nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, rpcUrls: {} });

module.exports = {
  mainnet: makeChain(1, 'Ethereum'),
  bsc: makeChain(56, 'BNB Smart Chain'),
  polygon: makeChain(137, 'Polygon'),
  arbitrum: makeChain(42161, 'Arbitrum'),
  optimism: makeChain(10, 'Optimism'),
  base: makeChain(8453, 'Base'),
  avalanche: makeChain(43114, 'Avalanche'),
};
